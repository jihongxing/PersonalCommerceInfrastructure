# PCI-ENG-018-F-ISSUE-01 Evidence Index

Status: `PCI-ENG-018-F-ISSUE-01 = ACCEPTED`

## Root Cause

The HTTP 500 was produced by the PostgreSQL query repository while the authenticated
Overview request selected the `offering` module. The D/C browser fixture installed only
the Catalog migration and therefore had no `service_offerings` or `commerce_actions`
relations. The first Operations account still had the existing `offering:read` and
`request:read` permissions, so the service correctly selected those modules and PostgreSQL
raised SQLSTATE `42P01` (`relation "service_offerings" does not exist`). The BFF forwarded
the response and the API mapped the unhandled database error to HTTP 500; Cookie, Session,
permission resolution, DTO validation, and BFF transport were not the source of the error.

The diagnostic Disposable PostgreSQL run recorded the following structured result:

```json
{
  "tables": [
    "service_policy_audits",
    "service_policy_capabilities",
    "service_policy_releases",
    "service_policy_templates"
  ],
  "error": {
    "constructor": "PostgresError",
    "code": "42P01",
    "severity": "ERROR",
    "message": "relation \"service_offerings\" does not exist"
  }
}
```

## Fix

`scripts/test/verify-operations-admin-browser.ts` now installs the existing Flow read fixture
for every authenticated browser scenario that renders Overview, including Catalog-focused C/D
scenarios. The fixture installs existing commerce migrations and grants Runtime `SELECT` only;
no production code, Schema, Migration, ACL, permission, or business write path changed. The
same harness now asserts HTTP 200 for Overview in those scenarios. F/E continue to assert the
real fixture totals (one Offering and three Requests).

## Verification

- PostgreSQL provenance: PostgreSQL 17.10 (`version_num 170010`), Podman disposable fixture;
  the diagnostic Catalog-only database and the fixed Flow database were destroyed with no
  remaining container.
- Fixed browser evidence: `PCI-ENG-018-F-ISSUE-01-browser-1794770169452.json`.
- Fixed PostgreSQL provenance: `PCI-ENG-018-F-ISSUE-01-pci-018br1-f9d77a5cc3-postgres.json`.
- Catalog-focused regression browser evidence: `PCI-ENG-018-F-ISSUE-01-C-browser-1794770991496.json`;
  its PostgreSQL provenance is `PCI-ENG-018-F-ISSUE-01-C-pci-018c-6e6ca48311-postgres.json`.
- PostgreSQL Overview/query acceptance: `PCI-ENG-018-F-ISSUE-01-pci-018br1-abfe19ace6-postgres.json`.
- Fixed browser process exit code: `0`; Overview HTTP status: `200`; API `unhandled_api_error`
  log entries: none; returned Offering total: `1`; returned Request total: `3`.
- Existing PostgreSQL Overview/query suite: `10/10 PASS`; Operations flow API suite: `34/34 PASS`;
  Admin Web suite: `48/48 PASS`.
- API TypeScript, Admin Web TypeScript, changed browser-harness TypeScript, changed-file ESLint,
  Prettier, Admin Web build, and `git diff --check`: `PASS`.
- Catalog/Audit/Flow business-row reads remained read-only; Runtime had `SELECT` and no
  `INSERT`, `UPDATE`, or `DELETE` on Flow tables.
No database operation was performed against a production or business database. No new
Authentication Runtime, Cookie, BFF authorization, Catalog, Offering, Request, Audit, Session,
Credential, Schema, Migration, or permission behavior was introduced.
