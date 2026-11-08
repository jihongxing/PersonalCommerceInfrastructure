import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import { createPostgresCreatorIdentityComposition } from '../../adapters/persistence/postgres/postgres-creator-identity-composition.js';
import { createApiServer } from '../../apps/api/src/create-api-server.js';

const databaseUrl = process.env.LOCAL_AUTH_TEST_DATABASE_URL;
type AuthResult = { accessToken: string; setupPending: boolean };
type ReferenceResult = { commerceReference: string };
type ProfileResult = { commerceProfileId: string; commerceReference: string };

describe.skipIf(!databaseUrl)('Identity C number with PostgreSQL and local authentication', () => {
  const composition = createPostgresCreatorIdentityComposition(
    { databaseUrl: databaseUrl! },
    { localAuthSecret: 'integration-test-secret-at-least-32-bytes' },
    'http://localhost:3000',
    { deliver: () => Promise.resolve() },
    { operationsAccessToken: 'test-token', operationsOperatorId: 'test' },
  );
  afterAll(async () => composition.database.close());

  it('allocates at registration, survives login and concurrent recovery, and is shared by owned Profiles', async () => {
    const server = await createApiServer({
      localAuthService: composition.localAuthService,
      authContextProvider: composition.authContextProvider,
      creatorIdentityService: composition.service,
      currentUserIdentityService: composition.currentUserIdentityService,
      selfServiceIdentityInitializationService:
        composition.selfServiceIdentityInitializationService,
      privateCommerceProfileService: composition.privateCommerceProfileService,
      privateCommerceReferenceService: composition.privateCommerceReferenceService,
    });
    try {
      const email = `${randomUUID()}@example.test`;
      const signup = await server.inject({
        method: 'POST',
        url: '/api/v1/auth/signup',
        payload: { email, password: 'correct-password', name: 'Owner' },
      });
      expect(signup.statusCode).toBe(201);
      const account = signup.json<AuthResult>();
      expect(account.setupPending).toBe(false);
      const headers = { authorization: `Bearer ${account.accessToken}` };
      const first = await server.inject({
        method: 'GET',
        url: '/api/v1/private/identity/reference',
        headers,
      });
      expect(first.statusCode).toBe(200);
      const reference = first.json<ReferenceResult>().commerceReference;
      expect(reference).toMatch(/^[3479ACDEFHJKMNPQRTVWXY]{18}$/u);
      const initialized = await Promise.all(
        Array.from({ length: 5 }, () =>
          server.inject({ method: 'POST', url: '/api/v1/auth/workspace/initialize', headers }),
        ),
      );
      expect(initialized.map((response) => response.statusCode)).toEqual([200, 200, 200, 200, 200]);
      const profiles = await Promise.all(
        ['One', 'Two'].map((displayName) =>
          server.inject({
            method: 'POST',
            url: '/api/v1/private/profiles',
            headers,
            payload: { displayName },
          }),
        ),
      );
      expect(profiles.map((response) => response.statusCode)).toEqual([201, 201]);
      for (const profile of profiles) {
        expect(profile.json<ProfileResult>().commerceReference).toBe(reference);
        const response = await server.inject({
          method: 'GET',
          url: `/api/v1/private/profiles/${profile.json<ProfileResult>().commerceProfileId}/reference`,
          headers,
        });
        expect(response.statusCode).toBe(200);
        expect(response.json<ReferenceResult>().commerceReference).toBe(reference);
      }
      const profileId = profiles[0]!.json<ProfileResult>().commerceProfileId;
      expect(
        (
          await server.inject({
            method: 'PATCH',
            url: `/api/v1/private/profiles/${profileId}`,
            headers,
            payload: { displayName: 'Renamed' },
          })
        ).statusCode,
      ).toBe(200);
      expect(
        (
          await server.inject({
            method: 'POST',
            url: `/api/v1/private/profiles/${profileId}/archive`,
            headers,
          })
        ).statusCode,
      ).toBe(200);
      const afterArchive = await server.inject({
        method: 'GET',
        url: '/api/v1/private/identity/reference',
        headers,
      });
      expect(afterArchive.json<ReferenceResult>().commerceReference).toBe(reference);
      const other = await server.inject({
        method: 'POST',
        url: '/api/v1/auth/signup',
        payload: { email: `${randomUUID()}@example.test`, password: 'correct-password' },
      });
      const forbidden = await server.inject({
        method: 'GET',
        url: `/api/v1/private/profiles/${profiles[0]!.json<ProfileResult>().commerceProfileId}/reference`,
        headers: { authorization: `Bearer ${other.json<AuthResult>().accessToken}` },
      });
      expect(forbidden.statusCode).toBe(404);
      const login = await server.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { email, password: 'correct-password' },
      });
      const again = await server.inject({
        method: 'GET',
        url: '/api/v1/private/identity/reference',
        headers: { authorization: `Bearer ${login.json<AuthResult>().accessToken}` },
      });
      expect(again.json<ReferenceResult>().commerceReference).toBe(reference);
      const sql = composition.database.client;
      const rows =
        await sql<{ identity_id: string }[]>`select identity_id from commerce_references where commerce_reference = ${reference}`;
      expect(rows).toHaveLength(1);
      await expect(
        sql`delete from commerce_references where commerce_reference = ${reference}`,
      ).rejects.toThrow();
      await expect(
        sql`update commerce_references set commerce_reference = ${'3'.repeat(18)} where commerce_reference = ${reference}`,
      ).rejects.toThrow();
      await expect(
        sql`insert into commerce_references (identity_id, commerce_reference, assigned_at) values (${rows[0]!.identity_id}, ${'4'.repeat(18)}, now())`,
      ).rejects.toThrow();
    } finally {
      await server.close();
    }
  }, 30000);
});
