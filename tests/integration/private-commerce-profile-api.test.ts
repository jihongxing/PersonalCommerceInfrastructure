import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';

import { InMemoryAuthContextProvider } from '../../adapters/auth/testing/in-memory-auth-context-provider.js';
import { InMemoryAccountIdentityMembershipRepository } from '../../adapters/in-memory/in-memory-account-identity-membership-repository.js';
import { InMemoryCanonicalCommerceProfileRepository } from '../../adapters/in-memory/in-memory-canonical-commerce-profile-repository.js';
import { InMemoryCanonicalCommerceReferenceRepository } from '../../adapters/in-memory/in-memory-canonical-commerce-reference-repository.js';
import { FixedClock } from '../../adapters/in-memory/fixed-clock.js';
import { InMemoryIdentityRepository } from '../../adapters/in-memory/in-memory-identity-repository.js';
import { InMemoryProductEventStore } from '../../adapters/in-memory/in-memory-product-event-store.js';
import { InMemoryUnitOfWork } from '../../adapters/in-memory/in-memory-unit-of-work.js';
import { SequentialIdGenerator } from '../../adapters/in-memory/sequential-id-generator.js';
import { createAccountIdentityMembershipService } from '../../applications/account-identity-membership/account-identity-membership-service.js';
import { createCurrentUserIdentityService } from '../../applications/account-identity-membership/current-user-identity-service.js';
import { createCanonicalCommerceProfileService } from '../../applications/canonical-commerce-profile/canonical-commerce-profile-service.js';
import { createPrivateCommerceProfileService } from '../../applications/private-commerce-profile/private-commerce-profile-service.js';
import { createCommerceProfileId } from '../../modules/identity-infrastructure/identity-contract.js';
import { createCommerceReference } from '../../modules/identity-infrastructure/commerce-reference-contract.js';
import { createApiServer } from '../../apps/api/src/create-api-server.js';

const activeServers = new Set<FastifyInstance>();

interface PrivateCommerceProfileResponse {
  readonly commerceProfileId: string;
  readonly displayName: string;
  readonly lifecycle: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  readonly commerceReference: string;
  readonly commerceReferenceDisplayValue: string;
}

afterEach(async () => {
  const servers = [...activeServers];
  activeServers.clear();
  await Promise.all(servers.map(async (server) => server.close()));
});

async function createPrivateCommerceProfileTestServer(): Promise<FastifyInstance> {
  const identityRepository = new InMemoryIdentityRepository();
  const membershipRepository = new InMemoryAccountIdentityMembershipRepository();
  const membershipService = createAccountIdentityMembershipService({
    membershipRepository,
    unitOfWork: new InMemoryUnitOfWork(
      [identityRepository, membershipRepository],
      new InMemoryProductEventStore(),
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
    correlationId: 'seed-a',
  });
  await membershipService.createIdentityForAuthenticatedAccount({
    accountId: 'test:token-b',
    correlationId: 'seed-b',
  });

  const currentUserIdentityService = createCurrentUserIdentityService({
    identityRepository,
    membershipRepository,
  });
  const profileRepository = new InMemoryCanonicalCommerceProfileRepository({
    exists: async (identityId) => (await identityRepository.findById(identityId)) !== undefined,
  });
  const referenceRepository = new InMemoryCanonicalCommerceReferenceRepository(profileRepository);
  let profileIndex = 0;
  let referenceIndex = 0;
  const privateCommerceProfileService = createPrivateCommerceProfileService({
    currentUserIdentityService,
    commerceProfileService: createCanonicalCommerceProfileService({
      repository: profileRepository,
      idGenerator: {
        generate: () => createCommerceProfileId(`profile-${profileIndex++}`),
      },
      clock: new FixedClock('2026-08-27T00:00:00.000Z'),
    }),
    commerceProfileIdGenerator: {
      generate: () => createCommerceProfileId(`private-profile-${profileIndex++}`),
    },
    commerceReferenceGenerator: {
      generate: () =>
        createCommerceReference(
          referenceIndex++ === 0 ? '3C7M4Q9RDFHJKNTWVY' : '4C7M4Q9RDFHJKNTWVY',
        ),
    },
    clock: new FixedClock('2026-08-27T00:00:00.000Z'),
    unitOfWork: new InMemoryUnitOfWork(
      [identityRepository, membershipRepository, profileRepository, referenceRepository],
      new InMemoryProductEventStore(),
      {
        formalIdentityRepository: identityRepository,
        accountIdentityMembershipRepository: membershipRepository,
        commerceProfileRepository: profileRepository,
        commerceReferenceRepository: referenceRepository,
      },
    ),
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
    currentUserIdentityService,
    privateCommerceProfileService,
  });
  activeServers.add(server);
  return server;
}

describe('Private Commerce Profile API', () => {
  it('manages only the authenticated Account owned Profile through explicit DTO fields', async () => {
    const server = await createPrivateCommerceProfileTestServer();

    const rejectedOwnerInjection = await server.inject({
      method: 'POST',
      url: '/api/v1/private/profiles',
      headers: { authorization: 'Bearer token-a' },
      payload: { displayName: 'Studio A', owningIdentityId: 'identity-2' },
    });
    expect(rejectedOwnerInjection.statusCode).toBe(400);

    const created = await server.inject({
      method: 'POST',
      url: '/api/v1/private/profiles',
      headers: { authorization: 'Bearer token-a' },
      payload: { displayName: 'Studio A' },
    });
    expect(created.statusCode).toBe(201);
    const profile = readPrivateCommerceProfile(created.json());
    expect(profile).toMatchObject({
      displayName: 'Studio A',
      lifecycle: 'ACTIVE',
      commerceReference: '3C7M4Q9RDFHJKNTWVY',
      commerceReferenceDisplayValue: '3C7M4Q-9RDFHJ-KNTWVY',
    });
    expect(profile).not.toHaveProperty('owningIdentityId');

    const listed = await server.inject({
      method: 'GET',
      url: '/api/v1/private/profiles?identityId=identity-2',
      headers: { authorization: 'Bearer token-a' },
    });
    expect(listed.statusCode).toBe(200);
    expect(listed.json()).toMatchObject({
      profiles: [
        {
          commerceProfileId: profile.commerceProfileId,
          displayName: 'Studio A',
          lifecycle: 'ACTIVE',
        },
      ],
    });

    const updated = await server.inject({
      method: 'PATCH',
      url: `/api/v1/private/profiles/${profile.commerceProfileId}`,
      headers: { authorization: 'Bearer token-a' },
      payload: { displayName: 'Studio A Updated' },
    });
    expect(updated.statusCode).toBe(200);
    expect(updated.json()).toMatchObject({ displayName: 'Studio A Updated' });

    const suspended = await server.inject({
      method: 'POST',
      url: `/api/v1/private/profiles/${profile.commerceProfileId}/suspend`,
      headers: { authorization: 'Bearer token-a' },
    });
    expect(suspended.statusCode).toBe(200);
    expect(suspended.json()).toMatchObject({ lifecycle: 'SUSPENDED' });

    const reactivated = await server.inject({
      method: 'POST',
      url: `/api/v1/private/profiles/${profile.commerceProfileId}/reactivate`,
      headers: { authorization: 'Bearer token-a' },
    });
    expect(reactivated.statusCode).toBe(200);
    expect(reactivated.json()).toMatchObject({ lifecycle: 'ACTIVE' });

    const archived = await server.inject({
      method: 'POST',
      url: `/api/v1/private/profiles/${profile.commerceProfileId}/archive`,
      headers: { authorization: 'Bearer token-a' },
    });
    expect(archived.statusCode).toBe(200);
    expect(archived.json()).toMatchObject({ lifecycle: 'ARCHIVED' });

    const deniedReactivation = await server.inject({
      method: 'POST',
      url: `/api/v1/private/profiles/${profile.commerceProfileId}/reactivate`,
      headers: { authorization: 'Bearer token-a' },
    });
    expect(deniedReactivation.statusCode).toBe(409);
  });

  it('rejects client-selected ownership and Commerce Reference fields', async () => {
    const server = await createPrivateCommerceProfileTestServer();

    for (const payload of [
      { displayName: 'Injected', ownerIdentityId: 'identity-2' },
      { displayName: 'Injected', identityId: 'identity-2' },
      { displayName: 'Injected', accountId: 'test:token-b' },
      { displayName: 'Injected', commerceReference: '4C7M4Q9RDFHJKNTWVY' },
    ]) {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/private/profiles',
        headers: { authorization: 'Bearer token-a' },
        payload,
      });
      expect(response.statusCode).toBe(400);
    }
  });

  it('fails closed for foreign Profile reads, updates, and lifecycle mutations', async () => {
    const server = await createPrivateCommerceProfileTestServer();
    const created = await server.inject({
      method: 'POST',
      url: '/api/v1/private/profiles',
      headers: { authorization: 'Bearer token-b' },
      payload: { displayName: 'Studio B' },
    });
    const profileId = readPrivateCommerceProfile(created.json()).commerceProfileId;

    for (const request of [
      { method: 'GET' as const, url: `/api/v1/private/profiles/${profileId}` },
      {
        method: 'PATCH' as const,
        url: `/api/v1/private/profiles/${profileId}`,
        payload: { displayName: 'Compromised' },
      },
      { method: 'POST' as const, url: `/api/v1/private/profiles/${profileId}/suspend` },
      { method: 'POST' as const, url: `/api/v1/private/profiles/${profileId}/archive` },
    ]) {
      const response = await server.inject({
        ...request,
        headers: { authorization: 'Bearer token-a' },
      });
      expect(response.statusCode).toBe(404);
      expect(response.json()).toMatchObject({
        error: { code: 'private_commerce_profile_not_found' },
      });
    }

    const ownRead = await server.inject({
      method: 'GET',
      url: `/api/v1/private/profiles/${profileId}`,
      headers: { authorization: 'Bearer token-b' },
    });
    expect(ownRead.statusCode).toBe(200);
    expect(ownRead.json()).toMatchObject({
      displayName: 'Studio B',
      lifecycle: 'ACTIVE',
    });
  });

  it('fails closed for an authenticated Account without an active Identity binding', async () => {
    const server = await createPrivateCommerceProfileTestServer();

    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/private/profiles',
      headers: { authorization: 'Bearer token-unbound' },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      error: { code: 'active_identity_binding_not_found' },
    });
  });
});

function readPrivateCommerceProfile(value: unknown): PrivateCommerceProfileResponse {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('commerceProfileId' in value) ||
    !('displayName' in value) ||
    !('lifecycle' in value) ||
    !('commerceReference' in value) ||
    !('commerceReferenceDisplayValue' in value) ||
    typeof value.commerceProfileId !== 'string' ||
    typeof value.displayName !== 'string' ||
    !['ACTIVE', 'SUSPENDED', 'ARCHIVED'].includes(String(value.lifecycle)) ||
    typeof value.commerceReference !== 'string' ||
    typeof value.commerceReferenceDisplayValue !== 'string'
  ) {
    throw new Error('Expected a private Commerce Profile API response.');
  }

  return {
    commerceProfileId: value.commerceProfileId,
    displayName: value.displayName,
    lifecycle: value.lifecycle as PrivateCommerceProfileResponse['lifecycle'],
    commerceReference: value.commerceReference,
    commerceReferenceDisplayValue: value.commerceReferenceDisplayValue,
  };
}
