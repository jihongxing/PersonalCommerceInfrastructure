# PCI-ENG-020-C3-B2 Evidence

This directory contains redacted browser observations, screenshots, database snapshots, and disposable-database preparation/verification scripts for the C3-B2 implementation.

- Browser evidence uses real Headless Chromium -> Next.js BFF -> Shared API -> disposable PostgreSQL.
- Observer output scrubs token/password/secret fields. Do not add runtime-private configuration or credentials here.
- `legacy-fixture-preparation.json` identifies the synthetic ordinary published fixture used only to validate compatibility Public/Request rendering while the real activity template remains review-gated.
- `db-final.json` is the final read-only PostgreSQL assertion output. `verify-postgres.mjs` refuses any database except the task-specific loopback database.
- `01-invalid-date.json` through `15-ordinary-edit.json` are individual scenario captures; PNG files are visual evidence.

This evidence does not claim production data safety, new scoped publish approval, or external pilot authorization.
