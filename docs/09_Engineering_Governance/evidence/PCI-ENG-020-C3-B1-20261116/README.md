# PCI-ENG-020-C3-B1 evidence index

All database rows are newly created synthetic fixtures in the disposable loopback PostgreSQL
`pci_020c3b1_58a068bb`. No production/shared history was inspected. No raw database credentials
or real user data are included. Console logs have trailing whitespace and excess EOF blank lines normalized. This is not Browser/BFF, production, or external pilot acceptance.

| Evidence                                                           | Meaning                                                                                                                                    |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| baseline.json                                                      | Starting Branch/HEAD/Parent/Status and SHA-256 of 47 existing untracked files plus ledger                                                  |
| database-environment.json                                          | Unique container/database, loopback port, image; credentials omitted                                                                       |
| migration-final.txt / seed.txt                                     | Successful 43 existing migrations and existing catalog seed import                                                                         |
| socket-postgres-results.json                                       | 25 real HTTP/SQL observations, independent connection reads, complete before/after Catalog snapshots and zero Operations accounts/sessions |
| socket-postgres-probe.mjs.txt                                      | Reproducible real HTTP socket probe; requires compiled API, dedicated URL env and output path; refuses other database names/hosts          |
| focused-tests.txt                                                  | 8 files / 70 tests, including 6 Memory and 6 real PostgreSQL integration cases; no skip                                                    |
| application-final-tests.txt                                        | Final Application/Memory tests after lint correction, 10 passed                                                                            |
| creator-tests.txt                                                  | All Creator Web tests: 35 files / 110 passed                                                                                               |
| typecheck-api.txt / typecheck-web.txt / typecheck-tests-final.txt  | API/Web/active backend tests Typecheck passed                                                                                              |
| lint.txt / format-code.txt / format-docs.txt                       | Changed code ESLint and selected code/new document formatting                                                                              |
| build-api.txt / build-web.txt                                      | API and Creator production builds passed                                                                                                   |
| typecheck-core.txt / build-core.txt                                | Root checks fail with six existing Operations browser-script TS2339 diagnostics                                                            |
| typecheck-head-comparison.json / typecheck-head-comparison.mjs.txt | Read-only HEAD/current compiler comparison: same six errors, zero introduced                                                               |
| validation.json                                                    | Explicit PASS/FAIL/NOT_RUN matrix                                                                                                          |
| preservation.json                                                  | SHA-256 comparison for all prior untracked files; original ledger prefix and V1-only expected postcommit residual                          |
| cleanup.json                                                       | Only this task's disposable container and temporary secret files removed                                                                   |
| staged-files.txt                                                   | Exact reviewed task-specific index inventory; prior untracked files excluded                                                               |
| manifest.json                                                      | SHA-256 of evidence files other than the manifest itself                                                                                   |

To rerun the committed integration suite, provision an isolated PostgreSQL database named
`pci_020c3b1_<suffix>` on localhost, apply existing migrations plus their documented role/schema
prerequisites, import the existing service-policy seed, set `APPEARANCE_TEST_DATABASE_URL` only
in the runner process, then run:

```powershell
pnpm exec vitest run tests/integration/offering-appearance.integration.test.ts
```

Without the explicit URL only Memory cases run; skipped PG cases are not persistence evidence.
The dedicated suite refuses non-loopback targets and other database names. A valid test URL is
still the operator's responsibility; do not repoint this test at shared or production systems.

The fixture role/schema prerequisite setup enables running existing SQL in this disposable
superuser-owned database. It does not certify the Operations installer or deployment ACLs.
No database recovery or historical-data restoration is attempted by this task.
