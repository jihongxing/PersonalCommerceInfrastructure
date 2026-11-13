# 123 - Operations Identity Persistence Baseline

> **Task:** `PCI-ENG-015-B`
> **Decision dependency:** `PCI-ENG-014_ARCHITECTURE = APPROVED`; `PCI-ENG-015-A_DOMAIN_CONTRACT = ACCEPTED`
> **Implementation state:** `PCI-ENG-015-B_PRINCIPAL_PERSISTENCE = IMPLEMENTED / ACCEPTED`; `PCI-ENG-016-B_CREDENTIAL_PERSISTENCE = ACCEPTED`
> **Session acceptance:** `PCI-ENG-016-C0 = ACCEPTED`; `PCI-ENG-016-C1 = ACCEPTED`; `PCI-ENG-016-C1-E2 = ACCEPTED`; `PCI-ENG-016-C2 = ACCEPTED`; `PCI-ENG-016-C2-E2 = ACCEPTED`
> **Effective date:** 2026-11-12
> **Acceptance ledger update:** 2026-11-13 — PCI-ENG-017-B-E2
> **Terminal integrity acceptance:** `PCI-ENG-017-B = ACCEPTED`; `PCI-ENG-017-B-E2 = ACCEPTED` (UPDATE/DELETE only)
> **Scope:** PostgreSQL schema, migrations, repository ports/adapters and disposable PostgreSQL verification
> **Lifecycle contract update:** 2026-11-13 — C1 ACCEPTED; Founder decisions incorporated in C1-R1 awaiting review; lifecycle/history persistence NOT IMPLEMENTED
> **Current lifecycle acceptance:** 2026-11-13 — C1-R1 ACCEPTED for contracts/tests/docs only; see section 3.5.1. Lifecycle/history database persistence remains NOT IMPLEMENTED.
> **Current contract amendment:** FD-UNKNOWN-01 APPROVED; C1-R2 IMPLEMENTATION COMPLETED / AWAITING MAIN CONTROLLER REVIEW; future persistence obligations only, see section 3.6.

This document records the accepted bounded persistence foundations for the Operations Human and Machine
identity domain. PCI-ENG-015-B remains limited to the three Principal/Account persistence categories;
PCI-ENG-016-B adds only the accepted Password Credential persistence boundary and its recorded evidence.
C2 separately adds the accepted Operations Human Session persistence foundation described in Section 3.3.
It is an implementation and evidence record. It does not create Founder approval for authentication,
Session Credential issuance/runtime, password verification/reset, permissions, Admin API integration,
external Pilot, production or real-money operation.

## 1. Persisted boundary

Exactly three new tables are part of the PCI-ENG-015-B Principal persistence unit:

| Table                         | Stored contract                                                                                         | Key constraints                                                                                                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operations_human_principals` | Human Principal ID, lifecycle status, security epoch and timestamps                                     | Status is `pending`, `active`, `suspended`, `disabled` or `tombstoned`; `security_epoch >= 0`                                                                                         |
| `operations_accounts`         | Account ID, one Human Principal reference, normalized login identifier, lifecycle status and timestamps | Restricted Principal foreign key; unique Principal (initial 1:1); unique normalized login; status is `invited`, `active`, `locked`, `disabled` or `revoked`                           |
| `service_principals`          | Provider Service or Platform System discriminator, external ID, lifecycle status and creation time      | Provider/System IDs are unique; `provider_service` requires only `provider_id`; `platform_system` requires only `system_id`; status is `active`, `suspended`, `disabled` or `revoked` |

The migration is `database/migrations/0036_operations_principal_persistence.sql`. Foreign-key
deletion is `RESTRICT`; no repository exposes normal physical deletion. No cross-domain foreign
keys were added and no existing LocalAuth, Session, Creator, Catalog or Actor tables were changed.

## 2. Application ports and adapters

`applications/operations-identity/operations-identity-repositories.ts` defines minimal ports for:

- Human Principal create, lookup and status update;
- Account create, lookup by ID/Principal/normalized login and status update;
- Provider Service and Platform System create, lookup by ID/provider/system and status update.

`adapters/persistence/postgres/postgres-operations-identity-repositories.ts` maps those ports to
the three tables and rehydrates the branded 015-A domain entities. Duplicate database keys are
reported as constraint-specific repository conflicts. Login writes and lookups share the pure
trim/NFC canonicalizer and preserve case. `PostgresOperationsIdentityTransaction` rejects a
Principal/Account ID mismatch before insertion and creates both records in one transaction, so an
Account uniqueness or foreign-key failure rolls the Principal back as well. The formal composition
entry point is `createPostgresOperationsIdentityComposition`; it is exposed from the existing
Creator PostgreSQL composition without starting Operations authentication.

Current capability states distinguish accepted persistence/contracts from unimplemented runtime:

```text
OPERATIONS_CREDENTIAL_PERSISTENCE = IMPLEMENTED / ACCEPTED (PCI-ENG-016-B)
OPERATIONS_TERMINAL_STATE_UPDATE_PROTECTION = ACCEPTED
OPERATIONS_TERMINAL_STATE_DELETE_PROTECTION = ACCEPTED
OPERATIONS_SESSION_DOMAIN_CONTRACT = ACCEPTED
OPERATIONS_SESSION_REPOSITORY_PORT = ACCEPTED
OPERATIONS_SESSION_PERSISTENCE = ACCEPTED
OPERATIONS_SESSION_AUTH_RUNTIME = NOT IMPLEMENTED
OPERATIONS_AUTH_RUNTIME = NOT IMPLEMENTED
OPERATIONS_SESSION_RUNTIME = NOT IMPLEMENTED
OPERATIONS_AUTHENTICATION = NOT IMPLEMENTED
OPERATIONS_MFA = NOT IMPLEMENTED
OPERATIONS_BFF = NOT IMPLEMENTED
OPERATIONS_PERMISSION_REGISTRY = NOT IMPLEMENTED
OPERATIONS_AUDIT_RUNTIME = NOT IMPLEMENTED
OPERATIONS_ADMIN_API_INTEGRATION = NOT IMPLEMENTED
```

## 3. Verification evidence

| Check                           | Result          | Evidence and limit                                                                                        |
| ------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------- |
| 015-A domain contract suite     | PASS, 13/13     | Pure contract invariants and canonical login handling; does not prove persistence                        |
| PostgreSQL disposable round 1   | PASS, 11/11 tests | Fresh PostgreSQL 17 container, complete migration history, loopback-only dynamic port, tmpfs storage |
| PostgreSQL disposable round 2   | PASS, 11/11 tests | Independent fresh container/storage and database; duplicate races and transaction rollback included |
| Migration check                 | PASS            | `pnpm db:check` verified journal/file parity and deferred-capability guard                                |
| Active runtime/test typechecks  | PASS            | `pnpm typecheck:core` and `pnpm typecheck:active-tests:backend`                                           |
| Focused lint/format/diff checks | PASS            | New TypeScript files passed ESLint/Prettier; `git diff --check` passed                                    |

The PostgreSQL suite directly verifies valid creation and rehydration, bounded composition, mismatched
Principal/Account rollback protection, canonical login write/lookup, duplicate Principal/Account and
normalized-login rejection, explicit NotFound and terminal-status errors, missing foreign-key rejection,
invalid lifecycle/security values, restricted Principal deletion, valid Provider/System creation,
missing/both/null discriminator IDs, duplicate Provider/System IDs, concurrent Principal/Provider/System
uniqueness and combined transaction rollback.
Tests use real PostgreSQL; mocks, fixtures and simulations are not used as database acceptance
evidence. The temporary containers and named volumes were removed after each round.

## 3.1 PCI-ENG-016-B Credential persistence acceptance

The accepted credential persistence ledger is:

```text
PCI-ENG-016-B_CREDENTIAL_PERSISTENCE = ACCEPTED
PCI-ENG-016-B-R1 = ACCEPTED
PCI-ENG-016-B-R2 = ACCEPTED
```

This bounded unit delivers Encoded Password Verifier persistence, an Operations Account Credential
Repository, an account-scoped Credential Version sequence beginning at 1 and increasing strictly,
atomic replacement using an Account row lock and expected version, revoked-history protection,
PostgreSQL integrity constraints and triggers, Operations Persistence Composition integration, and
Domain/PostgreSQL integration verification. Each Account has at most one active Password Credential.
When all historical credentials are revoked, only the next historical version may be created. Revoked
credentials cannot be reactivated, modified or deleted.

The implementation does not generate or verify passwords, issue reset tokens, create Sessions, perform
login/logout, add MFA/RBAC, or create an Admin BFF/API. The repository accepts only an already encoded
verifier; the database stores it as `text` without selecting a password algorithm or PHC format.

Final verification evidence:

| Check | Result | Boundary |
| --- | --- | --- |
| Domain contract | 14/14 PASS | Credential metadata invariants and existing Operations identity contract only |
| Credential + Operations Identity PostgreSQL | 19/19 PASS | Real PostgreSQL migration, constraints, triggers, concurrency and rollback |
| Full Persistence | 108 PASS / 12 FAIL / 3 SKIPPED | The 12 failures reproduce on the source baseline and are `PROVEN PRE-EXISTING — SOURCE BASELINE`; Full Persistence is not fully green |
| Changed-file ESLint | PASS | New/changed implementation and test files |
| TypeScript / build | PASS | Direct core and active backend checks plus production build |
| Migration check | PASS | Schema/migration journal parity including 0037 |
| Full lint | 458 errors | Parent comparison is not complete; this remains a repository-level limitation |

The database has no independent Migration Role / Runtime Role. Compose uses the same `DATABASE_URL`
connection for Migration and API services, and superuser or equivalent database administration can
bypass ordinary trigger protection. Runtime Role / Migration Role separation must be separately approved
and accepted before Operations Authentication Runtime is enabled.

Implementation commits:

- `c5c4349` — `feat: add operations principal persistence schema (PCI-ENG-015-B)`
- `3da7213` — `feat: persist operations principal identities (PCI-ENG-015-B)`
- `60f32e6` — `test: complete operations persistence constraint coverage (PCI-ENG-015-B)`
- `4bf113b` — R2 domain/repository integrity fixes
- `591e038` — R2 PostgreSQL constraint and verification coverage
- `b700ca6` — R2 formal PostgreSQL persistence composition

## 3.2 PCI-ENG-016-C1 Session contract and Port acceptance, without persistence

Authority: Main Controller's explicit PCI-ENG-016-C1-E2 acceptance instruction, dated 2026-11-13.
This section preserves the historical state and test counts as of C1-E2, before C2. Its unimplemented
persistence state is superseded only by the separate C2 acceptance in Section 3.3.

```text
PCI-ENG-016-C0 = ACCEPTED
PCI-ENG-016-C1 = ACCEPTED
OPERATIONS_SESSION_DOMAIN_CONTRACT = ACCEPTED
OPERATIONS_SESSION_REPOSITORY_PORT = ACCEPTED
OPERATIONS_SESSION_PERSISTENCE = NOT IMPLEMENTED
OPERATIONS_AUTH_RUNTIME = NOT IMPLEMENTED
```

The accepted C1 delivery contains only the existing Session Domain refinements and Application
contracts. Credential Version is positive; Principal Security Epoch is non-negative; Session Version
is separate CAS Persistence Metadata, initialized at 1 by future persistence. Sessions bind matching
Account/Principal references. Digest and Password Verifier types are separate; the Domain contains no
opaque credential, Digest or Session CAS Version. Rotation cannot change Absolute Expiry, Touch is
monotonic and bounded by that expiry, and revoked Sessions are terminal.

The Session Port defines Create, Find Active by Digest, Validate/Touch, Strict CAS Rotate, Revoke
Single, Revoke All for Account and Revoke All for Principal. A separate Security Epoch Increment Port
requires expectedEpoch and permits only epoch + 1. The future adapter must validate active ownership
and current Credential Version/Epoch snapshots under Human Principal -> Operations Account ->
Operations Credential -> Operations Session lock order; use strict Digest + expectedSessionVersion
CAS; fail closed without a grace window; and preserve the winner when another rotation loses CAS.
A lost rotation response requires reauthentication; no default successor recovery is provided.
These are future persistence obligations, not verified database behavior.

Accepted C1 evidence: Domain Contract Tests 21 PASS; Session Repository Contract Tests 7 PASS; total
28/28 PASS. Production TypeScript, Active Backend Test TypeScript, changed-file ESLint, Prettier and
`git diff --check` PASS. No PostgreSQL Session tests were executed because there is no Session
persistence implementation. This does not rerun or supersede the historical Principal/Credential
PostgreSQL evidence above, and it does not close the recorded full-suite/lint limitations.

C1 adds no Session table, Schema, Migration, PostgreSQL Adapter, Composition integration, Session
issuance or Authentication Runtime. E2 commits the accepted four C1 files unchanged alongside the
four authorized governance documents; no database operation, role change or new authority is granted.
The full Domain/Port contract is recorded in
[`122_Operations_Identity_Domain_Contract.md`](./122_Operations_Identity_Domain_Contract.md), Section 5.2.

## 3.3 PCI-ENG-016-C2 Session Persistence acceptance and C2-E2 closure

Authority: Main Controller's explicit PCI-ENG-016-C2-E2 instruction, dated 2026-11-13. C2 is formally
accepted. C2-E2 synchronizes four governance documents and commits the accepted C2 delivery in one
commit, without adding engineering logic, rerunning Migration/database tests, changing roles or pushing.
The accepted implementation baseline is `cef592ec4a1a513f63589005508c4c8aa708fd32`.

```text
PCI-ENG-016-C0 = ACCEPTED
PCI-ENG-016-C1 = ACCEPTED
PCI-ENG-016-C1-E2 = ACCEPTED
PCI-ENG-016-C2 = ACCEPTED
PCI-ENG-016-C2-E2 = ACCEPTED
OPERATIONS_SESSION_DOMAIN_CONTRACT = ACCEPTED
OPERATIONS_SESSION_REPOSITORY_PORT = ACCEPTED
OPERATIONS_SESSION_PERSISTENCE = ACCEPTED
OPERATIONS_SESSION_AUTH_RUNTIME = NOT IMPLEMENTED
```

Accepted implementation:

- `operations_sessions` PostgreSQL Schema, Migration 0038, Snapshot and Journal; the Account composite
  unique constraint and `(account_id, principal_id)` RESTRICT foreign key enforce matching ownership.
- A 32-byte `bytea` Digest, global Digest uniqueness, independent Session Version, Credential Version
  Snapshot and Principal Security Epoch Snapshot; no raw Session Credential or Credential ID redundancy.
- Seven Session Repository Port implementations in `postgres-operations-session-repository.ts`: Create,
  Find Active by Digest, Validate/Touch, Strict CAS Rotate, Revoke Single, Revoke All for Account and
  Revoke All for Principal. Validation checks active owners/current Credential and both snapshots.
- Independent `postgres-operations-security-epoch-repository.ts`: Principal row lock, expectedEpoch
  CAS, exactly +1, stale conflict and int32 overflow checks; no Account/Credential status change.
- Strict Digest plus expected Session Version CAS Rotation, monotonic Touch, unchanged Absolute Expiry,
  atomic bulk revocation and Operations Persistence Composition integration.
- INSERT/UPDATE, DELETE and TRUNCATE protection plus Epoch increment protection. The INSERT trigger
  locks parents in repository order; the UPDATE row trigger takes no parent locks after the Session
  tuple lock, avoiding reversed acquisition. Live owner/snapshot validation on updates is in the
  Repository transaction. Revoked history cannot be updated, reactivated, deleted or truncated normally.

Accepted C2 evidence, retained without new execution in E2:

| Check | Result | Boundary |
| --- | --- | --- |
| Domain | 21 PASS | Accepted Domain tests rerun in C2; no C2 Domain changes |
| Session Repository Port | 7 PASS | Accepted C1 contract tests |
| Identity PostgreSQL | 11 PASS | Existing persistence regressions |
| Credential PostgreSQL | 8 PASS | Existing Credential regressions |
| Session PostgreSQL file | 23 PASS | Real PostgreSQL/Migration, SQL guards, multi-connection races and rollback; includes one pure error-mapper case |
| Focused total | 70/70 PASS, exit 0 | Five files |
| Full Persistence | 131 PASS / 12 FAIL / 3 SKIPPED, exit 1 | Not fully green |
| Source baseline | 108 PASS / 12 FAIL / 3 SKIPPED, exit 1 | All 12 failed full names/files/error summaries match individually: `PROVEN PRE-EXISTING — SOURCE BASELINE` |
| Migration | PASS | 0037 -> 0038, 38 -> 39 Journal rows; repeat retains identical 39 rows; fresh installation succeeds |
| Static/build checks | PASS | Production TypeScript, Active Backend Test TypeScript, changed-file ESLint, Prettier, Build and Migration Check |
| Full lint | No new verification | Historical 458 errors have no clean parent comparison; no full-lint PASS claim |

The source comparison shares the existing dependency tree; independent dependency reconstruction was
not performed. Final SQL SHA256 is
`344196ebc3a1c91afa710a7f399e55119a394e992915792c882c031f8f817594`. Journal idx 38 uses timestamp
1794691200001, greater than all older entries; earlier Journal entries remain unchanged.

Retained evidence root:
`E:/Users/jihx/.codex/visualizations/2026/11/11/01a1cb52-385b-70f0-95cf-11c189dd0a9d/pci-eng-016-c2-20261113`.
`README.md` and `commands.jsonl` index the exact commands, cwd, times and exits; final test JSON,
`final-regression-reconciliation.json`, final-prefixed Migration/Journal logs and cleanup records
retain their original results. The temporary PostgreSQL 17.10 container was removed; this acceptance
does not recreate it or relabel intermediate results as final.

Mandatory technical limitations:

1. Migration Role and Runtime Role remain unseparated.
2. Current Compose uses the same `DATABASE_URL` for Migration and API.
3. Database administration can bypass ordinary Trigger protection.
4. MFA Runtime is not implemented; `mfa_verified_at` has no Step-up update interface.
5. Full Persistence retains 12 proven source-baseline failures and 3 skipped tests.
6. Concurrency evidence covers exercised schedules, not a formal proof that every schedule is deadlock-free.
7. C2 excludes login, Session Credential issuance/verification Runtime, Cookie and BFF.

PostgreSQL acceptance is not production security certification. Session timeout/lifetime, concurrent
limits, device management, Touch/Rotation policy, Cookie/CSRF, retention and MFA policy remain unfrozen.
No Authentication Runtime, MFA/RBAC, Admin API, Creator Auth, first real Principal/Account, permission
grant, deployment, Pilot, production or real-money authorization is added.

## 3.4 PCI-ENG-017-B terminal UPDATE/DELETE acceptance and E2 closure

Authority: Main Controller's explicit PCI-ENG-017-B-E2 instruction, dated 2026-11-13. The accepted
implementation baseline is `ae8356057edc877bad17b4250c7b93a2d27374e1`. E2 synchronizes four governance
documents and commits the seven accepted engineering files unchanged; it runs no Migration or
PostgreSQL tests, changes no runtime logic and does not Push. Earlier verification counts retain
their historical context.

```text
PCI-ENG-017-A = ACCEPTED_READ_ONLY_ASSESSMENT
PCI-ENG-017-B = ACCEPTED
PCI-ENG-017-B-E2 = ACCEPTED
OPERATIONS_TERMINAL_STATE_UPDATE_PROTECTION = ACCEPTED
OPERATIONS_TERMINAL_STATE_DELETE_PROTECTION = ACCEPTED
```

Human Principal `tombstoned`, Operations Account `revoked` and Service Principal `revoked` are
irreversible. Every subsequent field/status UPDATE, no-op write and intermediate-state reactivation
is rejected; terminal rows cannot be deleted. The update entering terminal remains allowed. Existing
nonterminal suspended/disabled Principal or Service recovery and locked/disabled Account recovery
are preserved. All three Repository status setters lock/read the current state in their update
transaction and return the existing typed terminal error. Transaction-scope repositories share them.

Migration `0039_operations_identity_terminal_state_protection.sql` adds one shared function and three
BEFORE UPDATE OR DELETE row triggers, independently rejecting terminal SQL writes with SQLSTATE 23514. No field, key, enum or historical data changes; accepted Migrations 0036/0037/0038 remain
unchanged. Snapshot 0039 preserves Schema definitions and updates only id/prevId; Journal adds idx 39
at 1794691200002. Drizzle v7 does not represent these triggers; SQL, Catalog and real tests do. The
Session regression changes only its Journal count expectation from 39 to 40.

Retained accepted 017-B evidence, not rerun by E2:

- Focused and Operations regressions 107/107 PASS, exit 0: Domain 21, Session Port 7, Identity
  PostgreSQL 11, Credential PostgreSQL 8, Session PostgreSQL 23, new terminal integrity 37.
- Full Persistence 168 PASS / 12 FAIL / 3 SKIPPED, exit 1. All 12 failed names/files/error summaries
  match retained accepted source-baseline evidence, with no new failures, prior status changes or
  removed tests. Classification remains `PROVEN PRE-EXISTING — SOURCE BASELINE`; earlier proof
  shared existing dependencies without independent reconstruction. No new full parent run is implied.
- Production TypeScript, Active Backend Test TypeScript, changed-file ESLint, Prettier, Build and
  Migration Check PASS. Full lint is not newly verified; no fully green Persistence claim is made.
- Migration 0039 upgrade 39 -> 40 Journal rows, identical 40-row rerun and 40-row empty installation
  PASS. Prior applied entries are preserved; archive CRLF versus worktree LF historical SQL hashes
  differ only by line endings, not content. New SQL SHA256 is
  `7fba8a695294bb2abf2c98e790d72f92b33451909691e5e2b60d72366621e363`.

Evidence root:
`E:/Users/jihx/.codex/visualizations/2026/11/11/01a1cb52-385b-70f0-95cf-11c189dd0a9d/pci-eng-017-b-20261113`.
`README.md`, `commands.jsonl`, final test JSON, `regression-reconciliation.json`,
`migration-reconciliation.json`, environment/Catalog and cleanup records retain original evidence.
The disposable PostgreSQL 17.10 container was removed; E2 does not recreate it.

Mandatory limits:

1. `TRUNCATE service_principals` succeeded in the verification environment; new terminal guards cover
   UPDATE/DELETE only, not TRUNCATE.
2. Principal/Account TRUNCATE is currently blocked by existing foreign keys and dependent
   Credential/Session guards; there is no independent identity-table TRUNCATE trigger.
3. Migration Role and Runtime Role remain unseparated; superuser/database administration can bypass
   triggers. No production security certification is implied.
4. Historical illegal restoration has not been audited or automatically corrected.
5. No Security Epoch/Session status linkage is implemented.
6. No Authentication Runtime, Password Hash/Verify, login, Bootstrap, MFA, RBAC or BFF is implemented.

No Creator Auth, Credential or Session logic is changed by E2. All Section 4 governance values remain
unchanged; acceptance grants no identity, permission, Pilot, production or real-money authority.

## 3.5 PCI-ENG-017-C1-R1 lifecycle transaction and authoritative history contract

Authority: Main Controller formally accepts C1 and incorporates Founder-approved FD-C1-01 through
FD-C1-05. The five pending policy placeholders in original C1 are superseded by Domain Baseline 5.5.
No new PostgreSQL Adapter/Composition, history column, SQL or database operation is implemented.

> Historical C1-R1 implementation submission: the awaiting-review status below is retained as recorded. Current formal acceptance appears in the subsequent E2 subsection.

```text
PCI-ENG-017-C1 = ACCEPTED
PCI-ENG-017-C1-R1 = IMPLEMENTATION COMPLETED — AWAITING MAIN CONTROLLER REVIEW
OPERATIONS_LIFECYCLE_TRANSACTION_PERSISTENCE = NOT IMPLEMENTED
OPERATIONS_ACTIVATION_HISTORY_PERSISTENCE = NOT IMPLEMENTED
PCI-ENG-017-C2 = NOT AUTHORIZED
PCI-ENG-017-C3 = NOT AUTHORIZED
```

OperationsIdentityLifecycleTransactionPort preserves the seven Session signatures and adds the
accepted Principal/Account lifecycle and ordinary Credential replacement operations. The separate
OperationsIdentityLifecycleStateReader specifies transaction-local reads returning existing entities
refined with their own history markers. It is an Adapter implementation obligation, not a new
client-facing history setter, external command or implemented database reader. No command may
supply history/approval to acquire activation rights. Structural snapshot types alone do not prove
runtime provenance: a future adapter must read the real locked rows and revalidate ownership.

### Transaction boundary matrix for separately authorized implementation

P/A/C/S mean Principal, Account, Password Credential and Session. Acquire P -> A -> C -> S;
within a table acquire stable row IDs in ascending order. Never lock Account and then its Principal,
including indirectly through a row Trigger. Routing hints are not authoritative and must be re-read.

| Atomic operation                | Required locks                          | Expected values and same-commit effects                                                                                                                |
| ------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Principal lifecycle             | P -> A set -> C set -> S set; N only P  | expected status/Epoch; authoritative P history; whitelist plan; status/history/Epoch, scoped invalidation and audit                                    |
| Account lifecycle               | P -> A -> C -> S; N only P -> A         | owner association, expected A status/P Epoch; independent A history, P history/state; all planned effects and audit                                    |
| First activation                | target-scope order                      | never_activated -> previously_activated and active status together; Epoch unchanged; Account requires active P; scoped Session invalidation/audit      |
| Recovery                        | target-scope order                      | previously_activated proof and +1 expected P Epoch; old Session snapshots cannot revive                                                                |
| Terminal entry                  | target-scope order                      | status and +1 Epoch written while OLD P nonterminal; active Credential/Session revocations and audit join commit                                       |
| Ordinary Credential replacement | P -> A -> C -> old-version S set        | both parents active, current Credential, expected Epoch/version; revoke old, insert +1, revoke old-version Sessions/audit; no history or Epoch changes |
| Session creation                | P -> A -> current/history C -> insert S | active consistent parents, current Credential/version/Epoch, ownership/time and unique 32-byte Digest; Session Version=1                               |
| Lookup/Touch/Rotation           | hint then P -> A -> C -> S              | live states/history/snapshots/time and Digest; Rotation compares Digest AND Session Version; absolute expiry cannot extend                             |
| Single/bulk Revoke              | P -> A -> C -> S; stable sets           | accepted owner/CAS rules; inactive parents/Credential do not prevent revocation; revoked history unchanged                                             |

First activation and inactive-to-disabled transitions preserve Epoch; active departures, recovery
and terminal entry increment it. Every operation checks its expected values even if no increment or
no-op is planned. First activation may never be inferred from Epoch=0. Revoke scoped Sessions during
first activation to avoid reviving any historical Session at the unchanged generation. New S has no
existing row to lock. N needs no C/S locks because it reads/mutates neither. Any required step or audit
failure rolls back the entire operation. Never compose root repositories using independent connections.

Replays use expected state/Epoch/version, not a promised deduplication store. Terminal repeats reject;
nonterminal N requires matching expectations. Unknown commit outcomes require reconciliation; do not
blindly retry increments. Declared lock traces do not prove actual lock acquisition or deadlock freedom.

### History persistence obligations and fail-closed semantics

Future separately approved persistence must store independent never_activated/previously_activated/
unknown markers, initialize only new subjects, forbid previously -> never, and preserve unknown
legacy history until separately authorized evidence review. It must atomically persist status/history/
necessary Epoch changes and audit. Never derive history from current status or Epoch, accept history
from request commands, or relabel old inactive rows as new. Schema/migration design, existing-data
verification and implementation remain NOT IMPLEMENTED; Migrations 0036-0039 remain unchanged.

Session eligibility requires matching active P/A with consistent histories, active current Credential,
matching Credential Version and P Epoch, active Session and strict-before Idle/Absolute Expiry. Use
trusted server time after waits. Preserve Digest-only persistence, one opaque Credential, strict CAS,
no grace, lost-response reauthentication and immutable absolute expiry. Version brands remain distinct.

Failures distinguish not_authenticated, not_authorized, known-ID not_found, state_conflict,
cas_conflict, contract_failure and infrastructure_failure. Unknown/inconsistent activation history or
a forbidden transition is a state conflict, not policy_pending and not successful activation. Outage,
deadlock, transaction failure/conflict and unknown commit outcome remain infrastructure failures.
Lookup Digest mismatch remains unauthenticated; Rotation expected-Digest mismatch with matching
Session Version remains credential_digest CAS conflict. No HTTP mapping or authorization runtime is
implemented. Errors retain no SQL parameters, Verifier, Digest or raw driver cause.

### C2/C3 requirements and retained limitations

C2 and C3 need separate authorization. Any future history storage design must preserve the approved
rules and expose authoritative transaction-local reads. C3 must verify real PostgreSQL interleavings
with separate connections, barriers and observed waits, failure-injection rollback, SQL bypass,
upgrade/rerun/fresh installation, counter limits and role separation. Pure tests prove no such DB
properties. Privileged Credential Recovery is explicitly outside C1-R1 and C2/C3 default scope.

Runtime/Migration Roles remain unseparated; Compose shares DATABASE_URL for Migration/API. Database
administrators can bypass ordinary Trigger protection. Service Principal TRUNCATE remains outside
017-B protection. Historical illegal restorations are unaudited. No runtime, role, database, Schema,
Migration, Adapter, Composition or existing Credential/Session persistence behavior changes here.
Historical PostgreSQL results remain historical and are not new C1-R1 database evidence.

### 3.5.1 PCI-ENG-017-C1-R1-E2 subsequent formal acceptance

Authority: Main Controller's explicit PCI-ENG-017-C1-R1-E2 instruction formally accepts
PCI-ENG-017-C1-R1. This subsequent decision supersedes the earlier awaiting-review submission status
for current acceptance only; that historical status and its original execution evidence are retained.
Accepted engineering commit: 8b08936dc2d4ae60fdaec82dea51daba848ae2f9.

```ini
PCI-ENG-017-C0 = ACCEPTED
PCI-ENG-017-C1 = ACCEPTED
PCI-ENG-017-C1-R1 = ACCEPTED
FD-C1-01 = APPROVED
FD-C1-02 = APPROVED
FD-C1-03 = APPROVED
FD-C1-04 = APPROVED
FD-C1-05 = APPROVED
PCI-ENG-017-C1-R1-E2 = DOCUMENTATION CLOSED — AWAITING MAIN CONTROLLER REVIEW
OPERATIONS_ACTIVATION_HISTORY_PERSISTENCE = NOT IMPLEMENTED
OPERATIONS_LIFECYCLE_TRANSACTION_PERSISTENCE = NOT IMPLEMENTED
PCI-ENG-017-C2 = NOT AUTHORIZED
PCI-ENG-017-C3 = NOT AUTHORIZED
```

Acceptance covers C1/C1-R1 Domain, Application contracts, tests and governance documents only.
The five approved decisions remain unchanged:

- New Principal initialization uses Epoch=0. First activation of Principal or Account does not increase
  Principal Epoch; the target's history changes to previously_activated.
- Principal and Account each require their own persisted never_activated / previously_activated /
  unknown history. This is the accepted future persistence contract, not completed database storage.
  Previously activated history cannot reset; unknown history cannot authorize activation or recovery.
- Active subjects cannot return to pending/invited, directly or through an intermediate state.
- The Founder-approved Principal/Account whitelist matrices remain authoritative and unchanged;
  expected status/Epoch checks and irreversible terminal-state rules remain in force.
- Ordinary Credential Replacement requires both parents active and matching expected Credential
  Version/Principal Epoch. Privileged Credential Recovery is NOT IMPLEMENTED and NOT AUTHORIZED;
  it is not part of C2/C3 default authorization and needs a separately approved recovery design.

Activation-history database persistence, historical-data verification/migration and lifecycle database
transactions remain NOT IMPLEMENTED. Real PostgreSQL concurrency, lock waits and transaction rollback
have not been proved by these pure Domain/Application tests. Runtime/Migration Roles remain
unseparated. This acceptance does not mean Authentication Runtime, MFA, RBAC or Production is complete
or authorized. Existing PostgreSQL evidence is historical and does not prove these new contracts.
The historical 155/155 C1-R1 test result is retained; E2 does not rerun engineering or database tests.

This is documentation closure only: no source, test, Schema, SQL, Migration, configuration, Adapter,
Composition or runtime changes. No database/Migration/role operation, Push or deployment occurs.
C2/C3 require separate authorization; all existing project governance restrictions remain in force.

## 3.6 PCI-ENG-017-C1-R2 / FD-UNKNOWN-01 future persistence obligations

Authority: Main Controller's PCI-ENG-017-C1-R2 instruction and Founder decision
FD-UNKNOWN-01 = APPROVED. DEV-084 registers this bounded change. C1-R1 acceptance and its
historical 155/155 evidence remain unchanged. This section supersedes only the blanket rejection of
unknown-history restrictive changes; it does not supersede FD-C1-01 through FD-C1-05.

```ini
FD-UNKNOWN-01 = APPROVED
PCI-ENG-017-C2A = ACCEPTED
PCI-ENG-017-C2-0 = ACCEPTED AS DESIGN BASELINE
PCI-ENG-017-C1-R2 = IMPLEMENTATION COMPLETED — AWAITING MAIN CONTROLLER REVIEW
OPERATIONS_ACTIVATION_HISTORY_PERSISTENCE = NOT IMPLEMENTED
OPERATIONS_LIFECYCLE_TRANSACTION_PERSISTENCE = NOT IMPLEMENTED
PCI-ENG-017-C2-1 = NOT AUTHORIZED
PCI-ENG-017-C2-2 = NOT AUTHORIZED
PCI-ENG-017-C3 = NOT AUTHORIZED
```

| Principal transition (history unknown) | Account transition (history unknown) | Owning Principal Epoch | Active Session scope | Active Credential effect |
| -------------------------------------- | ------------------------------------ | ---------------------- | -------------------- | ------------------------ |
| pending -> disabled                    | invited -> disabled                  | unchanged              | target scope revoked | unchanged                |
| pending -> tombstoned                  | invited -> revoked                   | +1                     | target scope revoked | target scope revoked     |
| active -> suspended                    | active -> locked                     | +1                     | target scope revoked | unchanged                |
| active -> disabled                     | active -> disabled                   | +1                     | target scope revoked | unchanged                |
| active -> tombstoned                   | active -> revoked                    | +1 exactly once        | target scope revoked | target scope revoked     |
| suspended -> disabled                  | locked -> disabled                   | unchanged              | target scope revoked | unchanged                |
| suspended -> tombstoned                | locked -> revoked                    | +1                     | target scope revoked | target scope revoked     |
| disabled -> tombstoned                 | disabled -> revoked                  | +1                     | target scope revoked | target scope revoked     |
| tombstoned -> any state                | revoked -> any state                 | rejected               | no lifecycle writes  | no lifecycle writes      |

All successful restrictions retain unknown history verbatim and check Expected Status/Epoch,
ownership and the existing whitelist. Principal scope covers its Sessions; Account scope covers
only that Account's Sessions. Account changes consume the owning Principal Epoch only when planned;
they never change its Status or history. Epoch overflow rejects; no wrap, reset or skipped increment.

Account restrictions require an existing matching nonterminal Principal. Its unknown history is
allowed only for the listed actual restrictive transitions. Known-but-inconsistent or missing/invalid
history on either owner rejects. A tombstoned Principal blocks every Account lifecycle mutation.
No force, approved, privileged or caller-provided history can authorize an exception.

First activation, recovery, ordinary Credential replacement and Session Create/Validate/Touch/Rotation
remain strict: unknown cannot acquire or maintain authentication eligibility. Ordinary replacement
still requires both parents active with previously_activated histories and matching Credential
Version/Principal Epoch. Independent Session Revoke remains possible with inactive/unknown/terminal
parents, without updating their identity rows; revoked Session history remains immutable.

No new unknown same-state success is introduced. Existing legal pending/invited or disabled no-ops
retain their original parent/history and Expected Status/Epoch checks. Active/suspended/locked unknown
no-ops still reject; terminal updates, including no-op, always reject.

Plans now expose the closed, derived safetyOperation = standard | restrictive_unknown; this is not a
request flag or permission. The Application plan retains branded Epoch types and full Session/
terminal Credential effects. A transaction-local StateReader must return real unknown histories
without filtering, inference or repair. Future C2-2 must lock P -> A -> C -> S and atomically commit
status, required Epoch, unchanged history, scoped revocations and required audit, or roll back all.

C1-R2 local verification: Operations Identity 4 files / 325 tests PASS (Domain metadata 21,
lifecycle Domain 205, lifecycle Application 92, Session Repository Port 7). The unchanged source
baseline passed 155/155 before edits. The original 14 numbered concurrency contracts all still pass;
these are ordered pure-snapshot tests, not PostgreSQL concurrency, lock or rollback proof.
Production/core and API TypeScript, active backend test TypeScript, production TypeScript build,
changed-file ESLint, TypeScript Prettier and git diff --check passed. Added Markdown sections are
formatted/checked in isolation; all four full Markdown files already had Prettier differences at HEAD,
so unrelated historical text is preserved. Full repository lint/test suites and database tests were
not run. No PostgreSQL Migration, connection, permission or runtime operation was performed.

This unit implements pure Domain/Application contracts and tests only. History persistence, Migration
0040, Schema/Trigger/function changes, lifecycle PostgreSQL Adapter/transactions, audit storage,
historical classification tools, role separation and real PostgreSQL concurrency/rollback proof remain
unimplemented. The original 14 concurrency contracts remain pure snapshot tests, not SQL evidence.
No Creator Auth, login, password hash/verify/reset, Credential Recovery, Session issuance Runtime,
Cookie/BFF, MFA/RBAC, Bootstrap, Admin permissions, Pilot, production or real-money authority is added.

## 4. Control interpretation

This bounded implementation records engineering reality only. It does not change the project control
baseline:

```text
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

Persistence availability does not authorize a first Operations Principal, Bootstrap Authority,
administrator invitation, credential issuance, login, Session authentication runtime, permission grant,
Provider / System runtime migration, Admin mutation, Pilot, production or real-money use. Those decisions remain
with the Main Controller and Founder according to the existing authority hierarchy.

## 5. Follow-on decisions

Before any authentication or Operations runtime implementation, the Main Controller/Founder must
confirm the first Principal and Bootstrap Authority, administrator invitation policy, credential and
remaining Session policies, permission registry and high-risk controls. C0/C1 contract acceptance
does not freeze Idle Timeout, Absolute Lifetime, maximum concurrent Sessions, Device Management,
Touch frequency, Rotation trigger policy, Cookie/CSRF, Session history retention or MFA Session
semantics. Each follow-on unit must state its own
authorization level (`D`, `L`, `I`, `P`, `R` or `M`) and must not infer a higher level from this
persistence evidence.
