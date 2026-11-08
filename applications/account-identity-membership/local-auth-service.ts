import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import { jwtVerify, SignJWT } from 'jose';
import { ApplicationError } from '../core/application-error.js';
import type {
  CreatorActorResolver,
  ProviderIdentity,
  ProviderTokenVerifier,
} from '../core/ports/auth-context-provider.js';

const scrypt = promisify(scryptCallback);
const accessLifetime = 900;
const sessionLifetime = 7 * 24 * 60 * 60 * 1000;
const dummyPasswordHash = `scrypt:local-auth-dummy-salt:${Buffer.alloc(64).toString('base64url')}`;

export interface LocalAccount {
  readonly id: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly name: string | null;
  readonly createdAt: string;
}

export interface LocalAuthRepository {
  createAccount(account: LocalAccount, creatorId: string): Promise<boolean>;
  findAccountByEmail(email: string): Promise<LocalAccount | undefined>;
  findAccountById(id: string): Promise<LocalAccount | undefined>;
  createSession(id: string, accountId: string, hash: string, expiresAt: Date): Promise<void>;
  rotateSession(
    oldHash: string,
    newHash: string,
  ): Promise<{ account: LocalAccount; sessionId: string } | undefined>;
  revokeSession(id: string, accountId: string): Promise<void>;
  findActiveSession(id: string, accountId: string): Promise<boolean>;
  findCreatorId(accountId: string): Promise<string | undefined>;
}

export interface LocalAuthRequestContext {
  readonly correlationId: string;
}

export interface LocalAuthObservability {
  trace<T>(name: string, operation: () => Promise<T>): Promise<T>;
  workspaceFailure(context: LocalAuthRequestContext): void;
}

function authError(code: string, message: string): ApplicationError {
  return new ApplicationError({ category: 'authentication', code, message });
}

function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('base64url');
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${hash.toString('base64url')}`;
}

async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [algorithm, salt, hash] = encoded.split(':');
  if (algorithm !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64url');
  if (expected.length !== 64) return false;
  const actual = (await scrypt(password, salt, 64)) as Buffer;
  return timingSafeEqual(actual, expected);
}

export class LocalAuthService implements ProviderTokenVerifier, CreatorActorResolver {
  private readonly key: Uint8Array;

  constructor(
    private readonly repository: LocalAuthRepository,
    secret: string,
    private readonly initializeWorkspace?: (account: LocalAccount, creatorId: string, context: LocalAuthRequestContext) => Promise<void>,
    private readonly observability?: LocalAuthObservability,
  ) {
    if (Buffer.byteLength(secret, 'utf8') < 32)
      throw new Error('JWT_SECRET must contain at least 32 bytes.');
    this.key = new TextEncoder().encode(secret);
  }

  private async accessToken(account: LocalAccount, sessionId: string): Promise<string> {
    return new SignJWT({ sid: sessionId })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(account.id)
      .setIssuedAt()
      .setExpirationTime(`${accessLifetime}s`)
      .sign(this.key);
  }

  private trace<T>(name: string, operation: () => Promise<T>): Promise<T> {
    return this.observability?.trace(name, operation) ?? operation();
  }

  private async newSession(account: LocalAccount, requestContext: LocalAuthRequestContext) {
    return this.trace('auth.session.create', async () => {
    const sessionId = randomUUID();
    const refreshToken = randomBytes(32).toString('base64url');
    await this.repository.createSession(
      sessionId,
      account.id,
      tokenHash(refreshToken),
      new Date(Date.now() + sessionLifetime),
    );
    let setupPending = false;
    try {
      await this.ensureAccountWorkspace(account, requestContext);
    } catch {
      setupPending = true;
      this.observability?.workspaceFailure(requestContext);
    }
    return { ...(await this.response(account, sessionId, refreshToken)), setupPending };
    });
  }

  private async ensureAccountWorkspace(account: LocalAccount, requestContext: LocalAuthRequestContext): Promise<void> {
    return this.trace('auth.workspace.initialize', async () => {
    if (!this.initializeWorkspace) return;
    const creatorId = await this.repository.findCreatorId(account.id);
    if (!creatorId) throw authError('creator_actor_not_mapped', '账号未关联 Creator。');
    await this.initializeWorkspace(account, creatorId, requestContext);
    });
  }

  async ensureWorkspace(token: string, requestContext: LocalAuthRequestContext): Promise<void> {
    const { accountId } = await this.verify(token);
    const account = await this.repository.findAccountById(accountId);
    if (!account) throw authError('invalid_access_token', '登录已过期，请重新登录。');
    await this.ensureAccountWorkspace(account, requestContext);
  }

  private async response(account: LocalAccount, sessionId: string, refreshToken: string) {
    return {
      accessToken: await this.accessToken(account, sessionId),
      refreshToken,
      expiresIn: accessLifetime,
      user: {
        id: account.id,
        email: account.email,
        ...(account.name ? { name: account.name } : {}),
        createdAt: account.createdAt,
      },
    };
  }

  async signup(rawEmail: string, password: string, name: string | undefined, requestContext: LocalAuthRequestContext) {
    return this.trace('auth.signup', async () => {
    const email = rawEmail.trim().toLowerCase();
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email) ||
      password.length < 8 ||
      password.length > 128
    ) {
      throw new ApplicationError({
        category: 'validation',
        code: 'invalid_credentials',
        message: '请输入有效邮箱和至少 8 位的密码。',
      });
    }
    const account: LocalAccount = {
      id: randomUUID(),
      email,
      passwordHash: await hashPassword(password),
      name: name?.trim() || null,
      createdAt: new Date().toISOString(),
    };
    if (!(await this.repository.createAccount(account, randomUUID()))) {
      throw new ApplicationError({
        category: 'conflict',
        code: 'user_already_exists',
        message: '该邮箱已注册。',
      });
    }
    return this.newSession(account, requestContext);
    });
  }

  async login(rawEmail: string, password: string, requestContext: LocalAuthRequestContext) {
    return this.trace('auth.login', async () => {
    const account = await this.repository.findAccountByEmail(rawEmail.trim().toLowerCase());
    const passwordMatches = await verifyPassword(
      password,
      account?.passwordHash ?? dummyPasswordHash,
    );
    if (!account || !passwordMatches) throw authError('invalid_credentials', '邮箱或密码错误。');
    return this.newSession(account, requestContext);
    });
  }

  async refresh(token: string) {
    const next = randomBytes(32).toString('base64url');
    const session = await this.repository.rotateSession(tokenHash(token), tokenHash(next));
    if (!session) throw authError('invalid_token', '登录已过期，请重新登录。');
    return this.response(session.account, session.sessionId, next);
  }

  private async verify(token: string): Promise<{ accountId: string; sessionId: string }> {
    let accountId: string;
    let sessionId: string;
    try {
      const { payload } = await jwtVerify(token, this.key, { algorithms: ['HS256'] });
      if (typeof payload.sub !== 'string' || typeof payload.sid !== 'string')
        throw new Error('invalid claims');
      accountId = payload.sub;
      sessionId = payload.sid;
    } catch {
      throw authError('invalid_access_token', '登录已过期，请重新登录。');
    }
    if (!(await this.repository.findActiveSession(sessionId, accountId)))
      throw authError('invalid_access_token', '登录已过期，请重新登录。');
    return { accountId, sessionId };
  }

  async logout(token: string): Promise<void> {
    const session = await this.verify(token);
    await this.repository.revokeSession(session.sessionId, session.accountId);
  }

  async verifyAccessToken(token: string): Promise<ProviderIdentity> {
    const session = await this.verify(token);
    return { provider: 'local', subject: session.accountId };
  }

  async resolveCreatorId(identity: ProviderIdentity): Promise<string | undefined> {
    return identity.provider === 'local'
      ? this.repository.findCreatorId(identity.subject)
      : undefined;
  }
}
