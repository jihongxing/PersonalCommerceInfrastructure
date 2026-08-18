import { DomainTransitionError } from '../shared/domain-error.js';

export type AvailabilitySlotState = 'available' | 'blocked';
export type ReservationState = 'held' | 'confirmed' | 'cancelled' | 'expired';

export interface AvailabilitySlot {
  readonly id: string;
  readonly creatorId: string;
  readonly offeringId: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly capacity: 1;
  readonly state: AvailabilitySlotState;
}

export interface ReservationSnapshot {
  readonly offeringTitle: string;
  readonly offeringDescription: string;
  readonly serviceTerms: string;
  readonly slotStartsAt: string;
  readonly slotEndsAt: string;
}

export interface ReservationReschedule {
  readonly fromAvailabilitySlotId: string;
  readonly toAvailabilitySlotId: string;
  readonly occurredAt: string;
  readonly actor: 'creator' | 'customer';
}

export interface Reservation {
  readonly id: string;
  readonly creatorId: string;
  readonly customerId: string;
  readonly offeringId: string;
  readonly availabilitySlotId: string;
  readonly resultAccessToken: string;
  readonly state: ReservationState;
  readonly heldAt: string;
  readonly holdExpiresAt: string;
  readonly confirmedAt?: string;
  readonly cancelledAt?: string;
  readonly cancelledBy?: 'creator' | 'customer';
  readonly rescheduledAt?: string;
  readonly orderId?: string;
  readonly snapshot?: ReservationSnapshot;
  readonly rescheduleHistory: readonly ReservationReschedule[];
}

export function createAvailabilitySlot(input: {
  readonly id: string;
  readonly creatorId: string;
  readonly offeringId: string;
  readonly startsAt: string;
  readonly endsAt: string;
}): AvailabilitySlot {
  requireText(input.id, 'Availability Slot id');
  requireText(input.creatorId, 'Availability Slot creator id');
  requireText(input.offeringId, 'Availability Slot offering id');
  assertTimeRange(input.startsAt, input.endsAt);

  return Object.freeze({
    ...input,
    capacity: 1,
    state: 'available',
  });
}

export function blockAvailabilitySlot(slot: AvailabilitySlot): AvailabilitySlot {
  if (slot.state === 'blocked') {
    return slot;
  }
  return Object.freeze({ ...slot, state: 'blocked' });
}

export function createReservationHold(input: {
  readonly id: string;
  readonly creatorId: string;
  readonly customerId: string;
  readonly offeringId: string;
  readonly availabilitySlotId: string;
  readonly resultAccessToken: string;
  readonly heldAt: string;
  readonly holdExpiresAt: string;
}): Reservation {
  requireText(input.id, 'Reservation id');
  requireText(input.creatorId, 'Reservation creator id');
  requireText(input.customerId, 'Reservation customer id');
  requireText(input.offeringId, 'Reservation offering id');
  requireText(input.availabilitySlotId, 'Reservation availability slot id');
  requireText(input.resultAccessToken, 'Reservation result access token');
  assertTimeRange(input.heldAt, input.holdExpiresAt);

  return Object.freeze({
    ...input,
    state: 'held',
    rescheduleHistory: Object.freeze([]),
  });
}

export function expireReservation(reservation: Reservation, now: string): Reservation {
  if (reservation.state === 'expired') {
    return reservation;
  }
  if (reservation.state !== 'held') {
    throw new DomainTransitionError('Reservation', reservation.state, 'expire');
  }
  if (asMillis(now) < asMillis(reservation.holdExpiresAt)) {
    throw new DomainTransitionError('Reservation', reservation.state, 'expire before hold TTL');
  }
  return Object.freeze({ ...reservation, state: 'expired' });
}

export function confirmReservation(
  reservation: Reservation,
  input: {
    readonly confirmedAt: string;
    readonly orderId: string;
    readonly snapshot: ReservationSnapshot;
  },
): Reservation {
  if (reservation.state === 'confirmed') {
    if (reservation.orderId === input.orderId) {
      return reservation;
    }
    throw new DomainTransitionError('Reservation', reservation.state, 'confirm with another Order');
  }
  if (reservation.state !== 'held') {
    throw new DomainTransitionError('Reservation', reservation.state, 'confirm');
  }
  if (asMillis(input.confirmedAt) >= asMillis(reservation.holdExpiresAt)) {
    throw new DomainTransitionError('Reservation', reservation.state, 'confirm expired hold');
  }
  requireText(input.orderId, 'Reservation Order id');
  assertSnapshot(input.snapshot);

  return Object.freeze({
    ...reservation,
    state: 'confirmed',
    confirmedAt: input.confirmedAt,
    orderId: input.orderId,
    snapshot: Object.freeze({ ...input.snapshot }),
  });
}

export function cancelReservation(
  reservation: Reservation,
  input: { readonly cancelledAt: string; readonly cancelledBy: 'creator' | 'customer' },
): Reservation {
  if (reservation.state === 'cancelled') {
    return reservation;
  }
  if (reservation.state === 'expired') {
    throw new DomainTransitionError('Reservation', reservation.state, 'cancel');
  }
  return Object.freeze({
    ...reservation,
    state: 'cancelled',
    cancelledAt: input.cancelledAt,
    cancelledBy: input.cancelledBy,
  });
}

export function rescheduleReservation(
  reservation: Reservation,
  input: {
    readonly availabilitySlotId: string;
    readonly rescheduledAt: string;
    readonly actor: 'creator' | 'customer';
  },
): Reservation {
  if (reservation.state !== 'confirmed') {
    throw new DomainTransitionError('Reservation', reservation.state, 'reschedule');
  }
  if (reservation.availabilitySlotId === input.availabilitySlotId) {
    return reservation;
  }
  requireText(input.availabilitySlotId, 'Rescheduled Availability Slot id');

  return Object.freeze({
    ...reservation,
    availabilitySlotId: input.availabilitySlotId,
    rescheduledAt: input.rescheduledAt,
    rescheduleHistory: Object.freeze([
      ...reservation.rescheduleHistory,
      {
        fromAvailabilitySlotId: reservation.availabilitySlotId,
        toAvailabilitySlotId: input.availabilitySlotId,
        occurredAt: input.rescheduledAt,
        actor: input.actor,
      },
    ]),
  });
}

function assertSnapshot(snapshot: ReservationSnapshot): void {
  requireText(snapshot.offeringTitle, 'Reservation snapshot offering title');
  requireText(snapshot.offeringDescription, 'Reservation snapshot offering description');
  requireText(snapshot.serviceTerms, 'Reservation snapshot service terms');
  assertTimeRange(snapshot.slotStartsAt, snapshot.slotEndsAt);
}

function assertTimeRange(startsAt: string, endsAt: string): void {
  requireText(startsAt, 'Start time');
  requireText(endsAt, 'End time');
  if (asMillis(endsAt) <= asMillis(startsAt)) {
    throw new Error('End time must be later than start time.');
  }
}

function asMillis(value: string): number {
  const millis = Date.parse(value);
  if (Number.isNaN(millis)) {
    throw new Error('Reservation timestamps must be valid ISO-8601 values.');
  }
  return millis;
}

function requireText(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} is required.`);
  }
}
