# Web 前端重构设计与履约码功能

> **日期**：2026-11-06  
> **范围**：Web Reference Client 重构 + 履约码功能设计  
> **状态**：设计文档（待批准后实施）

---

## 一、API 字段验证结果

### ✅ 验证完成：现有 API 完全支持

#### 1.1 Creator Profile 信息（`GET /api/v1/creator/identity`）

```typescript
// 现有响应结构
{
  creatorId: string;
  profile: {
    displayName: string;              // ✅ 有
    bio: string;                       // ✅ 有
    avatarUrl?: string;                // ✅ 有（可选）
    location?: string;                 // ✅ 有（可选）
    socialLinks: string[];
  };
  capabilityIds: string[];
  capabilities: Capability[];
  state: 'draft' | 'published' | 'unpublished';
}
```

**Web 需要新增端点**：获取公开的 Creator Profile（通过 C号）

```typescript
// 新增端点（需实现）
GET /api/v1/public/commerce-profile/:commerceReference

// 响应
{
  commerceReference: string;           // C号：3479AC-DEFHJK-MNPQRT
  displayName: string;                 // Creator 显示名
  bio: string;                         // 简介
  avatarUrl?: string;                  // 头像 URL
  location?: string;                   // 地理位置
  qrCodeImageUrl?: string;             // ✅ 二维码图片（后端生成）
  offerings: {
    id: string;                        // 服务 ID
    title: string;                     // 服务名称
    description: string;               // 服务描述
    imageUrl?: string;                 // 服务主图（Phase 2）
    priceDisplay: string;              // 价格显示："¥200/小时"
    state: 'published';
  }[];
  averageRating?: number;              // 平均评分（Phase 2）
  reviewCount?: number;                // 评价数（Phase 2）
}
```

#### 1.2 服务详情（`GET /api/v1/public/offerings/{offeringId}`）

```typescript
// 现有响应结构
{
  creator: {
    displayName: string;
    bio: string;
    capabilityNames: string[];
  };
  offering: {
    id: string;
    title: string;
    description: string;
    availabilityDescription: string;
    appearance?: AppearanceOffering;
    requestInstructions: string;
  };
}
```

**状态**：✅ 可用（无需修改）

#### 1.3 提交预约请求（`POST /api/v1/public/offerings/{offeringId}/requests`）

```typescript
// 请求体
{
  contactName: string;                 // 联系人名称
  contactMethod: string;               // 联系方式（电话/微信）
  requestMessage: string;              // 预约备注
}

// 响应
{
  actionId: string;                    // 订单 ID
  resultAccessToken: string;           // 订单查看令牌
  state: 'submitted';
  message: string;
  fulfillmentCode?: string;            // ✅ 新增：履约码（见 1.4）
}
```

#### 1.4 查询订单结果（`GET /api/v1/public/request-result/{resultAccessToken}`）

```typescript
// 现有响应（需扩展）
{
  actionId: string;
  resultAccessToken: string;
  state: 'submitted' | 'confirmed' | 'declined';
  message: string;
  fulfillmentCode?: string;            // ✅ 新增：履约码
  fulfillmentCodeQrUrl?: string;       // ✅ 新增：履约码二维码图
  fulfillmentStatus?: {                // ✅ 新增：履约状态
    status: 'pending' | 'fulfilled' | 'expired';
    confirmedAt?: string;              // ISO 8601 时间戳
  };
}
```

---

## 二、履约码功能设计

### 2.1 核心概念

**问题**：线下服务（台球助教、地陪等）如何证明真实完成？

**方案**：履约码系统

```
Timeline：
购买方（Customer）        创建者（Creator）
     |                        |
     |  1. 下单               |
     |  包含履约码 --------→  |
     |  ┌──────────────┐     |
     |  │ FC-ABC123XYZ │     |
     |  │ ▓▓▓▓▓▓▓▓▓▓▓▓ │ (二维码)
     |  └──────────────┘     |
     |                        |
     |  2. 线下见面           |
     | ←─────────见面────────→|
     |                        |
     |  3. Creator 确认       |
     |  扫码/输入履约码 ----→ |
     |  核实通过              |
     |                        |
     |  ✅ 服务标记为已完成   |
```

### 2.2 履约码规格

**格式**：`FC-[8位大写英文数字]`

示例：`FC-ABC123XYZ`、`FC-DEFGHIJKLM`

**特点**：
- 长度固定 11 字符（包括 `FC-` 前缀）
- 大小写敏感
- 唯一性（数据库 unique 约束）
- 有效期：与订单相同（自创建起 90 天）

**生成规则**：
```typescript
// 伪代码
function generateFulfillmentCode(): string {
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += ALPHABET[crypto.getRandomValues(new Uint8Array(1))[0] % ALPHABET.length];
  }
  return `FC-${code}`;
}
```

### 2.3 功能流程

#### 2.3.1 Consumer 端：生成 + 分享履约码

**页面**：订单结果页（`/order/[resultAccessToken]`）

```
┌─────────────────────────────────────┐
│  ✅ 预约成功                        │
├─────────────────────────────────────┤
│                                     │
│  等待 Creator 确认                  │
│  预计24小时内回复                   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 履约码：FC-ABC123XYZ        │   │
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ (二维码)   │   │
│  │                             │   │
│  │ [复制履约码] [保存图片]     │   │  ← 用户操作
│  └─────────────────────────────┘   │
│                                     │
│  说明：                             │
│  • 在约定时间前，将此码分享给      │
│    Creator（微信、短信）           │
│  • Creator 确认后，此服务标记完成  │
│                                     │
└─────────────────────────────────────┘
```

**关键交互**：
1. 页面加载时自动生成 QR 码（前端）
2. [复制履约码] 按钮复制 `FC-ABC123XYZ`
3. [保存图片] 按钮下载 QR 码+码值的图片

#### 2.3.2 Creator 端：确认履约码

**位置**：Creator 后台订单详情页（保留现有 `creator/page.tsx`）

**流程 A：扫码确认**

```
┌─────────────────────────────────────┐
│  订单详情                           │
├─────────────────────────────────────┤
│  服务：台球私教 | ¥200              │
│  客户：张三 | 13800138000           │
│  预约时间：2025-01-15 14:00         │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 履约状态：待确认             │   │
│  │                             │   │
│  │ [📱 扫码确认] 或 [手动输入]  │   │  ← 选择方式
│  └─────────────────────────────┘   │
```

**点击 [📱 扫码确认]**：
- 打开前置摄像头
- 扫描 Consumer 分享的 QR 码
- 自动提取 `FC-ABC123XYZ`
- 调用后端验证端点
- 成功：显示"✅ 服务已确认"
- 失败：显示"❌ 履约码无效或已过期"

**点击 [手动输入]**：
```
┌─────────────────────────────────────┐
│  手动输入履约码                     │
├─────────────────────────────────────┤
│  FC-                                │
│  [文本输入框]                       │
│                                     │
│  [确认]                             │
└─────────────────────────────────────┘
```

#### 2.3.3 后端验证流程

**新增端点**：`POST /api/v1/creator/requests/{actionId}/confirm-fulfillment`

```typescript
// 请求
{
  fulfillmentCode: string;             // "FC-ABC123XYZ"
}

// 响应（成功）
{
  actionId: string;
  state: 'fulfilled';
  confirmedAt: string;                 // ISO 8601 时间戳
  message: "Service confirmed successfully"
}

// 响应（失败）
{
  error: {
    code: 'FULFILLMENT_CODE_INVALID' | 'FULFILLMENT_CODE_EXPIRED' | 'FULFILLMENT_CODE_MISMATCHED';
    message: string;
  }
}
```

**后端验证规则**：
1. ✅ 履约码格式正确（`FC-[8位]`）
2. ✅ 履约码存在且未被使用
3. ✅ 履约码与订单匹配（actionId）
4. ✅ 履约码未过期（创建时间 + 90 天）
5. ✅ 订单状态为 `confirmed`（已被 Creator 确认）
6. ✅ 操作者为订单的 Creator

### 2.4 数据模型扩展

**新增表**：`fulfillment_codes`

```sql
CREATE TABLE fulfillment_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 业务字段
  code VARCHAR(11) NOT NULL UNIQUE,    -- "FC-ABC123XYZ"
  action_id UUID NOT NULL,             -- 对应订单 ID
  
  -- 状态
  status VARCHAR(20) NOT NULL,         -- 'pending' | 'fulfilled' | 'expired'
  fulfilled_at TIMESTAMP NULL,         -- 确认时间
  
  -- 时间戳
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,       -- created_at + 90 days
  
  -- 外键
  FOREIGN KEY (action_id) REFERENCES commerce_actions(id) ON DELETE CASCADE,
  
  -- 索引
  INDEX idx_action_id (action_id),
  INDEX idx_code (code),
  INDEX idx_status (status)
);
```

**修改表**：`commerce_actions`

```sql
ALTER TABLE commerce_actions
ADD COLUMN fulfillment_code_id UUID NULL,
ADD COLUMN fulfillment_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN fulfillment_confirmed_at TIMESTAMP NULL;

ALTER TABLE commerce_actions
ADD FOREIGN KEY (fulfillment_code_id) REFERENCES fulfillment_codes(id);
```

---

## 三、Web 前端实施清单

### 3.1 新建路由与页面

| 路由 | 文件 | 功能 |
|------|------|------|
| `/r/[commerceReference]` | `app/r/[commerceRef]/page.tsx` | Creator Profile |
| `/p/[offeringId]` | `app/p/[offeringId]/page.tsx` | 服务详情 + 预约 |
| `/order/[token]` | `app/order/[token]/page.tsx` | 订单结果 + 履约码 |

### 3.2 新建 UI 组件

| 组件 | 文件 | 用途 |
|------|------|------|
| `<ProfileHeader>` | `components/profile-header.tsx` | Creator 头像+名字 |
| `<ServiceCard>` | `components/service-card.tsx` | 服务卡片 |
| `<ServiceGallery>` | `components/service-gallery.tsx` | 图片轮播 |
| `<BookingForm>` | `components/booking-form.tsx` | 预约表单 |
| `<FulfillmentCode>` | `components/fulfillment-code.tsx` | 履约码展示+复制 |
| `<FulfillmentCodeQr>` | `components/fulfillment-code-qr.tsx` | 履约码二维码 |
| `<OrderStatus>` | `components/order-status.tsx` | 订单状态卡片 |

### 3.3 依赖变更

```json
{
  "dependencies": {
    "qrcode": "^1.5.3",              // 生成 QR 码（前端）
    "embla-carousel-react": "^8.0.0"  // 图片轮播
  }
}
```

### 3.4 API 客户端更新

```bash
# 生成新的 API 类型
cd apps/web
pnpm run generate-api

# 新增端点将自动生成到 src/generated/api.ts
```

**需要后端新增的端点**：
1. `GET /api/v1/public/commerce-profile/{commerceReference}`
2. `POST /api/v1/creator/requests/{actionId}/confirm-fulfillment`
3. `GET /api/v1/public/request-result/{token}` — 扩展返回 `fulfillmentCode`、`fulfillmentCodeQrUrl`

---

## 四、决策确认清单

### ✅ 设计决策（已获批准）

- [x] 评价系统：**需要**（Phase 2 实现）
- [x] 二维码：**后端生成**（`qrCodeImageUrl` 字段）
- [x] 服务图片：**占位图**（Phase 2 加上传）
- [x] 支付：**不包含**（仅预约流程）
- [x] Creator 后台：**保持现状**（Phase 2 优化）
- [x] 履约码：**新增功能**（本文档）

### ❓ 需要确认的实施细节

1. **履约码有效期**：建议 90 天，确认无误？
2. **履约码格式**：建议 `FC-[8位大小写英数]`，确认无误？
3. **QR 码内容**：应包含哪些字段？
   - 仅码值 `FC-ABC123XYZ`
   - 还是完整 URL `https://yoursite.com/r/verify?code=FC-ABC123XYZ`？
4. **后端二维码生成**：应使用哪个库？
   - `qrcode` (Node.js)
   - `qr-code` (PostgreSQL 扩展)
5. **订单状态流转**：
   ```
   submitted → confirmed → (履约码确认) → fulfilled
   ```
   确认此流程是否正确？

---

## 五、前后端工作分工

### 后端任务（需你实施）

1. **新增数据模型**：
   - `fulfillment_codes` 表
   - `commerce_actions` 字段扩展
   - Migration 文件

2. **新增 API 端点**：
   - `GET /api/v1/public/commerce-profile/{commerceReference}`
   - `POST /api/v1/public/offerings/{offeringId}/requests` — 返回 `fulfillmentCode`
   - `GET /api/v1/public/request-result/{token}` — 返回 `fulfillmentCode`、`fulfillmentCodeQrUrl`
   - `POST /api/v1/creator/requests/{actionId}/confirm-fulfillment`
   - `GET /api/v1/creator/requests/{actionId}/qrcode` — 生成/返回 QR 码图片

3. **二维码生成服务**：
   - 在 `adapters/observability/` 或新增 `adapters/image-generation/` 实现
   - 支持 PNG/SVG 格式
   - 缓存策略（避免重复生成）

4. **验证逻辑**：
   - 履约码格式校验
   - 有效期校验
   - 重复使用检测
   - 匹配订单检测

### 前端任务（我实施）

1. **页面实现**：
   - 3 个新路由 + 对应页面
   - 8 个新 UI 组件
   - 移动端响应式

2. **交互实现**：
   - 履约码复制
   - 二维码显示 + 下载
   - 扫码能力（原生摄像头 API）
   - 手动输入验证

3. **错误处理**：
   - 网络错误提示
   - 码值无效提示
   - 已过期提示

4. **集成测试**：
   - E2E 验收测试（Playwright）
   - 成功路径 + 失败路径

---

## 六、时间估算

| 阶段 | 工作项 | 工作量 | 前置条件 |
|------|--------|--------|---------|
| 准备 | 后端 API 实现 | 4h | 无 |
| 准备 | 数据模型 + Migration | 2h | 无 |
| Phase 1A | Web 页面布局 | 2h | 后端 API 就绪 |
| Phase 1B | Web 交互 + 集成 | 3h | 后端 API 就绪 |
| Phase 1C | Web 视觉打磨 | 1h | Phase 1A/B 完成 |
| **总计** | | **6h (后) + 6h (前)** | |

---

## 七、审批与下一步

### 当前状态：✅ 设计文档完成

### 下一步（待你指示）

**选项 A**：立即开始
1. 后端实施 API + 数据模型
2. 我同时开始 Web Phase 1A
3. 一周内交付 Phase 1（对外界面）

**选项 B**：需要调整
- 列出需要调整的地方
- 我更新设计文档
- 重新审批后开始

**选项 C**：分步实施
- 先只做基础预约流程（不要履约码）
- 履约码放到 Phase 2

---

**文档版本**：v1  
**设计完成**：2026-11-06  
**下一步**：等待你的批准
