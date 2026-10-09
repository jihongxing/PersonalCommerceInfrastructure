# ADR-005 — Commerce Commitment Composition and Lifecycle

> **状态**：PROPOSED  
> **决策范围**：Commerce Commitment、Request、Reservation、Contract、Paid Order、Payment、Fulfillment、Cancellation、Reschedule 与 Amendment 的领域关系和生命周期  
> **上游**：Product Direction FROZEN_V1、ADR-001、ADR-002、ADR-003、ADR-004  
> **实现授权**：本 ADR 不授权 Stage 2 implementation

## 1. Context and Scope

当前 Prototype 已验证 Customer Request、Reservation、Contract Commerce、Paid Commerce 与 Fulfillment-related evidence，但这些对象不能被误认为同一个商业本体。

本 ADR 冻结以下产品/领域语义：

```text
Request
= Customer Intent

Reservation
= Inventory Resource Lock

Commerce Commitment
= Bilateral Commercial Commitment

Contract
= Commercial / Legal Representation of Commitment

Paid Order
= Payment Execution Representation

Payment
= Financial Execution Fact

Fulfillment
= Performance / Delivery Fact
```

统一抽象不意味着将这些对象物理合并为一个巨大 aggregate。本 ADR 只定义未来组合方式、生命周期和历史边界，不修改 production code、schema、API、migration 或 payment runtime。

## 2. Commerce Commitment Definition

Commerce Commitment 是 Provider 与 Customer 就某一 Commerce Offer 达成的、可追溯的双边商业承诺事实。

它至少包含或引用：

```text
Provider Commerce Profile
Customer Subject
Offer
Committed Terms
Commitment Status
Relevant Inventory References
Commitment Timestamps
Historical Attribution
```

正式区分：

```text
Commitment ≠ Offer
Commitment ≠ Request
Commitment ≠ Reservation
Commitment ≠ Contract
Commitment ≠ Paid Order
Commitment ≠ Payment
Commitment ≠ Fulfillment
```

Commitment 是这些相关对象围绕的商业关系与生命周期主线，但不取代它们各自的事实来源。

## 3. Parties and Cardinality

当前正式模型：

```text
Provider Commerce Profile 1 ─── N Commerce Commitments
Customer Subject          1 ─── N Commerce Commitments
Offer                     1 ─── N Commerce Commitments
Commerce Commitment       1 ─── 0..N Reservations
Commerce Commitment       1 ─── 0..N Contracts / Terms Versions
Commerce Commitment       1 ─── 0..N Payment Executions
Commerce Commitment       1 ─── 0..N Fulfillments
```

每个 Commitment 必须有：

```text
one Provider Commerce Profile
one Customer Subject
one Offer reference
```

当前限制：

```text
CURRENT = single provider + single customer
FUTURE  = explicit multi-party / multi-provider extension point
```

不得在当前阶段把多 Provider、多个 Customer、split fulfillment 或跨 Profile commitment 作为默认 runtime。

## 4. Request Lifecycle

当前 `CommerceAction` 状态：

```text
draft → submitted → confirmed / declined
```

推荐的未来 Request lifecycle：

```text
DRAFT
→ REQUESTED
→ ACCEPTED
→ COMMITTED

REQUESTED
→ DECLINED
→ WITHDRAWN
→ EXPIRED
```

其中 `COMMITTED` 表示 Request 已被某个 Commitment 引用或消化，不表示 Request 被删除。

规则：

- Request 默认针对一个 Offer。
- Request 可包含期望时间、条件或商业说明，但 Availability / Inventory allocation 仍由后续 policy 决定。
- Request 不一定必须预先指定一个 Availability；某些 Offer 可以由 Provider 后续提出可用条件。
- Request 可以触发 Reservation Hold，但不会因为被提交或接受而自动保证 Reservation 存在。
- Request 被接受时可以形成 Commitment，也可以先进入条款、库存或合同协商；具体流程必须显式记录。
- Request Decline、Withdraw、Expire 都保留历史。
- Request Withdrawal 是 Customer 撤回意图；它不等于 Commitment Cancellation。

当前 `CommerceAction.confirmed` 是 Prototype-specific acceptance signal，不能直接等同为未来 Commitment `CONFIRMED`。

## 5. Commitment Lifecycle

推荐的正式 Commitment lifecycle：

```text
PENDING
→ CONFIRMED
→ ACTIVE
→ FULFILLING
→ FULFILLED
→ CLOSED

PENDING / CONFIRMED / ACTIVE / FULFILLING
→ CANCELLED

ACTIVE / FULFILLING / FULFILLED
→ DISPUTED

DISPUTED
→ ACTIVE / FULFILLED / CANCELLED / CLOSED
```

语义：

| State | Meaning |
|---|---|
| `PENDING` | Commitment candidate 已形成，但仍等待必需的确认条件，例如库存、条款或支付前置条件。 |
| `CONFIRMED` | 双边商业承诺已成立；其条件满足必须由独立事实证明。 |
| `ACTIVE` | 可执行但尚未开始履约。 |
| `FULFILLING` | 履约正在进行。 |
| `FULFILLED` | 履约事实已完成，等待关闭、争议窗口或必要后续步骤。 |
| `CANCELLED` | Commitment 被有效取消，保留完整历史。 |
| `DISPUTED` | 存在需处理的争议，不自动抹除既有事实。 |
| `CLOSED` | 生命周期终态，商业事实和证据保留。 |

以下事件必须独立审计：

```text
Commitment Confirmation
Reservation Confirmation
Contract Acceptance
Payment Confirmation
```

它们可以共同构成 `Commitment CONFIRMED` 的前置条件，但绝不是同一事件。

## 6. Composition Options and Recommendation

### Option A — Reservation before Commitment

```text
Offer
   ↓
Availability
   ↓
Request
   ↓
Reservation Hold
   ↓
Commerce Commitment
   ↓
Reservation Confirmation
   ↓
Contract / Terms
   ↓
Payment
   ↓
Fulfillment
```

优势：

- 对 Time Inventory 有更强的并发和 overbooking 防护；
- Hold 有明确 TTL，可释放未完成客户意图；
- 在 Commitment 形成前可证明资源可分配；
- 对历史 Attribution 的 Request、Reservation、Commitment 边界清晰。

风险：

- 需要处理 Hold 到期、取消、库存竞争及形成 Commitment 失败时的释放。

### Option B — Commitment before Reservation

```text
Offer
   ↓
Request
   ↓
Commerce Commitment
   ↓
Reservation
   ↓
Contract
   ↓
Payment
   ↓
Fulfillment
```

风险：

- 可以先产生无法兑现的 Commitment；
- 在有限 Time Inventory 中较难避免 overbooking；
- 必须依赖补偿性取消与复杂 rollback。

### Recommended Composition

对当前 Dancer / Time Inventory wedge，采用 Option A：

```text
Request
   ↓
short-lived Reservation Hold
   ↓
Commitment formation
   ↓
independent confirmations
   ├── Reservation confirmed
   ├── Terms / Contract accepted when required
   └── Payment confirmed when required
   ↓
Commitment confirmed / active
   ↓
Fulfillment
```

这只是在资源敏感场景下的默认组合，不要求所有未来 Offer 都必须有 Reservation、Contract 或 Payment。

## 7. Reservation Interaction

沿用 ADR-004：

```text
Reservation CONFIRMED
≠
Commitment CONFIRMED
```

Reservation 提供：

- resource hold；
- inventory allocation；
- expiration；
- availability evidence；
- allocation history。

Commitment 提供：

- bilateral commercial intent；
- agreed terms；
- Provider / Customer relationship；
- fulfillment obligation；
- cancellation semantics。

正式关系：

```text
Commerce Commitment
    └── 0..N Reservations
```

理由：

- 一个 Commitment 可以无需稀缺资源；
- 一个 Commitment 可以在改期、分段履约或不同资源阶段中引用多个 Reservation facts；
- Reservation 必须保持独立历史，不应被 Commitment state 覆盖。

## 8. Contract Boundary

当前 Contract 已有：

```text
Contract
├── Scope Version
├── Acceptance Fact
├── Commercial Terms
└── Contract State
```

未来正式定位：

```text
Commerce Commitment
    └── Contract Representation
          ├── Scope Version
          ├── Commercial Terms
          ├── Acceptance Facts
          └── Amendments
```

Contract 是 attached representation / versioned terms record，不是 Commitment 本身。

当前 Contract lifecycle：

```text
draft → proposed → accepted → contracted
proposed → rejected / expired
accepted / contracted → cancelled
```

结论：

- Contract 在需要明确可接受条款或法律/商业记录时创建。
- Contract acceptance 不自动等于 Commitment confirmation；其只是其中一个独立证明事实。
- Contract rejection 阻止基于该版本的条款形成对应 Commitment confirmation，但不删除 Request、Reservation 或历史 Contract。
- Amendment 生成新的 Scope Version / terms history，不重写旧版本。
- `contracted` 与当前 `orderId` 的关联是现有 Prototype 的 implementation composition，不能被直接重命名为 Commitment ID。
- 当前 active terms 必须可识别，但旧 terms 与 acceptance facts 必须不可变保留。

## 9. Paid Order and Payment Boundary

候选关系：

```text
Commerce Commitment
    ↓
Payment Requirement / Intent when applicable
    ↓
Paid Order
    ↓
Payment Execution
```

正式判断：

- Paid Order 是 payment execution representation，可引用 Request、Reservation、Contract 和未来 Commitment。
- Payment 是独立金融执行事实，必须有 provider evidence / controlled evidence。
- Commitment 可以在 payment-optional 或线下结算的 future Offer 中成立，因此 Paid Order 不一定存在。
- 对 payment-required Offer，Payment confirmation 可以是 Commitment confirmation 或 active 的必要条件，但这个 policy 必须由 Offer / Commitment terms 明确。
- Payment failure 不自动删除 Commitment；它可能阻止 confirmation、触发 pending/cancellation policy，或保留等待重试的状态。
- Refund、Chargeback 与 Settlement 是金融执行或争议事实；它们可以影响 Commitment 状态与 Reputation eligibility，但不重写历史 Commitment。
- Settlement 不属于 Commitment domain，属于 Financial Subsystem。

当前：

```text
REAL_MONEY_ENABLED = false
```

任何 Payment、Settlement、Refund 或 Provider 行为在本 ADR 中都只是语义设计，不构成实现授权。

## 10. Fulfillment Boundary

正式定义：

```text
Fulfillment = performance / delivery fact
```

正式关系：

```text
Commerce Commitment
    └── 0..N Fulfillments
```

理由：

- 部分履约、分阶段履约、重新履约和失败尝试均可能发生；
- 一个 Commitment 可以尚未有 Fulfillment；
- Fulfillment 不是 Payment 状态的别名；
- Fulfillment evidence 必须可追溯。

未来 Fulfillment 应支持：

```text
pending
in_progress
fulfilled
partially_fulfilled
failed
disputed
```

当前 Prototype 中的 `fulfillment_observed`、no-show 与 `RecordFulfillment` 等为 execution evidence / validation signals，不能误解释为已完成的正式 Fulfillment aggregate。

Provider 可提交 Fulfillment evidence；Customer 可按后续 policy 确认、质疑或触发 dispute。Completion timestamp、evidence references 与 Commitment linkage 都是必要历史事实。

## 11. Reputation Link

沿用 Product Direction 与 ADR-003：

```text
Completed + Payment-confirmed Commerce Commitment
→ Reputation Eligibility
```

推荐证据链：

```text
Commerce Commitment
   ↓
Fulfillment Completion
   ↓
Payment Confirmation when required
   ↓
Eligibility Evidence
   ↓
Reputation
```

以下均不足以产生正式评价资格：

```text
Request alone
Reservation alone
Payment alone
```

Reputation subject 仍是 Commerce Profile；Commitment 是 provenance。

## 12. Cancellation

必须分别表达以下不同事实：

| Fact | Initiator | Primary Effect | Inventory Effect | Historical Handling |
|---|---|---|---|---|
| Request Withdrawal | Customer / requester | Withdraws customer intent | Releases Hold only if policy links one | Preserve immutable request event |
| Reservation Cancellation | Provider, Customer or policy | Releases temporary/confirmed allocation according to rules | Release or reallocate resource | Preserve reservation event/history |
| Commitment Cancellation | Provider, Customer or policy | Terminates future commercial obligation | Coordinates release of future inventory | Preserve commitment and cancellation event |
| Contract Termination | Contracting party / policy | Ends or supersedes a terms representation | Does not itself erase Commitment | Preserve versions and acceptance facts |
| Payment Refund | Financial policy / provider | Reverses financial execution | May affect eligibility / settlement | Preserve payment and refund facts |
| Fulfillment Failure | Provider, Customer, evidence or policy | Records failed or incomplete performance | May cause dispute/cancellation policy | Preserve performance evidence |

正式约束：

```text
Reservation cancellation does not automatically delete Commitment.
Commitment cancellation does not erase historical Commitment.
```

只有一个有效、已完成且满足支付条件的 Commitment 才能产生正常 Reputation eligibility；Cancellation、Refund、Failure 与 Dispute 的效果必须通过后续 policy 决定，不能从单一状态推断。

## 13. Reschedule and Amendment

正式区分：

```text
Reschedule
= Inventory allocation change

Amendment
= Commercial Commitment terms change
```

时间变化的处理：

- 如果只是尚未形成 Commitment 的 Hold 资源变化，则为 Reservation / Inventory operation。
- 如果时间已是 Commitment 的 agreed term，则应产生 Commitment amendment。
- 如果 Contract 记录该时间或相关条款，必须产生新的 Contract Scope Version 或等效 immutable terms history。
- Price、scope、deliverables、cancellation terms 或 customer requirements 变化属于 Amendment，不得仅通过 Reservation reschedule 隐式完成。

所有 Reschedule 与 Amendment 必须保留：

```text
previous fact
new fact
actor
timestamp
reason / policy reference when required
```

历史 Commitment facts 不得被 current state 覆盖。

## 14. Commitment Historical Model

Commerce Commitment 采用：

```text
Current State
+
Immutable Event / History Facts
```

必须可表达：

```text
Request received
Reservation created
Reservation confirmed
Commitment formed
Terms agreed
Contract accepted
Payment confirmed
Fulfillment started
Fulfillment completed
Cancellation
Reschedule
Amendment
Dispute
Closure
```

不要求单个 object 保存全部事件，但每个事件必须能被可靠关联到对应 Request、Reservation、Commitment、Contract、Payment 或 Fulfillment object。

历史归属至少包含：

```text
original actor/reference
Provider Profile anchor
Customer subject reference
Offer reference
object ID
event timestamp
legacy creatorId where applicable
```

ADR-002 的 deterministic compatibility mapping 可用于旧数据重建；映射缺失、冲突或歧义时必须 fail closed。

## 15. Commerce Commitment vs Current Objects

| Current Object | Product Meaning | Future Role | Must Survive? |
|---|---|---|---|
| `CommerceAction` | Customer request / intent | Request | YES |
| `Reservation` | Inventory hold | Reservation | YES |
| `Contract` | Terms / legal record | Commitment representation | YES |
| `PaidServiceOrder` | Payment execution representation | Paid Order | YES |
| `Payment` | Financial execution fact | Payment | YES |
| Fulfillment evidence / observation | Performance evidence | Fulfillment | YES |
| Ledger Entry | Financial truth | Ledger | YES |
| Earning | Financial projection | Derived projection | YES / REBUILDABLE |

Future Commitment abstraction 不意味着删除上述对象。

## 16. Current Prototype Mapping

当前主要依赖：

```text
CommerceAction
    → creatorId / customerId / offeringId

Reservation
    → creatorId / customerId / offeringId / availabilitySlotId
    → optional orderId

Contract
    → commerceActionId / creatorId / buyerId / offeringId
    → optional orderId

PaidServiceOrder
    → commerceActionId OR reservationId
    → optional contractId
    → creatorId / customerId / offeringId

Fulfillment evidence
    → orderId or reservation-linked order context
```

分类：

- `creatorId`、`customerId`、`offeringId` 是当前 Prototype / legacy attribution references，必须保留历史语义，不能直接重命名。
- `Reservation.orderId`、`Contract.orderId` 与 `PaidServiceOrder` 的连接是 Prototype composition reference，可保留为历史引用，但未来需由明确 Commitment ID 统一关联。
- `commerceActionId` 与 `reservationId` 作为 Paid Order 的单一来源约束，反映当前 flow 的实现选择，不是未来 Commitment composition 的完整限制。
- `contractId` 是 terms representation reference，不应被重新解释为 Commitment ID。
- 当前尚无正式 Commitment ID；不得将任一现有 ID 静默升级为 Commitment ID。

## 17. Multi-Profile Isolation

正式模型：

```text
Identity
├── Profile A
│      └── Commitments A
└── Profile B
       └── Commitments B
```

默认规则：

1. Profile A 不创建或修改 Profile B 的 Commitments。
2. 每个 Commitment 默认只属于一个 Provider Profile。
3. 同一 Identity 的多个 Profiles 不自动共享商业承诺、条款、库存或 Reputation。
4. Customer 可以参与多个 Profiles 的独立 Commitments。
5. 跨 Profile Commitment、multi-provider commitment 和 shared fulfillment 都是显式 Future capability。

## 18. Invariants

1. Request does not equal Commitment.
2. Reservation does not equal Commitment.
3. Contract does not equal Commitment.
4. Paid Order does not equal Commitment.
5. Payment does not equal Commitment.
6. Fulfillment does not equal Commitment.
7. Commitment must have Provider and Customer references.
8. Commitment must be traceable to an Offer.
9. Reservation confirmation and Commitment confirmation are independently auditable.
10. Historical Commitment facts are immutable.
11. Cancellation does not erase historical Commitment.
12. Reputation eligibility is derived from completed qualifying Commitment.
13. Payment failure does not silently create a fulfilled Commitment.
14. Reservation expiration cannot silently become Commitment.
15. Profile A cannot create or mutate Profile B Commitments.
16. Contract terms changes require immutable version/amendment history.
17. Financial execution facts do not replace commercial facts.
18. Missing or ambiguous legacy attribution fails closed.

## 19. Architecture Debt

| Area | Impact | Priority | Blocking Stage | Follow-up ADR / Design |
|---|---|---|---|---|
| Commitment Core | 当前没有正式 Commitment aggregate | P0 | Stage 2 | Commitment data model ADR |
| Request / Commitment boundary | `CommerceAction.confirmed` 容易与 Commitment confirmation 混淆 | P0 | Stage 2 | Request transition design |
| Reservation / Commitment boundary | 当前 Reservation confirmation 会关联 Order | P0 | Stage 2 | Reservation orchestration design |
| Contract / Commitment boundary | Contract 直接依赖 `commerceActionId` | High | Stage 2 | Terms and contract attachment design |
| Paid Order / Payment boundary | Paid Order 可源自 Action 或 Reservation | High | Future, blocked now | Payment execution architecture |
| Fulfillment boundary | 当前主要是 evidence / observed signals | High | Stage 5 | Fulfillment aggregate ADR |
| Cancellation semantics | 多种取消事实尚未统一 policy | High | Stage 2/5 | Cancellation and dispute policy ADR |
| Amendment / Reschedule semantics | Scope Version 与 Reservation history 未统一 | High | Stage 2/5 | Amendment / reschedule design |
| Commitment event history | Canonical events 尚非完整 Commitment history | P0 | Stage 2 | Event / audit model design |
| Multi-party extension | 仅适合 single provider + customer | Medium | Future | Multi-party commitment ADR |

## 20. Decision and Consequences

### Decision

本 ADR 提议以 Commerce Commitment 作为 Provider Profile 与 Customer Subject 的双边商业承诺主线；Request、Reservation、Contract、Paid Order、Payment 和 Fulfillment 保持独立对象，并通过明确 references 与 immutable history composition。

对于当前 Time Inventory wedge，推荐 Request → short-lived Reservation Hold → Commitment formation → independent confirmations → Fulfillment 的组合。

### Rationale

该模型保留了当前 Prototype 已验证对象的历史价值，降低把资源锁、条款、支付和履约误当成同一商业事实的风险，并允许 Future Offer 在不需要 Contract、Payment 或 Reservation 时仍表达 Commitment。

### Consequences

- Stage 2 data model 必须为 Commitment 与现有对象提供兼容 references。
- 现有 `creatorId`、`orderId`、`commerceActionId`、`reservationId` 与 `contractId` 不可被静默重解释。
- 需要单独设计 Commitment formation、confirmation policy、cancellation、amendment 与 event history。
- Payment、Settlement、Refund、Reputation 与 Platform Binding 仍需独立 Future architecture / authorization。

### Rejected Alternatives

- 将 Request、Reservation、Contract、Order、Payment、Fulfillment 合并成单一对象；
- 把 Reservation confirmation 当作 Commitment confirmation；
- 把 Contract acceptance 当作唯一 Commitment formation 事实；
- 把 Payment confirmation 当作 Fulfillment；
- 因 Payment failure 或 Reservation expiration 删除历史 Request / Commitment；
- 用当前 `orderId`、`contractId` 或 `commerceActionId` 直接充当未来 Commitment ID；
- 将同一 Identity 下多个 Profiles 的 Commitments 自动合并。

## 21. Status and Approval Boundary

```text
STATUS = PROPOSED
```

本 ADR 不声称已被 Main Control / Founder 接受。即使未来被接受，也不自动授权 Stage 2 implementation、Payment、Settlement、Commerce ID、Platform Binding 或 Reputation implementation。

## 22. Current Project State

```text
PRODUCT_DIRECTION = FROZEN_V1
PRODUCT_STAGE = STAGE_0
STAGE_2_READINESS = READY_WITH_CONDITIONS
STAGE_2_IMPLEMENTATION = NOT_AUTHORIZED
PROJECT_STATUS = SUSPENDED
REAL_MONEY_ENABLED = false
apps/app = DEFERRED
```
