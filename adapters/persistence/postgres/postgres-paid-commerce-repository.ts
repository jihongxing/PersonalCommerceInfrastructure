import { and, eq } from 'drizzle-orm';

import type { PaidCommerceRepository } from '../../../applications/paid-commerce/paid-commerce-repositories.js';
import {
  money,
  type Fulfillment,
  type LedgerEntry,
  type PaidServiceOrder,
  type Payment,
  type Settlement,
  type Withdrawal,
} from '../../../modules/paid-commerce/money-domain.js';
import {
  creatorEarningsLedgerEntries,
  paidCommerceFulfillments,
  paidCommercePayments,
  paidCommerceSettlements,
  paidCommerceWithdrawals,
  paidServiceOrders,
} from '../../../database/schema/paid-commerce.js';
import type { ProductDatabase } from './postgres-database.js';

export class PostgresPaidCommerceRepository implements PaidCommerceRepository {
  public constructor(private readonly database: ProductDatabase) {}

  public async listOrders(): Promise<readonly PaidServiceOrder[]> {
    const rows = await this.database
      .select()
      .from(paidServiceOrders)
      .orderBy(paidServiceOrders.createdAt, paidServiceOrders.id);
    return rows.map(toOrder);
  }

  public async findOrderById(id: string): Promise<PaidServiceOrder | undefined> {
    const rows = await this.database
      .select()
      .from(paidServiceOrders)
      .where(eq(paidServiceOrders.id, id));
    const row = rows[0];
    return row === undefined ? undefined : toOrder(row);
  }

  public async findOrderByCommerceActionId(
    commerceActionId: string,
  ): Promise<PaidServiceOrder | undefined> {
    const rows = await this.database
      .select()
      .from(paidServiceOrders)
      .where(eq(paidServiceOrders.commerceActionId, commerceActionId));
    const row = rows[0];
    return row === undefined ? undefined : toOrder(row);
  }

  public async findOrderByReservationId(
    reservationId: string,
  ): Promise<PaidServiceOrder | undefined> {
    const rows = await this.database
      .select()
      .from(paidServiceOrders)
      .where(eq(paidServiceOrders.reservationId, reservationId));
    const row = rows[0];
    return row === undefined ? undefined : toOrder(row);
  }

  public async findOrderByContractId(contractId: string): Promise<PaidServiceOrder | undefined> {
    const rows = await this.database
      .select()
      .from(paidServiceOrders)
      .where(eq(paidServiceOrders.contractId, contractId));
    const row = rows[0];
    return row === undefined ? undefined : toOrder(row);
  }

  public async findOrdersByCreatorId(creatorId: string): Promise<readonly PaidServiceOrder[]> {
    const rows = await this.database
      .select()
      .from(paidServiceOrders)
      .where(eq(paidServiceOrders.creatorId, creatorId))
      .orderBy(paidServiceOrders.createdAt, paidServiceOrders.id);
    return rows.map(toOrder);
  }

  public async saveOrder(order: PaidServiceOrder): Promise<void> {
    await this.database
      .insert(paidServiceOrders)
      .values({
        id: order.id,
        commerceActionId: order.commerceActionId ?? null,
        reservationId: order.reservationId ?? null,
        contractId: order.contractId ?? null,
        creatorId: order.creatorId,
        customerId: order.customerId,
        offeringId: order.offeringId,
        offeringTitle: order.snapshot.offeringTitle,
        offeringDescription: order.snapshot.offeringDescription,
        serviceTerms: order.snapshot.serviceTerms,
        currency: order.snapshot.grossPrice.currency,
        grossPriceMinor: order.snapshot.grossPrice.minor,
        state: order.state,
      })
      .onConflictDoUpdate({
        target: paidServiceOrders.id,
        set: { state: order.state, updatedAt: new Date().toISOString() },
      });
  }

  public async findPaymentById(id: string): Promise<Payment | undefined> {
    const rows = await this.database
      .select()
      .from(paidCommercePayments)
      .where(eq(paidCommercePayments.id, id));
    const row = rows[0];
    return row === undefined ? undefined : toPayment(row);
  }

  public async findPaymentByOrderId(orderId: string): Promise<Payment | undefined> {
    const rows = await this.database
      .select()
      .from(paidCommercePayments)
      .where(eq(paidCommercePayments.orderId, orderId));
    const row = rows[0];
    return row === undefined ? undefined : toPayment(row);
  }

  public async findPaymentByCorrelationId(correlationId: string): Promise<Payment | undefined> {
    const rows = await this.database
      .select()
      .from(paidCommercePayments)
      .where(eq(paidCommercePayments.correlationId, correlationId));
    const row = rows[0];
    return row === undefined ? undefined : toPayment(row);
  }

  public async savePayment(payment: Payment): Promise<void> {
    await this.database
      .insert(paidCommercePayments)
      .values({
        id: payment.id,
        orderId: payment.orderId,
        currency: payment.amount.currency,
        amountMinor: payment.amount.minor,
        state: payment.state,
        correlationId: payment.correlationId,
        providerReference: payment.providerReference ?? null,
      })
      .onConflictDoUpdate({
        target: paidCommercePayments.id,
        set: {
          state: payment.state,
          providerReference: payment.providerReference ?? null,
          updatedAt: new Date().toISOString(),
        },
      });
  }

  public async findFulfillmentByOrderId(orderId: string): Promise<Fulfillment | undefined> {
    const rows = await this.database
      .select()
      .from(paidCommerceFulfillments)
      .where(eq(paidCommerceFulfillments.orderId, orderId));
    const row = rows[0];
    return row === undefined ? undefined : toFulfillment(row);
  }

  public async saveFulfillment(fulfillment: Fulfillment): Promise<void> {
    await this.database
      .insert(paidCommerceFulfillments)
      .values({
        id: fulfillment.id,
        orderId: fulfillment.orderId,
        creatorId: fulfillment.creatorId,
        state: fulfillment.state,
        evidenceReference: fulfillment.evidenceReference,
        fulfilledAt: fulfillment.fulfilledAt ?? null,
      })
      .onConflictDoUpdate({
        target: paidCommerceFulfillments.id,
        set: { state: fulfillment.state, fulfilledAt: fulfillment.fulfilledAt ?? null },
      });
  }

  public async findSettlementByOrderId(orderId: string): Promise<Settlement | undefined> {
    const rows = await this.database
      .select()
      .from(paidCommerceSettlements)
      .where(eq(paidCommerceSettlements.orderId, orderId));
    const row = rows[0];
    return row === undefined ? undefined : toSettlement(row);
  }

  public async saveSettlement(settlement: Settlement): Promise<void> {
    await this.database
      .insert(paidCommerceSettlements)
      .values({
        id: settlement.id,
        orderId: settlement.orderId,
        paymentId: settlement.paymentId,
        fulfillmentId: settlement.fulfillmentId,
        creatorId: settlement.creatorId,
        currency: settlement.creatorNet.currency,
        grossMinor: settlement.input.gross.minor,
        providerFeeMinor: settlement.input.providerFee.minor,
        platformFeeMinor: settlement.input.platformFee.minor,
        deductionsMinor: settlement.input.deductions.minor,
        creatorNetMinor: settlement.creatorNet.minor,
        state: settlement.state,
        calculationVersion: settlement.calculationVersion,
      })
      .onConflictDoUpdate({
        target: paidCommerceSettlements.id,
        set: { state: settlement.state, updatedAt: new Date().toISOString() },
      });
  }

  public async appendLedgerEntry(entry: LedgerEntry): Promise<void> {
    await this.database.insert(creatorEarningsLedgerEntries).values({
      id: entry.id,
      creatorId: entry.creatorId,
      currency: entry.currency,
      amountMinor: entry.minor,
      type: entry.type,
      effectiveAt: entry.effectiveAt,
      orderId: entry.orderId,
      paymentId: entry.paymentId ?? null,
      settlementId: entry.settlementId ?? null,
      withdrawalId: entry.withdrawalId ?? null,
      correlationId: entry.correlationId,
      auditContext: {},
    });
  }

  public async listLedgerEntriesByCreatorId(creatorId: string): Promise<readonly LedgerEntry[]> {
    const rows = await this.database
      .select()
      .from(creatorEarningsLedgerEntries)
      .where(eq(creatorEarningsLedgerEntries.creatorId, creatorId))
      .orderBy(creatorEarningsLedgerEntries.effectiveAt, creatorEarningsLedgerEntries.id);
    return rows.map(toLedgerEntry);
  }

  public async findWithdrawalById(id: string): Promise<Withdrawal | undefined> {
    const rows = await this.database
      .select()
      .from(paidCommerceWithdrawals)
      .where(eq(paidCommerceWithdrawals.id, id));
    const row = rows[0];
    return row === undefined ? undefined : toWithdrawal(row);
  }

  public async findWithdrawalsByCreatorId(creatorId: string): Promise<readonly Withdrawal[]> {
    const rows = await this.database
      .select()
      .from(paidCommerceWithdrawals)
      .where(eq(paidCommerceWithdrawals.creatorId, creatorId));
    return rows.map(toWithdrawal);
  }

  public async listWithdrawals(): Promise<readonly Withdrawal[]> {
    const rows = await this.database
      .select()
      .from(paidCommerceWithdrawals)
      .orderBy(paidCommerceWithdrawals.createdAt, paidCommerceWithdrawals.id);
    return rows.map(toWithdrawal);
  }

  public async findWithdrawalByCreatorAndIdempotencyKey(
    creatorId: string,
    idempotencyKey: string,
  ): Promise<Withdrawal | undefined> {
    const rows = await this.database
      .select()
      .from(paidCommerceWithdrawals)
      .where(
        and(
          eq(paidCommerceWithdrawals.creatorId, creatorId),
          eq(paidCommerceWithdrawals.idempotencyKey, idempotencyKey),
        ),
      );
    const row = rows[0];
    return row === undefined ? undefined : toWithdrawal(row);
  }

  public async saveWithdrawal(withdrawal: Withdrawal): Promise<void> {
    await this.database
      .insert(paidCommerceWithdrawals)
      .values({
        id: withdrawal.id,
        creatorId: withdrawal.creatorId,
        currency: withdrawal.amount.currency,
        amountMinor: withdrawal.amount.minor,
        destinationReference: withdrawal.destinationReference,
        idempotencyKey: withdrawal.idempotencyKey,
        state: withdrawal.state,
        correlationId: withdrawal.correlationId,
        providerReference: withdrawal.providerReference ?? null,
      })
      .onConflictDoUpdate({
        target: paidCommerceWithdrawals.id,
        set: {
          state: withdrawal.state,
          providerReference: withdrawal.providerReference ?? null,
          updatedAt: new Date().toISOString(),
        },
      });
  }
}

function toOrder(row: typeof paidServiceOrders.$inferSelect): PaidServiceOrder {
  return {
    id: row.id,
    ...(row.commerceActionId === null ? {} : { commerceActionId: row.commerceActionId }),
    ...(row.reservationId === null ? {} : { reservationId: row.reservationId }),
    ...(row.contractId === null ? {} : { contractId: row.contractId }),
    creatorId: row.creatorId,
    customerId: row.customerId,
    offeringId: row.offeringId,
    snapshot: {
      offeringTitle: row.offeringTitle,
      offeringDescription: row.offeringDescription,
      serviceTerms: row.serviceTerms,
      grossPrice: money(row.currency as 'CNY', row.grossPriceMinor),
    },
    state: row.state as PaidServiceOrder['state'],
  };
}

function toPayment(row: typeof paidCommercePayments.$inferSelect): Payment {
  return {
    id: row.id,
    orderId: row.orderId,
    amount: money(row.currency as 'CNY', row.amountMinor),
    state: row.state as Payment['state'],
    correlationId: row.correlationId,
    ...(row.providerReference === null ? {} : { providerReference: row.providerReference }),
  };
}

function toFulfillment(row: typeof paidCommerceFulfillments.$inferSelect): Fulfillment {
  return {
    id: row.id,
    orderId: row.orderId,
    creatorId: row.creatorId,
    state: row.state as Fulfillment['state'],
    evidenceReference: row.evidenceReference,
    ...(row.fulfilledAt === null ? {} : { fulfilledAt: row.fulfilledAt }),
  };
}

function toSettlement(row: typeof paidCommerceSettlements.$inferSelect): Settlement {
  const currency = row.currency as 'CNY';
  return {
    id: row.id,
    orderId: row.orderId,
    paymentId: row.paymentId,
    fulfillmentId: row.fulfillmentId,
    creatorId: row.creatorId,
    input: {
      gross: money(currency, row.grossMinor),
      providerFee: money(currency, row.providerFeeMinor),
      platformFee: money(currency, row.platformFeeMinor),
      deductions: money(currency, row.deductionsMinor),
    },
    creatorNet: money(currency, row.creatorNetMinor),
    state: row.state as Settlement['state'],
    calculationVersion: row.calculationVersion,
  };
}

function toLedgerEntry(row: typeof creatorEarningsLedgerEntries.$inferSelect): LedgerEntry {
  return {
    id: row.id,
    creatorId: row.creatorId,
    currency: row.currency as 'CNY',
    minor: row.amountMinor,
    type: row.type as LedgerEntry['type'],
    effectiveAt: row.effectiveAt,
    orderId: row.orderId,
    ...(row.paymentId === null ? {} : { paymentId: row.paymentId }),
    ...(row.settlementId === null ? {} : { settlementId: row.settlementId }),
    ...(row.withdrawalId === null ? {} : { withdrawalId: row.withdrawalId }),
    correlationId: row.correlationId,
  };
}

function toWithdrawal(row: typeof paidCommerceWithdrawals.$inferSelect): Withdrawal {
  return {
    id: row.id,
    creatorId: row.creatorId,
    amount: money(row.currency as 'CNY', row.amountMinor),
    destinationReference: row.destinationReference,
    idempotencyKey: row.idempotencyKey,
    state: row.state as Withdrawal['state'],
    correlationId: row.correlationId,
    ...(row.providerReference === null ? {} : { providerReference: row.providerReference }),
  };
}
