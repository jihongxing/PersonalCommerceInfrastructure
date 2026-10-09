import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import type { FastifyInstance } from 'fastify';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { InMemoryAuthContextProvider } from '../../adapters/auth/testing/in-memory-auth-context-provider.js';
import { FixedClock } from '../../adapters/in-memory/fixed-clock.js';
import { SequentialIdGenerator } from '../../adapters/in-memory/sequential-id-generator.js';
import { PostgresAccountIdentityMembershipRepository } from '../../adapters/persistence/postgres/postgres-account-identity-membership-repository.js';
import { PostgresCanonicalCommerceProfileRepository } from '../../adapters/persistence/postgres/postgres-canonical-commerce-profile-repository.js';
import {
  createPostgresDatabase,
  type PostgresDatabaseConnection,
} from '../../adapters/persistence/postgres/postgres-database.js';
import { PostgresIdentityRepository } from '../../adapters/persistence/postgres/postgres-identity-repository.js';
import { PostgresUnitOfWork } from '../../adapters/persistence/postgres/postgres-unit-of-work.js';
import { createAccountIdentityMembershipService } from '../../applications/account-identity-membership/account-identity-membership-service.js';
import { createCurrentUserIdentityService } from '../../applications/account-identity-membership/current-user-identity-service.js';
import { createCanonicalCommerceProfileService } from '../../applications/canonical-commerce-profile/canonical-commerce-profile-service.js';
import { createPrivateCommerceProfileService } from '../../applications/private-commerce-profile/private-commerce-profile-service.js';
import { createApiServer } from '../../apps/api/src/create-api-server.js';
import { createCommerceProfileId } from '../../modules/identity-infrastructure/identity-contract.js';

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl === undefined ? describe.skip : describe;
const clock = new FixedClock('2026-08-27T00:00:00.000Z');

describeWithDatabase('SURFACE-002 PostgreSQL integration', () => {
  let connection: PostgresDatabaseConnection;
  let membershipService: ReturnType<typeof createAccountIdentityMembershipService>;
  let profileRepository: PostgresCanonicalCommerceProfileRepository;
  let privateCommerceProfileService: ReturnType<typeof createPrivateCommerceProfileService>;
  const servers = new Set<FastifyInstance>();

  beforeAll(async () => {
    connection = createPostgresDatabase(databaseUrl as string);
    await migrate(connection.database, { migrationsFolder: 'database/migrations' });
  });

  beforeEach(async () => {
    await connection.database.execute(sql`truncate table identities cascade`);

    const identityRepository = new PostgresIdentityRepository(connection.database);
    const membershipRepository = new PostgresAccountIdentityMembershipRepository(connection.database);
    const profileIdGenerator = new SequentialIdGenerator('profile');
    profileRepository = new PostgresCanonicalCommerceProfileRepository(connection.database);
    membershipService = createAccountIdentityMembershipService({
      membershipRepository,
      unitOfWork: new PostgresUnitOfWork(connection.database),
      identityIdGenerator: new SequentialIdGenerator('identity'),
      membershipIdGenerator: new SequentialIdGenerator('membership'),
      clock,
    });
    const currentUserIdentityService = createCurrentUserIdentityService({
      identityRepository,
      membershipRepository,
    });
    privateCommerceProfileService = createPrivateCommerceProfileService({
      currentUserIdentityService,
      commerceProfileService: createCanonicalCommerceProfileService({
        repository: profileRepository,
        idGenerator: {
          generate: () => createCommerceProfileId(profileIdGenerator.generate()),
        },
        clock,
      }),
    });
  });

  afterEach(async () => {
    const activeServers = [...servers];
    servers.clear();
    await Promise.all(activeServers.map(async (server) => server.close()));
  });

  afterAll(async () => {
    await connection.close();
  });

  it('persists and rehydrates a Profile owned by the current Account Identity only', async () => {
    await createBoundIdentity('token-a');
    await createBoundIdentity('token-b');
    const server = await createServer();

    const ownerInjection = await server.inject({
      method: 'POST',
      url: '/api/v1/private/profiles',
      headers: { authorization: 'Bearer token-a' },
      payload: { displayName: 'Studio A', owningIdentityId: 'identity-2' },
    });
    expect(ownerInjection.statusCode).toBe(400);

    const created = await server.inject({
      method: 'POST',
      url: '/api/v1/private/profiles',
      headers: { authorization: 'Bearer token-a' },
      payload: { displayName: 'Studio A' },
    });
    expect(created.statusCode).toBe(201);
    const profile = readCreatedProfile(created.json());

    const rehydrated = await profileRepository.getById(
      createCommerceProfileId(profile.commerceProfileId),
    );
    expect(rehydrated).toMatchObject({
      commerceProfileId: profile.commerceProfileId,
      lifecycle: 'ACTIVE',
      presentation: { displayName: 'Studio A' },
      createdAt: '2026-08-27T00:00:00.000Z',
    });

    const updated = await server.inject({
      method: 'PATCH',
      url: `/api/v1/private/profiles/${profile.commerceProfileId}`,
      headers: { authorization: 'Bearer token-a' },
      payload: { displayName: 'Studio A Updated' },
    });
    expect(updated.statusCode).toBe(200);
    await expect(
      profileRepository.getById(createCommerceProfileId(profile.commerceProfileId)),
    ).resolves.toMatchObject({
      commerceProfileId: profile.commerceProfileId,
      presentation: { displayName: 'Studio A Updated' },
    });

    const ownList = await server.inject({
      method: 'GET',
      url: '/api/v1/private/profiles?identityId=identity-2',
      headers: { authorization: 'Bearer token-a' },
    });
    expect(ownList.statusCode).toBe(200);
    expect(ownList.json()).toMatchObject({ profiles: [{ commerceProfileId: profile.commerceProfileId }] });
  });

  it('enforces Profile lifecycle persistence and conditional concurrency at the database boundary', async () => {
    await createBoundIdentity('token-a');
    const profile = await privateCommerceProfileService.createMyCommerceProfile(accountContext('token-a'), {
      displayName: 'Studio A',
    });
    const persistedBeforeConcurrentWrites = await profileRepository.getById(
      createCommerceProfileId(profile.commerceProfileId),
    );
    if (persistedBeforeConcurrentWrites === undefined) {
      throw new Error('Expected Profile persistence before concurrent lifecycle writes.');
    }

    const results = await Promise.allSettled([
      profileRepository.updateLifecycle({
        profileId: persistedBeforeConcurrentWrites.commerceProfileId,
        expectedLifecycle: 'ACTIVE',
        expectedUpdatedAt: persistedBeforeConcurrentWrites.updatedAt,
        nextLifecycle: 'SUSPENDED',
        updatedAt: '2026-08-27T00:00:00.001Z',
      }),
      profileRepository.updateLifecycle({
        profileId: persistedBeforeConcurrentWrites.commerceProfileId,
        expectedLifecycle: 'ACTIVE',
        expectedUpdatedAt: persistedBeforeConcurrentWrites.updatedAt,
        nextLifecycle: 'ARCHIVED',
        updatedAt: '2026-08-27T00:00:00.002Z',
      }),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);

    const persisted = await profileRepository.getById(
      createCommerceProfileId(profile.commerceProfileId),
    );
    expect(['SUSPENDED', 'ARCHIVED']).toContain(persisted?.lifecycle);

    if (persisted?.lifecycle === 'SUSPENDED') {
      await expect(
        privateCommerceProfileService.reactivateMyCommerceProfile(
          accountContext('token-a'),
          profile.commerceProfileId,
        ),
      ).resolves.toMatchObject({ lifecycle: 'ACTIVE' });
    }
    if (persisted?.lifecycle === 'ARCHIVED') {
      await expect(
        privateCommerceProfileService.reactivateMyCommerceProfile(
          accountContext('token-a'),
          profile.commerceProfileId,
        ),
      ).rejects.toMatchObject({ category: 'conflict' });
    }
  });

  it('fails closed for missing bindings and cross-account Profile IDOR attempts', async () => {
    await createBoundIdentity('token-a');
    await createBoundIdentity('token-b');
    const server = await createServer();

    const created = await server.inject({
      method: 'POST',
      url: '/api/v1/private/profiles',
      headers: { authorization: 'Bearer token-b' },
      payload: { displayName: 'Studio B' },
    });
    const profileId = readCreatedProfile(created.json()).commerceProfileId;

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

    const persisted = await profileRepository.getById(createCommerceProfileId(profileId));
    expect(persisted).toMatchObject({
      lifecycle: 'ACTIVE',
      presentation: { displayName: 'Studio B' },
    });

    const missingBinding = await server.inject({
      method: 'GET',
      url: '/api/v1/private/profiles',
      headers: { authorization: 'Bearer token-unbound' },
    });
    expect(missingBinding.statusCode).toBe(403);
    expect(missingBinding.json()).toMatchObject({
      error: { code: 'active_identity_binding_not_found' },
    });
  });

  async function createBoundIdentity(token: string): Promise<void> {
    await membershipService.createIdentityForAuthenticatedAccount(accountContext(token));
  }

  async function createServer(): Promise<FastifyInstance> {
    const server = await createApiServer({
      authContextProvider: new InMemoryAuthContextProvider([
        { accessToken: 'token-a', actor: { kind: 'creator', creatorId: 'creator-a' } },
        { accessToken: 'token-b', actor: { kind: 'creator', creatorId: 'creator-b' } },
        { accessToken: 'token-unbound', actor: { kind: 'creator', creatorId: 'creator-unbound' } },
      ]),
      privateCommerceProfileService,
    });
    servers.add(server);
    return server;
  }
});

function accountContext(token: string) {
  return { accountId: `test:${token}`, correlationId: `correlation-${token}` };
}

function readCreatedProfile(value: unknown): { readonly commerceProfileId: string } {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('commerceProfileId' in value) ||
    typeof value.commerceProfileId !== 'string'
  ) {
    throw new Error('Expected a created private Commerce Profile response.');
  }

  return { commerceProfileId: value.commerceProfileId };
}
