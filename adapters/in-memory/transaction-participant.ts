export interface TransactionParticipant {
  createSnapshot(): unknown;
  restoreSnapshot(snapshot: unknown): void;
}
