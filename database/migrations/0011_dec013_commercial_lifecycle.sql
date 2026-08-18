ALTER TABLE "product_events"
  DROP CONSTRAINT IF EXISTS "product_events_name_check";
--> statement-breakpoint
ALTER TABLE "product_events"
  ADD CONSTRAINT "product_events_name_check"
  CHECK (
    "name" IN (
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
      'pending_resolution_resolved'
    )
  );
