# ADR-008 — Stage 2 Pre-Authorization Decision Closure

> **状态**：PROPOSED
> **决策范围**：关闭 Stage 2 implementation authorization 前剩余的七项技术/产品决策
> **上游**：PCI-PD-002、VS-01、ADR-001、ADR-002、ADR-003、ADR-004、ADR-005、ADR-006、ADR-007
> **Authority**：Main Control 提出基线；Founder 最终批准
> **实现授权**：`STAGE_2_IMPLEMENTATION_AUTHORIZATION = NOT_GRANTED`
> **当前项目状态**：`PROJECT_STATUS = SUSPENDED`

## 1. Result

```text
PCI-ARCH-009 RESULT

ADR Status:
PROPOSED

Implementation Changes:
NONE

Stage 2 Implementation Authorization:
NOT_GRANTED
```

本 ADR 是提交 Founder 最终批准的 decision package，不是 implementation authorization。它只处理以下七项：

1. Account–Identity authority taxonomy；
2. Identity `SUSPENDED` propagation；
3. Identity `ARCHIVED` propagation；
4. Account → multiple Identity support；
5. Commerce Profile presentation minimum fields；
6. Legacy mapping persistence form；
7. Ambiguous / unmapped subject handling。

## 2. Audit Conclusion

审计了 Product Direction、VS-01、ADR-001～ADR-007 以及当前 Prototype 的身份和持久化边界。结论如下：

- Main Control 提出的七项 baseline 与已接受的 Identity/Profile 主体边界、Profile one-to-many ownership、legacy compatibility boundary 和 VS-01 scope 一致。
- 当前 Prototype 的 `creatorId`、`CommerceIdentity`、`creator_capabilities`、Service Offering、Customer Request、Reservation、Contract 和 Paid Commerce 仍是 legacy runtime；它们不应被静默重解释为新 Stage 2 runtime。
- 当前认证链路仍是 provider subject → `creatorId` → Creator actor；这与新 Account → Membership → Identity/Profile authorization 不同，但属于待实现的 compatibility translation，不是本决策包的架构冲突。
- 当前 `commerce_identities.creator_id` 一对一主键约束与未来 `1 Identity : N Commerce Profiles` 不一致；这确认需要 additive new persistence，而不是原表改名或直接复用。
- 未发现需要停止决策闭包的重大 lifecycle、ownership、authorization、migration 或 Profile isolation contradiction。

因此，本 ADR 将七项 baseline 定义为**建议批准内容**，不声明其为 `ACCEPTED`。

## 3. Decision 1 — Authority

### 3.1 Proposed baseline

```text
AccountIdentityMembership
├── accountId
├── identityId
├── authority = OWNER
├── state = ACTIVE | SUSPENDED | REVOKED
├── createdAt
└── revokedAt
```

Stage 2 只实现：

```text
OWNER
```

不实现 `ADMIN`、`DELEGATE`、`VIEWER`、Team 或 Organization。Membership relationship abstraction 必须保留未来扩展空间，但 Stage 2 不建立团队权限系统或通用 capability platform。

### 3.2 Authority contract

- `OWNER` 可以创建、修改、suspend 和 archive 自己授权 Identity 下的 Commerce Profiles。
- `OWNER` 可以管理 Identity lifecycle 和 Account–Identity memberships，但不得绕过审计、lifecycle gate 或不可变 ownership 约束。
- `ACTIVE` membership 才能参与 mutation authorization。
- `SUSPENDED` membership 保留关系和历史证据，但所有 mutation fail closed；历史读取是否开放由明确的 historical-read policy 控制。
- `REVOKED` membership 永久撤销当前关系，必须有 `revokedAt`；不得原地恢复为 `ACTIVE`。
- Account login 只建立 authenticated Account context，不自动等于任何 Identity 的 `OWNER`。
- 客户端传入的 `accountId`、`identityId` 或 `creatorId` 不能替代服务器解析出的 membership context。

推荐执行顺序：

```text
authenticated Account
→ ACTIVE AccountIdentityMembership
→ Identity lifecycle gate
→ requested Profile ownership gate
→ Profile lifecycle gate
→ OWNER authority
→ domain invariant
```

### 3.3 Impact and conflict assessment

这会取代当前 Prototype 中“Creator actor + matching `creatorId` 即可进行 identity operation”的 shorthand，但不修改 legacy API。`CreatorActorResolver` 仍可用于兼容读取；任何 Stage 2 security-sensitive operation 必须翻译为已验证的 Account/Membership/Identity/Profile context。

没有重大冲突。

```text
FOUNDER DECISION REQUIRED: approve Stage 2 OWNER-only taxonomy
```

## 4. Decision 2 — Identity Suspension

### 4.1 Proposed baseline

```text
Identity = SUSPENDED
→ global mutation block
→ persisted Profile lifecycle remains unchanged
```

Identity suspension 的技术语义：

- 所有该 Identity 下的 Profile mutation fail closed。
- 不允许新的正常商业活动，包括通过 Stage 2 context 创建或修改新的 profile-scoped commercial state。
- Profile 不必须同步写成 `SUSPENDED`；其持久化 lifecycle 保留原始 `DRAFT`、`ACTIVE` 或其他已批准状态。
- 历史读取继续受 Account/Membership、Profile ownership、历史访问 policy 和数据敏感性控制。
- Identity 恢复后，Profile 恢复其自身持久化 lifecycle 语义；曾为 `DRAFT` 的 Profile 不因恢复自动变成 `ACTIVE`。
- global block 必须在 application authorization 和持久化事务边界都可验证，不能依赖 UI。

### 4.2 Consistency

该方案与 ADR-003 的 Profile ownership/history continuity 一致：Profile 仍由一个 Identity 锚定，历史对象不被删除或重新归属。该方案与 ADR-006 的 lifecycle gates 一致：Identity lifecycle gate 先于 Profile mutation gate，Profile local lifecycle 不被无必要地重写。它收敛了 ADR-007 中“effective suspension”的表达，改为**全局阻断 + 保留 Profile persisted lifecycle**。

没有重大冲突。

```text
FOUNDER DECISION REQUIRED: approve global block with unchanged Profile lifecycle
```

## 5. Decision 3 — Identity Archive

### 5.1 Proposed baseline

```text
Identity = ARCHIVED
→ all Profiles non-operational
→ no new commercial activity
→ no physical deletion
```

- 所有 Profiles 进入 non-operational effective state；不要求删除或覆盖 Profile 的历史数据。
- 禁止新的 Profile mutation、新商业活动、membership 新增及通过新 runtime 的 reactivation。
- Profiles 不物理删除；保留 Profile IDs、Identity ownership、presentation snapshot、legacy mapping、历史对象 attribution 和 audit evidence。
- Legacy Offer、Request、Reservation、Contract、Paid Commerce 记录继续保留原始 `creatorId`/owner reference，不因 archive 被删除或静默重分配。
- 不能通过新建 Account relationship 简单恢复原 Profile；新的 membership 只能授予对仍可访问历史的权限，不能解除 Identity archive gate。
- recovery/reactivation 不是 Stage 2 runtime capability。若未来需要，必须由独立 policy/decision 定义受控恢复、审计和风险边界。

### 5.2 Consistency

该方案保持 `ARCHIVED != DELETE`，与 ADR-001、ADR-003、ADR-006 的历史连续性和 ownership 约束一致；也不引入 ADR-004/005 的新 Inventory 或 Commitment runtime。

没有重大冲突。

```text
FOUNDER DECISION REQUIRED: approve non-operational archived Profiles and no Stage 2 reactivation
```

## 6. Decision 4 — Account to Multiple Identities

### 6.1 Proposed baseline

```text
Account 1 → N Identity
```

数据模型支持一个 Account 拥有多个 active memberships/Identities。Stage 2 第一版的 UI/default workflow 为：

```text
single active working Identity context
```

这不是 `Account = Identity`。Account 是 authentication subject；Identity 是 PCI 内部永久主体根。锁死二者会阻止未来代表多个个人主体、分离商业身份或受控 delegation 的扩展，并会把当前 provider/account mapping 错误固化为永久产品语义。

### 6.2 Stage 2 boundary

- Persistence 和 authorization model 支持 `1 Account : N Identity`。
- 不实现复杂的 multi-identity dashboard、批量切换、团队协作、跨 Identity aggregate view 或组织层级。
- UI 可以选择一个 active working Identity，但每个 application command 必须携带或解析明确的 `identityId`。
- `identityId` context 与 `commerceProfileId` context 分开：Identity context 选择授权主体范围；Profile context 选择该 Identity 下的具体商业展示范围。
- Profile-scoped command 必须同时验证 `commerceProfile.identityId == requested identityId`；不能因 current Identity 或 current Profile 的 UI 状态而隐式扩大权限。

这样可以先验证多 Profile isolation 和 membership authorization，而不为 Stage 2 引入完整 multi-identity UX。

没有重大冲突。

```text
FOUNDER DECISION REQUIRED: approve data-model support for multiple Identities with single working-context UX
```

## 7. Decision 5 — Profile Presentation Minimum

### 7.1 Proposed minimum set

```text
displayName
bio
avatarUrl
location
socialLinks
```

字段合同：

| Field | Required | Nullable | Mutability | Normalization |
| --- | --- | --- | --- | --- |
| `displayName` | create and activation required | no | mutable while Profile is operational and authorized | trim, bounded length, reject blank |
| `bio` | not required for create; activation requirement pending Founder confirmation | yes | mutable while operational and authorized | trim; empty string → null; bounded length |
| `avatarUrl` | no | yes | mutable while operational and authorized | trim; validate bounded URL/string; empty → null |
| `location` | no | yes | mutable while operational and authorized | trim; empty → null; no visibility consent inferred |
| `socialLinks` | no | yes; empty list canonical | mutable while operational and authorized | trim, validate bounded entries, deduplicate, stable ordering |

`socialLinks` 是 presentation metadata only。它不产生或暗示：

```text
externalAccountId
platformOwnerEvidence
oauthToken
verifiedPlatform
```

上述字段属于未来 Commerce Relationship / Platform Binding 范围，不进入 Stage 2 Profile model。

### 7.2 Impact and conflict assessment

当前 `CommerceIdentity.profile` 中的字段可以作为 initial values，但不能机械复制整个 legacy object。`capabilityIds` 继续属于 Capability/Offer association；legacy `state = draft/published/unpublished` 通过兼容层解释，不直接改名为 Profile lifecycle。当前 schema 对 `bio` 的 non-null 约束不应强迫新 Profile 把 bio 作为永久 required field。

没有重大冲突。

```text
FOUNDER DECISION REQUIRED: confirm activation-required fields beyond displayName
```

## 8. Decision 6 — Legacy Mapping Persistence

### 8.1 Proposed form

采用独立 persistence：

```text
legacy_subject_mapping
```

它独立于 Identity 和 Commerce Profile，避免把 legacy subject/reference 污染为新主体的永久语义。

最低概念字段：

```text
legacyCreatorId
identityId
initialCommerceProfileId
mappingState
createdAt
verifiedAt
```

实现必须额外保留足够的 source/evidence provenance；如系统支持多个 legacy source，需增加稳定的 `legacySystem`/subject type scope，但不改变 key 的确定性。

### 8.2 Minimal state audit

五个候选状态并非全部都需要被暴露给正常 runtime，但各自有明确用途：

| State | Necessary? | Meaning |
| --- | --- | --- |
| `ACTIVE` | yes | deterministic mapping exists and is usable for non-security-sensitive compatibility reads |
| `VERIFIED` | yes | mapping passed evidence checks and may be used for security-sensitive translation |
| `AMBIGUOUS` | yes | multiple candidates or conflicting evidence; no automatic selection |
| `FAILED` | yes | attempted creation/verification failed; retry requires corrected cause |
| `RETIRED` | yes | mapping no longer used for new writes but remains for historical attribution |

最小集合仍为：

```text
ACTIVE | VERIFIED | AMBIGUOUS | FAILED | RETIRED
```

如果实现阶段决定不区分普通 compatibility read 与 security-sensitive translation，可以合并 `ACTIVE` 与 `VERIFIED`，但这是会削弱审计和 fail-closed 证据的变更，必须作为独立 Founder/implementation decision，不在本 ADR 中隐式完成。

### 8.3 Mapping invariants

- 同一 canonical `legacyCreatorId` 在同一 legacy source scope 下只能有一个 active mapping。
- mapping 必须 deterministic、unique、idempotent、auditable。
- mapping 必须同时指向 exactly one Identity 和 exactly one initial Commerce Profile。
- Identity/Profile IDs 不因 legacy retry 改变。
- mapping retired 后仍保留历史 attribution；不得复用同一 legacy key 指向新的主体。
- 冲突、重复或证据不足时 fail closed。

没有重大冲突。

```text
FOUNDER DECISION REQUIRED: approve independent legacy_subject_mapping and five-state contract
```

## 9. Decision 7 — Ambiguous or Unmapped Subjects

### 9.1 Proposed baseline

```text
FAIL CLOSED
    ↓
MANUAL_REVIEW_REQUIRED
```

禁止：

```text
auto merge
best effort assignment
silent creator reassignment
automatic duplicate consolidation
```

### 9.2 Diagnostic contract

以下情况必须产生可审计诊断，而不是猜测性映射：

- legacy subject 缺失或为空；
- 同一 canonical subject 发现多个候选 Identity/Profile；
- 旧记录之间的 ownership evidence 冲突；
- mapping 唯一键冲突且无法确认哪个事务已提交；
- legacy source scope 或 subject type 无法识别；
- 规范化会改变既有 subject identity，且没有批准的 canonicalization rule。

诊断至少包含原始 subject/reference、canonicalization result、候选 IDs、冲突类型、source/version、correlation/reference、发生时间和当前 mapping state。诊断不得包含敏感 token 或未经授权的隐私数据。

### 9.3 Read and migration behavior

- security-sensitive read、ownership resolution 和 migration 对 `AMBIGUOUS`/unmapped subject 必须拒绝或返回明确的 manual-review-required error。
- 可在独立 historical-read policy 下继续读取原始 legacy records，但只能以原始 `creatorId` attribution 返回，不能把它伪装成已授权的 Identity/Profile context。
- ambiguous/unmapped subject 不得继续 migration，不得创建新的 Identity/Profile。
- 其他已验证 subject 可以独立正常迁移；单个坏 subject 不阻塞整个 deterministic batch，但 batch 必须报告失败/歧义计数和具体 diagnostics。
- manual review 只在 technical/product contract 中定义，不在 Stage 2 创建审核 UI；解除 `AMBIGUOUS`/`FAILED` 需要经过批准的 evidence review 和审计变更。

该方案与 ADR-002、ADR-006 的 fail-closed compatibility boundary 一致，没有重大冲突。

```text
FOUNDER DECISION REQUIRED: approve manual-review contract and historical-read scope
```

## 10. Cross-ADR Consistency

| Concern | Result | Evidence |
| --- | --- | --- |
| Lifecycle | consistent | Identity suspension blocks globally without rewriting Profile local lifecycle; archive is non-operational and non-delete |
| Ownership | consistent | one Profile has exactly one Identity; one Identity may own N Profiles; no cross-Identity transfer |
| Authorization | consistent | login is not OWNER; active membership and explicit profile/identity context are required |
| Migration | consistent | independent deterministic mapping; no default dual-write or mass backfill; ambiguity fails closed |
| Profile isolation | consistent | explicit Identity and Profile IDs are checked together; UI current context is not authorization |
| VS-01 compatibility | consistent | legacy APIs and `creatorId` reads remain; new model uses adapter/resolution boundary |
| Scope | consistent | no Commerce ID, OAuth, Platform Binding, Reputation, Payment, Commitment or runtime rewrite |

No contradiction requires reopening ADR-001～ADR-006. The known implementation conflict is intentional: the current Prototype uses `creatorId` as a legacy Creator reference, while Stage 2 introduces independent Identity/Profile IDs and membership authorization.

## 11. Stage 2 Final Implementation Gate

### 11.1 Gate evaluation

| Gate | Result | Condition |
| --- | --- | --- |
| `ARCHITECTURE_ACCEPTED` | PASS | Main Control authority states ADR-001～ADR-006 accepted |
| `DESIGN_ACCEPTED` | PENDING | ADR-007 and this ADR remain `PROPOSED` |
| `AUTHORIZATION_MODEL_ACCEPTED` | PENDING | Founder approval required for OWNER-only baseline |
| `COMPATIBILITY_DESIGN_ACCEPTED` | PENDING | Founder approval required for mapping form/state/manual review |
| `TEST_PLAN_ACCEPTED` | PENDING | acceptance evidence package awaits approval |
| `ROLLBACK_PLAN_ACCEPTED` | PENDING | rollback rehearsal and activation boundary await approval |

### 11.2 Readiness

```text
STAGE_2_IMPLEMENTATION_READINESS = READY_WITH_CONDITIONS
STAGE_2_IMPLEMENTATION_AUTHORIZATION = NOT_GRANTED
```

The seven decisions remove the substantive design ambiguity, but they do not themselves constitute Founder acceptance, test evidence, rollback evidence or implementation authorization. After Founder accepts this decision package and the remaining entry-gate evidence is approved, readiness may be promoted to `READY`; authorization must still be granted separately.

## 12. Stage 2 Authorization Package

This package is prepared for Founder approval only:

```text
Scope:
Identity + AccountIdentityMembership + Commerce Profile +
legacy mapping + compatibility translation + authorization hardening

Excluded:
Commerce ID, OAuth, Platform Binding, Reputation, Payment,
Settlement, Refund, Marketplace, CRM, Offer/Inventory/Reservation/
Commitment runtime rewrite

Required approval:
seven decisions in Sections 3–9

Required evidence before implementation:
test plan acceptance, rollback plan acceptance,
read-only mapping dry run, and VS-01 regression baseline

Authorization:
must be granted explicitly and separately
```

## 13. Implementation Order

推荐最终顺序：

```text
S2-001 Identity Core
    ↓
S2-002 AccountIdentityMembership
    ↓
S2-003 Commerce Profile Core
    ↓
S2-004 Profile Lifecycle
    ↓
S2-005 Legacy Mapping
    ↓
S2-006 Compatibility Adapter
    ↓
S2-007 Profile / Identity Context
    ↓
S2-008 Authorization Hardening
    ↓
S2-009 VS-01 Compatibility Regression
```

依赖和回滚边界：

| Unit | Depends on | Purpose | Independent rollback |
| --- | --- | --- | --- |
| `S2-001` | approved design | independent Identity IDs, persistence, lifecycle/audit seam | disable new Identity runtime |
| `S2-002` | S2-001 + authority approval | OWNER-only membership and state authorization | disable membership authorization path |
| `S2-003` | S2-001/S2-002 + profile fields approval | Profile persistence, one-to-many ownership, normalization | disable Profile commands; legacy unchanged |
| `S2-004` | S2-003 + propagation approval | local transitions and Identity effective gates | disable lifecycle commands |
| `S2-005` | S2-001/S2-003 + mapping approval | deterministic mapping record/state machine | stop new mapping writes |
| `S2-006` | S2-005 | legacy `creatorId` read/context resolution | turn off adapter and retain legacy reads |
| `S2-007` | S2-002/S2-003/S2-004/S2-006 | explicit Identity/Profile application context | disable new profile-aware commands |
| `S2-008` | S2-007 | enforce negative authorization and fail-closed paths | revert feature boundary, not data attribution |
| `S2-009` | all prior units | VS-01 regression and forbidden-scope governance evidence | reject activation without changing legacy runtime |

No unit may introduce a new commercial object runtime or modify existing legacy object semantics. `S2-005` must complete a read-only dry run before persistent mapping writes are activated.

## 14. Acceptance Evidence

| Stage 2 AC | Evidence Type | Validation |
| --- | --- | --- |
| Identity creation | integration test | independent deterministic ID; Account/creator/Profile/Commerce IDs differ |
| Identity uniqueness | persistence/integration test | duplicate creation and concurrent retry produce one Identity |
| Account authorization | application/authorization test | login alone fails; only ACTIVE OWNER can mutate |
| Multiple Profiles | integration/acceptance | one Identity creates and lists at least two Profiles |
| Profile isolation | authorization test | Profile A cannot read/mutate Profile B without explicit authorized context |
| Profile lifecycle | transition test | DRAFT/ACTIVE/SUSPENDED/ARCHIVED matrix and archive gates |
| Identity suspension | application/integration test | global mutation block; persisted Profile lifecycle unchanged; restoration preserves semantics |
| Identity archive | integration test | all Profiles non-operational; no delete; no simple relationship-based reactivation |
| Legacy mapping | deterministic/integration test | same canonical `legacyCreatorId` returns same Identity/Profile |
| Mapping uniqueness | persistence/concurrency test | duplicate active mapping impossible; retry is idempotent |
| Mapping states | state-machine test | ACTIVE/VERIFIED/AMBIGUOUS/FAILED/RETIRED transitions are audited |
| Ambiguous input | compatibility test | fail closed, diagnostic generated, no Identity/Profile created |
| Historical attribution | integration test | legacy objects retain original `creatorId` and trace to mapping evidence where verified |
| Legacy compatibility | regression/integration | existing reads/contracts remain valid; no default dual-write or mass backfill |
| VS-01 | full regression | existing Service Offering, Customer Request and canonical contract remain valid |
| Forbidden scope | governance test/review | no Commerce ID, OAuth, Platform Binding, Reputation, Payment, Commitment runtime changes |

Required execution order is: deterministic unit tests → application authorization tests → persistence/integration tests → compatibility/migration dry run → VS-01 regression → governance review. Real persistence evidence must not be replaced by mocks or fixtures where persistence behavior is under test.

## 15. Rollback

### Code rollback

Revert only Stage 2 modules/commands behind the unit boundary. Do not revert or rewrite legacy Prototype code. If a new command has emitted audit evidence, retain the audit record and mark the runtime result retired/invalid according to the approved audit policy.

### Schema rollback

Use additive, independently identifiable schema. Stop new reads/writes first; then use an approved down migration or forward-fix. Never drop, rename or reinterpret legacy `creator_id` columns as `identityId`.

### Compatibility rollback

Disable the adapter's active resolution path and continue existing `creatorId` reads/contracts. An ambiguous or failed mapping must never fall back to an unverified authorization decision; fallback is allowed only for explicitly historical, non-authorizing reads.

### Data rollback

Uncommitted Identity/Profile/mapping records roll back transactionally. Committed new records are not physically deleted by default; mark them archived/retired with audit evidence. Legacy records and original attribution are never deleted or reassigned as rollback.

### Feature activation rollback

Keep new Identity/Profile/mapping commands and resolver reads off by default. Disable in reverse order `S2-009` through `S2-001`, leave VS-01 legacy routes and persistence active, and verify the existing Prototype contract after each boundary change.

## 16. Founder Decision Required

The following seven items are proposed for Founder approval and are not accepted by this ADR:

1. Stage 2 `OWNER`-only authority taxonomy and membership state semantics.
2. Identity `SUSPENDED` global mutation block with unchanged persisted Profile lifecycle.
3. Identity `ARCHIVED` non-operational Profiles, preserved history, and no Stage 2 reactivation.
4. Account data-model support for multiple Identities with a single active working Identity context.
5. Profile minimum fields and activation requirement of `displayName` only unless separately changed.
6. Independent `legacy_subject_mapping` with the five mapping states.
7. Fail-closed ambiguous/unmapped subjects with manual review required and restricted historical reads.

Founder approval of this list must not be interpreted as implementation authorization.

## 17. Final Output

```text
Decision 1 — Authority:
OWNER-only Stage 2 membership; ACTIVE membership required; login is not OWNER.

Decision 2 — Identity Suspension:
Global mutation block; persisted Profile lifecycle remains unchanged.

Decision 3 — Identity Archive:
All Profiles non-operational; history and attribution retained; no simple reactivation.

Decision 4 — Account Multiple Identities:
Data model supports Account 1 → N Identity; UI uses one active working context.

Decision 5 — Profile Presentation:
displayName, bio, avatarUrl, location, socialLinks; displayName required,
others nullable; all authorized mutable with normalization.

Decision 6 — Legacy Mapping Persistence:
Independent legacy_subject_mapping; deterministic, unique, idempotent,
auditable; ACTIVE/VERIFIED/AMBIGUOUS/FAILED/RETIRED.

Decision 7 — Ambiguous Subject:
FAIL CLOSED → MANUAL_REVIEW_REQUIRED; no auto merge or silent reassignment.

Cross-ADR Consistency:
No major contradiction found; current creatorId model is an intentional legacy boundary.

Stage 2 Readiness:
READY_WITH_CONDITIONS pending Founder acceptance and evidence gates.

Implementation Order:
S2-001 → S2-002 → S2-003 → S2-004 → S2-005 → S2-006 →
S2-007 → S2-008 → S2-009.

Acceptance Evidence:
Identity/profile integration, authorization, lifecycle, deterministic mapping,
historical attribution, compatibility, VS-01 regression and governance tests.

Rollback:
Independent code/schema/compatibility/data/feature boundaries; preserve legacy Prototype.

Founder Decision Required:
Seven decisions in Section 16.

ADR Status:
PROPOSED

Implementation Changes:
NONE

Stage 2 Implementation Authorization:
NOT_GRANTED
```
