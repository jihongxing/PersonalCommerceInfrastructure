# PCI-ENG-020 — Global Commercial System Conceptual Model

> 日期：2026-11-17。Stage B：CONCEPTUAL RESEARCH COMPLETED；R1 主模型澄清完成 / AWAITING SECOND-ROUND REVIEW。
> 本文是概念综合研究输入，不是新的 Founder Decision、现行 PRD 或最终架构。
> R1 来源：Main Controller「Stage B R1 主模型定向澄清与文档核验任务」（附件 0a55b906-9f2b-4369-a421-8ea580d8fcee）；仅修订本文七项表达，不修改关联交付物或扩大既有批准。

## 1. 阅读方式、授权和交付物

Main Controller 本轮独立指令已接受 Decision40 / Stage A，授权 Stage B 七个工作包；不授权 D12 静态验证、架构或实施。本文将已批准原则组织成相互约束的整体解释，不把十二项决定的状态闭合误写为所有概念问题已解决。

来源简称 S01–S13、证据标签、历史冲突及读取次序见[来源与权威索引](PCI-ENG-020-Global-Conceptual-Source-Authority-Index.md)。其中 S04 为 F01–F04，S06/S07/S08 分别为 D01–D04/D05–D09/D10–D12；所有批准均在原限定范围内。本文新增的组织视角和细化定义明确标为推论或建议。

| 工作包 | 交付及定位 |
| --- | --- |
| WP-01 | [来源及权威索引](PCI-ENG-020-Global-Conceptual-Source-Authority-Index.md)：批准、冻结研究、合同、历史候选分离 |
| WP-02 | 本文：整体概念模型、输入/输出/边界、VS-01 容纳 |
| WP-03 | [六类统一映射矩阵](PCI-ENG-020-Global-Conceptual-Six-Domain-Mapping.md)：六列、十七项比较维度 |
| WP-04 | [核心关系图与商业过程](PCI-ENG-020-Global-Conceptual-Core-Relationships.md)：语义方向及确定/待定边界 |
| WP-05 | [事实来源与权威图/责任矩阵](PCI-ENG-020-Global-Conceptual-Facts-Provenance-and-Authority.md) |
| WP-06 | [一致性与缺口审查](PCI-ENG-020-Global-Conceptual-Consistency-and-Gaps.md)：文档推理，不执行 D12 |
| WP-07 | [未决问题登记](PCI-ENG-020-Global-Conceptual-Open-Questions.md)与[Founder 决策建议](PCI-ENG-020-Global-Conceptual-Founder-Recommendations.md) |
| 执行证据 | [研究与核验报告](PCI-ENG-020-Global-Conceptual-Research-and-Verification-Report.md)：范围、Git、哈希、链接、未执行项 |

## 2. 整体解释：六个分析维度，四种协作职责

**DIRECT INFERENCE（S04 F01–F04；S06 D01–D04；S07 D05–D09；S08 D10）**：PCI 的共同性在于对商业事实可识别、可关联、可追溯，并能保留产生这些事实的领域解释；共同性不要求六类供给有同一种购买、承诺或完成流程。

**RESEARCH PROPOSAL（基于同上原则及 S03 §7–§8、S05 §5–§10）**：以六个相互交叉的分析维度（Six Analytical Dimensions）组织整体，而不是建一个总生命周期：

1. **主体与上下文参与**：谁在什么范围、以什么角色参与；身份连续不替代权限和责任。
2. **来源与供给表达**：价值从何而来、由谁组织，以及面向客户如何持续定义 Offering。
3. **具体条件与责任成立**：接受的是哪个范围/版本、谁有效接受、成立什么责任或权益。
4. **领域履行与变化**：对哪项责任发生执行、授予、持续可用、验收或局部变化。
5. **资金事实与义务解释**：钱的实际变化、归属范围和追溯，与为何应收/何时可结算分开。
6. **评价证据与声誉表达**：谁能就什么经历评价、用何种尺度、如何形成有来源的 Reputation。

六个分析维度用于观察六类商业供给（Six Commercial Supply Types）：Service、Goods、Program、Membership、Project、Right；它们不是另一组供给类型，也不意味着系统必须有六个对应模块。

四种协作职责贯穿这六个分析维度：**Shared References** 使不同语境的对象和事实可被指向；**Shared Facts** 表达具有跨领域共同意义的事实，不仅限于关联索引或追溯信息；**Domain Facts** 保持专业成立/履行规则的权威；**Domain Projections** 基于有来源的事实进行表达（FOUNDER APPROVED：S07 D07、S08 D10）。它们不是四个部署模块或四个排他存储区。

**FOUNDER APPROVED（S07 D07、S08 D10）的分离原则**：External Source Facts 指外部来源产生的事实，例如支付服务提供方确认的资金变化；PCI Association / Traceability Facts 指 PCI 建立的商业关联、引用和追溯事实；Shared Facts 关注跨领域共同意义，包括 D07 的共享资金事实与账务追溯。**DIRECT INFERENCE**：来源出处、PCI 关联、领域解释和共同意义须分别说明；并非所有外部来源事实都自动是 Shared Facts，PCI 关联也不能替代原来源事实。这些是可交叉的观察维度，不是互斥数据库分类或独立存储区。

**DIRECT INFERENCE（S06 D01–D03，S08 D10）**：领域负责解释证据在其范围内意味着什么；Domain Projections 可以基于权威领域事实进行关联、汇总、查询和共同表达，但不能自行创造或改写领域成立、责任或履行事实。投影不是第二个可独立编辑的领域真相，也不具有全局裁决权；共享层不能包办全部成功判定，六个领域也不应各做一套互不相通的身份、资金及评价体系。

**RESEARCH PROPOSAL（对 D10 的表达细化；本轮 R1 保留此边界）**：投影表达应保留事实来源、来源版本、领域解释范围、已知/未知/延迟/冲突状态及自身表达用途；这不是已经冻结的共同协议字段义务，具体表达范围仍待审阅，不规定元数据或技术实现。

## 3. 来源、供给和商业表达

### 3.1 Commercial Supply、Offering、Product、Proposal

| 概念 | 解决的问题；概念输入 | 概念输出/关系 | 边界与依据 |
| --- | --- | --- | --- |
| Commercial Supply | 如何统称价值来源及其供给体系；输入为现实能力、资源、资产、权利和组织方式 | 分析供给如何形成，不必成为独立对象 | FOUNDER APPROVED：S04 F01；不是必须有生命周期的总供给实体 |
| Commercial Offering / Offering | 如何使一项面向市场的供给持续可识别、可定义和管理；输入为来源、内容、责任角色和领域表达 | 持续供给定义，可支持具体提议；全称/简称同义 | FOUNDER APPROVED：S04 F01；不是已成交、独立共享写实体或权属证明 |
| Product | 如何描述面向客户的价值产品化结果 | 可用产品语言解释 Offering 的价值；不因此增加重复对象 | FOUNDER APPROVED：S04 F01；Product 不等于 Goods |
| Proposal / Terms Version | 如何解释特定对象、范围、时点、条件下提出的具体提议 | 可被领域有效接受的内容/版本依据，与持续 Offering 区分 | FOUNDER APPROVED：S04 F01；是否独立持久化/版本实体未决定；具体接受形式 OPEN QUESTION |
| Historical Offer | 如何保留历史六类供给的上位称谓 | 只能按原语境解读，不回写为法律要约 | FOUNDER APPROVED：S04 F01；未来专用命名仍需另行决定 |

**DIRECT INFERENCE（S04 F01；S07 D05/D09）**：当前 Offering 的描述不能自动替代某次已经接受的条件；一次采购也不能只因共用 Offering 标识就共享全部责任。版本可追溯是一项语义要求，不决定快照、版本对象或存储方式。历史未记录的条件应保持 UNKNOWN，不能从现在页面补造。

### 3.2 Value Source 的不同视角

**FOUNDER APPROVED（S04 F02/F03）**：Value Source 是上位分析概念；Capability 为主体创造、组织或交付价值的能力；Resource 为活动中可部署、使用或受约束的输入；Asset 为可识别、可控制并承载价值的事物/成果；Right 为针对对象、行为和范围的权能或许可。这些是可重叠的语义视角，不是四种互斥供给类型或四张表。

**DIRECT INFERENCE（同上）**：研究供给时应分别问“能否组织/交付”“可用什么输入”“控制什么载体”“有权做什么”，而不能用一句“有 Capability”同时回答。全球不强制显式 Capability 关联，不免除实际履行能力、合法来源、资格或责任；各领域何时需要哪些依据仍是 OPEN QUESTION。VS-01 保留原发布门禁。

**FOUNDER APPROVED（S04 F03）**：上游 Right Authority、面向客户的 Right-type Offering/Proposal、有效形成的 Grant 是三个语义角色。Right 作为价值来源与 Right 作为商业供给不是重复分类；Grant 不自动转移资产所有权或证明完整权利链。

**OPEN QUESTION（S04 §7、S13）**：来源可否组合、可授权范围如何证明、来源变化如何影响存量责任、平台如何表述资格与责任，均不能由本轮补为既定制度。

## 4. 主体、角色和责任

**FOUNDER APPROVED（S06 D02，S04 F04）**：身份连续，但 Buyer、Provider、Payer、Recipient/Beneficiary、Performer 等角色由具体上下文确定。Commercial Provider、Offering Owner、Asset Owner/Rights Holder、Operator/Manager、Contracting Party、Performer、Grantor、Beneficiary 可以重合，也可以不同。

| 概念问题 | 输入/输出的解释 | 不允许的捷径 |
| --- | --- | --- |
| 谁参与？ | 身份或其他已有主体依据＋具体采购/履行范围 → 可解释的上下文角色 | 用全局 User.role 永久代表所有交易角色；视访客联系邮箱为认证身份 |
| 谁有权操作？ | 角色之外还需适用的授权依据；具体模型 UNKNOWN | 用 Buyer/Operator 名称、C-number 或登录事实证明处分/授予权限 |
| 谁对外负责？ | 供给说明、具体条款和领域有效机制 → 对应范围的责任解释 | 创建者＝Owner＝Provider＝Contracting Party＝Performer |
| 谁取得权益？ | 接受与授予条件 → 对应受益范围 | 付款者自动等于使用者/权利受益人 |

该表为 DIRECT INFERENCE（S04 F04、S06 D02、S08 D11）；没有决定各角色的数据库模型或合法代理规则。Identity 持 C-number、一个 Identity 可有多个 Profile 的具名规则保留；Profile 是商业表达语境，不自动持有所有供给权利，历史 creatorId 不能升级为全局 Owner ID（FOUNDER APPROVED：S04 F04、S11）。

## 5. 交易关联、有效接受和责任

### 5.1 “被购买”不是一个通用动作

**RESEARCH PROPOSAL（S05 §7.1；受 S07 D05/D06 约束）**：Transaction 在本模型中表达商业交换的关联与追溯语境；Transaction Association 表达参与者、供给来源、具体接受内容、领域记录及金额/范围依据之间的关联。它不是一次支付、数据库事务或必建总订单。

**FOUNDER APPROVED（S07 D05）**：一次采购可以关联多个权威领域交易记录；不要求每个领域创建同名 Order。**DIRECT INFERENCE**：共同关联解决“这些事实为何属于同一商业上下文”，领域规则解决“是否已经有效接受、成立什么责任”。仅建立关联不能让未成立的责任自动成立。

### 5.2 四个必须分离的语义

| 概念 | 输入 → 概念输出 | 为什么不能被另一个替代 | 证据性质 |
| --- | --- | --- | --- |
| Order | 在具体领域中确定或正在成立的采购事项 → 领域采购记录/工作语境（若该领域需要） | 不是一次责任、一次付款或全局强制实体 | 定义为 RESEARCH PROPOSAL：S05 §7.1；不强制同名对象为 FOUNDER APPROVED：S07 D05 |
| Commitment | 有效接受机制及其范围 → 责任或权益事实 | 不按订单行、SKU 或付款次数机械产生；可能有多个责任主体和独立变化 | FOUNDER APPROVED：S04 F01、S07 D06；具体成立机制 OPEN QUESTION |
| Fulfillment | 已成立责任、执行/交付/授予等证据及适用规则 → 特定范围履行事实/解释 | 实际执行、系统确认、受益人接受不当然同义；持续权益不等于一次 Done | 分离原则 FOUNDER APPROVED：S07 D06；细分为 RESEARCH PROPOSAL：S03 §7、S05 §7/§10 |
| Payment | 实际资金来源证据、金额与范围关联 → 可追溯资金事实 | 收到钱不能证明履行、交付质量或 Grant 成立；责任成立也不证明已收款 | FOUNDER APPROVED：S07 D07；不授权资金实现 |

**DIRECT INFERENCE（S07 D05–D07）**：意图、有效接受、责任成立、履行、资金变化不是一条必经且同步的链。付款可能在履行之前、之中或之后，也可能在某切片完全不适用；共同进度必须说明汇总的范围和来源，不能用 paid/confirmed/completed 覆盖全部关联事实。

**OPEN QUESTION**：接受权限、证据充分性、责任可分性、条件尚未满足时的语义、变更影响范围还没有六类共同的完整概念准则；本研究不创设一个新的全局 Acceptance 对象或状态。

**FOUNDER APPROVED（S04 F01/F03、S07 D06）**：Commitment 表达有效接受及其范围形成的责任或权益事实；Grant 表达 Right 领域符合相应领域条件后形成的授权事实。**OPEN QUESTION**：二者的概念关系尚未由 Founder 决定，不能认定 Grant 必然是 Commitment 子类型，也不能断言完全互不相关；不要求所有 Grant 经过统一 Commitment 生命周期，或让 Right 采用其他五类供给的责任/履行流程。现有 OQ-A02/A03/B01 仅涉及相关范围，尚未明确登记这一关系；是否补充登记留待 Main Controller 审阅，本轮不新增或关闭登记项。

## 6. 专业领域与共同协议

**FOUNDER APPROVED（S06 D01/D03/D04）**：Service、Goods、Program、Membership、Project、Right 保留专业表达，通过共同协议进入共享商业基础。**RESEARCH PROPOSAL（S03 §7、S05 §6）**：类型判断重点在对客户承诺的价值和责任方式，而非页面、文件格式、职业名称或收费周期。

| 领域 | 本模型的候选语义焦点 | 不能简化为 |
| --- | --- | --- |
| Service | 约定范围的活动、专业执行或结果责任 | 所有领域的万能模板 |
| Goods | 特定规格/数量/版本的标的交付与相应条件，可含数字内容 | 广义 Product 或一律物理库存 |
| Program | 有结构的活动/学习/参与安排及组织责任 | 单次 Service 或统一订单等于统一参与状态 |
| Membership | 持续身份/访问/参与权益及其期间条件 | 周期付款或一次永远未完成的 Service |
| Project | 定制范围、成果、验收与变更治理 | 多步骤 Service 或统一 Done |
| Right | 以某项权源为依据的有界授权提议及其可能形成的 Grant；权源有效性、证明程度和授权范围仍需按具体领域依据确认 | Asset 本身、资产所有权转让或已获平台权源认证 |

**DIRECT INFERENCE（S04 F02/F03）**：权源声称、可识别的权源依据、权源有效性是否确认、授权范围和 Grant 是否有效形成必须区分，不能默认全部成立。**OPEN QUESTION**：相应确认依据和证明程度、以及 §5.2 的 Grant 与 Commitment 关系仍未决定；保留 Right 专业语义，不由本轮重裁 F05/F10、批准 C4-B S2/P2，或建立权利链认证、平台担保及法律验证制度。

**FOUNDER APPROVED**：D03 的 Professional Domain Models + Common Protocol、D04 的 Shared Stable References + Typed Domain Definitions（S06），以及 D10 的来源、关联、领域解释与投影职责边界（S08），均按原范围有效。

**DIRECT INFERENCE（上述原则）**：共同协议不得破坏专业领域语义、稳定引用或事实权威边界，不能替领域定义库存、有效接受或履行。

**RESEARCH PROPOSAL**：共同协议未来是否应能表达类型、范围、来源、领域解释、未知、延迟和冲突，以及最低共同语义的完整范围，仍待审阅；这些具体表达要求不是已经由 Founder 冻结的协议义务。本节不设计字段、API、DTO、事件或技术消息结构，也不设置强制参与门禁。

Availability 是能否提供/接受的领域条件；Inventory 是数量/份额/范围约束的一种视角，Capacity 是交付能力约束，Calendar 是部分时间表达。四者不互等，也未冻结统一实现（RESEARCH PROPOSAL：S03 §8；S05 §6）。没有显式库存不等于无限可交付或无限合法授权。

完整对照见[六类矩阵](PCI-ENG-020-Global-Conceptual-Six-Domain-Mapping.md)。该矩阵不是六份已批准领域 PRD；类型互斥性和穷尽性仍 UNKNOWN。

## 7. 资金、评价与跨领域组合

### 7.1 资金事实不决定领域经济规则

**FOUNDER APPROVED（S07 D07）**：共享实际资金事实和账务追溯；领域负责应收/应付义务、触发依据和结算条件。同一真实资金事实不因被多个领域引用就重复入账；资金来源、分配、退款关联和纠错需要可追溯。

**DIRECT INFERENCE**：须区分“发生了什么资金变化”“将其关联到哪项责任/范围”“为何应收/应退/可结算”三个问题。关联金额不是再创造一笔真实到账；分配不证明拥有资金，退款依据不等于已经退款。金额和范围的解释可能跨域，冲突时不能靠共同汇总静默裁决。

**OPEN QUESTION**：多方或复合条款下金额分配冲突的概念解释责任还未完整定义。**ARCHITECTURE DEFERRED**：账本、账户、Account Holder、钱包、支付与结算实现。本文没有触发任何资金活动，也不将已有相邻 Paid Commerce 模块纳入全球标准。

### 7.2 评价不是全局评分

**FOUNDER APPROVED（S07 D08）**：Review、Rating、Reputation 保持区分；共享证据基础，领域决定资格、对象关系、维度、窗口、尺度；Reputation 是有来源证据和规则形成的投影。

**RESEARCH PROPOSAL（基于 S05 §9；按 R1 澄清）**：Review 表达评价内容及评价者对经历的陈述；Experience / Participation Evidence 表达支持评价资格、参与关系或评价对象关系的经历/参与依据；Rating 是在特定尺度下形成的量化表达；Reputation 是依据特定证据和规则形成的声誉表达。Experience / Participation Evidence 仅为分析性概念用语，不据此推导新的全局实体或数据模型。评价陈述、参与依据、量化尺度与声誉规则是不同输入，不能互相替代；表达输出不创设新的履行或资格事实。

**DIRECT INFERENCE（S07 D08）**：Review 本身不自动证明评价者真实参与了相应活动；评价资格、对象关系、维度、尺度和窗口仍由专业领域决定，不创建统一全局评价资格规则。Buyer、Payer、Recipient 可能不同，不能仅凭付款给所有角色同一评价资格；不可比尺度不应简单平均；缺失评价不能补为中立分或正面事实。UI 的 review 审查状态不是客户 Review。本轮不增加评价产品功能，公开、申诉、删除、审核、修订和处置机制均未授权，具体可见性/争议语义为 OPEN QUESTION。

### 7.3 组合由关联表达，不由总状态统治

**FOUNDER APPROVED（S07 D09）**：组合可涉及多个供给、Provider、Commitment。供给、提议、交易、履行、资金五个观察层次可以有不同边界；组成版本、责任和金额分配、局部变化需可追溯。

**DIRECT INFERENCE**：同页展示不证明共同接受；共同付款不证明共同责任；一部分失败不自动把其他既成事实写为失败，也不意味着其他部分必然不受影响。整体接受、取消和退款后果取决于具体条款与领域规则，不能全局设为“全有全无”或“完全独立”。

**RESEARCH PROPOSAL**：在概念分析中分别说明组成范围、接受范围、责任范围、履行范围、资金关联范围，再标注它们之间已知的依赖；缺少组合条款时保持依赖 UNKNOWN，不从 UI 或支付次数反推。没有据此创建 Bundle、组合 Order 或编排机制。

## 8. 来源、解释与共同表达

**FOUNDER APPROVED（S08 D10）**：来源签发的证据、PCI 建立的关联、领域对有效成立/履行的解释和共同展示不是同一事实。共享事实既不意味着 Shared Core 独占生产权，也不意味着共享职责只可读取而不可能产生关联事实。

**RESEARCH PROPOSAL（对 D10 的组织视角）**：以“来源出处”“解释范围”“投影用途”三个观察轴理解七类事实分类；它们不是七个互斥桶。External Source Facts、PCI Association / Traceability Facts 和 Shared Facts 的区别见 §2；外部出处不自动赋予跨领域共同意义。一个外部资金事实可被共享引用，被领域用于解释应收范围，又进入资金投影，但不会因这些用途变成多次到账。

**DIRECT INFERENCE（S08 D10）**：共同投影可进行有依据的关联、汇总、查询和表达，不能重新裁决领域成立、责任或履行，也不能将无证据的空白推成成功或失败。**RESEARCH PROPOSAL**：如 §2 所述，表达应保留来源/版本/领域解释范围、已知/未知/延迟/冲突及自身用途；这项表达细化不冒称 D10 已冻结具体协议义务。具体元数据和技术处理方式属于 ARCHITECTURE DEFERRED，不在此定义。详见[事实权威模型](PCI-ENG-020-Global-Conceptual-Facts-Provenance-and-Authority.md)；该文件本轮未改，待第二轮独立审阅，不据链接推定已同步 R1。

## 9. VS-01 的完整容纳

以下均为 CURRENT CONTRACT（S10）及 FOUNDER APPROVED（S08 D11、S11）的兼容说明，不是本轮改造计划。

| 现有事实/合同 | 在全球概念中的容纳 | 禁止追溯推导 |
| --- | --- | --- |
| Identity → Capability → Service Offering → Distribution → Customer Request → Creator Confirm/Decline | 既有 Service 切片，受控目录和发布条件继续有效 | 全球不强制 Capability 不等于取消 VS-01 门禁 |
| Request 联系信息与消息 | 客户意图及最小业务关系，可保留自身命名空间和证据 | 不补造全局 Buyer 账户、统一 Order、价格或法律 Commitment |
| Creator Confirm / Decline | 原 Request 决策事实；历史结果原义保留 | 不自动改为全局履行完成、收款或新的合同规则 |
| 新 Request 持久化提交时生成 FC 码；历史可没有 | 原关联对象/生成时机保留，Result 可在可读状态展示已有码 | 不将码改为 Confirm 后生成，不回填旧码或新状态 |
| 履约确认需同 Creator/Request、confirmed 状态、匹配未用未过期码；重复/并发冲突 | 领域确认工具事实，独立于 Creator 决策；确认后 Request 仍 confirmed | 不能证明真实服务质量、平台担保或通用 Goods/Right 履行 |
| QR 编码履约码 | 信息载体，不是新的接受或授权 | 扫码不是履行成功，C-number 不是认证 Token |
| 可选限定 Appearance | `template-commercial-appearance` / `capability-commercial-appearance` 的描述性上下文 | 活动日期不是排期/库存；买方类别不证明身份；自由定价说明不启用支付；不改 Request |
| Creator BFF / HttpOnly opaque cookie / 服务端 Session / Token 服务端处理 / CSRF+Origin / Refresh CAS / 上游注销撤销；Operations 独立 | 既有访问安全边界保持，全球角色讨论不触及运行机制 | 不绕过 BFF、不复用 Operations、不重解释 Session 身份 |

**DIRECT INFERENCE（D11）**：未来可以讨论有界渐进关联的概念方向，但没有旧资料的 Accepted Terms、Payer、资金、Review 等应保持未知或不适用；不得为了“全球模型完整”补造事实。当前模型能说明这些边界；本轮没有做 API、读视图、适配、迁移或重新安全验收。

## 10. 模型解释力、缺口与停止边界

本文解释了六类供给如何共享引用、上下文参与和追溯，又分别决定有效接受、责任、可用性和履行；资金/评价作为可关联的证据与领域解释，不是统一生命周期终点。该综合结论为 **RESEARCH PROPOSAL / AWAITING REVIEW**，不是模型经 D12 验证通过。

仍有影响概念充分性的缺口：有效接受及代理依据、角色责任范围、供给类型重叠的识别、组合依赖、来源权利和平台角色、冲突/未知证据表达、评价范围及纠错影响。详见[一致性审查](PCI-ENG-020-Global-Conceptual-Consistency-and-Gaps.md)及[未决登记](PCI-ENG-020-Global-Conceptual-Open-Questions.md)。未发现仅依据现有文字就必须推翻 D01–D12 的直接矛盾；这不证明全部现实业务均可表达，也不关闭 C4 F05–F11。

```text
STAGE A = CLOSED
STAGE B = CONCEPTUAL RESEARCH COMPLETED
GLOBAL CONCEPTUAL MODEL = DELIVERED
STAGE B R1 MAIN MODEL CLARIFICATION = COMPLETED
MAIN CONTROLLER REVIEW = AWAITING SECOND-ROUND REVIEW
D01–D12 = FOUNDER APPROVED — CONCEPTUAL PRINCIPLES ONLY
FR-01–FR-05 = NOT APPROVED
D12 STATIC VALIDATION = NOT AUTHORIZED
ARCHITECTURE FINALIZATION = NOT AUTHORIZED
PROTOTYPE = NOT AUTHORIZED
IMPLEMENTATION = NOT AUTHORIZED
PILOT = NOT AUTHORIZED
PRODUCTION = NOT AUTHORIZED
REAL_MONEY_ENABLED = false
FOUNDER DECISIONS = AWAITING WHERE REQUIRED
```

以上是授权和文档交付状态，不是运行配置观测。完成本轮后停止；不自动开始 D12、架构、原型或工程。
