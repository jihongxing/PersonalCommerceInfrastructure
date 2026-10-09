import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';

import { InMemoryAccountIdentityMembershipRepository } from '../../adapters/in-memory/in-memory-account-identity-membership-repository.js';
import { InMemoryCanonicalCommerceProfileRepository } from '../../adapters/in-memory/in-memory-canonical-commerce-profile-repository.js';
import { InMemoryCanonicalCommerceReferenceRepository } from '../../adapters/in-memory/in-memory-canonical-commerce-reference-repository.js';
import { InMemoryIdentityRepository } from '../../adapters/in-memory/in-memory-identity-repository.js';
import { InMemoryProductEventStore } from '../../adapters/in-memory/in-memory-product-event-store.js';
import { InMemoryUnitOfWork } from '../../adapters/in-memory/in-memory-unit-of-work.js';
import { FixedClock } from '../../adapters/in-memory/fixed-clock.js';
import { SequentialIdGenerator } from '../../adapters/in-memory/sequential-id-generator.js';
import { InMemoryAuthContextProvider } from '../../adapters/auth/testing/in-memory-auth-context-provider.js';
import { createAccountIdentityMembershipService } from '../../applications/account-identity-membership/account-identity-membership-service.js';
import { createCurrentUserIdentityService } from '../../applications/account-identity-membership/current-user-identity-service.js';
import { createCanonicalCommerceProfileService } from '../../applications/canonical-commerce-profile/canonical-commerce-profile-service.js';
import { createPrivateCommerceProfileService } from '../../applications/private-commerce-profile/private-commerce-profile-service.js';
import { createPrivateCommerceReferenceService } from '../../applications/private-commerce-reference/private-commerce-reference-service.js';
import { createApiServer } from '../../apps/api/src/create-api-server.js';
import { createCommerceReference } from '../../modules/identity-infrastructure/commerce-reference-contract.js';
import { createCommerceProfileId } from '../../modules/identity-infrastructure/identity-contract.js';

const accountA = { accountId: 'test:token-a', correlationId: 'correlation-a' };
const accountB = { accountId: 'test:token-b', correlationId: 'correlation-b' };

function setup() {
  const identityRepository = new InMemoryIdentityRepository();
  const membershipRepository = new InMemoryAccountIdentityMembershipRepository();
  const unitOfWork = new InMemoryUnitOfWork(
    [identityRepository, membershipRepository],
    new InMemoryProductEventStore(),
    {
      formalIdentityRepository: identityRepository,
      accountIdentityMembershipRepository: membershipRepository,
    },
  );
  const membershipService = createAccountIdentityMembershipService({
    membershipRepository,
    unitOfWork,
    identityIdGenerator: new SequentialIdGenerator('identity'),
    membershipIdGenerator: new SequentialIdGenerator('membership'),
    clock: new FixedClock('2026-08-27T00:00:00.000Z'),
  });
  const profileRepository = new InMemoryCanonicalCommerceProfileRepository({
    exists: async (identityId) => (await identityRepository.findById(identityId)) !== undefined,
  });
  const referenceRepository = new InMemoryCanonicalCommerceReferenceRepository(profileRepository);
  const commerceProfileService = createCanonicalCommerceProfileService({
    repository: profileRepository,
    idGenerator: {
      generate: () => createCommerceProfileId(`profile-${Math.random().toString(16).slice(2)}`),
    },
    clock: new FixedClock('2026-08-27T00:00:00.000Z'),
  });
  const currentUserIdentityService = createCurrentUserIdentityService({
    identityRepository,
    membershipRepository,
  });

  return {
    membershipService,
    commerceProfileService,
    referenceRepository,
    privateCommerceProfileService: createPrivateCommerceProfileService({
      currentUserIdentityService,
      commerceProfileService,
    }),
    privateCommerceReferenceService: createPrivateCommerceReferenceService({
      currentUserIdentityService,
      commerceProfileService,
      commerceReferenceRepository: referenceRepository,
    }),
  };
}

describe('Private Commerce Reference API', () => {
  const servers = new Set<FastifyInstance>();

  afterEach(async () => {
    await Promise.all([...servers].map(async (server) => server.close()));
    servers.clear();
  });

  it('returns an owned reference, preserves canonical/display values, and fails closed for a foreign Profile', async () => {
    const {
      membershipService,
      privateCommerceProfileService,
      privateCommerceReferenceService,
      referenceRepository,
    } = setup();
    await membershipService.createIdentityForAuthenticatedAccount(accountA);
    await membershipService.createIdentityForAuthenticatedAccount(accountB);
    const profileA = await privateCommerceProfileService.createMyCommerceProfile(accountA, {
      displayName: 'Studio A',
    });
    const profileB = await privateCommerceProfileService.createMyCommerceProfile(accountB, {
      displayName: 'Studio B',
    });
    await referenceRepository.assign({
      commerceReference: createCommerceReference('3C7M4Q9RDFHJKNTWVY'),
      commerceProfileId: createCommerceProfileId(profileA.commerceProfileId),
      assignedAt: '2026-08-27T00:00:00.000Z',
    });
    await referenceRepository.assign({
      commerceReference: createCommerceReference('4C7M4Q9RDFHJKNTWVY'),
      commerceProfileId: createCommerceProfileId(profileB.commerceProfileId),
      assignedAt: '2026-08-27T00:00:00.000Z',
    });

    const server = await createServer({
      privateCommerceProfileService,
      privateCommerceReferenceService,
    });

    const own = await server.inject({
      method: 'GET',
      url: `/api/v1/private/profiles/${profileA.commerceProfileId}/reference?identityId=identity-2`,
      headers: { authorization: 'Bearer token-a' },
    });
    expect(own.statusCode).toBe(200);
    expect(own.json()).toEqual({
      assignmentStatus: 'ASSIGNED',
      commerceReference: '3C7M4Q9RDFHJKNTWVY',
      displayValue: '3C7M4Q-9RDFHJ-KNTWVY',
    });

    const foreign = await server.inject({
      method: 'GET',
      url: `/api/v1/private/profiles/${profileB.commerceProfileId}/reference`,
      headers: { authorization: 'Bearer token-a' },
    });
    expect(foreign.statusCode).toBe(404);
    expect(foreign.json()).toMatchObject({
      error: { code: 'private_commerce_profile_not_found' },
    });
  });

  it('returns NOT_ASSIGNED for an owned Profile without creating a C号', async () => {
    const {
      membershipService,
      privateCommerceProfileService,
      privateCommerceReferenceService,
      referenceRepository,
    } = setup();
    await membershipService.createIdentityForAuthenticatedAccount(accountA);
    const profile = await privateCommerceProfileService.createMyCommerceProfile(accountA, {
      displayName: 'No C号',
    });
    const server = await createServer({
      privateCommerceProfileService,
      privateCommerceReferenceService,
    });

    const response = await server.inject({
      method: 'GET',
      url: `/api/v1/private/profiles/${profile.commerceProfileId}/reference`,
      headers: { authorization: 'Bearer token-a' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ assignmentStatus: 'NOT_ASSIGNED' });
    await expect(
      referenceRepository.getByProfileId(createCommerceProfileId(profile.commerceProfileId)),
    ).resolves.toBeUndefined();
  });

  async function createServer(services: {
    readonly privateCommerceProfileService: ReturnType<typeof createPrivateCommerceProfileService>;
    readonly privateCommerceReferenceService: ReturnType<typeof createPrivateCommerceReferenceService>;
  }): Promise<FastifyInstance> {
    const server = await createApiServer({
      authContextProvider: new InMemoryAuthContextProvider([
        { accessToken: 'token-a', actor: { kind: 'creator', creatorId: 'creator-a' } },
        { accessToken: 'token-b', actor: { kind: 'creator', creatorId: 'creator-b' } },
      ]),
      ...services,
    });
    servers.add(server);
    return server;
  }
});
