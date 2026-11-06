-- M6: Fulfillment Code Infrastructure
-- Adds fulfillment code tracking for offline service completion proof

-- 1. Create fulfillment_codes table
CREATE TABLE IF NOT EXISTS "fulfillment_codes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" varchar(11) NOT NULL UNIQUE,
  "action_id" varchar(128) NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "fulfilled_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes for fulfillment_codes
CREATE INDEX IF NOT EXISTS "fulfillment_codes_action_id_idx" ON "fulfillment_codes" ("action_id");
CREATE INDEX IF NOT EXISTS "fulfillment_codes_code_idx" ON "fulfillment_codes" ("code");
CREATE INDEX IF NOT EXISTS "fulfillment_codes_status_idx" ON "fulfillment_codes" ("status");
CREATE INDEX IF NOT EXISTS "fulfillment_codes_expires_at_idx" ON "fulfillment_codes" ("expires_at");

-- 2. Add fulfillment tracking columns to commerce_actions
ALTER TABLE "commerce_actions"
ADD COLUMN IF NOT EXISTS "fulfillment_code_id" uuid,
ADD COLUMN IF NOT EXISTS "fulfillment_status" varchar(20),
ADD COLUMN IF NOT EXISTS "fulfillment_confirmed_at" timestamp with time zone;

-- Create index for fulfillment lookups
CREATE INDEX IF NOT EXISTS "commerce_actions_fulfillment_status_idx" ON "commerce_actions" ("fulfillment_status");

-- Add foreign key constraint
ALTER TABLE "fulfillment_codes"
ADD CONSTRAINT IF NOT EXISTS "fulfillment_codes_action_id_fk"
FOREIGN KEY ("action_id") REFERENCES "commerce_actions" ("id") ON DELETE CASCADE;

-- Add foreign key constraint for fulfillment_code_id
ALTER TABLE "commerce_actions"
ADD CONSTRAINT IF NOT EXISTS "commerce_actions_fulfillment_code_id_fk"
FOREIGN KEY ("fulfillment_code_id") REFERENCES "fulfillment_codes" ("id") ON DELETE SET NULL;

-- 3. Create unique index to enforce one fulfillment code per action
CREATE UNIQUE INDEX IF NOT EXISTS "fulfillment_codes_action_id_unique_idx" ON "fulfillment_codes" ("action_id");
