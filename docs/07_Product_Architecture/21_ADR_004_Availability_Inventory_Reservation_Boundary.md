# ADR-004 — Availability, Inventory and Reservation Boundary

> **状态**：PROPOSED  
> **决策范围**：Availability、Inventory、Capacity、Time Inventory、Reservation、Calendar 与 Commerce Commitment 的产品及领域边界  
> **上游**：Product Direction FROZEN_V1、ADR-001、ADR-002、ADR-003  
> **实现授权**：本 ADR 不授权 Stage 2 实现

## 1. Context and Scope

PCI 的核心可售能力不是一个 Calendar 页面，也不是单个 `AvailabilitySlot`。必须区分：

```text
Calendar       = presentation / planning interface
Availability   = what can be requested or sold
Inventory      = scarce resource
Reservation    = temporary resource hold
Commitment     = bilateral commercial commitment
```

当前 Prototype 以 `Service Offering`、`AvailabilitySlot` 和 `Reservation` 验证 Creator Commerce Golden Path。本 ADR 只完成领域架构设计，不修改代码、schema、API、migration、Reservation runtime 或 Commitment runtime。

## 2. Definitions

| Term | Product Meaning | Domain Meaning | Owner / Anchor | Source of Truth | Lifecycle |
|---|---|---|---|---|---|
| Calendar | 用户查看和规划可用时间的界面 | Availability / Inventory 的 projection 与编辑入口 | Profile UI / shared infrastructure | Availability and Inventory, not UI | View / edit session |
| Availability | 什么可以被请求、购买或承诺的商业条件 | Schedule、requestability、eligibility、capacity constraint 与 Offer relationship | Commerce Profile + Offer context | PCI Availability model | Draft / scheduled / open / closed / archived |
| Inventory | 可被竞争、占用或消耗的稀缺资源 | Resource allocation boundary | Profile、资源 owner 或显式 shared resource | PCI Inventory model | Available / held / consumed / released / retired |
| Capacity | 同时可承接的有限数量 | Inventory constraint or quantity dimension | Inventory resource | Inventory model | Open / reduced / exhausted / released |
| Time Inventory | Provider-controlled finite time interval | 可被 Reservation 占用的时间资源 | Commerce Profile or explicit shared resource | Time Inventory model | Available / held / consumed / released / blocked |
| Quantity Inventory | 有限可交付单位 | Goods 或可计数资源的数量 | Offer / Profile / resource owner | Quantity Inventory model | Available / held / consumed / released |
| Reservation | 对 Inventory 的临时 hold | 带 TTL、状态转换和资源引用的事实 | Reservation aggregate | Reservation subsystem | Held / confirmed / cancelled / expired |
| Commerce Commitment | Provider 与 Customer 的商业承诺 | 双边商业事实，包含 Terms、参与方和履约关系 | Commitment participants, Provider Profile as commercial context | Commitment model | Requested / confirmed / fulfilled / cancelled |

## 3. Calendar Boundary

正式采用：

```text
Calendar UI ≠ Availability ≠ Inventory
```

Calendar 是表现和规划接口，不是 Source of Truth。

- Calendar 可以编辑 Availability，但变更必须通过 Availability domain policy。
- Calendar 可以发起创建或修改 Reservation 的操作，但不直接拥有 Reservation。
- Calendar 可以显示 Commitment 对资源的影响，但不定义 Commitment lifecycle。
- Calendar 可以属于 Commerce Profile UI，也可以作为跨 Profile 的通用 infrastructure view；这不改变对象 ownership。
- Calendar 不得成为领域根对象。

## 4. Availability

Availability 是“什么可以被请求/购买/承诺”的商业可用条件，不是资源本身。

至少包含以下语义：

```text
Schedule
Open / Closed
Start / End
Eligibility
Offer relationship
Capacity constraint
Requestability
```

默认边界：

```text
Availability anchor = Commerce Profile + Offer context
Availability owner  = Profile / Offer controller
```

规则：

- 一个 Offer 可以引用多个 Availability records 或 Availability sets。
- 一个 Availability set 可以在明确的同一 Profile 资源规则下服务多个 Offers。
- 一个 Profile 可以有多个独立 Availability sets。
- Availability 不应被默认视为独立资源 owner。
- Availability 替换不会重写已发生的 Reservation 或 Commitment 历史。
- Availability archive / close 阻止新的正常请求，但不删除历史对象。
- Availability 的开放状态不保证资源一定仍可用，最终必须经过 Inventory allocation。

## 5. Inventory

正式定义：

```text
Inventory = scarce resource
```

统一产品抽象：

```text
Inventory
├── Time
├── Quantity
└── Capacity
```

但这不要求三者使用完全相同的 runtime implementation。

### Time Inventory

```text
Time Inventory
= finite provider-controlled time resource
```

当前 Dancer wedge 中，Time Inventory 是主要验证方向。它必须支持未来的：

- timezone-aware intervals；
- recurring availability；
- exceptions；
- blackout periods；
- overlapping reservation policy；
- capacity；
- concurrency control。

默认 owner 是 Provider Commerce Profile 或 Profile 显式控制的资源集合，不是 Identity 根。

### Quantity Inventory

```text
Quantity = finite units
```

适用于 Goods 或其他可计数、可消耗的 Offer 资源。

### Capacity

```text
Capacity = finite simultaneous participants
```

Capacity 是资源约束维度，不必被强行建模成与 Time Resource 相同的实体。Program、Membership 和多人活动可以使用 Capacity Inventory，但其资格、并发和消耗规则需要后续 Offer-specific design。

Project 与 Right 可能使用时间、数量、容量或资格限制的组合，不能在当前阶段提前冻结为一种单一库存实现。

## 6. Shared Inventory

正式允许以下未来关系：

```text
Inventory Resource
        ↑
Offer A
Offer B
Offer C
```

同一 Commerce Profile 下的多个 Offers 可以竞争同一 Inventory Resource。例如，一个舞蹈课程和一个摄影服务都占用同一个 Tuesday 15:00–16:00 时间资源时，Inventory allocation 必须阻止超过定义 Capacity 的重复出售。

默认规则：

- Profile A 不得使用 Profile B 的 Inventory。
- 同一 Identity 下的不同 Profiles 也不得自动共享 Inventory。
- Shared Inventory 必须显式建模 resource ownership、controller、participants 和 allocation policy。
- `Offer → private AvailabilitySlot` 只能视为当前 Prototype 的简化，不是未来 Product Direction 的最终限制。
- Profile archive 后，其 Inventory 不得产生新的 Inventory-backed Commitment。
- 已存在的 Reservation、Commitment 和历史资源消耗必须保留。

## 7. Reservation

正式定义：

```text
Reservation = temporary inventory hold
```

Reservation owns：

- hold；
- expiration；
- confirm；
- cancel；
- reschedule metadata；
- reservation evidence；
- 对 Inventory 的临时占用引用。

Reservation does not own：

```text
commercial terms
customer/provider commitment
payment
reputation
fulfillment
```

Reservation 的主要 Controller 是 Reservation / Inventory policy；Provider 或 Customer 可以根据授权触发操作，但不能因此成为所有 Reservation facts 的唯一 owner。

推荐交互：

```text
Request
    ↓
Reservation Hold
    ↓
Commitment Formation / Confirmation
    ↓
Reservation Confirmation
```

Reservation 可以在 Commitment 形成前作为短期资源保护，也可以在 Commitment 形成时作为资源约束。但 Reservation 本身不产生商业条款。

## 8. Hold / Confirm / Expire / Cancel

当前 Prototype 状态：

```text
held
confirmed
cancelled
expired
```

未来产品语义：

| State | Product Meaning | Resource Meaning | Commitment Meaning |
|---|---|---|---|
| `HELD` | 客户意图已取得临时资源保护 | Resource temporarily allocated with TTL | 尚未自动形成完整 Commitment |
| `CONFIRMED` | Reservation 通过业务规则确认 | Resource allocation confirmed | 可以与 Commitment confirmation 关联，但不等同 |
| `CANCELLED` | Hold 或 confirmed reservation 被撤销 | Resource released according to policy | 不自动删除或否定既有 Commitment history |
| `EXPIRED` | TTL 到期且未及时确认 | Resource released / made available | 不得静默转为 Commitment |

正式结论：

```text
Reservation CONFIRMED ≠ Commerce Commitment CONFIRMED
```

两者可以由同一业务流程协调，但必须保留独立事实和事件。

## 9. Reschedule

`Reschedule` 是多个对象协同操作：

```text
Reservation operation
+ Inventory reallocation
+ possible Commitment mutation
```

修改时间库存不一定意味着修改全部 Commerce Commitment 语义，但如果 Commitment 的履约时间属于其商业条款，则必须产生显式 Commitment amendment / event。

当前 Prototype 已保留：

- 原 Availability Slot ID；
- 新 Availability Slot ID；
- reschedule timestamp；
- actor；
- `rescheduleHistory`。

未来必须保证：

- 旧 Reservation fact 不被覆盖；
- 新旧资源 allocation 可审计；
- Commitment 是否被修改有独立历史事件；
- 失败的 reschedule 不得留下部分资源占用；
- Customer、Provider 和 Inventory policy 的授权边界明确。

## 10. Availability / Inventory Relationship

推荐关系：

```text
Offer
   ↓
Availability
   ↓ references / exposes
Inventory
   ↓ allocates
Reservation
```

因此：

- Availability 暴露可请求条件；
- Inventory 提供真正的稀缺资源；
- Reservation 锁定 Inventory，而不是锁定抽象 Availability 本身；
- Availability 可以因 Inventory exhausted 而暂时不可请求；
- Inventory 可以存在而没有当前对外开放的 Availability；
- Calendar 只是对上述对象的 projection。

## 11. Commerce Commitment Interaction

候选流程比较：

### Option A — Reservation before Commitment

```text
Offer
   ↓
Availability
   ↓
Request
   ↓
Reservation / Hold
   ↓
Commerce Commitment
   ↓
Reservation Confirm
   ↓
Fulfillment
```

优点：

- 适合有限 Time Inventory；
- 可在 Commitment 形成前防止竞争者同时占用资源；
- Hold expiration 可释放未完成意图。

风险：

- 需要明确 Hold TTL、取消、失败回滚和孤儿 Reservation。

### Option B — Commitment before Reservation

```text
Offer
   ↓
Request
   ↓
Commerce Commitment
   ↓
Reservation
```

风险：

- Commitment 可能先成立，但资源分配失败；
- 容易产生 overbooking 或需要补偿性取消；
- 对 Time Inventory 的一致性更难表达。

### Recommended Lifecycle

推荐 Option A 作为当前 Dancer / Time Inventory 的默认方向：

```text
Request
   ↓
short-lived Reservation Hold
   ↓
Commitment formation / confirmation
   ↓
Reservation confirmation
   ↓
Fulfillment
```

但该顺序不是将 Reservation 和 Commitment 合并。必须通过原子性资源检查、明确失败补偿和独立事件保持一致性。

## 12. Customer Intent vs Resource Lock

严格区分：

```text
Request
       = customer intent
Reservation
       = resource lock
Commerce Commitment
       = bilateral commercial commitment
```

以下推断均不成立：

```text
Request accepted       ⇒ Reservation automatically exists
Reservation confirmed  ⇒ all Commitment semantics exist
```

Provider 接受 Request 可以触发 Reservation 或 Commitment workflow，但最终状态必须由各自 domain facts 表达。

## 13. Profile Isolation

正式采用：

```text
Identity
├── Profile A
│   └── Inventory A
└── Profile B
    └── Inventory B
```

规则：

1. Profile A 默认不能消费 Profile B 的 Inventory。
2. 同一 Identity 的上层控制权不等于跨 Profile Inventory ownership。
3. Shared Inventory 必须显式表达，不得由 Identity 关系隐式推断。
4. Profile archive 阻止新的 Inventory-backed Commitment。
5. Profile-specific authorization 必须在未来实现中明确检查。

## 14. Historical Attribution

历史记录必须区分：

```text
planned
opened
held
confirmed
consumed
cancelled
expired
rescheduled
archived
```

### Availability History

记录 Availability 的计划、开放、关闭、替换和归档事实。修改 Availability 不得重写既有 Reservation 或 Commitment。

### Inventory Reservation History

记录资源被 hold、释放、确认、消耗和重排的事件。Reservation history 必须保留原始资源与时间段。

### Commitment History

记录 Request、Commitment formation、条款变化、取消、履约和完成事件。Reservation 事件只能作为资源证据，不能替代 Commitment history。

统一历史事实至少包含：

```text
original actor/reference
identity anchor
profile anchor
object ID
event timestamp
event type
```

如果旧 Prototype 尚未持久化全部新锚点，可以使用 ADR-002 的 deterministic compatibility mapping 重建；无法确定时必须 fail closed。

## 15. Prototype Mapping

| Current Prototype | Future Product Object | Future Domain Object | Current Limitation | Migration / Replacement Impact |
|---|---|---|---|---|
| `RequestableAvailability` | Availability | Availability policy / Offer relationship | 只有描述文本，缺少正式 schedule、capacity 和 inventory reference | 未来需从 description 迁移为结构化 Availability |
| `AvailabilitySlot` | Time Availability + Time Inventory reference | Availability / Inventory allocation | 直接保存 `creatorId`、`offeringId`，capacity 固定为 `1` | 不能直接冻结为最终 Inventory model |
| `Reservation` | Reservation | Temporary Inventory Hold | 同时保存 Creator、Customer、Offer、Slot 和可选 `orderId` | 未来需与 Commitment、Inventory 和 Profile anchor 解耦 |
| `held` | Reservation Hold | TTL-bound reservation state | 资源和意图关联存在，但 Commitment 语义未分离 | 保留为短期资源锁语义 |
| `confirmed` | Confirmed Reservation | Confirmed resource allocation | 当前确认会生成/关联 order，但不代表完整 Commitment abstraction | 未来保留独立 Reservation fact |
| `cancelled` | Cancelled Reservation | Released allocation | 当前取消由 creator/customer 触发 | 未来增加释放、支付、Commitment 协同规则 |
| `expired` | Expired Hold | TTL expiration fact | 当前只允许 held 到期后 expire | 保留 immutable expiration history |
| `rescheduleHistory` | Reschedule History | Inventory reallocation audit | 当前以 Slot ID 变更记录 | 未来与 Commitment amendment 事件关联 |
| Calendar views | Calendar UI | Presentation / planning projection | 当前不是正式领域对象 | 不得提升为 Source of Truth |

当前 `AvailabilitySlot` 是 Prototype-specific implementation object；它验证了 Dancer wedge 的 Time Availability + capacity-one reservation，但不等于最终 `Availability` 或 `Inventory` abstraction。

## 16. Ownership and Controller Decision

```text
Availability Anchor
= Commerce Profile + Offer context

Inventory Owner
= Profile or explicit resource owner

Inventory Controller
= Inventory allocation policy / authorized Profile controller

Reservation Owner
= Reservation as an independent resource-hold fact

Reservation Controller
= Reservation and Inventory workflow policy

Commitment Relationship
= bilateral commercial fact linking Provider Profile, Customer, Offer and relevant Inventory evidence
```

Reservation 的 owner 不应被简化成 Customer 或 Provider；Customer 和 Provider 是参与者，Inventory policy 才决定是否能够取得或释放资源。

## 17. Invariants

1. Calendar is not Source of Truth.
2. Availability is not Inventory.
3. Reservation is not Commerce Commitment.
4. Reservation cannot create commercial terms by itself.
5. Historical Reservation facts are immutable.
6. Profile A cannot consume Profile B Inventory without an explicit relationship.
7. Expired Reservation cannot silently become Commitment.
8. Reschedule preserves historical Reservation facts.
9. Inventory cannot be double-consumed beyond defined capacity.
10. Archived Profile cannot create new Inventory-backed Commitments.
11. Availability changes cannot rewrite historical Reservations.
12. Reservation confirmation and Commitment confirmation remain independently auditable.
13. A failed allocation must not leave an undisclosed partial hold.
14. Shared Inventory requires explicit ownership and allocation policy.

如果任何 invariant 无法在后续实现中证明，必须回到 Main Control / Founder Decision，而不是放宽语义。

## 18. Architecture Debt

| Area | Impact | Priority | Blocking Stage | Required Follow-up |
|---|---|---|---|---|
| `RequestableAvailability` vs structured Availability | 当前文本描述不能表达完整 requestability | High | Stage 2 | Availability data model ADR |
| `AvailabilitySlot` vs Inventory | 当前对象将 Offer、Creator、Time、Capacity 合并 | P0 | Stage 2 | Inventory abstraction ADR |
| Shared Inventory | 当前 schema 以 Creator + Offer + time 唯一，未表达跨 Offer resource | P0 | Stage 2/5 | Shared resource and allocation ADR |
| Time Inventory | 当前只支持 capacity-one slots | High | Stage 2/5 | Timezone, recurrence, exception design |
| Quantity Inventory | 尚无正式 Goods quantity model | Medium | Stage 5 | Quantity inventory ADR |
| Capacity Inventory | 当前 `capacity = 1` 固定 | High | Stage 2/5 | Capacity policy design |
| Reservation lifecycle | Prototype lifecycle 已存在但与 Commitment 边界未正式分离 | P0 | Stage 2 | Reservation/Commitment ADR |
| Reschedule semantics | 当前已记录 Slot 变更，尚无 Commitment amendment contract | High | Stage 2/5 | Reschedule and amendment design |
| Inventory concurrency | 需要防止 overbooking 和 partial holds | P0 | Stage 2 | Allocation consistency design |

## 19. Decision and Consequences

### Decision

本 ADR 提议将 Availability 定义为商业可请求条件，将 Inventory 定义为稀缺资源，将 Reservation 定义为临时资源锁，并采用 Reservation-before-Commitment 作为当前 Time Inventory wedge 的推荐生命周期。Reservation 与 Commitment 必须保持独立事实。

### Rationale

该边界支持 Dancer 的有限时间资源场景，能防止多个 Offers 竞争同一时间时发生双重出售，同时保留 Request、Reservation、Commitment 和 Fulfillment 各自的历史语义。

### Consequences

- 当前 `AvailabilitySlot` 只能作为 Prototype validation object。
- 未来需要显式设计 shared inventory、capacity、concurrency 和 rollback。
- Reservation confirmation 不再被解释为完整 Commitment confirmation。
- Availability、Inventory 和 Calendar 必须保持独立 Source of Truth。
- 未来 Profile authorization 必须覆盖 Inventory consumption。

### Rejected Alternatives

- `Calendar UI = Source of Truth`；
- `AvailabilitySlot = Inventory` 的永久模型；
- 所有 Offer 各自拥有不可共享的私有时间槽；
- 将 Reservation 直接等同于 Commerce Commitment；
- 先创建不可兑现的 Commitment，再异步寻找资源；
- 以 Profile archive 重写或删除历史 Reservation；
- 通过同一 Identity 自动共享多个 Profile 的 Inventory。

## 20. Status and Approval Boundary

```text
STATUS = PROPOSED
```

本 ADR 不声称已被 Main Control / Founder 接受。即使未来被接受，也不自动授权 Stage 2 implementation、Payment、Commerce ID、Platform Binding 或 Reputation。

## 21. Current Project State

```text
PRODUCT_DIRECTION = FROZEN_V1
PRODUCT_STAGE = STAGE_0
STAGE_2_IMPLEMENTATION = NOT_AUTHORIZED
PROJECT_STATUS = SUSPENDED
REAL_MONEY_ENABLED = false
apps/app = DEFERRED
```
