# 50 — Creator Commerce Vertical Expansion Strategy

> **Status**: Decision Preparation — Founder Decision Required
> **Decision Date**: 2026-08-17
> **Scope**: Vertical strategy and product-architecture research only
> **Does not authorize**: a new Commerce Pattern, Product Object, API, Money Domain change,
> Provider integration, Marketplace, Calendar product, Ticketing product or Vertical build

## 1. Executive Summary

### 1.1 Current fact base

The current repository has one implemented deep vertical slice:

```text
Dancer Private Lesson
→ Request Commerce
→ Paid Service
```

It has exercised Creator Identity, Service Offering, Availability description, Customer Request,
Creator Confirm / Decline, Order, simulated Payment, simulated Settlement, Earnings Ledger, Wallet,
Withdrawal and Operations. Its implementation contract remains **one Service Offering / one Request /
one Creator confirmation / one full Payment / one Fulfillment / one Settlement / one Withdrawal**.
`Request Commerce` is the only currently implemented Commerce Pattern.

Evidence:

- `docs/09_Engineering_Governance/35_VS02_Paid_Service_PRD.md`
- `docs/09_Engineering_Governance/34_Commerce_Pattern_Settlement_and_Wallet_Model.md`
- `docs/08_Execution/21_Prototype_Execution.md`

The repository's earlier market taxonomy recognized Event, Experience, Service, Performance, Content,
Merchandise and Membership, and earlier research ranked Dancer, Cosplayer and Photographer highly.
Those documents are useful source hypotheses, not evidence that their patterns are implemented.

Evidence:

- `docs/02_Market/04_Creator_Commerce_Taxonomy.md`
- `docs/02_Market/05_Creator_Vertical_Taxonomy.md`
- `docs/02_Market/07_Creator_Commerce_Opportunity_Matrix.md`

### 1.2 Strategy conclusion

The next phase should not select a second “private lesson” vertical merely because it is easy. It
should select a small sequence of **commercial scenarios** that successively prove whether the
existing Commerce + Money Infrastructure can support distinct pattern semantics:

1. **Cosplayer Convention Appearance Request** — same `Request Commerce`, new Creator Identity and
   distribution/Upcoming pressure test.
2. **Photographer Session Reservation** — first candidate for a new `Reservation Commerce` pattern,
   introducing creator-controlled time-slot/capacity semantics without becoming a studio CRM.
3. **Dance Troupe / Independent Singer Commercial Appearance Contract** — first candidate for a new
   `Contract Commerce` pattern, testing B2B inquiry-to-accepted-delivery semantics without becoming
   an entertainment agency.

This sequence is intentionally asymmetric:

- Slice 1 primarily proves **Creator Commerce Identity** and reconnects to the original
  Anime / Convention observation while maximizing reuse.
- Slice 2 primarily proves a **new Commerce Pattern** with bounded inventory/availability semantics.
- Slice 3 primarily tests whether the infrastructure can carry a **commercially different B2B
  pattern** without becoming a vertical operations suite.

`Ticket Commerce`, merchandise, broad touring operations, digital-content delivery and recurring
membership remain deferred. They add high operational surface before the core cross-pattern abstraction
has been proved.

### 1.3 Decision required

This document recommends a build order but does **not** freeze any new product behavior. Founder must
approve the first vertical slice and, before any implementation, approve a `DEV-###` that specifies
the affected Objects, Pattern state machine, canonical events, permissions, fulfillment proof,
settlement trigger and acceptance boundary.

## 2. Analysis Method

### 2.1 Scenario, not industry

A “vertical” is useful only when expressed as a concrete commercial scenario:

```text
Creator
→ Audience / Customer
→ Commerce Object
→ Commerce Pattern
→ Fulfillment proof
→ Settlement trigger
→ Distribution
→ Repeat use
```

The same Creator may use several patterns. For example, an independent singer can sell a commercial
appearance through Contract Commerce, a meet-and-greet through Reservation Commerce and a tour ticket
through Ticket Commerce. These must not be forced into one universal order flow.

### 2.2 Pattern definitions used in this research

| Pattern              | Commercial meaning                                                                    | Current implementation state            |
| -------------------- | ------------------------------------------------------------------------------------- | --------------------------------------- |
| Request Commerce     | Customer requests a Creator-defined Service; Creator accepts or declines before Order | Implemented for the Paid Service slice  |
| Reservation Commerce | Customer reserves a Creator-controlled scarce time/slot/capacity experience           | Architecture candidate; not implemented |
| Ticket Commerce      | Customer buys admission to a time/place/capacity Event                                | Architecture candidate; not implemented |
| Contract Commerce    | Buyer requests a commercial engagement; scope/quote/acceptance govern delivery        | Architecture candidate; not implemented |
| Instant Commerce     | Customer purchases an immediately deliverable item/content                            | Architecture candidate; not implemented |

The Pattern vocabulary and candidate Settlement triggers come from the frozen architecture model.
The fact that a trigger is described there does not authorize its implementation.

Evidence: `docs/09_Engineering_Governance/34_Commerce_Pattern_Settlement_and_Wallet_Model.md`.

### 2.3 Scoring model

Each candidate has a 100-point score:

| Dimension               | Weight | Meaning                                                                    |
| ----------------------- | -----: | -------------------------------------------------------------------------- |
| Demand                  |     20 | Strength and clarity of Creator commercial need                            |
| Commerce Diversity      |     20 | Ability to expose non-duplicate Commerce semantics                         |
| Product Reuse           |     20 | Reuse of Identity / Offering / Availability / Order / Money infrastructure |
| Strategic Fit           |     20 | Fit with Personal Commerce Infrastructure rather than a vertical tool      |
| GTM / Pilot Feasibility |     20 | Feasibility of recruiting initial Creators and Creator-owned distribution  |

**Architecture Leverage** is deliberately outside the 100-point score:

- **High**: validates a missing layer or forces clean separation of Pattern-specific semantics from
  shared Commerce + Money Infrastructure.
- **Medium**: cross-vertical evidence, but primarily reuses the existing pattern.
- **Low**: adds commerce surface without materially proving the shared abstraction.

Scores are strategic inferences from repository taxonomy and architecture documents. They are not
market-size claims, transaction evidence or a commitment to build.

## 3. Candidate Universe

|   # | Scenario                                | Creator                             | Customer                               | Commerce Object                                      | Pattern               | Fulfillment                                   | Settlement candidate       | Distribution                                        | Repeat reason                   |
| --: | --------------------------------------- | ----------------------------------- | -------------------------------------- | ---------------------------------------------------- | --------------------- | --------------------------------------------- | -------------------------- | --------------------------------------------------- | ------------------------------- |
|   1 | Dancer private lesson                   | Dancer / dance teacher              | Learner                                | Private lesson service                               | Request               | Lesson delivered                              | Paid + fulfillment         | Douyin, Xiaohongshu, WeChat                         | Ongoing lessons                 |
|   2 | Photographer portrait session           | Photographer                        | Individual client                      | Session/time slot                                    | Reservation           | Session delivered and assets policy satisfied | Attendance/delivery policy | Portfolio, Xiaohongshu, referrals                   | Repeat shoots / referrals       |
|   3 | Cosplayer convention appearance inquiry | Cosplayer                           | Convention organizer, brand, fan group | Appearance / collaboration offer                     | Request               | Appearance completed                          | Paid + appearance proof    | Convention schedule, Weibo, Xiaohongshu, fan groups | Each event/city                 |
|   4 | Cosplayer fan experience slot           | Cosplayer                           | Fan                                    | Meet, photo, signing or guided convention experience | Reservation           | Attendance / experience completed             | Attendance policy          | Convention schedule and social channels             | Scarce fan experiences          |
|   5 | Makeup / styling appointment            | Makeup artist / stylist             | Consumer, performer, brand             | Appointment service                                  | Reservation           | Service completed                             | Completion policy          | Portfolio, local social channels                    | Repeat personal/production work |
|   6 | Dance troupe commercial performance     | Dance troupe / lead Creator         | Brand, venue, organizer                | Performance engagement                               | Contract              | Contracted performance accepted               | Milestone/final acceptance | Showreel, organizer referrals                       | Repeat campaigns/events         |
|   7 | Independent singer commercial Live      | Singer / musician                   | Brand, venue, organizer                | Commercial appearance                                | Contract              | Performance accepted                          | Milestone/final acceptance | Tour dates, showreel, social channels               | Repeat bookings                 |
|   8 | Tour stop / small Live admission        | Singer, troupe, convention Creator  | Fan / audience                         | Event admission                                      | Ticket                | Check-in or Event completed                   | Check-in/Event policy      | Tour schedule, fan channels                         | Tour series / recurring shows   |
|   9 | Creator workshop / open class           | Dancer, photographer, coach         | Learner / fan                          | Group class capacity                                 | Reservation or Ticket | Attendance/completion                         | Attendance policy          | Creator identity, communities                       | Series / repeat cohorts         |
|  10 | Coach / teaching session                | Coach, tutor, creator educator      | Learner                                | 1:1 guidance session                                 | Reservation           | Session delivered                             | Completion policy          | Content channels, referrals                         | Repeated learning               |
|  11 | Digital custom commission               | Illustrator, musician, photographer | Fan / client                           | Commissioned digital deliverable                     | Contract or Instant   | Accepted delivery/access                      | Delivery acceptance policy | Portfolio, social channels                          | Repeat commissions              |
|  12 | Limited merchandise drop                | Creator brand                       | Fan                                    | SKU / limited item                                   | Instant               | Shipment/receipt or digital access            | Delivery/receipt policy    | Fan channels, convention pages                      | Collecting / repeat drops       |

## 4. Vertical × Commerce Pattern Matrix

Legend: **Primary** = natural principal pattern; **Possible** = valid secondary scenario;
**External only** = platform may link/distribute but should not operate the transaction in the next
phase; **No** = not a sensible first use.

| Vertical / scenario                 | Request     | Reservation | Ticket        | Contract    | Instant     | New Pattern?                                 |
| ----------------------------------- | ----------- | ----------- | ------------- | ----------- | ----------- | -------------------------------------------- |
| Dancer private lesson               | **Primary** | Possible    | No            | No          | No          | No; current reference                        |
| Photographer portrait session       | Possible    | **Primary** | No            | Possible    | No          | **Reservation**                              |
| Cosplayer convention appearance     | **Primary** | Possible    | External only | Possible    | No          | No for first slice; Schedule projection only |
| Cosplayer fan experience            | Possible    | **Primary** | Possible      | No          | No          | **Reservation**                              |
| Makeup / styling appointment        | Possible    | **Primary** | No            | Possible    | No          | **Reservation**                              |
| Dance troupe commercial performance | Possible    | No          | No            | **Primary** | No          | **Contract**                                 |
| Independent singer commercial Live  | Possible    | No          | Possible      | **Primary** | Possible    | **Contract**                                 |
| Tour / small Live admission         | No          | Possible    | **Primary**   | No          | No          | **Ticket**                                   |
| Creator workshop / open class       | Possible    | **Primary** | Possible      | No          | No          | Reservation first; Ticket only later         |
| Coach / teaching session            | Possible    | **Primary** | No            | Possible    | No          | Reservation                                  |
| Digital custom commission           | Possible    | No          | No            | **Primary** | Possible    | Contract / delivery semantics                |
| Limited merchandise drop            | No          | No          | No            | No          | **Primary** | Instant / SKU / fulfillment semantics        |

### 4.1 Current Pattern sufficiency

| Candidate                               | Is current Request Commerce sufficient?                         | What would be needed beyond the current slice?                                                | New object/state/settlement model?                                                                          |
| --------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Cosplayer convention appearance inquiry | Yes, for an organizer/fan-group request that a Creator confirms | Creator-facing Upcoming schedule as a projection; no generic Calendar object                  | No new Pattern for the first slice; existing fulfillment wording may need a vertical-specific specification |
| Photographer session reservation        | No                                                              | Slot/capacity, reservation hold/confirm/cancel semantics                                      | Founder decision required on Reservation Object/state/events; Settlement may use attendance/delivery policy |
| Cosplayer fan experience                | No                                                              | Same bounded Reservation semantics plus safety/participation rules                            | Reservation decision; no new Money model assumed                                                            |
| Makeup/styling                          | No                                                              | Reservation and reschedule/cancellation rules                                                 | Reservation decision; high vertical-SaaS risk                                                               |
| Dance troupe / singer engagement        | Not safely                                                      | Quote/scope/acceptance/milestone semantics                                                    | Contract Object/state/event decision; settlement candidate depends on acceptance                            |
| Ticketed event/tour                     | No                                                              | Event capacity, admission, check-in, cancellation/refund and possibly external organizer role | Ticket Pattern plus Event/Admission semantics; do not start now                                             |
| Digital commission                      | Not safely                                                      | Delivery/access/acceptance semantics                                                          | Contract or Instant decision; content-delivery model                                                        |
| Merchandise                             | No                                                              | SKU, stock, shipping/receipt/returns                                                          | Instant Pattern and logistics objects; do not start now                                                     |

## 5. 100-Point Opportunity Matrix

| Rank | Scenario                                     | Demand | Diversity | Reuse | Strategic Fit | GTM / Pilot |  Total | Architecture Leverage | Verticalization Risk | Tier             |
| ---: | -------------------------------------------- | -----: | --------: | ----: | ------------: | ----------: | -----: | --------------------- | -------------------- | ---------------- |
|    1 | Cosplayer convention appearance inquiry      |     17 |        19 |    19 |            20 |          17 | **92** | Medium                | Medium               | Tier 1           |
|    2 | Photographer portrait-session reservation    |     17 |        18 |    18 |            18 |          17 | **88** | High                  | Low–Medium           | Tier 1           |
|    3 | Cosplayer fan-experience reservation         |     16 |        20 |    15 |            20 |          15 | **86** | High                  | Medium               | Tier 1           |
|    4 | Dance troupe commercial performance contract |     15 |        20 |    14 |            20 |          13 | **82** | High                  | Medium–High          | Tier 1           |
|    5 | Independent singer commercial Live contract  |     15 |        19 |    14 |            19 |          13 | **80** | High                  | Medium–High          | Tier 2           |
|    6 | Creator workshop / open class                |     16 |        18 |    15 |            17 |          13 | **79** | Medium                | Medium               | Tier 2           |
|    7 | Makeup / styling appointment                 |     18 |        14 |    17 |            13 |          17 | **79** | Medium                | High                 | Tier 2           |
|    8 | Coach / teaching reservation                 |     17 |        13 |    18 |            14 |          17 | **79** | Medium                | High                 | Tier 2           |
|    9 | Dancer private lesson (reference baseline)   |     18 |        10 |    20 |            18 |          18 | **84** | Low                   | Low                  | Current baseline |
|   10 | Tour / small Live admission                  |     16 |        20 |    10 |            20 |           9 | **75** | High                  | High                 | Deferred         |
|   11 | Digital custom commission                    |     15 |        16 |    12 |            16 |          15 | **74** | Medium                | Medium               | Deferred         |
|   12 | Limited merchandise drop                     |     14 |        15 |     8 |            14 |          15 | **66** | Low                   | High                 | Deferred         |

### 5.1 How to read the rankings

- The **current Dancer private-lesson slice** is intentionally retained as a benchmark, not selected
  as the next expansion. Its high reuse score shows that an easy second service vertical would add
  little architecture leverage.
- **Cosplayer convention appearance inquiry** scores highest because it is the smallest credible way
  to test the original Creator Identity + public schedule + creator-owned distribution thesis while
  retaining the implemented Request pattern.
- **Photographer reservation** is the preferred first new pattern because it adds scarce-time
  semantics without Ticketing's venue, admission and organizer complexity.
- **Dance troupe performance contract** is high leverage but should follow Reservation evidence; it
  must not silently become an agency CRM or a generic quoting system.
- High demand alone is insufficient. Makeup and coaching score well commercially but carry a high
  risk of turning the product into a booking/clinic/course SaaS.

## 6. Verticalization Risk

| Scenario                                | Risk        | Why it can pull the product into a vertical SaaS                                                             | Guardrail                                                                                                         |
| --------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Cosplayer convention appearance inquiry | Medium      | Convention-specific scheduling, organizer coordination and fan operations can expand quickly                 | Keep first slice to Creator Identity + Upcoming projection + Request; no convention directory or event operations |
| Photographer reservation                | Low–Medium  | Can grow into studio calendars, client galleries and production CRM                                          | Support only pattern-level slot/attendance semantics; no studio workflow suite                                    |
| Cosplayer fan experience                | Medium      | Safety, queuing, venue coordination and fan management can become event operations                           | Limit to Creator-owned bounded experience; no venue/admission system                                              |
| Dance troupe / singer contract          | Medium–High | Quote tracking, riders, staffing, travel and contract management resemble agency software                    | Bound to one engagement lifecycle; no deal pipeline, roster or tour management                                    |
| Workshop / open class                   | Medium      | Cohorts, curriculum, attendance and communities can become course SaaS                                       | Do not build curriculum/LMS/membership                                                                            |
| Makeup / styling                        | High        | Appointment grids, staff, chair/room management and client records become salon SaaS                         | Avoid staff, location, repeat-client CRM and inventory                                                            |
| Coach / teaching                        | High        | Course plans, homework, recurring subscriptions and student management become education SaaS                 | Avoid LMS, packages and subscription                                                                              |
| Tour / Ticket                           | High        | Seating, venue capacity, organizer settlement, scanning and multi-channel ticketing become an event platform | Keep Ticket Commerce deferred; permit only external-ticket links as a future distribution projection              |
| Digital commission                      | Medium      | Revision workflow, asset storage and licensing become creator-work management                                | Do not add file review, licensing or asset delivery until a Contract decision                                     |
| Merchandise                             | High        | SKU, fulfillment, returns, warehouse and tax become commerce operations                                      | Keep deferred until Instant Commerce is strategically justified                                                   |

## 7. Anime / Cosplay / Convention / Touring Deep Dive

### 7.1 Why this is a pressure-test vertical

Anime / Cosplay / Convention / Touring is closer than dance private lessons to the Founder’s original
observation because a single Creator naturally crosses multiple commercial situations:

```text
Creator Identity
→ Upcoming Schedule
→ Appearance
→ Fan Experience
→ Commercial Booking
→ External Event / Ticket Link
→ Merchandise (later)
→ shared Settlement / Earnings / Wallet infrastructure
```

It can prove whether a Creator’s public commercial identity is useful across fan, organizer and
brand audiences. It must not be interpreted as permission to build a convention platform.

### 7.2 The true position of Calendar

**Decision preparation conclusion:** Calendar is not a universal Commerce Object and should not be
the next product primitive.

Depending on scenario, a date/time can be:

| Situation                                    | Correct role of schedule data                                                | What it is not                                                     |
| -------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Public convention appearance                 | Distribution surface / public Upcoming projection                            | Inventory by itself                                                |
| Creator opens a limited meet-and-greet slot  | Availability and capacity input to Reservation Commerce                      | A standalone event platform                                        |
| Brand requests a specific appearance date    | Constraint in a Request or Contract negotiation                              | A generic calendar product                                         |
| Tour performance sold by an organizer        | Event context, possibly an external ticket destination                       | Platform-owned Ticket inventory before Ticket Commerce is approved |
| Creator publishes “I am in Shanghai on 8/20” | Identity/distribution context that can route to an Offering or external link | Proof of a commercial transaction                                  |

The future implementation should therefore model only the pattern-specific fact necessary for an
approved slice. A shared “Upcoming” screen may be a UX projection composed from those facts, not a
new authoritative Calendar aggregate.

### 7.3 Example A — Cosplayer itinerary

```text
8/20 Shanghai convention
8/27 Hangzhou convention
9/05 Beijing activity
```

| Possible conversion                      | Pattern              | Platform responsibility in a future slice                                             | Explicitly not for the first slice                         |
| ---------------------------------------- | -------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Organizer asks for an appearance         | Request Commerce     | Creator Identity, appearance Offering, request, confirmation and fulfillment evidence | Convention organizer CRM, roster matching                  |
| Fan reserves a photo/signing slot        | Reservation Commerce | Creator-owned scarce slot, attendance/experience completion                           | Queue system, venue access and large-scale admission       |
| Fan buys convention admission            | Ticket Commerce      | At most an external ticket link before a Ticket decision                              | Ticket issuance, scanning, seating or organizer settlement |
| Fan buys a limited item                  | Instant Commerce     | Deferred                                                                              | SKU, stock, shipping and returns                           |
| Fan books a guided convention experience | Reservation Commerce | Future bounded Experience after safety rules are approved                             | Marketplace-style discovery and group operations           |

### 7.4 Example B — dance troupe itinerary

```text
8/23 Commercial performance
8/30 Guangzhou tour
9/12 Fan meet-up
```

| Itinerary item         | Correct pattern                        | Explanation                                                                                                                 |
| ---------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Commercial performance | Contract Commerce                      | A business buyer needs scope, date, price and delivery acceptance; this is not Ticketing                                    |
| Guangzhou tour         | Ticket Commerce or external Event link | Admission is a fan-facing Event transaction; initially platform may only present the date and external purchase destination |
| Fan meet-up            | Reservation or Ticket Commerce         | Reservation if bounded Creator interaction/slots; Ticket if general admission/capacity dominates                            |

### 7.5 Example C — independent singer

| Scenario                    | Correct abstraction                | Shared layer                                                | Pattern-specific layer                           |
| --------------------------- | ---------------------------------- | ----------------------------------------------------------- | ------------------------------------------------ |
| Tour / Live                 | Event admission                    | Identity, Offering relation, Order/Money architecture later | Event, capacity, check-in, ticket/refund policy  |
| Brand commercial appearance | Performance engagement             | Identity, Order/Money architecture later                    | Scope, quote, acceptance and contract milestones |
| Meet & Greet                | Scarce fan experience              | Identity and Money architecture later                       | Time slot/capacity, attendance and safety        |
| Music content               | Digital content item or commission | Identity and Money architecture later                       | Access/delivery/licensing policy                 |

### 7.6 Infrastructure boundary

Creator Commerce Infrastructure should own:

- a Creator commercial identity;
- pattern-specific Offering entry points;
- creator-owned public distribution;
- pattern-approved commercial actions;
- immutable Order / Payment / Settlement / Ledger / Wallet infrastructure once a pattern is approved;
- origin, evidence and audit separation.

It should **not** become:

- a convention directory;
- an event organizer operating system;
- a ticketing exchange;
- a tour-routing or artist-management suite;
- a fan CRM;
- a merchandise warehouse;
- a marketplace that matches every fan, organizer and Creator.

## 8. Tier Decisions

### 8.1 Tier 1 — recommended slices

#### Vertical Slice #1 — Cosplayer Convention Appearance Request

```text
Cosplayer
→ public commercial identity + Upcoming projection
→ appearance / collaboration Offering
→ organizer or fan-group Request
→ Creator Confirm / Decline
→ existing Request Commerce lifecycle
```

- **Why first:** Closest to the original Anime / Convention / Touring observation; tests whether the
  commerce identity is understandable across non-lesson audiences; requires the least Pattern change.
- **What it adds:** A cross-vertical Offering vocabulary and an Upcoming-as-projection decision.
- **What it reuses:** Identity, public Offering, Request, confirmation, Order, fulfillment, Money
  infrastructure and Operations.
- **What it proves:** Creator Commerce Identity and distribution can be broader than a service-booking
  page without creating a Calendar or Event platform.
- **Founder decision needed:** Whether the initial requester is a convention organizer/brand, a fan
  group, or both; and the smallest approved appearance fulfillment evidence.

#### Vertical Slice #2 — Photographer Session Reservation

```text
Photographer
→ session Offering
→ creator-controlled time/capacity
→ Customer Reservation
→ fulfillment / delivery policy
→ shared Money infrastructure
```

- **Why second:** The cleanest first proof of `Reservation Commerce`; it introduces scarcity and
  availability semantics while avoiding Ticketing, seats, venue admission and event organizer roles.
- **What it adds:** Pattern-specific Reservation lifecycle, slot/capacity policy and attendance or
  delivery completion semantics.
- **What it reuses:** Creator Identity, Offering, public distribution, Order, Payment, Settlement,
  Earnings Ledger, Wallet, Withdrawal and Operations architecture.
- **What it proves:** Availability is not merely text; it can become controlled inventory without
  turning the platform into a studio CRM.
- **Founder decision needed:** Reservation hold/expiry, cancellation/reschedule, fulfillment proof,
  whether delivery is in scope, and settlement trigger.

#### Vertical Slice #3 — Dance Troupe / Independent Singer Commercial Appearance Contract

```text
Troupe or singer
→ commercial performance Offering
→ buyer inquiry
→ scope / quote / acceptance
→ contracted fulfillment
→ shared Money infrastructure
```

- **Why third:** It validates the commercially distinct B2B performance case that the original
  touring observation implies, rather than copying consumer lesson booking.
- **What it adds:** A bounded `Contract Commerce` lifecycle with scope/acceptance semantics.
- **What it reuses:** Creator Identity, Offering, evidence, Order/Money architecture and Operations.
- **What it proves:** The infrastructure can carry a performance engagement without becoming an
  entertainment agency or generic CRM.
- **Founder decision needed:** Quote versus fixed-price policy, contract acceptance model,
  milestone/final fulfillment, cancellation and settlement release.

### 8.2 Tier 2 — valuable, but wait

| Scenario                             | Why deferred after Tier 1                                                                                       |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Cosplayer fan-experience reservation | Strong pressure test, but should reuse a proven Reservation lifecycle before adding fan safety/venue rules      |
| Creator workshop / open class        | Valuable capacity test, but Ticket-versus-Reservation must be explicitly decided and course/event scope guarded |
| Independent singer commercial Live   | Same Contract family as Slice #3; use as cross-vertical follow-on rather than duplicate first contract build    |
| Makeup / styling appointment         | Commercially attractive but high risk of salon scheduling and client CRM expansion                              |
| Coach / teaching reservation         | Reuses Reservation, but risks LMS, packages and subscription scope                                              |
| Digital custom commission            | Requires delivery/revision/licensing policy not necessary to prove the first three patterns                     |

### 8.3 Deferred — do not enter now

| Scenario                     | Why deferred                                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Tour / Live Ticket Commerce  | Requires Event, admission, capacity, check-in, refund and organizer-role decisions; high event-platform risk  |
| General convention ticketing | Same Ticketing complexity plus organizer and venue operations                                                 |
| Merchandise                  | Requires SKU, inventory, shipping, receipt, returns and tax/logistics boundaries                              |
| Digital content downloads    | Requires access control, delivery and rights semantics; lower architecture leverage than Reservation/Contract |
| Membership / subscription    | Requires recurring billing, benefit periods and ongoing entitlement model                                     |
| Marketplace / discovery      | Contradicts Creator-owned distribution and would introduce ranking, matching and platform operations          |

## 9. Recommended Build Order

### Stage 0 — decision package only

Before code, Founder selects the first slice and approves:

1. the intended buyer;
2. the Pattern;
3. the narrow Offering definition;
4. pattern-specific fulfillment evidence;
5. cancellation/refund and settlement trigger policy;
6. the explicit non-goals preventing vertical SaaS expansion.

### Stage 1 — Cosplayer Convention Appearance Request

Use the existing Pattern as a cross-vertical migration test. Do not introduce Ticketing, a Calendar
aggregate, event inventory, fan CRM or marketplace discovery.

### Stage 2 — Photographer Session Reservation

Only after the Reservation semantics are approved in a dedicated `DEV-###`. This is the first
recommended new Pattern build.

### Stage 3 — Commercial Appearance Contract

Only after Reservation evidence and a separately approved Contract decision. Keep scope to one
Creator-led engagement lifecycle; do not create agency, tour, roster or quote-pipeline functions.

## 10. Revisit Triggers

| Deferred area    | Revisit only when                                                                                               |
| ---------------- | --------------------------------------------------------------------------------------------------------------- |
| Ticket Commerce  | Founder approves Event/Admission state, organizer role, capacity/check-in, refund policy and settlement trigger |
| Merchandise      | A Creator cohort demonstrates repeated demand and Founder approves SKU/logistics/returns boundaries             |
| Digital content  | Founder approves delivery/access/licensing and evidence model                                                   |
| Membership       | A repeated-benefit cohort is evidenced and recurring billing/entitlement policy is approved                     |
| Marketplace      | Creator-owned distribution is demonstrably insufficient and Founder approves matching/ranking/operations scope  |
| Pilot deployment | Founder resumes External Pilot deployment with the separate VS-02K-EXT package and real infrastructure inputs   |

## 11. Final Recommendation

**当前 PersonalCommerceInfrastructure 下一阶段最应该实现的 3 个 Vertical Slice 是：
Cosplayer Convention Appearance Request、Photographer Session Reservation、Dance Troupe /
Independent Singer Commercial Appearance Contract；原因分别是：前者以最小模式变化验证
Creator Commerce Identity 与最初 Anime / Convention / Touring 场景，中者最能验证新的
Reservation Commerce Pattern，后者最能验证跨 B2B 表演邀约的 Contract Commerce 抽象。**

**Founder Decision Required:** Select Slice #1 and approve its `DEV-###` scope before any Vertical
Build begins.
