import { DomainTransitionError } from '../shared/domain-error.js';

export type Currency = 'CNY';
export type MoneyMinor = bigint;

export interface Money {
  readonly currency: Currency;
  readonly minor: MoneyMinor;
}

export type OrderState =
  | 'created'
  | 'payment_pending'
  | 'paid'
  | 'fulfilled'
  | 'completed'
  | 'cancelled'
  | 'pending_resolution'
  | 'refunded';

export type PaymentState = 'pending' | 'confirmed' | 'failed' | 'expired' | 'refunded' | 'reversed';

export type FulfillmentState = 'pending' | 'fulfilled' | 'disputed';

export type SettlementState = 'pending' | 'released' | 'failed' | 'resolved' | 'reversed';

export type WithdrawalState = 'requested' | 'completed' | 'failed' | 'reversed';

export type LedgerEntryType =
  | 'pending_earnings_credited'
  | 'settlement_released'
  | 'earnings_restricted'
  | 'earnings_released'
  | 'refund_debited'
  | 'settlement_reversed'
  | 'withdrawal_reserved'
  | 'withdrawal_completed'
  | 'withdrawal_failed';

export interface OrderSnapshot {
  readonly offeringTitle: string;
  readonly offeringDescription: string;
  readonly serviceTerms: string;
  readonly grossPrice: Money;
}

export interface PaidServiceOrder {
  readonly id: string;
  readonly commerceActionId?: string;
  readonly reservationId?: string;
  readonly contractId?: string;
  readonly creatorId: string;
  readonly customerId: string;
  readonly offeringId: string;
  readonly snapshot: OrderSnapshot;
  readonly state: OrderState;
}

export interface Payment {
  readonly id: string;
  readonly orderId: string;
  readonly amount: Money;
  readonly state: PaymentState;
  readonly correlationId: string;
  readonly providerReference?: string;
}

export interface Fulfillment {
  readonly id: string;
  readonly orderId: string;
  readonly creatorId: string;
  readonly state: FulfillmentState;
  readonly evidenceReference: string;
  readonly fulfilledAt?: string;
}

export interface SettlementInput {
  readonly gross: Money;
  readonly providerFee: Money;
  readonly platformFee: Money;
  readonly deductions: Money;
}

export interface Settlement {
  readonly id: string;
  readonly orderId: string;
  readonly paymentId: string;
  readonly fulfillmentId: string;
  readonly creatorId: string;
  readonly input: SettlementInput;
  readonly creatorNet: Money;
  readonly state: SettlementState;
  readonly calculationVersion: string;
}

export interface LedgerEntry {
  readonly id: string;
  readonly creatorId: string;
  readonly currency: Currency;
  readonly minor: MoneyMinor;
  readonly type: LedgerEntryType;
  readonly effectiveAt: string;
  readonly orderId: string;
  readonly paymentId?: string;
  readonly settlementId?: string;
  readonly withdrawalId?: string;
  readonly correlationId: string;
}

export interface WalletProjection {
  readonly currency: Currency;
  readonly pending: MoneyMinor;
  readonly available: MoneyMinor;
  readonly restricted: MoneyMinor;
  readonly withdrawalInProgress: MoneyMinor;
  readonly withdrawn: MoneyMinor;
  readonly recoveryOutstanding: MoneyMinor;
}

export interface Withdrawal {
  readonly id: string;
  readonly creatorId: string;
  readonly amount: Money;
  readonly destinationReference: string;
  readonly idempotencyKey: string;
  readonly state: WithdrawalState;
  readonly correlationId: string;
  readonly providerReference?: string;
}

export function money(currency: Currency, minor: MoneyMinor): Money {
  if (minor < 0n) {
    throw new Error('Money minor amount cannot be negative.');
  }

  return Object.freeze({ currency, minor });
}

export function createPaidServiceOrder(input: {
  readonly id: string;
  readonly commerceActionId?: string;
  readonly reservationId?: string;
  readonly contractId?: string;
  readonly creatorId: string;
  readonly customerId: string;
  readonly offeringId: string;
  readonly snapshot: OrderSnapshot;
}): PaidServiceOrder {
  requireText(input.id, 'Order id');
  const sourceCount = [input.commerceActionId, input.reservationId, input.contractId].filter(
    (source) => source !== undefined,
  ).length;
  if (sourceCount !== 1) {
    throw new Error('Order requires exactly one Commerce Action, Reservation or Contract source.');
  }
  if (input.commerceActionId !== undefined) {
    requireText(input.commerceActionId, 'Commerce Action id');
  }
  if (input.reservationId !== undefined) {
    requireText(input.reservationId, 'Reservation id');
  }
  if (input.contractId !== undefined) {
    requireText(input.contractId, 'Contract id');
  }
  requireText(input.creatorId, 'Creator id');
  requireText(input.customerId, 'Customer id');
  requireText(input.offeringId, 'Offering id');
  requireText(input.snapshot.offeringTitle, 'Offering title');
  requireText(input.snapshot.offeringDescription, 'Offering description');
  requireText(input.snapshot.serviceTerms, 'Service terms');

  if (input.snapshot.grossPrice.minor <= 0n) {
    throw new Error('Order gross price must be greater than zero.');
  }

  return Object.freeze({
    ...input,
    snapshot: Object.freeze({
      offeringTitle: input.snapshot.offeringTitle.trim(),
      offeringDescription: input.snapshot.offeringDescription.trim(),
      serviceTerms: input.snapshot.serviceTerms.trim(),
      grossPrice: input.snapshot.grossPrice,
    }),
    state: 'created',
  });
}

export function beginOrderPayment(order: PaidServiceOrder): PaidServiceOrder {
  if (order.state !== 'created') {
    throw new DomainTransitionError('Order', order.state, 'begin payment');
  }

  return Object.freeze({ ...order, state: 'payment_pending' });
}

export function createPayment(input: {
  readonly id: string;
  readonly order: PaidServiceOrder;
  readonly correlationId: string;
}): Payment {
  requireText(input.id, 'Payment id');
  requireText(input.correlationId, 'Payment correlation id');

  if (input.order.state !== 'payment_pending') {
    throw new DomainTransitionError('Order', input.order.state, 'create payment');
  }

  return Object.freeze({
    id: input.id.trim(),
    orderId: input.order.id,
    amount: input.order.snapshot.grossPrice,
    state: 'pending',
    correlationId: input.correlationId.trim(),
  });
}

export function confirmPayment(payment: Payment, providerReference: string): Payment {
  if (payment.state !== 'pending') {
    throw new DomainTransitionError('Payment', payment.state, 'confirm');
  }
  requireText(providerReference, 'Payment provider reference');

  return Object.freeze({
    ...payment,
    state: 'confirmed',
    providerReference: providerReference.trim(),
  });
}

export function failPayment(payment: Payment): Payment {
  if (payment.state !== 'pending') {
    throw new DomainTransitionError('Payment', payment.state, 'fail');
  }

  return Object.freeze({ ...payment, state: 'failed' });
}

export function expirePayment(payment: Payment): Payment {
  if (payment.state !== 'failed') {
    throw new DomainTransitionError('Payment', payment.state, 'expire');
  }

  return Object.freeze({ ...payment, state: 'expired' });
}

export function retryPayment(payment: Payment, correlationId: string): Payment {
  if (payment.state !== 'failed' && payment.state !== 'expired') {
    throw new DomainTransitionError('Payment', payment.state, 'retry');
  }
  requireText(correlationId, 'Payment retry correlation id');

  return Object.freeze({
    id: payment.id,
    orderId: payment.orderId,
    amount: payment.amount,
    state: 'pending',
    correlationId: correlationId.trim(),
  });
}

export function refundPayment(payment: Payment, providerReference: string): Payment {
  if (payment.state !== 'confirmed') {
    throw new DomainTransitionError('Payment', payment.state, 'refund');
  }
  requireText(providerReference, 'Refund provider reference');

  return Object.freeze({
    ...payment,
    state: 'refunded',
    providerReference: providerReference.trim(),
  });
}

export function markOrderPaid(order: PaidServiceOrder, payment: Payment): PaidServiceOrder {
  if (order.state !== 'payment_pending') {
    throw new DomainTransitionError('Order', order.state, 'mark paid');
  }
  if (payment.orderId !== order.id || payment.state !== 'confirmed') {
    throw new Error('Order requires a confirmed Payment for the same Order.');
  }

  return Object.freeze({ ...order, state: 'paid' });
}

export function createPendingFulfillment(input: {
  readonly id: string;
  readonly order: PaidServiceOrder;
  readonly creatorId: string;
  readonly evidenceReference: string;
}): Fulfillment {
  requireText(input.id, 'Fulfillment id');
  requireText(input.creatorId, 'Fulfillment creator id');
  requireText(input.evidenceReference, 'Fulfillment evidence reference');

  if (input.order.state !== 'paid' || input.order.creatorId !== input.creatorId.trim()) {
    throw new Error('Only the owning Creator can create Fulfillment for a paid Order.');
  }

  return Object.freeze({
    id: input.id.trim(),
    orderId: input.order.id,
    creatorId: input.creatorId.trim(),
    state: 'pending',
    evidenceReference: input.evidenceReference.trim(),
  });
}

export function fulfillOrder(
  order: PaidServiceOrder,
  fulfillment: Fulfillment,
  fulfilledAt: string,
): { readonly order: PaidServiceOrder; readonly fulfillment: Fulfillment } {
  if (order.state !== 'paid') {
    throw new DomainTransitionError('Order', order.state, 'fulfill');
  }
  if (fulfillment.orderId !== order.id || fulfillment.creatorId !== order.creatorId) {
    throw new Error('Fulfillment does not belong to this Order and Creator.');
  }
  if (fulfillment.state !== 'pending') {
    throw new DomainTransitionError('Fulfillment', fulfillment.state, 'fulfill');
  }
  requireText(fulfilledAt, 'Fulfillment time');

  return Object.freeze({
    order: Object.freeze({ ...order, state: 'fulfilled' }),
    fulfillment: Object.freeze({
      ...fulfillment,
      state: 'fulfilled',
      fulfilledAt: fulfilledAt.trim(),
    }),
  });
}

export function completePaidServiceOrder(
  order: PaidServiceOrder,
  settlement: Settlement,
): PaidServiceOrder {
  if (order.state !== 'fulfilled' && order.state !== 'pending_resolution') {
    throw new DomainTransitionError('Order', order.state, 'complete');
  }
  if (
    settlement.orderId !== order.id ||
    (settlement.state !== 'released' && settlement.state !== 'resolved')
  ) {
    throw new Error('Order requires a released or resolved Settlement before completion.');
  }

  return Object.freeze({ ...order, state: 'completed' });
}

export function markOrderPendingResolution(order: PaidServiceOrder): PaidServiceOrder {
  if (order.state !== 'fulfilled') {
    throw new DomainTransitionError('Order', order.state, 'open pending resolution');
  }

  return Object.freeze({ ...order, state: 'pending_resolution' });
}

export function refundOrder(order: PaidServiceOrder, payment: Payment): PaidServiceOrder {
  if (payment.orderId !== order.id || payment.state !== 'refunded') {
    throw new Error('Order refund requires the refunded Payment for the same Order.');
  }
  if (
    order.state !== 'paid' &&
    order.state !== 'fulfilled' &&
    order.state !== 'completed' &&
    order.state !== 'pending_resolution'
  ) {
    throw new DomainTransitionError('Order', order.state, 'refund');
  }

  return Object.freeze({ ...order, state: 'refunded' });
}

export function createSettlement(input: {
  readonly id: string;
  readonly order: PaidServiceOrder;
  readonly payment: Payment;
  readonly fulfillment: Fulfillment;
  readonly providerFee: Money;
  readonly platformFee: Money;
  readonly deductions?: Money;
  readonly calculationVersion: string;
}): Settlement {
  requireText(input.id, 'Settlement id');
  requireText(input.calculationVersion, 'Settlement calculation version');

  if (input.order.state !== 'fulfilled') {
    throw new DomainTransitionError('Order', input.order.state, 'settle');
  }
  if (input.payment.orderId !== input.order.id || input.payment.state !== 'confirmed') {
    throw new Error('Settlement requires the Order confirmed Payment.');
  }
  if (input.fulfillment.orderId !== input.order.id || input.fulfillment.state !== 'fulfilled') {
    throw new Error('Settlement requires fulfilled service evidence.');
  }

  const gross = input.order.snapshot.grossPrice;
  const deductions = input.deductions ?? money(gross.currency, 0n);
  assertSameCurrency(gross, input.providerFee, 'Provider fee');
  assertSameCurrency(gross, input.platformFee, 'Platform fee');
  assertSameCurrency(gross, deductions, 'Settlement deductions');

  const totalDeductions = input.providerFee.minor + input.platformFee.minor + deductions.minor;
  if (totalDeductions > gross.minor) {
    throw new Error('Settlement deductions cannot exceed gross order amount.');
  }

  return Object.freeze({
    id: input.id.trim(),
    orderId: input.order.id,
    paymentId: input.payment.id,
    fulfillmentId: input.fulfillment.id,
    creatorId: input.order.creatorId,
    input: Object.freeze({
      gross,
      providerFee: input.providerFee,
      platformFee: input.platformFee,
      deductions,
    }),
    creatorNet: money(gross.currency, gross.minor - totalDeductions),
    state: 'pending',
    calculationVersion: input.calculationVersion.trim(),
  });
}

export function releaseSettlement(settlement: Settlement): Settlement {
  if (settlement.state !== 'pending') {
    throw new DomainTransitionError('Settlement', settlement.state, 'release');
  }

  return Object.freeze({ ...settlement, state: 'released' });
}

export function failSettlement(settlement: Settlement): Settlement {
  if (settlement.state !== 'pending') {
    throw new DomainTransitionError('Settlement', settlement.state, 'fail');
  }

  return Object.freeze({ ...settlement, state: 'failed' });
}

export function resolveSettlement(settlement: Settlement): Settlement {
  if (settlement.state !== 'failed') {
    throw new DomainTransitionError('Settlement', settlement.state, 'resolve');
  }

  return Object.freeze({ ...settlement, state: 'resolved' });
}

export function reverseSettlement(settlement: Settlement): Settlement {
  if (
    settlement.state !== 'pending' &&
    settlement.state !== 'failed' &&
    settlement.state !== 'released' &&
    settlement.state !== 'resolved'
  ) {
    throw new DomainTransitionError('Settlement', settlement.state, 'reverse');
  }

  return Object.freeze({ ...settlement, state: 'reversed' });
}

export function pendingEarningsEntry(input: {
  readonly id: string;
  readonly settlement: Settlement;
  readonly effectiveAt: string;
  readonly correlationId: string;
}): LedgerEntry {
  return createLedgerEntry({
    id: input.id,
    creatorId: input.settlement.creatorId,
    currency: input.settlement.creatorNet.currency,
    minor: input.settlement.creatorNet.minor,
    type: 'pending_earnings_credited',
    effectiveAt: input.effectiveAt,
    orderId: input.settlement.orderId,
    paymentId: input.settlement.paymentId,
    settlementId: input.settlement.id,
    correlationId: input.correlationId,
  });
}

export function settlementReleasedEntry(input: {
  readonly id: string;
  readonly settlement: Settlement;
  readonly effectiveAt: string;
  readonly correlationId: string;
}): LedgerEntry {
  if (input.settlement.state !== 'released' && input.settlement.state !== 'resolved') {
    throw new DomainTransitionError('Settlement', input.settlement.state, 'create release entry');
  }

  return createLedgerEntry({
    id: input.id,
    creatorId: input.settlement.creatorId,
    currency: input.settlement.creatorNet.currency,
    minor: input.settlement.creatorNet.minor,
    type: 'settlement_released',
    effectiveAt: input.effectiveAt,
    orderId: input.settlement.orderId,
    paymentId: input.settlement.paymentId,
    settlementId: input.settlement.id,
    correlationId: input.correlationId,
  });
}

export function settlementReversedEntry(input: {
  readonly id: string;
  readonly settlement: Settlement;
  readonly effectiveAt: string;
  readonly correlationId: string;
}): LedgerEntry {
  if (input.settlement.state !== 'reversed') {
    throw new DomainTransitionError('Settlement', input.settlement.state, 'create reversal entry');
  }

  return createLedgerEntry({
    id: input.id,
    creatorId: input.settlement.creatorId,
    currency: input.settlement.creatorNet.currency,
    minor: input.settlement.creatorNet.minor,
    type: 'settlement_reversed',
    effectiveAt: input.effectiveAt,
    orderId: input.settlement.orderId,
    paymentId: input.settlement.paymentId,
    settlementId: input.settlement.id,
    correlationId: input.correlationId,
  });
}

export function refundDebitedEntry(input: {
  readonly id: string;
  readonly payment: Payment;
  readonly creatorId: string;
  readonly effectiveAt: string;
  readonly correlationId: string;
}): LedgerEntry {
  if (input.payment.state !== 'refunded') {
    throw new DomainTransitionError('Payment', input.payment.state, 'create refund debit entry');
  }

  return createLedgerEntry({
    id: input.id,
    creatorId: input.creatorId,
    currency: input.payment.amount.currency,
    minor: input.payment.amount.minor,
    type: 'refund_debited',
    effectiveAt: input.effectiveAt,
    orderId: input.payment.orderId,
    paymentId: input.payment.id,
    correlationId: input.correlationId,
  });
}

export function createWithdrawal(input: {
  readonly id: string;
  readonly creatorId: string;
  readonly amount: Money;
  readonly destinationReference: string;
  readonly idempotencyKey: string;
  readonly correlationId: string;
  readonly wallet: WalletProjection;
}): Withdrawal {
  requireText(input.id, 'Withdrawal id');
  requireText(input.creatorId, 'Withdrawal creator id');
  requireText(input.destinationReference, 'Withdrawal destination reference');
  requireText(input.idempotencyKey, 'Withdrawal idempotency key');
  requireText(input.correlationId, 'Withdrawal correlation id');
  assertSameCurrency(input.amount, { currency: input.wallet.currency, minor: 0n }, 'Withdrawal');

  if (input.amount.minor <= 0n || input.amount.minor > input.wallet.available) {
    throw new Error('Withdrawal amount must not exceed available earnings.');
  }

  return Object.freeze({
    id: input.id.trim(),
    creatorId: input.creatorId.trim(),
    amount: input.amount,
    destinationReference: input.destinationReference.trim(),
    idempotencyKey: input.idempotencyKey.trim(),
    state: 'requested',
    correlationId: input.correlationId.trim(),
  });
}

export function completeWithdrawal(withdrawal: Withdrawal, providerReference: string): Withdrawal {
  if (withdrawal.state !== 'requested') {
    throw new DomainTransitionError('Withdrawal', withdrawal.state, 'complete');
  }
  requireText(providerReference, 'Withdrawal provider reference');

  return Object.freeze({
    ...withdrawal,
    state: 'completed',
    providerReference: providerReference.trim(),
  });
}

export function failWithdrawal(withdrawal: Withdrawal): Withdrawal {
  if (withdrawal.state !== 'requested') {
    throw new DomainTransitionError('Withdrawal', withdrawal.state, 'fail');
  }

  return Object.freeze({ ...withdrawal, state: 'failed' });
}

export function retryWithdrawal(withdrawal: Withdrawal): Withdrawal {
  if (withdrawal.state !== 'failed') {
    throw new DomainTransitionError('Withdrawal', withdrawal.state, 'retry');
  }

  return Object.freeze({
    id: withdrawal.id,
    creatorId: withdrawal.creatorId,
    amount: withdrawal.amount,
    destinationReference: withdrawal.destinationReference,
    idempotencyKey: withdrawal.idempotencyKey,
    state: 'requested',
    correlationId: withdrawal.correlationId,
  });
}

export function withdrawalReservedEntry(input: {
  readonly id: string;
  readonly withdrawal: Withdrawal;
  readonly orderId: string;
  readonly effectiveAt: string;
}): LedgerEntry {
  if (input.withdrawal.state !== 'requested') {
    throw new DomainTransitionError('Withdrawal', input.withdrawal.state, 'reserve');
  }

  return createLedgerEntry({
    id: input.id,
    creatorId: input.withdrawal.creatorId,
    currency: input.withdrawal.amount.currency,
    minor: input.withdrawal.amount.minor,
    type: 'withdrawal_reserved',
    effectiveAt: input.effectiveAt,
    orderId: input.orderId,
    withdrawalId: input.withdrawal.id,
    correlationId: input.withdrawal.correlationId,
  });
}

export function withdrawalCompletedEntry(input: {
  readonly id: string;
  readonly withdrawal: Withdrawal;
  readonly orderId: string;
  readonly effectiveAt: string;
}): LedgerEntry {
  if (input.withdrawal.state !== 'completed') {
    throw new DomainTransitionError('Withdrawal', input.withdrawal.state, 'record completion');
  }

  return createLedgerEntry({
    id: input.id,
    creatorId: input.withdrawal.creatorId,
    currency: input.withdrawal.amount.currency,
    minor: input.withdrawal.amount.minor,
    type: 'withdrawal_completed',
    effectiveAt: input.effectiveAt,
    orderId: input.orderId,
    withdrawalId: input.withdrawal.id,
    correlationId: input.withdrawal.correlationId,
  });
}

export function withdrawalFailedEntry(input: {
  readonly id: string;
  readonly withdrawal: Withdrawal;
  readonly orderId: string;
  readonly effectiveAt: string;
}): LedgerEntry {
  if (input.withdrawal.state !== 'failed') {
    throw new DomainTransitionError('Withdrawal', input.withdrawal.state, 'record failure');
  }

  return createLedgerEntry({
    id: input.id,
    creatorId: input.withdrawal.creatorId,
    currency: input.withdrawal.amount.currency,
    minor: input.withdrawal.amount.minor,
    type: 'withdrawal_failed',
    effectiveAt: input.effectiveAt,
    orderId: input.orderId,
    withdrawalId: input.withdrawal.id,
    correlationId: input.withdrawal.correlationId,
  });
}

export function projectWallet(
  currency: Currency,
  entries: readonly LedgerEntry[],
): WalletProjection {
  let pending = 0n;
  let available = 0n;
  let restricted = 0n;
  let withdrawalInProgress = 0n;
  let withdrawn = 0n;
  let recoveryOutstanding = 0n;
  const pendingByOrder = new Map<string, MoneyMinor>();

  for (const entry of entries) {
    if (entry.currency !== currency) {
      continue;
    }

    switch (entry.type) {
      case 'pending_earnings_credited':
        pending += entry.minor;
        pendingByOrder.set(entry.orderId, (pendingByOrder.get(entry.orderId) ?? 0n) + entry.minor);
        break;
      case 'settlement_released':
        pending -= debitPendingForOrder(pendingByOrder, entry.orderId, entry.minor);
        {
          const recovered = recoveryOutstanding < entry.minor ? recoveryOutstanding : entry.minor;
          recoveryOutstanding -= recovered;
          available += entry.minor - recovered;
        }
        break;
      case 'earnings_restricted':
        available -= entry.minor;
        restricted += entry.minor;
        break;
      case 'earnings_released':
        restricted -= entry.minor;
        available += entry.minor;
        break;
      case 'refund_debited':
        {
          const pendingDebit = debitPendingForOrder(pendingByOrder, entry.orderId, entry.minor);
          pending -= pendingDebit;
          const remainingDebit = entry.minor - pendingDebit;
          const availableDebit = available < remainingDebit ? available : remainingDebit;
          available -= availableDebit;
          recoveryOutstanding += remainingDebit - availableDebit;
        }
        break;
      case 'settlement_reversed':
        {
          const pendingDebit = debitPendingForOrder(pendingByOrder, entry.orderId, entry.minor);
          pending -= pendingDebit;
          const remainingDebit = entry.minor - pendingDebit;
          const availableDebit = available < remainingDebit ? available : remainingDebit;
          available -= availableDebit;
          recoveryOutstanding += remainingDebit - availableDebit;
        }
        break;
      case 'withdrawal_reserved':
        available -= entry.minor;
        withdrawalInProgress += entry.minor;
        break;
      case 'withdrawal_completed':
        withdrawalInProgress -= entry.minor;
        withdrawn += entry.minor;
        break;
      case 'withdrawal_failed':
        withdrawalInProgress -= entry.minor;
        available += entry.minor;
        break;
    }
  }

  if (
    pending < 0n ||
    available < 0n ||
    restricted < 0n ||
    withdrawalInProgress < 0n ||
    withdrawn < 0n ||
    recoveryOutstanding < 0n
  ) {
    throw new Error('Ledger entries produce an invalid negative Wallet Projection.');
  }

  return Object.freeze({
    currency,
    pending,
    available,
    restricted,
    withdrawalInProgress,
    withdrawn,
    recoveryOutstanding,
  });
}

function debitPendingForOrder(
  pendingByOrder: Map<string, MoneyMinor>,
  orderId: string,
  requested: MoneyMinor,
): MoneyMinor {
  const orderPending = pendingByOrder.get(orderId) ?? 0n;
  const debited = orderPending < requested ? orderPending : requested;
  const remaining = orderPending - debited;
  if (remaining === 0n) {
    pendingByOrder.delete(orderId);
  } else {
    pendingByOrder.set(orderId, remaining);
  }
  return debited;
}

function createLedgerEntry(entry: LedgerEntry): LedgerEntry {
  requireText(entry.id, 'Ledger entry id');
  requireText(entry.creatorId, 'Ledger entry creator id');
  requireText(entry.effectiveAt, 'Ledger entry effective time');
  requireText(entry.orderId, 'Ledger entry order id');
  requireText(entry.correlationId, 'Ledger entry correlation id');

  if (entry.minor < 0n) {
    throw new Error('Ledger entry amount must be non-negative; entry type controls direction.');
  }

  return Object.freeze({ ...entry });
}

function assertSameCurrency(expected: Money, actual: Money, label: string): void {
  if (expected.currency !== actual.currency) {
    throw new Error(`${label} currency must match gross order currency.`);
  }
}

function requireText(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} is required.`);
  }
}
