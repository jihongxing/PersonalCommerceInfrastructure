# 22 — Stage 2 Founder Decision Package

> **状态**：`READY_FOR_FOUNDER_DECISION`
> **决策包编号**：`PCI-STAGE2-ENTRY-001`
> **日期**：2026-08-26
> **权威**：Main Control / Founder
> **性质**：Stage 2 Entry Readiness / Architecture Decision Preparation
> **实现授权**：`STAGE_2 = NOT AUTHORIZED`
> **后续阶段**：`STAGE_3 = NOT AUTHORIZED`

## 1. 目的、输入与非授权边界

本文件将 Stage 2 Identity Architecture 的待决事项压缩为 Founder 可逐项
`APPROVE`、`MODIFY` 或 `REJECT` 的 Decision Package。它不重新打开已经完成的产品语义，
不等于 Stage 2 实现完成，也不构成任何实现授权。

本包基于以下已确认输入：

```text
PCI-DIRECTION-001 = COMPLETE
PRODUCT_DIRECTION_ALIGNMENT = PASS

COMMERCE_REFERENCE = FROZEN
QR_SEMANTICS = FROZEN

STAGE_2 = NOT AUTHORIZED
STAGE_3 = NOT AUTHORIZED
```

本包的证据来源分层如下：

| 来源 | 用途 |
| --- | --- |
| `05_Personal_Commerce_Infrastructure_Product_Direction.md` | 已对齐的长期产品语义、阶段边界和词汇规则。 |
| `06_Commerce_Reference_Research.md`、`07_Commerce_Reference_Product_Spec.md` | 已冻结的 Commerce Reference / C号及 QR 表示语义。 |
| `59_Identity_Anchor_and_Commerce_ID.md`、`22_Project_Handoff.md` | 项目暂停基线、Identity Anchor 方向和恢复治理边界。 |
| 当前 `HEAD` 的 VS-01 domain / contract / test | 当前 `CommerceIdentity`、`creatorId` 和 Creator API 是历史验证模型，不是 canonical Stage 2 runtime。 |
| 当前工作树的 ADR-001..008 | 未提交的架构提案与风险材料；只作参考，不构成 Founder 已批准事实。 |

本包不授权：

```text
database migration
schema change
domain implementation
API / OpenAPI change
OAuth
External Platform Account binding
Commerce Reference generation or persistence
QR runtime
resolver
Web UI / apps/app
Payment / Settlement / Refund
Marketplace / CRM
REAL_MONEY_ENABLED = true
```

## 2. 已冻结事实与本包决策范围

### 2.1 已冻结，不重新决策

```text
Authentication Account
        ≠
Internal Identity
        ≠
Commerce Profile
        ≠
Commerce Reference / C号

1 Internal Identity : N Commerce Profiles

Relationship
= 广义个人商业关系

Commerce Relationship
= External Platform Account 与 Commerce Profile 的专用绑定关系
```

```text
Commerce Reference / C号
= Commerce Profile 的公开、平台中立引用

QR
= C号的机器可读表示
```

Commerce Reference 的以下事实已由 Founder 决策冻结，不是本包的重新选择项：

```text
18 uppercase ASCII characters
Alphabet = 3479ACDEFHJKMNPQRTVWXY
Canonical punctuation = none
6-6-6 grouping = display only
CSPRNG direction
UNIQUE constraint + collision retry direction
Public / stable / immutable / permanent
Never reusable / non-sequential / non-credential
QR = representation, not identifier
```

### 2.2 本包需要 Founder 决定

本包只将 Stage 2 架构和治理选择整理为可决事项：

1. canonical concepts 的 Stage 2 采用范围；
2. ID namespace 与禁止替换规则；
3. Identity 与 Commerce Profile 的 ownership / cardinality；
4. Profile management、生命周期、转移和恢复；
5. External Platform Account 的数据模型边界；
6. Commerce Relationship 的 active / historical / role 规则；
7. VS-01 `Creator Identity` 的兼容语义；
8. Relationship 术语执行规则；
9. Commerce Reference 的 Stage 2 / Stage 3 安全责任边界。

## 3. Canonical Relationship Map

推荐关系图如下。图中的关系名称是产品 / 架构语义，不要求当前 runtime 已存在。

```text
Authentication Account
        │
        │ authenticates; receives explicit authorization membership
        ▼
Internal Identity
        │
        │ owns
        ▼
Commerce Profile
        │
        │ identified by
        ▼
Commerce Reference / C号

External Platform Namespace
        │
        │ contains
        ▼
External Platform Account
        │
        │ may bind through
        ▼
Commerce Relationship
        │
        │ binds to
        ▼
Commerce Profile
```

说明：

- Authentication Account 的登录能力不自动形成 Identity 或 Profile 的 mutation authority。
- Internal Identity 是 Profile 的 owner；Profile 不是 Account 的别名。
- Commerce Reference 只识别 Profile，不承担 ownership、session、tracking、authentication 或 authorization。
- External Platform Account 属于第三方平台 namespace；它通过 Commerce Relationship 连接 Profile，不能替代 Internal Identity。
- Relationship（客户、成员、合作伙伴等广义商业关系）不在此绑定图中，不能被当作 Commerce Relationship。

## 4. ID Namespace Matrix

下表中的“不可变”指 identifier value 不应因关联对象的展示名、生命周期或管理关系变化而改写；
不表示对象本身不可暂停、归档或失效。“显式 typed relation”指未来 schema / contract 只能用具名、
受约束的关联表达引用，不能把一个 namespace 的字符串当成另一个 namespace 的值解释。

| ID | Owner | Scope | Public | Immutable | Credential | 可否作为另一 namespace 的 foreign key | Cross-namespace substitution |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Authentication Account ID | Authentication Account | PCI authentication namespace | No | 推荐 Yes；不得重分配 | No；凭证、session、token 与 ID 分离 | 仅可作为显式 Account membership / audit relation target | Prohibited |
| Internal Identity ID | Internal Identity | PCI internal subject namespace | No | 推荐 Yes；不得重分配 | No | 可作为 Commerce Profile ownership、membership、audit 的显式 target | Prohibited |
| Commerce Profile ID | Commerce Profile | PCI commerce-profile namespace | No（除非未来独立公开表面决定） | 推荐 Yes；不得重分配 | No | 可作为 Offer / Availability / Commitment 等对象的显式 owner target | Prohibited |
| Commerce Reference / C号 | Commerce Profile | public commerce-reference namespace | Yes | Yes | No | 不应用作内部 owner foreign key；仅作为未来公开 lookup input | Prohibited |
| External Platform Account ID | External Platform Account | `(External Platform Namespace, platform account identifier)` | Conditional；handle 可公开，底层平台 ID 依平台与披露政策决定 | 在 PCI 记录中推荐保持原始关联值；handle 可变化 | No | 仅可作为 Commerce Relationship 的显式 external-account target | Prohibited |
| Commerce Relationship ID | Commerce Relationship | PCI binding-history namespace | No | 推荐 Yes；不得重分配 | No | 可作为验证、审计和有效期事实的显式 target | Prohibited |
| Commerce Object ID | 对应 Commerce Object | object-specific PCI namespace | Default No | 推荐 Yes；不得重分配 | No | 仅可作为其正式定义关系中的 typed target | Prohibited |

正式规则：

```text
No identifier may be interpreted across namespaces because its string looks similar.

Account ID ≠ Identity ID ≠ Commerce Profile ID ≠ Commerce Reference
          ≠ External Platform Account ID ≠ Commerce Relationship ID
          ≠ Commerce Object ID
```

对“能否作为 foreign key”的推荐决策是：允许显式 typed relation，而不是“同一字符串可跨域复用”。
例如 Profile 可以保存 `identityId` ownership relation；它不能把 C号作为内部 ownership key，更不能把
`creatorId` 直接重解释为任何 canonical ID。

## 5. Lifecycle Matrix

以下为推荐生命周期策略；`FOUNDER DECISION REQUIRED` 表示本包要求 Founder 选择该推荐或替代方案，
并不表示已经冻结。

| 对象 | Creation | Activation | Suspension | Closure / Archive | Reactivation | Transfer | Deletion | Historical retention |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Internal Identity | 创建独立 Identity ID；不得由 Account ID 或 `creatorId` 复用 | `ACTIVE` 时可作为 Profile owner | 推荐全局阻止新的正常商业 mutation；保留历史 attribution | `ARCHIVED` 后不再开展新商业活动 | 推荐不在 Stage 2 自动恢复；例外需独立可审计 policy | 推荐 No | 推荐 No physical deletion | 永久保留主体连续性与审计引用 |
| Commerce Profile | 必须依附一个 owning Identity；独立 Profile ID | `ACTIVE` 前满足未来最小完整性门槛 | 暂停新商业活动；历史对象保留 | `ARCHIVED` 为逻辑关闭，不删除历史 | 推荐 `SUSPENDED → ACTIVE` 可由获授权 policy 恢复；`ARCHIVED` 不自动恢复 | 推荐 No default；例外需独立审计 policy | 推荐 No physical deletion | 保留 Profile、对象归属与历史事实 |
| Commerce Reference / C号 | 在未来获授权分配给一个 Profile | 无单独 activation；随 Profile 的引用存在 | 不重发、不改写 | Profile 关闭后仍永久保留 | 不适用；Reference 不因 Profile 状态变化而改变 | No | Never | `Assigned → Permanently Reserved`；永不复用 |
| External Platform Account | 记录平台 namespace 与 account identifier；不以 handle 作为唯一稳定性假设 | 经未来 verification policy 后可具备有效绑定资格 | 可标记不可用 / 未验证 / 失效；不影响 Identity 连续性 | 账户失效、平台关闭或解绑时结束 active binding | 可在同一外部账号事实仍可验证时由 future policy 决定 | 账号本身不“转移”为 PCI Identity；可通过新 binding 关联另一 Profile | 推荐不物理删除绑定证据 | 保留原始平台、账号、验证和解绑历史 |
| Commerce Relationship | 创建绑定候选，记录 account、Profile、role、effective time | `ACTIVE` 仅在满足 verification / policy 后成立 | 可暂停而保留关联证据 | unbind / revoke / expiry 结束 active effect | 可创建新的 active relationship；不应重写旧关系 | 不转移旧 relationship；迁移必须 close old + create new historical record | 推荐 No physical deletion | 历史 unbind / revoke 记录永久保留 |

## 6. Founder Decision List

以下每一项只处理一个核心问题。所有 `RECOMMENDED` 内容均等待 Founder 的
`APPROVE`、`MODIFY` 或 `REJECT`，除非该项明确引用上节“已冻结事实”。

### STAGE2-DECISION-001 — Canonical Concepts Adoption

| 项目 | 内容 |
| --- | --- |
| Definition | 在 Stage 2 architecture 中采用 `Internal Identity`、`Commerce Profile`、`Commerce Reference`、`External Platform Account`、`Commerce Relationship` 五个 canonical concepts。 |
| Current Evidence | Product Direction 已完成语义对齐；HEAD 仅有 VS-01 `CommerceIdentity` / `creatorId` prototype 模型；C号与 QR 设计已冻结但未实现。 |
| Current Recommendation | **RECOMMENDED：采用五个 concepts 作为唯一 canonical vocabulary；`Commerce ID` 仅是历史 / 产品叙事中的同义指向，技术名称统一为 `Commerce Reference`。** |
| Alternatives | 保留 `CommerceIdentity` 为终局模型；或新增第三套“个人商业身份”对象。 |
| Consequences | 形成稳定的 Stage 2 vocabulary；现有 `CommerceIdentity` 必须走 compatibility boundary，不能直接改名。 |
| Open Risk | 具体 schema、API 和 migration 尚未授权。 |
| Founder Decision Required | APPROVE / MODIFY / REJECT canonical vocabulary adoption。 |

### STAGE2-DECISION-002 — ID Namespace Non-substitution Rule

| 项目 | 内容 |
| --- | --- |
| Definition | 采用第 4 节的 ID Namespace Matrix；每种 ID 是独立 namespace，只有显式 typed relation 才能引用另一对象。 |
| Current Evidence | HEAD 使用 `creatorId` 横跨 Actor、CommerceIdentity 和多个历史对象；ADR compatibility audit 已证明其不能安全重解释为 Identity ID 或 Profile ID。 |
| Current Recommendation | **RECOMMENDED：所有 canonical ID 独立生成、不可重分配；禁止任何字符串相似导致的 cross-namespace substitution。** |
| Alternatives | 复用 Account ID、`creatorId` 或 C号作为新对象主键。 |
| Consequences | 降低授权混淆、对象误归属和未来多 Profile / 多账号冲突；需要未来 compatibility mapping。 |
| Open Risk | 每类内部 ID 的精确编码 / generator 仍是 implementation design，不在本次冻结。 |
| Founder Decision Required | APPROVE / MODIFY / REJECT namespace rule。 |

### STAGE2-DECISION-003 — Identity Ownership and Profile Cardinality

| 项目 | 内容 |
| --- | --- |
| Definition | Internal Identity 是 Commerce Profile 的唯一 owning subject；一个 Identity 可拥有 N 个 Profiles。 |
| Current Evidence | Product Direction 已冻结 `1 Internal Identity : N Commerce Profiles`；Profile 不可脱离 Identity。 |
| Current Recommendation | **RECOMMENDED：一个 Profile 恰有一个 owning Identity；一个 Identity 可拥有 Personal Creator、Studio、Group、Brand、Business 等多个 Profiles；Profile 不可无 owner。** |
| Alternatives | 多 Identity 共同拥有一个 Profile；Profile 无 owner；一个 Identity 只能有一个 Profile。 |
| Consequences | 单一 owner 保持归属、审计和 lifecycle 清晰；多方协作通过 management authorization 处理，而不改变 ownership。 |
| Open Risk | 多 owner / equity / organization governance 是 Future Design，不纳入 Stage 2。 |
| Founder Decision Required | APPROVE / MODIFY / REJECT single-owner Profile model。 |

### STAGE2-DECISION-004 — Profile Management, Lifecycle and Transfer

| 项目 | 内容 |
| --- | --- |
| Definition | 区分 owner、manager、delegated manager、Profile lifecycle 与 Identity lifecycle。 |
| Current Evidence | Product Direction 已规定 Profile `DRAFT → ACTIVE → SUSPENDED → ARCHIVED`、不脱离 Identity、默认不支持 Identity-to-Identity transfer；Identity 与 Profile lifecycle 不可合并。 |
| Current Recommendation | **RECOMMENDED：Owner ≠ Manager。owner 是 owning Identity；manager 是经 explicit Account–Identity / Profile authorization 的执行主体。Stage 2 采用 OWNER-only mutation authority；delegated manager 仅保留未来扩展点，不实现。Profile default non-transferable；Identity 关闭不删除 Profile 历史；C号关闭后永久保留。** |
| Alternatives | 登录即管理；Account 成为 owner；共享 Profile owner；Stage 2 支持 Profile transfer / delegation。 |
| Consequences | 先以最小权限模型建立可审计控制边界；未来可扩展 manager，而不篡改 owner 事实。 |
| Open Risk | `ARCHIVED` 是否允许受控恢复、例外 transfer 流程与 delegation role taxonomy 均需后续独立 policy。 |
| Founder Decision Required | APPROVE / MODIFY / REJECT authority、archive recovery 与 non-transferable default。 |

### STAGE2-DECISION-005 — External Platform Account Model

| 项目 | 内容 |
| --- | --- |
| Definition | External Platform 是 namespace；External Platform Account 是平台内具体账号；其与 Profile 的关联只经 Commerce Relationship 表达。 |
| Current Evidence | Product Direction 与 Handoff 都要求 `1 Identity → N Commerce Profiles → N External Platforms → N Accounts`，并允许同一平台多个账号。 |
| Current Recommendation | **RECOMMENDED：拒绝 one person = one account、one profile = one account per platform、one account = one profile 等假设。允许一个 Profile 跨平台及同平台 N 个 accounts；External Platform Account 不等于 Identity 或 Profile。** |
| Alternatives | 将 handle 直接作为 Profile identity；按平台限制单账号；将外部账号绑定等同于 PCI ownership。 |
| Consequences | 保留平台迁移、多品牌、主 / 次账号和历史绑定能力；不会让第三方 namespace 成为 PCI authority。 |
| Open Risk | 账号 identifier 的采集、验证、OAuth、handle 变更和平台 API 细节均不在 Stage 2 runtime。 |
| Founder Decision Required | APPROVE / MODIFY / REJECT multi-account, multi-platform model。 |

### STAGE2-DECISION-006 — Commerce Relationship Active and Historical Rules

| 项目 | 内容 |
| --- | --- |
| Definition | Commerce Relationship 是 External Platform Account 与 Commerce Profile 的绑定历史对象，包含 verification、role、binding / unbinding 与 effective time。 |
| Current Evidence | Product Direction 已给出 `PROPOSED → VERIFIED → ACTIVE → SUSPENDED → REVOKED → HISTORICAL` 方向；治理记录要求 active association 与 historical record 分离。 |
| Current Recommendation | **RECOMMENDED：一个 External Platform Account 同一时刻最多一个 `ACTIVE` Commerce Relationship；一个 Profile 可有 N 个 active accounts；owner 与 manager 是 Profile authorization 概念，可共存但不改变 external account 的单一 active Profile binding。解绑 / 迁移采用 close old relationship + create new relationship，不删除、不重写旧历史。** |
| Alternatives | 一个账号同时 active bind 两个 Profiles；删除解绑记录；直接修改旧记录的 Profile ID；以客户 / member 关系充当绑定记录。 |
| Consequences | 保持当前归属、历史时序、平台账号迁移与审计清晰；防止一个外部账号在两个 Profile 间产生并发归属歧义。 |
| Open Risk | 多 Profile 联营、共享品牌账号、联合管理或特殊 platform role 是 Future Policy；如未来需要，必须引入明确的多方 binding model，而不是破坏单一 active rule。 |
| Founder Decision Required | APPROVE / MODIFY / REJECT single-active-binding、history retention、migration pattern 与 role separation。 |

推荐的 Commerce Relationship 最小事实模型：

```text
commerceRelationshipId
externalPlatformAccountId
commerceProfileId
relationshipRole
verificationStatus
effectiveAt
expiredAt / unboundAt
status
historical audit facts
```

该字段清单是 architecture contract，不是 schema 或 implementation authorization。

### STAGE2-DECISION-007 — VS-01 Creator Identity Compatibility

| 项目 | 内容 |
| --- | --- |
| Definition | 确定 `VS-01 Creator Identity` 与 future canonical Identity / Profile 的兼容语义。 |
| Current Evidence | HEAD 的 `CommerceIdentity` 由 `creatorId` 主键锚定，承载公开 profile 与 capability；`creatorId` 同时参与 Actor、Offer、Request、Reservation、Contract 和历史记录。 |
| Current Recommendation | **RECOMMENDED：将 `creatorId` 定义为 Legacy Compatibility Subject Reference；将 VS-01 `CommerceIdentity` 视为 legacy application-level identity / Profile-like projection。未来通过 deterministic compatibility mapping 关联一个 new Identity 与一个 initial Commerce Profile；禁止直接字段重命名或直接 ID reuse。** |
| Alternatives | `creatorId = Identity ID`；`creatorId = Commerce Profile ID`；永久 dual-write 且无 single truth；一次性替换。 |
| Consequences | 保留 VS-01 的已验证行为和历史 attribution；为多 Profile 模型留出安全映射边界。 |
| Open Risk | mapping 的持久化、migration、歧义处理、backfill 和 API compatibility 全部仍需独立设计与授权。 |
| Founder Decision Required | APPROVE / MODIFY / REJECT compatibility-subject strategy。 |

```text
VS-01 Creator Identity
≠ Canonical Internal Identity

legacy creatorId
        ↓
Legacy Compatibility Subject Reference
        ↓
future deterministic mapping
        ├── Internal Identity
        └── initial Commerce Profile
```

### STAGE2-DECISION-008 — Relationship Terminology Enforcement

| 项目 | 内容 |
| --- | --- |
| Definition | 执行 `Relationship` 与 `Commerce Relationship` 的正式词汇隔离。 |
| Current Evidence | Product Direction 已完成此术语对齐；长期 Reputation / customer facts 依赖避免把关系对象混为平台绑定。 |
| Current Recommendation | **RECOMMENDED：Customer、Client、Member、Partner、Follower、Lead、Collaborator 等均为广义 Relationship 候选，不得被解释为 Commerce Relationship，除非未来另有明确领域定义。** |
| Alternatives | 用一个泛化 Relationship 同时承载客户关系和平台账号绑定。 |
| Consequences | 避免 CRM、Social Graph、平台绑定与授权审计混用；允许未来分别演化。 |
| Open Risk | 广义 Relationship 的独立对象模型不属于 Stage 2 最小实现范围。 |
| Founder Decision Required | APPROVE / MODIFY / REJECT terminology enforcement。 |

### STAGE2-DECISION-009 — Commerce Reference Security Responsibility Boundary

| 项目 | 内容 |
| --- | --- |
| Definition | 不改变已冻结 C号编码，只确定 enumeration、resolver 与 lookup abuse 的阶段责任归属。 |
| Current Evidence | C号是 public, non-credential, URL-independent Profile reference；randomness 和 large namespace 不替代 enumeration controls；public resolver 尚未实现。 |
| Current Recommendation | **RECOMMENDED：Stage 2 只记录 Reference 的 ownership 与 lifecycle contract，不暴露 resolver、不实现 lookup、不定义 rate limits。Stage 3 Security Boundary 必须在 resolver 授权前单独冻结 rate limiting、unknown-reference behavior、bulk discovery protection、abuse monitoring、access control 和 public-data minimization。** |
| Alternatives | Stage 2 直接提供公开 lookup；用随机性代替 abuse controls；将 C号用作 authentication proof。 |
| Consequences | 保持 C号与 Stage 3 public-entry / security work 的边界；避免无意公开数据面。 |
| Open Risk | resolver 的公开范围、数据披露、匿名 lookup 和 anti-enumeration policy 均待未来 Founder decision。 |
| Founder Decision Required | APPROVE / MODIFY / REJECT Stage 2 / Stage 3 security separation。 |

## 7. Commerce Reference Security Boundary

### 7.1 FROZEN（既有 Founder 决策）

```text
Commerce Reference belongs to Commerce Profile
18-character uppercase canonical form
Alphabet = 3479ACDEFHJKMNPQRTVWXY
Public / stable / immutable / permanent
Never reusable / non-sequential
Not a credential / authentication factor / authorization proof
QR = machine-readable representation
```

### 7.2 NOT YET FROZEN

```text
input normalization and confusable substitution policy
check digit / display-only error detection
QR payload exact format and error-correction default
resolver semantics
public data disclosure surface
rate limiting
unknown-reference response behavior
bulk discovery protection
enumeration detection
lookup abuse monitoring
resolver access control
```

### 7.3 阶段归属

| 边界 | 责任 |
| --- | --- |
| Stage 2 Design Boundary | 明确 C号属于 Commerce Profile、永久保留、非凭证；不产生、持久化、查询或公开解析 C号。 |
| Stage 3 Security Boundary | 在授权 public resolver / lookup 前冻结 enumeration、abuse、披露和 response policy。 |
| Future Runtime Implementation | 只有经过独立 Founder 授权后，才实现 generation、UNIQUE retry、persistence、resolver、rate limit、monitoring 或 QR generation。 |

## 8. Founder Approval Form

Founder 应对每一项作出单独结论，而不是以“整体保持现状”代替可执行决策：

| Decision | Recommended outcome | Founder outcome |
| --- | --- | --- |
| `STAGE2-DECISION-001` | Adopt five canonical concepts | `APPROVE / MODIFY / REJECT` |
| `STAGE2-DECISION-002` | Adopt independent ID namespaces and non-substitution | `APPROVE / MODIFY / REJECT` |
| `STAGE2-DECISION-003` | Single owning Identity; `1 Identity : N Profiles` | `APPROVE / MODIFY / REJECT` |
| `STAGE2-DECISION-004` | Separate owner / manager; non-transferable default | `APPROVE / MODIFY / REJECT` |
| `STAGE2-DECISION-005` | Multi-platform and multi-account model | `APPROVE / MODIFY / REJECT` |
| `STAGE2-DECISION-006` | One active account-to-Profile binding; retain history | `APPROVE / MODIFY / REJECT` |
| `STAGE2-DECISION-007` | Legacy compatibility subject + deterministic mapping direction | `APPROVE / MODIFY / REJECT` |
| `STAGE2-DECISION-008` | Enforce Relationship terminology separation | `APPROVE / MODIFY / REJECT` |
| `STAGE2-DECISION-009` | Keep resolver security policy in Stage 3 | `APPROVE / MODIFY / REJECT` |

Founder 对任一架构推荐的批准，不自动改变以下状态：

```text
STAGE_2 = NOT AUTHORIZED
STAGE_3 = NOT AUTHORIZED

COMMERCE_REFERENCE_RUNTIME = NOT IMPLEMENTED
EXTERNAL_PLATFORM_BINDING = NOT IMPLEMENTED
PUBLIC_RESOLVER = NOT IMPLEMENTED
QR_RUNTIME = NOT IMPLEMENTED
```

只有 Founder 另行明确授权最小 implementation change unit 后，才可能宣布：

```text
STAGE_2 = AUTHORIZED
```

本包完成后的正确状态是：

```text
PCI-STAGE2-ENTRY-001 = COMPLETE
STAGE_2_ENTRY_READINESS = READY_FOR_FOUNDER_DECISION

STAGE_2 = NOT AUTHORIZED
STAGE_3 = NOT AUTHORIZED
COMMITTED = NO
```
