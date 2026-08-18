import type { ActorContext } from '../core/actor-context.js';
import type { OperationsActionExecutor } from './commercial-pilot-operations.js';
import type { LocalCommerceSimulationService } from './local-commerce-simulation-service.js';
import type { PaidCommerceRepository } from './paid-commerce-repositories.js';
import type { PaidCommerceService } from './paid-commerce-service.js';

const feeProfile = Object.freeze({
  classification: 'simulation_configuration' as const,
  version: 'simulation-cny-v1',
  providerFeeMinor: 240n,
  platformFeeMinor: 3990n,
  deductionsMinor: 0n,
});

export class LocalCommercialPilotOperationsActionExecutor implements OperationsActionExecutor {
  public constructor(
    private readonly dependencies: {
      readonly repository: PaidCommerceRepository;
      readonly paidCommerceService: PaidCommerceService;
      readonly simulationService: LocalCommerceSimulationService;
    },
  ) {}

  public async retrySettlement(orderId: string, context: ActorContext): Promise<void> {
    const settlement = await this.dependencies.repository.findSettlementByOrderId(orderId);
    if (settlement?.state !== 'failed') {
      throw new Error('Settlement retry requires a failed Settlement.');
    }
    this.dependencies.simulationService.configureScenario({ settlement: 'immediate' }, context);
    await this.dependencies.simulationService.createSettlement(
      {
        internalReference: orderId,
        amountMinor: settlement.creatorNet.minor,
        currency: settlement.creatorNet.currency,
        idempotencyKey: `operations-retry-settlement:${settlement.id}:${context.correlationId}`,
      },
      feeProfile,
      context,
    );
  }

  public async retryWithdrawal(withdrawalId: string, context: ActorContext): Promise<void> {
    const withdrawal = await this.dependencies.repository.findWithdrawalById(withdrawalId);
    if (withdrawal?.state !== 'failed') {
      throw new Error('Withdrawal retry requires a failed Withdrawal.');
    }
    await this.dependencies.paidCommerceService.retryWithdrawal(
      { withdrawalId },
      {
        actor: { kind: 'creator', creatorId: withdrawal.creatorId },
        correlationId: context.correlationId,
      },
    );
    this.dependencies.simulationService.configureScenario({ withdrawal: 'success' }, context);
    await this.dependencies.simulationService.createWithdrawal(
      {
        internalReference: withdrawal.id,
        amountMinor: withdrawal.amount.minor,
        currency: withdrawal.amount.currency,
        idempotencyKey: `operations-retry-withdrawal:${withdrawal.id}:${context.correlationId}`,
      },
      context,
    );
  }
}
