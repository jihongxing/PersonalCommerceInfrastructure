# 27 — DS-01B 跨端 Design Token 语义契约

> **状态**：DS-01B Complete / 语义与命名已冻结，具体值和平台实现未冻结  
> **范围**：Personal Commerce Infrastructure 的跨端视觉语义  
> **上游输入**：[26 DS-01A 设计品味探索](./26_DS01A_Design_Taste_Exploration.md)、[23 技术架构决策](./23_Technology_Architecture_Decision.md)、[25 用户界面语言治理](./25_User_Facing_Language_Governance.md)  
> **适用客户端**：Web Reference Client、未来 App、微信小程序及其他客户端  
> **最后更新**：2026-08-11

## 1. 目的与边界

本契约把 DS-01A 的视觉方向提炼为不依赖任何客户端框架的视觉语义、Token 分层与初步命名。

本契约定义：

- 跨端必须共享的视觉意义；
- Color、Typography、Spacing、Radius、Surface、State 的语义；
- Token 分层、命名和引用规则；
- Component State 与可访问性最低要求；
- Web、App 和微信小程序的 Adapter 边界。

本契约不定义：

- 具体颜色、字体、尺寸、阴影或动效数值；
- CSS Variable、Tailwind、React Native Theme、WXSS；
- 具体组件代码、页面布局或产品 Flow；
- Dark Mode、Creator 换肤、完整组件库或 Storybook；
- 产品对象、API Contract、状态机、Canonical Event 或 VS-01 范围。

## 2. 跨端设计事实模型

```text
Design Principles
        ↓
Primitive Token Values
        ↓
Semantic Tokens
        ↓
Component Tokens and States
        ↓
Platform Adapters
   ├── Web
   ├── App
   └── 微信小程序
```

| 层级 | 责任 | 业务页面是否可直接使用 |
| --- | --- | --- |
| Design Principles | 约束整体视觉取舍 | 否 |
| Primitive Tokens | 原始色阶、尺寸、字体候选等基础值 | 否 |
| Semantic Tokens | 表达产品视觉意义 | 是 |
| Component Tokens | 表达组件内的稳定视觉角色 | 否，仅组件实现层 |
| Platform Adapters | 映射为 CSS、Native Theme、WXSS 等 | 否 |

### 2.1 冻结决策

1. 语义优先于平台实现，Token 名称表达用途而非颜色或技术；
2. Primitive Token 不直接泄漏到业务页面；
3. 同一视觉意义只有一个跨端 Semantic Token 名称；
4. 跨端共享意义，不要求共享像素、DOM、CSS 或组件代码；
5. Component State 是跨端设计契约；
6. 可访问性优先于局部审美微调。

## 3. Token 命名契约

### 3.1 命名格式

```text
category.role.variant.state
```

示例：

```text
color.text.primary
color.action.primary.pressed
space.layout.section
radius.surface.default
component.button.primary.background.default
```

规则：

- 使用小写英文与 `.` 分段；
- 每一段表达稳定语义；
- 不使用客户端名称，如 `web`、`ios`、`android`、`wx`；
- 不使用实现名称，如 `tailwind`、`css`、`react`；
- 不使用具体视觉值，如 `blue`、`gray`、`16px`、`rounded-xl`；
- 不以当前组件库 API 反向定义 Token；
- 不新增未在产品事实源定义的产品能力。

### 3.2 引用规则

```text
Business Surface
    → Semantic Token / Design System Component

Design System Component
    → Component Token / Semantic Token

Platform Adapter
    → Primitive Token / Semantic Token / Component Token
```

禁止：

```text
Business Surface → Primitive Token
Business Surface → Hard-coded visual value
Business Surface → Platform-specific visual style
```

## 4. Color Semantics

### 4.1 背景与表面

```text
color.background.canvas
color.background.surface
color.background.surfaceRaised
color.background.subtle
color.background.disabled
color.background.inverse
```

| Token | 用途 |
| --- | --- |
| `color.background.canvas` | 页面和应用的主要背景 |
| `color.background.surface` | 表单、内容分区和普通卡片 |
| `color.background.surfaceRaised` | 强调内容、结果或浮层 |
| `color.background.subtle` | 低强调分区和辅助信息 |
| `color.background.disabled` | 不可操作控件或内容 |
| `color.background.inverse` | 反色环境的表面承载 |

### 4.2 文本、图标与边界

```text
color.text.primary
color.text.secondary
color.text.muted
color.text.inverse
color.text.disabled

color.icon.primary
color.icon.secondary
color.icon.inverse

color.border.default
color.border.subtle
color.border.strong
color.border.focus
color.focus.ring
```

`color.focus.ring` 是可访问性 Token，任何平台不得将其实现为不可见状态。

### 4.3 操作与反馈

```text
color.action.primary.default
color.action.primary.hover
color.action.primary.pressed
color.action.primary.disabled

color.action.secondary.default
color.action.secondary.hover
color.action.secondary.pressed

color.action.destructive.default
color.action.destructive.hover
color.action.destructive.pressed

color.feedback.success
color.feedback.warning
color.feedback.error
color.feedback.info
```

规则：

- 一个 Surface 中只允许一个主要行动使用 `action.primary`；
- `feedback.*` 只表达结果或风险，不作为品牌装饰；
- `destructive` 仅用于不可逆或高风险操作；
- 任何状态都必须同时使用用户语言、结构或图标，不能只通过颜色表达。

## 5. Typography Semantics

```text
typography.display
typography.heading.page
typography.heading.section
typography.body.default
typography.body.small
typography.label.default
typography.caption
```

每个 Typography Token 在具体平台必须映射：

```text
fontFamily
fontSize
lineHeight
fontWeight
letterSpacing
```

规则：

- 跨端共享层级，不强制共享字体文件；
- 中文、英文、数字和状态标签必须保持稳定阅读；
- 页面不得通过任意字号、字重或字距自创层级；
- `caption` 不得承担唯一的关键信息或主要操作说明；
- `25` 负责用户语言，`27` 负责它的视觉层级。

## 6. Spacing、Radius 与 Surface Semantics

### 6.1 间距

```text
space.inline.xs
space.inline.sm
space.inline.md
space.inline.lg

space.stack.xs
space.stack.sm
space.stack.md
space.stack.lg
space.stack.xl

space.inset.control
space.inset.surface
space.inset.page

space.layout.section
space.layout.page
```

- `inline`：横向内容关系；
- `stack`：纵向阅读与内容分组；
- `inset`：控件或 Surface 内边距；
- `layout`：页面级结构；
- 平台可使用不同数值，但相对节奏必须一致；
- 业务页面不得直接使用随机 Margin、Padding 或 Gap 数值。

### 6.2 圆角与层级

```text
radius.control.default
radius.surface.default
radius.surface.emphasized
radius.avatar.full

elevation.none
elevation.subtle
elevation.raised
elevation.overlay
```

规则：

- 控件、Surface、Avatar 使用不同语义；
- `radius.avatar.full` 仅用于圆形身份元素；
- 阴影只用于层级、浮动性或覆盖关系；
- 阴影和圆角不能替代边界、焦点或状态说明。

## 7. Component State Semantics

### 7.1 通用状态

所有交互组件按适用范围使用：

```text
default
hover
pressed
focus
disabled
loading
error
success
```

- 触控端可不呈现 Hover，但必须提供 Pressed；
- Focus 是键盘和辅助输入的必须状态；
- Disabled 不能代替前置条件说明；
- Loading 必须阻止重复提交并保留操作上下文；
- Error 必须提供恢复路径，不泄漏技术细节；
- Success 对关键操作提供明确的非支付语义反馈。

### 7.2 Component Token 边界

仅 Design System Component 可使用：

```text
component.button.primary.background.default
component.button.primary.text.default
component.button.primary.border.default
component.button.primary.focusRing

component.input.background.default
component.input.border.default
component.input.border.focus
component.input.border.error
component.input.text.default
component.input.placeholder

component.status.info.icon
component.status.info.text
component.status.error.icon
component.status.error.text
```

业务页面使用组件语义，例如：

```text
Button variant="primary"
Input state="error"
Status tone="info"
```

业务页面不得直接引用 `component.*` Token。

### 7.3 VS-01 优先组件

DS-01C / DS-01D 只优先校准和实现：

```text
Button
Input
Textarea
Form Field
Surface / Card
Status Message
Empty State
```

不提前实现：

```text
Modal
Dialog
Popover
Data Table
Chart
Complex Calendar
Marketplace Card
Payment UI
CRM UI
```

## 8. Accessibility Constraints

### 8.1 视觉与可读性

- 正文、表单标签、主要操作和状态信息满足 WCAG AA 对比度；
- 关键内容和操作不使用低对比度 `muted` Token；
- 信息和状态不只通过颜色表达；
- 系统字体放大、浏览器缩放或动态字体后内容保持可访问；
- 触控目标遵循目标平台推荐的最小尺寸；
- 图标按钮必须提供可访问名称。

### 8.2 键盘、输入与反馈

- 所有可操作元素必须可通过键盘或平台等价辅助输入访问；
- Focus 状态必须清晰可见；
- 表单控件必须有可关联的可见 Label；
- 错误信息必须关联对应控件或操作结果；
- Loading、Success、Error 必须提供文本或等价辅助技术反馈；
- 尊重平台减少动态效果偏好；
- 技术错误只进入受控日志，不进入用户界面。

## 9. Platform Adapter Contract

### 9.1 Web Reference Client

Web 是首个 Reference Implementation，可使用 CSS Variables、Tailwind v4 Theme Mapping、现有 shadcn/ui 基础组件和浏览器无障碍 API。

Web 不得：

- 重命名跨端 Semantic Token；
- 把 Tailwind 类名、CSS Variable 名称或 shadcn/ui Variant 作为跨端事实源；
- 在业务页面直接定义 Token Value；
- 因实现便利改变组件状态语义。

### 9.2 Future App 与微信小程序

未来 App 和微信小程序必须：

- 使用相同 Semantic Token 名称与 Component State；
- 按平台字体、动态字体、触控反馈、导航和性能约束实现等价体验；
- 不复用 Web DOM、Router、CSS Utility 或浏览器事件模型；
- 遇到无法直接映射的语义时登记 Adapter Decision，不私自新增视觉语义。

## 10. Change Governance

### 10.1 普通实现变更

不改变本契约语义的事项：

- 平台中的具体 Token 值调整；
- 字体回退策略；
- 平台最小触控尺寸适配；
- 组件内部 DOM / Native View 结构；
- 只影响实现的性能优化。

### 10.2 必须登记 Design Decision 的变更

以下情况必须先登记 Design Decision：

- 新增、删除或改变 Semantic Token 含义；
- 新增跨端 Component State；
- 用颜色单独表示一个新的产品状态；
- 新增 Design System Component；
- 平台 Adapter 无法实现既有语义；
- 可能改变用户对状态、权限、确认或支付结果理解的视觉变更。

### 10.3 禁止偏差

不得：

- 用页面硬编码颜色、间距、字体或圆角绕过 Token；
- 通过 Web 专属 Variant 创建跨端未知语义；
- 为单个页面引入第二套主题；
- 使用纯色彩、纯动画或技术错误表达产品事实；
- 借“设计升级”引入 Payment、Marketplace、CRM 或其他 Deferred Capability。

## 11. DS-01B 冻结结论

现已冻结：

1. Token 分层模型；
2. Color、Typography、Spacing、Radius、Elevation 的 Semantic Token 类别；
3. Token 命名格式与引用边界；
4. Component State 模型；
5. Component Token 的使用边界；
6. Web、App、微信小程序 Adapter 责任；
7. 最低可访问性约束；
8. DS-01C / DS-01D 的优先组件范围。

仍保持开放：

1. Primitive Token 的具体数值；
2. 品牌 Accent 的具体颜色；
3. 字体家族和平台回退；
4. Light / Dark Mode 策略；
5. CSS Variable、Tailwind、Native Theme、WXSS 的实际映射；
6. Web 组件实现；
7. App 和微信小程序 Adapter 实现。

## 12. 下一步

```text
DS-01C — Design Token Value and Accessibility Calibration
        ↓
选择并验证 Primitive Values
        ↓
建立可访问性对比度与动态文本校验
        ↓
形成可生成的 Token Source of Truth
        ↓
仍不改造完整 Web 页面
```

只有 DS-01C 冻结后，才可进入：

```text
DS-01D — Web Reference Design System Implementation
```
