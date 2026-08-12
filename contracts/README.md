# Cross-client Contracts

`contracts/` 存放客户端与传输层共享的跨端契约。

本目录未来可以包含：

- API 输入输出 Schema；
- 稳定业务错误码；
- OpenAPI 生成输入或产物；
- 客户端生成所需的协议类型；
- Canonical Event 的公开合同引用。

本目录不得包含：

- 领域状态机或产品规则；
- Application Service；
- 数据库、ORM 或 Provider 类型；
- Web、App 或小程序专属组件；
- 页面状态或客户端本地状态。

依赖方向：

```text
contracts/
    → no business implementation layer
```

Contract 可以复述已批准的跨端数据语义，但不能导入 `modules/` 并把领域内部类型直接暴露给客户端。

CU-TA-03 已建立首个跨端系统 Contract：

- API 版本：`v1`；
- API Base Path：`/api/v1`；
- Health / Readiness Response；
- 统一 Error Envelope；
- 必需 Correlation ID；
- OpenAPI 3 文档生成。

当前 Contract 只覆盖工程运行 Route，不包含任何 VS-01 产品 Route。产品 Contract
只能在对应 M2–M7 Change Unit 中按 Application Use Case 与 `FR-###` 加入。
