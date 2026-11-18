# 38 — C5 D05–D09 Founder Decisions

> Authority：Founder Decision
> Status：D05–D09 = **FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY**
> Recording date：2026-11-17（本任务环境日期）
> Implementation：**NOT AUTHORIZED**

## 1. 来源、效力与历史保留

批准来源：本次主控指令 **PCI-ENG-020-C5 — D05–D09 Founder Decision Sync & D10–D12 Final Conceptual Decision Preparation** §1–§3。Founder 正式批准 D05、D06、D07、D08、D09，全部接受 Main Controller 建议，无修改意见。本文件登记完整方向，并以该指令列明的冻结内容与明确不批准事项限定效力；不把候选方案的名称或原研究中的条件性推荐一起升级为架构批准。

引用标识为 `PCI-ENG-020-C5 / D05` 至 `PCI-ENG-020-C5 / D09`。`38` 仅为文档序号；未提供新的父 FD 编号、独立签署件或单独批准日期，本文件不创造这些信息。2026-11-17 为仓库登记日期，不冒充独立核验的签署日期。

来源与读取顺序：

- [C3-E 权威基线与冻结登记](../09_Engineering_Governance/PCI-ENG-020-C3-E-Project-Documentation-Baseline-and-Freeze-Register.md)及其 R1：原快照和治理边界保留。
- [FD-C4A-R1-01 / F01–F04](./36_Global_Commercial_Supply_Foundation_Decisions.md)：概念词汇、价值来源与责任角色原则继续有效，不推定其他 C4 项目获批。
- [D01–D04 Founder Decisions](./37_C5_D01_D04_Founder_Decisions.md)：共享商业事实基础设施、上下文参与者、专业领域模型＋共同协议、稳定引用＋有类型领域定义继续有效。
- [C5 原始报告](../09_Engineering_Governance/PCI-ENG-020-C5-Global-Commercial-System-Abstraction-and-Shared-Transaction-Infrastructure-Research-and-Founder-Decision-Package.md) §7–§11、§16–§17，以及 [D05–D09 第二轮准备](../09_Engineering_Governance/PCI-ENG-020-C5-D05-D09-Second-Round-Founder-Decision-Preparation.md)：保留研究及建议原文；当前批准范围以本记录和本次指令为准。
- [Control25](../08_Execution/25_Project_Control_Baseline.md) §16、[同步与核验报告](../09_Engineering_Governance/PCI-ENG-020-C5-D05-D09-Decision-Sync-and-Verification-Report.md)：登记当前效力及文档执行证据。

原报告、前轮准备及历史台账中的 PROPOSED / DEFERRED 是各自提交时状态。只在本次明确范围内补充 D05–D09 的批准与 D10–D12 的准备状态，不回写原文，不追溯宣称当时已经批准，不接受整份 SYS / TX / FIN / REV 架构候选。

## 2. D05 — Transaction / Order Abstraction

**FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY。**

冻结内容：

1. 共同交易关联与事实追溯。
2. 六类领域保留各自专业交易记录及其权威性。
3. 共同交易上下文可以关联参与者、供给来源、接受版本、金额和范围依据。
4. 一次采购可以关联多个领域交易记录。
5. 不要求每个领域都必须创建同名 Order 实体。

明确不批准：**Universal Order、可写 Shared Transaction Envelope、TX-B 作为默认架构、TX-C 的最终架构选型、共享写入权威、固定实体基数或数据库设计。**

共同交易关联不是对共享可写成交对象的隐含承诺；“可以关联多个”不是数据库关系基数设计。领域记录的权威性不能被统一页面或共享状态覆盖。TX-B 与 TX-C 仍可作为后续有界设计比较对象，但本次没有选定其一。

来源：本次指令 §2 D05；C5 §7（尤其 T07 / T12 / T14 / T15）、§16 D05；第二轮准备 D05。

## 3. D06 — Order and Commitment

**FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY。**

冻结内容：

1. Order、Commitment、Fulfillment、Payment 保持语义独立。
2. 一次采购可以关联多个责任或权益事实。
3. Commitment 的成立、颗粒度和变化依据由对应领域的有效接受机制决定。
4. 不按订单行数、SKU 数或付款次数机械生成 Commitment。
5. 共同进度只能是有来源的摘要，不得替代领域履约事实。

明确不批准：**全局 Commitment 数据库实体、统一 Commitment 状态机、一订单行一承诺的全局规则、六类领域统一履约流程。**

Commitment 表达责任或权益事实，不是所有 Request 的通用别名；付款成功也不是领域责任或权益已经成立、已经履行的通用判据。共享摘要需要能返回其领域来源，不能生成新的领域完成事实。

来源：本次指令 §2 D06；C5 §7（T04 / T05 / T07 / T15）、§16 D06；FD-F01 的 Commitment 定义；第二轮准备 D06。

## 4. D07 — Financial and Ledger Boundary

**FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY。**

冻结内容：

1. 共享资金事实及账务追溯。
2. 领域负责应收/应付义务、触发依据和结算条件。
3. 资金来源、分配、退款关联和纠错应当能够追溯。
4. 同一真实资金事实不得因跨领域关联而重复入账。
5. 资金到账不自动证明领域履约或权益授予完成。

明确不批准：**统一钱包、Account Holder 模型、全局会计系统、具体账本/分录/账户/支付/退款/结算/提现实现、真实资金活动启用。**

资金事实可追溯与具体账务方案是两层决定。共享资金证据不能替领域发明收款义务或结算条件，领域也不能因为关联同一付款而各记一份独立余额。原报告中的 FIN 候选、支付提供方及资金账户结构均不因本项获得批准。

来源：本次指令 §2 D07；C5 §8、§7 T07 / T11 / T12 / T14；§16 D07；第二轮准备 D07。

## 5. D08 — Review and Reputation

**FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY。**

冻结内容：

1. 共享评价证据基础设施。
2. 各领域保留自己的评价资格、对象关系、维度、窗口和尺度。
3. Review、Rating、Reputation 三个概念保持区分。
4. Reputation 是基于可追溯评价证据和规则形成的投影。
5. 不将不可比的领域评分简单平均为全球统一评分。

明确不批准：**全局信用分或全球星级、统一评价资格/评价窗口/评价规则、评价公开/删除/申诉及处置功能、现有 UI review 状态迁移为客户评价数据。**

共享的是评价证据的关联与追溯，不是将付款人、购买者和实际体验者无条件视为同一评价主体。Review 证据、按特定尺度表达的 Rating 和规则化 Reputation 投影不能互换。此批准不等于 REV-A、REV-C 或其他存储/投影架构的最终选型。

来源：本次指令 §2 D08；C5 §9、§7 T07 / T12 / T14；§16 D08；第二轮准备 D08。

## 6. D09 — Composite and Cross-Domain Transactions

**FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY。**

冻结内容：

1. 组合交易可以关联多个领域供给、多个 Provider 和多个 Commitment。
2. 供给、提议、交易、履约、资金五个观察层次可以有不同边界。
3. 各领域保留自身责任、有效接受和履约状态。
4. 局部取消或失败不自动抹除其他已经成立或完成的事实。
5. 组成版本、责任、金额分配及局部变化应当可追溯。
6. 整体接受、取消和退款策略由具体组合条款及领域规则解释。

明确不批准：**Bundle / Package 数据库实体、统一组合订单或统一组合状态机、分布式事务/锁/编排/API、自动部分退款/取消/补救功能。**

组合语义不强制所有组成部分全有全无，也不默认全部可独立取消。关联必须能够解释不同领域的既成事实及适用条款；具体策略没有被全局统一，也没有被实现。

来源：本次指令 §2 D09；C5 §10、§7 T07 / T09 / T10 / T11 / T15；§16 D09；第二轮准备 D09。

## 7. D01–D09 共同授权边界与未决事项

D01–D09 **全部仅为 Founder 概念原则批准**。以下事项继续未获授权：

- 数据库 Schema、Migration、数据模型和历史数据修改。
- API、DTO、事件协议和接口实现。
- Shared Core 聚合或写入权威实现；领域聚合及状态机实现。
- 现有 VS-01 重构；Creator / Operations 身份、Session、BFF、权限和认证修改。
- 支付、结算、退款、提现或真实资金功能。
- Pilot、Production 或商业运行。

唯一 Offering Owner Anchor、共享写入权威、固定关系基数、部署拓扑及事务协调均未决定。D10–D12 进入有界准备，不等于批准；[第三轮材料](../09_Engineering_Governance/PCI-ENG-020-C5-D10-D12-Third-Round-Founder-Decision-Preparation.md)仅供 Main Controller 审阅及 Founder 裁决。C4-B 的其他提案、C3-E 已知冲突和 Proposed ADR 不因此自动关闭或转为 Accepted。

现有 [VS-01](./20_MVP_PRD_VS01.md) 及 FD-020-BD-01、FD-020-C3-BD-01 修订完整保留：Request / Creator Confirm / Decline、Fulfillment Code / QR / Fulfillment Confirmation、受控 Capability / Template、限定 Appearance、Creator BFF / Session 及上游注销边界均不改变。不新增产品行为或 DEV 偏差。

## 8. 当前状态

```text
D01–D04 = FOUNDER APPROVED
D05–D09 = FOUNDER APPROVED
D10–D12 = PROPOSED / AWAITING FOUNDER DECISION
IMPLEMENTATION = NOT AUTHORIZED
```

本登记及第三轮建议交付后停止；等待 Main Controller 审阅和 Founder 决定，不自动进入原型、工程设计或实施。
