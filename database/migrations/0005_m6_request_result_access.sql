ALTER TABLE "commerce_actions"
  ADD COLUMN IF NOT EXISTS "result_access_token" varchar(128);

UPDATE "commerce_actions"
  SET "result_access_token" = "id"
  WHERE "result_access_token" IS NULL;

ALTER TABLE "commerce_actions"
  ALTER COLUMN "result_access_token" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "commerce_actions_result_access_token_idx"
  ON "commerce_actions" ("result_access_token");
