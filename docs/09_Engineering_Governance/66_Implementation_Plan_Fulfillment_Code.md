# 履约码功能实施计划

## 📋 工作分解结构

### Phase 1：数据模型 + 数据库迁移（1h）

#### 1.1 新建表：`fulfillment_codes`

```sql
-- 履约码表
-- 用于记录线下服务的完成证明
CREATE TABLE fulfillment_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 业务字段
  code VARCHAR(11) NOT NULL UNIQUE,          -- 格式：FC-XXXXXXXX
  action_id UUID NOT NULL,                   -- 关联的订单 ID
  
  -- 状态管理
  status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending | fulfilled | expired
  fulfilled_at TIMESTAMP NULL,               -- 确认时间
  
  -- 时间戳
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,             -- created_at + 90 days
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- 外键约束
  CONSTRAINT fk_fulfillment_codes_action_id 
    FOREIGN KEY (action_id) REFERENCES commerce_actions(id) ON DELETE CASCADE,
  
  -- 索引
  CONSTRAINT idx_fulfillment_codes_action_id UNIQUE (action_id),
  INDEX idx_fulfillment_codes_code (code),
  INDEX idx_fulfillment_codes_status (status),
  INDEX idx_fulfillment_codes_expires_at (expires_at)
);
```

#### 1.2 修改表：`commerce_actions`

```sql
ALTER TABLE commerce_actions 
  ADD COLUMN fulfillment_code_id UUID NULL,
  ADD COLUMN fulfillment_status VARCHAR(20) NULL,  -- pending | fulfilled
  ADD COLUMN fulfillment_confirmed_at TIMESTAMP NULL,
  ADD FOREIGN KEY (fulfillment_code_id) 
    REFERENCES fulfillment_codes(id) ON DELETE SET NULL;
```

---

### Phase 2：后端业务层（2h）

#### 2.1 新增 Domain Entity：`FulfillmentCode`

文件：`domain/fulfillment-code.ts`

```typescript
export class FulfillmentCode {
  private constructor(
    readonly id: string,
    readonly code: string,
    readonly actionId: string,
    readonly status: 'pending' | 'fulfilled' | 'expired',
    readonly createdAt: Date,
    readonly expiresAt: Date,
    readonly fulfilledAt?: Date,
  ) {}

  static generate(actionId: string): FulfillmentCode {
    const code = `FC-${generateRandomCode(8)}`; // FC-ABC123XYZ
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // +90 days

    return new FulfillmentCode(
      crypto.randomUUID(),
      code,
      actionId,
      'pending',
      now,
      expiresAt,
    );
  }

  static fromRecord(record: any): FulfillmentCode {
    return new FulfillmentCode(
      record.id,
      record.code,
      record.action_id,
      record.status,
      new Date(record.created_at),
      new Date(record.expires_at),
      record.fulfilled_at ? new Date(record.fulfilled_at) : undefined,
    );
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  markFulfilled(): FulfillmentCode {
    if (this.status === 'fulfilled') {
      throw new BusinessRuleViolationError('Fulfillment code already fulfilled');
    }
    if (this.isExpired()) {
      throw new BusinessRuleViolationError('Fulfillment code expired');
    }

    return new FulfillmentCode(
      this.id,
      this.code,
      this.actionId,
      'fulfilled',
      this.createdAt,
      this.expiresAt,
      new Date(),
    );
  }
}
```

#### 2.2 新增 Repository：`FulfillmentCodeRepository`

文件：`adapters/persistence/fulfillment-code-repository.ts`

```typescript
export interface FulfillmentCodeRepository {
  save(code: FulfillmentCode): Promise<void>;
  findByCode(code: string): Promise<FulfillmentCode | null>;
  findByActionId(actionId: string): Promise<FulfillmentCode | null>;
}

export class PostgresFulfillmentCodeRepository implements FulfillmentCodeRepository {
  async save(code: FulfillmentCode): Promise<void> {
    // 实现插入或更新
  }

  async findByCode(code: string): Promise<FulfillmentCode | null> {
    // 按履约码查询
  }

  async findByActionId(actionId: string): Promise<FulfillmentCode | null> {
    // 按订单 ID 查询
  }
}
```

#### 2.3 新增 Use Case：`ConfirmFulfillmentUseCase`

文件：`applications/fulfillment/confirm-fulfillment-use-case.ts`

```typescript
export async function confirmFulfillmentUseCase(
  dependencies: {
    fulfillmentCodeRepository: FulfillmentCodeRepository;
    commerceActionRepository: CommerceActionRepository;
  },
  command: {
    actionId: string;
    fulfillmentCode: string;
    creatorId: string;  // 权限检查
  },
): Promise<{ status: 'fulfilled'; confirmedAt: string }> {
  // 1. 验证权限：creatorId 必须是该订单的 Creator
  const action = await dependencies.commerceActionRepository.findById(command.actionId);
  if (action?.creatorId !== command.creatorId) {
    throw new AuthorizationError('Not authorized to confirm this order');
  }

  // 2. 查询履约码
  const fulfillmentCode = await dependencies.fulfillmentCodeRepository.findByCode(
    command.fulfillmentCode,
  );
  if (!fulfillmentCode) {
    throw new BusinessError('FULFILLMENT_CODE_INVALID', 'Invalid fulfillment code', false);
  }

  // 3. 验证关联订单
  if (fulfillmentCode.actionId !== command.actionId) {
    throw new BusinessError('FULFILLMENT_CODE_MISMATCHED', 'Code does not match this order', false);
  }

  // 4. 验证状态和有效期
  if (fulfillmentCode.isExpired()) {
    throw new BusinessError('FULFILLMENT_CODE_EXPIRED', 'Fulfillment code expired', true);
  }

  // 5. 标记为已履约
  const updatedCode = fulfillmentCode.markFulfilled();
  await dependencies.fulfillmentCodeRepository.save(updatedCode);

  // 6. 更新订单状态
  await dependencies.commerceActionRepository.updateFulfillmentStatus(
    command.actionId,
    'fulfilled',
  );

  return {
    status: 'fulfilled',
    confirmedAt: new Date().toISOString(),
  };
}
```

#### 2.4 修改现有 Use Case：`SubmitCustomerRequestUseCase`

在创建订单时，同时生成履约码和二维码：

```typescript
export async function submitCustomerRequestUseCase(...) {
  // ... 现有逻辑 ...

  // 生成履约码
  const fulfillmentCode = FulfillmentCode.generate(action.id);
  await dependencies.fulfillmentCodeRepository.save(fulfillmentCode);

  // 生成二维码（可选，Phase 2）
  // const qrCode = await generateQrCode(fulfillmentCode.code);

  return {
    actionId: action.id,
    resultAccessToken: token,
    state: 'submitted',
    message: 'Request submitted successfully',
    fulfillmentCode: fulfillmentCode.code,  // 返回给 Consumer
    // fulfillmentCodeQrUrl: qrCode.imageUrl,
  };
}
```

---

### Phase 3：后端 API 层（1.5h）

#### 3.1 新增路由：获取 Creator Profile（公开）

```typescript
// GET /api/v1/public/commerce-profile/{commerceReference}
{
  handler: async (req, res) => {
    const { commerceReference } = req.params;
    
    const profile = await getCommerceProfileUseCase(
      { creatorRepository, offeringRepository },
      { commerceReference },
    );

    return res.send({
      commerceReference: profile.reference,
      displayName: profile.creator.displayName,
      bio: profile.creator.bio,
      avatarUrl: profile.creator.avatarUrl,
      location: profile.creator.location,
      offerings: profile.offerings.map(o => ({
        offeringId: o.id,
        title: o.title,
        priceDisplay: o.priceDisplay,
        imageUrl: o.imageUrl, // Phase 2
      })),
      // qrCodeImageUrl: await generateQrCodeUrl(commerceReference),
    });
  },
}
```

#### 3.2 新增路由：确认履约码

```typescript
// POST /api/v1/creator/requests/{actionId}/confirm-fulfillment
{
  handler: async (req, res) => {
    const { actionId } = req.params;
    const { fulfillmentCode } = req.body;
    const creatorId = req.user.id;

    const result = await confirmFulfillmentUseCase(
      { fulfillmentCodeRepository, commerceActionRepository },
      { actionId, fulfillmentCode, creatorId },
    );

    return res.send(result);
  },
}
```

#### 3.3 修改路由：查询订单结果

扩展 `GET /api/v1/public/request-result/{token}` 返回：

```typescript
{
  actionId: string;
  state: 'submitted' | 'confirmed' | 'declined' | 'fulfilled';
  fulfillmentCode?: string;           // 新增
  fulfillmentCodeQrUrl?: string;      // 新增（Phase 2）
  fulfillmentStatus?: 'pending' | 'fulfilled';  // 新增
  fulfillmentConfirmedAt?: string;    // 新增
}
```

---

### Phase 4：二维码生成服务（1h）

#### 4.1 新增 Adapter：`QrCodeGenerator`

文件：`adapters/image-generation/qr-code-generator.ts`

```typescript
import QRCode from 'qrcode';

export interface QrCodeGenerator {
  generate(text: string): Promise<{
    dataUrl: string;   // Data URL (用于前端展示)
    imageBuffer: Buffer; // PNG 图片二进制（用于返回）
  }>;
}

export class QrCodeGeneratorImpl implements QrCodeGenerator {
  async generate(text: string): Promise<{ dataUrl: string; imageBuffer: Buffer }> {
    const dataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    const imageBuffer = await QRCode.toBuffer(text, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 1,
    });

    return { dataUrl, imageBuffer };
  }
}
```

#### 4.2 新增 Use Case：`GenerateQrCodeUseCase`

```typescript
export async function generateQrCodeUseCase(
  dependencies: { qrCodeGenerator: QrCodeGenerator },
  command: { text: string },
): Promise<{ dataUrl: string; imageUrl: string }> {
  const qrCode = await dependencies.qrCodeGenerator.generate(command.text);
  
  // 保存到存储（可选，这里简化为返回 data URL）
  return {
    dataUrl: qrCode.dataUrl,
    imageUrl: qrCode.dataUrl, // 或保存到 S3/CDN
  };
}
```

---

## 🎯 实施顺序

1. ✅ 创建数据库 migration 文件
2. ✅ 实现 FulfillmentCode domain entity
3. ✅ 实现 FulfillmentCodeRepository
4. ✅ 实现 confirmFulfillmentUseCase
5. ✅ 修改 submitCustomerRequestUseCase（生成履约码）
6. ✅ 实现 QrCodeGenerator adapter
7. ✅ 添加后端路由（3 个新端点）
8. ✅ 集成测试
9. ⏭️  Web 前端开发（并行）

---

## 📦 依赖检查

```json
{
  "dependencies": {
    "qrcode": "^1.5.3"  // 需要新增到 package.json
  }
}
```

---

**状态**：设计完成，等待实施
**预计工时**：4.5h（后端）+ 6h（前端）= 10.5h
