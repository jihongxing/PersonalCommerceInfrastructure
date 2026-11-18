# 39 — C5 D10–D12 Founder Decisions & Conceptual Decision Closure

> Authority：Founder Decision
> Decision date：2026-11-17（本次主控指令明确转述的 Founder 第三轮裁决日期）
> Recording date：2026-11-17（本任务环境日期）
> Status：**FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY**
> Conceptual validation execution / Architecture finalization / Implementation：**NOT AUTHORIZED**

## 1. 批准来源、效力与历史关系

正式来源是本次主控指令 **PCI-ENG-020-C5 — D10–D12 Founder Decision Sync & C5 Conceptual Decision Closure** §1–§3：Founder 于 2026-11-17 明确接受 D10、D11、D12，按 Main Controller 推荐方案完整接受，无修改或补充意见。本文件完整登记该指令列明的冻结内容及排除项，不将概念接受解释为架构、验证执行或工程授权。

引用标识为 `PCI-ENG-020-C5 / D10`、`PCI-ENG-020-C5 / D11`、`PCI-ENG-020-C5 / D12`；`39` 是核对现有目录后的文档序号，不是新的父 FD 编号。裁决日期来自本次指令，未提供独立签署件，本记录不声称进行了签章核验。

相关来源与治理关系：

- [C3-E 文档权威基线与冻结登记](../09_Engineering_Governance/PCI-ENG-020-C3-E-Project-Documentation-Baseline-and-Freeze-Register.md)及其 R1：原快照和权威层级不回写。
- [FD-C4A-R1-01](./36_Global_Commercial_Supply_Foundation_Decisions.md)：价值来源、词汇与责任角色等既有冻结边界继续有效；Owner Anchor 等未决事项不自动关闭。
- [D01–D04 正式决定](./37_C5_D01_D04_Founder_Decisions.md)、[D05–D09 正式决定](./38_C5_D05_D09_Founder_Decisions.md)：本次不重写或重批其内容，按原批准范围继续有效。
- [C5 原始研究](../09_Engineering_Governance/PCI-ENG-020-C5-Global-Commercial-System-Abstraction-and-Shared-Transaction-Infrastructure-Research-and-Founder-Decision-Package.md) §11–§12、§15–§17，以及 [D10–D12 第三轮准备](../09_Engineering_Governance/PCI-ENG-020-C5-D10-D12-Third-Round-Founder-Decision-Preparation.md) §2–§4：保留历史原文；本次批准第三轮完整推荐的概念方向，以本次正式裁决的明确边界限定效力。
- [当前 VS-01 合同及正式修订](./20_MVP_PRD_VS01.md)、[Identity / C-number 决定](./29_Identity_Owned_Commerce_Reference_Decision.md)：继续约束现有产品切片，不因 C5 闭合而改变。
- [Control25](../08_Execution/25_Project_Control_Baseline.md) §17、[执行台账](../08_Execution/21_Prototype_Execution.md)、[本轮核验报告](../09_Engineering_Governance/PCI-ENG-020-C5-D10-D12-Decision-Sync-and-Verification-Report.md)：登记当前状态和文档执行证据。

原报告、Decision37 / Decision38、前轮准备和历史台账中的 PROPOSED、DEFERRED 或 AWAITING FOUNDER DECISION 均保持当时语境。只在当前明确范围内由本记录补充 D10–D12 批准及 D01–D12 统一概念状态，不追溯宣称历史上已批准，也不批准 SYS / TX / FIN / REV 的具体架构候选。C3-D、C3-E、C4-A、C5 研究原文及其他已冻结文件不重写。

## 2. D10 — Shared Core and Domain Authority Boundary

**FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY。**

冻结内容：

1. 接受四类概念区分：
   - Shared References（共享引用）。
   - Shared Facts（共享事实）。
   - Domain Facts（领域事实）。
   - Domain Projections（领域投影）。
2. 接受共享事实职责、专业领域权威和有来源投影的原则。
3. 接受事实来源与领域解释权分离的补充原则。
4. 外部来源事实、PCI 关联与追溯事实、领域解释事实、共同投影必须保持语义区分。
5. 共享事实不意味着 Shared Core 独占所有事实的生产权或写入权。
6. 共同进度只能是有来源的投影，不能成为领域成功的第二权威。

明确不批准：

- SYS-A / SYS-B / SYS-C 最终架构选型。
- Shared Core 具体写入权及写入结构。
- 数据库聚合、实体基数、部署拓扑、事务边界。
- API、DTO、事件协议及具体实现。
- 统一 Order、统一 Commitment 或超级聚合。
- 任何架构或工程实施。

**接受的完整方向与解释边界**：第三轮准备 §2 的共享事实职责、专业领域权威与有来源投影方向被接受。共享引用提供稳定识别和关联，不证明所有权或授权；共享资金/评价证据有跨领域意义，但不能凭此制造外部付款或领域成功事实。外部签发的来源事实、PCI 对事实的关联追溯、领域对成立/履行的解释以及共同展示各有语义。单事实权威不等于单一聚合；共同视图不是第二份可独立编辑的领域真相。没有选定 SYS-B / SYS-C 或批准可写交易封套，也没有把全部共享职责限定为只能读领域状态。

**来源**：本次指令 §2 D10；第三轮准备 §2.1–§2.8；C5 原研究 §11、§16 D10；D01 / D03 / D05–D09。

## 3. D11 — VS-01 Compatibility and Evolution

**FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY。**

冻结内容：

1. 现有 VS-01 是 PCI 全球 Service 领域中的既有实现切片，而不是应被隔离或退役的历史产品。
2. 保留现有 VS-01 产品合同、业务语义和安全边界。
3. 接受有界渐进关联与兼容演进的概念方向。
4. 历史语义、未知信息不得补造、Creator 安全边界连续性，均为未来演进的必要审阅条件。
5. 全球抽象应能够容纳现有 VS-01，不应要求现有 VS-01 证明自己符合尚未确定的全球模型。
6. 新概念不得追溯性地改变现有 Request、Creator Confirm / Decline、Fulfillment Code、QR、Fulfillment Confirmation 等业务语义。

明确不批准：

- 修改现有 PRD 或 VS-01 产品行为。
- 修改 Creator / Operations 身份、Session、BFF、权限和认证机制。
- 修改 Capability / Template 门禁、Appearance 或 Fulfillment。
- 修改 creatorId、C-number 或确定 Offering Owner Anchor。
- API、适配器、读视图、事件、数据迁移或 VS-01 重构。
- 启用 Paid Service、支付或资金功能。
- 任何架构或工程实施。

**接受的完整方向与解释边界**：第三轮准备 §3 的现有 Service 切片定位、原合同连续性及有界渐进关联方向被接受。现行合同、未来可能增加的共享关联、未批准的产品行为变化、未批准的工程迁移必须分别说明。研究中 B+C 的演进方向不构成提取共享能力、创建适配器或并行实施新领域的授权。

Request 的 Confirm / Decline 与后续履约确认继续区分；FD-020-BD-01 的 Fulfillment Code / QR / Fulfillment Confirmation、FD-020-C3-BD-01 的限定 Appearance 保持原合同。Creator 同源 BFF、HttpOnly Opaque Session、服务端 Session 存储、Token 仅在服务端处理、Origin / CSRF、Refresh CAS、上游注销撤销及 Operations 身份隔离不改变。历史 creatorId 不改义，Identity 持有 C-number 的公开引用语义不改，受控 Capability / Template 发布链不因全球抽象而绕过。本次只登记兼容原则，不声称重新完成安全或业务运行验证。

**来源**：本次指令 §2 D11；第三轮准备 §3.1–§3.8；C5 §12、§15、§16 D11；现行 PRD 及具名修订、Decision29、FD-F02 / FD-F04。

## 4. D12 — Minimal Conceptual Validation Instance

**FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY。**

冻结内容：

1. 主验证对象：T07 + T12 + T14。
2. 必要反例：T04 / T05。
3. 接受原材料提出的九项成功 / 失败判据。
4. 接受逐项来源证据和未知事实不得补造的要求。
5. T07、T12、T14 是由既有压力场景构造的概念验证材料，不代表真实交易或完整真实业务事件。
6. 评价验证不得凭空创造已经发生的评价事实。
7. 任一失败判据成立，应返回相应概念决策讨论，不得通过超级状态或隐藏不一致宣布成功。
8. 验证结果必须区分已知、未知、假设和推导。

明确不批准：

- 本次执行静态概念验证。
- 原型或模拟系统。
- 数据库、Schema、API、DTO、事件或代码。
- 支付沙箱、真实资金或自动退款。
- 架构选型、工程验证或实施。
- 自动裁决 C4-A F11 或其他尚未批准事项。

未来若要开展静态概念验证，必须另行提交有明确范围的任务并获得授权。主对象为既有 T07 Service + Goods、T12 Buyer / Payer 分离和 T14 提议改版材料，必要反例为 T04 Membership、T05 Project；选择这些材料不启动样本执行，不创造支付、履行或评价已经发生的事实。

### 4.1 已接受的九项判据及原文定位

九项判据完整沿用 [第三轮准备材料 §4.6](../09_Engineering_Governance/PCI-ENG-020-C5-D10-D12-Third-Round-Founder-Decision-Preparation.md)的“原则 / 后续所需概念证据 / 成功判据 / 失败判据”九行表及其总体成功/失败要求，不删减、不以本次摘要代替原文。该文件保持字节不变；原文的“拟采用”“NOT PRODUCED / AWAITING FOUNDER DECISION”是提交时状态。本次只改变**判据被接受的状态**，没有产生验证结果。

| 判据 | 已接受的主题 | 权威原文位置 |
| --- | --- | --- |
| D01 | 共享基础与独立领域 | 第三轮准备 §4.6 表 D01 行及总体条件 |
| D02 | 上下文参与者 | 第三轮准备 §4.6 表 D02 行及总体条件 |
| D03 | 专业领域模型与共同协议 | 第三轮准备 §4.6 表 D03 行及总体条件 |
| D04 | 稳定引用与有类型定义 | 第三轮准备 §4.6 表 D04 行及总体条件 |
| D05 | 交易关联 | 第三轮准备 §4.6 表 D05 行及总体条件 |
| D06 | 责任独立 | 第三轮准备 §4.6 表 D06 行及总体条件 |
| D07 | 资金追溯 | 第三轮准备 §4.6 表 D07 行及总体条件 |
| D08 | 评价区分 | 第三轮准备 §4.6 表 D08 行及总体条件 |
| D09 | 组合交易与局部变化 | 第三轮准备 §4.6 表 D09 行及总体条件 |

本次接受上述完整判据及第三轮推荐的验证对象/反例，不批准任何执行或证明其已通过。尤其 D07 的假设金额/分配/退款关联不是资金事实，D08 评价维度或资格问题不能被填写成已经发生的评价。已知、未知、假设、推导的区分是未来有界验证必须遵守的证据要求，不是授权现在生成推演结果。

**来源**：本次指令 §2 D12；第三轮准备 §4.1–§4.8，尤其 §4.6；C5 §7.3 T04 / T05 / T07 / T12 / T14、§16 D12。原 C4-A F11 不因名称相近而自动裁决。

## 5. C5 D01–D12 统一概念决策登记

以下是当前状态的统一索引，完整定义和排除项仍以对应独立决定为准；不是将历史准备文字覆盖为当前状态，也不是新建十二项架构实施任务。

| 决定 | 已批准的概念方向 | 正式来源 | 当前状态 |
| --- | --- | --- | --- |
| D01 | Shared Commercial Facts Infrastructure + Six Independent Domain Expressions | Decision37 §2 | FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY |
| D02 | Contextual Participant Model | Decision37 §3 | FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY |
| D03 | Professional Domain Models + Common Protocol | Decision37 §4 | FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY |
| D04 | Shared Stable References + Typed Domain Definitions | Decision37 §5 | FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY |
| D05 | 共同交易关联与领域交易记录权威 | Decision38 §2 | FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY |
| D06 | Order / Commitment / Fulfillment / Payment 语义独立 | Decision38 §3 | FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY |
| D07 | 共享资金事实及账务追溯，领域解释义务与条件 | Decision38 §4 | FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY |
| D08 | 共享评价证据，专业评价尺度与 Reputation 投影 | Decision38 §5 | FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY |
| D09 | 跨域组合关联、五层边界及局部既成事实保留 | Decision38 §6 | FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY |
| D10 | 四类概念、事实来源/解释权区分及领域权威 | 本文件 §2 | FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY |
| D11 | 现有 VS-01 Service 切片、合同与安全连续性及有界演进 | 本文件 §3 | FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY |
| D12 | 指定概念材料、必要反例及九项判据，仅接受对象/判据 | 本文件 §4 | FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY |

C5 D01–D12 概念决策登记完成。闭合的是十二项的**概念批准状态**，不是全部领域问题、架构设计或验收。唯一 Owner Anchor、SYS / TX 最终选型、共享写入权威、数据库/聚合/状态机/事件/API/部署拓扑等仍未决定或未授权；C4-A F11、其他开放议题、C3-E 冲突和 Proposed ADR 不自动关闭或接受。

## 6. 共同授权边界与停止条件

```text
D01–D04 = FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY
D05–D09 = FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY
D10–D12 = FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY
C5 D01–D12 CONCEPTUAL DECISION REGISTRATION = COMPLETED

ARCHITECTURE FINALIZATION = NOT AUTHORIZED
CONCEPTUAL VALIDATION EXECUTION = NOT AUTHORIZED
PROTOTYPE = NOT AUTHORIZED
IMPLEMENTATION = NOT AUTHORIZED
PILOT = NOT AUTHORIZED
PRODUCTION = NOT AUTHORIZED
REAL_MONEY_ENABLED = false
```

上述状态是授权边界，不是对运行环境开关或数据库的检测结果。D01–D12 不构成数据库、API、聚合、状态机、Owner Anchor、部署拓扑或工程实现批准。本轮没有产品行为变化，不新增 DEV 产品偏差。

交付后立即停止，等待 Main Controller 审阅。不得自行开始 D12 静态验证、全球架构或 Shared Core 设计、数据模型/API 设计、原型或开发；任何后续活动均须独立范围与正式授权。
