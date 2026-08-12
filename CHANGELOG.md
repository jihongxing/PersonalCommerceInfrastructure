# Changelog

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
