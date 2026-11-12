# 123 - Operations Identity Persistence Baseline

> **Task:** `PCI-ENG-015-B`
> **Decision dependency:** `PCI-ENG-014_ARCHITECTURE = APPROVED`; `PCI-ENG-015-A_DOMAIN_CONTRACT = ACCEPTED`
> **Implementation state:** `PCI-ENG-015-B_PRINCIPAL_PERSISTENCE = IMPLEMENTED / ACCEPTED`; `PCI-ENG-016-B_CREDENTIAL_PERSISTENCE = ACCEPTED`
> **Effective date:** 2026-11-12
> **Scope:** PostgreSQL schema, migrations, repository ports/adapters and disposable PostgreSQL verification

This document records the accepted bounded persistence foundations for the Operations Human and Machine
identity domain. PCI-ENG-015-B remains limited to the three Principal/Account persistence categories;
PCI-ENG-016-B adds only the accepted Password Credential persistence boundary and its recorded evidence.
It is an implementation and evidence record. It does not create Founder approval for authentication,
sessions, password verification/reset, permissions, Admin API integration, external Pilot, production
or real-money operation.

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

The following remain outside the accepted persistence units and are not implemented:

```text
OPERATIONS_CREDENTIAL_PERSISTENCE = IMPLEMENTED / ACCEPTED (PCI-ENG-016-B)
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
administrator invitation, credential issuance, login, session creation, permission grant, Provider /
System runtime migration, Admin mutation, Pilot, production or real-money use. Those decisions remain
with the Main Controller and Founder according to the existing authority hierarchy.

## 5. Follow-on decisions

Before any authentication or Operations runtime implementation, the Main Controller/Founder must
confirm the first Principal and Bootstrap Authority, administrator invitation policy, credential and
session design, permission registry and high-risk controls. Each follow-on unit must state its own
authorization level (`D`, `L`, `I`, `P`, `R` or `M`) and must not infer a higher level from this
persistence evidence.
