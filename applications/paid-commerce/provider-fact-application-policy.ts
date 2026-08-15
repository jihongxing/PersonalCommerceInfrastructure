import type { ActorContext } from '../core/actor-context.js';
import type { PaidCommerceRepository } from './paid-commerce-repositories.js';
import type { PaidCommerceService } from './paid-commerce-service.js';
import type {
  ProviderFactReceiptDecision,
  ProviderFactReceiptGuard,
} from './provider-fact-receipt-guard.js';
import type { VerifiedProviderFact } from './provider-ports.js';

export interface ProcessVerifiedProviderFactCommand {
  readonly fact: VerifiedProviderFact;
  readonly settlement?: {
    readonly providerFeeMinor: bigint;
    readonly platformFeeMinor: bigint;
    readonly deductionsMinor?: bigint;
    readonly calculationVersion: string;
  };
}

export interface ProviderFactApplicationPolicyDependencies {
  readonly paidCommerceService: PaidCommerceService;
  readonly paidCommerceRepository: PaidCommerceRepository;
  readonly receiptGuard: ProviderFactReceiptGuard;
}

export interface ProcessedProviderFact {
  readonly receipt: ProviderFactReceiptDecision;
  readonly transitioned: boolean;
}

export class ProviderFactApplicationPolicy {
  public constructor(private readonly dependencies: ProviderFactApplicationPolicyDependencies) {}

  public async process(
    command: ProcessVerifiedProviderFactCommand,
    context: ActorContext,
  ): Promise<ProcessedProviderFact> {
    assertPilotOperations(context);
    assertProviderFactSafe(command.fact);

    if (command.fact.kind === 'RefundSucceeded') {
      return {
        receipt: {
          status: 'conflict',
          reason: 'refund_fact_requires_a_separately_approved_refund_or_reversal_flow',
        },
        transitioned: false,
      };
    }

    const receipt = await this.dependencies.receiptGuard.inspect(command.fact);
    if (receipt.status !== 'accepted') {
      return { receipt, transitioned: false };
    }

    const evidenceReference = toEvidenceReference(command.fact);
    switch (command.fact.kind) {
      case 'PaymentSucceeded':
        await this.assertOrderAmount(command.fact);
        await this.dependencies.paidCommerceService.recordControlledPayment(
          {
            orderId: command.fact.internalReference,
            controlledEvidenceReference: evidenceReference,
          },
          context,
        );
        await this.dependencies.receiptGuard.recordAccepted(command.fact);
        return { receipt, transitioned: true };
      case 'PaymentFailed':
        await this.assertOrderAmount(command.fact);
        await this.dependencies.paidCommerceService.recordControlledPaymentFailure(
          {
            orderId: command.fact.internalReference,
            controlledEvidenceReference: evidenceReference,
          },
          context,
        );
        await this.dependencies.receiptGuard.recordAccepted(command.fact);
        return { receipt, transitioned: true };
      case 'SettlementSucceeded':
        if (command.settlement === undefined) {
          return {
            receipt: {
              status: 'conflict',
              reason: 'settlement_fact_requires_a_frozen_internal_calculation',
            },
            transitioned: false,
          };
        }
        await this.assertSettlementAmount(command.fact, command.settlement);
        await this.dependencies.paidCommerceService.releaseControlledSettlement(
          {
            orderId: command.fact.internalReference,
            ...command.settlement,
            controlledEvidenceReference: evidenceReference,
          },
          context,
        );
        await this.dependencies.receiptGuard.recordAccepted(command.fact);
        return { receipt, transitioned: true };
      case 'WithdrawalSucceeded':
        await this.assertWithdrawalAmount(command.fact);
        await this.dependencies.paidCommerceService.completeControlledWithdrawal(
          {
            withdrawalId: command.fact.internalReference,
            controlledEvidenceReference: evidenceReference,
          },
          context,
        );
        await this.dependencies.receiptGuard.recordAccepted(command.fact);
        return { receipt, transitioned: true };
      case 'WithdrawalFailed':
        await this.assertWithdrawalAmount(command.fact);
        await this.dependencies.paidCommerceService.failControlledWithdrawal(
          {
            withdrawalId: command.fact.internalReference,
            controlledEvidenceReference: evidenceReference,
          },
          context,
        );
        await this.dependencies.receiptGuard.recordAccepted(command.fact);
        return { receipt, transitioned: true };
    }
  }

  private async assertOrderAmount(fact: VerifiedProviderFact): Promise<void> {
    if (fact.resourceType !== 'payment') {
      throw new Error('Payment fact resource type must be payment.');
    }
    const order = await this.dependencies.paidCommerceRepository.findOrderById(
      fact.internalReference,
    );
    if (
      order === undefined ||
      order.snapshot.grossPrice.currency !== fact.currency ||
      order.snapshot.grossPrice.minor !== fact.amountMinor
    ) {
      throw new Error('Provider Payment Fact amount or currency does not match the Order.');
    }
  }

  private async assertSettlementAmount(
    fact: VerifiedProviderFact,
    settlement: NonNullable<ProcessVerifiedProviderFactCommand['settlement']>,
  ): Promise<void> {
    if (fact.resourceType !== 'settlement') {
      throw new Error('Settlement fact resource type must be settlement.');
    }
    const order = await this.dependencies.paidCommerceRepository.findOrderById(
      fact.internalReference,
    );
    if (order === undefined || order.snapshot.grossPrice.currency !== fact.currency) {
      throw new Error('Provider Settlement Fact currency does not match the Order.');
    }
    const deductions = settlement.deductionsMinor ?? 0n;
    const expectedNet =
      order.snapshot.grossPrice.minor -
      settlement.providerFeeMinor -
      settlement.platformFeeMinor -
      deductions;
    if (expectedNet < 0n || expectedNet !== fact.amountMinor) {
      throw new Error('Provider Settlement Fact amount does not match the frozen calculation.');
    }
  }

  private async assertWithdrawalAmount(fact: VerifiedProviderFact): Promise<void> {
    if (fact.resourceType !== 'withdrawal') {
      throw new Error('Withdrawal fact resource type must be withdrawal.');
    }
    const withdrawal = await this.dependencies.paidCommerceRepository.findWithdrawalById(
      fact.internalReference,
    );
    if (
      withdrawal === undefined ||
      withdrawal.amount.currency !== fact.currency ||
      withdrawal.amount.minor !== fact.amountMinor
    ) {
      throw new Error('Provider Withdrawal Fact amount or currency does not match the Withdrawal.');
    }
  }
}

function toEvidenceReference(fact: VerifiedProviderFact): string {
  return `provider:${fact.providerId}:event:${fact.providerEventId}`;
}

function assertPilotOperations(context: ActorContext): asserts context is ActorContext & {
  readonly actor: { readonly kind: 'pilot_operations'; readonly operatorId: string };
} {
  if (context.actor.kind !== 'pilot_operations') {
    throw new Error('Verified Provider Facts require authorized Pilot Operations.');
  }
}

function assertProviderFactSafe(fact: VerifiedProviderFact): void {
  if (
    fact.providerId.trim().length === 0 ||
    fact.providerEventId.trim().length === 0 ||
    fact.providerReference.trim().length === 0 ||
    fact.internalReference.trim().length === 0 ||
    fact.amountMinor < 0n ||
    !Number.isSafeInteger(fact.sequence) ||
    fact.sequence < 0 ||
    fact.occurredAt.trim().length === 0
  ) {
    throw new Error('Verified Provider Fact is invalid.');
  }
}
