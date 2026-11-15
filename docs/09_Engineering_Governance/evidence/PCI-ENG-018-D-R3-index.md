# PCI-ENG-018-D-R3 Evidence Index

Status: `PCI-ENG-018-D-R3 = POLICY PREVIEW FIXED & FULL BROWSER FLOW PASSED — AWAITING MAIN CONTROLLER ACCEPTANCE`

This record covers only the Preview BFF failure resolution and the complete D Browser acceptance.
It preserves the D, D-R1, and D-R2 implementation and evidence records. No Catalog lifecycle,
permission, Schema, Migration, Session, Creator Auth, Offering/Request, RBAC, production, Pilot,
or Real Money behavior was reopened.

## Baseline and Worktree

- Branch: `codex/pci-eng-015-b-r2-persistence-closure`
- HEAD: `99abd6c0b83e7e5eeec38477e88be552cefec76e`
- Parent: `59f958559900ed3ead68ef57b875fcd79346d8dc`
- At start: no staged changes; inherited D/R1/R2 worktree changes were retained. No reset,
  clean, checkout, commit, or push was performed.
- R3 implementation files: `apps/admin-web/lib/operations-catalog-proxy.ts`,
  `apps/admin-web/lib/operations-catalog-proxy.test.tsx`, and the D Browser evidence harness
  `scripts/test/verify-operations-admin-browser.ts`.

## Root Cause and Fix

The original Preview request was a POST without a body. The BFF forwarded `body: ''` and
`Content-Type: application/json`, and Fastify returned HTTP `500` (`internal_error`). The BFF now
reads the body once and omits both fields when empty. After that correction, the upstream
activation endpoint correctly returned HTTP `204`, but the BFF attempted
`new Response(arrayBuffer, { status: 204 })`; the Fetch API rejects a body for `204`, which became
HTTP `503` through the BFF catch handler. The final fix omits the reconstructed body for `204`,
`205`, and `304`. The underlying activation transaction was successful; no SQLSTATE or database
error caused the observed failures.

Relevant source evidence:

- `apps/admin-web/lib/operations-catalog-proxy.ts:20` — bodyless request forwarding.
- `apps/admin-web/lib/operations-catalog-proxy.ts:36` — no-content response preservation.
- `apps/admin-web/lib/operations-catalog-proxy.test.tsx:70` — upstream `204` regression test.
- `apps/admin-web/app/api/operations/catalog/drafts/[version]/preview/route.ts:6` — Preview BFF
  route and server-held Session cookie.
- `apps/admin-web/components/catalog-policy-panel.tsx:116` — Preview/Validate UI handling.

## Focused Tests and Quality

| Command                                                                                                                                     | Result             |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| `pnpm --filter admin-web exec vitest run lib/operations-catalog-proxy.test.tsx --reporter=verbose`                                          | 5/5 PASS, exit 0   |
| `pnpm exec vitest run tests/application/service-policy-draft.test.ts tests/integration/service-policy-draft-api.test.ts --reporter=verbose` | 5/5 PASS, exit 0   |
| `pnpm --filter admin-web test`                                                                                                              | 48/48 PASS, exit 0 |
| `pnpm --filter admin-web typecheck`                                                                                                         | PASS, exit 0       |
| `pnpm --filter admin-web typecheck:tests`                                                                                                   | PASS, exit 0       |
| Changed Admin source ESLint                                                                                                                 | PASS, exit 0       |
| R3 BFF/panel/test and R3 evidence-index Prettier checks                                                                                     | PASS, exit 0       |
| `pnpm --filter admin-web build`                                                                                                             | PASS, exit 0       |
| `git diff --check`                                                                                                                          | PASS               |

The draft tests cover active-snapshot isolation, Preview, stale Revision conflict, invalid-policy
validation, explicit activation confirmation, and Human Operations authorization. The API test
covers 403 permission denial, 200 Preview, validation of activation confirmation, and 204
activation. The BFF tests cover credential isolation, empty Preview forwarding, the 204 response
boundary, and unsafe-origin rejection.

## Browser Evidence

Command:

```text
$env:PCI_BROWSE_EXECUTABLE='E:/Users/jihx/.codex/skills/gstack/browse/dist/browse.exe'
$env:PCI_RUN_OPERATIONS_ADMIN_D='1'
pnpm exec tsx scripts/test/verify-operations-admin-browser.ts
```

Process exit: `0`. Structured evidence: `PCI-ENG-018-D-browser-1794768266066.json`.
The record contains `processExitCode: 0`, the real HeadlessChrome commands, HTTP statuses,
browser checks, cleanup command, and `result: PASS`.

The run proved:

- Login and the seven authoritative permissions; forged headers without a Session returned 401.
- All 15 valid/invalid static-token and forged-header probes for the five retired routes returned
  410, with Catalog count/hash snapshots unchanged.
- Draft Create returned 201; Draft Update returned 200; Preview returned 200; Validate returned
  200; Activation returned 204 upstream and the UI displayed the activation success message.
- The Preview result rendered the changed `riskTier`; Catalog and Audit snapshots before and after
  Preview were identical.
- Audit filtering found the activation record; Catalog list/detail and Audit list/detail rendered.
- Injected logout 503 and network failure retained the server Session, cookie, and shell; a
  confirmed retry returned 204, revoked the Session, cleared the cookie, and the old credential
  returned 401. Protected access redirected to `/login`.

The harness also logged an unrelated `GET /api/operations/overview` HTTP 500 while loading the
home shell. It did not affect the D management path and was not changed or reclassified here.

## PostgreSQL Provenance

Structured PostgreSQL evidence: `PCI-ENG-018-D-pci-018br1-e1fd303aa9-postgres.json`.

- Image: `docker.m.daocloud.io/library/postgres:17.10-alpine`.
- Digest: `sha256:af194ccf3e2d7fe367012c7b88ce8b816c5c889b18a5b316799a1f0d7eac746a`.
- PostgreSQL Server: `17.10` (`version_num 170010`).
- Podman Client/Server: `5.7.1 / 5.7.1`.
- Container: `7c2b5e4fc97f25ac0898022db6367802d1774a3bf30b7745aaeb8f559b2daac0`.
- Dynamic port: `127.0.0.1:39639`.
- Database: `pci_ops_migration_fixture_admin_1`.
- Migration wrapper: `D:\dev\nodejs\node.exe --import tsx scripts/database/run-controlled-migration.ts E:\User\jihx\AppData\Local\Temp\pci-018br1-xR2sll\legacy`,
  exit `0`; the retained wrapper records COMMIT with SQLSTATE `00000` and `confirmed-success`.
- Journal: six rows after the fixture migration; the fixture-specific migration evidence is
  retained in the JSON record.
- Cleanup: `podman rm --force --volumes pci-018br1-e1fd303aa9`, exit `0`.
- Residual container query: empty, exit `0`.

## Boundaries and Open Items

No new business permission or write path was added. No database Schema/Migration or ACL was
modified. Full repository tests and full lint were not rerun; the historical `1253 PASS / 2 FAIL /
1 collection failure / 218 pending-skipped` and `459` full-lint errors remain
`UNCLASSIFIED / NOT PROVEN PRE-EXISTING`. The Browser harness and historical Execution Markdown
were not reformatted; their broad Prettier check is not claimed. The unrelated Overview 500 remains
an open quality item.

```ini
PCI-ENG-018-D-R3 = POLICY PREVIEW FIXED & FULL BROWSER FLOW PASSED — AWAITING MAIN CONTROLLER ACCEPTANCE
PCI-ENG-018-D_PREVIEW_BFF = FIXED
PCI-ENG-018-D_BROWSER_PROCESS_EXIT = 0
PCI-ENG-018-D_PREVIEW_DATA_INVARIANCE = PASS
PRODUCTION = NOT AUTHORIZED
EXTERNAL_PILOT = NOT AUTHORIZED
REAL_MONEY_ENABLED = false
```
