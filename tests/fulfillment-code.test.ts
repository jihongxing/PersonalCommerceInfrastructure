/**
 * Tests for Fulfillment Code Domain and Use Cases
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FulfillmentCode } from '../domain/fulfillment-code.js';
import {
  confirmFulfillmentUseCase,
  ConfirmFulfillmentError,
} from '../applications/fulfillment/confirm-fulfillment-use-case.js';

describe('FulfillmentCode Domain Entity', () => {
  it('generates valid fulfillment code', () => {
    const code = FulfillmentCode.generate('action-123');

    expect(code.getCode()).toMatch(/^FC-[A-Z0-9]{8}$/);
    expect(code.getActionId()).toBe('action-123');
    expect(code.getStatus()).toBe('pending');
    expect(code.isValid()).toBe(true);
  });

  it('calculates correct expiration (90 days)', () => {
    const code = FulfillmentCode.generate('action-123');
    const now = new Date();
    const expected90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const expiresAt = code.getExpiresAt();
    const diff = Math.abs(expiresAt.getTime() - expected90Days.getTime());

    // Allow 1 second tolerance
    expect(diff).toBeLessThan(1000);
  });

  it('reconstructs from database record', () => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const reconstructed = FulfillmentCode.fromRecord({
      id: 'fc-id-123',
      code: 'FC-ABC12345',
      action_id: 'action-123',
      status: 'pending',
      created_at: now,
      expires_at: expiresAt,
    });

    expect(reconstructed.getCode()).toBe('FC-ABC12345');
    expect(reconstructed.getStatus()).toBe('pending');
    expect(reconstructed.isValid()).toBe(true);
  });

  it('marks code as fulfilled', () => {
    const code = FulfillmentCode.generate('action-123');
    const fulfilled = code.markFulfilled();

    expect(fulfilled.getStatus()).toBe('fulfilled');
    expect(fulfilled.getFulfilledAt()).toBeInstanceOf(Date);
  });

  it('prevents marking already fulfilled code', () => {
    const code = FulfillmentCode.generate('action-123');
    const fulfilled = code.markFulfilled();

    expect(() => fulfilled.markFulfilled()).toThrow('already fulfilled');
  });

  it('prevents marking expired code', () => {
    const now = new Date();
    const expiredDate = new Date(now.getTime() - 1000); // 1 second in past

    const code = FulfillmentCode.fromRecord({
      id: 'fc-id-123',
      code: 'FC-ABC12345',
      action_id: 'action-123',
      status: 'pending',
      created_at: new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000),
      expires_at: expiredDate,
    });

    expect(code.isExpired()).toBe(true);
    expect(code.isValid()).toBe(false);
    expect(() => code.markFulfilled()).toThrow('expired');
  });

  it('converts to record for storage', () => {
    const code = FulfillmentCode.generate('action-123');
    const record = code.toRecord();

    expect(record).toHaveProperty('id');
    expect(record).toHaveProperty('code');
    expect(record.action_id).toBe('action-123');
    expect(record.status).toBe('pending');
    expect(record.fulfilled_at).toBeNull();
  });
});

// Mock repository implementations for testing
class MockFulfillmentCodeRepository {
  private codes: Map<string, FulfillmentCode> = new Map();

  async save(code: FulfillmentCode) {
    this.codes.set(code.getId(), code);
  }

  async findByCode(code: string) {
    for (const fc of this.codes.values()) {
      if (fc.getCode() === code) return fc;
    }
    return null;
  }

  async findByActionId(actionId: string) {
    for (const fc of this.codes.values()) {
      if (fc.getActionId() === actionId) return fc;
    }
    return null;
  }

  async findById(id: string) {
    return this.codes.get(id) ?? null;
  }
}

class MockCommerceActionRepository {
  private actions: Map<string, any> = new Map();
  private fulfillmentStatuses: Map<string, string> = new Map();

  addAction(actionId: string, creatorId: string) {
    this.actions.set(actionId, { id: actionId, creatorId });
  }

  async findById(id: string) {
    const action = this.actions.get(id);
    return action
      ? {
          ...action,
          getCreatorId: () => action.creatorId,
        }
      : null;
  }

  async updateFulfillmentStatus(actionId: string, status: string) {
    this.fulfillmentStatuses.set(actionId, status);
  }

  getFulfillmentStatus(actionId: string) {
    return this.fulfillmentStatuses.get(actionId);
  }
}

describe('confirmFulfillmentUseCase', () => {
  let fcRepo: MockFulfillmentCodeRepository;
  let actionRepo: MockCommerceActionRepository;

  beforeEach(() => {
    fcRepo = new MockFulfillmentCodeRepository();
    actionRepo = new MockCommerceActionRepository();
  });

  it('successfully confirms fulfillment code', async () => {
    // Setup
    const actionId = 'action-123';
    const creatorId = 'creator-456';
    const code = FulfillmentCode.generate(actionId);

    await fcRepo.save(code);
    actionRepo.addAction(actionId, creatorId);

    // Execute
    const result = await confirmFulfillmentUseCase(
      { fulfillmentCodeRepository: fcRepo as any, commerceActionRepository: actionRepo as any },
      {
        actionId,
        fulfillmentCode: code.getCode(),
        creatorId,
      },
    );

    // Verify
    expect(result.status).toBe('fulfilled');
    expect(result.confirmedAt).toBeDefined();
    expect(actionRepo.getFulfillmentStatus(actionId)).toBe('fulfilled');
  });

  it('rejects invalid code format', async () => {
    const actionId = 'action-123';
    actionRepo.addAction(actionId, 'creator-456');

    await expect(
      confirmFulfillmentUseCase(
        { fulfillmentCodeRepository: fcRepo as any, commerceActionRepository: actionRepo as any },
        {
          actionId,
          fulfillmentCode: 'INVALID-CODE',
          creatorId: 'creator-456',
        },
      ),
    ).rejects.toThrow(ConfirmFulfillmentError);
  });

  it('rejects non-existent code', async () => {
    const actionId = 'action-123';
    actionRepo.addAction(actionId, 'creator-456');

    await expect(
      confirmFulfillmentUseCase(
        { fulfillmentCodeRepository: fcRepo as any, commerceActionRepository: actionRepo as any },
        {
          actionId,
          fulfillmentCode: 'FC-ABCDEFGH',
          creatorId: 'creator-456',
        },
      ),
    ).rejects.toThrow('does not exist');
  });

  it('rejects mismatched fulfillment code', async () => {
    // Setup
    const actionId1 = 'action-123';
    const actionId2 = 'action-456';
    const creatorId = 'creator-789';
    const code = FulfillmentCode.generate(actionId1);

    await fcRepo.save(code);
    actionRepo.addAction(actionId1, creatorId);
    actionRepo.addAction(actionId2, creatorId);

    // Execute & verify
    await expect(
      confirmFulfillmentUseCase(
        { fulfillmentCodeRepository: fcRepo as any, commerceActionRepository: actionRepo as any },
        {
          actionId: actionId2, // Different action
          fulfillmentCode: code.getCode(),
          creatorId,
        },
      ),
    ).rejects.toThrow('does not match');
  });

  it('rejects unauthorized creator', async () => {
    // Setup
    const actionId = 'action-123';
    const validCreator = 'creator-valid';
    const invalidCreator = 'creator-invalid';
    const code = FulfillmentCode.generate(actionId);

    await fcRepo.save(code);
    actionRepo.addAction(actionId, validCreator);

    // Execute & verify
    await expect(
      confirmFulfillmentUseCase(
        { fulfillmentCodeRepository: fcRepo as any, commerceActionRepository: actionRepo as any },
        {
          actionId,
          fulfillmentCode: code.getCode(),
          creatorId: invalidCreator,
        },
      ),
    ).rejects.toThrow('Not authorized');
  });

  it('rejects expired code', async () => {
    // Setup: Create expired code
    const now = new Date();
    const expiredDate = new Date(now.getTime() - 1000);
    const actionId = 'action-123';
    const creatorId = 'creator-456';

    const expiredCode = FulfillmentCode.fromRecord({
      id: 'fc-123',
      code: 'FC-EXP0RED1',
      action_id: actionId,
      status: 'pending',
      created_at: new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000),
      expires_at: expiredDate,
    });

    await fcRepo.save(expiredCode);
    actionRepo.addAction(actionId, creatorId);

    // Execute & verify
    await expect(
      confirmFulfillmentUseCase(
        { fulfillmentCodeRepository: fcRepo as any, commerceActionRepository: actionRepo as any },
        {
          actionId,
          fulfillmentCode: 'FC-EXP0RED1',
          creatorId,
        },
      ),
    ).rejects.toThrow('expired');
  });

  it('rejects already fulfilled code', async () => {
    // Setup
    const actionId = 'action-123';
    const creatorId = 'creator-456';
    let code = FulfillmentCode.generate(actionId);

    // Mark as fulfilled
    code = code.markFulfilled();
    await fcRepo.save(code);
    actionRepo.addAction(actionId, creatorId);

    // Execute & verify
    await expect(
      confirmFulfillmentUseCase(
        { fulfillmentCodeRepository: fcRepo as any, commerceActionRepository: actionRepo as any },
        {
          actionId,
          fulfillmentCode: code.getCode(),
          creatorId,
        },
      ),
    ).rejects.toThrow('already been used');
  });
});
