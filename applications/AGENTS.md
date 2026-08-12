# Application Layer Rules

- 应用代码只能编排已冻结的业务能力，不能定义新的产品对象或状态。
- 允许依赖 `modules/` 和平台无关的 Node.js / TypeScript 能力。
- 禁止依赖 `apps/`、`adapters/`、`contracts/`、客户端框架、ORM 或 Provider SDK。
- 每个用例必须能追溯到 `FR-###`，并有应用层测试。
- 外部能力只能通过显式 Port 表达。
