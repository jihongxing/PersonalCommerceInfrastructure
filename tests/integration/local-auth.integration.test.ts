import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import { createPostgresDatabase } from '../../adapters/persistence/postgres/postgres-database.js';
import { PostgresLocalAuthRepository } from '../../adapters/persistence/postgres/postgres-local-auth-repository.js';
import { LocalAuthService } from '../../applications/account-identity-membership/local-auth-service.js';
import { createAuthContextProvider } from '../../applications/core/ports/auth-context-provider.js';
import { createApiServer } from '../../apps/api/src/create-api-server.js';

const databaseUrl = process.env.LOCAL_AUTH_TEST_DATABASE_URL;

describe.skipIf(!databaseUrl)('local auth with PostgreSQL', () => {
  const database = createPostgresDatabase(databaseUrl!);
  const service = new LocalAuthService(
    new PostgresLocalAuthRepository(database.client),
    'integration-test-secret-at-least-32-bytes',
  );
  const auth = createAuthContextProvider({ tokenVerifier: service, creatorActorResolver: service });
  afterAll(async () => database.close());

  it('registers, signs in, rotates and revokes a session, and isolates Creator mappings', async () => {
    const server = await createApiServer({ localAuthService: service, authContextProvider: auth });
    const email = `${randomUUID()}@example.test`;
    try {
      const signup = await server.inject({
        method: 'POST',
        url: '/api/v1/auth/signup',
        payload: { email, password: 'correct-password', name: 'Test' },
      });
      expect(signup.statusCode).toBe(201);
      const first: {
        accessToken: string;
        refreshToken: string;
        user: { id: string };
      } = signup.json();
      const rows =
        await database.client`SELECT password_hash FROM local_auth_accounts WHERE email = ${email}`;
      expect(rows[0]?.password_hash).toMatch(/^scrypt:/);
      expect(rows[0]?.password_hash).not.toContain('correct-password');
      const actor = await auth.resolveActorContext({
        accessToken: first.accessToken,
        correlationId: 'test',
      });
      expect(actor.actor.kind).toBe('creator');
      if (actor.actor.kind !== 'creator') throw new Error('Expected a mapped Creator actor.');
      expect(actor.actor.creatorId).not.toBe(first.user.id);
      const otherSignup = await server.inject({
        method: 'POST',
        url: '/api/v1/auth/signup',
        payload: { email: `${randomUUID()}@example.test`, password: 'correct-password' },
      });
      expect(otherSignup.statusCode).toBe(201);
      const other: { accessToken: string } = otherSignup.json();
      const otherActor = await auth.resolveActorContext({
        accessToken: other.accessToken,
        correlationId: 'test-other',
      });
      expect(otherActor.actor.kind).toBe('creator');
      if (otherActor.actor.kind !== 'creator') throw new Error('Expected another Creator actor.');
      expect(otherActor.actor.creatorId).not.toBe(actor.actor.creatorId);
      expect(
        (
          await server.inject({
            method: 'POST',
            url: '/api/v1/auth/signup',
            payload: { email: email.toUpperCase(), password: 'correct-password' },
          })
        ).statusCode,
      ).toBe(409);
      expect(
        (
          await server.inject({
            method: 'POST',
            url: '/api/v1/auth/login',
            payload: { email, password: 'wrong-password' },
          })
        ).statusCode,
      ).toBe(401);
      expect(
        (
          await server.inject({
            method: 'POST',
            url: '/api/v1/auth/login',
            payload: { email, password: 'correct-password' },
          })
        ).statusCode,
      ).toBe(200);
      const rotated = await server.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        payload: { refreshToken: first.refreshToken },
      });
      expect(rotated.statusCode).toBe(200);
      expect(
        (
          await server.inject({
            method: 'POST',
            url: '/api/v1/auth/refresh',
            payload: { refreshToken: first.refreshToken },
          })
        ).statusCode,
      ).toBe(401);
      const second: { accessToken: string; refreshToken: string } = rotated.json();
      expect(second.refreshToken).not.toBe(first.refreshToken);
      expect(
        (
          await server.inject({
            method: 'POST',
            url: '/api/v1/auth/logout',
            headers: { authorization: `Bearer ${second.accessToken}` },
          })
        ).statusCode,
      ).toBe(200);
      await expect(service.verifyAccessToken(second.accessToken)).rejects.toMatchObject({
        code: 'invalid_access_token',
      });
      expect(
        (
          await server.inject({
            method: 'POST',
            url: '/api/v1/auth/refresh',
            payload: { refreshToken: second.refreshToken },
          })
        ).statusCode,
      ).toBe(401);
    } finally {
      await server.close();
    }
  });

  it('uses expiring single-use reset tokens and revokes all sessions', async () => {
    const deliveries: { email: string; token: string }[] = [];
    const recovery = new LocalAuthService(
      new PostgresLocalAuthRepository(database.client),
      'integration-test-secret-at-least-32-bytes',
      undefined,
      undefined,
      {
        send: (email, token) => {
          deliveries.push({ email, token });
          return Promise.resolve();
        },
      },
    );
    const server = await createApiServer({ localAuthService: recovery });
    const email = `${randomUUID()}@example.test`;
    try {
      const signup = await server.inject({
        method: 'POST',
        url: '/api/v1/auth/signup',
        payload: { email, password: 'correct-password' },
      });
      const first: { accessToken: string; refreshToken: string } = signup.json();
      expect(signup.statusCode).toBe(201);
      const unknown = await server.inject({
        method: 'POST',
        url: '/api/v1/auth/forgot-password',
        payload: { email: `${randomUUID()}@example.test` },
      });
      const known = await server.inject({
        method: 'POST',
        url: '/api/v1/auth/forgot-password',
        payload: { email },
      });
      expect(unknown.statusCode).toBe(200);
      expect(known.json()).toEqual(unknown.json());
      expect(deliveries).toHaveLength(0);
      expect(await recovery.processNextPasswordRecovery()).toBe(true);
      expect(await recovery.processNextPasswordRecovery()).toBe(true);
      expect(deliveries).toHaveLength(1);
      const token = deliveries[0]!.token;
      const stored = await database.client<
        { token_hash: string }[]
      >`SELECT token_hash FROM local_auth_password_resets WHERE account_id = (SELECT id FROM local_auth_accounts WHERE email = ${email})`;
      expect(stored[0]?.token_hash).not.toBe(token);
      await database.client`UPDATE local_auth_password_resets SET expires_at = now() - interval '1 second' WHERE token_hash = ${stored[0]!.token_hash}`;
      expect(
        (
          await server.inject({
            method: 'POST',
            url: '/api/v1/auth/reset-password',
            payload: { token, newPassword: 'new-password' },
          })
        ).statusCode,
      ).toBe(401);
      await server.inject({
        method: 'POST',
        url: '/api/v1/auth/forgot-password',
        payload: { email },
      });
      expect(await recovery.processNextPasswordRecovery()).toBe(true);
      const fresh = deliveries[1]!.token;
      const attempts = await Promise.all(
        [1, 2].map(() =>
          server.inject({
            method: 'POST',
            url: '/api/v1/auth/reset-password',
            payload: { token: fresh, newPassword: 'new-password' },
          }),
        ),
      );
      expect(attempts.map((result) => result.statusCode).sort()).toEqual([200, 401]);
      await expect(recovery.verifyAccessToken(first.accessToken)).rejects.toMatchObject({
        code: 'invalid_access_token',
      });
      expect(
        (
          await server.inject({
            method: 'POST',
            url: '/api/v1/auth/refresh',
            payload: { refreshToken: first.refreshToken },
          })
        ).statusCode,
      ).toBe(401);
      expect(
        (
          await server.inject({
            method: 'POST',
            url: '/api/v1/auth/login',
            payload: { email, password: 'correct-password' },
          })
        ).statusCode,
      ).toBe(401);
      expect(
        (
          await server.inject({
            method: 'POST',
            url: '/api/v1/auth/login',
            payload: { email, password: 'new-password' },
          })
        ).statusCode,
      ).toBe(200);
    } finally {
      await server.close();
    }
  });

  it('recovers a leased request and retries delivery with the same valid token', async () => {
    const sent: string[] = [];
    let fail = true;
    const repository = new PostgresLocalAuthRepository(database.client);
    const recovery = new LocalAuthService(
      repository,
      'integration-test-secret-at-least-32-bytes',
      undefined,
      undefined,
      {
        send: (_email, token) => {
          sent.push(token);
          return fail
            ? Promise.reject(new Error('controlled delivery failure'))
            : Promise.resolve();
        },
      },
    );
    const email = `${randomUUID()}@example.test`;
    await recovery.signup(email, 'correct-password', undefined, { correlationId: 'test' });
    await recovery.forgotPassword(email);
    const abandoned = await repository.claimPasswordRecovery(randomUUID());
    expect(abandoned).toMatchObject({ email });
    expect(await recovery.processNextPasswordRecovery()).toBe(false);
    await database.client`UPDATE local_auth_password_recovery_requests SET lease_until = now() - interval '1 second' WHERE id = ${abandoned!.id}`;
    expect(await recovery.processNextPasswordRecovery()).toBe(true);
    expect(sent).toHaveLength(1);
    expect(await recovery.processNextPasswordRecovery()).toBe(false);
    await database.client`UPDATE local_auth_password_recovery_requests SET available_at = now() WHERE id = ${abandoned!.id}`;
    fail = false;
    expect(await recovery.processNextPasswordRecovery()).toBe(true);
    expect(sent).toEqual([sent[0], sent[0]]);
    expect(await recovery.processNextPasswordRecovery()).toBe(false);
    await recovery.resetPassword(sent[0]!, 'new-password');
    await expect(
      recovery.login(email, 'new-password', { correlationId: 'test' }),
    ).resolves.toBeDefined();
  });

  it('does not retry a link superseded by a newer request', async () => {
    const sent: string[] = [];
    let fail = true;
    const repository = new PostgresLocalAuthRepository(database.client);
    const recovery = new LocalAuthService(
      repository,
      'integration-test-secret-at-least-32-bytes',
      undefined,
      undefined,
      {
        send: (_email, token) => {
          sent.push(token);
          return fail
            ? Promise.reject(new Error('controlled delivery failure'))
            : Promise.resolve();
        },
      },
    );
    const email = `${randomUUID()}@example.test`;
    await recovery.signup(email, 'correct-password', undefined, { correlationId: 'test' });
    await recovery.forgotPassword(email);
    expect(await recovery.processNextPasswordRecovery()).toBe(true);
    await recovery.forgotPassword(email);
    fail = false;
    expect(await recovery.processNextPasswordRecovery()).toBe(true);
    await database.client`UPDATE local_auth_password_recovery_requests SET available_at = now() WHERE email = ${email}`;
    expect(await recovery.processNextPasswordRecovery()).toBe(true);
    expect(sent).toHaveLength(2);
    await expect(recovery.resetPassword(sent[0]!, 'new-password')).rejects.toMatchObject({
      code: 'invalid_reset_token',
    });
    await recovery.resetPassword(sent[1]!, 'new-password');
  });

  it('claims each request once across workers and removes expired or exhausted requests', async () => {
    const repository = new PostgresLocalAuthRepository(database.client);
    const id = randomUUID();
    await repository.enqueuePasswordRecovery(
      id,
      `${randomUUID()}@example.test`,
      new Date(Date.now() + 60_000),
    );
    const claims = await Promise.all(
      Array.from({ length: 5 }, () => repository.claimPasswordRecovery(randomUUID())),
    );
    expect(claims.filter(Boolean)).toHaveLength(1);
    expect(claims.find(Boolean)?.id).toBe(id);
    await database.client`UPDATE local_auth_password_recovery_requests SET attempts = 5, lease_until = now() - interval '1 second' WHERE id = ${id}`;
    expect(await repository.claimPasswordRecovery(randomUUID())).toBeUndefined();
    const expiredId = randomUUID();
    await repository.enqueuePasswordRecovery(
      expiredId,
      `${randomUUID()}@example.test`,
      new Date(Date.now() - 1000),
    );
    expect(await repository.claimPasswordRecovery(randomUUID())).toBeUndefined();
    const remaining =
      await database.client`SELECT id FROM local_auth_password_recovery_requests WHERE id IN (${id}, ${expiredId})`;
    expect(remaining).toHaveLength(0);
  });

  it('reports unavailable when mail delivery is not configured', async () => {
    await expect(service.forgotPassword('any@example.test')).rejects.toMatchObject({
      code: 'password_recovery_unavailable',
    });
  });
});
