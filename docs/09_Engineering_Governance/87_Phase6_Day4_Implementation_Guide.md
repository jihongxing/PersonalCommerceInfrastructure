# Phase 6 Day 4 - 完整工作流验证实施指南

**目标**: 通过手动测试和自动化脚本验证 Creator 初始化的完整工作流  
**预计耗时**: 3 小时  
**交付物**: 验证报告 + 测试脚本 + 修复日志  

---

## 🎯 Day 4 三个关键验证

### 1️⃣ Creator 初始化完整流程 (90 分钟)

#### Step 1.1: 身份创建 → 发布服务 (30 分钟)

**动作**:
```
访问 → /creator/onboarding
  ↓
系统检查: 无身份? 重定向到 welcome
  ↓
用户点击"开始"
  ↓
填写表单 (名字、简介)
  ↓
保存 → API POST /api/v1/creator/identity
  ↓
成功! 重定向 → /creator/profile
```

**验证清单**:
- [ ] 检查 Console 中的 API 请求（DevTools Network 标签）
- [ ] 确认 POST 返回 201 Created
- [ ] 确认响应中有 `id` 字段
- [ ] 页面自动重定向成功
- [ ] 资料页显示刚才输入的信息

**可能的问题**:
- ❌ 401 Unauthorized → Token 过期或无效
- ❌ 422 Unprocessable Entity → 数据验证失败
- ❌ 500 Internal Server Error → 后端问题
- ❌ 重定向不工作 → 检查 router 配置

---

#### Step 1.2: 创建能力 (20 分钟)

**动作**:
```
点击 能力管理
  ↓
点击 + 添加能力
  ↓
填写表单:
  名字: "英语口语教学"
  描述: "3 年教学经验，专注发音和表达"
  ↓
保存 → API POST /api/v1/creator/identity/capabilities
  ↓
成功! 返回列表
  ↓
在列表中看到新能力
```

**验证清单**:
- [ ] 能力创建 API 返回 201
- [ ] 列表实时更新（不需要手动刷新）
- [ ] 能力信息正确显示
- [ ] 编辑按钮可用

**缓存验证**:
- 打开浏览器开发工具 → Application → Local Storage
- 查看是否有 `@tanstack/react-query` 缓存
- 清空缓存后，刷新页面应该重新请求

---

#### Step 1.3: 创建并发布服务 (40 分钟)

**动作**:
```
点击 服务管理
  ↓
点击 + 创建服务
  ↓
填写表单:
  ✓ 选择关联能力: "英语口语教学"
  ✓ 标题: "一对一英语口语课程"
  ✓ 描述: "帮助学生提高口语流利度，包括发音纠正和自然表达"
  ✓ 可用性: "周一到周五 19:00-21:00，周末全天"
  ✓ 请求说明: "请告诉我您的英语水平和学习目标"
  ↓
保存 → API POST /api/v1/creator/offerings
  ↓
成功! 进入详情页
```

**发布前检查清单验证**:
```
查看页面上的清单卡片:
┌─────────────────────────────────┐
│ 发布前检查清单                   │ 5/5 完成
├─────────────────────────────────┤
│ ✅ 服务名称                       │
│ ✅ 服务描述                       │
│ ✅ 关联能力                       │
│ ✅ 可用性描述                     │
│ ✅ 请求说明                       │
├─────────────────────────────────┤
│ ✓ 所有条件已满足，可以发布       │
└─────────────────────────────────┘
```

**验证清单**:
- [ ] 清单显示 5/5 完成
- [ ] 所有项都有绿色勾选
- [ ] "发布服务"按钮处于启用状态
- [ ] 按钮不是灰色 disabled

**发布动作**:
```
点击 "发布服务" 按钮
  ↓
浏览器 confirm() 对话框:
  "确定要发布此服务吗？发布后消费者将可以搜索和预约。"
  ↓
点击 "确定"
  ↓
按钮变为 "发布中..."
  ↓
API POST /api/v1/creator/offerings/{id}/publish
  ↓
成功! (显示 green toast "服务已发布")
  ↓
页面刷新，状态 Badge 变为蓝色 "已发布"
  ↓
返回列表，服务现在在 "已发布" Tab 中
```

**验证清单**:
- [ ] 浏览器确认对话框显示
- [ ] 发布 API 返回 200
- [ ] 成功 toast 提示显示
- [ ] 服务状态从 "草稿" 变为 "已发布"
- [ ] List Tab 中服务自动移到 "已发布" 分类

---

### 2️⃣ Consumer 发现和预约 (60 分钟)

#### Step 2.1: Consumer 查看公开服务 (15 分钟)

**动作**:
```
打开新的浏览器标签（模拟 Consumer）
  ↓
访问 URL: http://localhost:3000/s/[commerceRef]
  (使用服务发布时返回的 commerceRef)
  ↓
看到服务详情页:
  - 创建者名字: "李老师"
  - 服务标题: "一对一英语口语课程"
  - 完整描述
  - 可用性信息
  - 预约表单
```

**验证清单**:
- [ ] 页面加载成功 (HTTP 200)
- [ ] 所有信息正确显示
- [ ] 预约表单可见
- [ ] 没有验证错误

**常见问题**:
- ❌ 404 Not Found → commerceRef 错误
- ❌ 页面空白 → API 响应问题
- ❌ 信息显示不全 → 字段映射错误

---

#### Step 2.2: Consumer 提交预约 (20 分钟)

**动作**:
```
填写预约表单:
  名字: "学生王五"
  邮箱: "student@example.com"
  消息: "我想提高英语口语能力，请问如何开始？"
  ↓
点击 "提交预约"
  ↓
API POST /api/v1/public/offerings/{id}/requests
  ↓
成功! (显示成功提示)
  ↓
获得 actionId
```

**验证清单**:
- [ ] 表单验证工作（填空字段显示错误）
- [ ] 提交 API 返回 201
- [ ] 响应包含 `actionId`
- [ ] 成功提示显示

---

### 3️⃣ Creator 审核验证 (60 分钟)

#### Step 3.1: Creator 查看待审核列表 (15 分钟)

**动作**:
```
回到 Creator 浏览器标签
  ↓
访问 Dashboard: http://localhost:3000/creator/dashboard?token=[CREATOR_TOKEN]
  (使用 environment 中配置的 creator token)
  ↓
看到 "待审核" Tab
  ↓
列表中显示:
  - Consumer 名字: "学生王五"
  - Consumer 邮箱: "student@example.com"
  - Consumer 消息
  - 提交时间
  - "接受" 和 "拒绝" 按钮
```

**验证清单**:
- [ ] Dashboard 页面加载成功
- [ ] Token 认证工作（无 401 错误）
- [ ] 待审核列表显示新预约
- [ ] 所有信息正确

**调试 Token**:
```bash
# 如果 token 不工作，检查：
1. Token 格式是否正确
2. 后端是否能解析这个 token
3. Token 是否包含 creator ID

# 看 backend 日志:
tail -f backend/logs/app.log | grep -i auth
```

---

#### Step 3.2: Creator 接受预约 (25 分钟)

**动作**:
```
点击预约卡片上的 "接受" 按钮
  ↓
弹出回复表单:
  Creator 消息: "课程已确认！周一晚 19:00-20:00，共 1 小时。"
  ↓
点击 "提交"
  ↓
API POST /api/v1/creator/requests/{actionId}/confirm
  ↓
成功! (显示 green toast "已确认")
  ↓
预约卡片消失或移到 "已确认" Tab
  ↓
切换到 "已确认" Tab
  ↓
看到这个预约:
  - 状态: "已确认"
  - Consumer 信息
  - Creator 回复消息
```

**验证清单**:
- [ ] 确认 API 返回 200
- [ ] 成功 toast 提示显示
- [ ] 待审核列表自动更新
- [ ] 已确认列表显示新预约
- [ ] Creator 消息正确保存

**缓存验证**:
```javascript
// 在浏览器 Console 中运行
// 查看是否有缓存失效和重新加载
console.log('缓存刷新检查');
// 观察 Network 标签中的 /creator/requests/* API 调用
```

---

#### Step 3.3: 拒绝流程 (20 分钟)

**回到 Consumer 端**:
```
再提交一个新的预约请求
  ↓
消息: "我最近有空，什么时候可以开始？"
```

**回到 Creator 端**:
```
看到新的待审核预约
  ↓
点击 "拒绝" 按钮
  ↓
填写拒绝理由: "近期课程排满，抱歉无法安排"
  ↓
点击 "提交"
  ↓
API POST /api/v1/creator/requests/{actionId}/decline
  ↓
成功! (显示 toast)
  ↓
预约消失或显示为 "已拒绝"
```

**验证清单**:
- [ ] 拒绝 API 返回 200
- [ ] 待审核列表更新
- [ ] 预约状态变为拒绝
- [ ] Consumer 能收到通知 (邮件/系统消息)

---

## 🔧 故障排查

### 常见问题和解决方案

#### 问题 1: API 返回 401 Unauthorized

**症状**: 创建服务时显示 401

**原因**: 
- Token 无效或过期
- Authorization 头未正确设置
- 后端未正确验证 token

**解决方案**:
```bash
# 1. 检查 token 是否正确
echo $CREATOR_TOKEN

# 2. 检查后端日志
tail -f backend/logs/app.log | grep -i "unauthorized\|auth"

# 3. 验证 token 格式
# 应该是: Bearer <actual_token>

# 4. 重新生成 token（如果支持）
npm run dev:generate-token
```

#### 问题 2: useMemo 优化没有生效

**症状**: Tab 切换时 ServiceCard 依然重新 render

**验证方式**:
```javascript
// 使用 React DevTools Profiler
// 1. 打开 React DevTools → Profiler
// 2. 切换 Tab
// 3. 查看是否只有必要的组件 render

// 预期: Tab 内容改变，但其他 Tab 的卡片不应该 render
```

**常见原因**:
- ❌ 组件 key 不稳定
- ❌ 父组件状态变化导致全局 re-render
- ❌ useMemo 依赖数组遗漏

**修复**:
```typescript
// 确保 useMemo 依赖正确
const { draftServices } = useMemo(() => {
  return {
    draftServices: services?.filter((s) => s.state === 'draft') || [],
  };
}, [services]); // 这里只依赖 services
```

#### 问题 3: 缓存不一致

**症状**: 编辑服务后，列表没有更新

**调试步骤**:
```javascript
// 1. 打开浏览器 Console
// 2. 检查 React Query 缓存
import { useQueryClient } from '@tanstack/react-query';
const queryClient = useQueryClient();
console.log(queryClient.getQueriesData({ queryKey: ['creator-services'] }));

// 3. 手动清空缓存
queryClient.invalidateQueries({ queryKey: ['creator-services'] });

// 4. 检查是否 API 调用完成
// 在 Network 标签中查看
```

**修复方案**:
```typescript
// 确保 mutation 成功后失效缓存
onSuccess: () => {
  queryClient.invalidateQueries({
    queryKey: ['creator-services'], // 准确的 queryKey
  });
}
```

---

## 📊 测试检查清单

### 快速验证 (5 分钟)

- [ ] `/creator/onboarding` 页面加载
- [ ] 能创建一个服务
- [ ] 能发布一个服务
- [ ] 服务出现在公开页面

### 完整验证 (30 分钟)

- [ ] 完整创建 → 发布 → 查看流程
- [ ] Consumer 能提交预约
- [ ] Creator 能审核预约
- [ ] 预约状态正确转移
- [ ] 缓存正确更新

### 深度验证 (60 分钟)

- [ ] 所有错误情况处理
- [ ] 性能优化验证 (useMemo)
- [ ] 权限检查
- [ ] 网络超时处理
- [ ] 并发操作冲突

---

## 📝 Day 4 完成报告模板

```markdown
# Phase 6 Day 4 验证报告

**日期**: 2026-11-06
**验证者**: [您的名字]
**持续时间**: [X 小时 Y 分钟]

## ✅ 完成情况

### Creator 初始化
- [x] 身份创建成功
- [x] 能力创建成功
- [x] 服务创建成功
- [x] 服务发布成功

### Consumer 流程
- [x] 服务查看成功
- [x] 预约提交成功

### Creator 审核
- [x] 待审核列表显示
- [x] 预约接受成功
- [x] 预约拒绝成功

## 🐛 发现的问题

### Bug #1: [描述]
- 重现步骤: ...
- 期望: ...
- 实际: ...
- 修复: ...

## 📈 性能指标

| 指标 | 值 | 目标 | 状态 |
|------|-----|------|------|
| Tab 切换时间 | 50ms | < 100ms | ✅ |
| 服务创建时间 | 800ms | < 2s | ✅ |
| 发布时间 | 500ms | < 2s | ✅ |

## ✨ 其他观察

- useMemo 优化工作良好
- 缓存管理正确
- 用户体验流畅

## 签名

验证者: ________________
日期: ________________
```

---

**Day 4 完成后，整个 Creator 初始化系统即可进入 Day 5 的生产就绪阶段！** 🚀
