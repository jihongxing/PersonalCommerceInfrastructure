import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createApiServer } from '../../apps/api/src/create-api-server.js';
import { createActorContext } from '../../applications/core/actor-context.js';
import { ApplicationError } from '../../applications/core/application-error.js';
import type { OperationsHumanAuthenticationRuntime } from '../../applications/operations-identity/operations-human-authentication.js';
import {
  createOperationsFlowReadService,
  type OperationsReadSource,
} from '../../applications/operations-admin/operations-flow-read-service.js';
import type { Offering } from '../../modules/service-offering/offering.js';
import type { CommerceAction } from '../../modules/customer-request/commerce-action.js';
import type {
  Capability,
  CommerceIdentity,
} from '../../modules/creator-commerce-identity/commerce-identity.js';

// In-process HTTP tests use the actual read application with explicit repository fixtures.
// The browser acceptance runner separately proves PostgreSQL + BFF + browser integration.
describe('Operations Admin Offering and Request read API', () => {
  let server: FastifyInstance;
  const times = { createdAt: '2030-01-01T00:00:00+00:00', updatedAt: '2030-01-02T00:00:00+00:00' };
  const offerings: OperationsReadSource<Offering>[] = [
    'archived',
    'draft',
    'unpublished',
    'published',
  ].map((state, index) => ({
    id: `offering-${index}`,
    creatorId: `creator-${index}`,
    capabilityIds: [`capability-${index}`],
    title: `Offering ${index}`,
    description: 'Read-only offering',
    requestInstructions: 'Submit a request',
    state: state as Offering['state'],
    policyStatus: 'approved',
    ...times,
  }));
  const identities: CommerceIdentity[] = offerings.map((offering, index) => ({
    creatorId: offering.creatorId,
    profile: {
      displayName: `Creator ${index}`,
      bio: 'private biography',
      socialLinks: ['https://private.example.test'],
    },
    capabilityIds: [],
    state: 'published',
  }));
  const capabilities: Capability[] = offerings.map((offering, index) => ({
    id: `capability-${index}`,
    creatorId: offering.creatorId,
    name: `Capability ${index}`,
    description: 'Capability',
    catalogItemId: `catalog-${index}`,
  }));
  const actions: OperationsReadSource<CommerceAction>[] = [
    'draft',
    'submitted',
    'confirmed',
    'declined',
  ].map((state, index) => ({
    id: `request-${index}`,
    creatorId: `creator-${index}`,
    customerId: `customer-${index}`,
    offeringId: `offering-${index}`,
    requestMessage: 'Private request: phone +1-555-0100',
    resultAccessToken: 'private-result-access-token',
    state: state as CommerceAction['state'],
    ...times,
  }));
  actions.push({ ...actions[0]!, id: 'request-orphan', offeringId: 'unavailable-offering' });
  actions.push({ ...actions[0]!, id: 'request-mismatch', offeringId: 'offering-1' });
  const readService = createOperationsFlowReadService({
    offeringRepository: {
      findAll: () => Promise.resolve([...offerings].reverse()),
      findById: (id) => {
        if (id === 'failure') throw new Error('Database connection unavailable');
        return Promise.resolve(offerings.find((item) => item.id === id));
      },
    },
    commerceActionRepository: {
      findAll: () => Promise.resolve([...actions].reverse()),
      findById: (id) => Promise.resolve(actions.find((item) => item.id === id)),
    },
    identityRepository: {
      findAll: () => Promise.resolve(identities),
      findById: (id) => Promise.resolve(identities.find((item) => item.creatorId === id)),
    },
    capabilityRepository: {
      findById: (id) => Promise.resolve(capabilities.find((item) => item.id === id)),
    },
    distributionAssetRepository: {
      findById: (id) =>
        Promise.resolve(
          id === 'offering-3'
            ? {
                offeringId: id,
                publicUrl: 'https://example.test/offerings/offering-3',
                state: 'distributed',
              }
            : undefined,
        ),
    },
  });
  const humanRuntime = {
    resolveActorContext({
      accessToken,
      correlationId,
    }: {
      accessToken: string;
      correlationId: string;
    }) {
      if (accessToken === 'platform')
        return Promise.resolve(createActorContext({ actor: { kind: 'platform' }, correlationId }));
      if (accessToken === 'provider')
        return Promise.resolve(
          createActorContext({
            actor: { kind: 'pilot_operations', operatorId: 'provider-service' },
            correlationId,
          }),
        );
      const policies: Record<string, string[]> = {
        offering: ['offering:read'],
        request: ['request:read'],
        catalog: ['catalog:read'],
        audit: ['audit:read'],
        unknown: ['unknown'],
        empty: [],
      };
      if (!(accessToken in policies))
        throw new ApplicationError({
          category: 'authentication',
          code: 'invalid_test_session',
          message: 'Authentication could not be verified.',
        });
      return Promise.resolve(
        createActorContext({
          actor: {
            kind: 'operations_human',
            principalId: 'p',
            accountId: 'a',
            sessionId: 's',
            permissions: policies[accessToken]!,
          },
          accountId: 'a',
          correlationId,
        }),
      );
    },
    login: () => Promise.reject(new Error('not used')),
    logout: () => Promise.reject(new Error('not used')),
  } satisfies OperationsHumanAuthenticationRuntime;

  const get = (path: string, token?: string) =>
    server.inject({
      method: 'GET',
      url: `/api/v1/operations/admin/${path}`,
      headers: {
        ...(token === undefined ? {} : { authorization: `Bearer ${token}` }),
        'x-principal-id': 'forged',
        'x-permissions': 'offering:read,request:read',
      },
    });
  beforeAll(async () => {
    server = await createApiServer({
      operationsHumanAuthenticationRuntime: humanRuntime,
      operationsFlowReadService: readService,
      rateLimitMax: 10_000,
      logger: { debug() {}, info() {}, warn() {}, error() {} },
    });
  });
  afterAll(async () => server.close());

  it.each(['offerings', 'requests', 'offerings/offering-0', 'requests/request-0'])(
    'rejects forged headers without a Session on %s',
    async (path) => {
      expect((await get(path)).statusCode).toBe(401);
    },
  );
  it.each(['offerings', 'requests'])(
    'does not accept provider or platform actors on %s',
    async (path) => {
      expect((await get(path, 'platform')).statusCode).toBe(401);
      expect((await get(path, 'provider')).statusCode).toBe(401);
    },
  );
  it.each(['catalog', 'audit', 'empty', 'unknown'])(
    'does not grant flow reads from %s permission',
    async (token) => {
      for (const path of ['offerings', 'requests', 'offerings/offering-0', 'requests/request-0'])
        expect((await get(path, token)).statusCode).toBe(403);
    },
  );
  it('keeps Offering and Request permissions independent', async () => {
    expect((await get('offerings', 'offering')).statusCode).toBe(200);
    expect((await get('requests', 'request')).statusCode).toBe(200);
    expect((await get('offerings', 'request')).statusCode).toBe(403);
    expect((await get('requests', 'offering')).statusCode).toBe(403);
  });
  it('paginates a stable Offering order and returns matching details', async () => {
    const first = await get('offerings?page=1&pageSize=2', 'offering');
    expect(first.json()).toMatchObject({
      page: 1,
      pageSize: 2,
      total: 4,
      items: [{ id: 'offering-0' }, { id: 'offering-1' }],
    });
    expect(first.headers['cache-control']).toBe('no-store');
    const second = (await get('offerings?page=2&pageSize=2', 'offering')).json<{
      items: { id: string }[];
    }>();
    expect(second.items.map((item) => item.id)).toEqual(['offering-2', 'offering-3']);
    const detail = await get('offerings/offering-0', 'offering');
    expect(detail.json()).toEqual(first.json<{ items: unknown[] }>().items[0]);
    expect(detail.json()).toMatchObject({
      createdAt: '2030-01-01T00:00:00.000Z',
      updatedAt: '2030-01-02T00:00:00.000Z',
      capabilities: [{ id: 'capability-0', catalogItemId: 'catalog-0' }],
      distribution: null,
    });
    expect(detail.body).not.toContain('private biography');
  });
  it.each(['draft', 'published', 'unpublished', 'archived'])(
    'filters actual Offering state %s',
    async (state) => {
      const result = (await get(`offerings?state=${state}`, 'offering')).json<{
        total: number;
        items: { state: string }[];
      }>();
      expect(result.total).toBe(1);
      expect(result.items[0]!.state).toBe(state);
    },
  );
  it('searches real identifiers and represents distribution only when recorded', async () => {
    expect((await get('offerings?q=CREATOR-3', 'offering')).json()).toMatchObject({
      total: 1,
      items: [{ id: 'offering-3', distribution: { state: 'distributed' } }],
    });
    expect((await get('offerings?q=absent', 'offering')).json()).toMatchObject({
      total: 0,
      items: [],
    });
  });
  it.each(['draft', 'submitted', 'confirmed', 'declined'])(
    'preserves Request state %s and only recorded Creator decisions',
    async (state) => {
      const result = (await get(`requests?state=${state}`, 'request')).json<{
        items: { id: string; creatorDecision: string }[];
      }>();
      for (const item of result.items) {
        expect(item.creatorDecision).toBe(
          ['confirmed', 'declined'].includes(state) ? state : 'not_recorded',
        );
        const detail = await get(`requests/${item.id}`, 'request');
        expect(detail.json()).toEqual(item);
        expect(detail.body).not.toContain('private-result-access-token');
        expect(detail.body).not.toContain('+1-555');
        expect(detail.json()).not.toHaveProperty('resultAccessToken');
        expect(detail.json()).not.toHaveProperty('requestMessage');
      }
    },
  );
  it('paginates Request records and preserves real associations and database timestamps', async () => {
    const result = (await get('requests?pageSize=1&page=3', 'request')).json<unknown>();
    expect(result).toMatchObject({
      total: 6,
      items: [
        {
          id: 'request-2',
          offering: { id: 'offering-2' },
          customer: { id: 'customer-2' },
          creator: { id: 'creator-2' },
          createdAt: '2030-01-01T00:00:00.000Z',
          requestContentVisibility: 'withheld',
        },
      ],
    });
    expect((await get('requests?q=customer-3', 'request')).json()).toMatchObject({
      total: 1,
      items: [{ id: 'request-3' }],
    });
  });
  it('retains incomplete or inconsistent records without inventing associations', async () => {
    for (const id of ['request-orphan', 'request-mismatch'])
      expect((await get(`requests/${id}`, 'request')).json()).toMatchObject({ id, offering: null });
  });
  it('does not disclose a Capability belonging to a different Creator', async () => {
    const original = capabilities[0]!;
    capabilities[0] = {
      ...original,
      creatorId: 'other-creator',
      name: 'private foreign capability',
    };
    try {
      const response = await get('offerings/offering-0', 'offering');
      expect(response.json()).toMatchObject({ capabilities: [{ id: 'capability-0' }] });
      expect(response.body).not.toContain('private foreign capability');
    } finally {
      capabilities[0] = original;
    }
  });
  it.each(['page=0', 'page=1.5', 'pageSize=101', 'pageSize=-1', 'state=unknown'])(
    'rejects invalid query %s',
    async (query) => {
      expect((await get(`offerings?${query}`, 'offering')).statusCode).toBe(400);
      expect((await get(`requests?${query}`, 'request')).statusCode).toBe(400);
    },
  );
  it('returns 404 for absent IDs and a visible error for repository failures', async () => {
    expect((await get('offerings/absent', 'offering')).statusCode).toBe(404);
    expect((await get('requests/absent', 'request')).statusCode).toBe(404);
    expect((await get('offerings/failure', 'offering')).statusCode).toBe(500);
  });
  it.each(['POST', 'PUT', 'PATCH', 'DELETE'] as const)(
    'does not register %s flow mutation routes',
    async (method) => {
      for (const path of ['offerings', 'offerings/offering-0', 'requests', 'requests/request-0'])
        expect(
          (
            await server.inject({
              method,
              url: `/api/v1/operations/admin/${path}`,
              headers: { authorization: 'Bearer offering' },
            })
          ).statusCode,
        ).toBe(404);
    },
  );
});
