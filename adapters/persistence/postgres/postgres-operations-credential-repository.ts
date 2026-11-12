import { sql } from 'drizzle-orm';

import {
  createOperationsCredentialId,
  createOperationsCredentialMetadata,
  createOperationsAccountId,
  type OperationsAccountId,
  type OperationsCredentialId,
} from '../../../modules/operations-identity/operations-identity-contract.js';
import {
  createEncodedPasswordVerifier,
  OperationsCredentialAlreadyExistsError,
  OperationsCredentialNotFoundError,
  OperationsCredentialPersistenceError,
  OperationsCredentialVersionConflictError,
  type EncodedPasswordVerifier,
  type OperationsCredentialRepository,
  type OperationsPasswordCredentialRecord,
} from '../../../applications/operations-identity/operations-credential-repositories.js';
import type { ProductDatabase } from './postgres-database.js';

interface OperationsCredentialRow extends Record<string, unknown> {
  credential_id: string;
  account_id: string;
  kind: string;
  status: string;
  verifier: string;
  version: number;
  created_at: string;
  updated_at: string;
  revoked_at: string | null;
}

type CredentialDatabase = Pick<ProductDatabase, 'execute' | 'transaction'>;
type CredentialTransaction = Parameters<Parameters<ProductDatabase['transaction']>[0]>[0];

export class PostgresOperationsCredentialRepository implements OperationsCredentialRepository {
  public constructor(private readonly database: ProductDatabase) {}

  public async findActivePasswordByAccountId(
    accountId: OperationsAccountId,
  ): Promise<OperationsPasswordCredentialRecord | undefined> {
    return this.findActive(this.database, accountId);
  }

  public async createPasswordCredential(input: {
    readonly id: OperationsCredentialId;
    readonly accountId: OperationsAccountId;
    readonly verifier: EncodedPasswordVerifier;
    readonly createdAt: Date;
  }): Promise<OperationsPasswordCredentialRecord> {
    return this.database.transaction(async (transaction) => {
      await this.lockAccount(transaction, input.accountId);
      const active = await this.findActive(transaction, input.accountId);
      if (active !== undefined) {
        throw new OperationsCredentialAlreadyExistsError(input.accountId, 'active_password');
      }
      const latestVersion = await this.findLatestVersion(transaction, input.accountId);
      const version = latestVersion + 1;
      const createdAt = input.createdAt.toISOString();
      try {
        const rows = await transaction.execute<OperationsCredentialRow>(sql`
          INSERT INTO operations_credentials
            (credential_id, account_id, kind, status, verifier, version, created_at, updated_at)
          VALUES
            (${input.id}, ${input.accountId}, 'password', 'active', ${input.verifier}, ${version}, ${createdAt}, ${createdAt})
          RETURNING credential_id, account_id, kind, status, verifier, version, created_at, updated_at, revoked_at
        `);
        const row = rows[0];
        if (row === undefined) throw new Error('Operations credential insert returned no row.');
        return toRecord(row);
      } catch (error) {
        throw mapCredentialError(error, input.accountId);
      }
    });
  }

  public async revokeActivePasswordCredential(input: {
    readonly accountId: OperationsAccountId;
    readonly expectedVersion: number;
    readonly revokedAt: Date;
  }): Promise<void> {
    await this.database.transaction(async (transaction) => {
      await this.lockAccount(transaction, input.accountId);
      const active = await this.findActive(transaction, input.accountId);
      assertExpectedVersion(active, input.accountId, input.expectedVersion);
      const result = await transaction.execute(sql`
        UPDATE operations_credentials
        SET status = 'revoked', revoked_at = ${input.revokedAt.toISOString()}, updated_at = ${input.revokedAt.toISOString()}
        WHERE credential_id = ${active.metadata.id}
          AND status = 'active'
          AND version = ${input.expectedVersion}
      `);
      if (result.count !== 1) {
        throw new OperationsCredentialVersionConflictError(
          input.accountId,
          input.expectedVersion,
          active.metadata.version,
        );
      }
    });
  }

  public async replaceActivePasswordCredential(input: {
    readonly id: OperationsCredentialId;
    readonly accountId: OperationsAccountId;
    readonly expectedVersion: number;
    readonly verifier: EncodedPasswordVerifier;
    readonly replacedAt: Date;
  }): Promise<OperationsPasswordCredentialRecord> {
    return this.database.transaction(async (transaction) => {
      await this.lockAccount(transaction, input.accountId);
      const active = await this.findActive(transaction, input.accountId);
      assertExpectedVersion(active, input.accountId, input.expectedVersion);

      const replacedAt = input.replacedAt.toISOString();
      await transaction.execute(sql`
        UPDATE operations_credentials
        SET status = 'revoked', revoked_at = ${replacedAt}, updated_at = ${replacedAt}
        WHERE credential_id = ${active.metadata.id}
          AND status = 'active'
          AND version = ${input.expectedVersion}
      `);

      try {
        const rows = await transaction.execute<OperationsCredentialRow>(sql`
          INSERT INTO operations_credentials
            (credential_id, account_id, kind, status, verifier, version, created_at, updated_at)
          VALUES
            (${input.id}, ${input.accountId}, 'password', 'active', ${input.verifier}, ${input.expectedVersion + 1}, ${replacedAt}, ${replacedAt})
          RETURNING credential_id, account_id, kind, status, verifier, version, created_at, updated_at, revoked_at
        `);
        const row = rows[0];
        if (row === undefined)
          throw new Error('Operations credential replacement returned no row.');
        return toRecord(row);
      } catch (error) {
        throw mapCredentialError(error, input.accountId);
      }
    });
  }

  private async lockAccount(
    database: Pick<CredentialTransaction, 'execute'>,
    accountId: OperationsAccountId,
  ): Promise<void> {
    const rows = await database.execute<{ account_id: string }>(sql`
      SELECT account_id
      FROM operations_accounts
      WHERE account_id = ${accountId}
      FOR UPDATE
    `);
    if (rows[0] === undefined) throw new OperationsCredentialNotFoundError(accountId);
  }

  private async findActive(
    database: Pick<CredentialDatabase, 'execute'>,
    accountId: OperationsAccountId,
  ): Promise<OperationsPasswordCredentialRecord | undefined> {
    const rows = await database.execute<OperationsCredentialRow>(sql`
      SELECT credential_id, account_id, kind, status, verifier, version, created_at, updated_at, revoked_at
      FROM operations_credentials
      WHERE account_id = ${accountId} AND kind = 'password' AND status = 'active'
      LIMIT 1
    `);
    const row = rows[0];
    return row === undefined ? undefined : toRecord(row);
  }

  private async findLatestVersion(
    database: Pick<CredentialDatabase, 'execute'>,
    accountId: OperationsAccountId,
  ): Promise<number> {
    const rows = await database.execute<{ max_version: number | null }>(sql`
      SELECT MAX(version) AS max_version
      FROM operations_credentials
      WHERE account_id = ${accountId} AND kind = 'password'
    `);
    return rows[0]?.max_version ?? 0;
  }
}

function assertExpectedVersion(
  active: OperationsPasswordCredentialRecord | undefined,
  accountId: OperationsAccountId,
  expectedVersion: number,
): asserts active is OperationsPasswordCredentialRecord {
  if (active === undefined) throw new OperationsCredentialNotFoundError(accountId);
  if (active.metadata.version !== expectedVersion) {
    throw new OperationsCredentialVersionConflictError(
      accountId,
      expectedVersion,
      active.metadata.version,
    );
  }
}

function toRecord(row: OperationsCredentialRow): OperationsPasswordCredentialRecord {
  if (row.kind !== 'password' || (row.status !== 'active' && row.status !== 'revoked')) {
    throw new Error(`Invalid Operations credential discriminator for ${row.credential_id}.`);
  }
  return {
    metadata: createOperationsCredentialMetadata({
      id: createOperationsCredentialId(row.credential_id),
      accountId: createOperationsAccountId(row.account_id),
      kind: 'password',
      status: row.status,
      version: row.version,
      createdAt: new Date(row.created_at),
      ...(row.revoked_at === null ? {} : { revokedAt: new Date(row.revoked_at) }),
    }),
    verifier: createEncodedPasswordVerifier(row.verifier),
  };
}

function mapCredentialError(error: unknown, accountId: OperationsAccountId): Error {
  const constraint = uniqueConstraint(error);
  if (constraint === 'operations_credentials_pkey') {
    return new OperationsCredentialAlreadyExistsError(accountId, 'credential_id');
  }
  if (constraint === 'operations_credentials_active_account_unique') {
    return new OperationsCredentialAlreadyExistsError(accountId, 'active_password');
  }
  if (constraint === 'operations_credentials_account_kind_version_unique') {
    return new OperationsCredentialAlreadyExistsError(accountId, 'account_version');
  }
  return new OperationsCredentialPersistenceError(databaseErrorCode(error));
}

function databaseErrorCode(error: unknown): string | undefined {
  const databaseError = unwrapDatabaseError(error);
  if (
    typeof databaseError === 'object' &&
    databaseError !== null &&
    'code' in databaseError &&
    typeof databaseError.code === 'string'
  ) {
    return databaseError.code;
  }
  return undefined;
}

function uniqueConstraint(error: unknown): string | undefined {
  const databaseError = unwrapDatabaseError(error);
  if (
    typeof databaseError !== 'object' ||
    databaseError === null ||
    !('code' in databaseError) ||
    databaseError.code !== '23505'
  ) {
    return undefined;
  }
  if ('constraint_name' in databaseError && typeof databaseError.constraint_name === 'string') {
    return databaseError.constraint_name;
  }
  if ('constraint' in databaseError && typeof databaseError.constraint === 'string') {
    return databaseError.constraint;
  }
  return undefined;
}

function unwrapDatabaseError(error: unknown): unknown {
  if (typeof error === 'object' && error !== null && 'cause' in error) {
    return error.cause;
  }
  return error;
}
