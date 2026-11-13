# 125 - Operations Migration Bootstrap Baseline

Status: PCI-ENG-017-C2-1P-R1 implementation completed - awaiting Main Controller review
Date: 2026-11-13

This document records the bounded installation infrastructure delivered by
PCI-ENG-017-C2-1P-R1. It is an engineering and evidence baseline, not an approval to run
Migration 0040, to resume C2-1, or to enable an Operations Authentication Runtime.

## 1. Scope and control state

The unit adds a separately provisioned Journal bootstrap, a role-context migration wrapper,
pure permission and Journal-contract checks, and a disposable PostgreSQL integration test. It
does not modify `scripts/database/migrate.ts`, Migrations 0036-0039, Migration 0040, the
Operations schema drafts, Creator Auth, Session/Credential runtime, MFA, RBAC, BFF, deployment,
Pilot, Production, or real-money capability.

The wrapper accepts only loopback URLs for a database named
`pci_ops_migration_fixture_*`, authenticated as `pci_ops_migration`, and a reviewed manifest.
There is no production or 0040 execution policy in this unit. The four unchanged historical
migration hashes are pinned in the wrapper:

| Migration                                          | SHA-256                                                            |
| -------------------------------------------------- | ------------------------------------------------------------------ |
| 0036_operations_principal_persistence              | `e32c149f080fe8d9e498b109b6136d0f33d58e29a5aa30efdc8304a0454ca286` |
| 0037_operations_credential_persistence             | `bc409153eededb45c8132f324242b08f55019b3e79c7d16311ff2c0132ee12e0` |
| 0038_operations_session_persistence                | `344196ebc3a1c91afa710a7f399e55119a394e992915792c882c031f8f817594` |
| 0039_operations_identity_terminal_state_protection | `7fba8a695294bb2abf2c98e790d72f92b33451909691e5e2b60d72366621e363` |

The only executable non-legacy SQL is the fixed, synthetic installation fixture exported by the
wrapper. It creates test History/Audit tables and two fixed SECURITY DEFINER functions. It is not
the C2-1 History/Audit schema and cannot be used to infer that Migration 0040 is approved.

The project control state remains:

```ini
PCI-ENG-017-C2-1 = BLOCKED / IMPLEMENTATION INCOMPLETE
PCI-ENG-017-C2-1P-R1 = IMPLEMENTATION COMPLETED — AWAITING MAIN CONTROLLER REVIEW
PCI-ENG-017-C2-2 = NOT AUTHORIZED
PCI-ENG-017-C3 = NOT AUTHORIZED
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

## 2. Roles and provisioning boundary

The disposable fixture uses these fixed identities:

| Role                     | Login             | Purpose and effective boundary                                                                                                   |
| ------------------------ | ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `pci_ops_bootstrap`      | temporary LOGIN   | SET-only access to Journal Owner; temporary database CREATE is granted and then revoked by provisioning SQL                      |
| `pci_ops_journal_owner`  | NOLOGIN           | Owns only `drizzle`, the Journal table, its serial sequence and PostgreSQL-owned Journal index/TOAST objects                     |
| `pci_ops_table_owner`    | NOLOGIN           | Owns table-stage fixture objects                                                                                                 |
| `pci_ops_function_owner` | NOLOGIN           | Owns fixed fixture functions; the test grants only the approved `operations_human_principals.status` column update where needed  |
| `pci_ops_migration`      | independent LOGIN | Journal SELECT/INSERT/sequence USAGE and explicit `SET TRUE`, `INHERIT FALSE` membership to Table/Function/Legacy fixture owners |
| `pci_ops_runtime`        | independent LOGIN | No owner membership and no Journal or fixture-function access                                                                    |
| `pci_ops_audit_reader`   | NOLOGIN           | Restricted role present in the role isolation fixture; no runtime or migration elevation                                         |

`journalProvisioningSql` is separate from the bootstrap and runner. It creates only the fixed
Journal Owner and its temporary membership/Database CREATE grant; it does not create arbitrary
roles or accept role/object names from a caller. `journalProvisioningCleanupSql` revokes Database
CREATE and membership and sets the Bootstrap role to `NOLOGIN`. The integration test verifies
that cleanup result. Production role provisioning is not changed.

## 3. Journal contract and Bootstrap behavior

`bootstrapMigrationPrerequisites` requires an independently authenticated restricted Bootstrap
session. It checks the fixed membership, obtains `SET LOCAL ROLE pci_ops_journal_owner`, takes
the installation advisory lock, and creates the Journal only when the schema is absent and the
temporary Database CREATE prerequisite is true. It then revokes PUBLIC access and grants the
exact Migration ACL:

```text
drizzle schema:             pci_ops_migration USAGE
__drizzle_migrations:      pci_ops_migration SELECT, INSERT
__drizzle_migrations_id_seq: pci_ops_migration USAGE
```

An existing schema/table/sequence is inspected and never repaired, adopted, dropped, or reset.
The verifier requires the Drizzle three-column shape (`id serial`, `hash text NOT NULL`,
`created_at bigint`), primary key, serial dependency, integer sequence bounds/increment/cache,
owners, exact ACL, no row-level security, no Database CREATE for Migration, and an identifiable
ordered Journal history containing only reviewed hashes. Unexpected Journal Owner objects and
extra columns/ACLs fail closed. PostgreSQL-owned TOAST objects and the Journal primary-key index
are the only related objects excluded from the unrelated-owner check.

## 4. Role-context wrapper

`migrateWithRoleContext` uses `readMigrationFiles()` for Drizzle hashes, statement-breakpoint
parsing and folder timestamps. It uses a dedicated postgres-js pool with one connection and the
native `begin(tx => ...)` API. Every migration has its own transaction; successful earlier
migrations remain committed when a later one fails. This per-migration transaction boundary is
intentional for this controlled wrapper and is not a change to the existing generic runner.

Within one transaction and one backend PID the wrapper performs:

1. Migration identity and Journal/manifest/history verification;
2. the fixed advisory lock;
3. explicit membership validation followed by `SET LOCAL ROLE` for the Table or Function stage;
4. SQL execution and `RESET ROLE` between stages;
5. Migration identity verification and Journal INSERT;
6. COMMIT and post-transaction identity confirmation.

Legacy 0036-0039 Fresh Fixture execution uses the non-superuser `pci_ops_legacy_owner`; Upgrade
Fixtures leave those rows and owners in place and skip already recorded hashes. Unknown SQL,
unknown hashes, duplicate hashes, timestamp gaps, Journal gaps, missing membership and identity
drift are rejected. No fallback to arbitrary Migration-role DDL exists.

When a server error proves rollback, the wrapper reports `not_committed` and records whether a
fresh identity check succeeded. A connection error or a lost COMMIT response is `unknown`; the
dedicated pool is destroyed and no retry is attempted. The final implementation also guards the
postgres-js 3.4.9 closed-socket rollback race so an unknown outcome does not create an unhandled
client exception. Callers must reconnect and reconcile the Journal before retrying.

## 5. Verification evidence

The repository integration test is gated by `PCI_RUN_MIGRATION_BOOTSTRAP_TESTS=1` and writes a
sanitized report when `PCI_MIGRATION_EVIDENCE_PATH` is set. The final run was:

```text
node node_modules/vitest/vitest.mjs run tests/integration/operations-migration-bootstrap-postgres.integration.test.ts
Test Files  1 passed (1)
Tests      13 passed (13)
Process exit code 0
```

The final report was retained outside the repository at
`E:/User/jihx/AppData/Local/Temp/pci-c21pr1-XejuU0/final-evidence.json`.

### Permission and failure matrix

| Coverage                                                | Expected SQLSTATE/result                              | Evidence                                                           |
| ------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------ |
| Journal DML/DDL/SET denied to Migration                 | `42501`                                               | UPDATE, DELETE, TRUNCATE, CREATE TABLE and SET Journal Owner cases |
| Runtime owner/Journal/function access denied            | `42501`                                               | independent Runtime connection matrix                              |
| Table/Function Owner membership missing                 | `CONTRACT_REJECTED`; direct SET `42501`               | fail-closed tests                                                  |
| Wrong Journal owner/columns/sequence/ACL/extra object   | `CONTRACT_REJECTED`                                   | Bootstrap and wrapper reject without repair                        |
| Unknown or duplicate Journal history / unreviewed SQL   | `CONTRACT_REJECTED`                                   | history and manifest tests                                         |
| Terminal trigger disable and terminal row update/delete | `42501` / `23514`                                     | Fresh/Upgrade legacy-owner test                                    |
| Function Owner `FOR UPDATE` and status-column update    | `00000`                                               | approved column grant                                              |
| Function Owner epoch/other-column/Account update        | `42501`                                               | negative column ACL tests                                          |
| SQL failure                                             | `P0001`, `not_committed`                              | marker table absent, Journal unchanged                             |
| Journal INSERT failure                                  | `P0001`, `not_committed`                              | trigger-injected failure                                           |
| Deferred COMMIT FK failure                              | `23503`, `not_committed`                              | marker/child tables absent                                         |
| Callback failures before SET/after SQL/before RESET     | `CLIENT_ERROR`, `not_committed`                       | role restored and pool destroyed                                   |
| Connection loss before RESET or Journal                 | `CONNECTION_CLOSED`, `unknown`                        | Journal remains at 0; no retry                                     |
| Lost COMMIT reply                                       | `CONNECTION_CLOSED`, `unknown`                        | fixture marker and Journal row remain; reconnect required          |
| Bootstrap cleanup                                       | role `NOLOGIN`, no Journal membership/Database CREATE | cleanup assertion and evidence                                     |

The same run recorded `session_user = pci_ops_migration` throughout the migration transaction,
backend PID equality across Table/Function fixture evidence, and `current_user` transitions to
the fixed owner roles and back. The Function Owner functions are owned by
`pci_ops_function_owner` and are `SECURITY DEFINER`; Runtime has no EXECUTE grant.

Environment metadata retained in the sanitized report:

- Image: `docker.io/library/postgres:17-alpine`;
- Image digest: `sha256:af194ccf3e2d7fe367012c7b88ce8b816c5c889b18a5b316799a1f0d7eac746a`;
- PostgreSQL Server: `17.10`;
- Podman Client/Server: `5.7.1 / 5.7.1`;
- Container ID: `5faedc373239ad0ed4b28d3dd2410e23d8cd0beb4cb4f1dbf73ec476a157c8ab`;
- Bind: `127.0.0.1:41117`;
- Storage: 1 GiB tmpfs at `/var/lib/postgresql/data`, no named/user volume;
- Cleanup: `podman rm --force pci-c21pr1-12ebbba272b7`, exit code 0;
- Remaining task-labeled containers: `[]`.

The existing C3 role-permission integration regression was also run with its explicit gate and
completed `4/4 PASS`, exit code 0, against its own disposable PostgreSQL fixture. It does not run
repository migrations.

## 6. Static checks and limitations

Passed for this change unit:

- production/core TypeScript (`tsconfig.build.json --noEmit`);
- API TypeScript (`tsconfig.api.build.json --noEmit`);
- active backend test TypeScript (`tsconfig.active-tests.json --noEmit`);
- changed-file ESLint;
- Prettier on the four new TypeScript files;
- production build (`tsconfig.build.json`);
- integration tests and C3 role regression described above;
- `git diff --check`.

The full repository lint baseline was not rerun for this unit. The fixture does not prove every
possible PostgreSQL scheduling interleaving is deadlock-free; it proves the executed scenarios.
The Journal Owner and role boundaries are disposable-fixture evidence, not production permission
certification. A database superuser or equivalent administrator can bypass ordinary PostgreSQL
ACL/trigger protections. Runtime Role/Migration Role separation in deployed Compose remains a
separate approved unit. No real 0040 SQL was executed, no C2-1 persistence behavior was resumed,
and no Authentication Runtime, login, Session Credential, MFA, RBAC, BFF, Pilot, Production or
real-money authorization is implied.

## 7. Files and review status

This unit adds only:

- `scripts/database/operations-migration-permissions.ts`;
- `scripts/database/bootstrap-migration-prerequisites.ts`;
- `scripts/database/migrate-with-role-context.ts`;
- `tests/integration/operations-migration-bootstrap-postgres.integration.test.ts`;
- this governance document.

The seven pre-existing C2-1 draft files remain uncommitted and unchanged. Their presence does not
make Migration 0040 accepted or runnable. The final state is
`PCI-ENG-017-C2-1P-R1 = IMPLEMENTATION COMPLETED — AWAITING MAIN CONTROLLER REVIEW`.

## PCI-ENG-017-C2-1 Activation History Persistence Foundation - resumed completion

Authority: PCI Main Controller's PCI-ENG-017-C2-1-RESUME instruction. This section is appended after the earlier blocked C2-1 record and does not rewrite that history.

```ini
PCI-ENG-017-C2-1 = IMPLEMENTATION COMPLETED - AWAITING MAIN CONTROLLER REVIEW
PCI-ENG-017-C2-2 = NOT AUTHORIZED
PCI-ENG-017-C3 = NOT AUTHORIZED
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

Migration 0040 uses the accepted C2-1P-R1 Bootstrap and Role-Context Wrapper. Its reviewed fixed policy hash is `679714aee66fed20033a70062b9b8d7cbf8d00a7a0f48a4be63c99eb559fa5ea`; statement phases, Owner roles, Journal insertion and per-migration transactions are fixed in code. Real 0040 SQL executes only in disposable PostgreSQL 17.10 fixtures. No shared or production database is connected.

The delivered foundation contains two independent activation History tables, the Lifecycle Technical Audit table, deferred Principal/Account History completeness checks, append-only Audit protection, protected History paths, status-independent `unknown` legacy backfill, and fixed SECURITY DEFINER `operations_api.create_principal`, `create_account`, and `create_principal_with_account` creation paths.

Principal creation fixes pending/Epoch 0/never_activated; Account creation fixes invited/never_activated. Callers cannot supply status, Epoch, history or origin. Function Owner receives only the approved bounded access; Runtime receives no new lifecycle function EXECUTE or History/Audit access. Existing terminal identity rows remain unchanged.

Final disposable Upgrade and Fresh verification recorded 5 legacy Principals and 5 legacy Accounts as `unknown`/`legacy_backfill`, with 10 independent legacy initialization Audits. The C2-1 test completed 12/12; C2-1P-R1 regression completed 13/13; C3-1P regression completed 4/4. Sanitized evidence is retained at `E:/User/jihx/AppData/Local/Temp/pci-c21-resume-final-evidence.json`.

This unit does not implement lifecycle transaction adapters, activation/recovery/terminal business transitions, Credential or Session lifecycle, Authentication Runtime, MFA, RBAC, BFF, Bootstrap Authority, Pilot, Production or real-money authorization. Migration/Runtime deployment-role separation remains separately governed.
