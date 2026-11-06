# Web 前端全面重构方案

**项目**: Personal Commerce Infrastructure  
**文档日期**: 2026-11-06  
**状态**: 方案讨论中  
**范围**: 完整的 Web 前端重构，而非修修补补  

---

## 一、现状分析与问题诊断

### 1.1 当前架构问题

#### 问题 1：**路由结构混乱，缺乏一致性**

```
当前路由：
/                           → 首页（营销页）
/creator                    → Creator 后台（认证）
/customer                   → Customer 占位符（无用）
/operations                 → Operations 后台（认证）
/public                     → 占位符页面（无用）
/public/[offeringId]        → 服务详情 + 预约
/public/requests/[token]    → 订单结果
/public/reservations/[token]→ 预约结果（Contract 功能）
```

**问题**：
- ❌ 路由命名不一致（`/public` vs `/creator` vs `/operations`）
- ❌ 存在无用的占位符页面（`/customer`, `/public`）
- ❌ C号 访问路径缺失（核心产品功能未实现）
- ❌ 路由层级不合理（`/public/requests/[token]` 太深）

#### 问题 2：**组件粒度过大，职责不清**

```typescript
// 现有组件大小（行数）
creator-identity-workspace.tsx     → 36KB (800+ 行)
creator-earnings-workspace.tsx     → 27KB (670+ 行)
commercial-pilot-operations-workspace.tsx → 13KB (300+ 行)
```

**问题**：
- ❌ 单个组件承担过多职责（展示 + 表单 + 状态管理 + API 调用）
- ❌ 无法复用（workspace 组件太特化）
- ❌ 测试困难（状态和逻辑耦合）
- ❌ 命名模式不一致（`-workspace` vs `-result` vs `-router`）

#### 问题 3：**缺乏设计系统和组件规范**

```
当前组件分类混乱：
components/
  ├── creator-*-workspace.tsx       → Creator 特化组件
  ├── customer-*-workspace.tsx      → Customer 特化组件
  ├── private-*-workspace.tsx       → Private 功能组件
  ├── public-*-workspace.tsx        → Public 功能组件
  ├── fulfillment-code-display.tsx  → 业务组件
  ├── qr-code-scanner.tsx           → 业务组件
  └── ui/                           → 基础 UI 组件
```

**问题**：
- ❌ 缺乏清晰的组件层级（基础层 / 业务层 / 页面层）
- ❌ 命名规范不统一（`workspace` vs `display` vs `scanner`）
- ❌ 组件职责边界模糊（展示 vs 容器 vs 页面）

#### 问题 4：**状态管理混乱**

```typescript
// 典型问题代码
export function CreatorEarningsWorkspace() {
  const [confirmedRequests, setConfirmedRequests] = useState([]);
  const [workspace, setWorkspace] = useState(emptyWorkspace);
  const [grossPriceMinor, setGrossPriceMinor] = useState('39900');
  const [serviceTerms, setServiceTerms] = useState('...');
  const [fulfillmentEvidence, setFulfillmentEvidence] = useState('');
  const [withdrawalAmountMinor, setWithdrawalAmountMinor] = useState('');
  const [destinationReference, setDestinationReference] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [settlementScenario, setSettlementScenario] = useState('immediate');
  const [withdrawalScenario, setWithdrawalScenario] = useState('success');
  const [refundScenario, setRefundScenario] = useState('after_settlement');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  // ... 还有更多状态
}
```

**问题**：
- ❌ 14+ 个 useState（状态爆炸）
- ❌ 无状态机管理（pending/loading/error）
- ❌ 缺乏持久化策略（刷新丢失）
- ❌ 缺乏乐观更新（用户体验差）

#### 问题 5：**API 调用层混乱**

```typescript
// 当前模式：组件内直接调用
const client = useMemo(
  () => createApiClient({ apiBaseUrl, accessTokenProvider }),
  [accessTokenProvider]
);

const response = await client.POST('/api/v1/creator/paid-orders', {
  body: { commerceActionId, grossPriceMinor, serviceTerms },
});

if (response.error !== undefined) {
  throw new Error(creatorEarningsCopy.failed);
}
```

**问题**：
- ❌ 组件直接调用 API（违反单一职责）
- ❌ 错误处理重复（每个调用都要写 if）
- ❌ 无统一的加载状态管理
- ❌ 无请求缓存和去重

#### 问题 6：**样式系统不规范**

```typescript
// 当前模式：全局 CSS 类名
<div className="ds-result-page ds-page">
  <header className="ds-workspace-header">
    <div className="ds-workspace-brand">
      <span className="ds-brand-mark" aria-hidden="true" />
      <span>{commonCopy.brand}</span>
    </div>
  </header>
</div>
```

**问题**：
- ❌ 全局 CSS 类名（`ds-*`）容易冲突
- ❌ 无类型检查（拼写错误运行时才发现）
- ❌ 缺乏 Design Token（颜色、间距硬编码）
- ❌ 响应式设计不系统（媒体查询散落各处）

#### 问题 7：**缺乏产品核心功能**

**当前缺失**：
- ❌ C号 访问路径（`/r/[commerceRef]`）
- ❌ Creator Profile 公开页（产品核心）
- ❌ 简化的预约流程（当前流程太复杂）
- ❌ 移动端优化（大部分页面桌面端设计）

### 1.2 技术债务量化

| 指标 | 当前值 | 理想值 | 差距 |
|------|--------|--------|------|
| 组件平均大小 | ~400 行 | ~150 行 | -250 行 |
| 单组件最大 useState | 14+ 个 | ≤5 个 | -9 个 |
| 可复用组件占比 | ~20% | ~60% | -40% |
| E2E 测试覆盖 | 0% | 80% | -80% |
| 移动端适配 | ~30% | ~95% | -65% |
| 性能得分（Lighthouse） | 未知 | ≥90 | ? |

---

## 二、重构目标与原则

### 2.1 核心目标

1. **产品目标**：实现 C号 核心流程
   - Creator 分享 C号 → Consumer 访问 Profile → 选择服务 → 提交预约 → 获得履约码

2. **架构目标**：建立清晰的组件层级
   - 基础层（UI 组件）→ 业务层（功能组件）→ 页面层（路由组件）

3. **质量目标**：可测试、可维护、可扩展
   - 组件平均 < 200 行
   - 测试覆盖率 > 70%
   - 移动端适配 > 90%

### 2.2 重构原则

1. **组件化原则**
   - ✅ 单一职责（一个组件只做一件事）
   - ✅ 可组合（小组件组合成大组件）
   - ✅ 可测试（纯函数优先）

2. **状态管理原则**
   - ✅ 服务端状态 vs 客户端状态分离
   - ✅ 使用状态机管理复杂流程
   - ✅ 乐观更新 + 错误回滚

3. **性能原则**
   - ✅ 代码分割（路由级别）
   - ✅ 图片懒加载
   - ✅ API 响应缓存

4. **可访问性原则**
   - ✅ 语义化 HTML
   - ✅ ARIA 标签
   - ✅ 键盘导航

---

## 三、重构方案

### 3.1 新路由结构

```
提案 A：扁平化路由（推荐）
├── /                           → 营销首页
├── /r/[commerceRef]            → Creator Profile（C号 访问）✨ 新增
├── /s/[offeringId]             → 服务详情 + 预约 ✨ 重构
├── /o/[token]                  → 订单结果 + 履约码 ✨ 重构
├── /creator                    → Creator 后台
└── /ops                        → Operations 后台 ✨ 重命名

提案 B：语义化路由
├── /                           → 营销首页
├── /profile/[commerceRef]      → Creator Profile（C号 访问）✨ 新增
├── /service/[offeringId]       → 服务详情 + 预约 ✨ 重构
├── /order/[token]              → 订单结果 + 履约码 ✨ 重构
├── /creator                    → Creator 后台
└── /operations                 → Operations 后台
```

**推荐**：**提案 A（扁平化路由）**

**理由**：
- ✅ URL 更短，易于分享（`/r/3479AC-...` vs `/profile/3479AC-...`）
- ✅ 符合短链接习惯（类似 Bitly: `/abc123`）
- ✅ C号 天然适合短路由（18 字符已经不短）

### 3.2 新组件层级

```
src/
├── components/
│   ├── ui/                      # 基础层（Design System）
│   │   ├── button.tsx           # 按钮
│   │   ├── input.tsx            # 输入框
│   │   ├── card.tsx             # 卡片
│   │   ├── dialog.tsx           # 对话框
│   │   ├── toast.tsx            # 通知
│   │   └── ...
│   │
│   ├── commerce/                # 业务层（Commerce 领域）✨ 新增
│   │   ├── creator-profile-card.tsx         # Creator 卡片
│   │   ├── service-card.tsx                 # 服务卡片
│   │   ├── booking-form.tsx                 # 预约表单
│   │   ├── order-status-badge.tsx           # 订单状态徽章
│   │   ├── fulfillment-code-display.tsx     # 履约码展示（已有）
│   │   ├── fulfillment-code-scanner.tsx     # 履约码扫描器（已有）
│   │   └── ...
│   │
│   ├── layout/                  # 布局层 ✨ 新增
│   │   ├── header.tsx           # 页头
│   │   ├── footer.tsx           # 页尾
│   │   ├── sidebar.tsx          # 侧边栏
│   │   └── container.tsx        # 容器
│   │
│   └── workspace/               # 页面容器层（保留必要的）
│       ├── creator-dashboard.tsx            # Creator 后台（重构）
│       └── operations-dashboard.tsx         # Ops 后台（重构）
│
├── features/                    # 功能模块 ✨ 新增
│   ├── creator-profile/         # Creator Profile 功能
│   │   ├── profile-view.tsx     # Profile 页面容器
│   │   ├── use-creator-profile.ts  # Profile 数据 hook
│   │   └── profile.types.ts     # 类型定义
│   │
│   ├── service-booking/         # 预约功能
│   │   ├── service-view.tsx     # 服务页面容器
│   │   ├── booking-flow.tsx     # 预约流程
│   │   ├── use-booking.ts       # 预约状态 hook
│   │   └── booking.types.ts
│   │
│   └── order-management/        # 订单管理
│       ├── order-view.tsx
│       ├── use-order.ts
│       └── order.types.ts
│
├── lib/
│   ├── api/                     # API 层 ✨ 重构
│   │   ├── client.ts            # API 客户端（已有）
│   │   ├── hooks/               # React Query hooks ✨ 新增
│   │   │   ├── use-creator-profile.ts
│   │   │   ├── use-service.ts
│   │   │   ├── use-order.ts
│   │   │   └── use-fulfillment.ts
│   │   └── queries.ts           # Query 定义
│   │
│   ├── state/                   # 状态管理 ✨ 新增
│   │   ├── booking-machine.ts   # 预约流程状态机（XState）
│   │   └── order-machine.ts     # 订单流程状态机
│   │
│   └── utils/                   # 工具函数
│       ├── format.ts            # 格式化（金额、日期）
│       └── validation.ts        # 表单验证
│
└── app/
    ├── (marketing)/             # 营销页面组 ✨ 新增
    │   └── page.tsx             # 首页
    │
    ├── (public)/                # 公开页面组 ✨ 新增
    │   ├── r/[commerceRef]/     # Creator Profile
    │   ├── s/[offeringId]/      # 服务详情
    │   └── o/[token]/           # 订单结果
    │
    ├── (creator)/               # Creator 后台组 ✨ 新增
    │   └── creator/
    │
    └── (operations)/            # Operations 后台组 ✨ 新增
        └── ops/
```

### 3.3 技术栈升级

#### 当前技术栈
```json
{
  "next": "16.1.4",
  "react": "19.2.3",
  "openapi-fetch": "0.15.0",
  "tailwindcss": "4.1.18"
}
```

#### 建议新增
```json
{
  "@tanstack/react-query": "^5.0.0",  // API 状态管理
  "xstate": "^5.0.0",                 // 状态机（可选）
  "zod": "^3.22.0",                   // 运行时类型校验
  "react-hook-form": "^7.49.0",       // 表单管理
  "@radix-ui/react-*": "latest",      // 无障碍组件库（已部分使用）
  "framer-motion": "^10.0.0",         // 动画（可选）
  "sharp": "^0.33.0"                  // 图片优化（Next.js 已集成）
}
```

### 3.4 API 层重构

#### 当前模式（问题）
```typescript
// 组件内直接调用
const response = await client.POST('/api/v1/creator/paid-orders', {...});
if (response.error !== undefined) {
  throw new Error('...');
}
```

#### 重构后（推荐）
```typescript
// lib/api/hooks/use-order.ts
export function useCreateOrder() {
  return useMutation({
    mutationFn: async (data: CreateOrderInput) => {
      const response = await client.POST('/api/v1/creator/paid-orders', {
        body: data,
      });
      if (response.error) throw new ApiError(response.error);
      return response.data;
    },
    onSuccess: (data) => {
      // 乐观更新缓存
      queryClient.invalidateQueries(['orders']);
    },
  });
}

// 组件内使用
function OrderForm() {
  const createOrder = useCreateOrder();
  
  const handleSubmit = (data) => {
    createOrder.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
      {createOrder.isPending && <Spinner />}
      {createOrder.isError && <ErrorMessage error={createOrder.error} />}
    </form>
  );
}
```

**优势**：
- ✅ 加载/错误状态自动管理
- ✅ 请求缓存和去重
- ✅ 乐观更新
- ✅ 组件职责清晰（只管 UI）

---

## 四、实施计划

### 阶段 1：基础重构（3-4 天）

**目标**：建立新架构，不破坏现有功能

1. **新建路由和空页面**
   - [x] 保留现有 `/creator`, `/operations`
   - [ ] 新建 `/r/[commerceRef]/page.tsx`（空壳）
   - [ ] 新建 `/s/[offeringId]/page.tsx`（空壳）
   - [ ] 新建 `/o/[token]/page.tsx`（空壳）

2. **搭建组件层级**
   - [ ] 创建 `components/commerce/` 目录
   - [ ] 创建 `components/layout/` 目录
   - [ ] 创建 `features/` 目录

3. **引入 React Query**
   - [ ] 安装 `@tanstack/react-query`
   - [ ] 配置 QueryClient
   - [ ] 创建 `lib/api/hooks/` 目录

4. **提取基础组件**
   - [ ] 从现有 workspace 中提取可复用组件
   - [ ] 移动到 `components/commerce/`

### 阶段 2：核心功能迁移（4-5 天）

**目标**：实现 C号 访问路径

1. **实现 Creator Profile 页面**
   - [ ] 后端：`GET /api/v1/public/commerce-profile/:commerceRef`
   - [ ] 前端：`/r/[commerceRef]/page.tsx`
   - [ ] 组件：`creator-profile-card.tsx`
   - [ ] Hook：`use-creator-profile.ts`

2. **实现服务详情页面**
   - [ ] 前端：`/s/[offeringId]/page.tsx`
   - [ ] 组件：`service-card.tsx`, `booking-form.tsx`
   - [ ] Hook：`use-service.ts`, `use-booking.ts`

3. **实现订单结果页面**
   - [ ] 前端：`/o/[token]/page.tsx`
   - [ ] 复用：`fulfillment-code-display.tsx`（已有）
   - [ ] Hook：`use-order.ts`

### 阶段 3：Creator 后台重构（3-4 天）

**目标**：简化 Creator 后台组件

1. **拆分 creator-identity-workspace.tsx（36KB）**
   - [ ] 提取：`profile-editor.tsx`
   - [ ] 提取：`capability-list.tsx`
   - [ ] 提取：`offering-list.tsx`

2. **拆分 creator-earnings-workspace.tsx（27KB）**
   - [ ] 提取：`order-list.tsx`
   - [ ] 提取：`wallet-card.tsx`
   - [ ] 提取：`withdrawal-form.tsx`
   - [ ] 复用：`fulfillment-code-scanner.tsx`（已有）

3. **引入状态管理**
   - [ ] 使用 React Query 管理服务端状态
   - [ ] 减少组件内 useState

### 阶段 4：Operations 后台重构（2-3 天）

**目标**：简化 Operations 后台

1. **拆分 commercial-pilot-operations-workspace.tsx（13KB）**
   - [ ] 提取业务组件
   - [ ] 使用 React Query

2. **拆分 operations-external-fact-workspace.tsx（13KB）**
   - [ ] 提取业务组件
   - [ ] 使用 React Query

### 阶段 5：清理与优化（2-3 天）

**目标**：移除旧代码，优化性能

1. **移除旧路由和组件**
   - [ ] 删除 `/customer` 页面（无用）
   - [ ] 删除 `/public` 页面（无用）
   - [ ] 删除 `public/[offeringId]` 页面（迁移到 `/s/[offeringId]`）
   - [ ] 删除 `public/requests/[token]` 页面（迁移到 `/o/[token]`）

2. **性能优化**
   - [ ] 图片优化（next/image）
   - [ ] 代码分割（动态导入）
   - [ ] 路由预取

3. **E2E 测试**
   - [ ] Playwright 配置
   - [ ] 核心流程测试（C号 → 预约 → 履约）

---

## 五、风险评估

### 5.1 技术风险

| 风险 | 影响 | 概率 | 应对 |
|------|------|------|------|
| React Query 学习曲线 | 中 | 中 | 先看文档，小范围试验 |
| 组件拆分过细 | 低 | 低 | 遵循"100-200 行"原则 |
| 状态机引入复杂度 | 中 | 低 | XState 可选，简单流程用 useState |
| 破坏现有功能 | 高 | 中 | 增量迁移，保留旧路由 |

### 5.2 时间风险

**预估总时间**：14-19 天（~3-4 周）

**风险因素**：
- 需求变更（如果产品有新优先级）
- 技术难点（如 React Query 遇到坑）
- 测试时间（E2E 测试通常比预期长）

---

## 六、需要确认的决策

### 决策 1：路由方案
- [ ] **提案 A**：扁平化路由（`/r/`, `/s/`, `/o/`）
- [ ] **提案 B**：语义化路由（`/profile/`, `/service/`, `/order/`）
- [ ] 其他方案：_____________

### 决策 2：状态管理
- [ ] **推荐**：React Query（服务端状态）+ useState（UI 状态）
- [ ] React Query + XState（复杂流程）
- [ ] 其他方案：_____________

### 决策 3：组件库
- [ ] **当前**：@radix-ui + 手写 UI 组件
- [ ] 引入 shadcn/ui（基于 Radix 的组件库）
- [ ] 其他方案：_____________

### 决策 4：实施策略
- [ ] **推荐**：增量迁移（新路由共存，逐步废弃旧路由）
- [ ] 全量重写（新建项目，一次性切换）
- [ ] 其他方案：_____________

---

## 七、下一步行动

### 立即可做
1. **确认上述决策**（路由、状态管理、组件库、实施策略）
2. **创建技术设计文档**（详细的 API 设计、组件 API）
3. **搭建 Demo**（单个页面验证技术栈）

### 需要讨论
1. C号 访问路径的 SEO 策略（需要 SSR 吗？）
2. 移动端优先 vs 桌面端优先（当前是桌面端）
3. 国际化支持（当前只有中文）

---

**总结**：这是一次**完整的重构**，而非修修补补。目标是建立一个**清晰、可维护、可扩展**的前端架构，支持产品的长期发展。

**关键问题**：你对这个方案有什么想法？哪些部分需要调整？
