# 29 — Identity 持有 C 号的产品决策

> 状态：Founder 已批准；本地实施和迁移已验证，其他环境须独立迁移
> 变更单元：DEV-061 / IDENTITY-OWNED-COMMERCE-REFERENCE
> 决策日期：2026-11-08

## 决策

一个 PCI Internal Identity 拥有且只拥有一个 Commerce Reference（C 号）。C 号在该
Identity 的整个生命周期内保持不变，不可选择、转移、重新分配或复用。Identity 可以拥有多个
Commerce Profile，这些 Profile 表达同一个 Identity 的不同商业资料，不各自签发 C 号。

C 号是跨平台传播的公开引用，不是账号、认证凭据、所有权证明、内部主键或授权依据。Account、
Identity 和 Commerce Profile 仍是不同概念；更换登录方式或编辑商业资料不改变 C 号。系统不能
仅凭邮箱去重证明多个账号属于同一个自然人。身份合并、账号找回和历史多号码纠错必须另行决策。

本决策取代既有文档中 C 号属于 Profile、每个 Profile 分配独立 C 号的规定。规范字符集、18 位
长度、无偏 CSPRNG、数据库唯一性、碰撞重试及不可复用规则保持有效。Profile 归档不改变 Identity
及其 C 号。本地实施和迁移证据见执行记录 DEV-061。

## 冲突处理

历史数据必须先按 Profile 的 owner Identity 盘点。一个 Identity 存在多个已分配 C 号时，任何
自动化都不得选择、改写、合并、释放、重新分配或删除号码；保留全部原始记录并停止该批迁移，
待单独决策。历史上不存在号码的 Identity 不应被错误地显示为已分配。外部公开解析与资料披露
仍需独立设计；C 号不会自动授权公开任何资料。

## 数据库与接口切换方案

现有 `commerce_references` 是唯一的已签发号码登记簿，继续保留原始号码、生命周期和时间；
不能另建独立号码空间。添加指向 `identities.identity_id` 的 ownership 外键，并在完成历史盘点
后对 owner 加唯一及非空约束。每条现有记录通过原 Profile 的 `owning_identity_id` 映射；原
Profile 关联保留为历史证据，不作为新的所有权或公开资料选择依据。数据库需阻止号码及 owner
修改、记录删除和释放；增加约束前必须核查并处置对这些操作的现有合法调用。

上线前备份并验证恢复；暂停旧版签发写入，在事务中检查缺失 Profile、缺失 Identity、同一
Identity 的多个号码、无效号码与不一致生命周期。存在冲突则整批回滚并输出可审计的冲突记录，
不得自动选取号码。无冲突时回填 owner，验证行数与映射，再建立外键、唯一、非空及不可变
约束。迁移前后比较每个号码、原 Profile、状态和时间，验证已签发号码集合完全一致。回滚需
先停写并恢复经过验证的备份；一旦新版本签发新号码，不得直接恢复旧备份，否则会遗失号码，
必须先冻结并保全新签发登记簿，再制定恢复和合并措施。版本化 SQL 和冲突回滚已在隔离
PostgreSQL 上验证。本地数据库已执行迁移；其他环境必须独立执行盘点、备份、恢复验证和
迁移，发生历史多号码冲突时停止并单独决策。

认证后的推荐读取接口为 `GET /api/v1/private/identity/reference`，由服务端 Account 解析当前
Identity，不接受调用方指定 owner。响应沿用 `ASSIGNED`（canonical 和展示值）或
`NOT_ASSIGNED`，迁移未完成和数据库异常返回明确错误，不伪装为未分配。旧 Profile 路由在
验证 Profile 所属 Identity 后可以兼容性地返回该 Identity 的号码，先更新客户端、OpenAPI 和
测试，再确定废弃时间。Profile 创建不能继续签发 C 号。公开 resolver 不得仅凭号码披露全部
Profile；公开页面及资料选择规则需独立决策。原先依靠历史 Profile 外键推断公开资料的
`GET /api/v1/public/creator-profile/:commerceRef` 已从正式 API 注销，该路径目前返回 404；
已有使用方需要另行迁移，不能将其视为兼容保留。

## 注册接入方案

注册后按认证 Account 创建或读取 Identity，由 Identity 初始化用例在事务内读取已有号码；
缺失时使用现有 `randomInt` 生成器签发，依靠数据库唯一约束解决并发，并仅对号码碰撞做有限
重试。Identity 唯一冲突应重新读取同一 Identity 的已提交号码；失败时保留明确可重试状态，
不得将错误当作无号码，也不得重新生成已经提交的号码。当前账号和会话早于工作台初始化
提交，注册可能返回 `setupPending`；要么维持该语义并确保自动恢复，要么重设计事务边界，
但不能声称注册成功必有号码而忽略初始化失败。历史未分配 Identity 的补齐使用同一幂等用例，
并单独记录审计结果；同一自然人多个 Identity 的合并不在此方案内。

验收覆盖新用户、并发初始化与重试、随机碰撞、数据库中断与恢复、已有号码保留、多 Profile
共享、Profile 改名/归档、跨账号权限、历史冲突与回滚，以及真实 PostgreSQL 和浏览器流程。
