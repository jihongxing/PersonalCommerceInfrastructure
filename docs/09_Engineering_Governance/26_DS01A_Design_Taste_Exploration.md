# 26 — DS-01A 设计品味探索

> **状态**：DS-01A Complete / 仅设计探索，未冻结 Token  
> **范围**：Personal Commerce Infrastructure 的跨端视觉语言探索  
> **首个实现目标**：Web Reference Client  
> **未来适配目标**：App、微信小程序及其他客户端  
> **最后更新**：2026-08-12

## 1. 文档目的

本文件记录 DS-01A 的视觉方向探索结果，为下一阶段的跨端视觉语义提炼提供输入。

本文件不是：

- Design Token Contract；
- Web CSS 实现方案；
- React / React Native / 小程序组件规范；
- 完整 UI Kit；
- 页面 PRD；
- 产品范围或产品行为变更。

本阶段只回答：

> 这个产品应该以什么视觉语言表达 Creator 的商业身份、服务能力和后续商业关系？

## 2. 设计读取

### 2.1 Design Read

这是一个面向舞者 Creator 的移动优先商业工作台与公开商业入口，服务对象既包括希望管理自身服务的 Creator，也包括需要快速理解服务并发起请求的 Customer。

视觉语言应当：

- 有个人气质，但不依赖某一位 Creator 的个人品牌；
- 有商业可信度，但不呈现传统后台或企业 ERP 的冷硬感；
- 有创作者表达空间，但不牺牲服务信息、状态和下一步动作的清晰度；
- 在手机小屏上成立，并能自然适配 Web、App 和小程序；
- 允许未来加入 Creator 自有图片、颜色或风格，但不破坏基础可读性。

### 2.2 设计基调

```text
Creator-led
        +
Commerce-clear
        +
Calm confidence
        +
Editorial warmth
        +
Mobile-first
```

## 3. 三个设计旋钮

| 旋钮 | 当前建议 | 解释 |
| --- | ---: | --- |
| `DESIGN_VARIANCE` | 5 | 允许 Creator 表达个性，但基础产品保持稳定、可理解和可复用 |
| `MOTION_INTENSITY` | 3 | 动效用于反馈和层级变化，不用于制造炫技或延迟操作 |
| `VISUAL_DENSITY` | 4 | 信息密度适中，优先保留身份、服务、可用性和操作结果 |

这组数值是设计探索参数，不是跨端 Token，也不是产品验收标准。

## 4. 核心视觉原则

### 4.1 个人身份优先

Creator 首先应该被看见为一个具体的人，而不是一个账户、记录或后台实体。

因此：

- 名称、头像、个人介绍和服务能力应形成清晰的身份入口；
- 视觉层级优先突出 Creator 的表达，而非系统状态；
- 页面不使用“管理后台”作为主要情绪；
- 公开页面与 Creator 工作台应共享身份语义，但允许不同信息密度。

### 4.2 商业信息清晰

所有商业内容都应快速回答：

1. 这是谁；
2. 提供什么；
3. 适合谁；
4. 当前是什么状态；
5. 下一步可以做什么。

视觉设计不得以装饰性布局、过度动效或低对比度文本削弱这些信息。

### 4.3 克制的个人表达

产品应支持 Creator 表达风格，但基础视觉不能预设某一种舞蹈风格、性别、城市或审美圈层。

推荐：

- 中性、温暖、可被个人内容激活的基础画布；
- 通过图片、头像、服务内容和少量 Accent 表达个性；
- 用层级、留白和材质表达质量，而不是依赖大面积渐变或复杂背景。

避免：

- 默认霓虹、赛博、紫色 AI 渐变；
- 默认玻璃拟态；
- 为了“年轻”而过度使用贴纸、气泡和动画；
- 把舞者产品误做成演出海报或社交媒体 Feed。

### 4.4 信任先于转化

VS-01 的核心动作是理解服务、发起请求和等待 Creator 决策。

因此视觉系统应优先支持：

- 清楚的状态反馈；
- 可预期的按钮行为；
- 可读的表单说明；
- 稳定的错误和空状态；
- 足够的触控区域；
- 不依赖颜色单独表达状态。

### 4.5 同一语义，不同平台表达

跨端需要共享：

- 颜色语义；
- 字体层级语义；
- 间距节奏；
- 圆角与表面层级；
- 组件状态；
- 无障碍约束；
- 信息优先级。

跨端不要求共享：

- CSS 类名；
- DOM 结构；
- React 组件实现；
- 手势实现；
- 平台导航模式；
- 像素级布局。

## 5. 视觉方向

### 5.1 色彩方向

方向名称：

> **Warm Neutral Canvas with Focused Accent**

基础视觉应以温和的中性画布为主，使用一个明确但不过度侵略的品牌 Accent 表达主要动作和 Creator 个性。

探索结论：

- 背景：温和的浅色中性画布；
- 表面：清晰、略有层次的卡片或内容面；
- 主文本：深色、高对比度；
- 次文本：中性灰，不使用过浅的灰色；
- 主操作：单一 Accent，不在页面中同时使用多套高饱和色；
- 状态色：成功、警告、错误只承担状态语义，不承担品牌装饰；
- 深色主题：暂不冻结，只保留未来映射空间。

本阶段不冻结具体色值，例如 `#xxxxxx`。具体色值要在 DS-01B 与可访问性检查后确定。

### 5.2 字体方向

方向名称：

> **Humanist Sans with Editorial Hierarchy**

推荐使用易读、开放、适合中英文混排的无衬线字体家族，并通过字号、字重和行高形成编辑型层级。

探索结论：

- 大标题应有清晰的身份感，但不追求展示型海报效果；
- 正文优先可读性和移动端行长；
- 标签和辅助信息保持克制，不大量使用小型全大写文字；
- 中文、英文、数字和状态标签需要在同一层级中保持视觉平衡；
- 字体名称不在 DS-01A 阶段冻结，避免把 Web 字体直接变成跨端事实。

建议层级：

```text
Display
Heading
Section Heading
Body
Body Small
Label
Caption
```

### 5.3 形状方向

推荐：

- 中等圆角；
- 表单和按钮保持友好但不玩具化；
- 卡片使用明确边界或轻微表面层次；
- 圆角服务于触控和信息分组，不作为品牌装饰。

避免：

- 全部元素使用胶囊形；
- 每个区块都使用不同圆角；
- 重阴影和漂浮式卡片堆叠；
- 以圆角代替信息层级。

### 5.4 间距与布局方向

布局应以移动端垂直阅读为第一约束：

- 单列优先；
- 重要动作靠近相关内容；
- Creator Identity、服务能力、状态反馈形成连续阅读节奏；
- 宽屏只增加呼吸空间和内容宽度，不强行增加并列信息；
- 表单优先保证输入顺序和错误反馈位置。

### 5.5 表面方向

建议建立三种基础表面语义：

```text
Canvas
    页面背景和整体承载层

Surface
    内容分区、表单和主要卡片

Raised Surface
    需要强调的操作结果、确认状态或关键内容
```

表面层级应主要通过颜色、边界和少量阴影建立，不依赖模糊、透明和复杂材质。

## 6. 交互与动效方向

### 6.1 动效原则

动效只用于：

- 保存或提交后的反馈；
- 状态变化；
- 内容展开和收起；
- 页面之间的轻量过渡；
- 加载状态。

动效不用于：

- 装饰性循环；
- 影响表单输入；
- 延迟按钮可用时间；
- 代替状态说明；
- 强化技术感。

### 6.2 必须定义的交互状态

每个交互组件未来至少需要表达：

```text
Default
Hover / Pressed
Focus
Disabled
Loading
Error
Success
```

移动端没有 Hover 时，使用 Pressed 或触控反馈替代。

### 6.3 状态表达

业务状态不能只依赖颜色。至少同时使用：

- 用户语言标签；
- 位置或结构变化；
- 必要时使用图标；
- 颜色作为辅助信号。

内部状态名不得直接进入用户界面，遵循 `25_User_Facing_Language_Governance.md`。

## 7. VS-01 视觉重点

DS-01A 不改变 VS-01 Flow，但确定以下页面优先级：

### 7.1 Creator Identity

视觉任务：

- 让 Creator 感到这是自己的商业主页，而不是账户设置页；
- 快速完成名称、介绍和服务能力的建立；
- 明确当前主页状态；
- 让下一步行动自然可见。

### 7.2 Public Identity

视觉任务：

- 让 Customer 快速理解 Creator；
- 让服务能力成为主要内容，而非技术字段；
- 让后续服务请求入口具有明确的承接位置；
- 在尚未开放时提供诚实、简短、用户可理解的状态。

### 7.3 Customer Request

视觉任务：

- 让 Customer 明白请求的是一项具体服务；
- 让输入字段保持最小；
- 明确提交前后的状态；
- 不使用支付、订单或履约承诺制造错误预期。

## 8. 组件方向

DS-01A 只定义组件语义，不冻结实现。

| 组件 | 语义方向 |
| --- | --- |
| Button | 单一主要动作、清晰层级、可表达加载和禁用 |
| Input | 标签、帮助文本、错误文本和焦点状态完整 |
| Textarea | 适合个人介绍和服务说明，移动端优先 |
| Card | 内容分组，不作为默认布局容器滥用 |
| Status | 用户语言、状态与结果一致 |
| Empty State | 说明当前没有内容，并给出下一步 |
| Error State | 不泄漏技术细节，提供可行动的恢复建议 |
| Avatar | 识别 Creator，缺省状态仍需保持身份感 |
| Service Summary | 突出服务名称、说明和可行动状态 |

## 9. 可访问性方向

最低要求：

- 正文和主要操作满足 WCAG AA 对比度；
- 键盘焦点清晰；
- 触控目标不小于平台推荐尺寸；
- 表单标签与控件可被辅助技术正确关联；
- 错误和成功状态不只通过颜色表达；
- 支持 `prefers-reduced-motion`；
- 支持动态字体或系统字体放大；
- 不把装饰性图片作为理解内容的唯一来源。

## 10. 跨端提炼候选

以下内容进入 DS-01B 候选清单：

### 10.1 Color Semantics

```text
background.canvas
background.surface
background.raised
text.primary
text.secondary
text.muted
border.default
action.primary
action.primaryPressed
action.secondary
state.success
state.warning
state.error
state.info
focus.ring
```

### 10.2 Typography Semantics

```text
display
heading
sectionHeading
body
bodySmall
label
caption
```

### 10.3 Shape and Spacing Semantics

```text
radius.sm
radius.md
radius.lg
space.1 … space.8
shadow.none
shadow.subtle
shadow.raised
```

### 10.4 Component State Semantics

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

这些只是跨端提炼候选，不是已冻结的最终命名或数值。

## 11. 明确不做

DS-01A 不：

- 修改 `apps/web` 代码；
- 修改产品对象、Flow、PRD 或 API Contract；
- 冻结具体颜色值、字体名称或 CSS 变量；
- 引入 App、React Native 或微信小程序框架；
- 建立完整组件库；
- 引入 Storybook；
- 设计 Dark Mode；
- 设计 Creator 个性化换肤；
- 追求 Web、App、小程序的像素级一致；
- 把 Tailwind、shadcn/ui 或 Next.js 作为跨端设计事实源。

## 12. DS-01A 结论

当前推荐的跨端视觉语言是：

```text
Creator-led
Commerce-clear
Calm confidence
Editorial warmth
Mobile-first
```

下一阶段应执行：

```text
DS-01B
跨端视觉语义提炼
→ 确定 Token 命名层级
→ 确定语义映射
→ 确定可访问性约束
→ 不进入具体平台实现
```
