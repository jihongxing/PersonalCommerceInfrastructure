import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  createOperationsAccount,
  createOperationsAccountId,
  createOperationsCredentialId,
  createOperationsHumanPrincipal,
  createOperationsHumanPrincipalId,
} from '../../modules/operations-identity/operations-identity-contract.js';
import {
  createEncodedPasswordVerifier,
  OperationsCredentialAlreadyExistsError,
  OperationsCredentialNotFoundError,
  OperationsCredentialVersionConflictError,
} from '../../applications/operations-identity/operations-credential-repositories.js';
import {
  createPostgresDatabase,
  type PostgresDatabaseConnection,
} from '../../adapters/persistence/postgres/postgres-database.js';
import { PostgresOperationsCredentialRepository } from '../../adapters/persistence/postgres/postgres-operations-credential-repository.js';
import { PostgresOperationsHumanPrincipalRepository } from '../../adapters/persistence/postgres/postgres-operations-identity-repositories.js';

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl === undefined ? describe.skip : describe;
const createdAt = new Date('2026-11-13T10:00:00.000Z');

describeWithDatabase('Operations credential PostgreSQL persistence', () => {
  let connection: PostgresDatabaseConnection;
  let principals: PostgresOperationsHumanPrincipalRepository;
  let credentials: PostgresOperationsCredentialRepository;

  beforeAll(async () => {
    connection = createPostgresDatabase(databaseUrl as string);
    await migrate(connection.database, { migrationsFolder: 'database/migrations' });
    principals = new PostgresOperationsHumanPrincipalRepository(connection.database);
    credentials = new PostgresOperationsCredentialRepository(connection.database);
  });

  beforeEach(async () => {
    await resetCredentialTables();
  });

  afterAll(async () => {
    await connection.close();
  });

  it('creates the initial version and rehydrates only bounded verifier data', async () => {
    const account = await createAccount('initial');
    const verifier = createEncodedPasswordVerifier('encoded-verifier-v1');
    const record = await credentials.createPasswordCredential({
      id: createOperationsCredentialId('credential-initial'),
      accountId: account.id,
      verifier,
      createdAt,
    });

    expect(record.metadata).toMatchObject({
      id: 'credential-initial',
      accountId: account.id,
      kind: 'password',
      status: 'active',
      version: 1,
    });
    expect(record.verifier).toBe(verifier);
    await expect(credentials.findActivePasswordByAccountId(account.id)).resolves.toMatchObject({
      metadata: { version: 1, status: 'active' },
      verifier,
    });
    expect('password' in record.metadata).toBe(false);
    expect('passwordHash' in record.metadata).toBe(false);
  });

  it('exposes one active credential, retains revoked history, and rejects terminal mutation', async () => {
    const account = await createAccount('lifecycle');
    await credentials.createPasswordCredential({
      id: createOperationsCredentialId('credential-lifecycle-1'),
      accountId: account.id,
      verifier: createEncodedPasswordVerifier('verifier-lifecycle-1'),
      createdAt,
    });
    await expect(
      credentials.createPasswordCredential({
        id: createOperationsCredentialId('credential-lifecycle-2'),
        accountId: account.id,
        verifier: createEncodedPasswordVerifier('verifier-lifecycle-2'),
        createdAt,
      }),
    ).rejects.toMatchObject({
      name: 'OperationsCredentialAlreadyExistsError',
      conflict: 'active_password',
    });
    await expect(
      connection.database.execute(
        sql`UPDATE operations_credentials SET verifier = 'changed' WHERE account_id = ${account.id}`,
      ),
    ).rejects.toMatchObject({ cause: { code: 'P0001' } });

    await credentials.revokeActivePasswordCredential({
      accountId: account.id,
      expectedVersion: 1,
      revokedAt: new Date('2026-11-13T10:01:00.000Z'),
    });
    await expect(credentials.findActivePasswordByAccountId(account.id)).resolves.toBeUndefined();

    const history = await connection.database.execute<{ status: string; verifier: string }>(sql`
      SELECT status, verifier
      FROM operations_credentials
      WHERE account_id = ${account.id}
    `);
    expect(history).toEqual([{ status: 'revoked', verifier: 'verifier-lifecycle-1' }]);
    expect('delete' in credentials).toBe(false);

    await expect(
      connection.database.execute(sql`
        INSERT INTO operations_credentials
          (credential_id, account_id, kind, status, verifier, version, created_at, updated_at, revoked_at)
        VALUES ('credential-lifecycle-duplicate-version', ${account.id}, 'password', 'revoked', 'other', 1, now(), now(), now())
      `),
    ).rejects.toMatchObject({ cause: { code: '23514' } });

    await expect(
      connection.database.execute(
        sql`UPDATE operations_credentials SET status = 'active', revoked_at = NULL WHERE account_id = ${account.id}`,
      ),
    ).rejects.toMatchObject({ cause: { code: 'P0001' } });
    await expect(
      connection.database.execute(
        sql`DELETE FROM operations_credentials WHERE account_id = ${account.id}`,
      ),
    ).rejects.toMatchObject({ cause: { code: 'P0001' } });
    await expect(
      connection.database.execute(sql`TRUNCATE operations_credentials`),
    ).rejects.toMatchObject({ cause: { code: 'P0001' } });
  });

  it('creates the next historical version after all prior credentials are revoked', async () => {
    const account = await createAccount('all-revoked');
    await credentials.createPasswordCredential({
      id: createOperationsCredentialId('credential-all-revoked-1'),
      accountId: account.id,
      verifier: createEncodedPasswordVerifier('verifier-all-revoked-1'),
      createdAt,
    });
    await credentials.revokeActivePasswordCredential({
      accountId: account.id,
      expectedVersion: 1,
      revokedAt: new Date('2026-11-13T10:06:00.000Z'),
    });
    const second = await credentials.createPasswordCredential({
      id: createOperationsCredentialId('credential-all-revoked-2'),
      accountId: account.id,
      verifier: createEncodedPasswordVerifier('verifier-all-revoked-2'),
      createdAt: new Date('2026-11-13T10:07:00.000Z'),
    });
    expect(second.metadata.version).toBe(2);
    await credentials.revokeActivePasswordCredential({
      accountId: account.id,
      expectedVersion: 2,
      revokedAt: new Date('2026-11-13T10:08:00.000Z'),
    });
    const third = await credentials.createPasswordCredential({
      id: createOperationsCredentialId('credential-all-revoked-3'),
      accountId: account.id,
      verifier: createEncodedPasswordVerifier('verifier-all-revoked-3'),
      createdAt: new Date('2026-11-13T10:09:00.000Z'),
    });
    expect(third.metadata.version).toBe(3);
  });

  it('uses account row locks and expected versions for atomic replacement', async () => {
    const account = await createAccount('replacement');
    await credentials.createPasswordCredential({
      id: createOperationsCredentialId('credential-replacement-1'),
      accountId: account.id,
      verifier: createEncodedPasswordVerifier('verifier-replacement-1'),
      createdAt,
    });

    const replacement = await credentials.replaceActivePasswordCredential({
      id: createOperationsCredentialId('credential-replacement-2'),
      accountId: account.id,
      expectedVersion: 1,
      verifier: createEncodedPasswordVerifier('verifier-replacement-2'),
      replacedAt: new Date('2026-11-13T10:02:00.000Z'),
    });
    expect(replacement.metadata).toMatchObject({ version: 2, status: 'active' });

    await expect(
      credentials.replaceActivePasswordCredential({
        id: createOperationsCredentialId('credential-replacement-stale'),
        accountId: account.id,
        expectedVersion: 1,
        verifier: createEncodedPasswordVerifier('verifier-replacement-stale'),
        replacedAt: new Date('2026-11-13T10:03:00.000Z'),
      }),
    ).rejects.toBeInstanceOf(OperationsCredentialVersionConflictError);

    const concurrent = await Promise.allSettled([
      credentials.replaceActivePasswordCredential({
        id: createOperationsCredentialId('credential-replacement-race-a'),
        accountId: account.id,
        expectedVersion: 2,
        verifier: createEncodedPasswordVerifier('verifier-replacement-race-a'),
        replacedAt: new Date('2026-11-13T10:04:00.000Z'),
      }),
      credentials.replaceActivePasswordCredential({
        id: createOperationsCredentialId('credential-replacement-race-b'),
        accountId: account.id,
        expectedVersion: 2,
        verifier: createEncodedPasswordVerifier('verifier-replacement-race-b'),
        replacedAt: new Date('2026-11-13T10:04:01.000Z'),
      }),
    ]);
    expect(concurrent.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(concurrent.filter((result) => result.status === 'rejected')).toHaveLength(1);
    const rejected = concurrent.find((result) => result.status === 'rejected');
    expect(rejected?.status === 'rejected' ? rejected.reason : undefined).toBeInstanceOf(
      OperationsCredentialVersionConflictError,
    );
  });

  it('rolls back revocation when replacement insertion fails and never leaks a verifier in errors', async () => {
    const account = await createAccount('rollback');
    const verifier = 'rollback-secret-verifier';
    await credentials.createPasswordCredential({
      id: createOperationsCredentialId('credential-rollback-1'),
      accountId: account.id,
      verifier: createEncodedPasswordVerifier(verifier),
      createdAt,
    });

    let error: unknown;
    try {
      await credentials.replaceActivePasswordCredential({
        id: createOperationsCredentialId('credential-rollback-1'),
        accountId: account.id,
        expectedVersion: 1,
        verifier: createEncodedPasswordVerifier(verifier),
        replacedAt: new Date('2026-11-13T10:05:00.000Z'),
      });
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(OperationsCredentialAlreadyExistsError);
    expect(String(error)).not.toContain(verifier);
    await expect(credentials.findActivePasswordByAccountId(account.id)).resolves.toMatchObject({
      metadata: { status: 'active', version: 1 },
      verifier,
    });
  });

  it('enforces the Account foreign key and positive/version/lifecycle constraints', async () => {
    await expect(
      connection.database.execute(sql`
        INSERT INTO operations_credentials
          (credential_id, account_id, kind, status, verifier, version, created_at, updated_at)
        VALUES ('credential-missing-account', 'account-missing', 'password', 'active', 'v', 1, now(), now())
      `),
    ).rejects.toMatchObject({ cause: { code: '23503' } });

    const account = await createAccount('constraints');
    for (const [credentialId, verifier] of [
      ['credential-empty-verifier', ''],
      ['credential-whitespace-verifier', '  \t  '],
    ]) {
      await expect(
        connection.database.execute(sql`
          INSERT INTO operations_credentials
            (credential_id, account_id, kind, status, verifier, version, created_at, updated_at)
          VALUES (${credentialId}, ${account.id}, 'password', 'active', ${verifier}, 1, now(), now())
        `),
      ).rejects.toMatchObject({ cause: { code: '23514' } });
    }
    await expect(
      connection.database.execute(sql`
        INSERT INTO operations_credentials
          (credential_id, account_id, kind, status, verifier, version, created_at, updated_at)
        VALUES ('credential-invalid-version', ${account.id}, 'password', 'active', 'v', 0, now(), now())
      `),
    ).rejects.toMatchObject({ cause: { code: '23514' } });
    await credentials.createPasswordCredential({
      id: createOperationsCredentialId('credential-sequence-base'),
      accountId: account.id,
      verifier: createEncodedPasswordVerifier('sequence-base'),
      createdAt,
    });
    await expect(
      connection.database.execute(sql`
        INSERT INTO operations_credentials
          (credential_id, account_id, kind, status, verifier, version, created_at, updated_at, revoked_at)
        VALUES ('credential-version-jump', ${account.id}, 'password', 'revoked', 'jump', 3, now(), now(), now())
      `),
    ).rejects.toMatchObject({ cause: { code: '23514' } });
    await expect(
      connection.database.execute(sql`
        INSERT INTO operations_credentials
          (credential_id, account_id, kind, status, verifier, version, created_at, updated_at, revoked_at)
        VALUES ('credential-version-duplicate', ${account.id}, 'password', 'revoked', 'duplicate', 1, now(), now(), now())
      `),
    ).rejects.toMatchObject({ cause: { code: '23514' } });
    await expect(
      connection.database.execute(sql`
        INSERT INTO operations_credentials
          (credential_id, account_id, kind, status, verifier, version, created_at, updated_at, revoked_at)
        VALUES ('credential-invalid-state', ${account.id}, 'password', 'active', 'v', 1, now(), now(), now())
      `),
    ).rejects.toMatchObject({ cause: { code: '23514' } });
  });

  it('reports missing active credentials and serializes concurrent initial creation', async () => {
    const account = await createAccount('missing');
    await expect(
      credentials.revokeActivePasswordCredential({
        accountId: account.id,
        expectedVersion: 1,
        revokedAt: createdAt,
      }),
    ).rejects.toBeInstanceOf(OperationsCredentialNotFoundError);

    const results = await Promise.allSettled([
      credentials.createPasswordCredential({
        id: createOperationsCredentialId('credential-create-race-a'),
        accountId: account.id,
        verifier: createEncodedPasswordVerifier('verifier-create-race-a'),
        createdAt,
      }),
      credentials.createPasswordCredential({
        id: createOperationsCredentialId('credential-create-race-b'),
        accountId: account.id,
        verifier: createEncodedPasswordVerifier('verifier-create-race-b'),
        createdAt,
      }),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    const rejected = results.find((result) => result.status === 'rejected');
    expect(rejected?.status === 'rejected' ? rejected.reason : undefined).toBeInstanceOf(
      OperationsCredentialAlreadyExistsError,
    );
  });

  it('serializes Replace versus Create and concurrent recreation after all history is revoked', async () => {
    const account = await createAccount('concurrent-next');
    await credentials.createPasswordCredential({
      id: createOperationsCredentialId('credential-concurrent-next-1'),
      accountId: account.id,
      verifier: createEncodedPasswordVerifier('concurrent-next-1'),
      createdAt,
    });

    const replaceAndCreate = await Promise.allSettled([
      credentials.replaceActivePasswordCredential({
        id: createOperationsCredentialId('credential-concurrent-next-replace'),
        accountId: account.id,
        expectedVersion: 1,
        verifier: createEncodedPasswordVerifier('concurrent-next-replace'),
        replacedAt: new Date('2026-11-13T10:10:00.000Z'),
      }),
      credentials.createPasswordCredential({
        id: createOperationsCredentialId('credential-concurrent-next-create'),
        accountId: account.id,
        verifier: createEncodedPasswordVerifier('concurrent-next-create'),
        createdAt: new Date('2026-11-13T10:10:01.000Z'),
      }),
    ]);
    expect(replaceAndCreate.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(replaceAndCreate.filter((result) => result.status === 'rejected')).toHaveLength(1);

    await credentials.revokeActivePasswordCredential({
      accountId: account.id,
      expectedVersion: 2,
      revokedAt: new Date('2026-11-13T10:11:00.000Z'),
    });
    const concurrentRecreation = await Promise.allSettled([
      credentials.createPasswordCredential({
        id: createOperationsCredentialId('credential-concurrent-recreate-a'),
        accountId: account.id,
        verifier: createEncodedPasswordVerifier('concurrent-recreate-a'),
        createdAt: new Date('2026-11-13T10:12:00.000Z'),
      }),
      credentials.createPasswordCredential({
        id: createOperationsCredentialId('credential-concurrent-recreate-b'),
        accountId: account.id,
        verifier: createEncodedPasswordVerifier('concurrent-recreate-b'),
        createdAt: new Date('2026-11-13T10:12:01.000Z'),
      }),
    ]);
    expect(concurrentRecreation.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(concurrentRecreation.filter((result) => result.status === 'rejected')).toHaveLength(1);
    const recreated = concurrentRecreation.find((result) => result.status === 'fulfilled');
    expect(recreated?.status === 'fulfilled' ? recreated.value.metadata.version : undefined).toBe(
      3,
    );
    const recreationRejected = concurrentRecreation.find((result) => result.status === 'rejected');
    expect(
      recreationRejected?.status === 'rejected' ? recreationRejected.reason : undefined,
    ).toBeInstanceOf(OperationsCredentialAlreadyExistsError);
  });

  async function createAccount(suffix: string) {
    const principal = createOperationsHumanPrincipal({
      id: createOperationsHumanPrincipalId(`credential-principal-${suffix}`),
      status: 'active',
      securityEpoch: 0,
      createdAt,
      updatedAt: createdAt,
    });
    const account = createOperationsAccount({
      id: createOperationsAccountId(`credential-account-${suffix}`),
      principalId: principal.id,
      loginIdentifierNormalized: `${suffix}@operations.example.test`,
      status: 'active',
      createdAt,
      updatedAt: createdAt,
    });
    await principals.create(principal);
    await connection.database.execute(sql`
      INSERT INTO operations_accounts
        (account_id, principal_id, login_identifier_normalized, status, created_at, updated_at)
      VALUES (${account.id}, ${principal.id}, ${account.loginIdentifierNormalized}, ${account.status}, ${createdAt.toISOString()}, ${createdAt.toISOString()})
    `);
    return account;
  }

  async function resetCredentialTables() {
    await connection.database.execute(
      sql`ALTER TABLE operations_sessions DISABLE TRIGGER operations_sessions_reject_truncate_trigger`,
    );
    await connection.database.execute(
      sql`ALTER TABLE operations_credentials DISABLE TRIGGER operations_credentials_reject_truncate_trigger`,
    );
    try {
      await connection.database.execute(
        sql`TRUNCATE TABLE operations_sessions, operations_credentials, operations_accounts, operations_human_principals`,
      );
    } finally {
      await connection.database.execute(
        sql`ALTER TABLE operations_sessions ENABLE TRIGGER operations_sessions_reject_truncate_trigger`,
      );
      await connection.database.execute(
        sql`ALTER TABLE operations_credentials ENABLE TRIGGER operations_credentials_reject_truncate_trigger`,
      );
    }
  }
});
