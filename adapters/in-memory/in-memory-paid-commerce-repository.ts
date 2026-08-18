import type { PaidCommerceRepository } from '../../applications/paid-commerce/paid-commerce-repositories.js';
import type {
  Fulfillment,
  LedgerEntry,
  PaidServiceOrder,
  Payment,
  Settlement,
  Withdrawal,
} from '../../modules/paid-commerce/money-domain.js';

import type { TransactionParticipant } from './transaction-participant.js';

export class InMemoryPaidCommerceRepository
  implements PaidCommerceRepository, TransactionParticipant
{
  private orders = new Map<string, PaidServiceOrder>();
  private payments = new Map<string, Payment>();
  private fulfillments = new Map<string, Fulfillment>();
  private settlements = new Map<string, Settlement>();
  private ledgerEntries = new Map<string, LedgerEntry>();
  private withdrawals = new Map<string, Withdrawal>();

  public findOrderById(id: string): Promise<PaidServiceOrder | undefined> {
    return Promise.resolve(cloneOrUndefined(this.orders.get(id)));
  }

  public listOrders(): Promise<readonly PaidServiceOrder[]> {
    return Promise.resolve(structuredClone([...this.orders.values()]));
  }

  public findOrderByCommerceActionId(
    commerceActionId: string,
  ): Promise<PaidServiceOrder | undefined> {
    return Promise.resolve(
      cloneOrUndefined(
        [...this.orders.values()].find((order) => order.commerceActionId === commerceActionId),
      ),
    );
  }

  public findOrderByReservationId(reservationId: string): Promise<PaidServiceOrder | undefined> {
    return Promise.resolve(
      cloneOrUndefined(
        [...this.orders.values()].find((order) => order.reservationId === reservationId),
      ),
    );
  }

  public findOrderByContractId(contractId: string): Promise<PaidServiceOrder | undefined> {
    return Promise.resolve(
      cloneOrUndefined([...this.orders.values()].find((order) => order.contractId === contractId)),
    );
  }

  public findOrdersByCreatorId(creatorId: string): Promise<readonly PaidServiceOrder[]> {
    return Promise.resolve(
      structuredClone([...this.orders.values()].filter((order) => order.creatorId === creatorId)),
    );
  }

  public saveOrder(order: PaidServiceOrder): Promise<void> {
    this.orders.set(order.id, structuredClone(order));
    return Promise.resolve();
  }

  public findPaymentById(id: string): Promise<Payment | undefined> {
    return Promise.resolve(cloneOrUndefined(this.payments.get(id)));
  }

  public findPaymentByOrderId(orderId: string): Promise<Payment | undefined> {
    return Promise.resolve(
      cloneOrUndefined([...this.payments.values()].find((payment) => payment.orderId === orderId)),
    );
  }

  public findPaymentByCorrelationId(correlationId: string): Promise<Payment | undefined> {
    return Promise.resolve(
      cloneOrUndefined(
        [...this.payments.values()].find((payment) => payment.correlationId === correlationId),
      ),
    );
  }

  public savePayment(payment: Payment): Promise<void> {
    this.payments.set(payment.id, structuredClone(payment));
    return Promise.resolve();
  }

  public findFulfillmentByOrderId(orderId: string): Promise<Fulfillment | undefined> {
    return Promise.resolve(
      cloneOrUndefined(
        [...this.fulfillments.values()].find((fulfillment) => fulfillment.orderId === orderId),
      ),
    );
  }

  public saveFulfillment(fulfillment: Fulfillment): Promise<void> {
    this.fulfillments.set(fulfillment.id, structuredClone(fulfillment));
    return Promise.resolve();
  }

  public findSettlementByOrderId(orderId: string): Promise<Settlement | undefined> {
    return Promise.resolve(
      cloneOrUndefined(
        [...this.settlements.values()].find((settlement) => settlement.orderId === orderId),
      ),
    );
  }

  public saveSettlement(settlement: Settlement): Promise<void> {
    this.settlements.set(settlement.id, structuredClone(settlement));
    return Promise.resolve();
  }

  public appendLedgerEntry(entry: LedgerEntry): Promise<void> {
    if (this.ledgerEntries.has(entry.id)) {
      throw new Error(`Ledger Entry ${entry.id} already exists and is append-only.`);
    }
    this.ledgerEntries.set(entry.id, structuredClone(entry));
    return Promise.resolve();
  }

  public listLedgerEntriesByCreatorId(creatorId: string): Promise<readonly LedgerEntry[]> {
    return Promise.resolve(
      structuredClone(
        [...this.ledgerEntries.values()].filter((entry) => entry.creatorId === creatorId),
      ),
    );
  }

  public findWithdrawalById(id: string): Promise<Withdrawal | undefined> {
    return Promise.resolve(cloneOrUndefined(this.withdrawals.get(id)));
  }

  public findWithdrawalsByCreatorId(creatorId: string): Promise<readonly Withdrawal[]> {
    return Promise.resolve(
      structuredClone(
        [...this.withdrawals.values()].filter((withdrawal) => withdrawal.creatorId === creatorId),
      ),
    );
  }

  public listWithdrawals(): Promise<readonly Withdrawal[]> {
    return Promise.resolve(structuredClone([...this.withdrawals.values()]));
  }

  public findWithdrawalByCreatorAndIdempotencyKey(
    creatorId: string,
    idempotencyKey: string,
  ): Promise<Withdrawal | undefined> {
    return Promise.resolve(
      cloneOrUndefined(
        [...this.withdrawals.values()].find(
          (withdrawal) =>
            withdrawal.creatorId === creatorId && withdrawal.idempotencyKey === idempotencyKey,
        ),
      ),
    );
  }

  public saveWithdrawal(withdrawal: Withdrawal): Promise<void> {
    this.withdrawals.set(withdrawal.id, structuredClone(withdrawal));
    return Promise.resolve();
  }

  public createSnapshot(): unknown {
    return structuredClone({
      orders: this.orders,
      payments: this.payments,
      fulfillments: this.fulfillments,
      settlements: this.settlements,
      ledgerEntries: this.ledgerEntries,
      withdrawals: this.withdrawals,
    });
  }

  public restoreSnapshot(snapshot: unknown): void {
    if (
      typeof snapshot !== 'object' ||
      snapshot === null ||
      !('orders' in snapshot) ||
      !('payments' in snapshot) ||
      !('fulfillments' in snapshot) ||
      !('settlements' in snapshot) ||
      !('ledgerEntries' in snapshot) ||
      !('withdrawals' in snapshot)
    ) {
      throw new TypeError('Paid Commerce repository snapshot is invalid.');
    }

    const state = snapshot as {
      orders: Map<string, PaidServiceOrder>;
      payments: Map<string, Payment>;
      fulfillments: Map<string, Fulfillment>;
      settlements: Map<string, Settlement>;
      ledgerEntries: Map<string, LedgerEntry>;
      withdrawals: Map<string, Withdrawal>;
    };
    this.orders = structuredClone(state.orders);
    this.payments = structuredClone(state.payments);
    this.fulfillments = structuredClone(state.fulfillments);
    this.settlements = structuredClone(state.settlements);
    this.ledgerEntries = structuredClone(state.ledgerEntries);
    this.withdrawals = structuredClone(state.withdrawals);
  }
}

function cloneOrUndefined<Value>(value: Value | undefined): Value | undefined {
  return value === undefined ? undefined : structuredClone(value);
}
