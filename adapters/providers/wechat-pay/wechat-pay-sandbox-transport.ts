import type { Currency, MoneyMinor } from '../../../modules/paid-commerce/money-domain.js';

export type WeChatPaySandboxOperationType = 'payment' | 'settlement' | 'withdrawal';

export type WeChatPayTestEnvironment = 'controlled_test_transport' | 'official_sandbox';

export type WeChatPaySandboxOperationStatus = 'pending' | 'succeeded' | 'failed';

export type WeChatPaySandboxEventType =
  | 'payment_succeeded'
  | 'payment_failed'
  | 'refund_succeeded'
  | 'settlement_succeeded'
  | 'withdrawal_succeeded'
  | 'withdrawal_failed';

export interface WeChatPaySandboxCommand {
  readonly operationType: WeChatPaySandboxOperationType;
  readonly internalReference: string;
  readonly amountMinor: MoneyMinor;
  readonly currency: Currency;
  readonly idempotencyKey: string;
}

export interface WeChatPaySandboxOperationResponse {
  readonly providerRequestId: string;
  readonly providerReference: string;
  readonly internalReference: string;
  readonly status: WeChatPaySandboxOperationStatus;
}

export interface WeChatPaySandboxEvent {
  readonly eventId: string;
  readonly providerReference: string;
  readonly eventType: WeChatPaySandboxEventType;
  readonly operationType: WeChatPaySandboxOperationType;
  readonly internalReference: string;
  readonly amountMinor: MoneyMinor;
  readonly currency: Currency;
  readonly sequence: number;
  readonly occurredAt: string;
}

export interface WeChatPaySandboxEventVerificationRequest {
  readonly eventId: string;
}

export interface WeChatPaySandboxVerifiedEvent {
  readonly verification: 'verified';
  readonly event: WeChatPaySandboxEvent;
}

export interface WeChatPaySandboxRejectedEvent {
  readonly verification: 'rejected';
  readonly eventId: string;
  readonly reason: 'unknown_event' | 'invalid_event';
}

export type WeChatPaySandboxEventVerificationResult =
  WeChatPaySandboxVerifiedEvent | WeChatPaySandboxRejectedEvent;

export interface WeChatPaySandboxTransport {
  readonly environment: WeChatPayTestEnvironment;
  submit(command: WeChatPaySandboxCommand): Promise<WeChatPaySandboxOperationResponse>;
  getStatus(providerReference: string): Promise<WeChatPaySandboxOperationStatus>;
  verifyEvent(
    request: WeChatPaySandboxEventVerificationRequest,
  ): Promise<WeChatPaySandboxEventVerificationResult>;
}
