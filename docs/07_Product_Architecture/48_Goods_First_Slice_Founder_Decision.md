# 48 — Goods First Slice Founder Decision

> **Decision ID**: `FD-PCI-GOODS-FIRST-SLICE-001`
>
> **Status**: `FOUNDER APPROVED / FROZEN`
>
> **Decision date**: 2026-11-20
>
> **Approval source**: Founder instruction **PCI-DOC-006 — Goods First Slice Founder Decision & Mainline Synchronization**

本决定正式冻结 PCI Goods First Slice 的 F01–F09 业务规则。Goods 是 PCI 的第四个运营场景；本决定只批准业务基线，不授权 Goods 代码、API、Schema、Migration、个人商业主页代码改造、生产、Pilot 或真实资金实施。

PCI 仍是面向 Service、Goods、Program、Membership、Project、Right 六类商业供给的统一交易基础设施。Goods Offering 挂载在卖家的个人商业主页下，遵循既有 [FD-PCI-PERSONAL-COMMERCIAL-HOMEPAGE-001](47_Personal_Commercial_Homepage_Founder_Decision.md)。个人商业主页是商品的主要展示和发现入口；直接商品链接只是辅助入口，商品可见性不得依赖卖家主动分享链接。

## F01 — Personal Commercial Homepage and Goods presentation

- Goods Offering 挂载在卖家的个人商业主页下。
- 个人商业主页是商品的主要展示和发现入口。
- 消费者通过访问个人商业主页发现该个人提供的商品。
- 商品可以拥有独立详情页面，但独立页面不是个人商业主页的替代品。
- 卖家主动分享商品或主页链接仅作为辅助方式。
- 商品的可见性不得依赖卖家主动分享链接。
- 不建设传统 Marketplace、竞价排名或广告推荐系统。

本决定执行既有个人商业主页决定，不重复创建新的全局主页决定，也不修改 Decision 47。

## F02 — Goods Offering publication

个人卖家发布 Goods Offering 时，首期采用以下信息。

必填：

- 商品名称；
- 简单商品介绍；
- 商品价格；
- 价格币种；
- 商品提供方式说明；
- 预计准备或交付时间的简单说明。

可选：

- 商品图片。

卖家可以管理自己的 Goods Offering，包括发布、修改和暂停新订单入口。不要求 SKU、商品规格矩阵、商品数量、库存、仓库、补货、复杂商品分类或商品目录管理。

## F03 — Consumer identity and purchase shape

- 消费者可以匿名浏览个人商业主页和公开商品。
- 提交 Goods Order 时必须登录 PCI 账户。
- 每笔订单只属于一位个人卖家。
- 每笔订单只针对一个 Goods Offering。
- 每笔订单固定购买一件商品。
- 不提供数量选择。
- 不建设购物车。
- 不支持跨卖家合并订单。

买家身份和订单关联必须通过服务端确认。

## F04 — Order Acceptance and Goods Commitment

1. 消费者提交购买请求后，创建待卖家处理的 Goods Order。
2. 提交订单本身不代表卖家已经接受。
3. 提交订单本身不形成 Goods Commitment。
4. 卖家拥有接受或拒绝自己商品订单的权限。
5. 卖家接受订单后记录 Order Acceptance。
6. 卖家接受后形成 Goods Commitment。
7. 卖家拒绝订单后保留拒绝事实，不产生 Goods Commitment。
8. 订单提交时保存商品价格和交易条件快照。
9. 后续 Goods Offering 修改不得改写历史订单条件。

Order、Order Acceptance、Commitment、Fulfillment、Delivery Confirmation 和 Payment 必须保持独立业务语义。

## F05 — No inventory and seller-arranged provision

- Goods 首期采用按需制作或准备。
- 不记录库存数量。
- 不建立库存账。
- 不实施库存预留。
- 不建立仓库和多仓库。
- 不建立补货系统。
- 不建立传统电商库存管理和超卖控制引擎。
- 每笔订单固定一件。
- 卖家确认接单是承接该笔供给义务的业务决定。
- 卖家可以主动暂停自己的 Goods Offering，停止接受新订单。

不因技术实现便利而增加库存系统。卖家对自己的供给能力进行判断，PCI 不代替个人卖家承诺无限提供商品。

## F06 — Goods preparation and delivery

- 卖家自行准备商品。
- 卖家自行安排交付方式。
- 可以采用当面交付、买卖双方约定的交付方式，或卖家自行安排寄送。
- PCI 不负责运输履约。
- PCI 不提供物流管理平台。
- 卖家完成交付时记录 Goods Delivery Confirmation。
- 买家收货确认可以作为独立的可选事实记录。
- 商品准备、卖家接单、交付完成是不同业务事实。
- 不得将 Goods Fulfillment 伪装成 Service Fulfillment Code 流程。

## F07 — Goods price and Payment boundary

- Goods Offering 展示卖家设定的价格和币种。
- 买家提交订单时保存价格和币种快照。
- 商品价格不代表支付已经发生。
- Order Acceptance 不代表已经付款。
- 商品交付不代表 Payment 已发生。
- 不接入 PCI 真实支付渠道。
- 不执行平台收款、退款、结算、分账或自动资金操作。
- `REAL_MONEY_ENABLED = false`。

买卖双方可以在 PCI 之外自行协商和处理线下结算，但 PCI 不参与、不验证或认证线下资金是否到账。PCI 不得将线下协商、口头确认或外部支付描述为 PCI Payment fact；未经单独授权，不得记录或展示未经证实的 Payment 状态。本决定不等于 PCI 已具有真实 Payment 能力。

## F08 — Seller inability to provide after acceptance

- 卖家接受订单后，如果发现无法提供商品，可以提出取消。
- 必须记录取消原因。
- 必须记录操作人和操作时间。
- 买家能够看到订单取消结果及原因。
- 原 Goods Order、Order Acceptance 和 Goods Commitment 的历史必须保留。
- 不得静默删除原交易或伪造其从未发生。
- 不自动产生退款、赔偿、违约金或其他资金事实。
- 不建设复杂争议处理平台。

如实施中涉及卖家取消后是否需要买家确认、买家如何回应等具体权限细节，而既有决定没有提供充分依据，不得自行补造商业政策，应交 Main Controller 判断是否需要 Founder 裁决。

## F09 — Seller Offering Pause and Admin Scenario Pause

### A. Individual seller pauses one Goods Offering

- 暂停后阻止该 Offering 接受新的 Goods Order。
- 暂停不自动取消已有待卖家处理的订单。
- 已经接受的订单继续履约。
- 不删除历史 Order、Acceptance、Commitment 或 Delivery 事实。
- 恢复后根据现有 Offering 状态重新开放新订单入口。

### B. Admin pauses the entire Goods scenario

- 阻止新的 Goods Order 提交。
- 暂停前已经提交的待卖家处理订单仍可接受或拒绝。
- 已接受的订单继续履约。
- 不自动取消任何已接受订单。
- 不改变已经发生的历史交付事实。
- 恢复后重新开放符合条件的新订单入口。

Admin 操作必须遵守 PCI Operations Control Plane、Operations Human 授权、服务端持久化、审计及既有安全边界。Goods Pause 不得被误用于 Service、Membership 或 Program。

## Domain boundaries and shared infrastructure

- Goods 不得复用 Service Offering、Customer Request 或 Fulfillment Code 作为 Goods 业务对象。
- Goods Order 不创建 Membership Relationship。
- Goods 不创建 Program Run、Enrollment 或 Participation。
- Goods 商品购买不自动创建 Right Grant。
- 可以复用共享身份、权限、审计、关联追溯、持久化、事件及 Operations 机制，但不得因此合并六种商业供给的领域模型。
- 继续遵守 Conceptual Baseline 41、D01–D12、F01–F04。

## Current scenario status

| 场景 | 当前状态 |
|---|---|
| Service | FIRST OPERATIONAL SLICE INTEGRATED |
| Membership | SECOND OPERATIONAL SLICE INTEGRATED / ACCEPTED |
| Program | THIRD OPERATIONAL SLICE INTEGRATED |
| Goods | FOURTH SCENARIO / BUSINESS BASELINE APPROVED / NOT INTEGRATED |
| Project | NOT INTEGRATED |
| Right | NOT INTEGRATED |

Goods First Slice 的业务规则已经冻结，但 Goods 的代码、API、Schema、Migration 和消费者交易路径仍未实施。不得把业务基线批准误报为已接入运营。

## Explicit exclusions and implementation boundary

本决定不授权：

- Goods API、Schema、Migration、Consumer 页面、Creator 管理路径或 Admin Operations；
- Personal Commercial Homepage 代码改造；
- 商品支付系统、物流系统、Marketplace、库存系统或真实资金操作；
- Production、Pilot 或其他外部运营。

Goods 后续代码实施必须由 Main Controller 在本决定整合完成后另行启动 PCI-PD-009。本决定保留既有 Service、Membership、Program Founder Decisions，不修改 Conceptual Baseline 41、D01–D12、F01–F04 或 Decision 47。

## Control status

```text
GOODS STRATEGIC POSITION          = FOURTH OPERATIONAL SCENARIO
GOODS FIRST SLICE BUSINESS RULES  = FOUNDER APPROVED / F01-F09 FROZEN
GOODS OPERATIONAL INTEGRATION     = NOT INTEGRATED
GOODS IMPLEMENTATION              = NOT AUTHORIZED BY PCI-DOC-006
PERSONAL HOMEPAGE                 = PRIMARY GOODS PRESENTATION / DECISION 47 APPLIES
INVENTORY                         = NOT AUTHORIZED
PAYMENT / REAL MONEY              = NOT AUTHORIZED / REAL_MONEY_ENABLED = false
PROJECT / RIGHT                   = NOT INTEGRATED
PRODUCTION / PILOT                = NOT AUTHORIZED
```
