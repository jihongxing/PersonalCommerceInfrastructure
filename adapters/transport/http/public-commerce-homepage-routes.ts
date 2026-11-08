import type { FastifyInstance, FastifyRequest } from 'fastify';
import { Type } from 'typebox';
import type { AuthContextProvider } from '../../../applications/core/ports/auth-context-provider.js';
import type { PublicHomepageService } from '../../../applications/public-commerce-homepage/public-commerce-homepage-service.js';
import {
  HomepageConfigurationSchema,
  HomepageManagementSchema,
  HomepagePreviewQuerySchema,
  HomepageVersionInputSchema,
  HomepageVersionSchema,
  HomepageWindowInputSchema,
  HomepageWindowSchema,
  HomepageWindowUpdateSchema,
  PublicHomepageSchema,
} from '../../../contracts/api/v1/public-commerce-homepage-contracts.js';
import { ApiErrorEnvelopeSchema } from '../../../contracts/api/v1/system-contracts.js';
import { extractBearerToken } from '../../auth/transport/bearer-token.js';

export function registerPublicCommerceHomepageRoutes(
  server: FastifyInstance,
  dependencies: {
    readonly authContextProvider: AuthContextProvider;
    readonly service: PublicHomepageService;
  },
): void {
  server.addHook('onRequest', (request, reply, done) => {
    const route = request.routeOptions.url;
    if (
      route?.startsWith('/api/v1/private/homepage') ||
      route?.startsWith('/api/v1/public/homepages/')
    ) {
      reply.header('cache-control', 'no-store');
    }
    done();
  });
  const auth = (request: FastifyRequest) =>
    dependencies.authContextProvider.resolveAccountContext({
      accessToken: extractBearerToken(request.headers.authorization),
      correlationId: request.id,
    });
  const errors = {
    400: ApiErrorEnvelopeSchema,
    401: ApiErrorEnvelopeSchema,
    403: ApiErrorEnvelopeSchema,
    404: ApiErrorEnvelopeSchema,
    409: ApiErrorEnvelopeSchema,
    500: ApiErrorEnvelopeSchema,
  };
  const privatePath = '/api/v1/private/homepage';
  const privateVersionsPath = '/api/v1/private/homepages';
  server.get(
    privatePath,
    {
      schema: {
        operationId: 'getMyHomepage',
        tags: ['public-homepage'],
        response: { 200: HomepageConfigurationSchema, ...errors },
      },
    },
    async (request, reply) => {
      reply.header('cache-control', 'no-store');
      return dependencies.service.configuration(await auth(request));
    },
  );

  server.get(
    privateVersionsPath,
    {
      schema: {
        operationId: 'listMyHomepages',
        tags: ['public-homepage'],
        response: { 200: HomepageManagementSchema, ...errors },
      },
    },
    async (request, reply) => {
      reply.header('cache-control', 'no-store');
      return dependencies.service.management(await auth(request));
    },
  );
  server.post(
    privateVersionsPath,
    {
      schema: {
        operationId: 'createHomepageVersion',
        tags: ['public-homepage'],
        body: HomepageVersionInputSchema,
        response: { 201: HomepageVersionSchema, ...errors },
      },
    },
    async (request, reply) => {
      reply.header('cache-control', 'no-store');
      const result = await dependencies.service.createVersion(
        await auth(request),
        (request.body as { profileId: string }).profileId,
      );
      return reply.status(201).send(result);
    },
  );
  server.patch(
    `${privateVersionsPath}/:homepageId`,
    {
      schema: {
        operationId: 'updateHomepageVersion',
        tags: ['public-homepage'],
        params: Type.Object({ homepageId: Type.String({ minLength: 1, maxLength: 128 }) }),
        body: HomepageVersionInputSchema,
        response: { 200: HomepageVersionSchema, ...errors },
      },
    },
    async (request, reply) => {
      reply.header('cache-control', 'no-store');
      return dependencies.service.updateVersion(
        await auth(request),
        (request.params as { homepageId: string }).homepageId,
        (request.body as { profileId: string }).profileId,
      );
    },
  );
  for (const action of ['publish', 'pause'] as const) {
    server.post(
      `${privateVersionsPath}/:homepageId/${action}`,
      {
        schema: {
          operationId: `${action}HomepageVersion`,
          tags: ['public-homepage'],
          params: Type.Object({ homepageId: Type.String({ minLength: 1, maxLength: 128 }) }),
          response: { 200: HomepageVersionSchema, ...errors },
        },
      },
      async (request, reply) => {
        reply.header('cache-control', 'no-store');
        return dependencies.service.transitionVersion(
          await auth(request),
          (request.params as { homepageId: string }).homepageId,
          action,
        );
      },
    );
  }
  server.post(
    `${privateVersionsPath}/:homepageId/archive`,
    {
      schema: {
        operationId: 'archiveHomepageVersion',
        tags: ['public-homepage'],
        params: Type.Object({ homepageId: Type.String({ minLength: 1, maxLength: 128 }) }),
        response: { 200: HomepageVersionSchema, ...errors },
      },
    },
    async (request, reply) => {
      reply.header('cache-control', 'no-store');
      return dependencies.service.archiveVersion(
        await auth(request),
        (request.params as { homepageId: string }).homepageId,
      );
    },
  );
  server.post(
    `${privateVersionsPath}/:homepageId/default`,
    {
      schema: {
        operationId: 'setDefaultHomepageVersion',
        tags: ['public-homepage'],
        params: Type.Object({ homepageId: Type.String({ minLength: 1, maxLength: 128 }) }),
        response: { 200: HomepageVersionSchema, ...errors },
      },
    },
    async (request, reply) => {
      reply.header('cache-control', 'no-store');
      return dependencies.service.setDefaultVersion(
        await auth(request),
        (request.params as { homepageId: string }).homepageId,
      );
    },
  );
  server.get(
    `${privateVersionsPath}/:homepageId/preview`,
    {
      schema: {
        operationId: 'previewHomepageVersion',
        tags: ['public-homepage'],
        params: Type.Object({ homepageId: Type.String({ minLength: 1, maxLength: 128 }) }),
        querystring: HomepagePreviewQuerySchema,
        response: { 200: PublicHomepageSchema, ...errors },
      },
    },
    async (request, reply) => {
      reply.header('cache-control', 'no-store');
      return dependencies.service.previewVersion(
        await auth(request),
        (request.params as { homepageId: string }).homepageId,
        (request.query as { at?: string }).at,
      );
    },
  );
  server.get(
    `${privateVersionsPath}/resolve-preview`,
    {
      schema: {
        operationId: 'resolveHomepagePreview',
        tags: ['public-homepage'],
        querystring: Type.Object({ at: Type.String({ minLength: 1, maxLength: 64 }) }),
        response: { 200: PublicHomepageSchema, ...errors },
      },
    },
    async (request, reply) => {
      reply.header('cache-control', 'no-store');
      return dependencies.service.resolvePreview(
        await auth(request),
        (request.query as { at: string }).at,
      );
    },
  );
  server.get(
    `${privateVersionsPath}/:homepageId/windows`,
    {
      schema: {
        operationId: 'listHomepageWindows',
        tags: ['public-homepage'],
        params: Type.Object({ homepageId: Type.String({ minLength: 1, maxLength: 128 }) }),
        response: { 200: Type.Array(HomepageWindowSchema), ...errors },
      },
    },
    async (request, reply) => {
      reply.header('cache-control', 'no-store');
      return dependencies.service.listWindows(
        await auth(request),
        (request.params as { homepageId: string }).homepageId,
      );
    },
  );
  server.post(
    `${privateVersionsPath}/:homepageId/windows`,
    {
      schema: {
        operationId: 'createHomepageWindow',
        tags: ['public-homepage'],
        params: Type.Object({ homepageId: Type.String({ minLength: 1, maxLength: 128 }) }),
        body: HomepageWindowInputSchema,
        response: { 201: HomepageWindowSchema, ...errors },
      },
    },
    async (request, reply) => {
      reply.header('cache-control', 'no-store');
      const body = request.body as { startsAt: string; endsAt: string; timeZone: string };
      const result = await dependencies.service.createWindow(
        await auth(request),
        (request.params as { homepageId: string }).homepageId,
        body,
      );
      return reply.status(201).send(result);
    },
  );
  server.patch(
    '/api/v1/private/homepage-windows/:windowId',
    {
      schema: {
        operationId: 'updateHomepageWindow',
        tags: ['public-homepage'],
        params: Type.Object({ windowId: Type.String({ minLength: 1, maxLength: 128 }) }),
        body: HomepageWindowUpdateSchema,
        response: { 200: HomepageWindowSchema, ...errors },
      },
    },
    async (request, reply) => {
      reply.header('cache-control', 'no-store');
      return dependencies.service.updateWindow(
        await auth(request),
        (request.params as { windowId: string }).windowId,
        request.body as {
          startsAt: string;
          endsAt: string;
          timeZone: string;
          state: 'ENABLED' | 'DISABLED';
        },
      );
    },
  );
  server.delete(
    '/api/v1/private/homepage-windows/:windowId',
    {
      schema: {
        operationId: 'disableHomepageWindow',
        tags: ['public-homepage'],
        params: Type.Object({ windowId: Type.String({ minLength: 1, maxLength: 128 }) }),
        response: { 204: Type.Null(), ...errors },
      },
    },
    async (request, reply) => {
      reply.header('cache-control', 'no-store');
      await dependencies.service.disableWindow(
        await auth(request),
        (request.params as { windowId: string }).windowId,
      );
      return reply.status(204).send();
    },
  );
  server.post(
    `${privatePath}/profile`,
    {
      schema: {
        operationId: 'selectHomepageProfile',
        tags: ['public-homepage'],
        body: Type.Object(
          { profileId: Type.String({ minLength: 1, maxLength: 128 }) },
          { additionalProperties: false },
        ),
        response: { 200: HomepageConfigurationSchema, ...errors },
      },
    },
    async (request, reply) => {
      reply.header('cache-control', 'no-store');
      return dependencies.service.selectProfile(
        await auth(request),
        (request.body as { profileId: string }).profileId,
      );
    },
  );
  for (const action of ['publish', 'pause'] as const) {
    server.post(
      `${privatePath}/${action}`,
      {
        schema: {
          operationId: `${action}MyHomepage`,
          tags: ['public-homepage'],
          response: { 200: HomepageConfigurationSchema, ...errors },
        },
      },
      async (request, reply) => {
        reply.header('cache-control', 'no-store');
        return dependencies.service.transition(await auth(request), action);
      },
    );
  }
  server.get(
    `${privatePath}/preview`,
    {
      schema: {
        operationId: 'previewMyHomepage',
        tags: ['public-homepage'],
        response: { 200: PublicHomepageSchema, ...errors },
      },
    },
    async (request, reply) => {
      reply.header('cache-control', 'no-store');
      return dependencies.service.preview(await auth(request));
    },
  );
  server.get(
    '/api/v1/public/homepages/:reference',
    {
      schema: {
        operationId: 'resolvePublicHomepage',
        tags: ['public-homepage'],
        params: Type.Object(
          { reference: Type.String({ minLength: 1, maxLength: 64 }) },
          { additionalProperties: false },
        ),
        querystring: Type.Object(
          { viewId: Type.String({ minLength: 36, maxLength: 36 }) },
          { additionalProperties: false },
        ),
        response: { 200: PublicHomepageSchema, ...errors },
      },
    },
    async (request, reply) => {
      reply.header('cache-control', 'no-store');
      return dependencies.service.resolve(
        (request.params as { reference: string }).reference,
        (request.query as { viewId: string }).viewId,
      );
    },
  );
}
