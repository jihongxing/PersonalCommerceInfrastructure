import type { ActorContext } from '../core/actor-context.js';
import { ApplicationError } from '../core/application-error.js';

export type RealMoneyOperation = 'payment' | 'settlement' | 'withdrawal';
export type RealMoneyRuntimeEnvironment = 'local' | 'test' | 'controlled' | 'production';

export interface RealMoneyRuntimeState {
  readonly runtimeEnvironment: RealMoneyRuntimeEnvironment;
  readonly realMoneyEnabled: boolean;
  readonly founderActivationReference?: string;
  readonly liveProviderConfigured: boolean;
}

export class RealMoneyActivationGuard {
  public constructor(private readonly state: RealMoneyRuntimeState) {}

  public assertLiveOperationAllowed(operation: RealMoneyOperation): void {
    if (!this.state.realMoneyEnabled) {
      throw new ApplicationError({
        category: 'unavailable',
        code: 'real_money_disabled',
        message: `Live ${operation} is disabled by the real-money kill switch.`,
      });
    }
    if (
      this.state.runtimeEnvironment !== 'controlled' &&
      this.state.runtimeEnvironment !== 'production'
    ) {
      throw new ApplicationError({
        category: 'unavailable',
        code: 'live_runtime_not_controlled',
        message: `Live ${operation} requires controlled or production runtime.`,
      });
    }
    if (this.state.founderActivationReference === undefined) {
      throw new ApplicationError({
        category: 'authorization',
        code: 'founder_activation_required',
        message: `Live ${operation} requires explicit Founder activation.`,
      });
    }
    if (!this.state.liveProviderConfigured) {
      throw new ApplicationError({
        category: 'unavailable',
        code: 'live_provider_not_configured',
        message: `Live ${operation} requires a configured Live Provider.`,
      });
    }
  }

  public assertControlledOperationAllowed(): void {}

  public assertRuntimeControlAuthority(context: ActorContext): void {
    if (context.actor.kind !== 'pilot_operations') {
      throw new ApplicationError({
        category: 'authorization',
        code: 'runtime_control_forbidden',
        message: 'Real-money runtime control requires authorized Operations.',
      });
    }
  }
}
