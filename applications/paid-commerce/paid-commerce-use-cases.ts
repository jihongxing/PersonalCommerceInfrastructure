import {
  beginOrderPayment,
  completePaidServiceOrder,
  completeWithdrawal,
  confirmPayment,
  createPaidServiceOrder,
  createPayment,
  createPendingFulfillment,
  createSettlement,
  createWithdrawal,
  fulfillOrder,
  failPayment,
  failWithdrawal,
  markOrderPaid,
  money,
  pendingEarningsEntry,
  projectWallet,
  releaseSettlement,
  settlementReleasedEntry,
  withdrawalCompletedEntry,
  withdrawalFailedEntry,
  withdrawalReservedEntry,
  type PaidServiceOrder,
  type PaymentState,
  type WalletProjection,
  type Withdrawal,
} from '../../modules/paid-commerce/money-domain.js';
import { assertCreatorOwnership, assertCustomerOwnership } from '../../modules/shared/actors.js';
import { ApplicationError } from '../core/application-error.js';
import type { ActorContext } from '../core/actor-context.js';
import type { CanonicalEventRecorder } from '../core/canonical-event-recorder.js';
import type { Clock } from '../core/ports/clock.js';
import type { IdGenerator } from '../core/ports/id-generator.js';
import type { UnitOfWork } from '../core/ports/unit-of-work.js';
import type { CommerceActionRepository } from '../customer-request/customer-request-repositories.js';
import type { OfferingRepository } from '../service-offering/offering-repositories.js';
import type { PaidCommerceRepository } from './paid-commerce-repositories.js';

const controlledFactSource = 'controlled_test';

export interface PaidCommerceUseCaseDependencies {
  readonly commerceActionRepository: CommerceActionRepository;
  readonly offeringRepository: OfferingRepository;
  readonly paidCommerceRepository: PaidCommerceRepository;
  readonly idGenerator: IdGenerator;
  readonly clock: Clock;
  readonly canonicalEventRecorder: CanonicalEventRecorder;
  readonly unitOfWork: UnitOfWork;
}

export interface CreatePaidServiceOrderCommand {
  readonly commerceActionId: string;
  readonly grossPriceMinor: bigint;
  readonly serviceTerms: string;
}

export interface RecordControlledPaymentFactCommand {
  readonly orderId: string;
  readonly controlledEvidenceReference: string;
}

export interface RecordControlledPaymentFailureCommand {
  readonly orderId: string;
  readonly controlledEvidenceReference: string;
}

export interface RecordFulfillmentCommand {
  readonly orderId: string;
  readonly evidenceReference: string;
}

export interface ReleaseControlledSettlementCommand {
  readonly orderId: string;
  readonly providerFeeMinor: bigint;
  readonly platformFeeMinor: bigint;
  readonly deductionsMinor?: bigint;
  readonly calculationVersion: string;
  readonly controlledEvidenceReference: string;
}

export interface RequestWithdrawalCommand {
  readonly amountMinor: bigint;
  readonly destinationReference: string;
  readonly idempotencyKey: string;
}

export interface CompleteControlledWithdrawalCommand {
  readonly withdrawalId: string;
  readonly controlledEvidenceReference: string;
}

export interface FailControlledWithdrawalCommand {
  readonly withdrawalId: string;
  readonly controlledEvidenceReference: string;
}

export class CreatePaidServiceOrderUseCase {
  public constructor(private readonly dependencies: PaidCommerceUseCaseDependencies) {}

  public async execute(
    command: CreatePaidServiceOrderCommand,
    context: ActorContext,
  ): Promise<PaidServiceOrder> {
    return this.dependencies.unitOfWork.execute(async (scope) => {
      const commerceActionRepository =
        scope.commerceActionRepository ?? this.dependencies.commerceActionRepository;
      const paidCommerceRepository =
        scope.paidCommerceRepository ?? this.dependencies.paidCommerceRepository;
      const action = await commerceActionRepository.findById(command.commerceActionId);
      if (action === undefined) {
        throw notFound(
          'confirmed_commerce_action_not_found',
          'Confirmed Commerce Action was not found.',
        );
      }
      assertCreatorOwnership(context.actor, action.creatorId);
      if (action.state !== 'confirmed') {
        throw conflict(
          'order_requires_confirmed_commerce_action',
          'Order creation requires a confirmed Commerce Action.',
        );
      }

      const existing = await paidCommerceRepository.findOrderByCommerceActionId(action.id);
      if (existing !== undefined) {
        return existing;
      }

      const offering = await this.dependencies.offeringRepository.findById(action.offeringId);
      if (offering === undefined || offering.creatorId !== action.creatorId) {
        throw conflict(
          'order_offering_snapshot_unavailable',
          'Order creation requires the confirmed Offering snapshot source.',
        );
      }

      const order = createPaidServiceOrder({
        id: this.dependencies.idGenerator.generate(),
        commerceActionId: action.id,
        creatorId: action.creatorId,
        customerId: action.customerId,
        offeringId: offering.id,
        snapshot: {
          offeringTitle: offering.title,
          offeringDescription: offering.description,
          serviceTerms: command.serviceTerms,
          grossPrice: money('CNY', command.grossPriceMinor),
        },
      });
      const payableOrder = beginOrderPayment(order);
      const payment = createPayment({
        id: this.dependencies.idGenerator.generate(),
        order: payableOrder,
        correlationId: `order:${order.id}:payment-attempt`,
      });
      await paidCommerceRepository.saveOrder(payableOrder);
      await paidCommerceRepository.savePayment(payment);
      await this.dependencies.canonicalEventRecorder.record(
        {
          actorId: action.creatorId,
          correlationId: context.correlationId,
          name: 'order_created',
          objectId: payableOrder.id,
          source: 'creator',
          payload: {
            commerceActionId: action.id,
            currency: 'CNY',
            grossPriceMinor: String(command.grossPriceMinor),
          },
        },
        scope.productEventStore,
      );
      await this.dependencies.canonicalEventRecorder.record(
        {
          actorId: action.creatorId,
          correlationId: context.correlationId,
          name: 'payment_attempted',
          objectId: payment.id,
          source: 'system',
          payload: {
            orderId: payableOrder.id,
            currency: 'CNY',
            amountMinor: String(payment.amount.minor),
            source: controlledFactSource,
          },
        },
        scope.productEventStore,
      );
      return payableOrder;
    });
  }
}

export class BeginOrderPaymentUseCase {
  public constructor(private readonly dependencies: PaidCommerceUseCaseDependencies) {}

  public async execute(orderId: string, context: ActorContext) {
    return this.dependencies.unitOfWork.execute(async (scope) => {
      const paidCommerceRepository =
        scope.paidCommerceRepository ?? this.dependencies.paidCommerceRepository;
      const order = await requireOrder(paidCommerceRepository, orderId);
      assertCustomerOwnership(context.actor, order.customerId);

      const existing = await paidCommerceRepository.findPaymentByOrderId(order.id);
      if (existing !== undefined) {
        return existing;
      }

      const payment = createPayment({
        id: this.dependencies.idGenerator.generate(),
        order: beginOrderPayment(order),
        correlationId: context.correlationId,
      });
      await paidCommerceRepository.saveOrder(beginOrderPayment(order));
      await paidCommerceRepository.savePayment(payment);
      await this.dependencies.canonicalEventRecorder.record(
        {
          actorId: order.customerId,
          correlationId: context.correlationId,
          name: 'payment_attempted',
          objectId: payment.id,
          source: 'customer',
          payload: {
            orderId: order.id,
            currency: payment.amount.currency,
            amountMinor: String(payment.amount.minor),
          },
        },
        scope.productEventStore,
      );
      return payment;
    });
  }
}

export class RecordControlledPaymentFactUseCase {
  public constructor(private readonly dependencies: PaidCommerceUseCaseDependencies) {}

  public async execute(command: RecordControlledPaymentFactCommand, context: ActorContext) {
    assertControlledOperations(context);
    return this.dependencies.unitOfWork.execute(async (scope) => {
      const paidCommerceRepository =
        scope.paidCommerceRepository ?? this.dependencies.paidCommerceRepository;
      const order = await requireOrder(paidCommerceRepository, command.orderId);
      const payment = await paidCommerceRepository.findPaymentByOrderId(order.id);
      if (payment === undefined) {
        throw conflict(
          'payment_attempt_required',
          'Payment confirmation requires a Payment Attempt.',
        );
      }
      const evidenceReference = controlledReference(command.controlledEvidenceReference);
      if (payment.state === 'confirmed') {
        if (payment.providerReference !== evidenceReference) {
          throw conflict(
            'payment_fact_conflicts_with_confirmed_payment',
            'A different Payment fact cannot replace an existing confirmed Payment.',
          );
        }
        return { order, payment };
      }
      const confirmedPayment = confirmPayment(payment, evidenceReference);
      const paidOrder = markOrderPaid(order, confirmedPayment);
      await paidCommerceRepository.savePayment(confirmedPayment);
      await paidCommerceRepository.saveOrder(paidOrder);
      await this.dependencies.canonicalEventRecorder.record(
        {
          actorId: context.actor.operatorId,
          correlationId: context.correlationId,
          name: 'payment_confirmed',
          objectId: confirmedPayment.id,
          source: 'pilot_operations',
          payload: {
            orderId: order.id,
            evidenceReference: command.controlledEvidenceReference,
            source: controlledFactSource,
          },
        },
        scope.productEventStore,
      );
      return { order: paidOrder, payment: confirmedPayment };
    });
  }
}

export class RecordControlledPaymentFailureUseCase {
  public constructor(private readonly dependencies: PaidCommerceUseCaseDependencies) {}

  public async execute(command: RecordControlledPaymentFailureCommand, context: ActorContext) {
    assertControlledOperations(context);
    return this.dependencies.unitOfWork.execute(async (scope) => {
      const paidCommerceRepository =
        scope.paidCommerceRepository ?? this.dependencies.paidCommerceRepository;
      const order = await requireOrder(paidCommerceRepository, command.orderId);
      const payment = await paidCommerceRepository.findPaymentByOrderId(order.id);
      if (payment === undefined) {
        throw conflict('payment_attempt_required', 'Payment failure requires a Payment Attempt.');
      }
      controlledReference(command.controlledEvidenceReference);
      if (payment.state === 'failed') {
        return { order, payment };
      }
      const failedPayment = failPayment(payment);
      await paidCommerceRepository.savePayment(failedPayment);
      await this.dependencies.canonicalEventRecorder.record(
        {
          actorId: context.actor.operatorId,
          correlationId: context.correlationId,
          name: 'payment_failed',
          objectId: failedPayment.id,
          source: 'pilot_operations',
          payload: {
            orderId: order.id,
            evidenceReference: command.controlledEvidenceReference,
            source: controlledFactSource,
          },
        },
        scope.productEventStore,
      );
      return { order, payment: failedPayment };
    });
  }
}

export class RecordPaidServiceFulfillmentUseCase {
  public constructor(private readonly dependencies: PaidCommerceUseCaseDependencies) {}

  public async execute(command: RecordFulfillmentCommand, context: ActorContext) {
    return this.dependencies.unitOfWork.execute(async (scope) => {
      const paidCommerceRepository =
        scope.paidCommerceRepository ?? this.dependencies.paidCommerceRepository;
      const order = await requireOrder(paidCommerceRepository, command.orderId);
      assertCreatorOwnership(context.actor, order.creatorId);
      if (await paidCommerceRepository.findFulfillmentByOrderId(order.id)) {
        throw conflict(
          'fulfillment_already_recorded',
          'Fulfillment has already been recorded for this Order.',
        );
      }
      const pendingFulfillment = createPendingFulfillment({
        id: this.dependencies.idGenerator.generate(),
        order,
        creatorId: context.actor.creatorId,
        evidenceReference: command.evidenceReference,
      });
      const result = fulfillOrder(order, pendingFulfillment, this.dependencies.clock.now());
      await paidCommerceRepository.saveFulfillment(result.fulfillment);
      await paidCommerceRepository.saveOrder(result.order);
      await this.dependencies.canonicalEventRecorder.record(
        {
          actorId: context.actor.creatorId,
          correlationId: context.correlationId,
          name: 'fulfillment_recorded',
          objectId: result.fulfillment.id,
          source: 'creator',
          payload: { orderId: order.id, evidenceReference: command.evidenceReference },
        },
        scope.productEventStore,
      );
      return result;
    });
  }
}

export class ReleaseControlledSettlementUseCase {
  public constructor(private readonly dependencies: PaidCommerceUseCaseDependencies) {}

  public async execute(command: ReleaseControlledSettlementCommand, context: ActorContext) {
    assertControlledOperations(context);
    return this.dependencies.unitOfWork.execute(async (scope) => {
      const paidCommerceRepository =
        scope.paidCommerceRepository ?? this.dependencies.paidCommerceRepository;
      const order = await requireOrder(paidCommerceRepository, command.orderId);
      if (await paidCommerceRepository.findSettlementByOrderId(order.id)) {
        throw conflict(
          'settlement_already_recorded',
          'Settlement has already been recorded for this Order.',
        );
      }
      const payment = await paidCommerceRepository.findPaymentByOrderId(order.id);
      const fulfillment = await paidCommerceRepository.findFulfillmentByOrderId(order.id);
      if (payment === undefined || fulfillment === undefined) {
        throw conflict(
          'settlement_prerequisites_missing',
          'Settlement requires Payment and Fulfillment.',
        );
      }
      const settlement = createSettlement({
        id: this.dependencies.idGenerator.generate(),
        order,
        payment,
        fulfillment,
        providerFee: money('CNY', command.providerFeeMinor),
        platformFee: money('CNY', command.platformFeeMinor),
        deductions: money('CNY', command.deductionsMinor ?? 0n),
        calculationVersion: command.calculationVersion,
      });
      const releasedSettlement = releaseSettlement(settlement);
      const pendingEntry = pendingEarningsEntry({
        id: this.dependencies.idGenerator.generate(),
        settlement,
        effectiveAt: this.dependencies.clock.now(),
        correlationId: context.correlationId,
      });
      const releasedEntry = settlementReleasedEntry({
        id: this.dependencies.idGenerator.generate(),
        settlement: releasedSettlement,
        effectiveAt: this.dependencies.clock.now(),
        correlationId: context.correlationId,
      });
      const completedOrder = completePaidServiceOrder(order, releasedSettlement);
      await paidCommerceRepository.saveSettlement(releasedSettlement);
      await paidCommerceRepository.saveOrder(completedOrder);
      await paidCommerceRepository.appendLedgerEntry(pendingEntry);
      await paidCommerceRepository.appendLedgerEntry(releasedEntry);
      await this.dependencies.canonicalEventRecorder.record(
        {
          actorId: context.actor.operatorId,
          correlationId: context.correlationId,
          name: 'settlement_calculated',
          objectId: settlement.id,
          source: 'pilot_operations',
          payload: {
            orderId: order.id,
            creatorNetMinor: String(settlement.creatorNet.minor),
            source: controlledFactSource,
          },
        },
        scope.productEventStore,
      );
      await this.dependencies.canonicalEventRecorder.record(
        {
          actorId: context.actor.operatorId,
          correlationId: context.correlationId,
          name: 'settlement_released',
          objectId: releasedSettlement.id,
          source: 'pilot_operations',
          payload: {
            orderId: order.id,
            evidenceReference: command.controlledEvidenceReference,
            source: controlledFactSource,
          },
        },
        scope.productEventStore,
      );
      for (const entry of [pendingEntry, releasedEntry]) {
        await this.dependencies.canonicalEventRecorder.record(
          {
            actorId: context.actor.operatorId,
            correlationId: context.correlationId,
            name: 'ledger_entry_appended',
            objectId: entry.id,
            source: 'pilot_operations',
            payload: { orderId: order.id, entryType: entry.type },
          },
          scope.productEventStore,
        );
      }
      await this.dependencies.canonicalEventRecorder.record(
        {
          actorId: context.actor.operatorId,
          correlationId: context.correlationId,
          name: 'wallet_availability_changed',
          objectId: order.creatorId,
          source: 'pilot_operations',
          payload: {
            orderId: order.id,
            currency: 'CNY',
            availableMinor: String(releasedSettlement.creatorNet.minor),
          },
        },
        scope.productEventStore,
      );
      return { order: completedOrder, settlement: releasedSettlement };
    });
  }
}

export class GetCreatorWalletUseCase {
  public constructor(private readonly dependencies: PaidCommerceUseCaseDependencies) {}

  public async execute(context: ActorContext): Promise<WalletProjection> {
    if (context.actor.kind !== 'creator') {
      throw new ApplicationError({
        category: 'authorization',
        code: 'creator_wallet_requires_creator',
        message: 'Creator Wallet is only available to its owning Creator.',
      });
    }
    const entries = await this.dependencies.paidCommerceRepository.listLedgerEntriesByCreatorId(
      context.actor.creatorId,
    );
    return projectWallet('CNY', entries);
  }
}

export class ListCreatorPaidServiceOrdersUseCase {
  public constructor(private readonly dependencies: PaidCommerceUseCaseDependencies) {}

  public async execute(context: ActorContext): Promise<readonly PaidServiceOrder[]> {
    if (context.actor.kind !== 'creator') {
      throw new ApplicationError({
        category: 'authorization',
        code: 'creator_paid_orders_requires_creator',
        message: 'Paid Service Orders are only available to their owning Creator.',
      });
    }
    return this.dependencies.paidCommerceRepository.findOrdersByCreatorId(context.actor.creatorId);
  }
}

export interface PublicPaidServiceOrderStatus {
  readonly orderState: PaidServiceOrder['state'] | 'not_created';
  readonly paymentState: 'not_started' | PaymentState;
}

export class GetPublicPaidServiceOrderStatusUseCase {
  public constructor(private readonly dependencies: PaidCommerceUseCaseDependencies) {}

  public async execute(resultAccessToken: string): Promise<PublicPaidServiceOrderStatus> {
    const action =
      await this.dependencies.commerceActionRepository.findByResultAccessToken(resultAccessToken);
    if (action === undefined) {
      throw notFound('customer_request_not_found', 'Customer Request was not found.');
    }

    const order = await this.dependencies.paidCommerceRepository.findOrderByCommerceActionId(
      action.id,
    );
    if (order === undefined) {
      return { orderState: 'not_created', paymentState: 'not_started' };
    }

    const payment = await this.dependencies.paidCommerceRepository.findPaymentByOrderId(order.id);
    return {
      orderState: order.state,
      paymentState: payment?.state ?? 'not_started',
    };
  }
}

export class RequestCreatorWithdrawalUseCase {
  public constructor(private readonly dependencies: PaidCommerceUseCaseDependencies) {}

  public async execute(
    command: RequestWithdrawalCommand,
    context: ActorContext,
  ): Promise<Withdrawal> {
    if (context.actor.kind !== 'creator') {
      throw new ApplicationError({
        category: 'authorization',
        code: 'withdrawal_requires_creator',
        message: 'Withdrawal requires the owning Creator.',
      });
    }
    const creatorId = context.actor.creatorId;
    return this.dependencies.unitOfWork.execute(async (scope) => {
      const paidCommerceRepository =
        scope.paidCommerceRepository ?? this.dependencies.paidCommerceRepository;
      const existing = await paidCommerceRepository.findWithdrawalByCreatorAndIdempotencyKey(
        creatorId,
        command.idempotencyKey,
      );
      if (existing !== undefined) {
        return existing;
      }
      const entries = await paidCommerceRepository.listLedgerEntriesByCreatorId(creatorId);
      const wallet = projectWallet('CNY', entries);
      const withdrawal = createWithdrawal({
        id: this.dependencies.idGenerator.generate(),
        creatorId,
        amount: money('CNY', command.amountMinor),
        destinationReference: command.destinationReference,
        idempotencyKey: command.idempotencyKey,
        correlationId: context.correlationId,
        wallet,
      });
      const reserveEntry = withdrawalReservedEntry({
        id: this.dependencies.idGenerator.generate(),
        withdrawal,
        orderId: associatedOrderId(entries),
        effectiveAt: this.dependencies.clock.now(),
      });
      await paidCommerceRepository.saveWithdrawal(withdrawal);
      await paidCommerceRepository.appendLedgerEntry(reserveEntry);
      await this.dependencies.canonicalEventRecorder.record(
        {
          actorId: creatorId,
          correlationId: context.correlationId,
          name: 'withdrawal_requested',
          objectId: withdrawal.id,
          source: 'creator',
          payload: { currency: 'CNY', amountMinor: String(command.amountMinor) },
        },
        scope.productEventStore,
      );
      await this.dependencies.canonicalEventRecorder.record(
        {
          actorId: creatorId,
          correlationId: context.correlationId,
          name: 'ledger_entry_appended',
          objectId: reserveEntry.id,
          source: 'creator',
          payload: { withdrawalId: withdrawal.id, entryType: reserveEntry.type },
        },
        scope.productEventStore,
      );
      return withdrawal;
    });
  }
}

export class CompleteControlledWithdrawalUseCase {
  public constructor(private readonly dependencies: PaidCommerceUseCaseDependencies) {}

  public async execute(command: CompleteControlledWithdrawalCommand, context: ActorContext) {
    assertControlledOperations(context);
    return this.dependencies.unitOfWork.execute(async (scope) => {
      const paidCommerceRepository =
        scope.paidCommerceRepository ?? this.dependencies.paidCommerceRepository;
      const withdrawal = await paidCommerceRepository.findWithdrawalById(command.withdrawalId);
      if (withdrawal === undefined) {
        throw notFound('withdrawal_not_found', 'Withdrawal was not found.');
      }
      const evidenceReference = controlledReference(command.controlledEvidenceReference);
      if (withdrawal.state === 'completed') {
        if (withdrawal.providerReference !== evidenceReference) {
          throw conflict(
            'withdrawal_fact_conflicts_with_completed_withdrawal',
            'A different Withdrawal fact cannot replace an existing completed Withdrawal.',
          );
        }
        return withdrawal;
      }
      const completedWithdrawal = completeWithdrawal(withdrawal, evidenceReference);
      const entries = await paidCommerceRepository.listLedgerEntriesByCreatorId(
        withdrawal.creatorId,
      );
      const completionEntry = withdrawalCompletedEntry({
        id: this.dependencies.idGenerator.generate(),
        withdrawal: completedWithdrawal,
        orderId: associatedOrderId(entries),
        effectiveAt: this.dependencies.clock.now(),
      });
      await paidCommerceRepository.saveWithdrawal(completedWithdrawal);
      await paidCommerceRepository.appendLedgerEntry(completionEntry);
      await this.dependencies.canonicalEventRecorder.record(
        {
          actorId: context.actor.operatorId,
          correlationId: context.correlationId,
          name: 'withdrawal_completed',
          objectId: completedWithdrawal.id,
          source: 'pilot_operations',
          payload: {
            evidenceReference: command.controlledEvidenceReference,
            source: controlledFactSource,
          },
        },
        scope.productEventStore,
      );
      return completedWithdrawal;
    });
  }
}

export class FailControlledWithdrawalUseCase {
  public constructor(private readonly dependencies: PaidCommerceUseCaseDependencies) {}

  public async execute(command: FailControlledWithdrawalCommand, context: ActorContext) {
    assertControlledOperations(context);
    return this.dependencies.unitOfWork.execute(async (scope) => {
      const paidCommerceRepository =
        scope.paidCommerceRepository ?? this.dependencies.paidCommerceRepository;
      const withdrawal = await paidCommerceRepository.findWithdrawalById(command.withdrawalId);
      if (withdrawal === undefined) {
        throw notFound('withdrawal_not_found', 'Withdrawal was not found.');
      }
      controlledReference(command.controlledEvidenceReference);
      if (withdrawal.state === 'failed') {
        return withdrawal;
      }
      const failedWithdrawal = failWithdrawal(withdrawal);
      const entries = await paidCommerceRepository.listLedgerEntriesByCreatorId(
        withdrawal.creatorId,
      );
      const failedEntry = withdrawalFailedEntry({
        id: this.dependencies.idGenerator.generate(),
        withdrawal: failedWithdrawal,
        orderId: associatedOrderId(entries),
        effectiveAt: this.dependencies.clock.now(),
      });
      await paidCommerceRepository.saveWithdrawal(failedWithdrawal);
      await paidCommerceRepository.appendLedgerEntry(failedEntry);
      await this.dependencies.canonicalEventRecorder.record(
        {
          actorId: context.actor.operatorId,
          correlationId: context.correlationId,
          name: 'withdrawal_failed',
          objectId: failedWithdrawal.id,
          source: 'pilot_operations',
          payload: {
            evidenceReference: command.controlledEvidenceReference,
            source: controlledFactSource,
          },
        },
        scope.productEventStore,
      );
      return failedWithdrawal;
    });
  }
}

async function requireOrder(
  repository: PaidCommerceRepository,
  orderId: string,
): Promise<PaidServiceOrder> {
  const order = await repository.findOrderById(orderId);
  if (order === undefined) {
    throw notFound('paid_service_order_not_found', 'Paid Service Order was not found.');
  }
  return order;
}

function associatedOrderId(entries: readonly { readonly orderId: string }[]): string {
  const orderId = entries.at(-1)?.orderId;
  if (orderId === undefined) {
    throw conflict(
      'withdrawal_requires_earnings',
      'Withdrawal requires auditable Creator earnings.',
    );
  }
  return orderId;
}

function assertControlledOperations(context: ActorContext): asserts context is ActorContext & {
  readonly actor: { readonly kind: 'pilot_operations'; readonly operatorId: string };
} {
  if (context.actor.kind !== 'pilot_operations') {
    throw new ApplicationError({
      category: 'authorization',
      code: 'controlled_money_fact_requires_operations',
      message: 'Controlled Money facts require authorized Pilot Operations.',
    });
  }
}

function controlledReference(evidenceReference: string): string {
  const normalized = evidenceReference.trim();
  if (normalized.length === 0) {
    throw new ApplicationError({
      category: 'validation',
      code: 'controlled_evidence_required',
      message: 'Controlled Money facts require an evidence reference.',
    });
  }
  return `${controlledFactSource}:${normalized}`;
}

function notFound(code: string, message: string): ApplicationError {
  return new ApplicationError({ category: 'not_found', code, message });
}

function conflict(code: string, message: string): ApplicationError {
  return new ApplicationError({ category: 'conflict', code, message });
}
