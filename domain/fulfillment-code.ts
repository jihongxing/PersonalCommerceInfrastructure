/**
 * FulfillmentCode Domain Entity
 * 
 * Represents proof of offline service completion.
 * Used in scenarios like personal training, tour guiding, etc.
 * 
 * Lifecycle:
 * 1. Generated when customer submits a request (pending)
 * 2. Shared with creator via QR code or text
 * 3. Creator scans/inputs code to confirm service completion
 * 4. Marked as fulfilled and service is considered complete
 * 5. Expires 90 days after creation if not fulfilled
 */

function generateRandomCode(length: number): string {
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * ALPHABET.length);
    code += ALPHABET[randomIndex];
  }
  
  return code;
}

export type FulfillmentCodeStatus = 'pending' | 'fulfilled' | 'expired';

export interface FulfillmentCodeProps {
  id: string;
  code: string;
  actionId: string;
  status: FulfillmentCodeStatus;
  createdAt: Date;
  expiresAt: Date;
  fulfilledAt?: Date;
}

export class FulfillmentCode {
  private constructor(private readonly props: FulfillmentCodeProps) {}

  /**
   * Generate a new fulfillment code for an action
   * Format: FC-[8 random alphanumeric characters]
   * Expires in 90 days
   */
  static generate(actionId: string): FulfillmentCode {
    const code = `FC-${generateRandomCode(8)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // +90 days

    return new FulfillmentCode({
      id: crypto.randomUUID(),
      code,
      actionId,
      status: 'pending',
      createdAt: now,
      expiresAt,
    });
  }

  /**
   * Reconstruct from database record
   */
  static fromRecord(record: {
    id: string;
    code: string;
    action_id: string;
    status: FulfillmentCodeStatus;
    created_at: string | Date;
    expires_at: string | Date;
    fulfilled_at?: string | Date | null;
  }): FulfillmentCode {
    return new FulfillmentCode({
      id: record.id,
      code: record.code,
      actionId: record.action_id,
      status: record.status,
      createdAt: new Date(record.created_at),
      expiresAt: new Date(record.expires_at),
      fulfilledAt: record.fulfilled_at ? new Date(record.fulfilled_at) : undefined,
    });
  }

  // ========== Getters ==========

  getId(): string {
    return this.props.id;
  }

  getCode(): string {
    return this.props.code;
  }

  getActionId(): string {
    return this.props.actionId;
  }

  getStatus(): FulfillmentCodeStatus {
    return this.props.status;
  }

  getCreatedAt(): Date {
    return this.props.createdAt;
  }

  getExpiresAt(): Date {
    return this.props.expiresAt;
  }

  getFulfilledAt(): Date | undefined {
    return this.props.fulfilledAt;
  }

  // ========== Business Logic ==========

  /**
   * Check if code has expired
   */
  isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  /**
   * Check if code is still valid for confirmation
   */
  isValid(): boolean {
    return this.props.status === 'pending' && !this.isExpired();
  }

  /**
   * Mark code as fulfilled
   * Can only be called when status is 'pending' and not expired
   */
  markFulfilled(): FulfillmentCode {
    if (this.props.status === 'fulfilled') {
      throw new Error('Fulfillment code already fulfilled');
    }
    
    if (this.isExpired()) {
      throw new Error('Fulfillment code expired');
    }

    return new FulfillmentCode({
      ...this.props,
      status: 'fulfilled',
      fulfilledAt: new Date(),
    });
  }

  /**
   * Convert to plain object for storage/serialization
   */
  toRecord(): {
    id: string;
    code: string;
    action_id: string;
    status: FulfillmentCodeStatus;
    created_at: Date;
    expires_at: Date;
    fulfilled_at: Date | null;
  } {
    return {
      id: this.props.id,
      code: this.props.code,
      action_id: this.props.actionId,
      status: this.props.status,
      created_at: this.props.createdAt,
      expires_at: this.props.expiresAt,
      fulfilled_at: this.props.fulfilledAt ?? null,
    };
  }
}
