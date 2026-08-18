import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('first real transaction evidence boundary', () => {
  it('includes required audit references without defining sensitive payment credentials', async () => {
    const source = await readFile('applications/paid-commerce/real-money-evidence.ts', 'utf8');

    for (const field of [
      'orderId',
      'paymentId',
      'providerReference',
      'settlementReference',
      'creatorId',
      'customerId',
      'offeringId',
      'grossAmountMinor',
      'providerFeeMinor',
      'platformFeeMinor',
      'creatorNetMinor',
      'paymentTimestamp',
      'settlementTimestamp',
      'ledgerEntryIds',
      'walletProjectionReference',
      'withdrawalReference',
      'auditReferences',
    ]) {
      expect(source).toContain(field);
    }
    expect(source).not.toMatch(/cardNumber|cvv|apiCredential|webhookSecret|providerSecret/u);
  });
});
