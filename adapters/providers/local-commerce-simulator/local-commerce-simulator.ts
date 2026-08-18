import type {
  ProviderEventVerificationRequest,
  ProviderFactKind,
  ProviderFactResourceType,
  ProviderFactVerificationResult,
  ProviderOperation,
  ProviderOperationRequest,
  ProviderOperationStatus,
  ProviderPort,
} from '../../../applications/paid-commerce/provider-ports.js';
import type {
  LocalCommerceSimulationEvidence,
  LocalCommerceSimulationEvent,
  LocalCommerceSimulationPort,
  LocalCommerceSimulationScenario,
  PaymentSimulationScenario,
  SettlementSimulationScenario,
  SimulationRuntimeEnvironment,
  WithdrawalSimulationScenario,
} from '../../../applications/paid-commerce/local-commerce-simulation-port.js';
import type { Currency, MoneyMinor } from '../../../modules/paid-commerce/money-domain.js';

export type {
  LocalCommerceSimulationEvidence,
  LocalCommerceSimulationEvent as LocalCommerceSimulatorEvent,
  LocalCommerceSimulationScenario,
  PaymentSimulationScenario,
  RefundSimulationScenario,
  SettlementSimulationScenario,
  SimulationRuntimeEnvironment,
  WithdrawalSimulationScenario,
} from '../../../applications/paid-commerce/local-commerce-simulation-port.js';

const defaultScenario: LocalCommerceSimulationScenario = Object.freeze({
  payment: 'success',
  settlement: 'immediate',
  withdrawal: 'success',
  refund: 'after_settlement',
});

export class LocalCommerceSimulator implements ProviderPort, LocalCommerceSimulationPort {
  public readonly providerId = 'local_commerce_simulator';

  private readonly operations = new Map<string, ProviderOperation>();
  private readonly events = new Map<string, LocalCommerceSimulationEvent>();
  private readonly pendingEventIds: string[] = [];
  private readonly delayedOperations = new Map<string, ProviderFactKind>();
  private sequence = 0;
  private eventCount = 0;
  private scenario = defaultScenario;

  public constructor(
    private readonly environment: SimulationRuntimeEnvironment,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  public configureScenario(scenario: Partial<LocalCommerceSimulationScenario>): void {
    this.scenario = Object.freeze({ ...this.scenario, ...scenario });
  }

  public getScenario(): LocalCommerceSimulationScenario {
    return this.scenario;
  }

  public getEvidence(): LocalCommerceSimulationEvidence {
    return Object.freeze({
      origin: 'simulation',
      providerId: this.providerId,
      environment: this.environment,
      scenario: this.scenario,
    });
  }

  public createPaymentIntent(request: ProviderOperationRequest): Promise<ProviderOperation> {
    return Promise.resolve(this.createOperation('payment', request));
  }

  public getPaymentStatus(providerReference: string): Promise<ProviderOperationStatus> {
    return Promise.resolve(this.getOperationStatus(providerReference));
  }

  public verifyPaymentFact(
    request: ProviderEventVerificationRequest,
  ): Promise<ProviderFactVerificationResult> {
    return Promise.resolve(this.verifyFact(request, 'payment'));
  }

  public createSettlement(request: ProviderOperationRequest): Promise<ProviderOperation> {
    return Promise.resolve(this.createOperation('settlement', request));
  }

  public getSettlementStatus(providerReference: string): Promise<ProviderOperationStatus> {
    return Promise.resolve(this.getOperationStatus(providerReference));
  }

  public verifySettlementFact(
    request: ProviderEventVerificationRequest,
  ): Promise<ProviderFactVerificationResult> {
    return Promise.resolve(this.verifyFact(request, 'settlement'));
  }

  public createWithdrawalIntent(request: ProviderOperationRequest): Promise<ProviderOperation> {
    return Promise.resolve(this.createOperation('withdrawal', request));
  }

  public getWithdrawalStatus(providerReference: string): Promise<ProviderOperationStatus> {
    return Promise.resolve(this.getOperationStatus(providerReference));
  }

  public verifyWithdrawalFact(
    request: ProviderEventVerificationRequest,
  ): Promise<ProviderFactVerificationResult> {
    return Promise.resolve(this.verifyFact(request, 'withdrawal'));
  }

  public takeEvents(): readonly LocalCommerceSimulationEvent[] {
    const events = this.pendingEventIds
      .splice(0)
      .map((eventId) => this.events.get(eventId))
      .filter((event): event is LocalCommerceSimulationEvent => event !== undefined);
    return events;
  }

  public listUndeliveredEvents(): readonly LocalCommerceSimulationEvent[] {
    return this.pendingEventIds
      .map((eventId) => this.events.get(eventId))
      .filter((event): event is LocalCommerceSimulationEvent => event !== undefined);
  }

  public advance(providerReference: string): void {
    const kind = this.delayedOperations.get(providerReference);
    const operation = this.operations.get(providerReference);
    if (kind === undefined || operation === undefined) {
      throw new Error('Simulation operation is not awaiting advancement.');
    }
    this.delayedOperations.delete(providerReference);
    this.recordEvent(operation, kind);
  }

  public recordRefundSucceeded(input: {
    readonly providerReference: string;
    readonly internalReference: string;
    readonly amountMinor: MoneyMinor;
    readonly currency: Currency;
  }): LocalCommerceSimulationEvent {
    if (this.scenario.refund === 'failed_refund') {
      throw new Error('Simulation refund failed; no RefundSucceeded fact was produced.');
    }
    const existing = [...this.events.values()].find(
      (event) =>
        event.kind === 'RefundSucceeded' && event.providerReference === input.providerReference,
    );
    if (existing !== undefined) {
      if (
        existing.internalReference !== input.internalReference ||
        existing.amountMinor !== input.amountMinor ||
        existing.currency !== input.currency
      ) {
        throw new Error('Simulation refund replay conflicts with the original Refund fact.');
      }
      this.pendingEventIds.push(existing.providerEventId);
      return existing;
    }
    return this.recordStandaloneEvent({
      ...input,
      kind: 'RefundSucceeded',
      resourceType: 'payment',
    });
  }

  private createOperation(
    resourceType: ProviderFactResourceType,
    request: ProviderOperationRequest,
  ): ProviderOperation {
    assertOperationRequest(request);
    const providerReference = `${this.providerId}:${resourceType}:${request.idempotencyKey}`;
    const existing = this.operations.get(providerReference);
    if (existing !== undefined) {
      return existing;
    }

    const operation = Object.freeze({
      providerId: this.providerId,
      providerReference,
      internalReference: request.internalReference.trim(),
      status: 'pending' as const,
    });
    this.operations.set(providerReference, operation);
    this.operationAmounts.set(providerReference, request.amountMinor);
    this.operationCurrencies.set(providerReference, request.currency);
    this.scheduleOperationEvent(operation, resourceType, request);
    return this.operations.get(providerReference) ?? operation;
  }

  private scheduleOperationEvent(
    operation: ProviderOperation,
    resourceType: ProviderFactResourceType,
    request: ProviderOperationRequest,
  ): void {
    const scenario = this.scenarioFor(resourceType);
    const succeededKind = successKind(resourceType);
    if (scenario === 'delayed') {
      this.delayedOperations.set(operation.providerReference, succeededKind);
      return;
    }
    if (scenario === 'failed' || scenario === 'expired') {
      if (resourceType === 'settlement') {
        this.markOperationFailed(operation);
        return;
      }
      this.recordEvent(operation, failureKind(resourceType), request);
      return;
    }
    if (scenario === 'conflicting_terminal_event') {
      if (resourceType === 'settlement') {
        this.recordEvent(operation, succeededKind, request);
        this.markOperationFailed(operation);
        return;
      }
      this.recordEvent(operation, succeededKind, request);
      this.recordEvent(operation, failureKind(resourceType), request);
      return;
    }
    if (scenario === 'out_of_order_event') {
      this.recordEvent(operation, succeededKind, request, 2);
      this.recordEvent(operation, succeededKind, request, 1);
      return;
    }

    const event = this.recordEvent(operation, succeededKind, request);
    if (scenario === 'duplicate_event' || scenario === 'duplicate') {
      this.recordEvent(operation, succeededKind, request, event.sequence);
    }
  }

  private scenarioFor(
    resourceType: ProviderFactResourceType,
  ): PaymentSimulationScenario | SettlementSimulationScenario | WithdrawalSimulationScenario {
    switch (resourceType) {
      case 'payment':
        return this.scenario.payment;
      case 'settlement':
        return this.scenario.settlement;
      case 'withdrawal':
        return this.scenario.withdrawal;
    }
  }

  private recordEvent(
    operation: ProviderOperation,
    kind: ProviderFactKind,
    request?: ProviderOperationRequest,
    sequence?: number,
  ): LocalCommerceSimulationEvent {
    const amountMinor = request?.amountMinor ?? this.operationAmount(operation.providerReference);
    const currency = request?.currency ?? this.operationCurrency(operation.providerReference);
    return this.recordStandaloneEvent({
      providerReference: operation.providerReference,
      internalReference: operation.internalReference,
      amountMinor,
      currency,
      kind,
      resourceType: resourceTypeForKind(kind),
      ...(sequence === undefined ? {} : { sequence }),
    });
  }

  private readonly operationAmounts = new Map<string, MoneyMinor>();
  private readonly operationCurrencies = new Map<string, Currency>();

  private operationAmount(providerReference: string): MoneyMinor {
    const amount = this.operationAmounts.get(providerReference);
    if (amount === undefined) {
      throw new Error('Simulation operation amount is missing.');
    }
    return amount;
  }

  private operationCurrency(providerReference: string): Currency {
    const currency = this.operationCurrencies.get(providerReference);
    if (currency === undefined) {
      throw new Error('Simulation operation currency is missing.');
    }
    return currency;
  }

  private recordStandaloneEvent(input: {
    readonly providerReference: string;
    readonly internalReference: string;
    readonly amountMinor: MoneyMinor;
    readonly currency: Currency;
    readonly kind: ProviderFactKind;
    readonly resourceType: ProviderFactResourceType;
    readonly sequence?: number;
  }): LocalCommerceSimulationEvent {
    const event = Object.freeze({
      providerEventId: `${this.providerId}:event:${++this.eventCount}`,
      providerReference: input.providerReference,
      kind: input.kind,
      resourceType: input.resourceType,
      internalReference: input.internalReference,
      amountMinor: input.amountMinor,
      currency: input.currency,
      sequence: input.sequence ?? ++this.sequence,
      occurredAt: this.now(),
      evidence: this.getEvidence(),
    });
    this.events.set(event.providerEventId, event);
    this.pendingEventIds.push(event.providerEventId);
    const operation = this.operations.get(event.providerReference);
    if (operation !== undefined) {
      this.operations.set(
        event.providerReference,
        Object.freeze({
          ...operation,
          status: event.kind.endsWith('Succeeded') ? 'succeeded' : 'failed',
        }),
      );
    }
    return event;
  }

  private getOperationStatus(providerReference: string): ProviderOperationStatus {
    return this.operations.get(providerReference)?.status ?? 'failed';
  }

  private markOperationFailed(operation: ProviderOperation): void {
    this.operations.set(
      operation.providerReference,
      Object.freeze({
        ...operation,
        status: 'failed',
      }),
    );
  }

  private verifyFact(
    request: ProviderEventVerificationRequest,
    expectedResourceType: ProviderFactResourceType,
  ): ProviderFactVerificationResult {
    const event = this.events.get(request.providerEventId);
    if (event === undefined) {
      return {
        verification: 'rejected',
        providerId: this.providerId,
        providerEventId: request.providerEventId,
        reason: 'unknown_event',
      };
    }
    if (event.resourceType !== expectedResourceType) {
      return {
        verification: 'rejected',
        providerId: this.providerId,
        providerEventId: request.providerEventId,
        reason: 'invalid_event',
      };
    }
    return Object.freeze({
      verification: 'verified' as const,
      providerId: this.providerId,
      providerEventId: event.providerEventId,
      providerReference: event.providerReference,
      kind: event.kind,
      resourceType: event.resourceType,
      internalReference: event.internalReference,
      amountMinor: event.amountMinor,
      currency: event.currency,
      sequence: event.sequence,
      occurredAt: event.occurredAt,
    });
  }
}

function assertOperationRequest(request: ProviderOperationRequest): void {
  if (
    request.internalReference.trim().length === 0 ||
    request.idempotencyKey.trim().length === 0 ||
    request.amountMinor <= 0n
  ) {
    throw new Error('Local Commerce Simulator operation request is invalid.');
  }
}

function successKind(resourceType: ProviderFactResourceType): ProviderFactKind {
  switch (resourceType) {
    case 'payment':
      return 'PaymentSucceeded';
    case 'settlement':
      return 'SettlementSucceeded';
    case 'withdrawal':
      return 'WithdrawalSucceeded';
  }
}

function failureKind(resourceType: ProviderFactResourceType): ProviderFactKind {
  switch (resourceType) {
    case 'payment':
      return 'PaymentFailed';
    case 'settlement':
      return 'SettlementSucceeded';
    case 'withdrawal':
      return 'WithdrawalFailed';
  }
}

function resourceTypeForKind(kind: ProviderFactKind): ProviderFactResourceType {
  switch (kind) {
    case 'PaymentSucceeded':
    case 'PaymentFailed':
    case 'RefundSucceeded':
      return 'payment';
    case 'SettlementSucceeded':
      return 'settlement';
    case 'WithdrawalSucceeded':
    case 'WithdrawalFailed':
      return 'withdrawal';
  }
}
