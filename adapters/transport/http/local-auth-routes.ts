import type { FastifyInstance } from 'fastify';
import { Type } from 'typebox';
import type { LocalAuthService } from '../../../applications/account-identity-membership/local-auth-service.js';
import { extractBearerToken } from '../../auth/transport/bearer-token.js';

export function registerLocalAuthRoutes(server: FastifyInstance, service: LocalAuthService): void {
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
      reply
        .status(201)
        .send(await service.signup(request.body.email, request.body.password, request.body.name, { correlationId: request.id })),
  );
  server.post<{ Body: { email: string; password: string } }>(
    '/api/v1/auth/login',
    { schema: { body: credentials }, config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (request) => service.login(request.body.email, request.body.password, { correlationId: request.id }),
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
  server.post('/api/v1/auth/logout', async (request) => {
    await service.logout(extractBearerToken(request.headers.authorization));
    return { ok: true };
  });
  server.post('/api/v1/auth/workspace/initialize', async (request) => {
    await service.ensureWorkspace(extractBearerToken(request.headers.authorization), { correlationId: request.id });
    return { ok: true };
  });
}
