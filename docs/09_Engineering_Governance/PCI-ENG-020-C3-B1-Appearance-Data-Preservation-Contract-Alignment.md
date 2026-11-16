# PCI-ENG-020-C3-B1 — Appearance Data Preservation & Contract Alignment

- 日期：2026-11-16。
- 决策：**FD-020-C3-BD-01 — Scoped Service Offering Appearance Capability**，Founder 选择方向 B，已授权执行。
- 工程登记：**DEV-091**，执行台账 `docs/08_Execution/21_Prototype_Execution.md:11298`。
- 起点 Branch：`codex/pci-eng-015-b-r2-persistence-closure`。
- 起点 HEAD / 本次提交 Parent：`a92568f4e1f6b3475aa763b5b429623d3833b72a`。
- 起点 HEAD Subject：`feat: improve creator offering and request workflows`。
- 证据目录：[PCI-ENG-020-C3-B1-20261116](evidence/PCI-ENG-020-C3-B1-20261116/README.md)。

## 1. 决策与完成范围

Appearance 是已确认活动出席类 Offering 的**可选结构化展示及现有 Request 上下文**，不是普通服务必填项，
不是通用价格配置。正式 VS-01 追加修订位于 `docs/07_Product_Architecture/20_MVP_PRD_VS01.md:841`；
保留此前冻结文本、FD-020-BD-01 及其他历史修订，没有无痕覆盖。

本次实现了 C3A-001 的后端数据保留修复、C3A-003 的稳定日期范围错误及 upcomingTitle 可选性对齐。
没有添加 Creator Appearance 编辑字段、新 Public UI、Template、清除能力或数值价格模型；没有变更
Schema/Migration、BFF、Identity/Session/Credential、Operations、Customer Request、Confirm/Decline 或 Fulfillment。

产品限定语义：活动日期和地点仅为描述；buyerType 仅表达目标请求方类别；pricingRule 是自由文本；
requestCallToAction 仅定制现有 Request 入口文案；upcomingTitle 是可选标题；externalUrl 是外部信息/分发链接。
不生成日历、排期、库存、自动过期、资格认证、报价交易、支付、结算、退款、自动履约或交付承诺。

## 2. 更新语义与实现证据

| 输入                             | 修复前                                       | 修复后                                                |
| -------------------------------- | -------------------------------------------- | ----------------------------------------------------- |
| PATCH 省略 appearance            | Domain 重建时丢弃，PostgreSQL save 写入 NULL | 保留原有完整对象，不重新归一化历史值                  |
| PATCH 包含完整 appearance        | 替换对象                                     | 继续整对象替换，不与旧对象合并                        |
| POST 省略 appearance             | 无对象                                       | 继续无对象 / PostgreSQL NULL                          |
| PATCH null / 空对象 / 缺必填字段 | 合同拒绝                                     | 继续 HTTP 400，不能用于清除                           |
| 对象省略 upcomingTitle           | 合同拒绝                                     | 合同与 Domain 接受，输出省略该属性                    |
| endsOn < startsOn                | Domain 通用 Error → HTTP 500 internal_error  | 专用 Domain Error → Application validation → HTTP 400 |

- Domain：`modules/service-offering/offering.ts:93` 在 input.appearance 为 undefined 时保留 offering.appearance；
  两个 availability 分支均使用同一保留结果。显式对象仍走原归一化路径；没有改变普通字段的既有更新规则。
- Application：`applications/service-offering/offering-use-cases.ts:80`、`:120` 先读取并校验归属，再处理 Domain，
  保存完整聚合；`:375` 只转换 `InvalidAppearanceDateRangeError`，其他异常继续传播，没有笼统把任意 Error 当作 400。
- Memory：`adapters/in-memory/in-memory-entity-collection-repository.ts:32` save 保存完整聚合的 structuredClone；
  无须在 Repository 中猜测 PATCH 字段。Application 测试改用该真实 Memory Adapter，并验证重新读取。
- PostgreSQL：`adapters/persistence/postgres/postgres-creator-identity-repositories.ts:62` mapper、`:303` insert、
  `:318` upsert 已正确读写完整 JSONB；本次无需增加 Repository 局部合并。独立连接验证保留/替换/NULL。
- `database/schema/creator-identity.ts:52` 仅将 JSONB TypeScript 形状 upcomingTitle 标记为可选；数据库列、
  SQL 约束、迁移文件及 migration journal 定义未修改。现有 nullable JSONB 已支持该形状。

保留语义位于后端，不依赖前端隐藏字段、缓存、暂存对象或重复发送旧 Appearance。
JSON 序列化会省略前端的 appearance:undefined，因此既有普通编辑路径获得保护。

## 3. 合同与错误定义

| 层                             | 精确位置                                                                                                                  | 对齐内容                                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Creator create/update/response | `contracts/api/v1/service-offering-contracts.ts:31`, `:51`, `:128`                                                        | 顶层 appearance 可选；对象内 upcomingTitle 可选；其余枚举、长度、格式、必需性保持原规则；禁止额外属性 |
| Public Offering response       | `contracts/api/v1/customer-request-contracts.ts:23`                                                                       | upcomingTitle 同步可选；SubmitCustomerRequestSchema 未变                                              |
| Domain                         | `modules/service-offering/offering.ts:23`, `:53`, `:154`, `:171`                                                          | 可选标题；倒置日期仍拒绝；提供标题时仍要求非空                                                        |
| Application                    | `applications/service-offering/offering-use-cases.ts:375`                                                                 | 显式 validation error，不保存非法修改                                                                 |
| Transport                      | `adapters/transport/http/api-error-handler.ts:9`, `:50`；`adapters/transport/http/service-offering-routes.ts:105`, `:133` | 继续使用既有 ApplicationError → 400 envelope；无需改全局异常处理器                                    |
| PostgreSQL 类型                | `database/schema/creator-identity.ts:52`                                                                                  | optional title，存储结构不变                                                                          |
| Public Web 类型                | `apps/web-v2/features/service-booking/api/use-service-offering.ts:12`                                                     | upcomingTitle?: string；无新增界面或业务交互                                                          |

倒置日期的实际 POST / PATCH 响应（correlationId 每次唯一）：

```json
{
  "error": {
    "category": "validation",
    "code": "service_offering_appearance_date_range_invalid",
    "correlationId": "<request correlation id>",
    "message": "Appearance end date cannot be before its start date."
  }
}
```

HTTP **400**；没有 internal_error。非法 update 后原始 JSONB 与重新映射对象保持一致。
Domain 同时测试 startsOn=endsOn 合法；未放宽反向范围规则。货币、最低价、最高价三个伪装字段分别实测 400；
null、缺必填字段、空标题、不存在日期均实测 400，已有数据未清除。

## 4. 只读 Template Inventory

来源为现有 `modules/service-policy/catalog-seed.ts`、`database/seeds/capability-service-catalog.json`，并读取一次性
数据库经现有迁移及种子导入后的 active policy v1 snapshot。**这不是生产或共享环境 Catalog 盘点。**
数据库前后 snapshot 完全相同，未调用目录写操作。

| Active Template ID                     | Capability Catalog ID                | 名称               | risk / release / status       | 本次适用判断     |
| -------------------------------------- | ------------------------------------ | ------------------ | ----------------------------- | ---------------- |
| `template-dance-private-lesson`        | `capability-dance-teaching`          | 1 对 1 舞蹈私教    | low / vs01 / active           | 普通服务，不绑定 |
| `template-professional-consulting`     | `capability-professional-consulting` | 专业咨询           | review / established / active | 普通服务，不绑定 |
| `template-commercial-appearance`       | `capability-commercial-appearance`   | 商业演出与活动出席 | review / established / active | 本次唯一确认映射 |
| `template-portrait-session`            | `capability-portrait-photography`    | 人像摄影约拍       | low / established / active    | 普通服务，不绑定 |
| `template-makeup-appointment`          | `capability-makeup-styling`          | 妆造预约           | review / future / active      | future，不绑定   |
| `template-english-speaking-coaching`   | `capability-english-coaching`        | 英语口语指导       | low / future / active         | future，不绑定   |
| `template-fitness-consultation`        | `capability-fitness-coaching`        | 非医疗健身指导     | review / future / active      | future，不绑定   |
| `template-brand-content-collaboration` | `capability-content-production`      | 品牌内容共创       | low / future / active         | future，不绑定   |
| `template-choreography-guidance`       | `capability-choreography-guidance`   | 编舞指导           | low / future / active         | future，不绑定   |
| `template-music-hosting`               | `capability-music-hosting`           | 音乐与主持合作     | review / future / active      | future，不绑定   |

上述 10 个 template 的 creatorSelectable / publishEnabled 在导入后的数据库 snapshot 均为 true；
但这些开关不能覆盖 riskTier / releaseScope 检查。唯一确认对象的 Capability 也是 active / established / review。
其模板 requiredFields 仍为 title、description、availability、request_instructions，未增加 Appearance 必填项。

精确依据：`modules/service-policy/catalog-seed.ts:154`、`database/seeds/capability-service-catalog.json:151` 的
模板明确描述“活动、地点、时间、买方类型和合作范围的现场服务”；Capability 位于前者 `:32`、后者 `:29`。
音乐/主持模板位于前者 `:238`，虽有现场活动描述，但 releaseScope=future，不纳入；摄影模板不因 photo 枚举纳入。

本轮仅登记确认映射供后续 Creator 配置绑定，不新增运行时模板限制或改变目录/发布政策。历史错配对象仍保留，
不会因 ordinary update 被删除，也不被视为本次新增产品授权。既有 `findServiceOfferingTemplate` 的兼容推断
未改写；不得用其推断分支替代上述 Founder 冻结适用范围。当前活动模板保存为 review_required，实际 publish
仍返回 409 service_offering_policy_review_required；“Appearance 可选”不表示该模板免审核。

## 5. 数据兼容与真实 PostgreSQL 结果

环境：Windows / PowerShell / Node 22.23.2 / pnpm 10.22.0；独立 Podman postgres:17，实际 PostgreSQL 17.10。
容器 `pci-020c3b1-58a068bb`，数据库 `pci_020c3b1_58a068bb`，仅绑定 127.0.0.1 的随机端口。
43 条现有 migration 成功执行。普通迁移入口先遇到已知 Operations schema/role 前置依赖，事务回滚；
只在此新容器补齐空的 operations_private / operations_api 和既有名称的 NOLOGIN roles 后重新迁移成功。
未改迁移 SQL；这不是 Operations 安装权限验收。Operations accounts/sessions 在运行前后均为 0。

`tests/integration/offering-appearance.integration.test.ts:155` 起同组 Fastify/Application 测试分别运行 Memory 和
PostgreSQL（各 6 项）；PG 每次 reread 创建独立连接和 Repository，另断言原始 JSONB，不把响应或缓存当作持久化证据。

真实 HTTP socket 探针另执行 **25 个记录步骤**，保留完整合成输入、响应、SQL before/after 和独立 mapper 结果：

| 场景                                                                      | HTTP / SQL 结果                         |
| ------------------------------------------------------------------------- | --------------------------------------- |
| 完整旧形状（包含 upcomingTitle 等可选字段）新建                           | 201；JSONB 完整；独立读取一致           |
| 省略 appearance，分别改 title / description / availability / instructions | 各 200；JSONB 与原对象相同              |
| 显式替换完整对象，省略 upcomingTitle / endsOn / pricingRule / externalUrl | 200；JSONB 仅剩新对象字段，无旧属性合并 |
| 倒置日期 POST / PATCH                                                     | 各 400，稳定 code；原对象未变           |
| currency / priceRangeMin / priceRangeMax                                  | 分别 400；无新增价格模型                |
| null 清除尝试                                                             | 400；JSONB 不变                         |
| 无 Appearance create / ordinary update                                    | 201 / 200；JSONB 为 NULL                |
| Creator GET 列表                                                          | 200，与已持久化对象一致                 |
| review 模板发布                                                           | 409，原政策保持                         |

证据：`socket-postgres-results.json`；运行源 `socket-postgres-probe.mjs.txt` 不含数据库凭据。
HTTP 探针使用明确的合成 AuthContextProvider，不代表 Browser/BFF/Session 回归。没有运行真实浏览器；本次不修改相关边界。

只创建和检查一次性合成数据。没有访问生产或共享数据库，没有删除、回填、重写任何真实历史 Appearance。
**不能确认真实历史数据此前是否已受 C3A-001 影响，也不能声称历史数据未受影响。**本次证明的是旧形状 fixture
在更新、保存、独立重读后的兼容性。已被旧代码清掉的数据不会被本修复自动恢复。

## 6. 测试与工程门禁

| 验证                                                                         | 结果                                                         | 证据                                |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------- |
| Domain / Catalog / Application / Customer Request / Fastify / Contracts 聚焦 | 8 文件 / 70 项 PASS，0 skip；含 PG 6 项                      | focused-tests.txt                   |
| 最后一次 Application 测试（Lint 修正后复验）                                 | 1 文件 / 10 项 PASS                                          | application-final-tests.txt         |
| Creator Web 全量                                                             | 35 文件 / 110 项 PASS                                        | creator-tests.txt                   |
| 真实 HTTP socket + PostgreSQL                                                | PASS，25 记录步骤；43 migrations                             | socket-postgres-results.json        |
| API Typecheck                                                                | PASS                                                         | typecheck-api.txt                   |
| Active backend test Typecheck                                                | PASS                                                         | typecheck-tests-final.txt           |
| Creator Web Typecheck                                                        | PASS                                                         | typecheck-web.txt                   |
| 变更代码 ESLint / Prettier                                                   | PASS                                                         | lint.txt / format-code.txt          |
| API TypeScript Build                                                         | PASS                                                         | build-api.txt                       |
| Creator Web Production Build                                                 | PASS                                                         | build-web.txt                       |
| root core Typecheck / root Build                                             | **FAIL，既有 6 个 TS2339**，均在未改动的 Operations 验证脚本 | typecheck-core.txt / build-core.txt |
| HEAD 对照编译诊断                                                            | 原 HEAD 与本次均为相同 6 个诊断，0 新增                      | typecheck-head-comparison.json      |

未进行无关全仓修复。对照脚本使用只读 TypeScript CompilerHost，将所有本次变更的 tracked .ts 源覆盖为
HEAD 原文后编译相同配置，再与当前编译结果比较；不 Reset、不临时覆盖业务文件。报告未把 root 门禁失败标为 PASS。

新增/修正测试索引：

- `modules/service-offering/offering.test.ts:126`：将旧“省略即删除”断言改为保留；另覆盖两个 availability 分支、
  整对象替换、无对象 create/update、可选标题、反向日期拒绝及同日合法。
- `tests/application/service-offering-use-cases.test.ts:192`、`:229`：真实 Memory Adapter 重读，普通字段保留、
  完整替换、Application 日期错误及失败不保存。
- `tests/integration/offering-appearance.integration.test.ts:155`、`:204`、`:227`、`:257`、`:276`、`:292`：
  同组 Memory/PG 链路、旧客户端省略字段、历史错配对象保留、合同拒绝输入及目录政策。
- `tests/contracts/offering-appearance-contract.test.ts:25`、`:59`、`:88`：对象/标题可选性、其余必填不变、
  禁止伪价格、Creator/Public response 旧/新形状兼容及错误 envelope。

没有以 Mock 证明 PostgreSQL 持久化；没有把合成 API 测试或组件结果表述为 Browser 端到端验收。
AT-001–AT-013、生产部署、外部试点或全产品完成均不在本次通过结论内。

## 7. 文件变更清单

| 文件                                                             | 用途                                              |
| ---------------------------------------------------------------- | ------------------------------------------------- |
| modules/service-offering/offering.ts                             | 保留语义、可选标题、专用日期错误                  |
| applications/service-offering/offering-use-cases.ts              | create/update 精确错误映射                        |
| contracts/api/v1/service-offering-contracts.ts                   | 标题可选与 update 省略语义说明                    |
| contracts/api/v1/customer-request-contracts.ts                   | Public response 标题可选                          |
| database/schema/creator-identity.ts                              | JSONB 静态类型对齐，无 SQL 变化                   |
| apps/web-v2/features/service-booking/api/use-service-offering.ts | Public 类型对齐；本文件局部格式归一化，无 UI 变更 |
| modules/service-offering/offering.test.ts                        | Domain 回归                                       |
| tests/application/service-offering-use-cases.test.ts             | Application + Memory 验证                         |
| tests/integration/offering-appearance.integration.test.ts        | Fastify + Memory/PG 同组回归                      |
| tests/contracts/offering-appearance-contract.test.ts             | Contract 校验                                     |
| docs/07_Product_Architecture/20_MVP_PRD_VS01.md                  | 追加 Founder Amendment                            |
| docs/08_Execution/21_Prototype_Execution.md                      | 只提交 DEV-091 新段落，原 V1 未提交段落保留       |
| 本报告与专属 evidence 目录                                       | 结果、复现代码及脱敏证据                          |

Memory/PostgreSQL Repository 实现、Catalog、Migration 文件均无需修改，以上测试验证其现有完整聚合保存合同。

## 8. Git、保留与剩余事项

起点完整状态及既有未跟踪文件 SHA-256 见 baseline.json。起点为 **47 个既有未跟踪文件**：46 个历史 evidence/
V1 文件，加 1 个 C3-A 产品审查报告；均不纳入本次提交。原 V1 台账未提交内容共 56 行，保留原字节。
提交前只暂存 DEV-091 新台账段落；原 V1 内容留在 worktree。提交 Subject 为
`fix: preserve offering appearance on ordinary updates`；确切 Hash/Parent 与提交后 Git Status 随最终交付返回。
保留校验、资源清理及暂存清单分别见 preservation.json、cleanup.json、staged-files.txt；不 Push，不改写历史。

剩余事项：

1. 真实历史数据是否曾被旧更新清除仍未知，需另行授权环境和调查，不能从一次性数据推断。
2. Creator Appearance 编辑界面、原 Creator 前端伪价格模型及新 Public 展示不在本轮实施；其后续设计必须遵守本次限定映射。
3. 第三方旧客户端若假设所有 response 必有 upcomingTitle，需要自行兼容可选值；仓库 Public Web 类型已对齐，其现有 UI 不消费此标题。
4. 并发编辑的整聚合 lost-update 风险是原有保存模型问题；本轮未引入版本控制或声称解决所有并发写入。
5. root core/build 的 6 个既有 Operations 测试脚本类型错误未在本次越界修复；相关 API/Web 门禁通过。
6. 未执行 Browser 端到端；Browser/BFF/真实外部服务验收不由这些测试替代。

```ini
PCI-ENG-020-C3-B1 = APPEARANCE DATA PRESERVATION & CONTRACT ALIGNMENT — AWAITING MAIN CONTROLLER ACCEPTANCE
PCI-ENG-020-C3-B1_FOUNDER_DECISION = FD-020-C3-BD-01 / DIRECTION B
PCI-ENG-020-C3-B1_REAL_POSTGRESQL = PASSED ON DISPOSABLE SYNTHETIC DATABASE
PCI-ENG-020-C3-B1_REAL_HISTORICAL_DATA = NOT INSPECTED / IMPACT UNKNOWN
PCI-ENG-020-C3-B1_SCHEMA_MIGRATION_CHANGES = NONE
PCI-ENG-020-C3-B1_PRODUCTION_EXTERNAL_PILOT = NOT AUTHORIZED
PCI-ENG-020-C3-B1_PUSH = NONE
```
