# 25 - Project Control Baseline

> **Status**: CURRENT CONTROL BASELINE
> **Effective date**: 2026-11-12
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
| `PCI-ENG-015-A` | `APPROVED` (bounded) | Pure Operations Human/Machine identity domain contracts and tests | Persistence, authentication, Session runtime, BFF, permissions, Actor migration, Admin API and product behavior | Commit `e2acf7b`; focused contract tests 11/11; production source typecheck and focused lint pass | Yes, only contract verification and review |
| `PCI-ENG-015-B` | `APPROVED` (bounded) | Operations Human Principal, Account and Service Principal persistence foundation | Credentials, sessions, authentication, MFA, BFF, permissions, Actor migration, Admin API, Pilot, production and money | Commits `c5c4349`, `3da7213`; migration check PASS; two fresh PostgreSQL rounds PASS | Yes, only persistence evidence closure and explicitly named regression work |

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
The contract commit is `e2acf7b`; focused tests pass 11/11. Aggregate active-test typechecking retains
pre-existing repository diagnostics and is not claimed closed.

The following Operations implementation values are recorded by the 015-A/015-B bounded units:

```text
OPERATIONS_HUMAN_PRINCIPAL_PERSISTENCE = IMPLEMENTED / ACCEPTANCE_PENDING
OPERATIONS_ACCOUNT_PERSISTENCE = IMPLEMENTED / ACCEPTANCE_PENDING
SERVICE_PRINCIPAL_PERSISTENCE = IMPLEMENTED / ACCEPTANCE_PENDING
OPERATIONS_AUTHENTICATION = NOT IMPLEMENTED
OPERATIONS_SESSION_RUNTIME = NOT IMPLEMENTED
OPERATIONS_BFF = NOT IMPLEMENTED
OPERATIONS_PERMISSION_ENFORCEMENT = NOT IMPLEMENTED
OPERATIONS_ADMIN_API_INTEGRATION = NOT IMPLEMENTED
```

### 5.6 PCI-ENG-015-B Operations Principal persistence foundation

PCI-ENG-015-B implements only the PostgreSQL persistence foundation described in
[`123_Operations_Identity_Persistence_Baseline.md`](../09_Engineering_Governance/123_Operations_Identity_Persistence_Baseline.md).
It adds `operations_human_principals`, `operations_accounts` and `service_principals`, restricted
foreign-key and discriminator constraints, repository ports/adapters and an atomic Human
Principal + Account transaction. It does not add credentials, sessions, authentication, MFA,
permissions, audit runtime or Admin API behavior.

Migration `0036_operations_principal_persistence.sql` was installed from the complete migration
history in two independent disposable PostgreSQL rounds. Both rounds passed the five focused
integration tests, including concurrent uniqueness and rollback. This proves local persistence
behavior only; it does not establish external Pilot, production or real-money authorization.

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
| Prototype Execution | Historical implementation and verification ledger; not rewritten in this task |
| Project Handoff | Historical suspend baseline and nine Resume Gate conditions; current status is managed here |
| Development Backlog | Proposed planning index; no independent authorization |
| Stage 2 Execution Reconciliation | Proposed supporting evidence; not authoritative until accepted |
| Operations Identity Domain Contract | PCI-ENG-014 technical baseline and PCI-ENG-015-A pure domain contract; no runtime authorization |
| Operations Identity Persistence Baseline | PCI-ENG-015-B bounded persistence implementation/evidence; no authentication or runtime authorization |
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
