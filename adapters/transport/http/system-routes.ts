import type { FastifyInstance } from 'fastify';

import {
  ApiBasePath,
  ApiServiceName,
  ApiVersion,
  HealthResponseSchema,
  ReadinessResponseSchema,
} from '../../../contracts/api/v1/system-contracts.js';

export interface SystemRouteDependencies {
  readonly checkReadiness?: () => Promise<void>;
}

export function registerSystemRoutes(
  server: FastifyInstance,
  dependencies: SystemRouteDependencies = {},
): void {
  server.get(
    `${ApiBasePath}/health`,
    {
      schema: {
        operationId: 'getApiHealth',
        response: {
          200: HealthResponseSchema,
        },
        tags: ['system'],
      },
    },
    () => ({
      service: ApiServiceName,
      status: 'ok' as const,
      version: ApiVersion,
    }),
  );

  server.get(
    `${ApiBasePath}/readiness`,
    {
      schema: {
        operationId: 'getApiReadiness',
        response: {
          200: ReadinessResponseSchema,
          503: ReadinessResponseSchema,
        },
        tags: ['system'],
      },
    },
    async (_request, reply) => {
      try {
        await dependencies.checkReadiness?.();
        return {
          service: ApiServiceName,
          status: 'ready' as const,
          version: ApiVersion,
        };
      } catch {
        return reply.status(503).send({
          service: ApiServiceName,
          status: 'not_ready' as const,
          version: ApiVersion,
        });
      }
    },
  );
}
