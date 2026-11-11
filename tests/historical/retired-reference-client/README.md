# Retired Reference Client test inventory

PCI-ENG-012, 2026-11-12. These sources are historical evidence, excluded from active Vitest,
TypeScript, ESLint and formatting gates. They are not executable substitutes for current Creator
Web acceptance. Recover the complete original harness and retired application from Git commit
`a792267c957e267189cb3d56e571ac8b139d5fa8`. No shared backend implementation was retired.

## Classification and preservation

| Source | Classification | Treatment / current coverage |
| --- | --- | --- |
| 18 browser specs plus driver and two fixture source files | Retired Reference Client routes, selectors, session and runtime harness | Moved byte-for-byte to `browser/`; preserves M2/M4/M5/M6, AT-001–013, CLIENT-002, CR02/04/06 and VS02A/E/F/H/L history. These UI checks cannot run against Creator Web without an explicit port of their assertions. |
| Three private Reference/Relationship/External Account unit files | Retired Web components, including historical Profile-owned Reference and delegated relationship presentation | Original sources retained under `unit/components/`; no current frontend imports them. Their old semantics do not authorize new features. Current Identity/Profile/C-number and related backend tests remain active. |
| API authentication, client, error and message adapter unit files | App-private implementation tests, some generally useful assertions | Original sources retained under `unit/lib/`. Current Creator session, return destination, recovery, client tracing/error and UI tests remain active; old adapters are not shared modules. |
| Supabase session unit file | Retired Web Provider-specific implementation | Source retained under `unit/lib/auth/`; Creator uses its existing local-auth client, not this Provider adapter. Shared Provider/backend tests remain active. |
| Mock-only tests | None found in tracked sources/imports | No test or active application imported `apps/api-mock`. Backend in-memory repositories and fixtures were retained. |
| Canonical C-number copy assertion | Reusable behavior | `tests/application/commerce-reference-copy.test.ts` now calls actual Creator `lib/copy-text.ts`; clipboard fallback tests remain in Creator. This is a copy utility check, not proof that all UI call sites use canonical values. |
| Foundation OpenAPI operation inventory | Reusable backend contract assertion | Preserved as `tests/contracts/workspace-api-operations.test.ts`, using actual Fastify injection and asserting all 19 original method/path/operationId pairs. |
| Current Creator tests | Current application coverage | All 28 existing native test files are intact; all 86 cases passed. The three root Web bridge files remain active, with 64 cases passing. |

The eight old unit files are source snapshots, not an independent build target. Their imports
intentionally retain their original relative paths, so archive execution would require restoring
the matching Git revision. Browser source snapshots also retain original paths and imports.

## Gate changes

- Root `test:acceptance:browser` now selects the existing Creator Playwright configuration and
  `apps/web-v2/e2e`, replacing the retired Reference Client suite. It does not provide equivalent
  AT coverage automatically. The Creator harness requires controlled API fixtures and installed
  browsers; this task did not execute it or claim current AT-001–013 PASS.
- The root `playwright.config.ts` and four retired launchers are retained beside this README: prepare
  browser acceptance, start browser Web server, VS02E PostgreSQL browser, and CR02 real verification.
  They are historical source snapshots and must not be run at the archive paths.
- `tests/acceptance/vs01.acceptance.test.ts` preserves the 13 historical AT entry labels by reading
  this archive. Its PASS only confirms the source inventory; it does not execute product ATs.
- Retired Web copy/design/token-adapter gates and API generator were removed. Shared design-token
  calibration, backend gates and all current Creator tests remain. The historical Web compiler and
  its alias were removed; remaining historical backend/test compiler failures remain visible.
- Root preflight still runs its original broad format/lint/typecheck/test/build/OpenAPI gates.
  Creator remains its Web target; dedicated Admin lint, runtime/test types, smoke and build/security
  gates are added by the bootstrap change. No general quality-gate failure was suppressed.

## Coverage limitation

Retirement removes execution of old UI flows, including Request/Reservation/Contract and historical
Operations presentation. Backend/domain/application coverage remains, but it is not equivalent
to current Creator end-to-end acceptance. Main Controller must track current UI acceptance
separately rather than promote archived tests or shell smoke results to product acceptance.

Pre-existing ignored browser auth state was moved outside Git without reading its contents, to
the task temporary evidence directory. No auth-state file is included in this archive. Original
ignored build/node_modules residue was moved to ignored `.gstack/retired-workspaces/`; neither
retired application path remains under `apps/`. These local caches are not source or future targets.
