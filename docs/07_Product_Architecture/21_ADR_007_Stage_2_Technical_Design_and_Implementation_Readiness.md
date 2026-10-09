# ADR-007 — Stage 2 Technical Design and Implementation Readiness

> **状态**：PROPOSED
> **文档角色**：将 ADR-001～ADR-006 转换为可执行的 Stage 2 技术设计与实现准备合同
> **上游**：Product Direction FROZEN_V1、VS-01、ADR-001、ADR-002、ADR-003、ADR-004、ADR-005、ADR-006
> **实现授权**：`STAGE_2_IMPLEMENTATION_AUTHORIZATION = NOT_GRANTED`
> **当前项目状态**：`PROJECT_STATUS = SUSPENDED`

## 1. Result

```text
PCI-ARCH-008 RESULT

ADR Status:
PROPOSED

Implementation Changes:
NONE

Stage 2 Implementation Authorization:
NOT_GRANTED
```

本 ADR 只定义 Stage 2 的 runtime model、授权边界、兼容边界、持久化不变量、验收顺序、实现单元和回滚策略。它不实现任何 Identity、Commerce Profile 或 Compatibility Adapter，也不修改 production code、schema、migration、API contract、Product Direction 或既有 ADR。

结论：

```text
STAGE_2_IMPLEMENTATION_READINESS = READY_WITH_CONDITIONS
```

`READY_WITH_CONDITIONS` 表示技术设计已经足以让 Codex 在获得授权后按顺序开工，但 Founder 尚未批准若干关键策略，且实现授权仍未授予。

## 2. Authority and Non-goals

已接受的架构基线按本任务输入处理为：

```text
ADR-001 = ACCEPTED
ADR-002 = ACCEPTED
ADR-003 = ACCEPTED
ADR-004 = ACCEPTED
ADR-005 = ACCEPTED
ADR-006 = ACCEPTED
```

本 ADR 不重新打开这些 ADR 已关闭的边界。Stage 2 仅建立：

```text
Account
  ↓ explicit membership and authority
Identity
  ↓ exactly-one ownership
Commerce Profile
  ↓ future ownership anchor
legacy Commerce Objects
```

Stage 2 不实现或授权：Commerce ID、public `/c/{commerce_id}`、OAuth、External Platform Binding、Reputation、Payment、Settlement、Refund、Marketplace、CRM、Offer/Inventory/Reservation/Commitment runtime 重写。

## 3. Current Prototype Baseline

当前原型的关键事实：

- `CommerceIdentity` 位于 `modules/creator-commerce-identity/commerce-identity.ts`，以 `creatorId` 作为主键，嵌套 `profile`，并使用 `draft / published / unpublished` 状态。
- `database/schema/creator-identity.ts` 中的 `commerce_identities.creator_id` 是主键；`creator_capabilities`、`service_offerings` 以及后续 commerce records 使用 `creator_id` 关联。
- 当前认证 provider subject 由 `CreatorActorResolver` 解析为 `creatorId`，再形成 `Actor = { kind: 'creator', creatorId }`。
- 当前 Creator identity application service、HTTP contract 和 routes 仍围绕 `/api/v1/creator/identity` 与 `creatorId` 工作。
- VS-01 的 Service Offering、Customer Request、Reservation、Contract 和 Paid Commerce 已是已验证的 legacy prototype surfaces；Stage 2 不删除、不重写其运行时。

因此，`creatorId` 是当前运行时/兼容引用，不是未来 Identity 的安全 principal，也不因字段重命名自动获得 Identity 语义。

## 4. Identity Technical Model

### 4.1 Runtime model

```text
Identity
├── identityId
├── lifecycle
├── createdAt
├── updatedAt
└── audit metadata
```

推荐 lifecycle：

```text
ACTIVE → SUSPENDED → ACTIVE
ACTIVE → ARCHIVED
SUSPENDED → ARCHIVED
```

`DRAFT` 不作为 Identity lifecycle。Identity 创建即代表一个有效的内部主体根；需要未完成的商业展示状态由 Profile 的 `DRAFT` 表达。

### 4.2 ID, uniqueness, and audit

- `identityId` 使用平台级、不可预测、不可复用的随机 ID；推荐 UUID/UUIDv7 类生成器，具体库由实现单元决定。
- ID 生成属于 Identity boundary，不复用 `accountId`、`creatorId`、`commerceProfileId` 或 Commerce ID。
- `identityId` 全局唯一；删除后不回收、不重用。
- 持久化必须记录 `createdAt`、`updatedAt`；生命周期变化还必须记录 actor/account、旧状态、新状态、原因、correlation/reference 和发生时间的审计事件。
- 审计元数据不改变最小领域对象，可由 append-only audit store 或等价审计机制提供。

### 4.3 Creation invariants

- 创建必须产生全新的 Identity；请求不得由客户端指定已存在的 Identity ID。
- 创建者必须拥有可验证的 Account context；登录本身只证明 Account 身份，不自动授予对其他 Identity/Profile 的权限。
- Identity 创建必须在 membership 建立前后处于同一可回滚事务边界，不能产生无 owner 的可管理 Identity。
- 同一幂等请求键只能产生一个结果；重试返回既有结果或明确冲突，不创建第二个 Identity。
- Identity 不嵌入 Profile presentation、Capability、Offer、Availability、Commerce Commitment、External Platform Account、Commerce ID 或 Payment。

### 4.4 Suspension and archival semantics

- `SUSPENDED` 是可恢复的 fail-closed operational state：禁止通过该 Identity 创建或变更 Profile，以及发起新的 profile-scoped commercial mutation；历史读取按授权与历史访问规则保留。
- `ARCHIVED` 是终止管理状态：禁止新的商业 mutation、membership 新增和普通 reactivation；保留历史归属、审计和受控只读访问。
- Identity archive 不是物理删除。已存在对象不被级联删除。
- Identity lifecycle 变化必须是显式 command，禁止由普通 Account logout、Profile update 或 legacy read 隐式触发。

## 5. Commerce Profile Technical Model

### 5.1 Runtime model

```text
CommerceProfile
├── commerceProfileId
├── identityId
├── lifecycle
├── presentation fields
├── createdAt
├── updatedAt
└── audit metadata
```

推荐 presentation 初始字段：

| 字段 | 约束 | 处理 | Justification |
| --- | --- | --- | --- |
| `displayName` | required, non-empty, bounded | 直接迁移为 initial value | VS-01 对外展示的核心身份字段 |
| `bio` | nullable, bounded | 直接迁移为 initial value；空值允许 | 不是所有 Profile 在创建时都有完整介绍，避免把 legacy 非空约束升级为永久产品要求 |
| `avatarUrl` | nullable, normalized URL/string | 仅作为 initial value | 展示资料，不属于 Identity 或认证凭据 |
| `location` | nullable, bounded | 仅作为 initial value | 可能涉及隐私/展示范围；不得把 legacy 值解释为公开授权 |
| `socialLinks` | nullable/empty list, normalized list | 仅作为 initial value；不转为 platform binding | 旧字段是展示链接，不是外部账号 ownership 或 OAuth binding |

`capabilityIds` 不复制到 Profile presentation。它是 Capability/Offer 关联，应在未来由 Profile 作为商业归属锚点表达；Stage 2 不实现 Capability/Offer runtime 重构。旧 `state` 不直接复制为 Profile lifecycle：`draft` 可映射为 `DRAFT`，但 `published`/`unpublished` 需要由兼容层结合当前原型事实处理，不得静默改写 VS-01 语义。

### 5.2 Required and nullable policy

推荐 Profile 创建最低要求为 `displayName`；`bio`、`avatarUrl`、`location`、`socialLinks` 可为空或空集合。创建可先产生 `DRAFT`，激活时需通过字段规范化与产品要求校验。是否将 `bio`、`location` 或其他字段提升为 activation required 是 Founder Decision Required，不在本 ADR 中冻结。

字段规范化包括：去除首尾空白、统一空字符串为 null（列表则为空集合）、URL 语法/长度校验、social link 去重并保持稳定顺序。规范化不得改变原始 legacy reference；原始值若需保留，必须进入 legacy snapshot/audit，而非混入新字段语义。

### 5.3 Ownership and lifecycle invariants

- 一个 Profile 必须且只能绑定一个 `identityId`；不可跨 Identity transfer，不支持 merge，不支持多 Identity 共同控制。
- 一个 Identity 可拥有 N 个 Profiles，包括 0 个或多个；初始 legacy mapping 额外要求恰好一个 initial Profile。
- `commerceProfileId` 使用独立、全局唯一、不可复用的随机 ID；不等于 Identity ID、Account ID、`creatorId` 或 Commerce ID。
- Profile 状态推荐为 `DRAFT / ACTIVE / SUSPENDED / ARCHIVED`。
- Profile archive 保留 presentation snapshot、历史归属和审计；不删除 Profile，也不影响同一 Identity 的其他 Profile。
- Profile-level authorization 必须在 Identity authorization 之后叠加检查；拥有 Identity 权限不自动代表所有 profile mutation 权限，除非明确的 membership authority policy 授权。

## 6. Account–Identity Authorization Model

### 6.1 Membership

```text
AccountIdentityMembership
├── accountId
├── identityId
├── relationshipState
├── authority
├── createdAt
├── revokedAt
└── audit metadata
```

推荐 relationship state：

```text
ACTIVE
SUSPENDED
REVOKED
```

- `ACTIVE`：membership 可按 authority 使用。
- `SUSPENDED`：保留历史关系但拒绝所有 mutation；是否允许受控历史读取由 policy 决定。
- `REVOKED`：永久撤销当前关系；`revokedAt` 必须存在，不允许原地恢复为 ACTIVE，恢复需新 membership 或显式 re-grant 记录。

约束：同一 `(accountId, identityId)` 同时最多一个 current ACTIVE/SUSPENDED membership；历史 revoked records 不覆盖、不删除。

### 6.2 Operations

- **创建 Identity**：已认证 Account 可创建 Identity；创建操作必须同时产生其 initial membership。Account login 不自动获得任何未明确授予的 Identity/Profile privilege。
- **管理 Identity**：只有 ACTIVE membership 且具备相应 authority 的 Account 可读取/管理 Identity；SUSPENDED/REVOKED fail closed。
- **创建 Profile**：需要 Identity-level authority `profile:create`，并通过 Profile policy 建立 ownership。
- **修改 Profile**：需要 Identity membership + Profile-scoped `profile:update`；Profile 处于 `DRAFT` 或 `ACTIVE` 时按 policy 允许，SUSPENDED/ARCHIVED 拒绝普通 mutation。
- **suspend/archive Identity**：仅明确的 identity administration authority 可执行；不能由普通 Profile editor 隐式触发。
- **suspend/archive Profile**：需要 profile administration authority，且不能绕过 Identity lifecycle gate。
- **Profile authorization**：先验证 Account → Identity membership，再验证 requested Profile 属于该 Identity，再验证该 authority 对该 action 有效。

### 6.3 Recommended enforcement order

```text
Request Context
→ authenticated Account
→ active AccountIdentityMembership
→ Identity lifecycle gate
→ Profile ownership gate
→ Profile lifecycle gate
→ action authority/capability
→ domain invariant
```

## 7. Role / Authority Taxonomy

ADR-006 将 role taxonomy 留给 Founder。以下方案均不视为已批准。

| 方案 | Complexity | Security | Extensibility | MVP Fit | Multi-identity Future |
| --- | --- | --- | --- | --- | --- |
| A: `OWNER / ADMIN / VIEWER` | low | clear baseline；需定义 owner transfer/last-owner rules | medium | strong | good，适合一个 Account 管理多个 Identity |
| B: `CONTROLLER / DELEGATE / VIEWER` | medium | 更准确地区分主体控制与代理 | high | medium | strong，适合代表他人管理 |
| C: capability-based | high | 最小权限最好；错误配置和审计复杂度最高 | very high | weak for first implementation | strongest，但需成熟 policy engine |

推荐：**Option A 的最小 role set，加不可变 capability mapping**：

```text
OWNER  = identity-level full administration, including membership and lifecycle administration
ADMIN  = profile/content administration, no ownership transfer or final identity destruction semantics
VIEWER = read-only authorized access, including only explicitly allowed historical reads
```

Role 只是一组可审计的 authority bundle，不是 security principal。建议保留 capability names 作为 policy implementation seam，但 Stage 2 不建立通用 capability platform。必须由 Founder 决定：是否采用 Option A、是否允许 transfer、是否允许一个 Identity 多个 OWNER、ADMIN 是否可 suspend/archive Profile，以及 Viewer 的历史读取范围。

```text
FOUNDER DECISION REQUIRED: Account–Identity role taxonomy
```

## 8. Identity Lifecycle Propagation

### 8.1 Options

| 模型 | Security | Historical Access | Recovery | Cross-profile behavior | Simplicity |
| --- | --- | --- | --- | --- | --- |
| A: Identity suspension → all Profiles suspended | strongest uniform gate | preserves read-only history | clear, bulk reactivation | all Profiles consistent | strongest implementation simplicity |
| B: block mutation, preserve Profile visible state | medium; public state may appear active | strongest presentation continuity | easy recovery | Profiles appear differently available | medium |
| C: independent Identity/Profile lifecycle | weakest unless every command checks both | flexible | complex and error-prone | highly divergent behavior | weakest |

### 8.2 Recommendation

推荐 **Model A 的 effective-state 解释**：Identity `SUSPENDED` 时，所有 Profile 的有效 commercial state 为 suspended，Profile 原始 lifecycle 值保留用于恢复与审计；Identity `ARCHIVED` 时，所有 Profiles 进入 `ARCHIVED` 或不可恢复的 `ARCHIVED_BY_IDENTITY` 结果，具体存储是否使用原因字段而非新状态由实现设计决定。

这不是把 Profile history 删除或把同一 Identity 的 Profile 合并：

- Profile 的本地 lifecycle 仍可审计；
- 所有 new commercial mutation 先经过 Identity gate；
- suspension 恢复时只能恢复到此前有效状态，不能自动激活曾为 DRAFT 的 Profile；
- archived Identity/Profiles 只允许受控历史访问，不允许绕过 gate 创建新对象。

```text
FOUNDER DECISION REQUIRED: Identity suspend propagation
FOUNDER DECISION REQUIRED: Identity archive propagation
```

## 9. Profile Lifecycle Technical Contract

### 9.1 Transition matrix

| Current | Action | Result | Allowed? | Rule |
| --- | --- | --- | --- | --- |
| `DRAFT` | activate | `ACTIVE` | yes | required activation fields and Identity effective state permit it |
| `ACTIVE` | suspend | `SUSPENDED` | yes | authorized profile administrator; fail closed if Identity not active |
| `SUSPENDED` | activate/reactivate | `ACTIVE` | conditional | only explicit recovery; Founder must confirm whether reactivation is allowed |
| `SUSPENDED` | archive | `ARCHIVED` | yes | explicit archive; preserves history |
| `DRAFT` | archive | `ARCHIVED` | yes | explicit abandonment/archive; no delete |
| `ACTIVE` | archive | `ARCHIVED` | yes | explicit archive; existing historical objects remain addressable |
| `ARCHIVED` | activate | `ACTIVE` | no by default | archive is not ordinary suspension; requires Founder-approved recovery command/policy |

Identity-level suspension may make an `ACTIVE` Profile effectively unavailable without rewriting its local state. Identity-level archive is terminal for normal runtime operations. If Founder selects a propagation policy that writes child states, the write must be transactional and auditable.

### 9.2 Archive semantics

```text
ARCHIVED != DELETE
```

Archive retains IDs, presentation snapshot, ownership, legacy mapping, historical object attribution, audit records and controlled read access. It cannot receive new commercial mutation, new offers, new requests, new reservations, new contracts or new paid-commerce actions through Stage 2-owned gates. Existing legacy records are not deleted or silently re-owned.

## 10. Legacy Compatibility Adapter

### 10.1 Boundary

```text
legacy creatorId
        ↓
Legacy Compatibility Adapter
        ↓
Identity / Commerce Profile context
```

Adapter responsibilities are limited to translation and continuity; it is not an authorization authority.

### 10.2 Reads

Existing Prototype consumers continue to read their current objects by `creatorId` and existing APIs/contracts. A profile-aware application may resolve:

```text
creatorId → active mapping → identityId + initialCommerceProfileId
```

and use the resolved context as an attribution/authorization input. If no unique ACTIVE/VERIFIED mapping exists, reads that require a security or ownership interpretation fail closed; purely historical reads may return legacy records only under an explicit historical-read policy.

### 10.3 Writes

Stage 2 does **not** default to dual-write. Existing Prototype writes continue to their existing persistence and contracts. New Identity/Profile commands write only the new model. A compatibility adapter may resolve old reads and old ownership references, but must not silently create a second source of truth.

Any future write-through from new Profile commands to legacy objects requires a separate change unit, explicit field/semantic mapping, idempotency design and approval. Legacy `creatorId` remains an immutable historical reference.

### 10.4 Mapping states

Recommended mapping state:

```text
ACTIVE
VERIFIED
AMBIGUOUS
FAILED
RETIRED
```

- `ACTIVE`：usable deterministic mapping with current runtime support。
- `VERIFIED`：mapping has passed migration/verification evidence and may be used for security-sensitive translation。
- `AMBIGUOUS`：more than one plausible subject/target or conflicting historical evidence; no automatic selection。
- `FAILED`：mapping attempt failed validation or persistence; retry only after cause is corrected。
- `RETIRED`：mapping no longer used for new writes, retained for attribution。

Security-sensitive adapter reads require `VERIFIED` (or an explicitly approved equivalent); `ACTIVE` alone is insufficient if verification is a separate migration phase.

## 11. Mapping Persistence

### 11.1 Options

| 方案 | Auditability | Uniqueness | Idempotency | Historical Attribution | Rollback | Future Deprecation |
| --- | --- | --- | --- | --- | --- | --- |
| A: independent `legacy_subject_mappings` | strongest | database-enforceable | strongest | explicit immutable reference | easiest | cleanest |
| B: legacy reference inside Identity | medium | harder across references | medium | acceptable | coupled to Identity | harder |
| C: legacy reference inside Profile | medium | profile-specific but awkward for subject uniqueness | medium | acceptable for initial Profile only | coupled to Profile | harder |
| D: external/event-only mapping | weak for runtime | difficult | weak | potentially strong log, weak lookup | unclear | medium |

推荐 **Option A：独立 `legacy_subject_mappings`**。它能同时表达 legacy subject uniqueness、mapping lifecycle、initial Profile uniqueness、verification evidence 和未来 retirement，而不污染 Identity/Profile 的永久语义。

### 11.2 Conceptual record

```text
LegacySubjectMapping
├── legacySystem
├── legacySubjectType
├── legacyCreatorId
├── identityId
├── initialCommerceProfileId
├── mappingState
├── sourceVersion / evidence reference
├── createdAt
├── updatedAt
└── retiredAt?
```

建议唯一性：`(legacySystem, legacySubjectType, legacyCreatorId)` 全局最多一个 non-retired mapping；`identityId` 与 `initialCommerceProfileId` 也不能被两个 active initial mappings 复用。暂不写 SQL。

## 12. Deterministic Mapping

### 12.1 Contract

```text
1 legacy creatorId
→ exactly 1 Identity
→ exactly 1 initial Commerce Profile
```

确定性 key 至少包含：

```text
legacySystem + legacySubjectType + canonicalCreatorId
```

`canonicalCreatorId` 只做边界级规范化（例如拒绝空值、保留大小写语义或按已批准 legacy contract 统一大小写）；不得未经证据修改既有 ID。mapping identity key 是持久化唯一键，不是随机重试 token。

### 12.2 Algorithm behavior

- 先查唯一 active/verified mapping；命中则返回既有 Identity/Profile。
- 未命中时，在同一事务中创建 Identity、initial Profile 和 mapping，mapping state 从 `ACTIVE` 开始，验证后可转 `VERIFIED`。
- 同一 input 的重复执行必须命中唯一键或幂等键，不能创建新 Identity/Profile。
- 唯一冲突表示并发/重复创建：重新读取并返回已提交 mapping；无法确认一致性则 `FAILED`/fail closed。
- 多个候选 legacy subject、多个已有 Identity/Profile 或证据冲突时标记 `AMBIGUOUS`，不猜测、不自动合并。
- 任一步骤失败，事务回滚未提交的新记录；已存在但不一致的记录不覆盖，mapping 标记 `FAILED` 并生成审计证据。
- retry 只能重放同一 canonical input；修复冲突后再重试，不能通过随机 suffix 绕过唯一性。

## 13. Current Data Mapping

| Current source | New owner | Treatment | Notes |
| --- | --- | --- | --- |
| `commerce_identities.creator_id` | Legacy mapping + historical reference | retain as immutable legacy subject | never rename in place to `identityId` |
| `CommerceIdentity` | compatibility read model / source snapshot | not final Identity/Profile | preserve VS-01 behavior during transition |
| `CommerceIdentity.profile.displayName` | CommerceProfile.displayName | direct initial value | trim and validate |
| `CommerceIdentity.profile.bio` | CommerceProfile.bio | initial value; nullable in new model | preserve raw legacy value in evidence if normalized |
| `CommerceIdentity.profile.avatarUrl` | CommerceProfile.avatarUrl | initial value | URL/length normalization only |
| `CommerceIdentity.profile.location` | CommerceProfile.location | initial value | do not infer visibility consent |
| `CommerceIdentity.profile.socialLinks` | CommerceProfile.socialLinks | initial presentation value | dedupe/normalize; never create platform binding |
| `creator_capabilities` / `capabilityIds` | future Profile-owned capability association | no Stage 2 copy into Profile row | do not rewrite Capability/Offer runtime |
| `commerce_identities.state` | compatibility state translation | no direct lifecycle copy | `draft` can inform DRAFT; published/unpublished require explicit compatibility handling |
| timestamps | corresponding new records | initial audit values where trustworthy | retain source/evidence provenance |

字段分类：

- **直接迁移/initial value**：displayName，及经过规范化的 bio/avatarUrl/location/socialLinks。
- **仅保留 legacy**：creatorId、legacy state 语义、原始 field snapshot/evidence。
- **不再保留为 Profile presentation**：capabilityIds；它属于未来 capability/offer association。
- **需 normalization**：所有 strings 的空白/长度、URLs、socialLinks 顺序与重复项、legacy subject canonical form。

## 14. Existing Object Compatibility

Stage 2 期间 legacy objects 的默认策略是 **Option B：compatibility resolution**，而不是立即 backfill：

| Option | Result | Assessment |
| --- | --- | --- |
| A: immediate backfill | 为所有 Offer/Request/Reservation/Contract/Paid Commerce 写 `profileId` | 风险大、范围大、容易改变历史语义；默认禁止 |
| B: compatibility resolution | 通过 mapping 在读取/授权/归属需要处解析 `creatorId` | 最小改动、可回滚、保留 VS-01 行为；推荐 |
| C: new objects only use `profileId` | 新旧对象分裂，旧对象无统一解析边界 | 简单但历史与未来并存语义不完整 |

现有对象不需要在新 Profile 建立时立即获得 `profileId`。当新对象未来需要 Profile-native ownership 时，应在独立变更单元中设计显式 profile reference；不得进行无证据的大规模 backfill。Legacy Offer、Request、Reservation、Contract 和 Paid Commerce 继续使用原有 creator/owner fields，兼容层负责 historical attribution 与可审计解析。

## 15. API / Application Contract

本节定义未来 application contract，不实现 API，不修改当前 VS-01 routes/contracts。

### 15.1 Contexts

```text
RequestContext
├── requestId / correlationId
├── authenticatedAccountId?
├── actorContext
└── idempotencyKey?

AuthorizationContext
├── accountId
├── membership
├── authority
└── granted capabilities

IdentityContext
├── identityId
└── identity lifecycle

ProfileContext
├── commerceProfileId
├── identityId
└── profile lifecycle / effective lifecycle

LegacyCompatibilityContext
├── legacySystem
├── legacyCreatorId
├── mappingState
├── identityId?
└── initialCommerceProfileId?
```

请求必须明确携带或由受控 resolver 得到 `identityId`/`commerceProfileId`；resolver 结果必须带来源和 mapping state，不能只返回一个无语义 string。

### 15.2 Future commands and queries

| Contract | Required context | Main result / gate |
| --- | --- | --- |
| `CreateIdentity` | authenticated Account, idempotency key | new Identity + initial membership |
| `GetIdentity` | Account membership or approved historical/public read | Identity or fail closed |
| `GetIdentityStatus` | membership or authorized status read | effective lifecycle + audit reference |
| `CreateCommerceProfile` | active membership + `profile:create` | Profile `DRAFT` |
| `GetCommerceProfile` | profile context + read authority | one Profile |
| `ListCommerceProfiles` | identity context + list authority | only Profiles of requested Identity |
| `UpdateCommerceProfile` | profile context + update authority | normalized presentation update |
| `ActivateCommerceProfile` | profile context + activation authority | `DRAFT → ACTIVE` |
| `SuspendCommerceProfile` | profile context + administration authority | `ACTIVE → SUSPENDED` |
| `ArchiveCommerceProfile` | profile context + administration authority | `DRAFT/ACTIVE/SUSPENDED → ARCHIVED` |

## 16. Profile Context

### 16.1 Options

| 模型 | Security | Cross-profile isolation | UI ergonomics | API correctness | Testing |
| --- | --- | --- | --- | --- | --- |
| A: global current profile | weak if implicit | weak; stale context risk | easy | ambiguous | brittle |
| B: explicit `profileId` in every profile command | strongest | strongest | acceptable with UI helper | strongest | easiest to assert |
| C: session-bound profile context | medium | depends on session invalidation | good | hidden server state | harder |

推荐 **Model B：每个 Profile-scoped command/query 显式携带 `commerceProfileId`**。UI 可以保存 current selection 作为 convenience，但它必须仅填充显式请求参数，不得成为 authorization proof。服务器每次仍验证 Profile → Identity ownership、membership、lifecycle 和 authority。

## 17. Persistence Invariants

以下必须在数据库/持久化层保证，而不仅是 application checks：

- Identity IDs unique、非空、不可复用。
- Profile IDs unique、非空、不可复用。
- 每个 Profile 恰好一个 Identity reference；Identity → Profile 为 one-to-many。
- `(accountId, identityId)` current membership 唯一；历史 revoked memberships 可保留。
- Legacy mapping key 唯一；active mapping 不能重复指向不同 Identity。
- 一个 active legacy mapping 恰好一个 `initialCommerceProfileId`；initial Profile 不能被两个 active mappings 复用。
- Profile 生命周期值和 membership/lifecycle 值受限于已批准枚举。
- Archived Profile 不能通过新 model mutation path 接收新的 commercial mutation。
- Suspended Profile 的 mutation policy 由持久化写边界/事务 policy 强制，不能仅依赖 UI。
- Identity/Profile ownership reference 不可被普通 update 改写。

数据库级约束与 application/domain policy 的具体 SQL、索引和 migration 属于获授权后的实现单元；本 ADR 暂不写 SQL。

## 18. Security Invariants

- Account login ≠ Profile authorization。
- Identity authorization ≠ Profile authorization。
- Profile A access 不等于 Profile B access；每次请求以显式 Profile context 做隔离检查。
- Legacy `creatorId` ≠ security principal；它只是一种兼容 subject/reference。
- Actor context 必须被 authorization policy 验证，不能因 `kind = creator` 自动获得任意 Identity/Profile 权限。
- Archived/Suspended Identity、membership 或 Profile 的 mutation 必须 fail closed。
- 客户端提交的 `accountId`、`identityId`、`creatorId` 不能覆盖服务器从认证/membership/mapping resolver 得到的上下文。
- 同一 Identity 下的 Profile 不自动共享对外展示或 mutation 权限；共享必须由明确的 Identity/Profile policy 表达。

### Creator actor shorthand assessment

继续把 `Creator` actor 作为内部 legacy shorthand 是可接受的兼容措施，但不再是 Stage 2 authorization contract。必须建立：

```text
legacy creator actor
        ↓ resolve creatorId mapping
authorized Account + Identity membership
        ↓ verify requested profile ownership and lifecycle
authorized Identity/Profile context
```

无法获得唯一、已验证 mapping 时，adapter 不得把 Creator actor 直接升级为授权主体。

## 19. Stage 2 Test Strategy

| Layer | Required evidence |
| --- | --- |
| Unit | ID separation/generation boundary、field normalization、lifecycle transitions、mapping state machine、duplicate rejection |
| Application | command authorization、membership checks、Profile isolation、effective Identity/Profile lifecycle gates、idempotent retries |
| Integration | repository transactions、unique constraints、audit writes、identity/profile relationship、legacy resolution |
| Authorization | Account A cannot mutate Profile B；Identity A cannot access Identity B；Profile A cannot mutate Profile B；login alone grants no privilege |
| Persistence | one-to-many/one-to-one ownership、membership uniqueness、mapping uniqueness、archive/suspend write rejection under concurrent attempts |
| Compatibility | old `creatorId` reads remain valid；mapping deterministic；ambiguous/failed states fail closed；historical attribution preserved |
| Migration Dry Run | read-only discovery、candidate counts、duplicate/ambiguous reports、deterministic plan、retry simulation、no production writes |
| Regression | VS-01 contract remains valid；existing Service Offering、Customer Request、Reservation、Contract、Paid Commerce flows and canonical events unchanged |

### Minimum acceptance sequence

1. Identity create and uniqueness；ID is distinct from Account/creator/Profile/Commerce IDs。
2. Membership create/revoke/suspend and authorization denial。
3. Profile create；one Identity creates two Profiles。
4. Explicit profile context and cross-profile isolation。
5. Profile lifecycle matrix and archive/history behavior。
6. Identity suspension/archive effective propagation and recovery policy。
7. Deterministic legacy mapping, idempotency, duplicate prevention and ambiguous fail-closed behavior。
8. Legacy object compatibility resolution and historical attribution。
9. VS-01 regression, then persistence/concurrency and migration dry-run evidence。

`AT-001` 至 `AT-013` 仍是 VS-01 的最高验收边界；Stage 2 test plan 不能用 mock/simulator/fixture 代替真实持久化或真实外部依赖所要求的证据。

## 20. Stage 2 Implementation Units

建议保留并细化为最小可回滚单元：

| Unit | Scope | Depends on | Rollback boundary |
| --- | --- | --- | --- |
| `S2-001 Identity Core` | Identity persistence, IDs, lifecycle, audit seam | design approval | new Identity tables/modules disabled |
| `S2-002 Account–Identity Authorization` | membership state, role policy, authorization order | S2-001 + Founder role decision | membership checks behind feature boundary |
| `S2-003 Commerce Profile Core` | Profile persistence, presentation normalization, one-to-many ownership | S2-001 + S2-002 | Profile runtime disabled; legacy unchanged |
| `S2-004 Profile Lifecycle` | transition matrix, effective-state gates, archive/history reads | S2-003 + propagation decisions | lifecycle commands disabled; reads preserved |
| `S2-005 Legacy Compatibility Adapter` | creatorId resolution for reads/context | S2-001/S2-003 + mapping contract | resolver fallback to legacy path |
| `S2-006 Legacy Mapping Persistence` | mapping record, unique/idempotent transaction, verification states | S2-001/S2-003 + S2-005 design | adapter disabled; old creatorId path remains |
| `S2-007 Profile-aware Application Context` | explicit Profile-scoped context and future commands | S2-002/S2-003/S2-004/S2-005 | new commands disabled; old contracts untouched |
| `S2-008 VS-01 Compatibility Verification` | regression, evidence, dry-run and rollback rehearsal | all prior units | verification artifact rejected without runtime rollback |

Dependency order is `S2-001 → S2-002 → S2-003 → S2-004 → S2-005/S2-006 → S2-007 → S2-008`. S2-005 and S2-006 may be developed/tested in parallel only after their shared mapping contract is approved. S2-008 cannot authorize implementation; it only supplies evidence.

## 21. Rollback Strategy

- **Pre-change checkpoint**：记录当前 git revision、database schema version、VS-01 acceptance status、legacy row counts/checksums、mapping dry-run report 和 feature flag defaults。
- **Schema rollback concept**：新 schema 采用 additive、可独立识别的边界；优先通过 disable/stop-read/write，再按批准的 down/forward-fix 方案处理，绝不删除或重解释 legacy columns。
- **Feature activation boundary**：所有新 Identity/Profile/mapping reads and writes 默认 off；按 unit 逐步启用，旧 Creator routes/contracts 继续作为 fallback。
- **Compatibility fallback**：adapter 错误、mapping 不确定或 feature off 时，回到既有 `creatorId` path；但 security-sensitive operation 不得 fallback 为未经验证的授权。
- **Data rollback**：未提交新记录随事务回滚；已提交新记录优先标记 retired/archived 并保留审计，不物理删除 legacy attribution。mapping retirement 必须可逆到受控 read-only 状态。
- **Test rollback**：每个 unit 必须有独立 migration dry-run、contract/regression suite 和 negative authorization suite；失败时不推进 feature boundary，不以删除测试来“恢复通过”。

没有 migration 也必须能撤回 runtime：关闭新 model command/query registration、关闭 mapping resolver 的 active use、保留 legacy read/write 与原有 VS-01 contracts，并验证旧路径仍能完成原验收。

## 22. Stage 2 Entry Gate

进入 implementation 前，以下条件全部必须是 `PASS`：

| Gate | Required evidence | Current |
| --- | --- | --- |
| `ARCHITECTURE_ACCEPTED` | ADR-001～006 accepted record | PASS per task authority |
| `DESIGN_ACCEPTED` | ADR-007 explicitly accepted | PENDING |
| `AUTHORIZATION_MODEL_ACCEPTED` | role taxonomy, membership and propagation decisions approved | PENDING |
| `COMPATIBILITY_DESIGN_ACCEPTED` | adapter, mapping persistence and ambiguous handling approved | PENDING |
| `TEST_PLAN_ACCEPTED` | Stage 2 test matrix and VS-01 regression order approved | PENDING |
| `ROLLBACK_PLAN_ACCEPTED` | checkpoint, feature boundary and fallback rehearsal approved | PENDING |

```text
STAGE_2_IMPLEMENTATION_READINESS = READY_WITH_CONDITIONS
STAGE_2_IMPLEMENTATION_AUTHORIZATION = NOT_GRANTED
```

即使所有 gate 变为 PASS，也只表示具备开始实现的条件；必须另行授予 `STAGE_2_IMPLEMENTATION_AUTHORIZATION`。

## 23. Founder Decision Register

只列当前未冻结事项：

1. `Account–Identity role taxonomy`：是否采用推荐的 `OWNER / ADMIN / VIEWER`，以及 owner transfer、multiple owner、ADMIN lifecycle authority 规则。
2. `Identity suspend propagation`：采用 effective suspension（推荐）还是其他传播策略。
3. `Identity archive propagation`：是否将 Profiles 标记为 archive，或使用保留本地状态的 effective archived gate。
4. `Account multiple identities in Stage 2`：实现 `1 Account : N Identities` 的可用创建能力，还是只保留关系模型扩展。
5. `Profile presentation required fields`：除 `displayName` 外，激活 Profile 是否要求 bio/location 等字段。
6. `Legacy mapping storage form`：是否批准独立 `legacy_subject_mappings`，以及 legacySystem/subjectType 的范围。
7. `Ambiguous subject manual handling`：由谁审查、哪些证据可 verify、FAILED/AMBIGUOUS 如何解除。

Founder Decision Register 不重新列出 ADR-001～006 已接受的主体边界、one-to-many Profile ownership、Stage 2 scope 或既有 Product Direction 决策。

## 24. Architecture Debt Update

| Debt | Priority | Blocking? | Resolution Unit | Validation Evidence |
| --- | --- | --- | --- | --- |
| Identity Persistence | P0 | yes | `S2-001` | unique IDs, lifecycle, audit and transaction tests |
| Profile Persistence | P0 | yes | `S2-003` | one-to-many ownership, required/nullable field tests |
| Account–Identity Authorization | P0 | yes | `S2-002` | membership lifecycle, role and negative authorization tests |
| Legacy Mapping | P0 | yes | `S2-006` | uniqueness, deterministic/idempotent mapping and ambiguity reports |
| Compatibility Adapter | P0 | yes | `S2-005` | old reads, context translation and fail-closed tests |
| Profile Context | P0 | yes | `S2-007` | explicit profile isolation and API/application contract tests |
| Actor → Identity/Profile authorization translation | P0 | yes | `S2-005` + `S2-007` | creator shorthand cannot bypass membership/profile gates |

No debt item authorizes implementation by itself. `docs/08_Execution/21_Prototype_Execution.md` remains the execution evidence SSOT; this architecture-only change does not update it because no implementation state or validation evidence changed.

## 25. Final Readiness Statement

```text
Identity Technical Model:
Defined, with independent IDs, lifecycle, audit, suspension and archival rules.

Profile Technical Model:
Defined, with one-to-many ownership, field-level justification, normalization and lifecycle contract.

Account–Identity Authorization:
Defined as explicit membership; login is not authorization.

Role / Authority Options:
Compared; Option A recommended; FOUNDER DECISION REQUIRED.

Identity Lifecycle Propagation:
Compared; effective Model A recommended; FOUNDER DECISION REQUIRED.

Profile Lifecycle Contract:
Defined; ARCHIVED != DELETE; ARCHIVED → ACTIVE prohibited by default.

Legacy Compatibility Adapter:
Defined for reads and explicit context translation; no default dual-write.

Mapping Persistence:
Independent legacy_subject_mappings recommended.

Deterministic Mapping:
Defined as one legacy creatorId to exactly one Identity and one initial Profile.

Current Data Mapping:
Defined field by field; no mechanical profile copy.

Existing Object Compatibility:
Compatibility resolution recommended; no immediate mass backfill.

API / Application Contract:
Future commands and contexts defined; no API implementation.

Profile Context:
Explicit profileId recommended; global currentProfile is not authorization.

Persistence Invariants:
Defined at database/application boundary; no SQL written.

Security Invariants:
Defined; Creator shorthand requires translation and verified mapping.

Stage 2 Test Strategy:
Defined with unit/application/integration/authorization/persistence/compatibility/dry-run/regression layers.

Implementation Units:
S2-001 through S2-008 ordered and independently rollbackable where possible.

Rollback Strategy:
Defined with checkpoint, additive schema concept, feature boundary and legacy fallback.

Entry Gate:
READY_WITH_CONDITIONS; six gates require explicit acceptance/evidence.

Founder Decision Register:
Limited to seven genuinely unresolved decisions.

Architecture Debt:
Updated for Identity/Profile persistence, authorization, mapping, adapter, context and actor translation.

Stage 2 Implementation Readiness:
READY_WITH_CONDITIONS

ADR Status:
PROPOSED

Implementation Changes:
NONE

Stage 2 Implementation Authorization:
NOT_GRANTED
```
