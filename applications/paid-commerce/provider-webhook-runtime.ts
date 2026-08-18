import { createHash } from 'node:crypto';

import type { ActorContext } from '../core/actor-context.js';
import { ApplicationError } from '../core/application-error.js';
import type {
  ProcessVerifiedProviderFactCommand,
  ProviderFactApplicationPolicy,
} from './provider-fact-application-policy.js';
import type { RealMoneyActivationGuard } from './real-money-activation-guard.js';

export interface ProviderWebhookRequest {
  readonly providerId: string;
  readonly providerEventId: string;
  readonly headers: Readonly<Record<string, string | undefined>>;
  readonly payload: Uint8Array;
  readonly receivedAt: string;
}

export type ProviderWebhookSignatureVerification =
  | { readonly verification: 'verified' }
  | { readonly verification: 'rejected'; readonly reason: 'invalid_signature' | 'unconfigured' };

export interface ProviderWebhookSignatureVerifier {
  verify(request: ProviderWebhookRequest): Promise<ProviderWebhookSignatureVerification>;
}

export interface ProviderEventNormalizer {
  normalize(request: ProviderWebhookRequest): Promise<ProcessVerifiedProviderFactCommand>;
}

export interface ProviderWebhookReceipt {
  readonly providerId: string;
  readonly providerEventId: string;
  readonly payloadSha256: string;
  readonly receivedAt: string;
}

export type ProviderWebhookReceiptDecision =
  | { readonly status: 'accepted' | 'retry' | 'idempotent' }
  | { readonly status: 'conflict'; readonly reason: string };

export interface ProviderWebhookReceiptStore {
  begin(receipt: ProviderWebhookReceipt): Promise<ProviderWebhookReceiptDecision>;
  markProcessed(providerId: string, providerEventId: string): Promise<void>;
}

export interface ProviderWebhookProcessResult {
  readonly status: 'accepted' | 'idempotent';
  readonly transitioned: boolean;
}

export class ProviderWebhookRuntime {
  public constructor(
    private readonly dependencies: {
      readonly signatureVerifier: ProviderWebhookSignatureVerifier;
      readonly normalizer: ProviderEventNormalizer;
      readonly receiptStore: ProviderWebhookReceiptStore;
      readonly applicationPolicy: ProviderFactApplicationPolicy;
      readonly activationGuard?: RealMoneyActivationGuard;
    },
  ) {}

  public async process(
    request: ProviderWebhookRequest,
    context: ActorContext,
  ): Promise<ProviderWebhookProcessResult> {
    const verification = await this.dependencies.signatureVerifier.verify(request);
    if (verification.verification === 'rejected') {
      throw new ApplicationError({
        category: 'authentication',
        code: 'provider_webhook_signature_rejected',
        message: 'Provider webhook signature verification failed.',
      });
    }

    const command = await this.dependencies.normalizer.normalize(request);
    const { fact } = command;
    if (
      fact.providerId !== request.providerId ||
      fact.providerEventId !== request.providerEventId
    ) {
      throw new ApplicationError({
        category: 'conflict',
        code: 'provider_webhook_identity_conflict',
        message: 'Provider webhook identity conflicts with the normalized Provider Fact.',
      });
    }
    this.dependencies.activationGuard?.assertLiveOperationAllowed(fact.resourceType);

    const receipt = await this.dependencies.receiptStore.begin({
      providerId: request.providerId,
      providerEventId: request.providerEventId,
      payloadSha256: createHash('sha256').update(request.payload).digest('hex'),
      receivedAt: request.receivedAt,
    });
    if (receipt.status === 'conflict') {
      throw new ApplicationError({
        category: 'conflict',
        code: 'provider_webhook_conflict',
        message: 'Provider webhook event conflicts with accepted evidence.',
      });
    }
    if (receipt.status === 'idempotent') {
      return { status: 'idempotent', transitioned: false };
    }

    const processed = await this.dependencies.applicationPolicy.process(command, context);
    if (processed.receipt.status === 'conflict' || processed.receipt.status === 'stale') {
      throw new ApplicationError({
        category: 'conflict',
        code: 'provider_fact_rejected',
        message: 'Provider Fact conflicts with accepted evidence.',
      });
    }
    await this.dependencies.receiptStore.markProcessed(request.providerId, request.providerEventId);
    return {
      status: processed.receipt.status === 'idempotent' ? 'idempotent' : 'accepted',
      transitioned: processed.transitioned,
    };
  }
}

export class RejectingProviderWebhookSignatureVerifier implements ProviderWebhookSignatureVerifier {
  public verify(): Promise<ProviderWebhookSignatureVerification> {
    return Promise.resolve({ verification: 'rejected', reason: 'unconfigured' });
  }
}

export class RejectingProviderEventNormalizer implements ProviderEventNormalizer {
  public normalize(): Promise<ProcessVerifiedProviderFactCommand> {
    return Promise.reject(
      new ApplicationError({
        category: 'unavailable',
        code: 'provider_event_normalizer_unconfigured',
        message: 'Provider event normalization is not configured.',
      }),
    );
  }
}
