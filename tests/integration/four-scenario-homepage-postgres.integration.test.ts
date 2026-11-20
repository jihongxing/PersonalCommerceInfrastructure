import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import { chromium, expect as expectBrowser } from '@playwright/test';
import postgres from 'postgres';
import { createPostgresCreatorIdentityComposition } from '../../adapters/persistence/postgres/postgres-creator-identity-composition.js';
import { createPostgresDatabase } from '../../adapters/persistence/postgres/postgres-database.js';
import { createPostgresGoodsStore } from '../../adapters/persistence/postgres/postgres-goods-store.js';
import { createPostgresMembershipStore } from '../../adapters/persistence/postgres/postgres-membership-store.js';
import { createPostgresProgramStore } from '../../adapters/persistence/postgres/postgres-program-store.js';
import { PostgresPublicHomepageRepository } from '../../adapters/persistence/postgres/postgres-public-homepage-repository.js';
import { PostgresScenarioOperationsStore } from '../../adapters/persistence/postgres/postgres-scenario-operations-store.js';
import { createGoodsService } from '../../applications/goods/goods-service.js';
import { createMembershipService } from '../../applications/membership/membership-service.js';
import type { ScenarioKind } from '../../applications/operations-admin/scenario-operations.js';
import { createProgramService } from '../../applications/program/program-service.js';
import {
  createPublicHomepageService,
  type PublicHomepage,
} from '../../applications/public-commerce-homepage/public-commerce-homepage-service.js';
import { createApiServer } from '../../apps/api/src/create-api-server.js';

const databaseUrl = process.env.PD012_INTEGRATION_DATABASE_URL;

describe.skipIf(!databaseUrl)('Four-scenario public homepage with PostgreSQL', () => {
  if (!databaseUrl) return;
  const target = new URL(databaseUrl);
  if (
    !['localhost', '127.0.0.1', '[::1]'].includes(target.hostname) ||
    target.pathname !== '/integration_pd012'
  ) {
    throw new Error('A dedicated local integration_pd012 database is required.');
  }
  const connection = createPostgresDatabase(databaseUrl);
  const { client: sql, database } = connection;
  afterAll(() => connection.close());

  it('discovers four persisted supplies and tracks publication, eligibility, and pause without changing existing transactions', async () => {
    const runBrowser = process.env.PD012_LOCAL_BROWSER === '1';
    const webOrigin = 'http://127.0.0.1:43121';
    const suffix = randomUUID();
    const providerId = `provider-${suffix}`;
    const otherProvider = `another-${suffix}`;
    const identity = `identity-${suffix}`;
    const profile = `profile-${suffix}`;
    const account = `supabase:fixture-${suffix}`;
    const alphabet = '3479ACDEFHJKMNPQRTVWXY';
    const reference = Array.from(
      { length: 18 },
      () => alphabet[Math.floor(Math.random() * alphabet.length)],
    ).join('');
    const mapping = new Map([[account, providerId]]);
    const homepage = new PostgresPublicHomepageRepository(sql, mapping, {
      membership: true,
      program: true,
      goods: true,
    });
    const membership = createMembershipService(createPostgresMembershipStore(sql));
    const program = createProgramService(createPostgresProgramStore(sql));
    const goods = createGoodsService(createPostgresGoodsStore(sql));
    const scenarioStore = new PostgresScenarioOperationsStore(database);
    async function changeIntake(scenario: ScenarioKind, open: boolean) {
      const previous = await scenarioStore.latest(scenario);
      expect(
        await scenarioStore.append(
          {
            scenario,
            open,
            revision: (previous?.revision ?? 0) + 1,
            reason: 'PD-012 integration fixture',
            actorId: 'pd012-local-test',
            occurredAt: new Date().toISOString(),
            correlationId: randomUUID(),
          },
          previous?.open ?? scenario === 'Service',
        ),
      ).toBe(true);
    }

    await sql`INSERT INTO identities (identity_id) VALUES (${identity})`;
    await sql`INSERT INTO account_identity_memberships (membership_id, account_id, identity_id) VALUES (${randomUUID()}, ${account}, ${identity})`;
    await sql`INSERT INTO commerce_identities (creator_id, display_name, bio, state)
      VALUES (${providerId}, 'Private identity display', 'Do not project', 'published'), (${otherProvider}, 'Other provider', '', 'published')`;
    await sql`INSERT INTO commerce_profiles (commerce_profile_id, owning_identity_id, display_name) VALUES (${profile}, ${identity}, 'Public studio')`;
    await sql`INSERT INTO commerce_references (commerce_reference, identity_id, assigned_at) VALUES (${reference}, ${identity}, now())`;
    await homepage.selectProfile(identity, profile, account);
    await homepage.transition(identity, 'publish', account);

    const serviceComposition = runBrowser
      ? createPostgresCreatorIdentityComposition(
          { databaseUrl },
          { localAuthSecret: randomUUID() },
          webOrigin,
          { deliver: () => Promise.resolve() },
          { operationsAccessToken: randomUUID(), operationsOperatorId: 'pd012-test' },
        )
      : undefined;
    const api = await createApiServer({
      publicOrigin: webOrigin,
      ...(serviceComposition
        ? { customerRequestService: serviceComposition.customerRequestService }
        : {}),
      publicHomepageService: createPublicHomepageService({
        repository: homepage,
        currentUserIdentityService: {
          getCurrentIdentity: () => Promise.reject(new Error('Public lookup requires no identity')),
        },
      }),
      membershipService: membership,
      programService: program,
      goodsService: goods,
    });
    const visitHomepage = async () => {
      const response = await api.inject(
        `/api/v1/public/homepages/${reference}?viewId=${randomUUID()}`,
      );
      expect(response.statusCode).toBe(200);
      expect(response.headers['cache-control']).toBe('no-store');
      return response.json<PublicHomepage>();
    };

    try {
      await changeIntake('Service', true);
      await changeIntake('Membership', true);
      await changeIntake('Program', true);
      await changeIntake('Goods', false);
      const serviceId = `service-${suffix}`;
      const capabilityId = `capability-${suffix}`;
      await sql`INSERT INTO creator_capabilities (id, creator_id, name, description, catalog_item_id, catalog_status, policy_version)
        VALUES (${capabilityId}, ${providerId}, 'Dance lesson', 'Dance lesson', 'capability-dance-teaching', 'active', 'v1')`;
      await sql`INSERT INTO service_offerings (id, creator_id, title, description, availability_description,
        request_instructions, state, policy_status, capability_ids, template_id)
        VALUES (${serviceId}, ${providerId}, 'Service', 'Public', 'Weekend', 'Not projected', 'published', 'approved',
          ${JSON.stringify([capabilityId])}::jsonb, 'template-dance-private-lesson'),
          (${`unchecked-${suffix}`}, ${providerId}, 'Not approved', '', '', '', 'published', 'not_checked', '[]'::jsonb, NULL)`;

      const membershipTerms = {
        title: 'Membership',
        location: 'Studio',
        benefits: 'Studio access',
        terms: 'Check in person',
        durationDays: 10,
      };
      const offer = await membership.createOffering(providerId, membershipTerms);
      const foreignOffer = await membership.createOffering(otherProvider, membershipTerms);
      await membership.publishOffering(otherProvider, foreignOffer.id, foreignOffer.revision);
      const programOffering = await program.createOffering(providerId, {
        title: 'Workshop',
        description: 'Two sessions',
        location: 'Studio',
      });
      await program.publishOffering(providerId, programOffering.id, programOffering.revision);
      const startsAt = new Date(Date.now() + 86_400_000).toISOString();
      const endsAt = new Date(Date.now() + 2 * 86_400_000).toISOString();
      const run = await program.createRun(providerId, {
        offeringId: programOffering.id,
        location: 'Hall',
        startsAt,
        endsAt,
        capacity: 1,
      });
      const session = await program.addSession(
        providerId,
        run.id,
        { scheduledStart: startsAt, scheduledEnd: endsAt, location: 'Hall' },
        randomUUID(),
      );
      const goodsOffering = await goods.createOffering(
        providerId,
        {
          title: 'Notebook',
          description: 'Handmade',
          priceMinor: '2500',
          currency: 'CNY',
          fulfillmentDescription: 'Pickup',
          preparationDescription: 'Made to order',
        },
        randomUUID(),
      );
      await goods.publishOffering(
        providerId,
        goodsOffering.id,
        goodsOffering.revision,
        randomUUID(),
      );

      const serviceProjection = { id: serviceId, title: 'Service', description: 'Public' };
      expect(await visitHomepage()).toEqual({
        commerceReference: reference,
        displayName: 'Public studio',
        offerings: [serviceProjection],
      });
      await membership.publishOffering(providerId, offer.id, offer.revision);
      await membership.reviseOffering(providerId, offer.id, offer.revision, {
        ...membershipTerms,
        title: 'Unpublished edit',
      });
      await program.publishRun(providerId, run.id);
      await changeIntake('Goods', true);
      const published = await visitHomepage();
      expect(published).toEqual({
        commerceReference: reference,
        displayName: 'Public studio',
        offerings: [serviceProjection],
        membershipOfferings: [{ id: offer.id, title: 'Membership', location: 'Studio' }],
        programRuns: [{ id: run.id, title: 'Workshop', location: 'Hall', startsAt }],
        goodsOfferings: [
          {
            id: goodsOffering.id,
            sellerId: providerId,
            title: 'Notebook',
            description: 'Handmade',
            priceMinor: '2500',
            currency: 'CNY',
            fulfillmentDescription: 'Pickup',
            preparationDescription: 'Made to order',
          },
        ],
      });
      expect(
        await new PostgresPublicHomepageRepository(sql, mapping).resolve(reference, randomUUID()),
      ).toEqual({
        commerceReference: reference,
        displayName: 'Public studio',
        offerings: [serviceProjection],
      });
      for (const detail of [
        `membership-offerings/${offer.id}`,
        `program-runs/${run.id}`,
        `goods/offerings/${goodsOffering.id}`,
      ]) {
        expect((await api.inject(`/api/v1/public/${detail}`)).statusCode).toBe(200);
      }
      if (runBrowser) {
        expect((await api.inject(`/api/v1/public/offerings/${serviceId}`)).statusCode).toBe(200);
        await api.listen({ host: '127.0.0.1', port: 43122 });
        const browser = await chromium.launch({
          executablePath: process.env.PD012_CHROMIUM_EXECUTABLE,
        });
        try {
          const page = await browser.newPage();
          const homepageUrl = `${webOrigin}/r/${reference}`;
          for (const [label, path, heading] of [
            ['查看服务：Service', `/s/${serviceId}`, 'Service'],
            ['查看会员：Membership', `/membership/${offer.id}`, 'Membership'],
            ['查看计划：Workshop', `/programs/${run.id}`, '计划详情'],
            ['查看商品：Notebook', `/goods/${goodsOffering.id}`, 'Notebook'],
          ]) {
            await page.goto(homepageUrl);
            await page.getByRole('link', { name: label }).click({ timeout: 30_000 });
            await expectBrowser(page).toHaveURL(`${webOrigin}${path}`, { timeout: 30_000 });
            await expectBrowser(
              page.getByRole('heading', { name: heading, exact: true }),
            ).toBeVisible({ timeout: 30_000 });
          }
        } finally {
          await browser.close();
        }
      }

      const applyForMembership = (accountId: string) =>
        membership.apply({
          accountId,
          offeringId: offer.id,
          version: 1,
          accepted: true,
          correlationId: randomUUID(),
        });
      const approveMembership = (applicationId: string, owner = providerId) =>
        membership.approve({
          providerId: owner,
          actorAccountId: account,
          applicationId,
          identityChecked: true,
          correlationId: randomUUID(),
        });
      const application = await applyForMembership(`member-${suffix}`);
      await expect(approveMembership(application.id, otherProvider)).rejects.toBeDefined();
      const member = await approveMembership(application.id);
      expect(Date.parse(member.validUntil) - Date.parse(member.validFrom)).toBe(10 * 86_400_000);
      const pending = await applyForMembership(`pending-${suffix}`);
      const record = {
        providerId,
        actorAccountId: account,
        offeringId: offer.id,
        membershipId: member.id,
        correlationId: randomUUID(),
      };

      const consumers = [`participant-one-${suffix}`, `participant-two-${suffix}`];
      const applications = await Promise.allSettled(
        consumers.map((consumer) => program.apply(consumer, run.id, randomUUID())),
      );
      const winning = applications.find((result) => result.status === 'fulfilled');
      const rejected = applications.find((result) => result.status === 'rejected');
      expect(rejected?.reason).toMatchObject({ code: 'program_capacity_full' });
      if (winning?.status !== 'fulfilled') throw new Error('Expected one Program application');
      expect((await visitHomepage()).programRuns).toBeUndefined();
      const order = await goods.submitOrder(
        `buyer-${suffix}`,
        goodsOffering.id,
        suffix,
        randomUUID(),
      );

      await changeIntake('Service', false);
      await changeIntake('Membership', false);
      await changeIntake('Program', false);
      await changeIntake('Goods', false);
      expect(await visitHomepage()).toEqual({
        commerceReference: reference,
        displayName: 'Public studio',
        offerings: [],
      });
      await expect(applyForMembership(`new-${suffix}`)).rejects.toMatchObject({
        code: 'membership_intake_paused',
      });
      await expect(approveMembership(pending.id)).rejects.toMatchObject({
        code: 'membership_intake_paused',
      });
      const check = await membership.record({
        ...record,
        kind: 'verification',
        identityChecked: true,
      });
      expect(check).toMatchObject({ eligible: true });
      expect(
        await membership.record({
          ...record,
          kind: 'admission',
          verificationId: check.id,
          occurred: true,
        }),
      ).toMatchObject({ kind: 'admission' });
      await expect(program.apply(`new-${suffix}`, run.id, randomUUID())).rejects.toMatchObject({
        code: 'program_intake_paused',
      });
      const enrollment = await program.approveApplication(
        providerId,
        winning.value.id,
        account,
        randomUUID(),
      );
      expect(
        await program.recordAttendance(
          providerId,
          session.id,
          [{ enrollmentId: enrollment.id, status: 'attended' }],
          randomUUID(),
        ),
      ).toMatchObject([{ status: 'attended' }]);
      await expect(
        goods.submitOrder(`new-${suffix}`, goodsOffering.id, suffix, randomUUID()),
      ).rejects.toMatchObject({ code: 'goods_intake_paused' });
      const accepted = await goods.acceptOrder(providerId, order.order.id, account, randomUUID());
      expect(accepted.commitment).toMatchObject({ orderId: order.order.id });
      expect(
        await goods.recordDelivery(
          providerId,
          order.order.id,
          'in_person_handover',
          'Handed over',
          randomUUID(),
        ),
      ).toMatchObject({ delivery: { orderId: order.order.id } });

      await changeIntake('Service', true);
      await changeIntake('Membership', true);
      await changeIntake('Program', true);
      await changeIntake('Goods', true);
      expect(await visitHomepage()).toEqual({ ...published, programRuns: undefined });
      await program.withdrawEnrollment(enrollment.accountId, enrollment.id, randomUUID());
      expect((await visitHomepage()).programRuns).toEqual(published.programRuns);
      await program.cancelRun(providerId, run.id, 'Discontinued test run', randomUUID());
      expect((await visitHomepage()).programRuns).toBeUndefined();
      expect(await program.runAttendance(providerId, run.id)).toMatchObject([
        { enrollmentId: enrollment.id, status: 'attended' },
      ]);
      await approveMembership(pending.id);
      await sql`UPDATE commercial_memberships SET data = data || jsonb_build_object(
        'validFrom', '2000-01-01T00:00:00.000Z'::text,
        'validUntil', '2000-01-11T00:00:00.000Z'::text
      ) WHERE id = ${member.id}`;
      expect(await membership.activity(providerId, offer.id, member.id)).toMatchObject({
        status: 'expired',
      });
      expect(
        await membership.record({ ...record, kind: 'verification', identityChecked: true }),
      ).toMatchObject({ eligible: false });
      await goods.pauseOffering(providerId, goodsOffering.id, 2, randomUUID());
      expect((await visitHomepage()).goodsOfferings).toBeUndefined();
      await homepage.transition(identity, 'pause', account);
      expect(
        (await api.inject(`/api/v1/public/homepages/${reference}?viewId=${randomUUID()}`))
          .statusCode,
      ).toBe(404);
      expect(await sql`SELECT id FROM paid_commerce_payments`).toHaveLength(0);
    } finally {
      await api.close();
      await serviceComposition?.database.close();
      await changeIntake('Service', true);
      await changeIntake('Membership', false);
      await changeIntake('Program', false);
      await changeIntake('Goods', false);
    }
  }, 180_000);

  it('keeps repeated Program writes as JSON objects and reads legacy encoded Run history', async () => {
    const sessionSql = postgres(databaseUrl, { max: 1 });
    const program = createProgramService(createPostgresProgramStore(sessionSql));
    const providerId = `delivery-${randomUUID()}`;
    const schedule = {
      scheduledStart: '2000-01-01T09:00:00.000Z',
      scheduledEnd: '2000-01-01T10:00:00.000Z',
      location: 'Studio A',
    };
    try {
      const offering = await program.createOffering(providerId, { title: 'Program', description: 'Offline workshop', location: schedule.location });
      await program.publishOffering(providerId, offering.id, offering.revision);
      const run = await program.createRun(providerId, { offeringId: offering.id, startsAt: schedule.scheduledStart, endsAt: schedule.scheduledEnd, location: schedule.location, capacity: 1 });
      const held = await program.addSession(providerId, run.id, schedule, 'session-held');
      const cancelled = await program.addSession(providerId, run.id, schedule, 'session-cancelled');
      await program.publishRun(providerId, run.id);
      await sessionSql`UPDATE program_runs SET data = to_jsonb(data::text) WHERE id = ${run.id}`;
      const [current] = await program.providerRuns(providerId);
      expect(current).toMatchObject({ id: run.id, status: 'published' });

      const retries = await Promise.all([
        program.recordSessionDelivery(providerId, held.id, 'held', providerId, 'held-first'),
        program.recordSessionDelivery(providerId, held.id, 'held', providerId, 'held-retry'),
      ]);
      expect(retries[0]).toEqual(retries[1]);
      await program.recordSessionDelivery(providerId, cancelled.id, 'cancelled', providerId, 'cancelled');
      expect(await sessionSql`SELECT jsonb_typeof(data) AS kind FROM program_sessions WHERE run_id = ${run.id}`).toEqual([{ kind: 'object' }, { kind: 'object' }]);
      expect(await sessionSql`SELECT jsonb_typeof(after_state) AS kind FROM program_audits WHERE target_id = ${held.id} AND action = 'record_program_session_delivery'`).toEqual([{ kind: 'object' }]);
      expect(await program.providerRuns(providerId)).toMatchObject([{ sessions: [{ status: 'held' }, { status: 'cancelled' }], attendance: [], completions: [] }]);
      await program.completeRun(providerId, run.id, [], providerId, 'end');
      expect(await sessionSql`SELECT jsonb_typeof(data) AS kind FROM program_runs WHERE id = ${run.id}`).toEqual([{ kind: 'object' }]);
    } finally {
      await sessionSql.end();
    }
  });
});
