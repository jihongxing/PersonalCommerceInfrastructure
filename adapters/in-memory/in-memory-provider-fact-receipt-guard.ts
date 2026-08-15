import type {
  ProviderFactReceiptDecision,
  ProviderFactReceiptGuard,
} from '../../applications/paid-commerce/provider-fact-receipt-guard.js';
import type { VerifiedProviderFact } from '../../applications/paid-commerce/provider-ports.js';

export class InMemoryProviderFactReceiptGuard implements ProviderFactReceiptGuard {
  private readonly eventFacts = new Map<string, VerifiedProviderFact>();
  private readonly resourceFacts = new Map<string, VerifiedProviderFact>();

  public inspect(fact: VerifiedProviderFact): Promise<ProviderFactReceiptDecision> {
    const eventKey = `${fact.providerId}:${fact.providerEventId}`;
    const existingEvent = this.eventFacts.get(eventKey);
    if (existingEvent !== undefined) {
      return Promise.resolve(
        sameFact(existingEvent, fact)
          ? { status: 'idempotent' }
          : { status: 'conflict', reason: 'provider_event_id_reused_with_different_fact' },
      );
    }

    const resourceKey = `${fact.providerId}:${fact.resourceType}:${fact.internalReference}`;
    const existingResourceFact = this.resourceFacts.get(resourceKey);
    if (existingResourceFact !== undefined) {
      if (fact.sequence < existingResourceFact.sequence) {
        return Promise.resolve({ status: 'stale', reason: 'provider_fact_sequence_is_older' });
      }
      if (
        fact.sequence === existingResourceFact.sequence &&
        !sameTerminalFact(existingResourceFact, fact)
      ) {
        return Promise.resolve({
          status: 'conflict',
          reason: 'provider_fact_sequence_conflicts_with_existing_fact',
        });
      }
      if (sameTerminalFact(existingResourceFact, fact)) {
        this.eventFacts.set(eventKey, fact);
        return Promise.resolve({ status: 'idempotent' });
      }
      return Promise.resolve({
        status: 'conflict',
        reason: 'provider_fact_conflicts_with_existing_terminal_fact',
      });
    }

    return Promise.resolve({ status: 'accepted' });
  }

  public recordAccepted(fact: VerifiedProviderFact): Promise<void> {
    this.eventFacts.set(`${fact.providerId}:${fact.providerEventId}`, fact);
    this.resourceFacts.set(
      `${fact.providerId}:${fact.resourceType}:${fact.internalReference}`,
      fact,
    );
    return Promise.resolve();
  }
}

function sameFact(left: VerifiedProviderFact, right: VerifiedProviderFact): boolean {
  return (
    sameTerminalFact(left, right) &&
    left.providerReference === right.providerReference &&
    left.occurredAt === right.occurredAt
  );
}

function sameTerminalFact(left: VerifiedProviderFact, right: VerifiedProviderFact): boolean {
  return (
    left.kind === right.kind &&
    left.resourceType === right.resourceType &&
    left.internalReference === right.internalReference &&
    left.amountMinor === right.amountMinor &&
    left.currency === right.currency &&
    left.sequence === right.sequence
  );
}
