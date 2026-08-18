import type { Currency, MoneyMinor } from '../../modules/paid-commerce/money-domain.js';

export interface FirstRealTransactionEvidence {
  readonly orderId: string;
  readonly paymentId: string;
  readonly providerReference: string;
  readonly settlementReference: string;
  readonly creatorId: string;
  readonly customerId: string;
  readonly offeringId: string;
  readonly currency: Currency;
  readonly grossAmountMinor: MoneyMinor;
  readonly providerFeeMinor: MoneyMinor;
  readonly platformFeeMinor: MoneyMinor;
  readonly creatorNetMinor: MoneyMinor;
  readonly paymentTimestamp: string;
  readonly settlementTimestamp: string;
  readonly ledgerEntryIds: readonly string[];
  readonly walletProjectionReference: string;
  readonly withdrawalReference?: string;
  readonly auditReferences: readonly string[];
}
