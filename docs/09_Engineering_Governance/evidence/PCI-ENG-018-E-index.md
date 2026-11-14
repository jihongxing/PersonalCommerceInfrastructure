# PCI-ENG-018-E — Offering & Customer Request Flow Visibility

Status: **COMPLETED — AWAITING MAIN CONTROLLER ACCEPTANCE**.
This is an internal read-only delivery. It does not authorize Catalog Controls or other writes.

## Repository baseline

- Branch: `codex/pci-eng-015-b-r2-persistence-closure`.
- HEAD: `f447bd72e2336f06da1e14fd6a658598c47d8cf1`.
- Parent: `8bbdd394c17c3d21e1ba8b130f9cc07ce3b767d0`.
- HEAD subject: `feat: complete catalog and audit read-only admin`.
- The accepted 018-B and 018-C commits are preserved. This unit creates no commit and performs no push.
- On continuation, the worktree contained the reported in-progress 018-E files; the final worktree intentionally retains the complete uncommitted unit. The index remains empty.

## Source inspection and delivered scope

The existing Creator routes in `adapters/transport/http/service-offering-routes.ts` and
`customer-request-routes.ts` serve Creator/public workflows. They do not provide a platform-wide
Human Operations read surface. Existing Catalog/Audit endpoints and screens from 018-C are reused.

`modules/service-offering/offering.ts` defines `draft`, `published`, `unpublished`, `archived`.
`modules/customer-request/commerce-action.ts` defines `draft`, `submitted`, `confirmed`, `declined`.
`modules/commerce-decision/commerce-decision.ts` establishes that Confirm/Decline are decisions by
the owning Creator. None of those Domain models or write paths changed.

The application `applications/operations-admin/operations-flow-read-service.ts` reads existing
repositories. PostgreSQL sources are `service_offerings`, `distribution_assets`, `commerce_actions`,
`commerce_identities`, and `creator_capabilities`. Customer identity is the stored `customer_id`;
the application does not need access to the Customer contact table.

| Surface         | Actual GET path                          | Result                                                                                                                                                  |
| --------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Offering list   | `/api/v1/operations/admin/offerings`     | `page`, `pageSize` (maximum 100), `q`, `state`; stable ID order; authoritative total                                                                    |
| Offering detail | `/api/v1/operations/admin/offerings/:id` | Creator, Capability and Catalog identifiers, optional Template, persisted state, optional real Distribution record, existing creation/update timestamps |
| Request list    | `/api/v1/operations/admin/requests`      | Same pagination/search inputs; actual Request state; Customer/Creator/Offering identifiers                                                              |
| Request detail  | `/api/v1/operations/admin/requests/:id`  | Persisted Creator decision, real associations and timestamps; unavailable associations remain explicit                                                  |

The route module is `adapters/transport/http/operations-flow-read-routes.ts`; DTO schemas are in
`contracts/api/v1/operations-flow-contracts.ts`. `create-api-server.ts` registers the routes and
`apps/api/src/main.ts` explicitly passes the PostgreSQL read service from its composition.
This prevents the real API startup from falling back to the server factory's in-memory default.

The Admin BFF forwards only GET requests through the existing `operations-read-proxy.ts` with the
server-read opaque cookie as a Bearer credential. It forwards no browser-supplied identity or
permission header. Actual pages are `/offerings` and `/requests`; details appear inline and are
shareable through `?id=...`. A Request detail links to its Offering; that Offering resolves
Capability-to-Catalog links using actual `catalog_item_id` values. Catalog links open the existing
Catalog area, rather than implying a new Capability-management screen.

The two panels provide loading, empty, network/server error, distinct 401/403, missing-record,
filter and pagination states. Filters, page and selected ID are retained in the URL. Superseded
fetches are aborted to avoid stale results. Timestamps use explicit UTC display.

## Permission and data boundaries

The closed server policy allows exactly `catalog:read`, `audit:read`, `offering:read`, `request:read`.
The authentication store identifies the existing 0041 initial administrator from both controlled
`new_subject` activation-history records and the initializer's `first-principal-<md5>` /
`first-account-<md5>` audit references. Login and Session revalidation grant the fixed set only
when that server-owned provenance is present. Other or unproven accounts receive no admin grants.
This uses already-readable history columns; it adds no database ACL or permission-management API.
Bootstrap is not rerun on existing accounts and no Credential is overwritten.

Every flow GET resolves the Human Operations Session and calls `requireOperationsHumanPermission`
for its specific permission. Unauthenticated/non-Human identities return 401; authenticated callers
without the specific permission return 403. Unknown permission strings default to denial. Catalog
and Audit access do not imply either new permission. All flow responses have `Cache-Control: no-store`.

DTOs explicitly omit Password Verifier, Session credential/digest, result access token and Customer
contacts. Request `request_message` is unrestricted free text (existing maximum 2,000 characters)
and can contain contact details. This delivery withholds the original text from both list and detail,
returns `requestContentVisibility = withheld`, and explains that choice in the UI. It does not attempt
unreliable automatic PII redaction or grant general access to arbitrary text.

Only persisted `confirmed`/`declined` states yield those Creator decisions; other states yield
`not_recorded`. There is no inferred delivery, viewing, timeout, publication timestamp, or decision
timestamp. Creation/update timestamps are ordinary database metadata. Orphaned/inconsistent
Request associations remain visible with `offering = null`; the service does not guess matches.
Capability metadata is resolved only when its stored Creator matches the Offering Creator.

## Final verification and raw evidence

| Check                                             | Final result                | Raw evidence                                                                 |
| ------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------- |
| Backend/API/application and Domain regressions    | 78/78 PASS, 6 files, exit 0 | `PCI-ENG-018-E-checks-1794681357716.json`                                    |
| Admin components/BFF                              | 37/37 PASS, 3 files, exit 0 | Same ledger                                                                  |
| Active production TypeScript                      | PASS, exit 0                | Same ledger, `typecheck:active`                                              |
| Active backend test and Admin test TypeScript     | PASS, exit 0                | Same ledger                                                                  |
| Changed backend ESLint / Admin ESLint             | PASS, exit 0                | Same ledger; initial backend lint failure and successful correction retained |
| Changed-code Prettier                             | PASS, exit 0                | Same ledger                                                                  |
| Backend build / Admin Next build                  | PASS, exit 0                | Same ledger                                                                  |
| Real browser process                              | PASS, exit 0                | `PCI-ENG-018-E-browser-process-1794681586958.json`                           |
| Browser commands, checks, stdout/stderr           | PASS                        | `PCI-ENG-018-E-browser-1794681665150.json`                                   |
| PostgreSQL environment, wrappers, ACL and cleanup | Retained                    | `PCI-ENG-018-E-pci-018e-87086d61c2-postgres.json`                            |

The ledger preserves exact commands, stdout/stderr and actual child-process exit codes. The earlier
raw Vitest JSON is retained as `PCI-ENG-018-E-focused-tests-initial.json`; it is an earlier run, not
the final 78-test run. The initial successful browser/PostgreSQL pair ending in `1794679076829`
and `2b75fab303` is also preserved as historical evidence, rather than substituted for final evidence.

Final backend tests comprise:

- `tests/integration/operations-flow-admin-read-api.test.ts` — actual read service behind HTTP:
  authentication, separate permissions, legacy service/platform rejection, header spoofing,
  pagination, filters, 404/errors, all existing states, real associations, PII omission, GET-only.
- `tests/integration/operations-human-authentication-api.test.ts`.
- `tests/integration/service-policy-admin-read-api.test.ts` — existing Catalog/Audit regression.
- `tests/operations/operations-human-authentication.test.ts` — eligibility and initial-admin policy,
  including false/absent provenance, unknown permissions and non-Human actors.
- `modules/service-offering/offering.test.ts`.
- `modules/customer-request/commerce-action.test.ts`.

Admin tests comprise `components/admin-shell.test.tsx`, `components/flow-read-panels.test.tsx`,
and `lib/operations-auth-proxy.test.tsx` under `apps/admin-web`. The flow panel tests also verify
distinct error states, retry, filters/pagination, linked detail navigation and absence of mutation controls.

The real gstack `/browse` run uses Next → BFF → Fastify → Human Operations Session → PostgreSQL.
It covers Login → Catalog → Offering list/detail → Request list/detail → persisted submitted,
confirmed and declined decisions → Offering/Capability association → Audit → Logout. Browser
identity-header spoofing is ineffective. Logout 503/network failures retain the Session and offer retry;
confirmed logout revokes it, clears the cookie and rejects the old credential with 401.

The disposable fixture has one Offering, one Distribution Asset and three Requests. Read-before/read-after
counts and row hashes are identical. The test setup seeds the three existing states; it does not
perform Confirm/Decline through an Operations API. Browser traffic reaches the real API; only the
logout transport failure scenarios use the external test proxy to inject faults.

## PostgreSQL provenance

- Image: `docker.m.daocloud.io/library/postgres:17.10-alpine`.
- Digest: `sha256:af194ccf3e2d7fe367012c7b88ce8b816c5c889b18a5b316799a1f0d7eac746a`.
- Actual server: PostgreSQL `17.10`, `server_version_num = 170010`.
- Podman Client / Server: `5.7.1` / `5.7.1`.
- Container: `fc1743ab05030665fe98edde065a827e3fa674c6fdd627ffe30c55d6a52b59ec`.
- Bind: `127.0.0.1:39299`; database: `pci_ops_migration_fixture_admin_1`.
- Storage: disposable 1 GiB tmpfs; image volumes ignored.
- Existing Operations migrations 0036–0041 run through the existing controlled wrapper; six Journal
  rows are retained. Existing commerce migrations are loaded into the disposable fixture only.
- Effective fixture Runtime SELECT is true on the five flow source tables and false on `customers`;
  INSERT/UPDATE/DELETE is false on all six inspected flow/contact tables.
- `podman rm --force --volumes pci-018e-87086d61c2`: exit 0. Final container query: exit 0, empty stdout.
- Next process cleanup and container cleanup are recorded in the browser/PostgreSQL artifacts.
  The final run's temporary migration copies were also removed after verifying their exact path
  under the OS temporary directory; the cleanup process exits 0 in the verification ledger.

## Remaining limitations

- Pagination currently operates on repository collections in the application; this internal slice
  does not claim large-scale SQL paging, a platform analytics service, or a cross-query transaction snapshot.
- Initial-admin permission provenance is tied to the accepted 0041 activation-history references.
  A future lifecycle change that replaces those references will fail closed and needs an explicit policy
  update; future accounts are not automatically granted this permission set.
- No independent publication/Confirm/Decline time fields exist in the current read model. Request
  free-text access would require a separately approved field-visibility policy.
- No full-suite, full-lint, full opt-in persistence regression or fresh whole-repository migration was
  rerun. The historical `1253 PASS / 2 FAIL / 1 collection failure / 218 pending-skipped` and `459`
  full-lint errors remain **UNCLASSIFIED / NOT PROVEN PRE-EXISTING**.
- A prior continuation reported a controlled-migration `ETIMEDOUT` before browser execution; its
  failed raw artifact was not retained. It is not counted as a PASS. The final full execution above
  has retained command, process, browser, database and cleanup evidence.
- Fixture grants do not change a shared/production database. Production operations authentication
  remains gated by the existing MFA/security requirements. This is not production security certification.

No Schema, Migration, Snapshot, Journal, database role/production ACL, Creator Auth, Creator
decision or commerce write-path change is included. Session/Credential architecture, Bootstrap
implementation, MFA, general RBAC, BFF authentication design and production authorization are unchanged.

```ini
PCI-ENG-018-E = OFFERING & CUSTOMER REQUEST FLOW VISIBILITY COMPLETED — AWAITING MAIN CONTROLLER ACCEPTANCE
PROJECT_CONTROL_MODE = CONTROLLED_RECOVERY
FORMAL_RESUME_GATE = NOT_FULLY_CLOSED
VS-01 = FROZEN
STAGE_2 = BOUNDED_APPROVED_CHANGE_UNITS_ONLY
FULL_STAGE_2 = NOT AUTHORIZED
STAGE_3 = NOT AUTHORIZED
EXTERNAL_PILOT = NOT AUTHORIZED
PRODUCTION = NOT AUTHORIZED
REAL_MONEY_ENABLED = false
```

## Complete changed-file manifest

43 files; 23 tracked modifications and 20 new files. Nothing is staged.

```text
adapters/in-memory/creator-identity-composition.ts
adapters/in-memory/in-memory-commerce-action-repository.ts
adapters/in-memory/in-memory-entity-collection-repository.ts
adapters/persistence/postgres/postgres-creator-identity-composition.ts
adapters/persistence/postgres/postgres-creator-identity-repositories.ts
adapters/persistence/postgres/postgres-operations-human-authentication-store.ts
adapters/transport/http/operations-flow-read-routes.ts
applications/operations-admin/operations-flow-read-service.ts
applications/operations-identity/operations-human-authentication.ts
apps/admin-web/app/[section]/page.tsx
apps/admin-web/app/api/operations/offerings/[id]/route.ts
apps/admin-web/app/api/operations/offerings/route.ts
apps/admin-web/app/api/operations/requests/[id]/route.ts
apps/admin-web/app/api/operations/requests/route.ts
apps/admin-web/app/page.tsx
apps/admin-web/components/admin-shell.test.tsx
apps/admin-web/components/admin-shell.tsx
apps/admin-web/components/flow-read-panels.test.tsx
apps/admin-web/components/offering-read-panel.tsx
apps/admin-web/components/request-read-panel.tsx
apps/admin-web/lib/operations-auth-proxy.test.tsx
apps/admin-web/lib/sections.ts
apps/admin-web/lib/use-operations-flow-read.ts
apps/api/src/create-api-server.ts
apps/api/src/main.ts
contracts/api/v1/operations-flow-contracts.ts
contracts/api/v1/operations-human-authentication-contracts.ts
docs/08_Execution/21_Prototype_Execution.md
docs/09_Engineering_Governance/127_Admin_Web_Completion_Roadmap.md
docs/09_Engineering_Governance/evidence/PCI-ENG-018-E-browser-1794679076829.json
docs/09_Engineering_Governance/evidence/PCI-ENG-018-E-browser-1794681665150.json
docs/09_Engineering_Governance/evidence/PCI-ENG-018-E-browser-process-1794681586958.json
docs/09_Engineering_Governance/evidence/PCI-ENG-018-E-checks-1794681357716.json
docs/09_Engineering_Governance/evidence/PCI-ENG-018-E-focused-tests-initial.json
docs/09_Engineering_Governance/evidence/PCI-ENG-018-E-index.md
docs/09_Engineering_Governance/evidence/PCI-ENG-018-E-pci-018e-2b75fab303-postgres.json
docs/09_Engineering_Governance/evidence/PCI-ENG-018-E-pci-018e-87086d61c2-postgres.json
scripts/test/operations-admin-fixture.ts
scripts/test/verify-operations-admin-browser.ts
tests/integration/operations-flow-admin-read-api.test.ts
tests/integration/operations-human-authentication-api.test.ts
tests/integration/operations-human-authentication-postgres.integration.test.ts
tests/operations/operations-human-authentication.test.ts
```
