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
    return withTraceSpan('postgres.account.create', () => this.sql.begin(async (tx) => {
      const rows =
        await tx`INSERT INTO local_auth_accounts (id, email, password_hash, name) VALUES (${account.id}, ${account.email}, ${account.passwordHash}, ${account.name}) ON CONFLICT (email) DO NOTHING RETURNING id`;
      if (!rows.length) return false;
      await tx`INSERT INTO local_creator_mappings (account_id, creator_id) VALUES (${account.id}, ${creatorId})`;
      return true;
    }));
  }

  async findAccountByEmail(email: string): Promise<LocalAccount | undefined> {
    const rows = await this.sql<
      AccountRow[]
    >`SELECT id, email, password_hash, name, created_at FROM local_auth_accounts WHERE email = ${email} AND is_active`;
    return rows[0] ? accountFromRow(rows[0]) : undefined;
  }

  async findAccountById(id: string): Promise<LocalAccount | undefined> {
    const rows = await this.sql<AccountRow[]>`SELECT id, email, password_hash, name, created_at FROM local_auth_accounts WHERE id = ${id} AND is_active`;
    return rows[0] ? accountFromRow(rows[0]) : undefined;
  }

  async createSession(id: string, accountId: string, hash: string, expiresAt: Date): Promise<void> {
    await this
      .sql`INSERT INTO local_auth_sessions (id, account_id, refresh_hash, expires_at) VALUES (${id}, ${accountId}, ${hash}, ${expiresAt.toISOString()})`;
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
