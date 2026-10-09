# 07 — Commerce Reference 产品规范

> **状态**：PROPOSED PRODUCT SPECIFICATION（基于 Founder 已批准的标识方向）
> **决策编号**：`PCI-REFERENCE-002`
> **日期**：2026-08-26
> **权威**：Main Control / Founder
> **范围**：产品与标识设计；不构成 runtime、QR、resolver 或 Stage 3 实现授权
> **阶段**：`STAGE_3 = NOT AUTHORIZED`

## 1. 目的与核心边界

本规范将已批准的 Commerce Reference（中文人类用语：`C号`）定义到未来 Stage 3 Architecture
能够实施的精度。它是一个可脱离 URL、域名、平台命名空间和第三方账号独立传播的公共商业引用。

```text
Commerce Profile
      ↓
Commerce Reference
      ├── Text / C号
      └── QR Representation
                 ↓
      future approved resolver
```

```text
C号是事实，QR 是载体，Resolver 是未来能力。
```

三者严格分离：

```text
Commerce Reference ≠ URL
Commerce Reference ≠ Public Commerce Page
Commerce Reference ≠ Search API
QR ≠ Commerce Reference
QR ≠ Identity
QR ≠ Commerce Profile
QR ≠ Credential
Resolver ≠ Commerce Reference
```

## 2. 语义、归属与公开性

| 项目 | 规范 |
| --- | --- |
| 技术名称 | `Commerce Reference` |
| 中文人类用语 | `C号` |
| 归属 | 恰好属于一个 `Commerce Profile`。 |
| 不属于 | Identity、Account、External Platform Account、Creator Actor、Commerce Object。 |
| 可见性 | 公共标识；公开资料的披露范围由未来产品表面和 resolver 政策决定。 |
| 安全属性 | 不是秘密、凭据、认证因素、授权因素或所有权证明。 |
| URL 独立性 | 传播不要求 `https://`、域名、`/c/`、`@handle` 或平台命名空间。 |

`C号` 是用户交流用语，不是数据库对象名称，也不意味着它是顺序编号。文字 `C` 不构成固定
语义前缀；它只是冻结字母表中的普通随机字符。

## 3. 规范形式（Canonical Contract）

```text
Length = 18
Character Set = 3479ACDEFHJKMNPQRTVWXY
Alphabet Size = 22
Encoding = fixed-length restricted alphanumeric
Case = uppercase
Canonical punctuation = none
Semantic prefix = none
```

规范形式示例：

```text
3C7M4Q9RDFHJKNTWVY
```

展示分组示例：

```text
3C7M4Q-9RDFHJ-KNTWVY
```

连字符仅是 `6-6-6` 的视觉呈现，不属于规范 C号，不进入持久化规范值，也不进入推荐 QR payload。
所有规范值必须为 ASCII，且每个字符必须唯一地属于冻结字母表；大小写转换、Unicode 变体或标点
不得改变规范形式。

## 4. 容量与唯一性

```text
Capacity = 22^18
         = 1,457,498,964,228,107,529,355,264
         ≈ 1.4575 × 10^24

Entropy = log2(22^18)
        = 80.269769135471... bits
        ≈ 80.27 bits
```

生日模型仅用于估算未重试随机抽样时的碰撞包络。设 `N = 22^18`：

```text
λ ≈ n(n - 1) / (2N)
P(at least one collision) ≈ 1 - e^-λ
```

| 签发量 `n` | 预期碰撞对数 `λ` | 至少一次碰撞概率 |
| ---: | ---: | ---: |
| 10 亿 | `3.430534166896e-7` | `3.430533578468e-7`（约 `0.0000343053%`） |
| 100 亿 | `3.430534169983e-5` | `3.430475327833e-5`（约 `0.00343048%`） |
| 1,000 亿 | `3.430534170292e-3` | `0.003424656611`（约 `0.342466%`） |
| 1 万亿 | `0.343053417032` | `0.290399694195`（约 `29.03997%`） |

这些数值不构成正确性保证。正确性边界只能由未来获授权实现中的数据库唯一约束和冲突重试保证。

```text
Birthday probability ≠ correctness guarantee
```

## 5. 未来生成与分配契约

未来实现必须遵守以下产品契约：

```text
CSPRNG
    ↓
从 22 字符冻结字母表生成 18 个字符
    ↓
canonical validation
    ↓
database UNIQUE
    ↓
collision retry
```

禁止作为公共 C号生成来源：

```text
sequential allocation
timestamp-based allocation
Snowflake-like allocation
Identity-derived value
Commerce-Profile-derived value
hash-derived public prefix
```

公共引用与内部标识必须保持分离：

```text
public Commerce Reference ≠ internal identifier
```

## 6. 输入与规范化政策

规范值验证必须严格：

```text
仅接受 18 位、大写、无标点、且全部位于冻结字母表中的 canonical string
```

人类友好输入（小写、空格、连字符、展示分组）的接受与规范化仍是未来单独冻结的输入政策，不得因
“智能猜测”而默默改变 C号。特别是，从字母表排除易混淆字符不意味着系统自动接受或转换：

```text
O → 0
I → 1
L → 1
Z → 2
S → 5
G → 6
B → 8
```

上述映射会将非规范输入解释为不同的已排除字符，可能把人为错误误导到另一个候选值；在未被明确
批准之前，默认不允许 confusable substitution。

## 7. 校验位政策

当前规范：

```text
Check Digit = NONE
```

18 位 canonical C号不得为了平台过滤规避或未经决策的手输便利而改变长度。未来可单独评估：

```text
UI-side validation
independent display-only check
separate error-detection experience
```

这些均不是当前 canonical identifier 的一部分，也不在本任务实施。

## 8. 生命周期与不可转移性

| Commerce Profile 状态 | C号与 QR 表示 |
| --- | --- |
| `ACTIVE` | C号有效并保持稳定；未来展示和解析由获授权产品表面决定。 |
| `SUSPENDED` | C号和既有 QR 表示不改变；未来 resolver 的响应 / 披露策略另行决定。 |
| `ARCHIVED` | C号永久保留且不得复用；既有 QR 仍表达同一公共引用。 |

产品基线不采用物理删除。若未来出现删除规则，原 C号仍永久保留，绝不得重新分配。

```text
once assigned
    ↓
immutable
    ↓
permanently reserved
    ↓
never reused
```

默认不可转移。不得因 Profile transfer、Identity merge 或 Profile merge 自动转移 C号。任何未来纠错
例外都必须有显式、可审计的独立政策，且不在本规范授权范围内。

## 9. QR 表示形式

### 9.1 固定语义

```text
Commerce Reference = source identifier
QR Code = encoded representation
```

同一个 C号有一个 canonical text form，但可以有 N 个视觉 QR 表示。视觉差异不得产生新的 QR ID、
QR Token、会话、追踪标识或永久身份。

### 9.2 推荐 QR Payload

唯一推荐 payload：

```text
3C7M4Q9RDFHJKNTWVY
```

即：

```text
QR payload = raw canonical Commerce Reference
```

对比：

| 格式 | Payload 长度 | 设计结论 |
| --- | ---: | --- |
| 原始 C号 | 18 | 推荐：短、透明、扫码器无关、URL 独立。 |
| `PCI:` 标签 | 22 | 不作为默认：引入产品 namespace，不增加标识能力。 |
| `pci://commerce/` scheme | 33 | 不作为默认：引入 URL / 协议感、路由和 ownership 负担。 |

未来扩展必须在扫码之后的获授权解释层完成：

```text
QR → raw C号
future approved app / resolver → interpret C号
```

### 9.3 纠错等级与呈现政策

参考 DENSO WAVE 对 QR 纠错和版本容量的官方说明，纠错等级 L/M/Q/H 在恢复能力与符号尺寸 /
密度之间存在取舍。[DENSO WAVE — Error correction feature](https://www.qrcode.com/en/about/error_correction.html)
[DENSO WAVE — QR Code version](https://www.qrcode.com/en/about/version.html)

建议未来渲染默认使用 `Q`，以降低社交图片、海报、印刷卡、视频帧、头像、截图及局部遮挡中的读取风险；
在干净、受控、高分辨率数字表面可允许 `M`。`H` 不作为默认，因为更高冗余会增加图案大小或密度。
这是一项风险降低的渲染政策，不承诺所有设备、截图、压缩或平台处理后均可扫描成功。

| 层级 | 内容 | 传播建议 |
| --- | --- | --- |
| Minimal | 仅 `[QR]` | 不建议作为独立公开传播形式。 |
| Identifiable | `[QR]` + `C号：canonical` | 可用于数字图像。 |
| Full | `[QR]` + `C号：6-6-6 grouped` | 推荐用于图片、海报、印刷物与线下。 |

QR 不应成为唯一信息。C号文本必须同时可见；扫码失败时，用户仍可复制、读取或人工输入 C号。

### 9.4 QR 安全与平台政策边界

```text
scan QR → public C号

≠ authentication
≠ authorization
≠ ownership proof
≠ payment approval
≠ account recovery
≠ profile modification
≠ platform-account binding
≠ transfer
```

```text
QR ≠ platform-policy bypass
```

如果 QR 编码外部 URL，仍可能受外链、导流、垃圾信息或滥用政策治理。raw C号 payload 与外部 URL
在产品语义上不同，但不保证不会受到任何第三方平台内容、行为或账户治理。

## 10. Resolver、发现与枚举边界

```text
Commerce Reference = public identifier
Resolver = future lookup mechanism
Public Commerce Page = future product surface
```

因此：

```text
C号 ≠ URL ≠ Public Page ≠ Search API
```

未来发现可有三种机制，且都只是发现 / 引用机制，不会重新定义 Commerce Profile 的身份：

1. 直接输入 C号。
2. 扫描 QR，得到 C号。
3. `External Platform Account → Commerce Relationship → Commerce Profile` 的关联。

随机性和大命名空间不等于反枚举控制。未来任何 resolver / lookup 如获授权，仍必须独立设计：

```text
rate limiting
bulk lookup control
unknown-ID response policy
abuse monitoring
public data minimization
```

## 11. 平台兼容与人类传播指引

```text
COMMERCE_REFERENCE_PLATFORM_COMPATIBILITY = REQUIRED
```

目标是提高普通纯文本传播的兼容性并降低误判风险，不承诺规避或绕过任何平台审核、垃圾信息或外链治理。
C号使用无 `@`、`#`、`.`、`/`、`:`、`_`、`-` 的规范 ASCII 字母数字形式，因此不主动引入
mention、hashtag、email、URL、协议或 delimiter 语法。

避免：

```text
C号 + repeated external link
bulk repeated posting
spam comments
automated mass distribution
```

推荐自然语言上下文，例如：

```text
我的 C号是 3C7M4Q9RDFHJKNTWVY
商业 C号：3C7M4Q-9RDFHJ-KNTWVY
```

自然语言上下文不保证平台审核结果；重复内容、账户信誉、发布频率和站外导流语义仍可能决定平台风险。

| 场景 | Text-only | Text + QR | QR-only | 推荐说明 |
| --- | --- | --- | --- | --- |
| Bio | 推荐 | 受空间与平台能力限制 | 不推荐 | 规范值或自然语言短句优先。 |
| 视频描述 | 推荐 | 可选 | 不推荐 | 避免反复导流与批量复制。 |
| 置顶评论 | 条件推荐 | 条件推荐 | 不推荐 | 必须遵守平台评论和重复内容政策。 |
| 海报 | 推荐 | 推荐 | 不推荐 | 使用 `6-6-6` 展示，并保留可读文字。 |
| 印刷卡 | 推荐 | 推荐 | 不推荐 | QR 失效时仍可人工输入。 |
| 图片 | 推荐 | 推荐 | 不推荐 | 保证文字对比度和足够尺寸。 |
| 口播 | 推荐 | 不适用 | 不适用 | 分组朗读；必要时逐组六位复述。 |
| 线下活动 | 推荐 | 推荐 | 不推荐 | 文本与 QR 并列，避免只依赖扫码。 |

## 12. Future Stage 3 边界

以下能力是未来可能的实现依赖，但在本规范中全部为 `NOT IMPLEMENTED`：

```text
Commerce Reference Generation
Commerce Reference Persistence
Commerce Reference Lookup
Public Resolver
QR Generation
Public Commerce Entry
```

本任务不创建数据库 schema、migration、repository、generator、API、resolver、QR generator、Profile UI、
公共页面或任何 Stage 3 runtime，也不修改现有 Commerce Profile runtime。

## 13. Founder 决策登记

### 13.1 ALREADY APPROVED

```text
18 characters
22-character alphabet and human-confusable character exclusion
CSPRNG direction
COMMERCE_REFERENCE_PLATFORM_COMPATIBILITY = REQUIRED
no semantic prefix
canonical form without punctuation
6-6-6 grouped presentation only
C号 terminology
URL independence
QR as a representation, not an identifier
```

### 13.2 本规范的产品建议，待 Founder 作为后续实现 / 政策默认值确认

```text
QR payload = raw canonical Commerce Reference
QR error correction default = Q
QR-only public distribution = not recommended
```

### 13.3 STILL OPEN

```text
input normalization
confusable substitution acceptance policy
check digit or independent error-detection experience
resolver semantics
enumeration controls
public display surfaces
final QR rendering dimensions, quiet zone, contrast, and per-platform testing policy
```

## 14. 最终规范摘要

```text
Commerce Reference
├── belongs to exactly one Commerce Profile
├── public, stable, immutable, permanent
├── non-reusable
├── non-transferable by default
├── non-credential
├── URL-independent
├── canonical: 18 uppercase ASCII characters, no punctuation
├── alphabet: 3479ACDEFHJKMNPQRTVWXY (22 symbols)
├── capacity: 22^18 = 1,457,498,964,228,107,529,355,264
├── allocation: CSPRNG + UNIQUE constraint + collision retry
├── grouped display: 6-6-6, presentation only
├── QR: a representation of raw canonical C号
├── QR payload: raw canonical C号
├── QR default rendering direction: Q error correction
├── resolver: future and separately authorized
└── runtime: NOT IMPLEMENTED
```

```text
IMPLEMENTATION CHANGES = NONE
STAGE_3 = NOT AUTHORIZED
GIT = NOT COMMITTED
```
