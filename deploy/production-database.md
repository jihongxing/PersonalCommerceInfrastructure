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

## Identity and transaction boundaries

| Identity                  | Responsibility                                                                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `personal_commerce`       | PostgreSQL installer/admin; prepares roles, schemas and extension, verifies catalog and grants. Not injected into API or Web.                          |
| `pci_ops_bootstrap`       | Independent temporary LOGIN, random expiring credential and SET-only Journal Owner membership. Disabled and password cleared before migrations.        |
| `pci_ops_journal_owner`   | NOLOGIN; owns `drizzle`, the Journal and its dependent objects only.                                                                                   |
| `pci_ops_migration`       | Separate LOGIN; SET-only access to approved DDL owners, Journal SELECT/INSERT and serial USAGE. No journal ownership, cluster grants or grant options. |
| `pci_app_object_owner`    | NOLOGIN; owns ordinary application objects from 0000–0035 and 0042.                                                                                    |
| `pci_ops_legacy_owner`    | NOLOGIN; owns 0036–0039 and the reviewed legacy DDL in 0041.                                                                                           |
| `pci_ops_table_owner`     | NOLOGIN; reviewed activation audit/history and 0041 table-stage SQL.                                                                                   |
| `pci_ops_function_owner`  | NOLOGIN; owns `operations_private` and `operations_api` and executes reviewed function-stage SQL.                                                      |
| `pci_api_runtime`         | LOGIN; current Shared API auth, Creator/Public, Core and wired Paid/Pilot SQL only.                                                                    |
| `pci_creator_bff_runtime` | LOGIN; Creator Web Session SELECT/INSERT/UPDATE projections only; no DELETE, business data, Journal, project routines or sequences.                    |
| `pci_ops_runtime`         | Separate restricted role for existing SQL contracts; no credential or pool supplied to these services.                                                 |

The official PostgreSQL entrypoint writes the marker only on a fresh volume. A TCP health check
waits for entrypoint initialization to finish before the installer connects. The installer serializes
provisioning, rejects a non-pristine first boot, and installs `btree_gist` for 0030. The cluster's
unused `postgres` and `template1` databases do not accept ordinary PUBLIC connections. Public schema
and project routine grants are scoped on the new application database; built-in `pg_catalog`
behavior is not changed.

The manifest pins the indexed original tags, timestamps and Drizzle SQL hashes. Journal rows are
compared in database `id` order (including 0025 and 0036 timestamp inversions). DDL and Journal writes
commit together at boundaries 40, 41 and 43. Temporary 0040 `MAINTAIN` on two legacy tables is granted
and revoked within the same transaction; a rollback cannot leave it installed. 0041 still logs in
as `pci_ops_migration`. The API uses bounded column updates and supports locking, the 0030 invoker
audit INSERT, and connected Paid/Pilot writes. Pilot can read `provider_fact_observations`;
production simulation is disabled and the unconfigured provider webhook rejects before persistence,
so Provider Fact INSERT and its serial sequence are not granted. App roles have no owner
memberships. Compose requires the dedicated BFF URL and does not give Web the API URL credential or
installer credentials.

## Recovery and existing volumes

An interruption can resume a trusted `provisioned` installation or a matching committed checkpoint
(0, 40, 41 or 43 rows with its catalog fingerprint). Do not repair or populate a Journal by hand.
An initialized volume with all 43 rows verifies without replaying them. Any future migration requires
a reviewed manifest, owner assignment, and upgrade phase before it can run; unreviewed versions are
rejected. The catalog fingerprint is an in-place drift check, not a portable backup format.

Unmarked legacy volumes, unexpected history, or ownership/ACL drift are not adopted. Stop the stack
without removing the volume, retain a physical snapshot or tested backup, and inspect a disposable
clone. Match Journal rows by order, SQL hash and original timestamp (not maximum timestamp), then
verify the actual schema and ownership separately. If history cannot be reconciled, request a
reviewed data transfer into a freshly initialized database with count and referential-integrity
reconciliation. Do not copy legacy role grants, installation markers, or Journal rows into a fresh
target; do not remove the source volume. If a new installation stops while a temporary Bootstrap
window is active, stop the installer before investigation; the ephemeral password expires even if
the process is killed. Do not manually renew it or reuse it for application traffic.
