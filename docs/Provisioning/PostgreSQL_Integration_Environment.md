# PostgreSQL Integration Environment Provisioning

## Purpose

This document is the provisioning contract for the isolated, non-production PostgreSQL
environment required to re-enter `RUNTIME-007` — Private Runtime Durable Integration
Verification. It defines the environment boundary, connection gate, migration bootstrap, and
safe evidence requirements. It does not provision a database, create credentials, or execute
`RUNTIME-007`.

```text
PCI-PROVISION-001 = COMPLETE

PRODUCTION_DATABASE = NOT REQUIRED
INTEGRATION_DATABASE = REQUIRED
INTEGRATION_DATABASE = NOT_YET_PROVISIONED
DATABASE_URL = ABSENT

RUNTIME-007 = BLOCKED_BY_ENVIRONMENT
POSTGRES_APPLICATION_INTEGRATION = NOT_VERIFIED
```

The engineering owner provisions and protects the isolated environment outside this repository.
The runtime verification owner supplies the secret through the execution environment and retains
only non-secret verification evidence.

## Environment Boundary

| Environment                              | Permitted use                                                 |
| ---------------------------------------- | ------------------------------------------------------------- |
| Local developer integration environment  | Permitted when isolated and explicitly marked for integration |
| CI integration environment               | Permitted when the secret is supplied by the CI secret store  |
| Dedicated shared integration environment | Permitted when access and test-data isolation are controlled  |
| Production                               | Forbidden for this contract and for `RUNTIME-007`             |

The target must be a dedicated non-production integration database. Prefer database-per-run where
an external test orchestrator provides it; otherwise use a dedicated isolated integration database.
Neither option may contain or mutate production data. A database name alone is not the isolation
strategy; it is one deliberately conservative guard in addition to the explicit environment marker.

## Requirements

The external provisioner supplies all of the following outside the repository:

```text
Database engine = PostgreSQL
Host
Port
Database name
Username
Password or approved authentication mechanism
SSL mode, when the provisioned environment requires it
DATABASE_URL = <PROVISIONED_SECRET>
PCI_INTEGRATION_DATABASE=1
```

`DATABASE_URL` is the canonical integration-test connection input. It is read by
`drizzle.config.ts`, `scripts/database/migrate.ts`, the PostgreSQL persistence adapters, and
`tests/persistence/private-identity-foundation-postgres.integration.test.ts`. The new
`pnpm db:integration:check` gate consumes it before `RUNTIME-007` re-entry.

```text
MIN_POSTGRES_VERSION = VERSION_REQUIREMENT_NOT_YET_EXPLICIT
TESTED_POSTGRES_VERSION = PostgreSQL 17 (historical Podman evidence)
```

The repository does not currently declare a minimum supported PostgreSQL version. PostgreSQL 17
is historical test evidence only; it is not a newly frozen compatibility promise.

## Security Rules

`DATABASE_URL` is secret-bearing configuration:

```text
never commit
never print
never log
never include in documentation
never include credential fragments in failure output
```

Do not modify `.env`, `.env.example`, CI secrets, cloud accounts, firewall rules, or production
credentials for this task. Do not connect the verification to production. The preflight emits only
generic failure guidance and, on success, the PostgreSQL server version; it does not emit a
database name, host, URL, username, password, or SSL details.

## Migration Bootstrap

After an external owner has created an empty isolated integration database:

1. Supply `DATABASE_URL` and `PCI_INTEGRATION_DATABASE=1` in the process environment, outside
   the repository.
2. Run `pnpm db:migrate`.
3. Run `pnpm db:integration:check`.
4. Only after the preflight passes, run
   `pnpm vitest run tests/persistence/private-identity-foundation-postgres.integration.test.ts`
   to re-enter `RUNTIME-007`.

No test or script in this contract creates a PostgreSQL server, database, user, cloud instance, or
hosted service. Podman is available on the local workstation, but the repository has no approved
containerized provisioning convention for this task; it is therefore only an externally operated
optional local method, not an automated repository behavior.

The migration journal at `database/migrations/meta/_journal.json` is the ordering source of truth.
Its current sequence is `0000` through `0022`. The Stage 2 Identity Foundation sequence is:

```text
0016_stage2_identity_core
0017_stage2_account_identity_membership
0018_stage2_commerce_profile_core
0019_stage2_legacy_subject_mapping
0020_stage2_commerce_reference_core
0021_stage2_external_platform_account_core
0022_stage2_commerce_relationship_core
```

The bootstrap must create the current schema and its Drizzle migration metadata
(`drizzle.__drizzle_migrations`) through the normal migration path.

## Preflight Contract

Run:

```text
pnpm db:integration:check
```

The command runs the existing migration-integrity check and then:

1. Requires `DATABASE_URL`.
2. Requires `PCI_INTEGRATION_DATABASE=1`.
3. Requires a PostgreSQL connection URL.
4. Requires a database name containing `integration`.
5. Connects through the production PostgreSQL adapter path.
6. Verifies PostgreSQL readiness and reports only server version on success.
7. Verifies the applied migration count matches the current migration journal.
8. Verifies required Stage 2 tables, PK/FK/UNIQUE/CHECK constraints, and the unique partial
   active-relationship index.

The required durable tables are:

```text
identities
commerce_profiles
commerce_references
external_platform_accounts
commerce_relationships
```

Schema validation confirms the foreign keys, namespace and reference uniqueness constraints,
lifecycle and role checks, and the unique partial index:

```text
commerce_relationships_one_active_account_unique
WHERE lifecycle = 'ACTIVE'
```

Failure semantics are deliberate:

| Condition                                                           | Result                                                   |
| ------------------------------------------------------------------- | -------------------------------------------------------- |
| `DATABASE_URL` absent                                               | Non-zero generic blocked failure                         |
| Marker absent or database name fails guard                          | Non-zero generic blocked failure                         |
| URL invalid, server unreachable, authentication fails, or SSL fails | Non-zero generic blocked failure                         |
| Migration state or schema is incomplete                             | Non-zero generic blocked failure                         |
| All checks pass                                                     | Non-secret success output; `RUNTIME-007` may be executed |

The integration test itself retains its existing behavior: it skips only when `DATABASE_URL` is
absent, runs when it is available, and fails when a real database error occurs. It must not catch
connection failures and treat them as a skip.

### Local Verification Evidence

On 2026-08-26, this preflight was executed against an isolated, temporary Podman PostgreSQL 17
container bound only to the local loopback interface. The standard repository migration path
completed, followed by a passing `pnpm db:integration:check`. The container was removed immediately
after verification. No persistent integration database, URL, credential, host, port, or container
identifier is recorded by this evidence.

PostgreSQL truncates identifiers longer than 63 bytes. The preflight therefore validates required
constraints using PostgreSQL catalog semantics—source table, constraint type, definition, and FK
reference target—rather than relying on generated FK constraint names that PostgreSQL may truncate.

## Verification Checklist

```text
[ ] non-production PostgreSQL provisioned
[ ] DATABASE_URL supplied outside repository
[ ] PCI_INTEGRATION_DATABASE=1 supplied outside repository
[ ] connection succeeds
[ ] credentials are not logged
[ ] migrations applied
[ ] migration state current
[ ] identity table exists
[ ] profile table exists
[ ] reference table exists
[ ] external account table exists
[ ] relationship table exists
[ ] FK constraints exist
[ ] uniqueness constraints exist
[ ] active relationship partial uniqueness exists
[ ] lifecycle CHECK constraints exist
[ ] test data isolation confirmed
[ ] RUNTIME-007 command can run
```

## RUNTIME-007 Re-entry

`RUNTIME-007` is unblocked only when all of the following are true:

```text
non-production PostgreSQL is reachable
DATABASE_URL is supplied outside the repository
PCI_INTEGRATION_DATABASE=1 is supplied
migrations are current
schema checks pass
RUNTIME-007 integration command can execute
```

The re-entry evidence must include connection success, PostgreSQL server version, migration state,
schema/preflight result, real integration-test result, transaction rollback evidence, and constraint
enforcement evidence. It must not include `DATABASE_URL`, credentials, credential screenshots, or
secret-bearing logs.

## Scope Boundary

This is an engineering provisioning gate only:

```text
Public API = NOT IMPLEMENTED
Resolver = NOT IMPLEMENTED
QR = NOT IMPLEMENTED
OAuth = NOT IMPLEMENTED
External Platform Runtime Binding = NOT IMPLEMENTED
External Platform Verification Runtime = NOT IMPLEMENTED
Event / Outbox = NOT IMPLEMENTED
Real Money = NOT AUTHORIZED
```

`VS01_COMPATIBILITY = PRESERVED` and `MIGRATION = NOT IMPLEMENTED`.
