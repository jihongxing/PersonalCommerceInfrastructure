import { sql } from 'drizzle-orm';

import {
  assertOperationsSession,
  assertOperationsSessionTouch,
  createOperationsAccountId,
  createOperationsHumanPrincipalId,
  createOperationsSessionId,
  OperationsDomainInvariantError,
} from '../../../modules/operations-identity/operations-identity-contract.js';
import { OperationsHumanPrincipalNotFoundError } from '../../../applications/operations-identity/operations-identity-repositories.js';
import {
  createOperationsPrincipalSecurityEpoch,
  createOperationsSessionCredentialDigest,
  createOperationsSessionCredentialVersion,
  createOperationsSessionVersion,
  OperationsPrincipalSecurityEpochConflictError,
  OperationsSessionConflictError,
  OperationsSessionContractError,
  OperationsSessionNotAuthenticatedError,
  OperationsSessionNotFoundError,
  OperationsSessionPersistenceError,
  type OperationsSessionCredentialDigest,
  type OperationsSessionPersistenceRecord,
  type OperationsSessionRepository,
  type OperationsSessionSnapshot,
} from '../../../applications/operations-identity/operations-session-repositories.js';
import type { ProductDatabase } from './postgres-database.js';

type Transaction = Parameters<Parameters<ProductDatabase['transaction']>[0]>[0];
interface SessionRow extends Record<string, unknown> {
  session_id: string;
  principal_id: string;
  account_id: string;
  credential_digest_hex: string;
  status: string;
  credential_version: number;
  principal_security_epoch: number;
  session_version: number;
  created_at: string;
  last_activity_at: string;
  idle_expires_at: string;
  absolute_expires_at: string;
  mfa_verified_at: string | null;
  revoked_at: string | null;
}
interface Owners {
  principalStatus: string;
  securityEpoch: number;
  accountStatus: string;
  credentialVersion: number | undefined;
}
const columns = sql`session_id, principal_id, account_id, encode(credential_digest, 'hex') AS credential_digest_hex,
  status, credential_version, principal_security_epoch, session_version, created_at, last_activity_at,
  idle_expires_at, absolute_expires_at, mfa_verified_at, revoked_at`;

/** Persistence only: all authority checks are database snapshot checks, not a login workflow. */
export class PostgresOperationsSessionRepository implements OperationsSessionRepository {
  public constructor(private readonly database: ProductDatabase) {}

  public async createSession(
    input: Parameters<OperationsSessionRepository['createSession']>[0],
  ): Promise<OperationsSessionPersistenceRecord> {
    return this.run(async (tx) => {
      assertOperationsSession(input.session);
      const digest = digestBytes(input.credentialDigest);
      const owners = await this.lockOwners(tx, input.session.principalId, input.session.accountId);
      this.assertValid(input.session, owners, input.now);
      const s = input.session;
      const rows = await tx.execute<SessionRow>(sql`
        INSERT INTO operations_sessions
          (session_id, principal_id, account_id, credential_digest, status, credential_version,
           principal_security_epoch, session_version, created_at, last_activity_at, idle_expires_at,
           absolute_expires_at, mfa_verified_at)
        VALUES (${s.id}, ${s.principalId}, ${s.accountId}, ${digest}, 'active', ${s.credentialVersion},
          ${s.principalSecurityEpoch}, 1, ${iso(s.createdAt)}, ${iso(s.lastActivityAt)},
          ${iso(s.idleExpiresAt)}, ${iso(s.absoluteExpiresAt)},
          ${s.mfaVerifiedAt === undefined ? null : iso(s.mfaVerifiedAt)})
        RETURNING ${columns}
      `);
      return requiredRecord(rows[0]);
    });
  }

  public async findActiveSessionByCredentialDigest(
    input: Parameters<OperationsSessionRepository['findActiveSessionByCredentialDigest']>[0],
  ): Promise<OperationsSessionPersistenceRecord> {
    return this.run(async (tx) => {
      const digest = digestBytes(input.credentialDigest);
      // Routing hint only: no success or authority is inferred until all locks are held.
      const hints = await tx.execute<SessionRow>(sql`
        SELECT ${columns} FROM operations_sessions WHERE credential_digest = ${digest}
      `);
      const hint = hints[0];
      if (hint === undefined) throw new OperationsSessionNotAuthenticatedError();
      const owners = await this.lockOwners(tx, hint.principal_id, hint.account_id);
      const row = await lockedSession(tx, hint.session_id);
      if (row === undefined || row.credential_digest_hex !== input.credentialDigest) {
        throw new OperationsSessionNotAuthenticatedError();
      }
      const record = requiredRecord(row);
      this.assertValid(record.session, owners, input.now);
      return record;
    });
  }

  public async validateAndTouchSession(
    input: Parameters<OperationsSessionRepository['validateAndTouchSession']>[0],
  ): Promise<OperationsSessionPersistenceRecord> {
    return this.run(async (tx) => {
      const digest = digestBytes(input.credentialDigest);
      const hints = await tx.execute<SessionRow>(sql`
        SELECT ${columns} FROM operations_sessions WHERE credential_digest = ${digest}
      `);
      const hint = hints[0];
      if (hint === undefined) throw new OperationsSessionNotAuthenticatedError();
      const owners = await this.lockOwners(tx, hint.principal_id, hint.account_id);
      const row = await lockedSession(tx, hint.session_id);
      if (row === undefined || row.credential_digest_hex !== input.credentialDigest) {
        throw new OperationsSessionNotAuthenticatedError();
      }
      const current = requiredRecord(row);
      this.assertValid(current.session, owners, input.now);
      const next = monotonicTouch(
        current.session,
        input.nextLastActivityAt,
        input.nextIdleExpiresAt,
      );
      const rows = await tx.execute<SessionRow>(sql`
        UPDATE operations_sessions
        SET last_activity_at = ${iso(next.lastActivityAt)}, idle_expires_at = ${iso(next.idleExpiresAt)}
        WHERE session_id = ${hint.session_id} AND credential_digest = ${digest}
          AND session_version = ${current.sessionVersion} AND status = 'active'
        RETURNING ${columns}
      `);
      if (rows[0] === undefined) throw new OperationsSessionNotAuthenticatedError();
      return requiredRecord(rows[0]);
    });
  }

  public async rotateSession(
    input: Parameters<OperationsSessionRepository['rotateSession']>[0],
  ): Promise<OperationsSessionPersistenceRecord> {
    return this.run(async (tx) => {
      const previousDigest = digestBytes(input.credentialDigest);
      const nextDigest = digestBytes(input.nextCredentialDigest);
      createOperationsSessionVersion(input.expectedSessionVersion);
      if (input.credentialDigest === input.nextCredentialDigest) {
        throw new OperationsSessionContractError('Rotation requires a different Digest.');
      }
      const hint = await sessionHint(tx, input.sessionId);
      if (hint === undefined) throw new OperationsSessionNotAuthenticatedError();
      const owners = await this.lockOwners(tx, hint.principal_id, hint.account_id);
      const row = await lockedSession(tx, input.sessionId);
      if (row === undefined) throw new OperationsSessionNotAuthenticatedError();
      assertOwner(row, input.principalId, input.accountId);
      if (row.session_version !== input.expectedSessionVersion) {
        throw new OperationsSessionConflictError('session_version');
      }
      if (row.credential_digest_hex !== input.credentialDigest) {
        throw new OperationsSessionConflictError('credential_digest');
      }
      const current = requiredRecord(row);
      this.assertValid(current.session, owners, input.rotatedAt);
      if (current.sessionVersion >= 2147483647) {
        throw new OperationsSessionContractError('Session CAS Version is exhausted.');
      }
      const next = monotonicTouch(
        current.session,
        input.nextLastActivityAt,
        input.nextIdleExpiresAt,
      );
      const rows = await tx.execute<SessionRow>(sql`
        UPDATE operations_sessions
        SET credential_digest = ${nextDigest}, session_version = session_version + 1,
          last_activity_at = ${iso(next.lastActivityAt)}, idle_expires_at = ${iso(next.idleExpiresAt)}
        WHERE session_id = ${input.sessionId} AND principal_id = ${input.principalId}
          AND account_id = ${input.accountId} AND status = 'active'
          AND credential_digest = ${previousDigest} AND session_version = ${input.expectedSessionVersion}
        RETURNING ${columns}
      `);
      if (rows[0] === undefined) throw new OperationsSessionConflictError('session_version');
      return requiredRecord(rows[0]);
    });
  }

  public async revokeSession(
    input: Parameters<OperationsSessionRepository['revokeSession']>[0],
  ): Promise<void> {
    await this.run(async (tx) => {
      const hint = await sessionHint(tx, input.sessionId);
      if (hint === undefined) throw new OperationsSessionNotFoundError(input.sessionId);
      await this.lockOwners(tx, hint.principal_id, hint.account_id);
      const row = await lockedSession(tx, input.sessionId);
      if (row === undefined) throw new OperationsSessionNotFoundError(input.sessionId);
      assertOwner(row, input.principalId, input.accountId);
      if (input.expectedSessionVersion !== undefined) {
        createOperationsSessionVersion(input.expectedSessionVersion);
        if (row.session_version !== input.expectedSessionVersion) {
          throw new OperationsSessionConflictError('session_version');
        }
      }
      if (row.status === 'revoked') return;
      await tx.execute(sql`UPDATE operations_sessions SET status = 'revoked', revoked_at = ${iso(input.revokedAt)}
        WHERE session_id = ${input.sessionId} AND status = 'active'`);
    });
  }

  public async revokeAllSessionsForAccount(
    input: Parameters<OperationsSessionRepository['revokeAllSessionsForAccount']>[0],
  ): Promise<number> {
    return this.run(async (tx) => {
      const hint = await tx.execute<{ principal_id: string }>(sql`
        SELECT principal_id FROM operations_accounts WHERE account_id = ${input.accountId}
      `);
      if (hint[0] === undefined) return 0;
      return this.revokeMany(tx, hint[0].principal_id, input.revokedAt, input.accountId);
    });
  }

  public async revokeAllSessionsForPrincipal(
    input: Parameters<OperationsSessionRepository['revokeAllSessionsForPrincipal']>[0],
  ): Promise<number> {
    return this.run((tx) => this.revokeMany(tx, input.principalId, input.revokedAt));
  }

  private async revokeMany(
    tx: Transaction,
    principalId: string,
    revokedAt: Date,
    accountId?: string,
  ): Promise<number> {
    const principals = await tx.execute(sql`SELECT principal_id FROM operations_human_principals
      WHERE principal_id = ${principalId} FOR UPDATE`);
    if (principals.length === 0) return 0;
    // Lock entire resource sets in table order; never alternate Credential/Session locks per Account.
    const scope = accountId === undefined ? sql`true` : sql`account_id = ${accountId}`;
    const accounts = await tx.execute(sql`SELECT account_id FROM operations_accounts
      WHERE principal_id = ${principalId} AND ${scope} ORDER BY account_id FOR UPDATE`);
    if (accounts.length === 0) return 0;
    await tx.execute(sql`SELECT credential_id FROM operations_credentials
      WHERE account_id IN (SELECT account_id FROM operations_accounts WHERE principal_id = ${principalId} AND ${scope})
      ORDER BY account_id, credential_id FOR UPDATE`);
    await tx.execute(sql`SELECT session_id FROM operations_sessions
      WHERE principal_id = ${principalId} AND ${scope} ORDER BY account_id, session_id FOR UPDATE`);
    const rows =
      await tx.execute(sql`UPDATE operations_sessions SET status = 'revoked', revoked_at = ${iso(revokedAt)}
      WHERE principal_id = ${principalId} AND ${scope} AND status = 'active' RETURNING session_id`);
    return rows.length;
  }

  private async lockOwners(
    tx: Transaction,
    principalId: string,
    accountId: string,
  ): Promise<Owners> {
    const principals = await tx.execute<{ status: string; security_epoch: number }>(sql`
      SELECT status, security_epoch FROM operations_human_principals WHERE principal_id = ${principalId} FOR UPDATE
    `);
    const principal = principals[0];
    if (principal === undefined) throw new OperationsSessionNotAuthenticatedError();
    const accounts = await tx.execute<{ status: string; principal_id: string }>(sql`
      SELECT status, principal_id FROM operations_accounts WHERE account_id = ${accountId} FOR UPDATE
    `);
    const account = accounts[0];
    if (account === undefined) throw new OperationsSessionNotAuthenticatedError();
    if (account.principal_id !== principalId) throw new OperationsSessionConflictError('ownership');
    const credentials = await tx.execute<{ status: string; version: number }>(sql`
      SELECT status, version FROM operations_credentials WHERE account_id = ${accountId} AND kind = 'password'
      ORDER BY credential_id FOR UPDATE
    `);
    return {
      principalStatus: principal.status,
      securityEpoch: principal.security_epoch,
      accountStatus: account.status,
      credentialVersion: credentials.find((credential) => credential.status === 'active')?.version,
    };
  }

  private assertValid(session: OperationsSessionSnapshot, owners: Owners, now: Date): void {
    iso(now);
    if (
      session.status !== 'active' ||
      owners.principalStatus !== 'active' ||
      owners.accountStatus !== 'active' ||
      owners.credentialVersion !== session.credentialVersion ||
      owners.securityEpoch !== session.principalSecurityEpoch ||
      now.getTime() >= session.idleExpiresAt.getTime() ||
      now.getTime() >= session.absoluteExpiresAt.getTime()
    ) {
      throw new OperationsSessionNotAuthenticatedError();
    }
  }

  private async run<Result>(operation: (tx: Transaction) => Promise<Result>): Promise<Result> {
    try {
      return await this.database.transaction(operation);
    } catch (error) {
      throw mapOperationsSessionPersistenceError(error);
    }
  }
}

async function sessionHint(tx: Transaction, id: string): Promise<SessionRow | undefined> {
  const rows = await tx.execute<SessionRow>(
    sql`SELECT ${columns} FROM operations_sessions WHERE session_id = ${id}`,
  );
  return rows[0];
}
async function lockedSession(tx: Transaction, id: string): Promise<SessionRow | undefined> {
  const rows = await tx.execute<SessionRow>(
    sql`SELECT ${columns} FROM operations_sessions WHERE session_id = ${id} FOR UPDATE`,
  );
  return rows[0];
}
function assertOwner(row: SessionRow, principalId: string, accountId: string): void {
  if (row.principal_id !== principalId || row.account_id !== accountId)
    throw new OperationsSessionConflictError('ownership');
}
function digestBytes(digest: OperationsSessionCredentialDigest): Buffer {
  return Buffer.from(createOperationsSessionCredentialDigest(digest), 'hex');
}
function iso(date: Date): string {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime()))
    throw new OperationsSessionContractError('A valid Session timestamp is required.');
  return date.toISOString();
}
function monotonicTouch(current: OperationsSessionSnapshot, activity: Date, idle: Date) {
  iso(activity);
  iso(idle);
  if (idle.getTime() < activity.getTime() || idle.getTime() > current.absoluteExpiresAt.getTime()) {
    throw new OperationsSessionContractError(
      'Session Touch timestamps are outside the permitted window.',
    );
  }
  const next = {
    lastActivityAt: new Date(Math.max(current.lastActivityAt.getTime(), activity.getTime())),
    idleExpiresAt: new Date(Math.max(current.idleExpiresAt.getTime(), idle.getTime())),
  };
  assertOperationsSessionTouch(current, next);
  return next;
}
function requiredRecord(row: SessionRow | undefined): OperationsSessionPersistenceRecord {
  if (row === undefined) throw new OperationsSessionPersistenceError();
  if (row.status !== 'active' && row.status !== 'revoked')
    throw new OperationsSessionPersistenceError();
  const session: OperationsSessionSnapshot = {
    id: createOperationsSessionId(row.session_id),
    principalId: createOperationsHumanPrincipalId(row.principal_id),
    accountId: createOperationsAccountId(row.account_id),
    status: row.status,
    credentialVersion: createOperationsSessionCredentialVersion(row.credential_version),
    principalSecurityEpoch: createOperationsPrincipalSecurityEpoch(row.principal_security_epoch),
    createdAt: new Date(row.created_at),
    lastActivityAt: new Date(row.last_activity_at),
    idleExpiresAt: new Date(row.idle_expires_at),
    absoluteExpiresAt: new Date(row.absolute_expires_at),
    ...(row.mfa_verified_at === null ? {} : { mfaVerifiedAt: new Date(row.mfa_verified_at) }),
    ...(row.revoked_at === null ? {} : { revokedAt: new Date(row.revoked_at) }),
  };
  assertOperationsSession(session);
  return {
    session,
    credentialDigest: createOperationsSessionCredentialDigest(row.credential_digest_hex),
    sessionVersion: createOperationsSessionVersion(row.session_version),
  };
}

/** Shared with the separate Epoch adapter: never retain SQL, parameters or a driver cause. */
export function mapOperationsSessionPersistenceError(error: unknown): Error {
  if (
    error instanceof OperationsSessionContractError ||
    error instanceof OperationsDomainInvariantError ||
    error instanceof OperationsSessionConflictError ||
    error instanceof OperationsSessionNotAuthenticatedError ||
    error instanceof OperationsSessionNotFoundError ||
    error instanceof OperationsSessionPersistenceError ||
    error instanceof OperationsPrincipalSecurityEpochConflictError ||
    error instanceof OperationsHumanPrincipalNotFoundError
  )
    return error;
  let candidate: unknown = error;
  for (let depth = 0; depth < 4; depth += 1) {
    if (typeof candidate !== 'object' || candidate === null) break;
    if (
      'code' in candidate &&
      typeof candidate.code === 'string' &&
      /^[0-9A-Z]{5}$/u.test(candidate.code)
    ) {
      const constraint =
        'constraint_name' in candidate
          ? candidate.constraint_name
          : 'constraint' in candidate
            ? candidate.constraint
            : undefined;
      if (
        candidate.code === '23505' &&
        constraint === 'operations_sessions_credential_digest_unique'
      )
        return new OperationsSessionConflictError('credential_digest');
      return new OperationsSessionPersistenceError(candidate.code);
    }
    candidate = 'cause' in candidate ? candidate.cause : undefined;
  }
  return new OperationsSessionPersistenceError();
}
