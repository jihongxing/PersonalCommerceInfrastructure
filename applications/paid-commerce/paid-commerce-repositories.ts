import type {
  Fulfillment,
  LedgerEntry,
  PaidServiceOrder,
  Payment,
  Settlement,
  Withdrawal,
} from '../../modules/paid-commerce/money-domain.js';

export interface PaidCommerceRepository {
  listOrders(): Promise<readonly PaidServiceOrder[]>;
  findOrderById(id: string): Promise<PaidServiceOrder | undefined>;
  findOrderByCommerceActionId(commerceActionId: string): Promise<PaidServiceOrder | undefined>;
  findOrderByReservationId(reservationId: string): Promise<PaidServiceOrder | undefined>;
  findOrderByContractId(contractId: string): Promise<PaidServiceOrder | undefined>;
  findOrdersByCreatorId(creatorId: string): Promise<readonly PaidServiceOrder[]>;
  saveOrder(order: PaidServiceOrder): Promise<void>;
  findPaymentById(id: string): Promise<Payment | undefined>;
  findPaymentByOrderId(orderId: string): Promise<Payment | undefined>;
  findPaymentByCorrelationId(correlationId: string): Promise<Payment | undefined>;
  savePayment(payment: Payment): Promise<void>;
  findFulfillmentByOrderId(orderId: string): Promise<Fulfillment | undefined>;
  saveFulfillment(fulfillment: Fulfillment): Promise<void>;
  findSettlementByOrderId(orderId: string): Promise<Settlement | undefined>;
  saveSettlement(settlement: Settlement): Promise<void>;
  appendLedgerEntry(entry: LedgerEntry): Promise<void>;
  listLedgerEntriesByCreatorId(creatorId: string): Promise<readonly LedgerEntry[]>;
  findWithdrawalById(id: string): Promise<Withdrawal | undefined>;
  findWithdrawalsByCreatorId(creatorId: string): Promise<readonly Withdrawal[]>;
  listWithdrawals(): Promise<readonly Withdrawal[]>;
  findWithdrawalByCreatorAndIdempotencyKey(
    creatorId: string,
    idempotencyKey: string,
  ): Promise<Withdrawal | undefined>;
  saveWithdrawal(withdrawal: Withdrawal): Promise<void>;
}
