# 26 — Private Product Closure / MVP Readiness Decision Package

> **审计编号**：`PRIVATE-PRODUCT-CLOSURE-001`
> **日期**：2026-08-27
> **性质**：Private Product Closure Audit / Founder Next-Stage Decision Package
> **Authority**：Main Control / Founder
> **Implementation authorization**：本文件不授权新的 Runtime 或 Product Surface

## 1. Result

```text
PRIVATE-PRODUCT-CLOSURE-001 = COMPLETE
PRIVATE_PRODUCT_FOUNDATION = PARTIAL
PRIVATE_PRODUCT_MVP = NOT YET READY FOR UNCONSTRAINED PILOT
```

结论不是代码基础被阻塞，而是当前产品仍缺少足以证明“新用户可以无人工介入完成完整闭环”的
产品入口和前置事实。五个 Private Product Surface 的后端、持久化、API、权限与已有 Web
展示能力已经形成技术闭环；但 C号当前为只读能力，Profile 可能处于 `NOT_ASSIGNED`，平台
账号与 Relationship 也依赖既有 durable facts。当前 authenticated desk 将多个 Surface
纵向渲染在同一页面，但没有显式的跨 Surface 导航或 onboarding 状态机。

因此本审计将 Foundation 定级为 `PARTIAL`，不擅自实现缺失能力。

## 2. Scope and Non-Expansion

本审计覆盖：

```text
IDENTITY-001 ~ IDENTITY-003
RUNTIME-001 ~ RUNTIME-007
SURFACE-001 ~ SURFACE-005
```

本审计不实现：

```text
SURFACE-006
OAuth
External Platform Binding
External Verification
Public API
Public Resolver
QR
Payment
Settlement
Refund
Marketplace
CRM
Event / Outbox
Real Money
```

没有新增业务对象、数据库表、数据库 migration、公开 API 或 runtime capability。

## 3. Canonical User Graph

当前系统实现并验证以下授权与数据图：

```text
Authenticated Account
        ↓
ACTIVE AccountIdentityBinding
        ↓
Internal Identity
        ↓
Owned Commerce Profile
        ↓
Commerce Reference (0..1, read-only on private surface)
        ↓
Commerce Relationship history
        ↓
External Platform Account
```

语义边界保持：

```text
Internal Identity ≠ Commerce Profile
Commerce Profile ≠ Commerce Reference
Commerce Reference ≠ Internal Identity
External Platform Account ≠ Commerce Relationship
Commerce Relationship.role ≠ Profile ownership
VERIFIED ≠ platform ownership proof
```

审计未发现 Private Surface 偷生 Public Resolver、Public Profile 或匿名查找能力。

## 4. Surface Audit

| Surface | 实际能力 | Backend | PostgreSQL | API | UI | Security | MVP 判断 |
|---|---|---|---|---|---|---|---|
| Identity / Surface-001 | 当前 Identity 读取；Account → active binding → Identity | PASS | VERIFIED | PASS | PASS | PASS | Foundation PASS |
| Profile / Surface-002 | list/create/read/displayName update/suspend/archive/reactivate | PASS | VERIFIED | PASS | PASS | PASS | Foundation PASS |
| Reference / Surface-003 | owned Profile 的 View / Copy；`NOT_ASSIGNED` empty state | PASS | VERIFIED | PASS | PASS | PASS | Foundation PARTIAL |
| External Account / Surface-004 | authorized account list/detail/status read-only | PASS | VERIFIED | PASS | PASS | PASS | Foundation PARTIAL |
| Relationship / Surface-005 | authorized list/detail/history/Profile grouping/read-only | PASS | VERIFIED | PASS | PASS | PASS | Foundation PARTIAL |

五个 Surface 的技术证据均存在：

```text
SURFACE-001 REAL_POSTGRESQL = VERIFIED
SURFACE-002 REAL_POSTGRESQL = VERIFIED
SURFACE-003 REAL_POSTGRESQL = VERIFIED
SURFACE-004 REAL_POSTGRESQL = VERIFIED
SURFACE-005 REAL_POSTGRESQL = VERIFIED
```

Surface-003、004、005 的 Browser → real PostgreSQL integration 均为 `NOT VERIFIED`，详见第 9 节。

## 5. MVP User Journey Audit

### 5.1 Intended journey

```text
Login
  → Account context
  → active AccountIdentityBinding
  → Internal Identity
  → Create Commerce Profile
  → View / edit Profile
  → View Profile's C号
  → View authorized External Platform Accounts
  → View Relationship history
```

### 5.2 Actual journey

1. 用户可以通过现有认证入口登录或注册。
2. 认证后 authenticated desk 同时渲染 Identity、Profile、Reference、External Account 和
   Relationship workspace。
3. 当前 Identity 解析依赖 active AccountIdentityBinding；没有 binding 时请求 fail closed，
   但页面没有明确的“如何完成 Identity onboarding”产品流程。
4. 用户可以通过 `Create Profile` 创建 Profile 并管理允许的 display name 与 lifecycle。
5. Profile workspace 会读取对应 Reference；已有 Reference 可以查看、复制 canonical C号。
6. Profile 没有 Reference 时显示 `This profile has no assigned Commerce Reference.`，不会生成、
   分配或修改 C号。
7. External Platform Account 与 Commerce Relationship 仅显示既有 durable facts，不会自动发现、
   绑定、验证或创建。

### 5.3 Journey verdict

当前没有死循环，授权失败状态是 fail-closed，空状态也有明确文案；但完整用户旅程不能保证
在普通新用户路径中完成：

```text
创建 Profile → 拿到 C号 → 看到平台账号 → 看到 Relationship
```

原因是：

- 首次登录后的 Identity / active binding onboarding 入口不明确；
- C号是 read-only private surface，Profile 可能合法地没有 assigned Reference；
- External Platform Account 与 Relationship 依赖既有 durable facts，本轮没有用户创建或绑定入口；
- 五个 workspace 同页纵向展示，但没有显式的 Identity → Profile → Reference → Account →
  Relationship 导航关系。

这不是通过新增功能解决的实现任务；属于 Founder / Product 决策与 MVP 运营前置条件。

## 6. UX and Product Gap Classification

### A. MVP Blocker

```text
MVP_BLOCKER = NONE FOR TECHNICAL FOUNDATION
```

若 MVP 定义为“已认证用户可以查看和管理已有 Private Product facts”，技术基础不阻塞。

若 MVP 定义为“任意新用户无需人工或预置 durable facts 即可完成完整商业闭环”，则以下为
`MVP UX / OPERATIONS GAP`，需要 Founder 决策后处理：

```text
首次登录后的 Identity / binding onboarding 入口不明确
缺少显式跨 Surface 导航与用户旅程状态
C号未分配时没有普通用户可用的 approved assignment path
External Platform Account / Relationship 没有用户可执行的合法建立路径
```

本审计不将这些 gap 静默改写成实现授权。

### B. Pre-Public Blocker

```text
Public Resolver / Public Profile 的独立授权与 abuse model 尚未批准
OAuth、External Platform Binding、Verification Runtime 尚未批准
Public/private identifier exposure、enumeration、rate limiting、session hardening 尚未完成
```

### C. Quality Improvement

```text
为 authenticated desk 增加显式的五层导航和当前步骤提示
为 no binding / no profile / no reference / no account / no relationship 提供一致的下一步说明
建立稳定的 authenticated browser fixture，验证 Web → private API → PostgreSQL
补充端到端用户旅程验收，而不改变 domain 或 authorization contract
```

### D. Future

```text
SURFACE-006 及后续 Surface
Reference assignment / generation policy（需 Founder 单独批准）
External Platform Binding
OAuth
External Verification
Public Profile / Resolver / QR
```

### E. Out of Scope

```text
Payment
Settlement
Refund
Marketplace
CRM
Event / Outbox
Real Money
Account Recovery
Account Replacement
CSRF
Rate Limiting
Brute Force
Credential Security
```

## 7. MVP Readiness Matrix

| Capability | Backend | PostgreSQL | API | UI | Security | MVP |
|---|---|---|---|---|---|---|
| Identity | PASS | VERIFIED | PASS | PASS | PASS | READY within existing binding scope |
| Profile | PASS | VERIFIED | PASS | PASS | PASS | READY |
| Reference | PASS | VERIFIED | PASS | PASS | PASS | PARTIAL: read/copy only; assignment may be absent |
| External Account | PASS | VERIFIED | PASS | PASS | PASS | PARTIAL: read-only existing facts |
| Relationship | PASS | VERIFIED | PASS | PASS | PASS | PARTIAL: read-only existing facts/history |

### Matrix interpretation

```text
Technical foundation = PASS
New-user self-service closure = NOT PROVEN
Unconstrained pilot readiness = NOT PROVEN
```

## 8. Failure-State Audit

| State | 用户看到什么 | 可以做什么 | 不能做什么 |
|---|---|---|---|
| No active Identity binding | private Identity unavailable / authenticated request fails closed | 重新进入已批准认证上下文 | 不能选择任意 Identity 或伪造 binding |
| No Profile | Profile empty state and Create Profile | 创建自己的 Profile | 不能创建他人 Profile |
| No Reference | `This profile has no assigned Commerce Reference.` | 继续管理 Profile | 不能生成、分配、修改、释放或删除 C号 |
| No External Account | `No external platform accounts.` | 查看空状态 | 不能 Connect、Discover、Bind 或 Verify |
| No Relationship | `No commerce relationships.` | 查看空状态 | 不能创建、绑定、解绑或验证 |
| Profile SUSPENDED | Profile lifecycle state | 依既有 contract 查看/允许的操作 | 不能绕过 lifecycle contract |
| Profile ARCHIVED | Archived state | 保留 durable record | 不能非法恢复 |
| External Account SUSPENDED/REVOKED | account lifecycle label | 只读查看 | 不能修改 lifecycle |
| Historical Relationship | Historical status in relationship history | 查看历史关联 | 不能编辑或删除历史事实 |

## 9. End-to-End Authorization Audit

授权链审计结果：

```text
Account
  → ACTIVE AccountIdentityBinding
  → Internal Identity
  → owned Commerce Profile
  → authorized Reference / Relationship scope
  → authorized External Platform Account scope
```

已验证或已有 Surface evidence 覆盖：

```text
foreign Identity = FAIL CLOSED
foreign Profile = FAIL CLOSED
foreign Reference = FAIL CLOSED
foreign Relationship = FAIL CLOSED
foreign External Platform Account = FAIL CLOSED
identity/profile/relationship/account selector injection = FAIL CLOSED
```

结论：

```text
END_TO_END_AUTHORIZATION = PASS
IDOR_RESISTANCE = PASS
HORIZONTAL_ESCALATION_RESISTANCE = PASS
```

每个 Surface 都独立执行 object-level authorization；没有因为上一层授权而默认下一层安全。

## 10. UI Real-Database Gap

```text
REAL_POSTGRESQL_SURFACE_003_UI_INTEGRATION = NOT VERIFIED
REAL_POSTGRESQL_SURFACE_004_UI_INTEGRATION = NOT VERIFIED
REAL_POSTGRESQL_SURFACE_005_UI_INTEGRATION = NOT VERIFIED
```

该 gap **当前不阻塞技术 Foundation closure**，理由是：

- API → Application → PostgreSQL 已对五个 Surface 分别完成真实数据库验证；
- Web 使用同一 private API contract 和 authenticated access-token provider；
- 本轮没有证据表明浏览器 fixture 缺失导致 API、应用或持久化行为不正确。

但该 gap **阻塞“已完成真实浏览器产品体验验证”的声明**，也阻塞无条件宣称
`READY FOR VALIDATION / PILOT`。因此建议在 Founder 决策中将其列为 pilot 前的 validation
condition，而不是当前 Foundation 的硬阻塞。

## 11. Security Gap Classification

| Gap | 分类 | 审计结论 |
|---|---|---|
| Account Recovery | Future / pre-public consideration | 当前不阻塞 private foundation；公开或生产 pilot 前需独立决策 |
| Account Replacement | Future | 不属于当前 identity binding contract |
| Session Security | Pre-Public Blocker | 需在真实部署与 public exposure 前完成独立审计 |
| CSRF | Pre-Public Blocker | 需按实际 cookie/session transport 决定 |
| Rate Limiting | Pre-Public Blocker | 尤其针对认证、私有查询和未来 resolver |
| Brute Force | Pre-Public Blocker | 认证边界尚非本 Surface 的实现范围 |
| Credential Security | Pre-Public Blocker | OAuth/token/secret 尚未授权；未来 external integration 必须单独审计 |

这些均为审计分类，不是本变更单元的实现授权。

## 12. Private vs Public Boundary

```text
Private Product
= authenticated user manages and understands their own commercial infrastructure

Public Product
= external stranger discovers a Profile through a Commerce Reference
```

当前 Private Product 未实现或授权：

```text
Public API = NOT AUTHORIZED
Public Resolver = NOT AUTHORIZED
Public Profile = NOT AUTHORIZED
QR = NOT AUTHORIZED
```

没有发现 `/c/{reference}`、匿名 Profile lookup、Public Resolver 或隐式公开 Relationship
能力。

## 13. Founder Decision

### 13.1 Proposed decision

```text
PRIVATE_PRODUCT_MVP-DECISION
```

建议 Founder 选择并明确以下产品定义之一：

```text
OPTION A — PRIVATE FOUNDATION VALIDATION
批准当前五个 Surface 作为“已有 durable commercial facts 的 authenticated private
foundation”进入受控 validation；不声称新用户自助完成完整闭环。

OPTION B — SELF-SERVICE PRIVATE MVP
暂不宣布 MVP ready；先由 Founder 单独批准 onboarding、Reference assignment policy、
以及 External Platform Account / Relationship provenance workflow，再形成新的实现决策包。
```

基于当前证据，Main Control 推荐：

```text
PRIVATE_PRODUCT_MVP_DECISION_RECOMMENDATION = OPTION A WITH EXPLICIT CONDITIONS
```

条件：

1. Pilot participant 使用已有 approved Account / Identity binding；
2. Profile 创建由当前 private Profile surface 完成；
3. Reference、External Account、Relationship 的缺失状态保持真实，不自动补造；
4. 在 pilot 前补做真实 authenticated browser journey validation，或 Founder 明确接受
   API-to-PostgreSQL evidence 作为当前验证边界；
5. 不授权 Public Product、OAuth、Binding、Verification、QR 或 Real Money。

### 13.2 Decision status

```text
PRIVATE_PRODUCT_MVP-DECISION = FOUNDER DECISION REQUIRED
PUBLIC_PRODUCT = NOT AUTHORIZED
OAUTH = NOT AUTHORIZED
PLATFORM_BINDING = NOT AUTHORIZED
EXTERNAL_VERIFICATION = NOT AUTHORIZED
```

本文件是决策包，不是对 Option A 或 Option B 的批准。

## 14. Required Next Review Questions

Founder 下一步只需决定：

1. Private MVP 的目标是“读取和管理已有基础设施事实”，还是“新用户自助完成全闭环”？
2. 如果选择受控 validation，是否接受 `NOT_ASSIGNED`、无 External Account、无 Relationship
   作为合法 pilot empty states？
3. 是否把 browser → private API → PostgreSQL 真实验证列为 pilot 前条件？
4. 是否批准后续单独决策包处理 onboarding / assignment / provenance，而不是在本审计中实现？

## 15. Compatibility and Stop Boundary

```text
VS01_COMPATIBILITY = PRESERVED
MIGRATION = NOT IMPLEMENTED
COMMERCE_PATTERN = UNCHANGED

SURFACE-006 = NOT STARTED
PUBLIC_API = NOT AUTHORIZED
PUBLIC_RESOLVER = NOT AUTHORIZED
QR = NOT AUTHORIZED
OAUTH = NOT AUTHORIZED
EXTERNAL_PLATFORM_BINDING = NOT AUTHORIZED
VERIFICATION_RUNTIME = NOT AUTHORIZED
EVENT_OUTBOX = NOT AUTHORIZED
REAL_MONEY = NOT AUTHORIZED
```

审计完成后硬停止，等待 Founder / Main Control 决策。
