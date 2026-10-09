import { randomUUID } from 'node:crypto';

import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { FixedClock } from '../../adapters/in-memory/fixed-clock.js';
import { PostgresAccountIdentityMembershipRepository } from '../../adapters/persistence/postgres/postgres-account-identity-membership-repository.js';
import {
  createPostgresDatabase,
  type PostgresDatabaseConnection,
} from '../../adapters/persistence/postgres/postgres-database.js';
import { PostgresIdentityRepository } from '../../adapters/persistence/postgres/postgres-identity-repository.js';
import { PostgresUnitOfWork } from '../../adapters/persistence/postgres/postgres-unit-of-work.js';
import { createSelfServiceIdentityInitializationService } from '../../applications/account-identity-membership/self-service-identity-initialization-service.js';
import type {
  AccountIdentityMembershipRepository,
} from '../../applications/account-identity-membership/account-identity-membership-repositories.js';
import type { UnitOfWork, UnitOfWorkScope } from '../../applications/core/ports/unit-of-work.js';
import { createAccountIdentityMembership } from '../../modules/account-identity-membership/account-identity-membership.js';
import { createIdentity } from '../../modules/identity/identity.js';

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl === undefined ? describe.skip : describe;
const now = '2026-08-27T00:00:00.000Z';

describeWithDatabase('Self-service Identity onboarding PostgreSQL integration', () => {
  let connection: PostgresDatabaseConnection;

  beforeAll(async () => {
    connection = createPostgresDatabase(databaseUrl as string);
    await migrate(connection.database, {
      migrationsFolder: 'database/migrations',
    });
  });

  beforeEach(async () => {
    await connection.database.execute(
      sql`truncate table identities cascade`,
    );
  });

  afterAll(async () => {
    await connection.close();
  });

  it('creates one independent ACTIVE Identity and ACTIVE OWNER binding', async () => {
    const service = createService(connection);

    const initialized = await service.initializeAuthenticatedIdentity(account('account-a'));

    expect(initialized).toMatchObject({
      status: 'ACTIVE',
      createdAt: now,
    });
    expect(initialized.identityId).not.toBe('account-a');
    await expectCounts(connection, 'account-a', 1, 1);
  });

  it('is idempotent and returns the same Identity and active binding', async () => {
    const service = createService(connection);

    const results = await Promise.all([
      service.initializeAuthenticatedIdentity(account('account-a')),
      service.initializeAuthenticatedIdentity(account('account-a')),
      service.initializeAuthenticatedIdentity(account('account-a')),
    ]);

    expect(new Set(results.map((result) => result.identityId))).toHaveLength(1);
    await expectCounts(connection, 'account-a', 1, 1);
  });

  it('concurrently initializes exactly one Identity and one active binding', async () => {
    const firstService = createService(connection);
    const secondService = createService(connection);

    const results = await Promise.all([
      firstService.initializeAuthenticatedIdentity(account('account-a')),
      secondService.initializeAuthenticatedIdentity(account('account-a')),
    ]);

    expect(new Set(results.map((result) => result.identityId))).toHaveLength(1);
    await expectCounts(connection, 'account-a', 1, 1);
  });

  it('rolls back the created Identity when binding persistence conflicts', async () => {
    const service = createService(connection, new FailingMembershipUnitOfWork(connection));

    await expect(service.initializeAuthenticatedIdentity(account('account-a'))).rejects.toThrow(
      'Binding persistence failed.',
    );

    await expectCounts(connection, 'account-a', 0, 0);
  });

  it.each(['SUSPENDED', 'REVOKED', 'HISTORICAL'] as const)(
    'fails closed for an existing %s binding',
    async (state) => {
      const identities = new PostgresIdentityRepository(connection.database);
      const memberships = new PostgresAccountIdentityMembershipRepository(connection.database);
      await identities.create(createIdentity('identity-existing', now));
      await memberships.create(
        createAccountIdentityMembership({
          membershipId: 'membership-existing',
          accountId: 'account-a',
          identityId: 'identity-existing',
          authority: 'OWNER',
          createdAt: now,
        }),
      );
      await memberships.updateState('membership-existing', state, '2026-08-27T00:00:01.000Z');
      const service = createService(connection);

      await expect(service.initializeAuthenticatedIdentity(account('account-a'))).rejects.toMatchObject({
        category: 'authorization',
        code: 'identity_onboarding_not_available',
      });

      await expectCounts(connection, 'account-a', 1, 0);
    },
  );
});

function createService(
  connection: PostgresDatabaseConnection,
  unitOfWork: UnitOfWork = new PostgresUnitOfWork(connection.database),
) {
  return createSelfServiceIdentityInitializationService({
    identityRepository: new PostgresIdentityRepository(connection.database),
    membershipRepository: new PostgresAccountIdentityMembershipRepository(connection.database),
    unitOfWork,
    identityIdGenerator: { generate: randomUUID },
    membershipIdGenerator: { generate: randomUUID },
    clock: new FixedClock(now),
  });
}

class FailingMembershipUnitOfWork implements UnitOfWork {
  public constructor(private readonly connection: PostgresDatabaseConnection) {}

  public execute<Result>(operation: (scope: UnitOfWorkScope) => Promise<Result>): Promise<Result> {
    return this.connection.database.transaction((transaction) =>
      operation({
        productEventStore: {
          append: () => Promise.resolve(),
          list: () => Promise.resolve([]),
        },
        formalIdentityRepository: new PostgresIdentityRepository(transaction),
        accountIdentityMembershipRepository: new FailingMembershipRepository(
          new PostgresAccountIdentityMembershipRepository(transaction),
        ),
      }),
    );
  }
}

class FailingMembershipRepository implements AccountIdentityMembershipRepository {
  public constructor(
    private readonly delegate: AccountIdentityMembershipRepository,
  ) {}

  public create(): Promise<void> {
    return Promise.reject(new Error('Binding persistence failed.'));
  }

  public findById(membershipId: string) {
    return this.delegate.findById(membershipId);
  }

  public findActiveByAccountAndIdentity(accountId: string, identityId: string) {
    return this.delegate.findActiveByAccountAndIdentity(accountId, identityId);
  }

  public findActiveByAccount(accountId: string) {
    return this.delegate.findActiveByAccount(accountId);
  }

  public listByIdentity(identityId: string) {
    return this.delegate.listByIdentity(identityId);
  }

  public listByAccount(accountId: string) {
    return this.delegate.listByAccount(accountId);
  }

  public countActiveOwners(identityId: string) {
    return this.delegate.countActiveOwners(identityId);
  }

  public updateState(
    membershipId: string,
    state: Parameters<AccountIdentityMembershipRepository['updateState']>[1],
    updatedAt: string,
    revokedAt?: string,
  ) {
    return this.delegate.updateState(membershipId, state, updatedAt, revokedAt);
  }
}

function account(accountId: string) {
  return {
    accountId,
    correlationId: `correlation-${accountId}`,
  };
}

async function expectCounts(
  connection: PostgresDatabaseConnection,
  accountId: string,
  expectedIdentities: number,
  expectedActiveBindings: number,
): Promise<void> {
  const identities = await connection.database.execute(sql`select identity_id from identities`);
  const bindings = await connection.database.execute(
    sql`select membership_id
        from account_identity_memberships
        where account_id = ${accountId}
          and state = 'ACTIVE'`,
  );

  expect(identities).toHaveLength(expectedIdentities);
  expect(bindings).toHaveLength(expectedActiveBindings);
}
