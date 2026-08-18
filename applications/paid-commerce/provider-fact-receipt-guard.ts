import type { VerifiedProviderFact } from './provider-ports.js';

export type ProviderFactReceiptStatus = 'accepted' | 'idempotent' | 'conflict' | 'stale';

export interface ProviderFactReceiptDecision {
  readonly status: ProviderFactReceiptStatus;
  readonly reason?: string;
}

export interface ProviderFactObservation {
  readonly providerId: string;
  readonly providerEventId: string;
  readonly providerReference: string;
  readonly kind: string;
  readonly resourceType: 'payment' | 'settlement' | 'withdrawal';
  readonly internalReference: string;
  readonly occurredAt: string;
  readonly status: ProviderFactReceiptStatus;
  readonly reason?: string;
}

export interface ProviderFactReceiptGuard {
  inspect(fact: VerifiedProviderFact): Promise<ProviderFactReceiptDecision>;
  recordAccepted(fact: VerifiedProviderFact): Promise<void>;
  listObservations(): Promise<readonly ProviderFactObservation[]>;
}
