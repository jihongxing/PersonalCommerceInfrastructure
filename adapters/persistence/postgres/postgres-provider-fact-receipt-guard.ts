import { and, desc, eq } from 'drizzle-orm';

import type {
  ProviderFactObservation,
  ProviderFactReceiptDecision,
  ProviderFactReceiptGuard,
} from '../../../applications/paid-commerce/provider-fact-receipt-guard.js';
import type { VerifiedProviderFact } from '../../../applications/paid-commerce/provider-ports.js';
import {
  providerFactObservations,
  providerFactReceipts,
} from '../../../database/schema/paid-commerce.js';

import type { ProductDatabase } from './postgres-database.js';

export class PostgresProviderFactReceiptGuard implements ProviderFactReceiptGuard {
  public constructor(private readonly database: ProductDatabase) {}

  public async inspect(fact: VerifiedProviderFact): Promise<ProviderFactReceiptDecision> {
    const eventRows = await this.database
      .select()
      .from(providerFactReceipts)
      .where(
        and(
          eq(providerFactReceipts.providerId, fact.providerId),
          eq(providerFactReceipts.providerEventId, fact.providerEventId),
        ),
      )
      .orderBy(desc(providerFactReceipts.sequence))
      .limit(1);
    const eventFact = eventRows[0];
    if (eventFact !== undefined) {
      return this.observe(
        fact,
        sameFact(eventFact, fact)
          ? { status: 'idempotent' }
          : { status: 'conflict', reason: 'provider_event_id_reused_with_different_fact' },
      );
    }

    const resourceRows = await this.database
      .select()
      .from(providerFactReceipts)
      .where(
        and(
          eq(providerFactReceipts.providerId, fact.providerId),
          eq(providerFactReceipts.resourceType, fact.resourceType),
          eq(providerFactReceipts.internalReference, fact.internalReference),
        ),
      )
      .orderBy(desc(providerFactReceipts.sequence))
      .limit(1);
    const resourceFact = resourceRows[0];
    if (resourceFact === undefined) {
      return this.observe(fact, { status: 'accepted' });
    }
    if (fact.sequence < resourceFact.sequence) {
      return this.observe(fact, { status: 'stale', reason: 'provider_fact_sequence_is_older' });
    }
    if (sameTerminalFact(resourceFact, fact)) {
      return this.observe(fact, { status: 'idempotent' });
    }
    if (isAllowedResourceEvolution(resourceFact, fact)) {
      return this.observe(fact, { status: 'accepted' });
    }
    return this.observe(fact, {
      status: 'conflict',
      reason:
        fact.sequence === resourceFact.sequence
          ? 'provider_fact_sequence_conflicts_with_existing_fact'
          : 'provider_fact_conflicts_with_existing_terminal_fact',
    });
  }

  public async recordAccepted(fact: VerifiedProviderFact): Promise<void> {
    const inserted = await this.database
      .insert(providerFactReceipts)
      .values({
        providerId: fact.providerId,
        providerEventId: fact.providerEventId,
        providerReference: fact.providerReference,
        kind: fact.kind,
        resourceType: fact.resourceType,
        internalReference: fact.internalReference,
        amountMinor: fact.amountMinor,
        currency: fact.currency,
        sequence: fact.sequence,
        occurredAt: fact.occurredAt,
      })
      .onConflictDoNothing()
      .returning({ providerEventId: providerFactReceipts.providerEventId });
    if (inserted.length === 1) {
      return;
    }

    const decision = await this.inspect(fact);
    if (decision.status !== 'idempotent') {
      throw new Error(`Provider Fact receipt conflict: ${decision.reason ?? decision.status}`);
    }
  }

  public async listObservations(): Promise<readonly ProviderFactObservation[]> {
    const rows = await this.database
      .select()
      .from(providerFactObservations)
      .orderBy(providerFactObservations.recordedAt);
    return rows.map((row) => ({
      providerId: row.providerId,
      providerEventId: row.providerEventId,
      providerReference: row.providerReference,
      kind: row.kind,
      resourceType: row.resourceType as ProviderFactObservation['resourceType'],
      internalReference: row.internalReference,
      occurredAt: row.occurredAt,
      status: row.status as ProviderFactObservation['status'],
      ...(row.reason === null ? {} : { reason: row.reason }),
    }));
  }

  private async observe(
    fact: VerifiedProviderFact,
    decision: ProviderFactReceiptDecision,
  ): Promise<ProviderFactReceiptDecision> {
    await this.database.insert(providerFactObservations).values({
      providerId: fact.providerId,
      providerEventId: fact.providerEventId,
      providerReference: fact.providerReference,
      kind: fact.kind,
      resourceType: fact.resourceType,
      internalReference: fact.internalReference,
      occurredAt: fact.occurredAt,
      status: decision.status,
      reason: decision.reason ?? null,
    });
    return decision;
  }
}

type ProviderFactRow = typeof providerFactReceipts.$inferSelect;

function sameFact(left: ProviderFactRow, right: VerifiedProviderFact): boolean {
  return (
    sameTerminalFact(left, right) &&
    left.providerReference === right.providerReference &&
    Date.parse(left.occurredAt) === Date.parse(right.occurredAt)
  );
}

function sameTerminalFact(left: ProviderFactRow, right: VerifiedProviderFact): boolean {
  return (
    left.kind === right.kind &&
    left.resourceType === right.resourceType &&
    left.internalReference === right.internalReference &&
    left.amountMinor === right.amountMinor &&
    left.currency === right.currency &&
    left.sequence === right.sequence
  );
}

function isAllowedResourceEvolution(
  existing: ProviderFactRow,
  incoming: VerifiedProviderFact,
): boolean {
  if (
    existing.resourceType !== incoming.resourceType ||
    incoming.sequence <= existing.sequence ||
    existing.amountMinor !== incoming.amountMinor ||
    existing.currency !== incoming.currency
  ) {
    return false;
  }
  return (
    (existing.resourceType === 'payment' &&
      existing.kind === 'PaymentSucceeded' &&
      incoming.kind === 'RefundSucceeded') ||
    (existing.resourceType === 'payment' &&
      existing.kind === 'PaymentFailed' &&
      incoming.kind === 'PaymentSucceeded') ||
    (existing.resourceType === 'withdrawal' &&
      existing.kind === 'WithdrawalFailed' &&
      incoming.kind === 'WithdrawalSucceeded')
  );
}
