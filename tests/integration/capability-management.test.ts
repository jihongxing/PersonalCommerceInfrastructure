import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import { createInMemoryCreatorIdentityComposition } from '../../adapters/in-memory/creator-identity-composition.js';
import { createPostgresDatabase } from '../../adapters/persistence/postgres/postgres-database.js';
import {
  PostgresCapabilityManagementRepository,
  PostgresCapabilityRepository,
  PostgresCommerceIdentityRepository,
  PostgresDistributionAssetRepository,
  PostgresOfferingRepository,
} from '../../adapters/persistence/postgres/postgres-creator-identity-repositories.js';
import { PostgresProductEventStore } from '../../adapters/persistence/postgres/postgres-product-event-store.js';
import { PostgresUnitOfWork } from '../../adapters/persistence/postgres/postgres-unit-of-work.js';
import { createActorContext } from '../../applications/core/actor-context.js';
import { CanonicalEventRecorder } from '../../applications/core/canonical-event-recorder.js';
import { RecordExternalDistributionUseCase } from '../../applications/service-offering/offering-use-cases.js';
import { createApiServer } from '../../apps/api/src/create-api-server.js';

describe('capability management API', () => {
  it('exposes the controlled multi-vertical capability and service catalog', async () => {
    const composition = createInMemoryCreatorIdentityComposition();
    const server = await createApiServer({
      authContextProvider: composition.authContextProvider,
      creatorIdentityService: composition.service,
      serviceOfferingService: composition.offeringService,
    });
    try {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/creator/service-catalog',
        headers: { authorization: 'Bearer test-creator-token' },
      });
      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.policyVersion).toBe('v1');
      expect(body.capabilities.length).toBeGreaterThanOrEqual(10);
      expect(body.templates).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'template-dance-private-lesson' }),
          expect.objectContaining({ id: 'template-portrait-session' }),
        ]),
      );
    } finally {
      await server.close();
    }
  });

  it('keeps a custom capability request in draft and blocks public release', async () => {
    const composition = createInMemoryCreatorIdentityComposition();
    const server = await createApiServer({
      authContextProvider: composition.authContextProvider,
      creatorIdentityService: composition.service,
      serviceOfferingService: composition.offeringService,
    });
    const headers = { authorization: 'Bearer test-creator-token' };
    try {
      await server.inject({
        method: 'POST',
        url: '/api/v1/creator/identity',
        headers,
        payload: { profile: { displayName: 'Creator', bio: 'Bio', socialLinks: [] } },
      });
      const capability = await server.inject({
        method: 'POST',
        url: '/api/v1/creator/identity/capabilities',
        headers,
        payload: { name: '未定义服务', description: '等待平台目录申请' },
      });
      expect(capability.statusCode).toBe(201);
      expect(capability.json().capabilities[0]).toMatchObject({ catalogStatus: 'custom_request' });
      const offering = await server.inject({
        method: 'POST',
        url: '/api/v1/creator/offerings',
        headers,
        payload: {
          capabilityIds: [capability.json().capabilityIds[0]],
          title: '未定义服务',
          description: '等待平台目录申请',
          availabilityDescription: '按需',
          requestInstructions: '提交需求',
        },
      });
      expect(offering.statusCode).toBe(201);
      expect(offering.json()).toMatchObject({ policyStatus: 'review_required' });
      const publish = await server.inject({
        method: 'POST',
        url: `/api/v1/creator/offerings/${offering.json().id}/publish`,
        headers,
      });
      expect(publish.statusCode).toBe(409);
    } finally {
      await server.close();
    }
  });

  it('allows only the owner to edit or remove capabilities and protects referenced services', async () => {
    const composition = createInMemoryCreatorIdentityComposition();
    const server = await createApiServer({
      authContextProvider: composition.authContextProvider,
      creatorIdentityService: composition.service,
      serviceOfferingService: composition.offeringService,
    });
    const owner = { authorization: 'Bearer test-creator-token' };
    const other = { authorization: 'Bearer test-other-creator-token' };
    try {
      const identity = await server.inject({
        method: 'POST',
        url: '/api/v1/creator/identity',
        headers: owner,
        payload: { profile: { displayName: 'Creator', bio: 'Bio', socialLinks: [] } },
      });
      expect(identity.statusCode).toBe(201);
      const added = await server.inject({
        method: 'POST',
        url: '/api/v1/creator/identity/capabilities',
        headers: owner,
        payload: {
          name: '舞蹈教学',
          catalogItemId: 'capability-dance-teaching',
          description: 'Description',
        },
      });
      const id = added.json().capabilityIds[0] as string;
      const path = `/api/v1/creator/identity/capabilities/${id}`;
      expect((await server.inject({ method: 'GET', url: path, headers: other })).statusCode).toBe(
        404,
      );
      expect(
        (
          await server.inject({
            method: 'PATCH',
            url: path,
            headers: other,
            payload: { name: 'Other', description: 'Other' },
          })
        ).statusCode,
      ).toBe(404);
      expect(
        (await server.inject({ method: 'DELETE', url: path, headers: other })).statusCode,
      ).toBe(404);
      expect(
        (
          await server.inject({
            method: 'PATCH',
            url: path,
            headers: owner,
            payload: { name: ' ', description: 'Text' },
          })
        ).statusCode,
      ).toBe(400);
      const edited = await server.inject({
        method: 'PATCH',
        url: path,
        headers: owner,
        payload: { name: ' Edited ', description: ' Updated ' },
      });
      expect(edited.json()).toMatchObject({ id, name: 'Edited', description: 'Updated' });
      const offering = await server.inject({
        method: 'POST',
        url: '/api/v1/creator/offerings',
        headers: owner,
        payload: {
          capabilityIds: [id],
          templateId: 'template-dance-private-lesson',
          title: '1 对 1 舞蹈私教',
          description: 'Description',
          requestInstructions: 'Contact',
        },
      });
      expect(offering.statusCode).toBe(201);
      const distributionPath = `/api/v1/creator/offerings/${offering.json().id}/distribution`;
      const beforePublish = await server.inject({
        method: 'GET',
        url: distributionPath,
        headers: owner,
      });
      expect(beforePublish.statusCode).toBe(200);
      expect(beforePublish.json()).toBeNull();
      expect(
        (await server.inject({ method: 'GET', url: distributionPath, headers: other })).statusCode,
      ).toBe(403);
      expect(
        (await server.inject({ method: 'DELETE', url: path, headers: owner })).statusCode,
      ).toBe(409);
      const offeringId = offering.json().id as string;
      expect(
        (
          await server.inject({
            method: 'PATCH',
            url: `/api/v1/creator/offerings/${offeringId}`,
            headers: owner,
            payload: {
              capabilityIds: [],
              title: 'Service',
              description: 'Description',
              requestInstructions: 'Contact',
            },
          })
        ).statusCode,
      ).toBe(200);
      expect(
        (await server.inject({ method: 'DELETE', url: path, headers: owner })).statusCode,
      ).toBe(204);
      expect((await server.inject({ method: 'GET', url: path, headers: owner })).statusCode).toBe(
        404,
      );
    } finally {
      await server.close();
    }
  });

  it('retrieves persisted distribution state for the owner', async () => {
    const composition = createInMemoryCreatorIdentityComposition();
    const server = await createApiServer({
      authContextProvider: composition.authContextProvider,
      creatorIdentityService: composition.service,
      serviceOfferingService: composition.offeringService,
    });
    const headers = { authorization: 'Bearer test-creator-token' };
    try {
      await server.inject({
        method: 'POST',
        url: '/api/v1/creator/identity',
        headers,
        payload: { profile: { displayName: 'Creator', bio: 'Bio', socialLinks: [] } },
      });
      const capability = await server.inject({
        method: 'POST',
        url: '/api/v1/creator/identity/capabilities',
        headers,
        payload: {
          name: '舞蹈教学',
          catalogItemId: 'capability-dance-teaching',
          description: 'Description',
        },
      });
      const offering = await server.inject({
        method: 'POST',
        url: '/api/v1/creator/offerings',
        headers,
        payload: {
          capabilityIds: [capability.json().capabilityIds[0]],
          templateId: 'template-dance-private-lesson',
          title: '1 对 1 舞蹈私教',
          description: 'Description',
          availabilityDescription: 'Weekdays',
          requestInstructions: 'Contact',
        },
      });
      const path = `/api/v1/creator/offerings/${offering.json().id}`;
      expect(
        (await server.inject({ method: 'POST', url: `${path}/publish`, headers })).statusCode,
      ).toBe(200);
      expect(
        (await server.inject({ method: 'GET', url: `${path}/distribution`, headers })).json().state,
      ).toBe('generated');
      const concurrent = await Promise.all([
        server.inject({ method: 'POST', url: `${path}/distribution`, headers }),
        server.inject({ method: 'POST', url: `${path}/distribution`, headers }),
      ]);
      expect(concurrent.map((response) => response.statusCode).sort()).toEqual([200, 409]);
      expect(
        (await server.inject({ method: 'GET', url: `${path}/distribution`, headers })).json().state,
      ).toBe('distributed');
      expect(
        (await server.inject({ method: 'POST', url: `${path}/distribution`, headers })).statusCode,
      ).toBe(409);
    } finally {
      await server.close();
    }
  });
});

const databaseUrl = process.env.LOCAL_AUTH_TEST_DATABASE_URL;
describe.skipIf(!databaseUrl)('capability concurrency with PostgreSQL', () => {
  const database = createPostgresDatabase(databaseUrl!);
  afterAll(async () => database.close());

  it('serializes deletion and service association without leaving a dangling reference', async () => {
    const owner = randomUUID();
    const id = randomUUID();
    const offeringId = randomUUID();
    const capabilities = new PostgresCapabilityRepository(database.database);
    const manager = new PostgresCapabilityManagementRepository(database.database);
    const offerings = new PostgresOfferingRepository(database.database);
    await capabilities.save({ id, creatorId: owner, name: 'Skill', description: 'Description' });
    const [deletion, offering] = await Promise.allSettled([
      manager.deleteOwnedIfUnused(owner, id),
      offerings.save({
        id: offeringId,
        creatorId: owner,
        capabilityIds: [id],
        title: 'Service',
        description: '',
        requestInstructions: '',
        state: 'draft',
      }),
    ]);
    expect(deletion.status).toBe('fulfilled');
    const persisted = await offerings.findById(offeringId);
    const capability = await capabilities.findById(id);
    if (persisted) {
      expect(offering.status).toBe('fulfilled');
      expect(capability).toBeDefined();
      expect(deletion.status === 'fulfilled' && deletion.value).toBe('in_use');
    } else {
      expect(offering.status).toBe('rejected');
      expect(capability).toBeUndefined();
      expect(deletion.status === 'fulfilled' && deletion.value).toBe('deleted');
    }
  });

  it('records only one distribution event when confirmations race', async () => {
    const owner = randomUUID();
    const offeringId = randomUUID();
    const offerings = new PostgresOfferingRepository(database.database);
    const assets = new PostgresDistributionAssetRepository(database.database);
    const events = new PostgresProductEventStore(database.database);
    await offerings.save({
      id: offeringId,
      creatorId: owner,
      capabilityIds: [],
      title: 'Service',
      description: 'Description',
      requestInstructions: 'Contact',
      state: 'published',
    });
    await assets.save({
      offeringId,
      publicUrl: 'https://example.test/service',
      state: 'generated',
    });
    const useCase = new RecordExternalDistributionUseCase({
      identityRepository: new PostgresCommerceIdentityRepository(database.database),
      capabilityRepository: new PostgresCapabilityRepository(database.database),
      offeringRepository: offerings,
      distributionAssetRepository: assets,
      idGenerator: { generate: randomUUID },
      unitOfWork: new PostgresUnitOfWork(database.database),
      canonicalEventRecorder: new CanonicalEventRecorder({
        clock: { now: () => new Date().toISOString() },
        eventStore: events,
        idGenerator: { generate: randomUUID },
      }),
    });
    const context = createActorContext({
      actor: { kind: 'creator', creatorId: owner },
      correlationId: randomUUID(),
    });
    const results = await Promise.allSettled([
      useCase.execute({ offeringId }, context),
      useCase.execute({ offeringId }, context),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    const failure = results.find((result) => result.status === 'rejected');
    expect(failure?.status === 'rejected' && failure.reason).toMatchObject({
      code: 'distribution_asset_already_distributed',
    });
    expect(
      (await events.list()).filter(
        (event) => event.objectId === offeringId && event.name === 'creator_distributed',
      ),
    ).toHaveLength(1);
  });
});
