# PCI-HARDEN-001 RESULT

> Audit date: 2026-08-26  
> Scope: Stage 2 hardening and working-tree classification  
> Product direction: `FROZEN_V1`  
> Stage 3: `NOT AUTHORIZED`  
> Real money: disabled

## Stage 2 Code Audit

- `S2-001` through `S2-009` implementation is present across `modules/`, `applications/`, `adapters/`, `database/`, and Stage 2 application/persistence tests.
- Identity, membership, Commerce Profile, legacy mapping, context resolution, and authorization code use explicit IDs and domain transitions.
- Identity and Commerce Profile `ARCHIVED` states are terminal in the domain transition functions.
- Account ownership is represented by active `OWNER` membership; authentication actor shape is not used by the new Identity/Profile authorization policy as an ownership substitute.
- No Stage 2 physical-delete path was found in the reviewed application services or repositories.
- No new Product Capability was added by this hardening pass.

## Security Audit

- The reviewed Stage 2 authorization call graph is:

  ```text
  AccountContext
    -> active OWNER membership
    -> Identity context
    -> Commerce Profile context
    -> lifecycle-specific operation policy
  ```

- Identity and Profile mutations re-resolve authorization before mutation.
- Profile resolution verifies `profile.identityId === requested identityId`.
- Legacy mutation resolution is read-only until it delegates to the same Profile authorization policy.
- Missing, ambiguous, failed, retired, invalid, or mismatched legacy mappings fail closed.
- Search results still contain legacy pre-Stage-2 `creatorId` and `Actor.kind === 'creator'` paths for existing commerce capabilities. These are classified as `LEGACY_COMPATIBILITY` / `STAGE_2_EXPECTED` where they operate on legacy Creator-owned objects; no direct Stage 2 Identity/Profile authorization bypass was confirmed.
- No `currentProfile`, `currentIdentity`, first/latest/default Profile authorization fallback, or global mutable authorization context was found in the reviewed Stage 2 paths.

## Persistence Audit

- `identities.identity_id` is the primary key.
- `account_identity_memberships.identity_id` references `identities.identity_id` with `ON DELETE RESTRICT`.
- `commerce_profiles.identity_id` references `identities.identity_id` with `ON DELETE RESTRICT`.
- `legacy_subject_mappings.identity_id` references `identities.identity_id` with `ON DELETE RESTRICT`.
- `legacy_subject_mappings.initial_commerce_profile_id` references `commerce_profiles.commerce_profile_id` with `ON DELETE RESTRICT`.
- Membership, Profile, and mapping foreign keys are non-nullable.
- Membership authority/state and mapping/Profile/Identity lifecycle values have database checks in the migrations and corresponding Drizzle schema definitions.
- Active OWNER membership uniqueness is enforced per Identity.
- Legacy subject reference and initial Profile uniqueness are enforced.
- No dangerous `DELETE CASCADE` was found in the Stage 2 migrations.
- Timestamp columns are non-nullable and timezone-aware in the Stage 2 schema.

## Migration Audit

- Migrations `0016_stage2_identity_core.sql` through `0019_stage2_legacy_subject_mapping.sql` are ordered consecutively and registered in `database/migrations/meta/_journal.json`.
- `pnpm db:check` passed and confirmed all migrations through `0019_stage2_legacy_subject_mapping.sql`.
- The migrations contain additive table/index/constraint creation only; no destructive operation was found.
- No new migration was created during this hardening pass.
- Rollback remains an operational concern because the Stage 2 migrations do not include down migrations; this is recorded as remaining debt, not changed within this scope.

## Transaction Audit

- `CreateIdentityForAuthenticatedAccount` executes Identity creation and OWNER membership creation inside the configured Unit of Work.
- PostgreSQL uses a database transaction and the in-memory implementation snapshots transaction participants and restores them on failure.
- Profile creation and lifecycle operations use repository boundaries consistent with the current Stage 2 application design.
- No orphan-producing defect was reproduced by the Stage 2 test suite.
- A future hardening opportunity remains to make every multi-record Stage 2 mutation expose one explicit transaction boundary at its application entry point; no correctness defect was demonstrated, so this is deferred.

## Compatibility Audit

- Legacy Creator Identity, Service Offering, Request, Reservation, Contract, and Paid Commerce test suites remain green.
- Existing `creatorId`, `orderId`, `commerceActionId`, `reservationId`, and `contractId` meanings were not rewritten as `identityId` or `commerceProfileId`.
- Legacy attribution remains represented through existing legacy application paths.
- Existing Creator actor checks remain classified as compatibility behavior and were not changed because they are outside the Stage 2 Identity/Profile authorization boundary.

## Test Stability Audit

- No arbitrary timeout or retry change was made by this audit.
- No new skipped test was introduced.
- The existing real-auth CR-02 tests remain skipped because real authentication credentials are not available in this environment.
- Full Vitest run: `67 passed`, `2 skipped`; `308 passed`, `10 skipped`.
- Browser acceptance: `50 passed`, `2 skipped`.
- No test-order or global-state failure was observed during repeated validation commands.

## Working Tree Audit

The working tree was not cleaned destructively. No reset, restore, checkout, clean, stash, discard, commit, or branch operation was performed.

### A — Stage 2 Implementation

- Stage 2 Identity, AccountIdentityMembership, Commerce Profile, legacy mapping, application services, authorization context/policy, repositories, schema, migrations, and their unit/application/persistence tests.
- Modified composition, Unit of Work, auth-context, and actor-context files required to wire Stage 2.

### B — Browser Harness / Acceptance Infrastructure

- `playwright.config.ts`
- `package.json` scripts required by browser acceptance
- `scripts/test/prepare-browser-acceptance.mjs`
- `scripts/test/start-browser-web-server.mjs`
- modified browser acceptance specs and related harness references

### C — Founder-owned Documentation

- Modified Founder-owned strategy, PRD, execution, handoff, governance, README, and documentation index files.
- Added `docs/07_Product_Architecture/21_ADR_001_...` through `21_ADR_008_...`.
- These files were not modified, deleted, formatted, restored, or merged by this audit.

### D — Historical / Pre-existing Engineering Changes

- Existing non-Stage-2 commerce compatibility changes, including the modified paid-commerce integration test, remain untouched.

### E — Generated / Ignored

- Ignored build/install/browser outputs remain ignored, including `.next`, `node_modules`, and `.gstack`.
- `output/s2-003a-standalone.log.err` is an untracked generated/temporary artifact. It was not deleted.

### F — Unexpected

- No unexplained source-code file was found.
- `UNCLASSIFIED_WORKTREE_CHANGE`: none.

## Commit Boundary Audit

No commit was created.

Recommended future commit groups:

- Commit Group A: Stage 2 Identity/Profile implementation, repositories, schema, migrations, and Stage 2 tests.
- Commit Group B: Browser and acceptance infrastructure.
- Commit Group C: Other pre-existing engineering fixes.
- Commit Group D: Founder-owned documentation, reviewed and committed separately by Main Control.

Founder-owned documentation must not be combined with Commit Group A.

## Execution Ledger Reconciliation

- The repository execution record was inspected without modification.
- No explicit `S2-001` through `S2-009` ledger entries were found in the inspected execution record.
- The working tree and implementation contain the Stage 2 artifacts, while the execution record does not expose matching Stage 2 completion/file/validation entries.
- Status: `EXECUTION_LEDGER_DRIFT`.
- Required action: Main Control should reconcile the ledger in a separately authorized documentation change. This audit does not silently rewrite Founder-owned execution records.

## Dead Code / Duplication Review

- No Stage 2 duplicate repository implementation or unused authorization path was safely removable.
- Legacy `creatorId` and actor-kind paths are retained as compatibility behavior.
- Potential cleanup of older Creator Identity composition paths is `DEFER` pending an explicit compatibility decision.
- No dead code was deleted.

## Reliability

- TypeScript, lint, build, migration checks, full tests, browser acceptance, and preflight completed successfully.
- Browser harness startup and production Web build completed successfully.
- No measurable Stage 2 performance defect justified optimization.

## Known Remaining Debt

- `EXECUTION_LEDGER_DRIFT` requires Founder/Main Control reconciliation.
- Two existing CR-02 real-auth browser tests remain skipped; no new skips were added.
- Stage 2 migration rollback/down-migration procedure is not represented in the migration files.
- The untracked `output/s2-003a-standalone.log.err` remains for explicit workspace-owner disposition.
- Future Stage 3 capabilities remain deferred and unauthorized.

## Validation

- `pnpm typecheck` — PASS
- `pnpm lint` — PASS
- `pnpm build` — PASS
- `pnpm db:check` — PASS
- `pnpm test` — PASS
- `pnpm test:acceptance:browser` — PASS (`50 passed`, `2 skipped`)
- `pnpm preflight` — PASS

## Final Status

```text
STAGE_2_HARDENING = COMPLETE
WORKSPACE_AUDIT = COMPLETE
STAGE_3 = NOT_AUTHORIZED
PRIMARY_WORKSTREAM = HARDENING_AND_WORKSPACE_CLEANUP
GIT = NOT COMMITTED
```
