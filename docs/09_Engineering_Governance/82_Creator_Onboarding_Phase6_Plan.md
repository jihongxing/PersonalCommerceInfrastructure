# Creator 初始化流程实现计划 (Phase 6)

**目标**: 补全 Creator 初始化的 5 个阶段，使系统完整闭环  
**预计工时**: 4-5 天  
**设计语言**: 对标 Consumer 侧（Web V2 现有组件库）

---

## 📐 前端架构设计

### 页面结构

```
app/(creator)/
├── layout.tsx                          - Creator 区域布局
├── onboarding/
│   ├── page.tsx                       - Onboarding 流程（条件重定向）
│   └── welcome/page.tsx               - Welcome 欢迎页
├── profile/
│   ├── page.tsx                       - 查看个人资料
│   └── edit/page.tsx                  - 编辑个人资料
├── capabilities/
│   ├── page.tsx                       - 能力管理列表
│   ├── [id]/edit/page.tsx            - 编辑能力
│   └── new/page.tsx                  - 创建能力
├── services/
│   ├── page.tsx                       - 服务管理列表
│   ├── [id]/page.tsx                 - 查看服务详情
│   ├── [id]/edit/page.tsx            - 编辑服务
│   └── new/page.tsx                  - 创建服务
└── dashboard/page.tsx                 - 现有仪表板（预约审核）
```

### 组件结构

```
features/creator-onboarding/
├── api/
│   ├── use-creator-identity.ts       - GET /api/v1/creator/identity
│   ├── use-create-identity.ts        - POST /api/v1/creator/identity
│   ├── use-update-identity.ts        - PATCH /api/v1/creator/identity
│   ├── use-creator-capabilities.ts   - 能力相关 hooks
│   ├── use-creator-services.ts       - 服务相关 hooks
│   └── use-publish-service.ts        - 发布服务 hook
├── components/
│   ├── identity-form.tsx             - 编辑身份表单
│   ├── capability-form.tsx           - 编辑能力表单
│   ├── service-form.tsx              - 编辑服务表单
│   ├── service-card.tsx              - 服务卡片（对标 Consumer 侧）
│   ├── publish-checklist.tsx         - 发布前检查清单
│   └── onboarding-wizard.tsx         - Onboarding 引导
└── lib/
    └── validation.ts                 - 表单验证（zod schemas）
```

---

## 🔑 核心实现流程

### Phase 6.1: Identity (创建身份)

**页面流程**:
```
/creator/onboarding
  ↓ 检查是否有 identity
  ├─ 有 → /creator/profile
  └─ 无 → /creator/onboarding/welcome
        ↓
      /creator/profile/edit
        ↓ 填写表单 (displayName, bio, avatarUrl, location, socialLinks)
        ↓ 提交 POST /api/v1/creator/identity
        ↓ 自动进入能力管理
```

**对标设计**:
- 使用现有的 `Card`, `Form`, `Input`, `Textarea`, `Button` 组件
- 表单验证使用 react-hook-form + zod
- 错误处理：显示 inline 错误信息
- 加载态：提交按钮显示加载动画

### Phase 6.2: Capabilities (能力管理)

**页面流程**:
```
/creator/capabilities
  ↓ 列表显示所有能力（如有）
  ↓ 按钮: 添加能力
        ↓
      /creator/capabilities/new
        ↓ 填写表单 (name, description)
        ↓ 提交 POST /api/v1/creator/identity/capabilities
        ↓ 自动返回列表
```

**对标设计**:
- 列表使用 `Badge` + `Card` 组件展示
- 操作按钮：编辑、删除
- 添加按钮使用 `Button` with icon

### Phase 6.3: Services (服务管理)

**页面流程**:
```
/creator/services
  ↓ 列表显示所有服务（draft/published/archived）
  ↓ 标签页或状态筛选
  ├─ Draft (草稿)
  ├─ Published (已发布)
  └─ Archived (已归档)
  ↓ 操作: 编辑、删除、查看、发布/下架
```

**对标设计**:
- 使用 `Tabs` 组件切换状态（对标 Creator Dashboard 的已有设计）
- 每个服务用 `Card` 展示
- 状态徽章：Badge 组件
- 操作按钮组：编辑、删除、发布

### Phase 6.4: Service Create/Edit

**页面流程**:
```
/creator/services/new 或 /creator/services/[id]/edit
  ↓ 表单字段:
    - capabilityIds (多选)
    - title (160 字符)
    - description (2000 字符)
    - availabilityDescription (1000 字符)
    - appearance (可选，高级字段)
    - requestInstructions (1000 字符)
  ↓ 表单验证实时反馈
  ↓ 提交：POST /api/v1/creator/offerings 或 PATCH /:id
  ↓ 成功 → 自动返回列表
```

**对标设计**:
- 使用现有表单组件库
- 实时字符计数器（对标 BookingForm）
- 字段分组：基础信息、可用性、外观配置
- 错误提示：inline + toast

### Phase 6.5: Publish Flow

**发布前检查**:
```
/creator/services/[id]/publish
  ↓ 显示发布前清单 (CheckList):
    ✓ title 已填写
    ✓ description 已填写
    ✓ capabilities 已关联
    ✓ availability 已设置
    ✓ requestInstructions 已填写
  ↓ 全部通过 → 发布按钮启用
  ↓ 点击发布 → POST /api/v1/creator/offerings/:id/publish
  ↓ 成功 → Toast 提示 + 状态变为 published
  ↓ 自动返回列表或服务详情
```

**对标设计**:
- CheckList 使用 `Card` + `Badge` 组件
- 发布按钮使用 primary 样式
- 成功提示使用 toast（对标预约成功提示）

---

## 📝 实现优先级

### 第 1 天: 基础架构 + Identity

**任务**:
1. 创建 Creator 路由布局 (`/creator` 页面和布局)
2. 创建 Identity 相关 hooks:
   - `useCreatorIdentity` (GET)
   - `useCreateIdentity` (POST)
   - `useUpdateIdentity` (PATCH)
3. 实现 `/creator/profile` 和 `/creator/profile/edit`
4. 集成 Bearer Token 认证（使用现有的 auth 上下文）

**验证**: Identity 创建成功，可以编辑资料

### 第 2 天: Capabilities + Onboarding

**任务**:
1. 创建 Capabilities hooks
2. 实现 `/creator/capabilities` 列表页
3. 实现 `/creator/capabilities/new` 创建表单
4. 实现 `/creator/onboarding` 入口（条件重定向）
5. 实现 Onboarding Welcome 页面

**验证**: 可以创建和管理能力，Onboarding 流程完整

### 第 3 天: Service Management

**任务**:
1. 创建 Service hooks
2. 实现 `/creator/services` 列表页（含标签页）
3. 实现 `/creator/services/new` 创建表单
4. 实现 `/creator/services/[id]/edit` 编辑表单
5. 集成表单验证（使用 zod schemas）

**验证**: 可以创建、编辑、列表查看服务

### 第 4 天: Publish Flow + 完善

**任务**:
1. 创建 Publish hook
2. 实现 `/creator/services/[id]/publish` 发布流程
3. 实现发布前检查清单
4. 集成错误处理和加载态
5. 测试完整的 Onboarding 流程

**验证**: 可以发布服务，服务在 Consumer 侧可被发现

### 第 5 天: 测试 + 优化 + 文档

**任务**:
1. 端到端测试：新 Creator 从零开始的完整流程
2. UI/UX 优化和响应式设计
3. 性能优化（缓存、懒加载）
4. 文档和提交

**验证**: 完整的闭环可工作，所有边界情况处理完整

---

## 🎨 设计语言对标

### Consumer 侧现有设计

```tsx
// Consumer 侧使用的模式:
1. Card 容器 + 内容组织
2. Form: react-hook-form + zod 验证
3. Button: 使用 variant (default/outline/ghost/destructive)
4. Badge: 状态显示
5. Tabs: 多状态管理
6. Toast: 操作反馈
7. Dialog: 确认框
8. Skeleton: 加载态
```

### Creator 侧实现对标

```tsx
// 应该完全相同的设计语言

// 列表页面结构（对标 Consumer BookingForm 容器）
<div className="grid gap-4">
  <Card>
    <CardHeader>
      <CardTitle>服务列表</CardTitle>
    </CardHeader>
    <CardContent>
      {/* 内容 */}
    </CardContent>
  </Card>
</div>

// 表单结构（对标 BookingForm）
<form>
  <FormField
    control={form.control}
    name="title"
    render={({ field }) => (
      <FormItem>
        <FormLabel>服务名称</FormLabel>
        <FormControl>
          <Input {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</form>

// 按钮样式（对标现有按钮）
<Button>创建</Button>
<Button variant="outline">编辑</Button>
<Button variant="destructive">删除</Button>
<Button variant="ghost">查看</Button>

// 状态显示（对标 Badge）
<Badge>Draft</Badge>
<Badge variant="secondary">Published</Badge>
<Badge variant="destructive">Archived</Badge>
```

---

## 🔐 认证设计

### 方案：Bearer Token (短期)

当前 Consumer 侧使用 URL 参数 token，Creator 侧也采用相同方案以保持一致性：

```tsx
// /creator/profile?token=...
// 但背后使用 Bearer Token:
Authorization: Bearer <token>

const token = useSearchParams().get('token');
if (token) {
  localStorage.setItem('creatorToken', token);
}

// 在 API 调用时：
const token = localStorage.getItem('creatorToken');
headers: {
  'Authorization': `Bearer ${token}`
}
```

**注意**: 这是短期方案，生产前应迁移到基于 Session 的认证。

---

## 📊 预计代码量

| 模块 | 文件数 | 行数 | 复杂度 |
|------|--------|------|--------|
| API Hooks | 6 | ~600 | 低 |
| 页面组件 | 8 | ~1200 | 中 |
| 业务组件 | 6 | ~1500 | 中 |
| 表单验证 | 1 | ~200 | 低 |
| 样式/其他 | - | ~200 | 低 |
| **总计** | **21** | **~3700** | - |

---

## ✅ 验证清单

### 功能验收

- [ ] Creator 可以通过 `/creator/onboarding` 进入系统
- [ ] Creator 可以创建和编辑个人身份（displayName, bio）
- [ ] Creator 可以创建和管理能力（Capabilities）
- [ ] Creator 可以创建服务（Offering）
- [ ] Creator 可以编辑服务（修改标题、描述等）
- [ ] Creator 可以发布服务（draft → published）
- [ ] Consumer 可以发现已发布的服务（`/r/[commerceRef]`）
- [ ] Consumer 可以预约已发布的服务
- [ ] Creator 可以在仪表板审核预约
- [ ] 完整的闭环从创建到履约都能工作

### 质量检查

- [ ] 所有表单验证完整（Client + Server）
- [ ] 错误处理完整（API 错误、验证错误）
- [ ] 加载态完整（Skeleton、Loading Button）
- [ ] 响应式设计完整（所有设备）
- [ ] 无 TypeScript 错误
- [ ] 构建通过
- [ ] E2E 测试覆盖主流程

---

## 🚀 开始实现

准备开始第 1 天的实现。
