import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { createApiServer } from '../../apps/api/src/create-api-server.js';
import { createActorContext } from '../../applications/core/actor-context.js';
import { createPostgresCreatorIdentityComposition } from '../../adapters/persistence/postgres/postgres-creator-identity-composition.js';

const capabilityId = 'capability-dance-teaching';
const templateId = 'template-dance-private-lesson';
const operations = { authorization: 'Bearer eng010-test-operations-token' };
const execute = promisify(execFile);

describe.skipIf(!process.env.CATALOG_TEST_DATABASE_URL)(
  'Controlled Catalog with PostgreSQL',
  () => {
    let composition: ReturnType<typeof createPostgresCreatorIdentityComposition>;
    let server: FastifyInstance;
    let creatorNumber = 0;

    beforeAll(async () => {
      composition = createPostgresCreatorIdentityComposition(
        { databaseUrl: process.env.CATALOG_TEST_DATABASE_URL! },
        { localAuthSecret: 'catalog-integration-secret-at-least-32-bytes' },
        'http://localhost:3000',
        { deliver: async () => {} },
        {
          operationsAccessToken: 'eng010-test-operations-token',
          operationsOperatorId: 'eng010-operator',
        },
      );
      server = await createApiServer({
        localAuthService: composition.localAuthService,
        authContextProvider: composition.authContextProvider,
        operationsAuthContextProvider: composition.operationsAuthContextProvider,
        creatorIdentityService: composition.service,
        serviceOfferingService: composition.offeringService,
        customerRequestService: composition.customerRequestService,
        servicePolicyCatalogRepository: composition.servicePolicyCatalogRepository,
        servicePolicyAdminService: composition.servicePolicyAdminService,
        rateLimitMax: 10_000,
      });
    });

    // Test isolation restores only existing seeded data, never an approval for a business request.
    async function restoreSeedState() {
      await composition.database
        .client`update service_policy_releases set status = case when policy_version='v1' then 'published' else 'archived' end`;
      await composition.database
        .client`update service_policy_capabilities set status='active', creator_selectable=true, publish_enabled=true, risk_tier='low' where id=${capabilityId} and policy_version='v1'`;
      await composition.database
        .client`update service_policy_templates set status='active', creator_selectable=true, publish_enabled=true, risk_tier='low' where id=${templateId} and policy_version='v1'`;
    }

    beforeEach(restoreSeedState);
    afterAll(async () => {
      try {
        await restoreSeedState();
      } finally {
        await server.close();
        await composition.database.close();
      }
    });

    async function state() {
      return {
        capabilities: await composition.database
          .client`select * from service_policy_capabilities order by policy_version,id`,
        templates: await composition.database
          .client`select * from service_policy_templates order by policy_version,id`,
        releases: await composition.database
          .client`select * from service_policy_releases order by policy_version`,
        audit: await composition.database.client`select * from service_policy_audits order by id`,
      };
    }

    async function update(kind: 'capabilities' | 'templates', body: Record<string, unknown>) {
      const correlationId = randomUUID();
      const response = await server.inject({
        method: 'PATCH',
        url: `/api/v1/operations/service-policy/${kind}/${kind === 'capabilities' ? capabilityId : templateId}`,
        headers: { ...operations, 'x-correlation-id': correlationId },
        payload: { reason: 'ENG010 existing lifecycle verification', ...body },
      });
      expect(response.statusCode, response.body).toBe(200);
      const audits = await composition.database
        .client`select * from service_policy_audits where correlation_id=${correlationId}`;
      expect(audits).toHaveLength(1);
      expect(audits[0]).toMatchObject({
        actor_id: 'eng010-operator',
        policy_version: 'v1',
        correlation_id: correlationId,
        reason: body.reason ?? 'ENG010 existing lifecycle verification',
        entity_type: kind === 'capabilities' ? 'capability' : 'template',
      });
      expect(Number.isFinite(Date.parse(String(audits[0]?.occurred_at)))).toBe(true);
      expect(audits[0]?.before_state).toBeDefined();
      const changes = Object.fromEntries(Object.entries(body).filter(([key]) => key !== 'reason'));
      expect(audits[0]?.after_state).toMatchObject(changes);
      const workspace = await server.inject({
        method: 'GET',
        url: '/api/v1/operations/service-policy/workspace',
        headers: operations,
      });
      expect(workspace.statusCode).toBe(200);
      const auditApi = await server.inject({
        method: 'GET',
        url: '/api/v1/operations/service-policy/audit',
        headers: operations,
      });
      expect(auditApi.statusCode).toBe(200);
      expect(auditApi.json<unknown[]>()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            actorId: 'eng010-operator',
            correlationId,
            reason: body.reason ?? 'ENG010 existing lifecycle verification',
            policyVersion: 'v1',
            before: audits[0]?.before_state as unknown,
            after: audits[0]?.after_state as unknown,
          }),
        ]),
      );
      return response;
    }

    async function creator(
      selection: { catalogItemId?: string; name: string } = {
        catalogItemId: capabilityId,
        name: 'Dance teaching',
      },
    ) {
      const signup = await server.inject({
        method: 'POST',
        url: '/api/v1/auth/signup',
        remoteAddress: `127.0.0.${++creatorNumber}`,
        payload: {
          email: `${randomUUID()}@example.test`,
          password: 'catalog-private-test-password',
          name: 'Catalog test creator',
        },
      });
      expect(signup.statusCode, signup.body).toBe(201);
      expect(signup.json()).toMatchObject({ setupPending: false });
      const headers = {
        authorization: `Bearer ${signup.json<{ accessToken: string }>().accessToken}`,
      };
      const profile = await server.inject({
        method: 'PATCH',
        url: '/api/v1/creator/identity',
        headers,
        payload: {
          profile: { displayName: 'Dance creator', bio: 'Dance teaching', socialLinks: [] },
        },
      });
      expect(profile.statusCode, profile.body).toBe(200);
      const capability = await server.inject({
        method: 'POST',
        url: '/api/v1/creator/identity/capabilities',
        headers,
        payload: { ...selection, description: 'Existing approved catalog selection' },
      });
      expect(capability.statusCode, capability.body).toBe(201);
      return {
        headers,
        capability: capability.json<{
          capabilityIds: string[];
          capabilities: { catalogItemId?: string; catalogStatus: string }[];
        }>(),
      };
    }

    async function draft(
      owner: Awaited<ReturnType<typeof creator>>,
      overrides: Record<string, unknown> = {},
    ) {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/creator/offerings',
        headers: owner.headers,
        payload: {
          capabilityIds: owner.capability.capabilityIds,
          templateId,
          title: 'Dance lesson',
          description: 'One to one dance teaching',
          availabilityDescription: 'By appointment',
          requestInstructions: 'Send preferred times',
          ...overrides,
        },
      });
      expect(response.statusCode, response.body).toBe(201);
      return response.json<{
        id: string;
        creatorId: string;
        policyStatus: string;
        state: string;
        templateId?: string;
      }>();
    }

    async function publish(owner: Awaited<ReturnType<typeof creator>>, id: string) {
      const correlationId = randomUUID();
      const response = await server.inject({
        method: 'POST',
        url: `/api/v1/creator/offerings/${id}/publish`,
        headers: { ...owner.headers, 'x-correlation-id': correlationId },
      });
      return { response, correlationId };
    }

    async function noPublication(id: string, correlationId: string) {
      expect(
        await composition.database
          .client`select id from product_events where correlation_id=${correlationId}`,
      ).toHaveLength(0);
      expect(
        await composition.database
          .client`select offering_id from distribution_assets where offering_id=${id}`,
      ).toHaveLength(0);
      expect(
        (await composition.database.client`select state from service_offerings where id=${id}`)[0]
          ?.state,
      ).toBe('draft');
    }

    async function loadExistingVersion() {
      // A versioning fixture copies the same existing ten items/templates; no new vertical or approval.
      await composition.database
        .client`insert into service_policy_capabilities select id,slug,vertical,name,description,risk_tier,release_scope,aliases,version,'eng010-v2',status,creator_selectable,publish_enabled,created_at,updated_at from service_policy_capabilities where policy_version='v1' on conflict (id,policy_version) do nothing`;
      await composition.database
        .client`insert into service_policy_templates select id,slug,capability_catalog_item_id,name,description,risk_tier,release_scope,required_fields,version,'eng010-v2',status,creator_selectable,publish_enabled,created_at,updated_at from service_policy_templates where policy_version='v1' on conflict (id,policy_version) do nothing`;
    }

    it('reads the migrated database catalog and publishes an eligible Offering with its canonical event', async () => {
      const owner = await creator();
      const catalog = await server.inject({
        method: 'GET',
        url: '/api/v1/creator/service-catalog',
        headers: owner.headers,
      });
      expect(catalog.statusCode).toBe(200);
      expect(catalog.json<{ capabilities: unknown[] }>().capabilities).toHaveLength(10);
      expect(catalog.json<{ templates: unknown[] }>().templates).toHaveLength(10);
      const offering = await draft(owner);
      expect(offering).toMatchObject({ state: 'draft', policyStatus: 'auto_approved', templateId });
      const { response, correlationId } = await publish(owner, offering.id);
      expect(response.statusCode, response.body).toBe(200);
      expect(
        (
          await composition.database
            .client`select state,policy_status,policy_version from service_offerings where id=${offering.id}`
        )[0],
      ).toMatchObject({ state: 'published', policy_status: 'approved', policy_version: 'v1' });
      expect(
        await composition.database
          .client`select name,actor_id,object_id from product_events where correlation_id=${correlationId}`,
      ).toEqual([
        { name: 'creator_published', actor_id: offering.creatorId, object_id: offering.creatorId },
      ]);
      expect(
        await composition.database
          .client`select offering_id from distribution_assets where offering_id=${offering.id}`,
      ).toHaveLength(1);
    });

    it('denies every protected operation without Operations credentials and leaves PostgreSQL unchanged', async () => {
      const owner = await creator();
      const before = await state();
      const requests = [
        { method: 'GET' as const, url: '/api/v1/operations/service-policy/workspace' },
        { method: 'GET' as const, url: '/api/v1/operations/service-policy/audit' },
        {
          method: 'PATCH' as const,
          url: `/api/v1/operations/service-policy/capabilities/${capabilityId}`,
          payload: { status: 'paused', reason: 'Denied' },
        },
        {
          method: 'PATCH' as const,
          url: `/api/v1/operations/service-policy/templates/${templateId}`,
          payload: { status: 'paused', reason: 'Denied' },
        },
        {
          method: 'POST' as const,
          url: '/api/v1/operations/service-policy/releases',
          payload: { version: 'v1', reason: 'Denied' },
        },
      ];
      for (const request of requests)
        for (const headers of [
          {},
          owner.headers,
          { authorization: 'Bearer invalid-operations-token' },
        ]) {
          const response = await server.inject({ ...request, headers });
          expect(response.statusCode, response.body).toBe(401);
        }
      await expect(
        composition.servicePolicyAdminService.updateCapability(
          capabilityId,
          { status: 'paused', reason: 'Denied' },
          createActorContext({
            actor: { kind: 'creator', creatorId: 'ordinary-creator' },
            correlationId: randomUUID(),
          }),
        ),
      ).rejects.toMatchObject({
        category: 'authorization',
        code: 'service_policy_operations_required',
      });
      expect(await state()).toEqual(before);
    });

    it.each(['draft', 'paused', 'retired'] as const)(
      'blocks new selection and publication for a %s capability without rewriting history',
      async (status) => {
        const owner = await creator();
        const published = await draft(owner);
        expect((await publish(owner, published.id)).response.statusCode).toBe(200);
        const pending = await draft(owner);
        const request = await server.inject({
          method: 'POST',
          url: `/api/v1/public/offerings/${published.id}/requests`,
          payload: {
            contactName: 'Existing customer',
            contactMethod: `${randomUUID()}@example.test`,
            requestMessage: 'Please arrange a lesson',
          },
        });
        expect(request.statusCode, request.body).toBe(201);
        const history = {
          offering: await composition.database
            .client`select * from service_offerings where id=${published.id}`,
          actions: await composition.database
            .client`select * from commerce_actions where offering_id=${published.id}`,
          events: await composition.database
            .client`select * from product_events where object_id=${published.creatorId} order by id`,
        };
        await update('capabilities', { status });
        const beforeSelection = await composition.database
          .client`select id from creator_capabilities order by id`;
        const selected = await server.inject({
          method: 'POST',
          url: '/api/v1/creator/identity/capabilities',
          headers: owner.headers,
          payload: {
            catalogItemId: capabilityId,
            name: 'Unavailable dance type',
            description: 'Must not associate',
          },
        });
        expect(selected.statusCode).toBe(400);
        expect(selected.json()).toMatchObject({
          error: { code: 'capability_catalog_item_invalid' },
        });
        expect(
          await composition.database.client`select id from creator_capabilities order by id`,
        ).toEqual(beforeSelection);
        const denied = await publish(owner, pending.id);
        expect(denied.response.statusCode).toBe(409);
        await noPublication(pending.id, denied.correlationId);
        const publicResult = await server.inject({
          method: 'GET',
          url: `/api/v1/public/offerings/${published.id}`,
        });
        expect(publicResult.statusCode).toBe(422);
        const deniedRequest = await server.inject({
          method: 'POST',
          url: `/api/v1/public/offerings/${published.id}/requests`,
          payload: {
            contactName: 'New customer',
            contactMethod: `${randomUUID()}@example.test`,
            requestMessage: 'Must be denied',
          },
        });
        expect(deniedRequest.statusCode).toBe(422);
        expect({
          offering: await composition.database
            .client`select * from service_offerings where id=${published.id}`,
          actions: await composition.database
            .client`select * from commerce_actions where offering_id=${published.id}`,
          events: await composition.database
            .client`select * from product_events where object_id=${published.creatorId} order by id`,
        }).toEqual(history);
        if (status === 'paused') {
          await update('capabilities', { status: 'active', reason: 'Operations review complete' });
          expect((await publish(owner, pending.id)).response.statusCode).toBe(200);
          expect(
            (
              await server.inject({
                method: 'GET',
                url: `/api/v1/public/offerings/${published.id}`,
              })
            ).statusCode,
          ).toBe(200);
        }
      },
    );

    it.each(['draft', 'paused', 'retired'] as const)(
      'blocks a %s template and persists the independent lifecycle state',
      async (status) => {
        const owner = await creator();
        const offering = await draft(owner);
        const published = await draft(owner);
        expect((await publish(owner, published.id)).response.statusCode).toBe(200);
        const fact = await composition.database
          .client`select * from service_offerings where id=${published.id}`;
        await update('templates', { status });
        const response = await publish(owner, offering.id);
        expect(response.response.statusCode).toBe(409);
        await noPublication(offering.id, response.correlationId);
        expect(
          (
            await composition.database
              .client`select status from service_policy_templates where id=${templateId} and policy_version='v1'`
          )[0]?.status,
        ).toBe(status);
        expect(
          (await server.inject({ method: 'GET', url: `/api/v1/public/offerings/${published.id}` }))
            .statusCode,
        ).toBe(422);
        expect(
          (
            await server.inject({
              method: 'POST',
              url: `/api/v1/public/offerings/${published.id}/requests`,
              payload: {
                contactName: 'Blocked customer',
                contactMethod: `${randomUUID()}@example.test`,
                requestMessage: 'Must be blocked by the template lifecycle',
              },
            })
          ).statusCode,
        ).toBe(422);
        expect(
          await composition.database
            .client`select * from service_offerings where id=${published.id}`,
        ).toEqual(fact);
      },
    );

    it.each(['capabilities', 'templates'] as const)(
      'enforces %s emergency and selection switches through fresh database reads',
      async (kind) => {
        const owner = await creator();
        const offering = await draft(owner);
        for (const field of ['creatorSelectable', 'publishEnabled'] as const) {
          await update(kind, { [field]: false });
          const catalog = await server.inject({
            method: 'GET',
            url: '/api/v1/creator/service-catalog',
            headers: owner.headers,
          });
          const rows = catalog.json<{
            capabilities: { id: string; creatorSelectable?: boolean; publishEnabled?: boolean }[];
            templates: { id: string; creatorSelectable?: boolean; publishEnabled?: boolean }[];
          }>();
          const selected = rows[kind].find(
            (row) => row.id === (kind === 'capabilities' ? capabilityId : templateId),
          );
          expect(selected?.[field]).toBe(false);
          const denied = await publish(owner, offering.id);
          expect(denied.response.statusCode).toBe(409);
          await noPublication(offering.id, denied.correlationId);
          await update(kind, { [field]: true, reason: 'Operations restores the existing switch' });
        }
        expect((await publish(owner, offering.id)).response.statusCode).toBe(200);
      },
    );

    it('rejects invalid lifecycle input, missing reasons and unknown IDs without any persistent mutation', async () => {
      const before = await state();
      for (const payload of [
        { status: 'invalid', reason: 'Bad state' },
        { riskTier: 'invalid', reason: 'Bad risk' },
        { status: 'paused', reason: ' ' },
        { status: 'paused' },
      ]) {
        const result = await server.inject({
          method: 'PATCH',
          url: `/api/v1/operations/service-policy/capabilities/${capabilityId}`,
          headers: operations,
          payload,
        });
        expect(result.statusCode).toBe(400);
      }
      for (const kind of ['capabilities', 'templates']) {
        const missing = await server.inject({
          method: 'PATCH',
          url: `/api/v1/operations/service-policy/${kind}/unknown-record`,
          headers: operations,
          payload: { status: 'paused', reason: 'Unknown record' },
        });
        expect(missing.statusCode).toBe(404);
      }
      expect(await state()).toEqual(before);
    });

    it('blocks a stale capability reference missing from the current catalog instead of approving its surviving template', async () => {
      const owner = await creator();
      const offering = await draft(owner);
      await loadExistingVersion();
      // Fault fixture: remove an existing item only from the disposable copied version.
      await composition.database
        .client`delete from service_policy_capabilities where id=${capabilityId} and policy_version='eng010-v2'`;
      try {
        const version = await server.inject({
          method: 'POST',
          url: '/api/v1/operations/service-policy/releases',
          headers: operations,
          payload: { version: 'eng010-v2', reason: 'Exercise a missing current reference' },
        });
        expect(version.statusCode).toBe(204);
        const denied = await publish(owner, offering.id);
        expect(denied.response.statusCode).toBe(409);
        await noPublication(offering.id, denied.correlationId);
      } finally {
        await loadExistingVersion();
      }
    });

    it('checks required business fields and rechecks prohibited key edits without changing event history', async () => {
      const owner = await creator();
      const incomplete = await draft(owner, { availabilityDescription: undefined });
      const missing = await publish(owner, incomplete.id);
      expect(missing.response.statusCode).toBe(400);
      expect(missing.response.json()).toMatchObject({
        error: { code: 'service_offering_publish_conditions_missing' },
      });
      await noPublication(incomplete.id, missing.correlationId);
      const offering = await draft(owner);
      expect((await publish(owner, offering.id)).response.statusCode).toBe(200);
      const events = await composition.database
        .client`select * from product_events where object_id=${offering.creatorId} order by id`;
      const edited = await server.inject({
        method: 'PATCH',
        url: `/api/v1/creator/offerings/${offering.id}`,
        headers: owner.headers,
        payload: {
          capabilityIds: owner.capability.capabilityIds,
          templateId,
          title: '私人陪伴',
          description: 'One to one dance teaching',
          availabilityDescription: 'By appointment',
          requestInstructions: 'Send preferred times',
        },
      });
      expect(edited.statusCode, edited.body).toBe(200);
      expect(
        (
          await composition.database
            .client`select policy_status from service_offerings where id=${offering.id}`
        )[0]?.policy_status,
      ).toBe('rejected');
      expect(
        (await server.inject({ method: 'GET', url: `/api/v1/public/offerings/${offering.id}` }))
          .statusCode,
      ).toBe(422);
      expect(
        await composition.database
          .client`select * from product_events where object_id=${offering.creatorId} order by id`,
      ).toEqual(events);
    });

    it('preserves custom-request review rejection and creates no event or asset', async () => {
      const owner = await creator({ name: 'Unlisted custom category' });
      const offering = await draft(owner, { templateId: undefined });
      expect(offering.policyStatus).toBe('review_required');
      const rejected = await publish(owner, offering.id);
      expect(rejected.response.statusCode).toBe(409);
      expect(rejected.response.json()).toMatchObject({
        error: { code: 'service_offering_policy_review_required' },
      });
      expect(
        (
          await composition.database
            .client`select state,policy_status from service_offerings where id=${offering.id}`
        )[0],
      ).toMatchObject({ state: 'draft', policy_status: 'review_required' });
      await noPublication(offering.id, rejected.correlationId);
    });

    it('rejects missing, unknown and mismatched templates without silently substituting another type', async () => {
      const owner = await creator();
      for (const selected of [undefined, 'unknown-template', 'template-portrait-session']) {
        const offering = await draft(owner, { templateId: selected });
        expect(offering.policyStatus).toBe('rejected');
        const rejected = await publish(owner, offering.id);
        expect(rejected.response.statusCode).toBe(400);
        await noPublication(offering.id, rejected.correlationId);
      }
    });

    it.each(['capabilities', 'templates'] as const)(
      'honors Operations risk changes to %s without rewriting Offering facts',
      async (kind) => {
        const owner = await creator();
        const offering = await draft(owner);
        await update(kind, { riskTier: 'review' });
        const reviewed = await publish(owner, offering.id);
        expect(reviewed.response.statusCode).toBe(409);
        await noPublication(offering.id, reviewed.correlationId);
        await update(kind, { riskTier: 'prohibited' });
        const rejected = await publish(owner, offering.id);
        expect(rejected.response.statusCode).toBe(400);
        await noPublication(offering.id, rejected.correlationId);
      },
    );

    it('keeps prohibited template risk above review capability risk', async () => {
      const owner = await creator();
      const offering = await draft(owner);
      await update('capabilities', { riskTier: 'review' });
      await update('templates', { riskTier: 'prohibited' });
      const denied = await publish(owner, offering.id);
      expect(denied.response.statusCode).toBe(400);
      await noPublication(offering.id, denied.correlationId);
    });

    it('keeps an existing future-scope template in review instead of expanding the publishable scope', async () => {
      const owner = await creator({
        catalogItemId: 'capability-english-coaching',
        name: 'English coaching',
      });
      const offering = await draft(owner, {
        templateId: 'template-english-speaking-coaching',
        title: 'English speaking coaching',
      });
      expect(offering.policyStatus).toBe('review_required');
      const denied = await publish(owner, offering.id);
      expect(denied.response.statusCode).toBe(409);
      await noPublication(offering.id, denied.correlationId);
    });

    it('publishes only an imported version, preserves versioned keys and leaves existing Offerings unchanged', async () => {
      const beforeMissing = await state();
      const missing = await server.inject({
        method: 'POST',
        url: '/api/v1/operations/service-policy/releases',
        headers: operations,
        payload: { version: 'not-imported', reason: 'Must reject missing data' },
      });
      expect(missing.statusCode).toBe(400);
      expect(await state()).toEqual(beforeMissing);
      const owner = await creator();
      const offering = await draft(owner);
      expect((await publish(owner, offering.id)).response.statusCode).toBe(200);
      const fact = await composition.database
        .client`select * from service_offerings where id=${offering.id}`;
      await loadExistingVersion();
      for (const table of ['service_policy_capabilities', 'service_policy_templates']) {
        await expect(
          composition.database.client.unsafe(
            `insert into ${table} select * from ${table} where policy_version='v1' limit 1`,
          ),
        ).rejects.toMatchObject({ code: '23505' });
      }
      const correlationId = randomUUID();
      const result = await server.inject({
        method: 'POST',
        url: '/api/v1/operations/service-policy/releases',
        headers: { ...operations, 'x-correlation-id': correlationId },
        payload: { version: 'eng010-v2', reason: 'Publish a copy of the existing catalog' },
      });
      expect(result.statusCode, result.body).toBe(204);
      expect((await composition.servicePolicyCatalogRepository.getSnapshot()).policyVersion).toBe(
        'eng010-v2',
      );
      expect(
        await composition.database
          .client`select policy_version,status from service_policy_releases order by policy_version`,
      ).toEqual([
        { policy_version: 'eng010-v2', status: 'published' },
        { policy_version: 'v1', status: 'archived' },
      ]);
      expect(
        await composition.database.client`select * from service_offerings where id=${offering.id}`,
      ).toEqual(fact);
      expect(
        await composition.database
          .client`select policy_version,entity_id,actor_id,reason from service_policy_audits where correlation_id=${correlationId}`,
      ).toEqual([
        {
          policy_version: 'eng010-v2',
          entity_id: 'eng010-v2',
          actor_id: 'eng010-operator',
          reason: 'Publish a copy of the existing catalog',
        },
      ]);
    });

    it.each(['capabilities', 'templates', 'releases'] as const)(
      'rolls back the %s operation when the real audit INSERT fails',
      async (kind) => {
        await loadExistingVersion();
        const before = await state();
        await composition.database.client.unsafe(
          `create function eng010_fail_audit() returns trigger language plpgsql as $$ begin if NEW.reason='ENG010 forced audit failure' then raise exception 'ENG010 injected audit constraint failure' using errcode='23514'; end if; return NEW; end $$`,
        );
        await composition.database.client.unsafe(
          'create trigger eng010_audit_failure before insert on service_policy_audits for each row execute function eng010_fail_audit()',
        );
        try {
          const response = await server.inject(
            kind === 'releases'
              ? {
                  method: 'POST',
                  url: '/api/v1/operations/service-policy/releases',
                  headers: operations,
                  payload: { version: 'eng010-v2', reason: 'ENG010 forced audit failure' },
                }
              : {
                  method: 'PATCH',
                  url: `/api/v1/operations/service-policy/${kind}/${kind === 'capabilities' ? capabilityId : templateId}`,
                  headers: operations,
                  payload: { status: 'paused', reason: 'ENG010 forced audit failure' },
                },
          );
          expect(response.statusCode).toBe(500);
          expect(await state()).toEqual(before);
        } finally {
          await composition.database.client.unsafe(
            'drop trigger eng010_audit_failure on service_policy_audits',
          );
          await composition.database.client.unsafe('drop function eng010_fail_audit()');
        }
      },
    );

    it('serializes concurrent version publications and preserves separate concurrent field changes with truthful audits', async () => {
      await loadExistingVersion();
      const releases = await Promise.all(
        ['v1', 'eng010-v2'].map((version) =>
          server.inject({
            method: 'POST',
            url: '/api/v1/operations/service-policy/releases',
            headers: operations,
            payload: { version, reason: 'Concurrent existing version publication' },
          }),
        ),
      );
      expect(releases.map((r) => r.statusCode)).toEqual([204, 204]);
      expect(
        await composition.database
          .client`select policy_version from service_policy_releases where status='published'`,
      ).toHaveLength(1);
      await restoreSeedState();
      const updates = await Promise.all(
        [{ creatorSelectable: false }, { publishEnabled: false }].map((change) =>
          server.inject({
            method: 'PATCH',
            url: `/api/v1/operations/service-policy/capabilities/${capabilityId}`,
            headers: operations,
            payload: { ...change, reason: 'Concurrent separate field change' },
          }),
        ),
      );
      expect(updates.map((r) => r.statusCode)).toEqual([200, 200]);
      expect(
        (
          await composition.database
            .client`select creator_selectable,publish_enabled from service_policy_capabilities where id=${capabilityId} and policy_version='v1'`
        )[0],
      ).toEqual({ creator_selectable: false, publish_enabled: false });
      const audits = await composition.database
        .client`select before_state,after_state from service_policy_audits where reason='Concurrent separate field change' order by occurred_at,recorded_at`;
      expect(audits).toHaveLength(2);
      expect(audits[1]?.before_state).toEqual(audits[0]?.after_state);
    });

    it('reimports the authoritative JSON twice without clearing pauses, retirement, switches or audit history', async () => {
      await update('capabilities', { status: 'paused', publishEnabled: false });
      await update('templates', { status: 'retired', creatorSelectable: false });
      const before = await state();
      const env = Object.fromEntries(
        Object.entries(process.env).filter(
          ([key]) => !/(DATABASE_URL|POSTGRES_PASSWORD)/i.test(key),
        ),
      );
      for (let run = 0; run < 2; run++) {
        await execute(
          process.execPath,
          ['--import', 'tsx', 'scripts/database/import-service-policy-catalog.ts'],
          {
            cwd: process.cwd(),
            env: { ...env, DATABASE_URL: process.env.CATALOG_TEST_DATABASE_URL! },
          },
        );
        const current = await state();
        expect(current.audit).toEqual(before.audit);
        expect(current.releases).toEqual(before.releases);
        expect(current.capabilities).toHaveLength(before.capabilities.length);
        expect(current.templates).toHaveLength(before.templates.length);
        expect(
          current.capabilities.find(
            (row) => row.id === capabilityId && row.policy_version === 'v1',
          ),
        ).toMatchObject({ status: 'paused', publish_enabled: false });
        expect(
          current.templates.find((row) => row.id === templateId && row.policy_version === 'v1'),
        ).toMatchObject({ status: 'retired', creator_selectable: false });
      }
    });
  },
);
