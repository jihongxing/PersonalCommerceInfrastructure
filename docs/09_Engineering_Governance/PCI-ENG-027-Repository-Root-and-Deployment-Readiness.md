# PCI-ENG-027 — Repository Root Organization & Deployment Readiness

> 状态：`COMPLETED — REPOSITORY ROOT CLEANUP AND DEPLOYMENT READINESS REVIEW / AWAITING MAIN CONTROLLER ACCEPTANCE`
>
> 日期：2026-11-20
>
> 任务分支：`codex/pci-eng-027-root-cleanup`
>
> 任务 Worktree：`D:/codeSpace/PersonalCommerceInfrastructure-PCI-ENG-027`

## 1. Scope and baseline

The formal repository was checked before any edit:

- Formal repository: `D:/codeSpace/PersonalCommerceInfrastructure`
- Baseline branch: `master`
- Baseline HEAD: `1a78e14dbe2566445c50369de2f80570e8afb9e1`
- Baseline Tree: `b1f57222ffcee975f84800a8a7631b20f42f4234`
- Formal worktree: clean and unchanged by this task
- `master` remains 20 commits ahead of `origin/master`; no push was performed

The documentation freeze register was read first. This task does not alter Baseline 41,
D01-D12, F01-F04, Founder Decisions, application business semantics, API contracts,
database schema, or migration behavior.

## 2. Root inventory and disposition

The pre-change root contained the following tracked first-level items. The clean task
worktree did not reproduce the formal worktree's ignored local dependencies and build
outputs; those were separately recorded as ignored rather than treated as source:

| Root item | Purpose and current use | Tracking / disposition | Risk |
| --- | --- | --- | --- |
| `.github/`, `.dockerignore`, `.gitignore`, `.npmrc`, `.prettierignore`, `.prettierrc.json` | CI, build context, ignore rules, package-manager and formatting policy | Tracked; retained, with narrow ignore/build-context updates | Low; validated by Compose config and ignore probes |
| `.env.example`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` | Environment template, scripts, locked dependencies and workspace membership | Tracked; retained and clarified | High if changed carelessly; frozen install passed |
| `tsconfig*.json`, `vitest*.ts`, `eslint.config.js`, `drizzle.config.ts`, `VERSION` | TypeScript, test, lint, database tooling and release metadata | Tracked; retained | Required by builds and checks |
| `apps/` | Active applications: `api`, `web-v2`, `admin-web`; `prototype` remains a configuration/assembly tool | Tracked; retained | Active runtime boundary |
| `adapters/`, `applications/`, `contracts/`, `database/`, `domain/`, `modules/` | Runtime layers, use cases, API contracts, persistence/migrations, domain and modules | Tracked; retained | Active code and data shape |
| `lib/` | Historical authentication and email helpers; see §3 | Tracked; retained in place | Deletion would break historical compile/tests and old adapter references |
| `scripts/`, `tests/` | Engineering scripts and current/historical verification | Tracked; retained | Several build/deploy/test entry points depend on them |
| `deploy/` | Existing Dockerfiles, Compose definitions, environment examples and database deployment notes | Tracked; retained | Existing deployment path; no new architecture introduced |
| `docs/` | Formal strategy, contracts, execution ledger, governance and evidence indexes | Tracked; retained; this report added | Historical authority/evidence must remain intact |
| `README.md`, `docs/README.md`, `CHANGELOG.md`, `ROADMAP.md`, `idea.md`, `PCI-ENG-020-A-Creator-Web-Audit.md`, `AGENTS.md` | Project navigation, history, roadmap, design/audit input and local governance | Tracked; retained; README/index updated | Some are historical/reference documents, not deployment inputs |
| `artifacts/`, `stitch/` | Tracked screenshots, design prototypes and supporting design material | Tracked; retained; excluded from production Docker contexts | Removing would destroy historical/design evidence |
| `output/` | Tracked historical screenshots plus ignored local deployment/test outputs | Mixed; retained; local outputs remain ignored | Never treated as source or deployment input |
| `node_modules/`, `apps/*/node_modules/`, `dist/`, `.next/`, test reports and logs | Local dependencies and generated output | Ignored/untracked; not modified or committed | Formal local artifacts are not copied into the task worktree |

No root item met the evidence threshold for deletion. No file or directory was deleted,
moved, or archived by this task. The result favors explicit responsibility over a cosmetic
minimum root.

## 3. `lib/` investigation

### 3.1 Contents and origin

The directory contains exactly three tracked TypeScript files:

- `lib/auth/token-service.ts`: access/refresh/password-reset token generation, verification and hashing.
- `lib/auth/password-reset-service.ts`: password-reset token and password policy helpers.
- `lib/email/email-service.ts`: email-provider abstractions and local provider selection.

Git history attributes the files to the early local authentication/password-recovery work:

- `09f995ca` — token service and authentication foundation;
- `d3d7ec4` — password reset service and integration;
- `283bdb3` — email service and related frontend/backend test work.

The root location is a historical application-level helper location from that early
authentication implementation. It is not a third-party copy and is not a package exported
through `pnpm-workspace.yaml`.

### 3.2 Consumers and resolution evidence

Static references were found in the following current repository files:

- `adapters/auth/middleware/auth-middleware.ts` imports `lib/auth/token-service.ts`.
- `adapters/transport/http/auth-routes.ts` imports token and password-reset helpers.
- Root authentication and email tests import the helpers directly.
- `lib/auth/password-reset-service.ts` imports `lib/auth/token-service.ts`.

The TypeScript program boundaries are decisive: `tsconfig.historical.json` includes all
three files and `tsconfig.historical-tests.json` includes the auth test consumers. The
current API/Core build programs explicitly exclude the two old auth adapter files, and
the Creator Web and Admin Web program file lists contain no root `lib/` file. No
`package.json` export, TypeScript alias, Next configuration, Dockerfile, migration, or
deployment script treats root `lib/` as a shared application package.

This means `lib/` is still valid repository code within the historical authentication
and test boundary, but it is not active shared runtime code for the three maintained
applications. Text search alone was not used as the deletion decision; Git history,
TypeScript include/exclude boundaries, static imports, test configuration and build
file lists were cross-checked.

### 3.3 Decision

**Retain `lib/` in place.** A deletion or relocation would require a separately authorized
authentication cleanup/migration, updates to historical compile/test scope and old adapter
references, and a broader semantic review. ENG-027 does not provide that authorization.

## 4. Changes made

- Removed the nonexistent `design-system` directory from the root `format` and
  `format:check` script paths. The existing design-token check is not silently disabled.
- Added explicit local `MEMBERSHIP_FIRST_SLICE_ENABLED`, `PROGRAM_FIRST_SLICE_ENABLED` and
  `GOODS_FIRST_SLICE_ENABLED` entries plus Creator BFF and Admin origin examples to `.env.example`.
- Added `/output/m9-*.env` to `.gitignore` so deployment smoke-test secrets remain local.
- Strengthened `.dockerignore` for nested Next outputs, test reports, build output, local
  dependencies, tracked design material and local outputs while retaining deployment-required
  source, workspace metadata, lockfile and migrations.
- Updated `README.md` and `docs/README.md` with the three active applications, root
  responsibilities, install/build/run commands, database preparation, deployment entry
  points and readiness limitations.

No application, API, database, migration, business-rule, Founder Decision or deployment
architecture change was made.

## 5. Deployment readiness review

| Area | Result | Limitation |
| --- | --- | --- |
| Repository structure | Clear active-app and support-directory boundaries documented | Historical design and evidence material remains intentionally present |
| Dependency management | `packageManager` is `pnpm@10.22.0`; `pnpm-lock.yaml` is tracked and frozen install passed | Dependency versions were not upgraded |
| Environment | Root and deployment templates exist; local flags and BFF/Admin entries are now visible | Secrets, HTTPS, external Origins, database roles and provider configuration remain environment responsibilities |
| Build | API, Creator Web and Admin Web production builds passed | Build success is not production authorization |
| Docker / Compose | Existing API Dockerfile built; production and external-pilot Compose configs validated | No image push, deployment or runtime stack launch was performed |
| Database | Migration manifest check passed through migration `0045_goods_first_slice.sql` | No existing database or historical container was modified |
| Production readiness | Not certified | Operations type errors, OpenAPI manifest drift, missing design-token input and production gates remain outside scope |

The existing deployment path is `deploy/compose.production.yml`, with API and Creator Web
images and an optional `operations-admin` profile. `deploy/production-database.md` remains
the database preparation authority; ordinary local `pnpm db:migrate` is not a substitute for
the controlled production installer. `REAL_MONEY_ENABLED=false` remains explicit.

## 6. Verification record

Executed in the task Worktree:

- `pnpm install --frozen-lockfile` — PASS.
- `pnpm build:api` — PASS.
- `pnpm build:creator-web` — PASS.
- `pnpm build:admin-web` — PASS.
- API `/health`, Creator `/auth/login`, Admin `/login` local smoke — PASS (HTTP 200).
- Root auth/password-reset/email targeted Vitest — PASS, 5 files / 108 tests.
- `node scripts/database/check-migrations.mjs` — PASS, migrations `0000` through `0045`.
- Existing production and external-pilot Compose config validation — PASS.
- Existing API, Creator Web and Admin Web Dockerfile builds — PASS
  (`localhost/pci-eng-027-api:local`, `localhost/pci-eng-027-creator:local`,
  `localhost/pci-eng-027-admin:local`).
- Ignore probes, tracked-template checks, `git diff --check` and
  `pnpm exec prettier --check package.json` — PASS. Markdown was not reformatted globally.
- `git diff --check` — PASS after final edits.

Known failures, kept separate from this task:

- `pnpm typecheck:core` — FAILS on the known Operations union `.body` diagnostics in
  `scripts/test/verify-operations-admin-browser.ts` lines 196, 198, 216 and 218.
- `pnpm test:contracts` — one existing OpenAPI route-list expectation fails because the
  current Operations Admin routes are present in the generated document; this task did not
  rewrite the contract fixture.
- `pnpm check:design-tokens` — FAILS because
  `design-system/tokens/design-tokens.json` is absent. The root script still points to the
  historical checker; the missing design-system input was not recreated or silently ignored.
- `pnpm format:check` — existing repository-wide formatting drift reports 88 files; this task
  did not format unrelated source or use that broad failure as a reason to expand scope.
- Full `pnpm check:openapi` was not claimed as passed; its build path is blocked by the known
  `typecheck:core` issue and the route compatibility drift.

## 7. Safety and final Git state

No Project or Right work was resumed. Service, Membership, Program and Goods rules were not
changed; Goods remains disabled by default; `REAL_MONEY_ENABLED=false`. No Push, production
deployment, external Pilot, real-money operation, branch deletion, other Worktree cleanup,
history rewrite or historical-evidence deletion was performed.

Final commit and Tree are recorded by the Git handoff after this report is committed; the
commit's parent is the verified baseline `1a78e14dbe2566445c50369de2f80570e8afb9e1`. The
task branch and Worktree are intentionally left in place for Main Controller review.
