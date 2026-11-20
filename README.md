# Personal Commerce Infrastructure

PCI 是个人商业主页（Personal Commercial Homepage）。消费者可以在个人主页发现经营者已发布且可见的商业供给，不必先收到单项分享链接。当前维护范围为 **Service、Membership、Program、Goods**；Goods 默认关闭，**Project 和 Right 已搁置**。产品定位见 [Decision 47](docs/07_Product_Architecture/47_Personal_Commercial_Homepage_Founder_Decision.md)，执行范围见 [Decision 49](docs/07_Product_Architecture/49_Four_Scenario_Focus_Founder_Decision.md)。

## 仓库导航

| 位置 | 职责 |
| --- | --- |
| `apps/api/` | 共享 Fastify API、认证、业务编排入口、健康检查和 OpenAPI。 |
| `apps/web-v2/` | Creator Web：个人主页、消费者入口和经营工作台；Creator BFF 在服务端处理会话。 |
| `apps/admin-web/` | 独立 Operations Admin Web 和 Admin BFF；通过 API 工作，不直连数据库。 |
| `applications/`、`modules/`、`domain/` | 应用用例、领域模块、仍在使用的履约码模型。 |
| `adapters/`、`contracts/`、`database/` | HTTP/认证/持久化适配器、API 契约、Schema、迁移与种子。 |
| `lib/` | 旧认证与邮件辅助源码，保留给历史编译范围及根测试；不是三应用的共享运行时。 |
| `scripts/`、`tests/`、`deploy/`、`.github/` | 维护与验证、测试、现有容器入口、CI。 |
| `docs/`、`artifacts/`、`stitch/`、`output/` | 正式文档、历史截图及工具、设计原型、历史截图及被忽略的本地输出。不是应用部署入口。 |

`apps/prototype/` 不是第四个应用；API 和数据库工具仍消费其中的配置/组装代码。
包管理、Workspace、TypeScript、测试、代码规范及构建上下文配置保留在根目录。
完整盘点及验证限制见 [PCI-ENG-027 报告](docs/09_Engineering_Governance/PCI-ENG-027-Repository-Root-and-Deployment-Readiness.md)。

## 历史交付背景

当前仓库已完成 VS-01 Product Proof、VS-02A Provider-neutral Money Domain、VS-02B Provider
Integration Readiness 和 VS-02E Local Commercial Simulation。VS-02C 微信支付 Adapter 仅完成本地
工程资格化，外部 Provider Qualification 仍为 `CONDITIONAL`。VS-02D 内部 Engineering Readiness
已完成，但 Real Money Activation 仍保持关闭并要求人工 Founder GO。

**核心问题**：地陪、台球助教、占卜师等个人商业者在抖音/小红书/微信因"私域引流"被封号，失去商业入口。

**PCI 解决方案**：通过 Commerce Reference（C号）—— 一个平台无法封禁的商业标识 —— 让 Creator 能在任何平台引流到自己的独立商业页面。

当前版本：`0.2.0`  
当前交付状态：`VS-02E Local Commercial Simulation COMPLETE / No Real Money Evidence`

当前项目控制：`CONTROLLED_RECOVERY`；正式 Resume Gate 尚未完全关闭。VS-01 仍冻结，Stage 2
仅允许具名 bounded change units，完整 Stage 2、Stage 3、外部 Pilot、生产和真实资金均未授权。
当前治理入口是 [`25_Project_Control_Baseline.md`](docs/08_Execution/25_Project_Control_Baseline.md)。

```text
VS-01 Product Proof                Complete
VS-02A Money Domain                Complete
VS-02B Provider Integration Ready  Complete
VS-02C Provider Adapter            Conditional
VS-02D Engineering Readiness       READY
VS-02D Real Money Activation       NOT AUTHORIZED / Founder activation required
VS-02E Local Commercial Simulation COMPLETE
```

**No Real Money Evidence.** 当前不存在真实 Customer Payment、真实 Settlement、真实 Creator
Earnings、真实 Withdrawal 或真实 Refund 证据。受控 Test Transport、Fixture、Sandbox 命名和
`pilot_operations` 事实均不得解释为真实商业事实。

## 工程事实源

- 产品方向层 SSOT：`docs/01_Strategy/05_Personal_Commerce_Infrastructure_Product_Direction.md`
- 场景进入顺序：[FD-PCI-SCENARIO-SEQUENCING-001](docs/07_Product_Architecture/42_Commercial_Scenario_Sequencing_Founder_Decision.md)（Membership 是 Service 之后的第二个优先运营场景；Program 已批准为第三场景）
- Membership 首期：[Founder 决定](docs/07_Product_Architecture/43_Membership_First_Slice_Founder_Decision.md)与[产品合同](docs/07_Product_Architecture/44_Membership_First_Slice_Product_Contract.md)
- Program 首期：[Founder 决定](docs/07_Product_Architecture/45_Program_First_Slice_Founder_Decision.md)与[执行规则补充](docs/07_Product_Architecture/46_Program_First_Slice_Execution_Rules_Founder_Decision.md)（第三运营场景已实现；Production Readiness 未验证）
- Goods 首期：[Founder 决定](docs/07_Product_Architecture/48_Goods_First_Slice_Founder_Decision.md)（第四场景已进入主线，默认关闭）
- [四场景聚焦 Founder 决定](docs/07_Product_Architecture/49_Four_Scenario_Focus_Founder_Decision.md)：Service、Membership、Program、Goods 为当前维护范围；Project、Right 正式搁置。Goods 默认关闭。
- Right：[PCI-PD-011 历史研究](docs/08_Execution/PCI-PD-011-Right-Sixth-Commercial-Scenario-Decision-Package.md)（已接收，未接入，不再推进）
- 产品实现合同：`docs/07_Product_Architecture/20_MVP_PRD_VS01.md`
- VS-02 产品实现合同：`docs/09_Engineering_Governance/35_VS02_Paid_Service_PRD.md`
- 执行台账：`docs/08_Execution/21_Prototype_Execution.md`
- 当前项目控制：`docs/08_Execution/25_Project_Control_Baseline.md`
- 历史暂停交接：`docs/08_Execution/22_Project_Handoff.md`
- 工程治理：`docs/09_Engineering_Governance/22_Engineering_Governance.md`
- VS-02 工程治理增量：`docs/09_Engineering_Governance/36_Engineering_Governance_Delta.md`
- Provider 外部资格：`docs/09_Engineering_Governance/35A_Provider_Qualification_Dossier.md`
- 技术架构决策：`docs/09_Engineering_Governance/23_Technology_Architecture_Decision.md`
- 技术架构落地规划：`docs/09_Engineering_Governance/24_Technology_Architecture_Implementation_Plan.md`

PCI-ENG-012 已落实 Founder 的三应用架构：`apps/api` 为共享后端，`apps/web-v2` 为唯一活动
Creator Web，`apps/admin-web` 为独立 Operations Admin Web。`apps/web` 和 `apps/api-mock`
已退休并移出活动工作区，不再开发。当前实现事实不等于生产批准。

Admin 最初以七页导航壳交付；当前独立 BFF 已接入受控 Operations 登录及管理入口。架构来源见
[121 — Operations Admin Web Architecture](docs/09_Engineering_Governance/121_Operations_Admin_Web_Architecture.md)。
Operations Human/Machine 领域合同见
[122 — Operations Identity Domain Contract](docs/09_Engineering_Governance/122_Operations_Identity_Domain_Contract.md)；纯领域合同不接入认证或 Admin API。
Operations Principal 持久化基线见
[123 — Operations Identity Persistence Baseline](docs/09_Engineering_Governance/123_Operations_Identity_Persistence_Baseline.md)；仅记录三张表、Repository 和本地 PostgreSQL 验证，不代表认证、生产或真实资金授权。
PCI-ENG-015-A 已接受；PCI-ENG-015-B-R2 已完成持久化完整性修复与两轮 PostgreSQL 验证，
但仍保持 `IMPLEMENTED / ACCEPTANCE_PENDING`，不代表认证、生产或真实资金授权。
旧测试分类、保留方式和门禁变化见[历史测试清单](tests/historical/retired-reference-client/README.md)。

PCI-ENG-006 的 [TypeScript 质量门禁基线](docs/09_Engineering_Governance/117_TypeScript_Quality_Baseline.md)
记录了各门禁的完整范围、排除项和遗留错误。`pnpm typecheck:active` 验证当前服务端、Creator Web 与 Admin Web；
`pnpm typecheck:tests` 和 `pnpm typecheck:web-v2:tests` 分别验证根测试与 Web V2 测试/E2E 类型；
`pnpm typecheck:historical:backend` 和 `pnpm typecheck:historical:tests` 保留其余历史范围；
退休 Web 的独立编译入口已移除。
原始 `pnpm typecheck` 命令保留；其历史问题未在本次任务全面关闭。active 通过不代表根门禁、全仓库质量或生产验收通过。

PCI-ENG-007 的 [活动测试类型基线](docs/09_Engineering_Governance/118_Active_Test_TypeScript_Baseline.md)
逐条分类了 57 条测试诊断。`pnpm typecheck:active-tests` 检查当前 Backend、根目录 Web V2
测试、Web V2 原生测试和 Admin 测试；`pnpm test:web-bridge` 在 jsdom 中执行根目录的当前 Web 测试。
`pnpm typecheck:historical` 会执行全部历史范围并保留失败。原始根和混合测试命令均未替换。

## 技术基线

- Node.js 22
- TypeScript
- pnpm
- Vitest
- ESLint
- Prettier
- GitHub Actions
- Fastify 5
- TypeBox
- OpenAPI 3
- PostgreSQL + Drizzle
- `apps/api` 自建账号认证（PostgreSQL、scrypt 和会话令牌）；旧 Supabase Adapter 仅供遗留组件使用
- Next.js 16 + React 19
- Tailwind CSS + shadcn/ui 基线
- openapi-typescript + openapi-fetch
- Playwright + 系统 Edge

## 常用命令

### 工作台本地启动

工作台前端位于 `apps/web-v2`，后端使用 `apps/api` 和 PostgreSQL。以下示例使用 PowerShell，
在仓库根使用 Node.js 22 和 `package.json` 固定的 pnpm `10.22.0`，先运行
`pnpm install --frozen-lockfile`。使用隔离的 PostgreSQL（已有容器基线为 PostgreSQL 17）。
`.env.example` 解释本地变量；以下 API/迁移命令从进程环境读取值，不会自动导入根 `.env`。
先确认数据库目标和迁移历史；空库需要先满足 Operations bootstrap 的 `operations_private`
前置条件（迁移 `0040`），不要把普通 `db:migrate` 当作生产安装器。数据库角色和受控初始化见
[数据库准备](deploy/production-database.md)。

```powershell
$env:DATABASE_URL = 'postgresql://postgres:postgres@127.0.0.1:5432/personal_commerce'
$env:JWT_SECRET = '<至少 32 字节的随机密钥>'
$env:OPERATIONS_ACCESS_TOKEN = '<至少 16 字符的随机令牌>'
$env:OPERATIONS_OPERATOR_ID = 'local-operator'
$env:API_PORT = '8080'
$env:WEB_REFERENCE_CLIENT_ORIGIN = 'http://localhost:3000'
$env:REAL_MONEY_ENABLED = 'false'
$env:GOODS_FIRST_SLICE_ENABLED = 'false'
pnpm db:migrate
pnpm dev:api
```

另开一个 PowerShell 窗口启动 Creator Web。在该进程设置 Creator BFF 的服务端
`CREATOR_BFF_DATABASE_URL` 和至少 32 字节的 `CREATOR_BFF_SESSION_SECRET`（本地可分别回退到
`DATABASE_URL` 和 `JWT_SECRET`）。需要 BFF 注销时，API 与 Creator BFF 配置相同的独立
`CREATOR_BFF_REVOCATION_SECRET`。不要用 `NEXT_PUBLIC_` 传递任何秘密。

```powershell
$env:NEXT_PUBLIC_API_BASE_URL = 'http://localhost:8080'
pnpm dev:creator-web
```

打开 `http://localhost:3000/dashboard`。Supabase 和 mock 中的既有账号不会自动迁移到自建认证；
当前自建认证已包含密码找回 API 和前端流程。没有邮件 Provider 时，系统报告 delivery unavailable，
不把本地实现解释为外部邮件交付或生产验收。

另开一个 PowerShell 窗口启动 Admin Web（页面可以独立启动；联通的 Operations 流程仍需适当初始化与授权）：

```powershell
$env:ADMIN_API_ORIGIN = 'http://localhost:8080'
$env:ADMIN_WEB_ORIGIN = 'http://127.0.0.1:3002'
pnpm dev:admin-web
```

分别构建三个应用：

```powershell
pnpm build:api
pnpm build:creator-web
pnpm build:admin-web
```

已构建的 API 用 `pnpm start:api`，两个 Web 应用分别用 `pnpm --filter web-v2 start`
和 `pnpm --filter admin-web start`。`pnpm test:contracts`、`pnpm test:creator-web` 和
`pnpm test:admin-web` 是相应应用的定向验证入口；`pnpm test:acceptance:browser` 需要浏览器和受控 API fixture。
`dev:web` / `build:web` / `web:typecheck` 是 Creator 兼容别名；默认 `dev` / `start` 指向 API。
`verify:admin-web` 用虚构服务端密钥标记构建并检查浏览器产物，不连接数据库。

### 部署入口与限制

现有 [Compose 配置](deploy/compose.production.yml) 使用仓库根作为三个镜像的构建上下文。API 和
Creator Web 独立构建；Admin 通过 `operations-admin` profile 独立构建和启用。运行依赖专用
PostgreSQL、迁移与角色授予、服务端身份/会话配置；真实环境还需要正确配置 HTTPS 和对外 Origin。
邮件仅在启用密码恢复交付时需要邮件 Provider。部署模板为 `deploy/.env.production.example`；已有卷由
[受控安装器说明](deploy/production-database.md)约束，不使用通用 `pnpm db:migrate` 代替部署门禁。

本地构建与 Compose 配置可用性不等于生产就绪。`pnpm typecheck:core` 的既有 Operations 类型错误、
完整 `pnpm check:openapi` 的未闭合状态，以及 `pnpm preflight` 中缺少历史设计令牌输入均不在本次补修范围。
不授权生产部署、外部 Pilot、Goods 开放或真实资金；`REAL_MONEY_ENABLED=false`。

开发 API 以 `APP_ENV=development` 启动时，需要 `DATABASE_URL`、`JWT_SECRET` 和上述运营认证配置。

VS-01 Regression 验证的是 Identity、Offering、Publish、Share、Request、Confirm / Decline、
Public Result、状态机与权限语义稳定，不要求仓库隔离或删除合法 VS-02 能力。

2026-08-16 当前验证证据：

- Vitest：205 passed / 10 条件 skipped；
- System Edge：20 passed / 2 条件 skipped；
- VS-01 focused Playwright：1 passed；
- VS-02A focused Playwright：1 passed；
- VS-02E focused Playwright：1 passed；
- VS-02E PostgreSQL Browser acceptance：1 passed（临时 PostgreSQL 17、12 migrations）；
- VS-02B Provider contract：3 passed；
- VS-02C WeChat adapter contract：4 passed；
- VS-02E 基线镜像 API `ee4ab0452044…` 和 Web `983107bfa548…` 通过当时的 11 migrations、Health、
  Readiness、OpenAPI/Web Smoke、Backup、Restore 与 Rollback Smoke；DEC-013 后源码已通过 12 migrations
  和完整 Preflight，但本任务未重新构建部署镜像；
- 完整证据与非 PASS 原因见 `docs/08_Execution/21_Prototype_Execution.md`。

不得自动启用真实资金。必须先完成 Provider Qualification Evidence Package、真实账户与签名
验证、Founder Activation Checklist 和 `39` 独立 Go / No-Go；当前 `REAL_MONEY_ENABLED=false`，
不得加载真实生产凭据、执行真实 KYC 或发起真实 Payment / Settlement / Withdrawal。
