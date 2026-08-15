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
import { WeChatPayProviderAdapterError } from './wechat-pay-provider-error.js';
import type {
  WeChatPaySandboxEvent,
  WeChatPaySandboxEventType,
  WeChatPaySandboxOperationStatus,
  WeChatPaySandboxTransport,
} from './wechat-pay-sandbox-transport.js';

export class WeChatPayProviderAdapter implements ProviderPort {
  public readonly providerId = 'wechat_pay_platform_collection_and_disbursement';

  public constructor(private readonly sandboxTransport: WeChatPaySandboxTransport) {}

  public async createPaymentIntent(request: ProviderOperationRequest): Promise<ProviderOperation> {
    return this.createOperation('payment', request);
  }

  public async getPaymentStatus(providerReference: string): Promise<ProviderOperationStatus> {
    return this.getOperationStatus(providerReference);
  }

  public async verifyPaymentFact(
    request: ProviderEventVerificationRequest,
  ): Promise<ProviderFactVerificationResult> {
    return this.verifyFact(request, 'payment');
  }

  public async createSettlement(request: ProviderOperationRequest): Promise<ProviderOperation> {
    return this.createOperation('settlement', request);
  }

  public async getSettlementStatus(providerReference: string): Promise<ProviderOperationStatus> {
    return this.getOperationStatus(providerReference);
  }

  public async verifySettlementFact(
    request: ProviderEventVerificationRequest,
  ): Promise<ProviderFactVerificationResult> {
    return this.verifyFact(request, 'settlement');
  }

  public async createWithdrawalIntent(
    request: ProviderOperationRequest,
  ): Promise<ProviderOperation> {
    return this.createOperation('withdrawal', request);
  }

  public async getWithdrawalStatus(providerReference: string): Promise<ProviderOperationStatus> {
    return this.getOperationStatus(providerReference);
  }

  public async verifyWithdrawalFact(
    request: ProviderEventVerificationRequest,
  ): Promise<ProviderFactVerificationResult> {
    return this.verifyFact(request, 'withdrawal');
  }

  private async createOperation(
    operationType: ProviderFactResourceType,
    request: ProviderOperationRequest,
  ): Promise<ProviderOperation> {
    try {
      const response = await this.sandboxTransport.submit({
        operationType,
        internalReference: request.internalReference,
        amountMinor: request.amountMinor,
        currency: request.currency,
        idempotencyKey: request.idempotencyKey,
      });
      return Object.freeze({
        providerId: this.providerId,
        providerReference: response.providerReference,
        internalReference: response.internalReference,
        status: toProviderOperationStatus(response.status),
      });
    } catch {
      throw new WeChatPayProviderAdapterError(
        'wechat_pay_sandbox_operation_rejected',
        'WeChat Pay test operation could not be created.',
      );
    }
  }

  private async getOperationStatus(providerReference: string): Promise<ProviderOperationStatus> {
    try {
      return toProviderOperationStatus(await this.sandboxTransport.getStatus(providerReference));
    } catch {
      throw new WeChatPayProviderAdapterError(
        'wechat_pay_sandbox_operation_rejected',
        'WeChat Pay test operation status could not be retrieved.',
      );
    }
  }

  private async verifyFact(
    request: ProviderEventVerificationRequest,
    expectedResourceType: ProviderFactResourceType,
  ): Promise<ProviderFactVerificationResult> {
    try {
      const verification = await this.sandboxTransport.verifyEvent({
        eventId: request.providerEventId,
      });
      if (verification.verification === 'rejected') {
        return {
          verification: 'rejected',
          providerId: this.providerId,
          providerEventId: request.providerEventId,
          reason: verification.reason,
        };
      }
      if (verification.event.operationType !== expectedResourceType) {
        return {
          verification: 'rejected',
          providerId: this.providerId,
          providerEventId: request.providerEventId,
          reason: 'invalid_event',
        };
      }
      return mapVerifiedEvent(this.providerId, verification.event);
    } catch (error) {
      if (error instanceof WeChatPayProviderAdapterError) {
        throw error;
      }
      throw new WeChatPayProviderAdapterError(
        'wechat_pay_sandbox_event_rejected',
        'WeChat Pay test event could not be verified.',
      );
    }
  }
}

function mapVerifiedEvent(
  providerId: string,
  event: WeChatPaySandboxEvent,
): ProviderFactVerificationResult {
  const fact = mapEventType(event.eventType);
  if (fact === undefined) {
    throw new WeChatPayProviderAdapterError(
      'wechat_pay_sandbox_event_mapping_rejected',
      'WeChat Pay test event could not be mapped to a Provider Fact.',
    );
  }
  return Object.freeze({
    verification: 'verified' as const,
    providerId,
    providerEventId: event.eventId,
    providerReference: event.providerReference,
    kind: fact.kind,
    resourceType: fact.resourceType,
    internalReference: event.internalReference,
    amountMinor: event.amountMinor,
    currency: event.currency,
    sequence: event.sequence,
    occurredAt: event.occurredAt,
  });
}

function mapEventType(
  eventType: WeChatPaySandboxEventType,
):
  { readonly kind: ProviderFactKind; readonly resourceType: ProviderFactResourceType } | undefined {
  switch (eventType) {
    case 'payment_succeeded':
      return { kind: 'PaymentSucceeded', resourceType: 'payment' };
    case 'payment_failed':
      return { kind: 'PaymentFailed', resourceType: 'payment' };
    case 'refund_succeeded':
      return { kind: 'RefundSucceeded', resourceType: 'payment' };
    case 'settlement_succeeded':
      return { kind: 'SettlementSucceeded', resourceType: 'settlement' };
    case 'withdrawal_succeeded':
      return { kind: 'WithdrawalSucceeded', resourceType: 'withdrawal' };
    case 'withdrawal_failed':
      return { kind: 'WithdrawalFailed', resourceType: 'withdrawal' };
  }
}

function toProviderOperationStatus(
  status: WeChatPaySandboxOperationStatus,
): ProviderOperationStatus {
  return status;
}
