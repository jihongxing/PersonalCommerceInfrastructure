# API Runtime Rules

- API Route 只负责 Transport 校验、Actor Context 组装、Application 调用与序列化。
- 认证凭据必须通过 Auth Adapter 转换为统一 Actor Context；Route 不信任客户端提交的 Owner ID。
- 禁止 Route 直接访问数据库、Repository 或 Provider SDK。
- 禁止在 API 层定义新的产品对象、状态、权限或 Canonical Event。
- 新增产品 Route 必须追溯到 `FR-###`、Application Use Case 和 Contract 测试。
- `health`、`readiness` 与 OpenAPI 属于工程运行能力，不代表产品功能完成。
