import type { CommerceActionRepository } from '../../applications/customer-request/customer-request-repositories.js';
import type { CommerceAction } from '../../modules/customer-request/commerce-action.js';

import type { TransactionParticipant } from './transaction-participant.js';

export class InMemoryCommerceActionRepository
  implements CommerceActionRepository, TransactionParticipant
{
  private actions = new Map<string, CommerceAction>();

  public findById(id: string): Promise<CommerceAction | undefined> {
    const action = this.actions.get(id);
    return Promise.resolve(action === undefined ? undefined : structuredClone(action));
  }

  public findByOwnerId(ownerId: string): Promise<readonly CommerceAction[]> {
    return Promise.resolve(
      structuredClone([...this.actions.values()].filter((action) => action.creatorId === ownerId)),
    );
  }

  public findSubmittedByCustomerAndOffering(
    customerId: string,
    offeringId: string,
  ): Promise<CommerceAction | undefined> {
    const action = [...this.actions.values()].find(
      (entry) =>
        entry.customerId === customerId &&
        entry.offeringId === offeringId &&
        entry.state === 'submitted',
    );
    return Promise.resolve(action === undefined ? undefined : structuredClone(action));
  }

  public findByResultAccessToken(token: string): Promise<CommerceAction | undefined> {
    const action = [...this.actions.values()].find((entry) => entry.resultAccessToken === token);
    return Promise.resolve(action === undefined ? undefined : structuredClone(action));
  }

  public saveTerminalDecision(action: CommerceAction): Promise<boolean> {
    const existing = this.actions.get(action.id);
    if (
      existing === undefined ||
      existing.state !== 'submitted' ||
      (action.state !== 'confirmed' && action.state !== 'declined')
    ) {
      return Promise.resolve(false);
    }

    this.actions.set(action.id, structuredClone(action));
    return Promise.resolve(true);
  }

  public save(action: CommerceAction): Promise<void> {
    this.actions.set(action.id, structuredClone(action));
    return Promise.resolve();
  }

  public createSnapshot(): unknown {
    return structuredClone(this.actions);
  }

  public restoreSnapshot(snapshot: unknown): void {
    if (!(snapshot instanceof Map)) {
      throw new TypeError('Commerce Action repository snapshot must be a Map.');
    }

    this.actions = structuredClone(snapshot) as Map<string, CommerceAction>;
  }
}
