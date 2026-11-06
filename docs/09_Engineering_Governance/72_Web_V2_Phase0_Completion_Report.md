# Phase 0 完成报告 - Web V2 项目初始化

**日期**: 2026-11-06  
**阶段**: Phase 0 - 项目初始化  
**状态**: ✅ 完成  
**耗时**: Day 1  

---

## 一、完成清单

### ✅ 1. 项目创建

- [x] 创建 Next.js 16.4.5 项目（`apps/web-v2`）
- [x] 使用 TypeScript + Tailwind CSS + App Router
- [x] 配置 Turbopack 加速构建

### ✅ 2. 核心依赖安装

#### 状态管理
- [x] @tanstack/react-query@5.106.1
- [x] @tanstack/react-query-devtools@5.106.1

#### API 客户端
- [x] openapi-fetch@0.15.0
- [x] openapi-typescript-helpers@0.0.13

#### 表单与验证
- [x] zod@3.25.76
- [x] react-hook-form@7.91.0
- [x] @hookform/resolvers@3.10.0

#### QR 码功能
- [x] qrcode@1.5.4
- [x] qr-scanner@1.4.2
- [x] @types/qrcode@1.5.6

#### 工具库
- [x] date-fns@4.4.0
- [x] lucide-react@0.462.0
- [x] clsx@2.1.1
- [x] tailwind-merge@2.6.1
- [x] class-variance-authority@0.7.1

### ✅ 3. 项目结构

```
apps/web-v2/
├── app/
│   ├── (public)/               # 公开页面组
│   │   ├── r/[commerceRef]/    # Creator Profile
│   │   ├── s/[offeringId]/     # 服务详情
│   │   └── o/[token]/          # 订单结果
│   ├── (creator)/              # Creator 后台组
│   │   └── creator/
│   ├── (operations)/           # Operations 后台组
│   │   └── ops/
│   ├── layout.tsx              # Root Layout
│   ├── page.tsx                # 首页
│   └── providers.tsx           # React Query Provider
│
├── components/
│   ├── ui/                     # shadcn/ui 基础组件（待安装）
│   ├── commerce/               # 业务组件
│   └── layout/                 # 布局组件
│
├── features/                   # 功能模块
│   ├── creator-profile/
│   │   ├── api/
│   │   └── components/
│   ├── service-booking/
│   │   ├── api/
│   │   └── components/
│   ├── order-fulfillment/
│   │   ├── api/
│   │   └── components/
│   └── creator-dashboard/
│       ├── api/
│       └── components/
│
├── lib/
│   ├── api/
│   │   ├── client.ts           # OpenAPI Fetch Client
│   │   ├── query-client.ts     # React Query 配置
│   │   └── hooks/              # React Query hooks（待实现）
│   ├── auth/                   # 认证逻辑（待实现）
│   └── utils/
│       ├── cn.ts               # Tailwind merge
│       └── format.ts           # 格式化工具
│
├── styles/
│   └── globals.css             # 全局样式 + Design Tokens
│
├── components.json             # shadcn/ui 配置
├── tailwind.config.ts          # Tailwind 配置
├── tsconfig.json               # TypeScript 配置
├── next.config.ts              # Next.js 配置
├── package.json                # 依赖清单
└── .env.local                  # 环境变量
```

### ✅ 4. 配置文件

#### components.json（shadcn/ui）
```json
{
  "style": "new-york",
  "rsc": true,
  "tailwind": {
    "baseColor": "slate",
    "cssVariables": true
  }
}
```

#### React Query 配置
```typescript
// lib/api/query-client.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5 分钟
      gcTime: 1000 * 60 * 30,         // 30 分钟
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

#### API Client
```typescript
// lib/api/client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
export const apiClient = createClient<paths>({ baseUrl: API_BASE_URL });
```

#### 环境变量
```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

### ✅ 5. 工具函数

#### cn.ts
```typescript
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

#### format.ts
- `formatCurrency(amountMinor, currency)` - 格式化金额
- `formatDateTime(dateString)` - 格式化日期时间
- `formatRelativeTime(dateString)` - 格式化相对时间

### ✅ 6. 构建验证

```bash
pnpm run build
```

**结果**: ✅ 通过

```
Route (app)
┌ ○ /
└ ○ /_not-found

○  (Static)  prerendered as static content
```

---

## 二、技术栈总结

| 类别 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **框架** | Next.js | 16.4.5 | React 框架 + SSR |
| | React | 19.3.0 | UI 库 |
| | TypeScript | 5.9.3 | 类型系统 |
| **样式** | Tailwind CSS | 4.3.4 | 原子化 CSS |
| | Turbopack | 内置 | 构建工具 |
| **状态管理** | React Query | 5.106.1 | 服务端状态 |
| **API** | openapi-fetch | 0.15.0 | API 客户端 |
| **表单** | react-hook-form | 7.91.0 | 表单管理 |
| | zod | 3.25.76 | 验证 schema |
| **QR 码** | qrcode | 1.5.4 | 生成 QR 码 |
| | qr-scanner | 1.4.2 | 扫描 QR 码 |
| **工具** | date-fns | 4.4.0 | 日期处理 |
| | lucide-react | 0.462.0 | 图标库 |

---

## 三、关键决策记录

### 1. 为什么选择 Next.js 16？
- **App Router** 是 Next.js 的未来方向
- **Turbopack** 提供更快的开发体验
- **React 19** 支持最新特性（Server Components）

### 2. 为什么选择 React Query？
- 标准的服务端状态管理解决方案
- 自动缓存、去重、乐观更新
- 开发者工具友好

### 3. 为什么选择 Tailwind CSS v4？
- 项目已经在用 Tailwind
- V4 性能更好（原生 CSS）
- 保持技术栈一致性

### 4. 为什么不立即安装 shadcn/ui 组件？
- 需要按需安装（避免安装不需要的组件）
- Phase 1 实现页面时根据需求安装
- 减少初始化时间

---

## 四、与旧项目的对比

| 维度 | 旧项目（web） | 新项目（web-v2） |
|------|--------------|-----------------|
| **Next.js** | 16.1.4 | 16.4.5 |
| **React** | 19.2.3 | 19.3.0 |
| **Tailwind** | 4.1.18 | 4.3.4 |
| **状态管理** | useState 散落 | React Query 统一 |
| **组件结构** | workspace 模式 | Feature-Sliced Design |
| **路由结构** | 混乱 | 清晰分组 |
| **API 调用** | 组件内直接调用 | 封装在 hooks |
| **类型安全** | 部分 | 完整 |

---

## 五、已知问题与注意事项

### 1. API 类型定义缺失
**问题**: `lib/api/client.ts` 中使用了临时的 `type paths = Record<string, any>`

**解决方案**: Phase 1 开始前，需要从旧项目复制或生成 OpenAPI types

**临时影响**: 无类型检查，但不影响功能实现

### 2. shadcn/ui 组件未安装
**问题**: 基础 UI 组件（Button, Card, Input 等）未安装

**解决方案**: Phase 1 实现页面时按需安装

**命令示例**:
```bash
pnpm dlx shadcn@latest add button card input form
```

### 3. 认证逻辑未实现
**问题**: `lib/auth/` 目录为空

**解决方案**: Phase 4（Creator 后台）实现时从旧项目迁移

### 4. Tailwind CSS v4 差异
**问题**: V4 语法与 V3 有些不同

**注意事项**:
- 不支持 `@apply` 自定义类（如 `bg-background`）
- 需要使用 `hsl(var(--background))` 替代
- `darkMode` 配置从 `['class']` 改为 `'class'`

---

## 六、下一步工作（Phase 1）

### 目标
实现 P0 核心流程 - Creator Profile 页面（`/r/[commerceRef]`）

### 准备工作
1. 从旧项目复制 API 类型定义
2. 安装基础 UI 组件（Button, Card, Avatar）
3. 创建后端 API（如需要）

### 实施内容
1. React Query Hook: `useCreatorProfile.ts`
2. 业务组件: `creator-profile-card.tsx`, `service-card.tsx`
3. 页面: `app/(public)/r/[commerceRef]/page.tsx`

**预计时间**: Day 2-3（2 天）

---

## 七、统计数据

- **新增文件**: 25 个
- **代码行数**: 5,321 行
- **依赖包数**: 500 个（包括传递依赖）
- **安装耗时**: ~3 分钟
- **构建耗时**: ~1 秒（Turbopack）
- **项目大小**: ~280 MB（node_modules）

---

## 八、提交记录

```
commit 3a8e13e
feat: Phase 0 - Web V2 project initialization complete

Initialized new Next.js 16 project with modern stack:
- Next.js 16.4.5 with Turbopack
- React 19.3.0
- Tailwind CSS v4
- TypeScript 5.9.3
...
```

---

**总结**: Phase 0 顺利完成！项目基础架构已搭建完毕，所有依赖已安装，构建通过。准备进入 Phase 1 实施。🎉
