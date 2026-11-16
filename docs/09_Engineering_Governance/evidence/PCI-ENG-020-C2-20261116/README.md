# PCI-ENG-020-C2 Evidence Index

日期：2026-11-16。正式报告：[Creator Core Workflow UX Improvement](../../PCI-ENG-020-C2-Creator-Core-Workflow-UX-Improvement.md)。

本目录只包含C2本轮证据。既有V1文件留在原位置，未纳入提交。所有身份凭据、Cookie、CSRF与result access reference已脱敏；只使用一次性测试数据。

文本输出统一为LF并移除行尾空白，保留检查结果与事件事实；[artifact-scan.json](artifact-scan.json)记录脱敏后凭据模式扫描结果。

## 自动化检查

| 文件                                                             | 结果                                               |
| ---------------------------------------------------------------- | -------------------------------------------------- |
| [full-web-tests.txt](full-web-tests.txt)                         | 最终35files/110tests通过，无失败                   |
| [request-tests.txt](request-tests.txt)                           | 决定交互8tests通过                                 |
| [domain-application-tests.txt](domain-application-tests.txt)     | 5files/50tests通过，未改变Domain/Application       |
| [typecheck.txt](typecheck.txt)                                   | 应用Typecheck通过                                  |
| [test-typecheck.txt](test-typecheck.txt)                         | 全量测试代码Typecheck存在既存matcher诊断，未标PASS |
| [test-typecheck-baseline.json](test-typecheck-baseline.json)     | 只读HEAD比较：80→78条诊断，新增0，减少2            |
| [compare-test-typecheck.mjs.txt](compare-test-typecheck.mjs.txt) | 比较方法，不修改工作树或Git历史                    |
| [lint.txt](lint.txt)                                             | 0errors、4既存warnings                             |
| [prettier-check.txt](prettier-check.txt)                         | 本轮14个源代码/测试/CSS文件通过                    |
| [build.txt](build.txt)                                           | 最终焦点修正后的Production Build通过               |

## 真实Browser / Next / BFF / API / PostgreSQL

| 文件                                                                                           | 证据用途                                                                                           |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [environment.json](environment.json)                                                           | 真实环境、版本、一次性数据库、fixture与验证边界                                                    |
| [network-responses.redacted.jsonl](network-responses.redacted.jsonl)                           | 158个实际BFF响应，含200决定、409竞争、503不可用、查询刷新、publish/unpublish、履约、QR及正常logout |
| [browser-observations.json](browser-observations.json)                                         | 分阶段的弹窗、文案、焦点、结果、Storage及决定请求观察                                              |
| [browser-fetch-audit.json](browser-fetch-audit.json)                                           | 112个应用fetch观察，包含110个Creator私有请求，全部同源且无Authorization header                     |
| [browser-probes.redacted.json](browser-probes.redacted.json)                                   | 真实BFF setup及竞争者调用结果；没有响应Mock                                                        |
| [boundary-observations.json](boundary-observations.json)                                       | Storage采样、同源/Bearer header观察、原始响应JWT扫描0；不代替B1-V2全部安全验收                     |
| [db-events.jsonl](db-events.jsonl)                                                             | 初始、取消后、API失败未重试、最终SQL状态                                                           |
| [runtime-facts.json](runtime-facts.json)                                                       | PostgreSQL17.10及正常logout后本地Session revoked                                                   |
| [runtime-api.redacted.log.txt](runtime-api.redacted.log.txt)                                   | 实际Shared API调用日志、相关id与状态                                                               |
| [migrate.txt](migrate.txt)、[catalog-seed.txt](catalog-seed.txt)                               | 一次性库运行既有43迁移及现有catalog，无新Schema                                                    |
| [mobile-layout.json](mobile-layout.json)                                                       | 375×812 modal为337×594，document宽375，overscroll=contain                                          |
| [browser-final-page.json](browser-final-page.json)                                             | 最终归档直达编辑页面只读、0inputs、浏览器版本及空Storage                                           |
| [browser-observer.js.txt](browser-observer.js.txt)、[seed-browser.js.txt](seed-browser.js.txt) | 浏览器实际fetch/DOM观察与数据准备脚本，无token硬编码                                               |
| [db-probe.mjs.txt](db-probe.mjs.txt)、[db-lock.mjs.txt](db-lock.mjs.txt)                       | SQL事实查询；单独持有新请求行锁以检验真实pending重复点击                                           |

阶段说明：phase1是早期生产构建，覆盖Confirm/Decline、取消、409和API停止/恢复。phase2a是最终生产构建，真实DB锁下同轮双DOM click仅1个POST、pending不能Escape、完成焦点正确。phase2b在375px复验真实409的错误焦点，并回归履约、QR、重新发布/撤回。最终归档直达页面随后单独捕获。

`browser-observations`中早期BODY焦点文本按160字符截断。Next保留的隐藏页面可能也被全局statuses选择器读取，须结合url、modal、focusInDialog和Network判断，不把隐藏页面文本视为当前可见UI。最终modal焦点修正已经实机复验。

### 截图

| 文件                                                       | 用户行为 / 结论                                    |
| ---------------------------------------------------------- | -------------------------------------------------- |
| [01-confirm-review.png](01-confirm-review.png)             | Confirm对象核对与独立履约说明                      |
| [02-decline-review.png](02-decline-review.png)             | Decline对象核对与不可逆说明                        |
| [03-conflict.png](03-conflict.png)                         | 实际409后阻止再次决定                              |
| [04-api-failure.png](04-api-failure.png)                   | 停止实际API后503，保留modal/上下文，必须先恢复刷新 |
| [05-unpublished.png](05-unpublished.png)                   | 独立Unpublished与可编辑操作                        |
| [06-archived.png](06-archived.png)                         | 独立Archived与只读操作                             |
| [07-mobile-review.png](07-mobile-review.png)               | 最终版本375px核对弹窗                              |
| [08-mobile-error-focus.png](08-mobile-error-focus.png)     | 最终版本真实409、错误focus、禁用提交               |
| [09-mobile-services.png](09-mobile-services.png)           | 四状态移动端两列，各自计数与说明                   |
| [10-archived-direct-edit.png](10-archived-direct-edit.png) | 最终版本归档编辑直达只读                           |

截图01/02为全页捕获；viewport以外的白色区域是原生backdrop的全页截图边界，不表示背景可操作。

## 可重复验证步骤与限制

1. 建立一次性非生产PostgreSQL，使用既有迁移/catalog；运行实际Shared API与Production Next，使用独立服务端Session配置。合成Creator通过真实认证；所有私有业务调用同源BFF。
2. 创建Draft、发布服务、发布后撤回服务。由于没有Creator归档API，仅将一个**全新disposable draft fixture**置为archived，读取列表/详情/编辑。不得对真实历史记录操作，也不把fixture声明为归档流程验收。
3. 创建新Public Request，点击Confirm/Decline，核对服务、客户、联系、id、说明；取消/Escape，检查没有决定POST且SQL仍submitted。
4. 正常提交两个决定，检查各自200、终态SQL、双列表GET和成功反馈；数据库行锁延迟另一个新请求，同轮点击两次确认、按Escape，验证仅一次实际决定POST。
5. 打开Decline，再通过真实BFF先Confirm，然后提交Decline；检查409、刷新后不可重试该对象。停止真实API，尝试另一个新请求，检查503、SQL未决定；恢复API并刷新后重试。
6. 375px复验modal/错误焦点/状态tabs；直接归档编辑只读。真实UI履约确认200及SQL fulfilled，QR API200 PNG；已撤回服务UI重新发布200再下架200。

这些是本地真实组件服务调用，并非生产或外部服务验收。Mock组件测试与实际Browser证据严格分开。未覆盖受信HTTPS、外部认证、部署ACL、其他浏览器、读屏或完整AT集合。

## Git / 保全 / 清理

- [baseline.json](baseline.json)：起点Branch、HEAD、Status及46历史未跟踪文件Hash。
- [prior-work-preservation.json](prior-work-preservation.json)：历史文件与V1台账保全比较；C2台账按片段暂存。
- [cleanup.json](cleanup.json)：C2服务、端口、精确容器和临时敏感文件清理；不触碰旧V1受阻路径。
- [validation.json](validation.json)：最终检查结果与限制汇总。
- [manifest.json](manifest.json)：本目录除manifest自身以外文件SHA-256。

独立提交Subject为`feat: improve creator offering and request workflows`，Parent为`ba2b45ebc6c47d423c84f2d3c889b76b449ca8ac`。最终提交Hash / Git Status由交付回传提供。无Push。
