export class DomainTransitionError extends Error {
  public constructor(
    public readonly aggregate: string,
    public readonly fromState: string,
    public readonly attemptedTransition: string,
  ) {
    super(`${aggregate} cannot perform ${attemptedTransition} from state ${fromState}`);
    this.name = 'DomainTransitionError';
  }
}
