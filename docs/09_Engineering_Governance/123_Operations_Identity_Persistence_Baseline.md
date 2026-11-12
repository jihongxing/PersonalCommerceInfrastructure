# 123 - Operations Identity Persistence Baseline

> **Task:** `PCI-ENG-015-B`
> **Decision dependency:** `PCI-ENG-014_ARCHITECTURE = APPROVED`; `PCI-ENG-015-A_DOMAIN_CONTRACT = ACCEPTED`
> **Implementation state:** `PCI-ENG-015-B_PRINCIPAL_PERSISTENCE = IMPLEMENTED / ACCEPTED`; `PCI-ENG-016-B_CREDENTIAL_PERSISTENCE = ACCEPTED`
> **Session acceptance:** `PCI-ENG-016-C0 = ACCEPTED`; `PCI-ENG-016-C1 = ACCEPTED`; `PCI-ENG-016-C1-E2 = ACCEPTED`; `PCI-ENG-016-C2 = ACCEPTED`; `PCI-ENG-016-C2-E2 = ACCEPTED`
> **Effective date:** 2026-11-12
> **Acceptance ledger update:** 2026-11-13 — PCI-ENG-016-C2-E2
> **Scope:** PostgreSQL schema, migrations, repository ports/adapters and disposable PostgreSQL verification

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
