# 123 - Operations Identity Persistence Baseline

> **Task:** `PCI-ENG-015-B`
> **Decision dependency:** `PCI-ENG-014_ARCHITECTURE = APPROVED`; `PCI-ENG-015-A_DOMAIN_CONTRACT = ACCEPTED`
> **Implementation state:** `PCI-ENG-015-B_PRINCIPAL_PERSISTENCE = IMPLEMENTED / ACCEPTED`
> **Effective date:** 2026-11-12
> **Scope:** PostgreSQL schema, migrations, repository ports/adapters and disposable PostgreSQL verification

This document records the accepted bounded persistence foundation for the Operations Human and Machine
identity domain. Acceptance is limited to the three Principal/Account persistence categories and the
recorded verification evidence. It is an implementation and evidence record. It does not create Founder approval
for authentication, sessions, credentials, permissions, Admin API integration, external Pilot,
production or real-money operation.

## 1. Persisted boundary

Exactly three new tables are part of this unit:

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

The following remain outside this unit and are not implemented:

```text
OPERATIONS_CREDENTIAL_PERSISTENCE = NOT IMPLEMENTED
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
