import { describe, expect, it } from 'vitest';

import {
  cancelReservation,
  confirmReservation,
  createAvailabilitySlot,
  createReservationHold,
  expireReservation,
  rescheduleReservation,
} from './reservation.js';

const held = createReservationHold({
  id: 'reservation-1',
  creatorId: 'creator-1',
  customerId: 'customer-1',
  offeringId: 'offering-1',
  availabilitySlotId: 'slot-1',
  resultAccessToken: 'reservation-result-1',
  heldAt: '2026-08-17T10:00:00.000Z',
  holdExpiresAt: '2026-08-17T10:15:00.000Z',
});

describe('Reservation domain', () => {
  it('creates capacity-one bounded availability and an expiring hold', () => {
    expect(
      createAvailabilitySlot({
        id: 'slot-1',
        creatorId: 'creator-1',
        offeringId: 'offering-1',
        startsAt: '2026-08-20T02:00:00.000Z',
        endsAt: '2026-08-20T03:00:00.000Z',
      }),
    ).toMatchObject({ capacity: 1, state: 'available' });
    expect(held.state).toBe('held');
    expect(held.orderId).toBeUndefined();
  });

  it('rejects confirmation at or after the Hold expiry', () => {
    expect(() =>
      confirmReservation(held, {
        confirmedAt: held.holdExpiresAt,
        orderId: 'order-1',
        snapshot: {
          offeringTitle: 'Portrait session',
          offeringDescription: 'One hour portrait session.',
          serviceTerms: 'Attend the confirmed session.',
          slotStartsAt: '2026-08-20T02:00:00.000Z',
          slotEndsAt: '2026-08-20T03:00:00.000Z',
        },
      }),
    ).toThrow('confirm expired hold');
  });

  it('keeps cancellation and reschedule as Reservation facts', () => {
    const confirmed = confirmReservation(held, {
      confirmedAt: '2026-08-17T10:05:00.000Z',
      orderId: 'order-1',
      snapshot: {
        offeringTitle: 'Portrait session',
        offeringDescription: 'One hour portrait session.',
        serviceTerms: 'Attend the confirmed session.',
        slotStartsAt: '2026-08-20T02:00:00.000Z',
        slotEndsAt: '2026-08-20T03:00:00.000Z',
      },
    });
    expect(
      rescheduleReservation(confirmed, {
        availabilitySlotId: 'slot-2',
        rescheduledAt: '2026-08-18T00:00:00.000Z',
        actor: 'creator',
      }).rescheduleHistory,
    ).toHaveLength(1);
    expect(
      cancelReservation(confirmed, {
        cancelledAt: '2026-08-18T00:00:00.000Z',
        cancelledBy: 'customer',
      }),
    ).toMatchObject({ state: 'cancelled', cancelledBy: 'customer' });
    expect(expireReservation(held, held.holdExpiresAt)).toMatchObject({ state: 'expired' });
  });
});
