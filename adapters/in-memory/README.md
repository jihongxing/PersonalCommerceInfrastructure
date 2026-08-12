# In-memory Adapters

本目录提供 Application Port 的测试与组合验证实现。

当前包含：

- Fixed Clock；
- Sequential ID Generator；
- In-memory Entity Repository；
- In-memory Product Event Store；
- In-memory Unit of Work。

这些 Adapter 的目的仅是验证：

- Application Core 不依赖数据库或 Provider；
- 状态变化与 Canonical Event 可以共同提交；
- 操作失败时测试状态和事件可以共同回滚。

它们不是生产持久化方案，不提供跨进程一致性、并发控制、耐久性或恢复保证。
PostgreSQL Transaction 与真实 Repository Adapter 必须在 CU-TA-04 中单独实现和验证。
