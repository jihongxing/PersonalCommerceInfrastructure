# Personal Commerce Infrastructure 文档索引

> **CURRENT PROJECT CONTROL**：CONTROLLED RECOVERY — FORMAL RESUME GATE NOT FULLY CLOSED
> **CURRENT BASELINE**：CLIENT-002 — Commerce Golden Path Closure = COMPLETE
> **CURRENT CONTROL BASELINE**：[`25 — Project Control Baseline`](./08_Execution/25_Project_Control_Baseline.md)
> **RESTART SSOT**：[`docs/08_Execution/22_Project_Handoff.md`](./08_Execution/22_Project_Handoff.md)
> **ARCHITECTURAL DISCOVERY BEFORE SUSPENSION**：Identity Infrastructure is required
> **HISTORICAL NEXT TASK**：RESUME-001 — Identity & External Platform Binding Foundation
> **NEXT CONTROL ACTION**：Provenance and acceptance reconciliation under the current baseline
> **开发任务总清单**：[24 — 项目开发任务总清单](./08_Execution/24_Development_Backlog.md)
> **场景进入战略**：[FD-PCI-SCENARIO-SEQUENCING-001](./07_Product_Architecture/42_Commercial_Scenario_Sequencing_Founder_Decision.md)（Service 之后优先 Membership；优先级不是运营开放状态）
> 最近执行更新：2026-11-12（PCI-ENG-015-B-R2 持久化完整性与验证闭合）
> 文档性质：战略、商业选择与 MVP 产品定义；不是最终 PRD 或技术方案

```text
PROJECT_CONTROL_MODE = CONTROLLED_RECOVERY
FORMAL_RESUME_GATE = NOT_FULLY_CLOSED
CLIENT-002 = COMPLETE
VS-01 = FROZEN
STAGE_2 = BOUNDED_APPROVED_CHANGE_UNITS_ONLY
FULL_STAGE_2 = NOT AUTHORIZED
STAGE_3 = NOT AUTHORIZED
REAL_MONEY_ENABLED = false
apps/app = DEFERRED
IDENTITY DIRECTION = Identity → Commerce Profile → Commerce ID → External Platform Account → Commerce Relationship
NEXT CONTROL ACTION = PROVENANCE AND ACCEPTANCE RECONCILIATION
```

当前阶段索引：

当前应用拓扑：`apps/api`（共享后端）、`apps/web-v2`（唯一 Creator Web）、
`apps/admin-web`（独立 Operations Admin shell）。`apps/web` / `apps/api-mock` 已按
Founder 决策退休。认证、目录操作和人工复核尚未接入 Admin。
参见 [121 — Operations Admin Web Architecture](./09_Engineering_Governance/121_Operations_Admin_Web_Architecture.md)
和 [122 — Operations Identity Domain Contract](./09_Engineering_Governance/122_Operations_Identity_Domain_Contract.md)，
及[退休测试与门禁清单](../tests/historical/retired-reference-client/README.md)。
PCI-ENG-015-A 已由 Main Controller 工程验收为 `ACCEPTED`；PCI-ENG-015-B-R2 已完成实现与证据闭合，
其持久化状态仍为 `IMPLEMENTED / ACCEPTANCE_PENDING`，等待 Main Controller 最终验收。

```text
CLIENT-001 Web Client Convergence   Complete
CLIENT-002 Golden Path Closure      Complete
Project Development                Controlled Recovery
Real Money                         Disabled
Native App                         Deferred
Identity / Commerce Profile Runtime 已有提交实现；仅具名 change units 可在原范围内继续核验
```

当前产品状态：

```text
Pattern-first Commerce Web
+ Request / Reservation / Contract Golden Paths
+ Creator Commerce Desk
+ Completion
+ Earnings / Wallet Projection
```

挂起前新增的架构发现是：PCI 不替代第三方内容与宣发平台，而是承接其产生的商业流量。
当前控制基线承认暂停后发生了有限、分段的工程恢复，但不宣布完整 Resume Gate 已通过。
Identity、Commerce Profile 和 Commerce Reference 的已批准范围以当前控制基线为准；OAuth、平台验证、
Manager / Delegated Manager、Profile Transfer、外部 Pilot、生产和真实资金仍未授权。

`VS-01 Regression` 的当前解释是 `VS-01 Semantics Remain Stable`，不是 `VS-01 Isolation`。
合法 VS-02 Contract 可以新增，但不得覆盖 VS-01 route、改变 VS-01 request/response semantics、
污染 VS-01 canonical events 或破坏 VS-01 permission boundary。

**No Real Money Evidence.** Provider Qualification 尚未完成。

## 1. 文档目的

本目录用于沉淀项目从点子讨论进入项目定义阶段后形成的核心共识，并为后续产品、研发、商业、验证和融资工作提供统一上下文。

当前文档冻结已经形成的战略判断、核心抽象、市场楔子和 MVP 产品边界，不提前固化尚未验证的详细交互、商业参数或技术架构。

## 2. 当前战略定义

我们不是在做一个帮助 Creator 发布行程的平台，也不是在做一个新的票务平台。

我们正在构建属于个人的商业基础设施：

> 为拥有个人 IP、专业能力、技能、影响力或个人品牌的人，提供统一的商业身份、商品、库存、交易、客户、收入与商业数据基础设施，使个人能够像一家公司一样经营自己。

社交平台负责帮助个人获得注意力；本项目负责把个人的身份、能力、时间、影响力和受众转化为可经营、可交易的商业关系。

第一阶段从 Creator 切入，因为 Creator 是“个人商业化”最成熟、商业意图最显性的一批早期用户。

## 3. 第一阶段核心文档

### Strategy

1. [01 — Project Thesis](./01_Strategy/01_Project_Thesis.md)  
   定义我们发现了什么、为什么值得做，以及项目到底是什么。

2. [02 — Vision & Endgame](./01_Strategy/02_Vision_and_Endgame.md)  
   定义产品从 Creator Commercial Identity 到 Personal Commerce Infrastructure 的长期演化。

3. [03 — Core Abstraction](./01_Strategy/03_Core_Abstraction.md)  
   定义 Creator、商业资产、可交易库存、商品和交易之间的底层关系。

4. [04 — North Star & End State](./01_Strategy/04_North_Star_End_State.md)
   定义项目终局北极星、终局必须成立的产品事实、长期衡量框架和阶段闸门。

5. [05 — Personal Commerce Infrastructure Product Direction](./01_Strategy/05_Personal_Commerce_Infrastructure_Product_Direction.md)
   产品方向层 SSOT；定义长期产品命题、领域模型、通用 Offer 类型、商业闭环和与阶段性产品合同的边界。

6. [06 — Commerce Reference 跨平台传播研究](./01_Strategy/06_Commerce_Reference_Research.md)
   记录 C号的跨平台传播、容量、人因与安全边界研究，以及已冻结的 22 字符、18 位引用设计。

7. [07 — Commerce Reference 产品规范](./01_Strategy/07_Commerce_Reference_Product_Spec.md)
   定义 C号与 QR 表示的产品语义、规范形式、生命周期、未来 resolver 边界和未授权实现范围。

### Market

4. [04 — Creator Commerce Taxonomy](./02_Market/04_Creator_Commerce_Taxonomy.md)  
   定义 Creator 可以出售的七类商品及其交易原语。

5. [05 — Creator Vertical Taxonomy](./02_Market/05_Creator_Vertical_Taxonomy.md)  
   按商业化来源划分 Creator 原型，并建立 Creator Type × Commerce Type 的分析框架。

### Product

6. [06 — MVP Thesis](./04_Product/06_MVP_Thesis.md)  
   定义第一阶段要验证的核心假设、产品边界、成功信号和明确不做的事项。

## 4. 第二阶段决策文档

7. [07 — Creator Commerce Opportunity Matrix](./02_Market/07_Creator_Commerce_Opportunity_Matrix.md)  
   将 Creator 与 Commerce 分类转化为加权决策工具，划分首批验证、第二阶段和暂不进入的候选市场。

8. [08 — MVP Wedge Strategy](./04_Product/08_MVP_Wedge_Strategy.md)  
   冻结舞者优先的产品楔子，以及 Commerce Identity-first、Creator-first、Transaction-first 和跨原型验证策略。

9. [09 — MVP Product Definition](./04_Product/09_MVP_Product_Definition.md)  
   冻结 MVP 用户、产品表面、双侧路径、Commerce Primitive、Activation、实验候选和明确非目标。

### Business

10. [10 — Business Model & Unit Economics](./03_Business/10_Business_Model_and_Unit_Economics.md)  
    冻结初始收费原则、Commerce Monetization Matrix、单位经济公式、收入情景、SaaS 与 Marketplace 进入条件及经济实验。

11. [11 — Go-to-Market Strategy](./03_Business/11_GTM_Strategy.md)  
    冻结舞者 Creator ICP、供给获取渠道、Concierge Onboarding、Creator Distribution、交易漏斗、CAC 与渠道实验。

### Validation

- [Experiment Log](./05_Validation/Experiment_Log.md)  
  持续登记产品、经济和 GTM 实验，并将 Result 回写到 Decision。

12. [12 — PMF & Validation Framework](./05_Validation/12_PMF_and_Validation_Framework.md)  
    定义 PMF 证据阶梯、多侧 PMF、Cohort 阈值、失败解释、经济 PMF 和 Experiment → Decision 回写机制。

### Audit

13. [13 — Document Audit & Consistency Review](./06_Audit/13_Document_Audit_and_Consistency_Review.md)  
    审计 01–12 的命题链、Decision 一致性、Assumption Leakage、商业闭环、指标层级和 Build Blockers。

14. [15 — MVP Build Readiness](./06_Audit/15_MVP_Build_Readiness.md)  
    将 P1 Build Blockers 收敛为受控 Prototype 准入条件、Cohort 定义、责任与状态模型、事件字典、VS-01 及 Pilot 许可门槛。

### Product Architecture

16. [16 — Product Architecture](./07_Product_Architecture/16_Product_Architecture.md)  
    冻结 Creator Commerce 的五层产品本体、Commerce Identity 与 Offering 的角色、对象关系、VS-01 架构子集与演化边界。

17. [17 — Core Product Objects](./07_Product_Architecture/17_Core_Product_Objects.md)  
    定义 Creator Commerce 的稳定产品对象、对象与状态/事件的边界、对象关系规则，以及 VS-01 的实现子集。

18. [18 — MVP Product Flow](./07_Product_Architecture/18_MVP_Product_Flow.md)  
    冻结 VS-01 的唯一端到端用户流、动作与状态转换、事件映射、边界路径，以及 Shadow Commerce 的停止线。

19. [19 — MVP Product Specification](./07_Product_Architecture/19_MVP_Product_Specification.md)  
    将 VS-01 冻结为 Creator、公开 Storefront 与 Request 结果的页面行为、状态感知 UI、规则、通知、异常处理及可验收条件。

20. [20 — MVP PRD: VS-01](./07_Product_Architecture/20_MVP_PRD_VS01.md)  
    将 17–19 收束为 VS-01 的冻结实现合同：范围、角色权限、功能要求、状态转换、事件、通知、验收标准与明确非目标。

- [29 — Identity 持有 C 号的产品决策](./07_Product_Architecture/29_Identity_Owned_Commerce_Reference_Decision.md)：一个 Identity 一个终身不变的 C 号，以及迁移和注册边界。
- [30 — C 号公开商业主页产品决策](./07_Product_Architecture/30_Public_Commerce_Homepage_Decision.md)：公开查询、稳定主页、资料选择、分享及发布控制的已确认方向与合同闭合事项。
- [31 — 按日期和时间切换公开商业主页](./07_Product_Architecture/31_Time_Scheduled_Public_Homepages_Decision.md)：一个 Identity 多主页版本、默认主页和同一时间唯一激活主页的产品决策。
- [32 — Creator 工作台与个人资料界面结构](./07_Product_Architecture/32_Creator_Workspace_Profile_Surface_Decision.md)：Creator 工作台、资料管理和公开主页管理的界面边界。
- [33 — 稳定分享工具界面](./07_Product_Architecture/33_Stable_Sharing_Tool_Surface_Decision.md)：稳定主页地址、二维码、复制和系统分享的产品界面决策。
- [34 — 受控能力目录与服务发布](./07_Product_Architecture/34_Controlled_Capability_Service_Publishing_Decision.md)：平台能力目录、服务模板、风险分级和发布审核门禁。

### Execution

21. [21 — Prototype Execution](./08_Execution/21_Prototype_Execution.md)  
    维护 VS-01 的构建状态、M1–M8 里程碑、`FR-001–FR-053` 可追溯矩阵、偏差协议、Blocker、验收测试和 Prototype 交接。

22. [22 — Commercialization Readiness Execution](./08_Execution/22_Commercialization_Readiness_Execution.md)
    记录 Reference Product → Real Product Foundation 的本地技术 Cutline 与 CR-01–CR-08 历史执行证据。

23. [23 — 2026-08-15 Handoff](./08_Execution/23_2026-08-15_Handoff.md)
    历史 VS-02A–VS-02D 交接记录；不替代当前 Project Control Baseline。

24. [24 — 项目开发任务总清单](./08_Execution/24_Development_Backlog.md)
    用简体中文汇总 M1–M9、VS-01 / VS-02、Stage 2、Private Self-Service、Stage 3–5、OV-001、Real Money 和工程治理任务；标注状态、依赖、验收和授权边界。本清单仍待 Founder / Main Control 接受。

### 工程治理

- [113 — C 号公开商业主页实施计划](./09_Engineering_Governance/113_Public_Commerce_Homepage_Implementation_Plan.md)：DEV-062 的实施门禁、分阶段交付、迁移与验收计划。
- [114 — 按日期和时间切换公开商业主页实施计划](./09_Engineering_Governance/114_Time_Scheduled_Public_Homepages_Implementation_Plan.md)：DEV-064 的版本、时间窗口、解析、迁移、接口和验收计划。

22. [22 — 工程治理](./09_Engineering_Governance/22_Engineering_Governance.md)  
    定义 Product Truth 到 Engineering Truth 的转换规则、业务模块边界、领域模型映射、状态机、Canonical Event、测试、偏差、配置、安全和外部依赖治理。

23. [23 — 技术架构决策](./09_Engineering_Governance/23_Technology_Architecture_Decision.md)  
    冻结跨端技术架构方向：产品形态暂不冻结，领域层与客户端解耦，应用服务/API 作为跨端契约，Web 仅作为首个 Reference Client。

24. [24 — 技术架构落地规划](./09_Engineering_Governance/24_Technology_Architecture_Implementation_Plan.md)  
    将跨端技术架构拆解为 Application Core、API、PostgreSQL、Auth、Reference Client 和 Acceptance Harness 的可执行 Change Unit 与工程门禁。

25. [25 — 用户界面语言治理](./09_Engineering_Governance/25_User_Facing_Language_Governance.md)  
    约束用户界面文案、错误与内部术语边界，并通过 Preflight 防止技术语言泄漏到 UI。

26. [26 — DS-01A 设计品味探索](./09_Engineering_Governance/26_DS01A_Design_Taste_Exploration.md)  
    记录跨端视觉方向探索：Creator-led、Commerce-clear、Calm confidence、Editorial warmth 与 Mobile-first。

27. [27 — DS-01B 跨端 Design Token 语义契约](./09_Engineering_Governance/27_DS01B_Cross_Platform_Design_Token_Contract.md)  
    冻结跨端视觉语义、初步 Token 命名、组件状态、Adapter 边界和最低可访问性约束，不冻结具体 Token 值或平台代码。

28. [28 — DS-01C Token Value 与 Accessibility Calibration](./09_Engineering_Governance/28_DS01C_Token_Value_and_Accessibility_Calibration.md)  
    冻结 Primitive Values、Semantic Values、可访问性基线和可机器读取的 Token Source of Truth，不进入客户端实现。

29. [31 — Commercialization Readiness Cutline](./09_Engineering_Governance/31_Commercialization_Readiness_Cutline.md)
    冻结 Reference Product → Real Product Foundation 的技术 Cutline。

30. [32 — Minimum Commercial Loop](./09_Engineering_Governance/32_Minimum_Commercial_Loop.md)
    冻结 First Completed Paid Commerce 的真实资金完成门槛；当前尚未完成。

31. [35 — VS-02 Paid Service PRD](./09_Engineering_Governance/35_VS02_Paid_Service_PRD.md)
    冻结 VS-02 Paid Service、Money、Earnings 与 Withdrawal 产品合同。

35A. [35A — Provider Qualification Dossier](./09_Engineering_Governance/35A_Provider_Qualification_Dossier.md)
维护 Provider 外部资格事实；微信支付候选仍为 `CONDITIONAL`。

36. [36 — Engineering Governance Delta](./09_Engineering_Governance/36_Engineering_Governance_Delta.md)
    冻结 VS-01 → VS-02 的工程治理增量与 Provider-neutral 边界。

37. [37 — VS-02B Provider Integration Readiness](./09_Engineering_Governance/37_VS02B_Provider_Integration_Readiness.md)
    冻结 Payment / Settlement / Withdrawal Port、Verified Provider Fact 与 Contract Harness。

38. [38 — VS-02C Provider Adapter Qualification](./09_Engineering_Governance/38_VS02C_Provider_Adapter_Qualification.md)
    记录微信支付 Adapter 的本地工程资格化；外部受控集成仍为 Conditional。

39. [39 — VS-02D Controlled Real Money Integration](./09_Engineering_Governance/39_VS02D_Controlled_Real_Money_Integration.md)
    冻结 Live Readiness 与 Go / No-Go；当前状态为 `Blocked / No-Go`。

39A. [39A — VS-02D Controlled Real-Money Activation Readiness](./09_Engineering_Governance/39A_VS02D_Controlled_Real_Money_Activation_Readiness.md)
冻结内部 Engineering Readiness、默认关闭的 Live Runtime Guard、Webhook 接收结构、Founder Activation Checklist 与 First Transaction Runbook；不授权真实资金。

43. [43 — VS-02G Official Provider Sandbox Integration](./09_Engineering_Governance/43_VS02G_Official_Provider_Sandbox_Integration.md)
44. [44 — VS-02H Commercial Pilot Operations Readiness](./09_Engineering_Governance/44_VS02H_Commercial_Pilot_Operations_Readiness.md)
45. [45 — VS-02I First Commerce Pilot Preparation](./09_Engineering_Governance/45_VS02I_First_Commerce_Pilot_Preparation.md)
46. [46 — VS-02J Founder Real-Money Activation Review](./09_Engineering_Governance/46_VS02J_Founder_Real_Money_Activation_Review.md)
47. [47 — VS-02K Real Creator Pilot / Non-Money](./09_Engineering_Governance/47_VS02K_Real_Creator_Pilot_Non_Money.md)
48. [48 — VS-02K-EXT-READY Controlled External Pilot Environment](./09_Engineering_Governance/48_VS02K_EXT_READY_Controlled_External_Pilot_Environment.md)
49. [49 — VS-02K-EXT-02 External Pilot Deployment Package](./09_Engineering_Governance/49_VS02K_EXT02_External_Pilot_Deployment_Package.md)
50. [50 — Creator Commerce Vertical Expansion Strategy](./02_Market/50_Creator_Commerce_Vertical_Expansion_Strategy.md)
    基于当前 Request Commerce 实现与冻结架构，重排下一阶段跨垂直切片；仅提供
    Founder 决策准备，不授权新 Pattern 或实际 Vertical Build。
51. [51 — VS-02L01 Cosplayer Convention Appearance Request](./09_Engineering_Governance/51_VS02L01_Cosplayer_Convention_Appearance_Request.md)
    使用既有 Request Commerce 验证 Convention Appearance 的跨垂直复用，不引入 Calendar、Ticketing 或垂直资金模型。
52. [52 — VS-02L02 Photographer Session Reservation Design](./09_Engineering_Governance/52_VS02L02_Photographer_Session_Reservation_Design.md)
    已由 `DEV-024` 的通用 Reservation Commerce 实现闭环替代；保留为决策与实施记录。
53. [53 — VS-02L03 Commercial Appearance Contract Design](./09_Engineering_Governance/53_VS02L03_Commercial_Appearance_Contract_Design.md)
    已由 `DEV-026` 的通用 Contract Commerce 实现闭环；Quote then Accept 复用既有 Money 和 Operations Core。
54. [54 — Commerce Infrastructure Convergence Review](./09_Engineering_Governance/54_Commerce_Infrastructure_Convergence_Review.md)
    收敛评审 Request、Reservation 与 Contract 三种 Pattern 的 Core / Money / Operations 复用；当前为 `Controller Review`。
55. [55 — Phase 5 Real Creator Pilot Execution](./09_Engineering_Governance/55_Phase5_Real_Creator_Pilot_Execution.md)
    冻结非真钱真实 Creator Pilot 的执行准备、数据隔离、证据、观察与支持边界；真实外部执行仍由 Founder 组织。
56. [56 — Phase 5 External Pilot Activation Gate](./09_Engineering_Governance/56_Phase5_External_Pilot_Activation_Gate.md)
    建立一次性、Founder-only、服务器端可审计的外部 Pilot 启动 Gate；不改变真钱开关，不自动启动 Pilot。
57. [57 — Client Surface Strategy](./09_Engineering_Governance/57_Client_Surface_Strategy.md)
    将 Web 收敛为 Pattern-first Commerce Client，并定义 Mobile Web 与未来 `apps/app` 边界；`apps/app` 按决策延期。
58. [58 — CLIENT-002 Commerce Golden Path Closure](./09_Engineering_Governance/58_CLIENT002_Commerce_Golden_Path_Closure.md)
    审计并验证 Request、Reservation、Contract 从 Customer Action 经 Creator Execution、Completion 到共享 Earnings / Wallet Projection 的 Web 闭环。
59. [22 — Project Handoff / Suspend Baseline](./08_Execution/22_Project_Handoff.md)
    当前唯一 Project Restart SSOT；记录 `SUSPENDED` 状态、CLIENT-002 基线、Identity Anchor 架构、Resume Gate 与新的 `RESUME-001`。
60. [59 — Identity Anchor and Commerce ID](./09_Engineering_Governance/59_Identity_Anchor_and_Commerce_ID.md)
    冻结 `Identity ≠ Commerce Profile ≠ Commerce ID ≠ External Platform Account`、多平台多账号、账号关系与 C号不可变/不可复用边界；不授权实现。
61. [25 — Project Control Baseline](./08_Execution/25_Project_Control_Baseline.md)
    当前项目治理入口；登记 `CONTROLLED_RECOVERY`、具名 bounded approvals、Capability Reality Matrix、权威层级和未解决工程债务。
62. [122 — Operations Identity Domain Contract](./09_Engineering_Governance/122_Operations_Identity_Domain_Contract.md)
    PCI-ENG-014 已采纳的 Operations Human/Machine 身份领域合同；只实现纯领域类型和校验，不包含认证、持久化或 Admin API。
63. [123 — Operations Identity Persistence Baseline](./09_Engineering_Governance/123_Operations_Identity_Persistence_Baseline.md)
    记录 PCI-ENG-015-B 的三张 Operations Principal 持久化表、Repository 边界、迁移与两轮真实 PostgreSQL 验证；不授权认证、Session、权限或 Admin API。
64. [126 — Operations Activation History Migration Runbook](./09_Engineering_Governance/126_Operations_Activation_History_Migration_Runbook.md)
    记录 PCI-ENG-017-C2-1-R2-REV1 的外部 DBA 临时 MAINTAIN 授权、EXCLUSIVE backfill barrier、权限回收与失败状态控制。

配套治理文档：

- [架构与目录治理](./09_Engineering_Governance/architecture-and-directory.md)
- [代码风格与命名治理](./09_Engineering_Governance/code-style-and-naming.md)
- [配置与密钥治理](./09_Engineering_Governance/configuration-and-secrets.md)
- [外部依赖与真实性治理](./09_Engineering_Governance/external-dependencies.md)

## 5. 统一术语

| 术语                                 | 当前定义                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------- |
| Creator                              | 能够凭借个人身份、技能、能力、影响力或受众产生商业价值的个人                    |
| Creator Commercial Identity          | 跨社交平台存在、由 Creator 自己经营的统一商业身份                               |
| Creator Storefront                   | 面向购买者展示 Creator 商品、档期和交易入口的商业货架                           |
| Creator Inventory                    | Creator 可被商品化和交易的时间、地点、能力、活动、内容与影响力供给              |
| Creator Commerce                     | 将 Creator 的商业资产组织成商品并完成交易的过程                                 |
| Creator OS                           | 管理个人商业身份、库存、商品、交易、客户和经营数据的产品系统                    |
| Personal Commerce Infrastructure     | 面向更广泛个人商业主体的长期基础设施终局                                        |
| Commerce Primitive                   | 跨 Creator 类型复用的基础商品与交易模型                                         |
| Creator Commerce Graph               | Creator、能力、地点、时间、商品、受众和交易形成的关系网络                       |
| Wedge                                | 能以最小成本产生首个交易并验证核心抽象的市场切入口                              |
| Decision                             | 当前执行必须遵守、并附带重新讨论触发条件的正式选择                              |
| Experiment                           | 用真实用户行为减少关键假设不确定性的结构化验证活动                              |
| Transaction Active Creator           | 在观察周期内拥有至少一笔已确认付费交易的 Creator                                |
| Revenue per Active Creator           | 每位交易活跃 Creator 在周期内为平台贡献的净收入                                 |
| Contribution Margin                  | 平台净收入扣除交易、支付、退款、支持、风险和可变基础设施成本后的贡献            |
| Creator Distributed                  | Creator 将 Storefront 或商品素材分享到至少一个真实外部渠道                      |
| CAC per Transaction Active Creator   | 获得一位至少产生一笔已确认付费交易 Creator 的全成本                             |
| Transaction Active Creator Retention | 首次产生付费交易的 Creator 在后续周期继续产生付费交易的比例                     |
| PMF                                  | 跨 Cohort、重复且可持续的用户行为与交易证据，而不是单一指标                     |
| Confirmed Commerce                   | Creator 已接受的商业动作，可能尚未完成付款                                      |
| Paid Transaction                     | 平台或可归因外部渠道确认收到付款的交易                                          |
| Shadow Commerce                      | 平台不收款；记录商业动作和 Creator 确认，并仅以证据记录外部付款的受控验证模式   |
| Vertical Slice                       | 从供给创建到购买者商业动作、结果确认和事件记录的一条端到端可运行路径            |
| Offering                             | Creator 基于能力提出、可被购买或请求的具体商业供给                              |
| Distribution Asset                   | 将 Commerce Identity 或 Offering 带到外部渠道的链接、二维码、卡片或其他传播对象 |

## 6. 文档使用原则

1. **战略先于功能**：先明确为什么做、管理什么、验证什么，再定义功能和技术。
2. **抽象先于垂直**：垂直领域用于验证，不作为底层产品边界。
3. **事实与假设分离**：未经真实用户和交易验证的判断必须保持为假设。
4. **当前与终局分离**：长期可能性不能冒充当前商业模式或 MVP 需求。
5. **交易闭环优先**：优先验证 Creator 是否发布供给，以及客户是否完成真实购买。
6. **避免超级 App 化**：任何新增能力都必须说明它服务于哪个核心假设。
7. **决策带触发条件**：Decision 在 Revisit Trigger 出现前不重复讨论。
8. **实验驱动新决策**：未被证明的产品判断进入 Experiment，并以 Result 更新 Decision。

## 7. 后续文档顺序

Execution Phase 的顺序为：

1. 20 MVP PRD VS-01（Frozen）
2. 22 工程治理检查
3. 21 Prototype Execution（Living）
4. 构建 VS-01 Controlled Prototype
5. 完成 PRD Acceptance Testing
6. Prototype Review
7. 填充 Cohort 0 城市、名单与 Owner
8. 运行 Cohort 0，并以真实行为做 Product Usability / Behavior Feedback

在 `15 MVP Build Readiness` 的 Real-money Controlled Pilot Ready 条件满足前，不应进入 Real-money Public Launch 或大规模系统开发。

## 工程治理

- `docs/09_Engineering_Governance/29_DS01D_Web_Reference_Design_System_Implementation.md` — DS-01D Web Reference Design System Implementation
- `docs/09_Engineering_Governance/40_VS02E_Local_Commercial_Simulation.md` — VS-02E Provider-neutral Local Commercial Simulation boundary, scenario vocabulary, simulation evidence and real-metrics isolation

## PCI-ENG-020-C3-E 文档权威登记入口

[Project Documentation Baseline and Freeze Register](./09_Engineering_Governance/PCI-ENG-020-C3-E-Project-Documentation-Baseline-and-Freeze-Register.md)
登记完整原文清单、批准依据、适用范围、局部替代、冲突及 SHA-256，当前待 Main Controller 审阅。
历史导航与状态保留；遇到歧义先按登记中的来源和范围核实，不由本索引扩权。

C3-D 已依据本次 C3-E 原指令 §2.1 正式接收并冻结为研究成果，原报告保持不变。
接受记录见 [Control Baseline §13](./08_Execution/25_Project_Control_Baseline.md#13-documentation-authority-reconciliation-and-c3-d-research-acceptance)。
这不是全球商业架构冻结或实施授权；GLOBAL COMMERCIAL SUPPLY DEFINITION
须待 Main Controller / Founder 确认文档基线后另行开始。

## FD-C4A-R1-01 当前概念决定与后续读取入口

Founder于2026-11-17冻结F01–F04概念基础。当前：
`C4-A = RESEARCH ACCEPTED / F01-F04 FROZEN / F05-F11 OPEN`。

- [独立Founder Decision Record](./07_Product_Architecture/36_Global_Commercial_Supply_Foundation_Decisions.md)
- [C4-A正式裁决Addendum](./09_Engineering_Governance/PCI-ENG-020-C4-A-Global-Commercial-Supply-Definition-Research-and-Founder-Decision-Package.md#founder-decision-addendum--fd-c4a-r1-01)
- [当前决策索引/Authority补充：Control §14](./08_Execution/25_Project_Control_Baseline.md#14-fd-c4a-r1-01--global-commercial-supply-foundation-decisions)
- [仓库同步执行与验证报告](./09_Engineering_Governance/PCI-ENG-020-C4-A-FD-R1-SYNC-Founder-Decision-Repository-Synchronization-Report.md)

C3-E/R1已获接受且原快照保持冻结；上文的待审阅/后续启动文字是历史记录。
读取冻结Register后，应同时读取Control §14及本FD，不回写旧Register或把本轮决定追溯为当时已批准。
C3-D继续作为冻结研究，VS-01合同不变，C4-A Model B仍非最终架构。
Implementation Authorization：NOT GRANTED。F05–F11未决，下一优先F05/F10须另行指令；本同步不自动开始研究。

## C5 D01–D04 当前批准与 D05–D09 决策准备入口

记录日期：2026-11-17。读取冻结 C3-E Register、Control §14 及 FD-C4A-R1-01 后，继续读取以下独立补充；不回写历史冻结快照或原 C5 报告。

- [D01–D04 Founder Decision 正式登记](./07_Product_Architecture/37_C5_D01_D04_Founder_Decisions.md)：共享商业事实＋六类领域表达、上下文参与者、专业模型＋共同协议、稳定引用＋有类型领域定义，完整方向均 FOUNDER APPROVED，仅概念原则。
- [Control25 §15 决策索引](./08_Execution/25_Project_Control_Baseline.md)：当前批准来源与范围，延续既有追加机制。
- [D05–D09 第二轮建议](./09_Engineering_Governance/PCI-ENG-020-C5-D05-D09-Second-Round-Founder-Decision-Preparation.md)：仅整理已验收 C5 材料，PROPOSED / AWAITING FOUNDER DECISION。
- [本次同步执行与验证报告](./09_Engineering_Governance/PCI-ENG-020-C5-D01-D04-Decision-Sync-and-Verification-Report.md)：文档变更、Git 与字节保护证据。

原研究中的未批准文字保留其提交时语境；本次不批准整份目标架构、TX-B/SYS-B、Owner Anchor 或共享可写实体。D10–D12 = DEFERRED；IMPLEMENTATION = NOT AUTHORIZED。VS-01、既有实现和其他冻结决定不变；没有 Commit / Push。

## C5 D05–D09 当前批准与 D10–D12 第三轮准备入口

记录日期：2026-11-17。读取冻结 Register、Control §14–§15 和前轮决定后，继续读取本补充。上文 D05–D09 PROPOSED / D10–D12 DEFERRED 保留为历史记录，当前状态由本次明确批准及 Control §16 补充，不回写原文。

- [D05–D09 Founder Decision 正式登记](./07_Product_Architecture/38_C5_D05_D09_Founder_Decisions.md)：五项完整方向 FOUNDER APPROVED，仅概念原则；明确排除可写 Envelope、TX-B 默认、TX-C 最终选型及具体实施。
- [D10–D12 第三轮 Founder 决策准备](./09_Engineering_Governance/PCI-ENG-020-C5-D10-D12-Third-Round-Founder-Decision-Preparation.md)：共享与领域权威、VS-01 兼容演进、最小概念实例及成败判据，均为 PROPOSED / AWAITING FOUNDER DECISION，推荐是 Main Controller 待审稿。
- [当前控制基线 §16](./08_Execution/25_Project_Control_Baseline.md#16-c5-d05d09--founder-approved-d10d12-preparation)：八列决策索引、历史状态解释及共同授权边界。
- [D05–D09 同步与核验报告](./09_Engineering_Governance/PCI-ENG-020-C5-D05-D09-Decision-Sync-and-Verification-Report.md)：本轮变更、原文件保护及 Git 结果；执行记录见 Execution21 本轮条目。

D01–D04 = FOUNDER APPROVED；D05–D09 = FOUNDER APPROVED；D10–D12 = PROPOSED / AWAITING FOUNDER DECISION；IMPLEMENTATION = NOT AUTHORIZED。
没有修改 VS-01 或启动业务代码、Schema、API、数据库迁移、原型或架构实施；没有 Commit / Push、Production、外部 Pilot 或真实资金活动授权。

## C5 D10–D12 正式批准与 D01–D12 概念决策闭合入口

记录日期：2026-11-17。本次指令明确 Founder 第三轮完整接受 Main Controller 推荐，无修改。先前准备材料及上文 PROPOSED / DEFERRED 记录保持历史语境；当前状态见以下追加文件，不回写冻结原文。

- [Decision39：D10–D12 正式登记与 D01–D12 统一索引](./07_Product_Architecture/39_C5_D10_D12_Founder_Decisions.md)：四类概念/权威边界、VS-01 兼容连续性、指定验证材料与九项判据；接受概念不执行验证。
- [Decision37：D01–D04](./07_Product_Architecture/37_C5_D01_D04_Founder_Decisions.md)、[Decision38：D05–D09](./07_Product_Architecture/38_C5_D05_D09_Founder_Decisions.md)：保持原始批准范围和排除项，不重写既有决定。
- [Control25 §17](./08_Execution/25_Project_Control_Baseline.md#17-c5-d10d12--founder-approved-conceptual-decision-registration-closed)：新增八列决策索引与当前授权边界。
- [Execution21](./08_Execution/21_Prototype_Execution.md)：本轮追加执行记录及保护范围。
- [D10–D12 同步与核验报告](./09_Engineering_Governance/PCI-ENG-020-C5-D10-D12-Decision-Sync-and-Verification-Report.md)：逐项裁决对照、只读验证、原文件 SHA-256 / 前缀保护及 Git 状态。
- [历史第三轮准备 §4.6](./09_Engineering_Governance/PCI-ENG-020-C5-D10-D12-Third-Round-Founder-Decision-Preparation.md)：已接受九项成败判据的完整原文，保留提交时状态，没有执行结果。

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

这里只闭合概念批准登记；未批准 Owner Anchor、SYS/TX 选型、Shared Core 写入结构、数据库/API/状态机/部署拓扑或工程实现，未自动裁决 C4-A F11。VS-01 产品和 Creator 安全边界不变。没有 Commit / Push。交付后停止，等待 Main Controller 审阅；任何静态验证或后续设计/实施须另行授权。

## Global Commercial System — Conceptual Model Consolidation 方向批准（仅同步）

记录日期：2026-11-17。Founder 已批准下一阶段概念综合方向、范围与预期交付；本轮仅仓库同步，没有即时研究执行授权，不回写历史冻结文档。

- [Decision40：Founder 方向批准与阶段 A / B 门槛](./07_Product_Architecture/40_Global_Commercial_System_Conceptual_Model_Consolidation_Founder_Approval.md)：七项未来范围和七项预期交付仅登记，不生成研究模型、映射矩阵或关系图。
- [Control25 §18](./08_Execution/25_Project_Control_Baseline.md#18-global-commercial-system--conceptual-model-consolidation-direction-approval-only)：当前方向批准、独立执行指令要求及非授权事项。
- [Execution21](./08_Execution/21_Prototype_Execution.md)：本轮纯文档同步记录。
- [同步与核验报告](./09_Engineering_Governance/PCI-ENG-020-Global-Conceptual-Model-Consolidation-Founder-Approval-Sync-and-Verification-Report.md)：Git 实际状态、文件 SHA-256 / 原前缀保护、链接及状态一致性结果。
- 既有概念原则：[Decision37](./07_Product_Architecture/37_C5_D01_D04_Founder_Decisions.md)、[Decision38](./07_Product_Architecture/38_C5_D05_D09_Founder_Decisions.md)、[Decision39](./07_Product_Architecture/39_C5_D10_D12_Founder_Decisions.md)，原文与批准边界保持。

阶段 A 同步交付后停止；阶段 B 研究须先经 Main Controller 明确接受本轮结果，再由独立任务授权。方向批准不是研究执行批准，主控接受本轮也不自动授权研究；D12 验证仍须另行授权。没有架构、数据库/API、VS-01、安全、资金或工程变更，没有 Commit / Push。

方向批准与执行授权分别登记：

```text
C5 D01–D12 = FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY
C5 CONCEPTUAL DECISION REGISTRATION = COMPLETE
GLOBAL CONCEPTUAL MODEL CONSOLIDATION = APPROVED DIRECTION
GLOBAL CONCEPTUAL MODEL CONSOLIDATION EXECUTION = AWAITING SEPARATE TASK AUTHORIZATION
D12 CONCEPTUAL VALIDATION EXECUTION = NOT AUTHORIZED
```

本轮交付与尚未开始的研究状态：

```text
FOUNDER APPROVAL SYNC = COMPLETED
MAIN CONTROLLER REVIEW = AWAITING
GLOBAL CONCEPTUAL MODEL CONSOLIDATION = NOT STARTED
CONCEPTUAL MODEL RESEARCH = NOT EXECUTED
ARCHITECTURE FINALIZATION = NOT AUTHORIZED
D12 VALIDATION = NOT AUTHORIZED
PROTOTYPE = NOT AUTHORIZED
IMPLEMENTATION = NOT AUTHORIZED
PILOT = NOT AUTHORIZED
PRODUCTION = NOT AUTHORIZED
REAL_MONEY_ENABLED = false
```

上述是方向、授权及文档执行状态，不是运行开关检测。交付后立即停止；必须等待 Main Controller 明确接受本轮同步结果并发出下一阶段独立指令，不能自动进入研究或任何后续设计/实施。


## Global Commercial System — Stage B 概念模型综合研究交付

记录日期：2026-11-17。当前独立主控任务已明确接受 Decision40 / Stage A，并另行授权 Stage B。本条追加当前状态；前文阶段 A 的 NOT STARTED 仍为历史记录，Decision36–40 与原研究不回写。

- [概念模型主文档及七项交付入口](./09_Engineering_Governance/PCI-ENG-020-Global-Conceptual-Model.md)
- [六类商业供给统一映射矩阵](./09_Engineering_Governance/PCI-ENG-020-Global-Conceptual-Six-Domain-Mapping.md)
- [核心概念关系图与过程](./09_Engineering_Governance/PCI-ENG-020-Global-Conceptual-Core-Relationships.md)
- [事实来源、专业权威图与责任矩阵](./09_Engineering_Governance/PCI-ENG-020-Global-Conceptual-Facts-Provenance-and-Authority.md)
- [D01–D12 一致性与概念缺口](./09_Engineering_Governance/PCI-ENG-020-Global-Conceptual-Consistency-and-Gaps.md)
- [未决问题登记](./09_Engineering_Governance/PCI-ENG-020-Global-Conceptual-Open-Questions.md)
- [后续 Founder 决策建议（全部待审、未批准）](./09_Engineering_Governance/PCI-ENG-020-Global-Conceptual-Founder-Recommendations.md)
- [研究来源及权威索引](./09_Engineering_Governance/PCI-ENG-020-Global-Conceptual-Source-Authority-Index.md)
- [研究执行与只读核验报告](./09_Engineering_Governance/PCI-ENG-020-Global-Conceptual-Research-and-Verification-Report.md)
- [Control25 §19 当前授权状态](./08_Execution/25_Project_Control_Baseline.md)与[Execution21 本轮登记](./08_Execution/21_Prototype_Execution.md)

以上新增综合成果为 RESEARCH PROPOSAL / AWAITING REVIEW，来源标签区分已有批准、研究、推论和未知，不是新的 Founder Decision 或工程合同。没有 D12 验证结果、架构方案或 VS-01/安全/资金变化，没有 Commit/Push。

```text
STAGE A = CLOSED
STAGE B = CONCEPTUAL RESEARCH COMPLETED
GLOBAL CONCEPTUAL MODEL = DELIVERED
C5 D01–D12 = FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY
D12 STATIC VALIDATION = NOT AUTHORIZED
ARCHITECTURE FINALIZATION = NOT AUTHORIZED
PROTOTYPE = NOT AUTHORIZED
IMPLEMENTATION = NOT AUTHORIZED
PILOT = NOT AUTHORIZED
PRODUCTION = NOT AUTHORIZED
REAL_MONEY_ENABLED = false
MAIN CONTROLLER REVIEW = AWAITING
FOUNDER DECISIONS = AWAITING WHERE REQUIRED
```

以上为授权和文档交付状态；交付后停止，等待 Main Controller 审阅。不得自动执行 D12、架构、原型或工程。

## PCI-DOC-002 — 正式全局商业系统概念基线与逻辑文档职责

记录日期：2026-11-18。Founder 已授权正式确立 [41 — Global Commercial System Conceptual Baseline](./07_Product_Architecture/41_Global_Commercial_System_Conceptual_Baseline.md)。这是 FOUNDER-APPROVED CONCEPTUAL BASELINE，适用范围为概念原则与系统级抽象，不是最终软件架构，也不是 Database / API / Runtime Authorization。

当前读取入口：先核对 [C3-E 权威基线与冻结登记](./09_Engineering_Governance/PCI-ENG-020-C3-E-Project-Documentation-Baseline-and-Freeze-Register.md)及后续具名批准，再通过 41 读取 F01–F04、D01–D12、已接受研究、现行领域合同与开放问题。41 是整合入口，不取代 [Decision36](./07_Product_Architecture/36_Global_Commercial_Supply_Foundation_Decisions.md)、[Decision37](./07_Product_Architecture/37_C5_D01_D04_Founder_Decisions.md)、[Decision38](./07_Product_Architecture/38_C5_D05_D09_Founder_Decisions.md)、[Decision39](./07_Product_Architecture/39_C5_D10_D12_Founder_Decisions.md)、[Decision40](./07_Product_Architecture/40_Global_Commercial_System_Conceptual_Model_Consolidation_Founder_Approval.md)或具体产品、安全契约。

上文各阶段的 NOT STARTED、PROPOSED、AWAITING REVIEW 保留为当时历史记录。依本次 PCI-DOC-002，Stage B 及其 R1/R2 为 **ACCEPTED RESEARCH / PRESERVED**；接收研究不批准所有细节、推论和建议，不回写原研究或历史状态。

### 六个逻辑文档职责领域

下表表达信息职责与引用关系，不是六套新物理目录，也不按存放目录自动判定权威。一个文件可承载多种职责，仍须逐项核对来源与批准范围。

| 逻辑职责 | 负责表达什么 | 现有入口及边界 |
| --- | --- | --- |
| Project Authority & Governance | Founder Decisions、批准状态、治理规则、阶段授权 | [C3-E 登记](./09_Engineering_Governance/PCI-ENG-020-C3-E-Project-Documentation-Baseline-and-Freeze-Register.md)、[Governance22](./09_Engineering_Governance/22_Engineering_Governance.md)、Decision36–40；[Control25](./08_Execution/25_Project_Control_Baseline.md)保留原记录，本次不修改 |
| Project Strategy & Business Direction | 项目存在目的、市场定位、商业方向、整体产品方向 | [Project Thesis](./01_Strategy/01_Project_Thesis.md)、[Vision and Endgame](./01_Strategy/02_Vision_and_Endgame.md)、[Product Direction](./01_Strategy/05_Personal_Commerce_Infrastructure_Product_Direction.md)；战略职责独立，不被全球概念、领域 PRD 或工程实现替代，历史表述仍按后续具名裁决的范围解释 |
| Global Commercial System | 六类商业供给、共享交易/商业事实基础、全局概念边界 | [正式概念基线41](./07_Product_Architecture/41_Global_Commercial_System_Conceptual_Baseline.md)；Service / Goods / Program / Membership / Project / Right 是供给分类，不是六个分析维度；共享基础与独立领域并存，不选定架构 |
| Domain Product Contracts | 具体领域产品契约、PRD、领域行为及边界 | [VS-01 PRD及正式修订](./07_Product_Architecture/20_MVP_PRD_VS01.md)为现有 Service 切片合同；[Decision34](./07_Product_Architecture/34_Controlled_Capability_Service_Publishing_Decision.md)、[Decision35](./07_Product_Architecture/35_Database_Managed_Capability_Service_Catalog_Decision.md)约束受控发布；未新增其他五类 PRD |
| Architecture & Engineering | 工程架构、身份/安全约束、技术契约、实现与验证规则 | [Governance22](./09_Engineering_Governance/22_Engineering_Governance.md)、[B1-V2安全实现及验证入口](./09_Engineering_Governance/PCI-ENG-020-B1-V2-Upstream-Logout-Revocation-Closure.md)、Decision39 D11；实现报告是证据，不自动成为全球架构决定，Proposed ADR 不自动升级 |
| Research, Execution Evidence & History | 研究、执行报告、验证证据、历史材料及退役资料 | [Stage B主模型](./09_Engineering_Governance/PCI-ENG-020-Global-Conceptual-Model.md)、[来源索引](./09_Engineering_Governance/PCI-ENG-020-Global-Conceptual-Source-Authority-Index.md)、[研究核验报告](./09_Engineering_Governance/PCI-ENG-020-Global-Conceptual-Research-and-Verification-Report.md)、[Execution21](./08_Execution/21_Prototype_Execution.md)；原位置和原历史记录保留，不把研究验收当作工程授权 |

Stage B 的[六类映射](./09_Engineering_Governance/PCI-ENG-020-Global-Conceptual-Six-Domain-Mapping.md)、[关系研究](./09_Engineering_Governance/PCI-ENG-020-Global-Conceptual-Core-Relationships.md)、[事实权威](./09_Engineering_Governance/PCI-ENG-020-Global-Conceptual-Facts-Provenance-and-Authority.md)、[一致性与缺口](./09_Engineering_Governance/PCI-ENG-020-Global-Conceptual-Consistency-and-Gaps.md)、[开放问题](./09_Engineering_Governance/PCI-ENG-020-Global-Conceptual-Open-Questions.md)和[Founder建议](./09_Engineering_Governance/PCI-ENG-020-Global-Conceptual-Founder-Recommendations.md)继续在原位置作为研究依据，不复制成另一套独立决定。

### 权威状态必须区分

| 状态 | 含义及使用规则 |
| --- | --- |
| FOUNDER APPROVED | 有具名 Founder 批准，只在原批准范围内有效；概念批准不等于架构或工程授权 |
| CURRENT CONTRACT | 当前适用的领域产品或工程合同及正式修订；不能把某个领域合同强推至全部六域 |
| ACCEPTED RESEARCH | 已被接受的研究输入，保留研究来源、推论、假设和未知；不是整体 Founder Decision |
| PROPOSED / UNAPPROVED | 候选、建议或未经批准的方案；不得当作已冻结契约或执行许可 |
| HISTORICAL | 历史记录仍有历史证明价值，不表示其中所有内容失效；读取当时范围和时间语境 |
| SUPERSEDED | 特定内容已被后续决定/契约替代，必须列明替代来源与范围；不得仅凭文档较旧判整份失效 |
| RETIRED | 有明确退役依据的产品、实现或材料状态；仍保留历史证据，不因退役删除记录 |
| UNKNOWN / NEEDS REVIEW | 来源、批准、适用范围或冲突尚不能确认；保留未知，不通过推测补成批准 |

HISTORICAL 与 SUPERSEDED 是不同状态。同一文件可同时是 Historical Record，仅其中明确部分 Superseded。例如 Decision37/38 对后续 D05–D12 的历史待决状态，按 Decision38/39 的具体批准范围更新当前解释；其原始正文和原项批准边界并未整体失效。早期广义 Capability / 全球必需关联的解释仅在 Decision36 F02/F03 明确范围内由后续概念原则替代，VS-01 受控 Capability / Template 合同并未取消。不得凭日期、文件名、目录或是否已提交判断权威。

### 当前边界、开放问题与物理文件保护

OQ-B06 保持 OPEN QUESTION；FR-01、FR-02、FR-04 保持 AWAITING FOUNDER DECISION。FR-03、FR-05 不新增独立 Founder Decision，相关分离与权威原则已有 F04/D10 等依据，具体未决细节仍开放，不视为整体获批或关闭。D12 Static Validation 仍 NOT AUTHORIZED。

现有 VS-01 的 Request / Creator Confirm / Decline、Fulfillment Code / QR / Fulfillment Confirmation、限定 Appearance、Capability / Template、历史 creatorId 与 C-number，以及 Creator BFF、HttpOnly opaque cookie、服务端 Session / Token、Refresh CAS、Origin / CSRF、上游登出撤销及 Operations 隔离契约完整保留。全球概念不得反向改写这些合同。

本次确立逻辑职责、权威入口和引用关系，不移动、重命名、删除或迁移历史文档，不要求统一物理目录。原路径、历史来源及证据链保持；除本任务允许追加的 README 外，其他已有受保护文件按 SHA-256 核对保持不变，README 保留原始字节前缀，新增41及追加后的README另记SHA-256。本轮完整文件保护与核验报告在仓库外提供，避免创建第三个仓库交付文件。

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

上述为文档和授权状态，不是运行开关检测。完成后停止；后续产品、架构、研究、代码审视或系统性重构须独立授权。

## PCI-DOC-003 — Founder 场景进入战略

[Decision 42 — FD-PCI-SCENARIO-SEQUENCING-001](./07_Product_Architecture/42_Commercial_Scenario_Sequencing_Founder_Decision.md) 是场景进入顺序的正式决定，状态为 **FOUNDER APPROVED / FROZEN**。见 [05 — Product Direction：Future Expansion Criteria](./01_Strategy/05_Personal_Commerce_Infrastructure_Product_Direction.md#20-future-expansion-criteria) 与 [Control25 决定登记](./08_Execution/25_Project_Control_Baseline.md#20-fd-pci-scenario-sequencing-001--commercial-scenario-sequencing)。概念及领域语义仍以 [Conceptual Baseline 41](./07_Product_Architecture/41_Global_Commercial_System_Conceptual_Baseline.md) 和相应产品合同为准。
