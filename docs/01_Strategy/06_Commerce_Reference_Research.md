# 06 — Commerce Reference 跨平台传播研究

> **状态**：FOUNDER DECISION FROZEN（Founder 决策已冻结）
> **研究编号**：`PCI-RESEARCH-001`
> **查询日期**：2026-08-26
> **权威**：Main Control / Founder
> **范围**：仅限研究与产品设计；不构成实现授权
> **阶段**：`STAGE_3 = NOT_AUTHORIZED`

## 1. 研究问题

PCI 需要一个属于 `Commerce Profile` 的公共商业引用标识，使用户无需 HTTP URL、域名、
第三方平台 handle 或平台命名空间，也能传播自己的商业身份：

```text
Commerce Profile
    ↓
Commerce Reference
```

示例：

```text
3C7M4Q9RDFHJKNTWVY
```

预期传播场景包括：TikTok / 抖音简介、Bilibili 主页、X 主页、YouTube 描述、Instagram
简介、Facebook 页面、视频描述、置顶评论、图片、海报、线下活动、印刷卡片及口头介绍。

该标识明确不是：

```text
Commerce Reference ≠ Identity ID
Commerce Reference ≠ Account ID
Commerce Reference ≠ External Platform Account ID
Commerce Reference ≠ Creator Actor ID
Commerce Reference ≠ Commerce Object ID
Commerce Reference ≠ URL
Commerce Reference ≠ Secret / Credential / Authentication Factor
```

## 2. 现有 PCI 方向审计

当前冻结的 Product Direction 与 ADR 已定义：

```text
Identity → Commerce Profile → Commerce ID → External Platform Account
                                  ↓
                           Commerce Objects

1 Identity : N Commerce Profiles
1 Commerce Profile : 1 stable Commerce ID
1 Commerce Profile : N External Platform Accounts
```

历史上已提出、但尚未进入运行时实现的 Commerce ID 方向为：

```text
C-XXXXXXXX

Public      = Yes
Stable      = Yes
Immutable   = Yes
Reusable    = Never
Sequential  = No
Credential  = No
```

其核心语义仍然正确：

1. 公共商业引用属于 `Commerce Profile`，不属于 Identity、Account、External Platform
   Account 或 Commerce Object；
2. 它应当是 opaque、公开、稳定、不可变、非顺序、永不复用且非凭证的标识。

但历史格式已不适合作为新的跨平台传播格式。8 位 Base32 后缀的理论空间为
`32^8 = 1.0995e12`；在随机分配模型下，签发达到 10B 时，至少出现一次生成碰撞的概率
已接近 100%。`C-` 中的连字符也不会增加身份表达能力，口述时容易遗漏，且不如纯字母数字
格式适合 OCR、海报和平台简介。

### 2.1 既有 Commerce ID 结论

```text
Decision: REPLACE

旧语义：
Commerce Profile 的稳定公共标识。

建议的新语义：
可脱离 URL、域名和第三方平台命名空间独立传播的 Commerce Profile 公共商业引用。

迁移需要：
无。Commerce ID 的生成、持久化、查询、UI、API 和公共 resolver 均尚未实现。

兼容性影响：
仅影响未来文档、契约和设计；历史 C-XXXXXXXX 示例不应形成运行时兼容义务。
```

这是研究建议，不修改冻结的 Product Direction 或 ADR。

## 3. 外部平台研究

### 3.1 方法、日期与来源等级

查询日期为 **2026-08-26**。来源等级如下：

| 等级 | 含义 |
| --- | --- |
| A | 平台官方 Help Center、Terms 或开发者/API 文档 |
| B | 平台官方公开产品表面、官方 URL 行为 |
| C | 社区或第三方材料；本研究不以其作为 PCI 契约的唯一依据 |

| 平台 | 官方来源 / 查询 | 等级 | 关键结论 |
| --- | --- | --- |
| TikTok | [TikTok Support — Changing your username](https://support.tiktok.com/en/getting-started/setting-up-your-profile/changing-your-username) | A | Username 是平台 Profile 设置，可变更，并影响 TikTok profile link。 |
| TikTok | [TikTok for Developers — Get User Information](https://developers.tiktok.com/doc/tiktok-api-v2-get-user-information/) | A | `open_id` 等字段属于 TikTok 应用/API 范围的平台标识，不是可移植的公共商业引用。 |
| Bilibili | [Bilibili Open Platform](https://open-api.bilibili.com/) | A，访问受限 | 研究浏览器无法取得可用官方正文；不得据此虚构 UID 格式或变更规则。 |
| Bilibili | 官方产品公开页面常见 `space.bilibili.com/{mid}` 形式 | B | `mid` / UID 是 Bilibili 命名空间中的平台标识，即使可公开也不适合作为 PCI 的跨平台锚点。 |
| X | [X Help — X username rules](https://help.x.com/en/managing-your-account/x-username-rules) | A，访问受限 | 官方页被反自动化响应拦截；本研究不对具体长度、频率等规则作超出证据的断言。 |
| X | [X API user object](https://developer.x.com/en/docs/x-api/data-dictionary/object-model/user) | A | API 有独立的 user `id` 与 username；两者均为 X 管理的账户属性。 |
| YouTube | [YouTube Help — Learn about YouTube handles](https://support.google.com/youtube/answer/11585688) | A | Handle 唯一、以 `@` 开头、可出现在评论/提及/Shorts；YouTube 可变更、收回或移除 handle。 |
| YouTube | [YouTube Data API — Channels resource](https://developers.google.com/youtube/v3/docs/channels) | A | Channel ID 是平台资源 ID，与面向人的 handle 分离。 |
| Instagram | [Instagram Help — Change your username](https://help.instagram.com/583107688369069) | A，内容访问受限 | Username 属于 Instagram 账户产品属性；浏览器无法暴露足够可读正文。 |
| Instagram | [Instagram Platform — API overview](https://developers.facebook.com/docs/instagram-platform/) | A | Instagram API user ID 属于 Meta/Instagram 平台对象范围。 |
| Facebook | [Facebook Help — Usernames](https://www.facebook.com/help/105399436216001) | A，内容访问受限 | Username 属于 Facebook 的账户/页面命名空间属性。 |
| Facebook | [Graph API — User](https://developers.facebook.com/docs/graph-api/reference/user/) | A | Graph object ID 是 Meta 平台 ID，不是独立公共商业引用。 |

“访问受限”不降低来源本身的官方等级；其含义是研究浏览器无法读取足够正文。因此本文只记录
可证实的边界，不捏造具体格式规则。任何未来平台集成授权前，必须再次核验当时有效的官方契约。

### 3.2 Username / Handle 与 User ID 对比

| 平台 | Username / Handle | User ID | PCI 结论 |
| --- | --- | --- | --- |
| TikTok | 可作为纯文本传播并出现在 Profile URL；平台控制且可变。 | `open_id` 等 opaque API ID。 | 均绑定 TikTok 账户与 TikTok 命名空间。 |
| Bilibili | 显示名/主页表达位于 Bilibili 命名空间；具体规则应在集成前重新查证。 | 公开主页常见 numeric `mid` / UID。 | UID 即使公开也仍是平台拥有、平台绑定的标识。 |
| X | `@username` 为 X 主页中的文本 handle；本次未取得足够官方格式细节。 | X API user `id` 与 username 分离。 | 两者都依赖 X 持续存在与 X 的规则。 |
| YouTube | 唯一 `@handle`；常见文字体系为 3–30 字符；不区分大小写；可含 `_`、`-`、`.`；YouTube 可变更/收回/移除。 | Channel ID 为平台资源 ID。 | handle 明确受平台治理，Channel ID 不适合人工商业传播。 |
| Instagram | `@` 风格账户名，位于 Instagram 命名空间并常出现在 Profile URL。 | Meta/Instagram API user ID。 | 均非 PCI 拥有的 Commerce Profile 锚点。 |
| Facebook | Username 是 Facebook 账户/页面命名空间属性，可在 Profile URL 中出现。 | Graph API user/page ID。 | 均由 Facebook 控制，不能承担跨平台连续性。 |

### 3.3 为什么 PCI 不应让用户传播平台 username、UID 或 handle

| 必须分析项 | 研究结论 |
| --- | --- |
| Platform dependency | 平台标识由平台签发、解释和治理。若用其作为 PCI 正式商业锚点，PCI 会把自己的连续性外包给第三方。 |
| Namespace collision | `@alice`、`alice`、数字 UID 仅在明确平台内有意义；同一文本可在不同平台属于不同主体。 |
| Mutability | 平台可允许修改、自动分配、回收或移除标识。YouTube 官方明确保留变更、收回或移除 handle 的权利。 |
| Account replacement | 创作者可因失号、恢复、重建、替换或迁移平台账户而保留同一 Commerce Profile。 |
| Account suspension | 第三方平台账户暂停或删除，不应抹除 PCI 已定义的商业引用。 |
| Platform migration | 创作者可以增减或迁移平台，不应因此重新印刷名片、海报或改变口头介绍。 |
| Cross-platform identity continuity | 一个 Commerce Profile 可关联 N 个 External Platform Account；平台账户属性只能是附属关系，不能成为 PCI 中立锚点。 |

## 4. URL 独立性与传播场景

推荐的 Commerce Reference 不要求：

```text
https://
domain
/c/
@handle
platform namespace
```

未来可存在一个独立于标识本身的可选查询机制：

```text
Commerce Reference
    ↓
PCI app search / QR / future public resolver / platform-specific integration
```

Reference 本身不是 URL；即使尚未存在 resolver、域名或公开 Web 页面，它也必须可以被传播和
被识别。

| 场景 | 适合度 | 结论 |
| --- | --- | --- |
| TikTok / Bilibili / X / Instagram / Facebook Bio | 高 | 固定长度的大写纯文本可贴近姓名放置，不依赖可点击 URL。 |
| YouTube 描述 | 高 | 适合复制、粘贴、文本搜索；分组显示有利于扫描。 |
| 视频描述 / 置顶评论 | 高 | 相比单一平台链接，固定引用在转发和跨平台搬运中更稳定。 |
| 图片 / 海报 | 高 | 可配合 QR；大写固定长度文本适合 OCR，前提是保证字体和对比度。 |
| 线下活动 / 印刷卡片 | 高 | 迁移平台时无需更新已印刷材料。 |
| 口头介绍 | 中 | 可分组朗读，但 18 位字符串仍需明确逐组复述。 |
| 手写 | 中 | 必须排除易混淆字形；未来可评估 check character。 |
| 当前仅靠搜索、不存在 PCI 查询入口 | 低 | 标识只有在未来获得批准的搜索或解析面存在时才可被实际解析；本研究不授权该能力。 |

## 5. 候选编码家族

### A. 纯十进制（Pure Decimal）

示例：

```text
81374620591348271
```

优点：所有平台文本兼容、逐位朗读直接、无字母大小写问题。

缺点：每位仅提供 `log2(10) ≈ 3.322` bits；为取得同等随机空间必须明显加长。它还容易被解释为
电话号码、订单号、支付/金融参考号、验证码、物流单号或优惠码。前导零规则必须明确。顺序数值
ID 会泄漏签发顺序并降低枚举成本；随机数值 ID 仍必须有数据库唯一约束与查询滥用控制。

结论：技术上可行，但不推荐作为 PCI 的主跨平台传播标识。

### B. 十六进制（Hexadecimal）

示例：

```text
C8A41F73D29B
```

每位 4 bits，软件系统友好，但更像数据库 hash 或设备码而非人类商业引用。它仍保留
`0/O`、`1/I`、`5/S`、`6/G`、`8/B` 等视觉混淆。

历史 `C-XXXXXXXX` 的问题并不只是连字符。其本质是短 Base32 公开空间不足，且 `C-` 在口述、
截图、OCR 或人工复制时容易被省略或误当作显示分隔符。

结论：可用于内部调试，不适合作为主要人工传播形式。

### C. 人类导向受限字母数字编码（源自 Base32 家族）

示例：

```text
3C7M4Q9RDFHJKNTWVY
```

本次冻结的字母表：

```text
3479ACDEFHJKMNPQRTVWXY
```

该字母表有 22 个字符。它在原始 32 字符人类导向 Base32 基础上，额外排除易在视觉、OCR、
手写、口述或人工抄录时混淆的 `0`、`1`、`2`、`5`、`6`、`8`、`B`、`G`、`S`、`Z`。
规范公开值仅使用大写 ASCII 字母数字字符。未来输入层是否接受常见误读替代必须另行冻结，
不能隐含实现。

18 位提供约 80.27 bits（`22^18 = 1,457,498,964,228,107,529,355,264`）。它通过
更小的命名空间交换更低的人类混淆风险；实际唯一性仍必须依赖 CSPRNG、数据库唯一约束和
冲突重试。

结论：这是 Founder 已冻结的 Commerce Reference 规范编码方向。

### D. Base58 / 类似字母数字编码

Base58 比 Base32 单位字符容量更高，常排除 `0`、`O`、`I`、`l`。但通常使用混合大小写，
口述、手输和人工校验更困难，并且不同 Base58 alphabet 的具体约定可能不一致。

结论：机器标识表现强，但对 PCI 的公开、口述、人类传播场景不如大写人类导向 Base32。

### E. UUID-like / 时间或随机可排序 ID

示例：

```text
C_01J...
550e8400-e29b-41d4-a716-446655440000
```

UUIDv4、UUIDv7、ULID 等具备优秀唯一性，但长度较长、常含标点或混合大小写、外观像数据库 ID，
不适合作为 Bio、海报或口头介绍的主要引用。时间可排序格式还可能暴露大致创建时间，而这并非
Commerce Profile 公共引用所需。

结论：可作为内部技术标识；不建议作为人类传播的公共 Commerce Reference。

### F. Snowflake-like 纯数字 ID

Snowflake 类 ID 能跨 worker 扩展，但通常编码或暗示时间、顺序、worker、shard 等生成拓扑。
它可预测、利于枚举，并将公开标识绑定到内部生成架构。即使用十进制公开，也仍像数据库 ID。

结论：不应成为公开 Commerce Reference。

## 6. 容量与生日碰撞分析

### 6.1 计算方法

对于 alphabet 大小为 `b`、长度为 `L`：

```text
理论容量 N = b^L

预期随机重复对数 λ ≈ n(n - 1) / (2N)
至少出现一次重复的概率 P ≈ 1 - e^-λ
```

该模型描述的是持久化唯一约束之前的独立随机候选生成。真实实现仍必须依赖数据库唯一约束并在
冲突时重试；概率不能替代正确性。

### 6.2 理论容量

| 编码 | 8 位 | 10 位 | 12 位 | 14 位 | 16 位 | 18 位 | 20 位 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Decimal `10^L` | 1.000e8 | 1.000e10 | 1.000e12 | 1.000e14 | 1.000e16 | 1.000e18 | 1.000e20 |
| Hex `16^L` | 4.295e9 | 1.100e12 | 2.815e14 | 7.206e16 | 1.845e19 | 4.722e21 | 1.209e24 |
| 原始 Base32 `32^L` | 1.100e12 | 1.126e15 | 1.153e18 | 1.181e21 | 1.209e24 | 1.238e27 | 1.268e30 |
| 冻结的 22 字符集 `22^L` | 5.488e10 | 2.656e13 | 1.285e16 | 6.222e18 | 3.012e21 | 1.457e24 | 7.060e26 |
| Base58 `58^L` | 1.281e14 | 4.308e17 | 1.449e21 | 4.875e24 | 1.640e28 | 5.517e31 | 1.856e35 |

### 6.3 Birthday Collision 结果

每格格式为：`λ / 至少一次碰撞概率`；签发量依次为 `1B / 10B / 100B / 1T`。
`~100%` 表示在未重试的随机生成模型中概率已近似确定。

| 编码 / 长度 | 1B | 10B | 100B | 1T |
| --- | --- | --- | --- | --- |
| Decimal 8 | 5.000e9 / ~100% | 5.000e11 / ~100% | 5.000e13 / ~100% | 5.000e15 / ~100% |
| Decimal 10 | 5.000e7 / ~100% | 5.000e9 / ~100% | 5.000e11 / ~100% | 5.000e13 / ~100% |
| Decimal 12 | 5.000e5 / ~100% | 5.000e7 / ~100% | 5.000e9 / ~100% | 5.000e11 / ~100% |
| Decimal 14 | 5.000e3 / ~100% | 5.000e5 / ~100% | 5.000e7 / ~100% | 5.000e9 / ~100% |
| Decimal 16 | 5.000e1 / ~100% | 5.000e3 / ~100% | 5.000e5 / ~100% | 5.000e7 / ~100% |
| Decimal 18 | 5.000e-1 / 39.35% | 5.000e1 / ~100% | 5.000e3 / ~100% | 5.000e5 / ~100% |
| Decimal 20 | 5.000e-3 / 0.499% | 5.000e-1 / 39.35% | 5.000e1 / ~100% | 5.000e3 / ~100% |
| Hex 8 | 1.164e8 / ~100% | 1.164e10 / ~100% | 1.164e12 / ~100% | 1.164e14 / ~100% |
| Hex 10 | 4.547e5 / ~100% | 4.547e7 / ~100% | 4.547e9 / ~100% | 4.547e11 / ~100% |
| Hex 12 | 1.776e3 / ~100% | 1.776e5 / ~100% | 1.776e7 / ~100% | 1.776e9 / ~100% |
| Hex 14 | 6.939e0 / 99.90% | 6.939e2 / ~100% | 6.939e4 / ~100% | 6.939e6 / ~100% |
| Hex 16 | 2.711e-2 / 2.674% | 2.711e0 / 93.35% | 2.711e2 / ~100% | 2.711e4 / ~100% |
| Hex 18 | 1.059e-4 / 0.0106% | 1.059e-2 / 1.053% | 1.059e0 / 65.31% | 1.059e2 / ~100% |
| Hex 20 | 4.136e-7 / 0.0000414% | 4.136e-5 / 0.00414% | 4.136e-3 / 0.4127% | 4.136e-1 / 33.87% |
| Base32 8 | 4.547e5 / ~100% | 4.547e7 / ~100% | 4.547e9 / ~100% | 4.547e11 / ~100% |
| Base32 10 | 4.441e2 / ~100% | 4.441e4 / ~100% | 4.441e6 / ~100% | 4.441e8 / ~100% |
| Base32 12 | 4.337e-1 / 35.19% | 4.337e1 / ~100% | 4.337e3 / ~100% | 4.337e5 / ~100% |
| Base32 14 | 4.235e-4 / 0.0423% | 4.235e-2 / 4.147% | 4.235e0 / 98.55% | 4.235e2 / ~100% |
| Base32 16 | 4.136e-7 / 0.0000414% | 4.136e-5 / 0.00414% | 4.136e-3 / 0.4127% | 4.136e-1 / 33.87% |
| Base32 18 | 4.039e-10 / 0.0000000404% | 4.039e-8 / 0.00000404% | 4.039e-6 / 0.0004039% | 4.039e-4 / 0.04038% |
| Base32 20 | 3.944e-13 / 0.0000000000394% | 3.944e-11 / 0.00000000394% | 3.944e-9 / 0.000000394% | 3.944e-7 / 0.0000394% |
| 冻结 22 字符集 18 | 3.430534e-7 / 0.0000343053% | 3.430534e-5 / 0.00343048% | 3.430534e-3 / 0.342466% | 3.430534e-1 / 29.03997% |
| Base58 8 | 3.904e3 / ~100% | 3.904e5 / ~100% | 3.904e7 / ~100% | 3.904e9 / ~100% |
| Base58 10 | 1.161e0 / 68.67% | 1.161e2 / ~100% | 1.161e4 / ~100% | 1.161e6 / ~100% |
| Base58 12 | 3.450e-4 / 0.0345% | 3.450e-2 / 3.391% | 3.450e0 / 96.83% | 3.450e2 / ~100% |
| Base58 14 | 1.026e-7 / 0.0000103% | 1.026e-5 / 0.00103% | 1.026e-3 / 0.1025% | 1.026e-1 / 9.748% |
| Base58 16 | 3.049e-11 / 0.00000000305% | 3.049e-9 / 0.000000305% | 3.049e-7 / 0.0000305% | 3.049e-5 / 0.00305% |
| Base58 18 | 9.063e-15 / 0.000000000000910% | 9.063e-13 / 0.0000000000906% | 9.063e-11 / 0.00000000906% | 9.063e-9 / 0.000000906% |
| Base58 20 | 2.694e-18 / <1e-12% | 2.694e-16 / 2.22e-14% | 2.694e-14 / 2.69e-12% | 2.694e-12 / 2.69e-10% |

### 6.4 冻结设计的精确容量与碰撞包络

Founder 已冻结长度为 18、字符集大小为 22。本节取代先前“18 位原始 Base32 / 90 bits”的
推荐结论；上方其他长度与编码行仅保留为历史比较材料。

```text
Alphabet Size = 22
Length = 18

Capacity = 22^18
         = 1,457,498,964,228,107,529,355,264
         ≈ 1.4575 × 10^24

Entropy = log2(22^18)
        = 80.269769135471... bits
        ≈ 80.27 bits
```

相对旧的 `32^18 = 1,237,940,039,285,380,274,899,124,224`，新的命名空间保留比例为：

```text
22^18 / 32^18
= 0.001177358287134384...
= 0.1177358287134384...%
```

字符集缩减显著降低命名空间，但不改变实际正确性策略。下表针对
`N = 22^18`，在“完全随机生成、未执行唯一约束重试”模型下计算：

| 签发量 `n` | 预期碰撞对数 `λ` | 至少一次碰撞概率 `P` |
| ---: | ---: | ---: |
| 10 亿 | `3.430534166896e-7` | `3.430533578468e-7`（约 `0.0000343053%`） |
| 100 亿 | `3.430534169983e-5` | `3.430475327833e-5`（约 `0.00343048%`） |
| 1,000 亿 | `3.430534170292e-3` | `0.003424656611`（约 `0.342466%`） |
| 1 万亿 | `0.343053417032` | `0.290399694195`（约 `29.03997%`） |

这些生日模型数值不是正确性保证。未来获授权的系统仍必须遵循：

```text
CSPRNG
    ↓
生成 18 个候选字符
    ↓
22 字符受限字母表
    ↓
规范值验证
    ↓
数据库 UNIQUE
    ↓
发生冲突时重试
```

```text
Birthday probability ≠ correctness guarantee
```

## 7. 人因与文本兼容性

### 7.1 人类易混淆字符排除

下列排除基于人类传播风险降低，不表示任何字符在所有字体、OCR 引擎、书写方式或口音中都
必然混淆。置信等级只描述混淆风险判断的稳定程度，不是平台过滤结论。

| 已排除字符 | 主要混淆对象 | 视觉 / OCR | 手写 | 口述 | 置信等级 | 设计结论 |
| --- | --- | --- | --- | --- | --- |
| `0` | `O` | 常见字形与低质量 OCR 中高风险 | 中 | 低 | 高 | 排除。 |
| `1` | `I`、`L` | 常见字体、截图和 OCR 中高风险 | 中 | 低 | 高 | 排除。 |
| `2` | `Z` | 某些字体、低分辨率或手写中存在风险 | 中 | 低 | 中 | 排除。 |
| `5` | `S` | 某些字体和手写中存在风险 | 中 | 低 | 中 | 排除。 |
| `6` | `G` | 字体和手写方式相关 | 中 | 低 | 中 | 排除。 |
| `8` | `B` | 部分字体、OCR 或手写中存在风险 | 中 | 低 | 中 | 排除。 |
| `B` | `8` | 与 `8` 成对混淆 | 中 | 低 | 中 | 排除。 |
| `G` | `6` | 与 `6` 成对混淆 | 中 | 低 | 中 | 排除。 |
| `S` | `5` | 与 `5` 成对混淆 | 中 | 低 | 中 | 排除。 |
| `Z` | `2` | 与 `2` 成对混淆 | 中 | 低 | 中 | 排除。 |

`I`、`L`、`O` 原本已不在上一轮受限字母表中。本次不以“所有场景绝对无混淆”为标准，而以
降低视觉、OCR、手写、口述和人工抄录中可预见的主要错误为目标。

### 7.2 最终字母表与保留字符复核

```text
Final Alphabet = 3479ACDEFHJKMNPQRTVWXY
Alphabet Size  = 22
```

机器校验要求和结果：

| 校验项 | 结果 |
| --- | --- |
| 字符计数 | `22` |
| 字符唯一 | 是 |
| 仅大写字母数字 | 是 |
| 仅 ASCII | 是 |
| 不含标点 | 是 |
| 不含 URL delimiter | 是 |
| 不含 `@`、`#`、`_`、`-` | 是 |

保留字符为：

```text
3 4 7 9 A C D E F H J K M N P Q R T V W X Y
```

第二轮 sanity check 结论：

```text
未发现足以改变已批准 22 字符集的、明确且可验证的
视觉混淆、URL / mention / hashtag / protocol 语法、
常见 OTP / payment reference 固定模式或平台关键字风险证据。

NO EVIDENCE
```

其中 `C`、`R`、`T`、`V`、`W`、`X`、`Y` 均保持为普通随机字符；不得因主观观感继续删除。
若未来出现可验证且足以改变产品决策的新问题，只能登记为 `PROPOSED CHANGE`，不得在本设计
冻结后自行改变字符集或长度。

### 7.3 规范值与展示值

```text
规范存储 / 公共引用：18 位大写、无分隔符
展示分组：          仅在视觉扫描需要时采用 6-6-6

规范值：            3C7M4Q9RDFHJKNTWVY
展示值：            3C7M4Q-9RDFHJ-KNTWVY
```

展示连字符不是 canonical identifier 的一部分。这样既避免历史 `C-` 作为语义前缀，又能保留
适合海报和口述节奏的分组方式。

`3C7M4Q9RDFHJKNTWVY` 为经字母表验证的合法随机示例；它不是字母表清单，也不暗示固定首字符。

### 7.4 特殊字符兼容性

| 字符 | 误解释风险 | 建议 |
| --- | --- | --- |
| `@` | mention / handle，暗示平台命名空间 | 排除。 |
| `.` | domain、email、URL | 排除。 |
| `/` | URL path、命令语法 | 排除。 |
| `:` | URL scheme、时间、语法 | 排除。 |
| `-` | 口述和复制时可能丢失 | 仅作为展示分组符。 |
| `_` | handle 观感、低对比度 | 排除。 |
| `#` | hashtag | 排除。 |
| 冻结的 22 字符 ASCII 字母数字集 | 纯文本、OCR、口述及平台兼容性更好 | 首选。 |

任何短 opaque 字符串都可能被误解为优惠码、物流码或安全 token。产品文案必须明确它是公开的
`Commerce Reference`，不得将其表述为密码、登录码或验证码。

### 7.5 平台兼容性约束

```text
COMMERCE_REFERENCE_PLATFORM_COMPATIBILITY = REQUIRED
```

定义：Commerce Reference 的字符集和规范表示应最大程度兼容第三方平台的普通纯文本传播环境，
并避免主动引入 URL、mention、hashtag、email、protocol 或 delimiter 语法。

该约束是“按设计降低风险并提升平台兼容性”，不是“保证平台过滤豁免”。上一轮平台兼容性研究
没有建立该类字符串会被普遍字符串级阻断的证据；平台仍可依据上下文、账户信誉、重复传播、
自动化、链接和其他行为信号采取治理措施。

## 8. 前缀与人类可见命名

### 8.1 前缀方案

| 形式 | 品牌/识别 | 输入与口述 | 平台兼容性 | 结论 |
| --- | --- | --- | --- | --- |
| `3C7M4Q9RDFHJKNTWVY` | 中性，需要邻近标签 | 最好，无标点 | 最好 | 已冻结的规范格式示例。 |
| `C-3C7M4Q9RDFHJKNTWVY` | 延续历史方向 | 连字符可能丢失 | 良好，但无额外收益 | 不保留为规范格式。 |
| `PC3C7M4Q9RDFHJKNTWVY` | 品牌信号更强 | 多两字符，绑定未来品牌 | 良好 | 可作为展示标签，不必写入 Reference。 |
| `3C7M4Q9RDFHJKNTWVY` | 无固定产品识别 | 易脱离语境 | 良好 | 由邻近标签提供产品语境。 |

不得强制所有 Reference 以 `C` 开头，因为这会将有效空间缩小 22 倍。产品语境应通过邻近文案提供：

```text
PCI Commerce Reference：3C7M4Q9RDFHJKNTWVY
我的 C 号：3C7M4Q9RDFHJKNTWVY
```

### 8.2 产品语言选项

| 产品语言 | 优点 | 风险 | 建议 |
| --- | --- | --- | --- |
| `Commerce Reference` / `商业引用标识` | 精确说明“公开引用”，不混同内部身份根或凭证 | 较正式 | 推荐技术、政策术语。 |
| `Commerce ID` / `商业 ID` | 与历史文档一致 | 易与内部 ID 混淆 | 仅在 Founder 选定为产品别名时使用。 |
| `Commerce Code` / `商业码` | 简洁、熟悉 | 易像优惠码、激活码或安全码 | 次选。 |
| `C号` | 口语简洁、易记 | 需教育语境；不得暗示顺序编号 | Founder 已批准作为中文人类用语。 |

技术名称保持 `Commerce Reference`；中文人类用语保持 `C号`。其中 `C` 不是语义前缀，
而只是 22 字符随机空间中的普通合法字符；不得把 `C + 17 个字符` 视为编码规则。

## 9. 安全与滥用分析

边界如下：

```text
Public Identifier
≠ Secret
≠ Credential
≠ Authentication Factor
```

随机性和大空间只能降低偶然碰撞及盲猜效率；它们不能授权无限查询、不能隐藏公开数据，也不能替代
反枚举控制。

| 风险 | 未来实现必须另行设计和授权的控制方向 |
| --- | --- |
| 枚举 / 猜测 | 未认证查询应按未来 resolver 的实际边界实施每 IP、每客户端及聚合滥用限流。 |
| 批量发现 | 不提供未认证范围枚举、前缀浏览或可批量收集的列表 API。 |
| 未知 ID 响应 | 在可行范围内统一未知 ID 的外部响应内容与时序，避免为扫描器提供信息差。 |
| 大规模查询 | 在实际查询边界加入配额、缓存策略、机器人检测、监控和滥用升级措施。 |
| 抓取公开 Profile | 公开即意味着可被抓取；默认公开字段应最小化，并需独立的公开披露策略。 |
| 被误作凭证 | 不得仅凭 Commerce Reference 进行认证、授权、所有权转移、账户恢复或支付操作。 |
| 钓鱼 / 社会工程 | 明确标记其为公开标识；任何支持面不得要求用户提供与之相邻的秘密信息。 |

历史 Product Direction 的原则继续成立：

```text
随机与大空间可以降低猜测成本，
但不能替代 enumeration controls。
```

## 10. 标识归属与生命周期语义

推荐标识属于一个 `Commerce Profile`。

| Commerce Profile 状态 | Commerce Reference 建议 |
| --- | --- |
| `ACTIVE` | 标识持续归属该 Profile；未来 resolver 的可见性须另行授权。 |
| `SUSPENDED` | 标识永久保留且不可转让；未来公开响应默认不泄露暂停原因。 |
| `ARCHIVED` | 标识永久保留且永不复用；archive 可见性/查询行为须另行制定政策。 |
| Closure / deletion | 不得重新分配给另一 Commerce Profile；数据保留及 resolver 行为须经独立治理批准。 |

建议生命周期属性：

```text
Permanent       = Yes
Immutable       = Yes
Reusable        = Never
Transferable    = No by default
Public          = Yes
Credential      = No
```

`Non-transferable` 表示不得在独立 Commerce Profile 之间随意移动。若未来存在 Founder 批准的
法律合并、纠错或恢复例外，必须由显式、可审计政策处理，禁止静默重分配。

## 11. 候选方案评分

评分 1–10；10 最佳。“安全”仅指作为非秘密公共标识的碰撞与盲猜适配性，绝不表示认证安全。

| 候选 | 格式 | 跨平台 | 可读性 | 容量 | 安全 | 人工输入 | 品牌 | 可扩展性 | 实现复杂度 |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| A — Pure Numeric | 20 位随机十进制 | 8 | 6 | 6 | 6 | 6 | 4 | 7 | 8 |
| B — Human-oriented Alphanumeric | 18 位随机、源自 Base32 家族的 22 字符受限字母数字编码 | 10 | 9 | 9 | 9 | 8 | 8 | 9 | 8 |
| C — Cryptographically random / UUID-like | UUIDv4/v7 或类似长随机字符串 | 9 | 3 | 10 | 10 | 3 | 3 | 10 | 7 |

### Candidate A — Pure Numeric

```text
81374620591348271935
```

优点：通用纯文本、无大小写、逐位口述直接。

缺点：20 位随机十进制在 10B 次分配前重试模型中至少发生一次碰撞的概率仍为 39.35%，在 100B /
1T 下不足；外观还接近电话号码、OTP、支付参考或物流码。

### Candidate B — Human-oriented Alphanumeric

```text
3C7M4Q9RDFHJKNTWVY
```

优点：大写受限字母表、固定长度、约 80.27-bit 随机空间、OCR/纯文本兼容性较好，并已按
视觉、手写、OCR 和人工抄录风险进一步排除高混淆字符。

缺点：仍需清晰字体、视觉分组及未来 resolver 的滥用治理；它公开可见，绝不能被表述为安全码。

### Candidate C — Cryptographically random / UUID-like

```text
550e8400-e29b-41d4-a716-446655440000
```

优点：技术惯例成熟、随机空间强。

缺点：长、含标点、像数据库 ID，不适合简介、海报或口头介绍。

## 12. 最终推荐

```text
RECOMMENDED COMMERCE REFERENCE

状态：Founder 已冻结的产品 / 标识设计；不构成实现授权
格式：18 位大写 ASCII 字母数字；源自 Base32 家族的 22 字符受限编码；规范值无分隔符
示例：3C7M4Q9RDFHJKNTWVY
展示分组：3C7M4Q-9RDFHJ-KNTWVY（仅展示，不属于规范值）
字母表：3479ACDEFHJKMNPQRTVWXY（22 字符）
长度：18 位 / 约 80.27 bits
生成：CSPRNG，在冻结的 22 字符集上均匀抽样
唯一性：持久化数据库唯一约束
碰撞策略：唯一约束冲突时重新生成并重试
归属：恰好一个 Commerce Profile
生命周期：永久、不可变、不可复用、默认不可转移
可见性：公开标识；resolver 的披露策略需另行批准
凭证边界：永远不是秘密、凭据或认证因素
```

### 12.1 PCI 是否应选择纯数字？

```text
NO
```

纯数字的单位字符容量较低，取得同等随机空间需要更长字符串；在对人类可接受的长度内碰撞余量更弱，
并更易被误解为电话、OTP、金融参考、物流码或优惠码。受限 uppercase Base32 在平台中立性、容量、
可读性与品牌表达之间更适合 PCI。

## 13. Founder 决策登记

本次已经批准和冻结的事项如下；其余事项仍需未来独立决策。

| Founder 决策事项 | 状态 / 结论 |
| --- | --- |
| 18 位长度 | 已批准并冻结。 |
| 人类易混淆字符排除 | 已批准并冻结。 |
| 22 字符集方向 | 已批准并冻结为 `3479ACDEFHJKMNPQRTVWXY`。 |
| 平台兼容性 | 已批准为 P0：`COMMERCE_REFERENCE_PLATFORM_COMPATIBILITY = REQUIRED`。 |
| CSPRNG 方向 | 已批准；不得使用顺序、时间戳、Snowflake、Creator ID / Identity ID 派生或公开哈希前缀。 |
| 语义前缀 | 已批准：无固定语义前缀。 |
| 规范形式标点 | 已批准：规范形式无标点；连字符仅用于展示分组。 |
| 分组展示 | 已批准：可选 `6-6-6` 展示分组。 |
| 技术名称与中文用语 | 已批准：技术名称 `Commerce Reference`；中文人类用语 `C号`。 |
| 校验位 | 仍待未来单独冻结。 |
| 输入规范化 | 仍待未来单独冻结，包括连字符、空格和易混淆替代是否可接受。 |
| 枚举策略 | 仍待未来 resolver 授权与独立决策。 |
| 公开 resolver | 仍待未来独立授权。 |
| 公开 Profile 展示表面 | 仍待未来独立授权。 |

## 14. 非授权边界

本研究不授权：

```text
Commerce Reference generation
database migration
schema change
API
lookup / resolver
public Profile UI
QR system
platform OAuth or binding
identity/account change
payment、settlement、refund、marketplace、CRM 或其他延后能力
```

```text
IMPLEMENTATION CHANGES = NONE
STAGE_3 = NOT AUTHORIZED
```

## 15. PCI-REFERENCE-002 — QR 表示形式研究补充

> **查询日期**：2026-08-26
> **状态**：产品设计冻结补充；不构成 runtime 或 Stage 3 实现授权
> **研究对象**：Commerce Reference 的 QR 表示形式，不是新的身份、对象或公共页面

### 15.1 语义边界

```text
Commerce Profile
      ↓
Commerce Reference
      ├── Canonical Text Form
      └── QR Representation
```

```text
Commerce Reference = 源标识
QR Code = 对该标识的机器可读编码表示

QR ≠ Commerce Reference
QR ≠ Identity
QR ≠ Commerce Profile
QR ≠ Public Page
QR ≠ Credential
```

一个 C号只有一个规范文本值，但可以被渲染为 N 个视觉不同的 QR 图案（尺寸、颜色、纠错级别、
海报版式不同）。所有有效 QR 都必须表达同一个底层 Commerce Reference。不得创建 `QR ID`、
`QR Token`、QR 会话 ID、追踪 ID 或任何新的永久身份。

### 15.2 Payload 选项与推荐

| 选项 | Payload 示例 | 长度 | 结论 |
| --- | --- | ---: | --- |
| A：原始 C号 | `3C7M4Q9RDFHJKNTWVY` | 18 | **推荐**：最短、纯文本、扫码器无关、内容透明、URL 独立。 |
| B：带标签纯文本 | `PCI:3C7M4Q9RDFHJKNTWVY` | 22 | 不推荐作默认 payload：增加产品命名和解析约束，但不增加标识能力。 |
| C：结构化 scheme | `pci://commerce/3C7M4Q9RDFHJKNTWVY` | 33 | 不推荐：引入协议、路由和 namespace ownership 表达，且看起来像 URL。 |

本研究只推荐一个 QR payload：

```text
QR payload = canonical Commerce Reference itself

3C7M4Q9RDFHJKNTWVY
```

未来扩展应保持边界：

```text
QR → raw C号
future approved app / resolver → interpret C号
```

不得让 QR payload 承担版本、认证、授权、会话、追踪或路由语义。未来 resolver 如获独立授权，
也仍然是 lookup mechanism，而不是 QR 或 Commerce Reference 本身。

### 15.3 QR 纠错等级研究

| 来源 | 等级 | 关键结论 |
| --- | --- | --- |
| [DENSO WAVE — Error correction feature](https://www.qrcode.com/en/about/error_correction.html) | A（QR 技术官方资料） | QR 提供 L、M、Q、H 四档纠错；提高纠错能力会增加符号尺寸 / 密度。官方说明 M 常被选择，Q/H 适用于更可能污损的环境。 |
| [DENSO WAVE — QR Code version](https://www.qrcode.com/en/about/version.html) | A（QR 技术官方资料） | QR 版本为 1–40；可容纳数据量取决于 payload、字符模式和纠错级别，更多数据意味着更多模块。 |

推荐的**未来 QR 渲染政策**为：

```text
默认：Q
可选：M（干净、受控、高分辨率数字展示）
非默认：H（仅在明确存在显著遮挡 / 污损风险时评估）
```

这是对社交图片、海报、印刷卡、视频帧、头像图、低分辨率截图和局部遮挡风险的风险降低选择，
不是通用扫码成功保证，也不改变 18 位 C号。Q 的较高冗余以更大或更密 QR 图案为代价；最终像素尺寸、
静区、对比度和实际投放表面仍需在未来 QR 实施授权时验证。

### 15.4 可见呈现与平台边界

| 呈现层级 | 形式 | 产品建议 |
| --- | --- | --- |
| Minimal | `[QR]` | 不建议作为公开传播中的独立形式。 |
| Identifiable | `[QR]` + `C号：3C7M4Q9RDFHJKNTWVY` | 可用于数字画面；规范文本同时可见。 |
| Full | `[QR]` + `C号：3C7M4Q-9RDFHJ-KNTWVY` | 推荐用于海报、图片、印刷物与线下场景。 |

```text
QR 不应成为唯一信息。
QR 无法扫描时，用户仍应能读取、复制或人工输入 C号。
连字符只属于展示分组，不进入 QR payload，也不属于 canonical identifier。
```

```text
QR ≠ platform-policy bypass
```

编码外部 URL 的 QR 仍是外部导流内容，并可能受第三方平台的外链、垃圾信息和滥用政策约束。
只编码 raw C号 在产品语义上不同于编码外部 URL，但不保证不会受到任何平台治理或内容审核。

### 15.5 QR 安全与生命周期

扫描 QR 只能取得一个公共标识：

```text
scan QR → C号

≠ authentication
≠ authorization
≠ ownership proof
≠ payment approval
≠ account recovery
≠ profile modification
≠ platform-account binding
≠ transfer
```

在 `ACTIVE`、`SUSPENDED` 与 `ARCHIVED` 生命周期中，C号和其既有 QR 表示均保持稳定；
Profile 状态变化不得通过重新生成 C号或 QR 来改变永久引用。未来是否解析、展示、限制或拒绝某个
状态的 C号，属于独立授权的 resolver / disclosure policy。

### 15.6 研究结论

```text
C号是事实，QR 是载体，Resolver 是未来能力。

Commerce Reference
      ├── Text / C号
      └── QR（raw C号 payload）
                 ↓
      future approved resolver（如获授权）
```

本节冻结产品语义与推荐 payload，不创建 QR generator、QR API、QR 图像资产、resolver、公共页面或
任何 Stage 3 runtime。
