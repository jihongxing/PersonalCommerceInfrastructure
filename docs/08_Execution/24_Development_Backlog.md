# 24 — 项目开发任务总清单

> **清单状态**：`草案，待 Founder / Main Control 接受`
> **文档语言**：简体中文；仅保留代码、任务编号、规范事件、产品对象和不可替代的专名原文
> **当前项目状态**：`SUSPENDED`
> **代码盘点基线**：`7c2a0d6`（不代表本文件或后续文档变更已提交）
> **盘点日期**：2026-10-09
> **实现授权**：本清单不替代 Founder 决策、产品合同或单项变更授权；列入清单不等于获准实现

## 1. 清单目的与覆盖范围

本文件把项目任务按“已完成基线、恢复治理、近期决策、未来阶段、运营准备、明确禁止”
统一整理，回答：

- 项目有哪些完整的工作流和阶段；
- 每项工作做到什么程度、当前状态是什么；
- 哪些是下一步，哪些只是未来候选；
- 每项工作依赖什么决定或证据；
- 做完如何验收；
- 哪些能力在当前阶段不得启动。

本文件是对仓库文档中已登记任务、验收要求、决策事项和长期候选的**逐文件盘点索引**，
不重新定义产品、不把长期方向自动变成排期，也不覆盖以下事实源。逐文件盘点范围与处理方式见
第 1.5 节；“完整”仅指按该节明确的盘点基线，对所有已识别的编号工作和验收要求逐项登记，
不表示背景假设已经验证，也不表示任何工作已获实施授权：

1. 冻结产品合同：[20_MVP_PRD_VS01.md](../07_Product_Architecture/20_MVP_PRD_VS01.md)；
2. 当前项目状态、暂停基线和 Resume Gate：[22_Project_Handoff.md](./22_Project_Handoff.md)；
3. 实际实现、偏差和验收证据：[21_Prototype_Execution.md](./21_Prototype_Execution.md)；
4. Founder 已接受的产品 / 架构决策和 `DEV-###`；
5. 各阶段的专项设计、运行准备和验收文档。

出现冲突时，以上述事实源为准；清单需随已接受的决策和执行证据更新。

### 1.1 权威状态与执行来源

- [项目暂停与恢复交接（Handoff）](./22_Project_Handoff.md)：项目状态、暂停基线、`RESUME-001` 和恢复闸门。
- [项目执行与验收台账](./21_Prototype_Execution.md)：已做变更、运行验证、偏差、验收和实际证据。
- [Stage 2 执行对账提案](./PCI-STAGE-2-EXECUTION-RECONCILIATION.md)：Stage 2 的提交、验收和决策对账候选；提案未被接受前不是权威结论。
- [受控外部 Pilot Readiness 审查](./23_Controlled_External_Pilot_Readiness_Review.md)：外部试点准备状态；不授权启动试点。
- [商业化准备执行记录](./22_Commercialization_Readiness_Execution.md)：商业准备工作的历史状态和验证证据。
- [工程治理规则](../09_Engineering_Governance/22_Engineering_Governance.md)：变更单元、产品边界、验证与执行台账要求。

### 1.2 产品、架构与决策来源

- [个人 Commerce Infrastructure 产品方向](../01_Strategy/05_Personal_Commerce_Infrastructure_Product_Direction.md)：阶段方向、对象模型、长期候选及 Founder 决策登记。
- [Commerce Reference 产品规范](../01_Strategy/07_Commerce_Reference_Product_Spec.md)：C号、输入规范、校验位、QR、Resolver 和公开入口的待决边界。
- [VS-01 冻结 PRD](../07_Product_Architecture/20_MVP_PRD_VS01.md)：当前 VS-01 产品实现合同及 `AT-001`–`AT-013`。
- [ADR-001](../07_Product_Architecture/21_ADR_001_Account_Actor_Identity_Commerce_Profile.md)、[ADR-002](../07_Product_Architecture/21_ADR_002_Current_Creator_Identity_Compatibility.md)、[ADR-003](../07_Product_Architecture/21_ADR_003_Commerce_Object_Ownership_and_Identity_Anchoring.md)、[ADR-004](../07_Product_Architecture/21_ADR_004_Availability_Inventory_Reservation_Boundary.md)、[ADR-005](../07_Product_Architecture/21_ADR_005_Commerce_Commitment_Composition_and_Lifecycle.md)、[ADR-006](../07_Product_Architecture/21_ADR_006_Stage_2_Commerce_Identity_and_Profile_Foundation.md)、[ADR-007](../07_Product_Architecture/21_ADR_007_Stage_2_Technical_Design_and_Implementation_Readiness.md)及[ADR-008](../07_Product_Architecture/21_ADR_008_Stage_2_Pre_Authorization_Decision_Closure.md)：分别核验账户 / Actor / Identity / Profile、旧 Creator Identity 兼容、对象归属、Availability / Reservation、Commitment 生命周期与 Stage 2 决策；ADR 状态不得按编号推定，现存 ADR 均须按正文所载状态和后续批准证据对账。
- [Stage 2 Founder 决策包](../07_Product_Architecture/22_Stage_2_Founder_Decision_Package.md)、[Stage 2 Runtime 入口决策包](../07_Product_Architecture/23_Stage_2_Runtime_Entry_Decision_Package.md)及 [ADR-006](../07_Product_Architecture/21_ADR_006_Stage_2_Commerce_Identity_and_Profile_Foundation.md)、[ADR-007](../07_Product_Architecture/21_ADR_007_Stage_2_Technical_Design_and_Implementation_Readiness.md)、[ADR-008](../07_Product_Architecture/21_ADR_008_Stage_2_Pre_Authorization_Decision_Closure.md)：Stage 2 产品决策、技术设计和实施授权边界。
- [Private Product Surface 决策包](../07_Product_Architecture/24_Private_Product_Surface_Decision_Package.md)、[Account–Identity Binding 决策包](../07_Product_Architecture/25_Account_Identity_Binding_and_Private_Surface_Decision_Package.md)、[Private Product Closure 审计](../07_Product_Architecture/26_Private_Product_Closure_Decision_Package.md)及 [Private Self-Service MVP 决策包](../07_Product_Architecture/27_Private_Self_Service_MVP_Decision_Package.md)：私有身份、Profile、自助闭环、待决政策和排除项。
- [Commerce Infrastructure 运营闭环模型](../07_Product_Architecture/28_Operating_Closure_Model.md)：`OV-001` 运营验证目标、岗位、证据和运行闸门。
- [Identity Anchor 与 C号治理](../09_Engineering_Governance/59_Identity_Anchor_and_Commerce_ID.md)：Identity、Commerce Profile、C号和公共入口边界。
- [Stage 2 语义对齐基线](../01_Strategy/05_Personal_Commerce_Infrastructure_Product_Direction.md)：已实现兼容面与未来正式对象合同的区分。
- [商业化准备执行记录](./22_Commercialization_Readiness_Execution.md)和[商业化准备切线](../09_Engineering_Governance/31_Commercialization_Readiness_Cutline.md)：CR-01–08 八项历史 Change Unit。
- [客户表面策略](../09_Engineering_Governance/57_Client_Surface_Strategy.md)：CLIENT-001 / CLIENT-002、Web / App 边界及未来原生客户端启动条件。
- [市场垂直扩展策略](../02_Market/50_Creator_Commerce_Vertical_Expansion_Strategy.md)及[Commerce Infrastructure 收敛审查](../09_Engineering_Governance/54_Commerce_Infrastructure_Convergence_Review.md)：已评估垂直候选、三种 Pattern 及扩展停止 / 重审条件。
- [商业模式与单位经济](../03_Business/10_Business_Model_and_Unit_Economics.md)、[GTM 策略](../03_Business/11_GTM_Strategy.md)和[PMF 与验证框架](../05_Validation/12_PMF_and_Validation_Framework.md)：仅为商业假设和验证方法；须经决策才转为实施任务。
- [Experiment Log](../05_Validation/Experiment_Log.md)：E-09-01–10、E-10-01–10、E-11-01–10，共 30 项提议实验。
- [DS-01D Web Reference Design System](../09_Engineering_Governance/29_DS01D_Web_Reference_Design_System_Implementation.md)：当前设计系统合同、门禁和历史验收。

### 1.3 工程、商业与运营专项来源

- [技术架构实施计划](../09_Engineering_Governance/24_Technology_Architecture_Implementation_Plan.md)、[M9 部署与运维 Runbook](../09_Engineering_Governance/30_M9_Deployment_and_Operations_Runbook.md)及 [客户端表面策略](../09_Engineering_Governance/57_Client_Surface_Strategy.md)：架构、部署、客户端边界、备份恢复和运行验收。
- [DS-01A 设计探索](../09_Engineering_Governance/26_DS01A_Design_Taste_Exploration.md)、[DS-01B 跨端 Token 合同](../09_Engineering_Governance/27_DS01B_Cross_Platform_Design_Token_Contract.md)、[DS-01C Token / 无障碍校准](../09_Engineering_Governance/28_DS01C_Token_Value_and_Accessibility_Calibration.md)、[DS-01D Web 设计系统实现](../09_Engineering_Governance/29_DS01D_Web_Reference_Design_System_Implementation.md)：设计探索、跨端 Token、无障碍校准与 Web 设计系统验收。
- [商业化准备切线](../09_Engineering_Governance/31_Commercialization_Readiness_Cutline.md)、[最小商业闭环](../09_Engineering_Governance/32_Minimum_Commercial_Loop.md)、[资金流决策 D-MCL-01](../09_Engineering_Governance/33_Money_Flow_Decision.md)、[Provider 资格审查档案](../09_Engineering_Governance/35A_Provider_Qualification_Dossier.md)：商业目标、资格输入、资金责任和真实资金闸门。
- [VS-02 付费服务 PRD](../09_Engineering_Governance/35_VS02_Paid_Service_PRD.md)、VS-02B 至 VS-02J 专项文件（`37`–`46`）及 [VS-02K 真实 Creator 非资金 Pilot](../09_Engineering_Governance/47_VS02K_Real_Creator_Pilot_Non_Money.md)：付费模型、Provider、运营准备、真实资金审查和非资金试点验收。
- [VS-02K 外部环境合同](../09_Engineering_Governance/48_VS02K_EXT_READY_Controlled_External_Pilot_Environment.md)、[外部部署包](../09_Engineering_Governance/49_VS02K_EXT02_External_Pilot_Deployment_Package.md)、[Phase 5 真实 Creator Pilot 执行合同](../09_Engineering_Governance/55_Phase5_Real_Creator_Pilot_Execution.md)及[外部 Pilot 激活闸门](../09_Engineering_Governance/56_Phase5_External_Pilot_Activation_Gate.md)：真实外部环境、部署、三种 Pattern 试点、激活与关闭验收。
- [Commerce Infrastructure 收敛审查](../09_Engineering_Governance/54_Commerce_Infrastructure_Convergence_Review.md)、[VS-02L01–L03 垂直切片](../09_Engineering_Governance/51_VS02L01_Cosplayer_Convention_Appearance_Request.md)及 [CLIENT-002 黄金路径闭合](../09_Engineering_Governance/58_CLIENT002_Commerce_Golden_Path_Closure.md)：历史切片、复用结论和回归基线。

### 1.4 背景材料与候选方向

项目论点、愿景、核心抽象、北极星、市场分类、垂直机会、商业模型、GTM、MVP 论点与 PMF 框架用于支持决策，不自动形成开发任务。相关材料包括 `docs/01_Strategy/01–04`、`docs/02_Market/`、`docs/03_Business/`、`docs/04_Product/` 和 `docs/05_Validation/`。其中明确编号的决策、验收与实验均在本清单对应索引中登记；其余仍是待验证假设或背景，不得据此推导实施授权。

逐文件范围、计数和映射见第 1.5 节。背景材料不自动构成工作包；已批准项也须按实际状态保留，不得把“列入清单”解释为授权。

### 1.5 项目文档逐文件覆盖盘点

代码状态基线为 `7c2a0d6`，文档盘点日期为 2026-10-09。逐一检查工作区 `docs/` 内 95 份 Markdown 文件
（包括索引、Provisioning 说明及本总表）。对每份文件登记明确编号工作的对应章节，或其作为
背景、已完成证据、运行手册、决策来源 / 约束的处理结论。该索引列出文件级去向；明确编号的决策、
发现、开放问题、运行任务和验收项必须在后续表格逐项展开，不以范围概括或编号区间代替明细；
来源文件的验收条款仍为准。

| 来源文件 | 明确任务 / 决策映射或排除说明 |
| --- | --- |
| `docs/README.md` | 当前项目状态与事实源索引；第 3、5、19 节。 |
| `docs/01_Strategy/01_Project_Thesis.md`、`02_Vision_and_Endgame.md`、`03_Core_Abstraction.md`、`04_North_Star_End_State.md` | 项目命题、愿景、领域抽象和长期指标为背景 / 方向；不生成独立实现任务。 |
| `docs/01_Strategy/05_Personal_Commerce_Infrastructure_Product_Direction.md` | 阶段 0–5、Future、Founder Decisions Register 与冻结 / 未授权边界；第 7–14、16 节。 |
| `docs/01_Strategy/06_Commerce_Reference_Platform_Compatibility_Research.md`、`06_Commerce_Reference_Research.md` | 平台兼容性和标识研究；尚未批准的规则进入第 7.2 节决策核验及第 9 节 Stage 3；其余为研究证据。 |
| `docs/01_Strategy/07_Commerce_Reference_Product_Spec.md` | Commerce Reference / C号、QR、输入、Resolver 和公开入口未决项；第 7.2、9 节。 |
| `docs/02_Market/04_Creator_Commerce_Taxonomy.md`、`05_Creator_Vertical_Taxonomy.md`、`07_Creator_Commerce_Opportunity_Matrix.md` | 市场分类和机会矩阵属背景及待验证假设；已形成的 VS-02L 切片与 `VERTICAL-MAP-001` 见第 6.3、6.7 节。 |
| `docs/02_Market/50_Creator_Commerce_Vertical_Expansion_Strategy.md` | 垂直扩展、优先级与停止条件；第 6.3、14 节；不授权新增垂直实现。 |
| `docs/03_Business/10_Business_Model_and_Unit_Economics.md` | `D-10-01`–`D-10-10`、第 21 节 15 项开放问题；分别见第 10.2、10.3 节，实验见第 15 节。 |
| `docs/03_Business/11_GTM_Strategy.md` | `D-11-01`–`D-11-10`、第 22 节 15 项开放问题；决策与开放问题分别见第 10.2、10.3 节，实验见第 15.3 节，首发城市 / cohort 核验见第 5、13、16 节。 |
| `docs/04_Product/06_MVP_Thesis.md`、`08_MVP_Wedge_Strategy.md` | MVP 命题、Wedge 假设、`D-08-01`–`D-08-08`、第 20 节 12 项开放问题；已登记决策见第 10.2 节，开放问题见第 10.3 节；具体实现范围以冻结 PRD 为准。 |
| `docs/04_Product/09_MVP_Product_Definition.md` | `D-09-01`–`D-09-10`、第 23 节 15 项 PRD 开放问题；已登记决策见第 10.2 节，开放问题见第 10.3 节，实验见第 15.1 节，产品实现合同以 VS-01 / VS-02 PRD 为准。 |
| `docs/05_Validation/12_PMF_and_Validation_Framework.md` | PMF 定义、证据等级、样本与观察框架；作为实验设计和结果判读约束，不另建功能任务。 |
| `docs/05_Validation/Experiment_Log.md` | E-09、E-10、E-11 共 30 项候选实验；逐项见第 15.1–15.3 节。 |
| `docs/06_Audit/13_Document_Audit_and_Consistency_Review.md` | `F-13-01`–`F-13-10`；逐项见第 16 节。 |
| `docs/06_Audit/15_MVP_Build_Readiness.md` | `D-15-01`–`D-15-07`、各项复核触发条件和历史 Build Gate；第 16 节逐项映射，不继承旧生产 / 资金授权。 |
| `docs/07_Product_Architecture/16_Product_Architecture.md`、`17_Core_Product_Objects.md`、`18_MVP_Product_Flow.md`、`19_MVP_Product_Specification.md` | 历史产品架构、对象、流程与规范；以冻结 PRD 和已批准决策为准，已登记 VS-01 验收见第 6.2 节。 |
| `docs/07_Product_Architecture/20_MVP_PRD_VS01.md` | VS-01 冻结合同、FR-001–FR-053、`AT-001`–`AT-013`；第 6.2 节逐项列出验收矩阵。 |
| `docs/07_Product_Architecture/21_ADR_001_Account_Actor_Identity_Commerce_Profile.md` 至 `21_ADR_008_Stage_2_Pre_Authorization_Decision_Closure.md` | ADR-001–008；第 7 节逐项核对建议、批准状态和实施授权。 |
| `docs/07_Product_Architecture/22_Stage_2_Founder_Decision_Package.md`、`23_Stage_2_Runtime_Entry_Decision_Package.md` | `STAGE2-DECISION-001`–`009`、`RUNTIME-DECISION-001`–`014`；第 7.2 节逐项列明复核主题。 |
| `docs/07_Product_Architecture/24_Private_Product_Surface_Decision_Package.md`、`25_Account_Identity_Binding_and_Private_Surface_Decision_Package.md`、`26_Private_Product_Closure_Decision_Package.md` | `SURFACE-001`–`005` 历史授权 / 执行证据及后续闭合关系；第 7.4、7.5、8.1 节。 |
| `docs/07_Product_Architecture/27_Private_Self_Service_MVP_Decision_Package.md` | Self-Service Acceptance-004、`PRIV-DEC-01`–`08` 与未授权后续项；第 7.5、8.2 节。 |
| `docs/07_Product_Architecture/28_Operating_Closure_Model.md` | `OV-001` 目标、证据、岗位与运营闭环门槛；第 13 节逐项核验。 |
| `docs/08_Execution/21_Prototype_Execution.md` | 历史实现、DEV / 变更单元、测试证据和 `PCI-DEVELOPMENT-BACKLOG-001` 记录；第 3、5–8、13、19 节。 |
| `docs/08_Execution/22_Project_Handoff.md` | `RESUME-001`、暂停基线与 9 项恢复闸门；第 3、5、19 节。 |
| `docs/08_Execution/22_Commercialization_Readiness_Execution.md` | `CR-01`–`CR-08` 历史交付及回归边界；第 6.6 节。 |
| `docs/08_Execution/23_2026-08-15_Handoff.md` | 已被后续 Handoff / 执行台账更新的历史交接；仅作时间线证据，不产生新任务。 |
| `docs/08_Execution/23_Controlled_External_Pilot_Readiness_Review.md` | 外部 Pilot 就绪 / 阻塞 / 激活边界；第 6.8、13、17 节。 |
| `docs/08_Execution/PCI-HARDEN-001_RESULT.md` | 加固变更的历史实现与验证结果；作为当前回归 / 漂移核对输入，不自动重开已完成工作。 |
| `docs/08_Execution/PCI-STAGE-2-EXECUTION-RECONCILIATION.md` | 提案中的 Stage 2 提交、验收和决策对账项；第 5、7 节；须与当前提交重新核对并经接受。 |
| `docs/08_Execution/24_Development_Backlog.md` | 本文件；纳入本次逐文件盘点，不把自身描述视为批准或实现证据。 |
| `docs/09_Engineering_Governance/22_Engineering_Governance.md`、`36_Engineering_Governance_Delta.md`、`architecture-and-directory.md`、`code-style-and-naming.md`、`configuration-and-secrets.md`、`external-dependencies.md` | 工程治理、架构、命名、配置、外部依赖与变更验收约束；第 2、18 节。 |
| `docs/09_Engineering_Governance/23_Technology_Architecture_Decision.md`、`24_Technology_Architecture_Implementation_Plan.md` | 技术选型、ENG-005–008 与 CU-TA-01–07；第 6.1.1、6.4 节，历史完成项按恢复审查重验。 |
| `docs/09_Engineering_Governance/25_User_Facing_Language_Governance.md` | 用户文案的事实等级与真实性约束；第 18 节。 |
| `docs/09_Engineering_Governance/26_DS01A_Design_Taste_Exploration.md` 至 `29_DS01D_Web_Reference_Design_System_Implementation.md` | DS-01A–D 设计探索、Token 契约 / 校准及 Web 实现状态；按各专项验收与先决条件核对状态和依赖，不把设计探索自动排成新实现。 |
| `docs/09_Engineering_Governance/30_M9_Deployment_and_Operations_Runbook.md` | M9 部署、运维、恢复和就绪证据；第 6.3、19 节保留重验边界，不授权部署。 |
| `docs/09_Engineering_Governance/31_Commercialization_Readiness_Cutline.md` | C1–C5 与 `CR-01`–`CR-08`；第 6.6 节。 |
| `docs/09_Engineering_Governance/32_Minimum_Commercial_Loop.md`、`33_Money_Flow_Decision.md`、`34_Commerce_Pattern_Settlement_and_Wallet_Model.md`、`35_China_Creator_Settlement_Infrastructure_Map.md`、`35A_Provider_Qualification_Dossier.md` | 商业闭环、D-MCL-01、资金模型和 Provider 资格；第 12 节。中国大陆与 CNY 已登记为首发约束；法律主体、Provider 资格和真实资金仍阻塞。 |
| `docs/09_Engineering_Governance/35_VS02_Paid_Service_PRD.md`、`37_VS02B_Provider_Integration_Readiness.md`、`38_VS02C_Provider_Adapter_Qualification.md`、`39_VS02D_Controlled_Real_Money_Integration.md`、`39A_VS02D_Controlled_Real_Money_Activation_Readiness.md` | VS-02A–D / `DEV-006`–`DEV-009` 的产品边界、资格、实施准备和激活门槛；第 6.3、6.7、12、17 节；真实资金不在本清单授权范围。 |
| `docs/09_Engineering_Governance/40_VS02E_Local_Commercial_Simulation.md`、`41_VS02E_Commercial_Lifecycle_Hardening.md`、`42_VS02F_Local_Paid_Commerce_Productization.md`、`43_VS02G_Official_Provider_Sandbox_Integration.md`、`44_VS02H_Commercial_Pilot_Operations_Readiness.md`、`45_VS02I_First_Commerce_Pilot_Preparation.md`、`46_VS02J_Founder_Real_Money_Activation_Review.md` | VS-02E–J 模拟、生命周期、产品化、官方 Sandbox、Pilot 准备及真实资金审查；第 6.7 节逐包列出状态和真实 / 模拟边界。 |
| `docs/09_Engineering_Governance/47_VS02K_Real_Creator_Pilot_Non_Money.md`、`48_VS02K_EXT_READY_Controlled_External_Pilot_Environment.md`、`49_VS02K_EXT02_External_Pilot_Deployment_Package.md` | PILOT-K01–12、EXT-READY、EXT2-01–12；第 6.8 节。 |
| `docs/09_Engineering_Governance/51_VS02L01_Cosplayer_Convention_Appearance_Request.md`、`52_VS02L02_Photographer_Session_Reservation_Design.md`、`53_VS02L03_Commercial_Appearance_Contract_Design.md`、`54_Commerce_Infrastructure_Convergence_Review.md` | VS-02L01–L03 垂直切片及收敛审查；第 6.3、6.7 节，历史探索不自动授权扩展。 |
| `docs/09_Engineering_Governance/55_Phase5_Real_Creator_Pilot_Execution.md`、`56_Phase5_External_Pilot_Activation_Gate.md` | REAL-PILOT-01–10、激活、运行、停止与关闭闸门；第 6.8 节，未获激活不运行。 |
| `docs/09_Engineering_Governance/57_Client_Surface_Strategy.md`、`58_CLIENT002_Commerce_Golden_Path_Closure.md` | CLIENT-001 / CLIENT-002、Web 与 `apps/app` 边界、黄金路径回归；第 5、6、17、19 节。 |
| `docs/09_Engineering_Governance/59_Identity_Anchor_and_Commerce_ID.md` | Identity / Commerce Profile / C号边界、重返审查和明确非目标；第 5、7–9、17、19 节。 |
| `docs/Provisioning/PostgreSQL_Integration_Environment.md` | RUNTIME-007 真实 PostgreSQL 环境先决条件与预检契约；第 5、7 节。 |
| `docs/08_Execution/`、`docs/09_Engineering_Governance/` 中未在上列单独列出的其他 Markdown 文件 | 已逐份检查：若仅记录已完成结果、历史运行、决策证据或重复 / 被取代的交接，不另造任务；其编号和状态仍按第 5–8、12–19 节的执行台账映射复核。该归类不覆盖来源文件日后新增的未映射任务。 |

背景、研究、历史完成和已取代材料仍纳入了文件级盘点，但不因此转成待开发任务。若在上述基线之后
新增文档、任务编号或已批准决策，须在下次任务清单修订时重新盘点；在复核前不得声称覆盖新增内容。

## 2. 状态与授权规则

| 状态 | 含义 |
| --- | --- |
| `已完成` | 有可追溯的实现和验收记录；不代表本清单已获接受。 |
| `基线保持` | 已有能力必须继续通过回归，不是新开发。 |
| `待核验` | 文档、代码或测试状态相互冲突，先调查，不可宣称完成或失败。 |
| `待接受` | 任务范围已整理，需 Founder / Main Control 接受本清单或任务包。 |
| `待决策` | 需要产品、架构、商业或安全决策；未决策前不可选定实现方案。 |
| `待授权` | 方案已准备，但还没有该实现单元的明确授权。 |
| `阻塞` | 前置依赖、环境、参与者、责任人或证据尚未满足。 |
| `可执行` | 任务具备明确授权、范围和验收，可在 Resume Gate 满足后开展。 |
| `暂停` | 受项目 `SUSPENDED` 状态约束，当前不得启动。 |
| `明确不做` | 当前阶段排除或未授权，不得从其他任务中顺带实现。 |

### 2.1 每个实现包的最低准入信息

转为 `可执行` 前，任务包必须至少写明：

- 唯一任务编号、负责人 / 决策人及批准记录；
- 产品需求、领域对象、状态转换、规范事件和权限影响；
- 明确包含项、排除项、前置依赖和回滚 / 失败语义；
- `DEV-###` 偏差及产品决策（若改变产品行为）；
- 单元、应用、持久化、集成、浏览器和 Acceptance Test 证据；
- 执行台账更新位置及完成判据。

## 3. 当前全局状态

权威 Handoff 记载：

```text
PROJECT_STATUS = SUSPENDED
SUSPEND_BASELINE = CLIENT-002 — Commerce Golden Path Closure
REAL_MONEY_ENABLED = false
apps/app = DEFERRED
```

Handoff 中的当前恢复任务是：

```text
RESUME-001 — Identity & External Platform Binding Foundation
```

`RESUME-001` 首先要求重返审查；它本身不授予实现许可。只有 Handoff 的 Resume Gate 全部满足，
且 Founder 明确批准某个实施单元，项目才可从暂停状态恢复。

另有数项必须在恢复审查中处理的权威状态冲突：

- Product Direction 在不同段落分别记载 Stage 2 已授权和未授权；
- 执行台账记载 Founder 已批准部分 `STAGE2-DECISION-001`–`009` 并完成多个 Runtime 单元，
  但 Stage 2 Founder / Runtime 决策包仍包含等待填写的决策表；
- `ADR-008` 将七项实现前决策标成 `PROPOSED / NOT_GRANTED`；
- Stage 2 reconciliation 是未获接受的提案，且描述提交前的代码和测试状态；
- Handoff 仍记录项目 `SUSPENDED`，而新提交已加入大量 Identity / Private Surface 实现。

清单不自行选择任一来源覆盖其他来源。必须核对决策原始证据（签署、批准记录、DEV 记录、执行证据）
并请求 Founder / Main Control 对当前有效状态作唯一裁定。

## 4. 项目工作流总览

| 工作流 | 当前状态 | 下一动作 |
| --- | --- | --- |
| VS-01 产品原型和商业黄金路径 | `已完成；作为回归基线` | 保持 `AT-001`–`AT-013`、CLIENT-001、CLIENT-002 回归 |
| VS-02 本地商业化及垂直探索 | `历史阶段已记录；不自动重开` | 仅在重新确认商业目标后选择后续包 |
| Identity / Commerce Profile / Private Runtime | `大量实现已提交；整体状态待核验` | 先对账代码、决策、偏差、测试和 PostgreSQL 证据 |
| Self-Service 私有闭环 | `ACCEPTANCE-004 记为 READY_FOR_PILOT；全局工程仍有问题` | 保留验收事实；重评全局 preflight 和 Pilot 条件 |
| Commerce Reference 公共入口 / Stage 3 | `明确未授权` | 不开发；等待独立 Founder 决策 |
| External Platform OAuth / 验证 | `明确未授权` | 不开发；等待独立证据政策和安全决策 |
| OV-001 真实运营验证 | `已授权实验但 NOT_READY，未启动` | 等待真实参与者、环境、责任和证据输入 |
| 支付和真实资金 | `关闭 / 延后` | 保持 `REAL_MONEY_ENABLED=false` |
| 后续 Offer、Inventory、Fulfillment、Reputation 扩展 | `产品方向已定义，实施范围待决策` | 独立产品合同、架构决策和 `DEV-###` 后再排序 |

## 5. 第一顺位：RESUME-001 重返审查包

**任务编号**：`RESUME-001`  
**组成子包**：`PCI-BACKLOG-RECONCILIATION-001 — Stage 2 实施与证据对账`  
**状态**：`Handoff 指定的恢复任务；尚未开始；项目仍暂停`  
**性质**：审查与治理工作，不是功能开发。

执行审查前仍需遵守 Resume Gate：Founder 未明确接受恢复审查安排时，不把 backlog 草案本身解释为项目解冻。

### 5.1 任务清单

1. 阅读 Handoff SSOT 和 `59_Identity_Anchor_and_Commerce_ID.md`；
2. 检查当前提交 `7c2a0d6` 与 `suspend/client-002-complete-identity-reentry` 暂停基线 tag 的关系；
3. 运行仓库规定的完整工程 preflight；
4. 独立验证 CLIENT-001 和 CLIENT-002 回归；
5. 检查代码、依赖、数据库迁移、产品文档、工程文档和执行台账之间的漂移；
6. 执行子包 `PCI-BACKLOG-RECONCILIATION-001`：将
   `PCI-STAGE-2-EXECUTION-RECONCILIATION.md` 与已提交实现及最新测试结果逐项对齐；
7. 核验 `S2-001`–`S2-009`、`IDENTITY-001`–`003`、`RUNTIME-001`–`007`、`SURFACE-001`–`005` 的授权、实现和验收状态；
8. 核实 `DEV-###` 登记，确认代码 / 文案 / UI 行为没有未登记产品偏差；
9. 更新 `21_Prototype_Execution.md` 的执行证据，保留失败和阻塞；
10. 对 Product Direction、Stage 2 决策包、Handoff 与执行 SSOT 中的阶段授权冲突提出明确裁决请求；
11. 重新确认 Founder 当前商业目标；
12. 形成一个或多个边界明确的候选实施单元，等待 Founder 决策，不先写功能代码。
13. 逐一核对 `STAGE2-DECISION-001`–`009`、`RUNTIME-DECISION-001`–`014` 的批准记录和当前效力；
14. 逐项核对 `ADR-008` 七项提议是否已被后续 Founder 决策取代、接受或拒绝；
15. 复核 M9、CU-TA-01–07、M2–M8 的历史证据是否仍适用于当前代码和环境；
16. 复核所有文档记载的 `COMMITTED = NO` / `Uncommitted` 是否因 `7c2a0d6` 已过时。

### 5.2 完成判据

- Handoff 所列 Resume Gate 每项都有 `PASS / FAIL / BLOCKED` 和证据；
- 当前 commit、暂停 tag、实际功能基线之间的差异已解释；
- 所有 Stage 2 项目都被标记为完成、部分完成、失败或待证据，并有引用；
- 变更偏差、测试失败和环境限制均已显式记录；
- 阶段授权冲突已提交 Founder / Main Control 处理，未由工程执行者自行改写产品权威；
- 已提出下一项实施建议，但未将建议冒充成批准。

### 5.3 本任务包的交付物

1. 已填写的 Resume Gate 检查表；
2. Stage 2 `S2-001`–`S2-009` 对账矩阵及每项代码 / 测试 / Migration 证据；
3. 两个 `commerce-relationship` 测试失败的领域合同判断和处置建议；
4. Product Direction、Handoff、决策包和执行记录的阶段状态差异表；
5. 当前 `DEV-###` 完整性检查；
6. Founder 可直接填写的下一实施单元决策表。
7. Founder / Main Control 可引用的决策原始证据位置和逐项效力结论；
8. 以本次 commit 为基线的代码、文档、迁移、验证和外部环境差异表。

### 5.4 关联当前已知验证

2026-10-09 对提交 `7c2a0d6` 的验证：

```text
pnpm typecheck = PASS
pnpm lint = PASS
pnpm test = FAIL
518 passed, 2 failed, 41 skipped
```

两个失败在 `tests/persistence/commerce-relationship.test.ts`：

1. Schema 列断言没有包含现有 `provenance` 字段；
2. 持久化重建返回 `UNKNOWN`，而测试期望 `SELF_DECLARED`。

这两项是待核验问题。必须根据领域合同、迁移、Repository 和 Acceptance-004 证据判断应修实现还是测试合同；不可为通过测试而臆测预期。

## 6. 已完成能力清单：VS-01 与 VS-02

### 6.1 M1–M8 与 M1.5 里程碑

| 里程碑 | 范围 / FR | 执行台账状态 | 完成条件概要 |
| --- | --- | --- | --- |
| M1 — 工程基础 | 权限、对象归属、状态机、Canonical Event；FR-001–005、FR-043–044 | `内部完成` | 权限 / 状态校验、事件记录、治理和测试入口建立 |
| M1.5 — 跨端工程基础 | 应用层、端口、API、PostgreSQL、认证、Web、验收框架 | `CU-TA-01`–`CU-TA-07 完成` | 跨端工程边界、真实 Provider 验证及验收框架建立 |
| M2 — Creator Identity | FR-001–005 | `完成` | Creator Identity 创建、编辑、状态和验收 |
| M3 — Service Offering 与 Availability | FR-006–013 | `完成` | Offering、Capability 关联、请求条件和 Eligibility |
| M4 — 发布与分享 | FR-014–022 | `完成` | Publish、Distribution Asset、外部分发事实和 Unpublish |
| M5 — Customer Request | FR-023–033 | `完成` | Published Offering 读取、合法 Request 和拒绝路径 |
| M6 — Creator Confirm / Decline | FR-034–042 | `完成` | 授权决策、终态保护、幂等和 Customer 结果 |
| M7 — 事件与通知 | FR-043–053 | `完成` | 规范事实、通知、失败隔离和外部观察边界 |
| M8 — VS-01 验收 | FR-001–053 与 PRD 验收标准 | `完成 / 原型就绪` | `AT-001`–`AT-013`、CLIENT-001 和 CLIENT-002 有执行记录 |

里程碑历史完成不表示最新代码在当前机器上的完整 preflight 必然通过。后续恢复时仍须按当前提交重新验证。

### 6.1.1 CU-TA-01 至 CU-TA-07：跨端工程基础单元

| 编号 | 工程任务 | 完成证据概要 | 当前安排 |
| --- | --- | --- | --- |
| CU-TA-01 | 工作区边界准备 | `applications/`、`contracts/` 边界和导入边界 | 历史完成；回归基线 |
| CU-TA-02 | 应用核心与端口 | Actor Context、核心 Port、事件记录、Unit of Work | 历史完成；回归基线 |
| CU-TA-03 | API 合同与运行时骨架 | Fastify、TypeBox、错误 Envelope、OpenAPI、独立 API | 历史完成；回归基线 |
| CU-TA-04 | PostgreSQL 持久化基础 | Migration、事务提交 / 回滚、幂等验证 | 历史完成；本次工程 preflight 重验 |
| CU-TA-05 | 认证基础 | Auth Port、Supabase Adapter、Bearer Contract、真实 Provider | 历史完成；外部环境按需重验 |
| CU-TA-06 | Web 参考客户端基础 | Next.js、生成 API Client、Auth / Error Adapter | 历史完成；构建 / 类型检查重验 |
| CU-TA-07 | 验收测试框架 | Playwright、API / Web 启动和浏览器入口 | 历史完成；浏览器验收重验 |

### 6.1.2 FR 与 AT 追溯工作

| 编号 | 范围 | 任务 |
| --- | --- | --- |
| TRACE-01 | FR-001–FR-005 | Creator Identity、Capability、权限、公开入口拒绝 |
| TRACE-02 | FR-006–FR-013 | Service Offering、Availability、Publish Eligibility |
| TRACE-03 | FR-014–FR-022 | Publish / Unpublish、Distribution Asset、外部分发事实 |
| TRACE-04 | FR-023–FR-033 | Published Storefront、Customer Request、输入拒绝与结果访问 |
| TRACE-05 | FR-034–FR-042 | Creator Confirm / Decline、身份权限、终态与幂等 |
| TRACE-06 | FR-043–FR-053 | Canonical Event、通知、通知失败隔离、外部观察边界 |
| TRACE-07 | AT-001–AT-013 | 按 VS-01 PRD 逐项核对 Given / When / Then、自动化位置、外部依赖和实际结果 |

以上 FR / AT 为已完成产品能力的可追溯维护任务。**不得把追溯维护解释为可修改 VS-01 产品合同**；
任何行为变化必须先走 `DEV-###` 与产品决策流程。

### 6.2 VS-01：保留为冻结回归基线

| 编号 | 已完成能力 | 未来验收要求 |
| --- | --- | --- |
| P-01 | Creator Identity 和 Creator Commerce Desk | 既有 M2–M8 测试和兼容行为通过 |
| P-02 | Service Offering 和 Creator Commerce 表达 | VS-01 PRD 与 API / UI 契约一致 |
| P-03 | Customer Request、确认和拒绝 | 保持状态转换、错误路径和 AT 覆盖 |
| P-04 | Availability / Reservation | 库存、hold、冲突、确认和历史语义回归 |
| P-05 | Contract Commerce | Scope Version、双方接受、Proposal expiry 回归 |
| P-06 | Completion、Earnings / Wallet Projection | 完成驱动投影；不被误称为真实结算 |
| P-07 | CLIENT-001 Pattern-first Web Client | Web reference client 回归 |
| P-08 | CLIENT-002 Commerce Golden Path | Request / Reservation / Contract 到 Completion 的黄金路径回归 |
| P-09 | `AT-001`–`AT-013` | 继续是 VS-01 最高产品验收边界 |

以上状态依执行记录中的证据为准；列在这里是防回归，不表示所有环境型验收当前都重跑通过。

### 6.2.1 AT-001 至 AT-013 验收项目

详细步骤继续以冻结 PRD 第 9 节和执行台账第 10 节为准。下表是回归索引，不取代原验收文本。

| 验收编号 | 验收主题 | 通过后证明的产品事实 | 恢复时的任务 |
| --- | --- | --- | --- |
| AT-001 | Identity → Capability → Draft Offering | Creator 完成供给准备；未发布前没有 Buyer Request 入口 | 当前代码回归 |
| AT-002 | 不完整 Offering 尝试 Publish | Publish 被阻止、缺失条件明确、不产生 `creator_published` | 当前代码回归 |
| AT-003 | 合格 Offering Publish | Identity 正确公开，Asset 为 Generated，不自动 Distributed | 当前代码回归 |
| AT-004 | Creator 记录真实外部分发 | Asset 变为 Distributed 并记录 `creator_distributed` | 当前代码回归 |
| AT-005 | Buyer 查看公开 Storefront | 只展示当前 Published / 可请求供给并记录 `storefront_viewed` | 当前代码回归 |
| AT-006 | Buyer 提交合法 Request | 建立 Customer / Submitted Action，记录事件并通知 Creator | 当前代码回归 |
| AT-007 | 非法 / 不可用 Request | 不建立 Action、不产生提交事件，返回正确错误或不可用状态 | 当前代码回归 |
| AT-008 | Creator Confirm | Action → Confirmed，产生 `commerce_confirmed`，Customer 获得非支付语义结果 | 当前代码回归 |
| AT-009 | Creator Decline | Action → Declined，产生 `commerce_declined`，Customer 获得正确结果 | 当前代码回归 |
| AT-010 | 重复 / 越权终态操作 | 状态不变、不产生重复终态事件 | 当前代码回归 |
| AT-011 | 既有 Submitted Action 后 Unpublish | 阻止新 Request，既有 Action 仍能处理 | 当前代码回归 |
| AT-012 | 外部付款 / 履约观察 | 只记录受控 observation event，不产生支付状态、GMV 或 Take Rate | 当前代码回归 |
| AT-013 | Explicit Non-goal 检查 | 不出现 Payment、Settlement、Refund、Marketplace、CRM、自动排期或履约工作流 | 当前代码回归 |

### 6.3 M9 部署运维及 VS-02 / 垂直切片

| 编号 | 任务 | 已有资产 / 后续核验 |
| --- | --- | --- |
| M9-01 | API / Web 镜像构建 | 依赖可重复安装、有效 Build 和镜像安全检查；密钥不得写入镜像；按 `30_M9_Deployment_and_Operations_Runbook.md` 留证 | `历史资产已存在；当前版本待核验` |
| M9-02 | 类生产环境启动顺序 | PostgreSQL 就绪 → 独立 Migration Job → API Readiness → Web；不得在应用启动时隐式执行 Schema Push | `历史资产已存在；当前版本待核验` |
| M9-03 | 部署 Smoke 检查 | Health、Readiness、OpenAPI、Web 关键入口和依赖状态均有结果；失败时非零退出 | `历史资产已存在；当前版本待核验` |
| M9-04 | 备份、恢复与回滚演练 | 备份可恢复到独立数据库；恢复后 Migration / Health / Readiness 通过；应用回滚不删除合法业务事实 | `OV-001 外部环境执行仍阻塞` |
| M9-05 | 最低告警和密钥纪律 | 验证最低运行告警、Secret 来源、注入、轮换和泄漏响应；日志不输出 Secret | `按目标环境待核验` |
| DS-01A | 设计品味探索 | 记录目标人群、产品气质、反例、设计原则和评审结论；探索结果不直接成为冻结 Token | `历史设计资产；状态待核验` |
| DS-01B | 跨端设计 Token 合同 | 冻结 Token 命名、语义、跨端映射、扩展和变更规则；生成物不得手工漂移 | `历史设计资产；状态待核验` |
| DS-01C | Token 数值与无障碍校准 | 验证颜色对比、字体、间距、焦点、键盘和减少动态效果等适用标准；问题有修复或明确例外 | `历史设计资产；状态待核验` |
| DS-01D | Web 参考设计系统实现 | Web Token Adapter、组件、业务表面边界、文案和无障碍门禁通过专项验收 | `历史设计资产；状态待核验` |

M9 与 VS-02 有运行工具不代表真实 Pilot 已部署、真实资金已打开或 OV-001 已开始。
VS-02E 至 VS-02L03 及 Commerce Infrastructure Convergence 属于有历史证据的阶段；复开前须重新确认商业目标和授权。

### 6.3.1 VS-02 详细工作流索引

| 阶段 / 任务编号 | 范围 | 当前状态（执行台账记载） | 后续动作 |
| --- | --- | --- | --- |
| `VS-02A` / `DEV-006` | Provider 中立资金领域与付费 Commerce | `以 VS-02 PRD、31 / 32 / 34–36 及后续构建记录为事实源` | 保留状态和历史回归；不得用资金能力推导真实收款授权 |
| `VS-02B` / `DEV-007` | Provider 中立接入准备 | `历史 Readiness 包；按台账核验` | Provider 资格和当前外部条件另行追踪 |
| `VS-02C` / `DEV-008` | 微信支付 Adapter 工程资格化 | `工程资格已完成；真实业务资格和官方 Sandbox 仍有条件` | 不接生产资金；按 D-MCL-01 核验 Provider 资格 |
| `VS-02D` / `DEV-009` / `VS-02D-READY-001` | 受控真实资金集成与激活就绪审查 | `历史工程 Readiness = READY；真实激活仍未授权` | 保持 Kill Switch 关闭；不得由本清单启用 |
| `VS-02E` | 本地商业模拟 | `COMPLETE` | 模拟事实不可冒充 Provider / 真实交易证据 |
| `VS-02F` | 本地付费 Commerce 产品化 | `历史完成记录` | 本地 paid commerce 不等于真实收费或资金 |
| `VS-02G` / `DEV-015` | 官方 Provider Sandbox | `Conditional；Adapter 边界完成、官方 Sandbox 外部阻塞` | Sandbox 不可替代生产资格或真实验收 |
| `VS-02H` / `DEV-016` | 商业 Pilot 运营准备 | `Completed — Verified` | 不代表已开始真实运营 |
| `VS-02I` / `DEV-017` | First Commerce Pilot 准备 | `Completed — Verified` | 不代表 Founder 已开启真实资金或批准首笔交易 |
| `VS-02J` / `DEV-018` | Founder 真实资金激活审查 | `Controller Review` | 需独立决策；保持 `REAL_MONEY_ENABLED=false` |
| `VS-02K` / `DEV-019` | 真实 Creator 非资金 Pilot | `进行中；需要外部执行` | 按本节 PILOT-K / REAL-PILOT 矩阵和就绪审查记录 |
| `VS-02K-EXT-READY` / `DEV-020` | 受控外部 Pilot 环境 | `外部部署缺口阻塞` | 需要外部环境、隔离数据和负责人的证据 |
| `VS-02K-EXT-02` / `DEV-021` | 外部 Pilot 部署包 | `工程包已准备；未部署` | EXT2-01–12 逐项留证；不授权部署 |
| `VERTICAL-MAP-001` / `DEV-022` | Creator Commerce 垂直扩展分析 | `分析完成；Founder 决策待定` | 不把推荐扩展方向视为新项目批准 |
| `VS-02L01` / `DEV-023` | Cosplayer Convention Appearance Request | `历史完成；跨垂直复用已验证` | 不自动开启新 Vertical |
| `VS-02L02` / `DEV-024` | Photographer Session Reservation | `Founder 批准的历史实现已完成` | 回归现有切片；不外推所有 Calendar 场景 |
| `VS-02L03` / `DEV-026` | Commercial Appearance Contract | `历史完成` | 回归合同 Pattern；新业务需独立合同 |
| `INFRA-CONV-001` | Commerce Infrastructure 收敛审查 | `审查完成` | 复用结论不授权新增 Pattern 或垂直产品 |
| `VERTICAL-TIER2` | Creator workshop / open class | `价值候选；尚未批准` | 先决定 Ticket vs Reservation、课程 / Event 范围与履约 |
| `VERTICAL-DEFERRED-01` | Merchandise | `Deferred` | 有重复需求及 Founder 批准 SKU、物流、退货边界后重审 |
| `VERTICAL-DEFERRED-02` | Marketplace / Discovery | `Deferred；当前方向排除` | 只有 Creator-owned distribution 被证明确实不足且 Founder 批准匹配 / 排名 / 运营范围后重审 |
| `VERTICAL-DEFERRED-03` | Convention directory / ticket exchange / event organizer OS | `明确不做` | 与当前个人 Commerce Infrastructure 边界冲突；不作为垂直候选 |
| `VERTICAL-DEFERRED-04` | Fan CRM / merchandise warehouse / tour routing / artist management | `明确不做` | 不得通过 Vertical Slice 顺带引入 |
| `PHASE5-001` | 真实 Creator Pilot 执行准备 | `Controller 已批准准备；不等于激活` | 遵循启动闸门、Pattern 和停止条件 |
| `PHASE5-002` | 外部 Pilot 激活闸门 | `技术闸门就绪；Pilot 激活未执行` | 仅 Founder 可激活；不能把就绪写作运行中 |
| `CLIENT-001` | Web Commerce Pattern 收敛 / App 边界 | `就绪 / 完成` | 按 CLIENT-001 回归；`apps/app` 仍延后 |
| `CLIENT-002` | Commerce 黄金路径闭合 | `完成` | 继续 Request / Reservation / Contract 黄金路径回归 |

## 6.4 M1.5 / 跨端工程变更单元

| 编号 | 工程变更单元 | 核验范围 | 状态 |
| --- | --- | --- | --- |
| CU-TA-01 | 工作区边界准备 | `applications/`、`contracts/`、导入边界 | 历史完成；当前治理检查重验 |
| CU-TA-02 | 应用核心与端口 | Actor Context、Port、Unit of Work、Canonical Event | 历史完成；当前测试重验 |
| CU-TA-03 | API 合同与运行时骨架 | API v1、TypeBox、错误 Envelope、OpenAPI | 历史完成；当前 Contract / OpenAPI 重验 |
| CU-TA-04 | PostgreSQL 持久化基础 | Migration、事务、重复 Migration 行为 | 历史完成；当前数据库检查重验 |
| CU-TA-05 | 认证基础 | Supabase Adapter、Bearer Contract、真实 Provider | 历史完成；秘密不得写入执行台账 |
| CU-TA-06 | Web 参考客户端基础 | Web、生成 Client、Auth / Error Adapter | 历史完成；当前 Web 类型检查 / Build 重验 |
| CU-TA-07 | 验收测试框架 | 浏览器启动、API/Web 组合、Acceptance 运行 | 历史完成；当前浏览器验收重验 |

### 6.5 VS-02 / 垂直切片：历史完成，不自动重开

以下工作在 `21_Prototype_Execution.md` 和专项治理文档中已有记录：

- VS-02E 本地商业模拟；
- VS-02F 本地付费商业产品化；
- VS-02G 官方 Provider Sandbox；
- VS-02H / VS-02I 商业运营与首个 Pilot 准备；
- VS-02J 真实资金激活审查；
- VS-02K 非资金 Creator Pilot 与受控外部环境；
- VS-02L01 Cosplayer Request；
- VS-02L02 Photographer Reservation；
- VS-02L03 Commercial Appearance Contract；
- Commerce Infrastructure Convergence Review。

这些是历史交付和决策证据，不自动代表生产就绪、商业启动或本轮开发优先级。复开任一项必须确认当前商业目标、接受范围和授权。

### 6.6 CR-01 至 CR-08：商业化准备与真实产品切线

商业化准备执行计划把以下八个 Change Unit 记为历史完成。本表保留完成范围和回归责任，不重复实现，也不把本地验收提升为外部生产事实。

| 编号 | 历史工作包 | 验收范围 | 当前状态与边界 |
| --- | --- | --- | --- |
| CR-01 | 真实身份边界 | 真实 Auth Provider、显式 Creator Mapping、认证错误边界、Creator 资源归属与未认证拒绝 | `历史完成；当前代码需在 RESUME-001 中回归` |
| CR-02 | 认证 Creator Desk | 注册、登录、Session 恢复、Access Token 刷新、登出、跨标签状态同步、保护路由与真实浏览器证据 | `历史完成；真实 Provider 证据按当前环境复核` |
| CR-03 | Commerce Identity 产品化 | Creator / Public Surface、结构化内容、状态边界、公开 Metadata、空 / 加载 / 错误状态和 API / 权限回归 | `历史完成；不等于 Stage 2 正式授权` |
| CR-04 | 真实分发准备 | 经产品负责人批准的本地桌面 / 移动公开访问、刷新、Request、下线边界和分发记录 | `历史本地验收完成；不等于外部公网部署` |
| CR-05 | First Commerce 边界设计 | Observation-only 产品边界、对象 / 状态 / 事件 / 权限 / API 影响、幂等、审计和禁止项 | `历史设计完成；以独立批准范围为准` |
| CR-06 | First Commerce 切片 | 经 `DEV-005` 批准的外部付款核验与履约观察事实记录；不得改变 Request 状态机 | `历史完成；不是 Payment / Order / Revenue 事实` |
| CR-07 | Repeat Supply 支持 | 多 Offering、编辑 / 发布 / 下线、所有权、重复操作保护和既有回归 | `历史完成；不推导 Marketplace 或 CRM` |
| CR-08 | Cutline Verification | C1–C5 范围回归、部署 / 恢复、治理检查及最终技术切线结论 | `历史完成；新提交和新环境需重新验证` |

来源：[商业化准备切线](../09_Engineering_Governance/31_Commercialization_Readiness_Cutline.md)与[商业化准备执行记录](./22_Commercialization_Readiness_Execution.md)。以上任务不重新打开已经关闭的 Change Unit；如要改变行为，需新 `DEV-###` 和单项授权。

### 6.7 VS-02 历史交付包逐项复核索引

下表用于防止“历史阶段已完成”掩盖外部资格、真实运行或后续签署缺口；所有结论均须按执行台账原始记录复核，不能仅凭专项文件存在就判为通过。

| 编号 | 专项包与登记工作 | 最低验收 / 证据 | 当前边界 |
| --- | --- | --- | --- |
| VS02-A | Provider-neutral Money Domain 与付费 Commerce | 对象、状态、领域事件、账本投影和 VS-01 隔离回归；引用 `35_VS02_Paid_Service_PRD.md` | `历史完成；不代表资金路径获批` |
| VS02-B | Provider Integration Readiness | Provider-neutral Port / Fact 边界、配置和集成前置审查；引用 `37_VS02B_Provider_Integration_Readiness.md` | `历史材料待按授权与台账核验` |
| VS02-C | Provider Adapter Qualification | Adapter 边界、资格条件、错误 / 回调证据和禁止项；引用 `38_VS02C_Provider_Adapter_Qualification.md` | `Conditional；外部资格阻塞` |
| VS02-D | 受控真实资金集成及激活准备 | 受控集成范围、真实资金开关、主体 / Provider / 责任和激活证据；引用 `39`、`39A` | `工程准备历史记录；真实资金激活未获授权` |
| VS02-E | 本地商业模拟 | 模拟 Payment / Settlement / Withdrawal 生命周期、失败路径及 `origin = simulation` 隔离 | `历史完成；只作模拟回归` |
| VS02E-H | 商业生命周期加固 | 状态一致性、重复 / 迟到事件、取消 / 失败路径和账本投影回归；引用 `41_VS02E_Commercial_Lifecycle_Hardening.md` | `历史完成记录待核验` |
| VS02-F | 本地付费 Commerce 产品化 | 本地付费流程、Creator / Customer 表面、治理和模拟事实标注；不得生成真实资金事实 | `历史完成；不等同真实收费` |
| VS02-G | 官方 Provider Sandbox 集成 | Sandbox 身份、凭据隔离、事件真实性标注和不能替代真实验收的边界 | `工程边界历史完成；官方 Sandbox 条件待核验` |
| VS02-H | 商业 Pilot 运营准备 | 角色、支持、异常、运行手册、风险和关闭规则有责任人及记录 | `历史准备完成；不代表 Pilot 启动` |
| VS02-I | First Commerce Pilot 准备 | 真实首单候选、Creator / Customer 路径、证据包和外部约束清单 | `历史准备完成；依赖商业决策` |
| VS02-J | Founder 真实资金激活审查 | 逐项审查 Provider、交易主体、资金责任、真实证据、停止条件并留 Founder 结论 | `待 Founder 决策；保持开关关闭` |
| VS02-K | 真实 Creator 非资金 Pilot | 完成本清单 6.8 中 PILOT-K01–K12 及真实外部证据包 | `外部执行未完成；非商业发布` |
| VS02K-EXT-READY | 受控外部 Pilot 环境 | 独立 HTTPS、DNS / TLS、Auth、PostgreSQL、Secret、日志、参与者和数据隔离证据 | `环境输入待外部提供` |
| VS02K-EXT-02 | 外部 Pilot 部署包 | 完成 EXT2-01–12；部署、迁移、Health / Readiness、Auth、公开 Offering、Request、隔离和恢复各有证据 | `包已准备；尚未部署` |
| PHASE5-EXEC | Phase 5 三种 Pattern 外部 Pilot | REAL-PILOT-01–10；真实 Creator / Customer 行为、各自 Pattern 和结果证据完整 | `待受控外部执行` |
| PHASE5-GATE | 外部 Pilot 激活闸门 | 机器 Preflight、Founder-only 激活、队列上限、证据捕获、停止及关闭控制通过 | `技术闸门已成文；激活未执行` |
| VS02-L01 | Cosplayer Convention Appearance Request | 垂直边界、Request 流、领域复用、验收和 Founder 决策准备有历史记录 | `历史设计 / 切片；不得自动扩展` |
| VS02-L02 | Photographer Session Reservation | Reservation、可用时段 / 冲突、领域复用、验收和 Founder 决策准备有历史记录 | `历史设计 / 切片；不得自动扩展` |
| VS02-L03 | Commercial Appearance Contract | Scope、双方接受、履约 / 取消候选和共享 Core 复用证据 | `历史设计 / 切片；不得自动扩展` |
| PCI-CONV | Commerce Infrastructure 收敛审查 | Request / Reservation / Contract 的共用能力、差异、垂直污染和停止政策有结论 | `历史审查；仅供阶段决策` |

VS-02 专项包的依赖链、对外联系人和真实证据应在 `RESUME-001` 中按各自原始文档复核。本清单只登记工作边界，不替代 Provider 资格、Founder 决策、部署或资金授权。

### 6.8 VS-02K / Phase 5 外部 Pilot 验收任务

本节将专项文件的验收矩阵拆为单项可追踪任务。所有外部验收必须由真实参与者在隔离受控环境中完成；本地测试、Fixture、模拟器和工程脚本不能替代真实行为证据。

#### 6.8.1 PILOT-K01–K12：非资金 Creator Pilot

| 编号 | 任务 | 完成证据 | 前置 / 状态 |
| --- | --- | --- | --- |
| PILOT-K01 | 真实 Creator 自行注册 | 独立 Creator 的 Auth 账户、注册时间和审计引用 | 受控外部环境及真实 Creator；`待外部执行` |
| PILOT-K02 | 登录与第二次会话恢复 | 真实 Creator 在独立第二会话成功恢复登录的证据 | K01；`待外部执行` |
| PILOT-K03 | Creator 创建 Commerce Identity | Creator 本人创建的 Identity、ID 和审计引用 | K01；`待外部执行` |
| PILOT-K04 | Creator 创建 Service Offering | Creator 本人创建、归属于正确 Identity 的 Offering | K03；`待外部执行` |
| PILOT-K05 | Creator 发布 Offering | 发布事实、时间戳和可访问 URL | K04；`待外部执行` |
| PILOT-K06 | 未登录客户访问公开 URL | 无 Creator 登录的外部浏览器访问证据；不泄露私有字段 | K05、部署就绪；`待外部执行` |
| PILOT-K07 | 真实 Customer 提交 Request | Customer 本人提交的 Request、事件和审计证据；不得代操作 | K06、真实 Customer；`待外部执行` |
| PILOT-K08 | Creator 查看 Request | Creator 自己的会话中看到该 Request，且无跨 Creator 访问 | K07；`待外部执行` |
| PILOT-K09 | Creator Confirm / Decline | Creator 本人执行的决定、规范事件和状态证据 | K08；`待外部执行` |
| PILOT-K10 | Customer 查看结果 | 同一 Customer 可见正确 Result，含访问控制和审计引用 | K09；`待外部执行` |
| PILOT-K11 | 模拟资金与真实非资金事实隔离 | VS-02E/F 回归证明模拟来源；Pilot 事实不进入真实 GMV / Revenue | 既有仓库回归；`待按当前提交重验` |
| PILOT-K12 | Creator 第二次会话恢复 | 同一真实 Creator 账户在后续独立会话再次登录并恢复工作 | K01–K05；`待外部执行` |

#### 6.8.2 EXT2-01–12：外部环境与部署验收

| 编号 | 任务 | 完成证据 | 前置 / 状态 |
| --- | --- | --- | --- |
| EXT2-01 | 受保护环境变量清单完整 | 变量清单复核及 `pilot-preflight` 输出；无 Secret 值 | 环境责任人；`可运行待证据` |
| EXT2-02 | Pilot PostgreSQL 独立 | 专用数据库、连接复核和自动化清理隔离证据 | Founder / Operations 提供；`阻塞` |
| EXT2-03 | Pilot Auth 独立 | 专用 Supabase Auth 项目或明确隔离租户证据 | Founder / Operations 提供；`阻塞` |
| EXT2-04 | HTTPS、DNS 和 TLS 就绪 | 受控域名、证书、外部 URL 和访问 Smoke | EXT2-02/03；`阻塞` |
| EXT2-05 | 真实资金关闭 | 部署 Preflight 明确证明 `REAL_MONEY_ENABLED=false` | 每次部署；`可运行待证据` |
| EXT2-06 | 无 Live Provider 凭据或端点 | Secret 扫描和 Preflight 结果 | 每次部署；`可运行待证据` |
| EXT2-07 | Health / Readiness | 部署 Smoke、API Health、Readiness 和 Web Smoke | EXT2-02–06；`可运行待证据` |
| EXT2-08 | 真实 Creator Auth 流程 | 真实注册、登录、会话和审计证据 | EXT2-03/04；`待外部执行` |
| EXT2-09 | Creator 发布真实 Offering | Creator-authored Offering、公开 URL 和发布记录 | EXT2-08；`待外部执行` |
| EXT2-10 | 真实 Request 流 | Customer 提交、Creator 处理和 Customer Result 证据 | EXT2-09、真实 Customer；`待外部执行` |
| EXT2-11 | Creator 资源隔离 | Creator A 不能读写 Creator B 私有 Offering / Request；Customer 不能访问私有数据 | EXT2-08–10；`待外部执行` |
| EXT2-12 | 备份与恢复 | 命名备份、恢复至独立验证库、Migration / Readiness 复验和责任记录 | EXT2-02；`可运行待证据` |

#### 6.8.3 REAL-PILOT-01–10：Phase 5 三种 Pattern 外部行为

| 编号 | 任务 | 完成证据 | 前置 / 状态 |
| --- | --- | --- | --- |
| REAL-PILOT-01 | Creator 独立注册 | Pilot Auth 账户和审计记录 | Founder 选择真实 cohort；`待外部执行` |
| REAL-PILOT-02 | Creator 创建 Identity | Identity ID、公开视图和审计引用 | K01；`待外部执行` |
| REAL-PILOT-03 | Creator 创建并发布 Offering | Offering ID、公开 URL、发布事实和时间戳 | K02；`待外部执行` |
| REAL-PILOT-04 | Creator 自有渠道分发 | Creator 提供的渠道证据与公开 URL 对应 | K03；`待外部执行` |
| REAL-PILOT-05 | 真实 Customer 访问 | 外部 Customer 访问公开页面及安全日志关联证据 | K04；`待外部执行` |
| REAL-PILOT-06 | Request Pattern | Customer 发起真实 Request、Request ID、Result 和审计引用 | Request Creator；`待外部执行` |
| REAL-PILOT-07 | Reservation Pattern | Customer 发起真实 Reservation、状态和审计引用 | Photographer 等真实 Creator；`待外部执行` |
| REAL-PILOT-08 | Contract Pattern | Buyer 接受 Quote / Scope、Contract 转为 Contracted，记录版本和审计 | 对应真实 Creator；`待外部执行` |
| REAL-PILOT-09 | Creator Pattern 决策 | Creator 本人完成相应 Pattern 决策；规范事实和本人会话证据齐备 | 至少有真实 Creator；`待外部执行` |
| REAL-PILOT-10 | Customer 查看结果 | Customer 查看正确结果 / 状态并留下访问证据 | K06–09 中适用流程；`待外部执行` |

Phase 5 要覆盖 Request、Reservation、Contract 三种 Pattern；任何 Pattern 缺少真实 Creator 时均保持 `PENDING`，不得由其他 Pattern、模拟器或代操作补足。

#### 6.8.4 Pilot 激活、运行、关闭任务

| 编号 | 任务 | 完成证据 | 前置 / 状态 |
| --- | --- | --- | --- |
| PHASE5-01 | 受控环境与数据隔离就绪 | EXT2-01–12 适用项通过；Real Money 关闭；无 Live Provider | 外部环境和责任人；`阻塞` |
| PHASE5-02 | 机器可执行 Preflight | `pnpm pilot:activate:preflight` 返回明确 `READY` 或 `BLOCKED`，不输出 Secret | PHASE5-01；`可运行待证据` |
| PHASE5-03 | Founder-only 激活控制 | 服务端显式确认、身份校验、Pilot ID 匹配、追加式审计；不开放前端开关 | Founder 审批；`待激活授权` |
| PHASE5-04 | Pilot cohort 登记 | 1–3 名 Creator、上限不超过 5、Pattern、Auth 账户、Operator、证据位置均已登记 | Founder 选择 cohort；`待外部输入` |
| PHASE5-05 | Pilot 过程证据捕获 | 每次记录 Creator、Pattern、环境、Publish、Distribution、Customer / Creator Action、Result、摩擦和证据引用 | PHASE5-03/04；`待外部执行` |
| PHASE5-06 | Pattern 防越界与停止条件 | 三种 Pattern 守卫有效；Real Money、隔离、安全或代操作违规时停止并升级 | 激活前检查；`待核验` |
| PHASE5-07 | 关闭、证据冻结和数据保留 | 关闭记录、冻结证据、保留 Pilot 数据；无清理脚本误删 | Pilot 完成后；`待外部执行` |

成功标准只评价产品使用、工作流、客户理解和跨 Pattern 边界，不推导 PMF、收入、GMV、留存或市场规模。上述包不得引入第四个 Vertical、新 Pattern、真实资金、Provider、CRM 或 Marketplace。

## 7. Stage 2：已实现能力与待核验任务

Stage 2 的设计与实现材料不是一张简单的“未开始清单”。大量模块已经进入提交
`7c2a0d6`。以下子项需要在 `RESUME-001` 中核验，不重复实现：

| 编号 | 子任务 | 对账内容 | 当前清单状态 |
| --- | --- | --- | --- |
| S2-001 | Identity Core | 身份生命周期、ID、Repository、Schema、Migration、应用服务、测试 | `待核验` |
| S2-002 | Account–Identity Binding / Membership | OWNER 绑定、唯一性、撤销规则、初始化事务和授权 | `待核验` |
| S2-003 | Commerce Profile Core | Profile 归属、Presentation、生命周期和持久化 | `待核验` |
| S2-003A | Browser / Harness Acceptance Recovery | Browser 准备与启动、Playwright 配置、旧验收恢复 | `待核验` |
| S2-004 | Profile Lifecycle | 状态转换、终态、授权修改和历史读取 | `待核验` |
| S2-005 | Legacy Subject Mapping | Mapping 模型、状态、Repository、Migration、唯一性和确定性解析 | `待核验；编号按最新 reconciliation，须解决 ADR-007 命名差异` |
| S2-006 | Legacy Compatibility Adapter | 旧 `creatorId` 读取兼容、身份解析和 fail-closed 路径 | `待核验；编号按最新 reconciliation，须解决 ADR-007 命名差异` |
| S2-007 | Identity/Profile Application Context | AccountContext、明确身份上下文和 Unit of Work | `待核验` |
| S2-008 | Authorization Hardening | OWNER、生命周期、对象级授权、拒绝路径 | `待核验` |
| S2-009 | VS-01 Compatibility Regression | 旧组合根、旧 API 和浏览器回归 | `待核验` |

### 7.1 Runtime Foundation 子任务

| 编号 | 子任务 | 验收证据 |
| --- | --- | --- |
| RUNTIME-001 | Internal Identity 持久化 | Migration、约束、生命周期与 PostgreSQL 测试 |
| RUNTIME-002 | Commerce Profile 持久化 | Owner 约束、查询、生命周期与 PostgreSQL 测试 |
| RUNTIME-003 | Commerce Reference 持久化基础 | 不可变关联、唯一性和持久化事实；不由此推导公共解析授权 |
| RUNTIME-004 | External Platform Account 持久化 | 平台命名空间唯一性、生命周期与 PostgreSQL 测试 |
| RUNTIME-005 | Commerce Relationship 持久化 | provenance、生命周期、唯一性、历史和两个已知失败的合同判断 |
| RUNTIME-006 | Private Application Runtime | 应用编排、权限、事务边界与 Unit of Work |
| RUNTIME-007 | Durable PostgreSQL Integration | 迁移、事务、回滚、约束、事实重建及清理证据 |

**命名冲突**：ADR-007 把 `S2-005` / `S2-006` 分别称作 Compatibility Adapter /
Mapping Persistence；较新的 reconciliation 则分别称作 Legacy Subject Mapping /
Legacy Compatibility Adapter。本表暂按较新的 reconciliation 列示；`RESUME-001` 必须核对授权记录，
由 Founder / Main Control 决定是否统一名称，不能静默重编号。

**注意**：`PCI-STAGE-2-EXECUTION-RECONCILIATION.md` 标注为 Proposed，且记录了提交前状态。
Stage 2 是否正式关闭须经证据对账和 Main Control 接受，不能仅凭代码存在判定。

### 7.2 Founder 决策闭合核验

#### STAGE2-DECISION-001 至 STAGE2-DECISION-009

这些决策包列明 canonical concepts、ID namespace、Identity/Profile ownership、
owner / manager、External Platform Account、多账号关系、Relationship terminology 和 Resolver
安全边界。决策包内的建议文本不自动等于批准；必须逐项把 Founder 的实际 `APPROVE / MODIFY / REJECT`
记录与执行台账对上。

| 决策编号 | 决策范围 | 重返审查交付 |
| --- | --- | --- |
| 001 | 五个 canonical concepts 的采用 | 找到批准记录；核对实际领域术语 |
| 002 | 独立 ID namespace 和禁止 ID 替代 | 核对跨领域和 API 边界 |
| 003 | Identity 拥有 Profile，Profile 单一 owner | 核对 cardinality 和唯一性 |
| 004 | Owner / Manager、Profile 生命周期和转移 | 核对权限与 archive 行为 |
| 005 | External Platform Account 模型 | 核对平台 namespace 和多账号决策 |
| 006 | Commerce Relationship 当前关系和历史 | 核对唯一 active 关系、解绑和历史 |
| 007 | Legacy compatibility subject / mapping | 核对 mapping 命名和旧路径处理 |
| 008 | Relationship 术语不得混淆 | 核对用户文案和数据 provenance |
| 009 | Resolver 安全边界归属 Stage 3 | 核对公开 lookup 未被意外启用 |

#### `RUNTIME-DECISION-001` 至 `RUNTIME-DECISION-014`

决策包尾部仍有逐项 Founder Approval Form，而执行台账记载 Runtime 已完成；必须找到正式批准依据，
并说明实际授权如何限定。

逐项清单：

| 决策编号 | 决策事项 |
| --- | --- |
| RUNTIME-001 | 运行时分层 |
| RUNTIME-002 | 持久化方案 |
| RUNTIME-003 | Identity / Profile 持久化 |
| RUNTIME-004 | Commerce Reference 持久化 |
| RUNTIME-005 | External Platform Account 持久化 |
| RUNTIME-006 | Commerce Relationship 历史 |
| RUNTIME-007 | 生效 Relationship 唯一性 |
| RUNTIME-008 | 事务边界 |
| RUNTIME-009 | ID 生成职责 |
| RUNTIME-010 | Application Runtime 启用 |
| RUNTIME-011 | 延后 API 与 VS-01 接入 |
| RUNTIME-012 | 延后 OAuth 与外部账号绑定 |
| RUNTIME-013 | 延后 Resolver / QR |
| RUNTIME-014 | 暂不建设 Event / Outbox 基础设施 |

#### ADR-008 七项未闭合决策

ADR-008 当前标记 `PROPOSED` 和 `NOT_GRANTED`。恢复审查须判定七项建议是否后来被正式决定取代、
批准、修改或拒绝；不得把 ADR 文中的 “FOUNDER DECISION REQUIRED” 当作已批准。

| 编号 | 决策主题 |
| --- | --- |
| ADR8-01 | Account 与 Identity 的权威层级 |
| ADR8-02 | Identity 暂停对新操作的影响 |
| ADR8-03 | Identity 归档与受影响 Profile 的恢复边界 |
| ADR8-04 | 一个 Account 是否支持多个 Identity，以及单一工作上下文 |
| ADR8-05 | Profile 最低展示字段与启用所需字段 |
| ADR8-06 | 独立 Legacy Mapping 持久化和状态合同 |
| ADR8-07 | 身份映射不明确 / 缺失时的人工审查与历史读取 |

#### Commerce Reference 决策边界

Stage 2 与 Stage 3 必须分开核验：

1. 已批准的 C号基础语义：公开 / 外部引用、非凭证、固定格式、无语义前缀、Profile 归属、永久保留且不复用；
2. `DEV-052` 已实现私有新 Profile 路径：服务端生成并与 Profile 原子创建；执行记录仍写有真实 PostgreSQL / 浏览器证据未验证，须与后续 Acceptance-004 及当前提交核对；
3. 仍未获 Stage 3 授权：公共 Resolver、Public Profile、QR Runtime、枚举 / 滥用防护和 Public API；
4. 规范明确仍开放：输入规范化 / 混淆字符接受、check digit 或独立错误检测、resolver 语义、enumeration controls、公开表面、QR 最终尺寸 / quiet zone / 对比度 / 跨平台测试；
5. 规范建议尚待确认：QR payload 默认取 canonical C号、纠错默认 `Q`；不得将建议当成已批准政策。

决策来源：[07_Commerce_Reference_Product_Spec.md](../01_Strategy/07_Commerce_Reference_Product_Spec.md)。
`07_Commerce_Reference_Product_Spec.md` 部分 Future Stage 3 段落仍写“生成 / 持久化均未实现”，与 `DEV-052` 及 Acceptance-004 的后续事实不一致；在事实源完成受控修订前，本表依时间较新的执行证据只确认私有 Profile 原子分配，不推导公共入口已获授权，也不擅自修改被冻结产品合同。

### 7.3 Stage 2 reconciliation 更新清单

更新 Stage 2 对账文件时必须完成以下逐项修改：

1. 把 `Commit status = Uncommitted` 改为指向实际 commit `7c2a0d6` 的可验证记录；
2. 将原来的全量 `pnpm test PASS` 改为 2026-10-09 实际结果和失败详情；
3. 分别核对所有 `S2-*` 行与 ADR-007 / ADR-008 的任务编号差异；
4. 将 `pnpm test:acceptance:browser`、Supabase Auth、PostgreSQL 真实验收按执行证据区分日期与环境；
5. 将 Acceptance-003 被 Acceptance-004 替代 / 闭合的关系写清；
6. 把 Engineering Preflight 失败与产品 Acceptance-004 通过分开记录；
7. 不把 `Mock`、Fixture、Local Sandbox 作为真实外部服务通过证据；
8. 给出 Stage 2 整体状态的候选结论和 Founder 接受栏，不替 Founder 签署。

### 7.4 已登记 DEV / IDENTITY / RUNTIME Change Unit 对照

以下是执行台账已有编号的变更 / 审查单元，不替代原记录。状态以历史记录和当前基线分别表达；曾批准或完成不表示本轮可重复实施。

| 执行台账编号 | 专项范围 | 历史结论 | 当前处理 |
| --- | --- | --- | --- |
| `DEV-028` / `IDENTITY-001` | Internal Identity 与 Commerce Profile Domain Contract | Founder 授权的 Stage 2 领域合同已闭合 | `历史完成；纳入 Stage 2 总体对账` |
| `DEV-029` / `IDENTITY-002` | External Platform Account 与 Commerce Relationship Domain Contract | Founder 授权的 Stage 2 领域合同已闭合 | `历史完成；不代表 OAuth / 外部验证` |
| `DEV-030` / `IDENTITY-003` | Commerce Reference Domain Contract | Founder 授权的 Stage 2 领域合同已闭合 | `历史完成；不代表公共 Resolver` |
| `DEV-031` / `PCI-STAGE2-CLOSURE-001` | Identity Foundation 集成与 Stage 2 闭合审计 | 历史集成审计通过；当时 Migration / Persistence / API 未实现 | `需与后续 Runtime 记录合并对账` |
| `DEV-032` / `PCI-STAGE2-RUNTIME-ENTRY-001` | Runtime 入口决策包 | 评估包完成、等待 Founder 决定；当时未授权 Runtime 实现 | `须查后续实际决策记录` |
| `DEV-033`–`DEV-038` / `RUNTIME-001`–`006` | Identity / Profile / Reference / External Account / Relationship 持久化与应用 Runtime | 各专项历史记录为实现 / Change Unit 完成 | `与提交、Migration 和决策记录核对` |
| `DEV-037` / `RUNTIME-005` | Commerce Relationship 持久化 | 台账中实现状态为 `COMPLETE` | `当前测试失败的合同与实现归因待判定` |
| `DEV-039` / `RUNTIME-007` | 私有 Runtime PostgreSQL 集成验证 | 早期检查因 `DATABASE_URL` 缺失受阻 | `已由 DEV-041 后续证据更新，仍需按当前环境核验` |
| `DEV-040` / `PCI-PROVISION-001` | PostgreSQL 集成环境准备 | 安全 Provisioning 合同和 Preflight 已完成 | `资产存在；运行结果按当前环境确认` |
| `DEV-041` / `RUNTIME-007` | 真实 PostgreSQL Application Integration | 执行台账记录真实 PostgreSQL 集成通过 | `历史证据须与当前测试 / 环境区分` |
| `DEV-042` / `PCI-STAGE2-RUNTIME-CLOSURE-001` | Runtime Foundation 闭合及下一表面决策 | 历史 Runtime Foundation 完成；没有授权 Product Surface | `须与后续 Surface / Acceptance 记录对账` |
| `DEV-043` / `PRIVATE-SURFACE-ENTRY-001` | Account–Identity Binding 与私有表面架构准备 | 架构准备完成；当时实现仍需 Founder 批准 | `后续批准 / DEV-044 等记录须逐项核对` |
| `DEV-044` / `SURFACE-001`、`DEV-045` / `SURFACE-001-VERIFY` | Identity 私有只读表面及真实 PostgreSQL 验证 | 执行台账记录完成 | `历史证据并入私有表面对账` |
| `DEV-046`–`DEV-049` / `SURFACE-002`–`005` | Profile、Commerce Reference、External Account、Relationship 私有表面 | 实现 / DB 证据有历史记录；部分 UI 集成当时未验证 | `不可笼统当作最新完整验收；逐项核验 UI 与当前回归` |
| `DEV-050` / `PRIVATE-MVP-SELF-SERVICE-001` | Self-Service MVP 架构决策准备 | 决策包完成；当时闭环实现未验证 | `由后续 Acceptance-004 更新产品验收状态` |
| `DEV-051` / `SELF-SERVICE-ONBOARDING-IMPLEMENTATION-001` | Account 到 Identity 的自助初始化 | 台账记为实现完成 | `保留为已有实现，不重复开发` |
| `DEV-052` / `COMMERCE-REFERENCE-GENERATION-IMPLEMENTATION-001` | Profile 与 Commerce Reference 原子创建 | 实现完成；历史 PostgreSQL 证据曾待环境启动 | `对照后续真实环境和 Acceptance-004 记录` |
| `DEV-053` / `SELF-DECLARED-EXTERNAL-ACCOUNT-AND-RELATIONSHIP-DECISION-001` | Composite Command 架构决策 | Founder 决策选定方案；当时实现未开始 | `由 DEV-054 及 Acceptance-004 核对` |
| `DEV-054` / `SELF-DECLARED-EXTERNAL-ACCOUNT-AND-RELATIONSHIP-IMPLEMENTATION-002` | 自声明 External Account / Relationship Composite Command | 执行记录开篇标为 `BLOCKED`，后续实现及 Acceptance-004 已有证据 | `按完整时间序列对账，不以早期 BLOCKED 覆盖后续结果` |

`PCI-STAGE2-EXECUTION-RECONCILIATION.md`、决策包中的 Founder Approval Form、执行台账和代码提交对 Stage 2 状态并非全部一致。唯一安全做法是在 `RESUME-001` 中按决策日期、批准者、精确授权范围和后续变更逐项重建，不从“完成”字样推导全阶段授权。

### 7.5 Stage 2 与 Self-Service 后续验收 / 决策单元

| 执行台账编号 | 任务 | 历史结果 | 当前状态 / 下一步 |
| --- | --- | --- | --- |
| `SELF-DECLARED-EXTERNAL-ACCOUNT-AND-RELATIONSHIP-ACCEPTANCE-003` | 较早版本的 External Account / Relationship 验收 | 后续有 Acceptance-004 真实 Auth / API / PostgreSQL / 浏览器证据 | `核对 supersede / closure 关系，不重复声明` |
| `SELF-DECLARED-EXTERNAL-ACCOUNT-AND-RELATIONSHIP-ACCEPTANCE-004` | Self-Service Complete Closure 真实端到端验收 | 产品验收记录 `READY_FOR_PILOT`，无产品验收阻塞 | `保留产品验收通过；与工程 Preflight 分开` |
| `PCI-OPERATING-CLOSURE-001` | 运营闭环审计 | 审计完成；运营闭环未验证、成熟度 L1 | `决策输入已形成；不是运营成功证据` |
| `PCI-REAL-OPERATING-VALIDATION-ENVIRONMENT-001` | OV-001 隔离环境准备 | 曾因外部环境 / 负责人阻塞 | `不得以工具存在作为环境就绪` |
| `PCI-OV001-EXPERIMENT-AUTHORIZATION-001` | OV-001 一次性非资金实验授权合同 | 有已授权记录；不授权实验启动或产品实现 | `须通过当前 Resume / readiness 闸门重新确认是否有效` |
| `PCI-OV001-AUTHORIZATION-GATE-CALIBRATION-002` | 区分授权、执行就绪和实验启动 | 治理校准完成 | `保持三者独立，不得互相推导` |
| `PCI-OV001-EXECUTION-READINESS-001` | OV-001 当前执行就绪审查 | 审查完成；最新结论 `NOT_READY`，未启动 | `阻塞；逐项关闭参与者、环境、职责和证据缺口` |

#### Private Surface 后续决策项

| 编号 | 决策项 | 当前规则 / 完成条件 |
| --- | --- | --- |
| PRIV-DEC-01 | OAuth MVP 的存在与范围 | 非自助闭环默认前置；须单独决定范围和 Provider |
| PRIV-DEC-02 | Platform Verification Policy | 允许明确保持 `SELF_DECLARED`；不得暗示 `VERIFIED` |
| PRIV-DEC-03 | Platform API Evidence Policy | 决定可接受事实、来源、保存、撤销和隐私 |
| PRIV-DEC-04 | Operator Attestation | 仅当批准的 OV-001 实验合同要求时才纳入 |
| PRIV-DEC-05 | Relationship Withdrawal / Dispute | 定义主体权限、历史留存、争议和撤销状态 |
| PRIV-DEC-06 | Manager / Delegated Manager 自助 | 决定是否扩展初始 OWNER 模型和授权边界 |
| PRIV-DEC-07 | 历史 Profile 缺少 C号的补救 | 不得自动补号、迁移、重分配或改变不可复用规则 |
| PRIV-DEC-08 | SURFACE-006 | 明确未开始、未授权；需要独立用户任务缺口和决策包 |

以上决策均不阻止当前 Acceptance-004 已验收的自声明私有闭环；若未批准，不得变成实施工作。

## 8. Private Surface 和 Self-Service MVP

### 8.1 Private Surface

| 编号 | Surface / 工作 | 当前证据与待办 |
| --- | --- | --- |
| PS-001 | 私有 Identity Surface | 对账认证 Account、Binding、Identity 的读取权限和拒绝路径 |
| PS-002 | Commerce Profile 管理 | 对账创建、更新、Owner 授权、生命周期和刷新后的状态 |
| PS-003 | Commerce Reference 展示 | 对账只读展示、复制和不允许重生成/转移的边界 |
| PS-004 | External Platform Account | 对账自声明字段、平台命名空间、重复隐私和未验证文案 |
| PS-005 | Commerce Relationship | 对账角色、状态、provenance、历史和持久化重建 |
| PS-006 | 导航 / Onboarding 表面 | 只有当 Acceptance-004 或新的产品审计证明存在用户任务缺口时才提案；不因旧审计自动重开 |
| PS-007 | 安全和负向验收 | IDOR、水平越权、跨 Profile、重复请求、并发和敏感冲突不泄露 |

PS-001 至 PS-005 有实现和验收记录；在台账对账之前状态记为“已有证据，待纳入权威 reconciliation”，不重复建造。

### 8.2 Self-Service MVP

决策包将 Self-Service Complete Closure 定义为目标，并规定语义边界：

```text
Account
→ Internal Identity + OWNER Binding
→ Commerce Profile + 自动 C号
→ External Platform Account（自声明）
→ Commerce Relationship（OWNER / PROPOSED / SELF_DECLARED）
```

`SELF-DECLARED-EXTERNAL-ACCOUNT-AND-RELATIONSHIP-ACCEPTANCE-004` 已记录：

```text
SELF_SERVICE_COMPLETE_CLOSURE = READY_FOR_PILOT
REAL_SUPABASE_AUTH = PASS
REAL_PRIVATE_API = PASS
REAL_POSTGRESQL = PASS
AUTHENTICATED_BROWSER_FULL_JOURNEY = PASS
PRODUCT_ACCEPTANCE_BLOCKER = NONE
```

因此不得把 Self-Service 闭环重复列为“尚未实现”。当前应分别记录产品验收与工程状态：

1. 把 Acceptance-004 的证据和工程 preflight 失败并列保留；
2. 按合同评估 Surface-005 fixture regression 和 `commerce-relationship` 两项当前失败，判定影响面；
3. 重新运行当前可用的工程 preflight / 验收，确定历史证据在最新 commit 上是否仍成立；
4. 依据最新结果更新工程 Readiness；不得把工程 preflight 失败写成 Acceptance-004 产品验收失败；
5. 若发现真实产品缺口，再单独登记审计任务与 Founder 决策。

## 9. Stage 3 / Public Commerce Entry：未来任务，不可启动

Product Direction 和 Commerce Reference 产品规范所列的候选工作包括：

| 编号 | 候选任务 | 需要解决的内容 | 依赖与完成条件 | 当前状态 |
| --- | --- | --- | --- |
| ST3-01 | 公共 Commerce Reference 分配与命名空间 | 公开 C号的命名空间、Profile 对应关系、既有数据和永久唯一性 | 先完成 Founder 产品决策；产品合同冻结公开 / 私有 ID 边界 | `Stage 3 未授权` |
| ST3-02 | C号规范输入与错误政策 | canonical 输入、大小写 / 分隔符、混淆字符、unknown-reference 错误和信息泄漏 | 按 `07_Commerce_Reference_Product_Spec.md` 逐项冻结；不得擅自把错误输入映射为别的 ID | `待单项决策；未授权` |
| ST3-03 | 公共 Resolver | 精确解析、版本 / 可用性、隐私、未找到 / 停用语义和安全边界 | 依赖 ST3-01/02、产品 / 安全 / 架构决策及公开验收 | `未授权` |
| ST3-04 | Public Commerce Profile | 字段白名单、公开状态、撤下、缓存 / 索引和个人信息边界 | 与私有 Profile 分离；字段级隐私和授权验收通过 | `未授权` |
| ST3-05 | QR 载荷、生成和呈现 | QR 指向 / 载荷、URL 稳定性、错误纠正、复制 / 扫描体验和隐私 | 依赖公共入口合同；不得把 QR 当身份凭证或认证因素 | `待单项决策；未授权` |
| ST3-06 | 枚举与滥用防护 | Rate limit、枚举检测、缓存、响应差异、监控和响应流程 | 威胁模型、风险负责人和安全验收通过 | `未授权` |
| ST3-07 | Public API / OpenAPI | 公开资源、只读能力、兼容策略、错误 Envelope 和访问范围 | 公开 API 合同及版本 / 安全审查批准 | `未授权` |
| ST3-08 | C号与 QR 的可读性 / 校验策略 | 是否引入展示校验、非规范输入 UX、check digit（不作为当前 ID 位数变更） | 独立 Founder 决策；保持已冻结 canonical ID 规则，变更需专属 `DEV-###` | `待决策；未授权` |

私人新 Profile 的 C号服务器生成和原子分配已有实现及 Acceptance-004 证据；该能力不等于公共解析。
以上公共解析和发布能力仍依赖独立的 Stage 3 Founder 决策和产品 / 安全 / 架构合同。
当前不得实现、生成公开资源或开放未授权路由。

## 10. Stage 4：外部平台关系扩展

| 编号 | 候选任务 | 主要决策 / 交付 | 当前状态 |
| --- | --- | --- | --- |
| ST4-01 | 多平台 / 多账号管理政策 | Account 数量、同平台多账号、冲突、合并 / 恢复和删除边界 | `待决策` |
| ST4-02 | Commerce Relationship 生命周期 | 提议、激活、暂停、撤销、历史、争议和责任人 | `待决策` |
| ST4-03 | 外部证据政策 | 可信证据类型、证据来源、保留、撤销和审计要求 | `待决策` |
| ST4-04 | 单个平台验证集成 | 仅逐个平台验证，明确授权、权限、服务范围和失败关闭方式 | `待 Provider、产品和安全决策；未授权` |
| ST4-05 | OAuth / Token 安全 | 凭据范围、加密、回调、更新、撤销、泄漏和用户告知 | `待威胁模型与安全决策；未授权` |
| ST4-06 | `VERIFIED` 状态转换 | Verifier 权限、证据到状态的规则、撤销 / 争议与审计 | `待独立验证政策；未授权` |

现有自声明账号和 Relationship 写入流程已实现，并有 Acceptance-004 真实 Auth / PostgreSQL /
浏览器证据；未来 Stage 4 指外部证明、OAuth 和多账号 / Relationship 治理扩展，不是否定已有私有工作流。
`SELF_DECLARED` 不等于 `VERIFIED`。OAuth、平台 API、凭据存储和外部所有权验证不能作为自助闭环的隐式后续工作。

### 10.1 私有 MVP 后续独立决策

`27_Private_Self_Service_MVP_Decision_Package.md` 已明确下列事项未包含在 Acceptance-004 的自助闭环实现内：

| 编号 | 决策 | 是否为当前 Pilot 的默认前置 |
| --- | --- | --- |
| PRIV-DEC-01 | OAuth MVP 是否存在及其范围 | 否；不得擅自作为自助闭环前置 |
| PRIV-DEC-02 | Platform Verification Policy | 否；`SELF_DECLARED` 可保持诚实可见 |
| PRIV-DEC-03 | Platform API Evidence Policy | 否 |
| PRIV-DEC-04 | Operator Attestation | 否，除非 OV-001 的已批准实验合同要求 |
| PRIV-DEC-05 | Relationship Withdrawal / Dispute | 否；须单独定义权限、历史和事实保留 |
| PRIV-DEC-06 | Manager / Delegated Manager Self-Service | 否；初始自助角色仍为 OWNER |
| PRIV-DEC-07 | 历史 Profile 缺少 C号的补救政策 | 否；不得自动生成、迁移或重分配 |
| PRIV-DEC-08 | SURFACE-006 | 明确未启动、未授权 |

### 10.2 已登记商业决策索引

本表归纳产品 Wedge、MVP 产品、商业模式和 GTM 文件中的具名决策。除原文明确标为未决的事项外，
这些记录是现有决策基线，不应被本总表改写为“尚未选择”；是否仍有效、是否出现复核触发条件，
须在 `RESUME-001` 或相应实验中核验。决策记录不自动授予开发、外联、获客或收费权限。

#### `D-08-01`–`D-08-08`：产品 Wedge 决策

| 编号 | 已登记决策 | 当前处理 |
| --- | --- | --- |
| D-08-01 | Creator 为市场切入口，Individual Commerce 为产品抽象 | 保留既有方向；出现更强非 Creator 样本时再按触发条件复核 |
| D-08-02 | 舞者为首批核心 Creator | 首批具体对象仍需重返审查确认 |
| D-08-03 | Commerce Identity-first，而非 Calendar-first | 作为产品方向基线；不得据此改写现行 PRD |
| D-08-04 | Creator-first、Fan-usable | 对应 E-09-02 与 GTM 分发实验 |
| D-08-05 | Transaction-first、SaaS-later | 费率和真实支付仍受商业 / Provider 闸门限制 |
| D-08-06 | 一个统一产品、一个主垂直和两个小型对照组 | 具体垂直扩展须重新核准 |
| D-08-07 | Creator 自定义商品，平台提供结构化原语和模板 | 遵守现行产品合同；模板扩展需验收 |
| D-08-08 | 首版范围以 Upcoming、Event / Experience、Service Booking 和 Inquiry 为主 | 当前实现边界以冻结 PRD 为准 |

#### `D-09-01`–`D-09-10`：MVP 产品决策

| 编号 | 已登记决策 | 当前处理 |
| --- | --- | --- |
| D-09-01 | MVP 是 Creator Commercial Identity + Structured Commerce | 以 VS-01 冻结 PRD 作为实现合同 |
| D-09-02 | 首版包含 Creator Setup、Storefront、Commerce Action 和 Operations 四个核心表面 | 保持 VS-01 范围，不自动增加表面 |
| D-09-03 | Activation 是 Creator Published | 指标复核见 F-13-01 |
| D-09-04 | 浏览 Storefront 不要求 Buyer 注册；商业动作只收集最少信息 | 按 AT 验收和权限合同回归 |
| D-09-05 | 冻结 Upcoming、Event、Experience、Service、Inquiry 五类 Primitive | 不得扩成新的 Commerce Pattern |
| D-09-06 | Event / Experience / Service 可进入订单或预约；Performance / Content 首版用 Inquiry 表达 | 遵守现行产品与商业合同，不推导真实支付授权 |
| D-09-07 | 适用的 Time、Capacity、Availability、Location、Rules 约束需显式表达 | 变更须有产品偏差记录 |
| D-09-08 | Creator 自定义商品，平台以 Primitive 和模板约束创建 | 以冻结 PRD 验收 |
| D-09-09 | Creator Operations 限于供给、商业动作、确认 / 拒绝、状态和分享 | CRM 等高级能力不在首版范围 |
| D-09-10 | 记录 Creator Published 至 Fulfillment Observed 的关键事件 | 指标责任和证据等级关联 F-13-07 |

#### `D-10-01`–`D-10-10`：商业模式决策

| 编号 | 已登记决策 | 当前处理 |
| --- | --- | --- |
| D-10-01 | MVP 首要收入模型为 Transaction Revenue | 收费执行依赖独立真实资金决策 |
| D-10-02 | Creator Identity、Upcoming、发布供给和 Inquiry 免费 | 如需改变，重新评估免费边界和成本 |
| D-10-03 | Event、Experience、Service 的已确认付费交易可测试 Take Rate；外跳和未成交 Inquiry 不收费 | 交易事实和收入归因按 F-13-02 / 09 核验 |
| D-10-04 | 正式 Take Rate 未冻结；5%–10% 仅为实验区间 | 不得作为已批准费率或收费承诺 |
| D-10-05 | 默认测试 Creator-paid，Event 保留 Buyer-paid 对照 | 属实验方向，不代表当前已启动收费 |
| D-10-06 | 核心收入指标为 Revenue per Transaction Active Creator | 同 F-13-08 对齐收入与贡献毛利指标层级 |
| D-10-07 | 所有交易评估 Contribution Margin，不以 GMV / Gross Revenue 替代 | 保留成本与责任假设，不伪装为实际结果 |
| D-10-08 | Creator Pro 只在持续交易和经营复杂度出现后定义 | 不在当前阶段建设订阅收费 |
| D-10-09 | Marketplace Revenue 不计入 MVP 商业模型 | Marketplace 仍属明确排除项 |
| D-10-10 | 支付之外的金融 / 基础设施收入属于长期可能性 | 未立项、未授权 |

#### `D-11-01`–`D-11-10`：GTM 决策

| 编号 | 已登记决策 | 当前处理 |
| --- | --- | --- |
| D-11-01 | 以 Creator 供给获取为核心，不主动建设消费者 Marketplace | 不据此启动实际获客 |
| D-11-02 | GTM 北极星为 Transaction Active Creator | 与 F-13-01 的 MVP / 长期指标分层核对 |
| D-11-03 | 优先近期有供给、自主决策且有自有渠道的独立舞者 | 首批名单和资格仍需 Founder 确认 |
| D-11-04 | 首轮采用 One City / One Dense Community | 城市名称仍未确定；对应 F-13-05 |
| D-11-05 | 优先 Founder Direct、既有引荐、Creator 社群、Studio / Crew 和 Event | 渠道负责人、样本和实验方法未齐备前不启动 |
| D-11-06 | Cohort 0–1 使用 Concierge Onboarding | 责任人和指标采集对应 F-13-07 |
| D-11-07 | Creator 发布后推动真实分发，不依赖单一平台简介外链 | 分发证据及归因方法待核验 |
| D-11-08 | Fan 流量来自 Creator / Partner 自有渠道，不购买大规模消费者流量 | 保留为既有 GTM 方向，不代表已获客授权 |
| D-11-09 | Creator 获得可感知价值后再触发 Referral | 价值定义与事件口径待实验设计 |
| D-11-10 | 按 CAC per Transaction Active Creator 和 Repeat Supply 评估渠道 | 指标定义与 F-13-08 及实验方案对齐 |

### 10.3 来源文档开放问题逐项清单

以下是来源文档中明确保留的决策输入，不等同于全部必须由开发解决；进入相关产品 / 商业工作包前，
须明确哪些问题影响范围、哪些由 Founder 决策、哪些由实验回答。

#### 10.3.1 `docs/04_Product/08_MVP_Wedge_Strategy.md`：12 项开放问题

| 编号 | 来源问题 | 本清单处理 |
| --- | --- | --- |
| D-08-Q01 | 首版主要交易动作是直接购买、预约申请、定金还是外部跳转？ | 与 VS-01 冻结合同、D-MCL-01 及 E-09 实验对账；不重开已冻结流程。 |
| D-08-Q02 | Event 和 Experience 是否共享同一创建流程？ | 作为产品 / 实验输入；未获批准前不新增流程。 |
| D-08-Q03 | Service Booking 需要精确时间槽，还是可预约日期与申请？ | 对照当前 Reservation / Request 合同及 Stage 5 决策；见第 11.2 节。 |
| D-08-Q04 | Creator 是否愿意公开价格，或偏好“起价 + 询价”？ | 映射 E-09-05；实验前定义样本和指标。 |
| D-08-Q05 | Creator Storefront 的默认信息层级如何避免成为普通作品集？ | 仅在证据证明存在合同缺口时提交独立 UX / 产品决策，不直接改 PRD。 |
| D-08-Q06 | 一位舞者首版最多允许创建多少种商品？ | 对照 VS-01 限额和发布合同；任何变化须走 `DEV-###`。 |
| D-08-Q07 | Upcoming 是独立内容对象，还是 Product / Event 的视图？ | 遵循当前冻结语义；不同实现方案须有领域决策。 |
| D-08-Q08 | 购买者是否需要账户才能提交商业动作？ | 以 AT 与买方访问合同为准；对应 E-09-07。 |
| D-08-Q09 | 平台需要记录哪些最小订单状态？ | 不把 Inquiry / Confirmed Commerce 伪装成 Order / Paid Transaction；依 D-10 与 PRD 核验。 |
| D-08-Q10 | 如何处理线下 Experience 的安全、隐私和行为边界？ | 进入真实 Pilot 前须有参与者、运营、安全和升级责任；未满足即阻塞。 |
| D-08-Q11 | 哪些流程允许人工运营，哪些状态必须产品化？ | 与 F-13-07、OV-001 责任矩阵和真实运行证据对账。 |
| D-08-Q12 | Creator、Customer 和 Business 是否首版共享同一种 Buyer 模型？ | 遵循当前 API / 产品主体合同；新主体或权限需单独决策和验收。 |

#### 10.3.2 `docs/04_Product/09_MVP_Product_Definition.md`：15 项 PRD 开放问题

| 编号 | 来源问题 | 本清单处理 |
| --- | --- | --- |
| D-09-Q01 | 首版是否内建支付？ | 真实 Provider / 资金受 D-MCL-01 和第 17 节约束；本清单不授权支付。 |
| D-09-Q02 | 是否使用定金？ | 需独立商业、资金和产品决策；不在当前范围。 |
| D-09-Q03 | Event 是直接购买还是报名申请？ | 以现行 Pattern / PRD 合同为准；行为变化需 `DEV-###`。 |
| D-09-Q04 | Service 使用日期申请还是时间槽？ | 与 Reservation 合同及 Stage 5 决策对账；见第 11.2 节。 |
| D-09-Q05 | Experience 是否必须人工确认？ | 以当前授权与状态转换合同为准；不能凭开放问题改变。 |
| D-09-Q06 | Upcoming 与 Product 的创建关系？ | 遵守当前领域模型；需变更时先形成架构 / 产品决策。 |
| D-09-Q07 | 每位 Creator 首版允许发布多少项供给？ | 核对冻结 PRD 与现行限制；任何变更需验收和 `DEV-###`。 |
| D-09-Q08 | Buyer 需要提供哪些最少信息？ | 以隐私最小化、权限及 AT 为验收边界。 |
| D-09-Q09 | 通知使用站内、邮件、短信还是其他渠道？ | 未进入当前合同的渠道不顺带实现。 |
| D-09-Q10 | 外部交易如何回填结果？ | 依据外部事实证据政策；不把自声明当作可信支付事实。 |
| D-09-Q11 | 取消和退款由谁处理？ | 真实退款责任未知时保持阻塞；未授权退款实现。 |
| D-09-Q12 | Creator 页面公开 URL 与身份名称规则？ | 以现有 VS-01 URL / 名称合同为准；公共 C号入口另属未授权 Stage 3。 |
| D-09-Q13 | 内容和图片的最低要求？ | 核对已冻结字段及发布验收；不得扩大个人数据收集。 |
| D-09-Q14 | 哪些安全边界必须由产品强制？ | 以权限合同、威胁模型和负向验收为准；见第 18 节。 |
| D-09-Q15 | 基础 Analytics 对 Creator 展示到什么程度？ | 与事件口径、隐私和用户任务缺口核对；未决前不新增表面。 |

#### 10.3.3 `docs/03_Business/10_Business_Model_and_Unit_Economics.md`：15 项开放问题

| 编号 | 来源问题 | 本清单处理 |
| --- | --- | --- |
| D-10-Q01 | 首轮交易真实收费，还是先记录影子费率？ | 真实收费受 D-MCL-01 阻塞；未批准不收费。 |
| D-10-Q02 | 支付成本由 Creator、Buyer 还是平台承担？ | 商业输入，需结合 Provider 书面资格；DMC-07。 |
| D-10-Q03 | 平台是交易代理、技术服务商还是其他法律角色？ | 保持 `Unknown — Blocking` 直至法律 / Provider 证据；DMC-02。 |
| D-10-Q04 | Event、Experience、Service 是否使用同一支付与退款规则？ | 需独立资金与 Pattern 决策；DMC-09/11。 |
| D-10-Q05 | 低价订单是否需要固定费用？ | 经济假设；应由经批准实验和费率决策验证。 |
| D-10-Q06 | Creator 是否需要最低结算门槛？ | Provider 资格与法律责任问题；DMC-08。 |
| D-10-Q07 | 退款后平台费用是否退还？ | 退款责任未定前保持阻塞；DMC-09。 |
| D-10-Q08 | Creator 取消和 Buyer 取消的经济责任？ | 需取消合同、责任人与资金事实；DMC-09、DMC-14。 |
| D-10-Q09 | Inquiry 如何确认真实成交？ | 事件定义及证据等级需先统一；F-13-02、F-13-07。 |
| D-10-Q10 | 如何计算 Founder-led Onboarding 的影子成本？ | GTM / OV-001 运营日志需记录人工时间及口径。 |
| D-10-Q11 | 何种收入水平支持 Founder-led、Community-led 或 Paid Acquisition？ | 待实际单位经济数据；不得预设扩量阈值。 |
| D-10-Q12 | Creator-owned Demand 与 Platform-acquired Demand 如何归因？ | 依分发事件、来源与证据等级设计；F-13-07。 |
| D-10-Q13 | Creator 在中国境内收款、税务和消费者责任如何处理？ | 法律及 Provider 书面审查；未通过前阻塞真实资金。 |
| D-10-Q14 | 哪个 Primitive 最早具备正贡献毛利？ | 需真实成本与获准实验输入；不以模型情景视作结果。 |
| D-10-Q15 | 何时测试 Pro + Lower Take Rate？ | 先满足持续交易与经营复杂度证据；不在当前实施。 |

#### 10.3.4 `docs/03_Business/11_GTM_Strategy.md`：15 项开放问题

| 编号 | 来源问题 | 本清单处理 |
| --- | --- | --- |
| D-11-Q01 | 首发城市？ | 城市名称待 Founder 确认；One City 是既有方向，不是已选城市。 |
| D-11-Q02 | 首轮可直接触达的 Creator 名单？ | 由 Founder / Operations 在获准重返和目标确认后提供。 |
| D-11-Q03 | Priority A ICP 中哪一类数量最多？ | 依据真实可触达名单盘点，不凭市场假设推定。 |
| D-11-Q04 | Creator 首次邀请的最佳信息？ | 在获准招募后设计小样本实验；不授权本清单直接外联。 |
| D-11-Q05 | Concierge 负责人和记录方式？ | 明确主责、替补、日志字段和隐私边界；关联 F-13-07、OV-02。 |
| D-11-Q06 | 分享链接、二维码与图片的产品优先级？ | 按已批准 Stage 3 / 客户端范围处理；不得据 GTM 问题启动 QR runtime。 |
| D-11-Q07 | 不同社交渠道如何实现基本归因？ | 先定义渠道事件、证据等级及隐私策略；关联 F-13-07。 |
| D-11-Q08 | 首笔交易观察周期是 14 天还是 30 天？ | 由实验方案预先指定，不以结果倒选窗口。 |
| D-11-Q09 | Confirmed Commerce 与真实付款如何区分？ | 依 F-13-02 和 D-15-03；分别记录，不可互相替代。 |
| D-11-Q10 | Founder 时间影子成本采用什么口径？ | 与 D-10-Q10 共用运营时间记录口径并保留原始工时。 |
| D-11-Q11 | Partner 是否需要 Revenue Share？ | 独立商业决策；确认条款前不承诺、不实现分账。 |
| D-11-Q12 | Referral 是否需要短期费率优惠？ | 先观察价值后转介绍证据；费率优惠仍需商业和资金审批。 |
| D-11-Q13 | Creator 拒绝分享的主要原因？ | 通过经批准访谈 / 实验记录，不把推测写成事实。 |
| D-11-Q14 | 如何处理 Creator 的机构或舞室关系？ | 先明确授权、关系与利益冲突边界；不默认启用 Manager / CRM。 |
| D-11-Q15 | 哪种 Distribution Asset 转化最好？ | 通过带来源标记的受控实验判定；不得默认 QR 获批。 |

### 10.4 Founder 决策登记册中其他明确未决项

以下项目来自 [Founder Decisions Register](../01_Strategy/05_Personal_Commerce_Infrastructure_Product_Direction.md)，
不是新增获批需求。须先定义范围、责任人和决策证据；未决不等于已排期：

| 编号 | 未决事项 | 决策 / 验收前置 |
| --- | --- | --- |
| FD-01 | Free / Paid baseline | 与 D-10-02 的现有免费范围及 D-MCL-01 对齐；不得先实现收费。 |
| FD-02 | Pricing unit | 决定是否涉及 Profile、Object、Relationship、Usage 或 Transaction；给出适用阶段。 |
| FD-03 | Usage / Profile / Object / Relationship / Transaction 收费策略 | 明确各计价单位关系、计量事实和不重复收费规则。 |
| FD-04 | 收费能力进入阶段与治理边界 | 明确产品授权、法律主体、Provider、资金责任和关闭闸门。 |
| FD-05 | Reputation 编辑窗口 | 明确时间起点、可编辑事实、权限和审计保留。 |
| FD-06 | Reputation dispute flow | 明确争议发起、证据、审查者、状态、时限和处理结果。 |
| FD-07 | Reputation deletion policy | 明确删除请求、依法保留、不可变商业事实与用户可见状态。 |
| FD-08 | Provider reciprocal review | 明确是否允许 Provider 评价买方及角色 / 滥用防护。 |
| FD-09 | Partial fulfillment | 明确部分履约事实、双方确认和 Reputation 资格。 |
| FD-10 | Chargeback / Refund 与 Reputation 的交互 | 依赖真实资金合同与权威 Provider 事实；未完成前不得实现联动。 |

Stage 3 / 4 / 5 专项合同中额外登记的独立决策见第 9–11 节；逐文件覆盖索引见第 1.5 节。

## 11. Stage 5：扩展商业基础设施

以下均属于产品方向级路线图，必须逐项独立形成产品合同和批准的变更单元，不能通过“基础设施扩展”一次性打包授权。

### 11.1 Offer 与 Capability

| 编号 | 候选任务 | 前置决策 | 验收要点 | 状态 |
| --- | --- | --- | --- | --- |
| ST5-O1 | Profile 与 Capability / Offer 归属 | Offer owner、Capability 关系和迁移兼容决策 | 归属、读取和授权关系唯一且与 Identity/Profile 边界一致 | `待决策` |
| ST5-O2 | Service Offer 生命周期 | Published / Retired、价格和客户可见性策略 | 不改变现有 VS-01 Service Offering 合同；回归通过 | `待决策` |
| ST5-O3 | Goods Offer | 数量库存、订单和交付事实合同 | 独立 PRD、状态机、验收和非目标 | `待决策` |
| ST5-O4 | Program / Membership Offer | Cohort / Seat、持续 Access 和续期边界 | 独立 PRD、承诺与履约验收 | `待决策` |
| ST5-O5 | Project / Right Offer | Scope、Milestone、License、Grant 和 Usage | 独立 PRD、生命周期及权利边界 | `待决策` |

以上候选不授权扩展任何 Offer 类型；Stage 5 的正式排序尚未批准。

### 11.2 Inventory / Availability

| 编号 | 候选任务 | 前置决策 | 验收要点 | 状态 |
| --- | --- | --- | --- | --- |
| ST5-I1 | 跨 Offer Inventory 产品合同 | Inventory 是统一原语还是各 Offer 专用规则 | 明确 Time / Quantity / Seat 的共性、差异和不变量 | `待决策` |
| ST5-I2 | Availability / HOLD / COMMITTED 语义 | 与 Reservation、Request、Contract 的边界 | 状态、有效期、冲突、并发和重复请求有测试合同 | `待决策` |
| ST5-I3 | 时间与容量规则扩展 | 可变时长、Buffer、准备 / 交通 / 后处理时间 | 提供者规则、时区、并发和验收场景冻结 | `待决策` |
| ST5-I4 | Reservation 兼容实施 | 先审计当前 VS-01 Reservation，不预设重构 | 旧黄金路径通过；迁移 / 回滚证据通过 | `待决策` |

### 11.3 Commerce Commitment / Fulfillment

| 编号 | 候选任务 | 前置决策 | 验收要点 | 状态 |
| --- | --- | --- | --- | --- |
| ST5-C1 | Commerce Commitment 产品合同 | Request、Reservation、Order、Contract 的统一与差异 | 对象语义、参与者、状态转换和规范事件冻结 | `待决策` |
| ST5-C2 | 既有 Pattern 映射 | 现有状态机到 Commitment 概念的兼容策略 | 不静默重命名、不破坏 CLIENT-002；AT 和迁移边界明确 | `待决策` |
| ST5-F1 | Fulfillment 通用领域合同 | 按 Offer Type 定义可观察的履行事实 | Fulfilled / Failed / Cancelled 等事实来源可追溯 | `待决策` |
| ST5-F2 | Deliverable / Milestone / Access / Shipment / Attendance | 确认需要首发支持的交付形式 | 每种纳入项有主体、生命周期、权限和 AT | `待决策` |
| ST5-F3 | Completion / Earnings 兼容 | Completion 事实与投影、取消和退款方向的边界 | 不把 Earnings / Wallet projection 表述为真实结算 | `待决策` |

### 11.4 Commerce Reputation

| 编号 | 候选任务 | 前置决策 | 验收要点 | 状态 |
| --- | --- | --- | --- | --- |
| ST5-R1 | Reputation 首发产品合同 | 真实交易、参与者和 Profile 归属规则 | 每条 Reputation 可追溯到符合资格的 Commitment | `待决策` |
| ST5-R2 | 评价资格和事实关联 | Authenticated participant、Completed / Fulfilled 证据 | 未购买者、未履约和 Synthetic/Test 不获得正常资格 | `待决策` |
| ST5-R3 | 编辑、删除和争议政策 | 编辑窗口、dispute、删除与审计保留 | 用户权利、审计和不可变 Commerce Facts 有明确界线 | `待决策` |
| ST5-R4 | 退款、拒付和部分履约对信誉的影响 | 必须先有支付 / 退款产品决策 | 所有资金影响均有权威事实来源；无先行实现 | `待决策 / 依赖未来资金决策` |

### 11.5 个人运营和商业化

| 编号 | 候选任务 | 决策内容 | 当前状态 |
| --- | --- | --- | --- |
| ST5-M1 | Free / Paid baseline | 免费边界、付费触发点、初始商业模式 | `Founder 未决` |
| ST5-M2 | 定价单位 | Profile / Object / Relationship / Transaction 的计价选择 | `Founder 未决` |
| ST5-M3 | 费用承担者 | Creator、Customer 或其他主体的费用归属 | `Founder 未决` |
| ST5-M4 | 收费能力的阶段闸门 | 收费何时可进入、与真实资金治理如何衔接 | `Founder 未决` |

未完成上述商业决策前，不实现订阅收费、Marketplace 或 CRM。

## 12. D-MCL-01 / Provider 资格与首笔 Commerce 决策输入

本节是**资格调查与决策准备清单**，不授权真实 Provider 集成、真实收款、Creator KYC 或任何资金流。`33_Money_Flow_Decision.md` 当前只允许补齐真实决策输入；中国大陆与 CNY 已登记为首发市场和币种约束，不得误列为未决。其余未知的关键资格仍是阻塞，不能通过假设补齐。

### 12.1 Gate 0C-1：业务模式资格

| 编号 | 核验任务 | 必须取得的输入 / 证据 | 完成判据 |
| --- | --- | --- | --- |
| DMC-01 | 核验已冻结的首发市场 / 币种，并确认真实试点范围 | 已登记输入为中国大陆、CNY；核验批准记录及其适用范围，并取得真实交易限制和样本 | 保留中国大陆 / CNY 决策的签署来源；仅在 Founder 正式变更时更新，不将其重新列为未决；试点范围另行确认 |
| DMC-02 | 确认交易主体及平台法律角色 | Creator / 平台的法律实体、Seller / Merchant、平台角色、税务 / 消费者义务 | 每个主体和责任边界有明确责任人及证据；未知项列为 `Unknown — Blocking` |
| DMC-03 | 核验 Creator Service Commerce 业务类别 | 分别向候选 Provider 询问一对一线上 / 线下舞蹈服务、Creator 类型和限制 | Provider 针对准确场景书面确认；公开通用文档仅可标为候选依据 |
| DMC-04 | 核验平台与 Creator 准入资格 | 平台资质、自然人 / 个体工商户 / 机构 Creator、地域及试点规模限制 | 每家 Provider 按真实主体分别记录 `Confirmed / Candidate / Rejected / Unknown — Blocking` |
| DMC-05 | 形成 Gate 0C-1 结论 | 合并业务类别、Seller、平台角色、Creator 资格和试点约束 | 结论为 `CONFIRMED / CONDITIONAL / BLOCKED / REJECTED`，附书面证据和待办；禁止推断 |

### 12.2 Gate 0C-2：资金流资格

| 编号 | 核验任务 | 必须取得的输入 / 证据 | 完成判据 |
| --- | --- | --- | --- |
| DMC-06 | 追踪 Customer 付款和资金控制路径 | 首个收款主体、资金是否冻结 / 托管、Creator 可支配时点 | 每一步的账户控制人和资金所有权有 Provider 书面确认 |
| DMC-07 | 核验 Platform Fee、Provider Fee 和分账 | 费用承担方、金额 / 费率、扣款时点、分账参与方和限制 | 资金公式可重算且受准入角色允许；未知保持阻塞 |
| DMC-08 | 核验 Creator Earnings、余额和提现 | Pending / Available / Restricted / Withdrawable 定义、账户类型、提现上限 / 时效 / 失败 | 余额来源和 Creator 可控制账户的路径清楚；不得把内部投影当 Provider 余额 |
| DMC-09 | 核验退款、争议、拒付和负余额 | 结算前后退款、分账回退、欺诈、Chargeback、追偿责任 | 每种失败 / 反转均明确处理人、资金责任、接口事实及证据 |
| DMC-10 | 核验可信 Payment Fact 和对账 | 回调 / Webhook、查单、幂等键、结算 / 提现记录与对账标识 | 明确服务端可验证事实来源、重试 / 重放保护和审计字段 |
| DMC-11 | 形成 Gate 0C-2 结论 | 将资金路径、费用、结算、退款、Dispute、提现和责任合并评审 | `CONFIRMED / CONDITIONAL / BLOCKED / REJECTED` 有凭据和责任人 |

### 12.3 Gate 0C-3：运营资格与 Creator Onboarding

| 编号 | 核验任务 | 必须取得的输入 / 证据 | 完成判据 |
| --- | --- | --- | --- |
| DMC-12 | 取得 KYC / KYB 要求和数据责任 | 各 Creator 类型所需材料、收集方、存储方、审核周期 | 责任和数据处理范围书面确定；本清单不授权向 Creator 收集真实资料 |
| DMC-13 | 定义账户进件、状态和退出处理 | Pending / Restricted / Rejected / Suspended / Terminated 时可执行操作 | 订单、余额、Customer 告知、申诉和停止动作各有负责人 |
| DMC-14 | 验证失败处理与人工运营能力 | Payment Failed、Creator Declined / Unable to Fulfill、Refund、Dispute、Provider 故障 | 有有限、可审计、规模适配的运行与升级流程 |
| DMC-15 | 验证稳定对账及支持渠道 | Provider 稳定 ID、回调 / 查询 / 对账记录、商户支持和升级渠道 | 每类真实事实可关联到 Commerce 记录；支持 SLA 和责任人明确 |
| DMC-16 | 形成 Gate 0C-3 结论 | 合并进件、时效、限制、失败操作、对账和 Pilot 支持 | `CONFIRMED / CONDITIONAL / BLOCKED / REJECTED` 有原始证据 |

### 12.4 Provider Outreach、Response Intake 与 D-MCL-01 决策包

| 编号 | 任务 | 交付物与验收 | 依赖 / 状态 |
| --- | --- | --- | --- |
| DMC-17 | 完成微信支付资格问题包 | 按 Provider 档案的 Gate 0C-1/2/3 问题编号发送；保存产品 / 商务 / 行业方案回复 | DMC-01–16；`待外部回复` |
| DMC-18 | 完成支付宝独立资格问题包 | 单独确认支付宝业务路径，不得从微信支付能力类推 | DMC-01–16；`待外部回复` |
| DMC-19 | 维护 Provider Response Intake | 每题记录 Provider、产品 / 合同、联系人、回答、证据类型 / 引用、日期、适用范围、状态和责任人 | 有正式回复后；`待外部回复` |
| DMC-20 | 形成 First Commerce Pilot Business Case | 使用实际 Creator / Customer / Offer、价格样例、主体、费用、履约和例外假设；将未知明确列阻塞 | DMC-01–16；`待真实输入` |
| DMC-21 | 触发 D-MCL-01 Decision Review | 收到首批正式回复后逐 Gate 评审，形成 `Approved / Conditional Approval / Rejected` 及签署人、日期 | DMC-05/11/16/19；`Founder 决策待定` |
| DMC-22 | 建立获批后的下游实施闸门 | 若获批，另行冻结 Provider 专属合同、资金责任、法律审查、回滚条件和实现单元；若拒绝，记录停止 / 替代路径 | DMC-21 后；`尚未授权` |

优先资格候选为微信支付；支付宝必须独立调查。最多对两个首发 Provider 做受控资格确认。所有外联只确认资格和决策事实，不要求 Creator 提交真实 KYC / 银行资料。

`D-MCL-01` 获批前不得实现 Provider-specific Checkout、Webhook、Payment、Refund、Payout 生产接入，不得启用 `REAL_MONEY_ENABLED`，不得把 Sandbox、测试卡或人工数据库修改当真实商业证据。Provider-neutral Money Domain 也只有在其现有产品合同和单项授权明确覆盖时方可实施。

### 12.5 First Completed Paid Commerce：远期验收，不是当前排期

只有在独立获批的真实资金实施包下，才可按 [最小商业闭环](../09_Engineering_Governance/32_Minimum_Commercial_Loop.md) 验收完整路径：主体与 Provider 资格获批；真实 Creator 完成 Onboarding 并发布真实有价 Offering；Customer 提交 Request；形成真实 Order 快照；可信 Payment Fact；真实 Fulfillment；正确计算 Provider Fee、Platform Fee、Creator Net；Settlement / Ledger / Wallet 投影和 Creator Withdrawal；验证 Payment Failed、Cancellation、Refund 及 Withdrawal Failed 等适用异常；所有金额、状态、权限、Webhook / Provider Event、日志和证据可审计。Sandbox / Fixture / Mock 不可替代真实交易证据。

**状态**：`未获授权；D-MCL-01 仍 Pending；不得视为本轮可执行任务。`

## 13. OV-001 真实运营验证任务

执行记录为 `OV-001` 已获一次性运营验证授权，但当前执行 readiness 是 `NOT_READY`、尚未开始。
授权实验不等于具备启动条件。

OV-001 是否仍是 Founder 当前优先商业目标，必须在 `RESUME-001` 重返审查期间重新确认。
未确认前，以下清单只作为阻塞项盘点，不应主动部署或联系参与者启动实验。

### OV-01：参与者与 Offer

- 确认真实 Creator；
- 确认真实 Customer；
- 确认 Creator-owned 且 Request-compatible 的 Offer；
- 确认 Customer handoff；
- 明确履约、完成 / 取消、争议和 closeout 规程。

**状态**：`阻塞 — 缺真实运营输入`。

### OV-02：岗位和决策权

- 指定 Operator；
- 指定 Evidence Owner；
- 指定 Stop Authority；
- 确认每个岗位的执行权限和替补规则。

**状态**：`阻塞 — 责任人未验证`。

### OV-03：环境隔离

- 接受可重建的 source revision；
- 独立 Validation PostgreSQL 及负责人；
- 独立 Supabase Auth 及负责人；
- 受控 HTTPS 域名、DNS、TLS 和访问控制；
- protected configuration injection；
- 证明 OV-001 数据、Auth、Database 不等于验收 / Fixture 环境。
- CORS、Cookie、Session 和访问策略通过验证；
- Secrets 来源、旋转与紧急撤销责任明确；
- Observability 配置验证且不泄露 Secrets / 多余个人数据。

**状态**：`阻塞 — 环境未验证`。

### OV-04：审计和证据

- 隔离日志 / 审计和证据存储；
- 证据所有人、保留期限和重建程序；
- 安全日志不写入秘密或不必要的个人数据；
- 备份 / 恢复、部署健康检查和事实重建证据。
- 记录 `OV-001` 对应的提交、部署时间、环境标识和部署后 source revision；
- 记录 Runbook、操作结果、异常和退出决定；
- 确认金钱边界、风险处置、停止机制和客户沟通流程；
- 完成一笔真实、非资金 Request 的证据重建演练。

**状态**：`阻塞 — 证据和规程未就绪`。

### OV-05：重审 Readiness

- 使用受保护环境重新运行 `pilot-preflight`；
- 完成受控环境部署 / health / readiness / backup-restore 检查；
- 复审 OV-001 运行矩阵；
- 所有 mandatory readiness 项为 `READY` 后，才标记 `READY_FOR_EXECUTION`；
- `START_OV001` 仍须遵循其独立启动闸门。

**状态**：`依赖 OV-01 至 OV-04`。

## 14. Future：平台、网络与生态扩展候选

Product Direction 仅把以下内容列作长期评估方向：Platform / Network / Ecosystem Extensions。没有已批准的独立问题定义、用户、范围、阶段、PRD、架构决策或验收合同，因此**目前没有可直接照单实现的 Future 阶段 backlog**。

未来若提出相关工作，先登记一份 Founder 决策包并回答：

| 编号 | 必须完成的决策 / 任务 | 完成判据 |
| --- | --- | --- |
| FUT-01 | 说明核心 Commerce Infrastructure 已达到何种成熟度，为什么需要平台 / 网络 / 生态扩展 | 引用可验证的真实产品事实；不得只以技术能力或愿景作为依据 |
| FUT-02 | 明确目标用户、具体问题、产品结果和与核心 PCI 的关系 | 不把外部平台设为 PCI 的 System of Record；明确对象、生命周期、权限和事实来源 |
| FUT-03 | 评估网络 / 平台效应与治理责任 | 明确参与者、数据、滥用、隐私、安全和运营责任 |
| FUT-04 | 确定可逆、有限的试验和停止条件 | 有独立范围、成功 / 失败判据、数据影响和回滚方案 |
| FUT-05 | 建立正式产品 / 架构合同和实施验收 | 有 Founder 批准、独立 `DEV-###`、ADR、测试 / 验收及阶段授权 |

**状态**：`方向候选；未立项、未排期、未授权。`

## 15. Experiment Log：已登记验证实验候选

Experiment Log 中的 30 个实验均为 `Proposed`。本节仅保持编号、问题范围与“不自动开始”的状态；每个实验开始前仍需填写负责人、Cohort、方法、Primary Signal、Guardrail、Success Threshold、日期和结果记录。

### 15.1 产品行为实验 E-09-01–E-09-10

| 编号 | 中文实验主题 | 关联问题 / 决策 | 当前状态 |
| --- | --- | --- | --- |
| E-09-01 | Creator 发布供给 | Creator 是否完成 Publish；D-09-03 | `Proposed；未排期` |
| E-09-02 | Creator 主动分发 | Creator 是否将页面 / Offering 发到自己的渠道；D-08-04、D-11-07 | `Proposed；未排期` |
| E-09-03 | First Commerce Primitive | 首个商业动作应由哪种 Primitive 表达；D-08-03、D-09-05 | `Proposed；未排期` |
| E-09-04 | Event / Experience / Service 分类 | 首发供给的类别和边界；D-09-06 | `Proposed；未排期` |
| E-09-05 | 价格披露 | 价格展示对用户行为的影响；D-09-08 | `Proposed；未排期` |
| E-09-06 | 预约模式 | 客户请求、预约和可用时间的行为差异；D-08-08 | `Proposed；未排期` |
| E-09-07 | 无账户买方 | Buyer 无账户路径是否必要；D-09-04 | `Proposed；未排期` |
| E-09-08 | 外部与内部交易 | 交易边界与外部支付 / 履约观察；D-09-06、D-10-03 | `Proposed；未排期` |
| E-09-09 | 跨 Creator 类型可移植性 | Commerce Pattern 是否适用于多个 Archetype；D-08-06 | `Proposed；未排期` |
| E-09-10 | 重复供给 | Creator 是否再次创建 / 更新供给；D-11-02 | `Proposed；未排期` |

### 15.2 经济实验 E-10-01–E-10-10

| 编号 | 中文实验主题 | 关联问题 / 决策 | 当前状态 |
| --- | --- | --- | --- |
| E-10-01 | Creator 分享收入的意愿 | 收入分享意愿；D-10-01 | `Proposed；未排期` |
| E-10-02 | Take Rate 敏感度 | 费率变化对行为的影响；D-10-04 | `Proposed；未排期` |
| E-10-03 | 费用承担方 | Creator / Customer 等费用承担安排；D-10-05 | `Proposed；未排期` |
| E-10-04 | 平台增值效果 | 平台对交易 / 运营结果的增量价值；D-10-03 | `Proposed；未排期` |
| E-10-05 | 活跃 Creator 收入 | 每位活跃 Creator 的收入指标；D-10-06 | `Proposed；未排期` |
| E-10-06 | 贡献毛利 | 单位经济与成本结构；D-10-07 | `Proposed；未排期` |
| E-10-07 | 站外交易流失 | 交易转移到平台外的程度；D-10-08 | `Proposed；未排期` |
| E-10-08 | 多产品经济性 | 多类产品组合的经济性；D-08-02、D-10-06 | `Proposed；未排期` |
| E-10-09 | SaaS 收费触发点 | 何时出现 SaaS 收费条件；D-10-08 | `Proposed；未排期` |
| E-10-10 | Inquiry 的经济价值 | Inquiry 与后续价值的关系；D-10-09 | `Proposed；未排期` |

### 15.3 GTM 实验 E-11-01–E-11-10

| 编号 | 中文实验主题 | 关联问题 / 决策 | 当前状态 |
| --- | --- | --- | --- |
| E-11-01 | ICP 细分 | 确定理想 Creator 客群；D-11-03 | `Proposed；未排期` |
| E-11-02 | Founder 直接触达 | 直接招募渠道；D-11-05 | `Proposed；未排期` |
| E-11-03 | 社群获客 | 社群渠道的招募效果；D-11-05 | `Proposed；未排期` |
| E-11-04 | Studio / Crew 合作 | Studio / Crew 作为合作渠道；D-11-05 | `Proposed；未排期` |
| E-11-05 | 活动获客 | 活动渠道；D-11-05 | `Proposed；未排期` |
| E-11-06 | Concierge 与自助对比 | 人工协助与自助路径的差异；D-11-06 | `Proposed；未排期` |
| E-11-07 | Distribution Asset | 分发素材形式；D-11-07 | `Proposed；未排期` |
| E-11-08 | Distribution Channel | 分发渠道；D-11-07 | `Proposed；未排期` |
| E-11-09 | Value Proposition | 用户对价值主张的响应；D-11-03 | `Proposed；未排期` |
| E-11-10 | 价值实现后的转介绍 | 用户获得价值后是否主动推荐；D-11-09 | `Proposed；未排期` |

Experiment Log 推荐的依赖顺序为：

1. **供给**：E-11-01 → E-11-02 → E-09-01 → E-11-06；
2. **分发**：E-09-02 → E-11-07 → E-11-08 → E-11-09；
3. **Commerce**：E-09-03 → E-09-04 → E-09-06 → E-09-08；
4. **经济性**：E-10-01 → E-10-04 → E-10-05 → E-10-06；
5. **留存**：E-09-10 → E-10-07 → E-11-10 → 后续 PMF 留存实验。

以上仅为依赖建议，不代表 Founder 已批准当前启动。日志记录截至其最新内容“尚无已执行实验”；不得同时启动全部 30 项。正式开始前必须定义负责人、样本、方法、指标、Guardrail、Success Threshold、日期和停止条件；结果必须标注证据等级、局限和对决策的实际影响，不能把访问或口头兴趣升格为真实交易 / PMF。

## 16. Audit Findings 与 MVP 冻结决策索引

`13_Document_Audit_and_Consistency_Review.md` 和 `15_MVP_Build_Readiness.md` 记载的发现、Build Gate 与 Founder 决策属于历史治理材料。本节保持引用，不把旧审计自动变成新范围，也不静默覆盖后续更权威的合同。

| 编号 / 范围 | 问题或决策主题 | 当前处理 |
| --- | --- | --- |
| F-13-01 | Long-term North Star 与 MVP North Star 分层 | 后续决策时检查指标口径，不作为产品功能任务 |
| F-13-03 | Frozen 文档中混有未经验证的假设 | 文档一致性审查时区分 Observation / Hypothesis / Decision |
| F-13-04–07 | 支付 / 交易确认 / 外部跳转归因、首发城市与 Creator、履约 / 取消 / 责任、Concierge 事件及指标责任 | 依当前产品方向由 D-MCL-01、商业验证与 OV-001 决策重新确认；不得按旧记录自行启动 |
| D-15-01–07 | Prototype Transaction Mode、First Primitive、Transaction Vocabulary、Pilot Responsibility、Cohort Scope、Build Scope、Readiness Gate | 按已批准新合同核对是否仍有效；不重复签署或推导生产许可 |
| MVP Build Readiness | Prototype / Cohort 0 / Cohort 1 / Real-money Gate 的历史验收框架 | 真实资金以当前 `33_Money_Flow_Decision.md`、`35A_Provider_Qualification_Dossier.md` 和 Handoff 为准 |

## 17. 真实资金、客户端与其他明确排除项

以下不是本清单的可执行任务：

| 能力 | 当前边界 |
| --- | --- |
| Payment / Provider live integration | `不在当前任务范围；需独立批准` |
| Settlement / Withdrawal / Refund | `延后；不得由已有 Earnings / Wallet Projection 推导` |
| `REAL_MONEY_ENABLED` | 保持 `false` |
| Marketplace / CRM | 当前明确不在 VS-01 / 私有闭环范围 |
| `apps/app` 原生客户端 | `DEFERRED` |
| Social Graph、内容发布、内容推荐、平台同步 | 未授权 |
| 新 Vertical / 新 Commerce Pattern | 需独立商业依据、产品合同和批准 |
| 生产部署、迁移、Pilot 启动 | 不包含在文档任务总清单接受内，需独立闸门 |

## 18. 所有实现任务共同的工程交付清单

每个获准的代码变更都必须完成：

1. 对齐产品需求、领域对象、状态转换、规范事件、权限和验收案例；
2. 变更产品行为前先登记 `DEV-###`；
3. 遵守现有架构和 AGENTS.md 的目录规则；
4. 编写最近邻测试，并按适用范围运行格式化、lint、typecheck、单元、集成和验收测试；
5. PostgreSQL 改动验证 migration 和真实 PostgreSQL integration；不得以 Mock / Sandbox 代替真实服务证据；
6. 更新 `21_Prototype_Execution.md`，记录命令、日期、提交、结果、失败、跳过和阻塞；
7. 检查 VS-01 `AT-001`–`AT-013`、CLIENT-001、CLIENT-002 是否受影响；
8. 检查用户文案是否将自声明、模拟或本地事实错误表达为验证、真实资金或外部证据。

## 19. 推荐顺序和实际下一项

### 第 0 步：接受或修订本总清单

**任务编号**：`PCI-DEVELOPMENT-BACKLOG-001`  
**状态**：`待 Founder / Main Control 接受`。

### 第 1 步：授权并执行 RESUME-001 重返审查

先满足 Handoff 的恢复审查要求，不从待办里任选功能开始编码。
建议把 `PCI-BACKLOG-RECONCILIATION-001` 作为 `RESUME-001` 的强制子包，而不是绕过 Handoff
另开产品实现。

恢复前置条件必须逐项复现 Handoff 的九项 Gate：

1. 已阅读 Handoff SSOT；
2. 当前 commit 与 Suspend Baseline 一致或完成书面对账；
3. Engineering Preflight 通过；
4. CLIENT-001 Regression 通过；
5. CLIENT-002 Regression 通过；
6. 确认 `REAL_MONEY_ENABLED=false` 或有明确重新决策；
7. 确认 `apps/app=DEFERRED` 或有明确重新决策；
8. Founder 重新确认当前商业目标；
9. Founder 明确批准下一实施单元。

不能把“接受本 Backlog”“运行一项测试”或“Stage 2 有代码”视为九项 Gate 自动通过。

### 第 2 步：Stage 2 / Self-Service / OV-001 证据对账

对照已提交实现和历史 Acceptance-004，区分：

- 产品验收是否通过；
- 当前全量工程 preflight 是否通过；
- 哪些失败是已有工程回归；
- OV-001 是否具备真实执行输入；
- 哪些工作流更符合 Founder 当前商业目标。

这一步不应把 `SELF_SERVICE_COMPLETE_CLOSURE = READY_FOR_PILOT` 改写成“产品未完成”；也不能把 `READY_FOR_PILOT` 误读为 OV-001 当前 `READY_TO_START`。

### 第 3 步：提交决策，而非猜测实施目标

由 Founder 决定优先选择：

- 自助闭环产品化 / 稳定性；
- OV-001 真实运营准备；
- 其他明确商业方向。

获准方向后，再建立含范围、偏差、测试和验收的实施包。

决策时应使用已有商业验证模型记录：

- 客户 / 创作者各自是否完成关键行为；
- 一个交易循环的建立和完成所需时间；
- 唯一核心风险 / 转换率和例外；
- 贡献利润、运营成本与下一步有效实验；
- 不以访问量、账户数或模拟 GMV 代替价值证据。

记录格式和闸门继续以 `28_Operating_Closure_Model.md` 中 OV-001 合同及其最新执行评估为准。

## 20. 验收与决策表

```text
PCI-DEVELOPMENT-BACKLOG-001 = [接受 / 修改 / 拒绝]
RESUME-001 = [授权审查 / 修改范围 / 暂缓]
第一优先产品目标 = [Self-Service / OV-001 / 其他]
具体实现单元 = [完成重返审查后另行决定]
PROJECT_STATUS = SUSPENDED，直至现有 Resume Gate 全部满足
REAL_MONEY_ENABLED = false
```
