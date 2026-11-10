ALTER TABLE "creator_capabilities"
  ADD COLUMN IF NOT EXISTS "catalog_item_id" varchar(128),
  ADD COLUMN IF NOT EXISTS "catalog_status" varchar(32) NOT NULL DEFAULT 'custom_request',
  ADD COLUMN IF NOT EXISTS "policy_version" varchar(32);

UPDATE "creator_capabilities"
SET "catalog_item_id" = 'capability-dance-teaching',
    "catalog_status" = 'active',
    "policy_version" = 'v1'
WHERE lower(trim("name")) IN ('private dance lesson', 'dance lesson', '舞蹈私教');

ALTER TABLE "service_offerings"
  ADD COLUMN IF NOT EXISTS "template_id" varchar(128),
  ADD COLUMN IF NOT EXISTS "policy_status" varchar(32) NOT NULL DEFAULT 'not_checked',
  ADD COLUMN IF NOT EXISTS "policy_reason" varchar(1000),
  ADD COLUMN IF NOT EXISTS "policy_version" varchar(32);

UPDATE "service_offerings"
SET "template_id" = 'template-dance-private-lesson'
WHERE "template_id" IS NULL
  AND lower(trim("title")) IN ('private dance lesson', 'dance lesson', '1 对 1 舞蹈私教');

UPDATE "service_offerings"
SET "policy_status" = 'not_checked',
    "policy_reason" = '历史服务需要按新的能力目录和服务模板重新检查。',
    "policy_version" = 'v1'
WHERE "policy_status" IS NULL OR "policy_status" = 'not_checked';
