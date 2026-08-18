# Personal Commerce Infrastructure 文档索引

> **CURRENT PROJECT STATUS**：SUSPENDED — DEVELOPMENT PAUSED
> **CURRENT BASELINE**：CLIENT-002 — Commerce Golden Path Closure = COMPLETE
> **RESTART SSOT**：[`docs/08_Execution/22_Project_Handoff.md`](./08_Execution/22_Project_Handoff.md)
> **ARCHITECTURAL DISCOVERY BEFORE SUSPENSION**：Identity Infrastructure is required
> **NEXT TASK**：RESUME-001 — Identity & External Platform Binding Foundation
> 最近执行更新：2026-08-18
> 文档性质：战略、商业选择与 MVP 产品定义；不是最终 PRD 或技术方案

```text
PROJECT_STATUS = SUSPENDED
CLIENT-002 = COMPLETE
REAL_MONEY_ENABLED = false
apps/app = DEFERRED
IDENTITY DIRECTION = Identity → Commerce Profile → Commerce ID → External Platform Account → Commerce Relationship
NEXT TASK = RESUME-001 — Identity & External Platform Binding Foundation
```

当前阶段索引：

```text
CLIENT-001 Web Client Convergence   Complete
CLIENT-002 Golden Path Closure      Complete
Project Development                Suspended
Real Money                         Disabled
Native App                         Deferred
Identity Infrastructure           Architecture direction frozen; not implemented
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
下一次恢复时，应优先建立平台无关的 Identity、Commerce Profile、Commerce ID / C号 与
External Platform Account / Commerce Relationship 边界；当前不实现 Identity API、OAuth 或平台绑定。

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

### Execution

21. [21 — Prototype Execution](./08_Execution/21_Prototype_Execution.md)  
    维护 VS-01 的构建状态、M1–M8 里程碑、`FR-001–FR-053` 可追溯矩阵、偏差协议、Blocker、验收测试和 Prototype 交接。

22. [22 — Commercialization Readiness Execution](./08_Execution/22_Commercialization_Readiness_Execution.md)
    记录 Reference Product → Real Product Foundation 的本地技术 Cutline 与 CR-01–CR-08 历史执行证据。

23. [23 — 2026-08-15 Handoff](./08_Execution/23_2026-08-15_Handoff.md)
    记录 VS-02A–VS-02D 交接，并由 2026-08-16 `EXEC-002` 更新补充当前验证基线。

### 工程治理

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
