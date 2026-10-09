import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import type { FastifyInstance } from 'fastify';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { InMemoryAuthContextProvider } from '../../adapters/auth/testing/in-memory-auth-context-provider.js';
import { FixedClock } from '../../adapters/in-memory/fixed-clock.js';
import { SequentialIdGenerator } from '../../adapters/in-memory/sequential-id-generator.js';
import { PostgresAccountIdentityMembershipRepository } from '../../adapters/persistence/postgres/postgres-account-identity-membership-repository.js';
import {
  createPostgresDatabase,
  type PostgresDatabaseConnection,
} from '../../adapters/persistence/postgres/postgres-database.js';
import { PostgresIdentityRepository } from '../../adapters/persistence/postgres/postgres-identity-repository.js';
import { PostgresUnitOfWork } from '../../adapters/persistence/postgres/postgres-unit-of-work.js';
import { createAccountIdentityMembershipService } from '../../applications/account-identity-membership/account-identity-membership-service.js';
import { createCurrentUserIdentityService } from '../../applications/account-identity-membership/current-user-identity-service.js';
import { createApiServer } from '../../apps/api/src/create-api-server.js';
import {
  createAccountIdentityMembership,
  transitionAccountIdentityMembership,
} from '../../modules/account-identity-membership/account-identity-membership.js';
import { createIdentity } from '../../modules/identity/identity.js';

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl === undefined ? describe.skip : describe;
const clock = new FixedClock('2026-08-27T00:00:00.000Z');

describeWithDatabase('SURFACE-001 PostgreSQL integration', () => {
  let connection: PostgresDatabaseConnection;
  let identityRepository: PostgresIdentityRepository;
  let membershipRepository: PostgresAccountIdentityMembershipRepository;
  let service: ReturnType<typeof createAccountIdentityMembershipService>;
  let currentUserIdentityService: ReturnType<typeof createCurrentUserIdentityService>;
  const servers = new Set<FastifyInstance>();

  beforeAll(async () => {
    connection = createPostgresDatabase(databaseUrl as string);
    await migrate(connection.database, { migrationsFolder: 'database/migrations' });
  });

  beforeEach(async () => {
    await connection.database.execute(sql`truncate table identities cascade`);
    identityRepository = new PostgresIdentityRepository(connection.database);
    membershipRepository = new PostgresAccountIdentityMembershipRepository(connection.database);
    service = createAccountIdentityMembershipService({
      membershipRepository,
      unitOfWork: new PostgresUnitOfWork(connection.database),
      identityIdGenerator: new SequentialIdGenerator('identity'),
      membershipIdGenerator: new SequentialIdGenerator('membership'),
      clock,
    });
    currentUserIdentityService = createCurrentUserIdentityService({
      identityRepository,
      membershipRepository,
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

  it('creates and rehydrates an Internal Identity plus ACTIVE OWNER binding', async () => {
    const created = await service.createIdentityForAuthenticatedAccount(accountContext('account-a'));

    await expect(identityRepository.findById(created.identity.identityId)).resolves.toMatchObject({
      identityId: created.identity.identityId,
      lifecycle: 'ACTIVE',
    });
    await expect(membershipRepository.findActiveByAccount('account-a')).resolves.toMatchObject({
      membershipId: created.membership.membershipId,
      accountId: 'account-a',
      identityId: created.identity.identityId,
      authority: 'OWNER',
      state: 'ACTIVE',
    });
    await expect(currentUserIdentityService.getCurrentIdentity(accountContext('account-a'))).resolves.toEqual(
      {
        identityId: created.identity.identityId,
        status: 'ACTIVE',
        createdAt: '2026-08-27T00:00:00.000Z',
      },
    );
  });

  it('rolls back Identity persistence when Binding persistence fails in the PostgreSQL transaction', async () => {
    await service.createIdentityForAuthenticatedAccount(accountContext('duplicate-account'));

    await expect(
      new PostgresUnitOfWork(connection.database).execute(async (scope) => {
        await scope.formalIdentityRepository?.create(
          createIdentity('orphan-identity-must-rollback', clock.now()),
        );
        await scope.accountIdentityMembershipRepository?.create(
          createAccountIdentityMembership({
            membershipId: 'duplicate-binding-must-fail',
            accountId: 'duplicate-account',
            identityId: 'orphan-identity-must-rollback',
            authority: 'OWNER',
            createdAt: clock.now(),
          }),
        );
      }),
    ).rejects.toMatchObject({ name: 'AccountIdentityMembershipAlreadyExistsError' });

    await expect(identityRepository.findById('orphan-identity-must-rollback')).resolves.toBeUndefined();
    await expect(membershipRepository.listByAccount('duplicate-account')).resolves.toHaveLength(1);
  });

  it('allows only one concurrent initial onboarding winner and leaves no orphan Identity', async () => {
    const results = await Promise.allSettled([
      service.createIdentityForAuthenticatedAccount(accountContext('concurrent-account')),
      service.createIdentityForAuthenticatedAccount(accountContext('concurrent-account')),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled').length).toBeGreaterThanOrEqual(1);
    await expect(membershipRepository.listByAccount('concurrent-account')).resolves.toHaveLength(1);
    const identities = await connection.database.execute(
      sql`select identity_id from identities order by identity_id`,
    );
    expect(identities).toHaveLength(1);
    const successfulIdentities: string[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        successfulIdentities.push(result.value.identity.identityId);
      }
    }
    expect(
      successfulIdentities.every(
        (identityId) => identityId === successfulIdentities[0],
      ),
    ).toBe(true);
  });

  it('enforces the active Account uniqueness constraint at the database boundary', async () => {
    const created = await service.createIdentityForAuthenticatedAccount(accountContext('unique-account'));
    await identityRepository.create(createIdentity('second-identity', clock.now()));

    await expect(
      membershipRepository.create(
        createAccountIdentityMembership({
          membershipId: 'second-active-binding',
          accountId: 'unique-account',
          identityId: 'second-identity',
          authority: 'OWNER',
          createdAt: clock.now(),
        }),
      ),
    ).rejects.toMatchObject({ name: 'AccountIdentityMembershipAlreadyExistsError' });

    await expect(membershipRepository.findActiveByAccount('unique-account')).resolves.toMatchObject({
      identityId: created.identity.identityId,
    });
  });

  it('persists valid lifecycle transitions and rejects invalid transitions through the canonical contract', async () => {
    const first = await service.createIdentityForAuthenticatedAccount(accountContext('lifecycle-account-a'));
    await membershipRepository.create(
      createAccountIdentityMembership({
        membershipId: 'lifecycle-account-b-binding',
        accountId: 'lifecycle-account-b',
        identityId: first.identity.identityId,
        authority: 'OWNER',
        createdAt: clock.now(),
      }),
    );

    const suspended = await service.suspendMembership(
      accountContext('lifecycle-account-a'),
      first.membership.membershipId,
    );
    expect(suspended.state).toBe('SUSPENDED');
    const reactivated = await service.reactivateMembership(
      accountContext('lifecycle-account-b'),
      first.membership.membershipId,
    );
    expect(reactivated.state).toBe('ACTIVE');
    const revoked = await service.revokeMembership(
      accountContext('lifecycle-account-b'),
      first.membership.membershipId,
    );
    const historical = transitionAccountIdentityMembership(revoked, 'HISTORICAL', clock.now());
    await membershipRepository.updateState(
      historical.membershipId,
      historical.state,
      historical.updatedAt,
      historical.revokedAt,
    );

    await expect(membershipRepository.findById(first.membership.membershipId)).resolves.toMatchObject({
      state: 'HISTORICAL',
      revokedAt: '2026-08-27T00:00:00.000Z',
    });
    expect(() => transitionAccountIdentityMembership(historical, 'ACTIVE', clock.now())).toThrow();
    expect(() => transitionAccountIdentityMembership(revoked, 'ACTIVE', clock.now())).toThrow();
  });

  it('returns only the authenticated Account Identity through the private API and fails closed without a binding', async () => {
    const accountA = await service.createIdentityForAuthenticatedAccount(accountContext('test:token-a'));
    const accountB = await service.createIdentityForAuthenticatedAccount(accountContext('test:token-b'));
    const server = await createApiServer({
      authContextProvider: new InMemoryAuthContextProvider([
        { accessToken: 'token-a', actor: { kind: 'creator', creatorId: 'creator-a' } },
        { accessToken: 'token-b', actor: { kind: 'creator', creatorId: 'creator-b' } },
        { accessToken: 'token-unbound', actor: { kind: 'creator', creatorId: 'creator-unbound' } },
      ]),
      currentUserIdentityService,
    });
    servers.add(server);

    const own = await server.inject({
      method: 'GET',
      url: `/api/v1/private/identity?identityId=${accountB.identity.identityId}`,
      headers: { authorization: 'Bearer token-a' },
    });
    const repeated = await server.inject({
      method: 'GET',
      url: '/api/v1/private/identity',
      headers: { authorization: 'Bearer token-a' },
    });
    const missing = await server.inject({
      method: 'GET',
      url: '/api/v1/private/identity',
      headers: { authorization: 'Bearer token-unbound' },
    });

    expect(own.statusCode).toBe(200);
    expect(own.json()).toEqual({
      identityId: accountA.identity.identityId,
      status: 'ACTIVE',
      createdAt: '2026-08-27T00:00:00.000Z',
    });
    expect(repeated.json()).toEqual(own.json());
    expect(missing.statusCode).toBe(403);
    expect(missing.json()).toMatchObject({
      error: { category: 'authorization', code: 'active_identity_binding_not_found' },
    });
  });
});

function accountContext(accountId: string) {
  return { accountId, correlationId: `correlation-${accountId}` };
}
