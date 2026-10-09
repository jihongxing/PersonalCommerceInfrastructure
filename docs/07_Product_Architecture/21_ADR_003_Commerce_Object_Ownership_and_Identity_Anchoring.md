# ADR-003 — Commerce Object Ownership and Identity Anchoring

> **状态**：PROPOSED  
> **决策范围**：Commerce Object 的 Identity、Ownership、Control、Relationship、Lifecycle 与 Source of Truth 边界  
> **上游**：ADR-001、ADR-002、Product Direction FROZEN_V1  
> **实现授权**：本 ADR 不授权 Stage 2 实现

## 1. Context and Scope

Personal Commerce Infrastructure 必须同时表达：

```text
Identity = subject continuity anchor
Commerce Profile = commercial ownership / presentation anchor
```

这两个概念不能因为当前 prototype 使用 `creatorId` 而重新合并。当前 VS-01 / VS-02 实现仍主要以 Creator、`creatorId` 和 prototype-specific persistence references 组织 Commerce Objects。本 ADR 只建立 Product → Domain → Future Architecture 的 ownership mapping，不修改代码、schema、API、migration 或运行时行为。

## 2. Vocabulary

| Term | Meaning |
|---|---|
| Identity | PCI 内部永久主体根，提供 subject continuity，不是商业展示页或凭证容器。 |
| Commerce Profile | 面向客户的商业身份、商业展示和商业经营边界。一个 Identity 可拥有多个 Profile。 |
| Ownership | 对对象的商业归属，不等同于登录权限或当前操作者。 |
| Control | 对对象进行创建、修改、发布、暂停或归档等操作的授权关系。 |
| Representation | 对外代表谁、展示谁的商业语义。 |
| Participation | 某个主体在 Commerce Event 中扮演的角色，例如 provider 或 customer。 |
| Attribution | 历史事实应归属于哪个原始主体、Profile 和对象。 |
| Actor | 应用运行时的执行参与者或角色上下文，不自动等于持久化 Identity。 |
| Counterparty | Commerce Commitment 另一侧的参与主体。 |

## 3. Core Decision

正式采用：

```text
Identity
    = permanent subject continuity anchor

Commerce Profile
    = commercial ownership, control boundary, and presentation anchor
```

核心规则：

1. Provider-side commercial objects 默认由 Commerce Profile 锚定。
2. Identity 保留对 Profile 的主体连续性和上层控制关系，但不因此获得 Profile 级公共数据的自动合并语义。
3. 同一 Identity 下的不同 Profiles 默认拥有独立的 Offers、Availability、Commerce Relationships 和 Reputation subject。
4. Commerce Commitment 是双边或多方商业事实，不应被简化为 Provider Identity 的子对象。
5. 历史事实同时保留原始 actor/reference、Identity anchor（如已可确定）、Profile anchor（如已可确定）、object ID 和事件时间。
6. `Owner`、`Controller`、`Representation`、`Participation` 和 `Attribution` 必须分开表达。

## 4. Ownership Matrix

| Object | Identity Anchor | Primary Owner | Controller | Customer / Counterparty | Parent / Context | Source of Truth | Historical Attribution |
|---|---|---|---|---|---|---|---|
| Identity | Identity ID | Identity subject | Authorized Account / Actor | None | Account association | PCI Identity model | Identity ID and audit history |
| Commerce Profile | Identity ID | Controlling Identity | Authorized Profile controller | None | Identity | PCI Profile model | Profile ID, Identity ID, timestamps |
| Offer | Profile ID | Commerce Profile | Authorized Profile controller | Requesting customer | Profile | PCI Offer model | Offer ID, Profile ID, legacy `creatorId` where applicable |
| Capability | Identity ID when personal; Profile ID when commercial | Capability definition owner or Profile association | Authorized owner/controller | Offer or customer context | Capability definition / Profile association | PCI capability model | Capability ID, source association, timestamps |
| Availability | Profile ID | Commerce Profile or Offer context | Profile controller / inventory policy | Requesting customer | Offer / inventory context | PCI Availability model | Availability ID, Profile ID, Offer ID, state events |
| Inventory | Profile ID or independent resource owner | Scarce resource owner | Inventory policy/controller | Commitments competing for resource | Availability / resource context | PCI inventory model | Resource ID, reservation events, original owner |
| Reservation | Profile ID and Inventory ID | Reservation aggregate / commitment context | Reservation policy and commitment workflow | Customer and provider Profile | Inventory + Request / Commitment | Reservation subsystem until commitment transition | Reservation ID, resource ID, request ID, Profile references |
| Commerce Commitment | Provider Profile ID and customer subject reference | Commitment as bilateral commercial fact | Commitment participants under workflow policy | Customer and Provider Profile | Offer, Request, Inventory, Terms | PCI Commitment model | Commitment ID, both sides, source Offer, event history |
| Commerce Action / Request | Provider Profile ID plus requester subject reference | Requesting participant's intent record | Request workflow / provider response policy | Provider Profile and requester | Offer | Request subsystem before Commitment | Request ID, requester, target Profile, timestamps |
| Contract | Commitment ID, provider Profile ID, customer reference | Contractual parties | Contract parties under legal workflow | Provider and customer | Commerce Commitment | Contract / terms record | Contract ID, Commitment ID, immutable terms history |
| Payment | Commitment ID and payment participant references | Payment execution subsystem / payer transaction | Payment provider and payment policy | Payer and payee context | Paid Order / Commitment | Payment subsystem | Payment ID, Commitment ID, provider facts |
| Paid Order | Commitment ID, provider Profile ID, customer reference | Payment execution representation | Payment / order workflow | Payer and provider | Commitment | Paid-commerce subsystem | Order ID, Commitment ID, payment evidence |
| Fulfillment | Commitment ID, provider Profile ID, customer reference | Fulfillment record as execution fact | Provider and customer confirmation policy | Provider and customer | Commerce Commitment | Fulfillment subsystem | Fulfillment ID, Commitment ID, evidence and timestamps |
| Deliverable | Fulfillment ID and Commitment ID | Provider-side delivery obligation or resulting artifact | Provider submission and customer acceptance policy | Customer | Fulfillment | Fulfillment / artifact subsystem | Deliverable ID, Fulfillment ID, immutable versions |
| Reputation | Subject Profile ID; reviewer Identity/Account reference | Commerce Profile as reputation subject | Reputation policy / moderation authority | Eligible reviewer from Commitment | Fulfilled Commitment | Reputation subsystem | Reputation ID, reviewer, Commitment ID, eligibility evidence |
| Commerce Relationship | Profile ID | Commerce Profile | Profile controller under relationship policy | External Platform Account | Profile | PCI Relationship model | Relationship ID, platform account reference, lifecycle history |
| External Platform Account | Relationship ID and platform namespace | External platform account record is not PCI commercial owner | Platform controls external account; PCI controls relationship | Platform | Commerce Relationship | External platform for account facts; PCI for relationship facts | External account ID, platform, relationship events |
| Ledger Entry | Commitment / payment / fulfillment references | Financial ledger subsystem | Ledger rules and controlled financial operations | Provider, customer, payment participants | Financial execution context | Ledger | Append-only entry ID, source event, references |
| Earning | Profile or payee projection reference plus ledger source | Derived financial projection | Financial projection policy | Provider Profile | Ledger / Commitment | Derived from Ledger | Earning ID, source ledger entries and Commitment |
| Wallet | Account/Profile payout projection reference | Financial subsystem, not Profile commercial ownership | Wallet policy and payment controls | Payee / payout beneficiary | Ledger / payment context | Wallet projection + Ledger | Wallet snapshot and source ledger version |
| Withdrawal | Payout beneficiary reference and ledger/payment references | Withdrawal execution subsystem | Withdrawal policy and provider controls | Payee / payout beneficiary | Wallet / Ledger | Withdrawal subsystem plus provider evidence | Withdrawal ID, source wallet/ledger facts, timestamps |

该矩阵是候选架构边界，不是当前数据库 schema 的承诺。当前实现缺失的独立对象必须在后续 Architecture Design 中单独建模。

## 5. Identity-level Objects

Identity 只承担主体连续性相关职责：

- Identity ID 与 subject continuity；
- Identity 与 Authentication Account 的关联引用；
- Identity 对多个 Commerce Profiles 的上层归属；
- identity-level audit references；
- 后续跨 Profile 的主体连续性查询。

以下内容不得默认放入 Identity：

```text
Display Name
Offer
Availability
Profile social links
Commerce Relationship
Commerce Reputation
Wallet
Paid Order
```

Identity 对 Profile 的控制关系不等于 Profile-level public data 的合并，也不等于直接控制每个 Commerce Object 的所有运行时操作。

## 6. Commerce Profile-level Objects

以下对象默认由 Commerce Profile 锚定：

```text
Offer
Availability
Commerce Relationship
Profile-level Reputation
```

理由：这些对象描述的是一个对客户可见、可经营、可被外部平台分发的具体商业身份，而不是“这个主体是谁”的永久身份根。

同一 Identity 下的 Profile A 与 Profile B 默认可以完全独立拥有：

```text
Offers
Availability
Commerce Relationships
Reputation subject
```

Profile A 不因与 Profile B 共享 Identity 而自动继承、修改、合并或读取 Profile B 的商业对象。任何跨 Profile 访问都必须是显式授权或后续明确的组织/委托扩展，而不是 Identity 所有权的隐式副作用。

## 7. Offer Ownership

`Offer` 是统一 Product abstraction，`Service`、`Goods`、`Program`、`Membership`、`Project` 和 `Right` 是 Offer Types，而不是六套互相独立的顶层 domain。

正式边界：

```text
Offer owner      = Commerce Profile
Offer controller = authorized Profile controller
Offer anchor     = Commerce Profile ID
```

因此：

- Profile A 的 Offer 不可被 Profile B 直接继承；
- Profile archive 时，相关 Offer 不再可作为新的正常商业入口，但历史引用必须保留；
- Offer transfer 不属于当前默认能力，需要独立 Founder / Architecture Decision；
- 当前 `Service Offering.creatorId` 是 legacy provider reference，未来映射到 Commerce Profile anchor，而不是直接映射到 Identity ID；
- `creatorId` 的历史值必须保留用于 attribution 和兼容查询。

## 8. Capability Ownership

当前 `creator_capabilities` 与 `CommerceIdentity.capabilityIds` 混合了两层可能语义：个人拥有的能力，以及某个商业 Profile 对外提供的商业能力。

正式拆分方向：

```text
Identity Capability
    = subject-level skill / qualification reference

Profile Commercial Capability
    = Profile 对客户可提供的能力关联

Offer Capability Requirement
    = 某个 Offer 对能力的要求或声明
```

当前阶段不执行拆分。未来应避免把 Profile Commercial Capability 直接提升为 Identity-level shared asset。推荐的默认关系是：

```text
Identity
├── Commerce Profile A → commercial capabilities → Offer A
└── Commerce Profile B → commercial capabilities → Offer B
```

如果两个 Profile 确实引用同一主体能力，必须通过显式关联表达，而不是通过共享 `capabilityIds` 推断 Profile ownership。

## 9. Availability, Inventory and Reservation

正式区分：

```text
Availability = what can be sold or requested
Inventory    = scarce resource or capacity
Reservation  = temporary hold on inventory
```

### Availability

默认由 Profile / Offer context 锚定，表达客户可请求的时间、条件或容量。

### Inventory

是稀缺资源的独立 domain concern。它可以由 Profile 提供，也可以由多个 Offer 竞争同一资源。Time inventory 与 quantity/capacity inventory 可以共享统一 inventory abstraction，但其分配规则不应被 Calendar UI 决定。

### Reservation

是 Inventory 的临时占用机制，通常与 Request 或 Commitment workflow 交互。Reservation 不是自动等于 Commerce Commitment，也不是 Profile 的永久资产。其 controller 是 reservation / inventory policy；其历史仍需引用 Profile、Offer、Request 和资源。

Calendar UI 只是 Availability / Inventory 的表现层，不是最终 Product Domain object，也不应成为 ownership source of truth。

## 10. Commerce Commitment

Commerce Commitment 是 provider 与 customer 之间的商业承诺事实。它不是单纯 Provider Profile 的 child record，也不是单纯 Customer Identity 的资产。

候选关系：

```text
Provider Profile 1 ─── N Commerce Commitments
Customer subject 1 ─── N Commerce Commitments
Offer             1 ─── N Commerce Commitments
Commerce Commitment ─── 0..N Reservations
Commerce Commitment ─── 0..N Fulfillments
```

正式边界：

- Provider-side commercial owner 是 Provider Commerce Profile；
- Customer 是 Commitment 的参与方 / counterparty；
- Commitment 持有双方 subject references，而不是只保存一个 owner；
- 一个 Commitment 默认属于一个 Provider Profile，不跨多个 Profiles；
- archive 不删除 Commitment，历史状态和双方 attribution 必须保留；
- 多 Profile 合并、共同 Provider ownership 或跨 Profile Commitment 需要独立决策。

## 11. Request / CommerceAction

当前 `CommerceAction` / Request 更接近：

```text
Customer commercial intent
```

它拥有自己的生命周期，并可作为 Commitment initiation：

```text
Request → accepted / confirmed → Commerce Commitment
```

Request 在转换后仍应保留，作为原始意图和决策历史，不应因 Commitment 建立而删除或与其完全混同。

Request 需要一个明确的目标 Provider Profile；请求方应通过 Account / Actor / customer subject reference 表达。没有可识别的商业参与主体时，不应猜测归属。Request 的历史 attribution 至少包括 requester reference、target Profile、Offer、时间和状态事件。

## 12. Contract, Paid Order and Payment

候选架构关系：

```text
Commerce Commitment
   ├── Commercial / Legal Terms
   │       └── Contract
   ├── Payment Execution
   │       └── Paid Order
   │               └── Payment
   └── Fulfillment
```

- `Contract` 是 Commitment 的商业/法律条款表现，不是 Profile 本身。
- `Paid Order` 是 payment execution representation，不是新的商业主体。
- `Payment` 是执行事实，归金融/支付子系统，不归 Commerce Profile 所有。
- Settlement、Refund 和真实资金能力当前仍受项目治理阻断。
- 所有这些对象应通过 Commitment、Provider Profile、Customer reference 和 immutable event history 保持历史锚定。

当前 VS-01 / VS-02 中的 Contract、Paid Order 和本地商业模拟是验证证据，不能被解释为已完成的统一 Commitment domain model。

## 13. Fulfillment and Deliverable

建议的未来关系：

```text
Commerce Commitment
        ↓
Fulfillment
        ↓
Deliverable / Evidence
```

- Fulfillment 是 Commitment 的执行事实，可有多个阶段或记录；
- Deliverable 是履约产物或交付声明，可拥有不可变版本；
- Provider 可提交履约证据；Customer 可依据明确规则确认或提出异议；
- Fulfillment completion 是 Reputation eligibility 的重要证据；
- 当前若没有正式独立 Fulfillment object，则视为 `CURRENT = IMPLICIT`、`FUTURE = EXPLICIT DOMAIN OBJECT`；
- 历史履约必须可追溯到 Commitment、双方参与者和 Provider Profile。

## 14. Reputation

沿用冻结方向：

```text
Completed + Payment-confirmed Commerce Commitment
→ Reputation Eligibility
```

正式建议：

```text
Reputation owner / subject = Commerce Profile
Reviewer = authenticated eligible participant
Provenance = fulfilled Commerce Commitment
```

因此：

- Reputation 的对象是 Profile 的商业表现；
- Commitment 是 Reputation 的 provenance，不是 Reputation subject；
- External Platform Account 不是 PCI Reputation owner；
- 未购买者、未完成履约者和 synthetic/test commerce 不产生正常正式评价资格；
- Reputation 记录必须引用原 Commitment、eligibility evidence、reviewer reference 和时间；
- 编辑窗口、争议、删除、双向评价等仍需后续决策。

## 15. Commerce Relationship

正式保持：

```text
Commerce Profile
        ↓
Commerce Relationship
        ↓
External Platform Account
```

- Relationship 的 owner / commercial subject 是 Commerce Profile；
- Profile controller 管理 PCI 内部 Relationship 生命周期；
- External platform 控制平台账号事实，PCI 控制 relationship facts；
- Profile archive 后，relationship 不得被当作不存在，应进入受策略控制的 suspended/historical 状态；
- unbinding 不删除历史 Relationship；
- Platform Account 不是 Identity，也不拥有 Profile；
- 一个 Profile 可有多个平台账号，同一平台也可有多个账号；
- 当前 `socialLinks` 不能替代 Relationship。

## 16. Financial Objects

Financial objects 属于 Commerce Commitment execution / financial subsystem，不属于 Product Profile ownership 的简单扩展：

```text
Ledger Entry = append-only financial truth
Earning      = derived provider-facing projection
Wallet       = derived balance / availability projection
Withdrawal   = payout execution record
```

- Ledger 以来源事件、Commitment、Payment 和 Fulfillment references 建立事实；
- Earning 和 Wallet 是可重建 projection，不应成为 Ledger truth；
- Withdrawal 是执行记录，需引用 payout beneficiary、Wallet/Ledger facts 和 provider evidence；
- Profile 可以是 payee / commercial beneficiary context，但不因此拥有 Ledger truth 或自动拥有 Wallet；
- 当前 real-money、settlement 和 withdrawal 能力仍受治理边界约束，本 ADR 不授权任何实现。

## 17. Cross-Profile Isolation

正式不变量：

```text
Identity
├── Commerce Profile A
│   ├── Offer A
│   ├── Availability A
│   └── Commerce Relationship A
└── Commerce Profile B
    ├── Offer B
    ├── Availability B
    └── Commerce Relationship B
```

必须满足：

1. Profile A 默认不能修改 Profile B 的商业对象。
2. Identity 的上层控制不等于 Profile-level public data 的合并。
3. Archive Profile A 不得 archive Profile B。
4. Offer、Availability、Relationship 和 Reputation 不因共享 Identity 自动合并。
5. Profile-specific authorization 必须在未来实现中显式检查。
6. 共享主体能力只能通过显式 capability association 表达。
7. 跨 Profile transfer、merge、shared control 和 shared inventory 均不是默认能力。

## 18. Historical Attribution

统一历史事实模型：

```text
historical fact
= original actor/reference
  + identity anchor
  + profile anchor
  + object ID
  + event timestamp
```

不要求所有现有历史对象立即新增 Identity/Profile foreign key。兼容阶段可通过 ADR-002 的 deterministic mapping 重建，但以下对象在未来正式模型中应优先持久化明确的 Profile / participant references：

- Offer；
- Availability / Inventory；
- Request；
- Commerce Commitment；
- Contract；
- Fulfillment；
- Reputation。

Payment、Ledger、Earning 和 Withdrawal 应优先持久化其金融/执行引用，并保留 Commitment、Profile 和历史 legacy reference 的可追溯链。若无法确定 Profile attribution，必须 fail closed。

## 19. Architecture Debt Register

| Area | Current State | Future State | Blocking Stage | Required ADR / Resolution |
|---|---|---|---|---|
| Creator Identity | `CommerceIdentity` 兼容聚合，`creatorId` 混合 actor/owner/reference | Identity 与 Profile 分离 | Stage 2 | ADR-001、ADR-002 accepted 后设计 |
| Creator / Actor | Runtime context 与持久化 creator semantics 混合 | Actor 作为执行参与者，Account/Identity/Profile 显式分层 | Stage 2 | Authorization / actor context design |
| Commerce Profile | 当前由 `CommerceIdentity.profile` 候选表达 | 独立 Profile ownership/presentation anchor | Stage 2 | Profile data model ADR |
| Offer | `Service Offering` 以 `creatorId` 归属 | Profile-owned unified Offer | Stage 2 | Offer/Profile mapping design |
| Capability | `capabilityIds` 可能混合个人能力和商业能力 | Identity capability 与 Profile commercial capability 分层 | Stage 2 | Capability boundary ADR |
| Availability | Prototype availability / slots | Profile/Offer availability abstraction | Stage 2/5 | Inventory design ADR |
| Inventory | Reservation flow 中隐式表达 | 独立 scarce-resource abstraction | Stage 2/5 | Inventory and reservation ADR |
| Commerce Commitment | Request、Confirmation、Contract、Paid Order 分散 | 统一 Commitment 语义，保留具体执行对象 | Stage 2/5 | Commitment model ADR |
| Contract | 商业条款对象已存在但未统一到 Commitment | Commitment terms representation | Stage 2/5 | Terms/contract boundary design |
| Paid Order | 当前 payment execution / local simulation representation | Commitment-linked execution object | Future, blocked now | Payment architecture decision |
| Fulfillment | 当前部分为 implicit / observed evidence | Explicit Fulfillment and Deliverable | Stage 5 | Fulfillment ADR |
| Reputation | Product direction 已冻结，backend 不存在 | Profile subject + Commitment provenance | Future | Reputation policy/backend ADR |
| Commerce Relationship | 当前缺失，social links 仅为 metadata | Profile-owned relationship to external account | Stage 4 | External relationship ADR |
| Ledger / Earning / Withdrawal | 当前 prototype/financial evidence 分层不完整 | Ledger truth + derived projections + execution records | Future, blocked now | Financial architecture decisions |

## 20. Final Architecture Answers

```text
Identity Anchor
= Identity ID for subject continuity

Profile Anchor
= Commerce Profile ID for commercial presentation and provider-side objects

Commercial Owner
= Commerce Profile for Profile-scoped commercial objects

Controller
= explicitly authorized Account / Actor / workflow policy, not automatically the owner

Counterparty
= the other participant(s) in a Commerce Commitment

Representation Subject
= Commerce Profile for provider-facing commercial reputation and presentation
```

对 Commitment、Payment、Ledger 和 Fulfillment，不能只返回一个 owner：它们必须保留多方 participation、执行 controller 和历史 attribution。

## 21. Decision and Consequences

### Decision

本 ADR 提议以 Commerce Profile 作为 Provider-side Commerce Object 的默认商业 owner 与 presentation anchor，以 Identity 作为永久 subject continuity anchor，并将 Commitment、Payment、Fulfillment 和金融对象建模为带有多方参与及来源引用的事实或执行对象。

### Rationale

该边界满足 Product Direction 的 `1 Identity : N Commerce Profiles`，支持跨 Profile 隔离，保留历史商业事实，并避免将身份、展示、平台关系和金融事实混为一体。

### Consequences

- 后续 Stage 2 必须显式设计 Profile-level authorization 和 object ownership。
- 当前以 `creatorId` 为主的 prototype 需要兼容映射，不能静默重命名。
- Commitment、Fulfillment、Reputation 和金融对象需要独立的事实/执行边界。
- 同一 Identity 下多个 Profiles 的共享能力、共享库存和跨 Profile transfer 需要额外决策。

### Rejected Alternatives

- 所有 Commerce Objects 统一由 Identity 拥有；
- 所有对象统一由 Account 或 Actor 拥有；
- 把 Commerce Profile 仅作为展示 DTO；
- 把 Request、Contract、Paid Order、Fulfillment 直接合并为单一对象；
- 把 Wallet 或 Ledger truth 直接放进 Profile；
- 把 `socialLinks` 当作 External Platform Account；
- 以 Profile 归档替代历史对象保留。

## 22. Status and Approval Boundary

```text
STATUS = PROPOSED
```

本 ADR 不声称已被 Main Control / Founder 接受。即使未来接受，也不自动授权 Stage 2 implementation、Commerce ID、Platform Binding、Reputation 或 Payment。

## 23. Current Project State

```text
PRODUCT_DIRECTION = FROZEN_V1
PRODUCT_STAGE = STAGE_0
STAGE_2_IMPLEMENTATION = NOT_AUTHORIZED
PROJECT_STATUS = SUSPENDED
REAL_MONEY_ENABLED = false
apps/app = DEFERRED
```
