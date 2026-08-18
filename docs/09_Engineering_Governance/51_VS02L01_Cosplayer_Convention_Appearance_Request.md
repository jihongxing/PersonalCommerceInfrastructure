# 51 — VS-02L01 Cosplayer Convention Appearance Request

> **Status**: Founder Approved — Implementation Authorized
> **Decision Date**: 2026-08-17
> **Change Unit**: `DEV-023`
> **Commerce Pattern**: Request Commerce
> **Real Money**: Not authorized

## 1. Purpose

VS-02L01 is a Cross-Vertical Reuse Slice. It tests whether the existing Creator Commerce
Infrastructure can express a Cosplayer / Convention Creator commercial appearance without creating a
Cosplayer sub-product, Convention platform, Calendar core object or a second Money system.

## 2. Frozen Commercial Definition

| Term              | Frozen definition                                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Creator           | Cosplayer / Convention Creator                                                                                                     |
| Buyer / Requester | Organizer, Brand, Fan Group or approved external requester, represented by the existing Customer / Requester boundary              |
| Commerce Object   | Appearance Offering                                                                                                                |
| Pattern           | Existing Request Commerce                                                                                                          |
| Fulfillment       | Creator records `Appearance Completed` for a confirmed Appearance Request through the existing Paid Service fulfillment capability |
| Settlement        | Existing Paid Commerce settlement policy and Money Infrastructure; no vertical-specific settlement behavior                        |

An Appearance Offering may express Convention Appearance, Guest Appearance, Brand Appearance, Photo
Appearance or Signing Appearance. These labels classify Creator-facing expression only; they do not
create Reservation, Ticketing, Admission or a new requester account type.

## 3. Reuse Decision

The implementation uses:

```text
Existing Offering
+ optional Appearance metadata
```

It does not create `CosplayerOffering`, `CosplayerOrder`, `CosplayerPayment`, `ConventionSettlement`,
`OrganizerAccount`, `BrandAccount`, `FanGroupAccount`, `EventCalendar`, `ConventionCalendar` or
`TourSchedule`.

The optional metadata is vertical-specific presentation and request context:

- appearance type;
- date or date range;
- location / venue description;
- buyer type;
- optional price/pricing-rule text;
- request call to action;
- optional upcoming entry title and external link.

The existing Offering title, description, capability link, availability description, request
instructions, lifecycle and public URL remain authoritative for core Request Commerce semantics.

## 4. Upcoming Projection

`Upcoming` is a public, non-transactional projection of Appearance metadata on a Creator Commerce
Identity / public Offering page:

```text
Appearance temporal facts
→ Upcoming projection
→ Creator Commerce Identity distribution
```

It may make a requester aware of where the Creator will appear. It does not create Ticket,
Reservation, Order, inventory, admission or an automatic Payment path. An optional external link is
only a Creator-provided distribution destination; it is not an external transaction fact.

## 5. Scope Guard

This slice must not build:

- convention/event list, search, recommendation or city database;
- Ticketing, check-in, venue or staff management;
- organizer/guest roster, organizer backend or fan community;
- Marketplace, CRM, travel management or tour operations;
- Reservation, Contract, Ticket or Instant Commerce;
- a Money, Payment, Settlement, Ledger, Wallet, Withdrawal or Provider variant.

## 6. Request and Fulfillment Boundary

Requesters use the existing public Request CTA and existing Customer/Requester information fields.
Creator Confirm / Decline uses the existing Request Commerce state machine unchanged.

For a confirmed Appearance Offering that enters existing Paid Commerce, the Creator records
fulfillment through the existing application use case. The evidence reference expresses completed
appearance fulfillment; no attendance, venue check-in or staff-management state is introduced.

## 7. Acceptance

| Acceptance | Required result                                                                                            |
| ---------- | ---------------------------------------------------------------------------------------------------------- |
| COS-01     | Creator creates an Appearance Offering using existing Offering capability                                  |
| COS-02     | Creator publishes it through existing publish behavior                                                     |
| COS-03     | Public surface shows non-transactional Upcoming projection                                                 |
| COS-04     | Public surface shows Appearance Offering and Request CTA                                                   |
| COS-05     | Requester submits an existing Request Commerce Request                                                     |
| COS-06     | Creator confirms using existing state machine                                                              |
| COS-07     | Creator declines using existing state machine                                                              |
| COS-08     | Confirmation continues into existing Order / Paid Commerce flow                                            |
| COS-09     | Existing Earnings / Wallet / Operations surfaces show the resulting commerce facts with no vertical ledger |
| COS-10     | Unpublish/Identity withdrawal blocks new Requests while preserving old Request meaning                     |

## 8. Architecture Reuse Audit

| Core capability  | Reused | Modified          | New vertical logic                  | Reason                            |
| ---------------- | ------ | ----------------- | ----------------------------------- | --------------------------------- |
| Creator Identity | Yes    | No                | Public copy/projection only         | Same Creator profile              |
| Offering         | Yes    | Optional metadata | Appearance presentation fields      | Avoid separate vertical aggregate |
| Availability     | Yes    | No                | Appearance date/location projection | Not inventory                     |
| Request          | Yes    | No                | None                                | Existing Request Commerce         |
| Order            | Yes    | No                | None                                | Existing confirmed-request Order  |
| Payment          | Yes    | No                | None                                | Existing provider-neutral flow    |
| Settlement       | Yes    | No                | None                                | Existing policy                   |
| Earnings Ledger  | Yes    | No                | None                                | Existing immutable ledger         |
| Wallet           | Yes    | No                | None                                | Existing ledger projection        |
| Withdrawal       | Yes    | No                | None                                | Existing withdrawal use case      |
| Operations       | Yes    | No                | Existing fact-source/audit view     | No Cosplayer workspace            |

## 9. Core-Gap Rule

Any need for a Cosplayer-specific Order, Payment, Wallet, Settlement, Calendar, requester account,
event inventory or Pattern state machine is a Core Architecture Gap. Implementation must stop and
report it to the Controller rather than inserting the semantics into core infrastructure.

## 10. Completion Boundary

```text
VERTICAL-02L-01 — Cosplayer Convention Appearance Request = COMPLETE
only when COS-01 through COS-10 and the Architecture Reuse Audit pass.
```

No second Vertical, Reservation Commerce or Contract Commerce begins automatically.
