# PCI-ENG-017-C3-1P - Isolated Operations Role Test Baseline

This document records the reusable isolated PostgreSQL role fixture and the sanitized evidence from the C3-1P run. The fixture uses only test tables and test functions; it does not run repository migrations and does not alter the Operations schema.

## Reusable tooling

- Initialization and verifier: `scripts/database/operations-role-permission-verifier.ts`
- Independent integration test: `tests/integration/operations-role-permissions-postgres.integration.test.ts`
- Explicit execution gate: `PCI_RUN_ISOLATED_ROLE_TESTS=1`
- Evidence output is enabled with `PCI_ROLE_EVIDENCE_PATH`; generated reports contain no passwords.

The test creates five disposable roles, two function schemas, and `business_fixture` tables in a temporary PostgreSQL container. Migration and Runtime use separate authenticated connections. Runtime receives only `operations_api` USAGE and no function EXECUTE grant. Fixture cleanup is container removal; no named or user volume is used.

## Sanitized execution evidence

- Image: `docker.io/library/postgres:17-alpine`
- Image digest: `sha256:af194ccf3e2d7fe367012c7b88ce8b816c5c889b18a5b316799a1f0d7eac746a`
- Container ID: `e5bcebf63e4d7ae6e8da2810a2561f54c75990ed4365cf1d886e6a2aaf6ad0e7`
- Database: `pci_ops_roles`
- Bind: `127.0.0.1:40233`
- Storage: `tmpfs /var/lib/postgresql/data (1 GiB), no volume`
- PostgreSQL server: `17.10`
- Podman client/server: `5.7.1 / 5.7.1`
- Independent connections: `pci_ops_migration, pci_ops_runtime`
- Repository migrations: none (fixture-only test by design)
- Test exit: Vitest `4/4 PASS`, process exit code `0`
- Cleanup command: `podman rm --force pci-ops-role-22665c835dd2`
- Cleanup result: `PASS`, exit code `0`

### Role and membership summary

The role attributes and membership options were read from pg_roles and pg_auth_members in the disposable database. Owners are NOLOGIN; Migration and Runtime are independent LOGIN roles with restricted attributes. Migration membership edges are INHERIT FALSE, SET TRUE.

```json
[
  {
    "rolname": "pci_ops_audit_reader",
    "rolcanlogin": false,
    "rolsuper": false,
    "rolcreatedb": false,
    "rolcreaterole": false,
    "rolinherit": false,
    "rolreplication": false,
    "rolbypassrls": false,
    "rolconfig": []
  },
  {
    "rolname": "pci_ops_function_owner",
    "rolcanlogin": false,
    "rolsuper": false,
    "rolcreatedb": false,
    "rolcreaterole": false,
    "rolinherit": false,
    "rolreplication": false,
    "rolbypassrls": false,
    "rolconfig": ["search_path=pg_catalog, pg_temp"]
  },
  {
    "rolname": "pci_ops_migration",
    "rolcanlogin": true,
    "rolsuper": false,
    "rolcreatedb": false,
    "rolcreaterole": false,
    "rolinherit": false,
    "rolreplication": false,
    "rolbypassrls": false,
    "rolconfig": []
  },
  {
    "rolname": "pci_ops_runtime",
    "rolcanlogin": true,
    "rolsuper": false,
    "rolcreatedb": false,
    "rolcreaterole": false,
    "rolinherit": false,
    "rolreplication": false,
    "rolbypassrls": false,
    "rolconfig": []
  },
  {
    "rolname": "pci_ops_table_owner",
    "rolcanlogin": false,
    "rolsuper": false,
    "rolcreatedb": false,
    "rolcreaterole": false,
    "rolinherit": false,
    "rolreplication": false,
    "rolbypassrls": false,
    "rolconfig": []
  }
]
```

```json
[
  {
    "member": "pci_ops_migration",
    "granted_role": "pci_ops_function_owner",
    "inherit_option": false,
    "set_option": true
  },
  {
    "member": "pci_ops_migration",
    "granted_role": "pci_ops_table_owner",
    "inherit_option": false,
    "set_option": true
  }
]
```

### PUBLIC, schema and function ACL evidence

PUBLIC schema privileges were inspected before fixture schema changes (USAGE=true, CREATE=false). The fixture schemas were then explicitly revoked from PUBLIC; Runtime has operations_api USAGE=true, operations_api CREATE=false, operations_private USAGE=false, and no function EXECUTE. Function owners use search_path=pg_catalog, pg_temp.

```json
{
  "schemas": [
    {
      "nspname": "business_fixture",
      "owner": "pci_ops_table_owner",
      "runtime_usage": false,
      "runtime_create": false
    },
    {
      "nspname": "operations_api",
      "owner": "pci_ops_function_owner",
      "runtime_usage": true,
      "runtime_create": false
    },
    {
      "nspname": "operations_private",
      "owner": "pci_ops_function_owner",
      "runtime_usage": false,
      "runtime_create": false
    }
  ],
  "functions": [
    {
      "nspname": "operations_api",
      "proname": "fixture_function",
      "runtime_execute": false,
      "acl": "{pci_ops_function_owner=X/pci_ops_function_owner}",
      "config": "{\"search_path=pg_catalog, pg_temp\"}"
    },
    {
      "nspname": "operations_private",
      "proname": "private_fixture_function",
      "runtime_execute": false,
      "acl": "{pci_ops_function_owner=X/pci_ops_function_owner}",
      "config": "{\"search_path=pg_catalog, pg_temp\"}"
    }
  ],
  "publicSchemaBefore": [
    {
      "nspname": "public",
      "public_usage": true,
      "public_create": false
    }
  ]
}
```

### Per-case SQLSTATE evidence

Every denied operation below returned PostgreSQL permission SQLSTATE 42501 over an independent authenticated connection. No Repository exception or mock supplied the result.

| Case                                     | SQL                                                                                                           | SQLSTATE | Result |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------- | ------ |
| Migration SET ROLE runtime               | `SET ROLE pci_ops_runtime`                                                                                    | 42501    | PASS   |
| Migration SET ROLE postgres              | `SET ROLE postgres`                                                                                           | 42501    | PASS   |
| Migration CREATE ROLE                    | `CREATE ROLE pci_ops_forbidden`                                                                               | 42501    | PASS   |
| Migration CREATE DATABASE                | `CREATE DATABASE pci_ops_forbidden`                                                                           | 42501    | PASS   |
| Runtime SELECT principals                | `SELECT * FROM business_fixture.principals`                                                                   | 42501    | PASS   |
| Runtime SELECT accounts                  | `SELECT * FROM business_fixture.accounts`                                                                     | 42501    | PASS   |
| Runtime INSERT principal                 | `INSERT INTO business_fixture.principals (id, status) VALUES (1, 'pending')`                                  | 42501    | PASS   |
| Runtime INSERT account                   | `INSERT INTO business_fixture.accounts (id, principal_id, status) VALUES (1, 1, 'invited')`                   | 42501    | PASS   |
| Runtime UPDATE principal status          | `UPDATE business_fixture.principals SET status = 'active'`                                                    | 42501    | PASS   |
| Runtime UPDATE account status            | `UPDATE business_fixture.accounts SET status = 'active'`                                                      | 42501    | PASS   |
| Runtime UPDATE security epoch            | `UPDATE business_fixture.principals SET security_epoch = security_epoch + 1`                                  | 42501    | PASS   |
| Runtime INSERT activation history        | `INSERT INTO business_fixture.activation_history (id, entity_kind, status) VALUES (1, 'principal', 'active')` | 42501    | PASS   |
| Runtime UPDATE activation history        | `UPDATE business_fixture.activation_history SET status = 'disabled'`                                          | 42501    | PASS   |
| Runtime DELETE activation history        | `DELETE FROM business_fixture.activation_history`                                                             | 42501    | PASS   |
| Runtime UPDATE audit                     | `UPDATE business_fixture.lifecycle_audit SET event_name = 'x'`                                                | 42501    | PASS   |
| Runtime DELETE audit                     | `DELETE FROM business_fixture.lifecycle_audit`                                                                | 42501    | PASS   |
| Runtime TRUNCATE principals              | `TRUNCATE business_fixture.principals`                                                                        | 42501    | PASS   |
| Runtime DISABLE TRIGGER                  | `ALTER TABLE business_fixture.principals DISABLE TRIGGER principals_fixture_trigger`                          | 42501    | PASS   |
| Runtime ALTER TABLE                      | `ALTER TABLE business_fixture.principals ADD COLUMN forbidden text`                                           | 42501    | PASS   |
| Runtime CREATE FUNCTION                  | `CREATE FUNCTION operations_api.runtime_function() RETURNS integer LANGUAGE sql AS 'SELECT 1'`                | 42501    | PASS   |
| Runtime REPLACE FUNCTION                 | `CREATE OR REPLACE FUNCTION operations_api.fixture_function() RETURNS integer LANGUAGE sql AS 'SELECT 1'`     | 42501    | PASS   |
| Runtime CREATE SCHEMA                    | `CREATE SCHEMA runtime_forbidden`                                                                             | 42501    | PASS   |
| Runtime GRANT                            | `GRANT SELECT ON business_fixture.principals TO pci_ops_runtime`                                              | 42501    | PASS   |
| Runtime REVOKE                           | `REVOKE SELECT ON business_fixture.principals FROM PUBLIC`                                                    | 42501    | PASS   |
| Runtime SET ROLE table owner             | `SET ROLE pci_ops_table_owner`                                                                                | 42501    | PASS   |
| Runtime SET ROLE function owner          | `SET ROLE pci_ops_function_owner`                                                                             | 42501    | PASS   |
| Runtime SET ROLE migration               | `SET ROLE pci_ops_migration`                                                                                  | 42501    | PASS   |
| Runtime shadow schema object             | `CREATE TABLE operations_api.runtime_shadow (id integer)`                                                     | 42501    | PASS   |
| Runtime execute non-whitelisted function | `SELECT operations_api.fixture_function()`                                                                    | 42501    | PASS   |
| Runtime private schema access            | `SELECT operations_private.private_fixture_function()`                                                        | 42501    | PASS   |

The complete sanitized JSON record is retained in `124_Operations_Isolated_Role_Test_Baseline.evidence.json`. No password, connection URL, or secret environment value is retained.

## Boundary

This evidence proves only the disposable role and permission fixture. It does not prove permissions on actual Operations lifecycle tables, production credential separation, lifecycle atomicity, the 14 business concurrency scenarios, C2-1/C2-2, full C3, Authentication Runtime, MFA, RBAC, Bootstrap, Pilot, Production, or real-money security.
