-- Canonical Reservation facts: 'reservation_held', 'reservation_confirmed',
-- 'reservation_expired', 'reservation_cancelled', 'reservation_rescheduled'.
ALTER TABLE "paid_service_orders"
  ALTER COLUMN "commerce_action_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "paid_service_orders"
  ADD COLUMN "reservation_id" varchar(128);
--> statement-breakpoint
CREATE UNIQUE INDEX "paid_service_orders_reservation_unique"
  ON "paid_service_orders" USING btree ("reservation_id");
--> statement-breakpoint
ALTER TABLE "paid_service_orders"
  ADD CONSTRAINT "paid_service_orders_single_source_check"
  CHECK (
    ("commerce_action_id" IS NOT NULL AND "reservation_id" IS NULL)
    OR ("commerce_action_id" IS NULL AND "reservation_id" IS NOT NULL)
  );
--> statement-breakpoint
CREATE TABLE "availability_slots" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "creator_id" varchar(128) NOT NULL,
  "offering_id" varchar(128) NOT NULL,
  "starts_at" timestamp with time zone NOT NULL,
  "ends_at" timestamp with time zone NOT NULL,
  "capacity" bigint DEFAULT 1 NOT NULL,
  "state" varchar(32) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "availability_slots_valid_time_check" CHECK ("ends_at" > "starts_at"),
  CONSTRAINT "availability_slots_capacity_one_check" CHECK ("capacity" = 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "availability_slots_creator_offering_time_unique"
  ON "availability_slots" USING btree ("creator_id","offering_id","starts_at","ends_at");
--> statement-breakpoint
CREATE INDEX "availability_slots_offering_start_idx"
  ON "availability_slots" USING btree ("offering_id","starts_at");
--> statement-breakpoint
CREATE TABLE "reservations" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "creator_id" varchar(128) NOT NULL,
  "customer_id" varchar(128) NOT NULL,
  "offering_id" varchar(128) NOT NULL,
  "availability_slot_id" varchar(128) NOT NULL,
  "result_access_token" varchar(128) NOT NULL,
  "state" varchar(32) NOT NULL,
  "held_at" timestamp with time zone NOT NULL,
  "hold_expires_at" timestamp with time zone NOT NULL,
  "confirmed_at" timestamp with time zone,
  "cancelled_at" timestamp with time zone,
  "cancelled_by" varchar(32),
  "rescheduled_at" timestamp with time zone,
  "order_id" varchar(128),
  "snapshot" jsonb,
  "reschedule_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "reservations_hold_ttl_check" CHECK ("hold_expires_at" > "held_at")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "reservations_result_access_token_unique"
  ON "reservations" USING btree ("result_access_token");
--> statement-breakpoint
CREATE UNIQUE INDEX "reservations_order_unique"
  ON "reservations" USING btree ("order_id");
--> statement-breakpoint
CREATE INDEX "reservations_creator_idx"
  ON "reservations" USING btree ("creator_id","created_at");
--> statement-breakpoint
CREATE INDEX "reservations_slot_state_idx"
  ON "reservations" USING btree ("availability_slot_id","state");
--> statement-breakpoint
CREATE UNIQUE INDEX "reservations_active_slot_unique"
  ON "reservations" ("availability_slot_id")
  WHERE "state" IN ('held', 'confirmed');
