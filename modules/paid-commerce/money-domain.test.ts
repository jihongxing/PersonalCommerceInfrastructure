import { describe, expect, it } from 'vitest';

import {
  beginOrderPayment,
  completeWithdrawal,
  confirmPayment,
  createPaidServiceOrder,
  createPayment,
  createPendingFulfillment,
  createSettlement,
  createWithdrawal,
  failWithdrawal,
  fulfillOrder,
  money,
  pendingEarningsEntry,
  projectWallet,
  refundDebitedEntry,
  refundPayment,
  releaseSettlement,
  settlementReleasedEntry,
  withdrawalCompletedEntry,
  withdrawalFailedEntry,
  withdrawalReservedEntry,
} from './money-domain.js';

const timestamp = '2026-08-14T12:00:00.000Z';

function createPaidFulfilledOrder() {
  const order = beginOrderPayment(
    createPaidServiceOrder({
      id: 'order-1',
      commerceActionId: 'action-1',
      creatorId: 'creator-1',
      customerId: 'customer-1',
      offeringId: 'offering-1',
      snapshot: {
        offeringTitle: '1v1 Dance Lesson',
        offeringDescription: 'A 60 minute dance lesson.',
        serviceTerms: 'Shanghai or online',
        grossPrice: money('CNY', 39_900n),
      },
    }),
  );
  const payment = confirmPayment(
    createPayment({ id: 'payment-1', order, correlationId: 'payment-correlation-1' }),
    'provider-payment-1',
  );
  const paidOrder = { ...order, state: 'paid' as const };
  const fulfillment = createPendingFulfillment({
    id: 'fulfillment-1',
    order: paidOrder,
    creatorId: 'creator-1',
    evidenceReference: 'evidence-1',
  });

  return {
    payment,
    ...fulfillOrder(paidOrder, fulfillment, timestamp),
  };
}

describe('Paid Commerce Money Domain', () => {
  it('creates an immutable paid-service order snapshot and confirmed payment', () => {
    const order = createPaidServiceOrder({
      id: 'order-1',
      commerceActionId: 'action-1',
      creatorId: 'creator-1',
      customerId: 'customer-1',
      offeringId: 'offering-1',
      snapshot: {
        offeringTitle: '1v1 Dance Lesson',
        offeringDescription: 'A 60 minute dance lesson.',
        serviceTerms: 'Shanghai or online',
        grossPrice: money('CNY', 39_900n),
      },
    });
    const payableOrder = beginOrderPayment(order);
    const payment = confirmPayment(
      createPayment({ id: 'payment-1', order: payableOrder, correlationId: 'correlation-1' }),
      'provider-payment-1',
    );

    expect(Object.isFrozen(order)).toBe(true);
    expect(order.snapshot.grossPrice.minor).toBe(39_900n);
    expect(payment.state).toBe('confirmed');
    expect(payment.amount).toEqual(money('CNY', 39_900n));
  });

  it('requires fulfillment before settlement and calculates exact Creator Net Earnings', () => {
    const { order, fulfillment, payment } = createPaidFulfilledOrder();
    const settlement = createSettlement({
      id: 'settlement-1',
      order,
      payment,
      fulfillment,
      providerFee: money('CNY', 120n),
      platformFee: money('CNY', 3_990n),
      calculationVersion: 'v1',
    });

    expect(settlement.creatorNet).toEqual(money('CNY', 35_790n));
    expect(() =>
      createSettlement({
        id: 'invalid-settlement',
        order,
        payment,
        fulfillment,
        providerFee: money('CNY', 39_901n),
        platformFee: money('CNY', 0n),
        calculationVersion: 'v1',
      }),
    ).toThrow('Settlement deductions cannot exceed gross order amount.');
  });

  it('projects Pending and Available earnings only from append-only entries', () => {
    const { order, fulfillment, payment } = createPaidFulfilledOrder();
    const releasedSettlement = releaseSettlement(
      createSettlement({
        id: 'settlement-1',
        order,
        payment,
        fulfillment,
        providerFee: money('CNY', 120n),
        platformFee: money('CNY', 3_990n),
        calculationVersion: 'v1',
      }),
    );
    const pending = pendingEarningsEntry({
      id: 'ledger-1',
      settlement: releasedSettlement,
      effectiveAt: timestamp,
      correlationId: 'settlement-1:pending',
    });
    const released = settlementReleasedEntry({
      id: 'ledger-2',
      settlement: releasedSettlement,
      effectiveAt: timestamp,
      correlationId: 'settlement-1:released',
    });

    expect(projectWallet('CNY', [pending])).toMatchObject({
      pending: 35_790n,
      available: 0n,
    });
    expect(projectWallet('CNY', [pending, released])).toMatchObject({
      pending: 0n,
      available: 35_790n,
    });
  });

  it('reserves earnings for an idempotent withdrawal and restores them if the withdrawal fails', () => {
    const availableWallet = {
      currency: 'CNY' as const,
      pending: 0n,
      available: 35_790n,
      restricted: 0n,
      withdrawalInProgress: 0n,
      withdrawn: 0n,
      recoveryOutstanding: 0n,
    };
    const withdrawal = createWithdrawal({
      id: 'withdrawal-1',
      creatorId: 'creator-1',
      amount: money('CNY', 10_000n),
      destinationReference: 'destination-masked-1',
      idempotencyKey: 'withdrawal-key-1',
      correlationId: 'withdrawal-correlation-1',
      wallet: availableWallet,
    });
    const reserved = withdrawalReservedEntry({
      id: 'ledger-1',
      withdrawal,
      orderId: 'order-1',
      effectiveAt: timestamp,
    });
    const failed = failWithdrawal(withdrawal);
    const failure = withdrawalFailedEntry({
      id: 'ledger-2',
      withdrawal: failed,
      orderId: 'order-1',
      effectiveAt: timestamp,
    });

    const fundedEntries = [
      {
        ...reserved,
        type: 'pending_earnings_credited' as const,
        minor: 35_790n,
        id: 'ledger-pending',
      },
      {
        ...reserved,
        type: 'settlement_released' as const,
        minor: 35_790n,
        id: 'ledger-released',
      },
      reserved,
      failure,
    ];
    expect(projectWallet('CNY', fundedEntries)).toMatchObject({
      available: 35_790n,
      withdrawalInProgress: 0n,
    });
  });

  it('moves reserved earnings into withdrawn only after trusted completion', () => {
    const withdrawal = completeWithdrawal(
      {
        id: 'withdrawal-1',
        creatorId: 'creator-1',
        amount: money('CNY', 10_000n),
        destinationReference: 'destination-masked-1',
        idempotencyKey: 'withdrawal-key-1',
        state: 'requested',
        correlationId: 'withdrawal-correlation-1',
      },
      'provider-withdrawal-1',
    );
    const funding = {
      id: 'ledger-pending',
      creatorId: 'creator-1',
      currency: 'CNY' as const,
      minor: 35_790n,
      type: 'pending_earnings_credited' as const,
      effectiveAt: timestamp,
      orderId: 'order-1',
      correlationId: 'settlement-correlation-1',
    };
    const released = {
      ...funding,
      id: 'ledger-released',
      type: 'settlement_released' as const,
    };
    const reserved = withdrawalReservedEntry({
      id: 'ledger-reserved',
      withdrawal: { ...withdrawal, state: 'requested' },
      orderId: 'order-1',
      effectiveAt: timestamp,
    });
    const completed = withdrawalCompletedEntry({
      id: 'ledger-completed',
      withdrawal,
      orderId: 'order-1',
      effectiveAt: timestamp,
    });

    expect(projectWallet('CNY', [funding, released, reserved, completed])).toMatchObject({
      available: 25_790n,
      withdrawalInProgress: 0n,
      withdrawn: 10_000n,
    });
  });

  it('projects Refund recovery without negative Wallet balances and applies later earnings', () => {
    const payment = refundPayment(
      {
        id: 'payment-refund-1',
        orderId: 'order-refund-1',
        amount: money('CNY', 39_900n),
        state: 'confirmed',
        correlationId: 'payment-refund-correlation',
        providerReference: 'simulation-payment-1',
      },
      'simulation-refund-1',
    );
    const funding = {
      id: 'ledger-funding-1',
      creatorId: 'creator-1',
      currency: 'CNY' as const,
      minor: 35_670n,
      type: 'pending_earnings_credited' as const,
      effectiveAt: timestamp,
      orderId: 'order-refund-1',
      correlationId: 'settlement-refund-1',
    };
    const released = {
      ...funding,
      id: 'ledger-released-1',
      type: 'settlement_released' as const,
    };
    const refund = refundDebitedEntry({
      id: 'ledger-refund-1',
      payment,
      creatorId: 'creator-1',
      effectiveAt: timestamp,
      correlationId: 'refund-payment-refund-1',
    });

    expect(projectWallet('CNY', [funding, released, refund])).toMatchObject({
      available: 0n,
      recoveryOutstanding: 4_230n,
      withdrawn: 0n,
    });

    const laterFunding = {
      ...funding,
      id: 'ledger-funding-2',
      orderId: 'order-later-1',
      correlationId: 'settlement-later-1',
    };
    const laterReleased = {
      ...laterFunding,
      id: 'ledger-released-2',
      type: 'settlement_released' as const,
    };
    expect(
      projectWallet('CNY', [funding, released, refund, laterFunding, laterReleased]),
    ).toMatchObject({
      available: 31_440n,
      recoveryOutstanding: 0n,
    });
  });

  it('does not use another Order pending earnings to absorb a Refund', () => {
    const refundedPayment = refundPayment(
      {
        id: 'payment-refunded-order',
        orderId: 'order-refunded',
        amount: money('CNY', 39_900n),
        state: 'confirmed',
        correlationId: 'payment-refunded-order-correlation',
        providerReference: 'simulation-payment-refunded-order',
      },
      'simulation-refund-refunded-order',
    );
    const refundedOrderFunding = {
      id: 'ledger-refunded-order-pending',
      creatorId: 'creator-1',
      currency: 'CNY' as const,
      minor: 35_670n,
      type: 'pending_earnings_credited' as const,
      effectiveAt: timestamp,
      orderId: 'order-refunded',
      correlationId: 'settlement-refunded-order',
    };
    const refundedOrderRelease = {
      ...refundedOrderFunding,
      id: 'ledger-refunded-order-released',
      type: 'settlement_released' as const,
    };
    const anotherOrderPending = {
      ...refundedOrderFunding,
      id: 'ledger-another-order-pending',
      orderId: 'order-still-pending',
      correlationId: 'settlement-still-pending',
    };
    const refund = refundDebitedEntry({
      id: 'ledger-refund-refunded-order',
      payment: refundedPayment,
      creatorId: 'creator-1',
      effectiveAt: timestamp,
      correlationId: 'refund-refunded-order',
    });

    expect(
      projectWallet('CNY', [
        refundedOrderFunding,
        refundedOrderRelease,
        anotherOrderPending,
        refund,
      ]),
    ).toMatchObject({
      pending: 35_670n,
      available: 0n,
      recoveryOutstanding: 4_230n,
    });
  });
});
