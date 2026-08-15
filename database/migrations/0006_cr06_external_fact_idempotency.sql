CREATE UNIQUE INDEX IF NOT EXISTS "product_events_external_fact_unique"
  ON "product_events" ("name", "object_id")
  WHERE "name" IN ('external_paid_verified', 'fulfillment_observed');
