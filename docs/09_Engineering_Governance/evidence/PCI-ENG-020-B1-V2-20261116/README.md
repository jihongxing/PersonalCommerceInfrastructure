# PCI-ENG-020-B1-V2 — Evidence index

Date: 2026-11-16. The [report](../../PCI-ENG-020-B1-V2-Upstream-Logout-Revocation-Closure.md)
defines the observed result and its limits. This directory contains only V2 evidence.
V1 and earlier untracked evidence remain in place and are excluded from the V2 commit.

## Runtime evidence

| File                                                                                        | Evidence / limits                                                                                                                                                 |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseline.json`                                                                             | Starting branch/HEAD, prior ledger hash and 46 prior untracked file hashes                                                                                        |
| `prior-work-preservation.json`                                                              | Byte-prefix preservation and comparison of all 46 prior file hashes                                                                                               |
| `disposable-environment.json`, `postgres-version.json`                                      | Exact disposable container/database/port and PostgreSQL 17.10 version                                                                                             |
| `postgres-events.jsonl`                                                                     | Timestamped before/after revocation, controlled fault injections, original Refresh replay401 and final database counts; no credential values                      |
| `browser-network.jsonl`                                                                     | 49 real browser response captures through production Next BFF; body/status/UTC timestamps; gstack omits Set-Cookie                                                |
| `browser-results.json`, `browser-summary.json`                                              | 4 named browser fetch probes, 44 observed application fetches, storage and categorized logout responses                                                           |
| `authenticated-cookies-redacted.json`, `final-cookies-redacted.json`                        | Cookie metadata with all values replaced; final inventory empty                                                                                                   |
| `authenticated-browser-state.json`, `normal-browser-state.json`, `final-browser-state.json` | Real browser version, URL, Storage keys, visible Cookie names and final login state                                                                               |
| `invalid-refresh-browser.json`, `expired-refresh-browser.json`, `unreachable-browser.json`  | Failed logout remains in workspace with error and retry control                                                                                                   |
| `01-expired-access-logout.png`                                                              | Actual expired-Access UI logout reaches login page; screenshot alone does not prove revocation                                                                    |
| `02-invalid-refresh-retry.png`, `03-upstream-unavailable-retry.png`                         | Real UI failure feedback and retained workspace                                                                                                                   |
| `shared-api.log.txt`                                                                        | Actual API request/response status/correlation events, no body/credential logging                                                                                 |
| `concurrency.jsonl`                                                                         | Four races against two actual production Next processes, explicit repeated logout states, both session revocations, original/latest Refresh401 and private BFF401 |
| `db-probe.mjs.txt`, `concurrency.mjs.txt`                                                   | Exact server-only probes; credentials read from environment, never printed; paths reference the original disposable environment                                   |
| `browser-probe.js.txt`, `fetch-audit.js.txt`                                                | Observational browser probe source; no API behavior mocking                                                                                                       |
| `secret-scan.json`                                                                          | Actual runtime secret/saved credential/JWT scan and recursive browser response credential-field scan; values never included                                       |
| `cleanup.json`                                                                              | Task-service/port/container cleanup and exact temporary credential file removal results                                                                           |
| `checks.json`                                                                               | Commands, exit status, known failures and validation method                                                                                                       |
| `manifest.sha256`                                                                           | SHA-256 of all evidence files except this manifest                                                                                                                |

Two lexical `authTokenPatternAbsent:false` observations are preserved: the regex matches
the words `invalid_refresh_token` and `expired_refresh_token` inside 409 error codes. They
are not credential values. Structured field/value scans are separate; the report does not
silently replace these raw flags with true.

The real browser exercised actual UI logout for normal, expired Access, already-revoked,
invalid/expired Refresh, stopped API, retry and final scenarios. Concurrency uses real
server HTTP, not browser concurrency. Actual upstream500, malformed2xx and arbitrary401
handling uses test doubles only. Trusted HTTPS, browser foreign-Origin and deployment ACLs
are not certified. No production system or real-user account was used.

## Automated checks

Run database commands only against a freshly provisioned disposable test database with
existing migrations and required fixture roles/catalog; configure matching API/BFF secrets.
Never copy the temporary environment or encrypted session snapshots into evidence.

```powershell
pnpm --filter web-v2 exec vitest run 'app/api/[...path]/route.test.ts' lib/auth/logout-recovery.test.ts lib/auth/service-logging.test.ts lib/auth/session-restore.test.tsx lib/auth/logout-feedback.test.tsx
pnpm exec vitest run tests/integration/creator-session-revocation.integration.test.ts tests/integration/local-auth.integration.test.ts tests/integration/creator-identity-api.integration.test.ts --testTimeout 30000
pnpm typecheck:api
pnpm typecheck:active-tests:backend
pnpm --filter web-v2 typecheck
pnpm exec tsc -p <temporary-tsconfig.changed-tests.json>
pnpm --dir apps/web-v2 lint
pnpm exec eslint adapters/persistence/postgres/postgres-local-auth-repository.ts adapters/transport/http/local-auth-routes.ts applications/account-identity-membership/local-auth-service.ts apps/api/src/create-api-server.ts apps/api/src/main.ts tests/integration/creator-session-revocation.integration.test.ts
pnpm --filter web-v2 build
pnpm --filter web-v2 exec vitest run
pnpm typecheck:web-v2:tests
git diff --check
```

`focused-creator-tests.log.txt` records 21/21. `feedback-tests-final.log.txt` records the final
assertion-only adjustment rerun (1/1). `postgres-integration-tests.log.txt` records 19/19
after the initial default5s existing-test timeout was rerun with an explicit30s limit.
`production-build.log.txt` records the actual build used by both Next processes.

`full-creator-tests.log.txt` records 95 passed / 1 failed; the unchanged BookingForm test
still expects old request copy. `full-web-test-typecheck.log.txt` retains existing matcher
augmentation diagnostics. `initial-web-test-typecheck.log.txt` also contains the three new
feedback matcher diagnostics corrected before the final run; final output has no changed-file
diagnostics. `secret-scan.mjs.txt` preserves the scanner source without runtime credentials.
`typecheck-changed-web-tests.log.txt` may be empty because tsc
prints nothing on success; command/exit information is in `checks.json`. Its isolated
configuration is preserved as `tsconfig.changed-tests.json.txt`.

ESLint logs preserve the existing four Web warnings. Formatting logs cover the selected
13 code files, new Markdown/JSON and only the new appendices of historical governance
documents. `.env.example` has no available Prettier parser and is checked via diff/whitespace.

Console/source text exports normalize line endings and trailing whitespace only; response facts, failures and raw observational flags are preserved.
