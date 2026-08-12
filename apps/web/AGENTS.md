# Web Reference Client Rules

- `apps/web` 是可替换的 Reference Client，不代表产品最终形态冻结为 Web。
- 页面只能通过生成的 API Contract Client 访问后端能力。
- 页面不得导入 `modules/`、`applications/`、`adapters/`、`database/` 或 Supabase SDK。
- 页面不得定义产品状态机、Canonical Event、权限规则或业务对象。
- API Base URL 必须可通过运行环境替换，不能硬编码生产地址。
- 当前只建立路由和运行基础，不实现完整 VS-01 产品流程。
