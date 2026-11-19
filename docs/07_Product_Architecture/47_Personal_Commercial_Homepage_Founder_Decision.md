# 47 — Personal Commercial Homepage Founder Decision

> **Decision ID**: `FD-PCI-PERSONAL-COMMERCIAL-HOMEPAGE-001`
>
> **Status**: `FOUNDER APPROVED / FROZEN`
>
> **Decision date**: 2026-11-20
>
> **Approval source**: Founder direction in **PCI-PD-008-R1 — Personal Commercial Homepage Alignment**

## 1. Product positioning

PCI is a **Personal Commercial Homepage** product. Each person has a personal commercial homepage through which the commercial supply that person actually publishes can be presented to consumers.

The six PCI supply domains remain:

- Service
- Goods
- Program
- Membership
- Project
- Right

The homepage is the primary unified external presentation and discovery entry for a person's published commercial supply. A consumer should be able to visit the person's homepage and understand the person and the supply that is actually available there. The consumer must not need the person to send a separate Goods or Service link before the published supply can be discovered.

An individual offering link may remain as an optional secondary convenience link to a specific offering or its detail page. It is not a prerequisite for homepage visibility or for the existence of the person's public commercial presence.

## 2. Scope and domain independence

The six supply domains are presented under the same personal homepage, but they retain independent business meaning:

- Each domain keeps its own Offering, transaction, participation, fulfillment, validity, and rights semantics where applicable.
- A homepage projection includes only supply that is actually published, eligible for public display, and supported by the corresponding domain path.
- A person does not need to operate all six domains, and the homepage does not show unpublished or not-integrated supply as if it were available.
- A common presentation entry does not create a common lifecycle, common state machine, or universal transaction model.
- Membership is not Right; Program participation is not Membership; Goods is not Service merely because their offerings appear on the same homepage.

This decision does not turn PCI into a traditional Marketplace. It does not authorize advertising, ranking, recommendation algorithms, complex search, cross-seller carts, platform logistics, or traffic-distribution operations.

## 3. Discovery and purchase boundary

The product boundary is:

```text
Personal Commercial Homepage
  -> domain-specific offering discovery
  -> domain-specific offering detail
  -> domain-specific transaction flow
```

The homepage being discoverable, a person sharing a homepage or offering link, and a consumer purchasing an offering are separate concerns. Personal sharing is optional; it must not be the condition that makes a published offering visible on the homepage. The transaction flow remains governed by the relevant domain contract.

For Goods, the approved presentation direction is:

```text
Personal Commercial Homepage
  -> Goods Offering Discovery
  -> Goods Offering Detail
  -> Goods Order
```

This decision does not approve the Goods order, payment, fulfillment, inventory, or implementation rules. Those remain governed by the Goods decision package and any later Founder approval.

## 4. Current implementation status

This is a product-positioning decision, not an assertion that the current repository already projects all six domains from one homepage. At the time of this decision:

- The stable public `/r/{commerceRef}` homepage and public homepage API exist.
- The current homepage projection is Service-oriented and displays published Service offerings.
- Membership and Program currently have separate public entry paths rather than a complete shared homepage projection.
- Goods, Project, and Right are not integrated operational scenarios and must not be displayed as available merely because the homepage can name six domains.

Future implementation should extend the existing homepage projection incrementally, reusing the established public identity, visibility, authorization, and traceability boundaries. Each domain must enter the homepage only when its own public business path is real and eligible for display.

## 5. Compatibility and exclusions

This decision preserves:

- Conceptual Baseline 41;
- F01–F04 and D01–D12;
- the existing Service, Membership, and Program Founder Decisions and product contracts;
- existing C-number, public-field, homepage lifecycle, and access-control rules.

This decision does not:

- authorize code, API, database, migration, UI, or homepage projection implementation;
- approve a Goods business mode or payment path;
- create a Marketplace or a universal six-domain lifecycle;
- require every person to publish every supply domain;
- authorize production, external Pilot, or real-money activity.

## 6. Control status

```text
PCI PRODUCT POSITIONING             = PERSONAL COMMERCIAL HOMEPAGE
HOMEPAGE ROLE                      = PRIMARY COMMERCIAL PRESENTATION / DISCOVERY ENTRY
SUPPLY DOMAINS                     = SIX, PRESENTED WITH INDEPENDENT DOMAIN SEMANTICS
INDIVIDUAL SHARING                = OPTIONAL SECONDARY ACCESS PATH
SHARING AS VISIBILITY PREREQUISITE = NOT REQUIRED
CURRENT HOMEPAGE PROJECTION        = SERVICE-ORIENTED / NOT YET SIX-SCENARIO COMPLETE
MARKETPLACE                        = NOT AUTHORIZED
UNIFIED DOMAIN LIFECYCLE           = NOT AUTHORIZED
CODE / API / SCHEMA / MIGRATION    = NOT AUTHORIZED BY THIS DECISION
PRODUCTION / PILOT / REAL MONEY    = NOT AUTHORIZED
```
