# 121 — Operations Admin Web Architecture

> Date: 2026-11-12. Change unit: PCI-ENG-012.
> Architecture decision source: explicit Founder Direction in the PCI-ENG-012 task supplied by the user.
> Implementation: local shell VERIFIED. Administrative authentication and workflows: NOT_IMPLEMENTED.
> CONTROLLED_RECOVERY; Resume Gate NOT_FULLY_CLOSED; no full Stage 2, Pilot, production or money approval.

## 1. Adopted topology and authority

| Application      | Status                                   | Responsibility                                                                                                               | Development boundary                                                     |
| ---------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `apps/api`       | ACTIVE / SHARED_BACKEND                  | Existing API contracts, authentication, authorization, domain/application services, policy, persistence and canonical events | Shared by both clients; no second backend                                |
| `apps/web-v2`    | ACTIVE / CREATOR_WEB                     | Creator authentication, Identity/Profile/Reference, homepage, Catalog selection, Offering, Request and Creator workspace     | Sole active Creator Web; existing bounded product decisions still govern |
| `apps/admin-web` | APPROVED / OPERATIONS_ADMIN_WEB          | Independent Operations presentation                                                                                          | ENG-012 implements navigation and states only                            |
| `apps/web`       | FOUNDER_RETIRED / NO_FURTHER_DEVELOPMENT | Historical Reference Client                                                                                                  | Removed from source and active gates; Git/test archive preserves history |
| `apps/api-mock`  | FOUNDER_RETIRED / NO_FURTHER_DEVELOPMENT | Historical mock runtime                                                                                                      | Removed; shared in-memory adapters and fixtures remain                   |

This is an explicit architecture amendment. It supersedes the baseline statement that no Admin UI
is required only to the extent that a separate Admin application shell is now approved. It does
not reinterpret Decision 35 as having historically required UI, nor implement its pending workflows.

## 2. Shared API and frontend boundaries

Both frontends must call registered shared API endpoints. Neither may connect to PostgreSQL,
import backend application/domain/persistence implementations, or evaluate Catalog publication rules
as an alternative to the server. `scripts/test/check-import-boundaries.mjs` checks both frontend
trees and skips generated output. Dedicated Creator `e2e/` setup executes in Node and is outside
the frontend runtime restriction; it is not a path for runtime imports.

There is no second API service, Admin route handler, server action or API client in the shell.
Next.js rendering is not a new business backend. Future clients reuse existing services and contracts,
without duplicating Catalog, Offering or Identity rules.

## 3. Authentication and authorization responsibilities

Current Creator uses the existing local-auth architecture. Existing Operations APIs separately use
server-held Operations credentials. A valid Creator session must not be interpreted as Operations
authority. The shell does not request credentials, create a session or call Operations APIs.

A future named change unit must design an Operations session against the actual authentication
architecture, including establishment, expiration, revocation, server-side permission checks, error
semantics, cookie/CSRF/origin handling where applicable, and audit attribution. These are design
requirements for review, not implementation or a newly approved identity/role model. A same-origin
session boundary could be considered, but this document does not select or implement one.

- Never expose the existing static Operations token in JS, URLs, public environment variables,
  localStorage, sessionStorage or a permanent browser secret.
- The API remains the enforcement boundary. Hiding UI controls cannot grant or enforce authority.
- No new Operations role is introduced. Catalog administration never implicitly grants Offering-level
  human-review permission.
- The historical 401/403 contract discrepancy remains an open reconciliation item from ENG-010/011;
  this bootstrap makes no API/authentication changes or new adjudication.

## 4. Approved initial implementation

| Route              | Page               | Present behavior                                              |
| ------------------ | ------------------ | ------------------------------------------------------------- |
| `/`                | Overview           | Explains shell availability; six navigation cards, no metrics |
| `/capabilities`    | Capability Catalog | Unavailable placeholder                                       |
| `/templates`       | Service Templates  | Unavailable placeholder                                       |
| `/policy-versions` | Policy Versions    | Unavailable placeholder                                       |
| `/reports-appeals` | Reports & Appeals  | Unavailable placeholder                                       |
| `/manual-reviews`  | Manual Reviews     | Unavailable placeholder                                       |
| `/audit`           | Audit Records      | Unavailable placeholder                                       |

`app/layout.tsx` owns application metadata and the shared shell; `components/admin-shell.tsx` owns
navigation and the active location. `lib/sections.ts` is presentation metadata, not a permission
registry. `app/[section]/page.tsx` uses asynchronous Next route parameters and statically enumerated
sections; unknown sections return 404. Empty/unavailable, loading, safe error/retry and not-found
states are distinct. The layout has a keyboard skip link, visible focus, responsive navigation
and at least 44px navigation targets. Metadata is noindex; noindex is not an access-control mechanism.

The stack matches Creator: Next 16.4.5, React/React DOM 19.3.0, TypeScript 5.9.3, pnpm 10.22.0,
ESLint and Vitest/Testing Library. No UI, API or database dependency family was added. All clients
use the root workspace/lockfile; the nested Creator workspace/lock was removed.

## 5. Future Catalog integration and unresolved review authority

After separately reviewed authentication integration, Catalog screens may consume the existing
Operations workspace/audit reads, capability/template updates and loaded-version publication
endpoints. Only already registered API behavior may be used; generic CRUD, arbitrary-version
authoring and new policy decisions are not implied. Server policy remains authoritative.

Public service report submission is a separate public/Creator-facing entry from authenticated
Operations triage and review. Submission identity and anonymous-report strategy remain unresolved.
No report submission form or record workflow is implemented here.

Before implementing review/appeal modules, Main Controller must identify the exact approved
DEV-082/083 clauses and resolve actor permissions, recorded facts and allowed results. Founder
approval is required for new product behavior or powers beyond the approved contracts. Do not
invent review states, appeal outcomes, disciplinary actions or roles. Audit records of Catalog
changes are not human-review records. No review decision can bypass publication policy.

Known Catalog retirement, authorization-response and Creator filtering/cache/type gaps remain
separate from this shell. No backend contract, product object, migration, lifecycle, canonical
event, C-number, Identity or money behavior changed.

## 6. Reproducible verification

Run from the repository root, after `pnpm install --frozen-lockfile`:

```powershell
pnpm lint:admin-web
pnpm typecheck:admin-web
pnpm typecheck:admin-web:tests
pnpm test:admin-web
pnpm verify:admin-web
pnpm dev:admin-web
```

`dev:admin-web` binds 127.0.0.1:3002. `build:admin-web` is the ordinary independent build command.
`verify:admin-web` checks shell runtime sources, builds using fabricated server-only credential
sentinels, then scans all browser assets for leakage. This bounded guard rejects data access,
browser secret storage, environment reads, server actions and route handlers in this shell. It is
not a universal security proof; future integrations must deliberately revise its scope and tests.

| Verification in ENG-012                              | Result                                                                                                                                  |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Frozen workspace install                             | PASS, three workspace projects (root API package plus two clients)                                                                      |
| Active runtime and active test TypeScript aggregates | PASS, including Admin                                                                                                                   |
| Admin lint / smoke                                   | PASS / 9 tests, 0 skipped                                                                                                               |
| Admin production build + credential sentinel check   | PASS; 9 runtime source files, 13 browser assets, no sentinel leakage                                                                    |
| Local HTTP                                           | Seven routes 200; unknown section 404                                                                                                   |
| gstack browse visual/navigation                      | 1440px desktop and 375px mobile inspected; active navigation, no mobile horizontal overflow, minimum 44px nav target, no console errors |
| Creator build / native tests / root bridge           | PASS / 86 tests in 28 files / 64 tests in 3 files                                                                                       |
| API build / OpenAPI compatibility                    | PASS / PASS                                                                                                                             |
| Preserved source-entry/copy/API-operation checks     | 15 PASS in 3 files; source-entry checks are historical inventory only                                                                   |

The shared API contract/runtime suite also passed 28 tests in seven files.

No existing database, migration or deployment was used. Docker/Compose target references were
updated but no image build, deployment drill, external service or current Creator E2E acceptance
was executed. Root full preflight and historical quality debt are not declared passed. The
governance-only preflight was attempted and interrupted after its existing recursive source scan
did not complete in the observation window; dependency/generated paths are filtered after
traversal. This task does not claim that check passed or repair the broader governance scanner.

## 7. Retirement and quality-gate scope

The complete dependency and coverage classification is in
[the retired test inventory](../../tests/historical/retired-reference-client/README.md).
18 old browser specs, their three driver/fixture sources, eight old unit sources and five harness
sources are preserved. The old AT browser suite is archived, not silently claimed as passed.
Root browser acceptance now selects the existing Creator Playwright suite; equivalence of AT
coverage has not been established. Reusable copy and 19-operation contract assertions remain active.

Removed old-only gates: Reference Client design/copy/token-adapter checks and API generation;
removed historical Web compiler; retained shared token calibration and backend/historical test
checks. Added dedicated Admin lint/type/test/build/security preflight steps. CI workflow and its
database/deployment strategy were not rewritten. Its browser provisioning and controlled Creator
API fixture requirements remain outstanding prerequisites, not a passing CI claim.

## 8. Control and handoff

ENG-012 authorizes local topology retirement and shell implementation/verification only. It does
not close the formal Resume Gate, full Catalog acceptance, current Creator UI acceptance, external
Pilot, production or real money. `REAL_MONEY_ENABLED=false`. Further authentication and feature
work requires a named bounded unit, contract traceability and appropriate Controller/Founder
decisions. Historical strategic/product documents remain unchanged.
