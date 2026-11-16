# PCI-ENG-020-B1-V2 — Upstream Logout Revocation Closure

日期：2026-11-16。授权：Main Controller 对 B1V1-001 的独立修复授权；偏差登记：DEV-089。

`PCI-ENG-020-B1-V2 = UPSTREAM LOGOUT REVOCATION FIX — AWAITING MAIN CONTROLLER ACCEPTANCE`

## 1. 结论与范围

B1V1-001 的实际撤销缺陷已修复并通过真实浏览器、两个生产模式 Next.js BFF 进程、Shared API 和一次性 PostgreSQL 验证。Access Token 过期时，浏览器点击注销后，两层 Session 均被撤销，原 Refresh Token 再次刷新返回 401。上游无法确认撤销时，BFF 不再返回 `{ok:true}`，不清除重试凭据，页面显示失败并保留重试入口。

只调整 Creator 技术会话撤销与必要的并发协调。未修改 Schema / Migration、Creator 业务规则、Fulfillment、VS-01、Operations 身份或任何已冻结产品文档。未授权生产部署或外部试点。全量 Creator 测试和全量 Web 测试类型检查仍有现存失败，详见第 7 节；不宣称全仓门禁全部通过。

## 2. 修复前后流程

| 步骤                  | 修复前（HEAD `baa7e273`）                          | 修复后                                                                            |
| --------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------- |
| 浏览器入口            | 同源 BFF `POST /api/v1/auth/logout`，Cookie + CSRF | 保持入口与安全边界                                                                |
| 上游凭据              | 以 Access Token 调用原 Bearer logout               | 以服务端 Refresh Token + 独立 BFF 服务凭据调用 `POST /api/v1/auth/revoke-session` |
| Access Token 过期     | 上游 401 被忽略                                    | 撤销不依赖 Access JWT 有效期；不绕过 JWT 校验                                     |
| 判定成功              | 无条件本地撤销并返回 200 `{ok:true}`               | 仅接受上游 2xx 且明确 `revoked` / `already_revoked`                               |
| 本地处理              | 清 Cookie、撤销 BFF；上游仍可能有效                | 确认上游后撤销 BFF，再清 Cookie                                                   |
| 失败与重试            | 错报成功并丢失唯一重试入口                         | 409 / 502 / 503，保留加密凭据和 Cookie；页面保留工作区、错误和重试入口            |
| Refresh / Logout 并发 | 跨进程缺少共同串行边界                             | 两者对同一 BFF PostgreSQL 行加锁，保留 Refresh Hash CAS                           |

修复前事实来自已验收的 V1 缺陷记录及当前 HEAD 源码；本轮不回退运行旧实现，也不复制或提交 V1 未跟踪证据。

## 3. API、BFF 与失败语义

### 3.1 上游原子撤销

`POST /api/v1/auth/revoke-session` 是服务端工程操作。请求体只有 `{refreshToken}`，响应只有 `{state:'revoked'|'already_revoked'}`。它要求私有 `x-creator-bff-revocation-secret`，对应独立随机环境变量 `CREATOR_BFF_REVOCATION_SECRET`（至少 32 字节，API 与 BFF 一致）。缺少或错误的服务凭据返回 403 `bff_required`；浏览器经 BFF 访问这个专用路径返回 404，BFF 不代理它。密钥不得使用 `NEXT_PUBLIC_`、JWT 签名密钥或 Operations 凭据。

Application 对 Refresh Token 做现有 SHA-256 Hash，通过 Repository Port 在 `local_auth_sessions.refresh_hash` 定位行并 `SELECT ... FOR UPDATE`。找不到返回 401 `invalid_refresh_token`；已撤销行明确返回 `already_revoked`（即使其后已过期）；未撤销但过期行返回 401 `expired_refresh_token`；有效行在同一事务内设置 `revoked_at` 后返回 `revoked`。保留原 Hash 用于明确幂等重试。原 Bearer logout 和 JWT 校验逻辑保持原有语义，专用操作不签发凭据、不授予业务访问权限。

### 3.2 BFF 与浏览器

BFF Refresh / Logout 使用 `CreatorWebSessionStore.withSessionLock()`，持有同一 PostgreSQL 行锁完成上游调用与本地变更。Refresh 继续使用原 Hash CAS，防止多个 Next 进程使用不同代凭据竞争。Logout 使用仅供撤销的 `getForLogout()`，允许读取本地已过期/已撤销行中的加密凭据来完成上游撤销；普通业务仍使用 `get()`，必须通过本地有效期和撤销检查。

只有上游明确确认后才本地撤销和清理 Cookie；事务提交之后才向浏览器发送成功响应。上游已经成功、本地暂时失败的情形可以用保留凭据重试，获得明确 `already_revoked`。上游网络请求设置 10 秒超时。Refresh 网络/非 2xx/无效响应也保留凭据并返回明确失败，避免竞争中的失败 Refresh 抹掉注销凭据。

| 情形                                       | API / BFF 结果                                                                               | 浏览器与凭据                                                                             |
| ------------------------------------------ | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 有效 Refresh，Access 正常或过期            | API 200 `revoked` → BFF 200 `{ok:true,state:'revoked'}`                                      | 两层撤销；Cookie 过期；清私有缓存并转登录                                                |
| 对应上游行已撤销                           | API 200 `already_revoked` → BFF 同名状态                                                     | 明确幂等成功                                                                             |
| 未知 / 过期 Refresh                        | API 401 指定错误码 → BFF 409 `logout_invalid_refresh_token` / `logout_expired_refresh_token` | 不谎报；保留凭据与工作区，显示错误。若凭据确实永久失效，单纯重试不能修复它，需要支持调查 |
| 任意其他上游 401、403、5xx、网络失败或超时 | BFF 503 `logout_incomplete`                                                                  | 不解释成已注销；保留重试路径                                                             |
| 上游 2xx 缺少认可状态                      | BFF 502 `logout_unconfirmed`                                                                 | 不本地撤销、不清 Cookie                                                                  |
| 未配置合法服务端密钥                       | BFF 503 `logout_unavailable`                                                                 | 明确失败；无降级成功                                                                     |
| 缺少本地 Cookie / 对应行                   | BFF 409 `logout_session_missing`                                                             | 无法证明上游撤销，不能返回成功                                                           |
| Origin / CSRF 不合法                       | 403                                                                                          | 不执行撤销                                                                               |

重复注销用同一原 Cookie 且有有效 CSRF 时，返回明确 `already_revoked`。浏览器成功清 Cookie 后再次调用无法提供撤销关联凭据，返回 409（无 CSRF 时先返回 403），不把缺失凭据当作上游已撤销证明。

AuthService 同时要求 `ok === true` 与认可状态才清前端 Session。既有 AuthContext / Creator Layout 已在失败时保留用户、Query Cache，显示 `role=alert`，再次点击同一注销按钮可重试；无需重构 UI。

### 3.3 并发边界与风险

上游 Refresh 的条件 UPDATE 同样受 PostgreSQL 行锁保护，且要求 `revoked_at IS NULL`；撤销后绝不把行恢复有效。若绕开 BFF 的服务端调用先轮换 Hash，旧 Hash 的撤销明确失败，调用方必须保留新凭据后重试；不将 Hash 不匹配当作撤销成功。真实 BFF 通过共同锁消除这一竞争窗口。

跨服务事务并非分布式事务。API 已提交、BFF 未提交时，重试依赖保留的 Hash 和明确幂等状态。上游 Refresh 已提交而 BFF 在保存轮换凭据之前崩溃的既有崩溃窗口，仍可能需要恢复调查；本轮未建立跨服务轮换恢复协议，也未将它包装为已通过的崩溃恢复验证。行锁跨上游调用持有，网络超时限制为 10 秒；本轮完成正确性验证，未进行容量压测。

## 4. 真实环境与复现方法

Windows；Node 22.23.2；pnpm 10.22.0；gstack `/browse` Headless Chromium 145.0.7632.6；Next.js 16.4.5 的实际 production build。

两个独立 Next 进程监听 `http://localhost:3445` / `http://localhost:3447`，连接 Shared API `http://127.0.0.1:18082`。一次性 Podman 容器 `pci-020b1-v2-93281537`，PostgreSQL 17.10，数据库 `pci_ops_migration_fixture_b1v2`，映射端口 39917，应用现有 43 个 Migration 与既有 service-policy catalog v1。所有账户和凭据均为合成测试数据；未连接生产数据库。运行账号为一次性数据库 superuser，因此不认证部署最小权限 ACL。

可重复的 B1V1-001 验证步骤：

1. 用合成 Creator 从真实 UI 注册/登录，记录 BFF 与上游 Session 的关联；原加密 Refresh 仅保留在测试服务端。
2. 服务端只替换 BFF Access Token 加密字段，注入使用本次测试 JWT 密钥签名、相同 sub/sid、exp 已过期的 JWT；不改变 Refresh Token 或上游有效 Session。
3. 立即点击真实 Creator 页面的“退出登录”。检查 Network 的 BFF 200 与 Shared API `revoke-session` 200。
4. 查询两层 `revoked_at IS NOT NULL`；确认 Refresh Hash 未轮换；从服务端用原 Refresh Token 调用实际上游 `/auth/refresh`，应返回 401 `invalid_token`。
5. 浏览器已转登录页、Session Cookie 已清；原 Cookie 私有访问返回 401。比较截图、Network、API 日志与带 UTC 时间戳的 PostgreSQL 事件。

故障注入全部只作用于一次性数据库/进程。无效 Refresh 与过期 Refresh 场景在观察 409 和未撤销状态后恢复原测试凭据/有效期，再通过真实 UI 重试完成撤销；恢复不是产品自动恢复能力。上游不可达场景停止实际 API 进程，观察 503，再重启后重试。

## 5. 真实验证矩阵

证据目录：[PCI-ENG-020-B1-V2-20261116](evidence/PCI-ENG-020-B1-V2-20261116/README.md)。原始响应与事实均脱敏保存，下面时间均为 2026-11-16 UTC。

| 要求 / 场景                    | 执行方式与结果                                                                                                                   | 证据                                                             |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 正常 Access + Refresh          | 11:16:15–16，UI Logout 200；两层 revoked=true；原 Refresh 401；浏览器私有 GET 401                                                | `browser-network.jsonl`、`postgres-events.jsonl` label `normal`  |
| 过期 Access + 有效 Refresh     | 11:18:19–21，真实签名过期注入后 UI Logout 200；两层撤销；Hash 未轮换；原 Refresh 401                                             | label `expired-access`、`01-expired-access-logout.png`、API 日志 |
| 上游已撤销                     | 11:19:22，服务端先撤销上游，UI Logout 明确 `already_revoked`，BFF 随后撤销，原 Refresh 401                                       | label `already-revoked`、Network                                 |
| 无效 Refresh                   | UI 409，保留工作区和重试按钮，两层仍未撤销；恢复测试凭据后重试成功、原 Refresh 401                                               | label `invalid-refresh`、`02-invalid-refresh-retry.png`          |
| 过期 Refresh                   | UI 409 `logout_expired_refresh_token`；不清凭据；恢复测试有效期后 UI 重试完成                                                    | label `expired-refresh`、`expired-refresh-browser.json`          |
| API 不可达                     | 11:20:46–49，真实停止 API 后 UI 503；两层未撤销且 Hash 不变；11:22:12 重启后 UI 重试成功、原 Refresh 401                         | label `unreachable`、`03-upstream-unavailable-retry.png`         |
| 上游 5xx / 任意 401 / 无效 2xx | BFF 单元测试拒绝成功、不撤销本地、不清 Cookie。未向真实 API 注入 500 或无效 2xx                                                  | `route.test.ts:67`、focused 日志；仅测试替身证据                 |
| Refresh / Logout 并发          | 服务端 HTTP 同时调用两个真实 production Next 进程；4 轮，每轮 2 Refresh + 2 Logout，均完成两层撤销                               | `concurrency.jsonl` / `concurrency.mjs.txt`；不是浏览器并发证据  |
| 并发后原始与最新 Refresh       | 每轮两种凭据重放均 401；原 Cookie 私有 BFF 均 401                                                                                | 同上                                                             |
| 重复 Logout                    | 每轮对两个 BFF 重复原 Cookie 调用均 200 `already_revoked`                                                                        | 同上                                                             |
| 服务端专用端点                 | 实际 API 无 BFF 密钥 403；浏览器经 BFF 专用路径 404                                                                              | `concurrency.jsonl`、named browser probe                         |
| CSRF / 私有访问                | 实际浏览器缺 CSRF Logout 403；最终注销前 Identity 200；注销后私有拒绝                                                            | `browser-results.json`、`concurrency.jsonl`                      |
| Cookie / 无 Token 泄漏         | HttpOnly/Secure/Lax 的 `__Host-pci_creator_session`，path `/`；浏览器 Storage 空；注销后 Cookie 空；49 个响应无凭据字段或 JWT 值 | masked cookies、Storage、Network、`secret-scan.json`             |
| UI 失败反馈 / 缓存             | 真实截图确认失败保留工作区；自动化组件验证失败不导航/不清 Query Cache，明确成功后才退出                                          | `logout-feedback.test.tsx:15`、截图、focused 日志                |

49 个捕获响应、4 个命名浏览器探针、44 个应用 fetch 观察均保留。所有 44 个观察到的 API fetch 都为同源，无浏览器 Authorization Header。观察器的宽泛 Token 正则在两个 409 的 `invalid_refresh_token` / `expired_refresh_token` 错误码文字上产生匹配；原始 false 标记保留，不改写成 PASS。结构化字段扫描和实际凭据值扫描另行确认没有 Token 值泄漏。gstack 不导出 Set-Cookie；Cookie 属性证据来自单独脱敏的浏览器 Cookie inventory，未导出原 Cookie 值。

本次使用 Chromium 对可信 localhost 的 Secure Cookie 支持，未验证受信任 HTTPS 证书、实际浏览器 foreign-Origin、外部认证 Provider、部署 ACL 或生产环境。CSRF 的真实浏览器检查不等同于 foreign-Origin 浏览器检查。

## 6. PostgreSQL 前后状态

| 测试标记             | Logout 前                                  | 首次操作后                              | 重试后 / Refresh 重放                     |
| -------------------- | ------------------------------------------ | --------------------------------------- | ----------------------------------------- |
| normal               | BFF active，上游有效                       | 两层 revoked=true，Hash 不变            | 原 Refresh 401                            |
| expired-access       | BFF active，Access 过期，上游 Refresh 有效 | 两层 revoked=true，Hash 不变            | 原 Refresh 401                            |
| already-revoked      | BFF active，上游先被明确撤销               | BFF revoked=true，上游仍 revoked=true   | 原 Refresh 401                            |
| invalid-refresh      | 仅测试 BFF Refresh 被破坏                  | 两层 revoked=false；返回 409            | 恢复测试凭据后两层 true；原 Refresh 401   |
| expired-refresh      | 上游 expires_at 被设置为过去               | 两层 revoked=false；返回 409            | 恢复测试有效期后两层 true；原 Refresh 401 |
| unreachable          | API 已停止                                 | 两层 revoked=false，Hash 不变；返回 503 | API 重启后两层 true；原 Refresh 401       |
| concurrent round 0–3 | 新登录、两层 active                        | 全部两层 revoked=true                   | 原/最新 Refresh 均 401，私有 BFF 401      |

最终数据库统计：BFF 11 行、11 行已撤销、0 行 active；上游 49 行、39 行已撤销（其余来自独立认证集成测试，不能把全库所有测试 Session 宣称为均已撤销）；Operations accounts=0、sessions=0；Migration 数仍为 43。所有浏览器与并发场景对应行均已明确检查。之后整库随一次性容器删除，无历史生产数据变动。

## 7. 自动化验证与限制

| 检查                                                                               | 结果                                                            |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Creator focused：BFF Route、Logout recovery、logging、Session restore、UI feedback | 5 文件 / 21 测试 PASS；feedback 最后断言调整后单独 1/1 再通过   |
| PostgreSQL：creator-session-revocation、local-auth、creator-identity-api           | 3 文件 / 19 测试 PASS，`--testTimeout 30000`                    |
| API Typecheck / active backend tests Typecheck                                     | PASS                                                            |
| Creator Web application Typecheck                                                  | PASS                                                            |
| 本轮 4 个变更 Web test 文件隔离 Typecheck                                          | PASS；临时 tsconfig 与命令保存                                  |
| Web ESLint                                                                         | 0 error，4 个现存非本轮 warning                                 |
| 6 个变更 Backend 文件 ESLint                                                       | PASS                                                            |
| 13 个 TypeScript/TSX 变更文件 Prettier                                             | PASS；`.env.example` 无 Prettier parser，使用 diff/空白检查     |
| 新报告/证据索引/JSON 及文档新增片段 Prettier；Diff whitespace                      | PASS                                                            |
| Production Build `pnpm --filter web-v2 build`                                      | PASS；两个运行进程均使用该实际构建                              |
| 全量 Creator Web 测试                                                              | 33 文件通过 / 1 文件失败；95 测试通过 / 1 失败                  |
| 全量 Web test Typecheck                                                            | FAIL：既有 jest-dom / Vitest matcher augmentation TS2339 等诊断 |

全量唯一测试失败位于 `apps/web-v2/components/commerce/booking-form.test.tsx:23`，仍查找“提交预约”，而 HEAD 组件已为“提交请求”（后续旧断言还使用“预约说明”）。测试和组件均与任务开始 HEAD 完全相同；本轮不修改它们。初次全量测试类型检查包含新增 feedback 测试的三处 matcher 诊断；改用普通断言后重新执行全量检查，变更文件已无诊断，仅剩既有文件的错误。初次和最终日志分别保留，不做全仓测试类型配置修复。

第一次 PostgreSQL 运行使用默认 5 秒超时，既有 local-auth 测试在并行启动负载下超时；保留代码不变，以明确 30 秒上限重跑三文件得到 19/19。初次 Root ESLint 错用根 typed-project 配置处理 Web tests，后以 Web 应用自身 ESLint 和独立 Backend ESLint 正确执行。没有把初次失败隐去或宣称全仓全部通过；未运行无关全仓验收、Admin 或外部服务测试。

可重跑命令及每项日志见 [证据索引](evidence/PCI-ENG-020-B1-V2-20261116/README.md)。组件和 Mock 仅补充故障分支，未替代第 4–6 节真实注销验收。

## 8. 变更与代码证据

| 文件 / 位置                                                                     | 修改与目的                                                              |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `.env.example:25`                                                               | 新增独立服务端撤销密钥配置说明                                          |
| `applications/account-identity-membership/local-auth-service.ts:54,318`         | Repository Port 与 Hash 撤销编排、明确错误                              |
| `adapters/persistence/postgres/postgres-local-auth-repository.ts:175`           | Hash 定位、事务行锁、幂等/失效状态区分                                  |
| `adapters/transport/http/local-auth-routes.ts:7`                                | 专用 Route、TypeBox 实际请求/响应合同、服务端密钥常量时间比较           |
| `apps/api/src/create-api-server.ts:83,342` / `apps/api/src/main.ts:116`         | Bootstrap 注入独立服务凭据                                              |
| `apps/web-v2/app/api/[...path]/route.ts:97,172,299,381`                         | Secure Cookie 清理、Refresh/Logout 共同锁、严格成功语义、专用端点不代理 |
| `apps/web-v2/lib/server/creator-session-store.ts:84,130,159`                    | PostgreSQL 锁、仅供 Logout 读取 inactive 行、保留 CAS                   |
| `apps/web-v2/lib/auth/service.ts:76`                                            | 前端只在明确上游状态后清 Session                                        |
| `apps/web-v2/app/api/[...path]/route.test.ts:53`                                | BFF 成功、失败、异常 401/2xx、专用路径、凭据保留回归                    |
| `apps/web-v2/lib/auth/logout-feedback.test.tsx:15`                              | 使用真实 Layout/AuthContext 验证失败反馈与缓存保留                      |
| `apps/web-v2/lib/auth/logout-recovery.test.ts:8` / `service-logging.test.ts:10` | 明确响应合同、失败不清 Session、日志不暴露凭据                          |
| `tests/integration/creator-session-revocation.integration.test.ts:22,53,65,73`  | 实际 PostgreSQL/API 合同、Hash 认证、过期、幂等与上游竞争               |
| `docs/09_Engineering_Governance/configuration-and-secrets.md`                   | 新服务端密钥与部署配置依赖                                              |
| `docs/08_Execution/21_Prototype_Execution.md`                                   | DEV-089 授权与最终执行证据；只提交 V2 新增段落                          |
| 本报告与 `evidence/PCI-ENG-020-B1-V2-20261116/`                                 | 本轮证据、复现方法、已执行与未执行边界                                  |

既有 UI 配合位置：`apps/web-v2/app/(creator)/layout.tsx:22,83`、`apps/web-v2/lib/auth/context.tsx:99`，均无需修改。

## 9. Git、数据保全与清理

起点 Branch：`codex/pci-eng-015-b-r2-persistence-closure`。

起点 HEAD：`baa7e273d72469fdb938481d7760907b1f955424`；其 Parent：`8181e65c87b487af780fa1e2f82d35d5179fb73e`；Subject：`fix: align creator web api contracts and states`。

开始时台账已有 56 行 V1 未提交内容、46 个未跟踪文件。本轮保留原台账字节前缀及全部 46 文件 SHA-256；只暂存 V2 台账新增片段，历史 V1 段落和文件保持未提交，不混入修复提交。初始记录和保全比较见 `baseline.json` / `prior-work-preservation.json`。

本报告与实现、测试、必要文档和本轮证据在同一独立提交内。提交 Subject：`fix: complete creator upstream logout revocation`。最终 Hash / Parent / Subject 与提交后 Git Status 在交付回传中给出，避免报告自引用提交 Hash。无 Reset、历史改写或 Push。

API、两个 Next 进程、gstack 浏览器均已停止；一次性数据库容器已按精确名称移除，其余容器保留。临时凭据与状态文件清理、端口探测结果见 `cleanup.json`。此前 V1 清理受阻路径未触碰，不将既有清理问题描述成本轮新问题。

## 10. 验收边界

必须配置 API/BFF 相同的独立服务端撤销密钥，缺失配置将明确禁止成功注销。未确认撤销时用户收到失败而不是匿名导航；对于真正失效/丢失的 Refresh 凭据，报告明确未完成，未新增未经授权的账户恢复/全局登出产品能力。

B1V1-001 已有实际撤销和重放拒绝证据；Main Controller 仍需验收本修复、现存全量门禁失败与环境限制。上述技术闭环不等于生产就绪或外部试点获批。
