# 119 - Disposable PostgreSQL Integration Test Baseline

> Task: PCI-ENG-008
> Date: 2026-11-12 (Asia/Shanghai)
> Starting commit: df10c2d01da46ee3ba652c3cecac0ca771b02f05
> Result: PARTIAL - 12/13 original database cases PASS, 1 FAIL, 0 SKIPPED.
> Database provisioning, clean reruns and mandatory cleanup: PASS.
> Control: CONTROLLED_RECOVERY; no product, Pilot, production or money authorization added.

Current scoped update: ENG-009 closes PG09 and verifies all original 13 cases plus one independent
review-rejection case in two clean PostgreSQL runs. See Section 12. The ENG-008 measurements below
remain unchanged as historical evidence. This update does not grant product acceptance.

## 1. Authority and scope

ENG-008 explicitly authorizes temporary Podman PostgreSQL, disposable databases, existing project
migrations required by the selected tests, test execution and exact-resource cleanup. No existing
database URL, container or volume was reused. No application, test, configuration, migration SQL,
lockfile or CI policy was changed. This record supersedes only the database-execution-unavailable
limitation for the cases enumerated below in the historical ENG-007 record; it does not rewrite that
record or make all of Request Tracing accepted.

## 2. Podman and PostgreSQL inspection

- Podman: 5.7.1; default rootless podman-machine-default connection; WSL machine already running,
  2 CPUs and 4 GiB memory. No machine or connection settings changed.
- Existing resources: 52 containers, none running, and 55 volumes. Names, IDs, states, port mappings
  and volume names were captured before creation and compared after cleanup. None were restarted,
  deleted or attached to the task.
- Local PostgreSQL images included majors 16, 17 and 18. The repository declares PostgreSQL 17
  in 64_Technical_Review_Round_2.md:87; Drizzle uses the postgresql dialect in drizzle.config.ts:6.
  The deployment default is separately pinned to 17.6-bookworm in deploy/compose.production.yml:3.
- Selected locally installed official image: docker.io/library/postgres:17, pinned for each run by
  image ID 1edc8e87e53194e0cc8006c4e9df9b626c6c72cb43ad3385f0f34af7922065b1, with --pull=never.
  Recorded image digests include sha256:7958605b474b3d264a969cb3a123d6aa00ad1e1fe9da8a69984dabb704d93317
  and sha256:dbbeb22a65db2503050cdbbe5e78f017478f10a1002a226463f049dbb017e99b.
- Actual server: PostgreSQL 17.10, Debian 17.10-1.pgdg13+1, x86_64, server_version_num=170010.
  This matches the repository major version. It does not qualify the deployment's exact 17.6
  minor version, Debian base, production configuration or upgrade path. No image was pulled.
- Host tools: Node 22.23.2, pnpm 10.22.0, repository Vitest 4.1.10 and Drizzle ORM 0.45.2.

## 3. Disposable architecture and environment isolation

The verified container was pci-eng-008-a4e6a57c, ID
8b9e3e07a7d26f3208ecc338d0cf12c05839bbaac5646c5caccd0071e8419ea4. It used --rm,
label pci.task=PCI-ENG-008, a generated temporary password, and dynamic binding 127.0.0.1:39473.
The data directory /var/lib/postgresql/data was an explicit 1 GiB tmpfs. Both HostConfig.Tmpfs and
the container's /proc/mounts confirmed the actual tmpfs; no bind mount or named volume was used.
pg_isready -h 127.0.0.1 completed before client connections and migrations.

| Database alias | Exact database         | Purpose / environment                                           | Migration subset |
| -------------- | ---------------------- | --------------------------------------------------------------- | ---------------- |
| A              | pci_eng008_auth        | Local Auth file; LOCAL_AUTH_TEST_DATABASE_URL                   | auth             |
| C              | pci_eng008_capability  | Capability concurrency file; LOCAL_AUTH_TEST_DATABASE_URL       | capability       |
| T              | pci_eng008_tracing     | Ordinary Request Tracing cases; LOCAL_AUTH_TEST_DATABASE_URL    | tracing          |
| D              | pci_tracing_disposable | Network/permission fault cases; TRACING_DISPOSABLE_DATABASE_URL | tracing          |
| G              | pci_eng008_regression  | Existing pnpm test aggregate; LOCAL_AUTH_TEST_DATABASE_URL      | tracing          |

The exact D name and loopback address satisfy the existing fault-test safety guards at
tests/integration/request-tracing.test.ts:598 and :746. Each focused file had its own database.
Each round dropped and recreated A/C/T/D; the aggregate used newly created G/D. The diagnostic
publication probe later used another newly created container and a clean G database.

Only child-process environment maps carried the two test URLs. Inherited DATABASE_URL and
POSTGRES_PASSWORD were removed from test environments; the generated PostgreSQL password was
passed only to the new Podman process. No .env file, shell profile, operating-system environment
or global project setting was changed. Passwords and usable connection URLs are not retained here.

## 4. Existing migration initialization

The three selected test files have no migration setup hook; they open the provided databases and
close their pools. The general persistence suite can run the full inventory, which is outside this
task's migration boundary, so neither that suite nor pnpm db:migrate was invoked.

Initialization used the existing drizzle-orm/postgres-js/migrator, as in scripts/database/migrate.ts:1.
Temporary migration folders copied the exact SQL bytes and only the selected original journal
entries, preserving original order, timestamps and hashes. No replacement schema, schema push,
SQL rewriting, fabricated seed records or manual policy approval was used.

| Subset     | Original migration indexes, in order                                                           | Reason                                                                                              |
| ---------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| auth       | 0027, 0031, 0032                                                                               | Accounts, sessions, Creator mapping, reset tokens and recovery queue                                |
| capability | 0000, 0001, 0002, 0003, 0013, 0033                                                             | Events, capabilities, current offering columns and distribution concurrency                         |
| tracing    | 0000, 0001, 0002, 0003, 0013, 0016, 0017, 0018, 0020, 0027, 0028, 0031, 0032, 0033, 0034, 0035 | Current signup workspace/reference dependencies and the failing case's capability/offering API path |

0018/0020 are dependencies of the existing 0028 Identity-owned reference migration used by current
signup initialization. 0033-0035 are supporting dependencies because the original tracing case
creates a capability and offering through the current Catalog-aware repositories. Their execution
here is not full DEV-082/083 migration rehearsal or admin lifecycle acceptance. No Reservation,
Contract, paid-commerce, Fulfillment, homepage or external-platform migration was run.

Every database started with zero public tables. The selected migrations succeeded from clean
databases; immediately rerunning the same migrator preserved the journal hashes/timestamps and row
count (3, 6 or 16). All selected timestamps are ordered. This proves bounded clean initialization and
same-subset no-op reruns, not a production data upgrade, compatibility of the entire inventory, or
incremental application of omitted migrations to an already advanced journal.

## 5. Original 13 skipped cases

All cases initially had SKIPPED status in ENG-007. L means LOCAL_AUTH_TEST_DATABASE_URL;
D-env means TRACING_DISPOSABLE_DATABASE_URL. R1 and R2 are clean focused rounds. Aggregate uses G
for L and D for D-env. Exact source files and one-based lines are recorded below.

| ID   | Test file and case                                                                                                        | Environment / focused DB | R1   | R2   | Aggregate |
| ---- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ---- | ---- | --------- |
| PG01 | local-auth.integration.test.ts:20 - registers, signs in, rotates and revokes a session, and isolates Creator mappings     | L / A                    | PASS | PASS | PASS      |
| PG02 | local-auth.integration.test.ts:130 - uses expiring single-use reset tokens and revokes all sessions                       | L / A                    | PASS | PASS | PASS      |
| PG03 | local-auth.integration.test.ts:237 - recovers a leased request and retries delivery with the same valid token             | L / A                    | PASS | PASS | PASS      |
| PG04 | local-auth.integration.test.ts:276 - does not retry a link superseded by a newer request                                  | L / A                    | PASS | PASS | PASS      |
| PG05 | local-auth.integration.test.ts:310 - claims each request once across workers and removes expired or exhausted requests    | L / A                    | PASS | PASS | PASS      |
| PG06 | local-auth.integration.test.ts:337 - reports unavailable when mail delivery is not configured                             | L / A                    | PASS | PASS | PASS      |
| PG07 | capability-management.test.ts:280 - serializes deletion and service association without leaving a dangling reference      | L / C                    | PASS | PASS | PASS      |
| PG08 | capability-management.test.ts:314 - records only one distribution event when confirmations race                           | L / C                    | PASS | PASS | PASS      |
| PG09 | request-tracing.test.ts:306 - traces signup and real PostgreSQL transactions                                              | L / T                    | FAIL | FAIL | FAIL      |
| PG10 | request-tracing.test.ts:427 - preserves restricted identity and historical membership rules with trace evidence           | L / T                    | PASS | PASS | PASS      |
| PG11 | request-tracing.test.ts:520 - correlates workspace initialization failure and successful retry without exposing its cause | L / T                    | PASS | PASS | PASS      |
| PG12 | request-tracing.test.ts:596 - recovers workspace initialization after an injected PostgreSQL network interruption         | D-env / D                | PASS | PASS | PASS      |
| PG13 | request-tracing.test.ts:744 - traces a real PostgreSQL permission failure and a successful workspace retry                | D-env / D                | PASS | PASS | PASS      |

All three files are under tests/integration/. All 13 cases actually executed, with zero pending or
skipped cases in the saved Vitest assertion-level JSON. Nine additional nonconditional cases in the
same files were also run. PG06 is database-gated by its suite but its unavailable-delivery assertion
does not independently exercise a database write.

## 6. Execution results and repeatability

| Execution                                 | Passed | Failed | Skipped | Exit |
| ----------------------------------------- | ------ | ------ | ------- | ---- |
| R1 Local Auth file                        | 6      | 0      | 0       | 0    |
| R1 Capability file                        | 6      | 0      | 0       | 0    |
| R1 Request Tracing file                   | 9      | 1      | 0       | 1    |
| R2 Local Auth file                        | 6      | 0      | 0       | 0    |
| R2 Capability file                        | 6      | 0      | 0       | 0    |
| R2 Request Tracing file                   | 9      | 1      | 0       | 1    |
| Existing pnpm test command on three files | 21     | 1      | 0       | 1    |

Focused commands were the repository's existing Vitest run entry with each exact file. The existing
script regression was pnpm test -- tests/integration/local-auth.integration.test.ts
tests/integration/capability-management.test.ts tests/integration/request-tracing.test.ts, with JSON
reporter/output arguments pointing outside the repository. No timeout or assertion was altered.

The main verification ran 2026-11-11T20:20:44.741Z to 20:22:33.601Z (04:20-04:22 on November 12
Asia/Shanghai). R2 followed complete deletion/recreation, not TRUNCATE against an existing database.
The same 12 database cases passed and PG09 failed at the same line in all three executions. This
establishes stable initialization and failure reproduction; it does not make the suite green.

## 7. PG09 failure and diagnostic evidence

The original assertion at tests/integration/request-tracing.test.ts:399 expects publication HTTP 200
after creating Test capability and Test offering. Every run returned HTTP 409. Signup HTTP 201,
setupPending=false and the earlier signup/transaction span assertions passed before that failure.
The later creator_published persistence/correlation assertion and final full telemetry-secret check
were not reached and remain unverified by this case.

A separate diagnostic-only execution used the same current API/composition and original payloads
on another clean disposable database. It observed:

- capability.catalog_status=custom_request, catalog_item_id=null;
- publish HTTP 409, error.category=conflict, code=service_offering_policy_review_required;
- stored offering state=draft, policy_status=review_required, template_id=null;
- policy reason: 能力类型尚未进入可发布目录，需要平台复核。;
- no product events produced.

This follows the current custom-request rule in modules/service-policy/catalog.ts:215 and the
publish guard in applications/service-offering/offering-use-cases.ts:191. Classification:
TEST_CONTRACT_MISMATCH / stale publish-success fixture, not a PostgreSQL initialization, missing
schema, network readiness or transaction failure. No application defect requiring a product-rule
change was established. PG09 remains FAIL; no fixture, assertion, policy, SQL or business behavior
was repaired or bypassed. Main Controller should commission a bounded test repair preserving the
approved Catalog rule and the intended successful event-correlation assertions.

## 8. Behavior actually verified

Local Auth PG01-PG05 verify persisted scrypt password hashes, correct/wrong password responses,
case-insensitive duplicate registration rejection, separate Account/Creator mappings, session
creation, refresh rotation, old-refresh rejection, logout revocation, reset expiry, stored reset-token
hashes, concurrent single-use reset (200/401), old-password rejection, all-session revocation, queue
leases, same-token retry, supersession and single-worker claims. PG06 checks the unavailable-delivery
contract. Delivery callbacks are local fakes; no real email-provider acceptance is implied.

The applied 0027 migration creates email and refresh-hash uniqueness constraints; PG01 exercises
duplicate registration, but concurrent duplicate-email inserts and every auth transaction failure
boundary were not tested. Full signup atomicity under arbitrary failure is UNKNOWN here.

Tracing PG10-PG13 verify restricted Identity/historical Membership behavior, failure correlation,
retry, real TCP interruption/recovery and real SQLSTATE 42501 permission denial. PG13 observes
zero memberships after failure and exactly one ACTIVE membership after restored permission/retry,
plus error and successful transaction span evidence. PG11 intentionally injects a callback error;
it is not itself a real database outage. PG12 introduces a local TCP proxy rather than stopping the
database. PG07/PG08 verify no dangling association and exactly one persisted distribution event
under competing confirmations. These are bounded scenarios, not general concurrency proofs.

Request/correlation IDs and route redaction are also exercised by the five passing nonconditional
Request Tracing cases. Spans use InMemorySpanExporter at request-tracing.test.ts:20; no PostgreSQL
trace store is implemented or verified by these tests. Product events are separate persisted facts;
PG09's successful-publication event correlation remains open.

## 9. Record isolation and mandatory cleanup

The existing suites close their pools but retain some records. After each focused Auth run there
were 5 accounts, 8 sessions and 5 Creator mappings, with zero recovery/reset rows. Capability runs
retained 1 offering, 1 distribution asset and 1 product event. These are observations before cleanup,
not claims that test teardown deletes all data. They were removed by dropping the exact databases.

All ten main-run database drops observed zero active connections and verified the database absent.
No tracing_fault_* roles remained after any selected file. Before/after resource snapshots matched
all 52 unrelated container IDs/names/states/ports and all 55 volume names.

| Task container       | Purpose                                                                                                        | Loopback port | Cleanup                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------- |
| pci-eng-008-6e800c3e | Initial setup stopped before readiness/migrations/tests because Podman reports tmpfs in HostConfig, not Mounts | 40275         | Removed; port closed; existing resources unchanged                              |
| pci-eng-008-a4e6a57c | Both clean rounds and existing-script regression                                                               | 39473         | Databases dropped; container removed; port closed; existing resources unchanged |
| pci-eng-008-76e121c0 | Diagnostic publication response, 20:25:38.961Z-20:26:01.279Z                                                   | 40579         | Database dropped; container removed; port closed; existing resources unchanged  |

Each executor used a finally block, checked its exact task label/name before stop/removal, and used
--rm. No named volume was created or deleted. Container absence, failed TCP connection to the
assigned port, unchanged parent environment and unchanged unrelated resources were explicitly
verified for every container. Raw report files were removed after redaction; no file with generated
credentials was created. Temporary selected-migration folders were removed within their verified
task-specific absolute directory. Temporary executor/probe source files were also removed after
evidence collection. No persistent database or external service was contacted.

## 10. Evidence artifacts and remaining limitations

Local evidence directories, outside Git:

- E:/User/jihx/AppData/Local/Temp/pci-eng-008-a4e6a57c: summary.json, seven labeled Vitest JSON/log
  pairs, resources-before.json and resources-after.json. Summary includes original SQL hashes,
  selected journal timestamps, per-case statuses, table counts and cleanup checks.
- E:/User/jihx/AppData/Local/Temp/pci-eng-008-76e121c0: summary.json, publication-probe.log and
  resource snapshots, with the observed HTTP/body/persisted-state evidence.
- E:/User/jihx/AppData/Local/Temp/pci-eng-008-6e800c3e: initial setup-abort and cleanup summary.

These temporary artifacts may be cleared by the OS. This committed document retains the measured
scope, exact cases, outcomes and limitations. Root TypeScript/lint, browser acceptance and unrelated
integration suites were not rerun for this documentation-only repository change. ENG-007's failing
root/historical gates remain open; no whole-repository PASS is claimed.

## 11. Main Controller handoff

Accept the new execution evidence for Local Auth, Password Recovery, the two Capability concurrency
cases and the four passing database Tracing cases. Keep capability-level verification at TESTED,
not ACCEPTED. The original 13-case execution gap is now resolved into 12 PASS and 1 reproducible
contract failure; overall ENG-008 remains PARTIAL until PG09 is reconciled and passes.

Request a separate bounded repair for PG09's successful-publication fixture and repeat its event
correlation/secret assertions against disposable PostgreSQL. Do not change Catalog policy to make
the stale fixture publish. DEV-082/083 full migration/admin acceptance, exact production-image
qualification, real email delivery, full root gate recovery and external acceptance remain separate.
CONTROLLED_RECOVERY, FORMAL_RESUME_GATE=NOT_FULLY_CLOSED, FULL_STAGE_2=NOT AUTHORIZED,
EXTERNAL_PILOT=NOT AUTHORIZED, PRODUCTION=NOT AUTHORIZED and REAL_MONEY_ENABLED=false remain.

## 12. ENG-009 - PG09 contract alignment and closure

> Date: 2026-11-12 (Asia/Shanghai)
> Scoped status: COMPLETED / TESTED; PG09 and the original PostgreSQL execution gap are closed.
> Prior baseline: 0900efd45153d14ecf046b20386b1f367d461e64 (ENG-008).
> Test-only commit: fe59d494b8994acaf539a96fec72b6edb94cccc7.
> Both clean runs: 23 PASS, 0 FAIL, 0 SKIPPED; original cases 13/13 PASS, additional case 1/1 PASS.

### 12.1 Original intent and Catalog evidence

Full review covered request-tracing.test.ts, catalog.ts, offering-use-cases.ts, the PostgreSQL Catalog
Repository, Catalog schema/seed records, relevant API fixtures and the ENG-008 migration inventory.
PG09's original name and all original important assertions remain. Its complete path is signup,
session/workspace initialization, authenticated capability/Offering creation, complete Creator
profile, publish, persisted creator_published event, correlation propagation and telemetry privacy.

| Original concern                  | Preserved or strengthened evidence                                                                                                      |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Registration / PostgreSQL tracing | HTTP 201, setupPending=false, auth.signup/session/workspace/account-create/transaction spans in the signup trace, parent-child relation |
| Offering publication              | Normal API creation and HTTP 200; draft/auto_approved becomes persisted published/approved with the selected template                   |
| Canonical event                   | Original name/correlation assertions retained; now exactly one event with the correct actor/object ownership                            |
| Correlation ID                    | Original event correlation retained; response header, completion log, server Span and transaction Span also linked                      |
| Privacy                           | Original email/password/private-name/access-token/refresh-token checks over logs and Span attributes/events/status retained and reached |

The existing rule at modules/service-policy/catalog.ts:215 requires review for custom_request
capabilities. The publish guard at applications/service-offering/offering-use-cases.ts:192 persists
that result and rejects publication. The older in-memory Capability API rejection test did not cover
real PostgreSQL persistence, canonical-event absence, trace correlation or privacy, so one independent
database case was warranted. No duplicate production behavior or new product decision was introduced.

### 12.2 Successful Fixture and independent rejection scenario

Scenario A reads the actual migrated Catalog using composition.servicePolicyCatalogRepository.
It selects capability-dance-teaching and template-dance-private-lesson, seeded by existing migration
0034 at lines 65 and 75. Both must be active, low risk, VS-01, creator-selectable and publish-enabled;
the template must reference that capability. Missing or unsuitable data fails the test rather than
creating approval. These are existing Catalog states, not newly invented Approved capability states.

Dance teaching was selected over other available entries because it is the existing low-risk VS-01
service template, preserving the narrow Creator Offering publication intent. The test creates the
Capability and Offering through actual APIs with explicit catalogItemId/templateId. It does not use
legacy metadata-free compatibility branches, direct approval inserts, admin overrides or Mock
repositories. Only SELECT statements were added for database assertions.

The persisted Offering must be published/approved with the selected template; the response must
identify that Offering and its distribution asset. creator_published remains a Creator-identity fact:
object_id and actor_id equal the persisted Offering's creator_id, not the Offering ID. This preserves
the canonical contract while verifying the Offering's ownership link. The event count is exactly one,
and its correlation matches the publish response/log. A successful postgres.transaction Span must
share the publish trace and be a child of its server Span. No trace feature or event was added.

Scenario B, named traces custom capability review rejection without publishing or leaking secrets,
uses its own account and complete Creator profile. The original Test capability/Test offering
payload remains a custom request. It asserts HTTP 409, conflict/service_offering_policy_review_required,
matching error/header/log/Span correlation, persisted draft/review_required, no event for that request
or Creator publication, no distribution asset, and no private credentials or identity data in the
error response or logs/Span attributes/events/status. This is a separate real PostgreSQL case.

### 12.3 Two complete clean executions

Both rounds used the existing pnpm test script with the exact Local Auth, Capability and Request
Tracing integration files, JSON reporter and output outside Git. No assertions, timeouts, gates or
skip conditions were weakened.

| Scope                                                                  | Clean round 1               | Clean round 2               |
| ---------------------------------------------------------------------- | --------------------------- | --------------------------- |
| Local Auth file / PG01-PG06                                            | 6 PASS, 0 FAIL, 0 SKIP      | 6 PASS, 0 FAIL, 0 SKIP      |
| Capability file / PG07-PG08 plus four existing cases                   | 6 PASS, 0 FAIL, 0 SKIP      | 6 PASS, 0 FAIL, 0 SKIP      |
| Request Tracing / PG09-PG13 plus new rejection and five existing cases | 11 PASS, 0 FAIL, 0 SKIP     | 11 PASS, 0 FAIL, 0 SKIP     |
| Original 13 database-gated cases                                       | 13 PASS, 0 FAIL, 0 SKIP     | 13 PASS, 0 FAIL, 0 SKIP     |
| Additional PostgreSQL review-rejection case                            | 1 PASS                      | 1 PASS                      |
| Total / exit                                                           | 23 PASS, 0 FAIL, 0 SKIP / 0 | 23 PASS, 0 FAIL, 0 SKIP / 0 |

PG06 retains its original database-gated suite placement; its unavailable-mail assertion itself does
not perform a database query. The 13-case accounting preserves ENG-008's original inventory.

All original test names remain, including PG09. PG10-PG13 now begin at request-tracing.test.ts:660,
:753, :829 and :977. PG12 still interrupts a real local TCP proxy and recovers. PG13 still creates a
temporary role, observes real SQLSTATE 42501 and verifies zero memberships after failure and one
ACTIVE membership after restored permission/retry. The existing fault-trigger spy does not replace
the real PostgreSQL interaction.

The verified file SHA-256 is ef0f634c270a9e3aff2de8332dabecdcd02ee02df700ae7bdf6976d66659bfca.
It was checked again before the test-only commit. Focused ESLint, typecheck:active-tests:backend,
test-file formatting and git diff --check passed. Unrelated source files and original gates were
unchanged; full root lint/TypeScript, browser and external acceptance were not rerun or claimed.

### 12.4 Disposable database setup and cleanup

Podman 5.7.1 and the existing running WSL machine were inspected again. Used a new
pci-eng-009-tx5wyw container, ID 38815f316436512fc02b299b0a7c79967bcdfd2e1ead820d68829f76cc95effd,
with --rm, task label, random credentials, 127.0.0.1:41091 dynamic binding and 1 GiB tmpfs PGDATA.
No ENG-008 or other existing container was reused. The official local PostgreSQL 17 image ID and
actual PostgreSQL 17.10 server match Section 2; no image pull was required.

Each round created pci_eng009_main and pci_tracing_disposable from empty databases. Only child
process maps received LOCAL_AUTH_TEST_DATABASE_URL/TRACING_DISPOSABLE_DATABASE_URL. Existing
DATABASE_URL and POSTGRES_PASSWORD were excluded from test environments; global .env/settings
and real-money controls were not changed. pg_isready preceded all database initialization.

The same exact 16-migration tracing dependency subset from Section 4 was used for both databases.
Original SQL bytes and journal metadata were copied to a temporary folder and processed by the
existing Drizzle migrator. All four initializations passed; identical reruns preserved journal hashes,
timestamps and count. No full inventory or unrelated migration rehearsal was run.

Before each drop, main database counts were 10 accounts, 2 product events and 3 Offerings; fault
database counts were 2 accounts, 0 events and 0 Offerings in both rounds. Existing tests retain
records, so cleanup dropped the exact databases. All four drops observed zero active connections
and verified database absence. No tracing_fault_* role remained after either round.

Execution ran 2026-11-11T20:47:05.910Z to 20:48:14.078Z, or November 12 04:47-04:48 Asia/Shanghai.
The finally block stopped/removed the exact labeled container. Container absence, closed TCP port,
unchanged 52 unrelated container snapshots and 55 volume names, unchanged parent environment,
and deletion of the temporary migration directory were verified. No volume was created or removed.
The temporary executor was subsequently deleted and container/listener absence rechecked. No usable
credential file or connection URL was retained.

### 12.5 Current result, provenance and limits

Local evidence: E:/User/jihx/AppData/Local/Temp/pci-eng-009-TX5WYw contains summary.json,
round-1.json/log, round-2.json/log and resources-before/after.json. The summary retains per-case
statuses, Catalog metadata, original SQL hashes, migration rerun and cleanup checks. Raw reports
were removed after redaction; local artifacts may be cleared by the OS.

The test-only commit is fe59d494b8994acaf539a96fec72b6edb94cccc7; a separate ENG-009 documentation
commit appends this closure, the execution ledger and the current control-baseline update. ENG-008
remains its original historical PARTIAL measurement. Current PG09 and the scoped 13-case PostgreSQL
verification are closed by ENG-009 evidence, without retroactively changing those results.

Spans still use the existing in-memory exporter; actual event persistence is PostgreSQL-backed. This
does not validate an external collector, real email delivery, all migrations, production's exact
17.6-bookworm image, full Catalog/admin acceptance or whole-repository quality. No production code,
schema, API contract, Catalog policy, Identity, C-number or money behavior changed, so no new product
deviation is introduced. Capability verification remains TESTED, not ACCEPTED. CONTROLLED_RECOVERY,
incomplete formal Resume Gate and no full Stage 2/Pilot/production/real-money authorization remain.
