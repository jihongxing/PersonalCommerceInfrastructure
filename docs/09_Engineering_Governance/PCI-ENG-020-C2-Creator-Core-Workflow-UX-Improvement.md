# PCI-ENG-020-C2 — Creator Core Workflow UX Improvement

日期：2026-11-16。执行依据：Main Controller 对 CWD-007、CWD-010、CWD-TEST-001 的授权；执行登记 DEV-090。

```ini
PCI-ENG-020-C2 = CREATOR CORE WORKFLOW UX IMPROVEMENT — AWAITING MAIN CONTROLLER ACCEPTANCE
```

## 1. 完成结果与边界

Creator Services 现按实际四种状态分别展示，并在列表、详情和归档编辑入口说明允许的操作。Confirm / Decline 现先核对请求对象，再执行终态决定；取消不发请求，提交防重复，失败保留上下文，冲突后以服务端查询结果刷新列表。Booking Form 只修正过期测试断言，正式组件文案未变。

Creator Web 全量测试 **35 files / 110 tests / 0 failures**；应用 Typecheck、ESLint（0 errors、4 项既存 warnings）、本轮文件 Prettier 和 Production Build 通过。使用真实 gstack Chromium + Production Next.js + Creator BFF + Shared API + 一次性 PostgreSQL 完成核心回归。详见 [证据索引](evidence/PCI-ENG-020-C2-20261116/README.md)。

未修改 Domain / Application、API Contract / Route、数据库 Schema / Migration、Identity / Session / Credential / BFF / Auth Runtime 或 VS-01。Fulfillment Code / QR / Fulfillment Confirmation 保留；未增加归档 API、撤销决定、中间业务状态或商业能力。

本报告属于本地工程交付，不代表生产部署、外部试点批准或全部 AT-001–AT-013 验收。

## 2. 产品与状态依据

| 权威位置                                                      | 本轮采用的规则                                                                    |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `docs/07_Product_Architecture/20_MVP_PRD_VS01.md:401`，FR-013 | 区分 Draft、Published、Unpublished、Archived                                      |
| 同文件 `:407`，FR-014–FR-022                                  | 发布仍以服务端条件为准；撤回后保存已有请求                                        |
| 同文件 `:426`，FR-028–FR-032                                  | Customer 提交 Request，不能宣称预约或履约已完成                                   |
| 同文件 `:437`，FR-034–FR-042                                  | Creator 处理自己的 Submitted Request；Confirm / Decline 为不同终态                |
| 同文件 `:775`，FD-020-BD-01 Amendment                         | Confirmed 后保留独立履约确认能力，不能把 Confirm 等同履约完成                     |
| `modules/service-offering/offering.ts:4,79,228,240,248`       | 现有四状态；Archived 不可编辑；Draft / Unpublished 可按条件发布；Published 可撤回 |
| `modules/commerce-decision/commerce-decision.ts:5,18`         | 决定仅从 Submitted 转为 Confirmed / Declined，保持原状态机                        |

`dialog` 的 open、pending、error 均为前端临时交互状态，不新增 Request 业务状态。

## 3. CWD-007：Offering 状态展示前后对照

| 后端 state    | 修改前                                        | 修改后标签与操作                                           |
| ------------- | --------------------------------------------- | ---------------------------------------------------------- |
| `draft`       | 草稿                                          | 草稿；编辑、查看、满足服务端条件后发布                     |
| `published`   | 已发布                                        | 已发布；编辑、查看、现有下架操作                           |
| `unpublished` | 与 Archived 合并为“已下架”                    | 未发布；说明已撤回公开展示，可编辑、查看并按原条件重新发布 |
| `archived`    | 与 Unpublished 合并为“已下架”，仍暴露编辑入口 | 已归档；仅查看历史信息，说明不能编辑或重新发布             |

实现使用既有 Offering 列表数据，无新增查询端点。共享纯映射 `features/creator-onboarding/lib/offering-lifecycle.ts:3` 使用既有 `ServiceOffering['state']` 类型约束。列表四个独立计数，移动端两列、桌面端四列；详情与列表使用同一状态说明。直接访问归档 `/services/:id/edit` 返回只读说明及查看入口，并在提交处理器防止更新。

代码证据：`apps/web-v2/app/(creator)/services/page.tsx:24,41,73,123`；`app/(creator)/services/[id]/page.tsx:141,148,319`；`features/creator-onboarding/components/service-form.tsx:70,84,118`。

组件测试覆盖分组、计数、编辑/查看链接、Unpublished 可发布、Archived 无编辑/发布/下架入口、直接编辑不调用更新。真实浏览器分别查看四种状态，实际重新发布 Unpublished 再撤回，API 均返回 200，数据库最终恢复 `unpublished`。截图 `05`、`06`、`09`、`10`。

归档验证的明确限制：现有 Creator 无 archive API。本轮先通过真实 BFF 创建全新 disposable Draft，再只在测试数据库将该条新 fixture 置为 `archived`，用于验证历史状态的读取与 UI。**这不是归档业务入口或新归档流程的验收，也没有修改真实历史 Offering。**

## 4. CWD-010：Confirm / Decline 二次确认

修改前：请求卡片直接调用决定 mutation。修改后：卡片只打开原生 modal dialog，核对后才发送同一条原 API 请求。

| 环节       | 最终行为与证据                                                                                            |
| ---------- | --------------------------------------------------------------------------------------------------------- |
| 核对对象   | 显示服务、客户、联系方式、Request action id、请求说明；不显示 resultAccessToken。截图 `01`、`02`、`07`    |
| Confirm    | 独立标题“确认此请求？”和“确认接受”；明确决定不可撤销、不能改为拒绝，且不等于履约完成                      |
| Decline    | 独立标题“拒绝此请求？”和“确认拒绝”；明确不可撤销、不能改为确认，客户会看到拒绝结果                        |
| 取消       | 点击取消或提交前 Escape 关闭；无 mutation，焦点回原按钮；SQL `after-cancel` 中四个请求仍为 submitted      |
| 提交       | 同步 ref 防止同一事件轮次内双击；按钮禁用，提示正在提交/核对；提交期间禁止取消及 Escape                   |
| 成功       | 等待 pending / confirmed 两个 query 的失效及刷新，再关闭弹窗；分别显示“已确认请求”/“已拒绝请求”，聚焦结果 |
| API 失败   | 解析真实 HTTP status 的 `ApiError`；不显示决定成功，保留弹窗、对象及错误说明，主动刷新两个列表            |
| 查询也失败 | 保留缓存和弹窗，明确状态未能验证，禁用决定；可取消后“刷新请求”再重新核对                                  |
| 并发冲突   | 409 显示状态冲突；刷新后已不属于待处理的请求禁止再次决定，不做本地乐观终态覆盖                            |

代码：`components/creator/request-decision-dialog.tsx:26,34,40,46,77,118`；`app/(creator)/requests/page.tsx:33,44,88,121,168,209`；`features/creator-dashboard/api/use-creator-actions.ts:19,34,48`。以上相对路径均位于 `apps/web-v2/`。

没有现有公共 Dialog 组件可复用，因此增加一个专用于 Request 决定的小组件，使用原生 `<dialog>.showModal()`，不新增依赖或自制焦点陷阱。Cancel 初始 autofocus，原生背景 inert，标题/说明关联，错误 `role=alert`，pending / error 独立焦点引用，完成结果 `role=status`；响应式高度、长文本换行与 modal overscroll containment 位于 `styles/globals.css:4`。

真实浏览器最终版本验证：

1. 在 PostgreSQL 事务中对**本轮新请求**持有行锁，浏览器对“确认接受”在同一 JS 轮次调用两次 DOM click。等待期间按钮禁用、焦点落在提交说明、Escape 不关闭；释放行锁后仅有 **1 次 POST /confirm、200**，数据库为 confirmed，页面成功反馈聚焦。不是 Mock 延迟或 Mock API。
2. 在 Decline 弹窗打开时，通过另一条真实同源 BFF 调用先 Confirm，再点击弹窗的“确认拒绝”。实际 Confirm=200、Decline=409；列表刷新为 confirmed，错误说明获得焦点且按钮禁用。最终版本在 375×812 浏览器复验，截图 `08`。
3. 停止真实 Shared API 后提交 Retry 请求，BFF 实际 503，后续查询也 503；页面保留上下文、说明状态未知并阻止继续提交。SQL 显示目标仍为 submitted。恢复 API、取消、刷新列表、重新核对后 UI Confirm=200，数据库为 confirmed。截图 `04`。此场景在最终焦点修正前执行；最终错误焦点由真实 409 场景及自动化错误测试补验。

失效/刷新处理没有绕开服务器授权，也没有新增自动重试决定或撤销操作。Creator 的 Confirm / Decline 终态与 Fulfillment Confirmation 始终分离。

## 5. CWD-TEST-001：Booking Form 文案

权威要求是 Submit Request，并明确不表示预约或履约已完成。现有 `components/commerce/booking-form.tsx:27,96,141,156` 使用“提交请求”“请求说明”，符合 FR-028–FR-032 与 Amendment。原测试仍以“提交预约”“预约说明”查找元素。

只修改 `components/commerce/booking-form.test.tsx:23,28,29` 三处过期查询，保留输入必填与服务端错误断言；未修改组件、API、用户可见文案或业务含义。测试中的任意服务端错误 fixture 文本不作为产品规范。

## 6. 验证矩阵

| 验证                                             | 结果                                                                                                                            | 证据                                                                                |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Creator Web 全量 `pnpm --filter web-v2 test run` | PASS，35 files / 110 tests，0 failures / 0 unhandled errors                                                                     | `full-web-tests.txt`                                                                |
| Request 组件单独验证                             | PASS，8/8；包括对象核对、取消、重复点击、pending Escape、503重试、缓存刷新失败、409后禁用、焦点                                 | `request-tests.txt`；`app/(creator)/requests/page.test.tsx:81`                      |
| QueryClient 决定与履约测试                       | PASS；两个真实 QueryClient 查询等待刷新；409/503保留状态与失败语义；保留原履约 BFF 合同测试                                     | 全量报告；`features/creator-dashboard/api/use-creator-actions.test.tsx:42`          |
| Offering / Booking 组件                          | PASS；两种生命周期及直接归档编辑、过期文案断言                                                                                  | 全量报告；对应 `page.test.tsx`、`service-form.test.tsx:28`、`booking-form.test.tsx` |
| Domain / Application / Fulfillment 最近回归      | PASS，5 files / 50 tests                                                                                                        | `domain-application-tests.txt`                                                      |
| 应用 Typecheck `pnpm --filter web-v2 typecheck`  | PASS                                                                                                                            | `typecheck.txt`                                                                     |
| Creator Web ESLint                               | PASS，0 errors，4 项既存 warnings                                                                                               | `lint.txt`                                                                          |
| 本轮 14 个代码/测试/CSS 文件 Prettier            | PASS                                                                                                                            | `prettier-check.txt`                                                                |
| Production Build `pnpm --filter web-v2 build`    | PASS，Next.js 16.4.5                                                                                                            | `build.txt`                                                                         |
| 全量 Web 测试代码 Typecheck                      | **未通过，既存问题**：当前78条 matcher诊断；只读 HEAD 虚拟源码比较为80条，新增0条                                               | `test-typecheck.txt`、`test-typecheck-baseline.json`、比较脚本                      |
| 真实浏览器决定成功、取消、409、503恢复           | PASS，实际 BFF / API / DB                                                                                                       | Network、Browser observations、SQL、截图                                            |
| 真实重复提交与 pending Escape                    | PASS，真实数据库锁延迟，1个200决定请求                                                                                          | `browser-phase2a` 观测、Network、SQL、`db-lock.mjs.txt`                             |
| 真实移动端 modal / services                      | PASS，375×812无横向溢出；错误焦点在modal；四状态两列可用                                                                        | `mobile-layout.json`、截图07–09                                                     |
| 已有履约与 QR                                    | PASS：UI confirm-fulfillment=200，目标 fulfilled；公共 QR API=200 PNG data URL                                                  | Network、`fulfillment-confirmation-regression`、SQL final                           |
| BFF 边界轻量回归                                 | 112次应用fetch观察，全部同源、无Authorization header；158个捕获响应中JWT=0，采样Storage为空；正常UI退出200、本地Session revoked | `boundary-observations.json`、`runtime-facts.json`、Network                         |

最近的后端测试命令：

```text
pnpm exec vitest run tests/application/customer-request-use-cases.test.ts tests/application/service-offering-use-cases.test.ts modules/service-offering/offering.test.ts modules/commerce-decision/commerce-decision.test.ts tests/fulfillment-code.test.ts
```

组件/Hook测试用 Mock API 验证 UI 分支和缓存行为，不作为业务 API 验收。浏览器结果来自实际服务；脚本只观测或调用真实 fetch，无请求拦截、响应伪造。最终完整套件还保留已有的 Creator 安全、BFF、Session、Contract 和履约测试。

既存 lint warnings：两个普通 img、ServiceForm 的 React Hook Form `watch()` React Compiler 提示、`lib/api/optimization.ts` 未使用变量。未做无关修复。全量测试 Typecheck 的 matcher 增补问题已在 B1-V2记录；本轮以只读 compiler host 使用 HEAD 内容比较，不修改工作树或历史，诊断无新增，不把该检查写为 PASS。

## 7. 真实环境、数据与证据充分性

运行环境：Windows PowerShell；gstack `/browse` 驱动 Headless Chromium 145；Production Next.js `http://localhost:3448`；Shared API `http://127.0.0.1:18083`；Podman 中 PostgreSQL **17.10**，loopback `39271`，DB `pci_ops_migration_fixture_c2`，精确容器名 `pci-020c2-3f9945a5`。既有43个迁移与现有catalog seed运行，无新增迁移。使用本地 auth 与测试库超级用户，Creator 登录实际运行，非 Mock。

只有合成 Creator、4个新Offering、6个新Request。SQL 最终状态：四个Offering各占一个实际状态；5个 confirmed、1个 declined；5个履约码 pending、仅一次实际履约确认变为 fulfilled。Confirm/Decline 从不自行改变履约状态。Operations accounts / sessions 始终0。取消与API不可用时的中间SQL证明未提前决定。

本轮已有正常 Logout 回归，但不重做B1-V2全部安全认证。未验证受信HTTPS、部署最小权限、真实外部认证、跨浏览器兼容、屏幕阅读器或所有AT；这些不以本地fixture或Mock结果冒充通过。多标签真实竞争用另一实际BFF调用模拟竞争者，不宣称两个人工交互标签同时点击验收。

证据分为早期运行和最终焦点修正后运行；最终代码的重复提交、真实409、移动端焦点及归档直达均已复验。截图01/02是早期全页捕获，原生backdrop只覆盖viewport，图中viewport以外的白色部分属于全页截图边界，不代表可点击的非模态背景。

证据保留响应状态、对象id、SQL事实与合成联系方式；所有凭据、Cookie/CSRF和result access reference脱敏，PNG二维码数据体只保留类型/长度。`manifest.json`提供本轮证据SHA-256。

## 8. 文件变更清单

所有下列源文件位于 `apps/web-v2/`：

| 文件                                                                   | 内容                                                         |
| ---------------------------------------------------------------------- | ------------------------------------------------------------ |
| `app/(creator)/services/page.tsx`、`page.test.tsx`                     | 四状态分组、计数、操作说明和链接验证                         |
| `app/(creator)/services/[id]/page.tsx`、`page.test.tsx`                | 详情生命周期一致性及允许操作                                 |
| `features/creator-onboarding/lib/offering-lifecycle.ts`（新增）        | 既有四状态的类型约束显示映射                                 |
| `features/creator-onboarding/components/service-form.tsx`              | 归档直达编辑只读，提交guard                                  |
| `features/creator-onboarding/components/service-form.test.tsx`（新增） | 不提交归档更新                                               |
| `app/(creator)/requests/page.tsx`、`page.test.tsx`                     | 打开核对dialog、结果焦点、失败后刷新恢复与交互测试           |
| `components/creator/request-decision-dialog.tsx`（新增）               | 两种决定的原生modal、取消、防重复、错误/冲突反馈             |
| `features/creator-dashboard/api/use-creator-actions.ts`、`.test.tsx`   | 决定错误保留HTTP status；成功/失败都等待双列表刷新；履约不变 |
| `components/commerce/booking-form.test.tsx`                            | 三处正式Request文案查询修正                                  |
| `styles/globals.css`                                                   | 仅新增专用modal布局、backdrop和overscroll样式                |

另新增本报告、本轮证据目录；`docs/08_Execution/21_Prototype_Execution.md`只提交DEV-090新增段落。没有其他应用或共享业务代码变更。

## 9. Git、保全与清理

起点 Branch：`codex/pci-eng-015-b-r2-persistence-closure`。

起点 HEAD / 本轮提交 Parent：`ba2b45ebc6c47d423c84f2d3c889b76b449ca8ac`。

起点 Subject：`fix: complete creator upstream logout revocation`；该HEAD的Parent：`baa7e273d72469fdb938481d7760907b1f955424`。

独立实施提交 Subject：`feat: improve creator offering and request workflows`。最终 Commit Hash、Parent、Subject 在交付回传中报告，避免提交自引用Hash。无Reset、历史重写或Push。

起点已有46个未跟踪文件和V1的56行未提交台账；逐文件SHA-256与原台账字节前缀检查见 `prior-work-preservation.json`。提交仅包含C2新增台账片段，原V1未提交内容仍留工作树；历史未跟踪文件全部不纳入本轮。初始Git Status详见 `baseline.json`。

测试后正常UI注销，本地Session为revoked。API、Next及gstack浏览器已停止，精确一次性容器已移除；临时凭据及原始含result reference记录按精确路径清理，其他历史路径未触碰。详见 `cleanup.json`。

## 10. 未解决事项与接受边界

- 全量测试代码Typecheck的既存matcher类型问题仍需独立工程修复；本轮无新增诊断。应用Typecheck、测试执行和构建通过不能掩盖此限制。
- 服务端错误原文可能为英文；C2提供中文上下文，未擅自更改API文案或添加全局错误翻译系统。
- 原生dialog在当前Chromium验证；其他浏览器与辅助技术未执行实机验证。`closedby`另有cancel事件fallback，但不能据此宣称所有浏览器通过。
- CWD-005、CWD-008、CWD-011及通知/CRM/Marketplace/自动履约/支付/后台扩建继续不在本轮。

Main Controller 尚需验收本轮代码、交互与证据。该状态不等于生产就绪。

## 11. 技能依据披露

采用 `modern-web-guidance` 的 dialog、accessibility、prevent-page-scroll-under-modal-dialog 指南，分别遵循：**“DO put autofocus on the safe action (such as Cancel or Keep) in a destructive confirmation.”**、**“Don't implement focus traps for native modal dialogs”**、**“MANDATORY: Set overscroll-behavior: contain on the `<dialog>` element itself”**。对应实现为Cancel autofocus、原生showModal、不自制focus trap、modal自身overscroll containment。

采用 `web-design-guidelines` 对semantic controls、focus、破坏性决定二次确认、inline errors、长文本和响应式完成复查。原始raw域名DNS不可用后，通过gstack读取同一权威GitHub `vercel-labs/web-interface-guidelines/command.md`。全部浏览器操作通过gstack `/browse`，未使用其他浏览器控制工具。技能仅提供工程建议，不替代VS-01或产品授权。
