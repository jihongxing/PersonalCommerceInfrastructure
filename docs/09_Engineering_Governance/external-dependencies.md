# 外部依赖与真实性治理

> **状态**：Decision v1  
> **Owner**：工程治理  
> **适用范围**：Provider SDK、外部服务、托管基础设施及运行集成

## 依赖登记表

当前只有 Supabase Auth 作为 VS-01 的外部业务 Provider 获准进入受治理边界。工程工具与
运行框架依赖由 `package.json` 与 `pnpm-lock.yaml` 锁定；其他业务 Provider 必须在使用前登记。

| 依赖          | 能力                      | Port / 边界                          | 真实性级别    | Owner      | 证据                                                                                     |
| ------------- | ------------------------- | ------------------------------------ | ------------- | ---------- | ---------------------------------------------------------------------------------------- |
| Supabase Auth | 外部身份认证与 Token 验证 | `AuthContextProvider` / Auth Adapter | Real-qualified | Auth Owner | `pnpm test:auth:provider` 与带真实 Provider 门禁的完整 `pnpm preflight` 于 2026-08-11 通过 |

## 工程运行依赖登记

以下依赖不提供业务外部服务，不适用 Provider 真实性级别，但必须保持版本锁定和架构边界：

| 依赖                     | 版本    | 能力                                | 允许位置                                           | 禁止位置                                          | 证据                                     |
| ------------------------ | ------- | ----------------------------------- | -------------------------------------------------- | ------------------------------------------------- | ---------------------------------------- |
| Fastify                  | 5.11.3  | 独立 HTTP API Runtime               | `apps/api`、`adapters/transport`                   | `applications/`、`modules/`、`contracts/`         | API 集成测试与独立 Socket 绑定           |
| TypeBox                  | 1.0.13  | Transport JSON Schema               | `contracts/`、Transport Adapter                    | `modules/` 的业务规则                             | Contract 测试                            |
| Fastify TypeBox Provider | 6.1.0   | Fastify Schema 编译集成             | `apps/api`、Transport Adapter                      | `applications/`、`modules/`                       | 类型检查与 API 集成测试                  |
| Fastify Swagger          | 9.8.1   | OpenAPI 生成                        | `apps/api`                                         | `applications/`、`modules/`                       | OpenAPI Contract 测试                    |
| Drizzle ORM              | 0.45.2  | PostgreSQL Schema、查询与事务边界   | `database/`、`adapters/persistence`、数据库工具    | `modules/`、`applications/`、`contracts/`、客户端 | Schema Contract、Persistence 测试        |
| Drizzle Kit              | 0.31.10 | 版本化 SQL Migration 生成与 Journal | `drizzle.config.ts`、`database/migrations`         | 运行时业务代码                                    | Migration Contract、`db:check`           |
| postgres                 | 3.4.9   | PostgreSQL Driver                   | `adapters/persistence/postgres`                    | `modules/`、`applications/`、`contracts/`、客户端 | Podman PostgreSQL Commit / Rollback 验证 |
| `@supabase/supabase-js`  | 2.112.3 | Supabase Auth Token 验证            | `adapters/auth/supabase`                           | `modules/`、`applications/`、`contracts/`、客户端 | Auth Contract 与 Hosted Provider 真实验证 |
| Next.js                  | 16.1.4  | Web Reference Client Runtime        | `apps/web`                                         | `modules/`、`applications/`、`contracts/`         | Production Build 与路由清单              |
| React / React DOM        | 19.2.3  | Web UI Runtime                      | `apps/web`                                         | `modules/`、`applications/`                       | Web Typecheck 与 Production Build        |
| Tailwind CSS             | 4.1.18  | Web 样式基础                        | `apps/web`                                         | Domain / Application                              | Production Build                         |
| openapi-typescript       | 7.10.1  | OpenAPI → TypeScript Contract 生成  | `apps/web/scripts`                                 | Runtime 业务模块                                  | `web:generate-api`                       |
| openapi-fetch            | 0.15.0  | 类型安全 API Client                 | `apps/web/src/lib/api`                             | Domain / Application                              | Web Client 测试与 Typecheck              |
| Playwright Test          | 1.62.1  | Web Reference Client 验收执行层     | `playwright.config.ts`、`tests/acceptance/browser` | Domain / Application / 产品运行时                 | 系统 Edge 双服务浏览器烟雾测试           |

Playwright Harness 使用系统安装的 Microsoft Edge，不依赖下载 Playwright Chromium。
浏览器运行时属于验收执行依赖，不是产品事实源，也不代表 App 或小程序必须使用 Playwright。

PostgreSQL 生产 Provider 尚未选定，但 CU-TA-04 已使用 Podman `postgres:17` 完成
真实空库 Migration、Commit / Rollback 与重复 Migration 幂等性验证。

Supabase Auth 已使用受控 Hosted 项目和专用测试用户完成真实 Provider 验证，状态为
`Real-qualified`。测试凭据只允许通过本机或 CI Secret 注入，不得进入源码、文档、Fixture、
日志或截图。Provider、密钥类型、Token 策略或 SDK 主版本变化时必须重新验证。

## 真实性级别

| 级别           | 含义                                           |
| -------------- | ---------------------------------------------- |
| Simulated      | 仅验证应用行为，不宣称 Provider 行为成立       |
| Sandboxed      | 已验证 Provider 测试环境，不能证明生产行为     |
| Real-qualified | 已在要求的真实 Provider / 环境中验证并留存证据 |
| Blocked        | 因缺少或未通过真实验收，不得视为可用           |

## 规则

1. Provider SDK 必须位于 `adapters/` 或获批准的等价边界。
2. 领域模块依赖 Port，不依赖 Provider SDK。
3. 每项依赖必须定义超时、有限重试、幂等与失败策略。
4. 只有审计或对账确有需要时才保留原始 Provider 响应，并遵守 PII 与密钥规则。
5. Simulated Adapter 不得使能力升级为 `Real-qualified`。
6. 新增依赖必须固定版本、更新 Lockfile、登记用途和 Owner，并提供安全审查与测试证据。
7. VS-01 仍禁止支付、结算、退款和 Merchant 能力。
