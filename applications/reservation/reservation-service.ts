import {
  cancelReservation,
  confirmReservation,
  createAvailabilitySlot,
  createReservationHold,
  expireReservation,
  rescheduleReservation,
  type AvailabilitySlot,
  type Reservation,
} from '../../modules/reservation/reservation.js';
import {
  beginOrderPayment,
  createPaidServiceOrder,
  createPayment,
  money,
} from '../../modules/paid-commerce/money-domain.js';
import { createCustomer } from '../../modules/customer-request/commerce-action.js';
import { assertCreatorOwnership } from '../../modules/shared/actors.js';
import type { ActorContext } from '../core/actor-context.js';
import { ApplicationError } from '../core/application-error.js';
import type { CanonicalEventRecorder } from '../core/canonical-event-recorder.js';
import type { Clock } from '../core/ports/clock.js';
import type { IdGenerator } from '../core/ports/id-generator.js';
import type { UnitOfWork } from '../core/ports/unit-of-work.js';
import type { CustomerRepository } from '../customer-request/customer-request-repositories.js';
import type { PaidCommerceRepository } from '../paid-commerce/paid-commerce-repositories.js';
import type { OfferingRepository } from '../service-offering/offering-repositories.js';
import type { ReservationRepository } from './reservation-repositories.js';

export interface CreateAvailabilitySlotCommand {
  readonly offeringId: string;
  readonly startsAt: string;
  readonly endsAt: string;
}

export interface CreateReservationHoldCommand {
  readonly offeringId: string;
  readonly availabilitySlotId: string;
  readonly contactName: string;
  readonly contactMethod: string;
}

export interface ConfirmReservationCommand {
  readonly reservationId: string;
  readonly grossPriceMinor: bigint;
  readonly serviceTerms: string;
}

export interface CancelReservationCommand {
  readonly reservationId: string;
  readonly cancelledBy: 'creator' | 'customer';
}

export interface RescheduleReservationCommand {
  readonly reservationId: string;
  readonly availabilitySlotId: string;
}

export interface ReservationService {
  createAvailabilitySlot(
    command: CreateAvailabilitySlotCommand,
    context: ActorContext,
  ): Promise<AvailabilitySlot>;
  listPublicAvailabilitySlots(offeringId: string): Promise<readonly AvailabilitySlot[]>;
  createHold(command: CreateReservationHoldCommand, correlationId: string): Promise<Reservation>;
  getPublicReservation(resultAccessToken: string): Promise<Reservation>;
  listCreatorReservations(context: ActorContext): Promise<readonly Reservation[]>;
  confirm(command: ConfirmReservationCommand, context: ActorContext): Promise<Reservation>;
  cancel(command: CancelReservationCommand, context: ActorContext): Promise<Reservation>;
  reschedule(command: RescheduleReservationCommand, context: ActorContext): Promise<Reservation>;
  expire(reservationId: string): Promise<Reservation>;
  recordNoShow(reservationId: string, context: ActorContext): Promise<Reservation>;
}

export function createReservationService(dependencies: {
  readonly offeringRepository: OfferingRepository;
  readonly customerRepository: CustomerRepository;
  readonly reservationRepository: ReservationRepository;
  readonly paidCommerceRepository: PaidCommerceRepository;
  readonly idGenerator: IdGenerator;
  readonly clock: Clock;
  readonly holdTtlMilliseconds: number;
  readonly canonicalEventRecorder: CanonicalEventRecorder;
  readonly unitOfWork: UnitOfWork;
}): ReservationService {
  const now = (): string => dependencies.clock.now();

  return {
    createAvailabilitySlot: async (command, context) => {
      const creatorId = requireCreator(context);
      return dependencies.unitOfWork.execute(async (scope) => {
        const offeringRepository = scope.offeringRepository ?? dependencies.offeringRepository;
        const reservationRepository =
          scope.reservationRepository ?? dependencies.reservationRepository;
        const offering = await offeringRepository.findById(command.offeringId);
        if (offering === undefined || offering.creatorId !== creatorId) {
          throw notFound(
            'reservation_offering_not_found',
            'Offering was not found for this Creator.',
          );
        }
        const slot = createAvailabilitySlot({
          id: dependencies.idGenerator.generate(),
          creatorId,
          offeringId: offering.id,
          startsAt: command.startsAt,
          endsAt: command.endsAt,
        });
        await reservationRepository.saveAvailabilitySlot(slot);
        return slot;
      });
    },

    listPublicAvailabilitySlots: async (offeringId) => {
      const offering = await dependencies.offeringRepository.findById(offeringId);
      if (offering === undefined || offering.state !== 'published') {
        throw notFound('reservation_offering_not_found', 'Published Offering was not found.');
      }
      const slots =
        await dependencies.reservationRepository.findAvailabilitySlotsByOfferingId(offeringId);
      const visibleSlots: AvailabilitySlot[] = [];
      for (const slot of slots) {
        if (slot.state !== 'available') {
          continue;
        }
        await expireHeldReservations(
          dependencies.reservationRepository,
          slot.id,
          now(),
          dependencies,
        );
        if ((await activeReservation(dependencies.reservationRepository, slot.id)) === undefined) {
          visibleSlots.push(slot);
        }
      }
      return visibleSlots;
    },

    createHold: async (command, correlationId) =>
      dependencies.unitOfWork.execute(async (scope) => {
        const offeringRepository = scope.offeringRepository ?? dependencies.offeringRepository;
        const customerRepository = scope.customerRepository ?? dependencies.customerRepository;
        const reservationRepository =
          scope.reservationRepository ?? dependencies.reservationRepository;
        await reservationRepository.lockAvailabilitySlots([command.availabilitySlotId]);
        const offering = await offeringRepository.findById(command.offeringId);
        if (offering === undefined || offering.state !== 'published') {
          throw notFound('reservation_offering_not_found', 'Published Offering was not found.');
        }
        const slot = await reservationRepository.findAvailabilitySlotById(
          command.availabilitySlotId,
        );
        if (
          slot === undefined ||
          slot.offeringId !== offering.id ||
          slot.creatorId !== offering.creatorId ||
          slot.state !== 'available'
        ) {
          throw conflict(
            'reservation_slot_unavailable',
            'The selected Reservation Slot is not available.',
          );
        }
        await expireHeldReservations(reservationRepository, slot.id, now(), dependencies);
        const active = await activeReservation(reservationRepository, slot.id);
        if (active !== undefined) {
          throw conflict(
            'reservation_slot_unavailable',
            'The selected Reservation Slot is already held or confirmed.',
          );
        }
        const customer =
          (await customerRepository.findByContactMethod(command.contactMethod.trim())) ??
          createCustomer(dependencies.idGenerator.generate(), {
            contactName: command.contactName,
            contactMethod: command.contactMethod,
          });
        await customerRepository.save(customer);
        const heldAt = now();
        const reservation = createReservationHold({
          id: dependencies.idGenerator.generate(),
          creatorId: offering.creatorId,
          customerId: customer.id,
          offeringId: offering.id,
          availabilitySlotId: slot.id,
          resultAccessToken: dependencies.idGenerator.generate(),
          heldAt,
          holdExpiresAt: new Date(
            Date.parse(heldAt) + dependencies.holdTtlMilliseconds,
          ).toISOString(),
        });
        await reservationRepository.saveReservation(reservation);
        await dependencies.canonicalEventRecorder.record(
          {
            actorId: customer.id,
            correlationId,
            name: 'reservation_held',
            objectId: reservation.id,
            source: 'customer',
            payload: { availabilitySlotId: slot.id, holdExpiresAt: reservation.holdExpiresAt },
          },
          scope.productEventStore,
        );
        return reservation;
      }),

    getPublicReservation: async (resultAccessToken) => {
      const reservation =
        await dependencies.reservationRepository.findReservationByResultAccessToken(
          resultAccessToken,
        );
      if (reservation === undefined) {
        throw notFound('reservation_not_found', 'Reservation was not found.');
      }
      return expireIfNeeded(reservation, dependencies, `reservation-view:${reservation.id}`);
    },

    listCreatorReservations: async (context) => {
      const creatorId = requireCreator(context);
      const reservations =
        await dependencies.reservationRepository.findReservationsByCreatorId(creatorId);
      return Promise.all(
        reservations.map((reservation) =>
          expireIfNeeded(reservation, dependencies, `reservation-list:${reservation.id}`),
        ),
      );
    },

    confirm: async (command, context) =>
      dependencies.unitOfWork.execute(async (scope) => {
        const creatorId = requireCreator(context);
        const offeringRepository = scope.offeringRepository ?? dependencies.offeringRepository;
        const reservationRepository =
          scope.reservationRepository ?? dependencies.reservationRepository;
        const paidCommerceRepository =
          scope.paidCommerceRepository ?? dependencies.paidCommerceRepository;
        const reservation = await requireReservation(reservationRepository, command.reservationId);
        assertCreatorOwnership(context.actor, reservation.creatorId);
        await reservationRepository.lockAvailabilitySlots([reservation.availabilitySlotId]);
        const current = await requireReservation(reservationRepository, reservation.id);
        const currentReservation = await expireIfNeeded(
          current,
          dependencies,
          `reservation-confirm:${current.id}`,
        );
        if (currentReservation.state === 'confirmed') {
          const order = await paidCommerceRepository.findOrderByReservationId(
            currentReservation.id,
          );
          if (
            order === undefined ||
            order.snapshot.grossPrice.minor !== command.grossPriceMinor ||
            order.snapshot.serviceTerms !== command.serviceTerms.trim()
          ) {
            throw conflict(
              'reservation_confirm_replay_conflict',
              'Reservation confirmation conflicts with the existing Order snapshot.',
            );
          }
          return currentReservation;
        }
        if (currentReservation.state !== 'held') {
          throw conflict('reservation_not_confirmable', 'Reservation cannot be confirmed.');
        }
        const slot = await reservationRepository.findAvailabilitySlotById(
          currentReservation.availabilitySlotId,
        );
        if (slot === undefined || slot.state !== 'available') {
          throw conflict('reservation_slot_unavailable', 'Reservation Slot is unavailable.');
        }
        const offering = await offeringRepository.findById(currentReservation.offeringId);
        if (offering === undefined || offering.creatorId !== creatorId) {
          throw conflict(
            'reservation_offering_snapshot_unavailable',
            'Reservation confirmation requires its Offering snapshot source.',
          );
        }
        const existingOrder = await paidCommerceRepository.findOrderByReservationId(
          currentReservation.id,
        );
        const orderId = existingOrder?.id ?? dependencies.idGenerator.generate();
        const confirmed = confirmReservation(currentReservation, {
          confirmedAt: now(),
          orderId,
          snapshot: {
            offeringTitle: offering.title,
            offeringDescription: offering.description,
            serviceTerms: command.serviceTerms,
            slotStartsAt: slot.startsAt,
            slotEndsAt: slot.endsAt,
          },
        });
        if (existingOrder === undefined) {
          const order = beginOrderPayment(
            createPaidServiceOrder({
              id: orderId,
              reservationId: confirmed.id,
              creatorId: confirmed.creatorId,
              customerId: confirmed.customerId,
              offeringId: confirmed.offeringId,
              snapshot: {
                offeringTitle: confirmed.snapshot?.offeringTitle ?? offering.title,
                offeringDescription:
                  confirmed.snapshot?.offeringDescription ?? offering.description,
                serviceTerms: confirmed.snapshot?.serviceTerms ?? command.serviceTerms,
                grossPrice: money('CNY', command.grossPriceMinor),
              },
            }),
          );
          await paidCommerceRepository.saveOrder(order);
          await paidCommerceRepository.savePayment(
            createPayment({
              id: dependencies.idGenerator.generate(),
              order,
              correlationId: `order:${order.id}:payment-attempt`,
            }),
          );
          await dependencies.canonicalEventRecorder.record(
            {
              actorId: creatorId,
              correlationId: context.correlationId,
              name: 'order_created',
              objectId: order.id,
              source: 'creator',
              payload: {
                reservationId: confirmed.id,
                currency: 'CNY',
                grossPriceMinor: String(command.grossPriceMinor),
              },
            },
            scope.productEventStore,
          );
        }
        await reservationRepository.saveReservation(confirmed);
        await dependencies.canonicalEventRecorder.record(
          {
            actorId: creatorId,
            correlationId: context.correlationId,
            name: 'reservation_confirmed',
            objectId: confirmed.id,
            source: 'creator',
            payload: { orderId },
          },
          scope.productEventStore,
        );
        return confirmed;
      }),

    cancel: async (command, context) =>
      dependencies.unitOfWork.execute(async (scope) => {
        const reservationRepository =
          scope.reservationRepository ?? dependencies.reservationRepository;
        const reservation = await requireReservation(reservationRepository, command.reservationId);
        if (command.cancelledBy === 'creator') {
          assertCreatorOwnership(context.actor, reservation.creatorId);
        } else if (
          context.actor.kind !== 'customer' ||
          context.actor.customerId !== reservation.customerId
        ) {
          throw new ApplicationError({
            category: 'authorization',
            code: 'reservation_customer_not_owned',
            message: 'Customer does not own this Reservation.',
          });
        }
        await reservationRepository.lockAvailabilitySlots([reservation.availabilitySlotId]);
        const cancelled = cancelReservation(
          await requireReservation(reservationRepository, reservation.id),
          { cancelledAt: now(), cancelledBy: command.cancelledBy },
        );
        await reservationRepository.saveReservation(cancelled);
        await dependencies.canonicalEventRecorder.record(
          {
            actorId:
              command.cancelledBy === 'creator' ? reservation.creatorId : reservation.customerId,
            correlationId: context.correlationId,
            name: 'reservation_cancelled',
            objectId: cancelled.id,
            source: command.cancelledBy,
            payload: { orderId: cancelled.orderId ?? null },
          },
          scope.productEventStore,
        );
        await dependencies.canonicalEventRecorder.record(
          {
            actorId:
              command.cancelledBy === 'creator' ? reservation.creatorId : reservation.customerId,
            correlationId: context.correlationId,
            name: 'cancellation_recorded',
            objectId: cancelled.orderId ?? cancelled.id,
            source: command.cancelledBy,
            payload: { reservationId: cancelled.id },
          },
          scope.productEventStore,
        );
        return cancelled;
      }),

    reschedule: async (command, context) =>
      dependencies.unitOfWork.execute(async (scope) => {
        const creatorId = requireCreator(context);
        const reservationRepository =
          scope.reservationRepository ?? dependencies.reservationRepository;
        const reservation = await requireReservation(reservationRepository, command.reservationId);
        assertCreatorOwnership(context.actor, reservation.creatorId);
        await reservationRepository.lockAvailabilitySlots(
          [reservation.availabilitySlotId, command.availabilitySlotId].sort(),
        );
        const target = await reservationRepository.findAvailabilitySlotById(
          command.availabilitySlotId,
        );
        if (
          target === undefined ||
          target.creatorId !== creatorId ||
          target.offeringId !== reservation.offeringId ||
          target.state !== 'available'
        ) {
          throw conflict('reservation_slot_unavailable', 'Rescheduled Slot is unavailable.');
        }
        await expireHeldReservations(reservationRepository, target.id, now(), dependencies);
        const active = await activeReservation(reservationRepository, target.id);
        if (active !== undefined && active.id !== reservation.id) {
          throw conflict('reservation_slot_unavailable', 'Rescheduled Slot is already allocated.');
        }
        const rescheduled = rescheduleReservation(
          await requireReservation(reservationRepository, reservation.id),
          {
            availabilitySlotId: target.id,
            rescheduledAt: now(),
            actor: 'creator',
          },
        );
        await reservationRepository.saveReservation(rescheduled);
        await dependencies.canonicalEventRecorder.record(
          {
            actorId: creatorId,
            correlationId: context.correlationId,
            name: 'reservation_rescheduled',
            objectId: rescheduled.id,
            source: 'creator',
            payload: { availabilitySlotId: target.id, orderId: rescheduled.orderId ?? null },
          },
          scope.productEventStore,
        );
        return rescheduled;
      }),

    expire: async (reservationId) =>
      dependencies.unitOfWork.execute(async (scope) => {
        const reservationRepository =
          scope.reservationRepository ?? dependencies.reservationRepository;
        const reservation = await requireReservation(reservationRepository, reservationId);
        await reservationRepository.lockAvailabilitySlots([reservation.availabilitySlotId]);
        const expired = expireReservation(
          await requireReservation(reservationRepository, reservationId),
          now(),
        );
        await reservationRepository.saveReservation(expired);
        await dependencies.canonicalEventRecorder.record(
          {
            actorId: expired.customerId,
            correlationId: `reservation-expiry:${expired.id}`,
            name: 'reservation_expired',
            objectId: expired.id,
            source: 'system',
            payload: { availabilitySlotId: expired.availabilitySlotId },
          },
          scope.productEventStore,
        );
        return expired;
      }),

    recordNoShow: async (reservationId, context) =>
      dependencies.unitOfWork.execute(async (scope) => {
        const creatorId = requireCreator(context);
        const reservation = await requireReservation(
          scope.reservationRepository ?? dependencies.reservationRepository,
          reservationId,
        );
        if (reservation.creatorId !== creatorId || reservation.state !== 'confirmed') {
          throw conflict(
            'reservation_no_show_not_recordable',
            'No-show requires a confirmed owned Reservation.',
          );
        }
        await dependencies.canonicalEventRecorder.record(
          {
            actorId: creatorId,
            correlationId: context.correlationId,
            name: 'fulfillment_observed',
            objectId: reservation.orderId ?? reservation.id,
            source: 'creator',
            payload: { reservationId: reservation.id, outcome: 'no_show' },
          },
          scope.productEventStore,
        );
        return reservation;
      }),
  };
}

async function expireHeldReservations(
  repository: ReservationRepository,
  availabilitySlotId: string,
  currentTime: string,
  dependencies: Parameters<typeof createReservationService>[0],
): Promise<void> {
  const reservations = await repository.findReservationsByAvailabilitySlotId(availabilitySlotId);
  const staleReservations = reservations
    .filter(
      (reservation) =>
        reservation.state === 'held' &&
        Date.parse(reservation.holdExpiresAt) <= Date.parse(currentTime),
    )
    .map((reservation) => expireReservation(reservation, currentTime));
  await Promise.all(
    staleReservations.map((reservation) => repository.saveReservation(reservation)),
  );
  await Promise.all(
    staleReservations.map((reservation) =>
      dependencies.canonicalEventRecorder.record({
        actorId: reservation.customerId,
        correlationId: `reservation-expiry:${reservation.id}`,
        name: 'reservation_expired',
        objectId: reservation.id,
        source: 'system',
        payload: { availabilitySlotId: reservation.availabilitySlotId },
      }),
    ),
  );
}

async function activeReservation(
  repository: ReservationRepository,
  availabilitySlotId: string,
): Promise<Reservation | undefined> {
  return (await repository.findReservationsByAvailabilitySlotId(availabilitySlotId)).find(
    (reservation) => reservation.state === 'held' || reservation.state === 'confirmed',
  );
}

async function expireIfNeeded(
  reservation: Reservation,
  dependencies: Parameters<typeof createReservationService>[0],
  correlationId: string,
): Promise<Reservation> {
  const currentTime = dependencies.clock.now();
  if (
    reservation.state !== 'held' ||
    Date.parse(reservation.holdExpiresAt) > Date.parse(currentTime)
  ) {
    return reservation;
  }
  return dependencies.unitOfWork.execute(async (scope) => {
    const repository = scope.reservationRepository ?? dependencies.reservationRepository;
    await repository.lockAvailabilitySlots([reservation.availabilitySlotId]);
    const current = await requireReservation(repository, reservation.id);
    if (
      current.state !== 'held' ||
      Date.parse(current.holdExpiresAt) > Date.parse(dependencies.clock.now())
    ) {
      return current;
    }
    const expired = expireReservation(current, dependencies.clock.now());
    await repository.saveReservation(expired);
    await dependencies.canonicalEventRecorder.record(
      {
        actorId: expired.customerId,
        correlationId,
        name: 'reservation_expired',
        objectId: expired.id,
        source: 'system',
        payload: { availabilitySlotId: expired.availabilitySlotId },
      },
      scope.productEventStore,
    );
    return expired;
  });
}

async function requireReservation(
  repository: ReservationRepository,
  reservationId: string,
): Promise<Reservation> {
  const reservation = await repository.findReservationById(reservationId);
  if (reservation === undefined) {
    throw notFound('reservation_not_found', 'Reservation was not found.');
  }
  return reservation;
}

function requireCreator(context: ActorContext): string {
  if (context.actor.kind !== 'creator') {
    throw new ApplicationError({
      category: 'authorization',
      code: 'creator_authentication_required',
      message: 'Reservation action requires Creator authentication.',
    });
  }
  return context.actor.creatorId;
}

function notFound(code: string, message: string): ApplicationError {
  return new ApplicationError({ category: 'not_found', code, message });
}

function conflict(code: string, message: string): ApplicationError {
  return new ApplicationError({ category: 'conflict', code, message });
}
