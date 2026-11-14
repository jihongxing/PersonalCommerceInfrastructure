# PCI-ENG-018-B-R1 — Operations Admin Runtime Blocker Resolution

Current status: `OPERATIONS ADMIN RUNTIME BLOCKERS RESOLVED — AWAITING MAIN CONTROLLER ACCEPTANCE`.
Evidence date: 2026-11-14. This is an internal/disposable validation delivery, not Production Ready.
The original 018-B blocked report is preserved verbatim after this R1 record. Its source line
references describe the earlier review-time code; they are not current-source citations.

## 1. Authority, baseline and scope

Authority is the Founder-approved PCI-ENG-018-B and Main Controller's PCI-ENG-018-B-R1 request.
The latter explicitly permits a minimal additive 0041 if 0040 cannot represent lawful first
activation. It does not authorize general lifecycle Runtime, registration, recovery or RBAC.

At R1 entry and again before documentation closure:

- Branch: `codex/pci-eng-015-b-r2-persistence-closure`.
- HEAD: `70d7f4f35aa0313b244d075eaf4415b8328e75a2`.
- Parent: `0cc6b1e74e6d608138d07132a419d6df5a881cc6`.
- Subject: `feat: add external DBA activation history barrier`.
- Staging empty; inherited 018-B modified/untracked files retained. A clean worktree was not assumed.

The code delivered includes independent Operations Argon2id authentication, login/Session/logout
HTTP routes, the protected Admin shell and BFF, controlled first-account database initialization,
0041 and its wrapper policy, and acceptance tests. It adds no Catalog/Audit business-data page.
The full reviewed file inventory and evidence hashes are in [the evidence index](evidence/PCI-ENG-018-B-R1-index.md).

## 2. Exact 23514 cause and the authorized 0041 decision

The original [blocker JSON](evidence/PCI-ENG-018-B-blocker-evidence.json), item 2 stderr, retains:

```text
ERROR:  23514: Invalid principal audit association
CONTEXT:  PL/pgSQL function operations_private.validate_identity_lifecycle_audit() line 8 at RAISE
LOCATION:  exec_stmt_raise, pl_exec.c:3897
```

`DETAIL` was not present in that retained stderr: `NOT RETAINED`; none is reconstructed.
The trigger is `operations_identity_lifecycle_audit_validate_trigger`, defined in frozen 0040:103.
Its function rejects a Human Principal operation other than `principal_created` or
`legacy_history_initialized` at 0040:82, before the row CHECK can admit the candidate operation.
The CHECK at 0040:33 also lacks first activation. Reordering alone cannot make an explicit lawful
first-activation operation valid: this is R1 category **B**, not merely initialization ordering.

The original probe used the real creation function, then changed Principal pending to active before
inserting candidate `first_activated`; its History was still `never_activated`. The existing creation
audit described pending/never_activated, not active/previously_activated. The candidate INSERT failed
before History/`last_history_audit_id` could advance or COMMIT. The original psql exit was **3**;
a new connection observed zero rows in all seven subject/history/audit/credential/session tables.
The candidate label was a diagnostic probe, never a Founder-approved database operation.

The additive `database/migrations/0041_operations_initial_admin_bootstrap.sql` uses
`principal_first_activated` and `account_first_activated`, with exact status, History and Epoch checks.
0036–0040 remain unchanged. Audit append-only and History immutability/link checks remain enabled.
The schema CHECK, snapshot, journal and wrapper hash/owner phases agree with this addition.
See [130](130_Operations_Initial_Admin_Bootstrap.md) for the authoritative bounded database contract.

## 3. Actual atomic bootstrap and Audit representation

`scripts/database/initialize-first-operations-account.ts:19-53` executes a single `database.begin`;
it verifies `session_user = current_user = pci_ops_migration`, and calls only
`operations_api.initialize_first_admin`. The SQL implementation is 0041:64-137:

1. Validate parameters and trusted `public` schema; acquire a fixed Principal-then-Account
   `SHARE ROW EXCLUSIVE` guard; refuse if either subject table has any existing row.
2. Call the accepted 0040 `create_principal_with_account` path: pending Principal/Epoch 0 and
   invited Account, separate `never_activated` histories and two creation Audits.
3. Activate Principal pending → active; insert `principal_first_activated`; update its History
   never_activated → previously_activated and link its own `last_history_audit_id`. Epoch stays 0.
4. Only then activate Account invited → active; insert `account_first_activated`; update its own
   History and independent Audit link. The Principal must already be active/previously_activated.
5. Insert active Argon2id Credential version 1, verify the resulting identities/links, return and COMMIT.

The persisted Account subject discriminator remains **`operations_account`**, as required by existing 0040. R1's prose `account` is represented by that existing discriminator; it is not a schema rename.
Both activation Audits share bootstrap operation/correlation IDs and have before/after Epoch 0,
required `evidence_ref`/`decision_ref`, correct subject IDs and distinct Audit IDs. Together with
creation there are **four Audits**, one Credential, and **no Session**. No Human Actor is fabricated;
the references identify the controlled DB execution and authorization.

The final PostgreSQL evidence proves ordered creation/activation, both Audit links and
`ALREADY_INITIALIZED` without additional rows. A credential BEFORE INSERT fault (`P0B01`) leaves
all seven table counts zero. Concurrent first initialization produces only one complete identity
pair; it does not silently replace the Credential. This proves the executed schedules, not all
possible PostgreSQL interleavings.

The hidden TTY CLI preserves password whitespace/Unicode, rejects non-TTY input and control
sequences, supports Backspace/DEL, confirms the password and never prints password/verifier.
The minimum is 15 Unicode code points; input is not trimmed/normalized/truncated; the explicit upper
bound is 4096 UTF-16 code units. Hashing is Operations-only Argon2id, separate from Creator LocalAuth.

## 4. Wrapper, owner and Runtime permission closure

`scripts/database/migrate-with-role-context.ts:66-84,280-290` fixes the reviewed 0041 hash and six
owner phases. SQL and Journal INSERT run in one transaction; `SET LOCAL ROLE`/RESET are logged with
the same backend PID. Confirmed success is emitted only after `begin` resolves following COMMIT.
Failure destroys the dedicated connection when required and distinguishes rejected COMMIT from
unknown network outcome; an uncertain outcome requires reconciliation, not an automatic retry.

The final disposable run preserves actual child-process records:

| Case                                         | Process exit | Database result                          |
| -------------------------------------------- | ------------ | ---------------------------------------- |
| Install Operations 0036–0039, then 0040–0041 | 0 / 0        | Journal has six entries                  |
| Repeat complete Operations subset            | 0            | applied 0 / skipped 6; Journal unchanged |
| SQL failure (`P0001`)                        | 1            | marker/child tables absent, Journal 0    |
| Deferred COMMIT constraint failure (`23503`) | 1            | marker/child tables absent, Journal 0    |

Initializer EXECUTE is limited to Migration login; Runtime has neither initializer nor guard EXECUTE
nor Table Owner membership. Runtime receives identity/history reads, row-lock-enabling
`UPDATE(updated_at)`, and named Session INSERT/UPDATE columns. It has no table-wide DML grant,
DELETE/TRUNCATE/MAINTAIN or general lifecycle-write authority. Existing Legacy Owner ownership is
retained. The privileged disposable DBA is used only for role/fixture setup, temporary 0040 MAINTAIN
grant/revoke and controlled fault injection; actual auth/Session work uses `pci_ops_runtime`.

The initializer's fixed search_path includes trusted `public` because the frozen 0037 Credential
INSERT trigger uses unqualified names. Its own relations are schema-qualified, `pg_catalog` is first
and `pg_temp` last; untrusted public CREATE causes a fail-closed refusal. Superusers and database
administrators remain privileged; this is not production security certification.

## 5. Logout and real browser acceptance

API Runtime `applications/operations-identity/operations-human-authentication.ts:109-256` checks
active Principal/Account, previously_activated histories, active Credential, Session version,
Credential snapshot, Security Epoch and 8h idle/24h absolute expiry. Only `catalog:read` and
`audit:read` are assigned server-side. Unknown/write permissions deny; legacy static Operations,
Creator and System identities cannot supply Human Operations identity.

The BFF (`apps/admin-web/lib/operations-auth-proxy.ts:3-87`) requires the configured browser Origin
on mutations, rejects cross-site requests and discards browser Principal/Permission headers.
Only successful logout HTTP 204 clears the cookie. API/network failure or uncertainty yields a
failure and retry; confirmed absent/already-revoked Session is safe to clear. The shell
(`apps/admin-web/components/admin-shell.tsx:10-86`) withholds children pending Session validation,
revalidates after route changes and redirects only after confirmed logout.

The final real browser record is
[browser-1794663410698](evidence/PCI-ENG-018-B-R1-browser-1794663410698.json), with actual outer
process exit **0** in [browser-final-process](evidence/PCI-ENG-018-B-R1-browser-final-process.json).
It runs actual Next.js pages/BFF, Fastify API, real Argon2id and restricted PostgreSQL Runtime.
The small loopback proxy injects logout failures; it does not replace authentication with a mock.

- Anonymous access redirects to `/login` without exposing protected navigation; forged headers get 401.
- Login reaches the protected shell; the host-only `pci_operations_session` cookie is HttpOnly and
  SameSite=Lax. Secure is false only for this HTTP loopback run; HTTPS/non-loopback uses Secure.
- `document.cookie` is empty; LocalStorage/SessionStorage have no credentials. The raw cookie value
  and password input are redacted in retained browser records.
- Both upstream 503 and network-disconnect logout faults keep the UI, cookie and active DB Session,
  visibly report failure and permit retry.
- Successful retry records revoked DB Session, cookie removal, old credential 401 and post-logout redirect.

The browser uses gstack `/browse`, HeadlessChrome 145.0.7632.6. Component/BFF tests are additional
coverage, not a substitute for that actual browser/HTTP/DB flow.

## 6. Final verification and provenance

| Check                                                                   | Final result / source                                                                    |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Operations unit + HTTP contract                                         | 27/27, process 0; `unit-final.json` + `quality-final.json`                               |
| Admin components + BFF                                                  | 21/21, process 0; `admin-final.json`                                                     |
| PostgreSQL acceptance                                                   | 12/12, process 0; `postgres-final.json` + `postgres-final-process.json`                  |
| Real browser E2E                                                        | PASS, process 0; final browser/process JSON above                                        |
| Core/API/backend-test/Admin/Admin-test TypeScript                       | PASS, process 0; quality/admin final JSON                                                |
| Changed backend ESLint + Admin ESLint                                   | PASS, process 0; quality/admin final JSON                                                |
| Changed code Prettier; API build; Admin build/boundary; Migration Check | PASS, process 0; quality/admin final JSON                                                |
| Full suite, no external database                                        | **1253 PASS / 2 FAIL / 218 pending-skipped**, plus one collection failure; process **1** |
| Full lint                                                               | **459 errors / 0 warnings**, process **1**; `full-lint-final.json`                       |

The full-suite assertion failures are the two `tests/governance/import-boundaries.test.ts` cases
for directional imports and forbidden Web Reference Client imports. The collection failure is
`tests/optimization.test.ts`: unresolved `@/lib/auth/session`. No parent comparison was performed:
**UNCLASSIFIED / NOT PROVEN PRE-EXISTING** applies to these failures and full lint. Full suite was
run before the final Shell lint/route-test adjustment; targeted Admin tests were then rerun. The
earlier `quality-final.json` Admin lint failure is superseded by `admin-final.json`, not deleted.

Final PostgreSQL acceptance provenance:

| Field                  | Retained value                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| Image                  | `docker.m.daocloud.io/library/postgres:17.10-alpine`                                                    |
| Image inspect Digest   | `sha256:af194ccf3e2d7fe367012c7b88ce8b816c5c889b18a5b316799a1f0d7eac746a`                               |
| Server                 | PostgreSQL 17.10 / `170010`                                                                             |
| Podman Client / Server | 5.7.1 / 5.7.1                                                                                           |
| Container              | `c6d536300a4ac8fa2a926a89dd4c4255cf0a107d7b3a1794b63c86b133538f07`                                      |
| Bind / storage         | `127.0.0.1:40925`; tmpfs 1 GiB, image volumes ignored                                                   |
| Database               | `pci_ops_migration_fixture_admin_1`; separate legacy-unknown fixture `_admin_2`                         |
| Runtime identity / PID | session_user=current_user=`pci_ops_runtime`, PID 66                                                     |
| Migration scope        | Actual committed Operations SQL 0036–0041 through restricted wrapper; Journal six entries               |
| Cleanup                | `podman rm --force --volumes pci-018br1-2e18ebc6a8`, exit 0; exact-name `podman ps --all` empty, exit 0 |

Full structured SQL, stdout/stderr, identity/PID, Journal and ACL records are in
[pci-018br1-2e18ebc6a8](evidence/PCI-ENG-018-B-R1-pci-018br1-2e18ebc6a8.json).
The final rerun explicitly preserved the outer process exit code; the earlier 12/12 reporter
`postgres-attempt-07.json` is retained as an earlier passing execution, not substituted for it.
The browser has its own independent container `e824bc3a54bd920b3504e89f2d93e88789656c14e667b903838f65b93d8edc5f`,
loopback port 41039, same image/server versions, recorded destruction and empty residual query.
Browser Next process-tree cleanup also exited 0. Earlier failed attempts remain in the evidence index.

## 7. Limits and acceptance handoff

No real/shared database or real Operations account was initialized. The fixture executes the
Operations 0036–0041 subset; it does **not** prove a fresh install of all migrations 0000–0041.
The full opt-in persistence/regression matrix was not rerun. Existing full-suite/lint failures
remain open and are disclosed above. Frozen Creator Auth, 0036–0040, lifecycle decisions, closed
017-E1 scenario, MFA/RBAC/recovery and all business write authority remain unchanged.

Production API does not register this Human Operations Runtime until an independently accepted MFA
implementation is available (`apps/api/src/main.ts:134-140`). There is no bypass flag. Runtime/Migration
connections in the fixture are separate; deployment role provisioning and production configuration
are not certified by this task. Catalog/Audit data reading remains the separately authorized 018-C.

```ini
PCI-ENG-018-B-R1 = OPERATIONS ADMIN RUNTIME BLOCKERS RESOLVED — AWAITING MAIN CONTROLLER ACCEPTANCE
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

Commit closure records the complete reviewed 018-B/R1 unit on the current branch with no push.
The resulting SHA, parent, file list, whitespace check and clean-worktree proof are returned to
Main Controller in the final handoff; this report does not claim Main Controller acceptance.

Byte preservation: 0041, the original evidence and the historical report suffix retain their tested
CRLF bytes. Default `git diff --cached --check` exits 2 for those carriage returns. The command-local
`git -c core.whitespace=blank-at-eol,blank-at-eof,space-before-tab,cr-at-eol diff --cached --check`
exits 0, while retaining checks for actual trailing spaces and EOF whitespace. `git diff --check`
exits 0. No repository or global Git configuration is changed; SQL and all 33 original JSON hashes
were verified against the staged blobs.

---

## Historical original 018-B blocked report (verbatim)

# PCI-ENG-018-B — Operations Admin Runtime Completion Report

Status: `BLOCKED — MAIN CONTROLLER REVIEW REQUIRED`

## Current pre-commit review outcome

This finding supersedes the implementation-complete claims below and in the earlier 018-B
execution/roadmap entries. The partial implementation remains uncommitted. It must not be used to
initialize a real account or treated as accepted. No implementation fix, commit or push was made
during this closing review.

The observed branch is `codex/pci-eng-015-b-r2-persistence-closure`, HEAD
`70d7f4f35aa0313b244d075eaf4415b8328e75a2`, parent
`0cc6b1e74e6d608138d07132a419d6df5a881cc6`. Staging is empty; the inherited 018-B
implementation and roadmap are retained. The worktree is deliberately not clean.

### Blocking initialization contract

| Evidence                                                                          | Finding and consequence                                                                                                                                                                                                                                |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `scripts/database/initialize-first-operations-account.ts:43-79`                   | Inserts active Principal/Account and previously_activated histories directly. It never executes pending/invited + never_activated followed by ordered first activation. The final-state assertion in the existing test does not prove that transition. |
| `modules/operations-identity/operations-identity-lifecycle-contract.ts:267-289`   | First activation is explicitly distinguished from creation/recovery: never_activated becomes previously_activated, Epoch is preserved, audit outcome is first_activated. This Domain outcome is not itself an approved database operation_type.        |
| `database/migrations/0040_operations_activation_history_persistence.sql:33,82-86` | The audit CHECK and audit-validation trigger accept only principal_created/account_created/legacy_history_initialized, with subject-specific restrictions. There is no explicit first-activation audit operation.                                      |
| `database/migrations/0040_operations_activation_history_persistence.sql:121-146`  | History transition requires a matching audit describing the resulting history. Reusing the initial never_activated audit cannot attest previously_activated.                                                                                           |
| `database/migrations/0040_operations_activation_history_persistence.sql:201-243`  | Existing SECURITY DEFINER creation functions establish pending/invited + never_activated and creation audits; they do not implement first activation. PUBLIC execution is revoked.                                                                     |

A dedicated bootstrap function is already authorized by 018-B. However, that function alone does
not define an unambiguous, compatible first-activation audit representation. Relabeling activation
as another creation or legacy backfill would change the meaning of an existing operation. Extending
the CHECK and audit validator in 0041 would change existing audit-schema semantics. Neither option
has been silently selected. This is a contract/representation blocker, not a claim that PostgreSQL
cannot implement the transaction.

The required Main Controller determination is narrowly scoped: confirm the allowed audit encoding
for first-account first activation, or authorize an additive, bootstrap-only audit-schema/validator
extension in 0041 while preserving 0036-0040 byte for byte. This does not require reopening general
C2-2/C3 or any frozen Founder lifecycle decision.

### Disposable PostgreSQL confirmation

Raw structured evidence, including exact SQL, separate stdout/stderr and real child-process exit
codes, is retained in [PCI-ENG-018-B-blocker-evidence.json](evidence/PCI-ENG-018-B-blocker-evidence.json).

- Image: `docker.m.daocloud.io/library/postgres:17.10-alpine`;
  digest: `sha256:af194ccf3e2d7fe367012c7b88ce8b816c5c889b18a5b316799a1f0d7eac746a`.
- Server: PostgreSQL 17.10; Podman Client/Server: 5.7.1.
- Container: `db752e1accbe50f4541dc5237c0a18979e2ced9bdbfcb32b023d0345b39fcc63`;
  loopback port `127.0.0.1:40645`; anonymous volume storage, not tmpfs; database `postgres`.
- The existing fixture installed the identity tables and SECURITY DEFINER creation functions as
  `postgres`. Runtime EXECUTE on all three creation functions is false. This fixture does **not**
  prove installation through the restricted Migration/Table Owner/Function Owner wrapper.
- In one transaction, the real creation function created pending/never_activated, and an UPDATE
  changed the Principal to active. A candidate `first_activated` audit was then rejected by
  `operations_private.validate_identity_lifecycle_audit()` with SQLSTATE `23514`,
  `Invalid principal audit association`. `psql -v ON_ERROR_STOP=1` exited **3** before COMMIT.
  This candidate label is a probe, not a new approved audit operation.
- A new connection after the failed process observed zero Principal, Account, both History,
  Audit, Credential and Session rows (exit **0**), confirming rollback on connection termination.
  This is a rejection/rollback probe, not successful bootstrap acceptance.
- Seven containers named `pci-018b-auth-*` were still running despite the earlier cleanup claim.
  Their names/IDs were checked, then explicitly removed with their anonymous volumes. Cleanup
  exited **0**; the final task-container query returned no rows, exit **0**. Unrelated resources
  were not removed.

### Other confirmed pre-commit gaps

| Evidence                                                                                                                                                                                                      | Finding                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/database/migrate-with-role-context.ts:65-88,158-172`                                                                                                                                                 | 0041 has a reviewed tag/hash but its hash is missing from approvedInstallationHashes. The wrapper therefore rejects it.                                                                                                                                          |
| `scripts/database/migrate-with-role-context.ts:280-290`; `database/migrations/0041_operations_admin_runtime_permissions.sql:5-20`                                                                             | No explicit mixed-owner phase policy exists for 0041 grants on Legacy Owner versus Table Owner objects. Superuser migration tests do not verify that policy.                                                                                                     |
| `scripts/database/initialize-first-operations-account.ts:131-132`                                                                                                                                             | Non-TTY password input falls back to ordinary trimmed readline. It does not meet unconditional no-echo/no-modification requirements.                                                                                                                             |
| `apps/admin-web/app/api/operations/auth/_proxy.ts:26-30`; `apps/admin-web/components/admin-shell.tsx:33-37`                                                                                                   | BFF clears the cookie on upstream logout failure, and the UI redirects without checking response.ok. Server revocation failure can look like successful logout.                                                                                                  |
| `apps/admin-web/components/admin-shell.tsx:15-39`                                                                                                                                                             | Client Session verification starts after rendering; the protected shell/children are not withheld while unauthenticated.                                                                                                                                         |
| `apps/admin-web/app/api/operations/auth/_proxy.ts:51-53`                                                                                                                                                      | Origin validation permits absent Origin for state-changing requests. BFF boundary/failure tests are absent.                                                                                                                                                      |
| `tests/operations/operations-human-authentication.test.ts`; `tests/integration/operations-human-authentication-api.test.ts`; `tests/integration/operations-human-authentication-postgres.integration.test.ts` | Only one test in each file. The PostgreSQL test checks final bootstrap state and happy-path auth/revocation; it does not cover the required lifecycle transition, bootstrap fault injection, full denial/expiry/race matrix or a real browser login/logout flow. |

### Verification limits and stop decision

Earlier green checks establish compilation and their executed test scope only. They do not close
the findings above. Specifically, Admin component tests are not browser end-to-end acceptance;
the one PostgreSQL happy-path test is not complete Section 12 acceptance. The earlier active
backend TypeScript classification is corrected below: the backend check passed; the broader
active-tests aggregate later failed in web-v2. Full lint was reported with 459 errors; a parent
comparison has not proven their classification.

No new successful initializer, restricted-wrapper migration, full authentication matrix or browser
end-to-end verification is claimed by this review. After the blocker was confirmed, implementation
and commit closure stopped under 018-B Sections 5 (B2) and 15. No frozen migration, real database,
Runtime permission, production configuration or Founder decision was changed by the review.

`PCI-ENG-018-B = BLOCKED — MAIN CONTROLLER REVIEW REQUIRED`

## Earlier implementation progress record (superseded)

The following records describe the partial implementation and earlier narrow checks. They are
retained for chronology and do not establish current completion or acceptance.

## Delivered

- Independent Argon2id Password Hash/Verify adapter with a 15-character minimum.
- One-time transactional first Operations Principal/Account initializer.
- PostgreSQL authentication snapshot store for Principal, Account, Credential and activation
  histories.
- Migration 0041 least-privilege Runtime ACL: identity reads and row-lock column privileges,
  Session insert/update, and no lifecycle writes, delete, truncate or bootstrap authority.
- Login, Session validation/touch and logout routes in the shared API.
- Fixed server-side permissions: `catalog:read` and `audit:read`.
- Same-origin Admin Web BFF with one opaque host-only `HttpOnly` cookie.
- Admin login form, protected shell Session bootstrap, operator identity display and logout.
- Production MFA gate: the Human Operations runtime is not registered in the production API until
  MFA is available and accepted.

## Validation

| Check                                                    | Result                                                                                                                                 |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Core TypeScript                                          | PASS                                                                                                                                   |
| API TypeScript                                           | PASS                                                                                                                                   |
| Admin Web TypeScript and tests                           | PASS; 9 tests                                                                                                                          |
| Argon2id unit test                                       | PASS                                                                                                                                   |
| Admin lint                                               | PASS                                                                                                                                   |
| Admin build and sentinel boundary check                  | PASS                                                                                                                                   |
| Changed-file Prettier                                    | PASS                                                                                                                                   |
| Active backend test TypeScript / wider aggregate         | Backend check PASS; wider active-tests aggregate failed in web-v2. Pre-existing classification not established by a parent comparison. |
| Disposable PostgreSQL 17.10 runtime/bootstrap acceptance | PASS; 1 focused test, exit code 0                                                                                                      |
| PostgreSQL image / digest                                | `docker.m.daocloud.io/library/postgres:17.10-alpine` / `sha256:af194ccf3e2d7fe367012c7b88ce8b816c5c889b18a5b316799a1f0d7eac746a`       |
| PostgreSQL / Podman provenance                           | PostgreSQL 17.10; Podman client/server 5.7.1; dynamic loopback port; disposable container destroyed after test                         |
| Migration Check                                          | PASS; migrations 0000-0041 match the journal                                                                                           |

The focused acceptance covered one-time bootstrap, Principal/Account activation history, Epoch 0,
Credential version 1, no Session before login, Argon2id login, generic wrong/unknown failures,
Session digest-only storage, Session validation/touch, logout revocation and repeat-bootstrap
rejection. The Runtime connection used the 0041 ACL and did not use a superuser connection for
authentication or Session operations. No shared or production database was used.

## Boundaries

This unit does not modify Migrations 0036-0040; it adds only Migration 0041 for the reviewed Runtime
ACL. It does not modify Creator Auth, static legacy Operations routes,
Catalog write authority, Offering or Request authority, MFA, RBAC, payments, Pilot, Production or
Real Money. Operations Session persistence remains the accepted source of database behavior; this
unit only supplies the runtime and first controlled initialization path.
