# 37 — C5 D01–D04 Founder Decisions

> Authority：Founder Decision
> Status：D01–D04 = **FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY**
> Recording date：2026-11-17（本任务环境日期）
> Implementation：**NOT AUTHORIZED**

## 1. 来源、批准对象与文档权威

批准来源是本次主控指令 **PCI-ENG-020-C5 — D01–D04 Founder Decision Sync & D05–D09 Second-Round Preparation** §2–§4：Founder 已全部接受 Main Controller 对 D01–D04 提议的完整方向，并授权正式登记。本文件按该完整方向登记，不把批准缩减为候选字母，也不把研究者的其他推荐一并升级为决定。

本文件是四项 Founder Decision 的仓库引用点；引用标识为 `PCI-ENG-020-C5 / D01` 至 `PCI-ENG-020-C5 / D04`。D01–D12 原为 C5 研究条目，本次只有 D01–D04 获得明确批准；未另行提供父 FD 编号、独立签署件或单独批准日期，故不创造这些信息。`37` 是文档序号，不是新 FD 编号。记录日期不冒充独立签署日期。

研究依据是已验收的 [C5 原始研究及 Founder Decision Package](../09_Engineering_Governance/PCI-ENG-020-C5-Global-Commercial-System-Abstraction-and-Shared-Transaction-Infrastructure-Research-and-Founder-Decision-Package.md) §2–§7、§11、§16–§17。原报告中“所有推荐尚未批准”保留为提交时的历史状态；当前仅 D01–D04 的批准状态由本文件补充，不覆盖原研究结论，也不批准整份目标架构或路线图。

相关治理来源：

- [C3-E 权威基线与冻结登记](../09_Engineering_Governance/PCI-ENG-020-C3-E-Project-Documentation-Baseline-and-Freeze-Register.md)：仍按原范围有效；不回写历史快照。
- [FD-C4A-R1-01 / F01–F04](./36_Global_Commercial_Supply_Foundation_Decisions.md)：概念词汇、价值来源及责任角色冻结继续有效。
- [Identity / C-number 决定](./29_Identity_Owned_Commerce_Reference_Decision.md)：Identity、Profile 与公开商业引用边界继续有效。
- [VS-01 合同](./20_MVP_PRD_VS01.md)：现有产品和正式修订均不改变。
- [Control25](../08_Execution/25_Project_Control_Baseline.md) §15 登记本次决定；[执行与验证报告](../09_Engineering_Governance/PCI-ENG-020-C5-D01-D04-Decision-Sync-and-Verification-Report.md) 记录同步证据。

## 2. D01 — Global System Abstraction

**FOUNDER APPROVED：Shared Commercial Facts Infrastructure + Six Independent Domain Expressions。**

PCI 建立共享商业事实基础设施，同时保留 **Service、Goods、Program、Membership、Project、Right** 六类商业供给各自独立的领域语义。共同基础设施使跨领域事实能够关联和追溯，不以六套互不相通的系统作为全局抽象，也不把六类领域压缩为一个万能商业对象。

统一基础设施不意味着统一全部领域模型、生命周期、状态机或履约规则。共享哪些具体事实、由谁写入、如何接入，需要后续有界决策；“基础设施”一词不预先确定模块、聚合、数据库或部署拓扑。

**冻结边界**：共同商业事实基础与六类独立领域表达并存的概念原则。

**未决 / 非授权**：Shared Core 具体写入职责、共享实体、事实 Schema、事务边界及 SYS-A/B/C 的工程选型；D05–D09、D10 的具体答案均未由本项自动批准。

**来源**：本次指令 §2 D01；C5 §2–§3、§6、§11、§16 D01。

## 3. D02 — Identity and Contextual Participants

**FOUNDER APPROVED：Contextual Participant Model。**

同一用户身份可以参与六类商业交易。Buyer、Provider、Payer 等参与角色由具体交易上下文确定，不固化为用户全局身份属性；一个主体可在不同上下文兼任或分担不同角色，不为六类供给建立互不相通的用户身份体系。

交易参与角色与操作授权必须区分。Buyer 不必是 Payer、Recipient 或实际体验者，Provider 角色也不自动证明其拥有全部供给或权利。Account、Identity、Profile、公开 C 号仍按现有决定解释，不因跨领域参与而合并或改写历史命名空间。

**冻结边界**：共享身份引用下的上下文参与者方向，以及禁止以永久用户角色替代具体交易关系的原则。

**未决 / 非授权**：组织/代表机制、Party 或 Provider 实体、角色授权模型、身份关系基数、最终 Owner Anchor。不得修改现有认证、Creator / Operations 身份隔离、Session、权限或 BFF。

**来源**：本次指令 §2 D02；C5 §4、§7 T03/T10/T12/T13、§16 D02；FD-F04 与 Identity / C-number 既有决定。

## 4. D03 — Domain Models and Common Protocol

**FOUNDER APPROVED：Professional Domain Models + Common Protocol。**

六类商业供给保留各自专业领域模型，通过共同协议接入 PCI 共享基础设施。共同协议使引用、事实及其语义边界能够协作，不使各领域重复建设六套互不相通的基础设施。

不得将六类供给简单实现为六种 Service Template，也不得强迫所有领域采用同一种状态机、承诺结构或履约流程。服务执行、商品交付、项目验收、会员期间、计划参与和权利授予必须保留专业解释；共同展示不能制造领域成功事实。

**冻结边界**：专业领域模型与共同接入协议并存的概念方向。

**未决 / 非授权**：共同协议字段、API、DTO、事件、领域聚合、各域状态机、事务与部署结构，以及配置和领域定义的具体实现。协议方向不构成协议设计批准。

**来源**：本次指令 §2 D03；C5 §3、§6、§7 T04/T05/T06、§16 D03。

## 5. D04 — Shared References and Typed Domain Definitions

**FOUNDER APPROVED：Shared Stable References + Typed Domain Definitions。**

共享层提供稳定商业引用，领域层负责定义具体供给类型及其语义和不变量。共享引用支持跨领域识别与追溯，不把所有专业定义放进无类型扩展数据，也不让共同目录代替领域事实权威。

本决定**不确定唯一 Offering Owner Anchor，不确定共享写入实体，也不授权将所有领域数据归并为一个统一可写聚合**。共享引用不证明引用对象的所有权，也不改变 C 号持有者、Profile 表达与历史 creatorId 的语义。

**冻结边界**：共享稳定商业引用与有类型领域定义的职责区分。

**未决 / 非授权**：引用编码、版本对象、持久化模型、共同目录是否仅为投影、共享可写 Envelope、Offering 与领域对象基数、Owner Anchor。C5 对窄 TX-B / SYS-B 的条件性建议仍不是已批准架构。

**来源**：本次指令 §2 D04；C5 §5、§7 T14、§11、§16 D04；FD-F01/F04。

## 6. 总授权边界与既有兼容约束

D01–D04 只冻结上述概念抽象原则，**不授权**：

- 数据库表、字段、关系、Schema、Migration 或历史数据改写。
- 唯一 Offering Owner Anchor、Shared Core 具体写入职责、统一可写 Offering / Order / Transaction 实体。
- 资金账本实现，API、DTO、规范事件、领域聚合、状态机或架构实施。
- 代码实现、VS-01 重构、认证/身份/Session/BFF 调整。
- 外部 Pilot、Production、真实资金运行、支付/结算/退款功能启用。

FD-C4A-R1-01 F01–F04 继续按原范围冻结；不因此批准 C4-B S2/P2 或关闭此前未决议题。全球 Capability 可选原则不绕过 VS-01 的受控 Capability / Template 门禁。Identity 持有 C 号不推出 Offering 所有权；历史 creatorId 不改义。

C3-D、C3-E/R1、C4-A、C4-B、C5 原始研究与证据不重写。现有 VS-01、FD-020-BD-01 Fulfillment Code / QR / Fulfillment Confirmation、FD-020-C3-BD-01 限定 Appearance、Request Confirm / Decline、Creator Session / BFF 与上游撤销语义保持原合同和批准边界。没有产品行为变化，不新增 DEV 产品偏差。

## 7. 后续决策状态

| 范围           | 当前状态                             | 本次效力                                                                                                                                               |
| -------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D01–D04        | FOUNDER APPROVED                     | 仅本文件登记的完整概念方向                                                                                                                             |
| D05–D09        | PROPOSED / AWAITING FOUNDER DECISION | [第二轮建议](../09_Engineering_Governance/PCI-ENG-020-C5-D05-D09-Second-Round-Founder-Decision-Preparation.md)，待 Main Controller 审阅及 Founder 裁决 |
| D10–D12        | DEFERRED                             | 不提前设计或启动实施任务                                                                                                                               |
| IMPLEMENTATION | NOT AUTHORIZED                       | 本次只有决策同步与有界准备                                                                                                                             |

后续裁决须另行明确范围并保留来源；研究验收、概念批准和工程实施授权分别记录。
