# 06 — MVP Thesis

> 状态：Frozen v1  
> 核心问题：第一阶段究竟验证什么，最小产品应该到哪里为止？

## 1. MVP 定义

第一阶段产品定义为：

> 让一个拥有个人影响力或专业能力的 Creator，在较短时间内建立一个统一商业身份页，并将自己的活动、可售时间、服务或其他商品转化为清晰的购买或预约入口。

目标体验可以概括为：

```text
注册
→ 建立商业身份
→ 添加档期或活动
→ 创建至少一个商品
→ 获得 Creator Storefront
→ 分享到已有社交渠道
→ 获得第一笔真实意向或交易
```

“10 分钟建立页面”是当前的产品方向和可用性目标，不是未经测试即可视为成立的事实。

## 2. MVP 核心假设

### Supply Hypothesis

Creator 愿意把自己的商业身份、公开活动、可售时间、服务或合作能力结构化，并持续维护其中至少一部分供给。

### Aggregation Hypothesis

Creator 愿意将来自不同社交平台、群聊和线下场景的商业流量汇聚到一个统一入口。

### Commerce Hypothesis

粉丝或客户能够理解 Creator Storefront 上的供给，并愿意通过该入口产生预约、购买、报名或明确商业询盘。

### Abstraction Hypothesis

少量通用 Commerce Primitive 能覆盖多个 Creator 垂直的大多数早期商品，而不需要为每个行业开发独立产品。

### Retention Hypothesis

当页面产生真实商业结果后，Creator 会继续维护档期、商品和客户关系，而不是只创建一次后离开。

## 3. MVP 不验证什么

MVP 不以验证以下命题为目标：

- 平台能否从零为 Creator 提供大规模流量；
- 开放 Marketplace 是否能够形成网络效应；
- Creator 社交网络是否成立；
- 推荐算法是否能提高发现效率；
- 完整 Creator OS 是否具备长期留存；
- B2B Creator Marketplace 是否成立；
- 动态定价和金融服务是否成立；
- 所有 Creator 垂直是否都适合同一产品。

这些属于后续阶段。

## 4. 第一阶段用户与流量

### 核心供给方

首批 Creator 应满足部分条件：

- 已经在公开渠道表达活动、档期、服务或合作意图；
- 已拥有少量可触达粉丝、客户或社群；
- 目前依靠私信、微信、群聊、表格或多个第三方工具完成交易；
- 愿意亲自参与产品共创和反馈；
- 能在短周期内发布真实供给并尝试交易。

### 核心需求方

第一批购买者主要来自 Creator 已有渠道：

- 抖音；
- 小红书；
- B站；
- 微博；
- 微信；
- 粉丝群；
- 活动现场；
- Creator 自有社群。

MVP 不依赖平台先建立独立流量池。

## 5. MVP 产品主干

MVP 应围绕五个模块组织。

### 5.1 Identity

Creator 能表达：

- 我是谁；
- 我属于什么领域；
- 我在哪里；
- 我的作品和可信度；
- 我的外部社交身份。

### 5.2 Calendar / Inventory

Creator 能表达：

- 我什么时候在哪里；
- 哪些活动已经确定；
- 哪些时间可以预约；
- 某项供给是否仍然可售。

### 5.3 Product

Creator 能创建至少一种真实商品，并说明：

- 卖什么；
- 多少钱；
- 时间、地点、时长或名额；
- 如何确认和履约；
- 基本取消规则。

### 5.4 Transaction

客户能够采取明确的商业动作：

- 购买；
- 预约；
- 报名；
- 提交合作询盘。

MVP 是否必须完成平台内支付，应由合规、成本和验证目标决定。早期可以评估受控的第三方支付或跳转，但必须能够记录有效转化。

### 5.5 Audience

Creator 至少能够知道：

- 谁提交了订单或预约；
- 购买了什么；
- 当前状态；
- 如何进行必要沟通和履约。

高级 CRM 不属于首版。

## 6. 候选最小功能范围

以下是 MVP Thesis 推导出的早期候选能力。正式产品边界以 `09 MVP Product Definition` 为准，本节仅保留推导上下文。

### 应当具备

- Creator 注册与基础 Profile；
- Creator Commercial Identity；
- Creator Storefront；
- Calendar / Availability 的最小表达；
- Activity 或 Product 创建；
- 基础价格、时间、地点、容量配置；
- 一种或少量核心交易动作；
- 基础订单或询盘记录；
- Creator 基础管理视图；
- 页面分享能力。

### 可以延后

- 社交 Feed；
- 平台级 Creator Discovery；
- 开放 Marketplace；
- 推荐算法；
- AI 功能；
- 高级 CRM；
- 动态定价；
- 完整财务系统；
- B2B Marketplace；
- Creator Financing；
- 复杂座位票务；
- 大型主办方工作流；
- 全商品类型的完整履约系统。

## 7. 垂直验证策略

`07 Opportunity Matrix` 与 `08 MVP Wedge Strategy` 已将首发验证策略冻结为：

- 舞者：主样本，验证 Multi-product Creator Commerce；
- Cosplayer：小型对照组，验证 Fan Commerce；
- 摄影师：小型对照组，验证 Service Commerce。

这不是同时建设三个垂直产品，而是使用一个统一产品和少量差异明显的真实 Creator 检查：

1. 统一 Identity 是否自然；
2. Inventory 是否能够被结构化；
3. Product Schema 是否能够复用；
4. 购买者是否能理解不同商品；
5. 交易工作流需要统一到什么程度。

## 8. 成功信号

### Creator Activation

Creator 完成可公开使用的商业身份，而不是只注册账户。

### Inventory Activation

Creator 发布至少一项真实、当前有效的活动、档期、服务或商品。

### Commerce Activation

Creator 获得至少一个有效预约、订单、报名或高意向商业询盘。

### Time to First Value

Creator 从注册到可分享页面，以及从分享页面到首个商业结果所需时间。

### Creator Retention

Creator 是否继续更新档期、商品或订单，而不是一次性使用。

### Buyer Conversion

进入 Storefront 的目标受众是否完成预期商业动作。

### Repeat Transaction

同一购买者或同一 Creator 是否产生后续交易。

### Creator Revenue

Creator 是否通过平台获得可归因的真实收入。

## 9. 失败信号

以下情况可能否定或要求修改当前 MVP 假设：

- Creator 只愿意展示链接，不愿维护结构化库存；
- 创建商品所需成本明显高于 Creator 感知价值；
- 购买者仍然大量回到私信确认，页面无法减少摩擦；
- 不同垂直的流程差异大到无法共享基础模型；
- 页面有访问但没有真实商业动作；
- Creator 产生首单后仍不愿持续维护；
- 第三方支付或人工履约使平台无法形成有效交易闭环；
- 安全、合规或消费者纠纷成本超过早期价值。

## 10. MVP 产品原则

1. **真实供给优先于丰富展示**。
2. **真实交易优先于平台流量**。
3. **Creator 自带分发优先于 Marketplace 冷启动**。
4. **最少结构化输入换取最大商业表达**。
5. **优先支持高频、可理解、可履约的商品**。
6. **允许早期人工运营，但必须记录关键状态和结果**。
7. **不为终局提前建设低确定性复杂系统**。
8. **每个功能必须对应一个明确待验证假设**。

## 11. MVP 阶段的核心问题

第一阶段结束时，项目应能够回答：

1. 哪类 Creator 最愿意建立统一商业身份？
2. 哪类商品最容易被创建和购买？
3. Creator 是否愿意维护 Calendar / Availability？
4. 第一个商业结果来自购买、预约还是询盘？
5. 平台内交易对转化和留存是否必要？
6. 一个通用 Product Schema 能覆盖多少真实场景？
7. Creator 获得收入后是否形成持续使用？
8. 哪个垂直最适合进入正式 MVP Scope 和 GTM？

## 12. MVP 一句话

> MVP 不是证明我们能做一个功能完整的 Creator App，而是证明 Creator 愿意把自己的商业供给结构化到一个统一身份下，并且真实客户愿意通过这个入口完成商业行为。
