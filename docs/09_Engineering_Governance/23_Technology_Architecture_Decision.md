# 23 — 技术架构决策

> **状态**：Decision v1  
> **阶段**：执行阶段 / M1.5 技术架构决策  
> **范围**：VS-01 受控原型及后续跨端演进  
> **文档角色**：在产品事实源与工程治理之间，冻结技术架构方向  
> **上游事实源**：[20 MVP PRD: VS-01](../07_Product_Architecture/20_MVP_PRD_VS01.md)、[22 工程治理](./22_Engineering_Governance.md)  
> **并行执行记录**：[21 Prototype Execution](../08_Execution/21_Prototype_Execution.md)  
> **最后更新**：2026-08-11

## 1. 决策摘要

本项目**暂不冻结最终产品呈现形态**。产品未来可以通过 Web、原生移动应用、小程序或其他适配客户端提供能力；当前不能因为 VS-01 先使用 Web 参考客户端，就把产品定义为 Web 产品。

当前冻结的技术方向是：

```text
产品事实
    ↓
领域模块与应用服务
    ↓
跨端应用契约
    ↓
传输与客户端适配层
    ├── Web Reference Client
    ├── Mobile App Adapter
    └── Mini-program Adapter
```

VS-01 的首个可运行界面可以采用 Web，但其定位为：

```text
Web = 首个 Reference Client
Web ≠ 最终产品形态
Web ≠ 业务逻辑所有者
```

## 2. 架构决策

### 2.1 产品形态暂不冻结

产品形态属于尚未完成的分发与体验决策，不属于当前产品本体的必要约束。

因此：

- 不把 Personal Commerce Infrastructure 定义为 Web 应用；
- 不把 Web 路由、页面组件或框架专属机制写入产品事实；
- 不要求现在同时实现 Web、App 和小程序；
- 允许根据真实使用场景，在后续选择一个或多个客户端形态；
- 客户端形态变更不得改变已冻结的产品对象、状态机、规范事件和业务规则。

### 2.2 领域层与客户端解耦

产品能力必须由业务模块和应用服务表达，而不是由某个客户端表达。

VS-01 的核心能力包括：

- 创建和编辑 `Commerce Identity`；
- 创建和编辑 `Service Offering`；
- 设置 `Availability`；
- 发布和取消发布；
- 生成 `Distribution Asset`；
- 创建 `Commerce Action / Request`；
- `Confirm` 或 `Decline`；
- 记录 `Confirmed Commerce`、`Declined Commerce` 及对应规范事件。

以上能力不得依赖：

- React 组件；
- Next.js 页面或 Server Actions；
- 浏览器 API；
- 移动操作系统 API；
- 小程序运行时 API。

### 2.3 应用服务与 API 作为跨端契约

客户端通过应用层命令、查询和跨端 API 契约访问业务能力。

推荐调用方向：

```text
Web / App / Mini-program
    ↓
Transport Adapter
    ↓
Application Service
    ↓
Business Module
    ↓
Port / Adapter / Persistence
```

VS-01 的应用能力应以稳定的业务动作命名，而不是以页面或 UI 组件命名：

| 应用能力                 | 责任                   |
| ------------------------ | ---------------------- |
| `CreateCommerceIdentity` | 创建商业身份           |
| `UpdateCommerceIdentity` | 更新商业身份           |
| `CreateServiceOffering`  | 创建服务供给           |
| `UpdateAvailability`     | 更新可用性             |
| `PublishOffering`        | 发布供给并生成分发资产 |
| `UnpublishOffering`      | 取消发布               |
| `CreateCommerceAction`   | 客户提交 Request       |
| `ConfirmCommerceAction`  | Creator 确认请求       |
| `DeclineCommerceAction`  | Creator 拒绝请求       |

当前优先采用 HTTP API / REST 风格的跨端契约；API 的具体资源命名、认证协议和序列化格式应在实现需要时单独冻结，不得反向改变产品模型。

### 2.4 Web 仅作为首个 Reference Client

为了降低 VS-01 的首个实现成本，当前允许建立 Web Reference Client。

Web 客户端的职责仅限于：

- 呈现 VS-01 的 Creator、Public 和 Customer 表面；
- 收集用户输入；
- 调用应用 API；
- 展示产品状态和通知结果；
- 支持验收测试与原型评审。

Web 客户端不得：

- 直接修改数据库；
- 绕过应用服务执行状态转换；
- 自行生成 Canonical Event；
- 自行决定 Confirm、Decline 或 Publish 的业务资格；
- 承载只能由领域模块解释的业务规则。

如果实现阶段选择 Next.js，它只能作为 Web Reference Client 或组合运行时的一部分使用。Next.js Server Actions 不得成为跨端业务契约，也不得成为其他客户端必须依赖的唯一入口。

### 2.5 App 与小程序保留为未来适配目标

移动 App 和小程序属于未来客户端适配目标，不在当前 VS-01 必须实现范围内。

未来新增客户端时必须：

1. 复用同一套应用能力；
2. 复用同一套业务模块和状态机；
3. 复用同一套 Canonical Event；
4. 遵守相同的 Actor、权限和产品规则；
5. 通过独立 Adapter 处理平台差异；
6. 不在客户端复制或变更核心业务规则。

## 3. 推荐工程结构

当前架构采用模块化单体，但保留多客户端和独立 API 的演进路径：

```text
apps/
├── prototype/                 # 当前 Foundation / 组合根
├── api/                       # 未来独立 API 运行时（按需要建立）
├── web/                       # Web Reference Client（按需要建立）
├── mobile/                    # 未来移动客户端（暂不建立）
└── mini-program/              # 未来小程序客户端（暂不建立）

modules/
├── creator-commerce-identity/
├── service-offering/
├── distribution/
├── customer-request/
├── commerce-decision/
├── product-facts/
└── shared/

adapters/
├── auth/
├── persistence/
├── storage/
├── notifications/
├── transport/
└── observability/

contracts/
├── api/
└── events/

database/                      # SQL Schema 与 Migration（引入持久化时建立）
infra/                         # 环境、部署与运行资产（需要时建立）
```

该结构是方向性边界，不要求当前创建所有空目录。目录治理继续遵守
[architecture-and-directory.md](./architecture-and-directory.md)。

## 4. 技术栈基线

### 4.1 已冻结

| 层级           | 决策                    |
| -------------- | ----------------------- |
| 运行时         | Node.js 22              |
| 语言           | TypeScript，strict mode |
| 包管理         | pnpm                    |
| 业务架构       | 模块化单体              |
| 单元与应用测试 | Vitest                  |
| 代码质量       | ESLint + Prettier       |
| 持续集成       | GitHub Actions          |

### 4.2 推荐基础设施

以下选择服务于工程复用与跨端解耦，不改变产品形态决策：

| 能力       | 推荐方案                           | 边界                               |
| ---------- | ---------------------------------- | ---------------------------------- |
| 关系数据库 | PostgreSQL                         | 通过持久化 Adapter 访问            |
| 数据访问   | Drizzle ORM + SQL Migration        | 不使用未经审查的 Schema Push       |
| 身份认证   | Supabase Auth 或等价 Auth Provider | 通过 Auth Port / Adapter 接入      |
| 文件存储   | Supabase Storage 或等价对象存储    | 仅通过 Storage Adapter 接入        |
| 外部 API   | HTTP API / REST 风格契约           | 客户端不得绕过应用层               |
| 浏览器验收 | Playwright                         | 作为 Reference Client 的验收执行层 |

Supabase、Drizzle 和 Playwright 是工程实现选择，不是产品事实源。Provider 可替换时，业务模块不应发生产品行为变化。

### 4.3 当前不引入

在 VS-01 或 M1.5 阶段不引入：

- 支付、结算、退款或 Merchant of Record 能力；
- Marketplace、搜索、推荐或社交图谱；
- CRM、Membership 或复杂关系系统；
- Redis、Kafka、RabbitMQ 等分布式基础设施；
- 微服务拆分；
- 为未来 App 或小程序提前建立空客户端；
- 绑定单一客户端的业务 SDK。

## 5. 分层依赖规则

依赖方向冻结如下：

```text
Client
  → Transport Adapter
  → Application Service
  → Business Module
  → Port
  → Infrastructure Adapter
```

必须满足：

1. `modules/` 不得导入 React、Next.js、浏览器或小程序 SDK；
2. `modules/` 不得直接读取环境变量或调用外部 Provider；
3. `apps/` 只负责组合与运行，不拥有可复用业务规则；
4. `adapters/transport/` 负责协议转换，不负责业务决策；
5. 所有状态转换必须由业务模块的策略或应用服务调用；
6. 所有 Canonical Event 必须由产品事实模块或受治理的应用服务产生；
7. 客户端只提交意图并展示结果，不自行推断业务状态；
8. 外部 SDK 类型不得泄漏到领域模块和跨端契约。

## 6. 跨端一致性约束

不同客户端必须共享以下工程事实：

| 事实     | 共享要求                           |
| -------- | ---------------------------------- |
| 产品对象 | 使用 17 定义的对象语义             |
| 状态机   | 使用 18 定义的合法状态与转换       |
| 交互规则 | 使用 19 与 20 定义的前置条件和结果 |
| 权限     | 使用统一 Actor 权限策略            |
| 事件     | 使用唯一 Canonical Event Registry  |
| 错误     | 使用应用层可识别的业务错误语义     |
| 验收     | 使用同一套 FR 与 AT 追溯关系       |

客户端可以不同：

- 页面结构；
- 导航方式；
- 输入控件；
- 平台通知能力；
- 分享入口；
- 展示层的视觉表现。

客户端不得不同：

- Offering 是否可发布；
- Request 是否有效；
- Creator 是否可以 Confirm / Decline；
- 状态转换是否合法；
- 是否产生产品事实事件；
- Confirmed Commerce 是否等同于 Paid Transaction。

## 7. VS-01 实现策略

VS-01 采用“核心能力先独立、参考客户端后接入”的实现顺序：

```text
业务模块与应用服务
    ↓
跨端 API / Transport Adapter
    ↓
Web Reference Client
    ↓
Playwright / Acceptance Tests
```

首个客户端可以是 Web，但必须满足：

- Web 只是一个调用方；
- VS-01 的业务流程不写死在页面组件中；
- 后续 App 或小程序可以复用同一应用 API；
- Reference Client 的替换不会要求重写领域状态机；
- 任何为 Web 做出的特殊决策必须标记为 Adapter Decision。

当前 `apps/prototype` 保留为工程 Foundation 组合根；当 VS-01 需要真实 UI/API 时，再按本决策引入对应应用入口，不以预先创建目录代替实现。

## 8. 技术架构决策记录

| 编号    | 决策                                             | 状态               | 说明                                   |
| ------- | ------------------------------------------------ | ------------------ | -------------------------------------- |
| TAD-001 | 产品最终呈现形态暂不冻结                         | Frozen             | Web、App、小程序均保留可能性           |
| TAD-002 | 领域层与客户端解耦                               | Frozen             | 核心业务逻辑不得依赖客户端技术         |
| TAD-003 | 应用服务 / API 作为跨端契约                      | Frozen             | 客户端通过应用能力访问业务模块         |
| TAD-004 | Web 作为首个 Reference Client                    | Approved for VS-01 | 仅为降低首个原型验证成本               |
| TAD-005 | App 与小程序作为未来适配目标                     | Deferred           | 当前不提前实现                         |
| TAD-006 | 不使用 Next.js 专属机制承载核心业务              | Frozen             | Server Actions 不能成为唯一业务入口    |
| TAD-007 | 所有客户端复用业务模块、状态机和 Canonical Event | Frozen             | 客户端只允许承担适配职责               |
| TAD-008 | 模块化单体优先                                   | Frozen             | 当前规模不引入微服务                   |
| TAD-009 | PostgreSQL + Drizzle + SQL Migration             | Approved           | 真实持久化引入时生效                   |
| TAD-010 | Playwright 作为 Web Reference Client 验收层      | Approved           | 不代表 App / 小程序必须使用 Playwright |

## 9. 风险与再审触发器

### 9.1 主要风险

- 首个 Web 客户端可能把业务逻辑重新耦合到页面层；
- API 契约可能被过早设计成某个客户端的资源模型；
- Supabase Provider 可能被错误地当成产品架构；
- 多客户端尚未出现时，过早抽取共享 Package 会增加复杂度；
- Web、App、小程序的身份与分享能力差异可能影响 Adapter 设计。

### 9.2 Revisit Triggers

满足以下任一条件时，必须重新审查本决策并记录 `ENG-###`：

1. 出现第二个真实客户端；
2. Web 参考客户端无法覆盖 VS-01 的关键流程；
3. 应用 API 需要为不同客户端复制业务规则；
4. 当前模块化单体出现明确的独立部署或扩展瓶颈；
5. Supabase、PostgreSQL 或 Drizzle 造成无法接受的锁定或合规风险；
6. 产品决定引入支付、结算、退款或其他 Deferred Capability；
7. 客户端需要直接访问基础设施才能完成产品行为；
8. 发生影响产品状态、权限或 Canonical Event 的实现偏差。

任何产品行为变化仍必须遵循：

```text
Implementation Issue
→ DEV-###
→ Product Decision
→ PRD Amendment
→ Code / Test
```

## 10. 明确非目标

本文件不：

- 冻结最终产品为 Web、App 或小程序；
- 设计具体页面视觉；
- 定义 API 的完整资源清单；
- 定义数据库表结构；
- 实现 VS-01；
- 引入支付、结算、退款或 Marketplace；
- 允许客户端自行复制领域规则；
- 用技术实现反向修改 17–20 的产品定义。

## 11. 决策结论

本项目当前不是“一个 Web 产品的早期版本”，而是：

> **一个以跨端个人商业能力为目标、以业务模块和应用契约为核心、以 Web Reference Client 作为首个实现载体的模块化产品系统。**

因此，后续工程实现必须优先保护：

```text
业务能力可复用
状态机唯一
规范事件唯一
客户端可替换
产品形态可演进
```
