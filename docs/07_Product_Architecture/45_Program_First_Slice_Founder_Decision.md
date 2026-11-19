# 45 — Program First Slice Founder Decision

> **Decision ID**：`FD-PCI-PROGRAM-FIRST-SLICE-001`
> **状态**：`FOUNDER APPROVED / FROZEN`
> **登记日期**：2026-11-19
> **批准来源**：Founder 指令 **PCI-DOC-005 — Program First Slice Founder Decision & Mainline Synchronization**

本决定正式采纳 [PCI-PD-006 — Program Third Operational Scenario Decision Package](../08_Execution/PCI-PD-006-Program-Third-Operational-Scenario-Decision-Package.md) 的首期业务方案。Program 是 PCI 的第三个运营场景，但本决定只冻结首期商业规则，不表示 Program 已经接入运营，也不授权本决定内的代码、API、Schema、Migration、生产、Pilot 或真实资金实施。

本决定与 [Conceptual Baseline 41](41_Global_Commercial_System_Conceptual_Baseline.md)、[Commercial Scenario Sequencing](42_Commercial_Scenario_Sequencing_Founder_Decision.md)、F01–F04、D01–D12 及既有 Service / Membership 合同共同适用。它不建立六类供给的统一生命周期或通用架构。

## 1. 当前场景状态

| 场景 | 当前状态 |
|---|---|
| Service | `FIRST OPERATIONAL SLICE INTEGRATED` |
| Membership | `SECOND OPERATIONAL SLICE INTEGRATED / ACCEPTED` |
| Program | `THIRD SCENARIO / BUSINESS BASELINE APPROVED / NOT INTEGRATED` |
| Goods | `NOT INTEGRATED` |
| Project | `NOT INTEGRATED` |
| Right | `NOT INTEGRATED` |

Program 的战略选择和首期业务基线已经批准；Program 的运营路径和实现仍未开始。

## 2. F01 — 首期 Program 商业模式

首期 Program 采用：

- 单一提供方负责一期 Program；
- 线下交付；
- 短周期、固定期限；
- 多个预先安排的场次；
- 有限参与名额；
- 具体一期使用独立的 `Program Run / Cohort` 语义。

首期不包括多提供方联合交付、通用课程市场、线上会议、直播平台或大型 LMS。

## 3. F02 — Offering、Run 与 Enrollment

以下业务语义保持独立：

- **Program Offering**：可发布、可发现的 Program 供给。
- **Program Run / Cohort**：具体一期，具有自己的期限、提供方、地点、场次和名额。
- **Enrollment Application**：消费者针对具体一期提交的参加申请。
- **Enrollment**：提供方审批通过后形成的参与关系。

消费者提交 Enrollment Application 后，由提供方审批；审批通过后才确认参与资格。Program Enrollment 不得复用 Membership Relationship，也不得自动解释为 Right Grant。

后续实现必须防止同一参与者的重复申请或重复确认导致错误占用名额。具体实现方式不在本决定中确定。

## 4. F03 — 名额与报名

首期规则为：

- 每期设定固定容量；
- 满额后关闭报名；
- 首期不支持候补名单；
- 参与者必须经过提供方审批才能确认 Enrollment；
- 容量必须由服务端保证，不得只依赖前端判断。

名额在何时被占用，以及待审批申请是否临时占用名额，仍是实施前的待决细则。不得由工程人员自行推断；如影响实现，应提交后续 Founder 裁决。

## 5. F04 — 免费与资金边界

首期 Program 免费参与：

- PCI 不为首期 Program 收款；
- 首期不产生 Payment fact；
- 不执行退款、结算、分账或其他真实资金操作；
- `REAL_MONEY_ENABLED = false`。

本免费政策只适用于首期 Program，不代表未来所有 Program 永远免费，也不修改其他商业供给类型的收费政策。

## 6. F05 — Session 与履约事实

每期 Program 包含多个预先安排的 Session。提供方必须能够记录每个计划场次是否：

- 实际开展；
- 取消；
- 变更。

对每位已确认参与者，在每个计划场次分别记录 `Participation` 或 `Absence`。`Session Delivery`、`Participation` 和 `Absence` 是不同的业务事实。缺席只记录事实，不自动处罚；首期不支持补课。

每次场次参与不得自动创建 Service Order，也不得把 Program 强行表达为 Service Reservation 或 Membership Admission。

## 7. F06 — Program 结束与参与者完成

- 一期 Program 在最后一个计划场次结束后进入结束处理；
- 由提供方确认一期结束；
- 由提供方确认参与者是否完成；
- 每场实际出席记录与参与者完成结果分别保存；
- 不依据未经批准的出席率阈值自动授予完成资格。

首期不颁发证书、学分、成绩、排名、徽章或其他资格凭证。一期 Program 已结束，不代表所有参与者必然完成。

## 8. F07 — 取消、变更与缺席边界

批准的边界为：

- 场次实际开展、取消或变更必须能够记录；
- 缺席只记录，不自动处罚；
- 首期不支持补课；
- 不自动产生退款、补偿或资金权益；
- 不支持参与资格转让。

以下操作细则尚未被 Founder 单独定义，不得自行补造：

1. 消费者能否主动取消或退出、允许的时间范围及名额释放方式；
2. 提供方取消整期 Program 时的处理流程；
3. 场次变更是否需要参与者重新确认；
4. 已确认参与者在整期取消或延期后的 Enrollment 结果；
5. 具体通知义务及通知渠道。

在后续实现前，主控应根据实际首期场景确认是否需要进一步裁决。

## 9. F08 — Admin 暂停与恢复

批准的 Operations Control Plane 边界为：

- Admin 可以暂停或恢复 Program 场景；
- 暂停后阻止新的 Program 报名；
- 暂停不自动取消已确认 Enrollment；
- 暂停不修改已发生的 Session Delivery、Participation 或 Absence 历史事实；
- 恢复后重新开放符合条件的报名入口。

待审批 Enrollment 在暂停时如何处理，以及暂停前已打开的一期 Program 是否继续履约，尚未被本决定完全定义。不得未经批准照搬 Membership 的暂停细则。实际启用必须遵守 Operations Human 授权、服务端持久化、审计和安全边界。

## 10. 与既有领域的独立边界

- Service 继续使用其既有 Service Offering、Customer Request、Order、Commitment 和 Fulfillment 语义。
- Membership 继续使用其既有 Membership Offering、Application、Relationship、Validity、Verification 和 Admission 语义。
- Program 使用独立的 Offering、Run、Enrollment、Session、Participation 和 Completion 语义。
- 可复用通用身份、权限、提供方归属、审计、持久化、事件和 Operations Control Plane 工程机制，但不得因此合并业务模型。
- Program Enrollment 不等同于 Membership Relationship 或 Right Grant。

本决定不修改 Conceptual Baseline 41、D01–D12、F01–F04，不创建全局通用生命周期或通用 Enrollment 模型。

## 11. 明确排除范围

本决定不批准：

- 付费 Program、平台收款、真实支付、退款、结算、分账或自动资金操作；
- 多提供方联合交付；
- 线上会议、直播、录播或大型 LMS；
- 复杂排课系统、候补名单、补课或参与资格转让；
- 证书、学分、成绩、评级、排名、徽章或其他资格凭证；
- 会员权益、积分、奖励或 Right Grant；
- 通用六类供给生命周期；
- 生产部署或外部 Pilot。

以上事项不得在后续 Program 实施任务中未经 Founder 单独批准而加入。

## 12. 后续实施验收方向

后续 Program 实施任务至少应证明：

1. 提供方能够创建和发布独立 Program Offering。
2. 能够创建具有期限、地点、容量和多场次安排的 Program Run。
3. 消费者能够针对具体 Run 提交 Enrollment Application。
4. 提供方能够审批或拒绝申请。
5. 服务端能够防止名额超额及重复确认。
6. 每个计划 Session 能记录实际开展、取消或变更。
7. 每位已确认参与者能够逐场记录 Participation 或 Absence。
8. 一期 Program 能正确结束，提供方能确认参与者完成结果。
9. Admin 能暂停新的 Program 报名，且不破坏已有确认关系及历史事实。
10. 相关行为具备适当的权限、持久化、审计和关联追溯。
11. Service 与 Membership 已交付行为不回归。
12. Goods、Project、Right 继续保持 `NOT INTEGRATED`。

以上是后续实施的业务验收方向，不是本决定的实施授权。

## 13. 控制状态

```text
PROGRAM STRATEGIC POSITION       = THIRD OPERATIONAL SCENARIO / APPROVED
PROGRAM BUSINESS BASELINE        = FOUNDER APPROVED / FROZEN
PROGRAM OPERATIONAL INTEGRATION  = NOT INTEGRATED
PROGRAM IMPLEMENTATION            = NOT AUTHORIZED BY THIS DECISION TASK
SERVICE                          = FIRST OPERATIONAL SLICE INTEGRATED
MEMBERSHIP                       = SECOND OPERATIONAL SLICE INTEGRATED / ACCEPTED
GOODS / PROJECT / RIGHT          = NOT INTEGRATED
PRODUCTION READINESS              = NOT VERIFIED
EXTERNAL PILOT                    = NOT AUTHORIZED
PRODUCTION DEPLOYMENT             = NOT AUTHORIZED
REAL_MONEY_ENABLED                = false
```
