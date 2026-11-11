# 117 - Active Runtime TypeScript Quality Baseline

> Task: PCI-ENG-006
> Date: 2026-11-12
> Control: CONTROLLED_RECOVERY
> Base HEAD: 9fcc850ff0d1afed0d8454d2e5d1d1c32757dfa9
> Result: active production and Web V2 test types PASS; original root and root test gates FAIL.

## 1. Authority and scope

This is an engineering measurement and quality-gate scope record. PCI-ENG-006 authorizes type-only
repairs and explicit gate separation. It does not change the
[Project Control Baseline](../08_Execution/25_Project_Control_Baseline.md), product contracts,
authorization semantics, Identity/Profile semantics, Commerce Reference ownership or generation,
database schema, migrations, public exposure or real-money controls. No product behavior changes
were made, so no new DEV product deviation is registered.

PCI-CTRL-005 was committed separately as `9fcc850ff0d1afed0d8454d2e5d1d1c32757dfa9`
(`docs: adopt project control baseline`), containing only README.md, docs/README.md,
docs/08_Execution/22_Project_Handoff.md and docs/08_Execution/25_Project_Control_Baseline.md.

## 2. Verified engineering surface

| Surface                          | Runtime evidence and role                                                                                                | Production relevance                                                             | TypeScript configuration                                        | Initial result                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| modules/                         | Domain types imported by application services                                                                            | Active shared implementation                                                     | tsconfig.build.json, NodeNext                                   | PASS as part of core build                                                       |
| applications/                    | Services and ports consumed by both composition roots                                                                    | Active shared implementation                                                     | tsconfig.build.json, NodeNext                                   | PASS as part of core build                                                       |
| adapters/                        | Auth, persistence, observability and transport wired by create-api-server.ts and PostgreSQL composition                  | Active shared implementation except the two unregistered legacy auth files below | tsconfig.build.json, NodeNext                                   | PASS as part of core build                                                       |
| contracts/                       | TypeBox schemas consumed by registered HTTP routes                                                                       | Active API contracts                                                             | tsconfig.build.json, NodeNext                                   | PASS as part of core build                                                       |
| database/                        | Drizzle schema consumed by PostgreSQL adapters                                                                           | Active storage definitions; no database execution in this task                   | tsconfig.build.json, NodeNext                                   | PASS as part of core build                                                       |
| apps/api                         | dev:api/start:api and deploy/Dockerfile.api use src/main.ts; create-api-server.ts registers local-auth-routes.ts         | Current deployable API implementation; deployment remains unauthorized           | tsconfig.api.build.json                                         | pnpm build:api PASS                                                              |
| apps/prototype                   | Root dev/start composition, and configuration imported by API main.ts                                                    | Active composition/configuration implementation                                  | tsconfig.build.json                                             | pnpm build PASS                                                                  |
| apps/web-v2                      | deploy/Dockerfile.web-v2 and deploy/compose.production.yml target this Next.js application                               | Current main Web implementation; deployment remains unauthorized                 | apps/web-v2/tsconfig.json, bundler                              | pnpm --dir apps/web-v2 exec tsc --noEmit PASS                                    |
| apps/web                         | Root dev:web/build:web/web:typecheck still target @personal-commerce/web; separate Next.js reference client              | Historical reference client retained                                             | apps/web/tsconfig.json, bundler                                 | pnpm --dir apps/web exec tsc --noEmit PASS                                       |
| apps/api-mock                    | Own dev script runs Express src/server.ts; not used by current API image/entry point                                     | Historical mock retained                                                         | No local tsconfig initially; direct tsc searches upward to root | The attempted direct check reproduced the root gate, not an isolated mock result |
| lib/ and unregistered auth files | No current API/prototype import of lib/auth helpers, registerAuthRoutes or authenticateRequest; tests retain lib imports | Historical auth/email helpers and incomplete alternate transport retained        | Root gate and new tsconfig.historical.json                      | 42 isolated diagnostics including mock                                           |

The two unregistered auth files are
`adapters/auth/middleware/auth-middleware.ts` and
`adapters/transport/http/auth-routes.ts`. Their exact exclusions already existed in
`tsconfig.build.json` at commit `6862864`. PCI-ENG-006 does not add these exclusions,
repair or activate those alternate routes, or claim their diagnostics are resolved.

## 3. Quality-gate contract

| Command                           | Scope / compiler configuration                                                                                                                                          | Exclusions and limitations                                                                                                                          | Final result                             |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| pnpm typecheck                    | Original tsconfig.json: broad apps/**/*.ts, backend, scripts, tests, tool configs                                                                                       | Existing apps/web exclusion; root omits most Web TSX; NodeNext cannot represent Web V2 bundler aliases/resolution                                   | FAIL: 206 diagnostics / 55 files, exit 2 |
| pnpm typecheck:core               | Existing tsconfig.build.json with --noEmit: modules, applications, adapters, contracts, database, API, prototype and scripts; 260 root files plus imported dependencies | Existing test/tool-config exclusions and the exact two legacy auth exclusions above; historical apps and Web V2 are not roots                       | PASS, exit 0                             |
| pnpm typecheck:api                | Existing tsconfig.api.build.json with --noEmit: API main.ts and migration entry plus all transitive imports                                                             | Two roots; compiling the migration entry never executes it                                                                                          | PASS, exit 0                             |
| pnpm typecheck:web-v2             | Web V2's existing tsconfig.json under its own compiler environment                                                                                                      | Existing test/spec/E2E exclusions remain; 99 roots at measurement time including local generated Next types                                         | PASS, exit 0                             |
| pnpm typecheck:active             | core, then API, then Web V2; fails on first failing subgate                                                                                                             | Active production only; does not replace the original root gate                                                                                     | PASS, exit 0                             |
| pnpm typecheck:tests              | New tsconfig.tests.json: adapter/domain tests, all tests/**/*.ts, root Vitest/Playwright configs and their imports; 165 roots                                           | Keeps legacy and cross-Web tests visible; no per-failure exclusions; this is a mixed root/backend test gate, not a claim that all tests are current | FAIL: 57 diagnostics / 16 files, exit 2  |
| pnpm typecheck:web-v2:tests       | New apps/web-v2/tsconfig.tests.json: every test/spec TS/TSX, E2E/harness TS, Vitest setup/config and Playwright config; 43 roots plus imports                           | Inherits strict bundler environment; excludes only node_modules and generated .next* directories, which remain covered by the production Web gate   | PASS, exit 0                             |
| pnpm typecheck:historical:backend | New tsconfig.historical.json: both api-mock entry files, exact two legacy auth files and all lib/**/*.ts; 7 roots                                                       | No failed historical file is removed; dependencies are checked transitively                                                                         | FAIL: 42 diagnostics / 6 files, exit 2   |
| pnpm typecheck:historical:web     | Calls unchanged pnpm web:typecheck for @personal-commerce/web                                                                                                           | Separate reference client config                                                                                                                    | PASS, exit 0                             |

The three original configs, Web V2 production config, existing build commands and CI/preflight were
not edited. The new commands are repeatable local gates; CI/preflight still uses the original failing
root gate. Adopting a different merge gate is a separate control decision, not implied here.

Root/backend configurations retain strict, noUncheckedIndexedAccess, noUnusedLocals,
noUnusedParameters and all other existing options. Web V2 retains its existing strict settings;
it did not previously enable the three additional root checks and they were not disabled by this task.
No any, ts-ignore, ambient stub or compiler-rule suppression was introduced.

## 4. Initial measurements and error classification

| Original command                           | Result before recovery                                        |
| ------------------------------------------ | ------------------------------------------------------------- |
| pnpm typecheck                             | FAIL: 263 diagnostics / 59 files, exit 2                      |
| pnpm build                                 | PASS, exit 0                                                  |
| pnpm build:api                             | PASS, exit 0                                                  |
| pnpm --dir apps/web-v2 exec tsc --noEmit   | PASS, exit 0                                                  |
| pnpm --dir apps/web exec tsc --noEmit      | PASS, exit 0                                                  |
| pnpm --dir apps/api-mock exec tsc --noEmit | FAIL: falls back to root config; not an independent mock gate |

| Root diagnostic class                                        | Initial | Final | Interpretation                                                                                                                                         |
| ------------------------------------------------------------ | ------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Historical mock, unregistered auth transport and lib helpers | 42      | 42    | Real unresolved imports, missing declarations, unused declarations and token helper types; retained for follow-up                                      |
| Root/backend tests                                           | 105     | 49    | 56 ProcessEnv/NODE_ENV diagnostics removed by correcting environment reader inputs; Actor narrowing, test fixtures and tracing assertions remain       |
| Web V2 under root NodeNext config                            | 116     | 115   | Wrong compiler environment causes aliases/extensions and stricter indexing errors; the axe selector type was a real test type mismatch, also corrected |
| Total                                                        | 263     | 206   | Original root gate remains FAIL                                                                                                                        |

The separate root test config measured 57 diagnostics before and after the recovery: 49 in tests plus
8 in imported historical lib/auth helpers. That config already avoids the Next.js ambient environment
pollution, demonstrating why gate scope matters. The new Web V2 test config initially exposed 90
diagnostics: 87 missing Vitest DOM matcher augmentation diagnostics, one axe selector mismatch and
two obsolete API mock response shapes. Those are now zero. These gate counts overlap and must not
be added to the root count.

### Exact diagnostic examples and causes

- Initial `adapters/observability/tracing-configuration.test.ts:6:37 TS2345`: the empty map
  lacked required NODE_ENV on NodeJS.ProcessEnv. Next.js types/global.d.ts declares that property
  required when root compilation mixes the Web source tree into the Node program.
- Initial `adapters/auth/middleware/auth-middleware.ts:2:34 TS2307`: cannot resolve
  ../../applications/core/application-error.js; the directory depth is wrong. This module is not
  imported by current runtime entries and remains historical debt, rather than being activated.
- Initial `adapters/transport/http/auth-routes.ts:10:8 TS2307`: cannot resolve
  ../../contracts/api/v1/auth-contracts.js; unresolved contracts cascade into unknown request bodies.
- `apps/api-mock/src/server-simple.ts:3:18` and `:4:16 TS7016`: missing cors and pg declarations;
  the second mock server has the same declaration failures. No dependency or lockfile change was made.
- `tests/integration/local-auth.integration.test.ts:44:26`, `:57:31` and `:57:63 TS2339`:
  expect(actor.kind).toBe('creator') does not narrow the Actor union for TypeScript. This diagnostic
  alone does not justify changing Creator/Identity semantics or the runtime Actor contract.
- `tests/integration/capability-management.test.ts:333:59 TS2345`: an old test composition omits
  the now-required servicePolicyCatalogRepository dependency.
- Initial `apps/web-v2/e2e/accessibility.spec.ts:47:7 TS2345`: axe targets can include nested frame
  or shadow selectors, so string[] was too narrow. The result type now comes from AxeBuilder.analyze.
- Initial Web V2 test gate `features/order-fulfillment/api/__tests__/use-order-result.test.tsx:52:7`
  and `:74:7 TS2353`: mock response had response: new Response() but ApiResponse uses numeric status.

## 5. Repairs and verification rationale

| File                                                                           | Repair and root cause                                                                                                  | Runtime behavior                                                                       |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| apps/prototype/src/configuration/bootstrap.ts                                  | All injected environment inputs use Readonly<Record<string, string or undefined>> instead of ambient NodeJS.ProcessEnv | Type-only; runtime defaults, parsing and all guard branches are identical              |
| adapters/observability/tracing.ts                                              | Same explicit environment input contract                                                                               | Type-only; tracing sampling, enablement and privacy unchanged                          |
| scripts/database/check-integration-environment.ts                              | Same input contract for the configuration reader                                                                       | Type-only; dedicated database guard unchanged; no database check or migration executed |
| scripts/operations/tracing-probe.ts                                            | Same input contract for the tracing probe                                                                              | Type-only; endpoint validation and requests unchanged; tests use local fake servers    |
| apps/web-v2/e2e/accessibility.spec.ts                                          | Infer axe target selector type from installed AxeBuilder return value                                                  | Type-only; scan inputs, findings and assertions unchanged                              |
| apps/web-v2/features/order-fulfillment/api/**tests**/use-order-result.test.tsx | Match the existing ApiResponse shape using status 200/404                                                              | Test fixture only; no application API change                                           |
| package.json and three new tsconfig files                                      | Expose active, root test, Web test and historical commands; add Vitest DOM matcher types to Web test compilation       | Validation/configuration only; no product change                                       |

TypeScript transpileModule comparison against base HEAD produced identical JavaScript for all four
production-source edits and the accessibility spec. Relevant tests already cover partial/empty maps,
invalid configuration, fail-closed money configuration, tracing defaults, protocol/endpoint checks and
local probe response validation; no implementation-mirroring test was added.

## 6. Test evidence

- `pnpm test:domain`: 24 files / 216 tests PASS. Modules were not edited afterward.
- `pnpm test:contracts`: 6 files / 27 tests PASS, including API runtime contracts.
- `pnpm exec vitest run adapters/observability/tracing-configuration.test.ts tests/integration/configuration.test.ts tests/database/check-integration-environment.test.ts tests/integration/tracing-probe.test.ts tests/integration/api-runtime.test.ts`: 5 files / 48 tests PASS after the environment input edits.
- `pnpm vitest run tests/integration/creator-identity-api.test.ts tests/integration/public-homepage-api.test.ts`: 2 files / 12 tests PASS before type-only edits; no involved behavior changed afterward.
- `pnpm --dir apps/web-v2 exec vitest run`: 28 files / 86 tests PASS. After the last fixture correction,
  the focused use-order-result hook suite was repeated: 1 file / 3 tests PASS.
- `node scripts/test/check-import-boundaries.mjs`: PASS.
- `pnpm exec vitest run tests/governance/import-boundaries.test.ts --testTimeout=60000`: 6/6 PASS.
  The first unmodified pnpm test:governance run failed because repository scanning exceeded its default
  five-second timeout, with 5 other tests passing. No test timeout/configuration was committed.
- `pnpm build` and `pnpm build:api`: PASS again after source edits.
- Focused root ESLint on the four changed production-source files: PASS.
- Focused Web V2 ESLint on the accessibility spec and order-result test: PASS.

The Web unit run emitted existing jsdom navigation warnings and the existing Vite __dirname warning.
No real email, external provider, external Pilot, production, database mutation or real-money acceptance
is claimed. Browser execution was not repeated for an erased type-only accessibility edit.
Repository-wide lint and full preflight remain outside this recovery and are not reported as passing.

## 7. Root affected-file inventory

Counts are compiler diagnostics, not defects; multiple diagnostics may share a cause. Locations and
full messages were captured in local compiler logs (Section 8).

| File                                                                      | Initial | Final | Diagnostic codes observed       |
| ------------------------------------------------------------------------- | ------- | ----- | ------------------------------- |
| `adapters/auth/middleware/auth-middleware.ts`                             | 3       | 3     | TS2307                          |
| `adapters/observability/safe-logger.test.ts`                              | 2       | 2     | TS2532                          |
| `adapters/observability/tracing-configuration.test.ts`                    | 14      | 0     | TS2345                          |
| `adapters/transport/http/auth-routes.ts`                                  | 21      | 21    | TS2307, TS2339, TS6133          |
| `apps/api-mock/src/server-simple.ts`                                      | 4       | 4     | TS6133, TS7016                  |
| `apps/api-mock/src/server.ts`                                             | 6       | 6     | TS6133, TS7016                  |
| `apps/web-v2/e2e/accessibility.spec.ts`                                   | 7       | 6     | TS2345, TS2835, TS7031          |
| `apps/web-v2/e2e/canonical-events.spec.ts`                                | 4       | 4     | TS2835, TS7031                  |
| `apps/web-v2/e2e/consumer-flow.spec.ts`                                   | 9       | 9     | TS2835, TS7006, TS7031          |
| `apps/web-v2/e2e/creator-flow.spec.ts`                                    | 14      | 14    | TS2835, TS7006, TS7031          |
| `apps/web-v2/e2e/full-creator-journey.spec.ts`                            | 6       | 6     | TS2835, TS7006, TS7031          |
| `apps/web-v2/e2e/homepage-management.spec.ts`                             | 4       | 4     | TS2835, TS7031                  |
| `apps/web-v2/e2e/performance.spec.ts`                                     | 7       | 7     | TS2835, TS7006, TS7031          |
| `apps/web-v2/e2e/responsive-success.spec.ts`                              | 5       | 5     | TS2835, TS7006, TS7031          |
| `apps/web-v2/e2e/tracing-harness/main.ts`                                 | 6       | 6     | TS2307, TS7006                  |
| `apps/web-v2/features/creator-dashboard/api/use-creator-actions.ts`       | 1       | 1     | TS2307                          |
| `apps/web-v2/features/creator-dashboard/api/use-creator-requests.ts`      | 1       | 1     | TS2307                          |
| `apps/web-v2/features/creator-onboarding/api/use-capability.ts`           | 2       | 2     | TS2307, TS2835                  |
| `apps/web-v2/features/creator-onboarding/api/use-creator-capabilities.ts` | 1       | 1     | TS2307                          |
| `apps/web-v2/features/creator-onboarding/api/use-creator-identity.ts`     | 1       | 1     | TS2307                          |
| `apps/web-v2/features/creator-onboarding/api/use-creator-services.ts`     | 1       | 1     | TS2307                          |
| `apps/web-v2/features/creator-onboarding/api/use-service-catalog.ts`      | 1       | 1     | TS2307                          |
| `apps/web-v2/features/creator-profile/api/use-creator-profile.ts`         | 1       | 1     | TS2307                          |
| `apps/web-v2/features/order-fulfillment/api/use-order-result.ts`          | 1       | 1     | TS2307                          |
| `apps/web-v2/features/service-booking/api/use-service-offering.ts`        | 1       | 1     | TS2307                          |
| `apps/web-v2/features/service-booking/api/use-submit-booking.ts`          | 1       | 1     | TS2307                          |
| `apps/web-v2/lib/__tests__/utils.test.ts`                                 | 1       | 1     | TS2307                          |
| `apps/web-v2/lib/api/client-empty-response.test.ts`                       | 2       | 2     | TS2835                          |
| `apps/web-v2/lib/api/client-tracing-export.test.ts`                       | 3       | 3     | TS2532, TS2835                  |
| `apps/web-v2/lib/api/client-tracing.test.ts`                              | 17      | 17    | TS2307, TS2532, TS2835, TS7006  |
| `apps/web-v2/lib/api/client.ts`                                           | 2       | 2     | TS2307, TS2835                  |
| `apps/web-v2/lib/api/interceptor.ts`                                      | 1       | 1     | TS2307                          |
| `apps/web-v2/lib/api/optimization.ts`                                     | 1       | 1     | TS2307                          |
| `apps/web-v2/lib/api/tracing.test.ts`                                     | 3       | 3     | TS2532, TS2835                  |
| `apps/web-v2/lib/auth/logout-recovery.test.ts`                            | 4       | 4     | TS2307, TS2532, TS2835          |
| `apps/web-v2/lib/auth/service-logging.test.ts`                            | 1       | 1     | TS2835                          |
| `apps/web-v2/lib/auth/service.ts`                                         | 2       | 2     | TS2307                          |
| `apps/web-v2/lib/copy-text.test.ts`                                       | 1       | 1     | TS2835                          |
| `apps/web-v2/lib/email/templates.ts`                                      | 1       | 1     | TS6133                          |
| `apps/web-v2/lib/security/security-manager.ts`                            | 1       | 1     | TS2769                          |
| `apps/web-v2/lib/utils/index.ts`                                          | 2       | 2     | TS2835                          |
| `lib/auth/password-reset-service.ts`                                      | 4       | 4     | TS6133                          |
| `lib/auth/token-service.ts`                                               | 4       | 4     | TS2345                          |
| `tests/application/service-policy-admin-service.test.ts`                  | 3       | 3     | TS2558                          |
| `tests/auth-e2e-frontend.test.ts`                                         | 8       | 8     | TS2367, TS6133                  |
| `tests/auth-integration-e2e.test.ts`                                      | 1       | 1     | TS2835                          |
| `tests/auth-integration.test.ts`                                          | 2       | 2     | TS6133                          |
| `tests/auth-token-service.test.ts`                                        | 3       | 3     | TS2769, TS6133                  |
| `tests/database/check-integration-environment.test.ts`                    | 5       | 0     | TS2345                          |
| `tests/email-service.test.ts`                                             | 3       | 3     | TS2835, TS6133                  |
| `tests/integration/browser-tracing.test.ts`                               | 8       | 8     | TS18048, TS2322, TS2339, TS2532 |
| `tests/integration/capability-management.test.ts`                         | 1       | 1     | TS2345                          |
| `tests/integration/configuration.test.ts`                                 | 32      | 0     | TS2345                          |
| `tests/integration/local-auth.integration.test.ts`                        | 3       | 3     | TS2339                          |
| `tests/integration/request-tracing.test.ts`                               | 2       | 2     | TS18048                         |
| `tests/integration/tracing-probe.test.ts`                                 | 5       | 0     | TS2345                          |
| `tests/optimization.test.ts`                                              | 4       | 4     | TS2349, TS2835, TS7006          |
| `tests/security.test.ts`                                                  | 6       | 6     | TS2835, TS6133, TS7006          |
| `tests/user-journey-e2e.test.ts`                                          | 3       | 3     | TS6133                          |

## 8. Captured logs and remaining work

Complete initial root stdout is captured locally as
`%TEMP%/pci-eng-006-root-typecheck.txt`. Final root, root test and historical stdout are captured as
`%TEMP%/pci-eng-006-final-root.txt`, `%TEMP%/pci-eng-006-final-tests.txt` and
`%TEMP%/pci-eng-006-final-historical-backend.txt`. These are local evidence artifacts, not committed
repository history; the command/configuration and affected-file inventory above are reproducible.

Follow-up units may repair historical auth/mock debt, obsolete and cross-environment root test
fixtures, Actor union narrowing and root/Web compiler orchestration. Such work must preserve the
current Identity, authorization and product boundaries. Do not derive runtime design changes from a
test diagnostic. Any CI adoption must retain failing historical/root visibility. Production/pilot/money
remain unauthorized under the current control baseline.
