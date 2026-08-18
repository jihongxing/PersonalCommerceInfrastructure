import type { ActorContext } from '../core/actor-context.js';
import { ApplicationError } from '../core/application-error.js';
import type { CanonicalEvent } from '../../modules/product-facts/canonical-events.js';
import { projectWallet, type LedgerEntry } from '../../modules/paid-commerce/money-domain.js';
import type { PaidCommerceRepository } from './paid-commerce-repositories.js';

export type OperationsFactOrigin = 'simulation' | 'provider' | 'unknown';
export type OperationsIssueType =
  | 'missing_fact'
  | 'duplicate_fact'
  | 'conflicting_fact'
  | 'pending_resolution'
  | 'recovery_outstanding';

export interface OperationsProviderFactRecord {
  readonly providerId: string;
  readonly providerEventId: string;
  readonly providerReference: string;
  readonly kind: string;
  readonly resourceType: 'payment' | 'settlement' | 'withdrawal';
  readonly internalReference: string;
  readonly occurredAt: string;
  readonly status?: 'accepted' | 'idempotent' | 'conflict' | 'stale';
  readonly reason?: string;
}

export interface OperationsEvidenceSources {
  listCanonicalEvents(): Promise<readonly CanonicalEvent[]>;
  listProviderFacts(): Promise<readonly OperationsProviderFactRecord[]>;
}

export interface OperationsActionAuditRecord {
  readonly id: string;
  readonly actorId: string;
  readonly action:
    | 'retry_settlement'
    | 'retry_withdrawal'
    | 'reconciliation'
    | 'manual_resolution'
    | 'recovery_resolution';
  readonly targetType: 'order' | 'settlement' | 'withdrawal' | 'recovery';
  readonly targetId: string;
  readonly before: Readonly<Record<string, unknown>>;
  readonly after: Readonly<Record<string, unknown>>;
  readonly reason: string;
  readonly occurredAt: string;
  readonly correlationId: string;
}

export interface OperationsActionAuditStore {
  append(record: OperationsActionAuditRecord): Promise<void>;
  list(): Promise<readonly OperationsActionAuditRecord[]>;
}

export interface OperationsActionExecutor {
  retrySettlement(orderId: string, context: ActorContext): Promise<void>;
  retryWithdrawal(withdrawalId: string, context: ActorContext): Promise<void>;
}

export interface CommercialPilotOperationsOrder {
  readonly order: {
    readonly id: string;
    readonly creatorId: string;
    readonly customerId: string;
    readonly offeringId: string;
    readonly offeringSnapshot: {
      readonly title: string;
      readonly description: string;
      readonly serviceTerms: string;
    };
    readonly amountMinor: string;
    readonly currency: 'CNY';
    readonly state: string;
  };
  readonly payment?: {
    readonly id: string;
    readonly state: string;
    readonly providerReference?: string;
    readonly timestamp?: string;
  };
  readonly settlement?: {
    readonly id: string;
    readonly state: string;
    readonly grossMinor: string;
    readonly providerFeeMinor: string;
    readonly platformFeeMinor: string;
    readonly creatorNetMinor: string;
    readonly timestamp?: string;
  };
  readonly earnings: {
    readonly scope: 'order_earnings_projection';
    readonly pendingMinor: string;
    readonly availableMinor: string;
    readonly restrictedMinor: string;
    readonly recoveryOutstandingMinor: string;
  };
  readonly creatorWallet: {
    readonly scope: 'creator_wallet_projection';
    readonly pendingMinor: string;
    readonly availableMinor: string;
    readonly restrictedMinor: string;
    readonly recoveryOutstandingMinor: string;
    readonly withdrawalInProgressMinor: string;
    readonly withdrawnMinor: string;
  };
  readonly withdrawals: readonly {
    readonly id: string;
    readonly state: string;
    readonly amountMinor: string;
    readonly providerReference?: string;
  }[];
  readonly origin: OperationsFactOrigin;
  readonly providerId?: string;
  readonly issues: readonly OperationsIssueType[];
  readonly ledgerEntries: readonly {
    readonly id: string;
    readonly type: string;
    readonly amountMinor: string;
    readonly currency: 'CNY';
    readonly orderId: string;
    readonly paymentId?: string;
    readonly settlementId?: string;
    readonly withdrawalId?: string;
    readonly effectiveAt: string;
    readonly correlationId: string;
  }[];
  readonly canonicalEvents: readonly CanonicalEvent[];
}

export interface CommercialEvidencePackage extends CommercialPilotOperationsOrder {
  readonly classification: 'commercial_evidence_summary';
  readonly generatedAt: string;
  readonly realCommerceEvidence: false;
}

export class CommercialPilotOperationsService {
  public constructor(
    private readonly dependencies: {
      readonly repository: PaidCommerceRepository;
      readonly evidenceSources: OperationsEvidenceSources;
      readonly auditStore: OperationsActionAuditStore;
      readonly actionExecutor?: OperationsActionExecutor;
      readonly now: () => string;
      readonly generateId: () => string;
    },
  ) {}

  public async getWorkspace(context: ActorContext): Promise<{
    readonly orders: readonly CommercialPilotOperationsOrder[];
    readonly audit: readonly OperationsActionAuditRecord[];
  }> {
    assertOperations(context);
    const orders = await this.dependencies.repository.listOrders();
    return {
      orders: await Promise.all(orders.map((order) => this.buildOrder(order.id))),
      audit: await this.dependencies.auditStore.list(),
    };
  }

  public async exportEvidence(
    orderId: string,
    context: ActorContext,
  ): Promise<CommercialEvidencePackage> {
    assertOperations(context);
    return {
      ...(await this.buildOrder(orderId)),
      classification: 'commercial_evidence_summary',
      generatedAt: this.dependencies.now(),
      realCommerceEvidence: false,
    };
  }

  public async retrySettlement(
    orderId: string,
    reason: string,
    context: ActorContext,
  ): Promise<void> {
    assertOperations(context);
    const before = await this.buildOrder(orderId);
    if (this.dependencies.actionExecutor === undefined) {
      throw new Error('Operations action executor is unavailable.');
    }
    await this.dependencies.actionExecutor.retrySettlement(orderId, context);
    const after = await this.buildOrder(orderId);
    await this.recordAction(
      'retry_settlement',
      'settlement',
      orderId,
      before as unknown as Readonly<Record<string, unknown>>,
      after as unknown as Readonly<Record<string, unknown>>,
      reason,
      context,
    );
  }

  public async retryWithdrawal(
    withdrawalId: string,
    reason: string,
    context: ActorContext,
  ): Promise<void> {
    assertOperations(context);
    const withdrawal = await this.dependencies.repository.findWithdrawalById(withdrawalId);
    if (withdrawal === undefined) throw new Error('Withdrawal was not found.');
    const before = await this.buildOrderForCreator(withdrawal.creatorId);
    if (this.dependencies.actionExecutor === undefined) {
      throw new Error('Operations action executor is unavailable.');
    }
    await this.dependencies.actionExecutor.retryWithdrawal(withdrawalId, context);
    const after = await this.buildOrderForCreator(withdrawal.creatorId);
    await this.recordAction(
      'retry_withdrawal',
      'withdrawal',
      withdrawalId,
      before,
      after,
      reason,
      context,
    );
  }

  public async recordResolution(
    input: {
      readonly action: 'reconciliation' | 'manual_resolution' | 'recovery_resolution';
      readonly targetType: 'order' | 'settlement' | 'withdrawal' | 'recovery';
      readonly targetId: string;
      readonly reason: string;
    },
    context: ActorContext,
  ): Promise<void> {
    assertOperations(context);
    const snapshot = await this.snapshotTarget(input.targetType, input.targetId);
    await this.recordAction(
      input.action,
      input.targetType,
      input.targetId,
      snapshot,
      { ...snapshot, operatorMarkedResolved: true },
      input.reason,
      context,
    );
  }

  private async buildOrder(orderId: string): Promise<CommercialPilotOperationsOrder> {
    const order = await this.dependencies.repository.findOrderById(orderId);
    if (order === undefined) throw new Error('Paid Service Order was not found.');
    const [payment, settlement, allLedger, allWithdrawals, events, providerFacts] =
      await Promise.all([
        this.dependencies.repository.findPaymentByOrderId(order.id),
        this.dependencies.repository.findSettlementByOrderId(order.id),
        this.dependencies.repository.listLedgerEntriesByCreatorId(order.creatorId),
        this.dependencies.repository.findWithdrawalsByCreatorId(order.creatorId),
        this.dependencies.evidenceSources.listCanonicalEvents(),
        this.dependencies.evidenceSources.listProviderFacts(),
      ]);
    const ledgerEntries = allLedger.filter((entry) => entry.orderId === order.id);
    const earningsEntries = ledgerEntries.filter(
      (entry) =>
        entry.type !== 'withdrawal_reserved' &&
        entry.type !== 'withdrawal_completed' &&
        entry.type !== 'withdrawal_failed',
    );
    const orderEarnings = projectWallet('CNY', earningsEntries);
    const creatorWallet = projectWallet('CNY', allLedger);
    const relatedWithdrawalIds = new Set(
      ledgerEntries
        .map((entry) => entry.withdrawalId)
        .filter((withdrawalId): withdrawalId is string => withdrawalId !== undefined),
    );
    const withdrawals = allWithdrawals.filter((withdrawal) =>
      relatedWithdrawalIds.has(withdrawal.id),
    );
    const canonicalEvents = events.filter(
      (event) =>
        event.objectId === order.id ||
        event.payload.orderId === order.id ||
        event.objectId === payment?.id ||
        event.objectId === settlement?.id,
    );
    const facts = providerFacts.filter(
      (fact) =>
        fact.internalReference === order.id ||
        fact.internalReference === payment?.id ||
        fact.internalReference === settlement?.id ||
        withdrawals.some((withdrawal) => withdrawal.id === fact.internalReference),
    );
    const origin = resolveOrigin(facts, canonicalEvents);
    const issues = resolveIssues(
      order.state,
      settlement?.state,
      orderEarnings.recoveryOutstanding,
      facts,
    );
    return {
      order: {
        id: order.id,
        creatorId: order.creatorId,
        customerId: order.customerId,
        offeringId: order.offeringId,
        offeringSnapshot: {
          title: order.snapshot.offeringTitle,
          description: order.snapshot.offeringDescription,
          serviceTerms: order.snapshot.serviceTerms,
        },
        amountMinor: String(order.snapshot.grossPrice.minor),
        currency: order.snapshot.grossPrice.currency,
        state: order.state,
      },
      ...(payment === undefined
        ? {}
        : {
            payment: {
              id: payment.id,
              state: payment.state,
              ...(payment.providerReference === undefined
                ? {}
                : { providerReference: payment.providerReference }),
              ...(findTimestamp(canonicalEvents, ['payment_confirmed', 'payment_failed']) ===
              undefined
                ? {}
                : {
                    timestamp: findTimestamp(canonicalEvents, [
                      'payment_confirmed',
                      'payment_failed',
                    ])!,
                  }),
            },
          }),
      ...(settlement === undefined
        ? {}
        : {
            settlement: {
              id: settlement.id,
              state: settlement.state,
              grossMinor: String(settlement.input.gross.minor),
              providerFeeMinor: String(settlement.input.providerFee.minor),
              platformFeeMinor: String(settlement.input.platformFee.minor),
              creatorNetMinor: String(settlement.creatorNet.minor),
              ...(findTimestamp(canonicalEvents, ['settlement_released', 'settlement_failed']) ===
              undefined
                ? {}
                : {
                    timestamp: findTimestamp(canonicalEvents, [
                      'settlement_released',
                      'settlement_failed',
                    ])!,
                  }),
            },
          }),
      earnings: {
        scope: 'order_earnings_projection',
        pendingMinor: String(orderEarnings.pending),
        availableMinor: String(orderEarnings.available),
        restrictedMinor: String(orderEarnings.restricted),
        recoveryOutstandingMinor: String(orderEarnings.recoveryOutstanding),
      },
      creatorWallet: {
        scope: 'creator_wallet_projection',
        pendingMinor: String(creatorWallet.pending),
        availableMinor: String(creatorWallet.available),
        restrictedMinor: String(creatorWallet.restricted),
        recoveryOutstandingMinor: String(creatorWallet.recoveryOutstanding),
        withdrawalInProgressMinor: String(creatorWallet.withdrawalInProgress),
        withdrawnMinor: String(creatorWallet.withdrawn),
      },
      withdrawals: withdrawals.map((withdrawal) => ({
        id: withdrawal.id,
        state: withdrawal.state,
        amountMinor: String(withdrawal.amount.minor),
        ...(withdrawal.providerReference === undefined
          ? {}
          : { providerReference: withdrawal.providerReference }),
      })),
      origin,
      ...(facts[0] === undefined ? {} : { providerId: facts[0].providerId }),
      issues,
      ledgerEntries: ledgerEntries.map(serializeLedgerEntry),
      canonicalEvents,
    };
  }

  private async buildOrderForCreator(
    creatorId: string,
  ): Promise<Readonly<Record<string, unknown>>> {
    const orders = await this.dependencies.repository.findOrdersByCreatorId(creatorId);
    return { orders: await Promise.all(orders.map((order) => this.buildOrder(order.id))) };
  }

  private async snapshotTarget(
    targetType: OperationsActionAuditRecord['targetType'],
    targetId: string,
  ): Promise<Readonly<Record<string, unknown>>> {
    if (targetType === 'order' || targetType === 'settlement' || targetType === 'recovery') {
      return (await this.buildOrder(targetId)) as unknown as Readonly<Record<string, unknown>>;
    }
    const withdrawal = await this.dependencies.repository.findWithdrawalById(targetId);
    if (withdrawal === undefined) throw new Error('Withdrawal was not found.');
    return {
      withdrawal: {
        id: withdrawal.id,
        creatorId: withdrawal.creatorId,
        amountMinor: String(withdrawal.amount.minor),
        currency: withdrawal.amount.currency,
        state: withdrawal.state,
        correlationId: withdrawal.correlationId,
        ...(withdrawal.providerReference === undefined
          ? {}
          : { providerReference: withdrawal.providerReference }),
      },
    };
  }

  private async recordAction(
    action: OperationsActionAuditRecord['action'],
    targetType: OperationsActionAuditRecord['targetType'],
    targetId: string,
    before: Readonly<Record<string, unknown>>,
    after: Readonly<Record<string, unknown>>,
    reason: string,
    context: ActorContext & {
      readonly actor: { readonly kind: 'pilot_operations'; readonly operatorId: string };
    },
  ): Promise<void> {
    if (reason.trim().length === 0) {
      throw new ApplicationError({
        category: 'validation',
        code: 'operations_action_reason_required',
        message: 'Operations action reason is required.',
      });
    }
    await this.dependencies.auditStore.append({
      id: this.dependencies.generateId(),
      actorId: context.actor.operatorId,
      action,
      targetType,
      targetId,
      before,
      after,
      reason: reason.trim(),
      occurredAt: this.dependencies.now(),
      correlationId: context.correlationId,
    });
  }
}

function assertOperations(context: ActorContext): asserts context is ActorContext & {
  readonly actor: { readonly kind: 'pilot_operations'; readonly operatorId: string };
} {
  if (context.actor.kind !== 'pilot_operations') {
    throw new ApplicationError({
      category: 'authorization',
      code: 'commercial_pilot_operations_requires_role',
      message: 'Commercial Pilot Operations require pilot_operations authorization.',
    });
  }
}

function resolveOrigin(
  facts: readonly OperationsProviderFactRecord[],
  events: readonly CanonicalEvent[],
): OperationsFactOrigin {
  if (facts.some((fact) => fact.providerId === 'local_commerce_simulator')) return 'simulation';
  if (facts.length > 0) return 'provider';
  if (
    events.some(
      (event) =>
        typeof event.payload.source === 'string' && event.payload.source.startsWith('simulation'),
    )
  ) {
    return 'simulation';
  }
  return 'unknown';
}

function resolveIssues(
  orderState: string,
  settlementState: string | undefined,
  recoveryOutstanding: bigint,
  facts: readonly OperationsProviderFactRecord[],
): readonly OperationsIssueType[] {
  const issues = new Set<OperationsIssueType>();
  if (orderState === 'pending_resolution' || settlementState === 'failed') {
    issues.add('pending_resolution');
  }
  if (recoveryOutstanding > 0n) issues.add('recovery_outstanding');
  if (
    settlementState === 'released' &&
    !facts.some((fact) => fact.kind === 'SettlementSucceeded')
  ) {
    issues.add('missing_fact');
  }
  if (facts.some((fact) => fact.status === 'idempotent')) issues.add('duplicate_fact');
  if (facts.some((fact) => fact.status === 'conflict' || fact.status === 'stale')) {
    issues.add('conflicting_fact');
  }
  return [...issues];
}

function serializeLedgerEntry(
  entry: LedgerEntry,
): CommercialPilotOperationsOrder['ledgerEntries'][number] {
  return {
    id: entry.id,
    type: entry.type,
    amountMinor: String(entry.minor),
    currency: entry.currency,
    orderId: entry.orderId,
    ...(entry.paymentId === undefined ? {} : { paymentId: entry.paymentId }),
    ...(entry.settlementId === undefined ? {} : { settlementId: entry.settlementId }),
    ...(entry.withdrawalId === undefined ? {} : { withdrawalId: entry.withdrawalId }),
    effectiveAt: entry.effectiveAt,
    correlationId: entry.correlationId,
  };
}

function findTimestamp(
  events: readonly CanonicalEvent[],
  names: readonly CanonicalEvent['name'][],
): string | undefined {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event !== undefined && names.includes(event.name)) return event.occurredAt;
  }
  return undefined;
}
