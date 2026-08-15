import type { FastifyInstance, FastifyRequest } from 'fastify';
import { Type } from 'typebox';

import { extractBearerToken } from '../../auth/transport/bearer-token.js';
import type { ActorContext } from '../../../applications/core/actor-context.js';
import { ApplicationError } from '../../../applications/core/application-error.js';
import type { AuthContextProvider } from '../../../applications/core/ports/auth-context-provider.js';
import type { OperationsAuthContextProvider } from '../../../applications/core/ports/operations-auth-context-provider.js';
import type { PaidCommerceService } from '../../../applications/paid-commerce/paid-commerce-service.js';
import {
  CompleteControlledWithdrawalSchema,
  CreatePaidServiceOrderSchema,
  CreatorPaidServiceOrderListSchema,
  CreatorWalletSchema,
  PaidServiceOrderSchema,
  PublicPaidServiceOrderStatusSchema,
  RecordControlledPaymentSchema,
  RecordFulfillmentSchema,
  ReleaseControlledSettlementSchema,
  RequestWithdrawalSchema,
  WithdrawalSchema,
} from '../../../contracts/api/v1/paid-commerce-contracts.js';
import { ApiErrorEnvelopeSchema } from '../../../contracts/api/v1/system-contracts.js';

interface AuthenticatedRequest extends FastifyRequest {
  authContext?: ActorContext;
}

interface AuthenticatedOperationsRequest extends FastifyRequest {
  operationsContext?: ActorContext;
}

export function registerPaidCommerceRoutes(
  server: FastifyInstance,
  dependencies: {
    readonly service: PaidCommerceService;
    readonly authContextProvider: AuthContextProvider;
    readonly operationsAuthContextProvider: OperationsAuthContextProvider;
  },
): void {
  const orderParams = Type.Object({ orderId: Type.String({ minLength: 1 }) });
  const withdrawalParams = Type.Object({ withdrawalId: Type.String({ minLength: 1 }) });

  const authenticate = async (request: AuthenticatedRequest): Promise<void> => {
    request.authContext = await dependencies.authContextProvider.resolveActorContext({
      accessToken: extractBearerToken(request.headers.authorization),
      correlationId: request.id,
    });
  };
  const authenticateOperations = async (request: AuthenticatedOperationsRequest): Promise<void> => {
    request.operationsContext =
      await dependencies.operationsAuthContextProvider.resolveActorContext({
        accessToken: extractBearerToken(request.headers.authorization),
        correlationId: request.id,
      });
  };

  server.post(
    '/api/v1/creator/paid-orders',
    {
      schema: {
        operationId: 'createPaidServiceOrder',
        body: CreatePaidServiceOrderSchema,
        response: {
          201: PaidServiceOrderSchema,
          400: ApiErrorEnvelopeSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['paid-commerce'],
      },
      preHandler: authenticate,
    },
    async (request, reply) => {
      const order = await dependencies.service.createOrder(
        {
          ...(request.body as {
            readonly commerceActionId: string;
            readonly serviceTerms: string;
          }),
          grossPriceMinor: parseMinor(
            (request.body as { readonly grossPriceMinor: string }).grossPriceMinor,
          ),
        },
        requireCreatorContext(request),
      );
      return reply.status(201).send(serializeOrder(order));
    },
  );

  server.get(
    '/api/v1/public/requests/:resultAccessToken/paid-service-status',
    {
      schema: {
        operationId: 'getPublicPaidServiceOrderStatus',
        params: Type.Object({ resultAccessToken: Type.String({ minLength: 1 }) }),
        response: { 200: PublicPaidServiceOrderStatusSchema, 404: ApiErrorEnvelopeSchema },
        tags: ['paid-commerce'],
      },
    },
    async (request) => {
      const { resultAccessToken } = request.params as { readonly resultAccessToken: string };
      return dependencies.service.getPublicOrderStatus(resultAccessToken);
    },
  );

  server.get(
    '/api/v1/creator/paid-orders',
    {
      schema: {
        operationId: 'listCreatorPaidServiceOrders',
        response: {
          200: CreatorPaidServiceOrderListSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
        },
        tags: ['paid-commerce'],
      },
      preHandler: authenticate,
    },
    async (request) => ({
      orders: (await dependencies.service.listCreatorOrders(requireCreatorContext(request))).map(
        serializeOrder,
      ),
    }),
  );

  server.post(
    '/api/v1/creator/paid-orders/:orderId/fulfillment',
    {
      schema: {
        operationId: 'recordPaidServiceFulfillment',
        params: orderParams,
        body: RecordFulfillmentSchema,
        response: {
          200: PaidServiceOrderSchema,
          400: ApiErrorEnvelopeSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['paid-commerce'],
      },
      preHandler: authenticate,
    },
    async (request) => {
      const { orderId } = request.params as { readonly orderId: string };
      const result = await dependencies.service.recordFulfillment(
        { orderId, ...(request.body as { readonly evidenceReference: string }) },
        requireCreatorContext(request),
      );
      return serializeOrder(result.order);
    },
  );

  server.get(
    '/api/v1/creator/wallet',
    {
      schema: {
        operationId: 'getCreatorEarningsWallet',
        response: {
          200: CreatorWalletSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
        },
        tags: ['paid-commerce'],
      },
      preHandler: authenticate,
    },
    async (request) =>
      serializeWallet(await dependencies.service.getCreatorWallet(requireCreatorContext(request))),
  );

  server.post(
    '/api/v1/creator/wallet/withdrawals',
    {
      schema: {
        operationId: 'requestCreatorWithdrawal',
        body: RequestWithdrawalSchema,
        response: {
          201: WithdrawalSchema,
          400: ApiErrorEnvelopeSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['paid-commerce'],
      },
      preHandler: authenticate,
    },
    async (request, reply) => {
      const body = request.body as {
        readonly amountMinor: string;
        readonly destinationReference: string;
        readonly idempotencyKey: string;
      };
      const withdrawal = await dependencies.service.requestWithdrawal(
        {
          amountMinor: parseMinor(body.amountMinor),
          destinationReference: body.destinationReference,
          idempotencyKey: body.idempotencyKey,
        },
        requireCreatorContext(request),
      );
      return reply.status(201).send(serializeWithdrawal(withdrawal));
    },
  );

  server.post(
    '/api/v1/operations/paid-orders/:orderId/payment-confirmed',
    {
      schema: {
        operationId: 'recordControlledPaymentFact',
        params: orderParams,
        body: RecordControlledPaymentSchema,
        response: {
          200: PaidServiceOrderSchema,
          400: ApiErrorEnvelopeSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['paid-commerce'],
      },
      preHandler: authenticateOperations,
    },
    async (request) => {
      const { orderId } = request.params as { readonly orderId: string };
      const result = await dependencies.service.recordControlledPayment(
        { orderId, ...(request.body as { readonly controlledEvidenceReference: string }) },
        requireOperationsContext(request),
      );
      return serializeOrder(result.order);
    },
  );

  server.post(
    '/api/v1/operations/paid-orders/:orderId/payment-failed',
    {
      schema: {
        operationId: 'recordControlledPaymentFailure',
        params: orderParams,
        body: RecordControlledPaymentSchema,
        response: {
          200: PaidServiceOrderSchema,
          400: ApiErrorEnvelopeSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['paid-commerce'],
      },
      preHandler: authenticateOperations,
    },
    async (request) => {
      const { orderId } = request.params as { readonly orderId: string };
      const result = await dependencies.service.recordControlledPaymentFailure(
        { orderId, ...(request.body as { readonly controlledEvidenceReference: string }) },
        requireOperationsContext(request),
      );
      return serializeOrder(result.order);
    },
  );

  server.post(
    '/api/v1/operations/paid-orders/:orderId/settlement-released',
    {
      schema: {
        operationId: 'releaseControlledSettlement',
        params: orderParams,
        body: ReleaseControlledSettlementSchema,
        response: {
          200: PaidServiceOrderSchema,
          400: ApiErrorEnvelopeSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['paid-commerce'],
      },
      preHandler: authenticateOperations,
    },
    async (request) => {
      const { orderId } = request.params as { readonly orderId: string };
      const body = request.body as {
        readonly providerFeeMinor: string;
        readonly platformFeeMinor: string;
        readonly deductionsMinor?: string;
        readonly calculationVersion: string;
        readonly controlledEvidenceReference: string;
      };
      const result = await dependencies.service.releaseControlledSettlement(
        {
          orderId,
          providerFeeMinor: parseMinor(body.providerFeeMinor),
          platformFeeMinor: parseMinor(body.platformFeeMinor),
          ...(body.deductionsMinor === undefined
            ? {}
            : { deductionsMinor: parseMinor(body.deductionsMinor) }),
          calculationVersion: body.calculationVersion,
          controlledEvidenceReference: body.controlledEvidenceReference,
        },
        requireOperationsContext(request),
      );
      return serializeOrder(result.order);
    },
  );

  server.post(
    '/api/v1/operations/withdrawals/:withdrawalId/completed',
    {
      schema: {
        operationId: 'completeControlledWithdrawal',
        params: withdrawalParams,
        body: CompleteControlledWithdrawalSchema,
        response: {
          200: WithdrawalSchema,
          400: ApiErrorEnvelopeSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['paid-commerce'],
      },
      preHandler: authenticateOperations,
    },
    async (request) => {
      const { withdrawalId } = request.params as { readonly withdrawalId: string };
      const withdrawal = await dependencies.service.completeControlledWithdrawal(
        {
          withdrawalId,
          ...(request.body as { readonly controlledEvidenceReference: string }),
        },
        requireOperationsContext(request),
      );
      return serializeWithdrawal(withdrawal);
    },
  );
}

function requireCreatorContext(request: AuthenticatedRequest): ActorContext {
  if (request.authContext?.actor.kind === 'creator') {
    return request.authContext;
  }
  throw new ApplicationError({
    category: 'authorization',
    code: 'creator_authentication_required',
    message: 'This Paid Commerce action requires the owning Creator.',
  });
}

function requireOperationsContext(request: AuthenticatedOperationsRequest): ActorContext {
  if (request.operationsContext?.actor.kind === 'pilot_operations') {
    return request.operationsContext;
  }
  throw new ApplicationError({
    category: 'authentication',
    code: 'operations_authentication_required',
    message: 'This controlled Money fact requires Pilot Operations authentication.',
  });
}

function parseMinor(value: string): bigint {
  try {
    return BigInt(value);
  } catch {
    throw new ApplicationError({
      category: 'validation',
      code: 'invalid_money_minor',
      message: 'Money minor values must be non-negative integer strings.',
    });
  }
}

function serializeOrder(order: {
  readonly id: string;
  readonly commerceActionId: string;
  readonly creatorId: string;
  readonly customerId: string;
  readonly offeringId: string;
  readonly state: string;
  readonly snapshot: {
    readonly offeringTitle: string;
    readonly offeringDescription: string;
    readonly serviceTerms: string;
    readonly grossPrice: { readonly currency: 'CNY'; readonly minor: bigint };
  };
}) {
  return {
    id: order.id,
    commerceActionId: order.commerceActionId,
    creatorId: order.creatorId,
    customerId: order.customerId,
    offeringId: order.offeringId,
    state: order.state,
    snapshot: {
      offeringTitle: order.snapshot.offeringTitle,
      offeringDescription: order.snapshot.offeringDescription,
      serviceTerms: order.snapshot.serviceTerms,
      currency: order.snapshot.grossPrice.currency,
      grossPriceMinor: String(order.snapshot.grossPrice.minor),
    },
  };
}

function serializeWallet(wallet: {
  readonly currency: 'CNY';
  readonly pending: bigint;
  readonly available: bigint;
  readonly restricted: bigint;
  readonly withdrawalInProgress: bigint;
  readonly withdrawn: bigint;
}) {
  return {
    currency: wallet.currency,
    pendingMinor: String(wallet.pending),
    availableMinor: String(wallet.available),
    restrictedMinor: String(wallet.restricted),
    withdrawalInProgressMinor: String(wallet.withdrawalInProgress),
    withdrawnMinor: String(wallet.withdrawn),
  };
}

function serializeWithdrawal(withdrawal: {
  readonly id: string;
  readonly creatorId: string;
  readonly amount: { readonly currency: 'CNY'; readonly minor: bigint };
  readonly state: string;
}) {
  return {
    id: withdrawal.id,
    creatorId: withdrawal.creatorId,
    currency: withdrawal.amount.currency,
    amountMinor: String(withdrawal.amount.minor),
    state: withdrawal.state,
  };
}
