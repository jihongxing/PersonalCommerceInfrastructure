import { describe, expect, it } from 'vitest';

import {
  canonicalEventNames,
  createCanonicalEvent,
  isCanonicalEventName,
} from './canonical-events.js';

describe('Canonical Event Registry', () => {
  it('contains the frozen VS-01 product facts', () => {
    expect(canonicalEventNames).toEqual([
      'creator_registered',
      'creator_qualified',
      'creator_activated',
      'creator_published',
      'creator_distributed',
      'storefront_viewed',
      'commerce_action_submitted',
      'commerce_confirmed',
      'commerce_declined',
      'reservation_held',
      'reservation_confirmed',
      'reservation_expired',
      'reservation_cancelled',
      'reservation_rescheduled',
      'contract_proposed',
      'contract_accepted',
      'contract_rejected',
      'contract_expired',
      'contract_formed',
      'contract_cancelled',
      'external_paid_verified',
      'fulfillment_observed',
      'order_created',
      'payment_attempted',
      'payment_confirmed',
      'payment_failed',
      'fulfillment_recorded',
      'settlement_calculated',
      'settlement_failed',
      'settlement_released',
      'ledger_entry_appended',
      'wallet_availability_changed',
      'withdrawal_requested',
      'withdrawal_completed',
      'withdrawal_failed',
      'cancellation_recorded',
      'refund_requested',
      'refund_confirmed',
      'settlement_reversed',
      'pending_resolution_opened',
      'pending_resolution_resolved',
    ]);
  });

  it('rejects unregistered product facts', () => {
    expect(isCanonicalEventName('offering_published')).toBe(false);
  });

  it('creates an immutable registered event', () => {
    const event = createCanonicalEvent({
      id: 'event-1',
      name: 'commerce_action_submitted',
      occurredAt: '2026-08-11T00:00:00.000Z',
      actorId: 'customer-1',
      objectId: 'action-1',
      correlationId: 'correlation-1',
      source: 'customer',
    });

    expect(Object.isFrozen(event)).toBe(true);
    expect(Object.isFrozen(event.payload)).toBe(true);
    expect(event.payload).toEqual({});
  });
});
