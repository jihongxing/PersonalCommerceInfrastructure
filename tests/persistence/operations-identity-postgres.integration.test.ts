import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  createOperationsAccount,
  createOperationsAccountId,
  createOperationsHumanPrincipal,
  createOperationsHumanPrincipalId,
  createPlatformSystemId,
  createPlatformSystemPrincipal,
  createProviderId,
  createProviderServicePrincipal,
  createServicePrincipalId,
} from '../../modules/operations-identity/operations-identity-contract.js';
import {
  createPostgresDatabase,
  type PostgresDatabaseConnection,
} from '../../adapters/persistence/postgres/postgres-database.js';
import {
  PostgresOperationsAccountRepository,
  PostgresOperationsHumanPrincipalRepository,
  PostgresServicePrincipalRepository,
} from '../../adapters/persistence/postgres/postgres-operations-identity-repositories.js';
import { PostgresOperationsIdentityTransaction } from '../../adapters/persistence/postgres/postgres-operations-identity-transaction.js';

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl === undefined ? describe.skip : describe;
const createdAt = new Date('2026-11-12T10:00:00.000Z');

describeWithDatabase('Operations Identity PostgreSQL persistence', () => {
  let connection: PostgresDatabaseConnection;
  let humanPrincipals: PostgresOperationsHumanPrincipalRepository;
  let accounts: PostgresOperationsAccountRepository;
  let servicePrincipals: PostgresServicePrincipalRepository;
  let transaction: PostgresOperationsIdentityTransaction;

  beforeAll(async () => {
    connection = createPostgresDatabase(databaseUrl as string);
    await migrate(connection.database, { migrationsFolder: 'database/migrations' });
    humanPrincipals = new PostgresOperationsHumanPrincipalRepository(connection.database);
    accounts = new PostgresOperationsAccountRepository(connection.database);
    servicePrincipals = new PostgresServicePrincipalRepository(connection.database);
    transaction = new PostgresOperationsIdentityTransaction(connection.database);
  });

  beforeEach(async () => {
    await connection.database.execute(
      sql`truncate table operations_accounts, service_principals, operations_human_principals`,
    );
  });

  afterAll(async () => {
    await connection.close();
  });

  it('persists and rehydrates a Human Principal and its initial Account', async () => {
    const principal = createOperationsHumanPrincipal({
      id: createOperationsHumanPrincipalId('principal-1'),
      status: 'pending',
      securityEpoch: 0,
      createdAt,
      updatedAt: createdAt,
    });
    const account = createOperationsAccount({
      id: createOperationsAccountId('account-1'),
      principalId: principal.id,
      loginIdentifierNormalized: 'operator@example.test',
      status: 'invited',
      createdAt,
      updatedAt: createdAt,
    });

    await transaction.createHumanPrincipalWithAccount(principal, account);
    await humanPrincipals.updateStatus(
      principal.id,
      'active',
      new Date('2026-11-12T10:01:00.000Z'),
    );
    await accounts.updateStatus(account.id, 'active', new Date('2026-11-12T10:01:00.000Z'));

    await expect(humanPrincipals.findById(principal.id)).resolves.toMatchObject({
      id: principal.id,
      status: 'active',
      securityEpoch: 0,
    });
    await expect(accounts.findById(account.id)).resolves.toMatchObject({
      id: account.id,
      principalId: principal.id,
      status: 'active',
    });
    await expect(accounts.findByPrincipalId(principal.id)).resolves.toMatchObject({
      id: account.id,
    });
    await expect(
      accounts.findByNormalizedLoginIdentifier('operator@example.test'),
    ).resolves.toMatchObject({
      id: account.id,
    });
  });

  it('enforces Principal/Account uniqueness, foreign keys, lifecycle checks, and restricted deletion', async () => {
    const principal = createOperationsHumanPrincipal({
      id: createOperationsHumanPrincipalId('principal-constraints'),
      status: 'pending',
      securityEpoch: 0,
      createdAt,
      updatedAt: createdAt,
    });
    const account = createOperationsAccount({
      id: createOperationsAccountId('account-constraints'),
      principalId: principal.id,
      loginIdentifierNormalized: 'constraints@example.test',
      status: 'invited',
      createdAt,
      updatedAt: createdAt,
    });
    await humanPrincipals.create(principal);
    await accounts.create(account);

    await expect(humanPrincipals.create(principal)).rejects.toMatchObject({
      name: 'OperationsHumanPrincipalAlreadyExistsError',
    });
    await expect(
      accounts.create({ ...account, id: createOperationsAccountId('account-duplicate-principal') }),
    ).rejects.toMatchObject({ name: 'OperationsAccountAlreadyExistsError' });
    await expect(
      accounts.create({ ...account, id: createOperationsAccountId('account-duplicate-login') }),
    ).rejects.toMatchObject({ name: 'OperationsAccountAlreadyExistsError' });
    await expect(
      connection.database.execute(
        sql`insert into operations_accounts (account_id, principal_id, login_identifier_normalized, status, created_at, updated_at)
            values ('account-missing-principal', 'principal-missing', 'missing@example.test', 'invited', now(), now())`,
      ),
    ).rejects.toMatchObject({ cause: { code: '23503' } });
    await expect(
      connection.database.execute(
        sql`insert into operations_human_principals (principal_id, status, security_epoch, created_at, updated_at)
            values ('principal-invalid-status', 'invalid', 0, now(), now())`,
      ),
    ).rejects.toMatchObject({ cause: { code: '23514' } });
    await expect(
      connection.database.execute(
        sql`insert into operations_human_principals (principal_id, status, security_epoch, created_at, updated_at)
            values ('principal-negative-epoch', 'pending', -1, now(), now())`,
      ),
    ).rejects.toMatchObject({ cause: { code: '23514' } });
    await expect(
      connection.database.execute(
        sql`insert into operations_accounts (account_id, principal_id, login_identifier_normalized, status, created_at, updated_at)
            values ('account-invalid-status', 'principal-constraints', 'invalid-status@example.test', 'invalid', now(), now())`,
      ),
    ).rejects.toMatchObject({ cause: { code: '23514' } });
    await expect(
      connection.database.execute(
        sql`delete from operations_human_principals where principal_id = 'principal-constraints'`,
      ),
    ).rejects.toMatchObject({ cause: { code: '23503' } });
  });

  it('persists Provider and Platform System Service Principals with discriminator lookups', async () => {
    const provider = createProviderServicePrincipal({
      id: createServicePrincipalId('service-provider-1'),
      providerId: createProviderId('provider-1'),
      status: 'active',
      createdAt,
    });
    const system = createPlatformSystemPrincipal({
      id: createServicePrincipalId('service-system-1'),
      systemId: createPlatformSystemId('system-1'),
      status: 'active',
      createdAt,
    });

    await servicePrincipals.createProvider(provider);
    await servicePrincipals.createPlatformSystem(system);
    await servicePrincipals.updateStatus(provider.id, 'suspended');

    await expect(servicePrincipals.findById(provider.id)).resolves.toMatchObject({
      kind: 'provider_service',
      providerId: provider.providerId,
      status: 'suspended',
    });
    await expect(servicePrincipals.findByProviderId(provider.providerId)).resolves.toMatchObject({
      id: provider.id,
    });
    await expect(servicePrincipals.findBySystemId(system.systemId)).resolves.toMatchObject({
      id: system.id,
      kind: 'platform_system',
    });
    await expect(
      servicePrincipals.createProvider({
        ...provider,
        id: createServicePrincipalId('service-provider-2'),
      }),
    ).rejects.toMatchObject({
      name: 'ServicePrincipalAlreadyExistsError',
    });
    await expect(
      servicePrincipals.createPlatformSystem({
        ...system,
        id: createServicePrincipalId('service-system-2'),
      }),
    ).rejects.toMatchObject({
      name: 'ServicePrincipalAlreadyExistsError',
    });
  });

  it('rejects invalid Service Principal discriminator rows and invalid statuses', async () => {
    await expect(
      connection.database.execute(
        sql`insert into service_principals (service_principal_id, kind, provider_id, system_id, status, created_at)
            values ('service-invalid-kind', 'provider_service', null, 'system-invalid', 'active', now())`,
      ),
    ).rejects.toMatchObject({ cause: { code: '23514' } });
    await expect(
      connection.database.execute(
        sql`insert into service_principals (service_principal_id, kind, provider_id, system_id, status, created_at)
            values ('service-invalid-status', 'platform_system', null, 'system-invalid', 'invalid', now())`,
      ),
    ).rejects.toMatchObject({ cause: { code: '23514' } });
    await expect(
      connection.database.execute(
        sql`insert into service_principals (service_principal_id, kind, provider_id, system_id, status, created_at)
            values ('service-invalid-platform', 'platform_system', 'provider-invalid', null, 'active', now())`,
      ),
    ).rejects.toMatchObject({ cause: { code: '23514' } });
  });

  it('serializes concurrent uniqueness races and rolls back combined creation', async () => {
    const principalA = createOperationsHumanPrincipal({
      id: createOperationsHumanPrincipalId('principal-race-a'),
      status: 'pending',
      securityEpoch: 0,
      createdAt,
      updatedAt: createdAt,
    });
    const principalB = createOperationsHumanPrincipal({
      id: createOperationsHumanPrincipalId('principal-race-b'),
      status: 'pending',
      securityEpoch: 0,
      createdAt,
      updatedAt: createdAt,
    });
    await Promise.all([humanPrincipals.create(principalA), humanPrincipals.create(principalB)]);
    const accountA = createOperationsAccount({
      id: createOperationsAccountId('account-race-a'),
      principalId: principalA.id,
      loginIdentifierNormalized: 'race@example.test',
      status: 'invited',
      createdAt,
      updatedAt: createdAt,
    });
    const accountB = createOperationsAccount({
      id: createOperationsAccountId('account-race-b'),
      principalId: principalB.id,
      loginIdentifierNormalized: 'race@example.test',
      status: 'invited',
      createdAt,
      updatedAt: createdAt,
    });
    const raceResults = await Promise.allSettled([
      accounts.create(accountA),
      accounts.create(accountB),
    ]);
    expect(raceResults.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(raceResults.filter((result) => result.status === 'rejected')).toHaveLength(1);

    const conflicting = createOperationsAccount({
      id: createOperationsAccountId('account-existing'),
      principalId: principalA.id,
      loginIdentifierNormalized: 'existing@example.test',
      status: 'invited',
      createdAt,
      updatedAt: createdAt,
    });
    await accounts.create(conflicting);
    const rollbackPrincipal = createOperationsHumanPrincipal({
      id: createOperationsHumanPrincipalId('principal-rollback'),
      status: 'pending',
      securityEpoch: 0,
      createdAt,
      updatedAt: createdAt,
    });
    const rollbackAccount = createOperationsAccount({
      id: createOperationsAccountId('account-rollback'),
      principalId: rollbackPrincipal.id,
      loginIdentifierNormalized: 'existing@example.test',
      status: 'invited',
      createdAt,
      updatedAt: createdAt,
    });
    await expect(
      transaction.createHumanPrincipalWithAccount(rollbackPrincipal, rollbackAccount),
    ).rejects.toMatchObject({ name: 'OperationsAccountAlreadyExistsError' });
    await expect(humanPrincipals.findById(rollbackPrincipal.id)).resolves.toBeUndefined();
  });
});
