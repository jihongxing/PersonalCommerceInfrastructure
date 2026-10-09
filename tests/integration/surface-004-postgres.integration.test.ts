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
import { createPrivateExternalPlatformAccountService } from '../../applications/private-external-platform-account/private-external-platform-account-service.js';
import { createApiServer } from '../../apps/api/src/create-api-server.js';
import {
  createCommerceRelationship,
  createCommerceRelationshipId,
  createExternalPlatform,
  createExternalPlatformAccount,
  createExternalPlatformAccountId,
  createExternalPlatformNamespace,
  createPlatformAccountIdentifier,
} from '../../modules/identity-infrastructure/external-platform-contract.js';
import { createCommerceProfileId } from '../../modules/identity-infrastructure/identity-contract.js';

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl === undefined ? describe.skip : describe;
const clock = new FixedClock('2026-08-27T00:00:00.000Z');

describeWithDatabase('SURFACE-004 PostgreSQL integration', () => {
  let connection: PostgresDatabaseConnection;
  let membershipService: ReturnType<typeof createAccountIdentityMembershipService>;
  let privateCommerceProfileService: ReturnType<typeof createPrivateCommerceProfileService>;
  let privateExternalPlatformAccountService: ReturnType<
    typeof createPrivateExternalPlatformAccountService
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
      idGenerator: {
        generate: () => createCommerceProfileId(profileIdGenerator.generate()),
      },
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
    privateExternalPlatformAccountService = createPrivateExternalPlatformAccountService({
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

  it('verifies relationship-authorized private read, foreign denial, multiple accounts, and empty scope', async () => {
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
    await createRelatedAccount('external-a-1', 'instagram', 'studio-a', profileA1.commerceProfileId);
    await createRelatedAccount('external-a-2', 'instagram', 'brand-a', profileA2.commerceProfileId);
    await createRelatedAccount('external-b', 'tiktok', 'studio-b', profileB.commerceProfileId);
    const server = await createServer();

    const own = await server.inject({
      method: 'GET',
      url: '/api/v1/private/external-platform-accounts?identityId=identity-b&profileId=profile-b&relationshipId=relationship-b',
      headers: { authorization: 'Bearer token-a' },
    });
    expect(own.statusCode).toBe(200);
    expect(own.json()).toEqual({
      accounts: [
        {
          externalPlatformAccountId: 'external-a-1',
          platform: 'instagram',
          platformAccountId: 'studio-a',
          lifecycle: 'ACTIVE',
        },
        {
          externalPlatformAccountId: 'external-a-2',
          platform: 'instagram',
          platformAccountId: 'brand-a',
          lifecycle: 'ACTIVE',
        },
      ],
    });

    const foreign = await server.inject({
      method: 'GET',
      url: '/api/v1/private/external-platform-accounts/external-b?identityId=identity-b&profileId=profile-b&relationshipId=relationship-b',
      headers: { authorization: 'Bearer token-a' },
    });
    expect(foreign.statusCode).toBe(404);
    expect(foreign.json()).toMatchObject({
      error: { code: 'private_external_platform_account_not_found' },
    });

    const empty = await server.inject({
      method: 'GET',
      url: '/api/v1/private/external-platform-accounts',
      headers: { authorization: 'Bearer token-empty' },
    });
    expect(empty.statusCode).toBe(200);
    expect(empty.json()).toEqual({ accounts: [] });
  });

  async function createBoundIdentity(token: string): Promise<void> {
    await membershipService.createIdentityForAuthenticatedAccount(accountContext(token));
  }

  async function createRelatedAccount(
    accountId: string,
    platform: string,
    platformAccountId: string,
    commerceProfileId: string,
  ): Promise<void> {
    await accountRepository.create(
      createExternalPlatformAccount({
        externalPlatformAccountId: createExternalPlatformAccountId(accountId),
        platform: createExternalPlatform(createExternalPlatformNamespace(platform)),
        platformAccountId: createPlatformAccountIdentifier(platformAccountId),
        createdAt: clock.now(),
      }),
    );
    await relationshipRepository.create(
      createCommerceRelationship({
        commerceRelationshipId: createCommerceRelationshipId(`relationship-${accountId}`),
        externalPlatformAccountId: createExternalPlatformAccountId(accountId),
        commerceProfileId: createCommerceProfileId(commerceProfileId),
        role: 'OWNER',
        effectiveAt: clock.now(),
        createdAt: clock.now(),
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
      privateExternalPlatformAccountService,
    });
    servers.add(server);
    return server;
  }
});

function accountContext(token: string) {
  return { accountId: `test:${token}`, correlationId: `correlation-${token}` };
}
