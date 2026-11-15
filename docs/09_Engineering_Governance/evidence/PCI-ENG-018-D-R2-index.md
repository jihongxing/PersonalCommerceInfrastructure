# PCI-ENG-018-D-R2 Evidence Index

Status: `PCI-ENG-018-D-R2 = BLOCKED — MAIN CONTROLLER REVIEW REQUIRED`

This evidence record covers the bounded Login permission-contract alignment and retirement of
the five legacy Static Operations Token Catalog routes. It preserves the PCI-ENG-018-D-R1
implementation, PostgreSQL evidence, and failure records; it does not change Schema, Migration,
Session, Creator Auth, Offering/Request, RBAC, or production configuration.

## Baseline and Scope

- Branch: `codex/pci-eng-015-b-r2-persistence-closure`
- HEAD: `99abd6c0b83e7e5eeec38477e88be552cefec76e`
- Parent: `59f958559900ed3ead68ef57b875fcd79346d8dc`
- R1 PostgreSQL evidence remains under `PCI-ENG-018-D-R1-index.md` and its linked JSON files.
- No staged changes or commit were created by R2.

R2 source/test changes are limited to the canonical seven-permission contract, Login response
serialization, the five retired route handlers, their integration assertions, the contract test,
and the Browser evidence harness.

## Permission Contract Evidence

`modules/operations-identity/operations-identity-contract.ts` now owns the canonical tuple:

```text
catalog:read
audit:read
offering:read
request:read
catalog:draft:create
catalog:draft:update
catalog:policy:activate
```

`applications/operations-identity/operations-human-authentication.ts` reuses that tuple for the
runtime response, and `contracts/api/v1/operations-human-authentication-contracts.ts` derives a
closed TypeBox literal union from it. The contract test records two PASS cases: all seven values
are accepted and `admin:*` is rejected. The focused API test also returned the seven values from
the Login/Session path.

## Legacy Route Evidence

The following routes now return HTTP `410` with stable code
`legacy_catalog_operations_route_retired` before authentication or business access:

1. `GET /api/v1/operations/service-policy/workspace`
2. `GET /api/v1/operations/service-policy/audit`
3. `PATCH /api/v1/operations/service-policy/capabilities/:id`
4. `PATCH /api/v1/operations/service-policy/templates/:id`
5. `POST /api/v1/operations/service-policy/releases`

`tests/integration/service-policy-api.test.ts` passed both Creator catalog immutability and the
retirement matrix. The real Browser harness independently exercised all five routes with valid
and invalid static bearer values plus forged Principal/Permission headers. All 15 probes returned
`410` and the catalog release/capability/template/audit count and hash snapshots were identical
before and after. The structured record is
`PCI-ENG-018-D-browser-1794765078746.json`.

## Browser and PostgreSQL Provenance

The successful read-only Browser run used the existing gstack `/browse` HeadlessChrome driver,
the existing Next/BFF/Fastify chain, and disposable PostgreSQL 17.10. It completed login,
authoritative seven-permission Session identity, Catalog list/detail, Audit list/detail, logout,
and post-logout protection with process exit `0`; evidence is
`PCI-ENG-018-C-browser-1794765242183.json`.

The D management Browser run used the same chain and disposable fixture. Login and the seven
permissions passed, and all retired-route probes passed, but the pre-existing D management flow
failed at `POST /api/v1/operations/admin/catalog/drafts/:version/preview` with HTTP `500`
(`internal_error`) after Draft Create and Draft Update. The process exited `1`, cleanup exited
`0`, and the retained record is `PCI-ENG-018-D-browser-1794765078746.json`; its PostgreSQL
provenance is `PCI-ENG-018-D-pci-018br1-fd0e4cf8f1-postgres.json`.

That Preview failure is outside the R2 Login-schema/legacy-route change and is not reclassified
as pre-existing without a parent comparison. It blocks the requested full D Browser acceptance.

The disposable fixture records PostgreSQL 17.10, image
`docker.m.daocloud.io/library/postgres:17.10-alpine`, image digest
`sha256:af194ccf3e2d7fe367012c7b88ce8b816c5c889b18a5b316799a1f0d7eac746a`, Podman client/server
5.7.1, container `27d0db679cce8fb14405c5441bf8504c38b0f7be36e93c843c5cc9f6dd6de0f6`, dynamic
port `127.0.0.1:40531`, database `pci_ops_migration_fixture_admin_1`, and PostgreSQL server
17.10. Its cleanup command was `podman rm --force --volumes pci-018br1-fd0e4cf8f1` (exit `0`);
the exact-name residual check returned no rows (exit `0`).

## Focused Quality Results

| Check                                      | Result                             |
| ------------------------------------------ | ---------------------------------- |
| Permission contract tests                  | 2/2 PASS                           |
| Operations Human Authentication API        | 1/1 PASS                           |
| Legacy service-policy API                  | 2/2 PASS                           |
| Draft application/API tests                | 5/5 PASS                           |
| API TypeScript (`tsconfig.api.build.json`) | PASS, exit `0`                     |
| Active backend test TypeScript             | PASS, exit `0`                     |
| R2 changed-file Prettier                   | PASS                               |
| Real Browser read-only C path              | PASS, exit `0`                     |
| Real Browser D management path             | FAIL, exit `1` at Preview HTTP 500 |

`tests/integration/api-runtime.test.ts` still has an existing OpenAPI path-list failure caused by
the already-present D/E/F Operations routes; it was not changed or reclassified by R2. Full lint
and full repository verification remain outside scope and are not claimed green.

## Boundaries

No Schema, Migration, database ACL, Session, Creator Auth, Offering/Request, RBAC, Production,
Pilot, or Real Money change was made. No commit or push was performed. Main Controller review is
required for the unrelated Preview failure before D can be accepted.
