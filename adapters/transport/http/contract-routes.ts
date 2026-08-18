import type { FastifyInstance, FastifyRequest } from 'fastify';
import { Type } from 'typebox';

import { extractBearerToken } from '../../auth/transport/bearer-token.js';
import type { ActorContext } from '../../../applications/core/actor-context.js';
import { ApplicationError } from '../../../applications/core/application-error.js';
import type { AuthContextProvider } from '../../../applications/core/ports/auth-context-provider.js';
import type {
  ContractDetails,
  ContractService,
} from '../../../applications/contract-commerce/contract-service.js';
import type { PaidCommerceService } from '../../../applications/paid-commerce/paid-commerce-service.js';
import {
  ContractDetailsSchema,
  ContractRelatedOrderSchema,
  CreatorContractListSchema,
  CreateContractProposalSchema,
} from '../../../contracts/api/v1/contract-commerce-contracts.js';
import { ApiErrorEnvelopeSchema } from '../../../contracts/api/v1/system-contracts.js';

interface AuthenticatedRequest extends FastifyRequest {
  actorContext?: ActorContext;
}

export function registerContractRoutes(
  server: FastifyInstance,
  dependencies: {
    readonly service: ContractService;
    readonly paidCommerceService: PaidCommerceService;
    readonly authContextProvider: AuthContextProvider;
  },
): void {
  const contractParams = Type.Object({ contractId: Type.String({ minLength: 1 }) });
  const resultParams = Type.Object({ resultAccessToken: Type.String({ minLength: 1 }) });
  const authenticateCreator = async (request: AuthenticatedRequest): Promise<void> => {
    request.actorContext = await dependencies.authContextProvider.resolveActorContext({
      accessToken: extractBearerToken(request.headers.authorization),
      correlationId: request.id,
    });
  };

  server.post(
    '/api/v1/creator/contracts/proposals',
    {
      schema: {
        operationId: 'createCreatorContractProposal',
        body: CreateContractProposalSchema,
        response: {
          201: ContractDetailsSchema,
          400: ApiErrorEnvelopeSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['contract-commerce'],
      },
      preHandler: authenticateCreator,
    },
    async (request, reply) => {
      const body = request.body as {
        readonly commerceActionId: string;
        readonly proposalExpiresAt: string;
        readonly scope: {
          readonly performanceType: string;
          readonly performanceDate: string;
          readonly location: string;
          readonly durationMinutes: number;
          readonly creatorHeadcount: number;
          readonly deliverables: string;
          readonly priceMinor: string;
          readonly currency: 'CNY';
          readonly cancellationTerms: string;
          readonly fulfillmentCriteria: string;
        };
      };
      const details = await dependencies.service.createProposal(
        {
          commerceActionId: body.commerceActionId,
          proposalExpiresAt: body.proposalExpiresAt,
          scope: { ...body.scope, priceMinor: parseMinor(body.scope.priceMinor) },
        },
        requireCreatorContext(request),
      );
      return reply.status(201).send(serializeDetails(details));
    },
  );

  server.get(
    '/api/v1/creator/contracts',
    {
      schema: {
        operationId: 'listCreatorContracts',
        response: { 200: CreatorContractListSchema, 401: ApiErrorEnvelopeSchema },
        tags: ['contract-commerce'],
      },
      preHandler: authenticateCreator,
    },
    async (request) => ({
      contracts: (
        await dependencies.service.listCreatorContracts(requireCreatorContext(request))
      ).map(serializeDetails),
    }),
  );

  server.get(
    '/api/v1/creator/contracts/:contractId',
    {
      schema: {
        operationId: 'getCreatorContract',
        params: contractParams,
        response: {
          200: ContractDetailsSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
        },
        tags: ['contract-commerce'],
      },
      preHandler: authenticateCreator,
    },
    async (request) => {
      const { contractId } = request.params as { readonly contractId: string };
      return serializeDetails(
        await dependencies.service.getById(contractId, requireCreatorContext(request)),
      );
    },
  );

  server.get(
    '/api/v1/public/contracts/:resultAccessToken',
    {
      schema: {
        operationId: 'getPublicContract',
        params: resultParams,
        response: { 200: ContractDetailsSchema, 404: ApiErrorEnvelopeSchema },
        tags: ['contract-commerce'],
      },
    },
    async (request) => {
      const { resultAccessToken } = request.params as { readonly resultAccessToken: string };
      return serializeDetails(await dependencies.service.getByResultAccessToken(resultAccessToken));
    },
  );

  server.get(
    '/api/v1/public/contracts/:resultAccessToken/scope',
    {
      schema: {
        operationId: 'getPublicContractScope',
        params: resultParams,
        response: { 200: ContractDetailsSchema, 404: ApiErrorEnvelopeSchema },
        tags: ['contract-commerce'],
      },
    },
    async (request) => {
      const { resultAccessToken } = request.params as { readonly resultAccessToken: string };
      return serializeDetails(await dependencies.service.getByResultAccessToken(resultAccessToken));
    },
  );

  server.get(
    '/api/v1/public/contracts/:resultAccessToken/order',
    {
      schema: {
        operationId: 'getPublicContractRelatedOrder',
        params: resultParams,
        response: {
          200: ContractRelatedOrderSchema,
          404: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['contract-commerce'],
      },
    },
    async (request) => {
      const { resultAccessToken } = request.params as { readonly resultAccessToken: string };
      const details = await dependencies.service.getByResultAccessToken(resultAccessToken);
      if (details.contract.orderId === undefined) {
        throw new ApplicationError({
          category: 'conflict',
          code: 'contract_order_not_created',
          message: 'A related Order is only available after the Contract is formed.',
        });
      }
      const status = await dependencies.paidCommerceService.getPublicOrderStatus(resultAccessToken);
      return {
        orderId: details.contract.orderId,
        orderState: status.orderState,
        paymentState: status.paymentState,
      };
    },
  );

  server.post(
    '/api/v1/public/contracts/:resultAccessToken/accept',
    {
      schema: {
        operationId: 'acceptPublicContract',
        params: resultParams,
        response: {
          200: ContractDetailsSchema,
          404: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['contract-commerce'],
      },
    },
    async (request) => {
      const { resultAccessToken } = request.params as { readonly resultAccessToken: string };
      return serializeDetails(await dependencies.service.accept(resultAccessToken, request.id));
    },
  );

  server.post(
    '/api/v1/public/contracts/:resultAccessToken/reject',
    {
      schema: {
        operationId: 'rejectPublicContract',
        params: resultParams,
        response: {
          200: ContractDetailsSchema,
          404: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['contract-commerce'],
      },
    },
    async (request) => {
      const { resultAccessToken } = request.params as { readonly resultAccessToken: string };
      return serializeDetails(await dependencies.service.reject(resultAccessToken, request.id));
    },
  );

  server.post(
    '/api/v1/creator/contracts/:contractId/expire',
    {
      schema: {
        operationId: 'expireCreatorContract',
        params: contractParams,
        response: {
          200: ContractDetailsSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['contract-commerce'],
      },
      preHandler: authenticateCreator,
    },
    async (request) => {
      const { contractId } = request.params as { readonly contractId: string };
      return serializeDetails(
        await dependencies.service.expire(contractId, requireCreatorContext(request)),
      );
    },
  );

  server.post(
    '/api/v1/creator/contracts/:contractId/cancel',
    {
      schema: {
        operationId: 'cancelCreatorContract',
        params: contractParams,
        response: {
          200: ContractDetailsSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['contract-commerce'],
      },
      preHandler: authenticateCreator,
    },
    async (request) => {
      const { contractId } = request.params as { readonly contractId: string };
      return serializeDetails(
        await dependencies.service.cancel(contractId, 'creator', requireCreatorContext(request)),
      );
    },
  );

  server.post(
    '/api/v1/public/contracts/:resultAccessToken/cancel',
    {
      schema: {
        operationId: 'cancelPublicContract',
        params: resultParams,
        response: {
          200: ContractDetailsSchema,
          404: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['contract-commerce'],
      },
    },
    async (request) => {
      const { resultAccessToken } = request.params as { readonly resultAccessToken: string };
      return serializeDetails(
        await dependencies.service.cancelByResultAccessToken(resultAccessToken, request.id),
      );
    },
  );
}

function serializeDetails(details: ContractDetails) {
  return {
    contract: details.contract,
    scopeVersion: {
      ...details.scopeVersion,
      scope: {
        ...details.scopeVersion.scope,
        priceMinor: String(details.scopeVersion.scope.priceMinor),
      },
    },
  };
}

function requireCreatorContext(request: AuthenticatedRequest): ActorContext {
  if (request.actorContext?.actor.kind !== 'creator') {
    throw new ApplicationError({
      category: 'authentication',
      code: 'creator_authentication_required',
      message: 'Creator authentication is required.',
    });
  }
  return request.actorContext;
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
