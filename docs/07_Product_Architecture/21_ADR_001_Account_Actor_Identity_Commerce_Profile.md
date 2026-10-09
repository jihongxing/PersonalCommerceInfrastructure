# ADR-001 — Account / Actor / Identity / Commerce Profile Boundary

> **状态**：PROPOSED  
> **决策范围**：Personal Commerce Infrastructure  
> **上游**：[`05 — Personal Commerce Infrastructure Product Direction`](../01_Strategy/05_Personal_Commerce_Infrastructure_Product_Direction.md)  
> **相关实现**：`modules/creator-commerce-identity`、`applications/creator-identity`、`modules/shared/actors.ts`、`applications/core/ports/auth-context-provider.ts`  
> **当前产品阶段**：`PRODUCT_STAGE = STAGE_0`  
> **Stage 2 实现授权**：`NOT_AUTHORIZED`

## 1. Context

当前 prototype 使用 `creatorId` 同时连接认证后的 Creator actor、`CommerceIdentity`、Offering、Request、Reservation、Contract 和 Paid Commerce 记录。该模型足以支撑 VS-01 / VS-02 验证，但不能直接代表 Product Direction 中要求的：

```text
Authentication User / Account
        ↓
      Identity
        ↓
Commerce Profile
```

尤其是：

- 一个 Identity 未来可以拥有多个 Commerce Profiles；
- Actor 是应用运行时的执行主体，不应被强行当作持久化商业主体；
- Commerce Profile 是面向客户的商业身份，不是登录凭证或安全主体；
- 当前 `CommerceIdentity` 是 Creator-centered prototype object，不应未经决策直接宣布为最终 Identity 或 Profile。

本 ADR 只冻结概念边界和兼容方向，不创建对象、迁移、API 或数据库实现。

## 2. Definitions

### 2.1 Authentication User / Account

`Authentication User / Account` 是能够登录 PCI、持有认证凭证并通过认证流程获得访问权限的账户主体。

Account 负责：

- authentication credentials；
- access token / session；
- authentication provider subject；
- 登录和账户安全生命周期。

Account 不等于商业主体，不直接拥有 Offer、Availability、Commerce Commitment 或 Commerce Profile presentation。

一个 Account **可以关联一个或多个 Identity**，但该关联必须通过明确的授权关系表达。不能因为一个 Account 当前只解析到一个 Creator，就冻结为：

```text
1 Account = 1 Identity
```

现阶段推荐的默认关系是：

```text
1 Account → 1..N authorized Identity subjects
```

是否允许一个 Account 创建、管理或代表多个 Identity，属于授权策略；它不改变 Identity 的永久主体语义。

### 2.2 Actor

`Actor` 是一次应用操作中的 runtime execution principal，表示“谁正在执行这个动作”。

当前代码中的：

```text
Actor.kind = creator
Actor.kind = customer
Actor.kind = platform
Actor.kind = pilot_operations
```

应解释为执行参与者类型，而不是统一的 Product Domain Object。

Actor 负责：

- 在当前请求中表达执行身份；
- 参与 authorization；
- 作为 canonical event 的 actor；
- 代表 Creator、Customer、Platform 或受控运营操作。

Actor 不负责：

- 持久化永久主体；
- 拥有商业资产；
- 替代 Identity；
- 生成 Commerce Profile；
- 持有认证凭证。

Actor 默认不持久化为独立领域对象。持久化系统应保存必要的 `actorId`、`actorKind` 或关联主体引用作为事件审计信息，但这不意味着 Actor 本身成为商业主数据。

### 2.3 Identity

```text
Identity = PCI internal permanent subject root
```

Identity 是 PCI 内部代表“这个主体是谁”的长期稳定身份根。

Identity owns / anchors：

- Commerce Profiles；
- subject-level continuity；
- identity-level references；
- 对其 Profiles 的内部归属锚点。

Identity does not own：

- authentication secrets；
- Commerce Profile presentation fields；
- platform account credentials；
- Offer；
- Availability；
- Commerce Commitment；
- Payment / Wallet。

Identity 不应被解释为登录账户，也不应被解释为客户面对的公共页面。

### 2.4 Commerce Profile

```text
Commerce Profile = customer-facing commercial identity
```

Commerce Profile 是客户看到、理解并与之发生商业互动的商业主体。

正式 cardinality 为：

```text
1 Identity : N Commerce Profiles
```

Profile owns / anchors：

- display identity；
- commercial presentation；
- Offers；
- Availability；
- Commerce Relationships；
- Profile-level commercial reputation；
- Profile 归属的历史 Commerce Objects。

Profile does not own：

- authentication credentials；
- Identity-level permanent subject；
- another Identity；
- external platform credentials。

Commerce Profile 不是 security principal。它可以作为 authorization target 或商业归属 target，但不能取代 Account 或 Identity 完成认证。

## 3. Lifecycle

Commerce Profile 采用以下生命周期：

```text
DRAFT
  → ACTIVE
  → SUSPENDED
  → ARCHIVED
```

### DRAFT

- 已依附一个 Identity；
- 可编辑商业展示资料和初始商业配置；
- 不应被视为可正常承接公开商业行为；
- 可以在满足产品条件后进入 `ACTIVE`。

### ACTIVE

- 可作为客户面对的商业身份；
- 可以承载已授权的 Offers、Availability 和 Commerce Relationships；
- 可以接受产品合同允许的商业动作；
- 仍受 Identity-level authorization 和治理规则约束。

### SUSPENDED

- Profile 暂停新的正常商业活动；
- 历史 Commerce Objects 保留并可追溯；
- 已存在的对象是否继续处理，必须由各对象的 Product Contract 决定；
- 经过明确恢复条件后可以回到 `ACTIVE`。

### ARCHIVED

- 逻辑终止，不再作为新的正常商业入口；
- 不等于物理删除；
- 不得创建新的正常商业对象；
- 历史 Commerce Objects 继续可归属、可审计、可追溯；
- 是否允许恢复必须由后续产品决策明确，默认不把 Archive 当作普通停用。

因此：

```text
ARCHIVED ≠ DELETE
historical Commerce Objects remain attributable
```

## 4. Ownership and Transfer

默认控制关系为：

```text
Commerce Profile
    └── controlled by exactly one Identity
```

当前冻结的产品规则：

- Profile 必须依附一个 Identity；
- 一个 Identity 可以拥有多个 Profiles；
- Profile 默认不支持跨 Identity transfer；
- Profile 不支持 merge；
- Profile 不支持多个 Identity 共同控制；
- 本 ADR 不实现 transfer、merge、ownership migration 或共同管理。

External Platform Account 的外部 ownership 不得被解释为 PCI Identity ownership。未来的 Commerce Relationship 表达的是 Profile 对外部账号的 PCI 内部控制/关联关系，而不是把平台账号提升为 Identity。

## 5. Current Prototype Mapping

当前核心类型位于：

```text
modules/creator-commerce-identity/commerce-identity.ts
```

当前结构：

```text
CommerceIdentity
├── creatorId
├── profile
├── capabilityIds
└── state
```

字段级映射如下：

| Current Field / Concept | Future Owner | Decision | Migration Concern |
|---|---|---|---|
| `creatorId` | 当前 Creator actor / legacy subject reference；未来由 Account、Identity 和授权关系分别表达 | 不直接冻结为 Identity ID | 现有 Offering、Request、Reservation、Contract、Paid Commerce 记录均依赖它 |
| `CommerceIdentity` | Future Commerce Profile candidate | 保留为 prototype compatibility object，不宣布为最终 Profile | 当前一对一约束与未来 `1 Identity : N Profiles` 不一致 |
| `CommerceIdentity.profile` | Commerce Profile presentation candidate | 未来主要归 Commerce Profile | 当前嵌套在 `CommerceIdentity` 内，不能直接代表完整 Profile 生命周期 |
| `displayName` | Commerce Profile | 商业展示字段 | 需避免迁移到 Identity 根 |
| `bio` | Commerce Profile | 商业展示字段 | 同上 |
| `avatarUrl` | Commerce Profile | 商业展示字段 | 不属于认证或 Identity secret |
| `location` | Commerce Profile | 商业展示字段 | 未来可能需要隐私/展示范围策略 |
| `socialLinks` | Commerce Profile presentation 或 Commerce Relationship candidate | 当前仅是展示链接，不等同于外部账号绑定 | 不能直接转换为 External Platform Account |
| `capabilityIds` | Offer / Capability context | 不应长期作为 Identity 根对象的业务资产集合 | 未来应由 Profile 对 Offer / Capability 归属表达 |
| `state` | 当前 prototype CommerceIdentity state | 不能直接复用为 Profile lifecycle | 当前为 `draft / published / unpublished`，与 `DRAFT / ACTIVE / SUSPENDED / ARCHIVED` 不同 |

### Why `creatorId` cannot directly become Identity ID

`creatorId` 不能直接升级为 Identity ID，原因是：

1. 当前它同时承担 Creator actor、资源 owner 和 CommerceIdentity lookup key；
2. 当前数据库对 `creator_id` 存在一对一约束，不能表达一个 Identity 的多个 Profiles；
3. 当前认证 provider subject 通过 resolver 映射到 `creatorId`，说明它更接近当前运行时/兼容层的 Creator reference；
4. Identity ID 需要独立表达永久主体连续性，不能由当前 prototype 的单一 Creator 语义推断；
5. 现有历史记录必须保持可追溯，不能通过无决策的 ID 重解释改变其归属语义。

### Why `CommerceIdentity.profile` is only a candidate

`CommerceIdentity.profile` 已承载面向客户的展示资料，因此是 Commerce Profile 的候选来源。但它尚未具备：

- 独立 Profile identity；
- 独立 Profile lifecycle；
- 多 Profile 归属；
- Profile-level Commerce ID 边界；
- Profile-level Relationship 和 Reputation boundary；
- 与 Account / Identity 的独立 authorization boundary。

所以它只能作为兼容迁移的候选数据来源，不能直接宣布为最终 Profile。

## 6. Compatibility Strategy

采用组合策略：

```text
A. Preserve current object temporarily
B. Introduce compatibility mapping
C. Design new Identity/Profile objects beside current model
D. Deprecate current CommerceIdentity gradually
```

当前明确不选择：

```text
E. Direct migration
```

### Compatibility direction

1. 保留当前 `CommerceIdentity`、`creatorId` 和既有 Commerce Object 关联，确保 VS-01 / VS-02 历史证据不失效。
2. 先完成 Account / Actor / Identity / Profile 的架构和数据语义设计，再定义兼容 mapping。
3. 未来新模型可以与当前模型并存一段时间，但不得让两个模型各自成为不同的身份真相来源。
4. 旧 `CommerceIdentity` 在有明确迁移策略和验证证据后逐步 deprecated。
5. 不在本 ADR 中创建 migration、修改 schema、改变 API 或迁移历史数据。

### Existing records

以下现有记录继续以当前实现合同为准：

- `commerce_identities`；
- `service_offerings`；
- customer requests / `CommerceAction`；
- availability slots；
- reservations；
- contracts；
- paid orders；
- payments、fulfillments、settlements；
- earnings ledger、wallet projection、withdrawals。

未来映射必须保持这些记录的历史归属和可审计性，不能通过重命名字段制造语义迁移。

## 7. ID Semantics

| ID | Authority | Purpose | Scope | Stability | Public / Private | Reusable? | Transferable? |
|---|---|---|---|---|---|---|---|
| Account ID | Authentication system | 登录账户识别 | Account | 稳定于账户生命周期 | Private | No | Not a commercial transfer primitive |
| Actor ID | Runtime/application context | 记录本次执行参与者 | One execution / audit context | 不作为永久产品身份保证 | Usually private | Not a canonical ID | Not applicable |
| Identity ID | PCI Identity authority | 永久主体连续性 | Identity | Permanent | Private | No | No by default |
| Commerce Profile ID | PCI Profile authority | 识别一个 Profile | Commerce Profile | Stable through Profile lifecycle | Private/internal by default | No | No by default |
| Commerce ID | PCI Commerce ID authority | Profile 的稳定公共标识 | Commerce Profile | Stable; survives archival | Public-reference capable | No | No by default |
| External Platform Account ID | External platform namespace, referenced by PCI | 识别第三方平台中的具体账号 | One platform account | Stable only within platform rules | External reference; treat as sensitive | No within platform namespace | Controlled by external platform rules, not PCI Identity transfer |

关键边界：

```text
Identity ID ≠ Account ID
Identity ID ≠ Commerce Profile ID
Identity ID ≠ Commerce ID
Commerce Profile ID ≠ Commerce ID
Commerce ID ≠ External Platform Account ID
```

Commerce Profile ID 是内部对象标识；Commerce ID 是未来可公开引用的 Profile 标识。二者不能因为都指向 Profile 而合并。

## 8. Security Boundary

正式关系为：

```text
Authentication
    → proves Account access

Identity
    → stable subject anchor

Authorization
    → determines what the Account / Actor may do

Commerce Profile
    → commercial representation and authorization target
```

具体规则：

- Authentication 只证明 Account 对认证凭证或 provider subject 的控制；
- Authentication 成功不自动授予对任意 Identity 或 Profile 的操作权；
- Authorization 决定 Account / Actor 是否可以代表某个 Identity、操作某个 Profile 或执行某个 Commerce action；
- Identity 是 subject anchor，不是凭证容器；
- Profile 是商业表示，不是 security principal；
- External Platform credentials 不进入 Identity 或 Profile；
- Customer、Creator、Provider 和 Platform 是不同的执行角色/参与者语义，不应通过一个通用 `creatorId` 永久合并。

当前 `createAuthContextProvider` 通过 provider identity resolver 得到 `creatorId`，属于 prototype compatibility path。未来该 path 应解析为：

```text
Provider Account
    → Account
    → authorized Identity / Profile context
    → runtime Actor
```

本 ADR 不修改该实现。

## 9. Architecture Diagram

```text
Authentication User / Account
              │
              │ authenticated access
              ▼
          Identity
              │
       ┌──────┴──────┐
       ▼             ▼
Commerce Profile A  Commerce Profile B
       │
       ├── Offer
       ├── Availability
       ├── Commerce Relationship
       └── Reputation
```

Actor 位于运行时执行层，而不是上述持久化领域层：

```text
Account + authorized Identity/Profile context
                  │
                  ▼
               Actor
                  │
                  ├── executes application use case
                  ├── participates in authorization
                  └── records execution provenance
```

对于外部平台：

```text
Commerce Profile
        ↓
Commerce Relationship
        ↓
External Platform Account
```

External Platform Account 不反向成为 Identity，也不改变 Profile 的 PCI 归属。

## 10. Decision

本 ADR 提出并冻结以下架构方向，待 Main Control / Founder 明确批准后成为 `ACCEPTED`：

1. Account 是认证和凭证边界，不是商业主体。
2. Actor 是运行时执行参与者，不是持久化 Product Domain Object，不拥有商业资产。
3. Identity 是 PCI 内部永久主体根。
4. Commerce Profile 是客户面对的商业身份。
5. 一个 Identity 可以拥有多个 Commerce Profiles。
6. 一个 Profile 默认由一个 Identity 控制，不支持默认 transfer、merge 或多 Identity 共同控制。
7. 当前 `CommerceIdentity` 是 Creator-centered prototype object 和兼容来源，不是最终 Identity 或最终 Profile。
8. 当前 `creatorId` 不直接升级为 Identity ID。
9. Commerce Profile ID 与 Commerce ID 分离。
10. 当前采用保留旧对象、兼容映射、并行设计、渐进弃用的策略，不执行 direct migration。

## 11. Rationale

该边界直接满足 Product Direction 的核心约束：

- 支持 `1 Identity : N Commerce Profiles`；
- 将客户看到的商业表示与内部永久主体分离；
- 将认证、授权和商业归属分离；
- 保持 VS-01 / VS-02 当前实现合同稳定；
- 避免把 Creator actor semantics、平台账号或认证 provider subject 误当成 PCI Identity；
- 为后续 Commerce ID、External Platform Account 和 Commerce Relationship 保留清晰扩展点。

## 12. Consequences

### Positive

- 后续可在不改变 Identity 根的前提下创建多个 Profile；
- Profile 可以独立拥有 Offer、Availability、Relationship 和 Reputation 归属；
- Account、Actor、Identity 和 Profile 的安全边界清晰；
- 历史 Creator-centered records 可以通过兼容层继续追溯；
- 为 Stage 3 Commerce ID 和 Stage 4 Platform Relationship 保留正确归属。

### Costs / Risks

- 未来需要处理旧 `creatorId` 到新 Account / Identity / Profile 的映射；
- 当前一对一数据库约束不能直接承载多 Profile；
- 应用层当前要求 `Actor.kind = creator`，未来授权上下文需要更精确；
- 迁移前必须避免同时存在两个互相竞争的身份真相来源；
- Profile 的 transfer、merge 和共同控制需要保持显式禁止，直到另有批准。

## 13. Rejected Alternatives

### One Account = One Identity

拒绝原因：会把认证账户与永久主体绑定，无法表达账户代理、授权管理或未来多 Identity 访问场景。

### One Creator = One Commerce Profile

拒绝原因：与 Product Direction 的 `1 Identity : N Commerce Profiles` 冲突，也无法支持个人、舞团、Studio、品牌等不同商业 Profile。

### `creatorId` Directly Becomes Identity ID

拒绝原因：当前 `creatorId` 同时承担 actor、owner 和 lookup key 语义，且被现有一对一 schema 约束；直接重解释会产生历史归属和安全边界风险。

### `CommerceIdentity` Directly Becomes Commerce Profile

拒绝原因：当前对象缺少独立 Profile ID、Profile lifecycle、Identity parent、Commerce ID 和 Profile authorization boundary。

### Actor as Persistent Domain Object

拒绝原因：Actor 表示一次执行中的参与者，同一主体可以在不同上下文以不同角色执行操作；将 Actor 持久化为商业主体会混淆 authorization、audit 和 ownership。

### Direct Migration

拒绝原因：当前没有完成字段、ID、历史对象、权限和回滚策略的 Architecture Design；本 ADR 不足以授权 migration。

## 14. Migration Implications

本 ADR 不执行迁移。后续迁移设计至少必须单独解决：

- provider subject 到 Account 的映射；
- Account 到 Identity 的授权关系；
- `creatorId` 的 legacy compatibility 语义；
- `commerce_identities` 到一个或多个 Commerce Profiles 的映射；
- Offer、Availability、Request、Reservation、Contract、Paid Order 和 Fulfillment 的历史归属；
- 认证、授权和事件审计的一致性；
- 迁移期间唯一 Source of Truth；
- 回滚和历史可追溯性。

任何 migration 前必须有独立 Architecture Decision、产品变更登记、数据验证和明确实施授权。

## 15. Future Extension Points

本边界为以下后续设计保留空间：

- Account / Identity authorization membership；
- Identity-to-Profile creation and control policy；
- Profile-level Commerce ID；
- External Platform Account；
- Commerce Relationship；
- Provider / Customer role modeling；
- Profile-level Reputation；
- 多 Profile 的展示、停用和历史归属策略。

这些扩展点均不因本 ADR 自动获得实现授权。

## 16. Stage 2 Impact

### Closed by this ADR proposal

- Account 与商业主体不是同一概念；
- Actor 是 runtime execution principal；
- Identity 是永久主体根；
- Commerce Profile 是商业表示；
- `1 Identity : N Commerce Profiles`；
- Profile 默认单一 Identity 控制；
- `creatorId` 不直接复用为 Identity ID；
- Commerce Profile ID 与 Commerce ID 分离；
- 当前 Prototype 采用兼容而非直接迁移。

### Still open

- Main Control / Founder 是否接受本 ADR；
- Account 与 Identity 的具体授权 cardinality 和 membership model；
- Identity / Profile 的具体数据模型和边界 API；
- 当前 `CommerceIdentity` 的最终兼容映射；
- Profile 与现有 Offer、Availability、Commerce Commitment 的归属迁移；
- Stage 2 的最小实现单元和验收标准；
- 是否允许任何身份 transfer、delegation 或代理操作。

### Does this ADR make Stage 2 implementation-ready?

```text
NO
```

本 ADR 关闭了最上游的概念边界，但没有关闭数据模型、兼容迁移、授权 membership、API contract、验收和实施范围等条件。`ADR-002 Current Creator Identity Compatibility` 仍是 Stage 2 的硬 blocker，且需要 Main Control / Founder 对本 ADR 先行确认。

因此当前仍保持：

```text
STAGE_2_IMPLEMENTATION = NOT_AUTHORIZED
```

## 17. Status and Approval Boundary

```text
STATUS = PROPOSED
```

本文件是架构提案，不声称 Founder 已接受。只有 Main Control 明确批准后，才可将状态改为：

```text
STATUS = ACCEPTED
```

即使本 ADR 被接受，也不自动授权 Stage 2 实现；实现仍需独立的阶段授权。

## 18. Current Project State

```text
PRODUCT_DIRECTION = FROZEN_V1
PRODUCT_STAGE = STAGE_0
STAGE_2_IMPLEMENTATION = NOT_AUTHORIZED
PROJECT_STATUS = SUSPENDED
REAL_MONEY_ENABLED = false
apps/app = DEFERRED
```
