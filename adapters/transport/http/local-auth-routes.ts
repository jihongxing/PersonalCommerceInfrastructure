import type { FastifyInstance } from 'fastify';
import { Type } from 'typebox';
import { timingSafeEqual } from 'node:crypto';
import type { LocalAuthService } from '../../../applications/account-identity-membership/local-auth-service.js';
import { extractBearerToken } from '../../auth/transport/bearer-token.js';

export function registerLocalAuthRoutes(
  server: FastifyInstance,
  service: LocalAuthService,
  bffRevocationSecret?: string,
): void {
  if (bffRevocationSecret !== undefined && Buffer.byteLength(bffRevocationSecret) < 32)
    throw new Error('CREATOR_BFF_REVOCATION_SECRET must contain at least 32 bytes.');
  server.post<{ Body: { refreshToken: string } }>(
    '/api/v1/auth/revoke-session',
    {
      schema: {
        body: Type.Object(
          { refreshToken: Type.String({ minLength: 1, maxLength: 512 }) },
          { additionalProperties: false },
        ),
        response: {
          200: Type.Object({
            state: Type.Union([Type.Literal('revoked'), Type.Literal('already_revoked')]),
          }),
        },
      },
      preHandler: async (request, reply) => {
        const supplied = request.headers['x-creator-bff-revocation-secret'];
        const expected = bffRevocationSecret ? Buffer.from(bffRevocationSecret) : undefined;
        const actual = typeof supplied === 'string' ? Buffer.from(supplied) : undefined;
        if (
          !expected ||
          !actual ||
          expected.length !== actual.length ||
          !timingSafeEqual(expected, actual)
        ) {
          return reply
            .status(403)
            .send({ error: { code: 'bff_required', message: 'Server authentication required.' } });
        }
      },
    },
    async (request) => service.revokeWithRefreshToken(request.body.refreshToken),
  );
  const credentials = Type.Object(
    {
      email: Type.String({ minLength: 3, maxLength: 255 }),
      password: Type.String({ minLength: 1, maxLength: 128 }),
      name: Type.Optional(Type.String({ maxLength: 120 })),
    },
    { additionalProperties: false },
  );
  server.post<{ Body: { email: string; password: string; name?: string } }>(
    '/api/v1/auth/signup',
    { schema: { body: credentials }, config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (request, reply) =>
      reply.status(201).send(
        await service.signup(request.body.email, request.body.password, request.body.name, {
          correlationId: request.id,
        }),
      ),
  );
  server.post<{ Body: { email: string; password: string } }>(
    '/api/v1/auth/login',
    { schema: { body: credentials }, config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (request) =>
      service.login(request.body.email, request.body.password, { correlationId: request.id }),
  );
  server.post<{ Body: { refreshToken: string } }>(
    '/api/v1/auth/refresh',
    {
      schema: {
        body: Type.Object(
          { refreshToken: Type.String({ minLength: 1, maxLength: 512 }) },
          { additionalProperties: false },
        ),
      },
    },
    async (request) => service.refresh(request.body.refreshToken),
  );
  server.post<{ Body: { email: string } }>(
    '/api/v1/auth/forgot-password',
    {
      schema: {
        body: Type.Object(
          { email: Type.String({ minLength: 3, maxLength: 255 }) },
          { additionalProperties: false },
        ),
      },
      config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
    },
    async (request) => {
      await service.forgotPassword(request.body.email);
      return { ok: true };
    },
  );
  server.post<{ Body: { token: string; newPassword: string } }>(
    '/api/v1/auth/reset-password',
    {
      schema: {
        body: Type.Object(
          {
            token: Type.String({ minLength: 1, maxLength: 512 }),
            newPassword: Type.String({ minLength: 8, maxLength: 128 }),
          },
          { additionalProperties: false },
        ),
      },
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    async (request) => {
      await service.resetPassword(request.body.token, request.body.newPassword);
      return { ok: true };
    },
  );
  server.post('/api/v1/auth/logout', async (request) => {
    await service.logout(extractBearerToken(request.headers.authorization));
    return { ok: true };
  });
  server.post('/api/v1/auth/workspace/initialize', async (request) => {
    await service.ensureWorkspace(extractBearerToken(request.headers.authorization), {
      correlationId: request.id,
    });
    return { ok: true };
  });
}
