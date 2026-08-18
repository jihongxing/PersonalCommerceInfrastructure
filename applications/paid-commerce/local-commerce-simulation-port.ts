import type { Currency, MoneyMinor } from '../../modules/paid-commerce/money-domain.js';
import type {
  ProviderFactVerificationResult,
  ProviderFactKind,
  ProviderFactResourceType,
  ProviderOperation,
  ProviderOperationRequest,
} from './provider-ports.js';

export type SimulationRuntimeEnvironment = 'local' | 'test' | 'controlled';
export type PaymentSimulationScenario =
  'success' | 'failed' | 'delayed' | 'expired' | 'duplicate_event' | 'out_of_order_event';
export type SettlementSimulationScenario =
  'immediate' | 'delayed' | 'failed' | 'duplicate' | 'conflicting_terminal_event';
export type WithdrawalSimulationScenario = 'success' | 'failed' | 'delayed' | 'duplicate';
export type RefundSimulationScenario = 'before_settlement' | 'after_settlement' | 'failed_refund';

export interface LocalCommerceSimulationScenario {
  readonly payment: PaymentSimulationScenario;
  readonly settlement: SettlementSimulationScenario;
  readonly withdrawal: WithdrawalSimulationScenario;
  readonly refund: RefundSimulationScenario;
}

export interface LocalCommerceSimulationEvidence {
  readonly origin: 'simulation';
  readonly providerId: 'local_commerce_simulator';
  readonly environment: SimulationRuntimeEnvironment;
  readonly scenario: LocalCommerceSimulationScenario;
}

export interface LocalCommerceSimulationEvent {
  readonly providerEventId: string;
  readonly providerReference: string;
  readonly kind: ProviderFactKind;
  readonly resourceType: ProviderFactResourceType;
  readonly internalReference: string;
  readonly amountMinor: MoneyMinor;
  readonly currency: Currency;
  readonly sequence: number;
  readonly occurredAt: string;
  readonly evidence: LocalCommerceSimulationEvidence;
}

export interface LocalCommerceSimulationPort {
  readonly providerId: 'local_commerce_simulator';
  configureScenario(scenario: Partial<LocalCommerceSimulationScenario>): void;
  getScenario(): LocalCommerceSimulationScenario;
  getEvidence(): LocalCommerceSimulationEvidence;
  takeEvents(): readonly LocalCommerceSimulationEvent[];
  advance(providerReference: string): void;
  recordRefundSucceeded(input: {
    readonly providerReference: string;
    readonly internalReference: string;
    readonly amountMinor: MoneyMinor;
    readonly currency: Currency;
  }): LocalCommerceSimulationEvent;
  createPaymentIntent(request: ProviderOperationRequest): Promise<ProviderOperation>;
  verifyPaymentFact(request: {
    readonly providerEventId: string;
  }): Promise<ProviderFactVerificationResult>;
  createSettlement(request: ProviderOperationRequest): Promise<ProviderOperation>;
  verifySettlementFact(request: {
    readonly providerEventId: string;
  }): Promise<ProviderFactVerificationResult>;
  createWithdrawalIntent(request: ProviderOperationRequest): Promise<ProviderOperation>;
  verifyWithdrawalFact(request: {
    readonly providerEventId: string;
  }): Promise<ProviderFactVerificationResult>;
}
