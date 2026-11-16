import { randomUUID, createHash } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import { createPostgresDatabase } from '../../adapters/persistence/postgres/postgres-database.js';
import { PostgresLocalAuthRepository } from '../../adapters/persistence/postgres/postgres-local-auth-repository.js';
import { LocalAuthService } from '../../applications/account-identity-membership/local-auth-service.js';
import { createApiServer } from '../../apps/api/src/create-api-server.js';

const url = process.env.LOCAL_AUTH_TEST_DATABASE_URL;
const key = 'independent-bff-test-secret-at-least-32-bytes';
describe.skipIf(!url)('Creator BFF-only upstream revocation with PostgreSQL', () => {
  const database = createPostgresDatabase(url!);
  const service = new LocalAuthService(
    new PostgresLocalAuthRepository(database.client),
    'test-jwt-secret-at-least-thirty-two-bytes',
  );
  afterAll(() => database.close());
  const signup = () =>
    service.signup(`${randomUUID()}@example.test`, 'test-password', undefined, {
      correlationId: 'revocation-test',
    });

  it('requires BFF authentication, revokes by hash, and explicitly confirms repeated revocation', async () => {
    const server = await createApiServer({
      localAuthService: service,
      creatorBffRevocationSecret: key,
    });
    const auth = await signup();
    const call = (secret?: string) =>
      server.inject({
        method: 'POST',
        url: '/api/v1/auth/revoke-session',
        headers: secret ? { 'x-creator-bff-revocation-secret': secret } : {},
        payload: { refreshToken: auth.refreshToken },
      });
    try {
      expect((await call()).statusCode).toBe(403);
      expect((await call('wrong')).statusCode).toBe(403);
      const first = await call(key);
      expect(first.statusCode).toBe(200);
      expect(first.json()).toEqual({ state: 'revoked' });
      expect((await call(key)).json()).toEqual({ state: 'already_revoked' });
      await expect(service.refresh(auth.refreshToken)).rejects.toMatchObject({
        code: 'invalid_token',
      });
      await expect(service.verifyAccessToken(auth.accessToken)).rejects.toMatchObject({
        code: 'invalid_access_token',
      });
    } finally {
      await server.close();
    }
  });

  it('rejects unknown and expired refresh credentials rather than treating 401 as logout success', async () => {
    await expect(service.revokeWithRefreshToken('unknown')).rejects.toMatchObject({
      code: 'invalid_refresh_token',
    });
    const auth = await signup();
    const hash = createHash('sha256').update(auth.refreshToken).digest('hex');
    await database.client`UPDATE local_auth_sessions SET expires_at=now()-interval '1 minute' WHERE refresh_hash=${hash}`;
    await expect(service.revokeWithRefreshToken(auth.refreshToken)).rejects.toMatchObject({
      code: 'expired_refresh_token',
    });
  });

  it('recognizes sessions already revoked by the existing access-token logout', async () => {
    const auth = await signup();
    await service.logout(auth.accessToken);
    expect(await service.revokeWithRefreshToken(auth.refreshToken)).toEqual({
      state: 'already_revoked',
    });
  });

  it('never reactivates a session when upstream refresh races revocation', async () => {
    for (let i = 0; i < 8; i++) {
      const auth = await signup();
      const [refresh, revoke] = await Promise.allSettled([
        service.refresh(auth.refreshToken),
        service.revokeWithRefreshToken(auth.refreshToken),
      ]);
      if (refresh.status === 'fulfilled') {
        // Refresh won the hash race; the caller must retain and retry with its rotated credential.
        expect(revoke.status).toBe('rejected');
        expect(await service.revokeWithRefreshToken(refresh.value.refreshToken)).toEqual({
          state: 'revoked',
        });
        await expect(service.refresh(refresh.value.refreshToken)).rejects.toMatchObject({
          code: 'invalid_token',
        });
        await expect(service.verifyAccessToken(refresh.value.accessToken)).rejects.toMatchObject({
          code: 'invalid_access_token',
        });
      } else {
        expect(revoke.status).toBe('fulfilled');
      }
      await expect(service.refresh(auth.refreshToken)).rejects.toMatchObject({
        code: 'invalid_token',
      });
    }
  });
});
