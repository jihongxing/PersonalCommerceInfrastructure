import type { FastifyInstance, FastifyRequest } from 'fastify';
import { Type } from 'typebox';

import { extractBearerToken } from '../../auth/transport/bearer-token.js';
import type { ActorContext } from '../../../applications/core/actor-context.js';
import { ApplicationError } from '../../../applications/core/application-error.js';
import type { AuthContextProvider } from '../../../applications/core/ports/auth-context-provider.js';
import type { ReservationService } from '../../../applications/reservation/reservation-service.js';
import {
  AvailabilitySlotListSchema,
  AvailabilitySlotSchema,
  ConfirmReservationSchema,
  CreateAvailabilitySlotSchema,
  CreateReservationHoldSchema,
  CreatorReservationListSchema,
  ReservationSchema,
  RescheduleReservationSchema,
} from '../../../contracts/api/v1/reservation-contracts.js';
import { ApiErrorEnvelopeSchema } from '../../../contracts/api/v1/system-contracts.js';

interface AuthenticatedRequest extends FastifyRequest {
  actorContext?: ActorContext;
}

export function registerReservationRoutes(
  server: FastifyInstance,
  dependencies: {
    readonly service: ReservationService;
    readonly authContextProvider: AuthContextProvider;
  },
): void {
  const offeringParams = Type.Object({ offeringId: Type.String({ minLength: 1 }) });
  const reservationParams = Type.Object({ reservationId: Type.String({ minLength: 1 }) });
  const resultParams = Type.Object({ resultAccessToken: Type.String({ minLength: 1 }) });
  const authenticateCreator = async (request: AuthenticatedRequest): Promise<void> => {
    request.actorContext = await dependencies.authContextProvider.resolveActorContext({
      accessToken: extractBearerToken(request.headers.authorization),
      correlationId: request.id,
    });
  };

  server.get(
    '/api/v1/public/offerings/:offeringId/availability-slots',
    {
      schema: {
        operationId: 'listPublicAvailabilitySlots',
        params: offeringParams,
        response: { 200: AvailabilitySlotListSchema, 404: ApiErrorEnvelopeSchema },
        tags: ['reservation-commerce'],
      },
    },
    async (request) => {
      const { offeringId } = request.params as { readonly offeringId: string };
      return { slots: await dependencies.service.listPublicAvailabilitySlots(offeringId) };
    },
  );

  server.post(
    '/api/v1/creator/offerings/:offeringId/availability-slots',
    {
      schema: {
        operationId: 'createCreatorAvailabilitySlot',
        params: offeringParams,
        body: CreateAvailabilitySlotSchema,
        response: {
          201: AvailabilitySlotSchema,
          400: ApiErrorEnvelopeSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['reservation-commerce'],
      },
      preHandler: authenticateCreator,
    },
    async (request, reply) => {
      const { offeringId } = request.params as { readonly offeringId: string };
      const slot = await dependencies.service.createAvailabilitySlot(
        { offeringId, ...(request.body as { readonly startsAt: string; readonly endsAt: string }) },
        requireCreatorContext(request),
      );
      return reply.status(201).send(slot);
    },
  );

  server.post(
    '/api/v1/public/offerings/:offeringId/reservation-holds',
    {
      schema: {
        operationId: 'createPublicReservationHold',
        params: offeringParams,
        body: CreateReservationHoldSchema,
        response: {
          201: ReservationSchema,
          400: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['reservation-commerce'],
      },
    },
    async (request, reply) => {
      const { offeringId } = request.params as { readonly offeringId: string };
      const reservation = await dependencies.service.createHold(
        {
          offeringId,
          ...(request.body as {
            readonly availabilitySlotId: string;
            readonly contactName: string;
            readonly contactMethod: string;
          }),
        },
        request.id,
      );
      return reply.status(201).send(reservation);
    },
  );

  server.get(
    '/api/v1/public/reservations/:resultAccessToken',
    {
      schema: {
        operationId: 'getPublicReservation',
        params: resultParams,
        response: { 200: ReservationSchema, 404: ApiErrorEnvelopeSchema },
        tags: ['reservation-commerce'],
      },
    },
    async (request) => {
      const { resultAccessToken } = request.params as { readonly resultAccessToken: string };
      return dependencies.service.getPublicReservation(resultAccessToken);
    },
  );

  server.post(
    '/api/v1/public/reservations/:resultAccessToken/cancel',
    {
      schema: {
        operationId: 'cancelPublicReservation',
        params: resultParams,
        response: {
          200: ReservationSchema,
          404: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['reservation-commerce'],
      },
    },
    async (request) => {
      const { resultAccessToken } = request.params as { readonly resultAccessToken: string };
      const reservation = await dependencies.service.getPublicReservation(resultAccessToken);
      return dependencies.service.cancel(
        { reservationId: reservation.id, cancelledBy: 'customer' },
        {
          actor: { kind: 'customer', customerId: reservation.customerId },
          correlationId: request.id,
        },
      );
    },
  );

  server.get(
    '/api/v1/creator/reservations',
    {
      schema: {
        operationId: 'listCreatorReservations',
        response: {
          200: CreatorReservationListSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
        },
        tags: ['reservation-commerce'],
      },
      preHandler: authenticateCreator,
    },
    async (request) => ({
      reservations: await dependencies.service.listCreatorReservations(
        requireCreatorContext(request),
      ),
    }),
  );

  server.post(
    '/api/v1/creator/reservations/:reservationId/confirm',
    {
      schema: {
        operationId: 'confirmCreatorReservation',
        params: reservationParams,
        body: ConfirmReservationSchema,
        response: {
          200: ReservationSchema,
          400: ApiErrorEnvelopeSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['reservation-commerce'],
      },
      preHandler: authenticateCreator,
    },
    async (request) => {
      const { reservationId } = request.params as { readonly reservationId: string };
      const body = request.body as {
        readonly grossPriceMinor: string;
        readonly serviceTerms: string;
      };
      return dependencies.service.confirm(
        {
          reservationId,
          grossPriceMinor: parseMinor(body.grossPriceMinor),
          serviceTerms: body.serviceTerms,
        },
        requireCreatorContext(request),
      );
    },
  );

  server.post(
    '/api/v1/creator/reservations/:reservationId/cancel',
    {
      schema: {
        operationId: 'cancelCreatorReservation',
        params: reservationParams,
        response: {
          200: ReservationSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['reservation-commerce'],
      },
      preHandler: authenticateCreator,
    },
    async (request) => {
      const { reservationId } = request.params as { readonly reservationId: string };
      return dependencies.service.cancel(
        { reservationId, cancelledBy: 'creator' },
        requireCreatorContext(request),
      );
    },
  );

  server.post(
    '/api/v1/creator/reservations/:reservationId/reschedule',
    {
      schema: {
        operationId: 'rescheduleCreatorReservation',
        params: reservationParams,
        body: RescheduleReservationSchema,
        response: {
          200: ReservationSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['reservation-commerce'],
      },
      preHandler: authenticateCreator,
    },
    async (request) => {
      const { reservationId } = request.params as { readonly reservationId: string };
      return dependencies.service.reschedule(
        {
          reservationId,
          ...(request.body as { readonly availabilitySlotId: string }),
        },
        requireCreatorContext(request),
      );
    },
  );

  server.post(
    '/api/v1/creator/reservations/:reservationId/no-show',
    {
      schema: {
        operationId: 'recordCreatorReservationNoShow',
        params: reservationParams,
        response: {
          200: ReservationSchema,
          401: ApiErrorEnvelopeSchema,
          403: ApiErrorEnvelopeSchema,
          404: ApiErrorEnvelopeSchema,
          409: ApiErrorEnvelopeSchema,
        },
        tags: ['reservation-commerce'],
      },
      preHandler: authenticateCreator,
    },
    async (request) => {
      const { reservationId } = request.params as { readonly reservationId: string };
      return dependencies.service.recordNoShow(reservationId, requireCreatorContext(request));
    },
  );
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
