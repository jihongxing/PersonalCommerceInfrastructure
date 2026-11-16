import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import postgres, { type Sql } from 'postgres';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface CreatorWebSession {
  readonly id: string;
  readonly accountId: string;
  readonly email: string;
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresAt: string;
}

interface StoredSessionRow {
  readonly id_hash: string;
  readonly account_id: string;
  readonly user_email: string;
  readonly access_token_ciphertext: string;
  readonly refresh_token_ciphertext: string;
  readonly refresh_token_hash: string;
  readonly expires_at: string | Date;
}

function hashSessionId(id: string): string {
  return createHash('sha256').update(id).digest('hex');
}

function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function encryptionKey(): Buffer {
  const secret = process.env.CREATOR_BFF_SESSION_SECRET ?? process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('CREATOR_BFF_SESSION_SECRET must contain at least 32 bytes.');
  }
  return createHash('sha256').update(secret).digest();
}

function encrypt(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext].map((part) => part.toString('base64url')).join('.');
}

function decrypt(value: string): string {
  const [ivValue, tagValue, ciphertextValue] = value.split('.');
  if (!ivValue || !tagValue || !ciphertextValue) throw new Error('Invalid session secret.');
  const decipher = createDecipheriv(
    'aes-256-gcm',
    encryptionKey(),
    Buffer.from(ivValue, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

function databaseUrl(): string {
  const value = process.env.CREATOR_BFF_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!value) throw new Error('CREATOR_BFF_DATABASE_URL or DATABASE_URL is required.');
  return value;
}

export class CreatorWebSessionStore {
  private sql: Sql | undefined;

  constructor(private readonly transaction?: postgres.TransactionSql) {}

  private client(): Sql {
    this.sql ??= postgres(databaseUrl(), { max: 10, prepare: false });
    return this.sql;
  }

  private query(): Sql | postgres.TransactionSql {
    return this.transaction ?? this.client();
  }

  async withSessionLock<T>(
    id: string,
    operation: (store: CreatorWebSessionStore) => Promise<T>,
  ): Promise<T> {
    const result = await this.client().begin(async (tx) => {
      await tx`SELECT id_hash FROM creator_web_sessions WHERE id_hash = ${hashSessionId(id)} FOR UPDATE`;
      return { value: await operation(new CreatorWebSessionStore(tx)) };
    });
    return result.value;
  }

  async create(input: {
    accountId: string;
    email: string;
    accessToken: string;
    refreshToken: string;
  }): Promise<CreatorWebSession> {
    const id = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
    await this.query()`
      INSERT INTO creator_web_sessions (
        id_hash,
        account_id,
        user_email,
        access_token_ciphertext,
        refresh_token_ciphertext,
        refresh_token_hash,
        expires_at
      ) VALUES (
        ${hashSessionId(id)},
        ${input.accountId},
        ${input.email},
        ${encrypt(input.accessToken)},
        ${encrypt(input.refreshToken)},
        ${hashRefreshToken(input.refreshToken)},
        ${expiresAt}
      )`;
    return { ...input, id, expiresAt };
  }

  async get(id: string): Promise<CreatorWebSession | undefined> {
    return this.read(id, false);
  }

  // An expired/revoked BFF row may still carry the credential needed to finish
  // upstream revocation. It must never authorize normal private business access.
  async getForLogout(id: string): Promise<CreatorWebSession | undefined> {
    return this.read(id, true);
  }

  private async read(id: string, forLogout: boolean): Promise<CreatorWebSession | undefined> {
    const rows = await this.query()<StoredSessionRow[]>`
      SELECT id_hash, account_id, user_email, access_token_ciphertext,
        refresh_token_ciphertext, refresh_token_hash, expires_at
      FROM creator_web_sessions
      WHERE id_hash = ${hashSessionId(id)}
        AND (${forLogout} OR (revoked_at IS NULL AND expires_at > now()))
    `;
    const row = rows[0];
    if (!row) return undefined;
    try {
      return {
        id,
        accountId: row.account_id,
        email: row.user_email,
        accessToken: decrypt(row.access_token_ciphertext),
        refreshToken: decrypt(row.refresh_token_ciphertext),
        expiresAt: new Date(row.expires_at).toISOString(),
      };
    } catch {
      await this.revoke(id);
      return undefined;
    }
  }

  async updateTokens(
    id: string,
    accessToken: string,
    refreshToken: string,
    expectedRefreshToken: string,
  ): Promise<boolean> {
    const result = await this.query()`
      UPDATE creator_web_sessions
      SET access_token_ciphertext = ${encrypt(accessToken)},
          refresh_token_ciphertext = ${encrypt(refreshToken)},
          refresh_token_hash = ${hashRefreshToken(refreshToken)},
          updated_at = now()
      WHERE id_hash = ${hashSessionId(id)}
        AND refresh_token_hash = ${hashRefreshToken(expectedRefreshToken)}
        AND revoked_at IS NULL AND expires_at > now()
    `;
    return result.count > 0;
  }

  async revoke(id: string): Promise<void> {
    await this.query()`
      UPDATE creator_web_sessions
      SET revoked_at = now(), updated_at = now()
      WHERE id_hash = ${hashSessionId(id)} AND revoked_at IS NULL
    `;
  }

  async close(): Promise<void> {
    if (this.sql !== undefined) {
      await this.sql.end({ timeout: 5 });
      this.sql = undefined;
    }
  }
}

export const creatorWebSessionStore = new CreatorWebSessionStore();
