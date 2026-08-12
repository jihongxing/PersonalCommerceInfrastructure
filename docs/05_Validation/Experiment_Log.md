# Experiment Log

> 状态：Living Document  
> 创建日期：2026-08-11  
> 文档角色：统一登记 Hypothesis、Experiment、Result 和 Decision Impact  
> 更新规则：每个实验从 Proposed 开始，在 Result Recorded 后必须链接到新的或修订后的 Decision
> PMF 解释规则：以 `12 PMF & Validation Framework` 的 Evidence Hierarchy、Threshold Framework 和 Failure Interpretation 为准。

## 1. Purpose

本日志承接项目文档中的 Experiment 候选，建立：

```text
Observation
→ Hypothesis
→ Decision
→ Experiment
→ Result
→ Decision Revision
→ Product Evolution
```

未经真实行为验证的判断不能因为被写入文档而自动成为事实。

## 2. Status

| 状态             | 含义                                   |
| ---------------- | -------------------------------------- |
| Proposed         | 已提出，尚未具备执行条件               |
| Ready            | 已定义 Cohort、Method、Metric 和负责人 |
| Running          | 已开始采集数据                         |
| Result Recorded  | 已记录结果和限制                       |
| Decision Applied | 结果已更新相关 Decision                |
| Cancelled        | 实验不再值得执行，并记录原因           |

## 3. Evidence Strength

| 等级 | 证据                     |
| ---: | ------------------------ |
|    1 | 团队判断或二手信息       |
|    2 | 用户口头表达             |
|    3 | 用户投入时间完成设置     |
|    4 | 用户公开发布或分发       |
|    5 | 真实商业动作             |
|    6 | 真实付款或确认交易       |
|    7 | 重复交易或 Repeat Supply |
|    8 | 留存与主动 Referral      |

结果应标注最高证据等级，不能用低等级证据支持高强度结论。

## 4. Experiment Template

每个实验必须记录：

```text
ID
Source Document
Status
Owner
Start Date
End Date
Hypothesis
Cohort
Method
Primary Signal
Secondary Signals
Guardrails
Success Threshold
Result
Evidence Strength
Limitations
Decision Impact
Related Decision
Next Action
```

## 5. Master Register

### Product Experiments

| ID      | Experiment                       | Status   | Related Decision |
| ------- | -------------------------------- | -------- | ---------------- |
| E-09-01 | Creator Publish                  | Proposed | D-09-03          |
| E-09-02 | Creator Distribution             | Proposed | D-08-04、D-11-07 |
| E-09-03 | First Commerce Primitive         | Proposed | D-08-03、D-09-05 |
| E-09-04 | Event vs Experience vs Service   | Proposed | D-09-06          |
| E-09-05 | Price Disclosure                 | Proposed | D-09-08          |
| E-09-06 | Booking Mode                     | Proposed | D-08-08          |
| E-09-07 | Accountless Buyer                | Proposed | D-09-04          |
| E-09-08 | External vs Internal Transaction | Proposed | D-09-06、D-10-03 |
| E-09-09 | Cross-archetype Portability      | Proposed | D-08-06          |
| E-09-10 | Repeat Supply                    | Proposed | D-11-02          |

### Economic Experiments

| ID      | Experiment                   | Status   | Related Decision |
| ------- | ---------------------------- | -------- | ---------------- |
| E-10-01 | Willingness to Share Revenue | Proposed | D-10-01          |
| E-10-02 | Take Rate Sensitivity        | Proposed | D-10-04          |
| E-10-03 | Fee Bearer                   | Proposed | D-10-05          |
| E-10-04 | Platform Value Lift          | Proposed | D-10-03          |
| E-10-05 | Revenue per Active Creator   | Proposed | D-10-06          |
| E-10-06 | Contribution Margin          | Proposed | D-10-07          |
| E-10-07 | Off-platform Leakage         | Proposed | D-10-08          |
| E-10-08 | Multi-product Economics      | Proposed | D-08-02、D-10-06 |
| E-10-09 | SaaS Trigger                 | Proposed | D-10-08          |
| E-10-10 | Inquiry Economic Value       | Proposed | D-10-09          |

### GTM Experiments

| ID      | Experiment              | Status   | Related Decision |
| ------- | ----------------------- | -------- | ---------------- |
| E-11-01 | ICP Segment             | Proposed | D-11-03          |
| E-11-02 | Founder Direct          | Proposed | D-11-05          |
| E-11-03 | Community Acquisition   | Proposed | D-11-05          |
| E-11-04 | Studio / Crew Partner   | Proposed | D-11-05          |
| E-11-05 | Event Acquisition       | Proposed | D-11-05          |
| E-11-06 | Concierge vs Self-serve | Proposed | D-11-06          |
| E-11-07 | Distribution Asset      | Proposed | D-11-07          |
| E-11-08 | Distribution Channel    | Proposed | D-11-07          |
| E-11-09 | Value Proposition       | Proposed | D-11-03          |
| E-11-10 | Referral after Value    | Proposed | D-11-09          |

## 6. Recommended First Experiment Stack

不应同时运行全部 30 个实验。

第一轮建议按依赖顺序执行：

### Step 1 — Supply

1. E-11-01 ICP Segment；
2. E-11-02 Founder Direct；
3. E-09-01 Creator Publish；
4. E-11-06 Concierge vs Self-serve。

回答：

- 找谁；
- 能否招募；
- 能否发布；
- 需要多少人工。

### Step 2 — Distribution

1. E-09-02 Creator Distribution；
2. E-11-07 Distribution Asset；
3. E-11-08 Distribution Channel；
4. E-11-09 Value Proposition。

回答：

- Creator 是否愿意分享；
- 分享什么；
- 分享到哪里；
- 何种价值信息有效。

### Step 3 — Commerce

1. E-09-03 First Commerce Primitive；
2. E-09-04 Event vs Experience vs Service；
3. E-09-06 Booking Mode；
4. E-09-08 External vs Internal Transaction。

回答：

- 哪种供给最容易成交；
- 第一交易流程需要多深；
- 平台内交易是否必要。

### Step 4 — Economics

1. E-10-01 Willingness to Share Revenue；
2. E-10-04 Platform Value Lift；
3. E-10-05 Revenue per Active Creator；
4. E-10-06 Contribution Margin。

回答：

- 是否可以收费；
- 是否创造增量价值；
- 一个 Creator 值多少钱；
- 交易是否有正贡献。

### Step 5 — Retention

1. E-09-10 Repeat Supply；
2. E-10-07 Off-platform Leakage；
3. E-11-10 Referral after Value；
4. 后续 `12 PMF & Validation Framework` 的 Retention 实验。

回答：

- Creator 为什么留下；
- 交易是否留在平台；
- 是否产生有机 Referral。

## 7. Result Entries

尚无已执行实验。

结果不得覆盖原始 Hypothesis，应在下方追加。

### Result Template

#### Result — E-XX-XX

- **Status**：
- **Owner**：
- **Dates**：
- **Cohort**：
- **Method**：
- **Primary Result**：
- **Secondary Results**：
- **Evidence Strength**：
- **Limitations**：
- **Decision Impact**：
- **Related Decision Updated**：
- **Next Action**：

## 8. Operating Rules

1. 一个 Experiment 只回答一个主要问题；
2. Success Threshold 必须在运行前定义；
3. 不以口头喜欢替代行为；
4. 不以页面访问替代商业动作；
5. 不以 Estimated GMV 替代真实交易；
6. 不隐藏失败 Cohort；
7. 不用少数头部 Creator 代表中位数；
8. Founder 人工必须记录；
9. Result 必须包含限制条件；
10. 每个 Result 必须影响 Decision、后续 Experiment 或停止事项。
