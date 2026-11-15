# PCI-ENG-020-A — Creator Web Product & Frontend Baseline Audit

> Status: `FRONTEND AUDIT COMPLETED — AWAITING MAIN CONTROLLER REVIEW`
>
> Audit date: 2026-11-16
>
> Scope: `apps/web-v2` (`ACTIVE / CREATOR_WEB`), directly related Creator-facing HTTP
> contracts, authentication/session integration, shared APIs, Domain/Application services and
> existing automated tests. `apps/web` and `apps/api-mock` are treated as retired. `apps/admin-web`
> is referenced only where a shared dependency is relevant.

## 1. Audit control and evidence

The audit is read-only. No application code, business rule, Schema, Migration, authentication
model, Session model, permission model or Operations Admin feature was changed. This document and
the execution log are the only intended task changes. Existing untracked evidence under
`docs/09_Engineering_Governance/evidence` was preserved.

Git baseline captured before the audit:

```ini
BRANCH = codex/pci-eng-015-b-r2-persistence-closure
HEAD = 762478c28de928573e2aa7440971fea7ecd9a522
BASELINE_STATUS = 23 existing untracked PCI-ENG-018/019 evidence files; no tracked changes
```

Evidence labels in this report are deliberately separated:

- `CONFIRMED DEFECT`: the implementation contradicts an active contract or produces a
  reproducible incorrect behavior from source and/or a focused test.
- `CONFIRMED PRODUCT GAP`: the active product flow is missing or exposes behavior outside the
  frozen product contract.
- `UX / USABILITY IMPROVEMENT`: an observed path is usable but creates avoidable confusion or
  risk; it is not called a defect without a failing contract.
- `ENGINEERING RISK`: source structure or an unverified runtime condition can cause failure or
  weaken a boundary; no code fix is made in this audit.
- `UNVERIFIED / NEEDS INVESTIGATION`: a plausible concern for which this audit has no runtime
  evidence.
- `NEW FEATURE REQUIRES PRODUCT AUTHORIZATION`: implementation cannot be selected from the
  current VS-01 contract.

The following verification ran during the audit:

| Check                                                                                                               | Result                    | Evidence boundary                                                         |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------- |
| `pnpm --dir apps/web-v2 test --run`                                                                                 | PASS, 28 files / 86 tests | Component, page, API-hook, auth and client tests; no browser run          |
| `pnpm --dir apps/web-v2 typecheck`                                                                                  | PASS                      | TypeScript compile only                                                   |
| `pnpm --dir apps/web-v2 lint`                                                                                       | PASS with 5 warnings      | Warnings are listed in §10                                                |
| `pnpm vitest run tests/application/customer-request-use-cases.test.ts --testTimeout=30000` (targeted request suite) | PASS, 12 tests            | Customer Request application use cases; no browser run                    |
| `pnpm vitest run tests/integration/creator-identity-api.test.ts --testTimeout=30000`                                | PASS, 9 tests             | API/application integration only; the default 5s timeout was insufficient |

The repository has Creator browser suites in `apps/web-v2/e2e`, including accessibility,
canonical events, consumer flow, Creator flow, full Creator journey, homepage management,
performance and responsive checks. They were not run in this audit; therefore no browser
screenshot, disposable database browser run or external-service evidence is claimed here.

## 2. Frozen product baseline

The governing product model is:

```text
Identity -> Capability -> Service Offering -> Publish / Distribution
-> Customer Request -> Creator Confirm / Decline
```

The frozen VS-01 PRD ends at `Confirmed` or `Declined` and excludes payment, settlement,
refund, Marketplace, CRM, automated fulfillment and an on-platform fulfillment workflow. The
relevant contract is in `docs/07_Product_Architecture/20_MVP_PRD_VS01.md:45`,
`docs/07_Product_Architecture/20_MVP_PRD_VS01.md:118`,
`docs/07_Product_Architecture/20_MVP_PRD_VS01.md:254`,
`docs/07_Product_Architecture/20_MVP_PRD_VS01.md:360`, and
`docs/07_Product_Architecture/20_MVP_PRD_VS01.md:551`.

The C number is a public, stable commercial reference. The home page correctly describes it as
an access identifier rather than identity or qualification proof at
`apps/web-v2/app/page.tsx:23` and `apps/web-v2/app/page.tsx:59`.

## 3. Creator Web capability inventory

The table records what a user can actually invoke and the evidence currently available. A page
name alone is not treated as proof of a completed business capability.

| Surface                                                                        | User-visible capability and operations                                                                                                                            | API / Domain or Application path                                                                                                                                                                         | Current status                                                                                                                                                                                        | Automated evidence                                                                              |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `/`                                                                            | Normalize and validate a C number; navigate to `/r/:commerceRef`; link to Creator login or workspace                                                              | `GET /api/v1/public/homepages/:reference` is reached by the public homepage, not by the lookup form itself; public homepage application service                                                          | Implemented UI and route transition; public lookup requires browser verification                                                                                                                      | No dedicated page test found; public homepage component tests exist                             |
| `/auth/login`, `/auth/signup`, `/auth/forgot-password`, `/auth/reset-password` | Sign in, create account, request reset and set a new password; safe return destination on login                                                                   | `/api/v1/auth/signup`, `/login`, `/refresh`, `/logout`, `/forgot-password`, `/reset-password`; `lib/auth/service.ts` and `lib/auth/context.tsx`                                                          | Implemented with loading and error feedback; session storage risk remains (§7)                                                                                                                        | Reset-page, auth context, session restore and auth service tests; no full browser run           |
| `/onboarding`, `/onboarding/welcome`                                           | Resolve whether a Creator identity exists; route to create or profile                                                                                             | `GET/POST/PATCH /api/v1/creator/identity`; `applications/creator-identity`                                                                                                                               | Implemented; 404 and retry states are explicit                                                                                                                                                        | `app/(creator)/onboarding/page.test.tsx`; API integration 9/9                                   |
| `/dashboard`                                                                   | Initialize workspace; show identity readiness, C number, public homepage state and sharing URL; link to profile, capabilities, services and requests              | `POST /api/v1/auth/workspace/initialize`, `GET /api/v1/creator/identity`, `GET /api/v1/private/identity/reference`, `GET /api/v1/private/homepages`; homepage application service                        | Implemented UI and query states; the dashboard uses a local `PENDING` reference type that conflicts with the contract's `NOT_ASSIGNED` (§7)                                                           | No direct page test; E2E journey exists but was not run                                         |
| `/profile`, `/profile/edit`                                                    | View or create/update display name, bio, avatar URL and location; manage public homepage versions, profiles, windows, preview, publish/pause, default and archive | Creator identity routes plus `adapters/transport/http/public-commerce-homepage-routes.ts:49` and private profile routes                                                                                  | Identity path is implemented. Homepage management is a separate, substantially larger private workflow; no claim of browser completion                                                                | Profile and homepage management page tests; API coverage exists for private identity/homepage   |
| `/capabilities`, `/capabilities/new`, `/capabilities/:id/edit`                 | List, add from active service catalog, edit and delete Creator capabilities; delete requires an inline confirmation                                               | `GET /api/v1/creator/identity`, `POST /api/v1/creator/identity/capabilities`, `GET/PATCH/DELETE /api/v1/creator/identity/capabilities/:capabilityId`; Creator identity service and capability repository | Create/edit/delete UI is implemented. Create response is incorrectly narrowed to a `Capability` although the route returns the full identity (§7)                                                     | Capability list page and edit-form tests; no dedicated create-form test                         |
| `/services`, `/services/new`, `/services/:id`, `/services/:id/edit`            | List draft/published/unpublished/archived offerings; create/edit; publish/unpublish; view policy state and distribution asset; record external distribution       | `GET/POST /api/v1/creator/offerings`, `PATCH /api/v1/creator/offerings/:offeringId`, `POST .../publish`, `POST .../unpublish`, `GET/POST .../distribution`; `applications/service-offering`              | Core CRUD and lifecycle UI is present. Detail resolves one offering by fetching the whole list; publish response is cast to the wrong frontend type; form currently drops `appearance` on submit (§7) | Services list/detail page tests; no service-form test; browser suites exist but were not run    |
| `/requests`                                                                    | View submitted and confirmed request tabs; Confirm or Decline submitted requests; enter a visitor code and confirm fulfillment                                    | `GET /api/v1/creator/requests`, `GET /api/v1/creator/confirmed-requests`, `POST .../:actionId/confirm`, `POST .../:actionId/decline`, `POST .../:actionId/confirm-fulfillment`                           | Confirm/Decline path is implemented. Fulfillment is exposed as a first-class Creator workflow even though VS-01 excludes it (§6)                                                                      | Request page, request-card and action-hook tests; `creator-flow.spec.ts` exists but was not run |
| `/r/:commerceRef`                                                              | Public homepage with Creator display name and published offerings; open an offering; share/copy/QR tools                                                          | `GET /api/v1/public/homepages/:reference`; public homepage application service                                                                                                                           | Implemented UI with loading/error/empty handling; no capability list is rendered on this surface; real browser and data invariants unverified in this audit                                           | Public homepage component tests; homepage E2E exists but was not run                            |
| `/s/:offeringId` and legacy `/public/:offeringId` redirect                     | Display public offering and Creator details; validate and submit customer request; legacy route redirects to canonical offering route                             | `GET /api/v1/public/offerings/:offeringId`, `POST /api/v1/public/offerings/:offeringId/requests`; customer-request use cases; legacy redirect at `app/(public)/public/[offeringId]/page.tsx:1`           | Request UI is connected to the API. Copy says “预约” and the result flow later exposes fulfillment semantics (§6)                                                                                     | Booking-form and service/result component tests; no full public journey run                     |
| `/o/:resultAccessToken`                                                        | Show submitted/confirmed/declined result, poll submitted state and allow manual refresh                                                                           | `GET /api/v1/public/requests/:resultAccessToken`; customer-request result use case                                                                                                                       | Implemented result access path; the result is intentionally bearer-token based, so token handling and copy need the same boundary review as requests                                                  | Result page, order-result-card and order-result hook tests; browser evidence unverified         |

## 4. Core business journey audit

### 4.1 Identity, account and session

- **Entry and state:** public auth pages call the auth service. `ProtectedRoute` guards the
  Creator layout at `apps/web-v2/app/(creator)/layout.tsx:94` and redirects unauthenticated
  users at `apps/web-v2/components/auth/protected-route.tsx:28`.
- **API and application path:** login/signup/refresh/logout use `lib/auth/service.ts:75`-
  `lib/auth/service.ts:157`; identity creation and update use the Creator identity routes and
  application service.
- **Persistence and refresh:** the API client retries a 401 through one in-flight refresh and
  clears the session if refresh fails at `apps/web-v2/lib/api/client.ts:16`-
  `apps/web-v2/lib/api/client.ts:85` and `apps/web-v2/lib/api/client.ts:190`-
  `apps/web-v2/lib/api/client.ts:221`.
- **Result:** identity onboarding has a coherent UI path and focused API coverage. Browser
  session expiry, logout in a real browser and cross-tab behavior remain unverified.

### 4.2 Capability management

- **Entry and state:** `/capabilities` queries the identity response and shows loading, error,
  empty and delete-confirmation states (`apps/web-v2/app/(creator)/capabilities/page.tsx:14`-
  `apps/web-v2/app/(creator)/capabilities/page.tsx:120`). The create form requires an active
  catalog item (`apps/web-v2/features/creator-onboarding/components/capability-form.tsx:33`).
- **API and application path:** list uses `GET /api/v1/creator/identity`; create uses
  `POST /api/v1/creator/identity/capabilities`; edit and delete use the dedicated capability
  routes. The backend create route returns `CommerceIdentityResponseSchema` at
  `adapters/transport/http/creator-identity-routes.ts:133`-
  `adapters/transport/http/creator-identity-routes.ts:155`.
- **Persistence and refresh:** mutations invalidate capability and identity query keys. Focused
  identity API tests pass 9/9; no browser evidence proves refresh behavior after create/delete.
- **Result:** the business operation is present, but the response-type mismatch is an engineering
  risk (§7), and capability-to-service naming is not shown in service details (IDs are shown).

### 4.3 Service Offering creation and edit

- **Entry and state:** the form loads capabilities, catalog templates and (on edit) the offering;
  Zod validation blocks incomplete submissions at
  `apps/web-v2/features/creator-onboarding/components/service-form.tsx:35`-
  `apps/web-v2/features/creator-onboarding/lib/validation.ts:39`.
- **API and application path:** create and update call the Creator offering routes, which map to
  the Service Offering application service. Query invalidation targets both list and detail keys.
- **Persistence and refresh:** backend create/update contracts include policy status and
  `missingPublishConditions`, but the frontend interface does not model the latter. The submit
  handler sends `appearance: undefined` at
  `apps/web-v2/features/creator-onboarding/components/service-form.tsx:77`-
  `apps/web-v2/features/creator-onboarding/components/service-form.tsx:91`, so any optional
  appearance data cannot be persisted by this form.
- **Result:** basic offering CRUD is connected. Price/appearance is a visible backend-supported
  field without a working Creator input path; this is a confirmed capability limitation, not a
  claim that VS-01 requires pricing.

### 4.4 Publish, unpublish and distribution

- **Entry and state:** service detail computes a client-side `canPublish`, asks for browser
  `confirm()` and then invalidates list/detail queries at
  `apps/web-v2/app/(creator)/services/[id]/page.tsx:47`-
  `apps/web-v2/app/(creator)/services/[id]/page.tsx:98`.
- **API and application path:** publish/unpublish and distribution routes are registered at
  `adapters/transport/http/service-offering-routes.ts:153`-
  `adapters/transport/http/service-offering-routes.ts:241`.
- **Persistence and refresh:** backend publish returns `{ offering, distributionAsset }` under
  `PublishServiceOfferingResponseSchema` (`contracts/api/v1/service-offering-contracts.ts:71`-
  `contracts/api/v1/service-offering-contracts.ts:88`). The hook casts that object to
  `ServiceOffering` at `apps/web-v2/features/creator-onboarding/api/use-creator-services.ts:222`-
  `apps/web-v2/features/creator-onboarding/api/use-creator-services.ts:245`; the query is then
  invalidated, so stale state may be hidden by a successful refetch but the local contract is
  false.
- **Result:** the lifecycle endpoint exists and uses server-side authorization. The UI's
  “search and appointment” language and the external-distribution acknowledgement must be
  aligned with the frozen scope before any new lifecycle surface is expanded.

### 4.5 C number and public distribution

- **Entry and state:** dashboard and homepage management load the private reference and expose a
  stable public URL. `/` validates the display format before routing to `/r/:commerceRef`.
- **API and application path:** private reference and homepage routes are defined in
  `adapters/transport/http/public-commerce-homepage-routes.ts:49`-
  `adapters/transport/http/public-commerce-homepage-routes.ts:200`; the public resolver is at
  `adapters/transport/http/public-commerce-homepage-routes.ts:350`.
- **Contract issue:** `PrivateCommerceReferenceViewSchema` permits `ASSIGNED` or
  `NOT_ASSIGNED` at `contracts/api/v1/private-identity-contracts.ts:46`-
  `contracts/api/v1/private-identity-contracts.ts:70`. Dashboard code declares `PENDING` and
  treats any non-`ASSIGNED` value as an exception at `apps/web-v2/app/(creator)/dashboard/
dashboard-client.tsx:19`-
  `apps/web-v2/app/(creator)/dashboard/dashboard-client.tsx:60`. A not-yet-assigned reference
  can therefore be displayed as a load failure instead of a normal pending state.
- **Result:** the assigned reference/public homepage path is implemented; the unassigned state
  needs a contract-correct UI test and copy decision.

### 4.6 Customer Request receive and view

- **Entry and state:** a public visitor submits contact fields and a request message through
  `apps/web-v2/components/commerce/booking-form.tsx:27`-
  `apps/web-v2/components/commerce/booking-form.tsx:161`. Success routes to `/o/:token`; the
  result page polls only while state is `submitted` at
  `apps/web-v2/features/order-fulfillment/api/use-order-result.ts:47`-
  `apps/web-v2/features/order-fulfillment/api/use-order-result.ts:54`.
- **API and application path:** public offering, submit and result endpoints are registered at
  `adapters/transport/http/customer-request-routes.ts:59`-
  `adapters/transport/http/customer-request-routes.ts:133`; the application use cases persist
  the Commerce Action and result token.
- **Result:** request submission and status retrieval are connected and have focused component,
  hook and integration tests. No browser evidence proves duplicate submission, refresh after
  token navigation, or an actual persisted result across a real server process in this audit.

### 4.7 Creator Confirm / Decline

- **Entry and state:** `/requests` loads submitted and confirmed tabs with independent polling,
  then calls `confirm` or `decline` and displays a status message at
  `apps/web-v2/app/(creator)/requests/page.tsx:23`-
  `apps/web-v2/app/(creator)/requests/page.tsx:175`.
- **API and application path:** terminal decision endpoints are registered at
  `adapters/transport/http/customer-request-routes.ts:173`-
  `adapters/transport/http/customer-request-routes.ts:228`; the application service delegates
  to the request use cases and terminal decision repository operation.
- **Persistence and repeat behavior:** server-side state transition and 409 responses exist in
  the route contract. The client invalidates the appropriate list after success, but the buttons
  have no second confirmation and the audit did not run the browser flow to prove duplicate-click
  behavior.
- **Result:** Confirm/Decline is the valid VS-01 endpoint. The separate `confirm-fulfillment`
  operation is outside the frozen stop boundary and is reported as a product-scope finding below.

## 5. UX / UI audit

The current shell has a consistent Creator navigation, desktop sidebar and mobile navigation at
`apps/web-v2/app/(creator)/layout.tsx:9`-
`apps/web-v2/app/(creator)/layout.tsx:89`. Major list and form pages use loading skeletons,
empty states, retry buttons, `role="alert"` and `role="status"`. Buttons generally meet the
existing minimum-height convention and the public C-number form exposes an accessible label and
invalid state.

The following improvements affect task completion rather than visual taste:

| Finding                                                                                                                                                                                              | User/business impact                                                                                                                           | Classification / priority                                    |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `/requests` calls the terminal Confirm/Decline mutation directly from the card; there is no second confirmation or clear irreversible warning (`apps/web-v2/components/creator/request-card.tsx:81`- |
| `apps/web-v2/components/creator/request-card.tsx:98`)                                                                                                                                                | A Creator can accidentally create a terminal business decision; recovery is not offered by the VS-01 state machine                             | `UX / USABILITY IMPROVEMENT`, P2                             |
| Services groups `unpublished` and `archived` into one “已下架” tab (`apps/web-v2/app/(creator)/services/page.tsx:62`-                                                                                |
| `apps/web-v2/app/(creator)/services/page.tsx:128`)                                                                                                                                                   | A Creator cannot distinguish a reversible unpublish from an archived record, which obscures lifecycle state and support diagnosis              | `UX / USABILITY IMPROVEMENT`, P2                             |
| Detail shows capability UUID prefixes instead of capability names (`apps/web-v2/app/(creator)/services/[id]/page.tsx:204`-                                                                           |
| `apps/web-v2/app/(creator)/services/[id]/page.tsx:215`)                                                                                                                                              | The Creator cannot verify the semantic relationship between a service and a capability before publishing                                       | `UX / USABILITY IMPROVEMENT`, P2                             |
| Public and Creator copy uses “预约”, “履约码”, “确认履约” and “预约已提交” (`apps/web-v2/components/creator/request-card.tsx:49`-                                                                    |
| `apps/web-v2/components/commerce/order-result-card.tsx:49`-                                                                                                                                          |
| `apps/web-v2/components/commerce/order-result-card.tsx:119`)                                                                                                                                         | Visitors and Creators can infer a completed booking or platform fulfillment promise that VS-01 explicitly does not make                        | `CONFIRMED PRODUCT GAP`, P1                                  |
| Service detail duplicates publish readiness logic instead of rendering the server's `missingPublishConditions` (`apps/web-v2/app/(creator)/services/[id]/page.tsx:47`-                               |
| `apps/web-v2/features/creator-onboarding/components/publish-checklist.tsx:20`)                                                                                                                       | A server policy or condition change can leave the UI saying “ready” while the API rejects publish, increasing failed attempts and support cost | `ENGINEERING RISK`, P2                                       |
| Public result uses a bearer-like result access token in the URL and displays it (`apps/web-v2/components/commerce/booking-form.tsx:69`-                                                              |
| `apps/web-v2/components/commerce/order-result-card.tsx:95`)                                                                                                                                          | A copied URL is the customer access mechanism; the UI needs an explicit privacy explanation and lifecycle treatment before wider distribution  | `ENGINEERING RISK`, P2; browser security behavior unverified |

No evidence in this audit establishes a keyboard trap or a mobile layout failure. The existing
accessibility and responsive suites should be run as a separate browser evidence unit before
classifying either as a defect.

## 6. Frontend engineering audit

### Structure and data flow

- The app uses Next App Router route groups, feature-local React Query hooks, shared UI
  primitives and a single `SimpleApiClient`. This is understandable and keeps Creator API calls
  out of page components in most surfaces.
- React Query invalidation is present after identity, capability and offering mutations. There is
  no shared optimistic-update layer; terminal actions rely on refetch after success.
- `useServiceOffering` for Creator detail fetches the entire list and filters in the browser at
  `apps/web-v2/features/creator-onboarding/api/use-creator-services.ts:128`-
  `apps/web-v2/features/creator-onboarding/api/use-creator-services.ts:150`. This is an avoidable
  payload and latency cost as the Creator's offering count grows; no single-offering Creator API
  is currently registered.

### Contracts and request wrapper

- The client auto-adds the short-lived access token to non-public requests and uses
  `credentials: omit` for public paths at `apps/web-v2/lib/api/client.ts:121`-
  `apps/web-v2/lib/api/client.ts:166`.
- Several hooks use type assertions (`as Capability`, `as ServiceOffering`, `as OrderResult`)
  instead of runtime parsing or generated contract types. The assertions conceal the capability
  create and publish response mismatches documented in §7.
- Creator identity `socialLinks` are strings in `contracts/api/v1/creator-identity-contracts.ts:5`-
  `contracts/api/v1/creator-identity-contracts.ts:18`, while the frontend model uses
  `{ platform, url }` objects at `apps/web-v2/features/creator-onboarding/api/use-creator-identity.ts:9`-
  `apps/web-v2/features/creator-onboarding/api/use-creator-identity.ts:14`. The identity form
  currently normalizes this in an effect and maps it back on submit, but the shared type remains
  false and is another contract-drift risk.
- Explicit `Authorization` headers are also passed by request hooks such as
  `apps/web-v2/features/creator-dashboard/api/use-creator-requests.ts:45`-
  `apps/web-v2/features/creator-dashboard/api/use-creator-requests.ts:57`, even though the shared
  client injects the current bearer token. This duplication makes session boundary review harder.

### Session, route protection and security boundary

- Creator routes are protected by `ProtectedRoute`; anonymous public calls omit credentials; the
  client handles one refresh operation at a time. No browser code accesses the database and no
  long-lived service credential was found.
- The browser does retain both access and refresh tokens in `localStorage` under
  `pci.auth.session` at `apps/web-v2/lib/auth/session.ts:7`-
  `apps/web-v2/lib/auth/session.ts:14` and `apps/web-v2/lib/auth/session.ts:49`-
  `apps/web-v2/lib/auth/session.ts:55`. This violates the audit boundary that the browser must not
  hold long-lived server credentials and is the highest-risk finding. It requires a separate
  approved authentication/session change; it is not fixed here.
- Internal auth expiry recovery uses `window.location.href` at
  `apps/web-v2/lib/api/client.ts:217`-
  `apps/web-v2/lib/api/client.ts:219`. This is functional but causes a full document navigation
  and can discard in-progress form state.

### Performance and maintainability

- Public result polling is bounded to submitted state and has a 30-second stale time. This is a
  reasonable baseline, but duplicate polling from multiple tabs and request-page polling were not
  measured.
- The Creator detail list-fetch pattern and repeated client-side contract assertions are the most
  direct maintainability/performance risks found without a browser profile.
- Lint passes but reports five warnings in `apps/web-v2/components/commerce/stable-sharing-tools.tsx:80`,
  `apps/web-v2/features/creator-onboarding/components/service-form.tsx:201`,
  `apps/web-v2/lib/api/client.ts:219`, and
  `apps/web-v2/lib/api/interceptor.ts:73` and `apps/web-v2/lib/api/interceptor.ts:80`.

## 7. Confirmed findings and investigation queue

| ID                                                                                                                                                                                                                                           | Classification                                                                                                                                                                 | Priority                                                                                                                                      | Evidence and reproducible condition                                                                                                                                                                               | User/business impact | Dependency / authorization |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | -------------------------- |
| `CWD-001`                                                                                                                                                                                                                                    | `ENGINEERING RISK` / account-boundary risk                                                                                                                                     | **P0**                                                                                                                                        | Load `/dashboard`, inspect `localStorage['pci.auth.session']`, and observe access and refresh tokens written by `apps/web-v2/lib/auth/session.ts:49`-                                                             |
| `apps/web-v2/lib/auth/session.ts:55`.                                                                                                                                                                                                        | Any successful script execution in the web origin can read the session and act as the Creator; this conflicts with the stated browser credential boundary.                     | Requires a separately authorized auth/session architecture decision and browser regression evidence. Do not patch as part of this audit.      |
| `CWD-002`                                                                                                                                                                                                                                    | `CONFIRMED PRODUCT GAP` + `NEW FEATURE REQUIRES PRODUCT AUTHORIZATION`                                                                                                         | **P1**                                                                                                                                        | Open `/requests` after a Confirm, or submit a public request and open `/o/:token`; the UI exposes `confirm-fulfillment`, a fulfillment code and “履约” copy at `apps/web-v2/app/(creator)/requests/page.tsx:152`- |
| `apps/web-v2/app/(creator)/requests/page.tsx:175`, `apps/web-v2/components/creator/request-card.tsx:63`-                                                                                                                                     |
| `apps/web-v2/components/creator/request-card.tsx:107`, and `apps/web-v2/components/commerce/order-result-card.tsx:29`-                                                                                                                       |
| `apps/web-v2/components/commerce/order-result-card.tsx:74`. The backend generates the code during submit at `applications/customer-request/customer-request-use-cases.ts:209`-                                                               |
| `applications/customer-request/customer-request-use-cases.ts:213` and exposes `POST .../confirm-fulfillment` at `adapters/transport/http/customer-request-routes.ts:225`-                                                                    |
| `adapters/transport/http/customer-request-routes.ts:258`.                                                                                                                                                                                    | The live Creator and customer experience extends the VS-01 stop boundary beyond Confirmed/Declined and can promise fulfillment.                                                | Main Controller must decide whether to remove/gate this path or register a new product capability. No implementation decision is made here.   |
| `CWD-003`                                                                                                                                                                                                                                    | `CONFIRMED DEFECT` / contract mismatch                                                                                                                                         | **P2**                                                                                                                                        | Call `POST /api/v1/creator/identity/capabilities`; the route declares and sends `CommerceIdentityResponseSchema` at `adapters/transport/http/creator-identity-routes.ts:133`-                                     |
| `adapters/transport/http/creator-identity-routes.ts:155`, while `useCreateCapability` returns it as `Capability` at `apps/web-v2/features/creator-onboarding/api/use-creator-capabilities.ts:52`-                                            |
| `apps/web-v2/features/creator-onboarding/api/use-creator-capabilities.ts:70`.                                                                                                                                                                | Consumers of the mutation result would read identity fields as capability fields; current UI hides the error by only invalidating queries.                                     | Frontend contract typing and a focused mutation test; no Domain change required.                                                              |
| `CWD-004`                                                                                                                                                                                                                                    | `CONFIRMED DEFECT` / contract mismatch                                                                                                                                         | **P2**                                                                                                                                        | Call `POST /api/v1/creator/offerings/:id/publish`; backend returns `{ offering, distributionAsset }` at `adapters/transport/http/service-offering-routes.ts:153`-                                                 |
| `adapters/transport/http/service-offering-routes.ts:181`, but `usePublishService` casts the result to `ServiceOffering` at `apps/web-v2/features/creator-onboarding/api/use-creator-services.ts:222`-                                        |
| `apps/web-v2/features/creator-onboarding/api/use-creator-services.ts:245`.                                                                                                                                                                   | Local mutation data has the wrong shape, making future success handling and cache updates unsafe and hiding API changes from TypeScript.                                       | Frontend contract correction and a publish response test; no new product behavior.                                                            |
| `CWD-005`                                                                                                                                                                                                                                    | `CONFIRMED DEFECT` / incomplete form-to-API path                                                                                                                               | **P2**                                                                                                                                        | Edit or create a service with an `appearance` value in form state; `ServiceForm` explicitly sends `appearance: undefined` at `apps/web-v2/features/creator-onboarding/components/service-form.tsx:77`-            |
| `apps/web-v2/features/creator-onboarding/components/service-form.tsx:91`, while the API contract supports an appearance object with `appearanceType`, dates, location and buyer type at `contracts/api/v1/service-offering-contracts.ts:36`- |
| `contracts/api/v1/service-offering-contracts.ts:54`. The frontend offering type instead models only `currency` and price ranges at `apps/web-v2/features/creator-onboarding/api/use-creator-services.ts:16`-                                 |
| `apps/web-v2/features/creator-onboarding/api/use-creator-services.ts:26`.                                                                                                                                                                    | A supported offering field cannot be persisted by the Creator form, and the Creator detail type cannot faithfully represent the backend object.                                | Product decision is needed on whether appearance/pricing belongs in VS-01; then align the frontend contract and form/API tests if authorized. |
| `CWD-006`                                                                                                                                                                                                                                    | `CONFIRMED DEFECT` / state contract mismatch                                                                                                                                   | **P2**                                                                                                                                        | Backend reference schema uses `NOT_ASSIGNED` at `contracts/api/v1/private-identity-contracts.ts:46`-                                                                                                              |
| `contracts/api/v1/private-identity-contracts.ts:70`; dashboard accepts only `ASSIGNED                                                                                                                                                        | PENDING`at`apps/web-v2/app/(creator)/dashboard/dashboard-client.tsx:19`and throws for any non-assigned result at`apps/web-v2/app/(creator)/dashboard/dashboard-client.tsx:53`- |
| `apps/web-v2/app/(creator)/dashboard/dashboard-client.tsx:60`.                                                                                                                                                                               | A valid unassigned state is presented as a failure and the Creator is told to retry initialization.                                                                            | Frontend type/copy/test correction; no business rule change.                                                                                  |
| `CWD-007`                                                                                                                                                                                                                                    | `UX / USABILITY IMPROVEMENT`                                                                                                                                                   | **P2**                                                                                                                                        | `unpublished` and `archived` are merged into one list at `apps/web-v2/app/(creator)/services/page.tsx:62`-                                                                                                        |
| `apps/web-v2/app/(creator)/services/page.tsx:128`.                                                                                                                                                                                           | Lifecycle meaning is hidden and support cannot distinguish a reversible action from an archived record.                                                                        | Frontend-only after lifecycle labels are confirmed with Main Controller.                                                                      |
| `CWD-008`                                                                                                                                                                                                                                    | `ENGINEERING RISK`                                                                                                                                                             | **P2**                                                                                                                                        | Creator detail fetches all offerings then filters one ID at `apps/web-v2/features/creator-onboarding/api/use-creator-services.ts:128`-                                                                            |
| `apps/web-v2/features/creator-onboarding/api/use-creator-services.ts:150`; no Creator get-by-ID route is registered.                                                                                                                         | Payload and latency grow with the Creator's inventory; a missing item is indistinguishable from a list response that omitted it.                                               | Prefer an approved API contract addition or a bounded server-side list filter; do not add an Operations Admin feature.                        |
| `CWD-009`                                                                                                                                                                                                                                    | `ENGINEERING RISK`                                                                                                                                                             | **P2**                                                                                                                                        | Frontend recomputes publish readiness at `apps/web-v2/app/(creator)/services/[id]/page.tsx:47`-                                                                                                                   |
| `apps/web-v2/app/(creator)/services/[id]/page.tsx:64`, while the backend response carries `missingPublishConditions` at `contracts/api/v1/service-offering-contracts.ts:91`-                                                                 |
| `contracts/api/v1/service-offering-contracts.ts:103`.                                                                                                                                                                                        | Policy or validation changes can make the checklist disagree with the authoritative publish decision.                                                                          | Frontend should render the server conditions; if the server condition model changes, update the contract first.                               |
| `CWD-010`                                                                                                                                                                                                                                    | `UX / USABILITY IMPROVEMENT`                                                                                                                                                   | **P2**                                                                                                                                        | Terminal request buttons call mutations directly without a second confirmation at `apps/web-v2/components/creator/request-card.tsx:81`-                                                                           |
| `apps/web-v2/components/creator/request-card.tsx:98`.                                                                                                                                                                                        | Accidental Confirm/Decline can create an irreversible business outcome.                                                                                                        | Product copy/confirmation decision; server state machine remains unchanged.                                                                   |
| `CWD-011`                                                                                                                                                                                                                                    | `UNVERIFIED / NEEDS INVESTIGATION`                                                                                                                                             | P2 investigation                                                                                                                              | `public-creator-profile-routes.ts:90`-                                                                                                                                                                            |
| `public-creator-profile-routes.ts:103` comments that `commerce_profile_id === creator_id` is an assumption; `apps/web-v2/features/creator-profile/api/use-creator-profile.ts:23`-                                                            |
| `apps/web-v2/features/creator-profile/api/use-creator-profile.ts:50` is not referenced by the active public homepage route.                                                                                                                  | If the route is activated later, Creator/profile ownership could be resolved incorrectly; current Creator Web does not prove a user-visible failure.                           | Verify data-model mapping and either retire the unused path or add a contract-backed integration test.                                        |
| `CWD-012`                                                                                                                                                                                                                                    | `ENGINEERING RISK` / contract drift                                                                                                                                            | **P3**                                                                                                                                        | Identity contract returns `socialLinks` as strings at `contracts/api/v1/creator-identity-contracts.ts:5`-                                                                                                         |
| `contracts/api/v1/creator-identity-contracts.ts:18`; frontend types it as `{ platform, url }[]` at `apps/web-v2/features/creator-onboarding/api/use-creator-identity.ts:9`-                                                                  |
| `apps/web-v2/features/creator-onboarding/api/use-creator-identity.ts:14`. The form currently normalizes this at `apps/web-v2/features/creator-onboarding/components/identity-form.tsx:51`-                                                   |
| `apps/web-v2/features/creator-onboarding/components/identity-form.tsx:61`, so no runtime failure was proven.                                                                                                                                 | A future identity consumer can receive a string and assume an object, producing inconsistent profile editing or rendering.                                                     | Generate/use contract-derived frontend types and add a round-trip identity test; no Domain change required.                                   |

## 8. Creator Web and Shared API dependency matrix

| Creator need                 | Existing API capability                                                             | Domain/Application dependency                                                          | Assessment                                                                                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Account/session              | Auth login, refresh, logout, password reset; Creator `ActorContext` resolution      | Auth provider, Creator identity context                                                | Sufficient for current flow; browser token storage is the P0 boundary risk.                                                                             |
| Identity/profile             | Creator identity CRUD; private identity reference                                   | `applications/creator-identity`, identity/profile authorization policy                 | Sufficient for identity onboarding; frontend response types should be contract-derived.                                                                 |
| Capability                   | Identity list plus dedicated capability CRUD                                        | Creator identity use cases and capability repository                                   | Sufficient; create response shape is wrong in the hook.                                                                                                 |
| Service Offering             | List/create/update/publish/unpublish and policy fields                              | Service offering application service, catalog/policy services, distribution repository | Sufficient for core lifecycle; no Creator detail endpoint, and publish response is mis-modeled.                                                         |
| C number/public distribution | Private reference, private homepage/version/window/profile APIs, public resolver    | Private commerce reference/profile and public homepage application services            | Sufficient for assigned references; unassigned enum mismatch must be corrected.                                                                         |
| Customer Request             | Public offering, submit, result, Creator submitted/confirmed lists, Confirm/Decline | Customer request use cases, Commerce Action repository, canonical event recorder       | Sufficient for VS-01 request and terminal decision flow.                                                                                                |
| Fulfillment                  | Fulfillment code generation, result exposure and Creator confirmation route         | Fulfillment code repository and customer request service                               | Present in code but outside frozen VS-01; requires product authorization before it remains an active Creator capability.                                |
| Notifications                | No Creator Web notification center or read-state API was found                      | Notification port exists in core, but no active Creator surface was verified           | Do not add a notification product surface from this audit; treat as an explicit product decision if acceptance requires delivery beyond result polling. |

No missing API should be solved by expanding Operations Admin Web. The current high-value API
dependencies are contract correction, a possible Creator offering get-by-ID or bounded filter,
and an explicit product decision about fulfillment exposure.

## 9. Prioritized implementation roadmap

This is a dependency order for Main Controller review, not authorization to implement.

### P0 — security and boundary decision

1. Open a dedicated auth/session change for `CWD-001`. Decide whether Creator Web moves to an
   HttpOnly, same-site session boundary or another approved design. Define logout, refresh,
   multi-tab and recovery behavior before changing code.
2. Run a real-browser regression against protected Creator routes and session expiry only after
   the session design is approved.

### P1 — freeze the VS-01 journey

1. Main Controller decides whether fulfillment code generation, `confirm-fulfillment`, and the
   related copy are removed/gated or formally authorized as a later product capability. No
   backend/domain expansion should precede this decision.
2. Once the boundary is fixed, run the full public request -> result -> Creator Confirm/Decline
   browser journey against a disposable real API/database fixture.

### P2 — contract and completion reliability

1. Correct the capability-create and publish response types; add focused tests that assert the
   actual response envelopes.
2. Correct `NOT_ASSIGNED` handling and add a dashboard test for the normal unassigned state.
3. Decide whether `appearance` is in the current Creator offering contract. If yes, keep and wire
   the form fields; if no, remove the unsupported detail/rendering path under a recorded product
   decision.
4. Render server `missingPublishConditions`; preserve the backend as the authority for publish
   eligibility.
5. Decide whether to add a Creator offering get-by-ID endpoint or a bounded query parameter before
   optimizing the detail page.

### P2/P3 — completion UX, accessibility and performance

1. Add terminal-action confirmation/copy, separate unpublished from archived, and display
   capability names.
2. Run the existing accessibility and responsive suites, then fix only reproducible keyboard,
   mobile or loading-state defects.
3. Measure polling, public result navigation and Creator detail payloads before changing cache or
   refetch policy.

No phase authorizes payments, settlement, refunds, Marketplace, CRM, automated fulfillment,
Schema/Migration changes or independent Operations Admin expansion.

## 10. Test coverage and evidence sufficiency

### Covered by focused tests

- Creator pages: capabilities list, onboarding, profile client, homepage management, requests,
  services list and service detail.
- Public components: booking form, result page/card, public homepage, stable sharing tools.
- API/client/auth: Creator action hooks, order-result hook, API empty responses/tracing, session
  restore, logout recovery, return destinations and service error logging.
- Backend: Creator identity integration (9/9 in the isolated run), targeted Customer Request
  application use cases (12/12), and application and contract suites present in `tests/application`,
  `tests/contracts` and `tests/integration`.

### Gaps in current evidence

- No full browser run was executed for this audit. The E2E files are an inventory of intended
  coverage, not proof that the current UI passes.
- No screenshot or responsive viewport evidence is attached. Visual and keyboard findings remain
  improvements or investigation items unless a browser run reproduces them.
- No live external service or production database was used. Existing local tests do not prove
  cross-tab session behavior, token exposure under an XSS scenario, duplicate-click races or
  persisted state after a real page reload.
- The combined backend Creator/API run previously hit the default five-second timeout in
  `tests/integration/creator-identity-api.test.ts`; the isolated 30-second rerun passed and is
  the authoritative result for this audit.
- The new audit document passes Prettier and `git diff --check`. The existing execution SSOT
  already failed a full-file Prettier check at `HEAD`; it was updated without reformatting the
  historical document to avoid an unrelated whole-file diff.

## 11. Evidence index

| Evidence                                  | Location                                                                                                                                                              |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Active Creator routes and UI              | `apps/web-v2/app/(creator)/**`, `apps/web-v2/app/(public)/**`                                                                                                         |
| Shared hooks, client and session          | `apps/web-v2/features/**`, `apps/web-v2/lib/api/client.ts`, `apps/web-v2/lib/auth/session.ts`                                                                         |
| Creator identity transport and contract   | `adapters/transport/http/creator-identity-routes.ts`, `contracts/api/v1/creator-identity-contracts.ts`                                                                |
| Offering transport and contract           | `adapters/transport/http/service-offering-routes.ts`, `contracts/api/v1/service-offering-contracts.ts`                                                                |
| Request transport, use cases and contract | `adapters/transport/http/customer-request-routes.ts`, `applications/customer-request/customer-request-use-cases.ts`, `contracts/api/v1/customer-request-contracts.ts` |
| Private/public homepage dependency        | `adapters/transport/http/public-commerce-homepage-routes.ts`, `adapters/transport/http/private-commerce-profile-routes.ts`                                            |
| Canonical product boundary                | `docs/07_Product_Architecture/20_MVP_PRD_VS01.md`                                                                                                                     |
| Execution trace                           | `docs/08_Execution/21_Prototype_Execution.md` (PCI-ENG-020-A entry)                                                                                                   |
| Existing historical evidence              | `docs/09_Engineering_Governance/evidence/` (not modified)                                                                                                             |

```ini
PCI-ENG-020-A = FRONTEND AUDIT COMPLETED — AWAITING MAIN CONTROLLER REVIEW
PRODUCT_CAPABILITY = INVENTORIED
CORE_JOURNEYS = AUDITED — BROWSER EVIDENCE UNVERIFIED
P0_SECURITY_RISK = CWD-001 — LOCALSTORAGE ACCESS/REFRESH TOKEN RETENTION
P1_SCOPE_GAP = CWD-002 — FULFILLMENT WORKFLOW EXPOSED IN VS-01 SURFACES
CODE_CHANGES = NONE
SCHEMA_OR_MIGRATION_CHANGES = NONE
OPERATIONS_ADMIN_EXPANSION = NONE
COMMIT = NONE
PUSH = NONE
```
