# 116 Web V2 路由与验证清单

状态：实施中，2026-11-10。此清单记录源码归属和验证缺口，不代表功能或阶段验收通过。
设计参考为计划 116 第 4 节和 `stitch/shared/app.js`；组件测试中的查询和接口若经 mock，不能证明真实 API。
所有 Creator 路由还依赖 `(creator)/layout.tsx` 的 `ProtectedRoute` 和认证上下文。

| 路由                                            | 页面、数据与操作归属                                                                                                      | 当前证据及待验证                                                                                              |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `/`                                             | `app/page.tsx`；`normalizeReference`；本地校验后导航 `/r/{reference}`；认证状态决定工作台或登录入口                       | 会话恢复单测、访客 E2E 和成功态多视口检查已通过；更多错误状态及人工键盘检查待完成                             |
| `/auth/login`                                   | `login-client.tsx`；`useAuth` → `auth/service.ts` 的 login、refresh；安全返回目标 `lib/auth/return-destination.ts`        | 本地认证登录和无刷新令牌的过期会话跳转通过；刷新失败及外部认证仍待验证                                        |
| `/auth/signup`                                  | `signup-client.tsx`；`useAuth` → signup；表单校验                                                                         | 本地认证和隔离数据库注册成功；重复账号、外部认证与完整会话异常仍待验证                                        |
| `/auth/forgot-password`、`/auth/reset-password` | 各自 `page.tsx`；`useAuth` → `auth/service.ts`                                                                            | DEV-077 本地受控发送、重置测试通过；浏览器验证未配置时显示不可用及清除重置链接 fragment，真实邮件和真机待验证 |
| `/onboarding`                                   | `page.tsx`；`useCreatorIdentity`；无身份转欢迎页，其他错误提供重试                                                        | 分支单测及新用户本地浏览器路径通过；外部认证和完整异常状态待验证                                              |
| `/onboarding/welcome`                           | `welcome/page.tsx`；资料设置和首页链接                                                                                    | 新用户本地浏览器路径及填充态 axe 扫描通过；外部认证待验证                                                     |
| `/dashboard`                                    | `dashboard-client.tsx`；初始化、Creator identity、private identity reference、private homepages；`StableSharingTools`     | 本地真实数据、双入口 URL / QR 一致性及 axe 扫描通过；查询独立失败与真实公网分享待验证                         |
| `/profile`                                      | `profile-client.tsx`；`useCreatorIdentity`；URL 控制资料和对外主页 Tab                                                    | `profile-client.test.tsx` 覆盖 Tab 深链接和 URL；真实资料、会话和浏览器历史待验证                             |
| `/profile/edit`                                 | `IdentityForm`；`useCreatorIdentity`、`useCreateIdentity`、`useUpdateIdentity`；GET/POST/PATCH `/api/v1/creator/identity` | 本地隔离 API 浏览器验证编辑与返回；全部校验及失败状态仍待覆盖                                                 |
| `/profile?tab=public`                           | `HomepageManagement`；private profiles、identity reference、homepages 及其方案、窗口、预览操作；`StableSharingTools`      | 本地 API 浏览器验证发布、暂停、默认、归档、时区窗口及预览；双入口 URL 和二维码一致；权限和真实设备仍待验证    |
| `/capabilities`                                 | `useCreatorCapabilities`；GET creator identity 中的 capabilities                                                          | 本地 API 浏览器验证编辑保存、刷新及关联服务时删除冲突；320 / 1280 宽度无页面横向溢出，真实设备待验证          |
| `/capabilities/new`                             | `CapabilityForm`；POST creator identity capabilities                                                                      | 本地隔离 API 浏览器完成创建；全部校验及错误状态仍待覆盖                                                       |
| `/capabilities/[id]/edit`                       | `EditCapabilityForm`、`useCapability`、`useUpdateCapability`                                                              | DEV-076 本地浏览器编辑保存及刷新通过；接口权限、关联冲突和 PostgreSQL 并发测试通过，完整设备验收待完成        |
| `/services`                                     | `useCreatorServices`；GET creator offerings；按状态分组                                                                   | 本地隔离 API 浏览器验证草稿、发布和下架状态；全部权限与失败状态待覆盖                                         |
| `/services/new`、`/services/[id]/edit`          | `ServiceForm`；能力列表、GET offerings、POST/PATCH offering                                                               | 本地隔离 API 浏览器验证创建、关联能力和编辑；保存失败状态仍待覆盖                                             |
| `/services/[id]`                                | `useServiceOffering`、`PublishChecklist`、publish/unpublish 和分发状态查询、确认                                          | 组件、接口及本地浏览器覆盖发布检查、分发确认与刷新；PostgreSQL 并发确认仅产生一个规范事件；真实外部分发待验证 |
| `/requests`                                     | `useCreatorRequests`、`useCreatorConfirmedRequests`、`RequestCard`；confirm、decline、confirm-fulfillment                 | 本地 API 浏览器验证确认、拒绝、错误履约码、成功履约、跨用户禁止及重复决定；更多会话失效情况待验证             |
| `/r/[commerceRef]`                              | `public-homepage-client.tsx`；GET public homepages reference                                                              | 本地隔离 API 浏览器验证真实解析、公开字段和多视口；无服务及全部错误状态待覆盖                                 |
| `/s/[offeringId]`                               | `useServiceOffering`；`ServiceDetailCard`、`BookingForm`、`useSubmitBooking`；公开 offering GET 和 request POST           | 本地隔离 API 浏览器验证有效提交与下架后不可请求；重复提交及全部错误状态待覆盖                                 |
| `/o/[token]`                                    | `useOrderResult`；`OrderResultCard`；GET public requests token；submitted 轮询及手动刷新                                  | 本地隔离 API 浏览器验证提交后结果、确认与拒绝状态；失效令牌及全部轮询异常待覆盖                               |
| `/public/[offeringId]`                          | 服务端编码 ID 后重定向 `/s/[offeringId]`                                                                                  | 需浏览器确认编码和旧链接兼容                                                                                  |

## 公共状态和验收

- 对适用页面逐项检查加载、空、失败、重试、权限不足、会话失效、提交中和状态冲突；列表中的测试不隐含覆盖所有状态。
- 2026-11-10，web-v2 `vitest run` 通过 26 文件 / 79 测试，包含 mock；生产构建、TypeScript 和 OpenAPI 兼容检查通过。Playwright 使用隔离 PostgreSQL、真实本地 API 和本地认证，不能代表外部环境。
- Chromium、Firefox、WebKit、Mobile Chrome 和 Mobile Safari 模拟分别分批通过访客 3 项、当时的 Creator 3 项、主页管理 1 项及响应式 / 错误恢复 2 项。主页管理覆盖 Asia/Shanghai 与 UTC 转换、窗口冲突、禁用后默认回退、重新启用、暂停及归档；新增的错误履约码断言在 Mobile Chrome 和 Mobile Safari 模拟下通过，新增跨用户和重复决定测试在 Chromium 通过。
- Firefox Creator 首次 3 项失败、主页管理及响应式首次 3 项失败，独立重跑通过；Mobile Chrome 访客首次 2 项失败、Mobile Safari 主页管理首次数据准备失败，重跑通过。API 有每 IP 每分钟 100 次的限流，服务日志显示 500；限流是可能原因，不能把首次失败忽略或当作完整套件一次通过。
- 真实本地浏览器已完成注册、身份编辑、能力与服务创建、服务发布、公开访问、匿名请求、确认和履约。能力编辑 / 删除已有本地浏览器与集成验证；密码恢复已有可配置实现及本地受控发送、重置和未配置状态验证。真实邮件和外部服务仍未验收，不能计作完整验收。
- 105 次视口测量未见文档横向溢出，但部分为错误或加载状态；全路由成功态、焦点和 200% 缩放仍需验证。2026-11-10 用户在 iPhone 14 Pro Safari 的局域网 HTTP 环境反馈：公开主页、复制链接、复制 C 号、二维码扫码、分享、软键盘及底部安全区域均通过。此结果不证明生产 HTTPS 环境的行为，也不证明所有路由的设备验收。AT-001 至 AT-013 和完整调度验收仍未由此清单证明。
- 2026-11-10 完整创作者路径在本地 API、隔离 PostgreSQL 下分别通过 Chromium、Firefox、WebKit、Mobile Chrome 和 Mobile Safari 模拟；此前 Mobile Safari 两次因自动填写后必填字段被清空而未提交，调整等待并检查所有字段后通过。具体记录见执行台账；自动化模拟不代替实机、外部渠道或生产验收。
- 2026-11-10 成功态视口检查使用本地 API 和隔离 PostgreSQL，在 16 个路由的代表性数据加载后测量 320、375、768、1280、1600 px 文档宽度；五个配置的浏览器项目分别通过。WebKit 首次组合运行时能力编辑页遇接口错误，单独复跑通过；详见执行台账。该检查不覆盖缩放、全部交互状态或完整无障碍验收。
- 2026-11-10 使用新版 API、独立 web-v2 与隔离 PostgreSQL 完整串行复跑：Chromium 13/13，Firefox、WebKit、Mobile Chrome、Mobile Safari 合计 52/52。注册测试数据准备按 Retry-After 等待独立的认证限流。此前的首次失败及数据库停机见执行台账；新结果补齐下表提及的其他浏览器路径证据，但不证明规范事件、外部分发、真实邮件、生产 HTTPS、200% 缩放或全部无障碍状态。
- 根目录 `tests/acceptance/vs01.acceptance.test.ts` 检查验收入口是否存在，不能作为 AT-001 至 AT-013 的业务执行结果。

## VS-01 验收追溯（2026-11-10）

以下是针对 web-v2 的覆盖差异，结果均不等于完整 AT 验收；本地 API、隔离数据库和浏览器模拟不代表外部或生产环境。`tests/acceptance/browser` 中的旧版 `/creator` 流程验证的是 `apps/web`，其历史 Pass 不能直接转移给 web-v2。

| 验收项 | web-v2 已有证据                                                                                                                                                       | 尚需补充                                                                            |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| AT-001 | `full-creator-journey.spec.ts` 在本地隔离 API / PostgreSQL 和 Chromium 中以页面完成注册、资料、能力、草稿、发布、访客请求及确认；断言草稿不可公开及分发资产 generated | 补充规范事件、完整状态转换、真实外部分发及其他浏览器证据                            |
| AT-002 | 服务详情组件测试及本地浏览器检查身份不完整时禁止发布                                                                                                                  | 核对所有不完整条件，以及没有产生发布事件                                            |
| AT-003 | 本地浏览器发布服务并在公开主页看到供给                                                                                                                                | 断言生成的资产与 Generated 状态及相关事件；不把稳定主页二维码视作 Offering 分发资产 |
| AT-004 | DEV-078 在 web-v2 暴露明确确认及持久化状态读取；本地浏览器验证确认与刷新，隔离 PostgreSQL 验证并发只记录一次事件                                                      | 尚需实际外部渠道分发及完整验收证据；复制、下载或系统分享不能代替实际分发确认        |
| AT-005 | 访客 E2E 从真实本地公开主页进入已发布服务                                                                                                                             | 补充公开字段边界及 `storefront_viewed` 事件断言                                     |
| AT-006 | 访客 E2E 经页面提交并刷新结果；隔离库浏览器到事件用例按同一 Action ID 验证一条 `commerce_action_submitted`                                                            | 补充 Customer 与通知合同的完整端到端证据                                            |
| AT-007 | 访客 E2E 检查空姓名和下架后无提交入口                                                                                                                                 | 补充其他无效输入、直接 API 请求及未创建 Action / 事件断言                           |
| AT-008 | Creator E2E 经页面确认，本地 API 返回 confirmed；隔离库浏览器到事件用例按同一 Action ID 验证一条 `commerce_confirmed`                                                 | 补充完整结果语义及其他边界状态的端到端断言                                          |
| AT-009 | Chromium 本地 API / 页面验证 Creator 拒绝及访客结果页显示已拒绝                                                                                                       | 补充对应规范事件及其他浏览器证据                                                    |
| AT-010 | 本地 API / 页面验证跨账号 403、重复决定 409、结果保持 confirmed；隔离库浏览器到事件用例验证确认后拒绝仍为 409 且没有 `commerce_declined`                              | 补充跨账号尝试的数据库事件断言及完整边界状态覆盖                                    |
| AT-011 | Chromium 本地 API / 页面验证下架后无新提交入口，直接提交返回 422 `service_offering_unavailable`，原请求仍能由 Creator 确认并在结果页显示                              | 补充事件和其他浏览器证据；不代表外部环境验收                                        |
| AT-012 | 受控应用层 `external-observation-use-cases.test.ts` 本轮 4 项通过，覆盖记录、权限、前置条件和幂等                                                                     | 内存测试不证明 web-v2 或真实外部付款与履约，也未覆盖所有非目标约束                  |
| AT-013 | 计划规定保持非目标及相关既有偏差边界                                                                                                                                  | 需结合批准的后续偏差检查新版界面、合同和非目标，不能只凭旧客户端结果                |

AT-004 曾是新版客户端覆盖缺口。DEV-078 已登记并补充所有者读取及显式确认操作；本地应用层、接口、组件及浏览器覆盖部分状态与权限，真实外部分发和完整验收仍待验证。

2026-11-10 后续结果：完整 web-v2 浏览器套件在本地独立 API 与隔离 PostgreSQL 下通过 65/65，包含 Chromium、Firefox、WebKit、Mobile Chrome、Mobile Safari，每项目 13 项。因此上表中“其他浏览器证据”的缺口已有对应本地模拟结果；事件持久化、全部边界状态、实际外部分发、真实邮件、生产 HTTPS、200% 浏览器缩放及完整无障碍验收仍需独立证据。实体 iPhone 14 Pro Safari 的用户反馈另见执行台账。

2026-11-10 无障碍补充：`e2e/accessibility.spec.ts` 使用 axe 对填充数据的公开与创作者页面执行 WCAG A/AA 自动扫描。首次发现四处对比度或可访问名称问题并已修复；复扫 Chromium 2/2、Mobile Chrome 与 Mobile Safari 4/4 通过。相关访客 E2E 3/3、web-v2 单测 86/86、类型检查及生产构建通过。自动扫描不覆盖人工键盘顺序、屏幕阅读器体验或真实 200% 浏览器缩放；这些仍列为阶段 6 待验证项。

2026-11-10 事件证据补充：在本任务新建并迁移的 `plan116_integration` PostgreSQL 库上，`customer-request-use-cases.test.ts`、`service-offering-use-cases.test.ts`、`public-homepage-postgres.integration.test.ts` 和 `capability-management.test.ts` 共 4 文件 / 25 测试通过。应用层覆盖不完整服务禁止发布且不记事件、无效请求不创建 Action / 事件、拒绝重复或越权终态且不新增事件，以及通知失败仍保持状态和规范事件。PostgreSQL 用例覆盖公开主页浏览事件按关联 ID 去重、分发状态持久化及并发确认仅记一次 `creator_distributed`。这些是分层本地证据，尚不能证明页面请求与规范事件的完整端到端关联，也不能替代真实外部分发。

2026-11-10 浏览器到事件补充：`e2e/canonical-events.spec.ts` 仅在显式指定带 `integration` 标识的专用数据库时运行。访客经公开主页与服务页提交请求，Creator 经请求页确认；随后重复拒绝返回 409。按同一 Action ID 查询 PostgreSQL，验证恰有一条 `commerce_action_submitted` 和一条 `commerce_confirmed`，没有 `commerce_declined`。加入冲突断言后 Chromium 与 Mobile Safari 模拟各通过 1/1。此证据只覆盖这一条本地链路，其余规范事件、外部渠道、真实邮件和生产 HTTPS 仍待独立验收。
