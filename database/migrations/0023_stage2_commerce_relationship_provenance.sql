ALTER TABLE "commerce_relationships"
  ADD COLUMN "provenance" varchar(32) NOT NULL DEFAULT 'UNKNOWN';
--> statement-breakpoint
ALTER TABLE "commerce_relationships"
  ADD CONSTRAINT "commerce_relationships_provenance_check"
  CHECK ("provenance" IN ('SELF_DECLARED', 'PLATFORM_VERIFIED', 'UNKNOWN'));
