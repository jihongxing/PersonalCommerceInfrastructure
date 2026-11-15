# PCI-ENG-019-A Evidence Index

Status: `PCI-ENG-019-A = IMPLEMENTED — AWAITING MAIN CONTROLLER ACCEPTANCE`

This index records the bounded, read-only Operations Exception Discovery delivery. It uses
existing Catalog, Offering, Customer Request and Operations Audit evidence. It adds no exception
storage, scheduler, worker, notification, assignment, resolution, SLA or automated disposition.

## Rule Definitions

| Rule ID                                   | Classification   | Source                      | Required evidence and condition                                                                                                                                                                     |
| ----------------------------------------- | ---------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUDIT_OPERATION_FAILURE`                 | `confirmed_fact` | Operations Audit            | An immutable Audit action is `activation_failed` or `draft_update_failed`; evidence includes the Audit identity, action, entity, actor, reason, policy version, occurrence time and correlation ID. |
| `AUDIT_UNKNOWN_ACTOR`                     | `needs_review`   | Operations Audit            | Existing actor classification resolves to `unknown`; evidence includes the Audit identity, actor, entity, action, occurrence time and correlation ID. This does not claim unauthorized activity.    |
| `PUBLISHED_OFFERING_WITHOUT_DISTRIBUTION` | `needs_review`   | Offering                    | Persisted Offering state is `published` and no Distribution Asset exists; age, publication alone, outage, customer impact and SLA are excluded.                                                     |
| `REQUEST_OFFERING_UNRESOLVED`             | `needs_review`   | Customer Request + Offering | Request `offeringId` has no Offering owned by the recorded Creator; fraud, abandonment and customer harm are excluded. The rule is exposed only when both source read permissions are present.      |

Normal states and insufficient evidence are not emitted as exception signals. Rule metadata is
returned with each authorized query so the UI can show the condition, evidence fields, business
relationship and false-positive exclusions.

## Implementation Evidence

- Rule definitions: `applications/operations-admin/operations-exceptions.ts`.
- Read port and authorization: `applications/operations-admin/operations-query-repository.ts` and
  `applications/operations-admin/operations-workspace-read-service.ts`.
- PostgreSQL repeatable-read, server-side UNION/pagination and safe evidence projection:
  `adapters/persistence/postgres/postgres-operations-query-repository.ts`.
- HTTP route and response contract:
  `adapters/transport/http/operations-workspace-read-routes.ts` and
  `contracts/api/v1/operations-workspace-contracts.ts`.
- Same-origin BFF and read-only Admin Web page:
  `apps/admin-web/app/api/operations/exceptions/route.ts`,
  `apps/admin-web/app/admin/exceptions/page.tsx`, and
  `apps/admin-web/components/operations-exceptions-inbox.tsx`.

## Verification

- PostgreSQL 17.10 Disposable Podman fixture: `PCI-ENG-019-A-pci-019a-77a62ef002-postgres.json`.
  The integration test passed `11/11`; the JSON records the four rule definitions, 38 explicit
  fixture signals, safe evidence fields, query parameters and container cleanup. It contains no
  credentials or private request content.
- Real Browser + Next.js + same-origin BFF + Fastify + Operations Session + PostgreSQL:
  `PCI-ENG-019-A-browser-1794775496907.json`; its browser PostgreSQL provenance is
  `PCI-ENG-019-A-pci-019a-e2c62e00db-postgres.json`. The Browser process exit code is `0`, 35
  checks passed, API error logs are empty, and the exception page returned HTTP `200` with four
  rules and two real Audit signals (one `confirmed_fact`, one `needs_review`) from the disposable
  fixture.
- Admin Web regression: `49/49 PASS`; Admin Web production build: `PASS`.
- Changed-file TypeScript, ESLint and Prettier: `PASS`; `git diff --check`: `PASS`.

The Browser fixture exercises real login, Session-backed authorization, Overview, cross-module
search, the Exception Inbox, Catalog policy read/write regression coverage, Flow read surfaces,
logout failure retention, confirmed revocation and post-logout protection. It does not use a
production or business database.

## Boundaries and Open Items

- The Inbox is read-only and has no assignment, notes, resolution, close, penalty, SLA,
  notification or legal/commercial responsibility inference.
- Existing `catalog:read`, `audit:read`, `offering:read` and `request:read` permissions remain
  unchanged. Each rule requires the source module permissions; the unresolved Request rule
  requires both Request and Offering reads.
- No Schema, Migration, exception table, scheduler, worker, notification, Catalog/Offering/
  Request/Audit workflow, Identity, Credential or Session model was changed.
- Existing full-repository quality findings remain outside this bounded unit and are not claimed
  as resolved. This delivery is not production-ready, an external-pilot approval or a full-stage
  authorization.
