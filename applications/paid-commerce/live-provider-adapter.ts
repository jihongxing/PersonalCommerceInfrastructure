import type { RealMoneyActivationGuard } from './real-money-activation-guard.js';
import type {
  ProviderEventVerificationRequest,
  ProviderFactVerificationResult,
  ProviderOperation,
  ProviderOperationRequest,
  ProviderOperationStatus,
  ProviderPort,
} from './provider-ports.js';

export class GuardedLiveProviderAdapter implements ProviderPort {
  public readonly providerId: string;

  public constructor(
    private readonly delegate: ProviderPort,
    private readonly activationGuard: RealMoneyActivationGuard,
  ) {
    this.providerId = delegate.providerId;
  }

  public createPaymentIntent(request: ProviderOperationRequest): Promise<ProviderOperation> {
    this.activationGuard.assertLiveOperationAllowed('payment');
    return this.delegate.createPaymentIntent(request);
  }

  public getPaymentStatus(providerReference: string): Promise<ProviderOperationStatus> {
    this.activationGuard.assertLiveOperationAllowed('payment');
    return this.delegate.getPaymentStatus(providerReference);
  }

  public verifyPaymentFact(
    request: ProviderEventVerificationRequest,
  ): Promise<ProviderFactVerificationResult> {
    this.activationGuard.assertLiveOperationAllowed('payment');
    return this.delegate.verifyPaymentFact(request);
  }

  public createSettlement(request: ProviderOperationRequest): Promise<ProviderOperation> {
    this.activationGuard.assertLiveOperationAllowed('settlement');
    return this.delegate.createSettlement(request);
  }

  public getSettlementStatus(providerReference: string): Promise<ProviderOperationStatus> {
    this.activationGuard.assertLiveOperationAllowed('settlement');
    return this.delegate.getSettlementStatus(providerReference);
  }

  public verifySettlementFact(
    request: ProviderEventVerificationRequest,
  ): Promise<ProviderFactVerificationResult> {
    this.activationGuard.assertLiveOperationAllowed('settlement');
    return this.delegate.verifySettlementFact(request);
  }

  public createWithdrawalIntent(request: ProviderOperationRequest): Promise<ProviderOperation> {
    this.activationGuard.assertLiveOperationAllowed('withdrawal');
    return this.delegate.createWithdrawalIntent(request);
  }

  public getWithdrawalStatus(providerReference: string): Promise<ProviderOperationStatus> {
    this.activationGuard.assertLiveOperationAllowed('withdrawal');
    return this.delegate.getWithdrawalStatus(providerReference);
  }

  public verifyWithdrawalFact(
    request: ProviderEventVerificationRequest,
  ): Promise<ProviderFactVerificationResult> {
    this.activationGuard.assertLiveOperationAllowed('withdrawal');
    return this.delegate.verifyWithdrawalFact(request);
  }
}
