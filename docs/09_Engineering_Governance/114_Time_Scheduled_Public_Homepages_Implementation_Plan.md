# 114 — 按日期和时间切换公开商业主页实施计划

> 状态：已实现；本地自动化验收通过（生产验收未进行）
> 产品决策：[31 — 按日期和时间切换公开商业主页](../07_Product_Architecture/31_Time_Scheduled_Public_Homepages_Decision.md)
> 关联变更：DEV-064 / TIME-SCHEDULED-PUBLIC-HOMEPAGES；依赖 DEV-061、DEV-062、DEV-063
> 既有主页计划：[113 — C 号公开商业主页](./113_Public_Commerce_Homepage_Implementation_Plan.md)
> 正式后端：`apps/api`；前端：`apps/web-v2`；本地 PostgreSQL 使用 Podman
> 日期：2026-11-08

## 1. 目标和不变量

本计划在现有 C 号公开商业主页上增加主页版本和日期时间切换能力。它不改变 Identity 与 C 号的一对一
关系，也不改变访客使用的稳定地址 `/r/{C号}`。

必须始终成立：

1. 一个 Identity 只有一个终身不变的 C 号。
2. 一个 Identity 可以有多个 Homepage Version，但同一时刻最多解析出一个 Active Homepage。
3. 只有 `PUBLISHED` 的主页版本可以作为默认主页或时间窗口目标；`UNPUBLISHED`、`PAUSED`、`ARCHIVED`
   版本不得公开。
4. 同一 Identity 的启用时间窗口不可重叠；并发保存也不能形成重叠。
5. 时间窗口使用 `[startsAt, endsAt)`，结束时间不包含在窗口内；无窗口匹配时使用已发布默认主页。
6. 没有可用默认主页且没有匹配主页时，公开入口返回主页不可访问；不能把存储故障显示成创作者不存在。
7. 公开资料、已发布服务、空服务主页、主页暂停、独立服务入口和历史请求继续遵守 DEV-062 的规则。
8. C 号和主页地址、二维码内容不因主页版本切换、资料编辑、登录变化或迁移而改变。

## 2. 范围与非目标

### 2.1 本次实现范围

- PostgreSQL 中从“一 Identity 一主页配置”迁移到“一 Identity 多主页版本”；
- 主页版本的默认标记、状态、资料选择和时间窗口；
- 时间窗口冲突校验、时区转换和当前主页解析；
- `apps/api` 私有管理接口、预览接口和兼容投影；
- `/api/v1/public/homepages/{reference}` 按服务端当前时间解析当前主页；
- `apps/web-v2` 工作台主页版本列表、当前激活标记、默认主页和时间窗口编辑；
- 公开页在相同 `/r/{C号}` 地址下显示自动切换后的主页；
- 迁移、审计、回退、并发、时钟和真实 PostgreSQL 验收。

### 2.2 明确不做

- 按周重复规则、节假日规则、复杂日历、优先级覆盖链；
- 访客通过查询参数选择主页版本或查看历史版本；
- 搜索、推荐、社交账号认证、支付、结算、Marketplace、CRM 或自动预约；
- 通过定时任务修改主页状态；解析按请求时间计算，不依赖 cron 才能生效；
- 新增 Canonical Event；主页切换和窗口维护只产生技术审计记录。

## 3. 领域模型和状态

### 3.1 Homepage Version

新增 `Homepage Version` 领域对象，至少包含：

| 字段                      | 规则                                                                |
| ------------------------- | ------------------------------------------------------------------- |
| `homepageId`              | 不可变 UUID；属于一个 Identity                                      |
| `identityId`              | 服务端从认证上下文解析，不接受调用方指定 owner                      |
| `commerceProfileId`       | 必须属于同一 Identity；只有 ACTIVE 资料可发布和预览                 |
| `state`                   | 沿用 `UNPUBLISHED`、`PUBLISHED`、`PAUSED`；归档使用既有生命周期策略 |
| `isDefault`               | 每个 Identity 至多一个默认版本；默认也必须是 `PUBLISHED` 才能公开   |
| `createdAt` / `updatedAt` | 服务端生成，用于审计和排序                                          |

`Active Homepage` 是解析投影：先选择当前时间命中的已发布时间窗口，命中一个则使用它；没有命中时选择
已发布默认版本。它不写入数据库，不允许前端或管理员直接设置。

### 3.2 Activation Window

新增 `Homepage Activation Window` 对象：

| 字段                        | 规则                                         |
| --------------------------- | -------------------------------------------- |
| `windowId`                  | 不可变 UUID                                  |
| `identityId` / `homepageId` | 复合外键保证窗口和主页属于同一 Identity      |
| `startsAt` / `endsAt`       | `timestamptz`，保存 UTC，`startsAt < endsAt` |
| `timeZone`                  | 合法 IANA 时区名，用于输入、显示和 DST 解释  |
| `state`                     | `ENABLED` 或 `DISABLED`；禁用窗口不参与解析  |
| `createdAt` / `updatedAt`   | 服务端生成                                   |

窗口创建和修改先将创作者输入的本地日期时间按指定 IANA 时区转换为 UTC，再持久化。DST 无法唯一解释的
时间必须返回明确的校验错误，不能静默选择一个时刻。

### 3.3 解析算法

公开解析在数据库事务或一致性快照中使用服务端 `now()`：

1. 规范化 C 号并找到 Identity；
2. 查询该 Identity 的 `PUBLISHED` 主页和 `ENABLED` 窗口；
3. 用 `[startsAt, endsAt)` 找到当前命中的窗口；
4. 若命中一个，返回其主页；若没有命中，返回 `isDefault = true` 且 `PUBLISHED` 的主页；
5. 若仍没有主页，返回 `homepage_unavailable`；
6. 对选定主页重新校验 ACTIVE Profile 和公开服务字段白名单；
7. 成功公开读取写入一次 `storefront_viewed`，使用已有 viewId 去重。

数据库约束保证第 3 步最多得到一个窗口；应用层仍需对异常多行结果报警并拒绝公开，而不是猜测优先级。

## 4. 数据库、迁移和回退

### 4.1 建议结构

新增规范表：

- `public_commerce_homepage_versions`：Identity、主页版本、Profile、状态和默认标记；
- `public_commerce_homepage_windows`：主页版本的 UTC 时间窗口、IANA 时区和启用状态；
- `public_commerce_homepage_version_audit`：版本、默认设置、状态和窗口变更的 actor 审计。

`public_commerce_homepage_windows` 对同一 Identity 的 `ENABLED` 时间范围建立不可重叠约束。优先使用
PostgreSQL `tstzrange` + `EXCLUDE`，并在迁移前验证 `btree_gist` 扩展权限；若目标环境不允许扩展，使用
Identity 级 `pg_advisory_xact_lock`、事务内重叠查询和数据库触发器组合实现同等约束，不能只依赖前端。

### 4.2 迁移步骤

1. 记录现有 `public_commerce_homepages`、Identity、Profile、C 号和审计行数及校验和；
2. 为每个现有主页配置建立一个 `Homepage Version`，保留其 Profile、状态和更新时间；
3. 将现有唯一主页标记为默认版本；历史 `PUBLISHED` 主页继续保持原公开行为；
4. 不自动创建时间窗口，不改变 C 号，不将未发布资料或服务变成公开；
5. 建立兼容投影，使现有 `/api/v1/private/homepage` 返回当前解析主页和版本标识；
6. 迁移后验证每个 Identity 至多一个默认版本、每个窗口归属一致、启用窗口无重叠、号码数量不变；
7. 迁移前后在隔离 Podman PostgreSQL 做备份、恢复、冲突中止和事务回滚测试；
8. 回退必须冻结写入、备份迁移后数据库并保留新增版本、窗口和 C 号，禁止直接覆盖迁移前数据库。

### 4.3 兼容策略

现有 `/api/v1/private/homepage` 保留为当前主页兼容投影；新增版本管理接口不要求旧客户端立即升级。
现有公开 URL、二维码和 `/api/v1/public/homepages/{reference}` 不变。旧客户端不能创建时间窗口，但读取到的
当前主页结果必须与新解析器一致。废弃旧表和旧字段前必须完成调用方盘点和退出窗口登记。

## 5. API 和应用层

### 5.1 私有接口

建议新增以下认证接口，所有接口从当前账号解析 Identity：

| 方法     | 路径                                             | 用途                                             |
| -------- | ------------------------------------------------ | ------------------------------------------------ |
| `GET`    | `/api/v1/private/homepages`                      | 返回版本列表、默认版本、当前激活版本和下一次切换 |
| `POST`   | `/api/v1/private/homepages`                      | 创建草稿版本并选择同 Identity 的 Profile         |
| `PATCH`  | `/api/v1/private/homepages/{homepageId}`         | 修改名称、Profile 或公开资料配置                 |
| `POST`   | `/api/v1/private/homepages/{homepageId}/publish` | 发布版本                                         |
| `POST`   | `/api/v1/private/homepages/{homepageId}/pause`   | 暂停版本                                         |
| `POST`   | `/api/v1/private/homepages/{homepageId}/default` | 设置已发布版本为默认                             |
| `POST`   | `/api/v1/private/homepages/{homepageId}/archive` | 归档版本并禁用其时间窗口                         |
| `GET`    | `/api/v1/private/homepages/{homepageId}/preview` | 预览指定版本，不产生 `storefront_viewed`         |
| `GET`    | `/api/v1/private/homepages/resolve-preview`      | 按指定测试时间预览解析结果                       |
| `GET`    | `/api/v1/private/homepages/{homepageId}/windows` | 查看时间窗口                                     |
| `POST`   | `/api/v1/private/homepages/{homepageId}/windows` | 创建并启用时间窗口                               |
| `PATCH`  | `/api/v1/private/homepage-windows/{windowId}`    | 修改未来窗口                                     |
| `DELETE` | `/api/v1/private/homepage-windows/{windowId}`    | 禁用未来窗口                                     |

兼容接口 `/api/v1/private/homepage`、`/profile`、`/preview`、`/publish` 和 `/pause` 保留，内部映射到
默认或当前版本，并在响应中增加可选的 `homepageId`、`isDefault` 和 `isActive` 字段。旧字段保持可读，
不允许旧接口创建第二个隐式版本。

错误合同至少包括：`homepage_schedule_conflict`、`invalid_time_zone`、`invalid_time_window`、
`homepage_not_published`、`homepage_not_owned`、`homepage_unavailable` 和现有内部故障类别。

### 5.2 公开接口

`GET /api/v1/public/homepages/{reference}?viewId={uuid}` 保持路径和响应结构。服务端禁止使用访客提供的
`at`、`timezone` 或 `homepageId` 改变解析结果。响应使用 `Cache-Control: no-store`，确保暂停、资料修改和
时间切换不会被旧缓存延迟公开。成功结果只返回当前主页允许的资料和已发布服务。

### 5.3 应用服务和时钟

应用服务暴露 `resolveAt(identityId, instant)`、`selectActiveHomepage(identityId, instant)` 和窗口冲突
校验；`instant` 在公开请求中来自数据库/服务器时钟，在预览中只能由已授权调用方提供。测试注入可控 Clock，
禁止直接依赖浏览器时间或 `Date.now()` 决定公开页面。

## 6. 工作台和公开页面

### 6.1 工作台“对外主页”主卡片

保留现有主卡片，并扩展为：

- 显示当前激活主页、默认主页、主页状态和下一次切换时间；
- 列出全部属于当前 Identity 的主页版本，明确区分草稿、默认、当前激活和未激活；
- 创建、编辑、复制版本，选择已授权 Profile；
- 设置默认主页，创建和编辑未来时间窗口；
- 在保存冲突时指出冲突区间和目标主页，不能只显示“保存失败”；
- 支持预览单个版本和指定时间解析结果；
- 保留稳定地址、复制链接、二维码、发布、暂停和恢复；
- 当前没有匹配主页时显示公开不可访问状态和修复入口，不把它标成“创作者不存在”。

所有切换、发布和窗口操作显示明确的加载、成功和失败反馈；前端状态只是投影，权限和冲突仍由 API 决定。

### 6.2 访客侧

`/r/{C号}` 不增加版本选择器或时间参数。页面展示当前解析主页，时间切换后下一次请求自动得到新主页；
服务列表、空态、不可访问和故障重试沿用 DEV-062。二维码继续指向同一个 C 号地址。

## 7. 测试和验收

### 7.1 领域与应用测试

- 同一 Identity 可创建多个版本，但不能创建两个默认版本；
- C 号和主页 URL 在版本创建、切换、暂停、资料编辑和登录变化后不变；
- 时间窗口起止边界、空窗口、过去窗口、时区和 DST 错误均有明确结果；
- 重叠窗口被拒绝，两个并发创建也只能成功一个；
- 当前窗口优先于默认主页，没有匹配窗口时回退默认主页；
- 目标主页暂停、Profile 归档或失去归属时不公开该版本并按规则回退；
- 预览可指定时间且不写 `storefront_viewed`，公开成功读取写入一次并去重；
- 跨 Identity 版本、Profile 和窗口不能读取或修改。

### 7.2 PostgreSQL 集成测试

- 迁移历史单主页为默认版本，号码、状态、Profile 和审计数据保持一致；
- 复合外键、默认版本唯一约束、窗口范围约束和审计 actor 在真实 PostgreSQL 中通过；
- 并发窗口写入、发布/暂停/归档和解析在事务边界内结果稳定；
- Podman 隔离数据库备份恢复、迁移失败回滚和重复迁移幂等；
- 数据库故障返回内部错误，公开页不伪装成号码不存在。

### 7.3 API、浏览器和回归验收

- 注册或已有账号登录后工作台展示版本和当前激活主页；
- 创建两个主页，设置不重叠窗口，在固定 Clock 下访问同一 `/r/{C号}` 得到不同资料；
- 到达窗口结束边界后回到默认主页；
- 手机/桌面页面都能创建、编辑、预览和删除窗口，错误可重试；
- 公开访客始终只能看到一个主页，不能通过参数读取其他版本；
- 主页服务列表、空态、服务详情、请求流程和既有独立服务入口回归通过；
- `pnpm build:api`、web-v2 类型检查、生产构建、Scoped ESLint、Prettier、OpenAPI、迁移检查、
  相关 Vitest 和 AT-001–AT-013 结果均登记到 DEV-064；
- 真实 API 使用 `apps/api`，本地 PostgreSQL 使用 Podman；`apps/api-mock` 不作为验收证据。

建议新增验收编号：`AT-SCH-001`（多版本）、`AT-SCH-002`（无重叠）、`AT-SCH-003`（默认回退）、
`AT-SCH-004`（时区边界）、`AT-SCH-005`（并发冲突）、`AT-SCH-006`（稳定 C 号）、`AT-SCH-007`（公开
不可绕过）、`AT-SCH-008`（迁移回归）。

## 8. 交付门禁和风险

实施前必须完成 DEV-064 产品决策、PRD 修订、数据盘点和接口合同；未完成时不得改动主页表结构或公开
解析逻辑。实现后必须先在隔离 Podman PostgreSQL 验证，再连接本地 8080 正式 API 和 3000 web-v2。

主要风险是 DST 转换、并发窗口写入、旧客户端只理解单主页、缓存延迟和迁移回退。每项风险都必须有
测试和观测证据；没有公网域名、TLS、共享限流、真实手机扫描和生产数据盘点时，只能标记本地完成，
不能宣称生产验收完成。

## 9. 完成标准

- 产品、PRD、数据库、应用服务、API、工作台、公开解析和迁移均有可追溯实现；
- 任意固定时间和 Identity 的解析结果最多一个，且重叠窗口在数据库和应用层都不可提交；
- 现有单主页用户迁移后行为不变，C 号、URL、公开字段和既有服务请求规则不变；
- 访客无需登录即可通过同一个 C 号地址看到当前主页，错误分类和故障重试符合合同；
- 真实 PostgreSQL、正式 `apps/api`、`apps/web-v2`、OpenAPI、构建和验收证据均完成登记；
- 所有生产和外部访问限制明确记录，未验证的环境不标记为通过。

## 10. DEV-064 实施证据

本计划已按正式 `apps/api`、`apps/web-v2` 和 Podman PostgreSQL 完成实现。已验证：

- `modules/public-commerce-homepage/scheduling.test.ts` 覆盖窗口命中、`[startsAt, endsAt)` 结束边界、暂停版本、默认回退和无主页；
- `tests/application/public-commerce-homepage.test.ts` 覆盖应用层版本、默认主页、预览和窗口校验；
- `tests/integration/public-homepage-api.test.ts` 覆盖私有管理接口、公开解析和错误合同；
- `tests/integration/public-homepage-postgres.integration.test.ts` 在 Podman PostgreSQL `pci_integration_064` 通过；
- `tests/persistence/public-homepage-migration.integration.test.ts` 在真实 PostgreSQL 验证旧主页迁移、默认唯一约束、复合外键、窗口范围与不重叠约束、审计和回滚；
- `pnpm build:api`、`pnpm build`、`pnpm --filter web-v2 exec tsc --noEmit`、`pnpm check:openapi` 和相关格式检查通过；
- 公开解析继续使用数据库服务器时间，访客不能通过参数选择主页版本；稳定 C 号、`/r/{C号}`、二维码和兼容 `/api/v1/private/homepage` 保持不变。

2026-11-09 follow-up also verifies that the workspace can edit enabled and disabled windows, retain their state,
and explicitly re-enable a disabled window. Authorized preview instants are normalized as UTC when no offset is
provided, so the result is independent of the API process timezone.

本地自动化验收完成。生产部署、真实公网访问、真实手机扫码和外部可观测平台验证尚未进行，不能据此宣称生产验收完成。
