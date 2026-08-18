ALTER TABLE "service_offerings"
  ADD COLUMN IF NOT EXISTS "appearance" jsonb;
