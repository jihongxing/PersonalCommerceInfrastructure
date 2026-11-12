# 123 - Operations Identity Persistence Baseline

> **Task:** `PCI-ENG-015-B`
> **Decision dependency:** `PCI-ENG-014_ARCHITECTURE = APPROVED`; `PCI-ENG-015-A_DOMAIN_CONTRACT = ACCEPTED`
> **Implementation state:** `PCI-ENG-015-B_PRINCIPAL_PERSISTENCE = IMPLEMENTED / ACCEPTED`; `PCI-ENG-016-B_CREDENTIAL_PERSISTENCE = ACCEPTED`
> **Session acceptance:** `PCI-ENG-016-C0 = ACCEPTED`; `PCI-ENG-016-C1 = ACCEPTED`; `PCI-ENG-016-C1-E2 = ACCEPTED`; `PCI-ENG-016-C2 = ACCEPTED`; `PCI-ENG-016-C2-E2 = ACCEPTED`
> **Effective date:** 2026-11-12
> **Acceptance ledger update:** 2026-11-13 — PCI-ENG-017-B-E2
> **Terminal integrity acceptance:** `PCI-ENG-017-B = ACCEPTED`; `PCI-ENG-017-B-E2 = ACCEPTED` (UPDATE/DELETE only)
> **Scope:** PostgreSQL schema, migrations, repository ports/adapters and disposable PostgreSQL verification
> **Lifecycle contract update:** 2026-11-13 — PCI-ENG-017-C1 IMPLEMENTATION COMPLETED / AWAITING MAIN CONTROLLER REVIEW; lifecycle transaction adapter NOT IMPLEMENTED

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

## 3.5 PCI-ENG-017-C1 lifecycle transaction Port; persistence not implemented

Main Controller accepts PCI-ENG-017-C0 and authorizes C1 Domain/Application contracts only.
`OperationsIdentityLifecycleTransactionPort` adds Principal/Account status commands and Credential
replacement, and inherits the seven accepted Session methods without changing their signatures.
It is not wired into the existing PostgreSQL Composition. The existing identity transaction scope
and standalone Epoch/status repositories remain unchanged and do NOT implement the new atomicity.

```text
PCI-ENG-017-C0 = ACCEPTED
PCI-ENG-017-C1 = IMPLEMENTATION COMPLETED — AWAITING MAIN CONTROLLER REVIEW
OPERATIONS_LIFECYCLE_TRANSACTION_PERSISTENCE = NOT IMPLEMENTED
PCI-ENG-017-C2 = NOT AUTHORIZED
PCI-ENG-017-C3 = NOT AUTHORIZED
```

### Transaction boundary matrix for a separately authorized C2

P/A/C/S mean Human Principal, Operations Account, Password Credential and Session. All checks use
authoritative rows read after acquisition. Sets follow ascending stable IDs within each table.

| Atomic operation                              | Required locks                                                     | Expected values and commit condition                                                                                                                                    | Failure scope                                            |
| --------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Principal state + Epoch + invalidation        | P -> A set -> C set -> S set for effects; P only for nonterminal N | expected P status/Epoch; approved transition; all status, +1, scoped revocations and technical audit commit together                                                    | entire transaction rollback                              |
| Account state + owning P Epoch + invalidation | P -> A -> C -> S for effects; P -> A for N                         | revalidate owner IDs, expected A status/P Epoch; all effects and audit commit together                                                                                  | entire transaction rollback                              |
| Terminal Principal/Account entry              | same target-scope order                                            | status and +1 Epoch occur while OLD Principal is nonterminal; required Credential/Session revocation joins same commit                                                  | never terminalize then separately repair Epoch           |
| Credential replacement                        | P -> A -> C -> old-version S set                                   | active parents/current Credential; expected Epoch and Credential Version; revoke old, insert exactly +1 and revoke old-version Sessions/audit together; Epoch unchanged | insertion/revocation/audit failure rolls everything back |
| Session creation                              | P -> A -> current/history C -> insert new S                        | both active owners, matching current Credential Version/Epoch, owner association, valid time, unique 32-byte Digest; Session Version starts at 1                        | no partial Session on failure                            |
| Session lookup/Touch/Rotation                 | hint only, then P -> A -> C -> S                                   | recheck Digest, live parents/snapshots and time; Rotation compares Digest AND Session Version; immutable absolute expiry                                                | fail closed; CAS loser does not revoke winner            |
| Single/bulk Session revoke                    | P -> A -> C -> S, stable sets for bulk                             | owner/CAS as accepted; inactive parents or Credential do not prevent revocation; active rows only                                                                       | entire batch rollback, revoked history unchanged         |

New rows have no existing Session row to lock before insertion. N does not need Credential/Session
locks because it neither reads nor mutates those entities. An unlocked routing hint gives no authority
and must be revalidated. Account-first then Principal is forbidden, including a parent-locking row
Trigger entered after Account UPDATE. The declared-trace checker proves only ordering rules for
provided traces, not that an adapter acquired those locks or is deadlock-free.

CAS provides at-most-once state effects for a given expected generation; operationId is correlation,
not a durable deduplication promise. Nonterminal same-status requests are no-ops only with matching
expectations. Terminal same-status requests reject. Retries after CAS conflict re-read/reconcile;
unknown commit outcomes never blindly retry increments. Do not invoke root repositories from an
outer transaction callback: they can use another connection and create partial commits/self-waits.

### Session consistency and failure-closed taxonomy

Eligibility is the conjunction of existing matching active P/A, current active Credential/version,
active Session, matching P Epoch, and strict-before Idle/Absolute Expiry. Pure contract functions
accept authoritative snapshots but acquire no locks. C2 obtains these snapshots in the transaction
and uses trusted server time after waits; a caller-supplied stale snapshot/time is not authority.

Session Version is persistence CAS metadata, Credential Version is Password history, and Epoch is
the Principal security generation. Rotation keeps the latter two unchanged. Digest-only persistence
does not issue credentials. Preserve one opaque credential, SHA-256 Digest, strict CAS, no grace,
lost-response reauthentication, absolute-expiry immutability and irrevocable Session status.

Failure categories distinguish not_authenticated, not_authorized, known-ID not_found, state_conflict,
cas_conflict, policy_pending, contract_failure and infrastructure_failure. Missing/inactive
Credential, stale snapshots, revoked/expired Session and Digest mismatch cannot succeed. Expected
status/Epoch/version conflicts cannot overwrite. Overflow cannot reset a counter. Database outage,
deadlock, transaction conflict/failure and unknown commit outcome remain infrastructure failures.
Errors retain no SQL, parameters, Digest, Verifier or raw driver cause. No HTTP status mapping,
permission enforcement or authorization runtime is implemented.
Digest mismatch during lookup/validation remains not_authenticated. Rotation's expected-Digest
mismatch with a matching Session Version is a credential_digest CAS conflict, preserving the
accepted Session Port and Adapter semantics.

### C2/C3 requirements and retained limitations

The first-activation Epoch rule, durable activation-history source, initial-state regressions and
distinct non-active transitions remain PENDING_FOUNDER_DECISION (Domain Baseline 5.5). Commands
cannot self-approve history. No physical history column, table or audit sink is invented by C1.
C2 must present its durable evidence/audit design before adding storage and must preserve history.

C2 requires separate authorization for adapters/composition and any necessary new versioned
Migration; do not rewrite 0036-0039. C3 requires separate authorization for real PostgreSQL tests,
upgrade/rerun/fresh installation, ordinary SQL bypass and role separation verification. Use actual
separate connections, barriers and observed waits for both orders of all fourteen scenarios.
Inject failures after status/Epoch/Credential/Session/audit steps and prove complete rollback.
Also test A-to-P inversion, CAS conflicts, counter limits, recovery without Session revival,
terminal+Epoch ordering, trusted time after waits and unknown commit reconciliation.

Role separation remains unimplemented; Compose still shares DATABASE_URL for Migration/API.
Administrative privileges can bypass ordinary triggers. Service Principal TRUNCATE remains outside
017-B protection. Historical illegal restorations are unaudited. C1 changes no SQL, Schema, Snapshot,
Migration, Adapter, Runtime Role or existing Credential/Session behavior. Historical PostgreSQL test
counts remain historical and are not a C1 database verification claim.

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
