# Personal Commerce Infrastructure

**为被平台封禁的 Creator 提供永不失效的商业身份**

当前仓库已完成 VS-01 Product Proof、VS-02A Provider-neutral Money Domain、VS-02B Provider
Integration Readiness 和 VS-02E Local Commercial Simulation。VS-02C 微信支付 Adapter 仅完成本地
工程资格化，外部 Provider Qualification 仍为 `CONDITIONAL`。VS-02D 内部 Engineering Readiness
已完成，但 Real Money Activation 仍保持关闭并要求人工 Founder GO。

**核心问题**：地陪、台球助教、占卜师等个人商业者在抖音/小红书/微信因"私域引流"被封号，失去商业入口。

**PCI 解决方案**：通过 Commerce Reference（C号）—— 一个平台无法封禁的商业标识 —— 让 Creator 能在任何平台引流到自己的独立商业页面。

当前版本：`0.1.0`  
当前交付状态：`VS-02E Local Commercial Simulation COMPLETE / No Real Money Evidence`

```text
VS-01 Product Proof                Complete
VS-02A Money Domain                Complete
VS-02B Provider Integration Ready  Complete
VS-02C Provider Adapter            Conditional
VS-02D Engineering Readiness       READY
VS-02D Real Money Activation       Founder GO Required
VS-02E Local Commercial Simulation COMPLETE
```

**No Real Money Evidence.** 当前不存在真实 Customer Payment、真实 Settlement、真实 Creator
Earnings、真实 Withdrawal 或真实 Refund 证据。受控 Test Transport、Fixture、Sandbox 命名和
`pilot_operations` 事实均不得解释为真实商业事实。

## 工程事实源

- 产品方向层 SSOT：`docs/01_Strategy/05_Personal_Commerce_Infrastructure_Product_Direction.md`
- 产品实现合同：`docs/07_Product_Architecture/20_MVP_PRD_VS01.md`
- VS-02 产品实现合同：`docs/09_Engineering_Governance/35_VS02_Paid_Service_PRD.md`
- 执行台账：`docs/08_Execution/21_Prototype_Execution.md`
- 当前交接：`docs/08_Execution/23_2026-08-15_Handoff.md`
- 工程治理：`docs/09_Engineering_Governance/22_Engineering_Governance.md`
- VS-02 工程治理增量：`docs/09_Engineering_Governance/36_Engineering_Governance_Delta.md`
- Provider 外部资格：`docs/09_Engineering_Governance/35A_Provider_Qualification_Dossier.md`
- 技术架构决策：`docs/09_Engineering_Governance/23_Technology_Architecture_Decision.md`
- 技术架构落地规划：`docs/09_Engineering_Governance/24_Technology_Architecture_Implementation_Plan.md`

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
- Supabase Auth Adapter
- Next.js 16 + React 19
- Tailwind CSS + shadcn/ui 基线
- openapi-typescript + openapi-fetch
- Playwright + 系统 Edge

## 常用命令

```powershell
pnpm install
pnpm dev
pnpm dev:api
pnpm dev:web
pnpm web:generate-api
pnpm web:typecheck
pnpm build:web
pnpm test:domain
pnpm test:contracts
pnpm test:acceptance
pnpm test:acceptance:browser
pnpm preflight
```

`pnpm preflight` 依次执行工程治理检查、格式检查、Lint、类型检查、测试、服务端构建、
OpenAPI Client 生成、Web 类型检查和 Next Production Build。
Preflight 还会使用系统 Edge 启动 API 与 Web Reference Client，执行基础浏览器验收。

开发 API 以 `APP_ENV=development` 启动时，必须提供 `DATABASE_URL`、`SUPABASE_URL`、
`SUPABASE_ANON_KEY` 与 `CREATOR_ACTOR_MAPPINGS`。后者是显式的
`"supabase:<provider-user-id>":"<creator-id>"` 映射；Supabase User 不会自动成为 Creator。

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
