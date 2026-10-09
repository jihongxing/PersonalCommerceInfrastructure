# ADR-002 — Current Creator Identity Compatibility

> **状态**：PROPOSED  
> **决策范围**：Current Creator Identity 与未来 Identity / Commerce Profile 的兼容架构  
> **上游**：[`ADR-001 — Account / Actor / Identity / Commerce Profile Boundary`](./21_ADR_001_Account_Actor_Identity_Commerce_Profile.md)  
> **产品方向**：[`05 — Personal Commerce Infrastructure Product Direction`](../01_Strategy/05_Personal_Commerce_Infrastructure_Product_Direction.md)  
> **当前产品阶段**：`PRODUCT_STAGE = STAGE_0`  
> **Stage 2 实现授权**：`NOT_AUTHORIZED`

## 1. Context

当前 prototype 使用 `CommerceIdentity`、`creatorId` 和 `commerce_identities` 表承载 Creator 的公开商业身份。该模型支撑了 VS-01 / VS-02 的现有验证，但其一对一结构与未来正式模型不同：

```text
Current:
creatorId → CommerceIdentity

Future:
Identity
├── Commerce Profile A
├── Commerce Profile B
└── Commerce Profile N
```

当前 `creatorId` 还被 Offering、CommerceAction、AvailabilitySlot、Reservation、Contract、PaidServiceOrder、Fulfillment、Ledger 和 Withdrawal 等对象引用。因此它既是当前 prototype 的 actor / owner reference，也是历史商业事实的连接键。

本 ADR 只设计兼容架构和迁移契约，不执行 migration、backfill、schema 变更、API 变更或 runtime 实现。

## 2. Current Model Audit

### 2.1 Domain type

`modules/creator-commerce-identity/commerce-identity.ts` 当前定义：

```text
CommerceIdentity
├── creatorId
├── profile
├── capabilityIds
└── state
```

其中：

- `creatorId` 是当前对象唯一 identity / owner reference；
- `profile` 包含 `displayName`、`bio`、`avatarUrl`、`location` 和 `socialLinks`；
- `capabilityIds` 指向当前 Creator 能力；
- `state` 为 `draft / published / unpublished`；
- 应用层通过 `creatorId` 执行创建、读取、更新、Capability 添加、发布和撤下。

当前不存在独立的 Identity、Commerce Profile、Commerce Profile ID、Commerce ID 或 External Platform Account runtime。

### 2.2 Persistence

`database/schema/creator-identity.ts` 当前定义：

- `commerce_identities.creator_id` 为 primary key；
- `commerce_identities.creator_id` 同时存在 unique index；
- `creator_capabilities.creator_id` 直接保存能力归属；
- `service_offerings.creator_id` 直接保存 Offering owner；
- `commerce_actions.creator_id` 直接保存请求目标 Creator；
- 当前 schema 没有正式的 Identity parent、Profile parent 或 compatibility mapping 表。

当前未发现与这些字段关联的正式 foreign key 约束；逻辑归属主要由应用层、repository 和历史 ID 约定维持。

### 2.3 Repository and adapter

`CommerceIdentityRepository` 是对 `CommerceIdentity` 的集合仓储抽象。Postgres adapter 通过 `commerceIdentities.creatorId` 执行：

- `findById(id)`；
- `findByOwnerId(ownerId)`；
- `save(entity)`。

因此当前 repository 的 `id` 语义实际上是 `creatorId`，不是独立的 Commerce Profile ID。

### 2.4 API and tests

当前 Creator Identity API 使用：

```text
GET   /api/v1/creator/identity
POST  /api/v1/creator/identity
PATCH /api/v1/creator/identity
POST  /api/v1/creator/identity/capabilities
```

响应包含：

- `creatorId`；
- `profile`；
- `capabilityIds`；
- `capabilities`；
- `state`。

这些是当前 prototype API contract，不是未来 Identity / Commerce Profile API 的最终 contract。现有 application tests、integration tests、browser fixtures 和 auth mapping 均使用 `creatorId`，应视为历史兼容证据。

## 3. Historical Dependency Matrix

| Current Object | Current Identity Anchor | Persistence Dependency | Product Meaning | Future Anchor |
|---|---|---|---|---|
| `CommerceIdentity` | `creatorId` | `commerce_identities.creator_id` primary key / unique | 当前 Creator 的公开商业身份原型 | `Commerce Profile`，父级为 `Identity` |
| `Creator` actor | `Actor.creatorId` | Auth resolver / runtime context | 当前请求中的 Creator 执行参与者 | `Account` + authorized `Identity/Profile` context + `Actor` |
| Capability | `creatorId` | `creator_capabilities.creator_id` | Creator 能力资料 | Profile-scoped Capability / Offer relationship |
| Service Offering / Offer | `creatorId` | `service_offerings.creator_id` | 可被展示和请求的 Service Offering | `Commerce Profile` owner |
| Availability Slot | `creatorId` + `offeringId` | `availability_slots.creator_id`、`offering_id` | 时间库存实例 | Profile-owned Inventory / Availability |
| CommerceAction / Request | `creatorId` + `offeringId` | `commerce_actions.creator_id`、`offering_id` | 客户商业意图和请求 | Commitment initiation referencing Profile |
| Reservation | `creatorId` + `offeringId` + `customerId` | reservations creator / offering / customer / slot columns | 库存 hold / reservation mechanism | Commitment + Inventory reservation interaction |
| Contract | `creatorId` + `buyerId` + `commerceActionId` | commercial contract creator / action / order references | 商业和法律范围表示 | Commitment commercial representation |
| PaidServiceOrder | `creatorId` + `customerId` + source reference | paid order creator / customer / action / reservation / contract | 支付执行层订单 | Commitment + payment execution representation |
| Fulfillment | `creatorId` + `orderId` | paid fulfillment creator / order references | 履约证据和结果 | Explicit Fulfillment linked to Commitment |
| Payment / Settlement | order-derived Creator reference | payment / settlement order references | 资金执行和结算事实 | Deferred money execution layer |
| Ledger / Earning | `creatorId` + `orderId` | creator earnings ledger creator / order references | 派生收益事实 | Deferred money projection |
| Wallet | derived from Creator ledger | no independent commercial identity anchor | 账本投影 | Deferred money projection |
| Withdrawal | `creatorId` | paid withdrawal creator reference | 提现执行请求 | Deferred money execution layer |

这张矩阵证明：`creatorId` 不能通过简单字段重命名安全地升级为新的 Identity ID。

## 4. Compatibility Strategy Comparison

### Option A — Preserve current model permanently

- **Correctness**：不满足 `1 Identity : N Commerce Profiles`；
- **Data Risk**：短期低，长期高；
- **Authorization Risk**：Creator actor、Account 和 Identity 持续混淆；
- **Historical Attribution Risk**：短期低，未来语义扩展时高；
- **Implementation Cost**：短期最低；
- **Rollback Complexity**：短期低，长期因锁定错误模型而高；
- **Stage 2 Compatibility**：不足；
- **Stage 3/4 Compatibility**：无法安全支持 Commerce ID 和多平台关系。

结论：拒绝。

### Option B — Preserve temporarily + compatibility mapping

- **Correctness**：可保持当前 contract，同时逐步引入正式模型；
- **Data Risk**：可通过 deterministic mapping 和历史不变引用控制；
- **Authorization Risk**：可在新 authorization boundary 建立后逐步切换；
- **Historical Attribution Risk**：可保留 legacy reference；
- **Implementation Cost**：中等；
- **Rollback Complexity**：可控；
- **Stage 2 Compatibility**：最佳；
- **Stage 3/4 Compatibility**：可为 Profile-level Commerce ID 和 Relationship 保留边界。

结论：推荐。

### Option C — Introduce new Identity/Profile beside current model

- **Correctness**：最能表达目标模型；
- **Data Risk**：并行期间存在映射和双模型一致性风险；
- **Authorization Risk**：若边界不清，可能存在两个授权真相；
- **Historical Attribution Risk**：需要明确旧记录的 immutable attribution；
- **Implementation Cost**：中高；
- **Rollback Complexity**：中等；
- **Stage 2 Compatibility**：适合作为 Option B 的具体实施形态；
- **Stage 3/4 Compatibility**：良好。

结论：作为推荐方案的实现形态采用，但不允许两个模型长期竞争为 Source of Truth。

### Option D — Gradual deprecation of CommerceIdentity

- **Correctness**：目标正确；
- **Data Risk**：若没有先建立 mapping，风险高；
- **Authorization Risk**：迁移期间容易出现旧新权限不一致；
- **Historical Attribution Risk**：中高；
- **Implementation Cost**：中高；
- **Rollback Complexity**：中高；
- **Stage 2 Compatibility**：只有在 Option B / C 先建立后才可行；
- **Stage 3/4 Compatibility**：良好。

结论：作为后续阶段，不是第一步策略。

### Option E — Direct migration / replacement

- **Correctness**：最终可满足目标模型；
- **Data Risk**：最高；
- **Authorization Risk**：最高；
- **Historical Attribution Risk**：最高；
- **Implementation Cost**：表面较低，实际高；
- **Rollback Complexity**：最高；
- **Stage 2 Compatibility**：不安全；
- **Stage 3/4 Compatibility**：理论可行，但迁移失败代价大。

结论：拒绝。

### Option F — Permanent dual-write without a single truth

- **Correctness**：不可证明；
- **Data Risk**：长期漂移；
- **Authorization Risk**：双重权限来源；
- **Historical Attribution Risk**：难以确定；
- **Implementation Cost**：高；
- **Rollback Complexity**：高；
- **Stage 2 Compatibility**：不安全；
- **Stage 3/4 Compatibility**：不安全。

结论：拒绝。双写不是默认策略；若未来确有需要，必须有独立一致性决策和终止条件。

## 5. Recommended Strategy

推荐：

```text
Current CommerceIdentity
        ↓
Compatibility Mapping
        ↓
New Identity / Commerce Profile
        ↓
Gradual consumer migration
        ↓
Deprecate legacy model
```

该策略由 Option B、C、D 组合而成：

1. 暂时保留当前 `CommerceIdentity` 和 `creatorId`；
2. 设计新 Identity / Commerce Profile 模型并与旧模型隔离；
3. 建立 deterministic compatibility mapping；
4. 先迁移消费者和授权解析，再考虑旧模型 deprecated；
5. 不执行无映射的 direct replacement；
6. 不允许旧 `creatorId`、新 `identityId` 和 `commerceProfileId` 长期作为互相竞争的 truth source。

## 6. `creatorId` Decision

### Current semantics

当前 `creatorId` 同时承担：

- Creator actor identity；
- 商业对象 owner reference；
- authentication provider resolver 的映射结果；
- CommerceIdentity lookup key；
- API response field；
- 数据库跨表关联键；
- Canonical event 和支付/履约记录中的 Creator reference。

因此它是一个 **legacy compatibility subject reference**，不是单一纯粹的 Identity ID。

### Alternatives

#### `creatorId → Identity ID`

拒绝。会把当前 actor、owner、认证映射和历史 subject reference 直接重解释为永久 Identity，无法证明其 cardinality、权限和历史语义安全。

#### `creatorId → Commerce Profile ID`

拒绝。虽然当前 `CommerceIdentity` 更接近 Profile，但 `creatorId` 还广泛存在于 actor、支付和历史记录中，且未来 Profile 必须拥有独立 ID。

#### `creatorId → Compatibility Subject ID`

接受为过渡语义，但不是最终 Product Domain ID。它保留现有历史事实的引用稳定性，不改变旧记录含义。

#### `creatorId → legacy actor reference`

接受为运行时兼容语义的一部分，但不足以承载全部历史商业归属，因此不能单独替代 compatibility subject mapping。

### Final decision

```text
creatorId = legacy compatibility subject reference
```

未来通过显式 mapping contract 解析：

```text
legacy creatorId
    → legacy subject reference
    → Identity
    → initial Commerce Profile
```

不得隐式 alias：

```text
creatorId == Identity ID
creatorId == Commerce Profile ID
```

## 7. Historical Attribution Contract

历史商业事实必须满足：

```text
historical attribution
    → immutable legacy reference
    → deterministic mapping
    → future Identity / Profile attribution
```

### Source of truth

在迁移完成前，现有记录的 Source of Truth 仍是当前对象和现有 `creatorId` 字段。新 Identity / Profile mapping 只能解释旧事实，不能改写旧事实。

### Immutable reference

每条历史记录必须继续能够通过其原始 `creatorId` 和自身 object ID 证明：

- 原 Creator subject；
- 原 Offering / Request / Reservation / Contract / Order 关系；
- 原 Fulfillment、Earning 和 Withdrawal 归属链；
- 原始时间、状态和事件审计关联。

未来 mapping contract 必须是 append-only 语义：新增映射，不覆盖历史引用。

### Reconstruction strategy

未来重建历史归属时，按以下顺序解析：

```text
Historical Object
    → existing creatorId
    → legacy subject mapping
    → Identity
    → initial Commerce Profile
```

如果映射缺失、冲突或不唯一，必须 fail closed，不能猜测或自动合并。

## 8. 1:1 → 1:N Transition

### Default migration rule

对每个已有 legacy Creator：

```text
one legacy creatorId
    → one deterministic Identity
    → one initial Commerce Profile
```

这个规则只适用于兼容迁移的初始 Profile，不限制未来同一 Identity 创建更多 Profiles。

### Initial Profile inheritance

初始 Profile 可以继承当前 `CommerceIdentity.profile` 的展示字段，但必须保留来源标记和迁移可追溯性：

```text
legacy CommerceIdentity
    → initial Commerce Profile presentation
```

不应把旧 `creatorId` 直接作为新 Profile ID 或 Commerce ID。

### Existing object attribution

迁移后：

- Offering 归属到 legacy Creator 对应的初始 Commerce Profile；
- CommerceAction / Request 通过 Offering 和原始 `creatorId` 保持历史关系；
- AvailabilitySlot、Reservation 保留原始 `creatorId`、`offeringId` 和 slot reference；
- Contract 保留 `creatorId`、buyer、CommerceAction 和 Order references；
- PaidServiceOrder、Payment、Fulfillment、Settlement 保留原始 order chain；
- Ledger、Earning 和 Withdrawal 保留原始 Creator reference 和资金审计链。

新 Profile 的创建不改变旧 Creator 的历史数据，也不自动复制数据到其他 Profile。

### Legacy reference retention

迁移后必须保留 legacy `creatorId` reference，直到所有历史消费者和审计工具完成切换，并且另有批准的清理策略。清理不是本 ADR 的授权范围。

## 9. Field Mapping

| Current Field / Concept | Classification | Future Owner | Decision | Migration Concern |
|---|---|---|---|---|
| `creatorId` | Compatibility reference | Legacy subject mapping → Identity / Profile attribution | 不直接改名为 Identity ID | 跨多个历史对象和 API contract |
| `CommerceIdentity` | Compatibility aggregate | Initial Commerce Profile candidate | 保留兼容，不宣布为最终对象 | 当前一对一模型与未来一对多冲突 |
| `profile.displayName` | Profile presentation | Commerce Profile | 保留并迁移到初始 Profile | 不得进入 Identity 根 |
| `profile.bio` | Profile presentation | Commerce Profile | 保留并迁移到初始 Profile | 不属于认证或 Identity secret |
| `profile.avatarUrl` | Profile presentation | Commerce Profile | 保留并迁移到初始 Profile | 需保留展示/隐私策略空间 |
| `profile.location` | Profile presentation | Commerce Profile | 保留并迁移到初始 Profile | 未来可能需要可见性规则 |
| `profile.socialLinks` | Presentation metadata | Commerce Profile presentation | 保留为链接展示，不转为关系 | `socialLinks ≠ External Platform Account` |
| `capabilityIds` | Profile / capability relation | Commerce Profile → Capability / Offer context | 不归 Identity 根 | 多 Profile 归属需要显式决定 |
| `state` | Prototype lifecycle | Commerce Profile lifecycle mapping | `draft / published / unpublished` 不直接等于 `DRAFT / ACTIVE / SUSPENDED / ARCHIVED` | 需要状态映射和历史保留规则 |
| Capability `creatorId` | Legacy ownership reference | Profile-scoped capability relationship | 迁移时按 initial Profile 归属 | 不能假设 Identity-level shared capability |

## 10. Capability Mapping

当前 `Capability` 的结构包含：

```text
id
creatorId
name
description
```

当前语义是 Creator-scoped capability。未来推荐：

```text
Identity
    ↓
Commerce Profile A → capabilities / offers
Commerce Profile B → capabilities / offers
```

Capability 默认归属于具体 Commerce Profile 或 Profile-scoped Offer context，而不是 Identity 级共享商业资产。这样可以避免一个 Identity 的不同 Profiles 无意间共享不兼容的商业能力、价格或履约语义。

当前 VS-01 的 Capability 行为保持不变。未来若需要 Identity-level reusable capability，必须另行建立 Product / Architecture Decision，不由本 ADR 推导。

## 11. Social Links

当前 `socialLinks` 是 `CommerceIdentity.profile` 中的展示元数据：

```text
socialLinks ≠ External Platform Account
socialLinks ≠ Commerce Relationship
```

它可以表达一个可展示的 URL 或社交链接，但不证明：

- 账号属于哪个平台命名空间；
- 当前用户拥有或控制该账号；
- 账号绑定到哪个 Commerce Profile；
- 关系是否经过验证；
- 关系何时生效、解绑或进入历史状态。

未来必须区分：

```text
presentation URL
        ≠
verified external account relationship
```

`socialLinks` 可以作为 Profile presentation 的迁移来源，但不得自动转换为 Platform Account、OAuth credential 或 Commerce Relationship。

## 12. API Compatibility

| Current API Concept | Classification | Compatibility Decision |
|---|---|---|
| `/api/v1/creator/identity` | Prototype contract | 保持当前 contract，未来通过 versioned contract 或 adapter 兼容 |
| `creatorId` response field | Prototype / legacy contract | 暂不删除或重命名；未来明确标注 legacy semantics |
| `profile` response field | Prototype Profile candidate | 可作为初始 Profile presentation 来源 |
| `capabilityIds` | Prototype contract | 保持 VS-01 行为，未来改由 Profile-scoped relation 表达 |
| `state = draft/published/unpublished` | Prototype lifecycle contract | 不直接宣称等于正式 Profile lifecycle |
| `creatorId` in Offering / Request / Reservation / Contract / Paid Commerce | Internal and persistence contract | 通过 compatibility mapping 解释，不进行静默字段重命名 |

未来可以采用：

```text
legacy v1 contract
        ↓
compatibility adapter
        ↓
Profile-aware contract
```

不得在没有版本边界和迁移证据的情况下，用新 Identity/Profile 语义覆盖现有 v1 response。

## 13. Repository and Persistence Compatibility

### Can remain temporarily

- 现有 `CommerceIdentityRepository` 抽象；
- `commerce_identities` 表；
- 现有 `creatorId` 查询和历史索引；
- Offering、Request、Reservation、Contract、Paid Commerce 的 legacy references；
- 当前 VS-01 / VS-02 读写流程。

### Must eventually change

- `commerce_identities.creator_id` 作为唯一 identity anchor 的语义；
- 1:1 uniqueness 对多 Profile 的限制；
- repository `findById` 将 `creatorId` 当作对象 ID 的设计；
- 各 Commerce Object 仅保存 `creatorId`、缺少 Profile attribution 的长期模型；
- API / auth resolver 只返回 `creatorId` 的 compatibility path。

### Compatibility layer requirements

未来 compatibility layer 至少需要：

- legacy Creator subject 到 Identity 的 deterministic mapping；
- legacy Creator subject 到 initial Profile 的 deterministic mapping；
- 旧记录查询和新 Profile 查询的边界；
- fail-closed 的 missing / ambiguous mapping 行为；
- 历史审计所需的 immutable legacy reference；
- 明确的 Source of Truth transition。

本 ADR 不创建这些表、接口或代码。

## 14. Recommended Migration Shape

### Option A — Compatibility-first

```text
Current CommerceIdentity
        ↓
Compatibility Mapping
        ↓
New Identity / Profile
        ↓
Gradual consumer migration
        ↓
Deprecate legacy model
```

优点：

- 最大限度保护现有 VS-01 / VS-02；
- 迁移前后历史归属可验证；
- 可以先迁移 authorization 和读取路径；
- 支持 fail-closed 和可回滚的分阶段切换。

### Option B — Parallel model

```text
Legacy Model
      ╲
       ╲
      Mapping Layer
       ╱
      ╱
New Identity / Profile
```

优点：

- 新旧模型可隔离演进；
- 不需要立即重解释旧表；
- 便于保留 legacy API 和历史审计。

风险：

- 只能有一个明确的 truth source；
- 不得长期无条件 dual-write；
- 必须定义消费者迁移完成条件和 legacy deprecation boundary。

### Option C — Direct replacement

不推荐。直接替换会同时改变 ID、授权、历史归属、API 和数据库 cardinality，无法由本 ADR 安全授权。

### Selected shape

```text
Option A as the governance sequence
+ Option B as the implementation topology
```

即先以 compatibility-first 作为治理顺序，再以 parallel model 承载受控过渡，最终逐步弃用 legacy model。

## 15. Source of Truth Transition

### Phase 1 — Legacy Source of Truth

- 当前 `CommerceIdentity`、`creatorId` 和既有 Commerce Object 仍是事实来源；
- 新模型不存在或只作为设计；
- 不执行 backfill 或 dual-write。

### Phase 2 — Controlled Mapping / Dual-read

- 新 Identity / Profile 已建立并完成 deterministic mapping；
- legacy records 仍以原始 `creatorId` 为不可变历史引用；
- 读取可以通过受控 adapter 同时解析 legacy 和新模型；
- 不允许两个模型对同一事实给出冲突结果；
- 默认不采用永久 dual-write；如需写入两侧，必须另有一致性 ADR。

### Phase 3 — New Identity/Profile Source of Truth

- 新 Identity / Profile 成为新业务操作的主来源；
- legacy `creatorId` 作为历史兼容引用保留；
- 所有历史查询仍可重建；
- 旧 `CommerceIdentity` 进入受控 deprecation；
- 删除、清理或重写 legacy records 需要独立批准。

## 16. Compatibility Invariants

以下规则不可违反：

1. `Identity ID` never aliases `creatorId` implicitly。
2. `Commerce Profile ID` never becomes `Identity ID`。
3. `Commerce ID` never becomes a replacement for either internal ID。
4. Historical Commerce Objects retain their original `creatorId` attribution。
5. Existing VS-01 behavior remains valid during transition。
6. One legacy Creator maps deterministically to one initial Identity。
7. Each migrated initial Identity receives exactly one initial Commerce Profile，除非另有 Founder-approved migration rule。
8. The same legacy subject must not create duplicate initial Profiles accidentally。
9. Missing or ambiguous mapping fails closed。
10. `socialLinks` never imply verified platform ownership。
11. Old and new models must not become permanent competing truth sources。
12. No Commerce ID、OAuth、Platform Binding、Reputation 或 Payment implementation is authorized by this ADR。

如果任何 invariant 无法在后续设计中证明，必须回到 Main Control / Founder Decision，而不是猜测实施。

## 17. Decision

本 ADR 提出以下兼容决策，待 Main Control / Founder 明确批准后才可标记为 `ACCEPTED`：

1. 当前 `CommerceIdentity` 的正式 architectural role 是 **Compatibility Aggregate**。
2. 当前 `creatorId` 的正式过渡语义是 **Legacy Compatibility Subject Reference**。
3. 当前 `CommerceIdentity` 不直接成为最终 Identity，也不直接成为最终 Commerce Profile。
4. 每个 legacy Creator 默认 deterministic mapping 到一个 Identity 和一个 initial Commerce Profile。
5. 初始 Profile 可以继承旧 `CommerceIdentity.profile` presentation fields，但不继承旧 ID 语义。
6. `capabilityIds` 未来归入 Profile-scoped capability / Offer context，不归入 Identity 根。
7. `socialLinks` 继续是 presentation metadata，不自动转化为 External Platform Account 或 Commerce Relationship。
8. 采用 compatibility-first + controlled parallel model + gradual deprecation。
9. 迁移期间保留 legacy references，历史归属采用 append-only mapping 和 fail-closed reconstruction。
10. 本 ADR 不执行任何 migration、backfill、schema、API 或 runtime 变更。

## 18. Rationale

该决策同时满足：

- Product Direction 的 `1 Identity : N Commerce Profiles`；
- ADR-001 对 Account、Actor、Identity 和 Profile 的边界；
- VS-01 / VS-02 的现有实现稳定性；
- 历史 Commerce Objects 的可追溯性；
- 后续 Commerce ID、External Platform Relationship 和 Reputation 的独立演进；
- 暂停项目的 fail-closed 治理要求。

直接重命名或替换 `creatorId` 会制造语义迁移，而不是完成架构迁移。Compatibility Aggregate 允许保留已验证的 prototype contract，同时把未来模型的边界显式化。

## 19. Consequences

### Positive

- 不破坏现有 prototype 证据；
- 支持从一对一 legacy model 进入一对多 Profile model；
- 历史 Offer、Request、Reservation、Contract、Paid Commerce 和 Earnings 仍可归属；
- 可独立迁移 authorization、read path 和新 Profile creation；
- 为 Commerce ID 和 Platform Relationship 保留正确的 Profile anchor。

### Costs / Risks

- 需要长期维护 compatibility mapping；
- 迁移期间需要防止旧新模型产生冲突；
- 现有 API 和 repository 需要未来 versioning / adapter；
- 旧数据库的 `creator_id` uniqueness 不能直接支持多 Profile；
- 需要在后续 ADR 中明确数据模型、授权、回滚和切换条件。

## 20. Rejected Alternatives

- Preserve current model permanently；
- `creatorId` 直接成为 Identity ID；
- `creatorId` 直接成为 Commerce Profile ID；
- `CommerceIdentity` 直接成为最终 Profile；
- 无映射的 direct migration；
- 永久 dual-write 且没有单一 Source of Truth；
- 自动把 `socialLinks` 转为 Platform Account / Relationship；
- 把 Capability 作为 Identity-level shared asset。

## 21. Stage 2 Impact

### What this ADR unlocks

- 对 legacy Creator 建立 deterministic Identity / initial Profile mapping 的设计；
- 保护历史归属的兼容架构；
- 新旧模型并行存在的受控边界；
- Profile-aware consumer migration 的规划；
- 旧 `CommerceIdentity` 的未来 deprecation 方向。

### What this ADR does not unlock

```text
Commerce ID
External Platform Account
Commerce Relationship
OAuth
Platform Binding
Reputation
Payment
Public /c/{commerce_id}
```

### Stage 2 readiness

```text
ADR-002 alone does not make Stage 2 implementation-ready.
```

在进入 Stage 2 implementation 前仍需：

- Main Control / Founder 接受 ADR-001 和 ADR-002；
- 独立完成 Identity / Profile data model；
- 定义 authorization membership 和 Account mapping；
- 定义 legacy mapping 的具体来源、唯一性和 fail-closed 行为；
- 定义历史对象查询和迁移验证；
- 定义 Stage 2 最小实现范围、验收和回滚；
- 获得明确的 Stage 2 implementation authorization。

## 22. Status and Approval Boundary

```text
STATUS = PROPOSED
```

本文件不声称 Founder 已接受。只有 Main Control 明确批准后，才可将状态改为：

```text
STATUS = ACCEPTED
```

即使 ADR-002 被接受，也不自动授权 Stage 2 实现。

## 23. Current Project State

```text
PRODUCT_DIRECTION = FROZEN_V1
PRODUCT_STAGE = STAGE_0
STAGE_2_IMPLEMENTATION = NOT_AUTHORIZED
PROJECT_STATUS = SUSPENDED
REAL_MONEY_ENABLED = false
apps/app = DEFERRED
```
