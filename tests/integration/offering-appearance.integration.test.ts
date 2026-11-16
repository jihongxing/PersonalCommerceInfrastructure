import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { InMemoryAuthContextProvider } from '../../adapters/auth/testing/in-memory-auth-context-provider.js';
import { InMemoryEntityCollectionRepository } from '../../adapters/in-memory/in-memory-entity-collection-repository.js';
import { InMemoryServicePolicyCatalogRepository } from '../../adapters/in-memory/in-memory-service-policy-catalog-repository.js';
import { createPostgresDatabase } from '../../adapters/persistence/postgres/postgres-database.js';
import {
  PostgresCommerceIdentityRepository,
  PostgresCapabilityRepository,
  PostgresOfferingRepository,
} from '../../adapters/persistence/postgres/postgres-creator-identity-repositories.js';
import { PostgresServicePolicyCatalogRepository } from '../../adapters/persistence/postgres/postgres-service-policy-catalog-repository.js';
import { createServiceOfferingService } from '../../applications/service-offering/offering-service.js';
import { createApiServer } from '../../apps/api/src/create-api-server.js';
import type {
  CommerceIdentity,
  Capability,
} from '../../modules/creator-commerce-identity/commerce-identity.js';
import type {
  Offering,
  AppearanceOfferingMetadata,
} from '../../modules/service-offering/offering.js';
import { initialServicePolicyCatalog } from '../../modules/service-policy/catalog-seed.js';

const databaseUrl = process.env.APPEARANCE_TEST_DATABASE_URL;
const appearance: AppearanceOfferingMetadata = {
  appearanceType: 'guest',
  startsOn: '2026-11-20',
  endsOn: '2026-11-21',
  locationDescription: 'Synthetic event venue',
  buyerType: 'organizer',
  requestCallToAction: 'Submit request',
  upcomingTitle: 'Historical event title',
  pricingRule: 'Discuss scope',
  externalUrl: 'https://example.test/event',
};
const cleanup: (() => Promise<void>)[] = [];
afterEach(async () => {
  for (const close of cleanup.splice(0).reverse()) await close();
});

async function fixture(backend: 'memory' | 'postgres') {
  // This suite never falls back to a shared/production database. The dedicated
  // loopback database must be provisioned and migrated explicitly by the runner.
  if (backend === 'postgres') {
    const target = new URL(databaseUrl!);
    if (
      !['127.0.0.1', 'localhost'].includes(target.hostname) ||
      !/^\/pci_020c3b1_[a-z0-9_]+$/u.test(target.pathname)
    ) {
      throw new Error(
        'Appearance integration requires an isolated pci_020c3b1_ loopback database.',
      );
    }
  }
  const db = backend === 'postgres' ? createPostgresDatabase(databaseUrl!) : undefined;
  if (db) cleanup.push(() => db.close());
  const identities = db
    ? new PostgresCommerceIdentityRepository(db.database)
    : new InMemoryEntityCollectionRepository<CommerceIdentity>(
        (item) => item.creatorId,
        (item) => item.creatorId,
      );
  const capabilities = db
    ? new PostgresCapabilityRepository(db.database)
    : new InMemoryEntityCollectionRepository<Capability>(
        (item) => item.id,
        (item) => item.creatorId,
      );
  const offerings = db
    ? new PostgresOfferingRepository(db.database)
    : new InMemoryEntityCollectionRepository<Offering>(
        (item) => item.id,
        (item) => item.creatorId,
      );
  const catalog = db
    ? new PostgresServicePolicyCatalogRepository(db.database)
    : new InMemoryServicePolicyCatalogRepository(initialServicePolicyCatalog);
  const creatorId = randomUUID();
  const capabilityId = randomUUID();
  await identities.save({
    creatorId,
    profile: { displayName: 'Synthetic creator', bio: 'Test only', socialLinks: [] },
    capabilityIds: [],
    state: 'draft',
  });
  await capabilities.save({
    id: capabilityId,
    creatorId,
    name: '商业演出与出席',
    description: 'Synthetic activity',
    catalogItemId: 'capability-commercial-appearance',
    catalogStatus: 'active',
    policyVersion: 'v1',
  });
  const service = createServiceOfferingService({
    identityRepository: identities,
    capabilityRepository: capabilities,
    offeringRepository: offerings,
    servicePolicyCatalogRepository: catalog,
    idGenerator: { generate: randomUUID },
  });
  const server: FastifyInstance = await createApiServer({
    serviceOfferingService: service,
    authContextProvider: new InMemoryAuthContextProvider([
      { accessToken: 'synthetic-appearance-test', actor: { kind: 'creator', creatorId } },
    ]),
    servicePolicyCatalogRepository: catalog,
  });
  cleanup.push(() => server.close());
  const headers = {
    authorization: 'Bearer synthetic-appearance-test',
    'content-type': 'application/json',
  };
  const input = {
    capabilityIds: [capabilityId],
    templateId: 'template-commercial-appearance',
    title: 'Synthetic activity',
    description: 'Event context',
    availabilityDescription: 'By agreement',
    requestInstructions: 'Provide event details',
  };
  const create = (payload: unknown) =>
    server.inject({
      method: 'POST',
      url: '/api/v1/creator/offerings',
      headers,
      payload: JSON.stringify(payload),
    });
  const update = (id: string, payload: unknown) =>
    server.inject({
      method: 'PATCH',
      url: `/api/v1/creator/offerings/${id}`,
      headers: { ...headers, 'content-type': 'application/json' },
      payload: JSON.stringify(payload),
    });
  const reread = async (id: string) => {
    if (!db) return offerings.findById(id);
    // Independent connection and mapper, so response/cache objects cannot mask persistence loss.
    const fresh = createPostgresDatabase(databaseUrl!);
    try {
      return await new PostgresOfferingRepository(fresh.database).findById(id);
    } finally {
      await fresh.close();
    }
  };
  return { server, headers, input, create, update, reread, offerings, catalog, db, creatorId };
}

for (const backend of ['memory', 'postgres'] as const) {
  describe.skipIf(backend === 'postgres' && !databaseUrl)(
    `Appearance Fastify/Application/${backend} round-trip`,
    () => {
      it('preserves omitted Appearance on title and all ordinary field updates, then fully replaces an explicit object', async () => {
        const f = await fixture(backend);
        const created = await f.create({ ...f.input, appearance });
        expect(created.statusCode, created.body).toBe(201);
        const id = created.json<{ id: string }>().id;
        expect((await f.reread(id))?.appearance).toEqual(appearance);
        for (const edit of [
          { title: 'Edited title' },
          { description: 'Edited description' },
          { availabilityDescription: 'Edited availability' },
          { requestInstructions: 'Edited instructions' },
          { capabilityIds: f.input.capabilityIds },
        ]) {
          const response = await f.update(id, { ...f.input, ...edit });
          expect(response.statusCode, response.body).toBe(200);
          expect(response.json<{ appearance: AppearanceOfferingMetadata }>().appearance).toEqual(
            appearance,
          );
          expect((await f.reread(id))?.appearance).toEqual(appearance);
        }
        const replacement: AppearanceOfferingMetadata = {
          appearanceType: 'brand',
          startsOn: '2026-11-22',
          locationDescription: 'Replacement venue',
          buyerType: 'brand',
          requestCallToAction: 'Request details',
        };
        const replaced = await f.update(id, { ...f.input, appearance: replacement });
        expect(replaced.statusCode, replaced.body).toBe(200);
        expect(replaced.json<{ appearance: AppearanceOfferingMetadata }>().appearance).toEqual(
          replacement,
        );
        expect((await f.reread(id))?.appearance).toEqual(replacement);
        const list = await f.server.inject({
          method: 'GET',
          url: '/api/v1/creator/offerings',
          headers: { authorization: f.headers.authorization },
        });
        expect(list.statusCode).toBe(200);
        expect(list.json<{ offerings: Offering[] }>().offerings[0]?.appearance).toEqual(
          replacement,
        );
        if (f.db) {
          const [raw] = await f.db
            .client`select appearance from service_offerings where id = ${id}`;
          expect(raw?.appearance).toEqual(replacement);
        }
      });

      it('creates and edits ordinary Offerings without Appearance and accepts Appearance without upcomingTitle on create', async () => {
        const f = await fixture(backend);
        const created = await f.create(f.input);
        expect(created.statusCode, created.body).toBe(201);
        const id = created.json<{ id: string }>().id;
        expect(created.json()).not.toHaveProperty('appearance');
        expect((await f.reread(id))?.appearance).toBeUndefined();
        const updated = await f.update(id, { ...f.input, title: 'Ordinary update' });
        expect(updated.statusCode).toBe(200);
        expect(updated.json()).not.toHaveProperty('appearance');
        expect((await f.reread(id))?.appearance).toBeUndefined();
        const minimal = {
          appearanceType: 'guest',
          startsOn: '2026-11-20',
          locationDescription: 'Venue',
          buyerType: 'organizer',
          requestCallToAction: 'Submit request',
        };
        const optional = await f.create({ ...f.input, appearance: minimal });
        expect(optional.statusCode, optional.body).toBe(201);
        expect((await f.reread(optional.json<{ id: string }>().id))?.appearance).toEqual(minimal);
      });

      it('returns stable date-range 400 for create/update and leaves persisted data unchanged', async () => {
        const f = await fixture(backend);
        const invalid = { ...appearance, endsOn: '2026-11-19' };
        const before = await f.offerings.findByOwnerId(f.creatorId);
        const rejected = await f.create({ ...f.input, appearance: invalid });
        expect(rejected.statusCode, rejected.body).toBe(400);
        expect(rejected.json()).toMatchObject({
          error: {
            category: 'validation',
            code: 'service_offering_appearance_date_range_invalid',
            message: 'Appearance end date cannot be before its start date.',
          },
        });
        expect(rejected.body).not.toContain('internal_error');
        expect(await f.offerings.findByOwnerId(f.creatorId)).toEqual(before);
        const created = await f.create({ ...f.input, appearance });
        const id = created.json<{ id: string }>().id;
        const original = await f.reread(id);
        const response = await f.update(id, {
          ...f.input,
          title: 'Must not save',
          appearance: invalid,
        });
        expect(response.statusCode).toBe(400);
        expect(response.json()).toMatchObject({
          error: { code: 'service_offering_appearance_date_range_invalid' },
        });
        expect(await f.reread(id)).toEqual(original);
      });

      it('rejects null, partial metadata and disguised numeric pricing without clearing existing data', async () => {
        const f = await fixture(backend);
        const created = await f.create({ ...f.input, appearance });
        const id = created.json<{ id: string }>().id;
        for (const value of [
          null,
          {},
          { startsOn: appearance.startsOn },
          { ...appearance, currency: 'CNY' },
          { ...appearance, priceRangeMin: 100 },
          { ...appearance, priceRangeMax: 200 },
          { ...appearance, upcomingTitle: '' },
          { ...appearance, startsOn: '2026-02-30' },
        ]) {
          expect((await f.update(id, { ...f.input, appearance: value })).statusCode).toBe(400);
          expect((await f.reread(id))?.appearance).toEqual(appearance);
        }
      });

      it('preserves legacy metadata verbatim even when the old template mapping differs', async () => {
        const f = await fixture(backend);
        const created = await f.create({ ...f.input, appearance });
        const id = created.json<{ id: string }>().id;
        const saved = await f.reread(id);
        expect(saved).toBeDefined();
        await f.offerings.save({ ...saved!, templateId: 'template-dance-private-lesson' });
        const response = await f.update(id, {
          ...f.input,
          templateId: 'template-dance-private-lesson',
          title: 'Historical ordinary edit',
        });
        expect(response.statusCode).toBe(200);
        expect((await f.reread(id))?.appearance).toEqual(appearance);
      });

      it('reads the existing scoped catalog without changing its risk or release policy', async () => {
        const f = await fixture(backend);
        const snapshot = await f.catalog.getSnapshot();
        expect(
          snapshot.templates.find((item) => item.id === 'template-commercial-appearance'),
        ).toMatchObject({
          capabilityCatalogItemId: 'capability-commercial-appearance',
          riskTier: 'review',
          releaseScope: 'established',
          status: 'active',
        });
        const created = await f.create({ ...f.input, appearance });
        expect(created.json()).toMatchObject({
          policyStatus: 'review_required',
          missingPublishConditions: [],
        });
        const publish = await f.server.inject({
          method: 'POST',
          url: `/api/v1/creator/offerings/${created.json<{ id: string }>().id}/publish`,
          headers: { authorization: f.headers.authorization },
        });
        expect(publish.statusCode).toBe(409);
        expect(publish.json()).toMatchObject({
          error: { code: 'service_offering_policy_review_required' },
        });
      });
    },
  );
}
