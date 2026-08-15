import type { Currency, MoneyMinor } from '../../modules/paid-commerce/money-domain.js';

export type ProviderCapabilityStatus = 'confirmed' | 'candidate' | 'rejected' | 'unknown_blocking';

export type ProviderOperationStatus = 'pending' | 'succeeded' | 'failed';

export type ProviderFactKind =
  | 'PaymentSucceeded'
  | 'PaymentFailed'
  | 'RefundSucceeded'
  | 'SettlementSucceeded'
  | 'WithdrawalSucceeded'
  | 'WithdrawalFailed';

export type ProviderFactResourceType = 'payment' | 'settlement' | 'withdrawal';

export interface ProviderOperationRequest {
  readonly internalReference: string;
  readonly amountMinor: MoneyMinor;
  readonly currency: Currency;
  readonly idempotencyKey: string;
}

export interface ProviderOperation {
  readonly providerId: string;
  readonly providerReference: string;
  readonly internalReference: string;
  readonly status: ProviderOperationStatus;
}

export interface ProviderEventVerificationRequest {
  readonly providerEventId: string;
}

export interface VerifiedProviderFact {
  readonly verification: 'verified';
  readonly providerId: string;
  readonly providerEventId: string;
  readonly providerReference: string;
  readonly kind: ProviderFactKind;
  readonly resourceType: ProviderFactResourceType;
  readonly internalReference: string;
  readonly amountMinor: MoneyMinor;
  readonly currency: Currency;
  readonly sequence: number;
  readonly occurredAt: string;
}

export interface ProviderFactVerificationRejected {
  readonly verification: 'rejected';
  readonly providerId: string;
  readonly providerEventId: string;
  readonly reason: 'unknown_event' | 'invalid_event';
}

export type ProviderFactVerificationResult =
  VerifiedProviderFact | ProviderFactVerificationRejected;

export interface PaymentProviderPort {
  createPaymentIntent(request: ProviderOperationRequest): Promise<ProviderOperation>;
  getPaymentStatus(providerReference: string): Promise<ProviderOperationStatus>;
  verifyPaymentFact(
    request: ProviderEventVerificationRequest,
  ): Promise<ProviderFactVerificationResult>;
}

export interface SettlementProviderPort {
  createSettlement(request: ProviderOperationRequest): Promise<ProviderOperation>;
  getSettlementStatus(providerReference: string): Promise<ProviderOperationStatus>;
  verifySettlementFact(
    request: ProviderEventVerificationRequest,
  ): Promise<ProviderFactVerificationResult>;
}

export interface WithdrawalProviderPort {
  createWithdrawalIntent(request: ProviderOperationRequest): Promise<ProviderOperation>;
  getWithdrawalStatus(providerReference: string): Promise<ProviderOperationStatus>;
  verifyWithdrawalFact(
    request: ProviderEventVerificationRequest,
  ): Promise<ProviderFactVerificationResult>;
}

export interface ProviderPort
  extends PaymentProviderPort, SettlementProviderPort, WithdrawalProviderPort {
  readonly providerId: string;
}

export interface ProviderCapabilityRecord {
  readonly providerId: string;
  readonly market: string;
  readonly currency: Currency;
  readonly payment: ProviderCapabilityStatus;
  readonly settlement: ProviderCapabilityStatus;
  readonly withdrawal: ProviderCapabilityStatus;
  readonly refund: ProviderCapabilityStatus;
  readonly dispute: ProviderCapabilityStatus;
  readonly accountModel: string;
  readonly constraints: readonly string[];
  readonly evidenceReference: string;
}

export interface ProviderCapabilityRegistry {
  register(record: ProviderCapabilityRecord): Promise<void>;
  findByProviderId(providerId: string): Promise<ProviderCapabilityRecord | undefined>;
  list(): Promise<readonly ProviderCapabilityRecord[]>;
}

export function isVerifiedProviderFact(
  result: ProviderFactVerificationResult,
): result is VerifiedProviderFact {
  return result.verification === 'verified';
}
