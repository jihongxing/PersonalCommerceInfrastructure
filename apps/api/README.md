# API Runtime

`apps/api` 是跨端 HTTP API 的独立组合根。

当前 CU-TA-03 只提供：

- `/api/v1/health`；
- `/api/v1/readiness`；
- `/openapi.json`；
- 统一错误 Envelope；
- Correlation Header；
- Fastify + TypeBox + OpenAPI 运行时组合。

本应用当前不提供任何 VS-01 产品 Route，也不实现 `FR-001–FR-053`。

未来产品 Route 必须：

1. 对应唯一 Application Use Case；
2. 对应明确 `FR-###`；
3. 使用 `contracts/` 中的 Transport Schema；
4. 不直接调用 Repository 或修改领域状态；
5. 不把 Fastify 类型传入 Application 或 Domain。
