# 44 — Membership First Slice Product Contract

依据 [FD-PCI-MEMBERSHIP-FIRST-SLICE-001](43_Membership_First_Slice_Founder_Decision.md) 和 PCI-PD-004 §B。适用范围仅为无费用固定期的线下创作者空间会员；VS-01 合同不变。

- **供给与接受**：供给方管理自有空间的 Offering，公布空间信息、会员待遇、条款及固定期限；申请按消费者本人明确接受的已发布条款版本记录。
- **关系与资格**：供给方现场核对本人和申请后批准。待审批不是会员；批准建立有明确起止时间的 Membership。有效期按批准时点和接受条款计算，以服务端时间判断自然到期。Membership 是关系，不是 Right Grant。
- **使用与更正**：供给方资格核验与实际入场各自留痕，每次入场独立记录。误登记只能进行有理由且可追溯的更正，不开放续期、期限编辑或无权跨主体更改。
- **运营**：使用现有 Admin、Operations Human 和审计。暂停禁止新申请与审批，不阻断存量资格或入场；恢复重新开放。场景运营状态不得代替 Membership 生命周期。业务未接入前不可开启。
- **追溯与验收**：可从申请的条款接受追溯批准、关系、核验及实际入场；这些记录不伪造支付或 Service Order。完整验收按 PCI-PD-004 §B6 在隔离 API、Admin BFF 和 PostgreSQL 上执行。

实施登记：[`DEV-094 / PCI-PD-004`](../08_Execution/21_Prototype_Execution.md#dev-094--pci-pd-004--membership-first-slice)。
