import type {
  ProviderWebhookReceipt,
  ProviderWebhookReceiptDecision,
  ProviderWebhookReceiptStore,
} from '../../applications/paid-commerce/provider-webhook-runtime.js';

interface StoredReceipt extends ProviderWebhookReceipt {
  readonly processed: boolean;
}

export class InMemoryProviderWebhookReceiptStore implements ProviderWebhookReceiptStore {
  private readonly receipts = new Map<string, StoredReceipt>();

  public begin(receipt: ProviderWebhookReceipt): Promise<ProviderWebhookReceiptDecision> {
    const key = receiptKey(receipt.providerId, receipt.providerEventId);
    const existing = this.receipts.get(key);
    if (existing === undefined) {
      this.receipts.set(key, { ...receipt, processed: false });
      return Promise.resolve({ status: 'accepted' });
    }
    if (existing.payloadSha256 !== receipt.payloadSha256) {
      return Promise.resolve({
        status: 'conflict',
        reason: 'provider_event_id_reused_with_different_payload',
      });
    }
    return Promise.resolve({ status: existing.processed ? 'idempotent' : 'retry' });
  }

  public markProcessed(providerId: string, providerEventId: string): Promise<void> {
    const key = receiptKey(providerId, providerEventId);
    const existing = this.receipts.get(key);
    if (existing !== undefined) {
      this.receipts.set(key, { ...existing, processed: true });
    }
    return Promise.resolve();
  }
}

function receiptKey(providerId: string, providerEventId: string): string {
  return `${providerId}:${providerEventId}`;
}
