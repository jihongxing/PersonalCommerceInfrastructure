# PCI-ENG-018-F Evidence Index

The following artifacts are retained for the bounded Operations Overview, cross-module search and
server-side query unit. They contain the original commands, exit codes, disposable environment
metadata, query evidence, cleanup results and browser checks.

| Artifact                                            | Coverage                                                                                      |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `PCI-ENG-018-F-pci-018br1-7a2fb09d20-postgres.json` | PostgreSQL 17.10 query/pagination fixture, seven pages over 137 rows, query plans and cleanup |
| `PCI-ENG-018-F-pci-018br1-75cb0e3957-postgres.json` | Browser fixture PostgreSQL provenance, read integrity and cleanup                             |
| `PCI-ENG-018-F-browser-1794684569736.json`          | 29 real browser checks, including Overview, responsive layout and four search-to-detail paths |
| `PCI-ENG-018-F-browser-process-1794684569780.json`  | Browser process command and exit code `0`                                                     |
| `PCI-ENG-018-F-checks-closure-final-1794685271954.json` | Production/API/backend-test/Admin TypeScript, Admin tests, Admin Build and Prettier exit codes |
| `PCI-ENG-018-F-lint-1794684478248.json`             | Changed-code and Admin lint command evidence                                                  |

The browser and PostgreSQL records are disposable-fixture evidence only. They do not authorize
Production, external Pilot, business writes, RBAC expansion or real-money activity.
