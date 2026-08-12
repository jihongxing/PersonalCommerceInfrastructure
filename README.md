# Personal Commerce Infrastructure

当前仓库已完成 VS-01 受控原型，并进入 M9 Deployable Prototype Hardening 工程阶段。

当前版本：`0.1.0`  
当前交付状态：`Prototype Ready`

## 工程事实源

- 产品实现合同：`docs/07_Product_Architecture/20_MVP_PRD_VS01.md`
- 执行台账：`docs/08_Execution/21_Prototype_Execution.md`
- 工程治理：`docs/09_Engineering_Governance/22_Engineering_Governance.md`
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

VS-01 的 M1–M8、FR-001–FR-053 与 AT-001–AT-013 已完成。最终验证为：

- Vitest：147 tests，139 passed / 8 条件 skipped；
- System Edge：16 passed / 0 skipped；
- Web Production Build、格式、Lint、类型、迁移和治理检查通过。

下一阶段不得自动扩展产品能力。工程重点是把已通过验收的原型加固为可部署、可迁移、
可观测、可恢复且能够安全升级的运行系统。
