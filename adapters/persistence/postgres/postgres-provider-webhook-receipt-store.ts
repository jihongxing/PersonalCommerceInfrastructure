import { and, eq } from 'drizzle-orm';

import type {
  ProviderWebhookReceipt,
  ProviderWebhookReceiptDecision,
  ProviderWebhookReceiptStore,
} from '../../../applications/paid-commerce/provider-webhook-runtime.js';
import { providerWebhookReceipts } from '../../../database/schema/paid-commerce.js';

import type { ProductDatabase } from './postgres-database.js';

export class PostgresProviderWebhookReceiptStore implements ProviderWebhookReceiptStore {
  public constructor(private readonly database: ProductDatabase) {}

  public async begin(receipt: ProviderWebhookReceipt): Promise<ProviderWebhookReceiptDecision> {
    const inserted = await this.database
      .insert(providerWebhookReceipts)
      .values(receipt)
      .onConflictDoNothing()
      .returning({ providerEventId: providerWebhookReceipts.providerEventId });
    if (inserted.length === 1) {
      return { status: 'accepted' };
    }

    const existing = await this.database
      .select()
      .from(providerWebhookReceipts)
      .where(
        and(
          eq(providerWebhookReceipts.providerId, receipt.providerId),
          eq(providerWebhookReceipts.providerEventId, receipt.providerEventId),
        ),
      )
      .limit(1);
    const row = existing[0];
    if (row === undefined || row.payloadSha256 !== receipt.payloadSha256) {
      return {
        status: 'conflict',
        reason: 'provider_event_id_reused_with_different_payload',
      };
    }
    return { status: row.processed ? 'idempotent' : 'retry' };
  }

  public async markProcessed(providerId: string, providerEventId: string): Promise<void> {
    await this.database
      .update(providerWebhookReceipts)
      .set({ processed: true, processedAt: new Date().toISOString() })
      .where(
        and(
          eq(providerWebhookReceipts.providerId, providerId),
          eq(providerWebhookReceipts.providerEventId, providerEventId),
        ),
      );
  }
}
