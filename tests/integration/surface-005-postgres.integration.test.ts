import type { FastifyInstance } from 'fastify';
import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { InMemoryAuthContextProvider } from '../../adapters/auth/testing/in-memory-auth-context-provider.js';
import { FixedClock } from '../../adapters/in-memory/fixed-clock.js';
import { SequentialIdGenerator } from '../../adapters/in-memory/sequential-id-generator.js';
import { PostgresAccountIdentityMembershipRepository } from '../../adapters/persistence/postgres/postgres-account-identity-membership-repository.js';
import { PostgresCanonicalCommerceProfileRepository } from '../../adapters/persistence/postgres/postgres-canonical-commerce-profile-repository.js';
import { PostgresCommerceRelationshipRepository } from '../../adapters/persistence/postgres/postgres-commerce-relationship-repository.js';
import { createPostgresDatabase, type PostgresDatabaseConnection } from '../../adapters/persistence/postgres/postgres-database.js';
import { PostgresExternalPlatformAccountRepository } from '../../adapters/persistence/postgres/postgres-external-platform-account-repository.js';
import { PostgresIdentityRepository } from '../../adapters/persistence/postgres/postgres-identity-repository.js';
import { PostgresUnitOfWork } from '../../adapters/persistence/postgres/postgres-unit-of-work.js';
import { createAccountIdentityMembershipService } from '../../applications/account-identity-membership/account-identity-membership-service.js';
import { createCurrentUserIdentityService } from '../../applications/account-identity-membership/current-user-identity-service.js';
import { createCanonicalCommerceProfileService } from '../../applications/canonical-commerce-profile/canonical-commerce-profile-service.js';
import { createPrivateCommerceProfileService } from '../../applications/private-commerce-profile/private-commerce-profile-service.js';
import {
  createPrivateCommerceRelationshipService,
  type PrivateCommerceRelationshipView,
} from '../../applications/private-commerce-relationship/private-commerce-relationship-service.js';
import { createApiServer } from '../../apps/api/src/create-api-server.js';
import {
  createCommerceRelationshipId,
  createExternalPlatform,
  createExternalPlatformAccount,
  createExternalPlatformAccountId,
  createExternalPlatformNamespace,
  createPlatformAccountIdentifier,
  rehydrateCommerceRelationship,
} from '../../modules/identity-infrastructure/external-platform-contract.js';
import { createCommerceProfileId } from '../../modules/identity-infrastructure/identity-contract.js';

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl === undefined ? describe.skip : describe;
const clock = new FixedClock('2026-08-27T00:00:00.000Z');
type PrivateCommerceRelationshipListResponse = {
  readonly relationships: readonly PrivateCommerceRelationshipView[];
};

describeWithDatabase('SURFACE-005 PostgreSQL integration', () => {
  let connection: PostgresDatabaseConnection;
  let membershipService: ReturnType<typeof createAccountIdentityMembershipService>;
  let privateCommerceProfileService: ReturnType<typeof createPrivateCommerceProfileService>;
  let privateCommerceRelationshipService: ReturnType<
    typeof createPrivateCommerceRelationshipService
  >;
  let accountRepository: PostgresExternalPlatformAccountRepository;
  let relationshipRepository: PostgresCommerceRelationshipRepository;
  const servers = new Set<FastifyInstance>();

  beforeAll(async () => {
    connection = createPostgresDatabase(databaseUrl as string);
    await migrate(connection.database, { migrationsFolder: 'database/migrations' });
  });

  beforeEach(async () => {
    await connection.database.execute(sql`truncate table identities cascade`);
    const identityRepository = new PostgresIdentityRepository(connection.database);
    const membershipRepository = new PostgresAccountIdentityMembershipRepository(connection.database);
    const profileRepository = new PostgresCanonicalCommerceProfileRepository(connection.database);
    accountRepository = new PostgresExternalPlatformAccountRepository(connection.database);
    relationshipRepository = new PostgresCommerceRelationshipRepository(connection.database);
    const profileIdGenerator = new SequentialIdGenerator('profile');
    const commerceProfileService = createCanonicalCommerceProfileService({
      repository: profileRepository,
      idGenerator: { generate: () => createCommerceProfileId(profileIdGenerator.generate()) },
      clock,
    });
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
      commerceProfileService,
    });
    privateCommerceRelationshipService = createPrivateCommerceRelationshipService({
      currentUserIdentityService,
      commerceProfileService,
      commerceRelationshipRepository: relationshipRepository,
      externalPlatformAccountRepository: accountRepository,
    });
  });

  afterEach(async () => {
    await Promise.all([...servers].map(async (server) => server.close()));
    servers.clear();
  });

  afterAll(async () => {
    await connection.close();
  });

  it('verifies owned relationship history, multiple profiles, foreign denial, and empty scope', async () => {
    await createBoundIdentity('token-a');
    await createBoundIdentity('token-b');
    await createBoundIdentity('token-empty');
    const profileA1 = await privateCommerceProfileService.createMyCommerceProfile(
      accountContext('token-a'),
      { displayName: 'Studio A' },
    );
    const profileA2 = await privateCommerceProfileService.createMyCommerceProfile(
      accountContext('token-a'),
      { displayName: 'Brand A' },
    );
    const profileB = await privateCommerceProfileService.createMyCommerceProfile(
      accountContext('token-b'),
      { displayName: 'Studio B' },
    );
    await createRelationship('relationship-a-history', 'external-a', 'instagram', 'studio-a', profileA1.commerceProfileId, 'HISTORICAL', 'MANAGER', '2026-08-25T00:00:00.000Z');
    await createRelationshipForExistingAccount(
      'relationship-a-active',
      'external-a',
      profileA1.commerceProfileId,
      'ACTIVE',
      'OWNER',
      '2026-08-26T00:00:00.000Z',
    );
    await createRelationship('relationship-a-brand', 'external-a-brand', 'tiktok', 'brand-a', profileA2.commerceProfileId, 'ACTIVE', 'DELEGATED_MANAGER', clock.now());
    await createRelationship('relationship-b', 'external-b', 'instagram', 'studio-b', profileB.commerceProfileId, 'ACTIVE', 'OWNER', clock.now());
    const server = await createServer();

    const own = await server.inject({
      method: 'GET',
      url: '/api/v1/private/commerce-relationships',
      headers: { authorization: 'Bearer token-a' },
    });
    expect(own.statusCode).toBe(200);
    expect(own.json<PrivateCommerceRelationshipListResponse>().relationships).toMatchObject([
      { relationshipId: 'relationship-a-history', lifecycle: 'HISTORICAL', profile: { displayName: 'Studio A' } },
      { relationshipId: 'relationship-a-active', lifecycle: 'ACTIVE', profile: { displayName: 'Studio A' } },
      { relationshipId: 'relationship-a-brand', lifecycle: 'ACTIVE', profile: { displayName: 'Brand A' } },
    ]);

    const sameAccountHistory = await server.inject({
      method: 'GET',
      url: '/api/v1/private/commerce-relationships?externalPlatformAccountId=external-a',
      headers: { authorization: 'Bearer token-a' },
    });
    expect(sameAccountHistory.statusCode).toBe(200);
    expect(
      sameAccountHistory.json<PrivateCommerceRelationshipListResponse>().relationships,
    ).toMatchObject([
      { relationshipId: 'relationship-a-history', lifecycle: 'HISTORICAL' },
      { relationshipId: 'relationship-a-active', lifecycle: 'ACTIVE' },
    ]);

    const foreign = await server.inject({
      method: 'GET',
      url: '/api/v1/private/commerce-relationships/relationship-b',
      headers: { authorization: 'Bearer token-a' },
    });
    expect(foreign.statusCode).toBe(404);
    expect(foreign.json()).toMatchObject({
      error: { code: 'private_commerce_relationship_not_found' },
    });

    const empty = await server.inject({
      method: 'GET',
      url: '/api/v1/private/commerce-relationships',
      headers: { authorization: 'Bearer token-empty' },
    });
    expect(empty.statusCode).toBe(200);
    expect(empty.json()).toEqual({ relationships: [] });
  });

  async function createBoundIdentity(token: string): Promise<void> {
    await membershipService.createIdentityForAuthenticatedAccount(accountContext(token));
  }

  async function createRelationship(
    relationshipId: string,
    externalPlatformAccountId: string,
    platform: string,
    platformAccountId: string,
    commerceProfileId: string,
    lifecycle: 'ACTIVE' | 'HISTORICAL',
    role: 'OWNER' | 'MANAGER' | 'DELEGATED_MANAGER',
    effectiveAt: string,
  ): Promise<void> {
    await accountRepository.create(
      createExternalPlatformAccount({
        externalPlatformAccountId: createExternalPlatformAccountId(externalPlatformAccountId),
        platform: createExternalPlatform(createExternalPlatformNamespace(platform)),
        platformAccountId: createPlatformAccountIdentifier(platformAccountId),
        createdAt: clock.now(),
      }),
    );
    await relationshipRepository.create(
      rehydrateCommerceRelationship({
        commerceRelationshipId: createCommerceRelationshipId(relationshipId),
        externalPlatformAccountId: createExternalPlatformAccountId(externalPlatformAccountId),
        commerceProfileId: createCommerceProfileId(commerceProfileId),
        role,
        lifecycle,
        effectiveAt,
        createdAt: clock.now(),
        updatedAt: clock.now(),
      }),
    );
  }

  async function createRelationshipForExistingAccount(
    relationshipId: string,
    externalPlatformAccountId: string,
    commerceProfileId: string,
    lifecycle: 'ACTIVE' | 'HISTORICAL',
    role: 'OWNER' | 'MANAGER' | 'DELEGATED_MANAGER',
    effectiveAt: string,
  ): Promise<void> {
    await relationshipRepository.create(
      rehydrateCommerceRelationship({
        commerceRelationshipId: createCommerceRelationshipId(relationshipId),
        externalPlatformAccountId: createExternalPlatformAccountId(externalPlatformAccountId),
        commerceProfileId: createCommerceProfileId(commerceProfileId),
        role,
        lifecycle,
        effectiveAt,
        createdAt: clock.now(),
        updatedAt: clock.now(),
      }),
    );
  }

  async function createServer(): Promise<FastifyInstance> {
    const server = await createApiServer({
      authContextProvider: new InMemoryAuthContextProvider([
        { accessToken: 'token-a', actor: { kind: 'creator', creatorId: 'creator-a' } },
        { accessToken: 'token-b', actor: { kind: 'creator', creatorId: 'creator-b' } },
        { accessToken: 'token-empty', actor: { kind: 'creator', creatorId: 'creator-empty' } },
      ]),
      privateCommerceRelationshipService,
    });
    servers.add(server);
    return server;
  }
});

function accountContext(token: string) {
  return { accountId: `test:${token}`, correlationId: `correlation-${token}` };
}
