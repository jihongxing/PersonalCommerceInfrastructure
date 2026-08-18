# 39A — VS-02D Controlled Real-Money Activation Readiness

> **Status**: Frozen — Engineering Readiness READY
> **Decision Date**: 2026-08-16
> **Engineering Readiness**: READY
> **Real Money Activation**: MANUAL FOUNDER GO REQUIRED
> **Provider Qualification**: External Parallel Track
> **Implementation Authority**: `VS-02D-READY-001` / `DEV-011`

## 1. Decision Boundary

本文件只授权真实资金激活前的内部工程准备，不授权真实交易。它补充
`39_VS02D_Controlled_Real_Money_Integration.md`，不取代其中的 Provider Qualification、
首笔真实资金 Go / No-Go、真实账户、真实凭据和交易证据要求。

```text
Engineering Readiness = internal code, tests, runtime controls and runbooks
Real Money Activation = separate manual Founder GO
Provider Qualification = separate external evidence track owned by 35A
```

Provider Qualification 未完成不阻塞内部工程准备；但未完成时不得启用真实支付、结算或提现。

## 2. Runtime Environments

| Environment  | Purpose                                              | Real-money default               |
| ------------ | ---------------------------------------------------- | -------------------------------- |
| `local`      | 本地开发和 PostgreSQL 集成                           | Disabled                         |
| `test`       | 自动化测试、Reference Provider、Controlled Transport | Disabled                         |
| `controlled` | 未来第一笔真实交易的专用受控环境                     | Disabled until manual Founder GO |
| `production` | 后续生产运行环境                                     | Disabled until manual Founder GO |

旧 `APP_ENV` 继续控制应用运行模式；`RUNTIME_ENV` 单独表达真实资金运行边界。配置 Secret 本身不构成激活。

## 3. Real-Money Kill Switch

- `REAL_MONEY_ENABLED` 默认 `false`；
- Live Payment、Live Settlement、Live Withdrawal 在关闭时全部拒绝；
- Reference Provider、Test Transport、Sandbox 和 Controlled Facts 不受误伤；
- 激活只能来自 Founder-approved deployment/runtime control；
- Creator、Customer 和前端没有读取、写入或切换此开关的 API；
- 启动时必须记录环境、开关状态、Provider ID 和 Founder Activation Reference，但不得记录 Secret；
- Secret 已加载但开关未开启时仍拒绝 Live Commerce；
- 开关关闭后阻止新的 Live operation，不覆盖既有订单、账本或已记录 Provider Fact。

## 4. Provider Production Configuration Boundary

未来 Live Provider 必须显式配置：

- Provider URL；
- Merchant / Account Mapping；
- API Credentials；
- Webhook Secret；
- Provider Environment；
- Currency；
- Region。

未配置、部分配置、配置不合法或缺少 Founder Activation Reference 时，Live Commerce 必须安全拒绝。
Real Payment 不得 fallback 到 Reference Provider、Sandbox 或 Test Transport。

当前仓库不得包含真实 Provider Secret、卡号、CVV、KYC 文件或真实账户标识。

## 5. Webhook Runtime Boundary

真实 webhook 结构冻结为：

```text
Provider Payload
→ Signature Verification Port
→ Provider Event Receipt
→ Provider Event Normalization Port
→ Verified Provider Fact
→ Provider Fact Receipt / Replay Guard
→ Application Policy
→ Money Domain
```

- Provider-specific 签名算法未确认前，只实现 Port 和安全拒绝 Adapter；
- 未签名、签名无效或 verifier 未配置的事件必须拒绝；
- Provider Event ID 与 payload digest 建立 receipt；
- 同一 Event ID、同一 payload、已处理时返回幂等；
- 同一 Event ID、不同 payload 必须冲突拒绝；
- 已接收但应用未完成的事件允许安全重试；
- Receipt 不保存卡号、CVV、Provider Secret 或敏感认证凭据。

## 6. Payment, Settlement and Withdrawal Guards

### Payment

- Test Payment 只能通过 Reference Provider / Controlled Transport；
- Real Payment 只能通过显式 Live Provider Adapter；
- 缺少 Live Provider 配置或 kill switch 关闭时拒绝；
- Customer payload、前端状态或 Controlled Fact 不得伪造成 Provider Payment Fact。

### Settlement

- Controlled Settlement 与 Provider Settlement Fact 必须明确区分；
- `PaymentSucceeded` 不等于 `SettlementSucceeded`；
- 没有 Verified Provider Settlement Fact，不得释放 Creator Available Earnings；
- Settlement fee calculation 继续遵守现有 Money Flow Contract。

### Withdrawal

- Withdrawal Intent 可保持 Pending / Awaiting Provider；
- 没有 Verified Provider Withdrawal Fact，不得进入 `Withdrawn` / completed；
- Provider failure 只能进入现有失败或阻塞路径；
- Wallet Projection 和 append-only Earnings Ledger 不得被 Provider payload 覆盖。

## 7. Founder Activation Checklist

- [ ] Primary Provider selected
- [ ] Provider account approved
- [ ] Creator account mapping approved
- [ ] Platform fee confirmed
- [ ] Settlement path confirmed
- [ ] Refund / dispute responsibility accepted
- [ ] Live credentials loaded securely
- [ ] Live webhook verified
- [ ] REAL_MONEY_ENABLED is still false
- [ ] Monitoring active
- [ ] Kill switch tested
- [ ] Transaction evidence capture active
- [ ] Founder gives explicit GO

该 Checklist 是运行条件，不是产品逻辑。未全部完成时保持未勾选，不阻塞本文件授权的内部工程准备。

## 8. First Real Transaction Runbook

### Pre-flight

1. 确认 35A Provider Qualification 已通过且 `39` 独立 Go / No-Go 为 GO；
2. 确认受控环境、数据库备份、监控、日志、Request ID 和证据捕获可用；
3. 确认 Live Provider、账户映射、费用、结算、退款和争议责任；
4. 保持 `REAL_MONEY_ENABLED=false`，验证 kill switch 拒绝 Live Payment；
5. Founder 审阅并逐项签署 Activation Checklist。

### Enable Live

1. Founder 给出可审计的明确 GO reference；
2. 通过受控 Secrets 管理加载 Live credentials；
3. 在 `controlled` 环境启用 `REAL_MONEY_ENABLED=true`；
4. 验证启动审计记录和 Live Provider readiness；
5. 只允许一个预先批准的 Order 进入 Live Payment。

### One Transaction

1. Create one Order；
2. Customer Payment；
3. Verify signed Provider Fact；
4. Verify Provider Settlement Fact；
5. Verify immutable Ledger entries；
6. Verify Wallet Projection；
7. Capture the complete evidence package；
8. 如执行 Withdrawal，必须等待 Verified Provider Withdrawal Fact。

### Disable / Kill Switch

1. 第一笔交易验证完成后立即关闭新的 Live Payment；
2. 对任何签名、金额、账户、Settlement、Ledger 或 Wallet 异常立即 kill；
3. 保留既有事实与账本，不执行覆盖或伪造补偿；
4. 记录关闭时间、操作者、原因和关联 Evidence Reference。

## 9. First Transaction Evidence Schema

证据包必须能够关联：

- Order ID；
- Payment ID；
- Provider Reference；
- Settlement Reference；
- Creator；
- Customer；
- Offering；
- Gross Amount；
- Provider Fee；
- Platform Fee；
- Creator Net；
- Payment Timestamp；
- Settlement Timestamp；
- Ledger Entries；
- Wallet Projection；
- Withdrawal Reference；
- Audit References。

禁止保存：

- 卡号；
- CVV；
- Provider Secret；
- API Credential；
- Webhook Secret；
- 敏感 KYC 或认证材料。

## 10. Completion Rule

只有代码、Migration、测试、完整回归、当前源码部署验证和 Execution Evidence 全部通过后，才可更新为：

```text
VS-02D Engineering Readiness = READY
Real Money Activation = MANUAL FOUNDER GO REQUIRED
Provider Qualification = External Parallel Track
No Real Money Evidence
```

即使 Engineering Readiness 为 READY，`REAL_MONEY_ENABLED` 仍必须保持 `false`，Founder Checklist
仍保持未勾选，且不得自动进入真实交易。
