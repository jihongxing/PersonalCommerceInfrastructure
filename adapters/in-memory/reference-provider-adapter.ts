import type {
  ProviderEventVerificationRequest,
  ProviderFactKind,
  ProviderFactResourceType,
  ProviderFactVerificationResult,
  ProviderOperation,
  ProviderOperationRequest,
  ProviderOperationStatus,
  ProviderPort,
} from '../../applications/paid-commerce/provider-ports.js';
import type { Currency, MoneyMinor } from '../../modules/paid-commerce/money-domain.js';

export interface ReferenceProviderEvent {
  readonly providerEventId: string;
  readonly providerReference: string;
  readonly kind: ProviderFactKind;
  readonly resourceType: ProviderFactResourceType;
  readonly internalReference: string;
  readonly amountMinor: MoneyMinor;
  readonly currency: Currency;
  readonly sequence: number;
  readonly occurredAt: string;
}

export class ReferenceProviderAdapter implements ProviderPort {
  public readonly providerId = 'reference_provider';

  private readonly operations = new Map<string, ProviderOperation>();
  private readonly events = new Map<string, ReferenceProviderEvent>();

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

  public recordEvent(event: ReferenceProviderEvent): void {
    this.events.set(
      event.providerEventId,
      Object.freeze({
        providerEventId: event.providerEventId,
        providerReference: event.providerReference,
        kind: event.kind,
        resourceType: event.resourceType,
        internalReference: event.internalReference,
        amountMinor: event.amountMinor,
        currency: event.currency,
        sequence: event.sequence,
        occurredAt: event.occurredAt,
      }),
    );
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
      internalReference: request.internalReference,
      status: 'pending' as const,
    });
    this.operations.set(providerReference, operation);
    return operation;
  }

  private getOperationStatus(providerReference: string): ProviderOperationStatus {
    return this.operations.get(providerReference)?.status ?? 'failed';
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
    throw new Error('Reference Provider operation request is invalid.');
  }
}
