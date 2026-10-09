import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import type { FastifyInstance } from 'fastify';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { InMemoryAuthContextProvider } from '../../adapters/auth/testing/in-memory-auth-context-provider.js';
import { FixedClock } from '../../adapters/in-memory/fixed-clock.js';
import { SequentialIdGenerator } from '../../adapters/in-memory/sequential-id-generator.js';
import { PostgresAccountIdentityMembershipRepository } from '../../adapters/persistence/postgres/postgres-account-identity-membership-repository.js';
import { PostgresCanonicalCommerceProfileRepository } from '../../adapters/persistence/postgres/postgres-canonical-commerce-profile-repository.js';
import { PostgresCanonicalCommerceReferenceRepository } from '../../adapters/persistence/postgres/postgres-canonical-commerce-reference-repository.js';
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
import { createPrivateCommerceReferenceService } from '../../applications/private-commerce-reference/private-commerce-reference-service.js';
import { createApiServer } from '../../apps/api/src/create-api-server.js';
import { createCommerceReference } from '../../modules/identity-infrastructure/commerce-reference-contract.js';
import { createCommerceProfileId } from '../../modules/identity-infrastructure/identity-contract.js';

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl === undefined ? describe.skip : describe;
const clock = new FixedClock('2026-08-27T00:00:00.000Z');

describeWithDatabase('SURFACE-003 PostgreSQL integration', () => {
  let connection: PostgresDatabaseConnection;
  let membershipService: ReturnType<typeof createAccountIdentityMembershipService>;
  let privateCommerceProfileService: ReturnType<typeof createPrivateCommerceProfileService>;
  let privateCommerceReferenceService: ReturnType<typeof createPrivateCommerceReferenceService>;
  let referenceRepository: PostgresCanonicalCommerceReferenceRepository;
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
    referenceRepository = new PostgresCanonicalCommerceReferenceRepository(connection.database);
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
    privateCommerceReferenceService = createPrivateCommerceReferenceService({
      currentUserIdentityService,
      commerceProfileService,
      commerceReferenceRepository: referenceRepository,
    });
  });

  afterEach(async () => {
    await Promise.all([...servers].map(async (server) => server.close()));
    servers.clear();
  });

  afterAll(async () => {
    await connection.close();
  });

  it('verifies owner-only C号 view, profile-without-reference empty state, and cross-account denial', async () => {
    await createBoundIdentity('token-a');
    await createBoundIdentity('token-b');
    const profileA = await privateCommerceProfileService.createMyCommerceProfile(accountContext('token-a'), {
      displayName: 'Studio A',
    });
    const profileB = await privateCommerceProfileService.createMyCommerceProfile(accountContext('token-b'), {
      displayName: 'Studio B',
    });
    await referenceRepository.assign({
      commerceReference: createCommerceReference('3C7M4Q9RDFHJKNTWVY'),
      commerceProfileId: createCommerceProfileId(profileA.commerceProfileId),
      assignedAt: clock.now(),
    });
    const server = await createServer();

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

    const notAssigned = await server.inject({
      method: 'GET',
      url: `/api/v1/private/profiles/${profileB.commerceProfileId}/reference`,
      headers: { authorization: 'Bearer token-b' },
    });
    expect(notAssigned.statusCode).toBe(200);
    expect(notAssigned.json()).toEqual({ assignmentStatus: 'NOT_ASSIGNED' });

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

  async function createBoundIdentity(token: string): Promise<void> {
    await membershipService.createIdentityForAuthenticatedAccount(accountContext(token));
  }

  async function createServer(): Promise<FastifyInstance> {
    const server = await createApiServer({
      authContextProvider: new InMemoryAuthContextProvider([
        { accessToken: 'token-a', actor: { kind: 'creator', creatorId: 'creator-a' } },
        { accessToken: 'token-b', actor: { kind: 'creator', creatorId: 'creator-b' } },
      ]),
      privateCommerceProfileService,
      privateCommerceReferenceService,
    });
    servers.add(server);
    return server;
  }
});

function accountContext(token: string) {
  return { accountId: `test:${token}`, correlationId: `correlation-${token}` };
}
