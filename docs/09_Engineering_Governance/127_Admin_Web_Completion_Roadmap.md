# PCI-ENG-018-A — Admin Web Completion Roadmap

> Status: `PCI-ENG-018-A-R1 = EVIDENCE-BACKED ADMIN WEB ROADMAP COMPLETED — AWAITING MAIN CONTROLLER REVIEW`
>
> Date: 2026-11-14. This document is a read-only capability baseline and delivery plan.
>
> Baseline: `codex/pci-eng-015-b-r2-persistence-closure` at `70d7f4f35aa0313b244d075eaf4415b8328e75a2`.

## 1. Founder Priority

Founder priority has moved from further PCI-ENG-017 low-level persistence investigation to a usable
Operations Admin Web. The post-lock P+A scenario from PCI-ENG-017-C2-1-R2-REV1-E1 is accepted as
not applicable by the Main Controller and is not a follow-up item in this roadmap.

This roadmap does not reopen PCI-ENG-014, reimplement accepted Operations persistence, or change
the following control state:

```ini
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

## 2. Product Position

Admin Web is an internal platform operations workbench. Its first responsibility is to make the
existing product flow observable and controllable by an authorized Operations actor:

```text
Identity
    -> Capability
    -> Service Offering
    -> Publish / Distribution
    -> Customer Request
    -> Creator Confirm / Decline
```

The workbench is not a second product surface, a database console, a generic CRUD generator, or a
new authority model. Server-side application services remain the source of business rules, state
transitions, permissions and audit facts. The browser receives views and submits named operations
through the shared API.

Payments, settlement, refunds, Marketplace, CRM, commercial-pilot activation, withdrawal authority,
and human review/adjudication remain outside this baseline unless separately approved.

## 3. Current Topology

| Module                 | Current state              | What it does now                                                                                | Roadmap implication                                                                     |
| ---------------------- | -------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `apps/admin-web`       | Implemented Shell          | Independent Next.js presentation, seven navigation destinations, loading/error/not-found states | Add an API client and authenticated data screens; keep backend code out of the browser  |
| `apps/api`             | Active shared backend      | Registers shared Creator, public, Operations, system and commerce routes                        | Add Operations authentication/BFF seams here; do not create a second backend            |
| `apps/web-v2`          | Active Creator Web         | Creator identity, profile, offering and request surfaces                                        | Reuse existing contracts and services; do not move Creator authority into Admin Web     |
| Operations persistence | Accepted                   | Principal, Account, Service Principal, Credential and Session persistence                       | Reuse accepted ports/adapters; do not recreate tables or migrations                     |
| Operations runtime     | Not implemented            | Static server-held Operations token only                                                        | Implement dedicated Principal/Account authentication and server-side Session validation |
| PostgreSQL             | Shared persistence adapter | Existing application composition and accepted Operations repositories                           | Admin Web never connects to PostgreSQL directly                                         |

The adopted topology and the Shell-only restriction are recorded in
`docs/09_Engineering_Governance/121_Operations_Admin_Web_Architecture.md:10` and
`docs/09_Engineering_Governance/121_Operations_Admin_Web_Architecture.md:22`.

## 4. Frontend Baseline

### 4.1 What is real today

- `apps/admin-web/app/layout.tsx:6` provides metadata and the shared `AdminShell`; it explicitly
  describes the workbench as not yet open.
- `apps/admin-web/app/page.tsx:12` renders an unavailable overview and six pending work areas.
- `apps/admin-web/app/[section]/page.tsx:11` renders a static pending page for every section and
  returns 404 for unknown sections.
- `apps/admin-web/components/admin-shell.tsx:8` provides navigation, active-location state,
  keyboard skip navigation, responsive layout and the visible unauthenticated status.
- `apps/admin-web/lib/sections.ts:1` is navigation metadata only; it is not a permission registry.
- `apps/admin-web/components/admin-shell.test.tsx:17` verifies seven destinations, unavailable
  states, safe error rendering and loading state. It intentionally verifies that no data table or
  management control exists.

### 4.2 What is absent

| Frontend capability               | Current state | Evidence                                                                                                |
| --------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------- |
| API client                        | Missing       | No Admin API client or request module exists in `apps/admin-web`                                        |
| State management                  | Missing       | Pages contain static metadata and pending states only                                                   |
| Login page                        | Missing       | The Shell states that authentication is not connected at `apps/admin-web/components/admin-shell.tsx:44` |
| Session bootstrap/logout          | Missing       | No browser session integration or server-side BFF integration                                           |
| Data loading/cache                | Missing       | No operational data requests or tables                                                                  |
| Mutations                         | Missing       | Tests assert no buttons at `apps/admin-web/components/admin-shell.test.tsx:39`                          |
| Audit display                     | Missing       | `/audit` is a placeholder only                                                                          |
| Reports/appeals and manual review | Missing       | Both are placeholders; no backend contract is selected                                                  |

The Shell was intentionally bounded by ENG-012. Its local verification passed, including nine
smoke tests, production build, responsive checks and credential-sentinel scanning, as recorded in
`docs/09_Engineering_Governance/121_Operations_Admin_Web_Architecture.md:117`.

## 5. Shared API Capability Matrix

This matrix distinguishes a usable HTTP capability from a Domain Contract or Persistence Adapter.

| Area                                          | Existing HTTP/API capability                                          | Current authorization                                | Admin Web state                | Gap                                                                                               |
| --------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------- |
| Health/readiness/OpenAPI                      | `/health`, `/api/v1/readiness`, `/openapi.json`                       | Runtime engineering checks                           | Not an Admin feature           | None for this roadmap                                                                             |
| Capability catalog                            | Operations workspace, audit, capability update                        | Static Operations token mapped to `pilot_operations` | No Admin screen                | Replace auth boundary, then add read-only screen; mutation needs explicit permission enforcement  |
| Service templates                             | Operations workspace, audit, template update                          | Same static token                                    | No Admin screen                | Same as catalog                                                                                   |
| Policy versions                               | Existing publish endpoint for loaded catalog versions                 | Same static token                                    | No Admin screen                | Add version history/read view, then bounded publish action                                        |
| Creator offerings                             | Creator-only list/create/update/publish/unpublish/distribution routes | Creator Actor Context                                | No Operations route            | Add Operations read model/use case before Admin visibility; do not reuse Creator authority        |
| Customer Requests                             | Public request creation and Creator list/confirm/decline routes       | Public or Creator Actor Context                      | No Operations list/status view | Add a named read-only Operations query; any Operations mutation requires separate contract review |
| Identity / Principal / Account                | No Operations HTTP routes                                             | Persistence and Domain/Application contracts only    | No Admin screen                | Add bounded Operations API use cases after runtime and bootstrap authority are settled            |
| Credential / Session                          | Accepted repositories and PostgreSQL persistence                      | No authentication runtime                            | No Admin integration           | Implement runtime issuance/validation using accepted persistence                                  |
| Service policy audit                          | `GET /api/v1/operations/service-policy/audit`                         | Static Operations token                              | No Admin screen                | Add authenticated read view; preserve actor and correlation fields                                |
| Operations action audit                       | Persistence adapter exists for commercial operations                  | Used by existing commercial-pilot services           | No unified Admin audit API     | Define an Admin audit read model only for approved domains                                        |
| External observations                         | Operations routes for external payment/fulfillment facts              | Static Operations token                              | Not an Admin baseline feature  | Keep separate from catalog administration                                                         |
| Commercial Pilot / Paid Commerce / Withdrawal | Existing Operations routes exist                                      | Static Operations token or pilot actor               | Out of this Admin baseline     | Requires separate Founder/business authority; do not expose through the first Admin release       |

The Service Policy route is a genuine shared API capability: its workspace and audit reads begin at
`adapters/transport/http/service-policy-routes.ts:84`, and its bounded capability/template/publish
operations begin at `adapters/transport/http/service-policy-routes.ts:121`. The route still accepts
an `Authorization` Bearer token and delegates to the current Operations provider at
`adapters/transport/http/service-policy-routes.ts:52`.

The API composition already has explicit seams for an Operations provider and Service Policy
services at `apps/api/src/create-api-server.ts:80` and registers them at
`apps/api/src/create-api-server.ts:376`. This is the correct integration seam for the Admin
runtime; a Next.js server action or a second Admin backend is not.

## 6. Operations Identity, Session and Credential Baseline

| Layer                                           | Current state               | What that means                                                                          |
| ----------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------- |
| Principal/Account/Service Principal persistence | `ACCEPTED`                  | Durable repositories, constraints and terminal protections exist                         |
| Encoded Password Verifier persistence           | `ACCEPTED`                  | The repository stores an already encoded verifier; it does not hash or verify a password |
| Session Domain Contract and Repository Port     | `ACCEPTED`                  | CAS, digest, version, epoch and terminal rules are available to an implementation        |
| Session PostgreSQL persistence                  | `ACCEPTED`                  | Session rows and Epoch CAS persistence exist; no runtime issues or validates a Session   |
| Password verification runtime                   | Not implemented             | No verifier algorithm execution, login decision or credential replacement flow           |
| Session issuance/validation/revocation runtime  | Not implemented             | No request can establish an Operations Session from a browser                            |
| First Operations Principal/Account              | Not created/authorized here | Bootstrap and administrator invitation remain a separate authority decision              |
| BFF and opaque HttpOnly cookie                  | Not implemented             | The browser has no trusted session boundary                                              |
| Permission registry/enforcement                 | Not implemented             | The existing `pilot_operations` check is not a dedicated Admin permission system         |
| Admin API integration                           | Not implemented             | Existing Operations routes are not evidence of an Admin Web product                      |

The authoritative current state is recorded in
`docs/09_Engineering_Governance/122_Operations_Identity_Domain_Contract.md:550` through
`docs/09_Engineering_Governance/122_Operations_Identity_Domain_Contract.md:590`.

The current Operations provider is still a static token comparison that creates a
`pilot_operations` Actor Context, as shown in
`adapters/auth/operations/static-operations-auth-context-provider.ts:12`. It is suitable for the
existing bounded server-held Operations calls, not for the Admin Web browser boundary.

## 7. Admin Capability Matrix

| Capability                   | Frontend    | Backend                                                               | Identity state                       | Classification                                           | Next step                                                            |
| ---------------------------- | ----------- | --------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------- | -------------------------------------------------------------------- |
| Shell/navigation             | Usable      | Not applicable                                                        | None                                 | Available Shell                                          | Keep stable while adding data states                                 |
| Operations login             | Missing     | Static token only                                                     | Runtime missing                      | Fully missing for Admin                                  | Implement dedicated runtime and BFF                                  |
| Capability catalog view      | Missing     | Workspace/read API exists                                             | Static token                         | API/Persistence exists; frontend missing                 | First read-only Admin data screen                                    |
| Service template view        | Missing     | Workspace/read API exists                                             | Static token                         | API/Persistence exists; frontend missing                 | Add beside capability view                                           |
| Policy version history       | Missing     | Release persistence and publish route exist                           | Static token                         | Backend partial; frontend missing                        | Add read view before publish control                                 |
| Capability/template updates  | Missing     | Existing PATCH routes and audit service exist                         | No Admin permission registry         | Backend available but not Admin-authorized               | Require permission contract and reason/audit UI                      |
| Catalog publish/distribution | Missing     | Catalog release publish exists; offering distribution is Creator-only | No Admin runtime                     | Split catalog release from Creator offering distribution | Do not imply one grants the other                                    |
| Offering status              | Missing     | Creator offering routes exist                                         | Creator auth only                    | Backend exists for Creator, not Operations               | Add read-only Operations query                                       |
| Request status               | Missing     | Public and Creator request routes exist                               | Creator auth only                    | Backend exists for other actors, Operations missing      | Add read-only Operations query                                       |
| Confirm/Decline visibility   | Missing     | Creator confirm/decline routes exist                                  | Creator auth only                    | Product flow exists; Admin authority missing             | Decide whether Admin only observes or may act                        |
| Identity administration      | Missing     | Persistence only                                                      | Dedicated runtime missing            | Persistence only                                         | Founder/Main Controller must define bootstrap and allowed operations |
| Audit records                | Missing     | Service Policy and selected Operations audit stores exist             | Actor attribution depends on runtime | Partial backend                                          | Define approved Admin audit read model                               |
| Reports/appeals              | Placeholder | No accepted Admin workflow API                                        | No authority                         | Fully missing and unresolved                             | Founder decision required                                            |
| Manual reviews               | Placeholder | No accepted workflow API                                              | No authority                         | Fully missing and unresolved                             | Founder decision required                                            |

## 8. Authentication and BFF Boundary

The implementation must retain the frozen PCI-ENG-014 shape:

1. A dedicated Operations Human Principal and Operations Account authenticate the operator.
2. A credential verifier is evaluated server-side; the browser never receives a verifier, static
   Operations token or trusted Principal/Permission header.
3. The shared API establishes a server-side Operations Session using the accepted Session
   persistence adapter.
4. The browser receives one opaque `HttpOnly` cookie with the selected `Secure`, `SameSite` and
   path policy. Cookie and CSRF/origin behavior must be explicit in the named implementation unit.
5. The shared API resolves the cookie to the Session, Principal, Account and current permissions on
   every protected request. It must re-check terminal state, Session expiry, Credential version and
   Principal security epoch.
6. The Admin Web only renders server responses and submits named contracts. It does not connect to
   PostgreSQL, import backend modules, or decide permissions from navigation metadata.
7. The BFF seam belongs in the shared API transport/application composition. `apps/admin-web` must
   remain an independent client rather than a second backend.

The current Shell boundary explicitly forbids browser credentials, backend imports and PostgreSQL
access in `apps/admin-web/AGENTS.md:3`. The existing static-token implementation must therefore be
replaced or isolated behind the server-side Operations runtime before Admin Web is enabled.

## 9. Core Operations Modules

### 9.1 Catalog administration

This is the shortest existing product slice. The shared API already returns a Service Policy
workspace and audit records, validates update input, requires a non-empty reason, serializes catalog
updates with a transaction lock and appends audit records. The implementation is in
`applications/service-policy/service-policy-admin-service.ts:33` and the PostgreSQL adapter keeps
the update and audit write in one transaction.

The first Admin catalog release should therefore expose:

- Current policy version, capability status, creator-selectability, publish gate and risk tier.
- Service templates and their linked capability identifiers.
- Policy release history and the existing audit records.
- Loading, stale-data, validation, 401, 403, 404 and safe retry states.

Mutation controls should follow a successful read-only release. They may call the existing named
PATCH and publish contracts, but only after the API has a real Operations Session and an explicit
permission check. A catalog permission must not imply Offering-level human-review authority.

### 9.2 Offering, distribution and request visibility

The product flow already has Creator-facing offering and request endpoints. It does not have an
Operations read model that lets Admin Web answer which offerings are published, which distributions
are active, which requests are waiting, or which Creator action was recorded. These are bounded
read-model/use-case gaps, not permission to invent new lifecycle states.

The next operations slice should add read-only views over existing facts and status vocabulary. It
must not let an Admin operator impersonate a Creator or silently add Creator confirm/decline powers.
If the product decision requires Operations to confirm or decline on behalf of a Creator, that is a
new authority and needs Founder approval.

### 9.3 Identity and lifecycle administration

The accepted identity persistence does not constitute an Admin identity API. First Principal
creation, Account invitation, Credential setup, Session revocation and lifecycle transitions need
named application use cases, audit attribution and explicit bootstrap authority. No initial Admin
account or permission grant is implied by this roadmap.

### 9.4 Reports, appeals and manual reviews

The Shell has placeholders for these areas, but there is no accepted backend contract or decision
model. The existing architecture document requires exact DEV-082/DEV-083 clauses and actor
permissions before any review or appeal workflow is implemented. Do not create states, outcomes,
disciplinary actions or roles from the navigation labels alone.

## 10. Shortest Delivery Path

The shortest usable path is a vertical sequence with a visible result at every step:

### Phase 1 — Admin Runtime

**Unit 018-B: Operations Admin Runtime Vertical Slice**

Implement the frozen Operations authentication shape in the shared API and connect the Admin Shell
to it. Reuse the accepted Credential and Session persistence interfaces. This unit must include
login, logout, Session lookup, expiry/revocation handling, one opaque HttpOnly cookie, API-side
identity/permission checks, safe 401/403 responses and audit correlation. It must not add a new
database model unless the frozen runtime contract proves an existing accepted model insufficient.

User-visible result: an authorized operator can open Admin Web, sign in, retain a server-side
Session, sign out, and see a protected empty workspace; an unauthenticated or revoked operator
cannot load Operations data.

Dependencies: accepted 016-B/C2 persistence, the PCI-ENG-014 architecture, and a Founder/Main
Controller decision for the first Operations Principal/Account, verifier policy, bootstrap path and
initial permission grant.

Acceptance:

- No Operations token, verifier, Principal ID or permission header appears in browser JavaScript,
  URLs, storage or rendered HTML.
- Login, logout, expiry, revoked Session, revoked Account, tombstoned Principal and Epoch/credential
  mismatch fail closed.
- API authorization is derived from the server-side Session and current identity state.
- Cookie, CSRF/origin and same-origin behavior are tested against the actual Admin origin.
- Session and authentication events carry actor, correlation and outcome audit data without secrets.
- Admin Web has authenticated loading, empty, error and retry states.

### Phase 2 — Admin Operations

**Unit 018-C: Catalog Read-Only Vertical Slice**

Connect `/capabilities`, `/templates`, `/policy-versions` and `/audit` to the existing Service
Policy workspace/audit contracts. Do not add generic CRUD or new policy semantics.

User-visible result: an authenticated operator can inspect the current capability catalog, service
templates, policy version and catalog audit history with server-authoritative status.

Acceptance:

- The browser uses typed shared API contracts and never imports domain or persistence code.
- The UI renders the exact server state, including policy version and audit actor/correlation data.
- 401, 403, validation, not-found, stale response and retry paths are visible and safe.
- Read access is denied when the API Session lacks the approved permission.

**Unit 018-D: Bounded Catalog Controls**

Enable the already registered capability/template PATCH and policy release operations only after
permission enforcement and audit attribution are accepted. Keep reason-required validation and the
existing transaction/audit behavior.

User-visible result: an authorized operator can make a named catalog change and see the resulting
audit record; an unauthorized operator cannot call the same operation even if the UI is modified.

Acceptance:

- API and UI agree on 401 versus 403 semantics.
- Every mutation has an explicit reason and durable actor/correlation attribution.
- Concurrent updates preserve the existing transaction and catalog version rules.
- No Offering, Request, review, payment or withdrawal authority is added.

**Unit 018-E: Operations Flow Visibility**

Add read-only Operations use cases for existing Offering, Distribution and Customer Request facts.
This unit may reuse existing status objects and application services, but it must introduce named
transport contracts and tests rather than query tables from the Admin client.

User-visible result: Operations can see where an Offering and Request are in the frozen product
flow and which Creator action has been recorded.

Acceptance:

- No new product lifecycle state or canonical event is introduced without a registered deviation.
- The API filters data by the authenticated Operations permission and records the request context.
- Creator-only actions remain Creator-only unless a separate Founder decision grants Operations
  authority.

### Phase 3 — Admin Completion

**Unit 018-F: Completion and Operational Hardening**

Complete navigation based on implemented capabilities, unified loading/error/empty states, audit
links, correlation IDs, accessibility checks, API contract tests, integration tests and deployment
configuration for the approved local/runtime environments.

Acceptance:

- Every visible navigation destination is either a working bounded feature or explicitly marked
  unavailable; no label implies an unimplemented authority.
- Admin API contract tests cover authentication, authorization, data shape, mutations and audit.
- Browser tests cover login, protected navigation, logout, expiry/revocation and the catalog flow.
- Admin build/lint/typecheck/security boundary checks remain green.
- No Production, external Pilot or real-money claim is made.

Reports/Appeals and Manual Reviews should remain separate deferred units until Founder resolves the
authority, recorded facts, allowed outcomes and permission model. They are not completion blockers
for the first catalog operations release.

## 11. Founder and Main Controller Decisions

| Decision                                                         | Evidence/current conflict                                                                               | Decision owner                                                               |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Name the first Operations Principal/Account and bootstrap path   | Persistence is accepted, but no real first account or bootstrap authority exists                        | Founder approval required                                                    |
| Select the verifier algorithm/encoded-verifier production policy | 016-B stores encoded verifiers but deliberately does not hash or verify them                            | Founder approval required, then Main Controller records the bounded contract |
| Approve initial Admin permission set and grants                  | Current `pilot_operations` is a static-token Actor Context; no dedicated permission registry exists     | Founder for authority; Main Controller for implementation boundary           |
| Approve Session cookie, CSRF/origin and timeout values           | Session persistence exists; runtime policy values remain unfrozen                                       | Founder approval required for policy values                                  |
| Enable catalog read-only Admin integration                       | Existing Service Policy workspace/audit API and DEV-082/083 bounded catalog direction exist             | Main Controller can authorize within the approved direction                  |
| Enable catalog mutations through Admin Web                       | Existing PATCH/publish routes exist, but current auth is static and permission semantics are incomplete | Main Controller after permission contract; Founder if authority expands      |
| Let Operations view Offerings/Requests                           | Existing facts and Creator routes exist, but no Operations read model                                   | Main Controller can define a read-only bounded unit                          |
| Let Operations confirm/decline for a Creator                     | This would transfer Creator authority to Operations                                                     | Founder approval required                                                    |
| Add Reports/Appeals or Manual Reviews                            | Existing Shell labels have no backend contract, result model or actor authority                         | Founder approval required                                                    |
| Expose Paid Commerce, Withdrawal or Commercial Pilot controls    | Existing routes do not equal Admin Web authorization; these are separately governed                     | Founder approval required                                                    |

Main Controller may decide implementation seams, read-only screen ordering, contract reuse, error
presentation and bounded API integration when they stay within approved product behavior. Founder
approval remains required for new authority, bootstrap, permission grants, review/adjudication,
commercial operations or any expansion beyond the frozen flow.

## 12. Immediate Next Engineering Unit

The first unit to enter engineering is:

`PCI-ENG-018-B — Operations Admin Runtime Vertical Slice`

Its review packet should contain the exact login/session/BFF contract, the first-account/bootstrap
decision, verifier policy, permission decision, affected shared-API seams, Admin login/session UX,
and an end-to-end acceptance test. It should reuse the accepted 016-B/C2 persistence and stop before
catalog mutations, human review, payment, Pilot or Production.

If the required Founder decisions are not yet recorded, engineering may prepare the contract,
transport schemas, test fixtures and UI state model, but must not create a real Operations account,
grant permissions, or expose the static token to the browser.

## 13. Coverage and Limits

This baseline was produced from source and governance inspection. It did not run the Admin app,
database, migrations, browser tests or API tests, and it did not modify business code. The evidence
for the existing Shell verification is the historical ENG-012 record in
`docs/09_Engineering_Governance/121_Operations_Admin_Web_Architecture.md:98`.

The roadmap does not claim that existing Operations routes are safe for Admin Web, that a first
Operations account exists, or that authentication, BFF, permission enforcement, review authority,
Production or external Pilot is complete.

## 16. PCI-ENG-018-B Delivery Record

`PCI-ENG-018-B = OPERATIONS ADMIN RUNTIME IMPLEMENTED — AWAITING MAIN CONTROLLER ACCEPTANCE`

The first bounded runtime now has an independent Operations Human password verifier, a controlled
database initializer, login/session/logout HTTP contracts, a same-origin Admin Web BFF and a
protected Admin Shell. The runtime uses the accepted Principal, Account, Credential and Session
persistence; it does not add a migration or expose a browser token. The only server-side
permissions are `catalog:read` and `audit:read`, and no catalog write or Creator authority is
granted.

Evidence paths:

- `adapters/auth/operations/argon2id-password-hasher.ts` implements Argon2id with the 15-character
  minimum and `EncodedPasswordVerifier` boundary.
- `applications/operations-identity/operations-human-authentication.ts` checks active identity
  status, both persisted activation histories, Credential Version and Principal Security Epoch before
  creating or validating a Session.
- `adapters/persistence/postgres/postgres-operations-human-authentication-store.ts` reads the
  Principal, Account, active Credential and both histories from PostgreSQL as one authentication
  snapshot.
- `adapters/transport/http/operations-human-authentication-routes.ts` registers login, Session and
  logout routes. `apps/admin-web/app/api/operations/auth/_proxy.ts` keeps the raw credential in a
  host-only HttpOnly cookie and strips it from the browser response body.
- `scripts/database/initialize-first-operations-account.ts` performs a one-time transactional
  Principal, Account, History, Audit and Credential initialization without creating a Session.

The development/internal path is enabled without MFA. In production, the API does not register the
Human Operations runtime until a separately implemented MFA gate is available; this unit is not a
Production readiness claim. Catalog and Audit data screens remain the next bounded unit (`018-C`).

## 14. Evidence-Based Current State

This section records the source inspection performed for PCI-ENG-018-A-R1. The status labels used
below have precise meanings:

- `SHELL_ONLY`: presentation and navigation exist, with no operational data path.
- `UI_IMPLEMENTED`: a visible page or interaction exists, but it is not an Admin data workflow.
- `API_CONNECTED`: a frontend or tested client calls a registered HTTP route.
- `END_TO_END_WORKING`: the Admin login, authorization, data path and logout are verified together.
- `NOT_IMPLEMENTED`: no approved implementation exists for the capability.

### 14.1 Admin Web source facts

| Capability                      | Evidence                                                                                                                                                                                                                          | Current status    | Fact-based conclusion                                                                      |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------ |
| Entry and start command         | `apps/admin-web/package.json:7-14` defines `dev`, `build`, `start`, `typecheck`, `lint` and `test`; root scripts expose `dev:admin-web`, `build:admin-web`, `typecheck:admin-web`, `test:admin-web` and `verify:admin-web`        | `SHELL_ONLY`      | The app can be developed and built as an independent Next.js client.                       |
| Routes                          | `apps/admin-web/lib/sections.ts:1-40` defines seven destinations; `apps/admin-web/app/page.tsx:4-35` renders the overview; `apps/admin-web/app/[section]/page.tsx:5-27` statically resolves sections and renders `PendingSection` | `UI_IMPLEMENTED`  | These are seven navigable Shell routes, not data-backed operational routes.                |
| Layout and navigation           | `apps/admin-web/components/admin-shell.tsx:8-53` implements navigation, active location, skip link, responsive shell and visible authentication-unavailable state                                                                 | `UI_IMPLEMENTED`  | The layout is usable as a presentation shell.                                              |
| API client and data loading     | The complete runtime tree is checked by `scripts/test/verify-admin-web.mjs:22-37`; the guard rejects `fetch`, browser storage, backend imports and database access, and no API client exists under `apps/admin-web`               | `NOT_IMPLEMENTED` | The browser does not call the Shared API.                                                  |
| Login and Session               | `apps/admin-web/components/admin-shell.tsx:43-47` renders `身份验证尚未接入`; `apps/admin-web/AGENTS.md:3-7` explicitly keeps authentication and Operations requests out of ENG-012 Shell scope                                   | `NOT_IMPLEMENTED` | No Admin login, Session bootstrap, logout or revocation path exists.                       |
| Loading, error and 404 handling | `apps/admin-web/app/loading.tsx:1-7`, `apps/admin-web/app/error.tsx:3-17`, `apps/admin-web/app/not-found.tsx:3-9` provide local presentation states                                                                               | `UI_IMPLEMENTED`  | Presentation error states exist, but they are not HTTP 401/403/expiry handling.            |
| Tests                           | `apps/admin-web/components/admin-shell.test.tsx:17-62` checks seven navigation links, unavailable sections, safe retry and loading; it asserts no table or management button                                                      | `UI_IMPLEMENTED`  | The tests prove Shell behavior only; there is no Admin API, login or end-to-end data test. |

The Shell boundary is intentional. `scripts/test/verify-admin-web.mjs:28-37` rejects browser network
access and server-only credentials, while `apps/admin-web/AGENTS.md:3-7` prohibits static Operations
credentials, backend imports and PostgreSQL access. Any real Admin workflow therefore requires a
deliberate revision through a named change unit; it cannot be inferred from the existing menu.

### 14.2 Shared API facts

| Area                           | HTTP evidence                                                                                                                                                                                                                                                                                                                                                                                             | Application / persistence evidence                                                                                                                           | Current status                                                                | Admin implication                                                                                                |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Service Policy Catalog         | `adapters/transport/http/service-policy-routes.ts:84-202` exposes `GET /api/v1/operations/service-policy/workspace`, `GET /api/v1/operations/service-policy/audit`, `PATCH /api/v1/operations/service-policy/capabilities/:id`, `PATCH /api/v1/operations/service-policy/templates/:id` and `POST /api/v1/operations/service-policy/releases`; `apps/api/src/create-api-server.ts:376-382` registers them | `applications/service-policy/service-policy-admin-service.ts:6-98` validates the Operations actor and reason before calling the catalog repository           | `API_CONNECTED` for existing server clients; Admin frontend `NOT_IMPLEMENTED` | This is the first existing bounded read model, but its current auth is static token based.                       |
| Creator Offerings              | `adapters/transport/http/service-offering-routes.ts:67-238` exposes `GET/POST /api/v1/creator/offerings`, `PATCH /api/v1/creator/offerings/:offeringId`, `POST .../publish`, `POST .../unpublish`, `POST .../distribution` and `GET .../distribution`; `apps/api/src/create-api-server.ts:372-375` registers them                                                                                         | The routes call `ServiceOfferingService` with Creator `ActorContext`                                                                                         | `API_CONNECTED` for Creator; Operations `NOT_IMPLEMENTED`                     | Do not reuse Creator authority for Admin. Add a named Operations read use case before exposing status.           |
| Customer Requests              | `adapters/transport/http/customer-request-routes.ts:56-216` exposes `GET/POST /api/v1/public/offerings/:offeringId...`, `GET /api/v1/public/requests/:resultAccessToken`, `GET /api/v1/creator/requests`, `GET /api/v1/creator/confirmed-requests`, and Creator `POST .../confirm`/`.../decline`; `apps/api/src/create-api-server.ts:383-387` registers them                                              | The routes call `CustomerRequestService` with public or Creator context                                                                                      | `API_CONNECTED` for public/Creator; Operations `NOT_IMPLEMENTED`              | There is no Operations list, status or observation route. Creator confirm/decline remains Creator-only.          |
| Identity / Principal / Account | `apps/api/src/create-api-server.ts:333-343` registers Creator and private identity routes; no Operations Principal/Account HTTP registration exists                                                                                                                                                                                                                                                       | Accepted Operations repositories and lifecycle contracts are recorded in `docs/09_Engineering_Governance/122_Operations_Identity_Domain_Contract.md:550-594` | Persistence/contract only; Admin `NOT_IMPLEMENTED`                            | A repository or migration is not an Admin identity API. Bootstrap and lifecycle actions require a separate unit. |
| Service Policy audit           | `adapters/transport/http/service-policy-routes.ts:101-119` exposes `GET /api/v1/operations/service-policy/audit`                                                                                                                                                                                                                                                                                          | The catalog repository returns audit records through the service-policy application service                                                                  | `API_CONNECTED` for static Operations clients; Admin `NOT_IMPLEMENTED`        | This can support the first read-only catalog slice after Human Operations auth exists.                           |
| Operations action audit        | `adapters/persistence/postgres/postgres-operations-action-audit-store.ts:9-44` can append/list commercial-operation audit records                                                                                                                                                                                                                                                                         | It is used by commercial-pilot application services; no unified Admin audit route is registered in `apps/api/src/create-api-server.ts:388-436`               | Persistence only for this purpose                                             | Do not present this as a complete Admin audit API. Define an approved read model later.                          |
| Health/readiness/OpenAPI       | System routes are registered at `apps/api/src/create-api-server.ts:325-332`; OpenAPI is exposed at `apps/api/src/create-api-server.ts:438-440`                                                                                                                                                                                                                                                            | These are runtime contracts, not Operations workflows                                                                                                        | `API_CONNECTED`, not an Admin capability                                      | Useful for deployment checks, not evidence of an operational backend.                                            |

The API route inventory is covered by `tests/integration/api-runtime.test.ts:133-260`, and the
Service Policy behavior is exercised by `tests/integration/service-policy-api.test.ts:6-85`.
Those tests prove registered API behavior with test actors; they do not prove an Admin browser,
Human Operations login, BFF or production authorization.

### 14.3 Operations Authentication and Authorization facts

| Capability                               | Evidence                                                                                                                                                                                                                                                                                                                                                              | Current status                                                                     | Conclusion                                                                                                                                                                                                         |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Creator LocalAuth                        | `applications/account-identity-membership/local-auth-service.ts:95-123` implements Creator-local scrypt/JWT session primitives; `:222-317` implements Creator login, refresh, logout and password recovery; `apps/api/src/create-api-server.ts:323-324` conditionally registers its routes                                                                            | `API_CONNECTED` for Creator; Admin `NOT_IMPLEMENTED`                               | `tests/integration/local-auth.integration.test.ts:11-127` covers the Creator route when its PostgreSQL test environment is present. This is not Operations Human authentication and must not be counted for Admin. |
| Operations Principal/Account persistence | `docs/09_Engineering_Governance/122_Operations_Identity_Domain_Contract.md:552-570` records Principal and Account persistence as accepted and Operations Authentication Runtime as not implemented                                                                                                                                                                    | `ACCEPTED` persistence; runtime `NOT_IMPLEMENTED`                                  | Durable rows and domain rules exist without a login path or first account.                                                                                                                                         |
| Password Credential                      | `docs/09_Engineering_Governance/123_Operations_Identity_Persistence_Baseline.md:94-121` records accepted encoded-verifier persistence; `applications/operations-identity/operations-credential-repositories.ts:7-24` accepts an encoded verifier only                                                                                                                 | `ACCEPTED` persistence; Human verify runtime `NOT_IMPLEMENTED`                     | Persistence does not hash, verify or select a production password policy.                                                                                                                                          |
| Operations Session                       | `docs/09_Engineering_Governance/122_Operations_Identity_Domain_Contract.md:560-567` records accepted Session persistence and missing Session/Auth Runtime                                                                                                                                                                                                             | `ACCEPTED` persistence; issuance/validation/touch/revoke runtime `NOT_IMPLEMENTED` | No HTTP request can establish or validate an Operations Session for Admin Web.                                                                                                                                     |
| Historical Static Operations token       | `adapters/auth/operations/static-operations-auth-context-provider.ts:7-39` compares one configured token and emits `actor.kind = 'pilot_operations'`; `apps/prototype/src/configuration/bootstrap.ts:148-165` loads `OPERATIONS_ACCESS_TOKEN` and `OPERATIONS_OPERATOR_ID`; `adapters/persistence/postgres/postgres-creator-identity-composition.ts:540-543` wires it | `API_CONNECTED` for existing bounded Operations routes                             | This is coarse token authentication and attribution, not Human Operations identity, Session auth or RBAC.                                                                                                          |
| Admin BFF and cookie                     | `docs/09_Engineering_Governance/121_Operations_Admin_Web_Architecture.md:34-52` requires a future Operations session with server-side checks and forbids exposing the static token; `apps/admin-web/AGENTS.md:3-7` forbids browser credentials                                                                                                                        | `NOT_IMPLEMENTED`                                                                  | There is no opaque HttpOnly Admin cookie, BFF trust boundary or API Session resolver.                                                                                                                              |
| Permission model                         | `applications/service-policy/service-policy-admin-service.ts:36-45` accepts any `pilot_operations` actor; no permission registry or per-capability permission is registered by the current API composition                                                                                                                                                            | `NOT_IMPLEMENTED`                                                                  | Actor kind and operator ID identify the caller; they do not implement RBAC or least-privilege Operations permission.                                                                                               |

The distinction is therefore explicit: Creator LocalAuth is a separate Creator provider; the
static Operations token is a server-held legacy Operations context; accepted Operations Principal,
Account, Credential and Session artifacts are persistence/contracts; a Human Operations
Authentication Runtime is absent.

## 15. Admin Capability Matrix

| Admin capability                        | Frontend                  | Shared API                                                                                                    | Identity / authorization                                              | Tests / evidence                                                 | Decision                                                                                           |
| --------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Open Admin Web and navigate             | `UI_IMPLEMENTED`          | Not applicable                                                                                                | None                                                                  | `apps/admin-web/components/admin-shell.test.tsx:17-47`           | Already bounded and safe to keep.                                                                  |
| Human Operations login                  | `NOT_IMPLEMENTED`         | No Operations login route                                                                                     | Persistence only; no verifier runtime                                 | No Admin login test                                              | Founder bootstrap/verifier/session decisions, then 018-B.                                          |
| Protected Admin session/logout          | `NOT_IMPLEMENTED`         | No cookie/session route                                                                                       | Session persistence only                                              | No Admin session test                                            | 018-B required before data access.                                                                 |
| Catalog workspace read                  | `NOT_IMPLEMENTED`         | `GET /api/v1/operations/service-policy/workspace` at `adapters/transport/http/service-policy-routes.ts:84-99` | Static `pilot_operations` token                                       | `tests/integration/service-policy-api.test.ts:37-64`             | Candidate first business read after 018-B.                                                         |
| Catalog audit read                      | `NOT_IMPLEMENTED`         | `GET /api/v1/operations/service-policy/audit` at `:101-119`                                                   | Static token                                                          | `tests/integration/service-policy-api.test.ts:66-75`             | Pair with workspace read; expose actor/correlation fields safely.                                  |
| Catalog mutation/publish                | `NOT_IMPLEMENTED`         | PATCH/POST routes exist at `service-policy-routes.ts:121-202`                                                 | No least-privilege permission; reason required by application service | `tests/integration/service-policy-api.test.ts:44-85`             | Defer until permission and audit attribution are accepted.                                         |
| Creator / Principal / Account directory | `NOT_IMPLEMENTED`         | No Operations directory route                                                                                 | Operations persistence only                                           | No Admin directory test                                          | Main Controller can scope a read model; bootstrap and identity mutation require Founder authority. |
| Offering status and distribution        | `NOT_IMPLEMENTED`         | Creator-only routes at `service-offering-routes.ts:80-238`                                                    | Creator Actor Context only                                            | Creator API tests only                                           | Add read-only Operations query; no Creator impersonation.                                          |
| Customer Request status                 | `NOT_IMPLEMENTED`         | Public/Creator routes at `customer-request-routes.ts:56-216`                                                  | Public or Creator context only                                        | Creator/request API tests only                                   | Add read-only Operations query over existing statuses.                                             |
| Creator Confirm / Decline from Admin    | `NOT_IMPLEMENTED`         | Creator-only POST routes at `customer-request-routes.ts:170-216`                                              | Creator authority                                                     | No Operations test                                               | Requires Founder decision; not part of first release.                                              |
| Unified operations audit                | `NOT_IMPLEMENTED`         | Service Policy audit only; no unified route                                                                   | Current actor is static token                                         | Store exists at `postgres-operations-action-audit-store.ts:9-44` | Define bounded read model after runtime.                                                           |
| Reports, Appeals, Manual Reviews        | `SHELL_ONLY` placeholders | No accepted HTTP/application workflow                                                                         | No authority or outcome model                                         | Shell tests assert unavailable sections                          | Founder decision required; defer.                                                                  |

No row marked `API_CONNECTED` above is `END_TO_END_WORKING` for Admin Web. The existing API
integration tests use direct Fastify injection and configured test actors; they do not constitute
browser integration or Human Operations authorization.

## 16. Operations Workflow Readiness

| Operational question                                                | Current answer from code                                                                                                                                                                          | Readiness                                     | Authorization boundary                                                                                           |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| How does an operator enter the backend?                             | The Shell opens without authentication and displays `身份验证尚未接入` (`admin-shell.tsx:43-47`)                                                                                                  | Blocked                                       | 018-B plus Founder bootstrap and credential policy.                                                              |
| How can an operator confirm which Creator/Principal/Account exists? | Creator identity routes exist, but no Operations directory route or Admin query exists (`create-api-server.ts:333-343`)                                                                           | Blocked                                       | Read-only Operations directory is a new bounded API unit; create/invite/disable actions need explicit authority. |
| How can an operator query Catalog/Capability?                       | Service Policy workspace and audit routes exist (`service-policy-routes.ts:84-119`)                                                                                                               | Ready at API layer, blocked at Admin boundary | Existing catalog direction permits bounded read; Human Session and permission check must precede exposure.       |
| How can an operator inspect Offering state?                         | Only Creator Offering routes are registered (`service-offering-routes.ts:80-238`)                                                                                                                 | Blocked                                       | Add Operations read model; do not reuse Creator actor or mutation.                                               |
| How can an operator observe Customer Request state?                 | Public result and Creator list/decision routes exist (`customer-request-routes.ts:56-216`)                                                                                                        | Blocked                                       | Add Operations read-only query; Creator confirm/decline remains separate.                                        |
| How can an operator identify anomalies?                             | Service Policy audit is queryable; commercial action audit is persistence-only                                                                                                                    | Partial                                       | Define the first approved audit read model and correlation display.                                              |
| How is operation attribution established?                           | Current catalog writes use `operatorId` and request `correlationId` from `pilot_operations` context (`static-operations-auth-context-provider.ts:31-38`; `service-policy-admin-service.ts:36-45`) | Partial and unsuitable for Admin              | Human Principal/Account/Session actor attribution is required for Admin.                                         |

The first useful Admin workflow is therefore not a new business operation. It is a protected
read path over the existing Service Policy workspace and audit facts. Offering and Request
visibility follow as read-only additions because their current HTTP contracts are Creator-facing.

## 17. First Vertical Slice

### 17.1 Is 018-B genuinely required first?

Yes. The current Admin client has no API client, no login page and no Session boundary, while the
only Operations HTTP authentication is a static bearer token (`static-operations-auth-context-provider.ts:12-39`).
The Shell boundary expressly forbids putting that token in browser code (`apps/admin-web/AGENTS.md:3-7`),
and the accepted Operations persistence documents explicitly mark Authentication Runtime, BFF and
permission enforcement as not implemented (`122_Operations_Identity_Domain_Contract.md:552-570`).

Starting 018-C before 018-B would either leave the Catalog API exposed through a server-held token
outside the Admin trust boundary or require an unapproved browser credential. A contract-only
preparation for 018-C is allowed; a real Admin data request is not.

### 17.2 First user-visible closure

The smallest real closure is a paired vertical slice delivered through two bounded units:

```text
Operations Human Login
    -> Shared API creates server-side Operations Session
    -> Admin Web receives one opaque HttpOnly cookie
    -> Catalog workspace and audit are read through the Shared API
    -> UI shows authoritative policy/capability/template state
    -> Logout revokes the Session and protected reads fail closed
```

018-B establishes the authentication and protected-empty-workspace boundary. 018-C immediately
follows to add the first real business data screen. Treating these as adjacent units keeps the
security boundary reviewable while producing a usable Catalog operations slice as soon as the
required Founder decisions are recorded.

## 18. Founder Decision Blockers

Only the following decisions block the first real slice. PCI-ENG-014's architecture is already the
baseline and is not reopened.

| Decision                                                    | Why it blocks engineering                                                                                                                       | Required owner                                                  | Minimum bounded outcome                                                                                    |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| First Operations Human Principal/Account and bootstrap path | No real first account exists, and persistence alone does not authorize creation or invitation                                                   | Founder                                                         | Name the bootstrap authority, one initial account, and the local/test versus controlled boundary.          |
| Encoded verifier initialization and password policy         | 016-B stores encoded verifiers but does not select an algorithm, hash passwords or verify them                                                  | Founder for policy; Main Controller for implementation contract | Select the approved verifier production/verification policy and failure behavior.                          |
| Initial Admin permission set                                | `pilot_operations` is an actor kind, not a least-privilege permission registry                                                                  | Founder for authority                                           | Approve the minimum read-only Catalog/Policy Audit permission; no mutation or review power by implication. |
| MFA boundary                                                | MFA Runtime is not implemented and the first operator's required assurance level is not recorded                                                | Founder                                                         | State whether local development may run without MFA and whether controlled/production access requires it.  |
| Session policy values                                       | Idle timeout, absolute lifetime, rotation trigger, cookie, CSRF/origin and revocation behavior remain unfrozen in the accepted Session contract | Founder for policy; Main Controller for tests                   | Approve values and environment-specific limits needed by 018-B.                                            |

The following are not blockers for the first read-only slice because they remain explicitly out of
scope: Catalog mutation permissions, Creator confirm/decline on behalf of a Creator, identity
creation/invitation UI, Reports/Appeals, Manual Reviews, Paid Commerce, Withdrawal, Commercial Pilot,
Production and Real Money. Each requires a later bounded decision if pursued.

## 19. Recommended Delivery Sequence

The sequence below is intentionally a short chain of user-visible outcomes rather than a parallel
backlog.

| Task            | Goal                                    | Scope and dependencies                                                                                                                                        | User-visible result                                                                                  | Acceptance boundary                                                                                                                                                               |
| --------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PCI-ENG-018-B` | Operations Admin Runtime Vertical Slice | Shared API Operations login/session/BFF seam, accepted Credential/Session persistence, Admin login/session states; depends on Founder decisions in Section 18 | Operator can sign in, see a protected empty workspace and sign out; revoked/expired access is denied | No static token/verifier/Principal/permission header in browser; server checks Principal, Account, Credential Version, Session and Epoch; cookie/CSRF/origin and audit tests pass |
| `PCI-ENG-018-C` | Catalog Read-Only Vertical Slice        | Typed Admin client and screens for existing workspace/audit routes; depends on 018-B                                                                          | Authenticated operator sees current Catalog, templates, policy version and audit attribution         | 401/403/404/stale/retry states; permission is enforced by API; browser imports no backend code; no mutation controls                                                              |
| `PCI-ENG-018-D` | Bounded Catalog Controls                | Reuse existing PATCH/release contracts; depends on accepted permission and audit contract                                                                     | Authorized operator can perform a named Catalog change with a reason and see its audit record        | Explicit permission, reason validation, actor/correlation audit, transaction/version behavior; no Offering/Request authority                                                      |
| `PCI-ENG-018-E` | Operations Flow Visibility              | Add named read-only Operations queries for Offering, Distribution and Customer Request facts; depends on 018-B and approved read scope                        | Operator can see frozen flow status and recorded Creator decisions                                   | Existing state vocabulary only; no Creator impersonation, new lifecycle state or decision power                                                                                   |
| `PCI-ENG-018-F` | Admin Completion and Hardening          | Navigation based on real capabilities, audit links, error/accessibility states, contract/browser/integration tests                                            | A coherent workbench with no misleading unavailable authority labels                                 | Authenticated navigation, logout/expiry/revocation, Catalog flow and safe errors remain covered; no Pilot/Production claim                                                        |

Reports/Appeals, Manual Reviews and commercial operations remain separate Founder-gated units, not
completion blockers for the first Catalog release.

## 20. Immediate Next Engineering Task

The next task that Main Controller can issue is:

`PCI-ENG-018-B — Operations Admin Runtime Vertical Slice`

The expected reviewable change set is:

| Area                           | Expected files or seams                                                                                                                                                                                 | Purpose                                                                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Operations application runtime | New bounded Operations authentication/session application service under `applications/operations-identity/`; review the existing `applications/core/ports/operations-auth-context-provider.ts` contract | Verify an encoded credential, resolve Principal/Account/Session state and build the server-side actor context.                            |
| Operations auth adapter        | New adapter under `adapters/auth/operations/`; replace or isolate the static provider in `adapters/persistence/postgres/postgres-creator-identity-composition.ts:540-543`                               | Keep credentials and Session handling server-side; no browser token.                                                                      |
| Shared API transport           | New bounded Operations auth/BFF routes under `adapters/transport/http/`; update `apps/api/src/create-api-server.ts:323-436` registration and protected route context handling                           | Establish login/logout/session lookup and authoritative 401/403 behavior in the shared backend.                                           |
| Composition and runtime wiring | `apps/api/src/main.ts:113-173` and the existing Operations persistence composition                                                                                                                      | Wire accepted repositories without adding Schema/Migration unless the reviewed contract proves insufficiency.                             |
| Admin client                   | `apps/admin-web/app/`, `apps/admin-web/components/`, and a typed client module under `apps/admin-web/lib/`                                                                                              | Add login and authenticated loading/logout states while preserving the no-database/no-backend-import boundary.                            |
| Verification                   | New focused Operations auth API tests under `tests/integration/`, Admin component tests under `apps/admin-web/components/`, and browser boundary checks                                                 | Prove cookie/session behavior, fail-closed terminal states, safe errors, correlation/audit attribution and absence of static credentials. |

These are planned seams, not changes made by PCI-ENG-018-A-R1. The exact filenames and route
contracts must be fixed in the 018-B design packet before implementation. 018-B must not modify
Migrations 0036-0040, create a first account without the Founder bootstrap decision, add RBAC/MFA
without the corresponding decision, expose Catalog mutations, or implement Creator decisions,
Paid Commerce, Withdrawal, Pilot, Production or Real Money.

The completion criterion for this task is a protected empty Admin workspace. The first real business
criterion is completed by 018-C: the same authenticated Session reads Catalog workspace and audit
data and then revokes cleanly on logout.

## 21. R1 Coverage and Limits

PCI-ENG-018-A-R1 re-read the Admin Web source tree, API route registration, Operations composition,
authentication adapters, application services, integration tests and accepted identity governance
records. It did not run the Admin app, API tests, database, Migration or production operation, and it
did not change business code, Schema, Migration, permissions or Founder Decisions.

The evidence proves source-level capability boundaries and historical test scope. It does not prove
that an Admin login works, that a first Operations Human account exists, that the current static-token
Operations APIs are suitable for browser use, or that any controlled/production authorization is
complete.

`PCI-ENG-018-A-R1 = EVIDENCE-BACKED ADMIN WEB ROADMAP COMPLETED — AWAITING MAIN CONTROLLER REVIEW`

## 22. PCI-ENG-018-B Delivery Record

The Founder-approved 018-B unit is implemented in the bounded runtime seams listed above. The
current result is a protected Admin login/session/logout shell for internal validation; it does not
make Catalog or Audit data screens available and does not replace the legacy static Operations
provider for existing routes.

| Evidence                    | Result                                                                                                                                                                                       |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Operations password/runtime | Argon2id verifier, 15-character minimum, generic login failure, accepted encoded verifier persistence                                                                                        |
| Bootstrap                   | One-time database transaction; active Principal and Account, Epoch 0, both histories `previously_activated`, Credential version 1, no Session; repeat execution refuses                      |
| Session                     | Existing PostgreSQL Session repository used for opaque random credential digest, validation/touch and revocation                                                                             |
| Runtime database access     | Migration 0041 grants Runtime identity reads, row-lock column privileges and Session insert/update only; no lifecycle status writes, delete, truncate, DDL or bootstrap authority            |
| Admin Web                   | Same-origin server BFF, host-only HttpOnly cookie, login page, protected shell, operator identity and server logout                                                                          |
| Verification                | Core/API/Admin TypeScript, Admin tests (9), focused auth tests (2), Admin lint, build, Migration Check and Admin boundary scan PASS; disposable PostgreSQL 17.10 runtime/bootstrap test PASS |

The active backend test aggregate remains blocked by pre-existing `apps/web-v2` matcher type errors.
Production Human Operations runtime remains disabled until MFA is implemented and accepted. The
next user-visible unit remains `PCI-ENG-018-C`, Catalog and Audit read-only Admin integration;
this record does not authorize Catalog mutations, identity management, MFA, RBAC, Pilot,
Production or Real Money.

`PCI-ENG-018-B = IMPLEMENTED — AWAITING MAIN CONTROLLER ACCEPTANCE`

## 23. PCI-ENG-018-B Pre-Commit Review — Current State

This later review supersedes the implementation-complete claims in the earlier 018-B delivery
records. Those records remain historical progress claims, not acceptance evidence.

`PCI-ENG-018-B = BLOCKED — MAIN CONTROLLER REVIEW REQUIRED`

The current initializer directly inserts active/previously_activated rather than performing the
required pending/invited + never_activated first-activation sequence. Existing 0040 creation
functions do not activate; the audit CHECK and validator have no explicit first-activation
operation. A PostgreSQL 17.10 transaction probe using a candidate first_activated audit was rejected
with SQLSTATE 23514 and psql exit 3; a new connection confirmed all seven subject/history/audit/
credential/session counts remained zero. This is failure/rollback evidence, not a passing bootstrap.

Main Controller must resolve only the bootstrap audit representation or authorize an additive
bootstrap-only 0041 audit extension. The already-approved dedicated function is not a license to
rename activation as creation or to alter frozen schema semantics silently. General C2-2/C3 and
the closed 017-E1 scenario remain outside this task.

Additional delivery gaps are 0041 missing from the wrapper allowlist and owner phase policy,
non-TTY password handling, logout false-success handling, fail-closed shell rendering, and missing
browser/negative-path acceptance. Backend test TypeScript passed; the wider active-tests aggregate
failed later in web-v2. The earlier contrary aggregate description is superseded.

The complete findings and raw structured evidence are linked from
[129_Operations_Admin_Runtime_Completion.md](129_Operations_Admin_Runtime_Completion.md).
Seven inherited task containers and their anonymous volumes have now been removed; the earlier
cleanup claim was incorrect. The partial implementation and original roadmap remain uncommitted;
no push occurred. 018-C remains the next planned business-data unit after accepted 018-B, and has
not started. Production, external Pilot and Real Money remain unauthorized.

## 24. PCI-ENG-018-B-R1 — Bootstrap and Runtime Blockers Resolved

Main Controller's R1 instruction explicitly authorized the lawful ordered first activation and,
only where 0040 could not express its Audit, a minimal additive 0041. The original blocked report
and JSON remain preserved in [129](129_Operations_Admin_Runtime_Completion.md). Sections 22–23 are
historical execution/review records; this later R1 result does not rewrite them or imply acceptance.

The retained 23514 error is category B: 0040's Audit validator and CHECK admit creation/backfill,
not explicit first activation. 0041 now adds `principal_first_activated` and
`account_first_activated`. One database transaction guards first initialization, calls the accepted
pending/invited creation path, activates Principal before Account, links both independent History
rows to their activation Audits and creates Credential version 1. Epoch remains 0; four Audits and
no Session are created. Repeat/concurrent initialization cannot overwrite an existing identity.
0036–0040 remain unchanged; this is not general lifecycle Runtime or C2-2/C3 implementation.

| Admin capability                            | Current R1 evidence-backed status                                                                 | Remaining boundary                                            |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Independent Human Operations password/login | IMPLEMENTED; Argon2id, minimum 15 code points, no password normalization/truncation               | No recovery, registration or invitation                       |
| First-account initialization                | IMPLEMENTED; Migration LOGIN only, hidden TTY, atomic creation/activation/Credential and rollback | Disposable validation only; no real business bootstrap        |
| Session validation/touch/revoke             | IMPLEMENTED; version/Epoch/Credential/state/history checks; 8h idle / 24h absolute                | No MFA or general identity lifecycle                          |
| Minimal API authorization                   | IMPLEMENTED; server-fixed catalog:read / audit:read, 401/403 and spoof denial                     | No writes or general RBAC; legacy static routes not converted |
| Admin BFF and cookie                        | IMPLEMENTED; fixed server origins, one opaque host-only HttpOnly cookie                           | No browser identity/permission trust                          |
| Login/protected shell/logout                | REAL BROWSER VERIFIED; logout failures remain failures with retry                                 | Catalog/Audit links still placeholders                        |
| Catalog/Audit business data                 | NOT IMPLEMENTED for this Human Operations path                                                    | Separate 018-C authorization/implementation                   |
| Production MFA gate                         | ENFORCED by API composition omission                                                              | MFA and Production remain unimplemented/unauthorized          |

Final focused evidence: Operations unit/HTTP 27/27, Admin 21/21, PostgreSQL 12/12 and real
Next/BFF/API/Argon2id/PostgreSQL browser flow PASS, each with actual process exit 0. Core/API/backend
test/Admin TypeScript, changed backend/Admin ESLint, code formatting, API/Admin build/boundary and
Migration Check passed. The final Shell route/retry changes were covered by a later targeted Admin
run. The earlier full suite was **1253 PASS, 2 FAIL, 218 pending/skipped**, plus one collection failure
(exit 1); full lint remains **459 errors** (exit 1). No parent comparison proves those failures
pre-existing: **UNCLASSIFIED / NOT PROVEN PRE-EXISTING**. No all-green claim is made.

See [the evidence index](evidence/PCI-ENG-018-B-R1-index.md) for exact commands, original failures,
PostgreSQL 17.10/Podman provenance, restricted-role ACL, wrapper SQL/COMMIT failure exits and cleanup.
[128](128_Operations_Admin_Runtime_Runbook.md) is the disposable runbook and
[130](130_Operations_Initial_Admin_Bootstrap.md) records 0041's bounded contract. Evidence proves
the Operations 0036–0041 subset, not an all-migration fresh install or Production security readiness.

The shortest next user-visible unit remains 018-C after Main Controller accepts B/R1: connect the
existing Human Session/permission policy to Catalog and Audit read-only HTTP queries, BFF/client
and real data list/detail/error/empty states, then prove login → real read → logout. Do not reuse
Creator or static Operations credentials, expand permission sets, add business writes or reopen
closed 017 testing. This record does not start 018-C.

```ini
PCI-ENG-018-B-R1 = OPERATIONS ADMIN RUNTIME BLOCKERS RESOLVED — AWAITING MAIN CONTROLLER ACCEPTANCE
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

## 25. PCI-ENG-018-C — Catalog and Audit Read-Only Vertical Slice

This appended record supersedes the earlier planned status for 018-C. It records the
Founder-authorized read-only delivery and does not authorize Catalog writes, Offering or
Customer Request changes, identity administration, RBAC, MFA, Pilot or Production.

| Surface | Delivered evidence | Boundary |
| --- | --- | --- |
| Shared API Catalog read | `GET /api/v1/operations/admin/catalog/capabilities`, `GET /api/v1/operations/admin/catalog/templates`, and `GET .../:kind/:id` in `adapters/transport/http/service-policy-routes.ts`; PostgreSQL `PostgresServicePolicyCatalogRepository` supplies the snapshot | Human Operations Session plus `catalog:read`; no write route is exposed by the Admin read surface |
| Shared API Audit read | `GET /api/v1/operations/admin/audit` and `GET .../audit/:id`; service sanitizes nested sensitive keys and classifies execution attribution | Human Operations Session plus `audit:read`; no audit mutation/delete path |
| Admin BFF | Same-origin Next routes under `apps/admin-web/app/api/operations/catalog` and `.../audit`; only the HttpOnly opaque Session cookie is forwarded | Browser cannot provide Principal or Permission headers; API remains authoritative |
| Admin Web | Capabilities/Templates list, filters, pagination, detail; Audit list, filters, pagination, detail; loading, empty, unauthorized, not-found and failure states | Read-only presentation of API DTOs; no database access or static credential |

The API checks the Operations Human context at the route boundary and calls
`requireOperationsHumanPermission` for every read. Catalog data is read from the disposable
PostgreSQL `service_policy_*` tables through the PostgreSQL repository, not from fixture data in
the browser. Audit responses redact password, verifier, Session, digest, secret, token and private
key fields before transport. Execution attribution is returned as `human_operations`,
`provider_service`, `platform_system` or `unknown` and is displayed with the actor identifier.

Focused evidence is retained in
`evidence/PCI-ENG-018-C-browser-1794674987921.json` and
`evidence/PCI-ENG-018-C-pci-018c-313fdd6079-postgres.json`. The browser run used real Next,
BFF, Fastify, Operations Human Authentication, PostgreSQL 17.10 and the gstack browser. It
verified anonymous redirect, forged-header rejection, HttpOnly cookie/storage isolation, real
Catalog list/detail, real Audit list/detail and Platform System attribution, logout 503/network
failure preservation, successful retry revocation, cookie clearing and post-logout redirect.
The browser process exited 0; the disposable PostgreSQL fixture recorded ten capabilities, ten
templates, one audit row, Runtime SELECT ACLs on the four Catalog tables, container cleanup and no
remaining task container.

Focused software evidence: Admin Web tests 21/21 PASS; read API integration 3/3 PASS; Active
Backend Test TypeScript, Admin Web TypeScript, Admin Web ESLint and Prettier PASS. The historical
full repository result remains **1253 PASS, 2 FAIL, 1 collection failure, 218 pending/skipped** and
full lint remains **459 errors**. These wider results remain **UNCLASSIFIED / NOT PROVEN
PRE-EXISTING** and are not relabeled by this slice.

```ini
PCI-ENG-018-C = CATALOG & AUDIT READ-ONLY ADMIN VERTICAL SLICE COMPLETED - AWAITING MAIN CONTROLLER ACCEPTANCE
OPERATIONS_ADMIN_PERMISSIONS = catalog:read,audit:read
CATALOG_ADMIN_WRITES = NOT IMPLEMENTED
AUDIT_MUTATION = NOT IMPLEMENTED
MFA_PRODUCTION = REQUIRED_NOT_IMPLEMENTED
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

## 26. PCI-ENG-018-E - Offering and Customer Request Flow Visibility

This bounded read-only extension adds observation of the existing Offering and Customer Request
flow. It does not authorize Offering or Request writes, Creator decisions, fulfillment, RBAC, MFA,
Production, Pilot or real-money activity.

| Surface | Delivered evidence | Boundary |
| --- | --- | --- |
| Operations permissions | The fixed first-account allowlist now contains `catalog:read`, `audit:read`, `offering:read` and `request:read`; unknown permissions remain denied | These permissions are limited to the first internal account policy; no permission-management API or general RBAC was added |
| Offering API | `GET /api/v1/operations/admin/offerings` and `GET /api/v1/operations/admin/offerings/:id` in `adapters/transport/http/operations-flow-read-routes.ts` | Reads existing `service_offerings` and optional `distribution_assets`; no create, update, publish, unpublish or delete route |
| Request API | `GET /api/v1/operations/admin/requests` and `GET /api/v1/operations/admin/requests/:id` in the same route module | Reads existing `commerce_actions` and Offering/Creator associations; Creator decision is shown only from the persisted `submitted`/`confirmed`/`declined` state |
| Application read model | `applications/operations-admin/operations-flow-read-service.ts` composes Offering, Distribution, Commerce Identity, Customer and Commerce Action repositories | No new domain state or workflow is created; sensitive result access tokens and private contact methods are not returned |
| Admin BFF and UI | Same-origin routes under `apps/admin-web/app/api/operations/offerings` and `.../requests`; `offering-read-panel.tsx` and `request-read-panel.tsx` provide list/detail/filter/pagination/error states | Only the opaque HttpOnly Session cookie crosses the BFF; pages are read-only and cannot act as Creator |

The persisted Offering state is `draft`, `published`, `unpublished` or `archived`. Distribution is
shown only when a `distribution_assets` row exists; otherwise the UI reports that no independent
distribution record is available. Request state and Creator decision are derived from the existing
Commerce Action state. No delivery, viewing, timeout or decision event is inferred.

Focused E2E evidence is retained in
`evidence/PCI-ENG-018-E-browser-1794679076829.json` and
`evidence/PCI-ENG-018-E-pci-018e-2b75fab303-postgres.json`. The real Next/BFF/Fastify/Operations
Session/PostgreSQL/gstack browser flow passed with process exit `0`; it covered forged-header
rejection, Catalog, Offering list/detail, Request list/detail, persisted `submitted` and
`not_recorded` Creator decision state, Audit, logout retry and post-logout denial. PostgreSQL was
17.10 with Podman 5.7.1, dynamic bind `127.0.0.1:40321`, container cleanup with no remaining task
container, and Runtime SELECT ACLs only on the six existing flow tables in the disposable fixture.

Focused software checks passed: active TypeScript, backend test TypeScript, changed-file ESLint,
Admin Web lint, focused API tests and the browser flow. The historical full-repository result
remains `1253 PASS, 2 FAIL, 1 collection failure, 218 pending/skipped` and full lint remains `459`
errors; those results remain `UNCLASSIFIED / NOT PROVEN PRE-EXISTING`.

```ini
PCI-ENG-018-E = OFFERING & CUSTOMER REQUEST FLOW VISIBILITY COMPLETED - AWAITING MAIN CONTROLLER ACCEPTANCE
OPERATIONS_ADMIN_PERMISSIONS = catalog:read,audit:read,offering:read,request:read
OFFERING_ADMIN_WRITES = NOT IMPLEMENTED
REQUEST_ADMIN_WRITES = NOT IMPLEMENTED
CREATOR_DECISION_PROXY = NOT IMPLEMENTED
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

### 26.1 Final implementation and evidence closure

The final E read slice is now available at `/offerings` and `/requests`, with inline detail links
(`?id=...`), filters, bounded pagination, explicit 401/403/404/error states and UTC timestamps.
A Request links to its actual Offering; the Offering resolves Capability/Catalog associations.
Missing associations remain visible and are not matched by guesses. Request free text is withheld
because it can contain private contact details. Persisted submitted/confirmed/declined states are
shown without inferring delivery, viewing or decision timestamps.

Server-side grants require the existing 0041 initial-admin history provenance. Future/unproven
accounts receive no implicit admin permission set; missing provenance fails closed. The API startup
explicitly supplies the PostgreSQL read service. No production ACL or database object changed.

Final focused checks: backend/API/Domain 78/78 PASS; Admin component/BFF 37/37 PASS; active and
backend/Admin-test TypeScript, changed backend/Admin ESLint, code Prettier, backend/Admin Build PASS.
The final browser process exits 0 with real Next/BFF/Fastify/Session/PostgreSQL data, all three
persisted Request decision states, linked flow navigation and safe logout. Business-table counts
and hashes remain unchanged. The disposable PostgreSQL 17.10 container was removed successfully.

See [the final E evidence index](evidence/PCI-ENG-018-E-index.md) for the complete file manifest,
source findings, actual commands/exit codes, PostgreSQL provenance, earlier retained runs and
limitations. The earlier evidence pair in section 26 describes the initial one-Request run; the
final three-Request artifacts are `PCI-ENG-018-E-browser-1794681665150.json` and
`PCI-ENG-018-E-pci-018e-87086d61c2-postgres.json`.

This closes the read-only E implementation for Main Controller review. The next choice is a bounded
review of remaining operational visibility, exception identification and read-only statistics.
Catalog Controls and every business write continue to require separate authorization. Existing
full-suite/full-lint risks and all governance/production gates above remain unchanged.
