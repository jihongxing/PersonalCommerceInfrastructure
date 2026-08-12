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

| 变量                       | 默认值                  | 用途                                                         | 密钥 |
| -------------------------- | ----------------------- | ------------------------------------------------------------ | ---- |
| `APP_ENV`                  | `development`           | 运行环境                                                     | 否   |
| `LOG_LEVEL`                | `info`                  | 日志级别                                                     | 否   |
| `API_HOST`                 | `127.0.0.1`             | API 绑定地址                                                 | 否   |
| `API_PORT`                 | `3000`                  | API 监听端口                                                 | 否   |
| `DATABASE_URL`             | 无                      | PostgreSQL 连接字符串，仅数据库工具和 Persistence 组合根使用 | 是   |
| `SUPABASE_URL`             | 无                      | Supabase Auth 项目 URL，仅 Auth 组合根使用                   | 否   |
| `SUPABASE_ANON_KEY`        | 无                      | Supabase Auth 公共客户端密钥，仅 Auth 组合根使用             | 是   |
| `NEXT_PUBLIC_API_BASE_URL` | `http://127.0.0.1:3000` | Web Reference Client 的 API Base URL                         | 否   |

`API_HOST` 与 `API_PORT` 只能由配置 Bootstrap 读取。默认绑定本地回环地址，
避免 Prototype 在未明确授权时暴露到外部网络。

`DATABASE_URL` 不属于普通应用启动的强制配置。只有执行 Migration、数据库集成测试，
或启用 PostgreSQL Persistence Adapter 的组合根才调用
`loadDatabaseConfiguration` 并要求该变量存在。Drizzle Kit 配置文件是工具链入口，
允许为生成与迁移读取该变量，但不得把连接字符串传入领域、应用、Contract 或客户端代码。

`SUPABASE_URL` 与 `SUPABASE_ANON_KEY` 不属于普通应用启动的强制配置。只有启用
Supabase Auth Adapter 的组合根才调用 `loadAuthConfiguration`。认证 Provider 的 User
只提供凭据，不自动等同于 Creator；Creator 映射必须通过 Application Port 完成。

`NEXT_PUBLIC_API_BASE_URL` 只由 `apps/web/src/configuration/bootstrap.ts` 读取。
它允许 Reference Client 指向不同 API 环境，但不得用于绕过 API Contract、直接访问数据库，
或把 Web Runtime 变成业务事实源。
