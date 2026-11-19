# PCI-PD-008 - Goods Fourth Operational Scenario Decision Package

> **Status**: PROPOSED - AWAITING FOUNDER DECISION
>
> **Task state**: COMPLETED - AWAITING MAIN CONTROLLER ACCEPTANCE
>
> **Scope**: bounded product and commerce-pattern research only. This document does not create a Founder Decision, product contract, API, database schema, migration, architecture, implementation, Pilot, production authorization, or real-money authorization.

## 1. Decision boundary and research result

### 1.1 Existing Founder direction

The Founder-approved direction is preserved:

- PCI remains a unified transaction infrastructure for Service, Goods, Program, Membership, Project, and Right.
- Goods is the fourth operational scenario to be considered, not a replacement for Service, Membership, or Program.
- The product direction is Personal Goods Commerce: an ordinary person should be able to publish a product with very low operating complexity, let another person understand and buy it, accept the transaction, and arrange delivery directly.
- Goods must not become a traditional multi-merchant e-commerce platform by default.
- The scenario sequence decision prefers virtual and offline forms before online or longer-cycle delivery forms. This package applies that principle to a small, offline-capable goods transaction.

These directions come from the task authorization and the existing Commercial Scenario Sequencing Founder Decision. They are not re-decided here.

### 1.2 Main Controller recommendation

The recommended first Goods slice is:

> **Seller-confirmed, single-offering, single-unit, made-to-order personal goods.**
>
> A consumer opens a shareable Goods Offering page, submits one purchase request with a price snapshot and minimal delivery coordination information, and waits for the individual seller to accept or decline. Acceptance forms the Goods transaction commitment. The seller prepares or provides the item and records a seller-managed delivery fact. PCI does not count inventory, reserve stock, operate a warehouse, run logistics, or execute payment.

This recommendation adds one seller decision after the buyer action, but it avoids pretending that an individual seller can accept unlimited orders. It is simpler than inventory management and more trustworthy than an always-open direct order. It also keeps the first slice small enough for offline or seller-arranged delivery.

This is a recommendation only. Founder approval is still required for the material commercial rules listed in Section 13.

### 1.3 Current status boundary

| Scenario | Status at the code baseline | Effect of this package |
| --- | --- | --- |
| Service | First operational slice integrated | Preserve the VS-01 contract and implementation. |
| Membership | Second operational slice integrated and accepted | Preserve the accepted free fixed-term offline Membership slice. |
| Program | Implementation present in the current baseline | Preserve its independent Offering, Run, Enrollment, Session, Participation, and Completion semantics. |
| Goods | NOT INTEGRATED | Research and proposed first-slice rules only. |
| Project | NOT INTEGRATED | No change. |
| Right | NOT INTEGRATED | No change. Goods is not a Right Grant. |

The Operations implementation enumerates all six scenarios but only grants integrated behavior to Service, Membership, and Program when their explicit integration flags are enabled. Other scenarios remain not_integrated and cannot be opened through the server-side change path (applications/operations-admin/scenario-operations.ts:6-14, :38-115). This package does not change that behavior.

## 2. Authority preserved

This package reads and preserves the following authority:

- Conceptual Baseline 41, including F01-F04 and D01-D12;
- Commercial Scenario Sequencing;
- Membership First Slice Founder Decision and Product Contract;
- Program First Slice Founder Decision and Execution Rules Founder Decision;
- the existing VS-01 contract in 20 - MVP PRD VS-01;
- the existing product direction and product definition documents.

Baseline 41 defines Product as broad commercial product language rather than a synonym for Goods, keeps the six supply domains professionally distinct, and separates Order, Commitment, Fulfillment, and Payment. It does not authorize a universal order, universal lifecycle, universal state machine, or implementation architecture (Baseline 41, lines 50, 90, 106-117).

The existing Service contract remains an independent contract. It continues to use Service Offering / Request, Creator Confirm / Decline, and its separate Fulfillment Code confirmation. Goods must not be created by renaming the Service Offering or by treating a Goods Order as a Service Request (docs/07_Product_Architecture/20_MVP_PRD_VS01.md:703-739, :795-813).

## 3. Goods domain boundary

### 3.1 Goods is a supply domain, not a platform feature label

Goods means a personal product supply domain in which an individual offers a product for another person to acquire. The term does not establish a global Product entity, a stock ledger, a marketplace, or a payment platform.

Product remains the broader product-language concept. A Goods Offering can describe a physical product, but the existence of a product page does not narrow every PCI Product to a physical good, and it does not turn every Product into Goods.

A Goods implementation must have its own domain expression. It may use shared identity, public distribution, correlation, authorization, and traceability mechanisms, but it must not inherit Service-only capability gates, Service Request names, Membership relationship semantics, or Program enrollment semantics merely to reduce code changes.

### 3.2 Required semantic separation

| Semantic | Proposed first-slice meaning | Must not be treated as |
| --- | --- | --- |
| Goods Offering | A personal seller's published, identifiable supply of one made-to-order product. | A Service Offering renamed to Goods. |
| Product Information | The minimum description a buyer needs to understand what is offered, the price, and how the seller will provide it. | A full catalog, SKU, variant, or inventory record. |
| Goods Order | A buyer's transaction record for one Goods Offering, including the accepted price snapshot and buyer-provided coordination information. | A Payment fact or a delivery fact. |
| Order Acceptance | The seller's explicit decision to accept or decline the submitted order. | Automatic payment, delivery, or a global acceptance state. |
| Commitment | The Goods-specific responsibility to provide the accepted item under the accepted terms. | Membership, Enrollment, Right Grant, or Service Fulfillment. |
| Goods Fulfillment | The seller's process and fact of preparing/providing the item through a seller-arranged method. | Order acceptance or Payment. |
| Delivery Confirmation | A fact that the item was handed over or otherwise received according to the selected first-slice rule. | A logistics tracking record or a payment confirmation. |
| Payment | A separate financial fact recording a payment event if and when an authorized payment path exists. | The displayed price, an accepted order, or an offline conversation. |

The order price is a commercial condition that can be snapshotted for traceability. It is not evidence that money was collected. The seller's acceptance is a commitment decision. It is not evidence that the product was delivered. Delivery is a separate fact. This follows D05-D06 and does not select a shared database model.

### 3.3 Boundary with other domains

- Service: Service provides a capability or service activity and retains the VS-01 Request / Confirm / Fulfillment Code contract. Goods provides a product and a seller-arranged delivery fact. A Goods order must not be written as a Service Request.
- Membership: Membership is a provider-consumer relationship with validity and admission facts. Buying a good does not create a Membership Relationship.
- Program: Program is a scheduled supply with Run, Enrollment, Session, Participation, Absence, and Completion facts. Goods does not need a Run or participant attendance model.
- Right: Goods acquisition does not automatically grant a Right. If a future offering includes a license or permission, its Right semantics require a separate domain decision.
- Project: A one-off product order is not automatically a Project workflow.

## 4. Ordinary seller and buyer experience

### 4.1 Seller: minimum publish flow

The first slice should let a person publish one product without building a store.

Recommended required information:

1. Product title - short, buyer-readable name.
2. Simple description - what the item is and what the buyer receives.
3. Price and currency - the displayed commercial condition; no payment is implied.
4. Preparation/provision description - a short statement of how the seller will prepare or provide the item.
5. Expected timing - a simple seller-declared preparation or handover window, not a scheduling engine.

Recommended optional information:

- One or more product images, with one optional primary image for the first slice;
- simple pickup, handover, or seller-arranged shipping note;
- a buyer coordination note, such as a preferred contact method;
- a short limitation or exception note that the seller can explain in plain language.

Not required in the first slice:

- SKU, product variants, attribute matrices, barcode, category tree, stock quantity, warehouse, replenishment rule, inventory reservation, shipping rate table, or merchant storefront configuration;
- a full seller catalog or a multi-product cart;
- a separate marketing, advertising, ranking, promotion, coupon, CRM, or ERP workflow.

The seller publishes a direct, shareable Goods Offering page. The page can later be surfaced from the seller's public commercial identity, but a marketplace home page is not required for the first buyer to find the offering.

### 4.2 Buyer: minimum purchase flow

Recommended first-slice buyer journey:

~~~text
Open direct Goods Offering link
  -> Read seller, product, price, timing, and delivery note
  -> Sign in or create a PCI account at order submission
  -> Confirm one unit and minimal delivery coordination information
  -> Submit Goods Order
  -> Wait for seller acceptance
  -> Receive accepted/declined result
  -> If accepted, coordinate seller-arranged provision
  -> Seller records delivery; buyer may confirm receipt
~~~

Anonymous visitors can view a published page. The recommended rule is that a buyer must be authenticated when creating a Goods Order, because an order, commitment, delivery fact, and dispute trace need an identified participant. This is a recommendation, not a change to the existing Service public request contract.

The first slice should not require a shopping cart. One order contains one seller and one Goods Offering. Quantity is fixed at one for the recommended slice. A buyer can submit another order later if the seller continues to offer the product; this is not a stock count or a quantity ledger.

Buyer input should be limited to information needed to coordinate the seller-arranged handover. The first slice should not require a platform-wide shipping address model, carrier selection, route planning, or delivery-rate calculation. The exact minimum buyer data requires the Founder decision in Section 13.

### 4.3 Seller handling flow

The seller receives a pending order in the Creator surface and chooses accept or decline.

- Decline before acceptance records that this order was not accepted and does not create a Goods Commitment.
- Accept records the seller's order acceptance and creates the Goods-specific commitment to provide the item under the accepted price and terms.
- Prepare/provide remains a seller responsibility. PCI records the relevant fact; it does not guarantee the item, operate logistics, or act as the seller.
- Delivery is recorded separately from acceptance. A minimal first slice can record the seller's delivery/handover fact and optionally a buyer receipt confirmation.
- Unable to provide after acceptance must be represented as an explicit exception/cancellation fact if Founder approves that rule. It must not silently rewrite the accepted order as if it never existed.

### 4.4 Pause behavior

Goods operational pause should stop new Goods Orders or new order submissions. It must not silently cancel accepted Goods Orders, remove price snapshots, erase seller acceptance, or rewrite delivery history. Resuming the Goods scenario can reopen new order intake according to the accepted rules.

This is a Goods recommendation. It must not be copied into Membership, Program, or Service without their own domain rules.

## 5. No-inventory operating modes

The absence of an inventory system does not mean that a seller can promise unlimited unavailable items. The first slice needs a small business decision that prevents false promises without importing stock management.

| Candidate | Buyer flow | Seller burden | Over-commitment control | Complexity | Assessment |
| --- | --- | --- | --- | --- | --- |
| A - Buyer submits, seller confirms | Buyer submits one order; seller accepts or declines before the commitment is formed. | One explicit decision per order. | Human seller acceptance is the supply-capacity gate. No count, reservation, or stock ledger. | Low. | **Recommended first slice.** Best balance between simple buying and honest personal supply. |
| B - Seller opens intake, buyer orders directly | Seller keeps an offering open and every buyer order immediately becomes accepted. | Lower per-order decision burden. | Seller must pause intake manually; an open offering can still receive more orders than the seller can satisfy. | Low initially, but failure handling becomes necessary quickly. | Suitable as a later optimization after real usage shows that seller confirmation is unnecessary. |
| C - One-of-one item | Buyer orders a unique item; accepted order closes the offering. | Simple for a single work, but requires a clear availability state. | A coarse available / closed or sold state prevents a second acceptance. | Low for one-off goods, but does not cover repeatable personal products. | Later bounded mode, not the first general Goods slice. |

### 5.1 Recommended mode A rules

- Do not expose quantity selection in the first slice.
- Do not store a stock number, inventory movement, reservation, replenishment, or warehouse location.
- Let a seller pause a Goods Offering when they cannot accept more orders.
- Require an explicit seller acceptance before creating the Goods Commitment.
- Preserve declined and unable-to-provide facts for traceability.
- Do not claim that seller acceptance proves Payment or delivery.
- If later evidence shows that confirmation adds no useful protection for a repeatable product, Founder can separately approve an open-intake variation.

### 5.2 One-of-one boundary

A one-of-one item may eventually need a single coarse availability state. That state answers whether the offering can receive a new order; it is not an inventory quantity, stock ledger, or reservation engine.

The first recommended slice should not require one-of-one behavior. If it is later added, the minimum safe rule is: once one order is accepted, the offering becomes unavailable for new orders, while the accepted order and all later delivery facts remain traceable.

## 6. Price, Order, Payment, and real-money boundary

### 6.1 Price expression

A published Goods Offering should display a seller-provided price and currency. When a buyer submits an order, the order should preserve a price snapshot and the terms version used for the submission. Later edits to the offering must not rewrite the historical order condition.

The first slice does not need discounting, promotion, tax calculation, shipping calculation, multi-currency conversion, split settlement, or a cart total.

### 6.2 Payment relationship

The accepted strategic and engineering boundary is:

~~~text
Displayed price != Goods Order != Order Acceptance != Commitment != Payment != Delivery Confirmation
~~~

REAL_MONEY_ENABLED = false remains in force. This package does not authorize a payment provider, checkout, collection, refund, settlement, withdrawal, or real-money Pilot.

The recommended first Goods package should therefore:

- record the price and currency as commercial terms;
- record the buyer's order submission;
- record seller acceptance or decline;
- keep Payment absent unless a separately authorized payment path later produces a real Payment fact;
- avoid calling an accepted or delivered Goods Order a paid order;
- avoid turning the first slice into a free product merely to make a test appear complete.

Whether offline buyer-seller settlement is permitted as a future commercial rule is a Founder question. If it is permitted, an offline statement still must not be fabricated as a PCI Payment fact. The product can record an explicitly described external/payment-status fact only after a separately approved rule defines its evidence and authority.

### 6.3 Why this is not a complete paid checkout

A price-bearing order without an authorized Payment path can prove that PCI records a proposed commercial condition, order acceptance, commitment, and delivery trace. It cannot prove that PCI collected money, settled funds, refunded a buyer, or completed a paid purchase.

The current paidServiceOrders and money-domain code is service-oriented and is used by local/simulation commerce paths. It demonstrates reusable money and traceability primitives, not a ready Goods payment implementation. Reusing it as if Goods payment were already integrated would overstate the current product capability.

## 7. Minimal seller-arranged delivery

### 7.1 Recommended delivery model

The seller chooses or describes one simple delivery arrangement:

- in-person handover;
- seller-arranged shipment without PCI carrier integration; or
- another seller-managed method explicitly stated on the offering.

PCI should record only the minimum facts needed for traceability:

1. the accepted order and its terms;
2. the seller's preparation/provision or handover fact, if the chosen rule requires it;
3. the seller's delivery confirmation;
4. optional buyer receipt confirmation or an unresolved delivery exception.

The first slice should not build carrier APIs, tracking numbers, route planning, shipping calculation, warehouses, delivery zones, or a complex after-sales platform.

### 7.2 Fulfillment boundary

Goods Fulfillment is a domain fact about the seller providing the accepted item. It is not the Service Fulfillment Code flow. The existing Service contract explicitly separates Creator Confirm / Decline from later Fulfillment Confirmation; that distinction is useful as a boundary, but Goods needs its own delivery semantics and must not reuse Service-only codes or state names as a hidden Goods implementation.

### 7.3 Failure and cancellation

The first slice must preserve an accepted order when delivery fails or the seller cannot provide the item. The minimum proposed behavior is an explicit exception/cancellation fact with actor, reason, time, and correlation ID. Automatic refund or compensation is out of scope because no payment/refund behavior is authorized.

The exact cancellation rights, buyer response, and whether a seller may cancel after acceptance require Founder decision. The implementation must not silently invent a refund, penalty, or dispute process.

## 8. First-slice candidate comparison

The three candidate slices requested by the task are compared below.

| Candidate | Personal-seller usability | Buyer steps | Seller supply risk | Traceability | Payment dependency | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| A. Made-to-order, seller confirms, then prepares and delivers | Simple publish; one decision per order; works without stock count. | Direct page, authenticated order, wait for accept/decline, coordinate delivery. | Low-to-moderate; seller acceptance is an explicit gate. | Strong: Offering -> Order -> Acceptance -> Commitment -> Fulfillment. | No real Payment required for research slice. | **Main recommendation.** |
| B. Standard repeatable item, seller keeps intake open, direct order | Simplest per-order operation when supply is predictable. | Shortest path; no seller confirmation. | Higher; open intake can exceed personal capacity. | Weaker when no explicit acceptance fact exists. | No real Payment required for research slice. | P1 after evidence that seller confirmation is unnecessary. |
| C. One unique work, seller confirms and closes offering after acceptance | Easy for a single work. | Similar to A; page becomes unavailable after acceptance. | Low if coarse availability is enforced. | Strong for one-off facts. | No real Payment required for research slice. | Later bounded mode after the general slice. |

### 8.1 Main recommendation

Choose Candidate A as the first business model, with these deliberately narrow limits:

- one seller;
- one published Goods Offering;
- one buyer per order;
- one unit per order;
- no shopping cart;
- no quantity field;
- seller confirmation before Commitment;
- seller-arranged delivery;
- no platform Payment;
- no stock count or reservation;
- no automatic reopening, refund, or compensation logic.

This provides a real commercial trace without creating traditional e-commerce infrastructure. It keeps a human seller in control of a product they may be able to prepare only one order at a time or only after seeing demand.

## 9. Current PCI capability research

This section distinguishes reusable engineering mechanisms from capabilities that do not currently exist for Goods.

| Existing area | Evidence in current baseline | Research conclusion |
| --- | --- | --- |
| Creator identity and ownership | Existing Creator actor/session and offering ownership checks; Creator APIs use authenticated actor context. | Reuse identity, ownership, session, and authorization boundaries. Do not infer legal ownership solely from a Creator account. |
| Public distribution | Service has published Offering checks, public offering routes, direct public pages, distribution assets, and Creator profile surfaces. | Reuse the direct-share and public rendering pattern. Build a Goods-specific public route and policy boundary; do not expose Service Request semantics. |
| Service Offering | Offering is shaped around capability IDs, service templates, request instructions, publication policy, and Service-specific intake (modules/service-offering/offering.ts, applications/customer-request/customer-request-use-cases.ts). | Reuse validation and publication lessons, not the Service Offering type or Service policy as a Goods domain model. |
| Customer Request / Commerce Action | Existing public Service flow records a customer, request message, submitted/confirmed/declined action, result token, and Service Fulfillment Code (modules/customer-request/commerce-action.ts, applications/customer-request/customer-request-use-cases.ts). | Reuse request idempotency, actor checks, correlation, and creator decision patterns. Goods needs an independent Goods Order and must add price snapshot, acceptance, commitment, and delivery semantics. |
| Order and Commitment | Conceptual Baseline separates them. Existing paid order implementation is PaidServiceOrder and includes service-specific snapshot fields. | No current Goods Order or Goods Commitment capability was found. Do not claim that the existing paid Service Order is Goods-ready. |
| Contract Commerce | Contract versions retain scope, price, acceptance, expiry, and order association. Current scope validation is service-oriented (applications/contract-commerce/contract-service.ts, modules/contract-commerce/contract.ts). | Potentially reusable versioning and acceptance patterns, but Goods terms must be independently defined; do not force service performance fields into Goods. |
| Payment | Money domain and local paid-commerce simulation exist, but current order/schema names and runtime paths are service/simulation-oriented. | Record price as a commercial condition only. Payment requires a separate authorization and implementation task. |
| Fulfillment | Existing Service Fulfillment Code / QR / Creator confirmation is a real accepted Service boundary. | Reuse audit and traceability principles, not Service Fulfillment Code as Goods delivery. |
| Program | Program has separate Offering, Run, Application, Enrollment, Session, Attendance, Completion, and audit semantics. | Reuse transaction/audit/persistence patterns only. Goods does not need Program lifecycle objects. |
| Membership | Membership has separate Offering, Application, Membership Relationship, validity, verification, and admission facts. | Reuse identity and operator authorization patterns only. Goods Order is not Membership. |
| Admin Operations | Six scenario kinds are visible, but Goods remains not_integrated and server-side changes are rejected. | A future Goods implementation must add a real backend policy and Admin operation; a displayed Goods row alone is insufficient. |
| BFF and security | Creator Web uses the existing Creator session/BFF boundary; Admin uses Operations Human permissions and same-origin protection. | Reuse these security boundaries. Goods must not return a browser Bearer credential or mix Creator and Operations identities. |
| Correlation and audit | Canonical events, Operations audit, and Program/Membership audit patterns exist. | Every Goods order, acceptance, commitment, delivery, pause, and exception must have a source, actor, correlation ID, and auditable history. |

### 9.1 Important negative finding

No current repository evidence shows a completed Goods-specific Offering, Goods Order, Goods Commitment, Goods Fulfillment, Goods Admin policy, or Goods payment path. The existing Service, Membership, Program, and local paid-commerce implementations are useful reference mechanisms but are not evidence that Goods is already implemented.

## 10. Proposed first-slice rules

The following are implementation-ready recommendations, not Founder-approved rules.

### 10.1 Offering rules

- A Creator can create a Goods Offering owned by that Creator.
- A Goods Offering has a title, description, price/currency, preparation/provision description, and simple expected timing.
- A single optional image is sufficient for the first slice; image management is not a catalog system.
- A published Goods Offering has a direct public URL.
- The seller can pause new intake without deleting the offering or historical orders.
- The first slice has no SKU, variants, quantity, inventory, reservation, warehouse, or replenishment.

### 10.2 Order rules

- A buyer must be authenticated at order submission; browsing can remain public.
- A Goods Order identifies one buyer, one seller, and one Goods Offering.
- The first slice fixes quantity to one.
- The order stores the accepted terms/price snapshot and a minimal delivery-coordination note.
- A buyer's submission creates a pending order, not an automatic Commitment or Payment.
- A seller can accept or decline only an owned order.
- Duplicate unresolved orders for the same buyer and offering should be rejected or explicitly handled; the exact duplicate rule requires Founder confirmation.

### 10.3 Commitment rules

- Seller acceptance is the proposed trigger for a Goods Commitment.
- The Commitment records the accepted offering/terms version, buyer, seller, order, and correlation identity.
- Commitment must not be inferred from page view, price display, order submission, Payment, or delivery.
- The Commitment remains traceable if delivery later fails or the order is cancelled under an approved rule.

### 10.4 Delivery rules

- Delivery is seller-arranged and outside PCI logistics control.
- The system records the chosen delivery method and the minimum delivery fact defined by the accepted contract.
- A delivery fact must not modify the original order acceptance or create a Payment fact.
- Buyer receipt confirmation is recommended as an optional separate fact, not as an automatic assumption.

### 10.5 Operations rules

- Goods scenario pause blocks new Goods Order submissions.
- Pause does not cancel accepted orders, delete commitments, or rewrite delivery history.
- Resume reopens intake only when the Goods business path and required policy configuration are actually integrated.
- Operations changes require Operations Human authorization, persisted state, reason, actor, revision, time, and correlation ID.

## 11. In scope, P1, and later

### P0 - minimum real Goods loop

For a future implementation task, the first real Goods slice must include:

1. Goods-specific Offering creation and publication for a personal seller.
2. Direct public Offering page with title, description, optional image, price, timing, and delivery note.
3. Authenticated buyer order submission for one seller and one offering, quantity fixed to one.
4. Server-side price/terms snapshot and duplicate handling.
5. Seller-owned accept/decline operation.
6. Goods-specific Commitment created only after seller acceptance.
7. Seller-arranged delivery fact and the selected minimum receipt/exception fact.
8. Creator-facing pending and accepted order handling.
9. Admin Goods intake pause/resume with server-side authorization, persistence, audit, and safe pause semantics.
10. Correlation and traceability from Offering to Order, Acceptance, Commitment, Fulfillment, and delivery confirmation.
11. No real Payment claim and REAL_MONEY_ENABLED = false.
12. Regression evidence that Service, Membership, and Program behavior is unchanged.

### P1 - evidence-led follow-up

- Seller open-intake mode after evidence shows confirmation is unnecessary.
- One-of-one coarse availability (available / closed or sold).
- More than one image or richer product information.
- Buyer receipt confirmation and a bounded delivery exception flow if the first slice needs it.
- A limited seller catalog surface if direct links alone do not produce useful discovery.
- A separately authorized payment design, if Founder decides that Goods requires a PCI Payment fact for its first paid customer path.

### Later / out of first slice

- Quantity, inventory, reservation, warehouse, replenishment, multi-location stock, stock ledger, or anti-oversell engine.
- Shopping cart, multi-seller order, combined checkout, split settlement, or platform marketplace.
- Coupons, promotions, ranking, advertising, recommendation, loyalty points, or affiliate distribution.
- Carrier integrations, tracking, shipping-rate calculation, delivery zones, or route management.
- ERP, CRM, merchant suite, complex returns, automatic refund, dispute platform, or multi-party settlement.
- Automatic payment, refund, settlement, withdrawal, real-money Pilot, or production collection.
- A universal six-scenario lifecycle or a shared Goods/Service/Program state machine.

## 12. Proposed acceptance criteria for a later implementation

Goods should not be marked integrated because an Admin row or a product page exists. A later implementation task should demonstrate:

1. A distinct Goods Offering is created by an authenticated personal seller.
2. A public direct page exposes only the buyer-relevant information and does not expose private seller data.
3. A buyer can submit one authenticated Goods Order for one offering without a cart or inventory workflow.
4. The server snapshots the price/terms and prevents the accepted order from being silently rewritten.
5. The seller can accept or decline only an owned pending order.
6. Acceptance creates a distinct Goods Commitment; order submission alone does not.
7. Delivery is recorded independently of acceptance and Payment.
8. Seller pause prevents new orders but does not cancel or rewrite accepted orders and historical delivery facts.
9. Operations Human authorization, persistence, audit, revision conflict handling, and correlation IDs are enforced server-side.
10. Service, Membership, and Program paths remain behaviorally intact.
11. Goods, Project, and Right are not accidentally opened by a shared scenario screen.
12. The evidence does not claim a Payment, refund, settlement, or real-money transaction that was not authorized and executed.

## 13. Founder decisions required

The following questions are material commercial rules and should not be invented by engineering:

1. **First business mode**: Approve Candidate A (made-to-order, seller-confirmed) as the first Goods slice, or choose the open-intake or one-of-one alternative?
2. **Buyer identity**: Must a buyer authenticate at order submission? Recommendation: yes, while public browsing remains anonymous.
3. **Order acceptance**: Does seller acceptance form the Goods Commitment? Recommendation: yes; submission alone is not a Commitment.
4. **Quantity**: Is the first slice fixed to one unit per order? Recommendation: yes; no quantity or stock count.
5. **Seller timing**: Is a seller-declared preparation/handover window mandatory? Recommendation: yes, as simple text or a bounded choice, not a scheduler.
6. **Delivery evidence**: Is seller delivery/handover confirmation sufficient, or must the buyer also confirm receipt? Recommendation: store seller delivery as the minimum fact and make buyer receipt a separate optional fact.
7. **Post-acceptance failure**: May a seller cancel after acceptance, and what buyer-visible outcome is required? Recommendation: record an explicit exception/cancellation fact; do not invent refund or penalty rules.
8. **Offline settlement**: Is seller/buyer offline settlement permitted for the first commercial experiment? No Payment implementation is authorized by this package; any permitted external settlement needs a separate evidence and responsibility rule.
9. **Price policy**: Which currency and price-change rules apply? Recommendation: display one seller price/currency and snapshot it at order submission.
10. **Discovery surface**: Is direct sharing plus the seller's public profile sufficient, or is a limited Goods listing required? Recommendation: direct share first; no marketplace discovery system.

## 14. Research limits and non-authorization

This package did not:

- modify code, API contracts, database schemas, migrations, deployment configuration, or Founder Decisions;
- run a runtime or external-service test;
- connect a production database or payment provider;
- enable Goods in Admin or change the scenario operation service;
- create a payment, refund, settlement, logistics, inventory, or marketplace capability;
- resolve open global architecture questions, legal/compliance rules, or ownership/rights questions;
- authorize production, Pilot, external sellers, or real-money activity.

The recommendation is based on the current repository evidence and the Founder task direction. It is not a claim that the current repository already supports the Goods flow.

## 15. Control status

~~~text
GOODS STRATEGIC POSITION          = FOURTH OPERATIONAL SCENARIO / DIRECTION CONFIRMED
GOODS FIRST BUSINESS SLICE        = PROPOSED - SELLER-CONFIRMED MADE-TO-ORDER
GOODS OPERATIONAL INTEGRATION     = NOT INTEGRATED
RECOMMENDATION                    = ONE SELLER / ONE OFFERING / ONE UNIT / SELLER-ARRANGED DELIVERY
INVENTORY                         = NOT IN FIRST SLICE
PAYMENT                           = NOT IMPLEMENTED / NOT AUTHORIZED
REAL_MONEY_ENABLED                = false
SERVICE                           = FIRST OPERATIONAL SLICE PRESERVED
MEMBERSHIP                        = SECOND OPERATIONAL SLICE PRESERVED
PROGRAM                           = CURRENT IMPLEMENTATION PRESERVED
PROJECT / RIGHT                   = NOT INTEGRATED
FOUNDER DECISION CREATED HERE     = NO
CODE / API / SCHEMA / MIGRATION   = NONE
PRODUCTION / PILOT                = NOT AUTHORIZED
~~~

This package is complete for Main Controller review. Goods implementation must not begin until the first business mode and the material commercial rules above are separately accepted.
