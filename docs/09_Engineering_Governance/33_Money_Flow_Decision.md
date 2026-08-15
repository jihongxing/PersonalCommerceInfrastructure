# 33 — Money Flow Decision

> **Decision ID**：D-MCL-01  
> **状态**：External Constraint Track Active; Provider-specific Adapter Decision Pending  
> **阶段**：Minimum Commercial Loop / MCL-01  
> **建立日期**：2026-08-14  
> **决策负责人**：产品最高负责人  
> **实现状态**：Blocked until decision approval

## 1. Decision Question

本决策只回答一个问题：

> 在 VS-02 Paid Service 的第一笔真实交易中，Customer 的钱付给谁，谁是交易主体，
> 平台如何获得可信 Payment Confirmation，并由谁承担退款、争议、结算和合规责任？

该决策会直接影响：

- Order 和 Payment Model；
- Creator Payment Onboarding 与 KYC；
- 平台法律角色和责任；
- Checkout UX；
- Cancellation、Refund、Dispute 和 Chargeback；
- Platform Fee / Take Rate；
- Settlement、Creator Wallet / Earnings Ledger 和 Withdrawal；
- 支付 Provider、部署市场和运营流程。

在部署市场、法律角色和 Provider 能力得到确认前，本文件不提前选择 A、B 或 C。

## 2. Decision Principles

选择必须同时满足：

1. 能完成第一笔真实 `Paid + Fulfilled` Service Commerce；
2. 平台可以通过可信来源确认 Payment，而不是信任客户端声明；
3. 不要求项目自行建设支付基础设施；
4. 不存储银行卡号、CVV 或完整支付凭据；
5. Creator、Customer 和平台的责任边界可以被清楚解释；
6. Cancellation、Refund、Dispute 和 Chargeback 有最低可执行路径；
7. 与未来 Creator Commerce Infrastructure 方向不冲突；
8. 复杂度与 5–10 Creator 的 Controlled Pilot 相匹配；
9. 不以规避法律、税务、KYC 或资金责任作为“简化”；
10. 必须支持平台手续费、Creator Earnings Ledger 和 Withdrawal，但不得因此默认平台
    自行托管资金；
11. 如关键事实未知，保持 Decision Pending，而不是让代码替代决策。

## 3. Candidate Models

### Model A — Creator-direct

```text
Customer
→ 平台完成 Request / Confirm / Order Orchestration
→ Customer 在平台外直接付款给 Creator
→ 平台记录经验证的外部付款事实
```

平台不发起、不接收、不路由资金。

**优势**

- 实现和运营复杂度最低；
- 平台资金责任、KYC 和结算责任较低；
- 可最快启动小规模人工 Pilot。

**限制**

- 平台不能完整控制 Checkout 和 Payment Experience；
- Payment Confirmation 依赖外部证据或人工验证；
- Platform Fee 难以可靠执行；
- Refund、Dispute 和 Customer Protection 较弱；
- 对“平台参与真实支付闭环”的战略证明最弱。

**选择警告**

Model A 只有在产品负责人明确接受“平台不参与资金流”的例外时才能选择。若阶段目标
要求平台内 Checkout、自动 Payment Confirmation 或可执行 Platform Fee，Model A 不满足。

### Model B — Platform Checkout

```text
Customer
→ Platform Checkout
→ 平台或平台控制的 Merchant Account 收款
→ 平台向 Creator 结算
```

平台直接参与收款并承担更完整的交易责任。

**优势**

- Checkout、Payment、Refund 和 Customer Result 可高度统一；
- Payment Confirmation 最直接；
- Platform Fee 和商业规则控制力强；
- 长期可支持更完整的 Commerce Experience。

**限制**

- 可能引入 Merchant of Record / Seller of Record、KYC、AML、税务、结算和资金安全责任；
- Refund、Dispute、Chargeback 和 Creator Payout 复杂度最高；
- 可能迫使项目建设超出 Minimum Commercial Loop 的资金和运营系统；
- 对 5–10 Creator Pilot 可能过重。

**选择警告**

不得仅因为“平台控制力最强”选择 Model B。必须先确认部署市场、法律实体、交易主体、
Provider Contract、Creator Payout 和退款责任可以在 Pilot 范围内真实执行。

### Model C — Provider-backed Creator Settlement

```text
Customer
→ Platform Commerce Checkout
→ Payment Provider
→ Connected Creator Account / Provider-controlled Money Flow
```

平台负责 Commerce Orchestration、Checkout Experience 和 Transaction State；支付基础设施
负责敏感支付数据、资金路由及所支持的 Creator Onboarding / Payout 能力。

**优势**

- 可提供平台内 Checkout 和可信 Payment Confirmation；
- 平台无需自行存储敏感支付凭据；
- 可支持 Platform Fee，同时让资金由专业支付基础设施处理；
- 与 Creator Commerce Infrastructure 的长期方向最匹配；
- 相比 Model B，平台直接持有和结算资金的责任可能更低。

**限制**

- Creator Connected Account 和 KYC Onboarding 仍有明显复杂度；
- 实际资金角色、退款、争议、负余额和 Chargeback 责任取决于 Provider 与部署市场；
- Provider Webhook、Account State、Payout 和失败恢复必须准确实现；
- 并非所有市场、主体和 Provider 产品都支持同一种 Connected 模式。

**选择警告**

Model C 原名为 `Connected Payment`，现正式改称 `Provider-backed Creator Settlement`。
它是当前最高潜力候选，但不是已批准答案。必须确认具体市场、Provider、法律角色、
资金流和责任分配后才能冻结。

## 4. Comparative View

| 维度 | Model A Creator-direct | Model B Platform Checkout | Model C Provider-backed Creator Settlement |
| --- | --- | --- | --- |
| 实现难度 | ★ | ★★★★ | ★★★ |
| 完整商业闭环 | ★★ | ★★★★★ | ★★★★★ |
| 平台内 Checkout | 弱 / 无 | 强 | 强 |
| 可信自动支付确认 | 弱 | 强 | 强 |
| Platform Fee | 弱 | 强 | 强 |
| 平台资金责任 | 低 | 高 | 中，取决于结构 |
| Creator KYC | 平台外或弱 | 高 | 中至高 |
| Refund / Dispute 控制 | 弱 | 强但责任重 | 中至强，取决于 Provider |
| Pilot 启动速度 | 最快 | 最慢 | 中等 |
| 长期可扩展性 | 低 | 高 | 高 |
| 与 Creator Commerce Infrastructure 匹配 | 中 | 高 | 最高候选 |
| 当前决策状态 | 未选择 | 未选择 | 倾向研究，未选择 |

星级只表示当前战略层面的相对复杂度和能力，不是 Provider、法律或工程结论。

## 5. Required Facts Before Decision

D-MCL-01 当前唯一允许推进的工作是补齐真实决策输入。不是继续扩写产品架构，也不是
选择或集成支付 Provider。

六个事实必须按顺序收敛：

1. 首发部署市场；
2. 首发币种；
3. 交易主体；
4. Payment Provider 候选；
5. Creator Onboarding；
6. 资金与失败责任。

其中首发部署市场是第一个必须冻结的输入。市场未冻结时，币种、交易主体、Provider、
KYC、Refund、Dispute 和整个 Money Flow 均不得冻结。

批准 D-MCL-01 前必须回答：

### 5.1 Market and Legal Role

- 第一批真实交易发生在哪个国家 / 地区；
- Customer 使用什么币种付款；
- Creator 和平台法律实体位于哪里；
- Creator 还是平台是 Service Seller / Merchant；
- 平台是技术服务商、代理、Marketplace Operator 还是资金接收方；
- 是否需要税务、收据、发票、消费者保护或特定退款义务。

### 5.2 Money Movement

- Customer 的资金首先进入谁控制的账户；
- 平台是否在任何时间持有、控制或可支配资金；
- Creator 何时、以何种条件获得收入；
- Platform Fee 是否存在，谁向谁支付；
- Provider Fee、Refund、Chargeback 和负余额由谁承担；
- 失败或 Provider 不可用时，Order 如何恢复或进入人工处理。

### 5.3 Creator Onboarding

- Creator 是否必须完成 KYC / KYB；
- 谁收集和存储身份、银行或支付账户信息；
- Creator Account Pending / Restricted / Rejected 时能否发布有价 Offering；
- Creator 无法收款时，Customer 是否仍可 Confirm 或 Pay；
- Creator 离开 Pilot 时如何处理未完成 Order、退款和历史记录。

### 5.4 Customer Protection

- 付款前和付款后分别由谁允许 Cancellation；
- Creator 无法履约时由谁发起 Refund；
- 已付款但未履约如何进入 Pending Resolution；
- Customer 如何看到 Payment、Refund 和 Completion 的可信结果；
- Dispute / Chargeback 如何关联 Order 并通知 Creator 和 Operations。

### 5.5 Provider Capability

- Provider 是否支持目标市场、币种、支付方式和 Creator 类型；
- 是否支持 Connected Account 或等价能力；
- Webhook / Event 是否足以成为可信 Payment Fact；
- Refund、Dispute、Payout 和 Account State API 是否满足最小闭环；
- Live Mode 启用、测试、审计、数据保留和 Secret 管理要求是什么；
- Provider 条款是否允许当前业务模式。

### 5.6 Money Responsibility

- Customer 付款后，退款责任由谁承担；
- Creator 无法履约时，谁决定取消和退款；
- 欺诈、Provider Dispute 和 Chargeback 由谁响应并承担损失；
- 负余额由 Creator、平台还是 Provider 承担；
- Provider 冻结、限制或关闭账户时，未完成 Order 如何处理；
- 谁拥有最终 Customer Communication 和 Pending Resolution 责任。

## 6. D-MCL-01 Decision Input Sheet

以下字段构成 Gate 0 的正式 Decision Input Pack。所有字段必须基于真实部署、法律、
Provider 和 Pilot 条件填写；未知项必须写为 `Unknown — Blocking`，不得用假设补齐。

| Decision Input | Current Value | Required Evidence / Owner |
| --- | --- | --- |
| Deployment Market | `Mainland China — Confirmed as launch constraint` | 首笔交易实际发生国家 / 地区；产品最高负责人确认 |
| Currency | `CNY — Confirmed as launch currency; multi-currency deferred` | 首笔 Customer 支付与 Creator 收款 / 结算币种 |
| Creator Legal Location | `Unknown — Blocking` | Pilot Creator 的法律居住地或经营主体所在地 |
| Platform Legal Entity | `Unknown — Blocking` | 实际签约、提供平台服务并承担责任的法律实体 |
| Service Seller | `Creator preferred; natural person vs individual business pending` | 需结合中国支付产品、经营性收款要求和平台角色确认 |
| Platform Role | `Commerce Infrastructure / orchestration candidate; legal classification pending` | 技术服务商、Agent、Marketplace Operator、Merchant 或其他明确角色 |
| Payment Provider Candidates | `WeChat Pay + Alipay for China launch; Stripe / PayPal / regional providers for future markets` | 最多 2–3 个与目标市场和业务结构匹配的候选，不做无边界 Provider 竞调 |
| Creator KYC Requirement | `Unknown — Blocking; provider-specific verification required` | 所需身份、银行账户、税务或经营资料及其收集方 |
| Customer Payment Method | `WeChat Pay and Alipay candidate rails; exact product flow pending` | Pilot 实际采用的单一或最小支付方式 |
| Creator Payout Method | `Settlement → Creator Wallet / Earnings Ledger → Creator-selected Withdrawal; provider path pending` | 资金如何、何时进入 Creator 可控制账户 |
| Platform Fee | `Required — rate, payer, timing and collection mechanism pending` | 平台手续费是必备商业事实，不允许最终冻结为永久 `None / 0` |
| Refund Owner | `Unknown — Blocking` | 谁决定、发起、执行并承担退款 |
| Dispute Owner | `Unknown — Blocking` | 谁处理 Provider Dispute 和 Customer 争议 |
| Chargeback Owner | `Unknown — Blocking` | 谁响应举证并承担 Chargeback / Loss |
| Payment Confirmation Source | `Provider callback / webhook / API candidate; exact source pending` | 必须是不可由客户端伪造的可信事实来源 |
| Pilot Constraints | `One real Service Offering; first target transaction CNY 399 candidate; fee + settlement + wallet evidence required; 5–10 Creator pilot later` | Creator 数量、交易金额上限、地区、服务类型、人工介入和停止条件 |

### 6.0 Current Strategic Constraint

当前不是“中国支付系统”决策，而是：

```text
China-first, Global-ready Commerce Money Flow
```

因此当前只冻结：

- 中国大陆作为首发市场；
- CNY 作为首发币种；
- 微信支付和支付宝作为首发 Provider 候选；
- Stripe、PayPal 和其他区域 Provider 作为未来候选；
- Payment Provider Adapter 作为架构方向；
- Platform Fee 是每笔交易商业模型的必备组成；
- Settlement、Creator Wallet / Earnings Ledger 和 Withdrawal 是终局必备能力；
- Wallet 首先是 Creator 商业收入账本，不自动等于平台自建资金池或储值账户；
- 底层资金托管、分账和提现必须由合规支付基础设施与区域法律结构决定。

当前不冻结：

- 个人还是个体工商户的最终 Creator Seller 主体；
- 平台最终法律角色；
- 微信支付 / 支付宝的具体产品和进件模式；
- Platform Fee 的费率、支付方、扣取时点和自动分账能力；
- Wallet 的底层资金账户、托管主体、提现产品和风险准备金机制；
- 未来国际市场、币种、税务、退款规则或 Stripe / PayPal 可用性；
- Model A、Model B 或 Model C 的最终选择。

### 6.1 Input Completion Rule

D-MCL-01 只有在以下条件全部满足后才允许进入最终模型选择：

- Decision Input Sheet 不再包含 `Unknown — Blocking`；
- Deployment Market 和 Currency 已由产品最高负责人冻结；
- Service Seller、Platform Role 和 Platform Legal Entity 可以相互一致地解释；
- Provider 候选已根据目标市场、Creator 类型、币种、Connected Account、KYC、Refund、
  Dispute、Webhook 和 Platform Fee 能力完成小范围验证；
- Creator Onboarding 对 5–10 个真实舞者 Pilot 可实际执行；
- Refund、Dispute、Chargeback、无法履约、欺诈和负余额责任已明确；
- 每个关键输入具有来源、负责人和确认日期。

### 6.2 Decision State Transition

```text
Decision Framework Frozen
→ Decision Input Required
→ Decision Input Complete
→ Model Evaluation
→ Approved / Rejected
```

不得从 `Decision Input Required` 直接跳到 `Approved`。

## 7. Gate 0A — China Payment & Merchant Research

本节只记录研究证据和待验证结论，不构成法律、税务或支付产品批准。

### 7.0 Evidence Rules

- `Confirmed — Official Product Evidence`：官方产品文档直接描述了能力和适用边界；
- `Candidate — Official Evidence, Product Fit Unconfirmed`：官方资料证明存在相关能力，
  但没有证明它适用于本项目的“中国大陆线上 Service Offering + Creator 收款”组合；
- `Unknown — Blocking`：公开官方资料不足，必须通过 Provider 商务、产品审核、合同、工单
  或合规确认取得证据；
- 不把线下当面付、游戏分账、通用转账或第三方应用能力，推导为本项目可用的线上 Creator
  Commerce 资金闭环。

### 7.0.1 Capability Matrix

| Capability | WeChat Pay | Alipay | Gate 0A result |
| --- | --- | --- | --- |
| Customer Pay | `Confirmed — JSAPI / 小程序 / Native 等产品存在；主体与场景仍需匹配` | `Confirmed — 官方开放平台存在 WAP / APP / 当面付等接入入口；本场景产品仍需确认` | 两家都有支付入口，但尚未确认同一 Creator Commerce 产品路径 |
| Platform / service-provider model | `Confirmed — 普通商户与服务商模式；服务商资金流向子商户结算账户` | `Confirmed — 第三方应用与支付服务商模式存在` | 角色分类、合同和产品准入仍待确认 |
| Natural-person Creator recipient | `Candidate — 小微商户进件需身份证与结算银行卡；小微进件处于灰度，且普通服务商接口排除电商平台` | `Candidate — 个人商户可完成个人支付宝账户实名认证；未证实线上 Service Offering 的 Creator 分账/结算资格` | `Unknown — Blocking` |
| Individual-business Creator recipient | `Candidate — 官方特约商户进件支持个体工商户；具体支付产品与平台角色待确认` | `Candidate — 官方服务商代商户签约资料明确企业类商户流程；个体工商户线上资金路径未证实` | `Unknown — Blocking` |
| Split / allocation | `Confirmed — 平台收付通支持按订单分账、平台佣金和资金冻结/解冻；普通分账也存在` | `Candidate — 官方公开材料未形成适用于本项目的产品级证据` | 微信可进入候选设计，支付宝仍阻塞 |
| Delayed settlement | `Confirmed — 平台收付通支持二级商户资金冻结，并按业务条件解冻` | `Unknown — Blocking` | 必须确认 Creator Service 的延迟结算产品 |
| Refund before settlement | `Candidate — 官方平台收付通文档存在退款与补差退款规则；需确认本订单路径` | `Unknown — Blocking` | 两家都需绑定到最终产品路径 |
| Refund after settlement | `Candidate — 官方文档存在退款接口与分账/补差后的处理规则；责任与资金来源待确认` | `Unknown — Blocking` | 不得由产品假设补齐 |
| Platform Fee / service-provider commission | `Confirmed — 平台收付通公开描述平台可收取平台佣金，公开默认最高分账比例为 30%` | `Candidate — 支付服务商公开存在业务协作费/返佣；不等于本项目订单平台手续费` | 微信能力存在但费率/主体/会计仍待确认；支付宝不通过 |
| Creator withdrawal | `Confirmed — 平台收付通公开提供余额查询与提现，并说明二级商户可提现` | `Unknown — Blocking` | 微信路径候选，支付宝路径未证实 |
| KYC / merchant onboarding | `Confirmed — 小微/特约商户进件要求身份证、结算银行卡及按经营类型提交辅助材料；个体户需经营资料` | `Confirmed — 官方开放平台区分个人/企业认证；服务商代企业商户签约有明确资料要求` | 本项目 Creator 类型和资料最小集仍待 Provider 确认 |
| Webhook / callback / query | `Confirmed — 官方服务商支付指引要求支付成功回调或查单确认` | `Candidate — 开放平台具备 API/应用回调体系；本支付产品和事件契约待确认` | 微信可作为候选可信事实源 |
| Dispute / chargeback / negative balance | `Unknown — Blocking` | `Unknown — Blocking` | 必须由 Provider 合同/规则及责任方确认 |

### 7.0.2 Gate 0A Result

Gate 0A 已完成“公开官方资料的候选能力核查”，但未完成 Provider-specific business
confirmation。当前结论为：

1. 微信支付的 `平台收付通 / 二级商户 + 延迟分账 + 平台佣金 + 余额提现` 是目前最接近
   `Customer → Order → Payment → Fulfillment → Settlement → Creator Earnings → Withdrawal`
   的中国候选路径；
2. 微信“小微商户”路径不能直接采用：官方资料标明小微进件处于灰度，且普通服务商小微
   进件接口排除电商平台；项目必须先确认平台分类；
3. 个体工商户比“未经确认的自然人经营主体”更接近目前公开进件资料，但不能据此冻结
   Seller 结论；
4. 支付宝公开资料足以证明第三方应用、支付服务商和商户授权/签约框架存在，不足以证明
   本项目所需的线上 Service Offering、Creator 分账、延迟结算、提现、退款和争议闭环；
5. 因此 Gate 0A 的状态是 `Research Complete / Provider Confirmation Blocking`，不是
   `D-MCL-01 Approved`。

### 7.0.3 Settlement Infrastructure Expansion

本轮新增的官方平台参照研究表明，Gate 0A 不能只比较“微信支付 vs 支付宝”。中国平台
已经存在至少两类 Creator 收益路径：

1. **Creator-direct**：个体达人完成任务后，将收益提现至本人实名认证的支付宝或银行
   账户；
2. **Institution-mediated**：MCN 达人完成任务后，平台向 MCN 机构结算，再由机构按
   生效比例或内部协议向达人处理结算。

因此 D-MCL-01 必须增加一个上层选择：

```text
Direct Creator Settlement
vs
Institution-mediated Settlement
vs
Provider Sub-merchant / Platform Settlement
```

`Creator Wallet` 的研究对象也相应升级为：

```text
Creator Settlement Account / Earnings Ledger
```

它可以由平台提供产品账本和提现体验，但底层资金账户、托管、分配和提现可能由支付
机构、结算服务机构、MCN 或其他合规合作方承载。平台不能凭借“钱包”命名推导出自建
资金池或无监管储值能力。

详细参照地图见：
`docs/09_Engineering_Governance/35_China_Creator_Settlement_Infrastructure_Map.md`。

### 7.1 WeChat Pay

- 微信支付官方文档列出小微商户和个体工商户等主体类型；小微通常需要经营者身份证和
  结算银行卡，个体工商户通常需要营业执照、经营者证件和结算银行账户；
- 微信支付官方合作伙伴文档区分普通商户和服务商模式，并说明服务商模式下资金流向
  子商户结算账户，而非服务商账户直接收款；
- 微信支付官方文档显示，个体工商户可申请 JSAPI、小程序、APP、Native 和付款码等
  基础支付权限；小微商户可申请 JSAPI、小程序、Native 和付款码，但不支持 APP 和
  H5 支付；
- 微信支付普通服务商的小微进件接口明确排除银行、支付机构和电商平台；若本项目被
  微信支付认定为电商平台，必须研究平台收付通 / 电商二级商户等不同产品，而不能直接
  套用普通服务商小微进件；
- 微信支付平台收付通允许平台协助二级商户入驻，并支持资金进入二级商户账户、冻结、
  解冻和平台佣金，但这会引入更强的平台型电商与资金责任，不能仅因功能匹配就选择；
- 微信支付分账相关公开能力表明，交易资金可在满足规则后分配给商户或其他接收方，
  并存在延迟分账、服务商抽成和接收方后续提现等场景；具体接收方主体、比例、产品
  适用性和资金责任仍需 Provider 审核；
- 微信支付官方 JSAPI 准备文档显示，申请 JSAPI 支付权限支持个体工商户、企业等主体，
  但具体产品权限、AppID / 公众号绑定、商户号和场景必须逐项确认；
- 研究结论：Creator 个人 / 个体工商户主体必须以具体微信支付产品、场景和进件结果为
  准，不得仅凭“个人可以经营”推导“平台可以为个人完成经营性在线收款”。

### 7.2 Alipay

- 支付宝开放平台官方资料显示，服务商可通过当面付等产品协助商户签约，并要求商户
  授权后才能由服务商应用发起支付；
- 支付宝官方资料同时区分个人商户和企业商户的账户认证路径，并在不同服务商 / 产品
  页面中出现不同主体与资料要求；
- 支付宝开放平台的第三方应用模式允许其他商家授权服务商，由服务商替商家调用开放
  能力；但服务商代商户签约页面对可代申请主体和资料有更严格限制；
- 研究结论：必须针对“中国大陆线上 Service Offering、Creator 收款、服务商 / 第三方
  应用”组合向支付宝确认可用产品、商户主体、资金结算、退款和回调能力，不能把历史
  收钱码或线下当面付资料直接当作本项目线上架构结论。

### 7.3 PayPal and Future Global Rails

- PayPal 中国官方注册资料说明，以营利为目的销售的个人卖家应选择企业账户路径，并要求
  个人经营者信息和身份证明；企业卖家还涉及营业执照和法定代表人资料；
- PayPal 中国官方协议还提示，2026 年 6 月 30 日后中国大陆新开个人账户的销售收款
  功能存在限制；
- Stripe Connect 官方文档显示，Connected Account 可用国家取决于平台所在国家和连接
  账户国家，并明确列出地区可用性；当前 Connect country availability 清单未列出 `CN`，
  不能把 Stripe Connect 默认视为中国大陆 Creator connected-account 首发方案；
- 研究结论：Stripe、PayPal 只能作为未来区域 Provider 候选，Global-ready 不等于全球
  统一可用，也不等于现在实现国际支付。

### 7.4 Current Candidate Architecture

当前研究支持的候选方向是：

```text
Commerce Order / Payment
→ Payment Orchestrator
→ Regional Payment Provider Adapter
→ Provider Payment / Split / Settlement Capability
→ Platform Fee + Creator Net Earnings
→ Creator Wallet / Earnings Ledger
→ Creator-selected Withdrawal
```

中国首发候选：

```text
WeChat Pay Adapter
Alipay Adapter
```

未来区域候选：

```text
Stripe Adapter
PayPal Adapter
Other Regional Provider Adapter
```

该方向的产品含义：

- `Payment` 是产品对象，Provider 交易号、回调和退款能力属于 Adapter；
- `Currency` 使用 ISO 4217 概念，但首版只允许 CNY；
- `Country / Region` 决定 Provider Capability、Seller、KYC 和责任模型；
- Platform Fee、Settlement、Wallet Ledger 和 Withdrawal 是统一 Money Layer；
- Wallet 不得只实现为可覆盖余额，必须由可追踪 Ledger Entry 支撑；
- 底层资金优先由受监管 Provider 承担托管、分账和提现能力；
- 平台是否法律上持有或控制资金仍必须由 D-MCL-01 明确；
- 不建设无监管资金池、内部储值或自建清算系统。

该方向接近 Model C，但在中国首发中是否能合法、可执行地落为“Creator 子商户直结”
仍取决于平台法律主体、微信 / 支付宝产品分类、Creator Seller 主体和 Provider 审核，
因此不能升级为 Approved Architecture。

### 7.5 Remaining Blocking Questions

当前剩余的核心阻塞项已收敛为：

1. 平台在中国大陆以什么法律实体签约并申请服务商 / 第三方应用能力；
2. 平台会被微信支付认定为普通服务商、SaaS 服务商还是电商平台；
3. 一对一舞蹈私教 Creator 能否以小微 / 个人卖家进件，还是必须使用个体工商户；
4. 微信支付中具体使用服务商 JSAPI / 小程序、平台收付通还是其他产品；
5. 支付宝中具体使用第三方应用 + WAP / APP / 当面付中的哪种线上可执行产品；
6. 微信 / 支付宝是否允许 Provider 资金直接结算到 Creator 控制账户；
7. 退款、争议、欺诈、负余额和无法履约责任由 Creator、平台还是 Provider 承担；
8. Platform Fee 的费率、支付方、扣取时点、Provider 分账能力和会计处理；
9. Creator Wallet 的 Pending、Available、Restricted 和 Withdrawn 如何映射 Provider 资金；
10. Creator 自由选择提现时间时，最低金额、频率、手续费和失败恢复如何处理；
11. 平台如何在不存储支付凭据的情况下获得可信 Payment Confirmation；
12. Provider 是否愿意以书面、合同、工单或正式产品审核结果确认上述业务结构。

## 8. Gate 0B — CNY 399 Money Flow Simulation

### 8.1 Scenario and Variables

```text
Offering: 1v1 Dance Lesson
Price: CNY 399.00
Customer: Real customer in Mainland China
Creator: Real pilot Creator; Seller type pending Gate 0C
Provider Fee: P                         (not assumed)
Platform Fee: F                         (mandatory; rate pending)
Refund / Reserve / Adjustment: R        (scenario-dependent)
Creator Net Earnings: 399.00 - P - F - R
```

任何 `P`、`F` 或 `R` 的数值，必须来自最终 Provider、平台商业规则或已批准的责任政策；
本模拟不虚构费率、税费、提现费或法律责任。

### 8.2 Candidate Money Paths

| Candidate | Flow | Current result |
| --- | --- | --- |
| A — Provider split before Creator settlement | Customer pays `399.00` → Provider deducts `P` / allocates `F` → Creator receives net → Ledger records Settlement → Creator withdraws | Most aligned with Provider-native allocation, but WeChat/Alipay product and Seller eligibility are not fully confirmed |
| B — Creator receives gross, platform charges fee separately | Customer pays `399.00` → Creator receives gross → platform invoices/charges `F` separately | Platform Fee collection, authorization, tax and failed collection are unresolved; not approved for pilot |
| C — Provider-native platform share | Customer pays `399.00` → Provider applies transaction + split/share rules → Creator net and platform share settle according to Provider contract → Ledger records facts → Creator withdraws | Leading candidate, not approved; depends on exact Chinese product, legal role, fee rules and responsibility allocation |

### 8.3 Timeline — Normal Flow

| Time | Commerce fact | Money fact | Required trusted evidence |
| --- | --- | --- | --- |
| T0 | Customer submits payment for confirmed Order | Payment intent created; no earnings available | Provider order identifier and server-side creation result |
| T1 | Order payment accepted | Payment becomes `Confirmed`; funds remain Provider-controlled | Provider callback/webhook or server-side query, with signature verification and idempotency |
| T2 | Creator performs the 1v1 lesson | Order becomes `Fulfilled`; earnings remain pending if Provider holds funds | Creator fulfillment fact and Order linkage |
| T3 | Platform evaluates completion policy | Settlement becomes eligible | Completion/acceptance fact and policy version |
| T4 | Settlement instruction executes | `P` / `F` / `R` are applied according to approved formula | Provider settlement/split result and immutable calculation inputs |
| T5 | Settlement succeeds | Creator Earnings Ledger receives `Creator Net Earnings`; balance is `Available` only when Provider makes funds withdrawable | Provider allocation result plus append-only Ledger Entry |
| T6 | Creator requests withdrawal | `Withdrawal Intent = Requested`; no balance mutation without Provider result | Creator-authenticated intent and balance reservation/authorization record |
| T7 | Provider withdrawal completes | Ledger records `Withdrawn`; withdrawal reference is stored | Provider withdrawal result, queryable status, and reconciliation record |

### 8.4 State Separation

```text
Commerce State:
Requested → Confirmed → Paid → Fulfilled → Completed

Money State:
Payment Pending → Payment Confirmed → Pending Earnings → Settled
→ Available → Withdrawal Requested → Withdrawn
```

`Completed` 不自动等于 `Available`。Settlement 可能延迟、失败、被限制或需要人工处理。
`Wallet` 只展示由 Provider 事实和 Ledger 投影得出的余额，不创造资金事实。

### 8.5 Failure and Exception Matrix

| Failure path | Required product outcome | Responsibility / evidence status |
| --- | --- | --- |
| Payment failed | Order remains unpaid or becomes `Payment Failed`; no Ledger credit | Provider failure result required; owner is not yet confirmed |
| Creator declined before payment | Request becomes declined; no Order Payment | VS-01 semantics already define decline; no money movement |
| Creator cannot fulfill after payment | Order enters cancellation / `Pending Resolution`; refund decision required | Refund owner, funding source and negative-balance rule are `Unknown — Blocking` |
| Customer refund before settlement | Stop or reverse pending allocation; record refund fact | Provider-specific pre-settlement behavior and owner are `Unknown — Blocking` |
| Customer refund after settlement | Execute Provider refund/return path and reverse or reserve Ledger entries | Provider post-settlement rule, recovery source and owner are `Unknown — Blocking` |
| Provider dispute / chargeback | Freeze affected earnings; create dispute fact; do not silently mark Completed Paid Commerce | Dispute/chargeback owner, evidence window and negative balance are `Unknown — Blocking` |
| Creator wallet insufficient for refund/adjustment | Keep balance restricted/negative only under approved responsibility policy; enter `Pending Resolution` | Negative-balance authority and collection mechanism are `Unknown — Blocking` |
| Withdrawal failed | Keep earnings available or reserved according to Provider result; allow retry without double debit | Provider withdrawal states, fees, limits and retry policy are `Unknown — Blocking` |
| Provider account restricted | Block new paid Orders for affected Creator; preserve existing Order/Ledger facts | Provider restriction events, customer remedy and funds release path are `Unknown — Blocking` |

### 8.6 Gate 0B Result

The CNY 399 simulation is complete as a provider-neutral control model. It is not real-money
evidence and it does not authorize implementation. It exposes unresolved blocking fields rather
than hiding them: `P`, `F`, `R`, Seller eligibility, settlement trigger, refund/dispute/chargeback
ownership, negative balance, withdrawal capability and Provider restriction handling.

## 9. Gate 0C — Provider Qualification Gate

Gate 0C 不是“选微信还是支付宝”，而是 Provider Qualification Gate。任何 Provider 必须
证明它可以支持本项目的 Creator Service Commerce 和结算闭环，不能只证明通用支付接口存在。

正式资格矩阵见：
`docs/09_Engineering_Governance/35A_Provider_Qualification_Dossier.md`。

当前排序：

1. 微信支付 `平台收付通 / 二级商户 / 延迟结算` 为领先资格候选；
2. 支付宝为必须单独完成同等能力核验的第二资格候选；
3. Direct Creator、Institution-mediated、Provider Sub-merchant / Platform Settlement
   仍未选择；
4. 当前阶段只等待 Provider Qualification Outreach 回复；任一关键字段为 `Unknown — Blocking`
   时，D-MCL-01 继续保持 `Pending`。

### 9.1 Official Research Sources

以下官方资料于 2026-08-14 核对。它们用于建立候选结构，不替代 Provider 商务 / 合规
确认或中国法律意见。

- 微信支付《接入模式》：
  `https://pay.wechatpay.cn/doc/v3/partner/4012081931`
- 微信支付《各主体可申请的基础支付权限列表》：
  `https://pay.wechatpay.cn/doc/v3/merchant/4015420731`
- 微信支付《小微商户进件 — 开发接入准备》：
  `https://pay.wechatpay.cn/doc/v3/partner/4012165177`
- 微信支付《小微商户进件 — 提交申请单》：
  `https://pay.wechatpay.cn/doc/v3/partner/4012722249`
- 微信支付《特约商户进件 — 产品介绍》：
  `https://pay.wechatpay.cn/doc/v3/partner/4012062365`
- 微信支付《平台收付通 — 电商交易解决方案》：
  `https://pay.wechatpay.cn/doc/v3/partner/4012086891`
- 微信支付《服务商模式 JSAPI 支付开发指引》：
  `https://pay.wechatpay.cn/doc/v3/partner/4012069859`
- 支付宝开放平台《接入流程》：
  `https://open.alipay.com/platform/accessProcessPage.htm`
- 支付宝开放平台《支付服务商》：
  `https://open.alipay.com/paymentServicer/paymentServicer.htm`
- 支付宝开放平台《第三方应用》：
  `https://open.alipay.com/module/isvApp`
- PayPal 中国《注册：创建 PayPal 账户》：
  `https://www.paypal.com/c2/webapps/mpp/account-selection`
- PayPal 中国《PayPal 用户协议》：
  `https://www.paypal.com/c2/legalhub/paypal/useragreement-full?locale.x=zh_CN`
- Stripe《Global availability》：
  `https://stripe.com/global`
- Stripe Connect《How Connect works》：
  `https://docs.stripe.com/connect/how-connect-works`
- Stripe Connect《Connected account types》：
  `https://docs.stripe.com/connect/accounts`

### 9.2 Research Stop Conditions

当前研究已停止扩展，项目等待外部 Provider Qualification Evidence。以下事实没有确认前
保持 Gate 0，不进入 35 PRD：

- 至少一个首发支付产品明确接受目标 Creator Seller 主体；
- 支付产品允许目标 Service Offering 场景和平台编排方式；
- 资金直接结算到责任主体账户，平台不被迫成为未批准的资金沉淀层；
- Provider 能提供可信支付回调 / 查询、退款和最小争议处理能力；
- Provider 能支持 Platform Fee、收入分配、Creator Earnings 可用性和提现路径，或提供
  可被合规 Ledger 准确映射的等价能力；
- Creator Onboarding 对首批 5–10 个 Creator 可执行；
- 平台、Creator、Customer 和 Provider 的退款、欺诈、Chargeback、负余额责任可书面确认。

## 10. Decision Criteria

最终选择按以下顺序评估：

1. **Legally Operable**：在首个部署市场可以真实、合规地运行；
2. **First Commerce Completeness**：能完成真实 Payment → Fulfillment → Completed；
3. **Responsibility Clarity**：Creator、Customer、平台和 Provider 的责任明确；
4. **Trusted Payment Fact**：平台可获得不可由客户端伪造的支付结果；
5. **Failure Closure**：Payment Failed、Cancellation、Refund 和 Dispute 有最小闭环；
6. **Economic Closure**：Platform Fee、Creator Net Earnings、Wallet Credit 和 Withdrawal
   可以被准确执行和审计；
7. **Pilot Proportionality**：复杂度适合 5–10 Creator Pilot；
8. **Strategic Fit**：与 Creator Commerce Infrastructure 终局方向一致；
9. **Reversibility**：若 Pilot 结果不成立，可停止而不破坏 VS-01 数据和用户关系。

成本或开发速度不能凌驾于法律可运行性、资金责任和真实 Payment Fact 之上。

## 11. Required Decision Output

D-MCL-01 批准时必须明确记录：

```text
Selected Model
Deployment Market
Currency
Service Seller / Merchant
Payment Provider and Product
Customer → Provider → Creator / Platform Money Path
Platform Fee Rule
Settlement Trigger and Formula
Wallet / Ledger Custody Model
Creator KYC Owner
Payment Confirmation Source
Cancellation Owner
Refund Owner
Dispute / Chargeback Owner
Settlement / Payout Responsibility
Withdrawal Responsibility and Limits
Required Product Objects and States
Pilot Constraints
Rollback / Stop Conditions
Decision Date and Approver
```

缺少任意影响资金或责任的关键字段时，状态保持 `Outcome Pending`。

## 12. Provider Adapter and Real-money Gate

根据 `D-MCL-GATE-01`，D-MCL-01 不再阻塞 `35_VS02_Paid_Service_PRD.md`、
`36_Engineering_Governance_Delta.md` 或 Provider-neutral VS-02 Build。

在 D-MCL-01 / Provider-specific Adapter 尚未获外部资格确认前，只允许：

- 研究目标部署市场和 Provider 能力；
- 补齐并验证 Provider Qualification Evidence；
- 形成法律、资金、责任、Creator Onboarding 和 Pilot 运营问题清单；
- 对最多 2 个首发 Provider 做受控外部资格确认；
- 实现已由 35 / 36 授权的 Provider-neutral Money Domain。

并行外部准备与资格工作包括：

- Provider Response Intake：`Evidence → Scope → Status → Gap → Next Question`；
- Pilot Business Case：CNY 399 一对一舞蹈私教样本；
- D-MCL-01 Decision Review：收到首批正式 Provider 回复后，根据三道资格门判断
  `Approved / Conditional Approval / Rejected`。

仍然禁止：

- 编写真实 Provider Checkout、Webhook、Payment、Refund 或 Payout 生产接入；
- 创建 Provider-specific 数据模型并将其冒充产品模型，或让 Provider SDK 类型泄漏到
  Provider-neutral Domain；
- 要求 Creator 提交真实 KYC、银行卡或银行账户信息；
- 在未明确交易主体时公开有价 Offering 或接受真实付款；
- 将现有 `external_paid_verified` 直接重命名为 Payment Success；
- 将 Sandbox、测试卡或人工数据库修改作为真实商业闭环证据。

## 13. Decision Record

### D-MCL-01 — Provider-specific Adapter / Real-money Decision

- **Status**：Pending — does not block Provider-neutral VS-02 build
- **Selected Model**：Not Selected
- **Current Direction**：Model C `Provider-backed Creator Settlement` is the leading research candidate, not an approved decision
- **Reason**：外部 Provider 能力、资金托管、分账、提现、KYC 和责任仍决定真实 Adapter
  与 Pilot 的可行性；它们不反向决定 Provider-neutral Order、Payment、Fulfillment、
  Settlement、Ledger、Wallet 和 Withdrawal 产品模型。
- **Next Decision Input**：验证 Creator Seller 主体（个人 / 个体工商户）、中国微信 / 支付宝
  的具体产品与进件路径、平台法律角色、资金不沉淀结构、退款 / 争议 / Chargeback 责任，
  并比较 Direct Creator、Institution-mediated 与 Provider Sub-merchant 三类结算基础设施。
- **Approval Authority**：产品最高负责人

本文件冻结的是决策框架，不是 Money Flow 结论。

