import type { FastifyInstance, FastifyRequest } from 'fastify';
import { Type } from 'typebox';

import type { ActorContext } from '../../../applications/core/actor-context.js';
import { ApplicationError } from '../../../applications/core/application-error.js';
import type { AuthContextProvider } from '../../../applications/core/ports/auth-context-provider.js';
import type { GoodsService } from '../../../applications/goods/goods-service.js';
import {
  GoodsDeliveryInputSchema,
  GoodsOfferingInputSchema,
  GoodsOfferingListResponseSchema,
  GoodsOfferingResponseSchema,
  GoodsOfferingStateChangeSchema,
  GoodsOfferingUpdateSchema,
  GoodsOrderListResponseSchema,
  GoodsOrderSubmitSchema,
  GoodsOrderViewSchema,
  GoodsPublicOfferingSchema,
  GoodsReasonSchema,
  GoodsReceiptInputSchema,
  type GoodsDeliveryInputBody,
  type GoodsOfferingInputBody,
  type GoodsOfferingStateChangeBody,
  type GoodsOfferingUpdateBody,
  type GoodsOrderSubmitBody,
  type GoodsReasonBody,
  type GoodsReceiptInputBody,
} from '../../../contracts/api/v1/goods-contracts.js';
import { ApiErrorEnvelopeSchema } from '../../../contracts/api/v1/system-contracts.js';
import { extractBearerToken } from '../../auth/transport/bearer-token.js';

interface AuthenticatedRequest extends FastifyRequest {
  authContext?: ActorContext;
}

const IdParams = Type.Object(
  { id: Type.String({ minLength: 1 }) },
  { additionalProperties: false },
);

const OfferingParams = Type.Object(
  { offeringId: Type.String({ minLength: 1 }) },
  { additionalProperties: false },
);

const OrderParams = Type.Object(
  { orderId: Type.String({ minLength: 1 }) },
  { additionalProperties: false },
);

function requireContext(request: AuthenticatedRequest): ActorContext {
  if (request.authContext === undefined) {
    throw new ApplicationError({
      category: 'authentication',
      code: 'missing_auth_context',
      message: 'Authenticated request requires an Actor Context.',
    });
  }
  return request.authContext;
}

function requireSeller(request: AuthenticatedRequest): {
  sellerId: string;
  actorAccountId: string;
} {
  const context = requireContext(request);
  if (context.actor.kind !== 'creator') {
    throw new ApplicationError({
      category: 'authorization',
      code: 'goods_seller_required',
      message: 'An authorized Creator is required.',
    });
  }
  return {
    sellerId: context.actor.creatorId,
    actorAccountId: context.accountId ?? context.actor.creatorId,
  };
}

function offeringResponse(offering: Awaited<ReturnType<GoodsService['createOffering']>>) {
  return offering;
}

export function registerGoodsRoutes(
  server: FastifyInstance,
  dependencies: {
    readonly service: GoodsService;
    readonly authContextProvider: AuthContextProvider;
  },
): void {
  const authenticate = async (request: AuthenticatedRequest): Promise<void> => {
    request.authContext = await dependencies.authContextProvider.resolveActorContext({
      accessToken: extractBearerToken(request.headers.authorization),
      correlationId: request.id,
    });
  };
  const resolveAccount = async (request: FastifyRequest) =>
    dependencies.authContextProvider.resolveAccountContext({
      accessToken: extractBearerToken(request.headers.authorization),
      correlationId: request.id,
    });

  server.get<{ Params: { id: string } }>(
    '/api/v1/public/goods/offerings/:id',
    {
      schema: {
        operationId: 'getPublicGoodsOffering',
        params: IdParams,
        response: { 200: GoodsPublicOfferingSchema, 404: ApiErrorEnvelopeSchema },
        tags: ['goods'],
      },
    },
    async (request) => {
      const offering = await dependencies.service.publicOffering(request.params.id);
      if (offering === undefined) {
        throw new ApplicationError({
          category: 'not_found',
          code: 'goods_offering_not_found',
          message: 'Goods Offering not found.',
        });
      }
      return offering;
    },
  );

  server.get(
    '/api/v1/creator/goods/offerings',
    {
      schema: {
        operationId: 'listCreatorGoodsOfferings',
        response: { 200: GoodsOfferingListResponseSchema, 401: ApiErrorEnvelopeSchema },
        tags: ['goods'],
      },
      preHandler: authenticate,
    },
    async (request) => ({
      offerings: await dependencies.service.listOfferings(requireSeller(request).sellerId),
    }),
  );

  server.post<{ Body: GoodsOfferingInputBody }>(
    '/api/v1/creator/goods/offerings',
    {
      schema: {
        operationId: 'createCreatorGoodsOffering',
        body: GoodsOfferingInputSchema,
        response: {
          201: GoodsOfferingResponseSchema,
          400: ApiErrorEnvelopeSchema,
          401: ApiErrorEnvelopeSchema,
        },
        tags: ['goods'],
      },
      preHandler: authenticate,
    },
    async (request, reply) => {
      const seller = requireSeller(request);
      return reply
        .code(201)
        .send(
          offeringResponse(
            await dependencies.service.createOffering(seller.sellerId, request.body, request.id),
          ),
        );
    },
  );

  server.patch<{ Params: { offeringId: string }; Body: GoodsOfferingUpdateBody }>(
    '/api/v1/creator/goods/offerings/:offeringId',
    {
      schema: {
        operationId: 'updateCreatorGoodsOffering',
        params: OfferingParams,
        body: GoodsOfferingUpdateSchema,
        response: {
          200: GoodsOfferingResponseSchema,
          400: ApiErrorEnvelopeSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['goods'],
      },
      preHandler: authenticate,
    },
    async (request) => {
      const seller = requireSeller(request);
      return dependencies.service.updateOffering(
        seller.sellerId,
        request.params.offeringId,
        request.body.expectedRevision,
        request.body.terms,
        request.id,
      );
    },
  );

  for (const [action, operationId] of [
    ['publish', 'publishCreatorGoodsOffering'],
    ['pause', 'pauseCreatorGoodsOffering'],
    ['resume', 'resumeCreatorGoodsOffering'],
  ] as const) {
    server.post<{ Params: { offeringId: string }; Body: GoodsOfferingStateChangeBody }>(
      `/api/v1/creator/goods/offerings/:offeringId/${action}`,
      {
        schema: {
          operationId,
          params: OfferingParams,
          body: GoodsOfferingStateChangeSchema,
          response: {
            200: GoodsOfferingResponseSchema,
            401: ApiErrorEnvelopeSchema,
            403: ApiErrorEnvelopeSchema,
            404: ApiErrorEnvelopeSchema,
            409: ApiErrorEnvelopeSchema,
          },
          tags: ['goods'],
        },
        preHandler: authenticate,
      },
      async (request) => {
        const seller = requireSeller(request);
        const method =
          action === 'publish'
            ? 'publishOffering'
            : action === 'pause'
              ? 'pauseOffering'
              : 'resumeOffering';
        return dependencies.service[method](
          seller.sellerId,
          request.params.offeringId,
          request.body.expectedRevision,
          request.id,
        );
      },
    );
  }

  server.post<{ Params: { offeringId: string }; Body: GoodsOrderSubmitBody }>(
    '/api/v1/private/goods/offerings/:offeringId/orders',
    {
      schema: {
        operationId: 'submitGoodsOrder',
        params: OfferingParams,
        body: GoodsOrderSubmitSchema,
        response: {
          201: GoodsOrderViewSchema,
          400: ApiErrorEnvelopeSchema,
          401: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['goods'],
      },
    },
    async (request, reply) => {
      const account = await resolveAccount(request);
      const result = await dependencies.service.submitOrder(
        account.accountId,
        request.params.offeringId,
        request.body.idempotencyKey,
        request.id,
      );
      return reply.code(201).send(result);
    },
  );

  server.get(
    '/api/v1/private/goods/orders',
    {
      schema: {
        operationId: 'listMyGoodsOrders',
        response: { 200: GoodsOrderListResponseSchema, 401: ApiErrorEnvelopeSchema },
        tags: ['goods'],
      },
    },
    async (request) => ({
      orders: await dependencies.service.buyerOrders((await resolveAccount(request)).accountId),
    }),
  );

  server.get<{ Params: { orderId: string } }>(
    '/api/v1/private/goods/orders/:orderId',
    {
      schema: {
        operationId: 'getMyGoodsOrder',
        params: OrderParams,
        response: {
          200: GoodsOrderViewSchema,
          401: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
        },
        tags: ['goods'],
      },
    },
    async (request) =>
      dependencies.service.getBuyerOrder(
        (await resolveAccount(request)).accountId,
        request.params.orderId,
      ),
  );

  server.post<{ Params: { orderId: string }; Body: GoodsReceiptInputBody }>(
    '/api/v1/private/goods/orders/:orderId/receipt',
    {
      schema: {
        operationId: 'confirmGoodsReceipt',
        params: OrderParams,
        body: GoodsReceiptInputSchema,
        response: {
          200: GoodsOrderViewSchema,
          401: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['goods'],
      },
    },
    async (request) =>
      dependencies.service.recordBuyerReceipt(
        (await resolveAccount(request)).accountId,
        request.params.orderId,
        request.body.note,
        request.id,
      ),
  );

  server.get(
    '/api/v1/creator/goods/orders',
    {
      schema: {
        operationId: 'listCreatorGoodsOrders',
        response: { 200: GoodsOrderListResponseSchema, 401: ApiErrorEnvelopeSchema },
        tags: ['goods'],
      },
      preHandler: authenticate,
    },
    async (request) => ({
      orders: await dependencies.service.sellerOrders(requireSeller(request).sellerId),
    }),
  );

  server.post<{ Params: { orderId: string } }>(
    '/api/v1/creator/goods/orders/:orderId/accept',
    {
      schema: {
        operationId: 'acceptGoodsOrder',
        params: OrderParams,
        response: {
          200: GoodsOrderViewSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['goods'],
      },
      preHandler: authenticate,
    },
    async (request) => {
      const seller = requireSeller(request);
      return dependencies.service.acceptOrder(
        seller.sellerId,
        request.params.orderId,
        seller.actorAccountId,
        request.id,
      );
    },
  );

  server.post<{ Params: { orderId: string }; Body: GoodsReasonBody }>(
    '/api/v1/creator/goods/orders/:orderId/reject',
    {
      schema: {
        operationId: 'rejectGoodsOrder',
        params: OrderParams,
        body: GoodsReasonSchema,
        response: {
          200: GoodsOrderViewSchema,
          400: ApiErrorEnvelopeSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['goods'],
      },
      preHandler: authenticate,
    },
    async (request) => {
      const seller = requireSeller(request);
      return dependencies.service.rejectOrder(
        seller.sellerId,
        request.params.orderId,
        seller.actorAccountId,
        request.body.reason,
        request.id,
      );
    },
  );

  server.post<{ Params: { orderId: string }; Body: GoodsDeliveryInputBody }>(
    '/api/v1/creator/goods/orders/:orderId/delivery',
    {
      schema: {
        operationId: 'recordGoodsDelivery',
        params: OrderParams,
        body: GoodsDeliveryInputSchema,
        response: {
          200: GoodsOrderViewSchema,
          400: ApiErrorEnvelopeSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['goods'],
      },
      preHandler: authenticate,
    },
    async (request) => {
      const seller = requireSeller(request);
      return dependencies.service.recordDelivery(
        seller.sellerId,
        request.params.orderId,
        request.body.method,
        request.body.note,
        request.id,
      );
    },
  );

  server.post<{ Params: { orderId: string }; Body: GoodsReasonBody }>(
    '/api/v1/creator/goods/orders/:orderId/cancel-proposal',
    {
      schema: {
        operationId: 'proposeGoodsOrderCancellation',
        params: OrderParams,
        body: GoodsReasonSchema,
        response: {
          200: GoodsOrderViewSchema,
          400: ApiErrorEnvelopeSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['goods'],
      },
      preHandler: authenticate,
    },
    async (request) => {
      const seller = requireSeller(request);
      return dependencies.service.proposeCancellation(
        seller.sellerId,
        request.params.orderId,
        request.body.reason,
        request.id,
      );
    },
  );
}
