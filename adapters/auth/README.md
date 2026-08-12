# Auth Adapter

`adapters/auth/` 将外部认证凭据转换为 Application 层可消费的 `ActorContext`。

## 边界

- `supabase/` 只负责调用 Supabase Auth 验证 Access Token；
- `testing/` 提供可替换的测试身份；
- `transport/` 只负责解析 HTTP Bearer Token；
- Creator 映射通过 `CreatorActorResolver` Port 注入；
- Supabase User 不自动等同于 Creator；
- Access Token、Provider 错误细节和密钥不得进入日志；
- Auth Adapter 不创建 Creator、Identity 或其他产品对象。
