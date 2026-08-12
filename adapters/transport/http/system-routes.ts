import type { FastifyInstance } from 'fastify';

import {
  ApiBasePath,
  ApiServiceName,
  ApiVersion,
  HealthResponseSchema,
  ReadinessResponseSchema,
} from '../../../contracts/api/v1/system-contracts.js';

export function registerSystemRoutes(server: FastifyInstance): void {
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
        },
        tags: ['system'],
      },
    },
    () => ({
      service: ApiServiceName,
      status: 'ready' as const,
      version: ApiVersion,
    }),
  );
}
