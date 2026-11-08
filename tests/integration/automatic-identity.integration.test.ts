import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import { createPostgresCreatorIdentityComposition } from '../../adapters/persistence/postgres/postgres-creator-identity-composition.js';
import { PostgresLocalAuthRepository } from '../../adapters/persistence/postgres/postgres-local-auth-repository.js';
import { LocalAuthService } from '../../applications/account-identity-membership/local-auth-service.js';
import { createApiServer } from '../../apps/api/src/create-api-server.js';

const databaseUrl = process.env.LOCAL_AUTH_TEST_DATABASE_URL;
type AuthResult = { accessToken: string; setupPending: boolean; user: { name?: string } };
type IdentityResult = {
  creatorId: string;
  state: string;
  profile: { displayName: string; bio: string };
};

describe.skipIf(!databaseUrl)('automatic local identity initialization', () => {
  const composition = createPostgresCreatorIdentityComposition(
    { databaseUrl: databaseUrl! },
    { localAuthSecret: 'integration-test-secret-at-least-32-bytes' },
    'http://localhost:3000',
    { deliver: () => Promise.resolve() },
    { operationsAccessToken: 'test-token', operationsOperatorId: 'test' },
  );
  const service = composition.localAuthService!;
  const oldService = new LocalAuthService(
    new PostgresLocalAuthRepository(composition.database.client),
    'integration-test-secret-at-least-32-bytes',
  );
  afterAll(async () => composition.database.close());

  it('creates identities at signup, preserves edited profile on login and separates accounts', async () => {
    const server = await createApiServer({
      localAuthService: service,
      authContextProvider: composition.authContextProvider,
      creatorIdentityService: composition.service,
      serviceOfferingService: composition.offeringService,
      currentUserIdentityService: composition.currentUserIdentityService,
      selfServiceIdentityInitializationService:
        composition.selfServiceIdentityInitializationService,
    });
    try {
      const email = `${randomUUID()}@example.test`;
      const signup = await server.inject({
        method: 'POST',
        url: '/api/v1/auth/signup',
        payload: { email, password: 'correct-password', name: '注册姓名' },
      });
      expect(signup.statusCode).toBe(201);
      const signedUp = signup.json<AuthResult>();
      expect(signedUp.setupPending).toBe(false);
      const headers = { authorization: `Bearer ${signedUp.accessToken}` };
      expect(
        (await server.inject({ method: 'GET', url: '/api/v1/private/identity', headers }))
          .statusCode,
      ).toBe(200);
      const identity = await server.inject({
        method: 'GET',
        url: '/api/v1/creator/identity',
        headers,
      });
      expect(identity.statusCode).toBe(200);
      const firstIdentity = identity.json<IdentityResult>();
      expect(firstIdentity.profile).toMatchObject({ displayName: '注册姓名', bio: '' });
      expect(firstIdentity.state).toBe('draft');
      const capability = await server.inject({
        method: 'POST',
        url: '/api/v1/creator/identity/capabilities',
        headers,
        payload: { name: '教学', description: '课程辅导' },
      });
      const capabilityId = capability.json<{ capabilityIds: string[] }>().capabilityIds[0];
      const offering = await server.inject({
        method: 'POST',
        url: '/api/v1/creator/offerings',
        headers,
        payload: {
          capabilityIds: [capabilityId],
          title: '课程',
          description: '一对一课程',
          availabilityDescription: '周末',
          requestInstructions: '请提供时间',
        },
      });
      expect(offering.statusCode).toBe(201);
      const publishUrl = `/api/v1/creator/offerings/${offering.json<{ id: string }>().id}/publish`;
      const incomplete = await server.inject({ method: 'POST', url: publishUrl, headers });
      expect(incomplete.statusCode).toBe(400);
      expect(incomplete.json<{ error: { code: string } }>().error.code).toBe(
        'commerce_identity_profile_incomplete',
      );
      const update = await server.inject({
        method: 'PATCH',
        url: '/api/v1/creator/identity',
        headers,
        payload: { profile: { displayName: '商业名称', bio: '简介', socialLinks: [] } },
      });
      expect(update.statusCode).toBe(200);
      expect((await server.inject({ method: 'POST', url: publishUrl, headers })).statusCode).toBe(
        200,
      );
      const login = await server.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { email, password: 'correct-password' },
      });
      expect(login.statusCode).toBe(200);
      const loggedIn = login.json<AuthResult>();
      expect(loggedIn.user.name).toBe('注册姓名');
      expect(loggedIn.setupPending).toBe(false);
      const afterLogin = await server.inject({
        method: 'GET',
        url: '/api/v1/creator/identity',
        headers: { authorization: `Bearer ${loggedIn.accessToken}` },
      });
      expect(afterLogin.json<IdentityResult>().profile).toMatchObject({
        displayName: '商业名称',
        bio: '简介',
      });
      const other = await service.signup(`${randomUUID()}@example.test`, 'correct-password', undefined, { correlationId: 'test-other' });
      const otherIdentity = await server.inject({
        method: 'GET',
        url: '/api/v1/creator/identity',
        headers: { authorization: `Bearer ${other.accessToken}` },
      });
      expect(otherIdentity.statusCode).toBe(200);
      expect(otherIdentity.json<IdentityResult>().creatorId).not.toBe(firstIdentity.creatorId);
      expect(otherIdentity.json<IdentityResult>().profile).toMatchObject({
        displayName: '',
        bio: '',
      });
    } finally {
      await server.close();
    }
  });

  it('repairs existing sessions and reports failures for retry', async () => {
    const old = await oldService.signup(
      `${randomUUID()}@example.test`,
      'correct-password',
      '旧账号',
      { correlationId: 'test-old' },
    );
    const server = await createApiServer({
      localAuthService: service,
      authContextProvider: composition.authContextProvider,
      creatorIdentityService: composition.service,
    });
    try {
      const headers = { authorization: `Bearer ${old.accessToken}` };
      const attempts = await Promise.all(
        [1, 2].map(() =>
          server.inject({ method: 'POST', url: '/api/v1/auth/workspace/initialize', headers }),
        ),
      );
      expect(attempts.map((result) => result.statusCode)).toEqual([200, 200]);
      const identity = await server.inject({
        method: 'GET',
        url: '/api/v1/creator/identity',
        headers,
      });
      expect(identity.json<IdentityResult>().profile).toMatchObject({
        displayName: '旧账号',
        bio: '',
      });
      const failing = new LocalAuthService(
        new PostgresLocalAuthRepository(composition.database.client),
        'integration-test-secret-at-least-32-bytes',
        () => Promise.reject(new Error('database unavailable')),
      );
      const failingServer = await createApiServer({ localAuthService: failing });
      try {
        const failedSignup = await failing.signup(
          `${randomUUID()}@example.test`,
          'correct-password',
          undefined,
          { correlationId: 'test-failed' },
        );
        expect(failedSignup.setupPending).toBe(true);
        const failed = await failingServer.inject({
          method: 'POST',
          url: '/api/v1/auth/workspace/initialize',
          headers: { authorization: `Bearer ${failedSignup.accessToken}` },
        });
        expect(failed.statusCode).toBe(500);
      } finally {
        await failingServer.close();
      }
    } finally {
      await server.close();
    }
  });
});
