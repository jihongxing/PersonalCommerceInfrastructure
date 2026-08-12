# Application Layer

`applications/` 是平台无关的应用用例与 Port 边界。

本目录未来可以包含：

- Application Command / Query；
- 用例编排；
- 用例级授权；
- Repository、Clock、ID、Unit of Work 等 Port；
- 与客户端无关的应用错误。

本目录不得包含：

- React、Next.js、浏览器或小程序代码；
- Fastify Route 或其他传输协议实现；
- Drizzle、Supabase 或其他 Provider SDK；
- 页面、数据库 Schema 或部署配置；
- 未对应 `FR-001–FR-053` 的产品行为。

依赖方向：

```text
applications/
    → modules/
```

CU-TA-02 已建立平台无关的 Application Core：

- `ApplicationError`；
- `ActorContext`；
- `ApplicationUseCase` 合同；
- `Clock`、`IdGenerator`、`EntityRepository`、`ProductEventStore` 与 `UnitOfWork` Port；
- `CanonicalEventRecorder`。

当前仍未加入任何具体 VS-01 Application Use Case。具体用例只能在对应 M2–M7
Change Unit 中按真实 `FR-###` 加入。
