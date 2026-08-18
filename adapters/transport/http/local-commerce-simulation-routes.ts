import type { FastifyInstance, FastifyRequest } from 'fastify';
import { Type } from 'typebox';

import { extractBearerToken } from '../../auth/transport/bearer-token.js';
import type { ActorContext } from '../../../applications/core/actor-context.js';
import type { OperationsAuthContextProvider } from '../../../applications/core/ports/operations-auth-context-provider.js';
import type {
  LocalCommerceSimulationService,
  SimulationRunResult,
} from '../../../applications/paid-commerce/local-commerce-simulation-service.js';
import {
  AdvanceSimulationSchema,
  ConfigureSimulationScenarioSchema,
  SimulationOperationSchema,
  SimulationRefundSchema,
  SimulationResultSchema,
  SimulationSettlementOperationSchema,
} from '../../../contracts/api/v1/local-commerce-simulation-contracts.js';
import { ApiErrorEnvelopeSchema } from '../../../contracts/api/v1/system-contracts.js';

interface AuthenticatedOperationsRequest extends FastifyRequest {
  operationsContext?: ActorContext;
}

export function registerLocalCommerceSimulationRoutes(
  server: FastifyInstance,
  dependencies: {
    readonly service: LocalCommerceSimulationService;
    readonly operationsAuthContextProvider: OperationsAuthContextProvider;
  },
): void {
  const orderParams = Type.Object({ orderId: Type.String({ minLength: 1 }) });
  const withdrawalParams = Type.Object({ withdrawalId: Type.String({ minLength: 1 }) });
  const authenticateOperations = async (request: AuthenticatedOperationsRequest): Promise<void> => {
    request.operationsContext =
      await dependencies.operationsAuthContextProvider.resolveActorContext({
        accessToken: extractBearerToken(request.headers.authorization),
        correlationId: request.id,
      });
  };

  server.post(
    '/api/v1/operations/simulation/scenario',
    {
      schema: {
        operationId: 'configureLocalCommerceSimulationScenario',
        body: ConfigureSimulationScenarioSchema,
        response: {
          200: SimulationResultSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
        },
        tags: ['paid-commerce'],
      },
      preHandler: authenticateOperations,
    },
    (request) =>
      serializeScenario(
        dependencies.service.configureScenario(
          request.body as Parameters<LocalCommerceSimulationService['configureScenario']>[0],
          requireOperationsContext(request),
        ),
      ),
  );

  server.post(
    '/api/v1/operations/simulation/paid-orders/:orderId/payment',
    {
      schema: {
        operationId: 'simulateLocalCommercePayment',
        params: orderParams,
        body: SimulationOperationSchema,
        response: {
          200: SimulationResultSchema,
          400: ApiErrorEnvelopeSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['paid-commerce'],
      },
      preHandler: authenticateOperations,
    },
    async (request) => {
      const { orderId } = request.params as { readonly orderId: string };
      const body = request.body as {
        readonly amountMinor: string;
        readonly currency: 'CNY';
        readonly idempotencyKey: string;
      };
      return serializeRun(
        await dependencies.service.createPayment(
          {
            internalReference: orderId,
            amountMinor: BigInt(body.amountMinor),
            currency: body.currency,
            idempotencyKey: body.idempotencyKey,
          },
          requireOperationsContext(request),
        ),
      );
    },
  );

  server.post(
    '/api/v1/operations/simulation/paid-orders/:orderId/settlement',
    {
      schema: {
        operationId: 'simulateLocalCommerceSettlement',
        params: orderParams,
        body: SimulationSettlementOperationSchema,
        response: {
          200: SimulationResultSchema,
          400: ApiErrorEnvelopeSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['paid-commerce'],
      },
      preHandler: authenticateOperations,
    },
    async (request) => {
      const { orderId } = request.params as { readonly orderId: string };
      const body = request.body as {
        readonly amountMinor: string;
        readonly currency: 'CNY';
        readonly idempotencyKey: string;
        readonly providerFeeMinor: string;
        readonly platformFeeMinor: string;
        readonly deductionsMinor: string;
        readonly calculationVersion: string;
      };
      return serializeRun(
        await dependencies.service.createSettlement(
          {
            internalReference: orderId,
            amountMinor: BigInt(body.amountMinor),
            currency: body.currency,
            idempotencyKey: body.idempotencyKey,
          },
          {
            classification: 'simulation_configuration',
            version: body.calculationVersion,
            providerFeeMinor: BigInt(body.providerFeeMinor),
            platformFeeMinor: BigInt(body.platformFeeMinor),
            deductionsMinor: BigInt(body.deductionsMinor),
          },
          requireOperationsContext(request),
        ),
      );
    },
  );

  server.post(
    '/api/v1/operations/simulation/withdrawals/:withdrawalId',
    {
      schema: {
        operationId: 'simulateLocalCommerceWithdrawal',
        params: withdrawalParams,
        body: SimulationOperationSchema,
        response: {
          200: SimulationResultSchema,
          400: ApiErrorEnvelopeSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['paid-commerce'],
      },
      preHandler: authenticateOperations,
    },
    async (request) => {
      const { withdrawalId } = request.params as { readonly withdrawalId: string };
      const body = request.body as {
        readonly amountMinor: string;
        readonly currency: 'CNY';
        readonly idempotencyKey: string;
      };
      return serializeRun(
        await dependencies.service.createWithdrawal(
          {
            internalReference: withdrawalId,
            amountMinor: BigInt(body.amountMinor),
            currency: body.currency,
            idempotencyKey: body.idempotencyKey,
          },
          requireOperationsContext(request),
        ),
      );
    },
  );

  server.post(
    '/api/v1/operations/simulation/advance',
    {
      schema: {
        operationId: 'advanceLocalCommerceSimulation',
        body: AdvanceSimulationSchema,
        response: {
          200: SimulationResultSchema,
          400: ApiErrorEnvelopeSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['paid-commerce'],
      },
      preHandler: authenticateOperations,
    },
    async (request) =>
      serializeRun(
        await dependencies.service.advance(
          (request.body as { readonly providerReference: string }).providerReference,
          requireOperationsContext(request),
        ),
      ),
  );

  server.post(
    '/api/v1/operations/simulation/paid-orders/:orderId/refund',
    {
      schema: {
        operationId: 'simulateLocalCommerceRefund',
        params: orderParams,
        body: SimulationRefundSchema,
        response: {
          200: SimulationResultSchema,
          400: ApiErrorEnvelopeSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['paid-commerce'],
      },
      preHandler: authenticateOperations,
    },
    async (request) => {
      const { orderId } = request.params as { readonly orderId: string };
      const body = request.body as {
        readonly providerReference: string;
        readonly amountMinor: string;
        readonly currency: 'CNY';
      };
      return serializeRun(
        await dependencies.service.refund(
          {
            providerReference: body.providerReference,
            internalReference: orderId,
            amountMinor: BigInt(body.amountMinor),
            currency: body.currency,
          },
          requireOperationsContext(request),
        ),
      );
    },
  );
}

function requireOperationsContext(request: AuthenticatedOperationsRequest): ActorContext {
  if (request.operationsContext?.actor.kind === 'pilot_operations') {
    return request.operationsContext;
  }
  throw new Error('Operations authentication is required.');
}

function serializeScenario(scenario: ReturnType<LocalCommerceSimulationService['getScenario']>) {
  return {
    origin: 'simulation' as const,
    providerId: 'local_commerce_simulator' as const,
    scenario,
    eventCount: 0,
    processed: [],
  };
}

function serializeRun(result: SimulationRunResult) {
  return {
    origin: result.origin,
    providerId: result.providerId,
    scenario: result.scenario,
    ...(result.operation === undefined
      ? {}
      : { operationProviderReference: result.operation.providerReference }),
    eventCount: result.events.length,
    processed: result.processed.map((processed) => ({
      receiptStatus: processed.receipt.status,
      transitioned: processed.transitioned,
    })),
  };
}
