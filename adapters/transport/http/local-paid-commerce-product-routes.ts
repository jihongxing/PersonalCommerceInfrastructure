import type { FastifyInstance, FastifyRequest } from 'fastify';
import { Type } from 'typebox';

import { extractBearerToken } from '../../auth/transport/bearer-token.js';
import type { ActorContext } from '../../../applications/core/actor-context.js';
import type { AuthContextProvider } from '../../../applications/core/ports/auth-context-provider.js';
import type {
  LocalPaidCommerceProductService,
  CreatorLocalCommerceWorkspace,
  LocalPaidCommerceCheckout,
} from '../../../applications/paid-commerce/local-paid-commerce-product-service.js';
import {
  AdvanceProductSimulationSchema,
  CreatorLocalCommerceWorkspaceSchema,
  LocalCheckoutSchema,
  ProductSimulationCommandResultSchema,
  SimulateProductPaymentSchema,
  SimulateProductRefundSchema,
  SimulateProductSettlementSchema,
  SimulateProductWithdrawalSchema,
} from '../../../contracts/api/v1/local-paid-commerce-product-contracts.js';
import { ApiErrorEnvelopeSchema } from '../../../contracts/api/v1/system-contracts.js';

interface AuthenticatedCreatorRequest extends FastifyRequest {
  actorContext?: ActorContext;
}

export function registerLocalPaidCommerceProductRoutes(
  server: FastifyInstance,
  dependencies: {
    readonly service: LocalPaidCommerceProductService;
    readonly authContextProvider: AuthContextProvider;
  },
): void {
  const resultParams = Type.Object({ resultAccessToken: Type.String({ minLength: 1 }) });
  const orderParams = Type.Object({ orderId: Type.String({ minLength: 1 }) });
  const withdrawalParams = Type.Object({ withdrawalId: Type.String({ minLength: 1 }) });
  const authenticateCreator = async (request: AuthenticatedCreatorRequest): Promise<void> => {
    request.actorContext = await dependencies.authContextProvider.resolveActorContext({
      accessToken: extractBearerToken(request.headers.authorization),
      correlationId: request.id,
    });
  };

  server.get(
    '/api/v1/local-commerce/requests/:resultAccessToken/checkout',
    {
      schema: {
        operationId: 'getLocalPaidCommerceCheckout',
        params: resultParams,
        response: { 200: LocalCheckoutSchema, 404: ApiErrorEnvelopeSchema },
        tags: ['paid-commerce'],
      },
    },
    async (request) => {
      const { resultAccessToken } = request.params as { readonly resultAccessToken: string };
      return serializeCheckout(await dependencies.service.getCheckout(resultAccessToken));
    },
  );

  server.post(
    '/api/v1/local-commerce/requests/:resultAccessToken/payment',
    {
      schema: {
        operationId: 'simulateLocalProductPayment',
        params: resultParams,
        body: SimulateProductPaymentSchema,
        response: {
          200: ProductSimulationCommandResultSchema,
          400: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['paid-commerce'],
      },
    },
    async (request) => {
      const { resultAccessToken } = request.params as { readonly resultAccessToken: string };
      const { scenario } = request.body as Parameters<
        LocalPaidCommerceProductService['simulatePayment']
      >[1] extends infer Scenario
        ? { readonly scenario: Scenario }
        : never;
      return serializeRun(await dependencies.service.simulatePayment(resultAccessToken, scenario));
    },
  );

  server.post(
    '/api/v1/local-commerce/requests/:resultAccessToken/payment/advance',
    {
      schema: {
        operationId: 'advanceLocalProductPayment',
        params: resultParams,
        body: AdvanceProductSimulationSchema,
        response: {
          200: ProductSimulationCommandResultSchema,
          400: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
        },
        tags: ['paid-commerce'],
      },
    },
    async (request) => {
      const { resultAccessToken } = request.params as { readonly resultAccessToken: string };
      const { providerReference } = request.body as { readonly providerReference: string };
      return serializeRun(
        await dependencies.service.advancePayment(resultAccessToken, providerReference),
      );
    },
  );

  server.get(
    '/api/v1/creator/local-commerce/workspace',
    {
      schema: {
        operationId: 'getCreatorLocalCommerceWorkspace',
        response: {
          200: CreatorLocalCommerceWorkspaceSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
        },
        tags: ['paid-commerce'],
      },
      preHandler: authenticateCreator,
    },
    async (request) =>
      serializeWorkspace(
        await dependencies.service.getCreatorWorkspace(requireActorContext(request)),
      ),
  );

  server.post(
    '/api/v1/creator/local-commerce/orders/:orderId/settlement',
    {
      schema: {
        operationId: 'simulateLocalProductSettlement',
        params: orderParams,
        body: SimulateProductSettlementSchema,
        response: commonCommandResponses,
        tags: ['paid-commerce'],
      },
      preHandler: authenticateCreator,
    },
    async (request) => {
      const { orderId } = request.params as { readonly orderId: string };
      const { scenario } = request.body as {
        readonly scenario: Parameters<LocalPaidCommerceProductService['simulateSettlement']>[1];
      };
      return serializeRun(
        await dependencies.service.simulateSettlement(
          orderId,
          scenario,
          requireActorContext(request),
        ),
      );
    },
  );

  server.post(
    '/api/v1/creator/local-commerce/orders/:orderId/settlement/advance',
    {
      schema: {
        operationId: 'advanceLocalProductSettlement',
        params: orderParams,
        body: AdvanceProductSimulationSchema,
        response: commonCommandResponses,
        tags: ['paid-commerce'],
      },
      preHandler: authenticateCreator,
    },
    async (request) => {
      const { orderId } = request.params as { readonly orderId: string };
      const { providerReference } = request.body as { readonly providerReference: string };
      return serializeRun(
        await dependencies.service.advanceSettlement(
          orderId,
          providerReference,
          requireActorContext(request),
        ),
      );
    },
  );

  server.post(
    '/api/v1/creator/local-commerce/withdrawals/:withdrawalId/simulate',
    {
      schema: {
        operationId: 'simulateLocalProductWithdrawal',
        params: withdrawalParams,
        body: SimulateProductWithdrawalSchema,
        response: commonCommandResponses,
        tags: ['paid-commerce'],
      },
      preHandler: authenticateCreator,
    },
    async (request) => {
      const { withdrawalId } = request.params as { readonly withdrawalId: string };
      const { scenario } = request.body as {
        readonly scenario: Parameters<LocalPaidCommerceProductService['simulateWithdrawal']>[1];
      };
      return serializeRun(
        await dependencies.service.simulateWithdrawal(
          withdrawalId,
          scenario,
          requireActorContext(request),
        ),
      );
    },
  );

  server.post(
    '/api/v1/creator/local-commerce/withdrawals/:withdrawalId/advance',
    {
      schema: {
        operationId: 'advanceLocalProductWithdrawal',
        params: withdrawalParams,
        body: AdvanceProductSimulationSchema,
        response: commonCommandResponses,
        tags: ['paid-commerce'],
      },
      preHandler: authenticateCreator,
    },
    async (request) => {
      const { withdrawalId } = request.params as { readonly withdrawalId: string };
      const { providerReference } = request.body as { readonly providerReference: string };
      return serializeRun(
        await dependencies.service.advanceWithdrawal(
          withdrawalId,
          providerReference,
          requireActorContext(request),
        ),
      );
    },
  );

  server.post(
    '/api/v1/creator/local-commerce/orders/:orderId/refund',
    {
      schema: {
        operationId: 'simulateLocalProductRefund',
        params: orderParams,
        body: SimulateProductRefundSchema,
        response: commonCommandResponses,
        tags: ['paid-commerce'],
      },
      preHandler: authenticateCreator,
    },
    async (request) => {
      const { orderId } = request.params as { readonly orderId: string };
      const { scenario } = request.body as {
        readonly scenario: Parameters<LocalPaidCommerceProductService['simulateRefund']>[1];
      };
      return serializeRun(
        await dependencies.service.simulateRefund(orderId, scenario, requireActorContext(request)),
      );
    },
  );
}

const commonCommandResponses = {
  200: ProductSimulationCommandResultSchema,
  400: ApiErrorEnvelopeSchema,
  401: ApiErrorEnvelopeSchema,
  403: ApiErrorEnvelopeSchema,
  404: ApiErrorEnvelopeSchema,
  409: ApiErrorEnvelopeSchema,
};

function requireActorContext(request: AuthenticatedCreatorRequest): ActorContext {
  if (request.actorContext === undefined) {
    throw new Error('Authenticated Creator context is missing.');
  }
  return request.actorContext;
}

function serializeCheckout(checkout: LocalPaidCommerceCheckout) {
  return {
    origin: checkout.origin,
    providerId: checkout.providerId,
    creatorDisplayName: checkout.creatorDisplayName,
    order: serializeOrder(checkout.order),
    ...(checkout.payment === undefined ? {} : { payment: serializePayment(checkout.payment) }),
  };
}

function serializeWorkspace(workspace: CreatorLocalCommerceWorkspace) {
  return {
    origin: workspace.origin,
    providerId: workspace.providerId,
    orders: workspace.orders.map((item) => ({
      order: serializeOrder(item.order),
      customerName: item.customerName,
      ...(item.payment === undefined ? {} : { payment: serializePayment(item.payment) }),
      fulfillmentState: item.fulfillment?.state ?? 'not_started',
      ...(item.settlement === undefined
        ? {}
        : {
            settlement: {
              state: item.settlement.state,
              grossMinor: String(item.settlement.input.gross.minor),
              providerFeeMinor: String(item.settlement.input.providerFee.minor),
              platformFeeMinor: String(item.settlement.input.platformFee.minor),
              adjustmentMinor: String(item.settlement.input.deductions.minor),
              creatorNetMinor: String(item.settlement.creatorNet.minor),
            },
          }),
      earningsState: item.earningsState,
    })),
    wallet: {
      currency: workspace.wallet.currency,
      pendingMinor: String(workspace.wallet.pending),
      availableMinor: String(workspace.wallet.available),
      restrictedMinor: String(workspace.wallet.restricted),
      withdrawalInProgressMinor: String(workspace.wallet.withdrawalInProgress),
      withdrawnMinor: String(workspace.wallet.withdrawn),
      recoveryOutstandingMinor: String(workspace.wallet.recoveryOutstanding),
    },
    withdrawals: workspace.withdrawals.map((withdrawal) => ({
      id: withdrawal.id,
      amountMinor: String(withdrawal.amount.minor),
      currency: withdrawal.amount.currency,
      state: withdrawal.state,
    })),
  };
}

function serializeOrder(order: LocalPaidCommerceCheckout['order']) {
  return {
    id: order.id,
    ...(order.commerceActionId === undefined ? {} : { commerceActionId: order.commerceActionId }),
    ...(order.reservationId === undefined ? {} : { reservationId: order.reservationId }),
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

function serializePayment(payment: NonNullable<LocalPaidCommerceCheckout['payment']>) {
  return {
    id: payment.id,
    state: payment.state,
    amountMinor: String(payment.amount.minor),
    currency: payment.amount.currency,
  };
}

function serializeRun(
  result: Awaited<ReturnType<LocalPaidCommerceProductService['simulatePayment']>>,
) {
  return {
    origin: result.origin,
    providerId: result.providerId,
    ...(result.operation === undefined
      ? {}
      : { operationProviderReference: result.operation.providerReference }),
    eventCount: result.events.length,
    processed: result.processed.map((item) => ({
      receiptStatus: item.receipt.status,
      ...(item.receipt.reason === undefined ? {} : { reason: item.receipt.reason }),
      transitioned: item.transitioned,
    })),
  };
}
