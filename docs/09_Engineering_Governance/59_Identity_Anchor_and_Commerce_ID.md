# 59 — Identity Anchor and Commerce ID

> **Status**: Architecture Discovery — Suspended / No Implementation Authorization
> **Change Unit**: `PROJECT-SUSPEND-002`
> **Restart SSOT**: `docs/08_Execution/22_Project_Handoff.md`
> **Next Resume Task**: `RESUME-001 — Identity & External Platform Binding Foundation`
> **Real Money**: `REAL_MONEY_ENABLED = false`

## 1. Purpose

This document records the architecture gap discovered before project suspension: PCI needs a stable,
platform-neutral Commerce Identity Anchor so traffic originating on third-party content and
distribution platforms can enter PCI commercial infrastructure.

This is a governance and architecture record only. It does not authorize Identity API, Commerce ID
generation, OAuth, account binding, login, profile, database, UI, payment or other business-code
changes.

## 2. Product Positioning

PCI is not a content distribution platform, social network, creator marketplace or replacement for
Xiaohongshu, Douyin, WeChat Channels, YouTube, Instagram or X. Third-party platforms own discovery,
content distribution, traffic and audience. PCI owns the stable commercial handoff and the commerce
lifecycle after that handoff.

```text
Third-party Content / Distribution Platforms
    ↓
Discovery / Traffic / Audience
    ↓
PersonalCommerceInfrastructure
    ↓
Identity → Commerce Profile → Commerce ID
    ↓
Request / Reservation / Contract / future approved Commerce Objects
    ↓
Execution → Completion → Earnings / Wallet Projection
```

## 3. Identity Infrastructure Boundary

```text
PersonalCommerceInfrastructure
│
├── Identity Infrastructure
│   ├── Identity
│   ├── Commerce Profile
│   ├── Commerce ID / C号
│   └── External Platform Identity
│
└── Commerce Infrastructure
    ├── Request
    ├── Reservation
    ├── Contract
    ├── Completion
    ├── Earnings
    └── Wallet
```

### Identity ID

`Identity ID` is the internal permanent identity root: who the account or identity is inside PCI.
It is private, non-enumerable and stable across nickname, brand, platform handle and profile changes.
It must not contain phone number, birthday, location or other PII, and it is not an authentication
credential. UUIDv7 or an equivalent non-guessable, time-ordered identifier is the recommended
technical direction; no implementation is included here.

### Commerce Profile

`Commerce Profile` is the commercial identity represented to customers. It is not forced to equal a
natural person. The architecture must preserve:

```text
1 Identity : N Commerce Profiles
```

Examples include a Personal Creator Profile, Dance Group / Studio Profile and Brand / Business
Profile owned by one internal Identity.

### External Platform Identity

Each third-party account is an independent relationship object. The minimum future conceptual facts
are:

```text
platform
platform_account_id
platform_handle
profile_url
verification_status
bound_at
unbound_at
```

The architecture must preserve:

```text
1 Commerce Profile : N External Platform Identities
```

Binding and unbinding are mutable relationships. A platform account may be verified, bound, unbound
and later re-reviewed without changing the Commerce ID.

## 4. Commerce ID / C号 Contract

`Commerce ID / C号` is a stable public / external identifier for a Commerce Profile. It is the
platform-neutral reference that can appear in creator bios, QR codes, links and external business
materials.

It is not a password, API key, session token, OAuth credential, payment credential, authorization
credential, internal Identity ID or Commerce Object ID.

Recommended format:

```text
C-XXXXXXXX
```

| Property     | Frozen direction                                                                                |
| ------------ | ----------------------------------------------------------------------------------------------- |
| Length       | 8-character suffix plus `C-` prefix                                                             |
| Alphabet     | Crockford Base32-style, uppercase, with confusing `O / 0 / I / 1 / L` removed from presentation |
| Capacity     | `32^8 = 1,099,511,627,776`, approximately 1.10 trillion theoretical combinations                |
| Semantics    | Opaque; does not encode region, year, tier, platform, gender or Creator type                    |
| Readability  | URL-safe, speakable, QR/OCR-friendly, fixed length                                              |
| Allocation   | Random generation + database uniqueness constraint + collision retry                            |
| Sequence     | Non-sequential; never `next_user_number++`                                                      |
| Immutability | Permanent once assigned to a Commerce Profile                                                   |
| Reuse        | Never reassign, including after closure, deletion or retirement                                 |
| Boundary     | Public reference only; internal Identity / Profile IDs remain private keys                      |

Example:

```text
C-7K4M2Q9R
```

The theoretical capacity is not a security claim. The eventual implementation must use a secure
random source, uniqueness enforcement and retry on collision:

```text
generate
→ database uniqueness check
→ collision?
   ├── no → accept
   └── yes → regenerate
```

If extreme scale later requires a longer or versioned representation, existing C号 values remain
unchanged. A new representation may be introduced only by a future versioned architecture decision.

## 5. Public Commerce Entry

The future public entry concept is:

```text
https://pci.example/c/C-7K4M2Q9R
```

It resolves to a Commerce Profile, not a social-profile mirror. It may eventually expose approved
public identity, Upcoming context, Products, Services, Reservations, Contracts, Tickets or
Merchandise according to separately approved Commerce capabilities. It must not become a calendar
product, content feed, recommendation engine or social graph.

Commerce Profile identity and specific Commerce Objects remain separate:

```text
C-7K4M2Q9R  → Alice / Alice Studio Commerce Profile
Object ID   → one specific Request / Reservation / Contract / Event / Product / Service
```

No Commerce Object ID format is frozen by this document.

## 6. Resume Scope

The next restart direction is:

```text
RESUME-001 — Identity & External Platform Binding Foundation
```

Expected sequence:

1. Re-entry audit of Git baseline, documents, CLIENT-001, CLIENT-002, browser tests, environment
   flags and dependency drift;
2. Finalize Identity / Commerce Profile / Commerce ID / External Platform Identity boundaries;
3. Design the `C-XXXXXXXX` generation, lookup, uniqueness, immutability and non-reuse foundation;
4. Define a platform-neutral External Platform Identity binding abstraction;
5. Define the public `/c/{commerce_id}` resolution boundary.

Each implementation unit requires explicit Founder authorization after the re-entry audit.

## 7. Explicit Non-Goals

The restart direction must not begin by building:

- All-platform OAuth at once;
- Social Graph;
- TikTok / Instagram / YouTube profile replicas;
- Content publishing or content recommendation;
- Multi-platform content synchronization;
- Marketplace, CRM or Analytics Dashboard;
- Payment, real-money movement or Native App.

PCI承接第三方平台产生的商业流量，不替代第三方平台本身。

## 8. Final Boundary

```text
Identity ≠ Commerce Profile ≠ Commerce ID ≠ External Platform Identity ≠ Commerce Object ID

1 Identity : N Commerce Profiles
1 Commerce Profile : 1 stable Commerce ID
1 Commerce Profile : N External Platform Identities

NO BUSINESS CODE CHANGES
REAL_MONEY_ENABLED = false
apps/app = DEFERRED
```
