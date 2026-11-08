# 111 — 请求链路追踪实施计划

> **状态**：实施中 — 本地端到端链路已验证，生产与部分验收待完成
> **范围**：`apps/web-v2`、`apps/api` 及其运行依赖的可观测性
> **上游**：[工程治理](./22_Engineering_Governance.md)、[技术架构实施计划](./24_Technology_Architecture_Implementation_Plan.md)
> **执行台账**：[Prototype Execution](../08_Execution/21_Prototype_Execution.md)
> **日期**：2026-11-08

当前实现、验证命令和未完成项见执行台账第 81 节；Podman 本地运行和回退见
[请求追踪运行手册](./112_Request_Tracing_Operations.md)。本地验证不等于全部验收通过。

## 1. 目标与边界

为本项目建立可查询的请求链路：从浏览器发起请求，经过 `apps/api`、本地认证、应用服务和 PostgreSQL，到已接入的外部 HTTP 调用；将链路与结构化日志及已有产品事件关联。异步处理和第三方回调按实际集成边界关联，不能假定外部服务支持上下文传播。

`apps/api` 是唯一业务后端，使用本地账号与 JWT；`apps/api-mock`、Supabase 认证均不参与本计划。Collector 和链路存储只提供运维采集与查询，不承载产品 API 或用户认证。

本计划不改变产品对象、权限、状态转换或规范事件，不以 trace 替代审计记录。纯工程变更按工程治理登记证据；若实施导致产品可见行为、合同或权限变化，先登记 `DEV-###` 并获得产品决策。每个实施单元完成后在执行台账记录状态、验证和限制。本文本身不代表功能或验收已完成。

## 2. 当前代码基线

| 位置                                                                                                             | 现状                                                       | 缺口                                                                  |
| ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------- |
| `apps/api/src/create-api-server.ts`                                                                              | Fastify 生成或接收 `x-correlation-id`，可记录请求开始/结束 | 无 trace/span；性能监控 hook 没有记录指标                             |
| `apps/api/src/main.ts`                                                                                           | 正式运行时注入 logger、性能监控与 PostgreSQL composition   | 尚无追踪 SDK 初始化、导出与关闭                                       |
| `adapters/transport/http/api-error-handler.ts`                                                                   | 响应及错误包含 correlation ID                              | 日志没有 trace/span 关联                                              |
| `adapters/transport/http/local-auth-routes.ts`、`applications/account-identity-membership/local-auth-service.ts` | 注册、登录及工作台初始化接入本地认证                       | HTTP correlation ID 未传入初始化；部分初始化异常只设置 `setupPending` |
| `adapters/persistence/postgres/postgres-creator-identity-composition.ts`                                         | 初始化时构造 `workspace:<accountId>`                       | 与触发请求的关联 ID 不一致                                            |
| `adapters/persistence/postgres/postgres-database.ts`                                                             | Drizzle 使用 `postgres`（postgres.js）驱动                 | 不可假定 `pg` 埋点支持；需验证并提供回退                              |
| `apps/web-v2/lib/api/client.ts`                                                                                  | 普通请求和刷新会话分别调用 `fetch`                         | 无链路传播；需覆盖并发刷新及重试                                      |
| `adapters/observability/safe-logger.ts`                                                                          | 提供结构化日志及部分敏感字段脱敏                           | 缺少 trace/span 字段；需覆盖嵌套内容和 URL 泄露风险                   |
| `adapters/transport/http/system-routes.ts`                                                                       | `/health`、`/api/v1/health`、`/api/v1/readiness`           | 存活/就绪不是 trace 查询接口                                          |

当前本地运行端口为 Web 3000、API 8080；API 使用 PostgreSQL 验证库。已有测试和浏览器结果不能证明链路追踪已完成。`deploy/compose.production.yml` 已调整为 Web V2、`apps/api` 和本地 JWT 的配置，并经过隔离环境验证；生产认证授权、持久化及运维条件仍未完成，不能将隔离验证视为生产部署验收。

## 3. 目标架构与标识

```text
web-v2 浏览器 client span
  -> W3C traceparent / tracestate
apps/api HTTP server span
  -> 本地认证 / 工作台初始化 / 应用服务 span
  -> PostgreSQL 操作 span；已支持的外部 HTTP client span
  -> OTLP exporter -> Collector -> trace 存储与查询
结构化日志 -- trace_id + span_id + correlationId --> 链路关联
```

| 字段            | 规则                                                                                                 |
| --------------- | ---------------------------------------------------------------------------------------------------- |
| `trace_id`      | W3C Trace Context 标准标识；同一同步调用链共用                                                       |
| `span_id`       | 每个操作独立；用于表达父子关系                                                                       |
| `correlationId` | 保留既有 `x-correlation-id`、错误合同和产品事件语义；默认每个 HTTP 请求生成一个 ID，合法来值继续沿用 |

不把这三种标识强行合并或修改历史数据。记录日志时同时携带当前 trace/span 和 correlation ID；业务层继续使用与 Fastify/OTel 类型无关的上下文。无有效上游 trace 时建立新 trace；重复 HTTP 请求各有 server span。异步消息应显式保存允许传播的上下文，长期延迟或外部回调按适用情况使用 span link，外部不支持时以已保存的关联信息连接，不能虚构父子关系。

边界输入不可信：校验 `x-correlation-id` 的长度及允许字符，无效值生成新值；使用符合 W3C 的解析器处理 `traceparent`，禁止从 `baggage` 收集任意内容。明确公网入口采样策略，不能让外部调用者单方面强制高成本采样。ID 不用于认证或授权。兼容行为及日志对历史调用者的影响需要测试。

当前 API 入口保留合法 `traceparent` 的父子关系，但丢弃外部 `tracestate`，避免任意厂商状态被写入追踪存储。依赖该字段的可信内部集成需要另行建立可验证的信任边界及字段策略。

## 4. 实施任务

### TRACE-01：运行时基础与生命周期

1. 锁定相互兼容的 OpenTelemetry JS API、Node SDK、OTLP exporter 和必要 instrumentation，记录 Node 22、Fastify 5、ESM、tsx 与生产构建的实际兼容版本；不预先假设所有自动埋点适配当前版本。
2. 在 `adapters/observability/` 实现 SDK 组合、资源属性和有界批量导出；配置从 `apps/prototype/src/configuration/bootstrap.ts` 或既定 bootstrap 边界读取，`apps/api` 负责装配。资源至少包含 `service.name`、版本和环境，不含密钥。
3. 在任何被自动埋点模块加载前初始化 SDK。为 `tsx apps/api/src/main.ts`、生产 `node dist/apps/api/src/main.js` 及容器入口分别验证预加载方案；需要调整脚本或 Dockerfile 时同步处理，不能只在测试注入的 server 中成功。
4. 接入 `apps/api/src/runtime-lifecycle.ts`：停止接收请求、关闭应用资源并在有界超时内 flush/shutdown SDK；重复关闭幂等。采集禁用或 exporter 不可用时，API 仍能启动和处理请求，不能无限等待或无限缓存。
5. 处理现有空性能监控 hook：复用或替换时确保不重复记录；明确保留、迁移或移除旧接口及测试。请求耗时使用单调时钟或 SDK 指标。

交付：受配置控制的追踪基础、部署入口和生命周期测试。默认本地可关闭或使用本地采集端，开发验证开启时 100% 采样。

### TRACE-02：HTTP、日志和隐私

1. 为 HTTP 请求生成 server span，属性只包含方法、路由模板、状态码、耗时及安全错误分类。未匹配路由使用固定标签，禁止回退为含参数或查询串的原始 URL。
2. 在 `safe-logger.ts` 从当前上下文注入 `trace_id`、`span_id` 和采样状态；结束日志保留 `correlationId`、状态和耗时。没有有效 span 时显式省略 trace 字段，不生成假 ID。
3. 审查所有错误、日志和自动埋点默认属性。禁止采集 Authorization、Cookie、密码、JWT、refresh token、邮箱、手机号、请求体、SQL 参数、完整 SQL、完整 URL 和结果访问 token；异常只输出安全分类和受控信息。递归检查嵌套字段，不能只依赖顶层字段名脱敏。
4. 在 `create-api-server.ts` 中允许受控来源的 `traceparent`、`tracestate`、`x-correlation-id` CORS 请求头，暴露 `x-correlation-id` 响应头；保留现有 origin 白名单。确认 OPTIONS、错误响应及正常响应的行为。
5. 保留 `/health` 与 `/api/v1/health` 的现有响应合同；保留 `/api/v1/readiness` 的数据库语义。采集状态通过 Collector 自监控及受保护运维面板呈现，若确需新增状态接口，先确定访问控制和合同。

### TRACE-03：本地认证和请求上下文

1. 从 `local-auth-routes.ts` 将 `request.id` 传入 `LocalAuthService.signup`、`login`、`ensureWorkspace`，再传入 `newSession` 和初始化回调；使用明确的应用层上下文参数，更新直接调用方和测试，不将 Fastify request 传入服务。
2. 在 PostgreSQL composition 初始化正式身份时使用传入的实际 correlation ID，替换 `workspace:<accountId>`；账号和商业身份数据仍独立且初始化保持幂等。
3. 对注册/登录、会话创建、工作台初始化增加边界清晰的内部 span。初始化失败时保持现有认证成功及 `setupPending` 行为，记录安全错误分类、correlation ID、trace/span；重试失败也可追踪，不记录凭据或账号隐私。
4. 回归验证旧会话补齐、并发初始化、历史受限身份、初始化失败和重试，确认业务语义、错误合同及事件不变。

### TRACE-04：PostgreSQL、外部调用与异步边界

1. 在真实 PostgreSQL 集成环境验证 Node SDK、Drizzle 与 `postgres` 驱动的自动埋点覆盖、事务内上下文及父子关系。支持矩阵以锁定版本和测试结果为准，不能以 `pg` 驱动测试替代。
2. 若驱动自动埋点不支持，通过持久化 adapter 或现有 Unit of Work 包装关键操作，增加手工 span；覆盖账号创建、身份初始化事务和数据库失败，不修改业务结果。记录固定操作名和耗时，不记录 SQL 文本或参数。
3. 清点本项目实际发起的外部 HTTP 调用，在允许的目标传播 W3C 上下文；按提供方规则决定是否传播，禁止向不可信第三方泄露内部 baggage。通知、webhook、任务队列仅在对应真实实现及持久化关联存在时标记覆盖。
4. 对已有产品事件验证保留原 correlation ID；不为遥测新增 Canonical Event，不把用户或业务对象 ID 作为无约束高基数指标标签。

### TRACE-05：浏览器请求链路

1. 对 `apps/web-v2/lib/api/client.ts` 的普通请求和 `refreshSession()` 中独立 `fetch` 全部覆盖；清点其他实际请求入口。使用浏览器 OTel client span 与 W3C 上下文传播，仅向正式 API 允许来源发送相关 header。
2. 为浏览器采集设计受控 OTLP 接收入口：限定来源、速率、载荷大小和可接受属性；不得携带业务 token，不向公网直接开放未保护的 Collector。若暂时只传播 header 而不导出浏览器 span，必须标记为部分完成，不能称为浏览器端到端追踪。
3. 定义一次业务操作中的原请求、共享 refresh、重试的关联：每次 HTTP 调用具有独立 span；并发调用复用一次 refresh，使用 span link 表达多个等待者，禁止凭空给共享请求设置多个父 span。失败及中断时结束 span。
4. 浏览器只采集允许的路由模板、方法、状态与耗时；不导出输入、URL 参数、token 或个人信息。浏览器环境下验证与 Next.js 客户端初始化、采样和卸载刷新行为的兼容性。

### TRACE-06：采集、查询与运行

1. 新增独立本地开发配置，例如 `deploy/compose.observability.local.yml` 和 Collector 配置；使用锁定版本的 Collector 与支持 OTLP 的查询后端。端口避开 3000/8080，仅绑定本机或私有网络；不重建已有 PostgreSQL 卷或启动 `api-mock`。
2. 默认方案为 OTLP -> Collector -> trace 存储/查询，选型时验证实际镜像版本、持久化、检索与维护能力；开发环境可用短期或临时存储，但不得称为生产持久化证据。生产环境按现有运维平台部署，限制查询和采集访问，定义备份、容量、保留期与删除机制。
3. 采样策略：本地测试 100%；生产使用可配置的服务端采样率和有界队列。头部采样不能保证所有错误 trace 存在；若要求保留错误链路，需要验证 Collector 尾部采样、上游采样和容量策略共同满足该要求。
4. 建立 exporter 失败、丢弃、Collector 不可用、查询存储容量及 API 耗时/错误率监控；告警阈值以环境容量基线确定。故障时优先维持业务可用，并提供关闭遥测、恢复配置及重新验证步骤。
5. 单独核对 `deploy/compose.production.yml`、`deploy/Dockerfile.api` 与当前 `apps/web-v2`、本地 JWT、8080 配置及构建产物。当前配置的隔离验证及尚未完成的生产条件见执行台账；仓库全量构建错误及生产运维条件仍需解决，不能宣称生产方案已验收。

## 5. 配置与依赖

实施时在 `.env.example` 和配置 bootstrap 中定义并验证开关、服务名/环境、OTLP endpoint、协议、采样率、队列上限及导出/关闭超时；命名优先使用 OTel 标准环境变量。默认配置应保证未配置采集器的现有本地 API 仍可使用。网络地址、凭据和采样率按环境提供，不写入源码或前端公开变量。

实施前锁定并测试 SDK、instrumentation、Collector 和查询后端版本；新增依赖及镜像必须记录来源、版本、许可和部署责任。浏览器不直接使用服务端 exporter 凭据。生产采样率、保留天数、容量和告警阈值在采集基线后决定，并写入运维配置；它们目前不是已确定事实。

## 6. 分阶段验收

每阶段完成后在 `docs/08_Execution/21_Prototype_Execution.md` 记录命令、环境、结果、失败项和证据位置；每项以下结果在执行前均为 **未验证**。

| 验收项          | 操作和通过条件                                                                                                                                                                                                                                 |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1 HTTP 与日志  | 真实运行的 8080 API 收到合法及非法上下文；响应、server span、开始/结束日志的 ID 符合规则；并发请求不串链                                                                                                                                       |
| A2 注册链路     | 浏览器注册 -> 本地认证 -> 工作台初始化 -> 真实 PostgreSQL；查询到同一 trace 的浏览器、HTTP、应用和数据库 span，父子关系及耗时合理。另选实际产生 Canonical Event 的业务操作，验证其事件 correlation ID 与请求上下文一致；不要求注册凭空产生事件 |
| A3 旧会话和错误 | 已登录用户初始化、故障触发 `setupPending`、重试成功；日志和 span 能定位安全错误分类，业务结果及限制身份规则不变                                                                                                                                |
| A4 刷新和重试   | 过期 token、并发请求、单次 refresh 与重试；每次 HTTP 有独立 span，跨并发使用正确 link；失败与取消不留下未结束 span                                                                                                                             |
| A5 脱敏         | 将已知测试凭据、邮箱、SQL 参数、动态路径与查询 token 注入受控测试，检查浏览器遥测、服务端 span、日志和导出数据均不包含这些原文                                                                                                                 |
| A6 采集故障     | 停止 Collector、模拟网络超时和队列满；API 仍处理请求且 readiness 维持原语义，丢弃/失败可观测；恢复后新链路可查询                                                                                                                               |
| A7 生命周期     | 使用开发启动和编译后入口验证埋点提前加载；正常关闭时在超时内 flush，关闭期间采集故障不阻塞退出                                                                                                                                                 |
| A8 合同与性能   | health/readiness、错误响应、CORS、现有业务集成测试通过；在相同负载下对比开关前后的请求耗时、内存与导出队列，记录数据并按环境预算评审                                                                                                           |
| A9 查询与权限   | 从日志 ID 找到对应已采样 trace；未授权用户不可查询；确认采样造成缺失时界面/运维说明不将其误报为业务失败                                                                                                                                        |

执行层次：单元测试验证上下文、脱敏及生命周期；`tests/integration/api-runtime.test.ts` 等验证 HTTP 合同；独立真实 PostgreSQL 集成测试验证事务；浏览器测试连接真实 `apps/api`、Collector 和查询后端。Mock exporter 只证明应用集成，不能代替真实 Collector/数据库或生产部署证据。回归现有自动初始化测试与相关 Web 类型、lint；全仓门禁若被既有问题阻塞，记录具体命令和错误，不能标记通过。AT-001 至 AT-013 仍由各自产品验收独立判断。

实施顺序为 TRACE-01 -> TRACE-02/03 -> TRACE-04/05 -> TRACE-06，再联合执行 A1 至 A9；各单元先执行自身的最近测试，不能等最终阶段才检查。现有回归入口包括 `pnpm exec vitest run tests/integration/api-runtime.test.ts`、`pnpm exec vitest run adapters/observability/safe-logger.test.ts adapters/observability/performance-monitor.test.ts`，以及配置 `LOCAL_AUTH_TEST_DATABASE_URL` 后运行 `tests/integration/automatic-identity.integration.test.ts` 和 `tests/integration/local-auth.integration.test.ts`。新增浏览器、Collector 和真实 PostgreSQL 测试时，应一并提供可复现命令、启动与清理步骤，并确保不操作已有用户数据库。

## 7. 完成定义与回退

完成要求：TRACE-01 至 TRACE-06 的实现和 A1 至 A9 证据齐全；已明确生产采样、保留、访问权限及负责人；验证 3000/8080 的本地启动方式和正式 `apps/api`；执行台账记录通过与限制。无法部署生产采集或未接浏览器导出时，分别标记为本地验证或部分完成。

发布前提供可关闭的采集开关、固定版本配置与回退步骤。关闭采集后仍保留应用业务、现有 correlation ID、健康和认证行为；保留原有数据库，不清理用户数据。回退后验证注册、登录、工作台、健康/就绪与日志，并记录采集缺口及恢复时间。
