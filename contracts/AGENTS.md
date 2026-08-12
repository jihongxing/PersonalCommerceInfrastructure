# Contract Layer Rules

- Contract 必须保持客户端和 Provider 无关。
- 禁止依赖 `modules/`、`applications/`、`adapters/` 或 `apps/`。
- 禁止出现 React、Next.js、Fastify、Drizzle 或 Supabase 类型。
- Contract 变更必须说明对应 Application Use Case、`FR-###` 和兼容性影响。
- Contract 不能定义新的产品状态、权限或 Canonical Event。
