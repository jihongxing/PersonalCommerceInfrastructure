export const canonicalEventNames = [
  'creator_registered',
  'creator_qualified',
  'creator_activated',
  'creator_published',
  'creator_distributed',
  'storefront_viewed',
  'commerce_action_submitted',
  'commerce_confirmed',
  'commerce_declined',
  'external_paid_verified',
  'fulfillment_observed',
  'order_created',
  'payment_attempted',
  'payment_confirmed',
  'payment_failed',
  'fulfillment_recorded',
  'settlement_calculated',
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
] as const;

export type CanonicalEventName = (typeof canonicalEventNames)[number];

export interface CanonicalEvent {
  readonly id: string;
  readonly name: CanonicalEventName;
  readonly occurredAt: string;
  readonly actorId: string;
  readonly objectId: string;
  readonly correlationId: string;
  readonly source: 'system' | 'creator' | 'customer' | 'pilot_operations';
  readonly payload: Readonly<Record<string, unknown>>;
}

const canonicalEventRegistry = new Set<string>(canonicalEventNames);

export function isCanonicalEventName(value: string): value is CanonicalEventName {
  return canonicalEventRegistry.has(value);
}

export function createCanonicalEvent(
  event: Omit<CanonicalEvent, 'payload'> & {
    readonly payload?: Readonly<Record<string, unknown>>;
  },
): CanonicalEvent {
  if (!isCanonicalEventName(event.name)) {
    throw new Error(`Unregistered canonical event: ${String(event.name)}`);
  }

  return Object.freeze({
    ...event,
    payload: Object.freeze({ ...event.payload }),
  });
}
