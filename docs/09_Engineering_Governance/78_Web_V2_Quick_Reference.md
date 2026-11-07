# Personal Commerce Web V2 - 快速参考指南

## 📋 项目信息

- **项目**: Personal Commerce Infrastructure - Web V2
- **技术栈**: Next.js 16 + React 19 + TypeScript 5 + Tailwind CSS 4
- **状态**: ✅ Phase 0-4 完成（P0 核心流程闭环）
- **代码行数**: ~3,500
- **文件数**: 50+
- **提交数**: 12

---

## 🚀 快速启动

### 1. 安装依赖
```bash
cd apps/web-v2
pnpm install
```

### 2. 配置环境
```bash
# apps/web-v2/.env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

### 3. 开发模式
```bash
pnpm run dev
```

浏览器访问: `http://localhost:3000`

### 4. 生产构建
```bash
pnpm run build
pnpm run start
```

---

## 🌐 应用路由

### 公开页面（Consumer 端）

| 路由 | 功能 | 状态 |
|------|------|------|
| `/r/[commerceRef]` | Creator Profile + 服务列表 | ✅ 完成 |
| `/s/[offeringId]` | 服务详情 + 预约表单 | ✅ 完成 |
| `/o/[token]` | 订单结果 + 履约码查询 | ✅ 完成 |

### Creator 页面

| 路由 | 功能 | 状态 |
|------|------|------|
| `/dashboard?token=...` | 仪表板 + 预约管理 | ✅ 完成 |

---

## 🔧 常用命令

```bash
# 开发
pnpm run dev          # 启动开发服务器

# 构建
pnpm run build        # 生产构建
pnpm run start        # 启动生产服务器

# 质量检查
pnpm run typecheck    # TypeScript 检查
pnpm run lint         # ESLint 检查
pnpm run format       # 代码格式化

# 分析
pnpm run analyze      # 包大小分析（需要安装 @next/bundle-analyzer）
```

---

## 🧪 测试场景

### 场景 1: Consumer 完整流程

1. **发现 Creator**
   ```
   访问: http://localhost:3000/r/3479AC-DEFHJK-MNPQRT
   预期: 看到 Creator Profile + 服务列表
   ```

2. **查看服务**
   ```
   点击: "查看详情"
   访问: http://localhost:3000/s/offering-123
   预期: 看到服务详情 + 预约表单
   ```

3. **提交预约**
   ```
   填写: 姓名、联系方式、说明
   点击: "提交预约"
   预期: 自动跳转到 /o/[token]
   ```

4. **查看订单**
   ```
   访问: http://localhost:3000/o/result-token-xyz
   预期: 看到订单状态（自动轮询）
   ```

### 场景 2: Creator 管理流程

1. **进入仪表板**
   ```
   访问: http://localhost:3000/dashboard?token=valid_access_token
   预期: 看到两个标签页（待处理 + 已确认）
   ```

2. **确认预约**
   ```
   点击: "确认预约"
   预期: 预约移到已确认标签页，显示履约码
   ```

3. **确认履约**
   ```
   点击: "确认履约"
   预期: 履约码状态 → 已使用
   ```

---

## 🔌 API 集成清单

### 公开 API（无需认证）

```bash
# 获取 Creator 信息
GET /api/v1/public/creator-profile/:commerceRef

# 获取服务详情
GET /api/v1/public/offerings/:offeringId

# 提交预约
POST /api/v1/public/offerings/:offeringId/requests
Body: { contactName, contactMethod, requestMessage }

# 查询订单状态
GET /api/v1/public/requests/:resultAccessToken
```

### Creator API（需要认证）

```bash
# 获取待处理预约
GET /api/v1/creator/requests
Header: Authorization: Bearer {token}

# 获取已确认预约
GET /api/v1/creator/confirmed-requests
Header: Authorization: Bearer {token}

# 确认预约
POST /api/v1/creator/requests/:actionId/confirm
Header: Authorization: Bearer {token}

# 拒绝预约
POST /api/v1/creator/requests/:actionId/decline
Header: Authorization: Bearer {token}

# 确认履约
POST /api/v1/creator/requests/:actionId/confirm-fulfillment
Header: Authorization: Bearer {token}
```

---

## 📂 文件结构

```
apps/web-v2/
├── app/                          # 页面 + 路由
│   ├── (public)/                 # 公开路由
│   │   ├── page.tsx              # 首页
│   │   ├── r/[commerceRef]/page.tsx
│   │   ├── s/[offeringId]/page.tsx
│   │   └── o/[token]/page.tsx
│   ├── (creator)/                # Creator 路由
│   │   ├── layout.tsx
│   │   └── dashboard/page.tsx
│   ├── layout.tsx                # 根布局
│   └── providers.tsx             # 客户端提供商
├── components/                   # React 组件
│   ├── ui/                       # shadcn/ui 组件
│   ├── commerce/                 # 业务组件
│   │   ├── creator-profile-card.tsx
│   │   ├── service-card.tsx
│   │   ├── service-detail-card.tsx
│   │   ├── booking-form.tsx
│   │   └── order-result-card.tsx
│   └── creator/                  # Creator 端组件
│       └── request-card.tsx
├── features/                     # 功能模块
│   ├── creator-profile/api/
│   ├── service-booking/api/
│   ├── order-fulfillment/api/
│   └── creator-dashboard/api/
├── lib/                          # 工具函数
│   ├── api/
│   ├── auth/
│   └── utils/
└── styles/                       # 全局样式
```

---

## 💾 状态管理架构

### React Query Hooks（服务端状态）

```typescript
// 查询 Hooks
useCreatorProfile(commerceRef)
useServiceOffering(offeringId)
useOrderResult(token)
useCreatorRequests(accessToken)
useCreatorConfirmedRequests(accessToken)

// Mutation Hooks
useSubmitBooking()
useConfirmRequest(accessToken)
useDeclineRequest(accessToken)
useConfirmFulfillment(accessToken)
```

### React 状态（客户端状态）

- 表单状态：react-hook-form
- Tab 状态：useState
- 认证 token：URL searchParams

---

## 🎨 UI 组件库

### shadcn/ui 已安装

- Button
- Card
- Badge
- Avatar
- Input
- Textarea
- Form / Label
- Skeleton
- Separator
- Tabs

### 添加新组件

```bash
pnpm dlx shadcn@latest add [component-name] --yes
```

---

## 🔐 认证

### Consumer 端
- ✅ 无需认证（完全公开）

### Creator 端
- 🔐 URL Query Parameter 认证
- 格式: `?token=access_token`
- 自动添加到所有请求: `Authorization: Bearer {token}`

---

## 🚨 常见问题排查

### Q1: 页面空白 / 404

**检查**:
1. Backend 是否运行？ `http://localhost:3001`
2. 环境变量是否正确？ `NEXT_PUBLIC_API_BASE_URL`
3. 路由参数是否存在？ (例如 `/r/invalid-ref` 可能返回 404)

### Q2: API 调用失败

**检查**:
1. CORS 是否配置？ (后端 CORS 设置)
2. Token 是否有效？ (Creator API 需要认证)
3. API 端点是否存在？ (检查后端日志)

### Q3: 自动轮询不工作

**检查**:
1. 网络连接是否正常？
2. Browser DevTools → Network 是否看到请求？
3. React Query DevTools 是否显示正确状态？

### Q4: 样式不加载

**检查**:
1. Tailwind CSS 是否已编译？ (build 输出中应有 CSS)
2. 浏览器缓存？ (Ctrl+Shift+Delete 清除)

---

## 📊 性能优化建议

### 当前状态
- ✅ 自动缓存（30-60 秒）
- ✅ 智能轮询（submitted 时 10s，其他 30s）
- ✅ Tailwind CSS Tree Shaking（只打包用到的样式）
- ✅ Next.js Image Optimization

### 可进一步优化
- [ ] 分割代码（Code Splitting）
- [ ] Lazy Loading 组件
- [ ] Web Vitals 监控
- [ ] CDN 部署

---

## 🐛 调试技巧

### React Query DevTools

```bash
# 已在 providers.tsx 中集成
# 访问开发工具: 右下角 React Query 图标
```

### 浏览器 DevTools

```bash
# Network 标签页
- 查看所有 API 请求
- 检查响应时间
- 验证 Authorization Header

# Console 标签页
- 查看错误日志
- 执行 JavaScript 代码测试

# Storage 标签页
- 查看 localStorage / sessionStorage
- 清除缓存 (如需要)
```

### Next.js 构建分析

```bash
pnpm run build
# 查看路由生成的 HTML 文件
ls -la .next/static/
```

---

## 📚 完成文档

| 文档 | 链接 | 内容 |
|------|------|------|
| Phase 0 报告 | `docs/09_Engineering_Governance/72_Web_V2_Phase0_Completion_Report.md` | 项目初始化 |
| Phase 1 报告 | `docs/09_Engineering_Governance/73_Web_V2_Phase1_Completion_Report.md` | Creator Profile |
| Phase 2 报告 | `docs/09_Engineering_Governance/74_Web_V2_Phase2_Completion_Report.md` | Service Detail + Form |
| Phase 3 报告 | `docs/09_Engineering_Governance/75_Web_V2_Phase3_Completion_Report.md` | Order Result |
| Phase 4 报告 | `docs/09_Engineering_Governance/76_Web_V2_Phase4_Completion_Report.md` | Creator Dashboard |
| 总结报告 | `docs/09_Engineering_Governance/77_Web_V2_Phase0-4_Summary.md` | 全面总结 |

---

## ✅ 部署检查清单

- [ ] Backend 服务已启动
- [ ] `NEXT_PUBLIC_API_BASE_URL` 已配置
- [ ] `pnpm run build` 通过
- [ ] 所有路由都能访问
- [ ] Consumer 完整流程可工作
- [ ] Creator 管理流程可工作
- [ ] 没有 TypeScript 错误
- [ ] 没有 ESLint 错误

---

## 🚀 下一步：Phase 5

### 建议工作项

1. **单元测试** (React Testing Library)
2. **E2E 测试** (Playwright / Cypress)
3. **真实认证** (OAuth / JWT)
4. **QR 扫描** (real-time scanning)
5. **生产部署** (Docker / Vercel)

---

**最后更新**: 2026-11-06  
**维护者**: Personal Commerce Team  
**License**: Proprietary
