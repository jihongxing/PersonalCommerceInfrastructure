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
});
