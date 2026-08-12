# Auth Adapter 工程规则

- Auth Adapter 只能把外部认证凭据映射为统一 `ActorContext`。
- Provider User / Subject 不得自动等同于 Creator、Customer 或其他产品对象。
- Supabase SDK 只能存在于 `adapters/auth/supabase`。
- Creator 映射必须通过 `CreatorActorResolver` Port 注入。
- Token、密钥和 Provider 原始错误不得进入日志或业务错误响应。
- 测试身份必须通过可替换 Adapter 提供，不得在 Application / Domain 中写测试分支。
- Auth Foundation 不创建 Creator、Identity、Session 持久化表或 CRM 能力。
