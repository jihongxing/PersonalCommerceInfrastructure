# 配置与密钥治理

> **状态**：Decision v1  
> **Owner**：工程治理  
> **适用范围**：未来所有运行时与交付文件

## 配置边界

配置只能通过单一 Bootstrap 边界读取，并以类型化配置向内传递。领域模块不得直接读取环境变量、进程全局变量或密钥存储。

```text
环境 / 密钥提供方
→ 配置 Bootstrap
→ 应用组合根
→ Port / Adapter
```

## 规则

1. 密钥不得进入源码、文档、Fixture、截图、日志或测试输出。
2. `.env.example` 只能包含变量名和安全占位值。
3. 环境专属值属于运行环境，不属于业务模块。
4. 密钥只能注入 Adapter 或组合根，不得进入领域规则。
5. 开发、测试与未来真实支付环境必须相互隔离。
6. 缺少必要配置时，应用应在启动阶段安全失败并给出可诊断信息。
7. 日志必须脱敏 Token、凭据、联系方式和非必要 PII。
8. 配置变更必须作为变更单元；安全敏感变更还必须登记 `ENG-###`。
9. VS-01 禁止加入支付或结算配置。

## PII 处理

Customer 联系方式是 VS-01 预期涉及的最小敏感数据。

- 只收集处理 Request 所必需的信息；
- 仅允许归属 Creator 和授权运行路径访问；
- 普通日志不得记录原始联系方式；
- 在引入持久化 Pilot 数据前定义删除与保留策略；
- 测试默认使用合成数据，除非明确需要受控真实数据。

## 最低运行纪律

在 Prototype Ready 前必须具备：

- 结构化错误处理；
- 状态变更的审计上下文；
- Request 与 Event 链路的关联标识；
- 密钥与 PII 脱敏；
- 可区分的开发与测试环境；
- 在引入持久化 Customer 数据或支付前记录备份、恢复与删除决策。

## 当前 API 配置

| 变量                             | 默认值                  | 用途                                                           | 密钥 |
| -------------------------------- | ----------------------- | -------------------------------------------------------------- | ---- |
| `APP_ENV`                        | `development`           | 运行环境                                                       | 否   |
| `RUNTIME_ENV`                    | `local`                 | 真实资金运行边界：`local/test/controlled/production`           | 否   |
| `REAL_MONEY_ENABLED`             | `false`                 | Founder-approved Live Payment / Settlement / Withdrawal 总开关 | 否   |
| `LOG_LEVEL`                      | `info`                  | 日志级别                                                       | 否   |
| `API_HOST`                       | `127.0.0.1`             | API 绑定地址                                                   | 否   |
| `API_PORT`                       | `3000`                  | API 监听端口                                                   | 否   |
| `DATABASE_URL`                   | 无                      | PostgreSQL 连接字符串，仅数据库工具和 Persistence 组合根使用   | 是   |
| `SUPABASE_URL`                   | 无                      | Supabase Auth 项目 URL，仅 Auth 组合根使用                     | 否   |
| `SUPABASE_ANON_KEY`              | 无                      | Supabase Auth 公共客户端密钥，仅 Auth 组合根使用               | 是   |
| `CREATOR_ACTOR_MAPPINGS`         | 无                      | 显式 `supabase:<subject>` → Creator 映射，仅 Auth 组合根使用   | 是   |
| `FOUNDER_ACTIVATION_REFERENCE`   | 无                      | 可审计的 Founder GO reference；单独存在不能启用真实资金        | 否   |
| `PILOT_ID`                       | 无                      | 受控 Pilot 标识；不得复用 Test / Simulation 标识                | 否   |
| `PILOT_STATE_FILE`               | 无                      | 服务器端 Pilot Activation 状态文件                             | 否   |
| `PILOT_AUDIT_FILE`               | 无                      | 服务器端 Activation / Close 审计追加文件                       | 否   |
| `PILOT_AUDIT_DIR`                | 无                      | Pilot 证据与审计目录                                             | 否   |
| `PILOT_FOUNDER_ACTIVATION_TOKEN` | 无                      | Founder-only Pilot 启动控制；不得进入前端或日志                | 是   |
| `PILOT_ACTIVATION_ACTOR`         | 无                      | 服务器端激活 Actor；只允许 `founder`                            | 否   |
| `LIVE_PROVIDER_ID`               | 无                      | Live Provider 标识                                             | 否   |
| `LIVE_PROVIDER_URL`              | 无                      | Live Provider API URL                                          | 否   |
| `LIVE_PROVIDER_MERCHANT_ACCOUNT` | 无                      | Merchant / Account Mapping                                     | 是   |
| `LIVE_PROVIDER_API_CREDENTIAL`   | 无                      | Live Provider API Credential                                   | 是   |
| `LIVE_PROVIDER_WEBHOOK_SECRET`   | 无                      | Live Provider Webhook Secret                                   | 是   |
| `LIVE_PROVIDER_ENVIRONMENT`      | 无                      | Live Provider 环境；真实路径只允许 `production`                | 否   |
| `LIVE_PROVIDER_CURRENCY`         | 无                      | 当前 Money Domain 只允许 `CNY`                                 | 否   |
| `LIVE_PROVIDER_REGION`           | 无                      | Provider 账户与合规区域                                        | 否   |
| `NEXT_PUBLIC_API_BASE_URL`       | `http://127.0.0.1:3000` | Web Reference Client 的 API Base URL                           | 否   |
| `NEXT_PUBLIC_SUPABASE_URL`       | 无                      | Web Creator Desk 使用的 Supabase Auth 项目 URL                 | 否   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | 无                      | Web Creator Desk 使用的 Supabase 公共 Auth Key                 | 否   |

`API_HOST` 与 `API_PORT` 只能由配置 Bootstrap 读取。默认绑定本地回环地址，
避免 Prototype 在未明确授权时暴露到外部网络。

`RUNTIME_ENV` 与 `REAL_MONEY_ENABLED` 由 API 组合根启动时读取，前端、Creator 和 Customer
没有修改入口。`REAL_MONEY_ENABLED` 默认为 `false`；只有 `controlled` 或 `production`、
完整 Live Provider 配置和非空 `FOUNDER_ACTIVATION_REFERENCE` 同时存在时才允许启动 Live
路径。配置 Secret 本身不得激活真实资金，部分配置必须启动失败，Live 路径不得 fallback 到
Reference Provider、Sandbox 或 Controlled Transport。启动审计只能记录开关状态、Provider ID
和 Activation Reference，不得记录 Merchant Mapping、API Credential 或 Webhook Secret。

`DATABASE_URL` 不属于普通应用启动的强制配置。只有执行 Migration、数据库集成测试，
或启用 PostgreSQL Persistence Adapter 的组合根才调用
`loadDatabaseConfiguration` 并要求该变量存在。Drizzle Kit 配置文件是工具链入口，
允许为生成与迁移读取该变量，但不得把连接字符串传入领域、应用、Contract 或客户端代码。

`SUPABASE_URL` 与 `SUPABASE_ANON_KEY` 不属于普通应用启动的强制配置。只有启用
Supabase Auth Adapter 的组合根才调用 `loadAuthConfiguration`。认证 Provider 的 User
只提供凭据，不自动等同于 Creator；Creator 映射必须通过 Application Port 完成。
启用该组合根时，`CREATOR_ACTOR_MAPPINGS` 必须提供至少一个显式
`"supabase:<provider-user-id>":"<creator-id>"` 映射。空映射、未知 Provider 前缀、
空 Subject 和空 Creator ID 都必须在启动前失败；该变量不得进入客户端、日志或
业务错误响应。

`NEXT_PUBLIC_API_BASE_URL` 只由 `apps/web/src/configuration/bootstrap.ts` 读取。
它允许 Reference Client 指向不同 API 环境，但不得用于绕过 API Contract、直接访问数据库，
或把 Web Runtime 变成业务事实源。

`NEXT_PUBLIC_SUPABASE_URL` 与 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 只由 Web Creator
Desk 的 Session Adapter 读取，用于浏览器端 Supabase Auth 登录、注册、刷新和登出。
二者必须是可公开使用的项目 URL 与 anon / publishable key，不得替代 Service Role Key，
也不得把 `SUPABASE_TEST_PASSWORD` 或 `CREATOR_ACTOR_MAPPINGS` 暴露到客户端。
