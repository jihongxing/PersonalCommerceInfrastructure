# 28 — DS-01C Token Value 与 Accessibility Calibration

> **状态**：DS-01C Complete / Primitive Values 已冻结并通过自动校验  
> **范围**：跨端 Design Token 的值校准、可访问性校验和生成源准备  
> **上游输入**：[27 DS-01B 跨端 Design Token 语义契约](./27_DS01B_Cross_Platform_Design_Token_Contract.md)、[26 DS-01A 设计品味探索](./26_DS01A_Design_Taste_Exploration.md)  
> **Source of Truth**：`design-system/tokens/design-tokens.json`  
> **最后更新**：2026-08-11

## 1. 目的

DS-01C 将 DS-01B 的平台无关视觉语义转换为一组经过校验的 Primitive Values 与 Semantic Values，为未来的 Web、App 和微信小程序 Adapter 提供同一份输入。

本阶段完成：

- 中性画布与聚焦 Accent 的原始色值；
- 系统字体栈与中英文混排回退；
- 字体层级、行高和字重；
- 间距、圆角、阴影、动效和控件尺寸；
- 文本、非文本、焦点和操作对比度校验；
- 动态字体、触控目标、焦点环和减少动效约束；
- JSON Token Source of Truth 与 JSON Schema；
- 自动化 Token Calibration 门禁。

本阶段不实现：

- CSS Variables、Tailwind Theme、Native Theme 或 WXSS；
- Web 页面或组件改造；
- Dark Mode 或 Creator 个性化换肤；
- App、微信小程序或其他客户端；
- 完整组件库和 Storybook。

## 2. 设计取值决策

### 2.1 颜色方向

采用：

```text
Warm Neutral Canvas
        +
Focused Teal Accent
        +
Restrained Semantic Feedback
```

取值原则：

- `warm` 中性基础色承载温和、编辑型画布；
- `teal` 作为主要行动和品牌 Accent；
- `red` 仅用于错误和危险操作；
- `amber` 仅用于警告；
- `blue` 仅用于信息反馈；
- 辅助文本使用经过对比度校验的深中性色，不使用过浅灰色；
- 不使用默认紫色渐变、霓虹色或大面积装饰性色彩。

### 2.2 字体方向

采用系统无衬线字体栈：

```text
-apple-system
BlinkMacSystemFont
Segoe UI
PingFang SC
Hiragino Sans GB
Microsoft YaHei
sans-serif
```

原因：

- 不把单一 Web 字体供应商变成跨端依赖；
- 在中文、英文、数字环境中保持可用；
- 支持系统字体替换和动态字体；
- 未来平台可使用本地等价字体，但必须保持同一语义层级。

### 2.3 尺寸方向

- 正文最小字号为 `1rem`；
- Caption 最小字号为 `0.8125rem`；
- 正文行高不低于 `1.45`；
- 主要控件触控目标不小于 `2.75rem`，即默认根字号下的 44 CSS px；
- 焦点环宽度不小于 `0.125rem`，当前基线为 `0.1875rem`；
- 间距和字体值使用 `rem`，保留用户缩放能力；
- 动效提供 `reduced` 值 `0ms`。

## 3. Token Source of Truth

### 3.1 文件

```text
design-system/tokens/design-tokens.json
design-system/tokens/design-tokens.schema.json
design-system/tokens/README.md
```

### 3.2 文件责任

| 文件 | 责任 |
| --- | --- |
| `design-tokens.json` | Primitive、Semantic 和 Accessibility 的唯一值来源 |
| `design-tokens.schema.json` | Token Source 的最小结构约束 |
| `README.md` | 消费边界、生成边界和当前阶段说明 |

### 3.3 消费规则

客户端不得复制或手工重写 Token 值。

未来 Adapter 只能：

```text
读取 Token Source
    ↓
生成平台实现
    ↓
运行平台专项校验
```

DS-01C 不生成任何平台文件，因此尚未进入 DS-01D。

## 4. 自动校验

校验入口：

```text
pnpm check:design-tokens
```

校验内容：

### 4.1 颜色对比度

- 常规文本与背景达到 WCAG AA 的 `4.5:1`；
- 大字号文本使用不低于 `3:1` 的门槛定义；
- 非文本焦点、边界和主要操作使用不低于 `3:1`；
- 主要文本、辅助文本、反馈色、主操作和危险操作均有配对校验。

### 4.2 字体与动态文本

- 字体尺寸必须使用 `rem`；
- 正文不低于 `1rem`；
- Caption 不低于 `0.8125rem`；
- 所有层级必须有正数行高；
- 支持从 `1x` 到至少 `2x` 的字体缩放目标。

### 4.3 触控与焦点

- 最小触控目标不低于 `2.75rem`；
- 焦点环宽度不低于 `0.125rem`；
- Focus Ring 必须有独立 Semantic Token；
- Reduced Motion 必须为 `0ms`。

### 4.4 命名边界

Semantic Token 不得包含：

```text
web
ios
android
wx
tailwind
rounded
slate
```

也不得把具体平台或实现名称带入跨端语义。

## 5. DS-01C 冻结结论

已冻结：

1. Primitive Color Values；
2. Semantic Color Values；
3. 系统字体栈；
4. Typography Values；
5. Spacing、Radius、Elevation、Motion Values；
6. Touch Target 与 Focus Ring 基线；
7. Accessibility Contrast 与 Font Scaling 基线；
8. 可机器读取的 Token Source；
9. 自动化校验命令和 Preflight 门禁。

仍保持开放：

1. Dark Mode 具体值；
2. Creator 个性化主题；
3. 其他品牌 Accent；
4. 平台专属字体选择；
5. Token 到 CSS、Native Theme、WXSS 的生成方案；
6. 组件级视觉实现；
7. 页面级设计改造。

## 6. 进入 DS-01D 的条件

只有以下条件满足后，才进入 `DS-01D — Web Reference Design System Implementation`：

- `pnpm check:design-tokens` 持续通过；
- Token Source 经过产品与工程共同审查；
- Web Adapter 的消费方式已明确；
- Web 业务页面不再直接使用原始颜色、字体、间距或圆角；
- Button、Input、Textarea、Form Field、Surface、Status 和 Empty State 的实现边界已冻结；
- 设计系统实现不会改变 VS-01 的产品 Flow、用户语言、状态机或 API Contract。

