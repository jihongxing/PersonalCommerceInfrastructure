# Production Compose database bootstrap

`FD-PCI-DEPLOY-001` owns this deployment change. The Compose file is for a dedicated PostgreSQL
cluster; it must not be pointed at a shared or externally managed database. This bootstrap does not
authorize production deployment, Operations Human activation, external pilot, or real-money traffic.

## Start and restart

Prepare a restricted environment file from `deploy/.env.production.example`. Use distinct random
installer, migration, API, and BFF database passwords. Percent-encode special characters in URI
passwords; the installer password is a raw value. All three database URLs must use their designated
username and `postgres:5432/personal_commerce`, without options. Supply secrets at runtime, not as
public build arguments. Set the BFF allowed origin and browser API URL to the intended external
addresses. Set the public build argument `NEXT_PUBLIC_WEB_ORIGIN` to the Creator HTTPS origin for
generated homepage links; keeping it unset suppresses link generation. `Secure` cookies require
HTTPS for real deployment; Compose publishes Web and API on
loopback for the reverse proxy. `REAL_MONEY_ENABLED` remains `false`.

```sh
docker compose --env-file /secure/path/pci.env -p pci -f deploy/compose.production.yml config --quiet
docker compose --env-file /secure/path/pci.env -p pci -f deploy/compose.production.yml up -d --build
docker compose --env-file /secure/path/pci.env -p pci -f deploy/compose.production.yml ps -a
```

Expect PostgreSQL, API and Web to be healthy and `migrate` to exit 0. For a planned same-volume
restart or deployment, stop the stack with `down` **without** `--volumes`, take a verified backup,
then run `up`. This reruns the gate even if an old exited migration container previously succeeded.
Do not use `up --no-deps`, `restart`, or the generic development `db:migrate` as a replacement for
the deployment gate. Avoid logging resolved Compose configuration or container environments.

The delivery candidate also supports trusted `ready` volumes from PCI-ENG-023. After validating
their catalog fingerprint, full Journal and separated logins, the installer adds only the API UPDATE
grants for `commerce_actions.fulfillment_status` and `commerce_actions.fulfillment_confirmed_at`
when both are absent. It records the new fingerprint in the same transaction. It does not replay
migrations, adopt unmarked volumes, or repair catalog drift.

## Identity and transaction boundaries

| Identity                  | Responsibility                                                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `personal_commerce`       | PostgreSQL installer/admin; prepares roles, schemas and extension, verifies catalog and grants. Not injected into API or Web.                                |
| `pci_ops_bootstrap`       | Independent temporary LOGIN, random expiring credential and SET-only Journal Owner membership. Disabled and password cleared before migrations.              |
| `pci_ops_journal_owner`   | NOLOGIN; owns `drizzle`, the Journal and its dependent objects only.                                                                                         |
| `pci_ops_migration`       | Separate LOGIN; SET-only access to approved DDL owners, Journal SELECT/INSERT and serial USAGE. No journal ownership, cluster grants or grant options.       |
| `pci_app_object_owner`    | NOLOGIN; owns ordinary application objects from 0000–0035 and 0042. Its installation-only `CREATE` on `public` is revoked before the volume is marked ready. |
| `pci_ops_legacy_owner`    | NOLOGIN; owns 0036–0039 and the reviewed legacy DDL in 0041.                                                                                                 |
| `pci_ops_table_owner`     | NOLOGIN; reviewed activation audit/history and 0041 table-stage SQL.                                                                                         |
| `pci_ops_function_owner`  | NOLOGIN; owns `operations_private` and `operations_api` and executes reviewed function-stage SQL.                                                            |
| `pci_api_runtime`         | LOGIN; current Shared API auth, Creator/Public, Core, Program and wired Paid/Pilot SQL only.                                                                 |
| `pci_creator_bff_runtime` | LOGIN; Creator Web Session SELECT/INSERT/UPDATE projections only; no DELETE, business data, Journal, project routines or sequences.                          |
| `pci_ops_runtime`         | Independent restricted LOGIN for the existing Operations Human auth/session SQL. Only provisioned and connected when explicitly enabled.                     |

The official PostgreSQL entrypoint writes the marker only on a fresh volume. A TCP health check
waits for entrypoint initialization to finish before the installer connects. The installer serializes
provisioning, rejects a non-pristine first boot, and installs `btree_gist` for 0030. The cluster's
unused `postgres` and `template1` databases do not accept ordinary PUBLIC connections. Public schema
and project routine grants are scoped on the new application database; built-in `pg_catalog`
behavior is not changed.

The manifest pins the indexed original tags, timestamps and Drizzle SQL hashes. Journal rows are
compared in database `id` order (including 0025 and 0036 timestamp inversions). DDL and Journal writes
commit together at boundaries 40, 41 and 45. Temporary 0040 `MAINTAIN` on two legacy tables is granted
and revoked within the same transaction; a rollback cannot leave it installed. 0041 still logs in
as `pci_ops_migration`. The API uses bounded column updates and supports locking, the 0030 invoker
audit INSERT, and connected Paid/Pilot writes. Pilot can read `provider_fact_observations`;
production simulation is disabled and the unconfigured provider webhook rejects before persistence,
so Provider Fact INSERT and its serial sequence are not granted. App roles have no owner
memberships. Compose requires the dedicated BFF URL and does not give Web the API URL credential or
installer credentials.

## Operations Human readiness (isolated non-production only)

The API and installer default to `OPERATIONS_HUMAN_ENABLED=false`. For an authorized isolation
test, enable it in both through Compose and inject a distinct, server-only
`OPERATIONS_DATABASE_URL` using `pci_ops_runtime@postgres:5432/personal_commerce`. The Admin
`operations-admin` profile uses the internal API origin and a separate browser origin
(`ADMIN_WEB_ORIGIN`); no database URL is supplied to Admin. The profile alone does not enable
the API. Password changes are not automatic: an already provisioned role must authenticate with
its recorded credential or the installer refuses to proceed. The API verifies the database role and
permissions before listening. Do not expose these services as a production deployment.

After `migrate` completes, run the existing interactive initializer using the migration URL, not
the Operations, API, or database-owner login. From the same Compose project and secret-injection
context, run the one-off service below. Set `OPERATIONS_BOOTSTRAP_EVIDENCE_REF` and
`OPERATIONS_BOOTSTRAP_DECISION_REF` to approved references in the operator environment before
invocation. The login and password are prompted; enter the password only in the hidden prompt.

```sh
docker compose -f deploy/compose.production.yml run --rm --no-deps \
  -e OPERATIONS_BOOTSTRAP_EVIDENCE_REF -e OPERATIONS_BOOTSTRAP_DECISION_REF \
  migrate sh -ec 'DATABASE_URL="$MIGRATION_DATABASE_URL" exec node dist/scripts/database/initialize-first-operations-account.js'
```

The initializer creates no Session; sign in through Admin afterward. A second initialization is
refused. Migration 0041's public schema trust check remains unchanged. Fresh installs revoke
application-owner CREATE during finalization; existing trusted ready volumes verify fingerprint and
Journal before converging to the same grants. Runtime roles never receive CREATE or owner membership.

## Membership first slice (isolated non-production only)

Leave `MEMBERSHIP_FIRST_SLICE_ENABLED=false` unless running an authorized isolated verification.
The explicit API opt-in registers the Membership endpoints and Admin policy together. Its initial
intake is paused; open or resume it via the authenticated Admin Scenarios screen. This does not
enable money or alter Service intake. The Creator BFF has no direct membership data grants; it
continues to forward the server-side session to the API. The Operations runtime login does not
receive access to Membership Offering, application, relationship or activity tables.

## Program first slice (isolated non-production only)

Leave `PROGRAM_FIRST_SLICE_ENABLED=false` unless running an authorized isolated verification.
The explicit API opt-in registers the Program offering, run, enrollment, attendance and completion
routes together with the Admin Program policy. Program intake starts paused; opening it through the
authenticated Admin Scenarios screen permits new enrollment applications only. Pausing intake does
not cancel existing runs, enrollments or committed session facts. The Creator BFF has no direct
Program data grants and continues to forward the server-side session to the API. The Operations
runtime login does not receive access to Program offering, enrollment, attendance or audit tables.

## Goods first slice (isolated non-production only)

Leave GOODS_FIRST_SLICE_ENABLED=false unless running an authorized isolated verification. The explicit API opt-in registers the Goods Offering, one-unit order, seller decision, Commitment, delivery and buyer receipt paths together with the existing Admin Goods scenario policy. Goods intake starts paused; open or pause it through the authenticated Admin Scenarios screen. Offering pause preserves existing pending orders and the scenario pause blocks only new orders. This slice does not enable payment, refund, settlement, inventory, logistics or real money. The Creator BFF has no direct Goods data grants and continues to forward the server-side session to the API.

## Recovery and existing volumes

### Reproducible migration input (PCI-ENG-026)

The production policy accepts only CRLF/LF representation differences. It replaces each CRLF pair
with LF before execution, rejects a remaining bare CR, and does not trim whitespace, remove a BOM,
change encoding, or add/remove final newlines. SQL content, Journal array order, `idx`, `tag` and
original `when` remain pinned by the unchanged reviewed manifest.

For checksum compatibility, the policy reconstructs the already approved historical representation.
Migrations 0000–0042 use CRLF and 0043–0045 use LF. Their SHA-256 values are the Journal identities,
independent of checkout bytes. The 43-entry identity still hashes to
`0d00481825e4bb5e731826eb6d4689b8a668d8ac12f9a88f4fa8150a34301d50`; the 44-entry identity
still hashes to `3a0ddca1b9a8000ecfb4c05f56d8abd9ba4e483d0a5d3a4ae3b264083d91bafb`; the full
historical 45-entry identity hashes to `308cb862603fe5b7e890fa601508f697b1a18a7b60631bc0dac9d922233720d1`.
The current 46-entry manifest is pinned in `scripts/database/production-migration-policy.ts`.
This bounded representation mapping preserves the single approved SQL-content manifest and the
existing Journal rows. The production installer and phase runner use this policy. Generic Drizzle
tooling continues to hash its raw input, so production deployments must use the production gate.
A future migration requires a separate reviewed manifest update.

The current fresh installer resumes a trusted `provisioned` installation or a matching committed
checkpoint (0, 40, 41 or 46 rows). The finish phase applies 0041–0045 and commits the 46-row
checkpoint. Runtime grants and ready-state finalization then run in a separate transaction. A
volume first booted with the older checkpoint constraint does not gain the new constraint when
its container is replaced. If it is still unfinished, preserve the volume and review recovery
on an isolated clone; do not alter the marker or Journal by hand.

Trusted `ready` volumes with 43, 44 or 45 rows and a matching catalog fingerprint apply the
remaining migrations through 0045 in a single transaction. The installer uses the existing
application owner for DDL and migration role for Journal inserts; it then applies the approved
runtime grants, revokes temporary application-owner schema CREATE, and updates the fingerprint.
A matching `ready` volume with 46 rows is verified without replaying migration SQL. The same
Goods grants used for a fresh install are also applied idempotently to a ready database, including
one previously upgraded without them. This does not activate Goods or grant the Creator BFF access
to Goods data. Other versions require a reviewed manifest, owner assignment and upgrade path.

Unmarked legacy volumes, unexpected history, or ownership/ACL drift are not adopted. Stop the stack
without removing the volume, retain a physical snapshot or tested backup, and inspect a disposable
clone. Match Journal rows by order, SQL hash and original timestamp (not maximum timestamp), then
verify the actual schema and ownership separately. If history cannot be reconciled, request a
reviewed data transfer into a freshly initialized database with count and referential-integrity
reconciliation. Do not copy legacy role grants, installation markers, or Journal rows into a fresh
target; do not remove the source volume. If a new installation stops while a temporary Bootstrap
window is active, stop the installer before investigation; the ephemeral password expires even if
the process is killed. Do not manually renew it or reuse it for application traffic.

## Before a production authorization

- Pin the API, Creator and Admin image digests and retain the matching Compose file and restricted
  environment configuration. Keep browser-visible `NEXT_PUBLIC_*` build values separate from
  runtime credentials. Rebuild Creator Web when its browser-facing API origin changes.
- Before a migration, quiesce writes, stop the stack without `--volumes`, and take an encrypted,
  access-controlled backup of the dedicated cluster with its roles, owners, and ACLs. Record the
  PostgreSQL major version, checksums, Journal count and deployment version. The legacy `pg_dump
--no-owner` drill is not a substitute for a restorable cluster backup.
- Rehearse recovery to a separate PostgreSQL instance: verify the backup, restore with the matching
  server version, keep network access isolated, and compare row counts, Journal history, fingerprint,
  runtime-role permissions and application smoke results before any switch. Recovery time and data
  loss objectives require owner sign-off. Do not restore over the source volume.
- On migration failure, leave dependent services stopped and retain the source volume and the
  `migrate` logs. Retry the same installer only when the committed checkpoint and failure reason
  are understood. Do not roll an older application image onto a newer schema without a verified
  compatibility check; use a rehearsed restore to a separate target if the older version requires
  the older schema.
- Use `docker compose ps -a` and `docker compose logs --tail 100 migrate api web admin` with the
  same project, profile and environment options used at startup. API `/api/v1/readiness` checks
  database connectivity; Web `/auth/login` and Admin `/login` only confirm HTTP availability and
  do not attest to database access, upstream authentication, or production readiness.
