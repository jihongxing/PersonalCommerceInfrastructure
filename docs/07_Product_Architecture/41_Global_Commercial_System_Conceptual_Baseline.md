# 41 — Global Commercial System Conceptual Baseline

```text
GLOBAL COMMERCIAL SYSTEM CONCEPTUAL BASELINE
Status: FOUNDER-APPROVED CONCEPTUAL BASELINE
Scope: Conceptual Principles and System-level Abstraction
Not: Final Software Architecture
Not: Database / API / Runtime Authorization
```

登记日期：2026-11-18。正式化授权来源：Founder 指令 **PCI-DOC-002 — Founder-Directed Global Commercial System Conceptual Baseline Formalization**。本文件序号 41 是文档编号，不是新增 FD 编号，也不代表独立签署件。

## 1. 基线地位、来源与阅读规则

本文件正式确立 PCI 项目级全球商业系统概念基线，整合已经批准的 F01–F04、C5 D01–D12，以及已接受的 PCI-ENG-020 Stage B 研究及其 R1、R2 修订。它为后续产品设计、架构设计、现有代码审视和重构提供共同概念参照；这些后续活动仍须分别取得有明确范围的授权，本次不执行。

必须分别读取四层内容：

| 内容层次 | 本基线中的效力 | 不得推导的效力 |
| --- | --- | --- |
| Founder 已批准原则 | F01–F04、D01–D12 在各自明确范围内有效 | 不扩大为数据库、API、聚合、状态机或写入权批准 |
| 已接受研究与解释细节 | Stage B 及 R1/R2 为 ACCEPTED RESEARCH，供理解、查证和后续讨论 | 不因研究接收、被引用或收入基线而整体升级为 Founder Decisions |
| 建议、推论及开放问题 | 保留来源标签、假设、未知与待决状态 | 不以“基线完整”为由补造答案或批准建议 |
| 现行领域与工程契约 | VS-01 及其产品、安全、身份和会话约束继续有效 | 不以全球概念反向修改既有合同或实现 |

本文件是整合入口，不复制出另一套独立决策权威。以下原始决定的完整正文、限制性条款和历史来源均被保留，摘要不能代替或缩减原文：

| 权威来源 | 使用范围 | 保留关系 |
| --- | --- | --- |
| [Decision36：FD-C4A-R1-01](36_Global_Commercial_Supply_Foundation_Decisions.md) §2–§7 | F01–F04 概念基础及未决边界 | FROZEN / ACCEPTED；仅概念，其他 C4 议题不自动批准 |
| [Decision37](37_C5_D01_D04_Founder_Decisions.md) §2–§6 | D01–D04 完整方向和排除项 | FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY |
| [Decision38](38_C5_D05_D09_Founder_Decisions.md) §2–§7 | D05–D09 完整方向和排除项 | FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY |
| [Decision39](39_C5_D10_D12_Founder_Decisions.md) §2–§6 | D10–D12 与 D01–D12 当前统一登记 | FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY；不执行 D12 |
| [Decision40](40_Global_Commercial_System_Conceptual_Model_Consolidation_Founder_Approval.md) §1–§7 | 概念综合方向及阶段 A / B 独立授权门槛 | 保留当时方向同步状态；不是当前研究状态的回写对象 |

历史准备材料和 Decision37/38 中后续决定的 PROPOSED / DEFERRED 是当时记录；D01–D12 当前批准状态由 Decision39 统一登记。Decision40 的尚未执行记录与 Stage B 后来经独立授权完成、现被接受的研究不矛盾。本轮依据 PCI-DOC-002 正式化概念基线，不重写这些历史文件。

治理读取入口仍为 [C3-E 权威基线与冻结登记](../09_Engineering_Governance/PCI-ENG-020-C3-E-Project-Documentation-Baseline-and-Freeze-Register.md)、其 [R1 核验](../09_Engineering_Governance/PCI-ENG-020-C3-E-R1-Review-Corrections-and-Evidence-Verification-Report.md)及 [Governance22](../09_Engineering_Governance/22_Engineering_Governance.md)。本文件不升级 Proposed ADR、不关闭历史冲突、不替代更高层批准或具体领域合同。

## 2. F01–F04：词汇、价值来源与责任边界

### 2.1 F01 — Canonical Vocabulary

来源：[Decision36 §2](36_Global_Commercial_Supply_Foundation_Decisions.md#2-fd-f01--canonical-vocabulary)。

| 概念 | 已批准的概念边界 |
| --- | --- |
| Commercial Supply | 商业价值来源及其供给体系的概念集合，不因其为全局概念就要求独立生命周期实体或数据库对象 |
| Commercial Offering / Offering | 同一概念的全称与简称；可识别、可持续定义和管理的商业供给，是面向市场表达供给的核心概念 |
| Product | 广义商业产品语言，表达面向客户的价值产品化结果；不等同于 Goods，不局限实物，也不新增与 Offering 重复的对象 |
| Proposal / Terms Version | 在特定对象、范围、时点和条件下的具体提议及条款版本；与持续存在的 Offering 区分 |
| Commitment | 按相应领域有效接受机制成立的责任或权益事实；不把所有 Request 自动视为 Commitment，不统一为 Request → Confirm → Fulfilled |
| 历史 Offer | 保留历史六类供给上位术语的原语境，不追溯解释每个 Offer 为法律要约；未来专用命名及历史迁移边界须另行决定 |

本项未决定独立实体数量、数据库结构、Proposal / Terms 持久化及版本模型或 API。

### 2.2 F02 — Capability Is Not Globally Mandatory

来源：[Decision36 §3](36_Global_Commercial_Supply_Foundation_Decisions.md#3-fd-f02--capability-is-not-globally-mandatory)。全球 Offering 不强制显式 Capability 关联，Asset 或 Right 在适用领域规则允许时可以是主要价值来源。是否需要 Capability 取决于供给类型、实际履行、资格要求和领域规则；这不取消实际能力、资格、执照、合法来源、交付能力或责任主体要求，Asset / Right 描述也不是权属证明或授予权限。

这不是要求每个领域支持无 Capability。VS-01 既有受控 Capability / Template 选择、发布门禁和服务流程保持不变；各领域具体来源关联、资格校验、数据结构和发布规则未由此决定。

### 2.3 F03 — Capability / Resource / Asset / Right

来源：[Decision36 §4](36_Global_Commercial_Supply_Foundation_Decisions.md#4-fd-f03--capability--resource--asset--right)。

| 概念 | 正式定义 |
| --- | --- |
| Capability | 某个主体创造、组织或交付价值的能力 |
| Resource | 在活动中可以部署、使用或受到约束的输入 |
| Asset | 可识别、可控制并承载价值的事物或成果 |
| Right | 对特定对象、行为和范围拥有的权能或许可 |

四者是可重叠的不同语义视角，不是互斥分类；既不能混成笼统 Capability，也不要求四个独立实体或四张表。全球采用窄义 Capability，以 Value Source 为更上位分析概念；历史广义 Capability 原文保留，兼容须通过明确治理修订处理。

Upstream Right Authority、Right-type Offering / Proposal、Grant 三种语义必须分开；Grant 不自动代表资产所有权转移或完整权利链证明。Asset / Right 共模、持久化、权利链、Grant 数据模型及领域实现均未决定；Grant 与 Commitment 的具体关系继续见 §8 的 OQ-B06。

### 2.4 F04 — Offering Ownership and Responsibility

来源：[Decision36 §5](36_Global_Commercial_Supply_Foundation_Decisions.md#5-fd-f04--offering-ownership-and-responsibility)。供给归属、对外责任、权利来源、管理权限与实际履行分别解释，不能由创建者或发布账号推断全部权利义务。

Commercial Provider、Offering Owner、Asset Owner / Rights Holder、Operator / Manager、Contracting Party、Performer、Grantor、Beneficiary 可以重合，也可分别由不同主体承担。角色不自动对应独立数据库实体，一个 Offering 也不要求一个主体承担全部角色。

Internal Identity 持有 C-number、一个 Identity 可有多个 Profile 的既有规则不变；持有 C-number 不证明拥有 Offering，Profile 商业表达不证明全部供给权利。Offering Owner、Asset Owner、Rights Holder、Provider 不强行合并。历史 creatorId 保留原命名空间和语义，不解释或重命名为 global owner ID。

最终 Owner Anchor、独立 Commercial Provider 实体、单一/共同归属、委托治理、Identity / Profile / Creator / Provider / Offering 关系基数、转移/共同控制/委托/责任继承机制、数据模型和法律责任结构均未决定。

## 3. 六类 Commercial Supply 与共同基础设施

正式概念范围为 **Service、Goods、Program、Membership、Project、Right** 六类商业供给。这是商业供给分类，不是六个分析维度。Stage B 使用的比较维度或观察轴是研究工具，不是另外六类供给，也不是实体清单。

依据 D01–D04，六类供给共享商业事实及交易关联基础设施，同时保留各自专业领域表达。同一用户或提供方可参与多个领域，参与角色依交易上下文确定。六类供给不应成为六套互不相通的身份、订单、资金或评价证据系统，也不能被压缩为没有专业语义的通用数据模型、六种 Service Template 或一个万能对象。

各领域保留其供给定义、不变量、有效接受、责任或权益、生命周期与履行的专业解释；共同协议不要求共用同一套领域对象、数据结构、状态机、验收或履约规则。共享身份引用与上下文参与不取消现有 Creator / Operations 身份隔离。

本段不裁决六类是否穷尽、互斥或如何处理类型重叠，FR-01 仍待决；不新增分类算法、模板或产品功能。六类对照细节见 §6 的已接受研究；其他五类的概念表达不意味着已有对应正式产品 PRD 或工程实现。

## 4. D01–D12：共同基础与专业领域的原则索引

以下逐项索引整合已批准方向及明确非决策，均为 **FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY**。每项效力连同来源原文的全部限制读取，不因摘要省略措辞而扩大批准范围。

| 决定与正式来源 | 已批准的概念方向 | 明确未决定或未授权 |
| --- | --- | --- |
| D01 — [Decision37 §2](37_C5_D01_D04_Founder_Decisions.md#2-d01--global-system-abstraction) | Shared Commercial Facts Infrastructure + Six Independent Domain Expressions；共享基础与独立领域语义并存 | 不统一全部生命周期、状态机或履约；不选 SYS-A/B/C，不确定具体共享事实、Shared Core 写入职责、共享实体、Schema、事务边界或部署拓扑 |
| D02 — [Decision37 §3](37_C5_D01_D04_Founder_Decisions.md#3-d02--identity-and-contextual-participants) | Contextual Participant Model；Buyer、Provider、Payer 等随上下文确定，Buyer / Payer / Recipient / 实际体验者可不同；参与角色不等于操作授权或所有权 | 不固化全局用户角色、不建立六套身份；组织/代表机制、Party / Provider 实体、授权模型、身份基数和 Owner Anchor 未定；不修改身份、认证、Session、权限、BFF 或 Creator / Operations 隔离 |
| D03 — [Decision37 §4](37_C5_D01_D04_Founder_Decisions.md#4-d03--domain-models-and-common-protocol) | Professional Domain Models + Common Protocol；专业模型以共同协议关联共享基础 | 不把六域做成六个 Service Template，不统一状态机、承诺结构或履约；未批准协议字段、API、DTO、事件、聚合、状态机、事务、部署或配置实现 |
| D04 — [Decision37 §5](37_C5_D01_D04_Founder_Decisions.md#5-d04--shared-references-and-typed-domain-definitions) | Shared Stable References + Typed Domain Definitions；引用支持识别追溯，领域定义类型、语义和不变量；引用不是权属证明 | 不确定唯一 Owner Anchor、共享写入实体或统一可写聚合；引用编码、版本对象、持久化、目录是否仅投影、可写 Envelope、Offering / 领域对象基数均未定；TX-B / SYS-B 不是批准方案 |
| D05 — [Decision38 §2](38_C5_D05_D09_Founder_Decisions.md#2-d05--transaction--order-abstraction) | Shared Transaction Association and Fact Traceability；各领域专业交易记录保持权威；可关联参与者、供给来源、接受版本、金额与范围依据；一次采购可关联多个领域记录，不强制同名 Order | 不批准 Universal Order、可写 Shared Transaction Envelope、TX-B 默认架构、TX-C 最终选型、共享写入权威、固定实体基数或数据库设计 |
| D06 — [Decision38 §3](38_C5_D05_D09_Founder_Decisions.md#3-d06--order-and-commitment) | Order、Commitment、Fulfillment、Payment 独立；采购可关联多个责任/权益事实；成立、颗粒度及变化由领域有效接受决定，不按行数、SKU 或付款次数机械生成；共同进度只是有来源摘要 | 不批准全局 Commitment 数据库实体、统一 Commitment 状态机、一订单行一承诺规则或六域统一履约；摘要不替代领域履约事实，Request / 付款不是成立或完成的通用判据 |
| D07 — [Decision38 §4](38_C5_D05_D09_Founder_Decisions.md#4-d07--financial-and-ledger-boundary) | 共享资金事实与账务追溯；领域负责应收/应付义务、触发依据和结算条件；来源、分配、退款关联与纠错可追溯；同一真实资金事实不重复入账；到账不证明履约或授予完成 | 不批准统一钱包、Account Holder 模型、全局会计、具体账本/分录/账户、支付/退款/结算/提现或真实资金启用；FIN 候选、支付提供方和账户结构未选定 |
| D08 — [Decision38 §5](38_C5_D05_D09_Founder_Decisions.md#5-d08--review-and-reputation) | 共享 Review Evidence；领域保留评价资格、对象关系、维度、窗口和尺度；Review / Rating / Reputation 区分，Reputation 为可追溯证据及规则的投影，不简单平均不可比评分 | 不批准全局信用分/星级、统一资格/窗口/规则、公开/删除/申诉/处置功能或将 UI review 状态迁移为客户评价；不把付款人/购买者/体验者混同，REV 存储/投影架构未选定 |
| D09 — [Decision38 §6](38_C5_D05_D09_Founder_Decisions.md#6-d09--composite-and-cross-domain-transactions) | 组合可关联多域供给、多 Provider、多 Commitment；供给/提议/交易/履约/资金五层边界可不同；专业责任、接受与状态独立；局部取消/失败不抹除其他既成事实；组成版本、责任、金额分配及变化可追溯；整体接受、取消、退款依据条款与领域规则 | 不批准 Bundle / Package 实体、统一组合订单/状态机、分布式事务/锁/编排/API、自动部分退款/取消/补救；不默认全有全无或全部独立可取消 |
| D10 — [Decision39 §2](39_C5_D10_D12_Founder_Decisions.md#2-d10--shared-core-and-domain-authority-boundary) | Shared References / Shared Facts / Domain Facts / Domain Projections 区分；来源、PCI 关联追溯、领域解释和共同投影分开；共享事实职责不等于 Shared Core 独占生产/写入，进度投影不是第二成功权威 | 不选 SYS-A/B/C，不定 Shared Core 写入权/结构、数据库聚合、基数、部署、事务、API/DTO/事件或实现；不批准统一 Order、统一 Commitment、超级聚合或任何架构/工程实施 |
| D11 — [Decision39 §3](39_C5_D10_D12_Founder_Decisions.md#3-d11--vs-01-compatibility-and-evolution) | VS-01 是现有 Service 实现切片；保留产品/安全合同，有界渐进关联；历史语义、未知不得补造、安全连续性是未来演进审阅条件；全球模型容纳 VS-01，不反向强加未定模型 | 不改 PRD/产品行为、身份/Session/BFF/权限/认证、Capability/Template/Appearance/Fulfillment、creatorId/C-number；不定 Owner Anchor，不创建 API/适配器/读视图/事件/迁移/重构，不启用 Paid Service/资金，不授权架构或工程 |
| D12 — [Decision39 §4](39_C5_D10_D12_Founder_Decisions.md#4-d12--minimal-conceptual-validation-instance) | 接受 T07 + T12 + T14 主对象、T04 / T05 反例及九项判据；逐项来源证据，区分已知/未知/假设/推导；任一失败返回概念讨论，不用超级状态隐藏不一致 | 本次不执行静态概念验证、不宣称通过；不批准原型/模拟、数据库/Schema/API/DTO/事件/代码、支付沙箱/资金/自动退款、架构/工程验证或实施；不自动裁决 C4-A F11 或其他未决项 |

D12 的九项完整成功/失败判据，以 [Decision39 §4.1](39_C5_D10_D12_Founder_Decisions.md#41-已接受的九项判据及原文定位)指向的[第三轮准备 §4.6](../09_Engineering_Governance/PCI-ENG-020-C5-D10-D12-Third-Round-Founder-Decision-Preparation.md#46-若采纳后的成功失败判据与证据要求)为准，主题分别为 D01 共享基础、D02 上下文角色、D03 专业模型、D04 引用与类型、D05 交易关联、D06 责任独立、D07 资金追溯、D08 评价区分、D09 组合与局部变化。接受对象/判据不等于产生结果；材料不是实际交易或完整真实事件，不得凭空创造付款、履行或评价事实。未来执行必须另行授权。

## 5. 事实、来源、解释与权威

以下概念边界依据 D04、D07、D08、D10；细化研究继续保留研究等级：

| 概念 | 概念职责及边界 |
| --- | --- |
| Shared References | 稳定识别与关联；引用本身不是所有权、授权或领域成功证据 |
| Shared Facts | 不只是关联索引，也可承载有明确来源和责任边界的共享事实；不因此获得全部事实的生产权、写入权或解释权 |
| Domain Facts | 所属专业领域保持事实权威；领域解释成立、责任和履行，不能被共享摘要覆盖 |
| Domain Projections | 从来源事实形成的表达，不是第二份可独立修改的领域真相；不能自行创建、改写或覆盖领域权威事实 |

外部来源事实、PCI 关联与追溯事实、领域解释事实、共同投影保持语义区分。外部签发/产生的事实不等于 PCI 已证明其全部意义，PCI 的关联记录不自动成为领域接受或履约依据；外部或 PCI 来源也不自动使全部内容成为 Shared Facts。共同进度只可作为有来源投影，不能成为领域成功的第二权威。

Shared Core 不是超级 Aggregate，不是所有领域事实的唯一生产者或写入者；同时也不将所有共享职责限定为只能读取领域状态。哪些共享事实独立产生、由谁写入及具体结构，须在未来另行有界决策，不能由上述原则推导成共享可写封套或最终架构。

Right 相关概念须分开：F03 的 Right 是来源语义视角；Right-type Offering / Proposal 是面向客户的供给/条款表达；Source Right 在相关研究语境中指向上游权利依据，须按原文范围读取，不新设独立实体；Grantor 是具有授予权限的角色；Grant 是有效授予形成的下游事实；Commitment 是领域有效接受形成的责任或权益事实。来源描述、角色声称、供给表达、授予结果和责任事实不能互换。Grant 与 Commitment 的包含、关联或其他具体关系未裁决，不能据词义相似自行建立继承关系或统一生命周期。

研究中对来源版本、已知/未知/延迟/冲突、表达用途、Experience / Participation Evidence 的细化，是解释和待议材料，不是已冻结的共同协议字段、全局评价资格制度或新增实体。不得用推论补造历史、参与、权利、责任、资金或评价事实。

## 6. 已接受 Stage B 研究：来源与使用边界

依 PCI-DOC-002，以下研究及其 R1/R2 修订作为 **ACCEPTED RESEARCH / PRESERVED** 使用。原文件中的提交时 AWAITING REVIEW、RESEARCH PROPOSAL、DIRECT INFERENCE、OPEN QUESTION 等来源标签保留；接收研究不把各段解释或候选建议变成新的 Founder Decisions。

| 研究入口 | 用途与限制 |
| --- | --- |
| [Global Conceptual Model](../09_Engineering_Governance/PCI-ENG-020-Global-Conceptual-Model.md) | 主模型及 R1 澄清；概念说明、分析维度和推论不新增批准 |
| [Six Domain Mapping](../09_Engineering_Governance/PCI-ENG-020-Global-Conceptual-Six-Domain-Mapping.md) | 六类专业差异及比较维度；不是六份新 PRD、统一对象模型或已批准分类规则 |
| [Core Relationships](../09_Engineering_Governance/PCI-ENG-020-Global-Conceptual-Core-Relationships.md) | 既有概念关系的研究表达；不决定实体、基数或运行状态机 |
| [Facts Provenance and Authority](../09_Engineering_Governance/PCI-ENG-020-Global-Conceptual-Facts-Provenance-and-Authority.md) | 来源、权威与投影的研究细化；七类事实、分析轴和细化矩阵不自动成为协议/Schema |
| [Consistency and Gaps](../09_Engineering_Governance/PCI-ENG-020-Global-Conceptual-Consistency-and-Gaps.md) | 一致性与缺口证据，不等于所有问题已解决 |
| [Open Questions](../09_Engineering_Governance/PCI-ENG-020-Global-Conceptual-Open-Questions.md) | 保留分类、未知与未决状态，本次不关闭 |
| [Founder Recommendations](../09_Engineering_Governance/PCI-ENG-020-Global-Conceptual-Founder-Recommendations.md) | FR-01–FR-05 是研究建议标识，不是 FD 编号或新批准 |
| [Source Authority Index](../09_Engineering_Governance/PCI-ENG-020-Global-Conceptual-Source-Authority-Index.md) | 具名来源、来源等级和时间语境，不以整份文件统一升级权威 |
| [Research and Verification Report](../09_Engineering_Governance/PCI-ENG-020-Global-Conceptual-Research-and-Verification-Report.md) | 原研究执行、保护和只读验证证据；不是本轮重新运行验证或 D12 执行结果 |

R1/R2 的授权及修订历史按原任务和原文件读取，不在此补写不存在的签署件、独立报告或重新验收结果。C3-D、C3-E、C4-A、C4-B、C5 原始研究和验证记录保留原路径及内容；研究接受不批准其 SYS / TX / FIN / REV、权源验证或平台法律角色候选。

## 7. VS-01：现有 Service 实现切片与契约连续性

VS-01 是 PCI 全球 Service 领域中的既有实现切片，不是应被隔离或退役的历史产品。全球概念应完整容纳它，不要求它先符合尚未确定的全球模型。现行合同、未来可能的共享关联、未批准的产品行为变化、未批准的工程迁移必须分开。

| 保留范围 | 现行来源与约束 |
| --- | --- |
| 产品合同与业务流程 | [VS-01 PRD](20_MVP_PRD_VS01.md)及正式修订继续有效；Identity → Capability → Service Offering → Publish / Distribution → Customer Request → Creator Confirm / Decline 保持原合同，不加新必需步骤或统一 Order/Commitment 语义 |
| 决策与后续履约确认 | PRD 的 FD-020-BD-01 修订保留 Fulfillment Code / QR / Fulfillment Confirmation；Creator Confirmed / Declined 决策与后续履约确认语义清晰区分，不删功能、不重写状态机、不改历史结果 |
| Creator 安全与登出 | [B1-V2 撤销闭环报告](../09_Engineering_Governance/PCI-ENG-020-B1-V2-Upstream-Logout-Revocation-Closure.md)及 D11：同源 Creator BFF、HttpOnly Opaque Session Cookie、PostgreSQL 服务端 Session、Token 仅服务端处理、既有凭据加密、Refresh CAS、Origin / CSRF、完整上游注销撤销与安全重试边界保持；不恢复浏览器 Token 持久化或旧私有 API 直接 Bearer 路径 |
| 身份隔离与公开引用 | Creator / Operations 身份和 Session 不复用；[Decision29](29_Identity_Owned_Commerce_Reference_Decision.md)的 Internal Identity 持有 C-number、Profile 关系和公开商业引用非凭据语义保留；历史 creatorId 不改义，不推出 Offering Owner Anchor |
| Capability / Template | [Decision34](34_Controlled_Capability_Service_Publishing_Decision.md)、[Decision35](35_Database_Managed_Capability_Service_Catalog_Decision.md)及 PRD 修订的受控目录、资格和发布门禁不因全球 Capability 可选而绕过 |
| 限定 Appearance | PRD 的 FD-020-C3-BD-01：仅既有确认活动出席类模板的可选展示/Request 上下文，不是所有 Offering 必填、通用数值价格、日历/排期或支付；保留现有合同、普通编辑的数据保留及历史兼容边界 |

本次不改变现有产品行为、API、数据库、Migration、权限、身份、安全、Appearance 或 Fulfillment，也不声称重新完成浏览器、数据库或安全验收。PCI 的数字化请求和履约确认工具不因此承担实际服务交付或平台担保责任；不新增 SLA、自动履约或交付承诺。

## 8. 开放问题与未决建议原样保留

以下是状态保留索引，不是本轮重新研究、裁决或关闭记录：

| 项目 | 当前保留状态 | 本次不能做的事 |
| --- | --- | --- |
| OQ-B06 — Grant 与 Commitment | **OPEN QUESTION** | 不预设包含、关联或继承关系，不强制纳入统一生命周期；后续澄清须独立授权 |
| FR-01 — 六类领域判别与混合表达 | **AWAITING FOUNDER DECISION** | 不确定穷尽性、互斥性或自动分类规则 |
| FR-02 — 有效接受与责任共同可解释性 | **AWAITING FOUNDER DECISION** | 不建立统一接受机制、证据充分性规则或向 VS-01 加步骤 |
| FR-04 — 跨领域组合依赖 | **AWAITING FOUNDER DECISION** | 不默认全局原子取消、独立取消或自动退款策略 |
| FR-03 — 角色责任与权源声称 | 不新增独立 Founder Decision；F04 等已覆盖分离原则，具体未决细节仍开放 | 不将建议整体标为已批准/已关闭；权源、资格、代理链、平台法律角色按原未决来源处理 |
| FR-05 — 不确定性、冲突与投影权威 | 不新增独立 Founder Decision；D10 等已覆盖来源/解释/投影原则，具体未决细节仍开放 | 不批准新协议字段、争议裁决者或冲突处理实现，不标为全部解决 |
| D12 Static Validation | **NOT AUTHORIZED** | 不生成推演结果、验收 PASS 或运行证据 |

其他 OQ 继续按[开放问题登记](../09_Engineering_Governance/PCI-ENG-020-Global-Conceptual-Open-Questions.md)保留；本表不穷尽或消除原问题。最终 Owner Anchor、共享写入权威、实体/基数、SYS / TX / FIN / REV 最终选型、C4-A F05–F11 及 C4-B 候选不因本次正式化自动决定。原 C3-E 冲突、Proposed ADR 和历史研究建议不得静默关闭或升级。

## 9. 正式化结果、非授权边界与后续门槛

F01–F04 的原概念冻结和 D01–D12 的概念批准全部保留。本次正式化的是共同概念基线及文档权威入口，不是最终软件架构，也不是代码重构许可。以下事项仍未获授权：

- 全球系统架构定案、SYS / TX / FIN / REV 选型、Shared Core 设计或具体写入权威、统一可写 Offering / Order / Transaction / Commitment 或超级聚合。
- Owner Anchor、实体基数、Shared Envelope / Domain Aggregates 结构、部署拓扑、事务协调和 Inventory / Capacity / Availability 统一实现。
- 数据库、Schema、Migration、历史数据修改，API、DTO、事件协议、聚合、状态机、适配器、读视图或其他工程设计/实现。
- VS-01 重构或产品/安全合同变更；Creator / Operations 身份、Session、Credential、BFF、权限、认证、Capability / Template、Appearance、Fulfillment、creatorId 或 C-number 变更。
- D12 静态验证、概念验证执行、原型、模拟/实验系统、业务代码、测试或配置变更。
- 全球法律合规模块、第三方权属验证、平台担保、新交付责任；支付/退款/结算/提现、统一钱包/账务实现、支付沙箱或真实资金活动。
- Marketplace、CRM、自动履约及其他未批准商业或运营能力，Pilot、Production、部署或商业运行。

后续产品、研究、架构、现有代码审视或重构均须在本基线概念约束下另行获得独立任务授权。本次只新建本文件并增量更新 [docs README](../README.md)，不更新 Execution21 或 Control25，不移动/重命名/删除历史文件，不 Commit / Push。只读文档验证与文件保护证据在本任务外部交付报告中提供，不纳入历史未跟踪证据。

```text
PCI-DOC-002 = COMPLETED / DOCUMENTATION ONLY
GLOBAL COMMERCIAL SYSTEM CONCEPTUAL BASELINE = FORMALLY ESTABLISHED
F01-F04 = FOUNDER APPROVED / PRESERVED
D01-D12 = FOUNDER APPROVED / CONCEPTUAL PRINCIPLES ONLY
STAGE B = ACCEPTED RESEARCH / PRESERVED
OPEN QUESTIONS = PRESERVED / NOT SILENTLY RESOLVED
VS-01 = EXISTING DOMAIN CONTRACT PRESERVED
DOCUMENTATION AUTHORITY MAP = SYNCHRONIZED
PROJECT STRATEGY = DISTINCT LOGICAL DOCUMENT RESPONSIBILITY
HISTORICAL vs SUPERSEDED = EXPLICITLY DISTINGUISHED
PHYSICAL DOCUMENT MOVES = NONE
CODE CHANGES = NONE
SCHEMA / API / MIGRATION = NONE
ARCHITECTURE IMPLEMENTATION = NONE
D12 STATIC VALIDATION = NOT AUTHORIZED
PROTOTYPE = NOT AUTHORIZED
IMPLEMENTATION = NOT AUTHORIZED
PILOT = NOT AUTHORIZED
PRODUCTION = NOT AUTHORIZED
COMMIT / PUSH = NONE
REAL_MONEY_ENABLED = false
MAIN CONTROLLER REVIEW = AWAITING
```

上述为批准范围及本轮文档工作状态，不是运行开关或真实业务环境检测结果。完成后停止，提交 Main Controller Review；不自动进入后续研究、代码审视、系统性重构或工程实施。

## 10. 登记历史

| 日期 | 来源 | 记录及保护范围 |
| --- | --- | --- |
| 2026-11-18 | PCI-DOC-002 Founder 直接授权 | 新建正式概念基线并追加 README 权威导航；不修订 Decision36–40、Stage B 及 R1/R2、领域合同或其他历史原文；不新增概念裁决 |
