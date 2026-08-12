import type { UnitOfWork, UnitOfWorkScope } from '../../applications/core/ports/unit-of-work.js';
import type { ProductEventStore } from '../../applications/core/ports/product-event-store.js';
import type { DistributionAssetRepository } from '../../applications/distribution/distribution-repositories.js';
import type {
  CapabilityRepository,
  CommerceIdentityRepository,
} from '../../applications/creator-identity/creator-identity-repositories.js';
import type { OfferingRepository } from '../../applications/service-offering/offering-repositories.js';
import type {
  CommerceActionRepository,
  CustomerRepository,
} from '../../applications/customer-request/customer-request-repositories.js';

import type { TransactionParticipant } from './transaction-participant.js';

export class InMemoryUnitOfWork implements UnitOfWork {
  private transactionTail: Promise<void> = Promise.resolve();

  public constructor(
    private readonly participants: readonly TransactionParticipant[],
    private readonly productEventStore: ProductEventStore,
    private readonly repositories: {
      readonly identityRepository?: CommerceIdentityRepository;
      readonly capabilityRepository?: CapabilityRepository;
      readonly offeringRepository?: OfferingRepository;
      readonly distributionAssetRepository?: DistributionAssetRepository;
      readonly customerRepository?: CustomerRepository;
      readonly commerceActionRepository?: CommerceActionRepository;
    } = {},
  ) {}

  public async execute<Result>(
    operation: (scope: UnitOfWorkScope) => Promise<Result>,
  ): Promise<Result> {
    const previousTransaction = this.transactionTail;
    let releaseTransaction: () => void = () => undefined;
    this.transactionTail = new Promise<void>((resolve) => {
      releaseTransaction = resolve;
    });
    await previousTransaction;

    const snapshots = this.participants.map((participant) => participant.createSnapshot());
    const scope: UnitOfWorkScope = {
      productEventStore: this.productEventStore,
      ...this.repositories,
    };

    try {
      return await operation(scope);
    } catch (error) {
      this.participants.forEach((participant, index) => {
        participant.restoreSnapshot(snapshots[index]);
      });
      throw error;
    } finally {
      releaseTransaction();
    }
  }
}
