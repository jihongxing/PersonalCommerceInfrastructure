import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';

import { InMemoryAuthContextProvider } from '../../adapters/auth/testing/in-memory-auth-context-provider.js';
import { FixedClock } from '../../adapters/in-memory/fixed-clock.js';
import { InMemoryAccountIdentityMembershipRepository } from '../../adapters/in-memory/in-memory-account-identity-membership-repository.js';
import { InMemoryIdentityRepository } from '../../adapters/in-memory/in-memory-identity-repository.js';
import { InMemoryProductEventStore } from '../../adapters/in-memory/in-memory-product-event-store.js';
import { InMemoryUnitOfWork } from '../../adapters/in-memory/in-memory-unit-of-work.js';
import { SequentialIdGenerator } from '../../adapters/in-memory/sequential-id-generator.js';
import { createAccountIdentityMembershipService } from '../../applications/account-identity-membership/account-identity-membership-service.js';
import { createCurrentUserIdentityService } from '../../applications/account-identity-membership/current-user-identity-service.js';
import { createSelfServiceIdentityInitializationService } from '../../applications/account-identity-membership/self-service-identity-initialization-service.js';
import { createApiServer } from '../../apps/api/src/create-api-server.js';

const activeServers = new Set<FastifyInstance>();

afterEach(async () => {
  const servers = [...activeServers];
  activeServers.clear();
  await Promise.all(servers.map(async (server) => server.close()));
});

async function createPrivateIdentityTestServer(): Promise<FastifyInstance> {
  const identityRepository = new InMemoryIdentityRepository();
  const membershipRepository = new InMemoryAccountIdentityMembershipRepository();
  const eventStore = new InMemoryProductEventStore();
  const membershipService = createAccountIdentityMembershipService({
    membershipRepository,
    unitOfWork: new InMemoryUnitOfWork(
      [identityRepository, membershipRepository, eventStore],
      eventStore,
      {
        formalIdentityRepository: identityRepository,
        accountIdentityMembershipRepository: membershipRepository,
      },
    ),
    identityIdGenerator: new SequentialIdGenerator('identity'),
    membershipIdGenerator: new SequentialIdGenerator('membership'),
    clock: new FixedClock('2026-08-27T00:00:00.000Z'),
  });
  await membershipService.createIdentityForAuthenticatedAccount({
    accountId: 'test:token-a',
    correlationId: 'seed-account-a',
  });
  const initializationService = createSelfServiceIdentityInitializationService({
    identityRepository,
    membershipRepository,
    unitOfWork: new InMemoryUnitOfWork(
      [identityRepository, membershipRepository, eventStore],
      eventStore,
      {
        formalIdentityRepository: identityRepository,
        accountIdentityMembershipRepository: membershipRepository,
      },
    ),
    identityIdGenerator: new SequentialIdGenerator('onboarding-identity'),
    membershipIdGenerator: new SequentialIdGenerator('onboarding-membership'),
    clock: new FixedClock('2026-08-27T00:00:00.000Z'),
  });
  await membershipService.createIdentityForAuthenticatedAccount({
    accountId: 'test:token-b',
    correlationId: 'seed-account-b',
  });

  const server = await createApiServer({
    authContextProvider: new InMemoryAuthContextProvider([
      {
        accessToken: 'token-a',
        actor: { kind: 'creator', creatorId: 'creator-a' },
      },
      {
        accessToken: 'token-b',
        actor: { kind: 'creator', creatorId: 'creator-b' },
      },
      {
        accessToken: 'token-unbound',
        actor: { kind: 'creator', creatorId: 'creator-unbound' },
      },
    ]),
    currentUserIdentityService: createCurrentUserIdentityService({
      identityRepository,
      membershipRepository,
    }),
    selfServiceIdentityInitializationService: initializationService,
  });
  activeServers.add(server);
  return server;
}

describe('Private Identity API', () => {
  it('initializes the current authenticated Account and returns the same Identity on retry', async () => {
    const server = await createPrivateIdentityTestServer();

    const first = await server.inject({
      method: 'POST',
      url: '/api/v1/private/onboarding/initialize?accountId=test:token-b&identityId=identity-attacker',
      headers: { authorization: 'Bearer token-unbound' },
    });
    const second = await server.inject({
      method: 'POST',
      url: '/api/v1/private/onboarding/initialize',
      headers: { authorization: 'Bearer token-unbound' },
    });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(first.json()).toEqual(second.json());
    expect(first.json()).toMatchObject({
      identityId: 'onboarding-identity-1',
      status: 'ACTIVE',
    });
  });

  it('rejects a client body instead of accepting caller-selected onboarding targets', async () => {
    const server = await createPrivateIdentityTestServer();

    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/private/onboarding/initialize',
      headers: {
        authorization: 'Bearer token-unbound',
        'content-type': 'application/json',
      },
      payload: {
        accountId: 'test:token-b',
        identityId: 'identity-attacker',
        ownerIdentityId: 'identity-attacker',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: { code: 'request_validation_failed' } });
  });

  it('requires authentication for onboarding initialization', async () => {
    const server = await createPrivateIdentityTestServer();

    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/private/onboarding/initialize',
    });

    expect(response.statusCode).toBe(401);
  });

  it('returns only the authenticated Account binding target and ignores an arbitrary identityId', async () => {
    const server = await createPrivateIdentityTestServer();

    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/private/identity?identityId=identity-2',
      headers: { authorization: 'Bearer token-a' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      identityId: 'identity-1',
      status: 'ACTIVE',
      createdAt: '2026-08-27T00:00:00.000Z',
    });
  });

  it('fails closed for an authenticated Account without an active Identity binding', async () => {
    const server = await createPrivateIdentityTestServer();

    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/private/identity',
      headers: { authorization: 'Bearer token-unbound' },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      error: {
        category: 'authorization',
        code: 'active_identity_binding_not_found',
      },
    });
  });
});
