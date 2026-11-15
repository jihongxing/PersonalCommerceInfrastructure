# PCI-ENG-018-D-R1 Evidence Index

Status: `BLOCKED - MAIN CONTROLLER REVIEW REQUIRED`

This index closes the evidence work for the bounded PCI-ENG-018-D acceptance
follow-up. It does not change the Catalog domain, database schema, migration,
Session model, authorization model, or legacy compatibility route.

## Git baseline

- Branch: `codex/pci-eng-015-b-r2-persistence-closure`
- HEAD: `99abd6c0b83e7e5eeec38477e88be552cefec76e`
- Parent: `59f958559900ed3ead68ef57b875fcd79346d8dc`
- The existing 018-D worktree was preserved. No reset, clean, checkout,
  commit, or push was performed.
- The actual pre-index status contained 20 modified tracked files and 13
  untracked status entries (the `drafts/` entry expands to six route files),
  rather than the task text's 18/12 count. Every entry was checked as part of
  the 018-D implementation or R1 evidence; the index and login reproduction
  below are the two additional R1 documentation artifacts.

## PostgreSQL evidence

The two previously skipped tests were run against disposable PostgreSQL 17.10
fixtures, using the repository's `OperationsAdminFixture` and the existing
controlled migration wrapper. The test file contains the two required cases:

1. `isolates a draft, enforces revision checks, previews changes, and atomically activates`;
2. `serializes concurrent draft updates and policy activation`.

The successful run reported `2 tests passed`, process exit code `0`. It covered
concurrent draft updates, stale revision rejection, draft-update versus
activation, competing activation, advisory-lock serialization, and the single
published-release invariant. The first disposable attempt failed with SQLSTATE
`23505` because the fixture had not installed the repository's existing
`0035_service_policy_versioned_keys.sql`; this was an environment fixture gap,
not a concurrency assertion result. Migration 0035 was then applied only in the
disposable database and the same test file was run again successfully.

The outer shell transcript for the successful Vitest invocation was not copied
into the JSON fixture record. The retained test identifier is
`tests/integration/service-policy-draft-postgres.integration.test.ts`; the
fixture JSON retains the database wrapper SQL, role/PID records, container
provenance, and cleanup exit codes. No production or shared database was used.

Evidence files:

- `PCI-ENG-018-D-R1-pci-018br1-9ad60e9b32-postgres.json` - successful
  versioned-key fixture and migration provenance.
- `PCI-ENG-018-D-R1-pci-018br1-d70c817ab9-postgres.json` - earlier disposable
  fixture retained for the pre-0035 failure context.
- `PCI-ENG-018-D-R1-pci-018br1-3f977bf03a-postgres.json` and
  `PCI-ENG-018-D-R1-pci-018br1-dfc3784758-postgres.json` - additional
  disposable fixture attempts and cleanup records.

Common provenance captured in the fixture records:

- Image: `docker.m.daocloud.io/library/postgres:17.10-alpine`.
- Digest: `sha256:af194ccf3e2d7fe367012c7b88ce8b816c5c889b18a5b316799a1f0d7eac746a`.
- PostgreSQL: `17.10`.
- Podman Client/Server: `5.7.1`.
- Dynamic ports and container IDs are retained in each JSON record.
- Migration wrapper and `podman rm --force --volumes` both exited `0`; the
  post-cleanup `podman ps --all` query was empty.

## Browser evidence

The real browser chain used the installed gstack Chromium driver:

`E:\Users\jihx\.codex\skills\gstack\browse\dist\browse.exe`

The run used `PCI_RUN_OPERATIONS_ADMIN_D=1` and
`tsx scripts/test/verify-operations-admin-browser.ts`, with a disposable
PostgreSQL fixture and a disposable first Operations Account. The process exited
`1`. The retained evidence is
`PCI-ENG-018-D-browser-1794762064729.json`.

Checks that completed before the failure:

- Anonymous navigation redirected to `/login`.
- Forged identity and permission headers without a Session returned `401`.
- The browser driver was real HeadlessChrome 145, not a mock.
- Next BFF forwarded the login request to the real Fastify API.

The login request reached `POST /api/v1/operations/auth/login` and returned
`500`; the BFF observed the upstream failure and did not establish a Session
cookie. The protected Admin shell, Catalog management path, Audit view, logout,
and post-logout checks therefore did not run. The evidence records container
cleanup with exit code `0` and an empty residue check.

The retained Next process log shows `POST /api/operations/auth/login 503`; the
disposable proxy record shows the upstream API status `500`. Next stderr was
empty, and the proxy/Next processes were cleaned up successfully.

## Login response contract defect

The failure is reproducible without a database by injecting the existing API
route with a runtime result. A read-only permission array returns HTTP `200`;
the first-bootstrap permission array containing
`catalog:draft:create`, `catalog:draft:update`, and
`catalog:policy:activate` returns HTTP `500`.

The code evidence is:

- `applications/operations-identity/operations-human-authentication.ts`:
  the accepted first-admin runtime returns seven permissions.
- `contracts/api/v1/operations-human-authentication-contracts.ts`:
  `OperationsLoginResponseSchema.permissions` accepts only the four read
  permissions.
- `adapters/transport/http/operations-human-authentication-routes.ts`:
  the login result is returned through that response schema.

The structured reproduction is retained in
`PCI-ENG-018-D-R1-login-schema-repro.json`. Its outer process exit code is `0`
(the process completed the probe); the response cases are HTTP `200` for four
read permissions and HTTP `500` for the seven first-admin permissions.

Fastify rejects the response during serialization and the generic API error
handler emits `internal_error` with HTTP `500`. This is an implementation
defect that blocks real Browser E2E. R1 did not modify the contract or runtime
to hide the failure; fixing it requires a separate authorized code change.

## Legacy Static Operations Token audit

`adapters/auth/operations/static-operations-auth-context-provider.ts` resolves
`OPERATIONS_ACCESS_TOKEN` and `OPERATIONS_OPERATOR_ID` to actor kind
`pilot_operations`. `adapters/transport/http/service-policy-routes.ts` still
registers these routes through `authenticateOperations`:

| Method | Route                                                | Legacy operation   | New Catalog permission path |
| ------ | ---------------------------------------------------- | ------------------ | --------------------------- |
| GET    | `/api/v1/operations/service-policy/workspace`        | `getWorkspace`     | none                        |
| GET    | `/api/v1/operations/service-policy/audit`            | `listAudit`        | none                        |
| PATCH  | `/api/v1/operations/service-policy/capabilities/:id` | `updateCapability` | none                        |
| PATCH  | `/api/v1/operations/service-policy/templates/:id`    | `updateTemplate`   | none                        |
| POST   | `/api/v1/operations/service-policy/releases`         | `publishVersion`   | none                        |

These routes do not call the new Draft Application Service and do not check
`catalog:draft:create`, `catalog:draft:update`, or
`catalog:policy:activate`. Existing HTTP coverage in
`tests/integration/service-policy-api.test.ts` and
`tests/integration/controlled-catalog.postgres.test.ts` demonstrates that the
static token can still perform Catalog updates and publish operations. The
Human Operations/Admin BFF path is separate and server-derived. The old path is
therefore classification **C**: it can bypass the new Human Operations
permission boundary. The route and token configuration were not removed or
changed in this evidence-only task. No separate R1 HTTP process transcript for
these legacy routes was retained; the classification is backed by the route
source and the existing HTTP test cases named above.

## Focused quality result

The retained focused checks reported PASS for the changed Domain/Application
tests, Admin Web tests, Operations Authentication tests, production and active
test TypeScript, changed-file ESLint, Prettier, Build, and `git diff --check`.
Full-repository failures and full-lint findings remain historical/unclassified
quality risks; they were not rerun for R1.

## Acceptance conclusion

PostgreSQL concurrency evidence is available and successful. Browser E2E is
not complete because the real Login route returns HTTP 500, and the legacy
Static Operations Token remains a separate Catalog write boundary. Therefore:

`PCI-ENG-018-D-R1 = BLOCKED - MAIN CONTROLLER REVIEW REQUIRED`

No Catalog domain redesign, Schema/Migration change, Session change, RBAC
change, Offering/Request change, Creator Auth change, production operation,
external Pilot, or Real Money operation was performed.
