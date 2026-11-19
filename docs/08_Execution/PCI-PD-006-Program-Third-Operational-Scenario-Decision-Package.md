# PCI-PD-006 — Program Third Operational Scenario Decision Package

> **Status**: `PROPOSED — AWAITING FOUNDER DECISION`
>
> **Task state**: `COMPLETED — AWAITING MAIN CONTROLLER ACCEPTANCE`
>
> **Scope**: bounded product and commerce-pattern research only. This document does not create a Founder Decision, product contract, API, database schema, migration, architecture, implementation, Pilot, production authorization, or real-money authorization.

## 1. Decision boundary

### 1.1 Founder-approved strategy

The following direction is provided by the PCI-PD-006 authorization and is treated here as an existing strategic decision, not as a new decision created by this document:

- PCI remains a unified transaction infrastructure for `Service`, `Goods`, `Program`, `Membership`, `Project`, and `Right`.
- `Service` is the first operational slice.
- `Membership` is the second operational slice and is already accepted.
- `Program` is approved as the third operational scenario.
- `Goods`, `Project`, and `Right` do not change their current sequence or operational status in this task.
- Scenario selection continues to prefer virtual and offline forms before online or longer-cycle delivery forms.
- Program remains an independent supply domain. It is not a Service feature and is not a Membership extension.

The approved strategy does not select the first Program business model. The business model, operating rules, and implementation boundary below remain proposed until Founder decision.

### 1.2 Existing authority preserved

This package preserves, and does not amend:

- [Conceptual Baseline 41](../07_Product_Architecture/41_Global_Commercial_System_Conceptual_Baseline.md), including F01–F04 and D01–D12;
- [Commercial Scenario Sequencing](../07_Product_Architecture/42_Commercial_Scenario_Sequencing_Founder_Decision.md);
- [Membership First Slice Founder Decision](../07_Product_Architecture/43_Membership_First_Slice_Founder_Decision.md);
- the existing VS-01 contract in [20 — MVP PRD VS-01](../07_Product_Architecture/20_MVP_PRD_VS01.md);
- the accepted Membership closure and current six-scenario status in [PCI-DOC-004](PCI-DOC-004-Membership-First-Slice-Closure.md).

Baseline 41 explicitly distinguishes shared commercial facts from independent domain expressions and does not authorize a universal lifecycle, state machine, API, schema, or runtime implementation. This package therefore describes product semantics and decision options only.

## 2. Current PCI scenario status

| Scenario | Current status | Interpretation |
|---|---|---|
| Service | `FIRST OPERATIONAL SLICE INTEGRATED` | Existing VS-01 and related Service operations remain in scope and must not regress. |
| Membership | `SECOND OPERATIONAL SLICE INTEGRATED / ACCEPTED` | Existing free, fixed-term offline Membership slice remains the accepted implementation. |
| Program | `NOT INTEGRATED` | Founder approval of Program as the third scenario does not enable a Program backend path. |
| Goods | `NOT INTEGRATED` | No change. |
| Project | `NOT INTEGRATED` | No change. |
| Right | `NOT INTEGRATED` | No change; Program is not a Right Grant. |

The current Operations implementation enumerates all six scenario kinds, but returns `not_integrated` and `canManage: false` for scenarios other than Service and an explicitly integrated Membership path (`applications/operations-admin/scenario-operations.ts:6-14`, `:59-79`). Attempts to change a non-integrated scenario are rejected with `scenario_not_integrated` (`applications/operations-admin/scenario-operations.ts:84-99`). Therefore, this package must not describe Program as operationally open.

`REAL_MONEY_ENABLED` remains `false`. No production, external Pilot, live payment, collection, settlement, refund, or other real-money operation is authorized by this package.

## 3. Domain boundary: Program is not Service or Membership

### 3.1 Program

For decision purposes, a Program is a bounded, time-scheduled supply with:

- a defined start and end window;
- one or more planned sessions or participation occasions;
- a defined participant capacity or other admission limit;
- an enrollment or application decision;
- participant-level participation facts;
- an explicit end or completion outcome.

The Program is the commercial supply domain. A particular scheduled cohort or run is the concrete occurrence of that supply. A participant's `Enrollment` is the participant's relationship to that occurrence, not a Membership Relationship and not automatically a Right Grant.

### 3.2 Membership

Membership expresses an ongoing provider-consumer relationship and validity period. The accepted slice publishes terms, records application and terms acceptance, performs provider approval and identity checking, creates a fixed validity period, records repeated verification and Admission, and protects existing valid relationships when new intake is paused (`docs/07_Product_Architecture/44_Membership_First_Slice_Product_Contract.md:3-9`; `applications/membership/membership-service.ts:129-145`, `:225-321`, `:323-416`).

Membership validity is not a Program schedule. A Membership may permit repeated access during its validity, whereas a Program participant is admitted to a bounded occurrence with planned sessions and an end condition. The Membership Relationship must not be reused as the Program Enrollment semantic.

### 3.3 Service

VS-01 uses a published Service Offering as the anchor for a Customer Request. The current path creates or reuses a Customer, persists a Commerce Action, generates a Fulfillment Code, and records `commerce_action_submitted` (`applications/customer-request/customer-request-use-cases.ts:175-239`). A Creator then makes a terminal Confirm or Decline decision with ownership checks and canonical events (`applications/customer-request/customer-request-use-cases.ts:337-411`).

The existing Reservation path has availability slots, holds, confirmation, cancellation, rescheduling, expiry, no-show recording, and paid-service integration points (`applications/reservation/reservation-service.ts:33-90`, `:478-503`). These are useful evidence of existing time, actor, ownership, atomicity, and fulfillment-related patterns, but a Program session is not a Service reservation and each participant attendance must not be silently represented as a Service Order.

### 3.4 Right

Right is a separate supply category and authority/permission domain. The conceptual baseline keeps Right-type Offering, Grantor, Grant, Commitment, and upstream authority distinctions separate. A Program Enrollment or attendance fact must not be declared a Right Grant merely because a participant receives access to a scheduled activity.

## 4. Candidate first Program slices

The candidates below are commercial patterns for Founder comparison, not implementation commitments.

### Candidate A — Offline short-cycle multi-session workshop

One provider offers a bounded workshop or training cohort at one physical location. A published offering describes the purpose, schedule, location, participant rules, maximum capacity, and proposed completion handling. A concrete run has multiple scheduled sessions over a short fixed period. Consumers enroll or apply; the provider confirms places; each session records whether it was held and whether each confirmed participant attended.

**Fit and trade-offs**

- Strong fit with the virtual/offline-first sequencing decision.
- Clear Program independence: the commercial unit is a scheduled cohort, not an ongoing membership and not a one-to-one Service appointment.
- Produces useful domain facts without requiring a video platform, LMS, certificate, or complex content system.
- Requires new Program semantics for a run, enrollment, capacity, session participation, and completion.
- Needs explicit rules for cancellation, provider changes, absence, and whether completion is provider-confirmed or attendance-based.

### Candidate B — Virtual live small-group Program

One provider runs a fixed multi-session live cohort using an external meeting tool. The Program still has a bounded period, capacity, enrollment, planned sessions, participation records, and completion outcome.

**Fit and trade-offs**

- Also fits the sequencing preference and preserves Program semantics.
- Avoids physical location logistics but introduces meeting-link ownership, time-zone handling, remote attendance evidence, privacy, and dependency on an external delivery service.
- The current repository contains no Program implementation and this task does not authorize video or live-session infrastructure.
- A first slice can record provider-observed participation without claiming that PCI supplies or verifies the external live platform.

### Candidate C — Offline single-session cohort clinic

One provider opens a capped, scheduled, group clinic at a physical location for one fixed occasion. Participants enroll, the provider confirms the list, and attendance is recorded for the event.

**Fit and trade-offs**

- Lowest operational and implementation complexity.
- Still distinct from a one-to-one Service appointment because capacity, common schedule, group participation, and a shared end occasion are central.
- It gives weaker evidence for Program-specific multi-session scheduling and completion semantics than Candidate A.
- It is better treated as a later minimal variant or a fallback pilot shape, not the preferred third-scenario slice.

## 5. Main Controller recommendation

### 5.1 Recommended first slice

**Recommend Candidate A: one provider, offline, short-cycle, multi-session, capped Program cohort.**

The recommended commercial pattern is:

- one provider responsible for one Program run;
- a short fixed delivery window with multiple planned sessions;
- a physical location controlled by the provider;
- a published Program Offering that can produce concrete scheduled runs;
- a fixed participant capacity;
- provider approval before an Enrollment becomes confirmed;
- enrollment closure when capacity is reached, with no waitlist in the first slice;
- attendance recorded for each planned session;
- no certificate, grade, credit, rank, entitlement, or credential outcome;
- no automatic make-up session;
- no platform collection or real-money operation for the first slice.

These are recommendations for Founder decision, not frozen rules. The recommendation is intentionally bounded: it gives Program a real period, group participation, scheduled fulfillment, and completion boundary without importing LMS, live-video, payments, or complex membership mechanics.

### 5.2 Why Candidate B is not first

Candidate B is commercially credible, but its first-slice evidence would be more dependent on external meeting operations and attendance interpretation. It is a reasonable second Program pattern after the domain facts are proven offline, not the smallest first operational closure.

### 5.3 Why Candidate C is not first

Candidate C is a valid minimal group offering, but its single occasion does not exercise the most important Program distinction from Service: a bounded multi-session schedule with participant progress across sessions. It can be supported later without changing the core Program vocabulary.

## 6. Proposed first-slice business flow

This is a product flow proposal, not an API or database design.

| Step | Proposed business fact | Existing evidence | Program-specific decision or gap |
|---|---|---|---|
| 1. Prepare | Provider defines a Program Offering and a concrete run with dates, location, capacity, and participant rules. | Creator ownership and Offering publication patterns exist for Service; Membership has provider-owned Offering terms. | Program Offering versus concrete run must be decided; no Program run exists today. |
| 2. Publish | Provider publishes the run for consumer discovery. | Published Offering is the existing prerequisite for customer action (`docs/07_Product_Architecture/17_Core_Product_Objects.md:208-245`). | Program publication must expose schedule, capacity, and intake rules without treating it as Service Offering metadata. |
| 3. Enroll | Consumer submits an Enrollment or Enrollment Application for the concrete run. | Customer identity, contact, action persistence, and correlation are present in the Service request path (`applications/customer-request/customer-request-use-cases.ts:185-238`). | Enrollment is a new Program fact; it must not be called Membership Application or Service Request without a domain decision. |
| 4. Decide | Provider confirms or declines the enrollment, subject to remaining capacity. | Creator ownership and terminal decisions exist for Service; provider approval exists for Membership (`applications/membership/membership-service.ts:286-320`). | Capacity, approval, cancellation, and full behavior need Founder decisions and Program-specific rules. |
| 5. Schedule | The run exposes planned sessions and their expected order. | Existing code has time and availability primitives in Service Reservation (`applications/reservation/reservation-service.ts:33-75`). | Program sessions, timezone/location semantics, and run lifecycle do not exist and require separate product approval before implementation. |
| 6. Deliver | Provider records that each planned session was held, cancelled, or changed; participant participation is recorded per session. | Canonical events accept actor, object, correlation, source, and server time (`applications/core/canonical-event-recorder.ts:11-40`). Membership records repeated verification and Admission facts with actor/time/correlation (`applications/membership/membership-service.ts:334-416`). | Program session and participation facts are new; no attendance or Program fulfillment path currently exists. |
| 7. Complete | The run reaches its end and each participant has a bounded outcome such as attended, absent, withdrawn, or provider-confirmed complete. | Existing fulfillment and canonical-event concepts distinguish outcome facts from prior decisions (`docs/07_Product_Architecture/17_Core_Product_Objects.md:413-460`). | Founder must choose the participant completion rule; no certificate, credit, grade, or credential is proposed. |
| 8. Operate | Admin can pause or resume new Program intake through the Operations control plane. | Service and Membership scenario control has permission checks, revision checks, reason, actor, timestamp, correlation, and history (`applications/operations-admin/scenario-operations.ts:38-129`). | Program is currently rejected as `not_integrated`; pause effects on confirmed enrollments and scheduled runs need an explicit decision. |

## 7. Program semantic vocabulary for Founder decision

The following terms are intentionally separated. They are not a proposed schema.

| Term | Meaning in the recommended slice | Must not be conflated with |
|---|---|---|
| Program Offering | The provider's durable, discoverable description of a type of Program supply. | A single run or a Membership Offering. |
| Program Run / Cohort | One concrete scheduled occurrence with a fixed period, provider, location, sessions, and capacity. | A reusable Offering or an open-ended membership relationship. |
| Enrollment Application | A consumer's request to join a particular run. | Membership Application or a generic Service Request unless separately approved. |
| Enrollment | The accepted participant relationship to a particular run. | Membership Relationship or Right Grant. |
| Participation | A fact that a confirmed participant attended or otherwise took part in a specific planned session. | Enrollment itself, payment, or completion. |
| Session Delivery | The provider-observed fact that a planned session was held, cancelled, or changed. | A Service Order or a guarantee that the provider delivered all future sessions. |
| Program Completion | The bounded end outcome for the run and, if approved, for a participant. | Certificate, academic credit, score, rank, or Right Grant. |

The recommendation is to keep the run-level end state and participant-level outcome conceptually distinct. A Program can end even if one participant was absent; whether that participant is marked complete is a separate Founder rule.

## 8. Existing capability reuse assessment

### 8.1 Existing and directly reusable patterns

- Creator/provider ownership checks and actor separation.
- Published Offering as the prerequisite for an external commercial action.
- Customer/account identity and correlation identifiers.
- Unit-of-work and persistence patterns used for Service and Membership.
- Server-controlled time through `Clock` or database time.
- Canonical events with actor, object, source, correlation, and occurrence time.
- Permission-checked Operations Human scenario control with optimistic revision and auditable reason/history.
- Existing Service availability and capacity-adjacent reservation patterns as references, not as proof that Program behavior already exists.

### 8.2 Existing but requiring adaptation

- Offering publication needs Program-specific schedule, run, capacity, and participation terms.
- Customer action patterns need a Program Enrollment vocabulary and run-specific capacity decision.
- Creator/provider decision patterns need participant-list and session-scope authorization.
- Canonical event and audit patterns need Program-specific fact names and associations.
- Admin scenario operations can provide the control-plane pattern, but Program must not be marked integrated until its backend intake and pause behavior are real.

### 8.3 Not currently present and genuinely needed for the recommended slice

- Program Offering and concrete Program Run semantics.
- Enrollment Application and confirmed Enrollment lifecycle.
- Capacity reservation and full/closed intake behavior for a run.
- Planned Session and Session Delivery facts.
- Per-participant Participation and absence facts.
- Program run completion and any approved participant completion rule.
- Program-specific Admin integration whose pause behavior affects new intake without silently rewriting confirmed enrollment or historical participation.

### 8.4 Currently insufficient to determine

- Whether the first Program provider needs consumer identity accounts or can use an existing public request pattern.
- Exact notification obligations for schedule changes, provider cancellation, or consumer cancellation.
- Whether a Program may be republished as recurring runs under one Offering or requires a new Offering revision per run.
- The legal or commercial meaning of attendance, withdrawal, transfer, refund, make-up, or no-show in a specific market.

These unknowns are not silently resolved by this package.

## 9. Founder decision table

| Decision item | Options | Main Controller recommendation | Status |
|---|---|---|---|
| First delivery form | Offline / virtual | Offline physical location | Founder decision required |
| Program period | Single occasion / multiple short-cycle sessions | Multiple scheduled sessions in a short fixed window | Founder decision required |
| Provider model | Single provider / multiple providers | Single provider | Founder decision required |
| Participation | Direct confirmation / provider approval | Provider approval before confirmation | Founder decision required |
| Capacity | Capped / uncapped | Fixed cap | Founder decision required |
| Full behavior | Close intake / waitlist | Close intake; no waitlist initially | Founder decision required |
| Fee | Free / paid | Free first slice to avoid introducing unapproved payment policy | Founder decision required; not inherited from Membership |
| Collection | No collection / payment facts within an authorized payment scope | No collection; keep `REAL_MONEY_ENABLED = false` | Boundary preserved; business choice still requires approval |
| Absence | Record only / affects completion | Record absence; no automatic credential or penalty rule | Founder decision required |
| Make-up | Not supported / limited support | Not supported initially | Founder decision required |
| Consumer cancellation | Allowed / not allowed / policy-defined | Policy-defined cancellation without automatic refund or credit semantics | Founder decision required |
| Provider cancellation | Cancel run / reschedule / other | Explicit run cancellation or change policy before implementation | Founder decision required |
| Schedule change | Flexible / restricted | Restricted, provider-attributable change with explicit participant outcome | Founder decision required |
| Completion | End time / all sessions / attendance threshold / provider confirmation | Run ends after final planned session; provider confirmation for participant completion, with attendance retained as separate facts | Founder decision required |

The table deliberately does not decide transferability, refunds, penalties, auto-renewal, waitlist priority, certificates, grades, credits, or rights. Those would require explicit commercial approval.

## 10. Proposed first-slice scope after approval

### In scope

- One provider and one short-cycle offline Program run.
- Published Program supply with a concrete schedule and capacity.
- Consumer enrollment/application and provider approval.
- Confirmed participant list with capacity enforcement.
- Planned sessions and provider-observed session delivery.
- Per-session participation and absence facts.
- Bounded run completion and an explicitly chosen participant outcome rule.
- Admin Program scenario status with server-side authorization, persistence, audit, and safe pause semantics.
- Traceability from Offering to Run, Enrollment, Session, Participation, and Completion facts.
- Regression protection for accepted Service and Membership paths.

### Out of scope

- Generic LMS, course marketplace, video conferencing, streaming, or recording platform.
- Certificates, academic credits, grading, exams, scores, ranks, badges, or credential issuance.
- Membership benefits, automatic renewal, points, tiers, or Right Grants.
- Automatic payment, refund, settlement, revenue sharing, real-money collection, or financial activation.
- Waitlists, transfers, make-up sessions, complex cancellation compensation, or multi-provider allocation unless separately approved.
- Goods inventory/logistics, Project workflow, or Right implementation.
- A universal six-scenario lifecycle or a new global architecture.

## 11. Proposed acceptance boundary for a later implementation task

Program should not be marked integrated merely because Admin displays a Program row or because a generic switch can be changed. A later implementation task should demonstrate, at minimum:

1. Program is represented as an independent supply domain and is not encoded as Membership or Right.
2. A provider can create and publish a concrete, bounded Program run with planned sessions and a capacity.
3. A consumer can submit an enrollment/application for that run and the provider can make the authorized decision.
4. Capacity and duplicate enrollment behavior are enforced by the server.
5. Each planned session can be recorded as held/cancelled/changed, with participant-level participation or absence facts.
6. The run and participant outcome follow the Founder-approved completion rule.
7. Admin can pause new Program intake through the Operations Human boundary; pause does not silently cancel confirmed enrollment or rewrite historical facts.
8. All relevant actions have persistence, authorization, correlation, and audit evidence.
9. Service and Membership existing behavior remains intact.
10. Goods, Project, and Right remain unavailable until separately integrated.

## 12. Open questions and evidence limits

### Questions requiring Founder decision

- Is the first Program explicitly offline, or should virtual delivery be first?
- Is a multi-session run mandatory, and what is the acceptable short-cycle duration?
- Is provider approval required, and what participant information may be used for that decision?
- What capacity rule applies, and is a waitlist excluded from the first slice?
- Is the first Program free, or is a separately authorized payment/collection path required?
- What happens when a participant cancels, is absent, or requests a make-up?
- What happens when the provider cancels or changes a scheduled session?
- Is participant completion provider-confirmed, attendance-based, or only a run-level closure?

### Evidence limits

- The repository inspection found no Program-specific Offering, Run, Enrollment, attendance, scheduled-session, completion, or Program Operations implementation in the targeted application, adapter, contract, database, and execution materials.
- Existing Service and Membership patterns demonstrate reusable engineering mechanisms, not an already-complete Program capability.
- No runtime, API, database, migration, browser, or external-service verification was performed or authorized for Program.
- This package is not a global architecture study and does not resolve the open conceptual questions preserved by Baseline 41.

## 13. Control status

```text
PROGRAM STRATEGIC POSITION       = FOUNDER APPROVED AS THIRD SCENARIO
PROGRAM FIRST BUSINESS SLICE     = PROPOSED — AWAITING FOUNDER DECISION
RECOMMENDATION                   = OFFLINE, SHORT-CYCLE, CAPPED, MULTI-SESSION, SINGLE-PROVIDER COHORT
PROGRAM OPERATIONAL INTEGRATION  = NOT INTEGRATED
SERVICE                          = FIRST OPERATIONAL SLICE INTEGRATED
MEMBERSHIP                       = SECOND OPERATIONAL SLICE INTEGRATED / ACCEPTED
GOODS / PROJECT / RIGHT          = NOT INTEGRATED
CODE / API / SCHEMA / MIGRATION  = NONE
PRODUCTION / PILOT               = NOT AUTHORIZED
REAL_MONEY_ENABLED               = false
FOUNDER DECISION CREATED HERE    = NO
```

This package is complete for Main Controller review. Program implementation must not begin until the Founder decision on the first business slice and its material commercial rules is recorded separately.
