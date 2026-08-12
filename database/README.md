# Database Assets

`database/` 存放 PostgreSQL Schema、版本化 SQL Migration 和迁移元数据。

当前已批准的持久化范围包括：

- `product_events` Append-only Canonical Event Store。
- M2 的 `commerce_identities` 与 `creator_capabilities`。
- M3 的 `service_offerings` Draft Offering 与最小可请求条件。

后续客户关系、商业决策、交易结果与履约相关对象
仍未建立持久化表。这些对象只能随对应 M5–M7 用例和 Repository Adapter 按需加入。

## Migration 规则

```powershell
pnpm db:generate
pnpm db:check
pnpm db:migrate
```

- `db:generate` 生成待审查 SQL；
- `db:check` 验证 Schema 与 Migration 文件；
- `db:migrate` 只在已配置 `DATABASE_URL` 的受控环境执行。

共享或真实环境禁止使用无审查的 Schema Push。
