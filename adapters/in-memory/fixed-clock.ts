import type { Clock } from '../../applications/core/ports/clock.js';

export class FixedClock implements Clock {
  public constructor(private readonly currentTime: string) {}

  public now(): string {
    return this.currentTime;
  }
}
