# PCI-ENG-020-C3-B2 — Scoped Creator Appearance Management

日期：2026-11-17。基线：`884c025d21e1b3668bb7014599b1afdacc332c24` (`fix: preserve offering appearance on ordinary updates`). Founder scope: `FD-020-C3-BD-01 / Option B`.

```ini
PCI-ENG-020-C3-B2 = SCOPED APPEARANCE CREATOR & PUBLIC EXPERIENCE — AWAITING MAIN CONTROLLER ACCEPTANCE
```

## 1. Outcome

Creator Web now manages the complete optional Appearance object only when the exact catalog mapping is present:
`template-commercial-appearance` -> `capability-commercial-appearance`. The form uses the API object, supports create/view/edit, rehydrates after refresh, validates the date range, and prevents duplicate submits. Ordinary templates have no Appearance creation entry. Existing Appearance on an off-scope template is shown read-only and is omitted from ordinary update payloads so the B1 server preservation rule keeps it.

Public Offering pages render the existing activity metadata, including title, type, dates, location, requester category, optional pricing text, and external information URL. The requester label is neutral (`外部请求方`). `requestCallToAction` only changes the existing Request button; the payload and Request endpoint remain unchanged. No deletion, calendar, availability, payment, policy, state-machine, Schema/Migration, BFF, Session, or token-storage behavior was added.

## 2. Implementation Evidence

| Area                                                      | Evidence                                                                                                                                                                                                                                                                  |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contract and exact template gate                          | `apps/web-v2/lib/service-offering-appearance.ts:24`, `:68`                                                                                                                                                                                                                |
| Creator create/edit, preservation, retry, duplicate guard | `apps/web-v2/features/creator-onboarding/components/service-form.tsx:58`, `:97`, `:405`, `:435`                                                                                                                                                                           |
| Real API fields and validation                            | `apps/web-v2/features/creator-onboarding/components/appearance-fields.tsx:22`; `apps/web-v2/features/creator-onboarding/lib/validation.ts`                                                                                                                                |
| Creator/public shared rendering                           | `apps/web-v2/components/commerce/appearance-info.tsx`; `apps/web-v2/app/(creator)/services/[id]/page.tsx:215`; `apps/web-v2/components/commerce/service-detail-card.tsx:36`                                                                                               |
| Existing Request CTA only                                 | `apps/web-v2/app/(public)/s/[offeringId]/page.tsx:103`; `apps/web-v2/components/commerce/booking-form.tsx:35`, `:161`                                                                                                                                                     |
| Automated coverage                                        | `apps/web-v2/features/creator-onboarding/components/service-form.test.tsx` (12 scenarios); `apps/web-v2/components/commerce/service-detail-card.test.tsx`; `apps/web-v2/lib/service-offering-appearance.test.ts`; `apps/web-v2/components/commerce/booking-form.test.tsx` |
| Database verification                                     | `docs/09_Engineering_Governance/evidence/PCI-ENG-020-C3-B2-20261116/db-final.json`; `verify-postgres.mjs`                                                                                                                                                                 |

The implementation does not infer template eligibility from `appearanceType`, does not send numeric price fields, and does not use frontend staging to work around persistence. B1 ordinary-update preservation remains the backend source of truth.

## 3. Browser and PostgreSQL Matrix

All browser evidence used real Headless Chromium, production Next.js, same-origin BFF, the Shared API, and one disposable PostgreSQL database. Browser observer records redact access/result tokens and record storage key names, request origin, Authorization presence, and CSRF headers.

| Scenario                                   | Result                                                                                                                                      | Evidence                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Scoped create with full object through BFF | PASS, POST 201 and return to Services                                                                                                       | `evidence/PCI-ENG-020-C3-B2-20261116/02-scoped-create.json`              |
| Refresh/reopen and edit all metadata       | PASS, fields rehydrated; PATCH 200                                                                                                          | `03-refreshed-edit.json`, `04-scoped-edit.json`, `03-refreshed-edit.png` |
| Reversed date                              | PASS, inline `结束日期不能早于活动日期`, no API call                                                                                        | `01-invalid-date.json`                                                   |
| Scoped publish                             | EXPECTED BLOCK, POST 409 `service_offering_policy_review_required`                                                                          | `05-policy-rejection.json`                                               |
| New scoped public page / Request           | NOT AVAILABLE under unchanged review policy                                                                                                 | `13-scoped-public-unavailable.json`                                      |
| Ordinary template creation                 | PASS, no Appearance entry and payload omits Appearance                                                                                      | `08-ordinary-hidden.json`, `09-ordinary-create.json`                     |
| Off-scope historical Appearance            | PASS, read-only card, no Appearance inputs or add control                                                                                   | `06-legacy-read-only.json`, `14-legacy-read-only.png`                    |
| Ordinary edit with historical Appearance   | PASS, PATCH omits Appearance; metadata retained after reload                                                                                | `07-legacy-base-edit.json`, `14-legacy-refresh.json`, `db-final.json`    |
| Public metadata and neutral requester copy | PASS, full metadata and `外部请求方` rendered                                                                                               | `10-public-desktop.json`, `10-public-desktop.png`                        |
| Mobile public rendering                    | PASS, 375px viewport and no horizontal overflow                                                                                             | `11-public-mobile.json`, `11-public-mobile.png`                          |
| Existing Request CTA flow                  | PASS, custom CTA submitted original three Request fields; response 201, result/fulfillment code and QR loaded                               | `12-request-submitted.json`                                              |
| PostgreSQL round-trip and boundaries       | PASS, scoped object and legacy object preserved, ordinary object absent, Request + pending Fulfillment Code present, Operations counts zero | `db-final.json`                                                          |

The Public/Request PASS uses a newly synthesized ordinary published record with pre-existing Appearance because the real activity template is currently `active / established / review` and policy reevaluation correctly blocks publication. The fixture was created only in the disposable database; it is compatibility evidence, not evidence that a new scoped activity may publish. No production or shared historical rows were inspected.

## 4. Validation

- Creator Web focused and full tests: **37 files / 127 tests passed**.
- Creator Web typecheck: **passed**.
- Creator Web ESLint: **0 errors, 4 warnings** (existing React Hook Form compiler warning and unused-variable warning; no lint errors).
- API/domain/application regression suite from B1: **4 files / 35 tests passed**.
- API build and Creator production build from B1: **passed**; no production code changed after those builds except test-only coverage. Re-run before acceptance if the controller requires a fresh artifact.
- Prettier source check: run on changed source files; evidence scripts are kept as executable evidence and not part of product formatting.
- Full web test typecheck remains a pre-existing `@testing-library/jest-dom` matcher typing issue; it also affects unchanged tests and is not counted as a product typecheck failure.

## 5. Product and Safety Boundaries

The VS-01 amendment remains unchanged. Appearance does not create a Request type, requester account, identity verification, calendar, schedule, inventory, numeric quote, Payment, Settlement, Refund, Marketplace, CRM, or automated fulfillment. `approved_external_requester` is a category label only. Request, Creator Confirm/Decline, Fulfillment Code/QR, and Creator Fulfillment Confirmation state machines are unchanged. Private Creator requests continued to use same-origin BFF with HttpOnly Session; browser evidence contains no persisted token and no private Authorization bearer.

## 6. Remaining Limitation

The activity template's existing review policy prevents a newly created scoped Offering from publishing or accepting a new public Request. This is a policy/product gate outside C3-B2 and was not changed. Main Controller should decide separately whether and when that template may become publishable; this implementation does not claim new scoped public lifecycle completion or production readiness.

## 7. Git / Evidence Boundary

The independent commit contains only the C3-B2 implementation, tests, report, task evidence, and the DEV-092 ledger addition. The pre-existing V1 ledger changes and 47 pre-existing untracked evidence files remain preserved and excluded from the task commit. No history rewrite and no Push.
