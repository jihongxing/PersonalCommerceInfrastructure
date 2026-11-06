# Personal Commerce Infrastructure

**核心定位**：为被平台封禁的 Creator 提供永不失效的商业身份

## 核心问题

地陪、台球助教、占卜师等个人商业者在抖音/小红书/微信因"私域引流"被封号，失去商业入口。

**PCI 解决方案**：给每个 Creator 一个平台无法封禁的商业标识（C号），让他们能在任何平台引流到自己的独立商业页面。

**关键技术**：

```text
传统方式：简介放域名 → 平台识别 URL → 封禁
PCI 方式：简介放 C号（3479AC-DEFHJK-MNPQRT）→ 平台无法识别 → 不会封禁
```

**核心洞察**：平台可以封禁域名，但无法封禁一串无意义的字符。

## 1. 产品本质

Personal Commerce Infrastructure (PCI) 是面向个人经济参与者的商业基础设施。它解决的结构性问题是：**中国互联网平台的封闭生态正在系统性地打压独立 Creator 的商业行为**，导致个人无法稳定管理跨平台的商业身份、供给、客户关系和履约证据。

PCI 让个人拥有：

- 可持续维护的内部 Identity
- 面向客户的 Commerce Profile
- 结构化的 Capability 与 Offer
- 可管理的 Availability、Time 和 Capacity Inventory
- 可追踪的 Commerce Commitment 与 Fulfillment
- 基于真实商业事件的 Reputation

## 2. 核心抽象

平台管理的不是单一活动、行程或票务，而是：

> Creator 的商业资产，以及由这些资产形成的可交易库存

```text
Creator
= Identity
+ Capability
+ Time
+ Influence
+ Audience
```

从资产到收入的链路：

```text
Identity
    ↓
Capability + Time + Influence
    ↓
Inventory
    ↓
Product
    ↓
Transaction
    ↓
Fulfillment
    ↓
Relationship
    ↓
Creator Income
```

## 3. 第一用户与产品楔子

**First User**：在公域平台面临封号/限流风险的个人商业者  
**优先场景**：地陪、台球助教、占卜师、上门服务  
**Primary Segment**：拥有外部平台分发和真实商业意图，但无法在平台内完成交易的 Creator  
**Long-term Scope**：Individual Economic Actors

选择理由：
- **封号痛苦度极高**：主要客源来自抖音/小红书，引导私域成交会被封号
- **平台内无解**：平台没有对应服务类目，或佣金过高（10-20%）无法接受
- **商业供给特点**：高度依赖个人能力、时间和稀缺可用窗口
- **当前痛点**：通过私信、表格、聊天和手工日历完成承接，随时面临封号风险
- **核心需求**：需要一个"平台无法封禁"的独立商业入口

**为什么不是"所有舞者"**：
- 舞者在美团/大众点评有成熟的平台内方案（"舞蹈培训"类目）
- 封号风险相对较低（不是平台重点打击对象）
- 痛点是"优化"而非"生存"

**为什么是"地陪、台球助教"**：
- 平台明确打击"私域引流"，封号频率极高
- 平台内无对应服务类目，无法完成交易
- 客单价适中（200-2000 元），有付费能力
- 市场规模可观（地陪 50万+，台球助教 20万+ 从业者）
- **要么用 PCI，要么无法做生意**（不是"更好"，是"必须"）

产品楔子：
```text
Identity-first
Availability as core inventory
Commerce workflow as execution layer
```

## 4. 身份架构

正式层级：

```text
Authentication Account
        ↓
Internal Identity
        ↓
N Commerce Profiles
        ↓
Commerce Objects
```

关键关系：

```text
1 Internal Identity : N Commerce Profiles
1 Commerce Profile : N External Platform Accounts
```

- **Internal Identity**：PCI 内部稳定、长期存在的主体根
- **Commerce Profile**：面向客户表达和经营的商业身份
- **Commerce Reference / C号**：Commerce Profile 的公开、平台中立引用
- **Commerce Relationship**：External Platform Account 到 Commerce Profile 的绑定关系

## 5. Commerce 对象分类

### 5.1 六类 Offer Type

| Offer Type | 出售对象                   | 典型机制                      |
| ---------- | -------------------------- | ----------------------------- |
| Service    | 人的时间与能力             | Time Inventory + Booking      |
| Goods      | 实体或数字商品             | Quantity Inventory + Order    |
| Program    | 1→N 的课程或训练过程       | Enrollment + Cohort / Session |
| Membership | 持续 Access / Relationship | Subscription + Access         |
| Project    | 定制结果                   | Scope + Request + Milestone   |
| Right      | 使用权或授权权             | Terms + Grant + Usage         |

### 5.2 核心库存抽象

```text
Time / Availability / Capacity = Commerce Inventory Primitive
```

区分三个概念：
- **Calendar UI**：表现形式
- **Availability**：某个 Offer 在特定条件下可被请求或承诺的窗口
- **Inventory**：可出售的时间、数量、席位或容量

## 6. 当前实现状态

### 6.1 已完成验证切片

| Slice   | 范围                                    | 状态     |
| ------- | --------------------------------------- | -------- |
| VS-01   | Product Proof                           | Complete |
| VS-02A  | Provider-neutral Money Domain           | Complete |
| VS-02B  | Provider Integration Readiness          | Complete |
| VS-02C  | Provider Adapter (微信支付)              | Conditional |
| VS-02D  | Engineering Readiness                   | READY    |
| VS-02D  | Real Money Activation                   | Founder GO Required |
| VS-02E  | Local Commercial Simulation             | COMPLETE |

当前版本：`0.1.0`

### 6.2 验收证据（2026-08-16）

- Vitest：205 passed / 10 条件 skipped
- System Edge：20 passed / 2 条件 skipped
- VS-01 focused Playwright：1 passed
- VS-02A focused Playwright：1 passed
- VS-02E focused Playwright：1 passed
- VS-02E PostgreSQL Browser acceptance：1 passed
- VS-02B Provider contract：3 passed
- VS-02C WeChat adapter contract：4 passed

### 6.3 技术栈

- Node.js 22 + TypeScript
- pnpm workspace
- Fastify 5 + TypeBox + OpenAPI 3
- PostgreSQL + Drizzle ORM
- Supabase Auth Adapter
- Next.js 16 + React 19
- Tailwind CSS + shadcn/ui
- openapi-typescript + openapi-fetch
- Playwright + System Edge
- Vitest + GitHub Actions CI

## 7. 工程治理原则

每一次实现变更都必须被视为一个完整的变更单元：

1. 识别受影响的产品需求、领域对象、状态转换、事件和验收测试
2. 完成最小且连贯的代码、测试、配置或文档变更
3. 运行距离本次变更最近的有效验证
4. 在执行台账中更新状态与证据
5. 任何产品行为变化都必须先登记 `DEV-###` 偏差

产品与工程边界：
- PRD 是实现合同
- 代码不得静默修改产品对象、规范流程、状态转换、规范事件、权限或范围
- 产品对象、数据库表、API 资源和代码类型是彼此独立的工程决策
- VS-01 不得引入支付、结算、退款、Marketplace、CRM 或其他延后能力

## 8. 明确非目标

当前不属于 PCI Core Implementation：

- Payment / Settlement / Refund（当前 `REAL_MONEY_ENABLED=false`）
- Marketplace
- CRM
- Social Feed
- Advertising
- Native `apps/app`（已 DEFERRED）

## 9. 产品演化阶段

```text
Stage 0: Product Direction & Domain Vocabulary（已完成）
Stage 1: Prototype Validation（VS-01 已完成）
Stage 2: Commerce Identity & Profile Foundation（部分授权）
Stage 3: Commerce ID & Public Commerce Entry（未授权）
Stage 4: External Platform Relationships（未授权）
Stage 5: Expanded Commerce Infrastructure（未授权）
Future: Platform / Network Extensions（未授权）
```

当前状态：
```text
PRODUCT_STAGE = STAGE_0
PROJECT_STATUS = SUSPENDED
REAL_MONEY_ENABLED = false
apps/app = DEFERRED
STAGE_2 = AUTHORIZED (IDENTITY-001, IDENTITY-002, IDENTITY-003 scopes only)
```

## 10. 长期愿景

让任何拥有个人 IP、专业能力、技能、影响力或个人品牌的人，都能够拥有独立于社交平台的商业身份，并像一家公司一样管理自己的商品、库存、客户、订单、收入和商业数据。

最终定位：
```text
Personal Economic Infrastructure
Personal Business OS
```

外部平台（TikTok / Douyin、Instagram、YouTube、X、微信等）是分发、发现和交互渠道，不是 PCI 的：
- System of Record
- Identity Authority
- Commerce Profile Authority
- Reputation Authority

## 11. 事实源清单

| 文档类型           | 路径                                                                    | 角色                           |
| ------------------ | ----------------------------------------------------------------------- | ------------------------------ |
| **核心问题与策略** | `docs/01_Strategy/05A_Core_Problem_and_Anti_封禁_Strategy.md`            | **反封禁战略定位、C号 设计意图** |
| 产品方向 SSOT      | `docs/01_Strategy/05_Personal_Commerce_Infrastructure_Product_Direction.md` | 产品定义、方向模型、领域词汇   |
| VS-01 产品合同     | `docs/07_Product_Architecture/20_MVP_PRD_VS01.md`                       | 实现合同                       |
| VS-02 产品合同     | `docs/09_Engineering_Governance/35_VS02_Paid_Service_PRD.md`            | Paid Service 实现合同          |
| 执行台账           | `docs/08_Execution/21_Prototype_Execution.md`                           | 实现状态、偏差、证据           |
| 当前交接           | `docs/08_Execution/23_2026-08-15_Handoff.md`                            | 交接基线                       |
| 工程治理           | `docs/09_Engineering_Governance/22_Engineering_Governance.md`           | 工程规范                       |
| 技术架构决策       | `docs/09_Engineering_Governance/23_Technology_Architecture_Decision.md` | 架构决策                       |

**优先阅读顺序**（新团队成员或外部评审）：
1. `05A_Core_Problem_and_Anti_封禁_Strategy.md` - 理解核心问题和解决方案
2. `idea.md` - 快速了解项目全貌
3. `05_Personal_Commerce_Infrastructure_Product_Direction.md` - 深入产品定义
4. `20_MVP_PRD_VS01.md` - 了解第一个验证切片
5. `21_Prototype_Execution.md` - 查看当前实现状态

## 12. 常用命令

```bash
# 安装依赖
pnpm install

# 开发
pnpm dev              # 启动 prototype 应用
pnpm dev:api          # 启动 API 服务
pnpm dev:web          # 启动 Web 客户端

# 构建
pnpm build            # 构建服务端
pnpm build:web        # 构建 Web

# 数据库
pnpm db:generate      # 生成迁移
pnpm db:migrate       # 执行迁移
pnpm db:integration:check  # 检查集成环境

# 测试
pnpm test:domain      # 领域测试
pnpm test:contracts   # 契约测试
pnpm test:acceptance  # 验收测试
pnpm test:acceptance:browser  # 浏览器验收测试

# 质量检查
pnpm format           # 格式化代码
pnpm format:check     # 检查格式
pnpm lint             # 代码检查
pnpm typecheck        # 类型检查

# 完整验证
pnpm preflight        # 执行完整预检
```

`pnpm preflight` 依次执行工程治理检查、格式检查、Lint、类型检查、测试、服务端构建、OpenAPI Client 生成、Web 类型检查和 Next Production Build，并使用系统 Edge 启动 API 与 Web Reference Client，执行基础浏览器验收。

## 13. 重要警示

**No Real Money Evidence.**

当前不存在真实 Customer Payment、真实 Settlement、真实 Creator Earnings、真实 Withdrawal 或真实 Refund 证据。受控 Test Transport、Fixture、Sandbox 命名和 `pilot_operations` 事实均不得解释为真实商业事实。

不得自动启用真实资金。必须先完成：
- Provider Qualification Evidence Package
- 真实账户与签名验证
- Founder Activation Checklist
- `39` 独立 Go / No-Go

当前 `REAL_MONEY_ENABLED=false`，不得加载真实生产凭据、执行真实 KYC 或发起真实 Payment / Settlement / Withdrawal。
