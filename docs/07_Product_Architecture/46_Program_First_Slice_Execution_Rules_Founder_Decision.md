# 46 — Program First Slice Execution Rules Founder Decision

> **Decision ID**：`FD-PCI-PROGRAM-FIRST-SLICE-EXECUTION-RULES-001`
> **状态**：`FOUNDER APPROVED / FROZEN`
> **登记日期**：2026-11-19
> **批准来源**：Founder 指令 **PCI-PD-007 — Program Third Operational Scenario Implementation**

本补充决定只规定首期 Program 的执行规则，作为 [45 — Program First Slice Founder Decision](45_Program_First_Slice_Founder_Decision.md) 的实施补充。它不改写 45，不建立六类供给统一生命周期，不授权其他商业场景实施，也不授权生产、外部 Pilot 或真实资金。

## E01 — Enrollment Application 名额占用

- 消费者提交 Enrollment Application 后，暂时占用一期 Program 的名额。
- 提供方审批通过后，待审批申请转化为确认 Enrollment，名额继续由该参与者占用。
- 提供方审批拒绝后，释放该申请预留名额。
- 消费者撤回待审批申请后，释放该申请预留名额。
- 同一参与者重复申请、重复审批不得重复占用名额。
- 名额总量由服务端在事务中保证。

## E02 — 已确认参与者主动退出

- 首场开始之前，已确认参与者可以退出并释放名额。
- 首场开始之后，可以记录参与者退出。
- 首场开始之后退出的参与者，不允许由新参与者补入。
- 已发生的场次和参与事实必须保留。
- 已确认 Enrollment 的退出与待审批 Enrollment Application 的撤回是不同业务事实。
- 首场开始边界使用服务端时间和该首场当前有效的计划开始时间判断。场次变更后，判断使用更新后的有效安排。

## E03 — 提供方取消整期 Program

- 提供方可以取消整个 Program Run / Cohort。
- 系统记录一期取消事实，并保留 Run、Enrollment、Session Delivery、Participation 和历史记录。
- 取消不自动延期，不自动创建或重建下一期。
- 取消不删除、重写或伪造已经发生的履约事实。
- 取消的一期不能标记为正常完成。

## E04 — Session 变更

- 提供方可以变更计划场次。
- 每次变更记录变更原因、原安排、新安排、操作人、操作时间和关联一期。
- 相关参与者可以读取当前有效安排及变更记录。
- 场次变更不要求参与者重新申请 Enrollment。
- 场次变更不自动改变已经发生的 Participation 或 Absence。
- 本规则不要求外部通知平台或推送服务。

## E05 — Admin 暂停

- Admin 暂停 Program 场景时，只阻止新的 Enrollment Application。
- 暂停前已提交的待审批申请继续允许提供方审批或拒绝。
- 已确认的 Program Run 继续履约。
- 暂停不自动取消已确认 Enrollment。
- 暂停不改变历史场次、参与、缺席和结束事实。
- 恢复后，重新允许符合规则的新申请。
- Program 暂停策略不自动复制为 Membership 暂停策略。

## 执行边界

本补充决定要求 Program 保持独立的 Offering、Run、Enrollment Application、Enrollment、Session、Participation、Absence 和 Completion 语义。首期仍为免费线下 Program，不产生 Payment fact，`REAL_MONEY_ENABLED = false`。它不把 Enrollment 变成 Membership Relationship 或 Right Grant，也不要求证书、学分、候补、补课、自动支付、退款、通知平台或线上交付。
