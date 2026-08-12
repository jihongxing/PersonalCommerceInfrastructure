# 项目路线图

> **状态**：VS-01 Prototype Ready  
> **当前阶段**：M9 — Deployable Prototype Hardening  
> **产品事实源**：`docs/07_Product_Architecture/20_MVP_PRD_VS01.md`  
> **工程事实源**：`docs/09_Engineering_Governance/22_Engineering_Governance.md`  
> **执行证据**：`docs/08_Execution/21_Prototype_Execution.md`

## 已完成阶段

### VS-01 Controlled Prototype

只构建：

```text
商业身份
→ 服务型供给
→ 可请求时间与条件
→ 发布
→ 分发资产
→ 客户请求
→ Creator 确认 / 拒绝
→ 规范事件记录
```

原型在 `Confirmed Commerce / Declined` 结束。

## 当前优先级

1. 建立 Production 配置模型、启动校验与优雅关闭；
2. 建立可重复的 API、Web 与 PostgreSQL 部署产物；
3. 将真实 PostgreSQL Migration 和 Provider Contract 验证接入 CI；
4. 建立依赖感知 Readiness、结构化运行日志和故障诊断；
5. 建立备份恢复、部署 Smoke Test 与回滚演练。

## M9 — Deployable Prototype Hardening

### M9.1 Runtime Lifecycle

**任务**

- 增加 `production` 环境配置和严格启动校验；
- 实现 `SIGINT` / `SIGTERM` 优雅关闭；
- Readiness 检查真实数据库连接，Health 只表达进程存活；
- 为启动、停止和未处理异常输出脱敏结构化日志。

**验收标准**

- 缺少生产必需配置时进程以非零状态退出；
- 数据库不可用时 Readiness 返回非 2xx，Health 仍可表达进程状态；
- 收到终止信号后停止接收新请求，并关闭 HTTP 与数据库连接；
- 生命周期测试不依赖真实外部 Provider。

### M9.2 Reproducible Deployment

**任务**

- 为 API 和 Web 建立版本固定的容器构建；
- 建立本地 Production-like Compose / Podman 运行栈；
- 增加 Migration Job，禁止应用实例隐式修改 Schema；
- 编写环境变量、Secret 注入、启动和升级 Runbook。

**验收标准**

- 干净环境可从源码构建不可变 API/Web 镜像；
- 空 PostgreSQL 可通过 Migration Job 升级到当前 Schema；
- API、Web 和数据库能以 Production 配置完成 VS-01 Smoke Flow；
- 镜像与运行配置不包含明文 Secret。

### M9.3 CI Delivery Gates

**任务**

- CI 启动临时 PostgreSQL 并执行 Migration、Repository 和事务测试；
- 保留 Supabase Hosted Provider 为显式受控验证，不伪造通过证据；
- 增加 OpenAPI Breaking Change、容器构建和 Production Smoke 门禁；
- 缓存依赖，但不缓存生成式 API Contract 结果作为事实源。

**验收标准**

- Pull Request 必须通过完整 Preflight 和真实 PostgreSQL 集成测试；
- Migration 在空库和已升级数据库上均可重复验证；
- OpenAPI 非兼容变化会阻止合并；
- API/Web 容器构建失败会阻止交付。

### M9.4 Observability and Recovery

**任务**

- 为请求增加关联 ID、统一访问日志和错误分类；
- 为关键依赖增加启动与 Readiness 诊断；
- 建立数据库备份、恢复和回滚 Runbook；
- 建立部署后 Smoke Test 和最小告警条件。

**验收标准**

- 一次 Request 可通过关联 ID 串联 API 日志和错误响应；
- 日志不会记录 Authorization、Contact、Result Token 或 Secret；
- 可从备份恢复到新数据库并通过完整 VS-01 Smoke Flow；
- 可在一次演练中回滚应用版本，且不回滚已提交的合法业务数据。

### M9 Exit Gate

M9 仅在以下条件全部满足时完成：

1. Production 配置、生命周期和依赖 Readiness 已自动化验证；
2. API、Web 和 PostgreSQL 具有可重复部署路径；
3. CI 使用真实 PostgreSQL 验证 Migration 与 Persistence；
4. Backup / Restore、Deployment Smoke 和 Rollback 演练通过；
5. `pnpm preflight` 保持通过；
6. 未新增或修改任何 VS-01 产品对象、状态机、权限、Canonical Event 或 Deferred Capability。

## 截止线

不得增加：

- 支付、结账、结算、退款、抽佣或 GMV；
- Marketplace、搜索、发现、CRM、会员或社交 Feed；
- Event、Experience、Inquiry 或多垂直流程；
- 高级 Calendar、自动排期或履约工作流；
- AI、广告或分析仪表盘。

## 延后事项

真实支付、新 Commerce Primitive、第二垂直和 VS-01 产品功能扩张不属于 M9。M9 只提高
现有能力的部署性、可靠性、安全性、可观测性和恢复能力。
