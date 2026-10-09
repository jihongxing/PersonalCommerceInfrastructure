CREATE UNIQUE INDEX "commerce_relationships_one_proposed_target_unique"
  ON "commerce_relationships" ("external_platform_account_id", "commerce_profile_id")
  WHERE "lifecycle" = 'PROPOSED' AND "provenance" = 'SELF_DECLARED';
