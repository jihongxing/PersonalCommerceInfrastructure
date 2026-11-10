# Changelog

## 0.2.0 — 2026-11-11

### Added

- Responsive web-v2 Creator and public surfaces with stable sharing tools, QR sharing, copy actions, and mobile-first layouts.
- Configurable local password recovery flow with queue processing and provider-backed delivery integration.
- Controlled capability and service-template catalog across eight verticals, including database-backed policy versions and Operations lifecycle controls.

### Changed

- Creator capabilities and service offerings now use catalog and template policy gates instead of unrestricted public free text.
- Catalog policy data is read from PostgreSQL at runtime; JSON remains an idempotent bootstrap and recovery snapshot.
- Added audit records, pause/resume/retire/emergency-disable controls, and version-preserving catalog migrations.

### Verified

- Root build, migration checks, OpenAPI compatibility, focused policy/admin/API tests, and responsive web-v2 verification passed locally.
- No production migration, external mail delivery, or public deployment was performed.

## 0.1.0 — 2026-08-12

### Added

- VS-01 Controlled Prototype from Commerce Identity through Confirmed Commerce / Declined.
- Creator Identity, Capability, Service Offering, Publish, Distribution Asset, Customer Request, and Creator decision flows.
- Canonical Event recording, bounded notifications, PostgreSQL persistence, Supabase authentication adapter, OpenAPI API, and Web Reference Client.
- AT-001–AT-013 executable acceptance evidence, including the complete System Edge canonical flow.
- Engineering governance, design token, user-facing language, migration, and preflight quality gates.

### Verified

- FR-001–FR-053 are implemented for the frozen VS-01 contract.
- AT-001–AT-013 pass.
- M9 final preflight passes with 151 Vitest tests: 143 passed and 8 conditional external-environment tests skipped.
- System Edge acceptance passes with 16 tests and no skipped tests.

### Boundaries

- This release is a Controlled Prototype, not a real-money public launch.
- Payment, checkout, settlement, refund, marketplace, CRM, automatic scheduling, and fulfillment workflows remain out of scope.
