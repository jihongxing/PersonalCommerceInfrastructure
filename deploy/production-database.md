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
addresses. `Secure` cookies require HTTPS for real deployment; Compose publishes Web and API on
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
| `pci_api_runtime`         | LOGIN; current Shared API auth, Creator/Public, Core, Program and wired Paid/Pilot SQL only.                                                               |
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

## Recovery and existing volumes

### Reproducible migration input (PCI-ENG-026)

The production policy accepts only CRLF/LF representation differences. It replaces each CRLF pair
with LF before execution, rejects a remaining bare CR, and does not trim whitespace, remove a BOM,
change encoding, or add/remove final newlines. SQL content, Journal array order, `idx`, `tag` and
original `when` remain pinned by the unchanged reviewed manifest.

For checksum compatibility, the policy reconstructs the already approved historical representation.
Migrations 0000–0042 use CRLF and 0043–0044 use LF. Its SHA-256 values are the Journal identities,
independent of checkout bytes. The 43-entry identity still hashes to
`0d00481825e4bb5e731826eb6d4689b8a668d8ac12f9a88f4fa8150a34301d50`; the 44-entry identity
still hashes to `3a0ddca1b9a8000ecfb4c05f56d8abd9ba4e483d0a5d3a4ae3b264083d91bafb`; the full
45-entry identity hashes to `308cb862603fe5b7e890fa601508f697b1a18a7b60631bc0dac9d922233720d1`.
This bounded representation mapping preserves the single approved SQL-content manifest and the
existing Journal rows. The production installer and phase runner use this policy. Generic Drizzle
tooling continues to hash its raw input, so production deployments must use the production gate.
A future migration requires a separate reviewed manifest update.

An interruption can resume a trusted `provisioned` installation or a matching committed checkpoint
(0, 40, 41 or 45 rows with its catalog fingerprint). Do not repair or populate a Journal by hand.
Fresh installation applies 0041–0044 atomically with finalization, without a separate checkpoint.
A trusted ready 43-row volume with matching catalog fingerprint can apply 0043–0044 in one installer
transaction: DDL under the existing application owner, bounded runtime grants, the Journal entry
under the migration role, application-owner CREATE revoked, and the ready fingerprint refreshed.
A trusted ready 44-row volume with matching catalog fingerprint can apply 0044 in the same bounded
upgrade path. An initialized volume with all 45 rows verifies without replay. Other future versions require
a reviewed manifest, owner assignment and upgrade path. The fingerprint is an in-place drift check,
not a portable backup format.

Unmarked legacy volumes, unexpected history, or ownership/ACL drift are not adopted. Stop the stack
without removing the volume, retain a physical snapshot or tested backup, and inspect a disposable
clone. Match Journal rows by order, SQL hash and original timestamp (not maximum timestamp), then
verify the actual schema and ownership separately. If history cannot be reconciled, request a
reviewed data transfer into a freshly initialized database with count and referential-integrity
reconciliation. Do not copy legacy role grants, installation markers, or Journal rows into a fresh
target; do not remove the source volume. If a new installation stops while a temporary Bootstrap
window is active, stop the installer before investigation; the ephemeral password expires even if
the process is killed. Do not manually renew it or reuse it for application traffic.
