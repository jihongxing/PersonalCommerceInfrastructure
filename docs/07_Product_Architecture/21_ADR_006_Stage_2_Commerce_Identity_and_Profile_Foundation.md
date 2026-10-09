# ADR-006 — Stage 2 Commerce Identity and Profile Foundation

> **状态**：PROPOSED  
> **决策范围**：Stage 2 Commerce Identity & Commerce Profile Foundation 的最小实现范围合同  
> **上游**：ADR-001、ADR-002、ADR-003、ADR-004、ADR-005、Product Direction FROZEN_V1  
> **实现授权**：`STAGE_2_IMPLEMENTATION_AUTHORIZATION = NOT_GRANTED`

## 1. Purpose

Stage 2 的唯一目的，是建立足够小、足够稳定、可独立验收的：

```text
Authentication Account
        ↓
Identity
        ↓
Commerce Profile
```

以及：

```text
1 Identity : N Commerce Profiles
```

Stage 2 不是整个 PCI Domain Architecture 的实现，也不是 Offer、Inventory、Commerce Commitment、Payment 或 External Platform Binding 的实现阶段。

## 2. Stage 2 Product Purpose

Stage 2 必须解决：

- PCI 内部永久 Identity 的稳定锚点；
- Account 与 Identity 的明确授权关联；
- customer-facing Commerce Profile 的独立生命周期；
- 同一 Identity 下多个 Profiles 的创建与隔离；
- Profile-specific authorization；
- 历史 Prototype 记录的归属连续性；
- `creatorId` 到 Identity / initial Profile 的 deterministic compatibility boundary。

Stage 2 不重新定义 Product Direction，也不把 Profile、Identity、Account 和 Actor 合并。

## 3. Stage 2 Must-Have

### 3.1 Identity

Stage 2 必须定义并实现验证以下能力：

- 创建 Identity；
- 生成并稳定持有独立的 Identity ID；
- Identity ID 不等于 Account ID；
- Account 与 Identity 建立可撤销的授权关联；
- 为未来 `1 Account : N Identities` 保留关系模型扩展；
- Identity lifecycle 与 continuity；
- Identity 对 Commerce Profiles 的主体归属。

Identity 最小数据模型：

```text
Identity
├── identityId
├── lifecycle
├── createdAt
└── updatedAt
```

Identity 不直接嵌入：

```text
Offer
Availability
Capability
External Platform Account
Commerce ID
Commerce Commitment
Payment
```

### 3.2 Commerce Profile

Stage 2 必须定义并实现验证：

- 创建 Commerce Profile；
- Profile 绑定一个 Identity；
- 一个 Identity 创建至少两个 Profiles；
- Profile-specific authorization；
- Profile-specific presentation data；
- Profile 独立 lifecycle；
- 历史对象归属能力。

Commerce Profile 最小数据模型：

```text
Commerce Profile
├── commerceProfileId
├── identityId
├── lifecycle
├── presentation data
├── createdAt
└── updatedAt
```

Profile lifecycle：

```text
DRAFT
→ ACTIVE
→ SUSPENDED
→ ARCHIVED
```

### 3.3 Legacy Compatibility

Stage 2 必须提供可验证的兼容边界：

```text
legacy creatorId
        ↓
Legacy Compatibility Subject Reference
        ↓
deterministic mapping
        ↓
Identity
        ↓
initial Commerce Profile
```

必须保证：

- 同一 legacy `creatorId` 的映射是 deterministic；
- 重复执行不会创建重复 Identity 或 Profile；
- 一个 legacy Creator 默认映射到一个 Identity 和一个 initial Profile；
- 原始 `creatorId` 保留为历史归属引用；
- 映射缺失、冲突或歧义时 fail closed；
- VS-01 现有行为继续可用。

## 4. Stage 2 Should Not Implement

Stage 2 明确排除：

```text
Commerce ID
Public /c/{commerce_id}
Public Commerce Page

External Platform Account
Commerce Relationship
OAuth
Platform Binding

Generalized Offer runtime
Unified Inventory runtime
Commerce Commitment runtime
Fulfillment platform
Reputation / Review / Rating

Payment
Settlement
Refund
Withdrawal

Marketplace
CRM
Social Feed
Analytics Platform
```

已有 Prototype validation implementation 不删除、不重写为新模型，只通过 compatibility boundary 继续服务于现有验证。

## 5. Offer / Availability Interaction

Stage 2 不创建新的 Offer、Availability 或 Reservation domain runtime。

推荐兼容关系：

```text
Commerce Profile
        ↓ compatibility ownership anchor
existing Service Offering
        ↓
existing Availability / Reservation implementation
```

当前阶段：

- 现有 `Service Offering` 继续作为 VS-01 validation object；
- 现有 `creatorId` 继续作为 legacy reference；
- 新 Profile ownership 通过 compatibility mapping 表达；
- 不重写 Offer domain；
- 不落地 ADR-004 的完整 Inventory、Shared Inventory 或 Capacity abstraction；
- 不修改 Reservation lifecycle。

Stage 2 只需确保未来对象可以安全挂载到 Profile，不需要立即把所有现有对象迁移为 Profile-native runtime。

## 6. Commerce Commitment Interaction

Stage 2 不创建 Commitment runtime。

Stage 2 仅提供未来 Commitment 所需的稳定引用条件：

```text
Provider Profile ID
Customer Subject Reference
Profile-specific authorization
Historical attribution reference
```

以下能力延后：

```text
Commitment creation
Commitment confirmation
Contract composition
Payment execution
Fulfillment lifecycle
Cancellation / Amendment orchestration
```

ADR-005 的 Commitment 语义不改变 Stage 2 的最小范围。

## 7. Account ↔ Identity Relationship

正式采用独立关系模型：

```text
Authentication Account
        ↓
Account–Identity Membership / Authorization
        ↓
Identity
```

关系语义：

- 一个 Account 可以关联一个或多个 Identity；
- 一个 Identity 至少需要一个有效 Account authorization 才能被管理；
- Account 与 Identity 的关系独立于 Identity 本身；
- Account access 可以被撤销、暂停或失效；
- Identity 不保存 authentication secrets；
- Account 登录不自动获得所有 Profile mutation 权限；
- Profile authorization 必须通过独立的 authorization policy 判断。

Account–Identity relationship 最小概念字段：

```text
accountId
identityId
relationship state
role / authority
createdAt
revokedAt?
```

该关系的最终 role taxonomy、共同控制和 delegated administration 仍需后续授权设计，但不得扩大 Stage 2。

## 8. Identity Lifecycle

推荐最小 Identity lifecycle：

```text
ACTIVE
→ SUSPENDED
→ ARCHIVED
```

语义：

| State | Meaning |
|---|---|
| `ACTIVE` | Identity 可作为稳定主体锚点，授权 Account 可管理其 Profiles。 |
| `SUSPENDED` | Identity 暂停新的正常商业活动；历史 attribution 与只读审计仍保留。 |
| `ARCHIVED` | Identity 不再接受新的商业活动；主体连续性和历史引用永久保留。 |

影响规则：

- Identity suspended 时，其 Profiles 默认不能创建新的正常商业活动。
- Identity suspended 不删除 Profiles 或历史 Commerce Objects。
- Identity archived 时，Profiles 进入受控的不可新增状态，但不删除历史对象。
- Profile 不应绕过 Identity archived 状态继续产生新的商业活动。
- Identity lifecycle 变化必须产生可审计事件。
- 恢复能力需要独立 policy；本 ADR 不默认授予自动恢复。

## 9. Commerce Profile Lifecycle

正式沿用：

```text
DRAFT
→ ACTIVE
→ SUSPENDED
→ ARCHIVED
```

### DRAFT

可以：

- 编辑 presentation data；
- 准备未来商业资料；
- 建立尚未公开的 Profile configuration。

不能：

- 作为正常 public commerce flow 的有效主体；
- 创建新的正常 Inventory-backed Commitment。

### ACTIVE

可以：

- 被未来 Offer、Availability、Commerce Relationship 和 Commitment 引用；
- 作为正常商业展示与授权边界。

### SUSPENDED

禁止：

- 新商业活动；
- 新 Offer / Availability-backed activity；
- 新 Inventory-backed Commitment。

保留：

- 历史对象；
- 只读历史归属；
- 已有审计记录。

### ARCHIVED

禁止：

- 新商业活动；
- 新 Offer；
- 新 Availability；
- 新 Commitment。

保留：

- 历史 attribution；
- 已有关联对象；
- 未来 Commerce ID reference 的挂载位置；
- 审计与只读查询能力。

正式规则：

```text
ARCHIVED ≠ DELETE
```

Profile archive 不影响同一 Identity 下其他 Profiles。

## 10. Profile Public Representation

Stage 2 不提供：

```text
Public Profile Page
Commerce ID
/c/{commerce_id}
```

Stage 2 只建立内部 Commerce Profile object、presentation data 和 authorization boundary。

公共入口属于后续阶段：

```text
Commerce Profile
        ↓
Commerce ID
        ↓
/c/{commerce_id}
```

并且：

```text
Commerce Profile ID ≠ Commerce ID
Identity ID ≠ Commerce ID
creatorId ≠ Identity ID
```

## 11. Identity ID / Profile ID

正式区分：

```text
Identity ID
    = private internal stable subject identifier

Commerce Profile ID
    = internal Profile identifier

Commerce ID
    = future public stable identifier
```

Stage 2 禁止：

- 使用 Account ID 作为 Identity ID；
- 使用 `creatorId` 作为 Identity ID；
- 使用 Identity ID 作为 Commerce Profile ID；
- 使用 Commerce Profile ID 作为 Commerce ID；
- 为任何现有记录生成 Commerce ID。

## 12. Legacy Compatibility Options

### Option A — Stage 2 执行实际 Migration

范围：

```text
建立新 Identity/Profile
迁移 legacy creator records
切换消费者
```

风险：

- 影响 VS-01 稳定性；
- 需要迁移、回滚和历史验证；
- 容易把兼容任务扩大为数据重构。

### Option B — New Model + Compatibility Adapter

范围：

```text
建立 Identity/Profile model
建立 deterministic compatibility mapping
保留 legacy source contract
通过 adapter 提供新旧模型映射
```

优点：

- 风险最低；
- 保持现有 Prototype 行为；
- 可以先验证 1 Identity : N Profiles；
- 可将真实数据迁移延后到独立 Migration Stage；
- 回滚边界清晰。

### Option C — Synchronous Migration of All Records

范围：

```text
同步迁移所有 Offer、Availability、Request、Reservation、
Contract、Paid Order 和历史金融记录
```

结论：

- 范围远超 Stage 2；
- 风险和回滚复杂度最高；
- 会把 Offer、Inventory、Commitment 和 Financial architecture 提前引入；
- 与“最小 Foundation”目标冲突。

### Selected Strategy

选择：

```text
Option B — New Model + Compatibility Adapter
```

Stage 2 不执行全量 legacy data migration，不迁移所有历史 records，不改变旧模型 Source of Truth。真实 data migration 必须作为独立、Founder-approved 的后续变更单元。

允许的最小 mapping contract：

```text
legacy creatorId
        → legacy subject mapping
        → Identity
        → initial Commerce Profile
```

## 13. Current Prototype Preservation

VS-01 existing behavior 是受保护的 compatibility contract，至少包括：

```text
Creator Identity
Service Offering
Publish
Share
Request
Confirmation
```

Compatibility Boundary：

```text
Legacy Prototype Contract
        ↓
Compatibility Adapter
        ↓
Identity / Commerce Profile Foundation
```

Stage 2 不得因为新模型而静默改变：

- 现有 Request semantics；
- Offer state transitions；
- Reservation lifecycle；
- Contract / Paid Commerce validation behavior；
- 现有历史 `creatorId` attribution。

若新模型无法保持 VS-01 行为，必须停止并记录为 migration / product decision blocker。

## 14. Stage 2 API Scope

以下是未来 Stage 2 application capability 的设计范围，不是本 ADR 的实现：

```text
CreateIdentity
GetIdentity
GetIdentityStatus

CreateCommerceProfile
GetCommerceProfile
UpdateCommerceProfile
ActivateCommerceProfile
SuspendCommerceProfile
ArchiveCommerceProfile
ListCommerceProfiles
```

必要的应用上下文：

- current Account authentication context；
- Account–Identity authorization context；
- current Profile context；
- Profile-specific mutation authorization；
- legacy compatibility context；
- historical read-only context。

Stage 2 是否需要 profile switching，应实现为显式 current Profile context，不应依赖全局默认 Profile。

不实现：

- Public Commerce Entry；
- Commerce ID lookup；
- Platform OAuth；
- Commitment API；
- Payment API；
- Reputation API。

## 15. Stage 2 Persistence Scope

未来 Stage 2 persistence 设计至少包含：

```text
Identity persistence
Commerce Profile persistence
Account ↔ Identity relationship persistence
Legacy subject mapping persistence
```

### Identity Persistence

必须支持：

- stable unique Identity ID；
- lifecycle；
- timestamps；
- archive / suspension history；
- 不依赖 Account ID 充当 Identity ID。

### Commerce Profile Persistence

必须支持：

- stable unique Commerce Profile ID；
- exactly one controlling Identity；
- lifecycle；
- presentation data；
- timestamps；
- Profile-specific historical attribution。

### Account–Identity Relationship

必须支持：

- Account 与多个 Identity 的未来扩展；
- relationship lifecycle；
- authorization state；
- revocation；
- auditability。

### Legacy Mapping

Stage 2 需要一个可审计的 deterministic mapping contract。其最终持久化形式可以是独立 mapping relation，也可以是等价的受控 mapping reference，但必须保证：

- legacy `creatorId` 唯一映射；
- Identity 唯一映射；
- initial Profile 唯一映射；
- idempotency；
- 原始 legacy reference 不丢失；
- 映射冲突 fail closed。

本 ADR 不创建 schema、不选择具体表结构。

## 16. Security and Authorization

Stage 2 安全边界：

```text
Account Authentication
        ↓
Account–Identity Relationship
        ↓
Identity Authorization
        ↓
Profile Authorization
        ↓
Profile-scoped Capability Authorization
```

必须保证：

- Account 登录不自动获得全部 Profiles 的 mutation 权限；
- Profile A authorization 不自动适用于 Profile B；
- Actor runtime context 必须通过 authorization policy；
- 历史只读权限与 mutation 权限分离；
- Suspended / Archived Profile 的写入被拒绝；
- Identity archived 后不能通过其他 Profile context 继续创建新商业活动；
- authorization failure fail closed。

Capability authorization 只定义边界，不在 Stage 2 拆分当前 `capabilityIds` 或实现 Capability model。

## 17. Migration Safety

Stage 2 不执行全量 migration，但必须为未来 migration 定义安全前置条件：

### Preconditions

- Identity/Profile model 已通过 Founder approval；
- mapping source 与唯一性规则已确定；
- VS-01 regression baseline 已保存；
- legacy record inventory 已完成；
- rollback owner 与 evidence format 已确定。

### Dry Run

- 先执行只读 deterministic mapping；
- 输出 unmapped、ambiguous、duplicate candidates；
- 不写入生产事实；
- 不改变旧 Source of Truth。

### Idempotency

- 同一 `creatorId` 重复执行得到同一 mapping；
- 已存在 mapping 不创建重复 Identity/Profile；
- mapping conflict fail closed。

### Validation

- 统计 legacy records 与 mappings；
- 验证每个 initial Profile 的唯一性；
- 验证历史 Offer、Request、Reservation、Contract、Paid Order attribution；
- 验证 VS-01 behavior；
- 验证 Profile isolation；
- 验证 lifecycle gates。

### Failure Behavior

- 发现歧义时停止对应 subject；
- 不自动合并；
- 不覆盖现有 legacy reference；
- 不继续进行 partial migration；
- 保留可审计失败记录。

## 18. Acceptance Criteria

### AC-01

一个 authenticated Account 可以在授权条件下创建并管理一个 Identity。

### AC-02

Identity ID 稳定、唯一，并独立于 Account ID。

### AC-03

一个 Identity 可以创建至少两个 Commerce Profiles。

### AC-04

两个 Profiles 的 ownership 与 authorization 完全隔离。

### AC-05

Archive Profile A 不影响同一 Identity 下的 Profile B。

### AC-06

Legacy `creatorId` 可以 deterministic mapping 到一个 Identity 与一个 initial Profile。

### AC-07

重复 mapping 不创建重复 Identity 或 Profile。

### AC-08

历史 Prototype records 保持可追溯 attribution。

### AC-09

Profile lifecycle gates 对 DRAFT、ACTIVE、SUSPENDED、ARCHIVED 生效。

### AC-10

Identity lifecycle gates 对 ACTIVE、SUSPENDED、ARCHIVED 生效，并保留历史 continuity。

### AC-11

Profile A authorization 不能访问或修改 Profile B 的 mutation surface。

### AC-12

VS-01 existing behavior 保持通过，不因新模型改变既有 Request、Offer 或 Reservation semantics。

### AC-13

系统不会隐式启用 Commerce ID、OAuth、Platform Binding、Commitment runtime 或 Payment runtime。

### AC-14

映射缺失、冲突或歧义时 fail closed，不产生猜测性 Identity/Profile。

## 19. Entry Conditions

进入 Stage 2 implementation 前必须满足：

1. ADR-001、ADR-002、ADR-003、ADR-004、ADR-005 的接受状态已被 Main Control 明确记录。
2. ADR-006 获得 Founder / Main Control 明确批准。
3. Identity/Profile 最小 data model 获得独立批准。
4. Account–Identity relationship 与 authorization policy 获得独立批准。
5. Compatibility Adapter 与 legacy mapping contract 获得独立批准。
6. Stage 2 implementation change unit、测试计划和回滚计划获得批准。
7. VS-01 baseline 与当前工程验证证据可复用或重新确认。

## 20. Exit Criteria

Stage 2 implementation 只有在以下条件全部满足时才可宣告完成：

- Identity persistence 与 lifecycle 可用；
- Commerce Profile persistence 与 lifecycle 可用；
- 一个 Identity 可创建多个 Profiles；
- Profile-specific authorization 生效；
- Account–Identity relationship 可审计；
- deterministic legacy mapping 可验证；
- VS-01 compatibility contract 保持；
- historical attribution 可追溯；
- Profile archive / suspension gates 生效；
- 没有隐式启用 Commerce ID、OAuth、Platform Binding、Commitment、Payment 或 Reputation runtime；
- 针对 Stage 2 的单元、集成、验收和安全验证通过；
- migration safety evidence 或明确的 no-migration evidence 完成。

## 21. Founder Decisions Required

以下问题在 Stage 2 implementation 前仍需明确批准：

- Account–Identity relationship 的最小 role / authority taxonomy；
- Identity suspended 时 Profiles 的精确状态传播规则；
- Identity archived 是否自动 archive Profiles，或进入独立 blocked state；
- Profile recovery / reactivation 是否允许；
- legacy mapping 的最终 persistence form；
- legacy unmapped / ambiguous subject 的人工处理方式；
- Stage 2 是否允许 Profile presentation data 的最小字段集合；
- 是否允许一个 Account 在 Stage 2 创建多个 Identities，还是仅保留架构扩展；
- Profile switching 的 UX / application boundary。

这些问题不改变 Stage 2 的最小范围，但未决前不得开始实现。

## 22. Stage 2 Architecture Debt

### Included in Stage 2

```text
Identity persistence
Commerce Profile persistence
Account–Identity membership
Legacy compatibility mapping
Profile authorization
Identity / Profile lifecycle
Historical attribution boundary
VS-01 compatibility adapter
```

### Deferred Beyond Stage 2

```text
Capability semantic split
Offer generalized model
Inventory redesign
Commerce Commitment runtime
Contract / Payment orchestration
Commerce ID
External Platform Relationship
Reputation
Financial architecture
Public Commerce Entry
```

## 23. Stage 2 Readiness Gate

```text
STAGE_2_ARCHITECTURE_STATUS = READY_WITH_CONDITIONS
```

### Ready Conclusions

- Identity 与 Commerce Profile 的核心边界已关闭；
- `1 Identity : N Commerce Profiles` 已冻结；
- Profile lifecycle 已冻结；
- `creatorId` compatibility role 已定义；
- Profile-level ownership 与 authorization boundary 已定义；
- Stage 2 non-goals 已明确；
- Acceptance criteria 已形成。

### Conditions

- ADR-005 仍需 Main Control 接受；
- ADR-006 仍需 Founder / Main Control 批准；
- Account–Identity authorization detail 仍需关闭；
- Identity lifecycle propagation policy 仍需关闭；
- legacy mapping persistence 与人工异常处理仍需关闭；
- Stage 2 implementation plan 与 rollback plan 仍需批准。

### Implementation Authorization

即使本 ADR 最终被接受，也不自动授权实现：

```text
STAGE_2_IMPLEMENTATION_AUTHORIZATION = NOT_GRANTED
```

## 24. Decision and Consequences

### Decision

本 ADR 提议将 Stage 2 限定为最小 Identity + Commerce Profile Foundation，采用 New Model + Compatibility Adapter 策略，不执行全量 legacy data migration，不实现 Commerce ID、External Platform Binding、Commitment、Inventory、Payment 或 Reputation。

### Rationale

该范围可以验证 Identity continuity、Profile multiplicity、Profile isolation 和 legacy attribution，同时保护已经完成验证的 VS-01，避免把后续所有 Domain Architecture 一次性拉入 Stage 2。

### Consequences

- Stage 2 的实现边界清晰且可独立验收。
- 现有 Prototype 可通过 compatibility adapter 继续运行。
- 真实历史数据迁移被推迟到独立授权的 migration stage。
- 后续 Offer、Inventory、Commitment 和 Platform Relationship 可安全挂载到 Profile。
- Stage 2 仍需要明确 authorization 和 mapping 的 Founder decisions。

### Rejected Alternatives

- Stage 2 同时实现全部 PCI Domain Architecture；
- Stage 2 同步迁移所有历史 Commerce records；
- 直接把 `creatorId` 改名为 `identityId`；
- 直接把 `CommerceIdentity` 宣布为最终 Commerce Profile；
- 在 Stage 2 生成 Commerce ID；
- 在 Stage 2 引入 OAuth 或 Platform Binding；
- 在 Stage 2 重写 Offer、Inventory、Reservation 或 Commitment runtime。

## 25. Status and Approval Boundary

```text
STATUS = PROPOSED
```

本 ADR 不声称已被 Founder / Main Control 接受。只有明确批准后，才可作为 Stage 2 implementation contract 使用。

## 26. Current Project State

```text
PRODUCT_DIRECTION = FROZEN_V1
PRODUCT_STAGE = STAGE_0
STAGE_2_IMPLEMENTATION = NOT_AUTHORIZED
STAGE_2_IMPLEMENTATION_AUTHORIZATION = NOT_GRANTED
PROJECT_STATUS = SUSPENDED
REAL_MONEY_ENABLED = false
apps/app = DEFERRED
```
