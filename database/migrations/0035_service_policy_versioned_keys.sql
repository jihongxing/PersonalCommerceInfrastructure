ALTER TABLE "service_policy_capabilities"
  DROP CONSTRAINT IF EXISTS "service_policy_capabilities_pkey";
ALTER TABLE "service_policy_capabilities"
  ADD CONSTRAINT "service_policy_capabilities_pkey" PRIMARY KEY ("id", "policy_version");
ALTER TABLE "service_policy_templates"
  DROP CONSTRAINT IF EXISTS "service_policy_templates_pkey";
ALTER TABLE "service_policy_templates"
  ADD CONSTRAINT "service_policy_templates_pkey" PRIMARY KEY ("id", "policy_version");
