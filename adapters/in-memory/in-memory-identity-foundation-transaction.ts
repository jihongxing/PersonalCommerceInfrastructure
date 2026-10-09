import type {
  IdentityFoundationTransaction,
  IdentityFoundationTransactionScope,
} from '../../applications/identity-foundation/identity-foundation-transaction.js';
import type { TransactionParticipant } from './transaction-participant.js';

export class InMemoryIdentityFoundationTransaction implements IdentityFoundationTransaction {
  public constructor(
    private readonly scope: IdentityFoundationTransactionScope,
    private readonly participants: readonly TransactionParticipant[],
  ) {}

  public async execute<Result>(
    operation: (scope: IdentityFoundationTransactionScope) => Promise<Result>,
  ): Promise<Result> {
    const snapshots = this.participants.map((participant) => participant.createSnapshot());
    try {
      return await operation(this.scope);
    } catch (error) {
      this.participants.forEach((participant, index) => {
        participant.restoreSnapshot(snapshots[index]);
      });
      throw error;
    }
  }
}
