# Capability and Service Catalog Seed

`capability-service-catalog.json` is the versioned initialization and recovery snapshot for the
controlled capability and service-template policy catalog. Runtime policy evaluation reads the
published snapshot through the database repository. Run `pnpm db:seed:service-policy` after the
migrations to import this file idempotently; operational status switches and audit history remain
database-owned and are not reset by a repeat import.

The seed intentionally covers ten safe or reviewable verticals. `releaseScope` controls whether a
template is available in VS-01, an established follow-up scope, or a future scope. A future or
review-risk template may be listed for planning, but cannot be published without the corresponding
product decision and policy approval.
