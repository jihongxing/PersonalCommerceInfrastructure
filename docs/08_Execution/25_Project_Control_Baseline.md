# 25 - Project Control Baseline

> **Status**: CURRENT CONTROL BASELINE
> **Effective date**: 2026-11-12
> **Acceptance ledger update**: 2026-11-13 — PCI-ENG-017-B-E2
> **Project**: Personal Commerce Infrastructure
> **Control mode**: `CONTROLLED_RECOVERY`
> **Formal Resume Gate**: `NOT_FULLY_CLOSED`
> **Owner**: Main Controller

This document is the current project governance entry point. It records the current control state,
bounded product authorization, implementation reality, verification status, authority boundaries and
historical decision provenance. It does not replace the Product Direction, the VS-01 PRD, the
Technology Architecture Decision or the historical Project Handoff.

The Founder approval of Product Direction v0.3 is adopted from external historical decision context
confirmed by the Founder. The repository does not contain an independent signed approval artifact;
that provenance limitation is retained explicitly. Strategic approval does not constitute full Stage 2
authorization.

## 1. Current Project Definition

PCI provides an independent, portable commerce identity and entry point for creators affected by
platform distribution restrictions or account loss. Commerce Reference (C number) is the stable
identity-facing entry point. Third-party platforms remain discovery and distribution channels; PCI is
not a marketplace, CRM, social network or real-money payment network.

The strategic source is
[`05_Personal_Commerce_Infrastructure_Product_Direction.md`](../01_Strategy/05_Personal_Commerce_Infrastructure_Product_Direction.md).
The VS-01 implementation contract remains
[`20_MVP_PRD_VS01.md`](../07_Product_Architecture/20_MVP_PRD_VS01.md).

## 2. Adopted Control State

```text
PROJECT_CONTROL_MODE = CONTROLLED_RECOVERY
FORMAL_RESUME_GATE = NOT_FULLY_CLOSED

VS-01 = FROZEN
STAGE_2 = BOUNDED_APPROVED_CHANGE_UNITS_ONLY
FULL_STAGE_2 = NOT AUTHORIZED
STAGE_3 = NOT AUTHORIZED

REAL_MONEY_ENABLED = false
EXTERNAL_PILOT = NOT AUTHORIZED
PRODUCTION = NOT AUTHORIZED
apps/app = DEFERRED
```

The August 2026 suspension remains a historical fact and evidence baseline. The project is not
treated as fully resumed. Limited, segmented engineering recovery is acknowledged because code and
execution records exist after `suspend/client-002-complete`, but the existence of those commits does
not close the historical Resume Gate or authorize new product scope.

The historical restart and suspension record remains in
[`22_Project_Handoff.md`](./22_Project_Handoff.md). Its nine Resume Gate conditions are preserved;
this baseline manages the current control state and does not claim that all nine conditions passed.

## 3. Product Authorization Boundary

Only the named change units in Section 4 are currently classified as bounded approved units. A named
unit may continue only for its recorded scope, evidence closure, regression verification or migration
rehearsal explicitly required by that unit. It may not be used to infer a larger Stage 2, new vertical,
new product object, public production surface, external pilot or real-money path.

The authorization levels are separate:

```text
D = architecture / design
L = local implementation
I = isolated integration testing
P = external pilot
R = production
M = real-money activation
```

Approval at `D`, `L` or `I` never implies approval at `P`, `R` or `M`.

## 4. Named Approved Change Units

| Unit | Current decision | Approved scope | Explicit exclusions | Implementation / verification | Continue within original scope? |
| --- | --- | --- | --- | --- | --- |
| `IDENTITY-001` | `APPROVED` (bounded) | Internal Identity and Commerce Profile pure-domain contract | Persistence, migration, API, UI, delegation, ownership transfer | Domain and later runtime exist; domain/runtime evidence is historical and requires provenance review | Yes, only reconciliation and regression |
| `IDENTITY-002` | `APPROVED` (bounded) | External Platform Account and Commerce Relationship pure-domain contract | OAuth, platform API, verification, persistence and public exposure | Domain and private runtime exist; no platform verification acceptance | Yes, only bounded private verification |
| `IDENTITY-003` | `APPROVED` (bounded) | Canonical Commerce Reference value and immutable association contract | Generator, allocation, resolver, QR runtime and enumeration controls in the original unit | Later implementation exists; ownership is superseded by `DEV-061` | Yes, only reconciliation of the superseded boundary |
| `DEV-053` | `APPROVED` (bounded) | Self-declared external account and relationship composite command | OAuth, platform proof, manager/delegated manager, public API, resolver, QR and money | Self-declared private command exists; provenance remains ledger-based | Yes, only self-declared `OWNER/PROPOSED` path |
| `DEV-061` | `APPROVED` (bounded) | Identity-owned, immutable, never-reused Commerce Reference | No new format, capacity or resolver security design | Migration and Identity-owned contract exist; production migration not accepted | Yes, only local evidence and migration rehearsal |
| `DEV-062` | `APPROVED` (bounded) | Identity C-number homepage, exact anonymous entry, independent homepage lifecycle and empty state | Search, discovery, marketplace, generic lookup policy and production launch | Implemented; local acceptance incomplete | Yes, only local acceptance closure |
| `DEV-063` | `APPROVED` (bounded) | One selected public Profile per Identity and Profile-surface summary | Additional homepage rows, unselected Profile exposure or public disclosure expansion | Implemented; local acceptance incomplete | Yes, only regression and local verification |
| `DEV-064` | `APPROVED` (bounded) | Versioned homepages, server-time selection, non-overlapping activation windows | Recurrence, visitor-selected versions, new events, payment, CRM | Implemented; local automated acceptance recorded, external evidence absent | Yes, only named acceptance evidence |
| `DEV-065` | `APPROVED` (bounded) | Move homepage management to the Profile surface | API, database, C-number or permission changes | Implemented; local acceptance recorded | Yes, only UI regression |
| `DEV-082` | `APPROVED` (bounded) | Controlled capability catalog, templates, policy states and publish gates | New arbitrary categories, marketplace, AI-only moderation or new canonical events | ENG-010 core policy regression and migrations pass; full product workflows/acceptance remain PARTIAL | Yes, only named acceptance and rehearsal |
| `DEV-083` | `APPROVED` (bounded) | Database-managed capability and service catalog | Payment, marketplace, CRM and unrelated catalog expansion | ENG-010 full install/upgrade and implemented Operations verification pass; 403/401 and lifecycle interpretation remain open | Yes, only migration/admin verification |
| `PCI-ENG-015-A` | `ACCEPTED` (bounded engineering delivery) | Pure Operations Human/Machine identity domain contracts and tests | Persistence, authentication, Session runtime, BFF, permissions, Actor migration, Admin API and product behavior | Commit `e2acf7b`; final focused contract tests 13/13; production source typecheck and focused lint pass | Yes, only contract verification and review |
| `PCI-ENG-015-B` | `ACCEPTED` (bounded engineering delivery) | Operations Human Principal, Account and Service Principal persistence foundation | Credentials, sessions, authentication, MFA, BFF, permissions, Actor migration, Admin API, Pilot, production and money | R2 final domain 13/13; PostgreSQL persistence 11/11 in each of two rounds; migration rerun journal 37/37; typecheck and focused lint pass | Yes, only the three persistence categories and their recorded evidence |
| `PCI-ENG-016-B` / `R1` / `R2` | `ACCEPTED` (bounded engineering delivery) | Encoded Password Verifier persistence, Operations Account Credential Repository, account-scoped strict versioning, atomic replacement, revoked-history protection, PostgreSQL constraints/triggers, composition integration and Domain/PostgreSQL verification | Login, Session, password verification/reset, MFA, RBAC, BFF/Admin API, Creator Auth, Pilot, production and real money | Domain 14/14; Credential + Operations Identity PostgreSQL 19/19; full persistence 108 PASS / 12 FAIL / 3 SKIPPED; the 12 failures reproduce on the source baseline and are `PROVEN PRE-EXISTING — SOURCE BASELINE`; changed-file ESLint, TypeScript, build and migration check pass; full lint remains 458 errors without parent comparison | Yes, only this accepted persistence boundary and evidence closure |
| `PCI-ENG-016-C0` | `ACCEPTED` (bounded architecture contract) | Operations Human Session persistence design and implementation contract | Session persistence or authentication implementation; unresolved Founder policy values | Main Controller acceptance carried forward by the C1-E2 instruction; no database implementation or execution evidence implied | Only reconciliation of the accepted design |
| `PCI-ENG-016-C1` | `ACCEPTED` (bounded engineering delivery) | Existing Session Domain Contract, Digest/Persistence Record types, seven Session Repository operations and a separate Security Epoch Increment Port | Session Schema/Migration/Adapter, database operations, authentication/login/logout, Cookie/BFF, MFA/RBAC, Admin API, Creator Auth and production authority | Domain 21 PASS + Session Repository Contract 7 PASS = 28/28; production and active backend test TypeScript, changed-file ESLint, Prettier and diff check PASS; no Session PostgreSQL tests or persistence implementation | Only accepted contract/port review and evidence closure; follow-on implementation needs a separate named unit |
| `PCI-ENG-016-C1-E2` | `ACCEPTED` (ledger and commit closure) | Accepted C1 contracts and four governance documents | New engineering logic or database execution | Commit `cef592ec4a1a513f63589005508c4c8aa708fd32`; C1 evidence remains historical | Documentation and recorded evidence only |
| `PCI-ENG-016-C2` | `ACCEPTED` (bounded engineering delivery) | Operations Human Session PostgreSQL persistence, seven Session adapters, separate Epoch CAS repository and Operations Composition | Login, Session Credential issuance/authentication runtime, Cookie/BFF, MFA/RBAC, Admin API, Creator Auth, production and money | Focused 70/70 PASS; full persistence 131 PASS / 12 FAIL / 3 SKIPPED; 12 failures individually match the accepted source baseline; see Section 5.9 | Only the accepted persistence delivery; new runtime work needs a separate named unit |
| `PCI-ENG-016-C2-E2` | `ACCEPTED` (ledger and commit closure) | C2 accepted files and four authorized governance documents in one Git commit | New engineering logic, database operations, roles, runtime and product authorization | Main Controller's explicit C2-E2 acceptance instruction; original C2 evidence is retained without rerunning tests | Documentation and Git closure only; no Push |
| `PCI-ENG-017-A` | `ACCEPTED_READ_ONLY_ASSESSMENT` | Operations Authentication Runtime architecture/readiness assessment | Runtime implementation, Bootstrap, permissions and production authority | Accepted read-only assessment; implementation gaps and policy decisions remain separate | Assessment and evidence review only |
| `PCI-ENG-017-B` | `ACCEPTED` (bounded integrity delivery) | Human Principal tombstoned and Account/Service Principal revoked UPDATE/DELETE protection in Repository and PostgreSQL | Independent identity TRUNCATE protection, historical data repair, Epoch/Session linkage and Authentication Runtime | Focused 107/107 PASS; full Persistence 168 PASS / 12 FAIL / 3 SKIPPED; no new failures; see Section 5.10 | Only accepted terminal UPDATE/DELETE integrity and evidence closure |
| `PCI-ENG-017-B-E2` | `ACCEPTED` (ledger and commit closure) | Accepted 017-B files and four authorized governance documents in one Git commit | New engineering logic, Migration/database tests, runtime, roles and product authorization | Main Controller's explicit acceptance instruction; retained 017-B evidence without rerunning Migration or PostgreSQL tests | Documentation and Git closure only; no Push |

PCI-ENG-017-C1-R2 is separately authorized for FD-UNKNOWN-01 Domain/Application contracts, tests and
four governance documents only. Implementation awaits Main Controller review; see Section 5.12.
It does not authorize C2-1, C2-2, C3 or any runtime/database change.

ENG-012 is additionally approved by explicit Founder Direction in the current task: retire old Web
and mock, consolidate Creator targets and implement an independent Operations Admin shell. This
authorizes local topology/shell work only, excluding authentication integration, Operations mutations,
review powers, new product scope, deployment and money. Subsequent integration needs a named unit.

The historical execution ledger remains the evidence source for these units. Where its claim conflicts
with the Decision Package, stale `COMMITTED` fields or missing signed approval, the unit is additionally
classified as `PROVENANCE_REQUIRES_REVIEW`; the scope is never enlarged by that uncertainty.

## 5. Capability Reality Matrix

State meanings:

- `Implementation`: `NOT_IMPLEMENTED`, `PARTIAL`, `IMPLEMENTED`
- `Decision`: `APPROVED`, `PROPOSED`, `EXTERNAL_FOUNDER_CONTEXT_PENDING`, `UNKNOWN`, `REJECTED`
- `Documentation`: `SYNCED`, `STALE`, `MISSING`, `CONFLICTED`
- `Verification`: `UNTESTED`, `TESTED`, `ACCEPTED`, `NOT_ACCEPTED`

| Capability | Implementation | Decision | Documentation | Verification | Current control interpretation |
| --- | --- | --- | --- | --- | --- |
| Internal Identity | `IMPLEMENTED` | `APPROVED` bounded by `IDENTITY-001` | `CONFLICTED` | `TESTED` | Preserve current domain/runtime; no new identity governance |
| Account Identity Membership | `IMPLEMENTED` | `UNKNOWN` outside named units | `CONFLICTED` | `TESTED` | Historical onboarding/runtime only; no new authority model |
| Commerce Profile | `IMPLEMENTED` | `APPROVED` bounded by `IDENTITY-001` | `CONFLICTED` | `TESTED` | Identity owns Profiles; no transfer or delegation |
| Commerce Reference | `IMPLEMENTED` | `APPROVED` bounded by `DEV-061` | `CONFLICTED` | `TESTED` | Identity is ownership root; generic resolver security remains outside scope |
| External Platform Account | `IMPLEMENTED` | `APPROVED` bounded by `IDENTITY-002` | `CONFLICTED` | `TESTED` | Private account facts only; no OAuth or platform proof |
| Commerce Relationship | `IMPLEMENTED` | `APPROVED` bounded by `DEV-053` | `CONFLICTED` | `TESTED` | Self-declared `OWNER/PROPOSED` only |
| Public Homepage | `IMPLEMENTED` | `APPROVED` bounded by `DEV-062`/`063` | `CONFLICTED` | `TESTED` | Local homepage behavior exists; production is not authorized |
| Homepage Scheduling | `IMPLEMENTED` | `APPROVED` bounded by `DEV-064` | `CONFLICTED` | `TESTED` | Local schedule evidence only; external observability absent |
| Controlled Catalog | `PARTIAL` | `APPROVED` bounded by `DEV-082`/`083` | `SYNCED` | `NOT_ACCEPTED` | ENG-010 core database/Operations TESTED; report/appeal/manual-review workflow and contract conflicts remain; see Section 5.3 |
| Web V2 | `IMPLEMENTED` | `UNKNOWN` for complete product scope | `STALE` | `TESTED` | Main implementation target; no automatic scope expansion |
| Operations Admin Web | `IMPLEMENTED` shell only | `APPROVED` by explicit ENG-012 task | `SYNCED` | `TESTED` local shell | No authentication, data, mutations or human-review authority; see Section 5.4 |
| Operations Session Domain / Application Ports | `IMPLEMENTED` contracts only | `APPROVED` bounded by accepted `PCI-ENG-016-C0` / `C1` | `SYNCED` | `ACCEPTED` contracts only | C1 remains the accepted contract; C2 separately accepts persistence; see Sections 5.8 and 5.9 |
| Operations Human Session Persistence | `IMPLEMENTED` persistence only | `APPROVED` bounded by accepted `PCI-ENG-016-C2` | `SYNCED` | `ACCEPTED` persistence only | Seven PostgreSQL Session operations and independent Epoch CAS; Session Authentication Runtime remains NOT IMPLEMENTED; see Section 5.9 |
| Operations Identity Terminal UPDATE/DELETE Protection | `IMPLEMENTED` | `APPROVED` bounded by accepted `PCI-ENG-017-B` | `SYNCED` | `ACCEPTED` UPDATE/DELETE only | Three irreversible terminal states; nonterminal recovery preserved; identity TRUNCATE and runtime limitations remain; see Section 5.10 |
| Local Auth | `IMPLEMENTED` | `UNKNOWN` as product scope | `STALE` | `TESTED` | ENG-008/009: six Local Auth PostgreSQL cases pass; ENG-009 reverified two clean runs; product acceptance remains open |
| Password Recovery | `IMPLEMENTED` | `UNKNOWN` as product scope | `STALE` | `TESTED` | ENG-008/009: PostgreSQL reset/queue/single-use cases pass; real mail delivery and product acceptance remain open |
| Reservation | `IMPLEMENTED` | `UNKNOWN` current expansion | `SYNCED` | `TESTED` | Historical implementation; no scope expansion |
| Contract | `IMPLEMENTED` | `UNKNOWN` current expansion | `SYNCED` | `TESTED` | Historical implementation; no scope expansion |
| Paid Commerce | `IMPLEMENTED` (simulation/domain) | `UNKNOWN` for current product | `SYNCED` | `TESTED` | Local Simulation only; real money remains disabled |
| Fulfillment / QR | `PARTIAL` | `UNKNOWN` / not current product-approved | `CONFLICTED` | `NOT_ACCEPTED` | Preserve code for audit; do not treat as product commitment |
| Legacy Public Creator Profile API | `PARTIAL` | `UNKNOWN` | `CONFLICTED` | `UNTESTED` | Route file and frontend hook exist; route is not registered and uses a legacy ID assumption |

`TESTED` means that local, unit, integration or browser evidence exists. It does not mean product
acceptance, external pilot acceptance or production readiness. `NOT_ACCEPTED` means implementation
evidence exists but the product or environment gate remains open.

### 5.1 ENG-008 PostgreSQL execution evidence

On 2026-11-12, isolated Podman PostgreSQL 17.10 execution replaced ENG-007's environment-unavailable
status for the exact 13 conditional cases. Two clean focused rounds and the existing pnpm test
regression each produced 12 PASS, 1 FAIL and 0 SKIPPED for those cases (21 PASS, 1 FAIL and
0 SKIPPED including nine additional cases). Local Auth/Recovery has 6/6 passing cases; Capability
concurrency has 2/2; database-dependent Request Tracing has 4/5 and remains PARTIAL.

The remaining tracing case expects HTTP 200 for a custom capability publication, but current policy
returns HTTP 409/service_offering_policy_review_required and preserves draft/review_required. No
rule or assertion was changed. Its later successful-publication event correlation remains open.
All task containers, databases and listeners were removed; unrelated containers/volumes were unchanged.

Evidence: [119 - PostgreSQL Integration Test Baseline](../09_Engineering_Governance/119_PostgreSQL_Integration_Test_Baseline.md).
This refines local verification evidence only. TESTED is not promoted to ACCEPTED; product decisions,
documentation debt, DEV-082/083 full migration/admin acceptance and all authorization boundaries remain.

### 5.2 ENG-009 current PostgreSQL verification closure

On 2026-11-12, PG09 was aligned with the existing active VS-01 dance-teaching Catalog item and
private-lesson template. A separate real PostgreSQL case preserves custom-request publication
rejection. Two full clean runs each passed all original 13 database-gated cases plus the new case;
including existing nonconditional tests, each run was 23 PASS, 0 FAIL and 0 SKIPPED.

Current scoped PostgreSQL verification is CLOSED / TESTED. PG09 now reaches and passes successful
publication, canonical-event persistence/ownership, correlation, transaction-Span and privacy
assertions. The independent rejection case verifies HTTP 409, draft/review_required and no published
event/asset. Real TCP interruption and SQLSTATE 42501 recovery cases still pass.

This supersedes only Section 5.1's open PG09/current PARTIAL interpretation; its ENG-008 historical
measurements remain unchanged. Evidence: [119 - Section 12 ENG-009 closure](../09_Engineering_Governance/119_PostgreSQL_Integration_Test_Baseline.md).
Test-only commit: fe59d494b8994acaf539a96fec72b6edb94cccc7. No production code, policy, schema or
authorization changed; cleanup removed all task resources and preserved unrelated containers/volumes.
TESTED is not promoted to ACCEPTED. Full Catalog/admin acceptance, exact production-image
qualification, formal Resume Gate, product scope and Pilot/production/money decisions remain open.

### 5.3 ENG-010 Controlled Catalog acceptance evidence

ENG-010 overall is PARTIAL. Two independent clean PostgreSQL rounds each passed 79 tests with
0 FAIL and 0 SKIP, including 25 new Catalog cases and all original 13 database-gated cases. Each
round passed all 36 migrations, a historical 0000-0032 to 0033-0035 upgrade, and unchanged full
migrator reruns. Ten capabilities, ten templates, one initial published release, four primary keys,
eleven indexes and preserved historical actions/assets/events were verified. The server was 17.10;
the exact deployment image 17.6-bookworm remains unqualified.

Existing Operations workspace/audit, state/switch/risk updates and loaded-version publication were
verified against real PostgreSQL. Bounded fixes make entity/release changes atomic with audit,
serialize registered admin writers, and honor existing capability risk and missing-reference gates.
Code/regression commit: 9a1b7a535dcbdcd7271d4161bc5a647bf717e137.

Full product acceptance remains NOT_ACCEPTED: Decision 35's non-Operations 403 conflicts with the
existing invalid-credentials 401 response; required report/appeal/manual-review record workflows
are absent; permanent retirement semantics remain unresolved. No new workflow, role, category or
permission was added. Catalog reference enforcement has no database FK guarantee; no new FK or
arbitrary-version authoring/import API is implied. Decision 35 did not itself require an Admin UI.
ENG-012 separately approves the independent Admin shell in Section 5.4; it does not retroactively
change Decision 35 or close full Catalog acceptance.

This updates only the current engineering interpretation of migration/admin evidence; historical
DEV-082/083 and ENG-008/009 measurements remain unchanged. The implementation field is PARTIAL
because the complete approved product workflow is not implemented, while existing core Operations
paths are TESTED. All task resources were removed; unrelated containers/volumes were unchanged.
Evidence: [120 - Controlled Catalog Acceptance](../09_Engineering_Governance/120_Controlled_Catalog_Acceptance.md).
CONTROLLED_RECOVERY, incomplete Resume Gate and no full Stage 2/Pilot/production/money authorization
remain unchanged.

### 5.4 ENG-012 application topology and shell

The explicit Founder Direction in the PCI-ENG-012 task adopts:

```text
apps/web = RETIRED / NO_FURTHER_DEVELOPMENT
apps/api-mock = RETIRED / NO_FURTHER_DEVELOPMENT
apps/web-v2 = ACTIVE / CREATOR_WEB
apps/admin-web = APPROVED / OPERATIONS_ADMIN_WEB
apps/api = ACTIVE / SHARED_BACKEND
```

This supersedes the former root-script/Reference Client target ambiguity and absence of an approved
Admin application. It does not supersede unresolved product, authentication, review, Catalog or
acceptance decisions. Both retired source trees and active targets are removed; Git and classified
test sources preserve history. Local ignored cache residue is outside apps/.

The Admin shell has seven pages, navigation, loading/error/unavailable states and no credentials,
API requests, operational data, mutation controls or database imports. Local build, types, lint,
9 smoke tests, browser checks and fabricated credential-sentinel scan pass. Creator build, all
86 native tests and 64 bridge tests pass; shared API build/OpenAPI compatibility pass. Historical
Reference Client browser acceptance is archived, not claimed passed. Current Creator E2E, full
root preflight, Docker images and external acceptance were not qualified in this unit.

Architecture, permissions and gate changes are recorded in
[121 - Operations Admin Web Architecture](../09_Engineering_Governance/121_Operations_Admin_Web_Architecture.md).
CONTROLLED_RECOVERY, incomplete Resume Gate, no full Stage 2/Pilot/production authorization and
REAL_MONEY_ENABLED=false remain unchanged. Catalog management never grants human-review authority.

### 5.5 PCI-ENG-015-A Operations identity domain contract

PCI-ENG-014's final Operations identity architecture is adopted as the technical baseline. The
bounded PCI-ENG-015-A implementation adds only the pure contract module
`modules/operations-identity/operations-identity-contract.ts` and its focused tests. Human
Operations Principal/Account/Session metadata is separate from Provider Service and Platform System
Principal metadata. Typed execution attribution distinguishes Human direct execution, Human-initiated
System execution, Provider fact processing and autonomous System execution.

The contract deliberately remains outside `modules/shared/actors.ts` and does not alter the current
`pilot_operations` runtime. Credential secrets, Session Credential Hashes, authentication, BFF, MFA,
Permission enforcement, audit runtime and Admin API integration remain unimplemented. Principal,
Account and Service Principal persistence is recorded by the separately bounded PCI-ENG-015-B unit.
The original contract commit is `e2acf7b`; PCI-ENG-015-A is accepted and its final focused tests passed
13/13. That unit recorded pre-existing aggregate test-type diagnostics without closing them. Current
C1 Production and Active Backend Test TypeScript results are recorded separately in Section 5.8.

The following Operations implementation values are recorded by the accepted 015-A/015-B bounded
engineering deliveries. Acceptance covers only the named persistence categories; it does not grant
authentication, runtime, permission, Pilot, production or real-money authorization:

```text
OPERATIONS_HUMAN_PRINCIPAL_PERSISTENCE = IMPLEMENTED / ACCEPTED
OPERATIONS_ACCOUNT_PERSISTENCE = IMPLEMENTED / ACCEPTED
SERVICE_PRINCIPAL_PERSISTENCE = IMPLEMENTED / ACCEPTED
OPERATIONS_AUTHENTICATION = NOT IMPLEMENTED
OPERATIONS_SESSION_RUNTIME = NOT IMPLEMENTED
OPERATIONS_BFF = NOT IMPLEMENTED
OPERATIONS_PERMISSION_ENFORCEMENT = NOT IMPLEMENTED
OPERATIONS_ADMIN_API_INTEGRATION = NOT IMPLEMENTED
```

### 5.6 PCI-ENG-015-B Operations Principal persistence foundation

`PCI-ENG-015-B_PRINCIPAL_PERSISTENCE = ACCEPTED`.
This acceptance is limited to the three Principal/Account persistence categories above and their
recorded PostgreSQL verification evidence.

PCI-ENG-015-B implements only the PostgreSQL persistence foundation described in
[`123_Operations_Identity_Persistence_Baseline.md`](../09_Engineering_Governance/123_Operations_Identity_Persistence_Baseline.md).
It adds `operations_human_principals`, `operations_accounts` and `service_principals`, restricted
foreign-key and discriminator constraints, repository ports/adapters and an atomic Human
Principal + Account transaction. It does not add credentials, sessions, authentication, MFA,
permissions, audit runtime or Admin API behavior.

Migration `0036_operations_principal_persistence.sql` was installed from the complete migration
history in two independent disposable PostgreSQL rounds. Both rounds passed 11 focused integration
tests, including association integrity, canonical login handling, explicit error semantics,
concurrent uniqueness and rollback. The formal migration runner was run twice on each same database;
the journal remained at 37 rows. This proves local persistence
behavior only; it does not establish external Pilot, production or real-money authorization.

### 5.7 PCI-ENG-016-B Operations Credential persistence foundation

The following acceptance values are now authoritative for the bounded credential persistence unit:

```text
PCI-ENG-016-B_CREDENTIAL_PERSISTENCE = ACCEPTED
PCI-ENG-016-B-R1 = ACCEPTED
PCI-ENG-016-B-R2 = ACCEPTED
```

PCI-ENG-016-B delivers only Encoded Password Verifier persistence, the Operations Account Credential
Repository, an account-scoped Credential Version sequence beginning at 1 and increasing strictly,
atomic replacement using an Account row lock and expected version, revoked-history protection,
PostgreSQL integrity constraints and triggers, Operations Persistence Composition integration, and
Domain/PostgreSQL integration verification. Each Account has at most one active Password Credential;
all-revoked history permits only the next historical version; revoked records cannot be reactivated,
modified or deleted.

Verification is recorded as Domain 14/14 PASS and Credential plus Operations Identity PostgreSQL
19/19 PASS. Full Persistence remains 108 PASS, 12 FAIL and 3 SKIPPED. The same 12 failures reproduce
on the source baseline and are classified `PROVEN PRE-EXISTING — SOURCE BASELINE`; this is not a claim
that Full Persistence is fully green. Changed-file ESLint, TypeScript, build and migration checks pass;
full repository lint remains 458 errors and has not received a parent comparison.

The database has no independent Migration Role / Runtime Role. Compose uses the same `DATABASE_URL`
connection for Migration and API services, and superuser or equivalent database administration can
bypass ordinary trigger protection. Runtime Role / Migration Role separation must be separately approved
and accepted before Operations Authentication Runtime is enabled.

This acceptance does not authorize Operations login, Session creation, password reset, MFA, RBAC,
Admin BFF or Admin API, Creator Auth changes, Pilot, Production or real-money behavior. The following
control state remains unchanged:

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

### 5.8 PCI-ENG-016-C1 Session Domain Contract and Application Port acceptance

Authority: Main Controller's explicit PCI-ENG-016-C1-E2 acceptance instruction, dated 2026-11-13.
This records the accepted C0 design and C1 engineering delivery; it does not create follow-on scope.
The state block and test counts below are historical as of C1-E2, before C2. Current Session
persistence acceptance is recorded separately in Section 5.9.

```text
PCI-ENG-016-C0 = ACCEPTED
PCI-ENG-016-C1 = ACCEPTED
OPERATIONS_SESSION_DOMAIN_CONTRACT = ACCEPTED
OPERATIONS_SESSION_REPOSITORY_PORT = ACCEPTED
OPERATIONS_SESSION_PERSISTENCE = NOT IMPLEMENTED
OPERATIONS_AUTH_RUNTIME = NOT IMPLEMENTED
```

The accepted contract keeps Session Credential Version positive, Principal Security Epoch non-negative,
and Session Version separate as CAS Persistence Metadata. Each Human Session binds one Operations
Account and its matching Human Principal; Provider/System and Creator identities are excluded. Digest
and Encoded Password Verifier are distinct types, and neither Digest nor Session Version is added to
the Domain entity. Time ordering is `createdAt <= lastActivityAt <= idleExpiresAt <= absoluteExpiresAt`,
with `absoluteExpiresAt > createdAt`; Touch is monotonic, Rotation cannot change Absolute Expiry, and
revoked Sessions are terminal.

The seven Session operations are Create, Find Active by Digest, Validate/Touch, Strict CAS Rotate,
Revoke Single, Revoke All for Account and Revoke All for Principal. The separate Epoch Increment Port
uses expectedEpoch and permits only an increment of one. Future persistence must lock Human Principal
then Operations Account, Operations Credential and Operations Session; validate current Credential
Version and Security Epoch snapshots; and use Digest plus expectedSessionVersion CAS. It must fail
closed without a grace window, preserve the winner on a single CAS conflict and require
reauthentication after a lost rotation response. No default successor recovery is provided.
These are accepted persistence obligations, not implemented database behavior.

Accepted C1 verification: Domain Contract Tests 21 PASS; Session Repository Contract Tests 7 PASS;
total 28/28 PASS. Production TypeScript, Active Backend Test TypeScript, changed-file ESLint, Prettier
and `git diff --check` PASS. No PostgreSQL Session tests were executed because Session persistence
does not exist. C1-E2 preserves the four accepted engineering files and synchronizes this ledger;
these test numbers describe C1 evidence, not a new database or full-repository verification run.
Earlier 015-A/015-B/016-B evidence and repository-level limitations remain historical records.

Founder policies remain unfrozen: Idle Timeout, Absolute Lifetime, maximum concurrent Sessions,
Device Management, Touch frequency, Rotation trigger policy, Cookie/CSRF, Session history retention
and MFA Session semantics. Fixture dates do not approve 8h/24h or other policy values.

Acceptance does not implement or authorize Operations login/logout, Session issuance/runtime, Cookie,
BFF, MFA, RBAC, Admin API, a first Principal/Account, permission grants or Creator Auth changes.
The exact project control values in Sections 2 and 5.7 remain unchanged: CONTROLLED_RECOVERY, incomplete
Resume Gate, frozen VS-01, bounded Stage 2 only, no full Stage 2/Stage 3/Pilot/production or real money.

### 5.9 PCI-ENG-016-C2 Session Persistence acceptance and C2-E2 commit closure

Authority: Main Controller's explicit PCI-ENG-016-C2-E2 instruction, dated 2026-11-13, formally accepts
C2 and authorizes documentation synchronization plus one Git commit. It supersedes only the earlier
current Session persistence NOT IMPLEMENTED / IMPLEMENTATION IN PROGRESS and pending-acceptance states.
Historical C1 and C2 execution evidence remains unchanged; no authentication or product authority is added.

```text
PCI-ENG-016-C0 = ACCEPTED
PCI-ENG-016-C1 = ACCEPTED
PCI-ENG-016-C1-E2 = ACCEPTED
PCI-ENG-016-C2 = ACCEPTED
PCI-ENG-016-C2-E2 = ACCEPTED
OPERATIONS_SESSION_DOMAIN_CONTRACT = ACCEPTED
OPERATIONS_SESSION_REPOSITORY_PORT = ACCEPTED
OPERATIONS_SESSION_PERSISTENCE = ACCEPTED
OPERATIONS_SESSION_AUTH_RUNTIME = NOT IMPLEMENTED
```

Accepted delivery: `operations_sessions` PostgreSQL Schema and Migration 0038/Snapshot/Journal;
Account/Principal composite RESTRICT foreign key; 32-byte Digest persistence; independent Session
Version; Credential Version and Principal Security Epoch snapshots; all seven Session Repository
Port PostgreSQL implementations; independent Security Epoch CAS Repository; Strict CAS Rotation;
monotonic Touch and immutable Absolute Expiry; single and bulk revocation; INSERT/UPDATE, DELETE and
TRUNCATE trigger protection; and Operations Persistence Composition integration. The Domain/C1 Port
and Credential Persistence logic are unchanged. `mfa_verified_at` has no Step-up update interface.

Accepted C2 evidence, recorded here without a new test or Migration run:

| Check | Accepted result |
| --- | --- |
| Domain / Session Repository Port | 21 PASS / 7 PASS |
| Identity / Credential / Session PostgreSQL | 11 PASS / 8 PASS / 23 PASS |
| Focused total | 70/70 PASS, exit 0 |
| Full Persistence | 131 PASS / 12 FAIL / 3 SKIPPED, exit 1 |
| Source baseline comparison | The same 12 full names, files and error summaries match individually; `PROVEN PRE-EXISTING — SOURCE BASELINE` |
| Migration | 0037 -> 0038 succeeded, 38 -> 39 Journal rows; repeat execution preserves the identical 39 rows; fresh installation succeeded |
| Static/build checks | Production TypeScript, Active Backend Test TypeScript, changed-file ESLint, Prettier, Build and Migration Check PASS |
| Full lint | No new full-repository verification; the historical 458-error report still has no clean parent comparison |

The accepted-source comparison uses the same existing dependency tree, not an independent dependency
reconstruction. Raw C2 commands, logs and the 12-item reconciliation remain indexed by the C2 entry in
[`21_Prototype_Execution.md`](./21_Prototype_Execution.md). Full Persistence is not fully green.

Technical limits remain: Migration Role and Runtime Role are not separated; current Compose uses the
same `DATABASE_URL` for Migration and API; database administration can bypass ordinary triggers.
MFA Runtime and a Session Step-up update interface are not implemented. The 12 proven source-baseline
failures and 3 skips remain open. Concurrency evidence proves exercised schedules, not all possible
deadlock-free schedules. C2 excludes login, Session Credential issuance/verification Runtime, Cookie
and BFF. PostgreSQL verification is not production security certification.

Idle Timeout, Absolute Lifetime, concurrent Session limits, Device Management, Touch/Rotation policy,
Cookie/CSRF, retention and MFA Session policy remain unfrozen. Authentication Runtime, MFA, RBAC,
Admin BFF/API, first real Principal/Account, permission grants and Creator Auth changes remain excluded.
All project control values in Section 2 remain unchanged, including the incomplete Resume Gate,
bounded Stage 2, no Pilot/production and `REAL_MONEY_ENABLED = false`.

### 5.10 PCI-ENG-017-B terminal integrity acceptance and E2 commit closure

Authority: Main Controller's explicit PCI-ENG-017-B-E2 instruction, dated 2026-11-13, accepts
017-B within its UPDATE/DELETE integrity boundary and authorizes this ledger synchronization and
one Git commit. The original 017-B execution entry remains historical; only its pending current
acceptance state is superseded. No engineering logic or prior verification evidence is rewritten.

```text
PCI-ENG-017-A = ACCEPTED_READ_ONLY_ASSESSMENT
PCI-ENG-017-B = ACCEPTED
PCI-ENG-017-B-E2 = ACCEPTED
OPERATIONS_TERMINAL_STATE_UPDATE_PROTECTION = ACCEPTED
OPERATIONS_TERMINAL_STATE_DELETE_PROTECTION = ACCEPTED
```

Human Principal `tombstoned`, Operations Account `revoked` and Service Principal `revoked` are
irreversible terminal states. Terminal rows reject every later field/status UPDATE, including no-op
writes and indirect reactivation, and cannot be deleted. Entry from a nonterminal state remains
allowed. Existing Principal/Service suspended or disabled and Account locked or disabled recovery
semantics remain unchanged. Repository setters read/lock the current state in the update transaction;
Migration 0039 adds independent BEFORE UPDATE OR DELETE row triggers. No field, key or enum changes.

Accepted 017-B evidence, retained without new execution by E2:

- Focused and Operations regressions: 107/107 PASS, exit 0 (Domain 21, Session Port 7, Identity
  PostgreSQL 11, Credential PostgreSQL 8, Session PostgreSQL 23 and new terminal integrity 37).
- Full Persistence: 168 PASS / 12 FAIL / 3 SKIPPED, exit 1. The same 12 failed names/files/error
  summaries match retained accepted source-baseline evidence; no new failures or prior status changes.
  Classification remains `PROVEN PRE-EXISTING — SOURCE BASELINE`. The earlier source proof shares
  existing dependencies, without an independent rebuild; E2 does not rerun the parent suite.
- Production TypeScript, Active Backend Test TypeScript, changed-file ESLint, Prettier, Build and
  Migration Check PASS. Migration 0039 upgrade, identical rerun and empty installation PASS; Journal
  39 -> 40, repeat 40, fresh 40. Full Persistence is not fully green; full lint is not newly verified.

Mandatory limits: `TRUNCATE service_principals` succeeded in the verification environment; the new
guards cover UPDATE/DELETE only. Principal/Account TRUNCATE is currently blocked by foreign keys
and existing dependent-table guards, not independent identity TRUNCATE triggers. Migration/Runtime
Roles remain unseparated, and superuser/database administration can bypass triggers. Historical
illegal restoration has not been audited. No Security Epoch/Session status linkage, Authentication
Runtime, Password Hash/Verify, login, Bootstrap, MFA, RBAC or BFF is implemented by this delivery.

E2 preserves all seven accepted engineering-file bytes, adds only the four authorized governance
document changes and commits them together. Retained commands/results and provenance are indexed in
[`21_Prototype_Execution.md`](./21_Prototype_Execution.md). All Section 2 control values remain unchanged:
CONTROLLED_RECOVERY, incomplete Resume Gate, frozen VS-01, bounded Stage 2 only, no full Stage 2,
Stage 3, external Pilot or production, and `REAL_MONEY_ENABLED = false`.

### 5.11 PCI-ENG-017-C1 acceptance and C1-R1 Founder decision incorporation

Authority: Main Controller's PCI-ENG-017-C1-R1 instruction formally accepts C1 and records Founder
approval of FD-C1-01 through FD-C1-05. This current control section supersedes the original five
pending policy placeholders; it does not rewrite the original C1 execution evidence.

> Historical C1-R1 implementation submission: the awaiting-review status below is retained as recorded. Current formal acceptance appears in the subsequent E2 subsection.

```text
PCI-ENG-017-C0 = ACCEPTED
PCI-ENG-017-C1 = ACCEPTED
PCI-ENG-017-C1-R1 = IMPLEMENTATION COMPLETED — AWAITING MAIN CONTROLLER REVIEW
FD-C1-01 = APPROVED
FD-C1-02 = APPROVED
FD-C1-03 = APPROVED
FD-C1-04 = APPROVED
FD-C1-05 = APPROVED
OPERATIONS_LIFECYCLE_TRANSACTION_PERSISTENCE = NOT IMPLEMENTED
OPERATIONS_ACTIVATION_HISTORY_PERSISTENCE = NOT IMPLEMENTED
PCI-ENG-017-C2 = NOT AUTHORIZED
PCI-ENG-017-C3 = NOT AUTHORIZED
```

New Principal initialization is Epoch=0 and never_activated; Account has its own independent history.
First activation changes target history to previously_activated without an Epoch increment. Proven
recovery, active departure and terminal entry consume expected Principal Epoch; Account effects use
its owning Principal Epoch. Unknown/inconsistent histories reject activation. Active-to-initial and
all indirect returns to pending/invited are forbidden; whitelist transitions replace pending policies.
Commands cannot supply activation-history approval. Durable history must be read inside the future
transaction; storage, migrations and legacy verification remain unimplemented.

Ordinary Credential replacement requires both parents active and matching Expected Credential
Version/Principal Epoch. It changes neither history nor Epoch. Privileged Credential Recovery needs
separate authorization and design and is outside C2/C3 default scope. Complete matrices and security
effects are in Domain Baseline 5.5; transaction/read/audit obligations are in Persistence Baseline 3.5.

C1-R1 retains the fourteen pure ordered scenario contracts and separate Epoch/Credential/Session
Version brands. It provides no database concurrency or runtime authentication proof. Existing
Adapters/Composition, Migrations 0036-0039, Schema, roles, Creator Auth and Credential/Session
persistence remain unchanged. All Section 2 governance values remain unchanged; no C2/C3, Runtime,
Cookie/BFF, MFA/RBAC, Bootstrap, Pilot, Production or real-money authorization follows.

#### 5.11.1 PCI-ENG-017-C1-R1-E2 subsequent formal acceptance

Authority: Main Controller's explicit PCI-ENG-017-C1-R1-E2 instruction formally accepts
PCI-ENG-017-C1-R1. This subsequent decision supersedes the earlier awaiting-review submission status
for current acceptance only; that historical status and its original execution evidence are retained.
Accepted engineering commit: 8b08936dc2d4ae60fdaec82dea51daba848ae2f9.

```ini
PCI-ENG-017-C0 = ACCEPTED
PCI-ENG-017-C1 = ACCEPTED
PCI-ENG-017-C1-R1 = ACCEPTED
FD-C1-01 = APPROVED
FD-C1-02 = APPROVED
FD-C1-03 = APPROVED
FD-C1-04 = APPROVED
FD-C1-05 = APPROVED
PCI-ENG-017-C1-R1-E2 = DOCUMENTATION CLOSED — AWAITING MAIN CONTROLLER REVIEW
OPERATIONS_ACTIVATION_HISTORY_PERSISTENCE = NOT IMPLEMENTED
OPERATIONS_LIFECYCLE_TRANSACTION_PERSISTENCE = NOT IMPLEMENTED
PCI-ENG-017-C2 = NOT AUTHORIZED
PCI-ENG-017-C3 = NOT AUTHORIZED
```

Acceptance covers C1/C1-R1 Domain, Application contracts, tests and governance documents only.
The five approved decisions remain unchanged:

- New Principal initialization uses Epoch=0. First activation of Principal or Account does not increase
  Principal Epoch; the target's history changes to previously_activated.
- Principal and Account each require their own persisted never_activated / previously_activated /
  unknown history. This is the accepted future persistence contract, not completed database storage.
  Previously activated history cannot reset; unknown history cannot authorize activation or recovery.
- Active subjects cannot return to pending/invited, directly or through an intermediate state.
- The Founder-approved Principal/Account whitelist matrices remain authoritative and unchanged;
  expected status/Epoch checks and irreversible terminal-state rules remain in force.
- Ordinary Credential Replacement requires both parents active and matching expected Credential
  Version/Principal Epoch. Privileged Credential Recovery is NOT IMPLEMENTED and NOT AUTHORIZED;
  it is not part of C2/C3 default authorization and needs a separately approved recovery design.

Activation-history database persistence, historical-data verification/migration and lifecycle database
transactions remain NOT IMPLEMENTED. Real PostgreSQL concurrency, lock waits and transaction rollback
have not been proved by these pure Domain/Application tests. Runtime/Migration Roles remain
unseparated. This acceptance does not mean Authentication Runtime, MFA, RBAC or Production is complete
or authorized. Existing PostgreSQL evidence is historical and does not prove these new contracts.
The historical 155/155 C1-R1 test result is retained; E2 does not rerun engineering or database tests.

This is documentation closure only: no source, test, Schema, SQL, Migration, configuration, Adapter,
Composition or runtime changes. No database/Migration/role operation, Push or deployment occurs.
C2/C3 require separate authorization; all existing project governance restrictions remain in force.

### 5.12 PCI-ENG-017-C1-R2 / FD-UNKNOWN-01 restrictive contract

Authority: Main Controller's PCI-ENG-017-C1-R2 instruction and Founder decision
FD-UNKNOWN-01 = APPROVED. DEV-084 registers this bounded change. C1-R1 acceptance and its
historical 155/155 evidence remain unchanged. This section supersedes only the blanket rejection of
unknown-history restrictive changes; it does not supersede FD-C1-01 through FD-C1-05.

```ini
FD-UNKNOWN-01 = APPROVED
PCI-ENG-017-C2A = ACCEPTED
PCI-ENG-017-C2-0 = ACCEPTED AS DESIGN BASELINE
PCI-ENG-017-C1-R2 = IMPLEMENTATION COMPLETED — AWAITING MAIN CONTROLLER REVIEW
OPERATIONS_ACTIVATION_HISTORY_PERSISTENCE = NOT IMPLEMENTED
OPERATIONS_LIFECYCLE_TRANSACTION_PERSISTENCE = NOT IMPLEMENTED
PCI-ENG-017-C2-1 = NOT AUTHORIZED
PCI-ENG-017-C2-2 = NOT AUTHORIZED
PCI-ENG-017-C3 = NOT AUTHORIZED
```

| Principal transition (history unknown) | Account transition (history unknown) | Owning Principal Epoch | Active Session scope | Active Credential effect |
| -------------------------------------- | ------------------------------------ | ---------------------- | -------------------- | ------------------------ |
| pending -> disabled                    | invited -> disabled                  | unchanged              | target scope revoked | unchanged                |
| pending -> tombstoned                  | invited -> revoked                   | +1                     | target scope revoked | target scope revoked     |
| active -> suspended                    | active -> locked                     | +1                     | target scope revoked | unchanged                |
| active -> disabled                     | active -> disabled                   | +1                     | target scope revoked | unchanged                |
| active -> tombstoned                   | active -> revoked                    | +1 exactly once        | target scope revoked | target scope revoked     |
| suspended -> disabled                  | locked -> disabled                   | unchanged              | target scope revoked | unchanged                |
| suspended -> tombstoned                | locked -> revoked                    | +1                     | target scope revoked | target scope revoked     |
| disabled -> tombstoned                 | disabled -> revoked                  | +1                     | target scope revoked | target scope revoked     |
| tombstoned -> any state                | revoked -> any state                 | rejected               | no lifecycle writes  | no lifecycle writes      |

All successful restrictions retain unknown history verbatim and check Expected Status/Epoch,
ownership and the existing whitelist. Principal scope covers its Sessions; Account scope covers
only that Account's Sessions. Account changes consume the owning Principal Epoch only when planned;
they never change its Status or history. Epoch overflow rejects; no wrap, reset or skipped increment.

Account restrictions require an existing matching nonterminal Principal. Its unknown history is
allowed only for the listed actual restrictive transitions. Known-but-inconsistent or missing/invalid
history on either owner rejects. A tombstoned Principal blocks every Account lifecycle mutation.
No force, approved, privileged or caller-provided history can authorize an exception.

First activation, recovery, ordinary Credential replacement and Session Create/Validate/Touch/Rotation
remain strict: unknown cannot acquire or maintain authentication eligibility. Ordinary replacement
still requires both parents active with previously_activated histories and matching Credential
Version/Principal Epoch. Independent Session Revoke remains possible with inactive/unknown/terminal
parents, without updating their identity rows; revoked Session history remains immutable.

No new unknown same-state success is introduced. Existing legal pending/invited or disabled no-ops
retain their original parent/history and Expected Status/Epoch checks. Active/suspended/locked unknown
no-ops still reject; terminal updates, including no-op, always reject.

Plans now expose the closed, derived safetyOperation = standard | restrictive_unknown; this is not a
request flag or permission. The Application plan retains branded Epoch types and full Session/
terminal Credential effects. A transaction-local StateReader must return real unknown histories
without filtering, inference or repair. Future C2-2 must lock P -> A -> C -> S and atomically commit
status, required Epoch, unchanged history, scoped revocations and required audit, or roll back all.

C1-R2 local verification: Operations Identity 4 files / 325 tests PASS (Domain metadata 21,
lifecycle Domain 205, lifecycle Application 92, Session Repository Port 7). The unchanged source
baseline passed 155/155 before edits. The original 14 numbered concurrency contracts all still pass;
these are ordered pure-snapshot tests, not PostgreSQL concurrency, lock or rollback proof.
Production/core and API TypeScript, active backend test TypeScript, production TypeScript build,
changed-file ESLint, TypeScript Prettier and git diff --check passed. Added Markdown sections are
formatted/checked in isolation; all four full Markdown files already had Prettier differences at HEAD,
so unrelated historical text is preserved. Full repository lint/test suites and database tests were
not run. No PostgreSQL Migration, connection, permission or runtime operation was performed.

This unit implements pure Domain/Application contracts and tests only. History persistence, Migration
0040, Schema/Trigger/function changes, lifecycle PostgreSQL Adapter/transactions, audit storage,
historical classification tools, role separation and real PostgreSQL concurrency/rollback proof remain
unimplemented. The original 14 concurrency contracts remain pure snapshot tests, not SQL evidence.
No Creator Auth, login, password hash/verify/reset, Credential Recovery, Session issuance Runtime,
Cookie/BFF, MFA/RBAC, Bootstrap, Admin permissions, Pilot, production or real-money authority is added.

## 6. Authority and Supersession Rules

The following authority hierarchy applies by scope, not by file modification time:

1. Founder-approved Strategic Direction - strategic authority.
2. Founder-approved Product Contracts and explicit DEV Amendments - product authority.
3. Accepted Domain Decisions - domain-model authority.
4. Accepted Technology Decisions - technical-architecture authority.
5. This Project Control Baseline - current project governance and execution-range authority.
6. Prototype Execution - implementation history, deviations and verification evidence.
7. Project Handoff - historical suspension baseline and original Resume Gate evidence.
8. Development Backlog - planning and task index; no independent authorization power.
9. Git and source code - actual engineering implementation facts.
10. Test evidence - actual verification facts.

Conflict rules:

- This baseline controls the current project mode and allowed execution range.
- Historical documents remain unchanged as historical evidence unless a narrow synchronization note is
  explicitly authorized.
- A later explicit product amendment supersedes only the conflicting rule named by that amendment.
- A code commit never supersedes a product decision or creates Founder approval.
- A test result never creates implementation, pilot, production or money authorization.
- A proposed reconciliation never supersedes a Founder-owned source of truth until accepted.
- Unknown provenance is recorded as `PROVENANCE_REQUIRES_REVIEW`; it is never silently upgraded.

## 7. Documentation Synchronization Map

| Document | Current control treatment |
| --- | --- |
| Product Direction v0.3 | Strategic authority; approved from external Founder context; no full Stage 2 authorization |
| VS-01 MVP PRD | Frozen product contract; DEV-062, DEV-064 and DEV-082 amendments apply only within their explicit scope |
| Stage 2 Founder Decision Package | Historical decision-preparation artifact; `NOT AUTHORIZED` statements remain evidence of the prior baseline |
| Prototype Execution | Historical implementation and verification ledger; C2-E2 appends acceptance without rewriting earlier evidence |
| Project Handoff | Historical suspend baseline and nine Resume Gate conditions; current status is managed here |
| Development Backlog | Proposed planning index; no independent authorization |
| Stage 2 Execution Reconciliation | Proposed supporting evidence; not authoritative until accepted |
| Operations Identity Domain Contract | PCI-ENG-014 / 015-A and accepted C0/C1 contracts; records C2 persistence acceptance without changing the Domain or authorizing runtime |
| Operations Identity Persistence Baseline | Accepted 015-B Principal, 016-B Credential and 016-C2 Session persistence/evidence; no authentication runtime authorization |
| `docs/README.md` | Index and current-control navigation; must link to this baseline |
| Root `README.md` | Developer-facing summary; may state current implementation facts but not production approval |

## 8. Historical Decision Register

| Decision ID | Decision date | Description | Evidence source | Approved scope | Exclusions | Current effect | Superseded by |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `STAGE2-DECISION-001..009` | 2026-08-26 in ledger; independent signed date `UNKNOWN` | Canonical Identity, Profile, Reference, External Account and Relationship architecture | `docs/08_Execution/21_Prototype_Execution.md` DEV-028..030 | Pure domain contracts as later bounded units | Runtime, API, migration, OAuth, resolver, QR, money | Retained as bounded historical approval claim | This baseline narrows current execution to named units |
| `IDENTITY-001` | 2026-08-26 in ledger | Internal Identity and Commerce Profile contract | `docs/08_Execution/21_Prototype_Execution.md` DEV-028 | Domain contract | Persistence, API, UI, migration, delegation | Approved bounded unit | Runtime records require provenance review |
| `IDENTITY-002` | 2026-08-26 in ledger | External Platform Account and Commerce Relationship contract | `docs/08_Execution/21_Prototype_Execution.md` DEV-029 | Domain contract | OAuth, platform verification, persistence, public API | Approved bounded unit | `DEV-053` adds only self-declared composite command |
| `IDENTITY-003` | 2026-08-26 in ledger | Canonical Commerce Reference and immutable association | `docs/08_Execution/21_Prototype_Execution.md` DEV-030 | Domain contract | Generator, allocation, resolver and QR runtime | Retained only where compatible with Identity ownership | `DEV-061` |
| `DEV-053` | 2026-08-27 | Self-declared external account and relationship composite command | `docs/08_Execution/21_Prototype_Execution.md:4466` | Private self-declared `OWNER/PROPOSED` command | OAuth, platform proof, manager, public surface, money | Approved bounded unit | This baseline |
| `DEV-061` | 2026-11-08 | Identity-owned C-number | `docs/08_Execution/21_Prototype_Execution.md:7654` | One immutable C-number per Identity | New format, capacity or generic resolver policy | Current ownership rule | This baseline |
| `DEV-062` | 2026-11-08 | Public C-number homepage | `docs/07_Product_Architecture/20_MVP_PRD_VS01.md:605` | Exact C-number homepage and lifecycle | Search, discovery, marketplace, production launch | Current bounded homepage rule | `DEV-064` extends scheduling only |
| `DEV-063` | 2026-11-08 | Selected public Profile | `docs/08_Execution/21_Prototype_Execution.md:7824` | One selected Profile per Identity | Unselected Profile exposure and disclosure expansion | Current bounded selection rule | This baseline |
| `DEV-064` | 2026-11-08 | Time-scheduled homepage versions | `docs/08_Execution/21_Prototype_Execution.md:7878` | Server-time version selection and windows | Recurrence, visitor selection, new events | Current bounded scheduling rule | This baseline |
| `DEV-065` | 2026-11-09 | Profile-surface homepage management | `docs/08_Execution/21_Prototype_Execution.md:7949` | UI information architecture | API, database, permission and C-number changes | Current bounded UI rule | This baseline |
| `DEV-082` | 2026-11-10 | Controlled capability and service publishing | `docs/08_Execution/21_Prototype_Execution.md:8690` | Catalog, templates, policy states and gates | Arbitrary categories, marketplace, AI-only moderation | Acceptance remains open | `DEV-083` changes storage model only |
| `DEV-083` | 2026-11-11 | Database-managed service policy catalog | `docs/08_Execution/21_Prototype_Execution.md:8732` | Database-managed releases, records and audit | Payment, marketplace, CRM and new product objects | ENG-010 migration/implemented admin tests PASS; overall acceptance PARTIAL | This baseline, Section 5.3 |

## 9. Architecture Boundary Debt

The following are real engineering follow-up items. They are recorded here and are not fixed by this
documentation-only task:

- `public-creator-profile-routes.ts` is not registered by the current API server and contains the
  `commerce_profile_id === creator_id` assumption.
- The legacy public creator-profile frontend hook still calls the unregistered route.
- Root lint/typecheck and known repository-wide preflight failures remain open.
- ENG-012 closes root-script/retired-client topology debt; historical browser acceptance is archived
  and current Creator E2E coverage still needs explicit qualification.
- ENG-010 migration/implemented Operations verification passed; DEV-082/083 product acceptance and explicit contract conflicts remain open.
- Web V2 acceptance remains local and does not establish external or production acceptance.
- Fulfillment code generation and Commerce Action fulfillment update remain incomplete.

These debt items do not authorize code changes, schema changes, migration, deployment or product
expansion.

## 10. Current Prohibitions and Allowed Work

Prohibited without a new Founder decision and a named change unit:

- Full Stage 2 implementation;
- Stage 3 public resolver expansion or enumeration policy expansion;
- OAuth or platform verification;
- Manager, delegated manager or Profile transfer;
- new verticals, marketplace, CRM or discovery;
- external Pilot activation;
- production deployment;
- real payment, settlement, withdrawal or refund activation;
- changing `REAL_MONEY_ENABLED`.

Allowed within the bounded recovery control mode:

- documentation reconciliation;
- provenance review;
- regression and acceptance evidence collection for named units;
- controlled catalog migration rehearsal and admin verification for DEV-082/083;
- local-only verification that does not change product scope;
- ENG-012 topology retirement and independent Admin shell within its explicitly approved scope;
- architecture debt triage without implementation.

## 11. Verification and Provenance Limitations

- The earliest reachable Git root is the VS-01 delivery commit; formal project start is `UNKNOWN`.
- The repository has no independent signed Founder approval artifact for Product Direction v0.3 or all
  named units.
- The execution ledger contains stale `COMMITTED = NO` fields and historical environment limitations.
- Local tests, fixtures, simulations and isolated PostgreSQL do not prove external service, pilot,
  production or real-money acceptance.
- Current production database state and external deployment state are not asserted by this document.
- This baseline does not retroactively sign, rewrite or certify historical records.

## 12. Change Control

Any future product behavior change must identify the affected contract, domain objects, state
transitions, canonical events, permissions, acceptance evidence and DEV change unit before implementation.
This document must be updated only through a new governance change that preserves the historical
record and identifies the superseded rule explicitly.

Current control baseline owner: Main Controller.
Founder-only decisions remain required for strategic change, new product commitments, external Pilot,
production and real-money activation.


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


## PCI-ENG-017-C2-1-R2-REV1 External DBA Temporary MAINTAIN and EXCLUSIVE Backfill Barrier

Authority: Founder decision FD-C2-1-R2-01 and the PCI Main Controller REV1 implementation unit. This section is appended after the earlier blocked R2 record and does not rewrite that history.

~~~ini
PCI-ENG-017-C2-1-R2 = IMPLEMENTATION COMPLETED - AWAITING MAIN CONTROLLER REVIEW
PCI-ENG-017-C2-1-R2-REV1 = IMPLEMENTATION COMPLETED - AWAITING MAIN CONTROLLER REVIEW
FD-C2-1-R2-01 = APPROVED
PROJECT_CONTROL_MODE = CONTROLLED_RECOVERY
FORMAL_RESUME_GATE = NOT_FULLY_CLOSED
VS-01 = FROZEN
STAGE_2 = BOUNDED_APPROVED_CHANGE_UNITS_ONLY
FULL_STAGE_2 = NOT AUTHORIZED
STAGE_3 = NOT AUTHORIZED
EXTERNAL_PILOT = NOT AUTHORIZED
PRODUCTION = NOT AUTHORIZED
REAL_MONEY_ENABLED = false
~~~

REV1 changes only the installation authorization mechanism. An independently operated DBA may temporarily grant and revoke MAINTAIN for pci_ops_table_owner on public.operations_human_principals and public.operations_accounts. The Bootstrap and Migration identities never receive GRANT/REVOKE capability; Runtime receives neither MAINTAIN nor Table Owner membership; no DBA credential is stored. The wrapper performs a fail-closed preflight and never executes GRANT or REVOKE.

Migration 0040 now acquires operations_human_principals EXCLUSIVE first and operations_accounts EXCLUSIVE second, before any History/Audit backfill. Both locks, the backfill, Journal insert and commit/rollback run in one transaction and one backend PID. The reviewed SQL SHA-256 is 80c6bc3431fcc8f249e79a64cace60c6816f55cd889fce4c77cd4c007bf74ed7. Earlier 679714aee66fed20033a70062b9b8d7cbf8d00a7a0f48a4be63c99eb559fa5ea references remain historical pre-REV1 evidence and are superseded for the current wrapper. Migrations 0036-0039 are unchanged.

The disposable PostgreSQL 17.10 verification completed 20/20 targeted tests: external DBA grant/revoke ACL restoration, fail-closed preflight, upgrade and fresh installation, idempotent rerun, Runtime/Function Owner denial, and Principal/Account writer waits, Account creation serialization, rollback lock release, ordinary SELECT, and Runtime denial. Evidence is retained at E:/Users/jihx/AppData/Local/Temp/pci-c2-1-rev1-evidence.json; the run used only loopback disposable containers and ended with no task-labeled containers. This is not production permission certification and does not prove every possible PostgreSQL schedule.

The external DBA runbook is docs/09_Engineering_Governance/126_Operations_Activation_History_Migration_Runbook.md. Migration 0040 remains a separately reviewed bounded engineering unit; no Authentication Runtime, MFA, RBAC, BFF, Pilot, Production or real-money authority is implied.

## 13. Documentation Authority Reconciliation and C3-D Research Acceptance

This section supplements the Historical Decision Register in Section 8. Recording date:
2026-11-17 (task environment date). The original approval is the Founder's direct decision
in the current conversation; PCI-ENG-020-C3-E Section 2.1 carries it into execution,
and this Section 13 records it. Founder approval in the current conversation; no separate
FD identifier or independent signed approval artifact was supplied. No separate approval
date is invented. This provenance correction is authorized by PCI-ENG-020-C3-E-R1.

| Record                                                 | Current effect                                                                 | Evidence / scope                                                                                                          |
| ------------------------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| PCI-ENG-020-C3-D formal research acceptance and freeze | FROZEN / ACCEPTED — RESEARCH ONLY                                              | Founder direct conversation approval; C3-E §2.1 implements acceptance and freeze of the report, evidence index, research findings and recorded conclusions |
| Original report                                        | Preserved without edits, including its historical submission status            | docs/09_Engineering_Governance/PCI-ENG-020-C3-D-Thesis-Led-Personal-Commerce-Abstraction-Review.md                        |
| Original SHA-256                                       | 705ACF07F1614A5EB43BD02D5926DB19D7945621F5847C78E6AC9450BC4768F0               | Original bytes and embedded evidence index are protected                                                                  |
| Excluded authority                                     | No global architecture freeze, model selection or implementation authorization | No new object, cardinality, state machine, API, Schema, UI or commercial workflow is approved                             |

Later research may supplement or challenge C3-D only in a separate file with an explicit
reference. A later Founder Decision may resolve a specific question without rewriting
the historical report. C3-C and all other historical evidence remain unchanged.

The [Documentation Baseline and Freeze Register](../09_Engineering_Governance/PCI-ENG-020-C3-E-Project-Documentation-Baseline-and-Freeze-Register.md)
is the consolidated navigation for scope, approval provenance, precise supersession and
known conflicts. It does not outrank Founder decisions or promote Proposed ADRs.
Its own C3-E delivery remains AWAITING MAIN CONTROLLER REVIEW.

CONTROLLED_RECOVERY, NOT_FULLY_CLOSED, named bounded implementation units, no full Stage 2,
no Stage 3, no Production/external Pilot/real money and apps/app deferred remain unchanged.
This synchronization does not accept all later engineering reports or expand Admin authority.
GLOBAL COMMERCIAL SUPPLY DEFINITION begins only after Main Controller / Founder confirmation
of the documentation baseline; no substantive design is started by this record.

## 14. FD-C4A-R1-01 — Global Commercial Supply Foundation Decisions

Recording date / Founder decision date: 2026-11-17.
Authority: the Founder's direct `FD-C4A-R1-01` decision in the controller conversation;
`PCI-ENG-020-C4-A-FD-R1-SYNC` authorizes repository synchronization only.

This section appends to the Section 8 Historical Decision Register using its existing columns.
It also supplies the current authority update after the frozen C3-E / R1 snapshot, following the Section 13 supplement mechanism.
No original register row, snapshot, hash, approval provenance or earlier control text is rewritten.
The Founder's current instructions confirm C3-E / R1 acceptance and the documentation freeze; Section 13's awaiting-review wording records its historical delivery status.

Decision authority: **Founder Decision**.
Status: **FROZEN / ACCEPTED — CONCEPTUAL DECISIONS ONLY**.
Scope: **F01–F04**.
Implementation Authorization: **NOT GRANTED**.

Independent authoritative record:
[FD-C4A-R1-01](../07_Product_Architecture/36_Global_Commercial_Supply_Foundation_Decisions.md).
Source:
[C4-A Founder Decision Addendum](../09_Engineering_Governance/PCI-ENG-020-C4-A-Global-Commercial-Supply-Definition-Research-and-Founder-Decision-Package.md#founder-decision-addendum--fd-c4a-r1-01).
Synchronization evidence:
[FD-R1-SYNC Report](../09_Engineering_Governance/PCI-ENG-020-C4-A-FD-R1-SYNC-Founder-Decision-Repository-Synchronization-Report.md).

| Decision ID             | Decision date | Description                                                           | Evidence source                                                                                                                                                                                                                                                                                                                     | Approved scope                                                                                                                   | Exclusions                                                                                                                  | Current effect                                                                | Superseded by |
| ----------------------- | ------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------- |
| `FD-C4A-R1-01 / FD-F01` | 2026-11-17    | Canonical Vocabulary; F01 option B                                    | [C4-A Addendum](../09_Engineering_Governance/PCI-ENG-020-C4-A-Global-Commercial-Supply-Definition-Research-and-Founder-Decision-Package.md#founder-decision-addendum--fd-c4a-r1-01); [FD record §2](../07_Product_Architecture/36_Global_Commercial_Supply_Foundation_Decisions.md#2-fd-f01--canonical-vocabulary)                  | Supply / Offering / Product / Proposal-Terms / Commitment distinctions; historical Offer context retained                        | Entity count, schema, version implementation, API                                                                           | FROZEN / ACCEPTED; conceptual only; implementation NOT GRANTED                | None          |
| `FD-C4A-R1-01 / FD-F02` | 2026-11-17    | Capability is not globally mandatory; F02 option B                    | [C4-A Addendum](../09_Engineering_Governance/PCI-ENG-020-C4-A-Global-Commercial-Supply-Definition-Research-and-Founder-Decision-Package.md#founder-decision-addendum--fd-c4a-r1-01); [FD record §3](../07_Product_Architecture/36_Global_Commercial_Supply_Foundation_Decisions.md#3-fd-f02--capability-is-not-globally-mandatory)  | Asset/Right-led supply may lack explicit Capability under domain rules; real qualifications and responsibility remain necessary  | VS01 gate changes, per-domain relation/qualification/publishing/schema design                                               | FROZEN / ACCEPTED; global conceptual rule only; implementation NOT GRANTED    | None          |
| `FD-C4A-R1-01 / FD-F03` | 2026-11-17    | Value Source and four overlapping semantic perspectives; F03 option B | [C4-A Addendum](../09_Engineering_Governance/PCI-ENG-020-C4-A-Global-Commercial-Supply-Definition-Research-and-Founder-Decision-Package.md#founder-decision-addendum--fd-c4a-r1-01); [FD record §4](../07_Product_Architecture/36_Global_Commercial_Supply_Foundation_Decisions.md#4-fd-f03--capability--resource--asset--right)    | Narrow Capability; Resource/Asset/Right distinct; upstream authority, rights offering/proposal and Grant separate                | Four-entity/table requirement, Asset/Right storage model, rights-chain/Grant implementation                                 | FROZEN / ACCEPTED; semantic principles only; implementation NOT GRANTED       | None          |
| `FD-C4A-R1-01 / FD-F04` | 2026-11-17    | Responsibility-role analysis from F04 option C; owner anchor deferred | [C4-A Addendum](../09_Engineering_Governance/PCI-ENG-020-C4-A-Global-Commercial-Supply-Definition-Research-and-Founder-Decision-Package.md#founder-decision-addendum--fd-c4a-r1-01); [FD record §5](../07_Product_Architecture/36_Global_Commercial_Supply_Foundation_Decisions.md#5-fd-f04--offering-ownership-and-responsibility) | Distinct supply, asset/right, management, contracting and performance roles; existing identity and creatorId boundaries retained | Independent Provider entity, final owner anchor/cardinality, transfer/delegation/joint ownership, legal liability structure | FROZEN / ACCEPTED; responsibility separation only; implementation NOT GRANTED | None          |

The four rows are subdecisions of the same parent decision, not four new parent FD records.
No new columns or independent approval dates are inferred.

Current C4-A status: `RESEARCH ACCEPTED / F01-F04 FROZEN / F05-F11 OPEN`.
F05–F11 remain **OPEN / NOT DECIDED**. F05 and F10 are next in priority, followed by F06–F09 and then F11;
this synchronization must stop before starting that research.

C4-A Model B remains a candidate for later conceptual validation, not an accepted architecture.
The vocabulary option B and responsibility option C do not choose an architecture model.
No global Offering design/implementation, writable envelope, domain cardinality, API/DTO/event/state-machine/transaction,
inventory unification, creatorId migration, legal verification module, deployment, production, external pilot or real-money activity is authorized.

Current interpretation supplements C3E-CF-10/11 only for the explicitly decided F01–F04 semantics.
Owner anchor and the other unresolved dimensions remain open; C3E-CF-12/27 are not closed.
C3-D, C3-E and R1 content stays frozen. ADR-003/004/005 do not become fully accepted.
VS-01 and its amendments, controlled Capability/Template gates, Request decisions, Fulfillment Code/QR/confirmation,
Creator BFF/Session and identity isolation remain unchanged.

## 15. C5 D01–D04 — Founder Approved Conceptual Principles

Recording date: 2026-11-17 (task environment date). Approval source: the current controller instruction,
PCI-ENG-020-C5 — D01–D04 Founder Decision Sync & D05–D09 Second-Round Preparation, Sections 2–4,
explicitly records the Founder's acceptance of the complete Main Controller directions for D01–D04.
No separate signed artifact, parent FD ID or independent approval date was supplied; none is invented.
The date column below is the recording date of that approval, not an independently verified signing date.

This section follows Sections 13–14's append-only supplement mechanism and the Section 8 decision-index columns.
The original C5 report and frozen C3-D / C3-E / R1 / C4-A records remain unchanged;
their submission-time statuses are historical. Only the specified D01–D04 principles are now Founder approved.

Independent authority record: [C5 D01–D04 Founder Decisions](../07_Product_Architecture/37_C5_D01_D04_Founder_Decisions.md).
Original research: [C5 report](../09_Engineering_Governance/PCI-ENG-020-C5-Global-Commercial-System-Abstraction-and-Shared-Transaction-Infrastructure-Research-and-Founder-Decision-Package.md), Sections 2–7, 11 and 16–17.

| Decision ID          | Decision date          | Description                                                                 | Evidence source                                                            | Approved scope                                                                                                                   | Exclusions                                                                                                      | Current effect                     | Superseded by |
| -------------------- | ---------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ------------- |
| PCI-ENG-020-C5 / D01 | 2026-11-17 (recording) | Shared Commercial Facts Infrastructure + Six Independent Domain Expressions | Current instruction Section 2 D01; Decision37 Section 2; C5 Section 16 D01 | Complete conceptual direction: shared commercial facts with independent Service/Goods/Program/Membership/Project/Right semantics | Unified domain lifecycle/state machine/fulfillment; Core write authority; architecture implementation           | FOUNDER APPROVED — conceptual only | None          |
| PCI-ENG-020-C5 / D02 | 2026-11-17 (recording) | Contextual Participant Model                                                | Current instruction Section 2 D02; Decision37 Section 3; C5 Section 16 D02 | Complete conceptual direction: shared identity with transaction-context Buyer/Provider/Payer roles                               | Global fixed user roles; disconnected identities; identity/auth changes; Owner Anchor                           | FOUNDER APPROVED — conceptual only | None          |
| PCI-ENG-020-C5 / D03 | 2026-11-17 (recording) | Professional Domain Models + Common Protocol                                | Current instruction Section 2 D03; Decision37 Section 4; C5 Section 16 D03 | Complete conceptual direction: professional domain models connect through common protocol                                        | Six Service Templates; mandatory common commitment/fulfillment; API/DTO/protocol/aggregate/state-machine design | FOUNDER APPROVED — conceptual only | None          |
| PCI-ENG-020-C5 / D04 | 2026-11-17 (recording) | Shared Stable References + Typed Domain Definitions                         | Current instruction Section 2 D04; Decision37 Section 5; C5 Section 16 D04 | Complete conceptual direction: stable common commercial references and typed domain semantics/invariants                         | Unique Owner Anchor; shared writable entity; universal writable aggregate; table/cardinality design             | FOUNDER APPROVED — conceptual only | None          |

The qualified D01–D04 references identify the approved C5 items; they do not invent a new parent FD number.
No approval of the complete SYS/TX/FIN/REV candidates, shared writable Envelope, universal Order/Transaction entity,
ledger implementation, domain aggregate, API, migration or deployment follows from these rows.

[D05–D09 preparation](../09_Engineering_Governance/PCI-ENG-020-C5-D05-D09-Second-Round-Founder-Decision-Preparation.md)
uses existing C5 materials only. Recommendations are drafts for Main Controller review and Founder decision.
[Synchronization and verification](../09_Engineering_Governance/PCI-ENG-020-C5-D01-D04-Decision-Sync-and-Verification-Report.md)
records the documentation-only execution, Git state and preservation checks.

FD-C4A-R1-01 F01–F04 retain their exact frozen scope; C4-B proposals and other unresolved questions are not approved or closed here.
VS-01 and its amendments, controlled Capability/Template gates, Request Confirm/Decline,
Fulfillment Code/QR/confirmation, scoped Appearance, Creator Session/BFF and upstream logout remain unchanged.
There is no product behavior change or new DEV deviation.

D01–D04 = FOUNDER APPROVED. D05–D09 = PROPOSED / AWAITING FOUNDER DECISION.
D10–D12 = DEFERRED. IMPLEMENTATION = NOT AUTHORIZED.
No code, Schema, API or architecture implementation; no Production, external Pilot or real-money authorization.

## 16. C5 D05–D09 — Founder Approved; D10–D12 Preparation

Recording date: 2026-11-17 (task environment date). Approval source: the current controller instruction,
PCI-ENG-020-C5 — D05–D09 Founder Decision Sync & D10–D12 Final Conceptual Decision Preparation, Sections 1–3.
Founder approved all five complete Main Controller directions without modification; the explicit principles and exclusions govern.
No separate parent FD number, signed artifact or independent approval date was supplied or invented.
The date below is the recording date, not an independently verified signing date.

This append-only supplement updates current effect, not the original C3-D/C3-E/R1/C4-A/C5 research or earlier Founder Decisions.
The proposed/deferred statuses in Section 15 and earlier preparation/execution documents remain historical;
only D05–D09 are newly approved, and D10–D12 are now prepared for decision. This is not whole-architecture approval.
Read the frozen Register together with Sections 14–16 and the independent decision records.

Authority record: [C5 D05–D09 Founder Decisions](../07_Product_Architecture/38_C5_D05_D09_Founder_Decisions.md).

| Decision ID | Decision date | Description | Evidence source | Approved scope | Exclusions | Current effect | Superseded by |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PCI-ENG-020-C5 / D05 | 2026-11-17 (recording) | Transaction / Order abstraction | Current instruction Section 2 D05; Decision38 Section 2; C5 Section 16 D05 | Shared transaction association and traceability; authoritative domain records; one procurement may link multiple records | Universal Order; writable Envelope; TX-B default; final TX-C; shared write authority; fixed cardinality/schema | FOUNDER APPROVED — conceptual only | None |
| PCI-ENG-020-C5 / D06 | 2026-11-17 (recording) | Order and Commitment | Current instruction Section 2 D06; Decision38 Section 3; C5 Section 16 D06 | Order/Commitment/Fulfillment/Payment distinct; domain acceptance determines responsibilities; sourced progress | Global Commitment entity/state machine; line-to-commitment rule; common fulfillment | FOUNDER APPROVED — conceptual only | None |
| PCI-ENG-020-C5 / D07 | 2026-11-17 (recording) | Financial and Ledger boundary | Current instruction Section 2 D07; Decision38 Section 4; C5 Section 16 D07 | Shared fund facts and traceability; domain obligations/triggers/settlement; no duplicate booking | Wallet; Holder model; global accounting; ledger/payment/refund/settlement/withdrawal implementation; real money | FOUNDER APPROVED — conceptual only | None |
| PCI-ENG-020-C5 / D08 | 2026-11-17 (recording) | Review and Reputation | Current instruction Section 2 D08; Decision38 Section 5; C5 Section 16 D08 | Shared review evidence; domain eligibility/scales; Review/Rating/Reputation distinct; sourced projection | Global score/stars; unified review rules; publish/delete/appeal/disposition; UI review data migration | FOUNDER APPROVED — conceptual only | None |
| PCI-ENG-020-C5 / D09 | 2026-11-17 (recording) | Composite and cross-domain transactions | Current instruction Section 2 D09; Decision38 Section 6; C5 Section 16 D09 | Multiple domains/providers/responsibilities; five distinct views; local facts, versions and allocation traceable | Bundle entity; unified composite order/state; distributed transaction/locks/orchestration/API; automatic refund/cancel/remedy | FOUNDER APPROVED — conceptual only | None |

The qualified references identify the existing C5 decision items, not new parent FD IDs.
D01–D09 together authorize conceptual principles only: no schema/data/history changes, API/DTO/events,
Shared Core or domain aggregate/write-authority/state-machine implementation, VS-01 refactor,
Creator/Operations identity/Session/BFF/auth changes, financial functions, Pilot, Production or commercial operation.
Owner Anchor and concrete shared/domain architecture remain unresolved. C4-B proposals, C3-E conflicts and Proposed ADRs are not automatically accepted or closed.

[D10–D12 third-round preparation](../09_Engineering_Governance/PCI-ENG-020-C5-D10-D12-Third-Round-Founder-Decision-Preparation.md)
organizes the existing C5 materials only. Recommendations on shared/domain authority, VS-01 continuity and
T07+T12+T14 with T04/T05 counterexamples are drafts for Main Controller review and Founder decision.
No conceptual sample execution or prototype was started.
[Sync and verification report](../09_Engineering_Governance/PCI-ENG-020-C5-D05-D09-Decision-Sync-and-Verification-Report.md)
records file preservation and documentation checks.

VS-01 and its amendments, Capability/Template publishing gates, Request Confirm/Decline,
Fulfillment Code/QR/confirmation, scoped Appearance, Creator BFF/Session and upstream logout remain unchanged.
No product behavior change or new DEV deviation occurs.

D01–D04 = FOUNDER APPROVED. D05–D09 = FOUNDER APPROVED.
D10–D12 = PROPOSED / AWAITING FOUNDER DECISION. IMPLEMENTATION = NOT AUTHORIZED.
Stop after documentation delivery; no automatic conceptual validation, engineering design or implementation.

## 17. C5 D10–D12 — Founder Approved; Conceptual Decision Registration Closed

Founder decision date / recording date: 2026-11-17. Source: the current controller instruction,
PCI-ENG-020-C5 — D10–D12 Founder Decision Sync & C5 Conceptual Decision Closure, Sections 1–3.
Founder accepted D10, D11 and D12 in full according to the Main Controller recommendations, without changes.
The decision date is explicitly supplied by that instruction; no independent signed artifact or parent FD ID is inferred.

This append-only supplement continues Sections 13–16 and the Section 8 eight-column decision index.
Earlier PROPOSED / DEFERRED statuses retain their historical context; current conceptual approval is recorded here.
C3-D, C3-E / R1, C4-A, original C5 research, Decision37 / Decision38 and preparation documents remain unchanged.

Authority record: [D10–D12 Founder Decisions and unified index](../07_Product_Architecture/39_C5_D10_D12_Founder_Decisions.md).
Prior records: [D01–D04](../07_Product_Architecture/37_C5_D01_D04_Founder_Decisions.md),
[D05–D09](../07_Product_Architecture/38_C5_D05_D09_Founder_Decisions.md).

| Decision ID | Decision date | Description | Evidence source | Approved scope | Exclusions | Current effect | Superseded by |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PCI-ENG-020-C5 / D10 | 2026-11-17 (instruction-supplied) | Shared Core and Domain authority boundary | Current instruction Section 2 D10; Decision39 Section 2; third-round preparation Section 2 | Shared References / Shared Facts / Domain Facts / Domain Projections; source versus interpretation; domain authority; sourced progress | SYS-A/B/C final selection; Core write structure; aggregates/cardinality/topology/transactions; API/DTO/events; universal Order/Commitment or superaggregate; implementation | FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY | None |
| PCI-ENG-020-C5 / D11 | 2026-11-17 (instruction-supplied) | VS-01 compatibility and evolution | Current instruction Section 2 D11; Decision39 Section 3; third-round preparation Section 3 | Existing Service implementation slice; contract/security continuity; bounded progressive association; no fabricated history or retroactive semantics | PRD/behavior/auth changes; gates/Appearance/Fulfillment; creatorId/C-number/Owner Anchor; API/adapters/views/events/migration/refactor; Paid Service/funds; implementation | FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY | None |
| PCI-ENG-020-C5 / D12 | 2026-11-17 (instruction-supplied) | Minimal conceptual validation instance | Current instruction Section 2 D12; Decision39 Section 4; third-round preparation Section 4.6 | T07+T12+T14; T04/T05 counterexamples; all nine success/failure criteria; source evidence; known/unknown/assumption/inference distinctions | Static validation execution; prototype/simulation; database/Schema/API/DTO/events/code; sandbox/funds/auto-refund; architecture/engineering; automatic C4-A F11 decision | FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY | None |

Decision39 Section 5 unifies the twelve conceptual decisions; Decision37 and Decision38 retain their exact definitions and exclusions.
The nine D12 criteria are incorporated in full from the unchanged third-round preparation Section 4.6.
The scenarios are constructed conceptual materials, not actual transactions or evidence of completed payments, fulfillment or reviews.
Accepting objects and criteria does not execute validation. Any later static validation requires a separately scoped authorization.

Shared facts do not give Shared Core exclusive production/write rights. Common progress remains a sourced projection,
not a second authority for domain success. No SYS/TX architecture, Owner Anchor, writable Envelope, universal Order/Commitment,
aggregate, database, API or deployment design is selected or authorized. C4-A F11, other open issues and Proposed ADRs do not automatically close.
VS-01 contracts, Request Confirm/Decline, Fulfillment Code/QR/confirmation, scoped Appearance,
Capability/Template gates and Creator BFF/Session/Operations isolation remain unchanged.

```text
D01–D04 = FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY
D05–D09 = FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY
D10–D12 = FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY
C5 D01–D12 CONCEPTUAL DECISION REGISTRATION = COMPLETED

ARCHITECTURE FINALIZATION = NOT AUTHORIZED
CONCEPTUAL VALIDATION EXECUTION = NOT AUTHORIZED
PROTOTYPE = NOT AUTHORIZED
IMPLEMENTATION = NOT AUTHORIZED
PILOT = NOT AUTHORIZED
PRODUCTION = NOT AUTHORIZED
REAL_MONEY_ENABLED = false
```

These are authorization states, not runtime configuration observations.
[Sync and verification report](../09_Engineering_Governance/PCI-ENG-020-C5-D10-D12-Decision-Sync-and-Verification-Report.md)
records documentation-only changes and protection checks; Execution21 records the task.
No product behavior change or new DEV deviation. Stop after delivery for Main Controller review;
no automatic D12 execution, architecture/Shared Core/data/API design, prototype or engineering.

## 18. Global Commercial System — Conceptual Model Consolidation Direction Approval Only

Recording date: 2026-11-17 (task environment date). Approval source: the current controller instruction,
PCI-ENG-020 — Founder Approval Sync: Global Commercial System Conceptual Model Consolidation, Sections 1–8.
Founder approved the next-stage direction and its bounded research scope/deliverables, with repository synchronization first.
No independent signing date, signed artifact or new parent FD ID is inferred.

Authority record: [Decision40 — direction approval and task gates](../07_Product_Architecture/40_Global_Commercial_System_Conceptual_Model_Consolidation_Founder_Approval.md).
This append-only supplement preserves Sections 13–17, the frozen documentation baseline and all prior decisions/research.
The earlier D01–D12 decisions remain conceptual-only: [Decision37](../07_Product_Architecture/37_C5_D01_D04_Founder_Decisions.md),
[Decision38](../07_Product_Architecture/38_C5_D05_D09_Founder_Decisions.md),
[Decision39](../07_Product_Architecture/39_C5_D10_D12_Founder_Decisions.md). No historical text is rewritten.

| Decision ID | Decision date | Description | Evidence source | Approved scope | Exclusions | Current effect | Superseded by |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PCI-ENG-020 / Conceptual Model Consolidation Direction (task reference, no new FD ID) | 2026-11-17 (recording) | Global Commercial System — Conceptual Model Consolidation | Current instruction Sections 1–6; Decision40 Sections 1–6 | Next-stage conceptual direction; seven bounded scope areas and seven expected deliverables; documentation sync first | Immediate research execution; D12 execution; SYS/TX/FIN selection; Owner Anchor; Core writes; database/API/events/aggregates/topology; prototype/engineering; VS-01/security changes; funds/Pilot/Production | APPROVED DIRECTION; execution AWAITING SEPARATE TASK AUTHORIZATION | None |

Stage A is this authorized documentation sync and read-only Markdown/link/Git/protection verification, followed by an immediate stop.
Stage B is NOT STARTED: Main Controller must explicitly accept Stage A, then issue a separately scoped execution instruction.
Review, acceptance, direction approval or elapsed time alone does not start Stage B. D12 execution is independently NOT AUTHORIZED.

Decision40 Sections 2–4 register the future question, Service/Goods/Program/Membership/Project/Right scope,
concept boundaries, domain mapping, transaction relationships, source/authority analysis, consistency/counterexamples and issue classification.
Seven future deliverables are registered only; no model, matrix, diagram, research findings or new decision advice is produced now.
No SYS/TX/FIN architecture, Owner Anchor, Shared Core write structure, schema/API/DTO/event design,
aggregate/cardinality/transaction/topology, universal Order/Commitment or superaggregate is approved.
VS-01 contracts and security, Creator/Operations identity/Session/BFF, Capability/Template, Appearance and Fulfillment remain unchanged.
No payment/refund/settlement/sandbox, prototype, engineering, Pilot, Production or real-money authority is granted.

[Sync and verification report](../09_Engineering_Governance/PCI-ENG-020-Global-Conceptual-Model-Consolidation-Founder-Approval-Sync-and-Verification-Report.md)
records the fresh baseline and documentation-only changes; Execution21 records this task. No product behavior change or new DEV deviation.

方向批准与执行授权分别登记：

```text
C5 D01–D12 = FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY
C5 CONCEPTUAL DECISION REGISTRATION = COMPLETE
GLOBAL CONCEPTUAL MODEL CONSOLIDATION = APPROVED DIRECTION
GLOBAL CONCEPTUAL MODEL CONSOLIDATION EXECUTION = AWAITING SEPARATE TASK AUTHORIZATION
D12 CONCEPTUAL VALIDATION EXECUTION = NOT AUTHORIZED
```

本轮交付与尚未开始的研究状态：

```text
FOUNDER APPROVAL SYNC = COMPLETED
MAIN CONTROLLER REVIEW = AWAITING
GLOBAL CONCEPTUAL MODEL CONSOLIDATION = NOT STARTED
CONCEPTUAL MODEL RESEARCH = NOT EXECUTED
ARCHITECTURE FINALIZATION = NOT AUTHORIZED
D12 VALIDATION = NOT AUTHORIZED
PROTOTYPE = NOT AUTHORIZED
IMPLEMENTATION = NOT AUTHORIZED
PILOT = NOT AUTHORIZED
PRODUCTION = NOT AUTHORIZED
REAL_MONEY_ENABLED = false
```

上述是方向、授权及文档执行状态，不是运行开关检测。交付后立即停止；必须等待 Main Controller 明确接受本轮同步结果并发出下一阶段独立指令，不能自动进入研究或任何后续设计/实施。


## 19. Global Commercial System — Stage B Conceptual Consolidation Research Delivered

记录日期：2026-11-17。当前独立指令 **PCI-ENG-020 — Global Commercial System Conceptual Model Consolidation** §1 明确：Main Controller 已正式接受 Decision40 / Stage A，并独立授权 Stage B 概念综合研究。Stage A = CLOSED。§18 和 Decision40 中当时的 NOT STARTED / AWAITING 保留历史语境，不回写原文；本轮研究授权来自独立指令，不是方向批准自动升级。

本轮完成 WP-01–WP-07，交付[主模型与全部研究入口](../09_Engineering_Governance/PCI-ENG-020-Global-Conceptual-Model.md)、六类×十七维映射、核心关系图、事实来源/权威图与七类责任矩阵、D01–D12 文档一致性与缺口审查、A/B/C/D 未决登记和五项 Founder 研究建议。完整来源及证据性质见[权威索引](../09_Engineering_Governance/PCI-ENG-020-Global-Conceptual-Source-Authority-Index.md)。

本轮综合结果是 RESEARCH PROPOSAL / AWAITING MAIN CONTROLLER REVIEW，不是新的 Founder Decision。现有 D01–D12 仍为概念原则批准；角色/权源、有效接受、混合领域、组合依赖和未知/冲突表达仍有待决。没有将历史 C3-D/C4-A/C5 候选、C4-B S2/P2、SYS/TX/FIN/REV、Owner Anchor、共享写结构或其他 Proposed ADR 升级批准；C4 F05–F11 不自动关闭。

本轮 WP-06 仅做文档原则一致性推理，不运行 D12 指定场景/反例和九项判据，不输出 D12 验证结果。图是概念语义关系，不是实体/数据库/接口/状态机/模块/部署图。没有模拟成交、资金、履行或评价事实；没有架构、原型或工程。VS-01 产品与安全合同、Request Confirm/Decline、Fulfillment Code/QR/确认、限定 Appearance、Capability/Template、Creator/Operations 身份与 Session/BFF 均保持。

[研究与核验报告](../09_Engineering_Governance/PCI-ENG-020-Global-Conceptual-Research-and-Verification-Report.md)记录 fresh Git 基线、1,444 个原文件保护、九份新增 Markdown 和三份追加、只读 Markdown/链接/Git 检查。既有八项 tracked 修改和 67 个原 untracked 保留；不纳入历史 evidence，不 Commit/Push/暂存。没有产品行为变化或新 DEV 偏差。

```text
STAGE A = CLOSED
STAGE B = CONCEPTUAL RESEARCH COMPLETED
GLOBAL CONCEPTUAL MODEL = DELIVERED
C5 D01–D12 = FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY
D12 STATIC VALIDATION = NOT AUTHORIZED
ARCHITECTURE FINALIZATION = NOT AUTHORIZED
PROTOTYPE = NOT AUTHORIZED
IMPLEMENTATION = NOT AUTHORIZED
PILOT = NOT AUTHORIZED
PRODUCTION = NOT AUTHORIZED
REAL_MONEY_ENABLED = false
MAIN CONTROLLER REVIEW = AWAITING
FOUNDER DECISIONS = AWAITING WHERE REQUIRED
```

这些是授权和文档交付状态，不是运行配置检测。研究交付不等于模型获 Founder 接受；本轮交付后立即停止，等待 Main Controller 审阅。D12、架构、原型、工程和资金均需另行明确授权。

## 20. FD-PCI-SCENARIO-SEQUENCING-001 — Commercial Scenario Sequencing

2026-11-18 登记；来源为 Founder 指令 PCI-DOC-003 §1。状态：**FOUNDER APPROVED / FROZEN**。

- 正式决定：[42 — Commercial Scenario Sequencing Founder Decision](../07_Product_Architecture/42_Commercial_Scenario_Sequencing_Founder_Decision.md)。
- 战略导航：[05 — Product Direction：Future Expansion Criteria](../01_Strategy/05_Personal_Commerce_Infrastructure_Product_Direction.md#20-future-expansion-criteria)。
- 范围：虚拟和线下优先，逐步接入线上及长周期履约或交付；Service 之后优先 Membership，后续按业务实际排序。只登记战略顺序，不作为架构批准、Membership 产品合同或上线授权；历史及概念决定不回写。

## 21. FD-PCI-MEMBERSHIP-FIRST-SLICE-001 — Membership First Slice

2026-11-18 登记；来源为 Founder 指令 PCI-PD-004 §A1。状态：**FOUNDER APPROVED / FROZEN**。正式决定见 [43 — Membership First Slice Founder Decision](../07_Product_Architecture/43_Membership_First_Slice_Founder_Decision.md)，实施边界见 [44 — Product Contract](../07_Product_Architecture/44_Membership_First_Slice_Product_Contract.md)。仅批准本轮免费、固定期、线下核验的切片，不修改先前决定或开启生产运营。

## 22. PCI-DOC-004 — Membership First Slice Closure

2026-11-19 登记；来源为 Founder 批准的 PCI-DOC-004。该登记同步已验收实现与集成状态，不修改 Founder Decision 或产品合同。

```text
MEMBERSHIP FIRST SLICE IMPLEMENTATION = COMPLETED
MEMBERSHIP FIRST SLICE ACCEPTANCE = ACCEPTED
PCI-PD-004 = CLOSED
PCI-PD-005 = INTEGRATION ACCEPTED
MEMBERSHIP PRODUCTION READINESS = NOT VERIFIED
SERVICE = FIRST OPERATIONAL SLICE INTEGRATED
MEMBERSHIP = SECOND OPERATIONAL SLICE INTEGRATED / ACCEPTED
GOODS / PROGRAM / PROJECT / RIGHT = NOT INTEGRATED
EXTERNAL PILOT = NOT AUTHORIZED
PRODUCTION DEPLOYMENT = NOT AUTHORIZED
REAL_MONEY_ENABLED = false
```

当前 Membership 首期范围、语义边界、验收依据和未验证项见 [PCI-DOC-004 Closure](PCI-DOC-004-Membership-First-Slice-Closure.md)。本状态不表示生产准入、真实身份服务接入、生产 TLS、真实外部运营或真实资金已完成。

## 23. FD-PCI-PROGRAM-FIRST-SLICE-001 — Program First Slice

2026-11-19 登记；来源为 Founder 指令 PCI-DOC-005。状态：**FOUNDER APPROVED / FROZEN**。正式决定见 [45 — Program First Slice Founder Decision](../07_Product_Architecture/45_Program_First_Slice_Founder_Decision.md)，研究依据为 [PCI-PD-006 Decision Package](PCI-PD-006-Program-Third-Operational-Scenario-Decision-Package.md)。

Founder 已批准单一提供方、线下、短周期、固定期限、有限名额、多场次的 Program Run / Cohort，以及独立的 Program Offering、Run、Enrollment、Session、Participation 和 Completion 语义。首期免费，不产生 Payment fact，`REAL_MONEY_ENABLED = false`；Program 仍未接入运营。

```text
PROGRAM = THIRD SCENARIO / BUSINESS BASELINE APPROVED
PROGRAM OPERATIONAL INTEGRATION = NOT INTEGRATED
PROGRAM IMPLEMENTATION = NOT AUTHORIZED BY PCI-DOC-005
SERVICE = FIRST OPERATIONAL SLICE INTEGRATED
MEMBERSHIP = SECOND OPERATIONAL SLICE INTEGRATED / ACCEPTED
GOODS / PROJECT / RIGHT = NOT INTEGRATED
PRODUCTION READINESS = NOT VERIFIED
EXTERNAL PILOT = NOT AUTHORIZED
PRODUCTION DEPLOYMENT = NOT AUTHORIZED
REAL_MONEY_ENABLED = false
```

取消、延期、名额占用时点、待审批申请、通知及既有 Run 在暂停时的处理细则仍待后续明确，不得由工程人员自行补造。本登记不修改 Conceptual Baseline 41、D01–D12、F01–F04、既有领域合同或 PCI-PD-006 历史研究内容，也不授权 Program 实施。

## 24. FD-PCI-GOODS-FIRST-SLICE-001 — Goods First Slice

2026-11-20 登记；来源为 Founder 指令 PCI-DOC-006。状态：**FOUNDER APPROVED / FROZEN**。正式决定见 [48 — Goods First Slice Founder Decision](../07_Product_Architecture/48_Goods_First_Slice_Founder_Decision.md)，研究依据为 [PCI-PD-008 Goods Fourth Operational Scenario Decision Package](PCI-PD-008-Goods-Fourth-Operational-Scenario-Decision-Package.md)。

Founder 已批准 Goods First Slice F01-F09：个人商业主页为 Goods 的主要展示和发现入口；首期为个人卖家、单一 Goods Offering、单件、按需准备、卖家确认接单、卖家自行安排交付；不建立库存、物流、Marketplace 或 PCI 真实 Payment。线下结算保持在 PCI Payment 系统之外，`REAL_MONEY_ENABLED = false`。

```text
GOODS = FOURTH SCENARIO / BUSINESS BASELINE APPROVED
GOODS FIRST SLICE RULES = F01-F09 FROZEN
GOODS OPERATIONAL INTEGRATION = NOT INTEGRATED
GOODS IMPLEMENTATION = NOT AUTHORIZED BY PCI-DOC-006
SERVICE = FIRST OPERATIONAL SLICE INTEGRATED
MEMBERSHIP = SECOND OPERATIONAL SLICE INTEGRATED / ACCEPTED
PROGRAM = THIRD OPERATIONAL SLICE INTEGRATED
PROJECT / RIGHT = NOT INTEGRATED
PRODUCTION READINESS = NOT VERIFIED
EXTERNAL PILOT = NOT AUTHORIZED
PRODUCTION DEPLOYMENT = NOT AUTHORIZED
REAL_MONEY_ENABLED = false
```

本登记只同步 Founder Decision 和项目控制状态，不授权 Goods API、Schema、Migration、Consumer、Creator、Admin 或个人商业主页代码实施；后续实现须由独立 PCI-PD-009 授权。Conceptual Baseline 41、D01-D12、F01-F04、Decision 47 及既有场景决定保持不变。

## 25. PCI-PD-009 — Goods Fourth Operational Scenario Implementation

2026-11-20 登记；来源为 PCI-PD-009，业务基线为已冻结的 FD-PCI-GOODS-FIRST-SLICE-001（F01-F09）。本节是当前实现状态更新，不改写第 24 节对 PCI-DOC-006 的历史记录，也不修改 Decision 47、Decision 48、Conceptual Baseline 41、D01-D12 或 F01-F04。

PCI-PD-009 在独立工作树和分支中完成首期 Goods 实现：Goods Offering 的 Creator 发布/修改/暂停、个人商业主页商品投影、匿名浏览和登录后单件下单、价格与条款快照、卖家接受/拒绝、Goods Commitment、交付确认、可选买家收货确认、卖家取消提议，以及既有 Operations Human 对 Goods 场景开放/暂停控制。Goods 与 Service、Membership、Program 保持独立领域语义；没有库存、SKU、物流平台、Marketplace、真实 Payment、退款、结算或真实资金路径。

真实隔离 PostgreSQL 已按既有安装前置约定完成 0000–0045 迁移，并验证 Goods 持久化、Admin 场景暂停连续性、Offering 暂停连续性和零 Payment 行。迁移前置观察到空库直接运行 0040 时缺少 operations_private；该已知安装前置条件在一次性容器内按正式安装约定补齐后通过，未修改迁移或生产代码。

GOODS = FOURTH OPERATIONAL SCENARIO / IMPLEMENTED ON PCI-PD-009 BRANCH
GOODS ACCEPTANCE = AWAITING MAIN CONTROLLER ACCEPTANCE
GOODS OPERATIONAL INTEGRATION = NOT YET IN MASTER
SERVICE = FIRST OPERATIONAL SLICE INTEGRATED
MEMBERSHIP = SECOND OPERATIONAL SLICE INTEGRATED / ACCEPTED
PROGRAM = THIRD OPERATIONAL SLICE INTEGRATED
PROJECT / RIGHT = NOT INTEGRATED
PRODUCTION READINESS = NOT VERIFIED
EXTERNAL PILOT = NOT AUTHORIZED
PRODUCTION DEPLOYMENT = NOT AUTHORIZED
REAL_MONEY_ENABLED = false

见仓库外 D:/codeSpace/_PCI_ARCHIVE/evidence/PCI-PD-009-Goods-Implementation-20261120/PCI-PD-009-Goods-Implementation-Report.md。本变更不合并 master，不 Push，不部署生产，不启动外部 Pilot，不启用真实资金。
