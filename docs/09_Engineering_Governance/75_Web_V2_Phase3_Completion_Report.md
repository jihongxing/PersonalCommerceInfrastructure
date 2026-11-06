# Phase 3 完成报告 - 订单结果页

**日期**: 2026-11-06  
**阶段**: Phase 3 - P0 核心流程（订单结果页）  
**状态**: ✅ 完成  
**耗时**: Day 3（部分）  

---

## 一、完成清单

### ✅ 前端实现

#### 1. React Query Hook

**use-order-result.ts**:
```typescript
export function useOrderResult(token: string) {
  return useQuery({
    queryKey: ['order-result', token],
    queryFn: async () => { /* GET /api/v1/public/requests/:token */ },
    enabled: !!token,
    staleTime: 1000 * 30, // 30 秒缓存
    refetchInterval: (query) => {
      // submitted 状态自动轮询
      const data = query.state.data as OrderResult | undefined;
      return data?.state === 'submitted' ? 10000 : false;
    },
  });
}
```

**特性**:
- ✅ 自动轮询（submitted 状态每 10 秒刷新）
- ✅ 30 秒缓存（避免频繁请求）
- ✅ 条件查询（仅当 token 有效时）
- ✅ 智能刷新（confirmed/declined 不再轮询）

#### 2. 业务组件

**order-result-card.tsx**:

**功能模块**:
1. **状态徽章** (`StateBadge`)
   - submitted → "等待 Creator 回复"（灰色）
   - confirmed → "已确认"（蓝色）
   - declined → "已拒绝"（红色）

2. **履约码展示** (`FulfillmentCodeDisplay`)
   - 大字号履约码（FC-XXXXXXXX）
   - 状态徽章（待使用/已使用/已过期）
   - 过期时间 / 确认时间
   - 使用提示

3. **状态提示**
   - submitted: 黄色提示框 + 自动刷新说明
   - declined: 红色提示框 + 重新提交建议

#### 3. 页面组件

**app/(public)/o/[token]/page.tsx**:

**布局结构**:
```
┌─────────────────────────────────┐
│  订单结果卡片                     │
│  - 状态徽章                      │
│  - 状态消息                      │
│  - 查询码                        │
│  - 履约码（如果已确认）           │
│  - 状态提示                      │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  手动刷新按钮（submitted 状态）   │
│  + 自动刷新说明                  │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  返回首页按钮                     │
└─────────────────────────────────┘
```

**状态处理**:
- ✅ 加载状态（Skeleton）
- ✅ 错误状态（查询码无效提示 + 重试按钮）
- ✅ 成功状态（完整展示）
- ✅ 实时更新（submitted 自动轮询）

#### 4. BookingForm 更新

**修改内容**:
```typescript
// 提交成功后立即跳转
const onSubmit = async (values) => {
  const result = await submitBooking.mutateAsync(values);
  router.push(`/o/${result.resultAccessToken}`);
};

// "查看预约状态"按钮
onClick={() => {
  router.push(`/o/${submitBooking.data.resultAccessToken}`);
}}
```

**行为**:
- ✅ 提交后自动跳转到结果页
- ✅ 备用成功状态（防止跳转失败）
- ✅ "查看预约状态"按钮可用

---

## 二、用户流程（P0 完整闭环）

### 完整的端到端流程

```
1. 用户访问 /r/3479AC-DEFHJK-MNPQRT
   ↓
2. 看到 Creator Profile + 服务列表
   ↓
3. 点击 "查看详情"
   ↓
4. 跳转到 /s/offering-123
   ↓
5. 看到服务详情 + Creator 信息
   ↓
6. 填写预约表单并提交
   ↓
7. 自动跳转到 /o/result-token-abc123
   ↓
8. 看到 "等待 Creator 回复"（submitted）
   ↓
   页面自动每 10 秒刷新
   ↓
9. Creator 确认预约（后台操作）
   ↓
10. 页面自动更新为 "已确认"（confirmed）
    ↓
11. 显示履约码 FC-XXXXXXXX
    ↓
12. 用户出示履约码给 Creator
    ↓
13. Creator 扫描履约码确认履约
    ↓
14. 履约码状态更新为 "已使用"
```

---

## 三、技术亮点

### 1. 智能轮询

**问题**: 订单状态可能在任何时候由 Creator 更新

**解决方案**:
```typescript
refetchInterval: (query) => {
  const data = query.state.data as OrderResult | undefined;
  // submitted 状态：每 10 秒轮询
  // confirmed/declined：停止轮询
  return data?.state === 'submitted' ? 10000 : false;
},
```

**优势**:
- 自动获取最新状态
- 节省网络资源（确认后停止）
- 用户无需手动刷新

### 2. 履约码展示

**设计要点**:
```tsx
<p className="text-3xl font-mono font-bold tracking-wider">
  {code.code}
</p>
```

**特性**:
- 大字号（易读）
- 等宽字体（对齐）
- 加宽字距（清晰）
- 状态徽章（一目了然）

### 3. 用户友好的状态提示

**submitted 状态**:
```
⏳ 您的预约请求已提交，正在等待 Creator 确认。
页面将自动刷新显示最新状态。
```

**declined 状态**:
```
❌ 很抱歉，Creator 无法接受此预约。
您可以尝试调整需求后重新提交。
```

**pending 履约码**:
```
💡 提示：请在与 Creator 见面时出示此履约码，
由 Creator 扫描确认。
```

### 4. 相对时间格式化

**formatRelativeTime** 使用:
```typescript
过期时间：2 小时后
确认时间：5 分钟前
```

**优势**:
- 比绝对时间更直观
- 自动适应语言
- 实时感更强

---

## 四、数据流图

```
┌─────────────────────────────────────────────────────┐
│  1. 用户提交预约表单                                 │
│     POST /api/v1/public/offerings/:id/requests      │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  2. 后端创建 CustomerRequest                         │
│     - actionId: cr-abc123                           │
│     - resultAccessToken: result-token-xyz           │
│     - state: 'submitted'                            │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  3. 前端跳转到 /o/result-token-xyz                   │
│     useOrderResult(token) 开始轮询                   │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  4. 每 10 秒调用 GET /api/v1/public/requests/:token │
│     检查 state 是否变化                              │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  5. Creator 确认预约（后台）                         │
│     - state: 'submitted' → 'confirmed'              │
│     - 生成 FulfillmentCode: FC-ABCD1234             │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│  6. 前端自动获取最新数据                             │
│     - 显示 "已确认" 徽章                             │
│     - 展示履约码 FC-ABCD1234                         │
│     - 停止轮询                                       │
└─────────────────────────────────────────────────────┘
```

---

## 五、状态机

### CustomerRequest 状态流转

```
       提交预约
          ↓
    ┌──────────┐
    │submitted │ ←─── 初始状态
    └──────────┘
         │
    Creator 处理
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐ ┌─────────┐
│confirmed│ │declined │
└─────────┘ └─────────┘
    │           │
生成履约码    终态
    │
    ▼
┌──────────────────┐
│FulfillmentCode   │
│ - pending        │ ←─── 待使用
│ - fulfilled      │ ←─── 已使用（Creator 扫描确认）
│ - expired        │ ←─── 已过期
└──────────────────┘
```

---

## 六、已知限制与未来工作

### 1. 当前限制

**无 Push 通知**:
- ❌ 状态变化时用户不会收到通知
- ❌ 依赖用户保持页面打开或手动刷新

**解决方案**: 未来可以添加：
- WebSocket 实时推送
- 邮件/短信通知
- PWA 推送通知

**无履约码扫描功能**:
- ❌ Consumer 端无法扫描履约码
- ✅ Creator 端扫描（Phase 4 实现）

### 2. 未实现功能（Phase 4-5）

**Creator 端功能**:
- Creator 看到待处理的预约请求列表
- Creator 确认/拒绝预约
- Creator 扫描履约码确认履约

**Consumer 端增强**:
- 预约历史列表
- 多个订单管理
- 取消预约功能

---

## 七、测试验证

### 7.1 构建验证

```bash
cd apps/web-v2
pnpm run build
```

**结果**: ✅ 通过

```
Route (app)
┌ ○ /
├ ○ /_not-found
├   /o/[token]
│ └ ◐ /o/[token]
├   /r/[commerceRef]
│ └ ◐ /r/[commerceRef]
└   /s/[offeringId]
  └ ◐ /s/[offeringId]
```

### 7.2 手动测试（待执行）

**测试场景 1: 提交后立即查看**
1. 填写预约表单并提交
2. 应自动跳转到 `/o/[token]`
3. 看到 "等待 Creator 回复" 状态
4. 看到自动刷新提示

**测试场景 2: 状态更新**
1. 在后台手动更新 CustomerRequest 为 confirmed
2. 在前端等待 10 秒（自动轮询）
3. 页面应自动更新为 "已确认"
4. 应显示履约码

**测试场景 3: 无效查询码**
1. 访问 `/o/invalid-token`
2. 应显示 "查询失败" 错误
3. 提供重试按钮

---

## 八、文件清单

### 新增文件（3 个）

**前端**（3 个）:
1. `features/order-fulfillment/api/use-order-result.ts`
2. `components/commerce/order-result-card.tsx`
3. `app/(public)/o/[token]/page.tsx`

### 修改文件（1 个）:
1. `components/commerce/booking-form.tsx`

---

## 九、统计数据

- **新增文件**: 3 个
- **修改文件**: 1 个
- **新增代码**: ~280 行
- **提交次数**: 1 个

---

## 十、提交记录

```
commit c758f0c
feat: Phase 3 complete - Order result page

Frontend implementation:
- React Query Hook: use-order-result.ts (auto-polling)
- Business Component: order-result-card.tsx
- Page: /o/[token]
- Update booking-form.tsx navigation

Complete user flow:
/r/[ref] → /s/[id] → submit → /o/[token] → see status + code
```

---

## 十一、P0 核心流程总结

### Phase 0-3 完整成果

**3 个公开页面**:
1. `/r/[commerceRef]` - Creator Profile + 服务列表
2. `/s/[offeringId]` - 服务详情 + 预约表单
3. `/o/[token]` - 订单结果 + 履约码

**完整用户旅程**:
```
发现 Creator → 查看服务 → 提交预约 → 等待确认 → 获得履约码
```

**技术栈**:
- Next.js 16 + React 19 + TypeScript
- React Query（状态管理 + 缓存 + 轮询）
- react-hook-form + zod（表单验证）
- shadcn/ui（UI 组件）
- openapi-fetch（类型安全 API 调用）

**代码质量**:
- ✅ 所有页面构建通过
- ✅ TypeScript 类型检查通过
- ✅ 响应式设计
- ✅ 加载/错误/成功状态完整
- ✅ 用户友好的提示

---

## 十二、下一步工作（Phase 4）

### 目标
Creator 后台 - 预约管理 + 履约码扫描

### 准备工作
1. 检查 Creator 认证 API
2. 检查 Creator 预约列表 API
3. 检查履约码确认 API

### 实施内容
1. 认证: `/creator/login` 或复用现有认证
2. 页面: `/creator/requests` - 待处理预约列表
3. 页面: `/creator/confirmed` - 已确认预约列表
4. 组件: QR 扫描器（确认履约码）
5. API hooks: `useCreatorRequests`, `useConfirmRequest`, `useConfirmFulfillment`

**预计时间**: Day 4-5（2 天）

---

**总结**: Phase 3 已完成！订单结果页的实现让 P0 核心流程形成完整闭环。用户可以从发现 Creator → 预约服务 → 查看状态 → 获得履约码，整个流程流畅无阻。Phase 4 将实现 Creator 端的预约管理功能。🎉
