# 09 — MVP Product Definition

> 状态：Decision v1  
> 决策日期：2026-08-11  
> 阶段：Product Definition Phase  
> 文档角色：把 MVP Wedge 转化为可验证、可定价、可获客、可开发的产品边界  
> 核心问题：第一版产品为谁提供什么价值，用户如何完成最小商业闭环？

## 1. Purpose

本文件定义 MVP 是什么，以及不是什么。

它负责冻结：

- MVP 的核心用户；
- Creator 与购买者两侧的最小价值；
- Creator 前 10 分钟的激活路径；
- 购买者的最小交易路径；
- Creator Commercial Identity 的构成；
- Upcoming、Event、Experience、Service 与 Inquiry 的产品边界；
- Product、Inventory、Availability 与 Transaction 的关系；
- 首版需要支持的商业动作；
- MVP Activation、成功条件和 Non-goals；
- 需要通过真实行为验证的 Experiment。

本文件不是 PRD，不定义：

- 完整字段；
- 页面线框；
- API；
- 数据库表；
- 技术架构；
- 支付服务商；
- 精确交互；
- 开发排期。

这些内容应在产品边界被真实样本校正后进入后续 PRD 和技术设计。

## 2. Product Statement

MVP 的产品定义是：

> 一个让舞者在 10 分钟左右建立并发布统一商业身份页的产品，使其能够集中表达“我是谁、我何时在哪里、我提供什么，以及如何购买、预约或联系我”，并通过自己的社交渠道获得第一批真实商业行为。

首版产品遵循：

```text
Commerce Identity-first
Creator-first
Fan-usable
Transaction-first
One Product
```

第一版核心价值不是帮助用户“完成资料”，而是：

> 让一个原本分散在简介、内容、私信和群聊中的商业供给，变成可访问、可理解、可行动的 Creator Storefront。

## 3. MVP Users

### 3.1 Primary User — Independent Dancer

首版主要服务拥有独立商业意图的舞者。

目标 Creator 具备部分特征：

- 拥有个人身份、作品或社交账号；
- 近期存在活动、课程、私教、体验或合作档期；
- 通过私信、微信、群聊或多个工具处理商业需求；
- 可以自行决定至少一种商品或商业合作；
- 愿意把商业页面分享给真实受众。

首版不要求 Creator：

- 是全职创作者；
- 拥有大量粉丝；
- 已成立公司；
- 拥有成熟商品体系；
- 能一次完成所有商品配置。

### 3.2 Secondary User — Fan / Customer

Fan / Customer 从 Creator 自有渠道进入 Storefront。

其最小需求是：

- 确认这是哪个 Creator；
- 了解近期发生什么；
- 看懂可以买或预约什么；
- 知道价格、时间、地点和基本规则；
- 采取明确商业动作；
- 获得提交或购买确认。

Fan / Customer 不是首版获客对象，产品也不为其提供平台级 Discovery。

### 3.3 Tertiary User — Business Buyer

品牌、活动方或其他商业客户可能访问同一 Creator 页面。

首版只需要允许其：

- 理解 Creator 的能力；
- 查看基础作品与商业方向；
- 提交 Performance 或 Content Inquiry。

首版不提供 B2B Marketplace、合同、复杂报价和结算。

### 3.4 Validation Cohorts

首版使用同一个产品验证：

- 舞者：主样本；
- Cosplayer：Fan Commerce 对照；
- 摄影师：Service Commerce 对照。

对照组不是独立产品，也不获得独立功能分支。

## 4. User Value

### 4.1 Creator Value

Creator 获得：

1. 一个独立于单一社交平台的商业身份；
2. 一个可以持续更新的统一商业入口；
3. 一种将行程、活动、体验、服务和合作能力结构化的方法；
4. 一个可直接分享给现有粉丝与客户的页面；
5. 一种减少重复说明、询问和排期沟通的机制；
6. 对首批预约、订单或询盘的基本可见性。

### 4.2 Fan / Customer Value

购买者获得：

1. 一个可信、集中、易理解的 Creator 商业页面；
2. 明确的 Upcoming 与可购买供给；
3. 清晰的价格、时间、地点、名额或预约方式；
4. 一个明确的商业动作；
5. 提交后的结果确认。

### 4.3 Business Value

商业客户获得：

1. Creator 的能力和作品概览；
2. 可合作方向；
3. 基础档期或服务区域；
4. 一个结构化 Inquiry 入口。

### 4.4 Platform Value

平台获得：

- 结构化 Creator Identity；
- 真实 Inventory；
- 真实 Product；
- 可归因的商业动作；
- Creator 与购买者的初始关系；
- 用于校正 Product Schema 和 Wedge 的行为数据。

## 5. Product Surfaces

MVP 只有四个核心产品表面。

### 5.1 Creator Setup

Creator 建立身份、添加能力、创建首个供给并发布页面。

目标：

> 从空白账户到 Creator Published。

### 5.2 Creator Storefront

面向 Fan、Customer 和 Business 的公开商业身份页。

目标：

> 让访客在短时间内理解 Creator、近期供给和可采取的商业动作。

### 5.3 Commerce Action

访客对某个 Product 或 Inquiry 采取行动。

可能是：

- 报名；
- 预订；
- 预约申请；
- 购买；
- 提交商务询盘；
- 受控外部跳转。

目标：

> 产生可归因的商业结果，而不只是链接点击。

### 5.4 Creator Operations

Creator 查看并处理最基本的结果。

目标：

- 知道谁采取了什么动作；
- 知道当前需要处理什么；
- 可以确认、拒绝或完成必要沟通；
- 可以更新或停止供给。

首版不是完整 Creator Dashboard 或 CRM。

## 6. Creator Commercial Identity

Creator Commercial Identity 是 MVP 的产品入口，也是所有商业供给的统一归属。

### 6.1 Identity

回答：

> 我是谁？

最小表达包括：

- 名称或商业名称；
- 头像或主要视觉；
- 简短 Bio；
- Creator 类型；
- 当前城市或主要活动区域；
- 外部社交链接。

### 6.2 Capabilities

回答：

> 我能提供什么？

例如舞者可能表达：

- 舞蹈教学；
- 私教；
- 编舞；
- 商业演出；
- 活动出席；
- 联合创作；
- 品牌内容。

Capability 是 Creator 的商业能力，不等于已经可购买的 Product。

### 6.3 Proof

回答：

> 为什么购买者可以相信我？

首版可以通过：

- 作品图片或视频；
- 外部内容链接；
- 简要履历；
- 已发生的活动；
- Creator 自己提供的证明。

首版不建设复杂认证、评价和信用体系。

### 6.4 Commerce Sections

公开页面优先展示：

```text
Creator
├── Upcoming
├── Available to Book
├── Experiences / Events
└── Business Inquiry
```

页面不是传统社交 Profile，也不是商品列表页，而是身份、库存和商业动作的组合。

## 7. Creator Activation Journey

### 7.1 Activation Goal

Creator Activation 不定义为：

- 注册完成；
- Profile Completed；
- 添加头像；
- 登录 Dashboard。

Activation 定义为：

> Creator Published：Creator 已经发布一个可以被真实访客访问，并包含至少一个有效商业动作的 Creator Storefront。

### 7.2 First 10 Minutes

候选首轮路径：

```text
1. 注册
   ↓
2. 创建 Creator Identity
   ↓
3. 选择或描述 Creator 类型
   ↓
4. 添加 1–3 项 Capability
   ↓
5. 创建第一个 Upcoming 或 Product
   ↓
6. 选择商业动作
   ↓
7. 预览 Storefront
   ↓
8. 发布
   ↓
9. 获得分享链接
   ↓
10. 分享到一个真实渠道
```

### 7.3 First Product Strategy

产品不要求 Creator 在首次使用时建立完整商业体系。

Creator 只需完成一种最接近当前行为的供给：

- 添加近期活动；
- 发布一次 Workshop；
- 发布 1v1 私教；
- 发布一个限量 Experience；
- 开放某段可预约时间；
- 添加商务合作 Inquiry。

首个供给必须具有明确商业动作，否则不能视为 Creator Published。

### 7.4 Assisted Activation

第一轮允许 Founder-led 或运营协助：

- 帮助 Creator 提取已有简介和活动信息；
- 协助选择 Primitive；
- 协助表达价格和规则；
- 协助完成首个页面；
- 记录 Creator 无法独立完成的步骤。

人工协助不是失败，但所有协助必须被记录，用于判断哪些步骤需要产品化。

### 7.5 Post-publish Prompt

Creator 发布后，产品的第一目标不是继续补充 Profile，而是：

> 分享并获得第一个商业结果。

因此发布后的主要动作应是：

- 复制链接；
- 分享到社交平台或群聊；
- 查看页面；
- 等待或处理首个商业动作。

## 8. Fan / Customer Minimum Journey

### 8.1 Entry

访客主要从以下位置进入：

- Creator 社交简介；
- 内容或评论区链接；
- 微信或群聊；
- 活动通知；
- Creator 直接发送；
- 二维码。

### 8.2 Minimum Path

```text
点击 Creator Link
    ↓
确认 Creator Identity
    ↓
看到 Upcoming / Product
    ↓
理解价格、时间、地点与规则
    ↓
选择商业动作
    ↓
提交必要信息
    ↓
支付 / 申请 / 外部跳转
    ↓
获得确认与下一步
```

### 8.3 Fan Experience Principles

1. 浏览页面不应强制注册；
2. 首屏优先回答“是谁、有什么、怎么买”；
3. 商业动作必须明确，不使用模糊“联系我”替代所有交易；
4. 仅在交易所必需时收集信息；
5. 提交后必须有明确状态；
6. 外部跳转必须可识别和可归因；
7. 购买者不需要理解平台的 Creator OS 战略。

### 8.4 Minimum Trust

首版需要提供最低信任信息：

- Creator Identity；
- Product 由谁提供；
- 价格或询价方式；
- 时间与地点；
- 基本履约说明；
- 取消或变更说明；
- 提交后如何联系或确认。

首版不提供平台担保、复杂评价、争议仲裁或完整消费者保障体系，除非平台直接处理支付。

## 9. Commerce Model

### 9.1 Creator Commerce 不是普通 SKU 电商

传统电商通常是：

```text
Product
→ Stock
→ Buy
```

Creator Commerce 更接近：

```text
Creator
+ Product
+ Time
+ Availability
+ Capacity
+ Location
+ Rules
→ Commercial Action
→ Transaction / Inquiry
```

Creator 商品通常受到以下资源约束：

### Time

Creator 需要亲自投入的时间。

例如：

- 一小时私教；
- 两小时约拍；
- 半天商演；
- 某个活动日期。

### Capacity

一个供给可以被多少人购买。

例如：

- Workshop 20 人；
- 合影 10 个名额；
- 活动 100 人；
- 私教同时只能服务 1 人。

### Availability

Creator 在什么条件下可以履约。

例如：

- 8 月 20 日可预约；
- 9 月在上海可接商演；
- 每周六下午开放私教；
- 需提前 7 天申请。

### Location

供给在哪里发生。

例如：

- 具体场地；
- 某个城市；
- Creator 工作室；
- 客户指定地点；
- 线上。

### Rules

购买或预约需要满足什么条件。

例如：

- 是否需要 Creator 确认；
- 最晚提前多久预约；
- 是否允许取消；
- 是否需要定金；
- 是否有年龄或参与限制。

### 9.2 核心关系

```text
Product
+ Inventory
+ Availability
→ Commercial Action
→ Transaction
```

其中：

- Product 描述购买者获得什么；
- Inventory 描述当前有多少可售供给；
- Availability 描述供给何时、何地、在什么条件下有效；
- Commercial Action 描述购买者下一步做什么；
- Transaction 记录双方对某次具体供给形成的商业关系。

### 9.3 首版抽象边界

MVP 需要在产品层表达这些概念，但不要求建立一个能够统一所有未来库存类型的通用 Commerce Engine。

首版目标是：

> 足够准确地表达 Tier 1 样本的真实供给，并发现未来统一模型所需的约束。

## 10. Commerce Primitive

### 10.1 Upcoming

#### 定义

Creator 即将发生、值得被受众知道的时间与地点信息。

#### 典型例子

- 即将参加的演出；
- 即将举办的 Workshop；
- 下一场漫展；
- 某城市的公开行程；
- 某日开放预约。

#### 是否是 Product

不一定。

Upcoming 可以：

- 关联一个 Event；
- 关联一个 Experience；
- 关联外部票务；
- 只作为公开出现信息；
- 引导到 Inquiry。

#### MVP 边界

Upcoming 至少应包含时间与主题，并能够配置一个明确的下一步。

没有商业动作的 Upcoming 可以被展示，但不能单独完成 Creator Activation。

### 10.2 Event

#### 定义

在确定时间和地点发生、面向多人、具有容量约束的活动。

#### 典型例子

- Workshop；
- 公开课；
- 粉丝见面；
- 小型演出；
- 线下分享；
- 集体活动。

#### 核心约束

- 时间；
- 地点；
- 容量；
- 价格或报名方式；
- 参与规则。

#### 商业动作

- 报名；
- 购买；
- 预留名额；
- 外部购票。

#### MVP 边界

首版不支持：

- 复杂座位；
- 多级票务渠道；
- 大型主办方；
- 复杂核销；
- 完整退款系统。

### 10.3 Experience

#### 定义

购买者与 Creator 本人发生一次特定、稀缺、被明确设计的互动。

#### 典型例子

- 1v1 交流；
- 合影；
- 签名；
- 限量见面；
- 共同拍摄；
- VIP 互动。

#### 核心约束

- Creator 时间；
- 名额；
- 时长；
- 地点；
- 参与边界；
- 是否需要确认。

#### 商业动作

- 预订；
- 申请；
- 支付定金或全款。

#### MVP 边界

Experience 必须提供明确的安全、隐私和行为说明。

首版不支持：

- 开放式陌生人社交；
- 未定义边界的“私人陪伴”；
- 平台无法合理控制的高风险线下互动。

### 10.4 Service

#### 定义

购买者购买 Creator 的能力、时间或明确服务结果。

#### 典型例子

- 舞蹈私教；
- 编舞指导；
- 摄影约拍；
- 妆造；
- 专业咨询；
- 其他技能服务。

#### 核心约束

- 服务内容；
- 时长或交付范围；
- 价格；
- 可预约时间；
- 地点；
- 确认规则；
- 基本改期和取消规则。

#### 商业动作

- 直接预约；
- 提交预约申请；
- 支付定金；
- 请求确认。

#### MVP 边界

首版优先支持一种简单 Booking 模式，不同时建设：

- 复杂排班；
- 多员工日历；
- 门店资源；
- 服务加项引擎；
- 套餐和储值；
- 完整排课系统。

### 10.5 Inquiry

#### 定义

用于尚不能标准化定价、档期或履约的商业需求。

#### 典型例子

- 商业演出；
- 品牌活动；
- 活动出席；
- 内容合作；
- 定制编舞；
- 复杂商业拍摄。

#### 核心约束

- 需求类型；
- 期望日期；
- 地点；
- 预算或价格范围；
- 联系信息；
- 基础需求描述。

#### 商业动作

- 提交结构化 Inquiry；
- 等待 Creator 确认或进一步沟通。

#### MVP 边界

Inquiry 不等于普通私信入口。它必须捕获足够信息，让 Creator 能判断需求是否值得处理。

首版不支持：

- 自动匹配；
- 多 Creator 比价；
- 合同；
- 托管支付；
- 里程碑交付；
- B2B Marketplace。

## 11. Primitive Boundaries

真实供给可能跨越多个 Primitive，首版使用购买者购买的核心价值和履约方式进行判断。

| 场景                       | Primitive        | 原因                               |
| -------------------------- | ---------------- | ---------------------------------- |
| 20 人舞蹈 Workshop         | Event            | 多人、固定时间、容量               |
| 60 分钟 1v1 舞蹈私教       | Service          | 购买能力和时间                     |
| 漫展限定合影               | Experience       | 购买与 Creator 的稀缺互动          |
| 某商场邀请舞者演出         | Inquiry          | 需求和价格尚未标准化               |
| Creator 公布下周在上海     | Upcoming         | 时间地点信息，可能尚无商品         |
| 公开演出页面跳转第三方票务 | Upcoming + Event | 平台承接身份与信息，交易在外部完成 |

### Decision Rule

当一个供给难以分类时，依次判断：

1. 购买者主要在买参加资格吗？是则为 Event；
2. 购买者主要在买与 Creator 本人的稀缺互动吗？是则为 Experience；
3. 购买者主要在买技能、时间或服务结果吗？是则为 Service；
4. 条件和价格是否需要先沟通？是则为 Inquiry；
5. 是否只有时间地点信息？是则为 Upcoming。

## 12. Creator-defined Product

### 12.1 Decision

Creator 自己决定：

- 卖什么；
- 如何命名；
- 如何描述价值；
- 价格或价格范围；
- 可用时间和容量；
- 购买规则；
- 是否需要确认。

平台提供：

- Primitive；
- 示例；
- 建议模板；
- 必填商业约束；
- 安全与合规边界；
- 商业动作选项。

### 12.2 Why

这样可以：

- 避免按职业写死商品；
- 允许一个舞者拥有多个商业模型；
- 让相同 Primitive 迁移到其他 Creator；
- 保留未来 AI 推荐空间；
- 观察 Creator 实际如何定义自己的商品。

### 12.3 MVP Constraint

Creator 自定义不等于完全自由表单。

首版必须结构化：

- Primitive；
- 价格方式；
- 时间或可用性；
- 容量；
- 地点；
- 商业动作；
- 确认与取消规则。

平台可以提供舞者、Cosplayer 和摄影师的示例模板，但模板不能形成独立数据模型。

## 13. Commercial Action

### 13.1 Action Types

首版允许的候选商业动作：

| Action            | 适用场景                | 是否形成订单   |
| ----------------- | ----------------------- | -------------- |
| Register          | 免费或待支付 Event 报名 | 可以           |
| Reserve           | Experience 名额预留     | 可以           |
| Request Booking   | Service 预约申请        | 可以           |
| Buy / Pay         | 可直接购买的供给        | 可以           |
| Submit Inquiry    | 非标准商务需求          | 不一定         |
| External Checkout | 第三方票务或支付        | 平台仅记录归因 |

### 13.2 Transaction-first 的含义

Transaction-first 不等于所有动作首版都必须：

- 平台内支付；
- 平台抽佣；
- 自动确认；
- 自动履约。

它意味着：

> 产品必须围绕产生和记录商业结果设计，而不是只优化页面展示。

### 13.3 Minimum Result States

产品定义层先冻结最小状态语义：

```text
Submitted
→ Pending Creator Action
→ Confirmed / Declined
→ Completed / Cancelled
```

支付相关状态、退款状态和不同 Primitive 的详细状态由 PRD 决定。

### 13.4 External Transaction

若首版使用第三方支付或票务：

- Creator Storefront 仍然展示供给；
- 外部跳转必须关联具体 Product；
- 平台应记录跳转；
- Creator 应能反馈或同步结果；
- 外部交易不能被等同于已完成订单；
- 实验需要区分点击、意向和真实成交。

## 14. Creator Operations

Creator Operations 只解决最小经营需求。

### 14.1 Creator 需要看到

- 已发布的 Upcoming 和 Product；
- 当前是否可售；
- 新的报名、预约、订单或 Inquiry；
- 每项商业动作的当前状态；
- 购买者提供的必要信息；
- 需要 Creator 处理的事项。

### 14.2 Creator 需要能够

- 发布、编辑、暂停或结束供给；
- 确认或拒绝需要人工确认的请求；
- 查看必要联系信息；
- 标记完成或取消；
- 获得分享链接。

### 14.3 首版不需要

- 高级 Analytics；
- 自动营销；
- 标签和分群；
- 销售漏斗；
- 批量消息；
- 完整财务报表；
- 多成员权限；
- 自动化工作流。

基础 Analytics 仅用于回答：

- 页面是否被访问；
- 哪个 Product 被点击；
- 是否产生商业动作；
- 哪类供给产生结果。

## 15. Minimum Value Loops

### 15.1 Creator Loop

```text
Create Identity
→ Publish Product
→ Share
→ Receive Commercial Action
→ Handle Result
→ Update / Publish Again
```

若 Creator 只完成创建和分享，没有收到或处理任何商业结果，则产品价值闭环尚未成立。

### 15.2 Fan / Customer Loop

```text
Open Creator Link
→ Understand Offer
→ Take Action
→ Receive Confirmation
→ Attend / Receive Service
```

首版至少需要验证到 Confirmation；实际 Fulfillment 可以有人工步骤，但必须被观察和记录。

### 15.3 Platform Learning Loop

```text
Observe Product Creation
→ Observe Conversion
→ Observe Fulfillment Friction
→ Refine Primitive / Rules
→ New Product Decision
```

这构成：

```text
Observation
→ Hypothesis
→ Decision
→ MVP
→ Experiment
→ Result
→ New Decision
```

## 16. MVP Scope

### 16.1 Must Exist

#### Creator Side

- 注册或最小身份进入；
- Creator Identity；
- Bio 和社交链接；
- Capability；
- 首个 Upcoming 或 Product 创建；
- Event、Experience、Service、Inquiry 的必要表达；
- 发布与分享；
- 最小商业结果列表；
- 处理需要确认的请求。

#### Public Storefront

- Creator Identity；
- Capability 与基础 Proof；
- Upcoming；
- 可预约或可购买供给；
- Business Inquiry；
- 清晰商业动作；
- 最低履约和规则信息。

#### Buyer Side

- 无需注册即可浏览；
- 选择 Product；
- 提交最少必要信息；
- 完成一种商业动作；
- 查看提交结果和下一步。

#### Platform Learning

- Creator Published；
- Storefront 访问；
- Product 点击；
- 商业动作；
- 状态变化；
- 外部跳转；
- 基础来源归因。

### 16.2 Can Be Manual

- Creator onboarding；
- 商品分类建议；
- 页面内容整理；
- 预约确认；
- 支付结果同步；
- 履约提醒；
- 取消和异常处理；
- Inquiry 跟进；
- Creator 反馈收集。

手工流程必须有明确记录，不能成为不可见的运营黑箱。

### 16.3 Deferred

- 完整支付与退款；
- 自动日历同步；
- 复杂库存；
- 多票种；
- 多服务人员；
- 自动合同；
- Creator Verification；
- 评论和评分；
- 复杂通知系统；
- 高级 Analytics；
- CRM；
- Membership；
- Merchandise；
- Marketplace；
- Discovery。

## 17. Activation and Core Metrics

### 17.1 Creator Published

Creator Published 必须同时满足：

1. Creator Commercial Identity 可公开访问；
2. 至少存在一个有效 Upcoming 或 Product；
3. 至少存在一个明确商业动作；
4. 页面已发布；
5. Creator 获得可分享链接。

### 17.2 Creator Distributed

Creator 将页面分享至至少一个真实渠道。

这是 Creator Published 之后的第二个关键事件。

### 17.3 Commerce Activated

Creator 获得至少一个可归因的：

- 报名；
- 预订；
- 预约申请；
- 订单；
- 有效 Inquiry。

页面访问或按钮点击不构成 Commerce Activated。

### 17.4 Transaction Confirmed

至少一个商业动作被 Creator 接受，或完成真实付款。

### 17.5 Fulfillment Observed

至少一个已确认交易进入实际活动、体验或服务履约。

### 17.6 Repeat Supply

Creator 在首个商业结果后：

- 更新原有供给；
- 发布第二个 Product；
- 发布第二个档期；
- 再次分享。

Repeat Supply 是 Creator 留存的早期信号。

## 18. MVP Non-goals

MVP 明确不做：

### Demand and Social

- Creator Discovery；
- Creator Marketplace；
- Fan Marketplace；
- Social Feed；
- Follow Graph；
- 推荐算法；
- 社区；
- Creator 排行榜。

### Commerce Expansion

- Membership；
- Merchandise；
- 完整 Performance Marketplace；
- 完整 Content Marketplace；
- B2B Matching；
- 复杂票务；
- 门店和多员工预约；
- 动态定价；
- 优惠券与营销引擎；
- 储值、套餐和积分。

### Creator OS Expansion

- 复杂 CRM；
- 自动营销；
- 完整财务系统；
- 团队协作；
- 多角色权限；
- Creator Financing；
- 保险和信用；
- 供应链。

### Technology Expansion

- AI Creator Agent；
- AI 自动商品化；
- AI 定价；
- AI 推荐；
- 通用 Workflow Builder；
- 面向第三方的开放平台。

### Vertical Expansion

- 为舞者、Cosplayer 和摄影师分别开发独立应用；
- 为每个职业建立独立 Schema；
- 首版服务所有 Creator；
- 为高监管职业提供交易。

## 19. Experiment Candidates

从本文件开始增加 `Experiment` 状态。Experiment 必须产生可观察行为，并在完成后写入 Result。

### E-09-01 — Creator Publish

**Hypothesis**：在协助或模板支持下，目标 Creator 能在 15 分钟内发布一个包含有效商业动作的 Storefront。  
**Method**：观察 14–22 位首批 Creator 完成首次创建。  
**Primary Signal**：Creator Published Rate、Median Time to Publish。  
**Decision Use**：决定 onboarding 是否足够简单，以及哪些步骤必须简化或人工化。

### E-09-02 — Creator Distribution

**Hypothesis**：Creator 愿意把 Storefront 分享到至少一个真实社交渠道。  
**Method**：发布后立即要求 Creator 选择并实际分享一个渠道。  
**Primary Signal**：Creator Distributed Rate。  
**Decision Use**：验证 Creator-first GTM 是否成立。

### E-09-03 — First Commerce Primitive

**Hypothesis**：Upcoming + 一个明确商业动作，比纯商业主页更容易驱动首个结果。  
**Method**：比较只展示 Identity 的页面与包含真实 Upcoming / Product 的页面。  
**Primary Signal**：Commercial Action Rate。  
**Decision Use**：确认 Calendar 在激活和转化中的正确位置。

### E-09-04 — Event vs Experience vs Service

**Hypothesis**：首个商业结果会集中在少量 Primitive，而不是平均分布。  
**Method**：记录各 Primitive 的发布率、访问率、商业动作率和确认率。  
**Primary Signal**：Commerce Activated / Published Product。  
**Decision Use**：决定正式 MVP 首版优先实现哪个交易流程。

### E-09-05 — Price Disclosure

**Hypothesis**：明确价格或价格范围能够减少重复沟通并提高有效转化。  
**Method**：观察 Creator 公开固定价格、起价和仅 Inquiry 三种模式。  
**Primary Signal**：Creator Adoption、Qualified Action Rate、Creator Follow-up Time。  
**Decision Use**：决定首版价格模型。

### E-09-06 — Booking Mode

**Hypothesis**：预约申请比精确实时日历更适合第一版舞者服务。  
**Method**：比较日期申请与具体时间槽选择的创建和确认成本。  
**Primary Signal**：Publish Completion、Booking Confirmation Time、Reschedule Rate。  
**Decision Use**：决定 Calendar / Availability 的 MVP 深度。

### E-09-07 — Accountless Buyer

**Hypothesis**：购买者无需先注册即可提高商业动作完成率。  
**Method**：使用无需账户的最小信息提交路径。  
**Primary Signal**：Start-to-submit Conversion、Invalid Submission Rate。  
**Decision Use**：决定 Buyer Account 是否进入首版。

### E-09-08 — External vs Internal Transaction

**Hypothesis**：受控外部跳转可以更快验证需求，但会降低交易归因和 Creator 运营价值。  
**Method**：选择部分 Event 使用外部票务，部分 Service 使用平台内申请。  
**Primary Signal**：Click-to-confirm Gap、Creator Reporting Burden。  
**Decision Use**：决定平台内支付与订单能力的优先级。

### E-09-09 — Cross-archetype Portability

**Hypothesis**：Cosplayer 和摄影师可以使用相同 Primitive，而无需独立产品模型。  
**Method**：使用相同创建流程建立对照组 Storefront。  
**Primary Signal**：Schema Coverage、Required Exceptions、Time to Publish。  
**Decision Use**：确认统一产品策略。

### E-09-10 — Repeat Supply

**Hypothesis**：获得首个商业结果后，Creator 会更新或创建第二项供给。  
**Method**：观察首个结果后 14 天内的 Creator 行为。  
**Primary Signal**：Repeat Supply Rate。  
**Decision Use**：判断产品是一次性链接页还是持续经营工具。

## 20. Experiment Status Model

Experiment 使用以下状态：

```text
Proposed
→ Ready
→ Running
→ Result Recorded
→ Decision Applied
```

每个 Experiment 至少记录：

- Hypothesis；
- Method；
- Cohort；
- Primary Signal；
- Guardrail；
- Result；
- Decision Impact；
- Date。

Experiment 的目标不是证明团队正确，而是减少关键决策的不确定性。

## 21. Decision Record

### D-09-01 — MVP Product

**Decision**：MVP 是 Creator Commercial Identity + Structured Commerce，不是 Profile、Calendar 或 Booking 的单点工具。  
**Reason**：只有统一身份下的可行动供给才能验证 Creator Commerce。  
**Revisit Trigger**：真实用户只采用单点能力，统一 Storefront 显著降低激活或转化。

### D-09-02 — Product Surfaces

**Decision**：首版只有 Creator Setup、Creator Storefront、Commerce Action 和 Creator Operations 四个核心表面。  
**Reason**：四者构成从供给创建到商业结果的最小闭环。  
**Revisit Trigger**：完成交易必须引入新的独立核心表面。

### D-09-03 — Activation

**Decision**：核心 Activation 是 Creator Published，不是注册或 Profile Completed。  
**Reason**：MVP 必须产生可访问、可行动的商业身份。  
**Revisit Trigger**：发布行为无法预测 Creator 分享或商业激活。

### D-09-04 — Buyer Access

**Decision**：浏览 Storefront 不要求注册；Buyer 只在商业动作所需时提供最少信息。  
**Reason**：流量来自 Creator 自有渠道，应减少首次交易摩擦。  
**Revisit Trigger**：欺诈、垃圾提交、合规或履约要求使账户成为必要条件。

### D-09-05 — Commerce Primitive

**Decision**：MVP 产品层冻结 Upcoming、Event、Experience、Service 和 Inquiry 五个 Primitive。  
**Reason**：它们覆盖主样本和两个对照组的首批商业场景。  
**Revisit Trigger**：超过 20% 的真实商品无法自然表达，或 Primitive 边界持续造成创建错误。

### D-09-06 — First Transaction Scope

**Decision**：Event、Experience 和 Service 可以产生订单或预约；Performance 和 Content 首版通过 Inquiry 表达。  
**Reason**：避免过早建设合同、复杂报价和交付系统。  
**Revisit Trigger**：主样本的主要收入来自 Performance / Content，且 Inquiry 明显阻断成交。

### D-09-07 — Inventory Model

**Decision**：所有可交易供给必须显式表达 Time、Capacity、Availability、Location 和 Rules 中适用的约束。  
**Reason**：Creator Commerce 不能被简化为无库存约束的普通 SKU。  
**Revisit Trigger**：某类高价值供给无法由这些约束合理表达。

### D-09-08 — Product Creation

**Decision**：Creator 自定义商品，平台以 Primitive 和模板约束创建。  
**Reason**：保持跨垂直能力并观察真实商品结构。  
**Revisit Trigger**：自由度导致 Activation 显著下降，且标准商品库能明显改善结果。

### D-09-09 — Operations Scope

**Decision**：Creator Operations 只支持查看供给、查看商业动作、确认或拒绝、更新状态和分享。  
**Reason**：高级 CRM 和经营系统不是首个交易的必要条件。  
**Revisit Trigger**：Creator 无法完成确认和履约，导致商业动作大量流失。

### D-09-10 — Learning Instrumentation

**Decision**：首版必须记录从 Creator Published 到 Fulfillment Observed 的关键事件。  
**Reason**：产品的首要产出之一是将假设转化为行为证据。  
**Revisit Trigger**：某些事件无法可靠记录，需要调整指标或实验方式。

## 22. Assumptions

当前仍未被证明：

1. 舞者愿意建立并持续维护商业身份；
2. Creator 能够理解五个 Primitive；
3. Creator 愿意公开价格或价格范围；
4. Upcoming 能够提高分享和转化；
5. 预约申请比实时日历更适合首版；
6. 无账户 Buyer 流程不会产生不可控垃圾信息；
7. 外部跳转能够提供足够需求验证；
8. 一个统一创建流程能覆盖三个 Creator Archetype；
9. 首个商业结果会推动 Repeat Supply；
10. Creator Storefront 比现有简介、私信和链接页产生明显增量价值。

这些内容必须进入 Experiment，不应继续通过讨论假装已经确定。

## 23. Open Questions for PRD

以下问题由 Experiment、Business Model 和 GTM 输入共同决定：

1. 首版是否内建支付；
2. 是否使用定金；
3. Event 是直接购买还是报名申请；
4. Service 使用日期申请还是时间槽；
5. Experience 是否必须人工确认；
6. Upcoming 与 Product 的创建关系；
7. 每位 Creator 首版允许发布多少项供给；
8. Buyer 需要提供哪些最少信息；
9. 通知使用站内、邮件、短信还是其他渠道；
10. 外部交易如何回填结果；
11. 取消和退款由谁处理；
12. Creator 页面公开 URL 与身份名称规则；
13. 内容和图片的最低要求；
14. 哪些安全边界必须由产品强制；
15. 基础 Analytics 对 Creator 展示到什么程度。

## 24. Frozen MVP Definition

> MVP 服务以舞者为主的独立 Creator，让其通过 Creator Setup 在约 10 分钟内建立并发布 Creator Storefront。页面统一表达 Identity、Capabilities、Upcoming、Event、Experience、Service 与 Business Inquiry，并通过 Creator 自有渠道触达 Fan、Customer 和 Business。

> 购买者无需依赖平台 Discovery，也无需为浏览先注册。他们可以理解 Creator 当前的可售供给，完成报名、预订、预约申请、购买、结构化询盘或受控外部跳转，并获得明确结果。

> 产品以 Creator Published 为 Activation，以 Commerce Activated 为第一价值验证，以 Transaction Confirmed 和 Repeat Supply 作为更强信号。首版只建设供给创建、公开 Storefront、商业动作和最小处理能力，不建设 Marketplace、Social、Membership、Merchandise、复杂 CRM、完整 B2B 或 AI。
