import type { VerifiedProviderFact } from './provider-ports.js';

export type ProviderFactReceiptStatus = 'accepted' | 'idempotent' | 'conflict' | 'stale';

export interface ProviderFactReceiptDecision {
  readonly status: ProviderFactReceiptStatus;
  readonly reason?: string;
}

export interface ProviderFactReceiptGuard {
  inspect(fact: VerifiedProviderFact): Promise<ProviderFactReceiptDecision>;
  recordAccepted(fact: VerifiedProviderFact): Promise<void>;
}
