import type { Sql } from 'postgres';
import { withTraceSpan } from '../../observability/tracing.js';
import type {
  LocalAccount,
  LocalAuthRepository,
} from '../../../applications/account-identity-membership/local-auth-service.js';

type AccountRow = {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  created_at: string | Date;
};

function accountFromRow(row: AccountRow): LocalAccount {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    name: row.name,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export class PostgresLocalAuthRepository implements LocalAuthRepository {
  constructor(private readonly sql: Sql) {}

  async createAccount(account: LocalAccount, creatorId: string): Promise<boolean> {
    return withTraceSpan('postgres.account.create', () =>
      this.sql.begin(async (tx) => {
        const rows =
          await tx`INSERT INTO local_auth_accounts (id, email, password_hash, name) VALUES (${account.id}, ${account.email}, ${account.passwordHash}, ${account.name}) ON CONFLICT (email) DO NOTHING RETURNING id`;
        if (!rows.length) return false;
        await tx`INSERT INTO local_creator_mappings (account_id, creator_id) VALUES (${account.id}, ${creatorId})`;
        return true;
      }),
    );
  }

  async findAccountByEmail(email: string): Promise<LocalAccount | undefined> {
    const rows = await this.sql<
      AccountRow[]
    >`SELECT id, email, password_hash, name, created_at FROM local_auth_accounts WHERE email = ${email} AND is_active`;
    return rows[0] ? accountFromRow(rows[0]) : undefined;
  }

  async findAccountById(id: string): Promise<LocalAccount | undefined> {
    const rows = await this.sql<
      AccountRow[]
    >`SELECT id, email, password_hash, name, created_at FROM local_auth_accounts WHERE id = ${id} AND is_active`;
    return rows[0] ? accountFromRow(rows[0]) : undefined;
  }

  async createSession(
    id: string,
    accountId: string,
    passwordHash: string,
    hash: string,
    expiresAt: Date,
  ): Promise<boolean> {
    return this.sql.begin(async (tx) => {
      const account =
        await tx`SELECT id FROM local_auth_accounts WHERE id = ${accountId} AND password_hash = ${passwordHash} AND is_active FOR UPDATE`;
      if (!account.length) return false;
      await tx`INSERT INTO local_auth_sessions (id, account_id, refresh_hash, expires_at) VALUES (${id}, ${accountId}, ${hash}, ${expiresAt.toISOString()})`;
      return true;
    });
  }

  async enqueuePasswordRecovery(id: string, email: string, expiresAt: Date): Promise<void> {
    await this
      .sql`INSERT INTO local_auth_password_recovery_requests (id, email, expires_at) VALUES (${id}, ${email}, ${expiresAt.toISOString()})`;
  }

  async purgePasswordRecoveries(): Promise<void> {
    await this
      .sql`DELETE FROM local_auth_password_recovery_requests WHERE expires_at <= now() OR (attempts >= 5 AND lease_until <= now())`;
  }

  async claimPasswordRecovery(leaseId: string): Promise<{ id: string; email: string } | undefined> {
    await this.purgePasswordRecoveries();
    const rows = await this.sql<{ id: string; email: string }[]>`
      UPDATE local_auth_password_recovery_requests
      SET lease_id = ${leaseId}, lease_until = now() + interval '1 minute', attempts = attempts + 1
      WHERE id = (
        SELECT id FROM local_auth_password_recovery_requests
        WHERE available_at <= now() AND expires_at > now()
          AND (lease_until IS NULL OR lease_until <= now())
        ORDER BY created_at, id FOR UPDATE SKIP LOCKED LIMIT 1
      ) RETURNING id, email`;
    return rows[0];
  }

  async preparePasswordRecovery(id: string, leaseId: string, hash: string): Promise<boolean> {
    return this.sql.begin(async (tx) => {
      const requests = await tx<{ email: string; expires_at: string | Date; issued: boolean }[]>`
        SELECT email, expires_at, issued FROM local_auth_password_recovery_requests
        WHERE id = ${id} AND lease_id = ${leaseId} AND lease_until > now() AND expires_at > now()
        FOR UPDATE`;
      const request = requests[0];
      if (!request) return false;
      const accounts = await tx<{ id: string }[]>`
        SELECT id FROM local_auth_accounts WHERE email = ${request.email} AND is_active FOR UPDATE`;
      const account = accounts[0];
      if (!account) return false;
      if (request.issued) {
        const existing =
          await tx`SELECT 1 FROM local_auth_password_resets WHERE account_id = ${account.id} AND token_hash = ${hash} AND expires_at > now()`;
        return existing.length > 0;
      }
      await tx`DELETE FROM local_auth_password_resets WHERE account_id = ${account.id}`;
      const expiresAt = new Date(request.expires_at).toISOString();
      await tx`INSERT INTO local_auth_password_resets (account_id, token_hash, expires_at) VALUES (${account.id}, ${hash}, ${expiresAt})`;
      await tx`UPDATE local_auth_password_recovery_requests SET issued = true WHERE id = ${id}`;
      return true;
    });
  }

  async completePasswordRecovery(id: string, leaseId: string): Promise<void> {
    await this
      .sql`DELETE FROM local_auth_password_recovery_requests WHERE id = ${id} AND lease_id = ${leaseId}`;
  }

  async retryPasswordRecovery(id: string, leaseId: string): Promise<void> {
    await this.sql.begin(async (tx) => {
      await tx`DELETE FROM local_auth_password_recovery_requests WHERE id = ${id} AND lease_id = ${leaseId} AND (attempts >= 5 OR expires_at <= now())`;
      await tx`UPDATE local_auth_password_recovery_requests SET lease_id = NULL, lease_until = NULL, available_at = now() + (LEAST(300, 5 * power(2, attempts - 1))::integer * interval '1 second') WHERE id = ${id} AND lease_id = ${leaseId}`;
    });
  }

  async consumePasswordReset(hash: string, passwordHash: string): Promise<boolean> {
    return this.sql.begin(async (tx) => {
      const candidates = await tx<
        { account_id: string }[]
      >`SELECT account_id FROM local_auth_password_resets WHERE token_hash = ${hash}`;
      const accountId = candidates[0]?.account_id;
      if (!accountId) return false;
      const account =
        await tx`SELECT id FROM local_auth_accounts WHERE id = ${accountId} AND is_active FOR UPDATE`;
      if (!account.length) return false;
      const tokens =
        await tx`DELETE FROM local_auth_password_resets WHERE token_hash = ${hash} AND expires_at > now() RETURNING account_id`;
      if (!tokens.length) return false;
      await tx`UPDATE local_auth_accounts SET password_hash = ${passwordHash} WHERE id = ${accountId}`;
      await tx`UPDATE local_auth_sessions SET revoked_at = now() WHERE account_id = ${accountId} AND revoked_at IS NULL`;
      return true;
    });
  }

  async rotateSession(
    oldHash: string,
    newHash: string,
  ): Promise<{ account: LocalAccount; sessionId: string } | undefined> {
    return this.sql.begin(async (tx) => {
      const rows = await tx<
        { id: string; account_id: string }[]
      >`UPDATE local_auth_sessions SET refresh_hash = ${newHash} WHERE refresh_hash = ${oldHash} AND revoked_at IS NULL AND expires_at > now() RETURNING id, account_id`;
      const session = rows[0];
      if (!session) return undefined;
      const accounts = await tx<
        AccountRow[]
      >`SELECT id, email, password_hash, name, created_at FROM local_auth_accounts WHERE id = ${session.account_id} AND is_active`;
      return accounts[0]
        ? { account: accountFromRow(accounts[0]), sessionId: session.id }
        : undefined;
    });
  }

  async revokeSession(id: string, accountId: string): Promise<void> {
    await this
      .sql`UPDATE local_auth_sessions SET revoked_at = now() WHERE id = ${id} AND account_id = ${accountId} AND revoked_at IS NULL`;
  }

  async revokeSessionByRefreshHash(
    hash: string,
  ): Promise<'revoked' | 'already_revoked' | 'invalid' | 'expired'> {
    return this.sql.begin(async (tx) => {
      // The same row lock also guards refresh's conditional UPDATE. Neither operation
      // can reactivate a revoked row, and the hash is retained for idempotent retries.
      const rows = await tx<{ id: string; revoked: boolean; expired: boolean }[]>`
        SELECT id, revoked_at IS NOT NULL AS revoked, expires_at <= now() AS expired
        FROM local_auth_sessions WHERE refresh_hash = ${hash} FOR UPDATE`;
      const session = rows[0];
      if (!session) return 'invalid';
      if (session.revoked) return 'already_revoked';
      if (session.expired) return 'expired';
      await tx`UPDATE local_auth_sessions SET revoked_at = now() WHERE id = ${session.id}`;
      return 'revoked';
    });
  }

  async findActiveSession(id: string, accountId: string): Promise<boolean> {
    const rows = await this
      .sql`SELECT 1 FROM local_auth_sessions s JOIN local_auth_accounts a ON a.id = s.account_id WHERE s.id = ${id} AND a.id = ${accountId} AND a.is_active AND s.revoked_at IS NULL AND s.expires_at > now()`;
    return rows.length > 0;
  }

  async findCreatorId(accountId: string): Promise<string | undefined> {
    const rows = await this.sql<
      { creator_id: string }[]
    >`SELECT creator_id FROM local_creator_mappings WHERE account_id = ${accountId}`;
    return rows[0]?.creator_id;
  }
}
