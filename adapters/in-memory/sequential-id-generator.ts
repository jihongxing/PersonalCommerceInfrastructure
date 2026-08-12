import type { IdGenerator } from '../../applications/core/ports/id-generator.js';

export class SequentialIdGenerator implements IdGenerator {
  private sequence = 0;

  public constructor(private readonly prefix: string) {}

  public generate(): string {
    this.sequence += 1;
    return `${this.prefix}-${String(this.sequence)}`;
  }
}
