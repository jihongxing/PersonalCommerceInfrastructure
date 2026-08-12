# Database Governance Rules

- 数据库资产不得定义新的产品行为、状态或权限。
- Schema 只服务已批准的持久化需求；不得提前创建 Deferred Object 表。
- 所有变更必须通过版本化 SQL Migration。
- 禁止在共享环境使用未经审查的 Schema Push。
- ORM 类型不得进入 `modules/` 或 `applications/`。
- 破坏性迁移必须记录数据迁移、回滚和恢复策略。
