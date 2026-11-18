# 36 — FD-C4A-R1-01 — Global Commercial Supply Foundation Decisions

> Decision ID：`FD-C4A-R1-01`
> Founder 决策日期：2026-11-17
> Status / Authority Class：`FROZEN / ACCEPTED — CONCEPTUAL DECISIONS ONLY`
> Authority：Founder Decision；Scope：F01–F04；Implementation Authorization：`NOT GRANTED`
> 当前 C4-A 状态：`RESEARCH ACCEPTED / F01-F04 FROZEN / F05-F11 OPEN`

## 1. 来源、权威与记录范围

原始批准来源是 Founder 于 2026-11-17 在主控会话中提供的正式裁决
`FD-C4A-R1-01 — Global Commercial Supply Foundation Decisions`。
`PCI-ENG-020-C4-A-FD-R1-SYNC` 是仓库同步执行授权，不替代原始 Founder 批准。
本文件是该决定在仓库中的独立权威引用点，不是新研究或独立签署件。

源研究及正式追加登记见
[C4-A Founder Decision Addendum](../09_Engineering_Governance/PCI-ENG-020-C4-A-Global-Commercial-Supply-Definition-Research-and-Founder-Decision-Package.md#founder-decision-addendum--fd-c4a-r1-01)。
执行和验证见
[FD-R1-SYNC 报告](../09_Engineering_Governance/PCI-ENG-020-C4-A-FD-R1-SYNC-Founder-Decision-Repository-Synchronization-Report.md)。
决策索引及当前控制解释见
[Control Baseline §14](../08_Execution/25_Project_Control_Baseline.md#14-fd-c4a-r1-01--global-commercial-supply-foundation-decisions)。

本次四个子项 FD-F01–FD-F04 均属于同一父决定 FD-C4A-R1-01；F01–F11 是原研究议题编号。
不重新评估或扩张 Founder 裁决，不将历史 Proposed ADR、Backlog、研究建议或代码现状作为更高权威。

## 2. FD-F01 — Canonical Vocabulary

**裁决：采纳候选 B。**

1. **Commercial Supply** 表示商业价值来源及其供给体系的概念集合；不因为是全局概念，就要求存在独立生命周期实体或数据库对象。
2. **Commercial Offering / Offering** 是同一概念的全称与简称，不代表两个对象；表达一项可识别、可持续定义和管理的商业供给，是面向市场表达供给的核心概念。
3. **Product** 保留广义商业产品语言，表达面向客户的价值产品化结果；不等同于 Goods，不局限实物，也不因此新增与 Offering 重复的对象。
4. **Proposal / Terms Version** 表达特定对象、范围、时点和条件下的具体提议及条款版本；必须与持续存在的 Offering 概念区分。是否需要独立持久化对象或版本实体暂不决定。
5. **Commitment** 表达依据相应领域有效接受机制形成的责任或权益事实；不将所有 Request 自动视为 Commitment，不强制所有领域采用统一的 Request → Confirm → Fulfilled 生命周期。
6. **Offer** 在历史文件中作为六类供给上位术语继续保留原语境；不得将历史每个 Offer 追溯解释为法律要约。未来如专指可接受的具体提议，必须另行确定命名规则和历史迁移边界。

**冻结范围**：概念词汇方向与语义边界。
**明确非决策**：独立实体数量、数据库结构、Proposal / Terms 版本模型或 API。

## 3. FD-F02 — Capability Is Not Globally Mandatory

**裁决：采纳候选 B。**

1. 全球 Commercial Offering 不要求必须存在显式 Capability 关联。
2. Asset 或 Right 可以在适用领域规则允许时成为供给的主要价值来源，不需要伪造 Capability 关联。
3. 是否需要 Capability，取决于具体供给类型、实际履行方式、资格要求和领域规则。
4. 不得借此取消实际存在的能力、资格、执照或履行要求。
5. 不得将 Asset 或 Right 描述直接解释为权属证明或授予权限。
6. 允许没有显式 Capability 关联，不等于允许没有合法来源、实际交付能力或责任主体。

**VS-01 兼容约束**：现有受控 Capability / Template 发布链、Service Offering 流程及门禁保持不变；不得绕过当前 Capability 选择、发布或控制流程。

**冻结范围**：全球概念层不强制所有 Offering 关联 Capability。
**明确非决策**：各领域具体来源关联、资格校验、数据结构及发布规则。概念上允许不等于要求每个领域支持无 Capability。

## 4. FD-F03 — Capability / Resource / Asset / Right

**裁决：采纳候选 B。**

| 概念       | 正式定义                               |
| ---------- | -------------------------------------- |
| Capability | 某个主体创造、组织或交付价值的能力     |
| Resource   | 在活动中可以部署、使用或受到约束的输入 |
| Asset      | 可识别、可控制并承载价值的事物或成果   |
| Right      | 对特定对象、行为和范围拥有的权能或许可 |

四者是不同语义视角，不是互斥分类。同一现实来源可以有多种语义角色；不能因为相关就合并为同一概念，也不能因为可区分就推导四个独立实体或四张表。
资产描述、资源控制、能力声明和权利授权必须保留各自语义，不能混成笼统 Capability。

全球概念模型采用窄义 Capability，以 **Value Source（价值来源）** 为更上位分析概念。
历史文件的广义 Capability 表达保留，不静默重写或假装旧定义不存在；术语兼容通过明确治理修订处理。

必须区分 Right 的三个语义角色：

- **Upstream Right Authority**：上游主体拥有或取得的权利依据及其授权范围。
- **Right-type Commercial Offering / Proposal**：面向客户提出的权利授予供给及具体条款。
- **Grant**：按照有效接受与授予机制形成的下游权利授予事实。

三者不能因为都含 Right 就视为同一概念/对象。Grant 不自动代表资产所有权转移，也不自动证明完整权利链。

**冻结范围**：语义分类与相互关系原则。
**明确非决策**：Asset / Right 共模方案、持久化结构、权利链模型、Grant 数据模型及领域实现。

## 5. FD-F04 — Offering Ownership and Responsibility

**裁决：采纳候选 C 的责任角色分析方向，暂缓最终 Owner Anchor；不批准独立 Provider 实体设计。**

商业供给归属、对外责任、权利来源、管理权限与实际履行必须分别解释，不能仅凭创建者、发布账号、Creator、C号或 Profile 推断全部权利义务。

| 可能角色                    | 责任语义                               |
| --------------------------- | -------------------------------------- |
| Commercial Provider         | 向客户提供价值并作出对外说明的主体     |
| Offering Owner              | 持有、控制或承担供给定义治理责任的主体 |
| Asset Owner / Rights Holder | 资产所有者或相关权利人                 |
| Operator / Manager          | 经授权创建、编辑、发布或管理供给的人   |
| Contracting Party           | 在具体条款下承担义务或取得权利的主体   |
| Performer                   | 实际执行服务或履行活动的主体           |
| Grantor                     | 有权作出特定权利授予的主体             |
| Beneficiary                 | 取得特定授予权益的主体                 |

同一主体可以承担多个角色，不同主体也可以分别承担这些角色。不要求每个角色成为独立数据库实体，也不要求一个 Offering 只能由一个主体承担全部角色。

现有身份规则继续有效：

1. Internal Identity 持 C号的既有决定不变，一个 Identity 可有多个 Profile 的关系不变。
2. Identity 持 C号，不等于 Identity 必然拥有 Offering。
3. Profile 的商业语境表达不自动意味着它持有全部供给权利。
4. Offering Owner、Asset Owner、Rights Holder、Provider 不得强行合并。
5. 历史 `creatorId` 保留原命名空间与历史语义，不直接改名或解释为 global owner ID。

**冻结范围**：责任角色分离的概念方向。
**明确非决策**：独立 Commercial Provider 实体、最终 Offering Owner Anchor、单一所有权/多方共同归属/委托治理、Identity / Profile / Creator / Provider / Offering 最终关系基数、转移/共同控制/委托/责任继承机制、数据模型或法律责任结构。

## 6. 总边界及与既有决定的兼容

F01–F04 只冻结全球商业供给概念基础，不批准：

- 最终 Schema、表结构、共享可写 Commercial Offering 实体。
- Shared Envelope 与 Domain Aggregates 的最终结构或关系基数；C4-A Model B 仍是下一轮概念验证候选，不是最终架构。
- API、DTO、事件、状态机、事务设计或 Inventory / Capacity / Availability 统一实现。
- 历史迁移、creatorId 改写、Provider / Asset / Right / Grant 新实体。
- 全球法律合规模块、第三方权属验证或平台担保。
- 全球 Offering 重构、新类型实现、部署、生产、外部试点或真实资金活动。

[Decision29](29_Identity_Owned_Commerce_Reference_Decision.md) 的 C号归属/公开引用/非凭据边界继续有效。
[VS-01 PRD](20_MVP_PRD_VS01.md) 及正式修订不变，包括受控发布、Request / Confirm / Decline、Fulfillment Code / QR / Creator Confirmation、Identity/Profile/Creator 兼容及 BFF/Session/身份隔离。

[C3-D](../09_Engineering_Governance/PCI-ENG-020-C3-D-Thesis-Led-Personal-Commerce-Abstraction-Review.md) 仍为已接受冻结的研究，不回写原结论。
[C3-E Register](../09_Engineering_Governance/PCI-ENG-020-C3-E-Project-Documentation-Baseline-and-Freeze-Register.md)
及 [R1](../09_Engineering_Governance/PCI-ENG-020-C3-E-R1-Review-Corrections-and-Evidence-Verification-Report.md)
保留已接受冻结的原文、快照与验证结论。本决定是后续独立批准，不追溯改变当时登记。

对 C3E-CF-10/11 的新效力仅为 F01–F04 已明确的词汇、全球 Capability 非必需、来源视角及责任分离；最终 owner、基数、类型、库存/承诺仍开放。C3E-CF-12 不因本轮获得统一运行模型批准；C3E-CF-27 的“研究接受不等于架构批准”继续适用。不直接修改冲突登记或关闭整个冲突条目。

## 7. 下游依赖与待决事项

| 议题                                                        | 状态               | 后续顺序                |
| ----------------------------------------------------------- | ------------------ | ----------------------- |
| F05 — Legal Combination, Sharing and Source Rights Evidence | OPEN / NOT DECIDED | 与 F10 联动，下一轮优先 |
| F06 — Six Supply Types and Domain Rules                     | OPEN / NOT DECIDED | F05/F10 之后            |
| F07 — Availability / Inventory / Capacity                   | OPEN / NOT DECIDED | F05/F10 之后            |
| F08 — Request / Commitment / Fulfillment                    | OPEN / NOT DECIDED | F05/F10 之后            |
| F09 — Code / Domain / Policy                                | OPEN / NOT DECIDED | F05/F10 之后            |
| F10 — Platform Eligibility, Rights and Legal Roles          | OPEN / NOT DECIDED | 与 F05 联动，下一轮优先 |
| F11 — Minimum Validation Instance                           | OPEN / NOT DECIDED | 最后裁决                |

后续研究须使用本概念基础，但不得把 F05/F10 的优先级解释为已授权启动。Main Controller 验收本次同步后，仍须另行下达下一任务。

## 8. 修订历史

| 日期       | 记录                                                | 权威及变更边界                                                                       |
| ---------- | --------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 2026-11-17 | FD-C4A-R1-01 正式裁决；本记录由 FD-R1-SYNC 同步入库 | Founder 直接会话裁决；F01–F04 概念冻结，非实施批准；原研究和历史文件仅按授权追加解释 |

`FD-C4A-R1-01 = FROZEN / ACCEPTED`
