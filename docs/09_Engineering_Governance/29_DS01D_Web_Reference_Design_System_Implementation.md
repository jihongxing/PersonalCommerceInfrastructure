# DS-01D — Web Reference Design System Implementation

## 1. 目的与范围

DS-01D 将 `design-system/tokens/design-tokens.json` 中冻结的跨端视觉语义，落地为 Web Reference Client 的第一个平台适配器。

本 Change Unit 只处理：

- Web Token Adapter；
- Button、Input、Textarea、Form Field、Surface/Card、Status Message、Empty State；
- 当前 Web 业务表面迁移；
- 无障碍行为与设计系统工程门禁。

本 Change Unit 不改变产品对象、Product Flow、API Contract、状态机、Canonical Event 或 VS-01 范围。

## 2. 上游事实源

| 来源 | 用途 |
| --- | --- |
| `27_DS01B_Cross_Platform_Design_Token_Contract.md` | 跨端视觉语义与适配边界 |
| `28_DS01C_Token_Value_and_Accessibility_Calibration.md` | Token 数值与可访问性约束 |
| `design-system/tokens/design-tokens.json` | Token Value Source of Truth |
| `20_MVP_PRD_VS01.md` | 产品范围与用户行为约束 |
| `25_User_Facing_Language_Governance.md` | 用户可见语言约束 |

## 3. Web Token Adapter

Web 适配器由生成脚本从 Token Source of Truth 生成：

```text
design-system/tokens/design-tokens.json
        ↓
scripts/design/generate-web-token-adapter.mjs
        ↓
apps/web/src/design-system/generated-tokens.css
```

`generated-tokens.css` 不得手工编辑。业务页面只能通过设计系统组件或 `ds-*` 语义布局类使用视觉语义。

命令：

```powershell
pnpm design:generate-web-tokens
pnpm check:web-token-adapter
```

## 4. 组件清单

已实现的 Web 适配器组件：

- `Button`
- `Input`
- `Textarea`
- `FormField`
- `Surface`
- `StatusMessage`
- `EmptyState`

组件内部可以使用 CSS Token；业务页面不得直接复制组件视觉实现或使用原始颜色、圆角、阴影 Tailwind 工具类。

## 5. 业务表面边界

已迁移的业务表面：

- 首页入口；
- Creator Identity 工作台；
- 公开主页占位页；
- Customer 占位页。

迁移保持不变：

- 用户可见文案及可访问名称；
- 字段 `id`；
- API Client 调用；
- Creator Identity 状态与业务行为；
- 现有 M2 验收路径。

## 6. 可访问性实现

Web Adapter 必须保持：

- 表单控件拥有可关联的可见 Label；
- 键盘焦点清晰可见；
- 控件最小触控目标来自 Token；
- 状态信息使用文本表达，不只依赖颜色；
- 支持 `prefers-reduced-motion`；
- Button、Input、Textarea 不由业务页面直接实现视觉样式。

## 7. 强制门禁

以下命令纳入 Preflight：

```powershell
pnpm check:design-tokens
pnpm check:web-token-adapter
pnpm check:web-design-system
```

`check:web-design-system` 扫描 Web 业务页面和 Creator Identity 工作台，阻止：

- 原始颜色 Tailwind 工具类；
- 原始圆角或阴影工具类；
- 业务页面直接使用原生 Button、Input、Textarea 视觉控件。

设计系统组件目录与生成 Token 文件不属于业务表面扫描范围。

## 8. 生成与变更规则

修改 Token Value 时：

1. 先修改 `design-system/tokens/design-tokens.json`；
2. 运行 `pnpm design:generate-web-tokens`；
3. 运行 `pnpm check:design-tokens`；
4. 运行 `pnpm check:web-token-adapter`；
5. 运行相关 Web 验收。

修改跨端语义、组件状态或新增组件时，必须先登记 Design Decision，不得通过 Web 专属 CSS 语义绕过跨端契约。

## 9. 明确不做

DS-01D 不实现：

- App 或微信小程序 Adapter；
- Payment、Settlement、Refund；
- Marketplace、Search、Discovery；
- CRM、Membership、Fan Relationship；
- Event、Experience、Service 的新产品流程；
- 新的领域对象、状态机或 Canonical Event；
- 完整 VS-01。

## 10. 验收标准

- [x] Token CSS 可由 Source of Truth 生成；
- [x] 生成文件可检测过期；
- [x] Button、Input、Textarea、Form Field、Surface、Status Message、Empty State 可复用；
- [x] Creator Identity 工作台使用共享组件；
- [x] 入口页面使用 `ds-*` 语义类；
- [x] 用户文案继续通过 Copy Catalog；
- [x] 业务页面禁止原始颜色、圆角、阴影工具类；
- [x] Token、用户语言和 Web 设计系统门禁接入 Preflight；
- [x] 完整 Preflight 通过；
- [x] 浏览器验收在当前可用系统 Edge 环境通过（4 passed / 13 skipped）。

## 11. Decision Record

### DS-01D-DEC-001 — Web 作为首个视觉 Adapter

Web 是当前唯一实现平台，但不代表产品最终形态冻结为 Web。App 与微信小程序未来复用同一套跨端视觉语义，不复用 Web DOM、CSS 或 React 代码。

### DS-01D-DEC-002 — 业务页面不得直接承载视觉 Token Value

业务页面只使用 Design System Component 与 `ds-*` 语义布局类；具体颜色、字体、间距、圆角和状态样式由 Adapter 管理。

## 12. Revisit Triggers

以下情况触发重新审查：

- 新客户端无法表达现有 Semantic Token；
- 组件状态需要新增跨端语义；
- 现有 Token 无法满足实际无障碍要求；
- 业务页面出现设计系统门禁例外；
- 视觉变化可能改变用户对产品状态、权限或交易结果的理解。
