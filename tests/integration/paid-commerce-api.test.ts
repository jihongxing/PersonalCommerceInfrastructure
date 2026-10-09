import { describe, expect, it } from 'vitest';

import { createApiServer } from '../../apps/api/src/create-api-server.js';

const creatorHeaders = { authorization: 'Bearer test-creator-token' };
const operationsHeaders = { authorization: 'Bearer test-operations-token' };

describe('Paid Commerce API', () => {
  it('runs the local simulation commerce loop through HTTP without real-money facts', async () => {
    const server = await createApiServer();
    const { orderId, actionId } = await createConfirmedOrder(server);

    const scenario = await server.inject({
      method: 'POST',
      url: '/api/v1/operations/simulation/scenario',
      headers: operationsHeaders,
      payload: {
        payment: 'success',
        settlement: 'immediate',
        withdrawal: 'success',
      },
    });
    expect(scenario.statusCode).toBe(200);
    expect(scenario.json()).toMatchObject({
      origin: 'simulation',
      providerId: 'local_commerce_simulator',
    });

    const payment = await server.inject({
      method: 'POST',
      url: `/api/v1/operations/simulation/paid-orders/${orderId}/payment`,
      headers: operationsHeaders,
      payload: {
        amountMinor: '39900',
        currency: 'CNY',
        idempotencyKey: `simulation-payment-${actionId}`,
      },
    });
    expect(payment.statusCode).toBe(200);
    expect(payment.json()).toMatchObject({
      origin: 'simulation',
      processed: [{ receiptStatus: 'accepted', transitioned: true }],
    });

    const fulfillment = await server.inject({
      method: 'POST',
      url: `/api/v1/creator/paid-orders/${orderId}/fulfillment`,
      headers: creatorHeaders,
      payload: { evidenceReference: 'simulation-lesson-completed' },
    });
    expect(fulfillment.statusCode).toBe(200);

    const settlement = await server.inject({
      method: 'POST',
      url: `/api/v1/operations/simulation/paid-orders/${orderId}/settlement`,
      headers: operationsHeaders,
      payload: {
        amountMinor: '35670',
        currency: 'CNY',
        idempotencyKey: `simulation-settlement-${actionId}`,
        providerFeeMinor: '240',
        platformFeeMinor: '3990',
        deductionsMinor: '0',
        calculationVersion: 'simulation-cny-v1',
      },
    });
    expect(settlement.statusCode).toBe(200);
    expect(settlement.json()).toMatchObject({
      origin: 'simulation',
      processed: [{ receiptStatus: 'accepted', transitioned: true }],
    });

    const wallet = await server.inject({
      method: 'GET',
      url: '/api/v1/creator/wallet',
      headers: creatorHeaders,
    });
    expect(wallet.json()).toMatchObject({ availableMinor: '35670' });

    const withdrawalRequest = await server.inject({
      method: 'POST',
      url: '/api/v1/creator/wallet/withdrawals',
      headers: creatorHeaders,
      payload: {
        amountMinor: '35670',
        destinationReference: 'simulation-destination',
        idempotencyKey: `simulation-withdrawal-${actionId}`,
      },
    });
    const withdrawalId = withdrawalRequest.json<{ id: string }>().id;
    const withdrawal = await server.inject({
      method: 'POST',
      url: `/api/v1/operations/simulation/withdrawals/${withdrawalId}`,
      headers: operationsHeaders,
      payload: {
        amountMinor: '35670',
        currency: 'CNY',
        idempotencyKey: `simulation-provider-withdrawal-${actionId}`,
      },
    });
    expect(withdrawal.statusCode).toBe(200);
    expect(withdrawal.json()).toMatchObject({
      origin: 'simulation',
      processed: [{ receiptStatus: 'accepted', transitioned: true }],
    });

    const finalWallet = await server.inject({
      method: 'GET',
      url: '/api/v1/creator/wallet',
      headers: creatorHeaders,
    });
    expect(finalWallet.json()).toMatchObject({
      availableMinor: '0',
      withdrawnMinor: '35670',
    });

    await server.close();
  }, 15_000);

  it('keeps refunds and failed refunds out of completed earnings', async () => {
    const server = await createApiServer();
    const { orderId, actionId } = await createConfirmedOrder(server);

    await configureSimulation(server, { refund: 'before_settlement' });
    await simulatePayment(server, orderId, actionId);

    const refund = await server.inject({
      method: 'POST',
      url: `/api/v1/operations/simulation/paid-orders/${orderId}/refund`,
      headers: operationsHeaders,
      payload: {
        providerReference: `local_commerce_simulator:payment:refund-before-${actionId}`,
        amountMinor: '39900',
        currency: 'CNY',
      },
    });
    expect(refund.statusCode).toBe(200);
    expect(refund.json()).toMatchObject({
      origin: 'simulation',
      processed: [{ receiptStatus: 'accepted', transitioned: true }],
    });

    const status = await server.inject({
      method: 'GET',
      url: '/api/v1/creator/paid-orders',
      headers: creatorHeaders,
    });
    expect(status.json()).toMatchObject({ orders: [{ state: 'refunded' }] });
    const wallet = await server.inject({
      method: 'GET',
      url: '/api/v1/creator/wallet',
      headers: creatorHeaders,
    });
    expect(wallet.json()).toMatchObject({ availableMinor: '0', pendingMinor: '0' });

    const failedRefundOrder = await createConfirmedOrder(server, 'two');
    await configureSimulation(server, { refund: 'failed_refund' });
    await simulatePayment(server, failedRefundOrder.orderId, failedRefundOrder.actionId);
    const failedRefund = await server.inject({
      method: 'POST',
      url: `/api/v1/operations/simulation/paid-orders/${failedRefundOrder.orderId}/refund`,
      headers: operationsHeaders,
      payload: {
        providerReference: `local_commerce_simulator:payment:refund-failed-${failedRefundOrder.actionId}`,
        amountMinor: '39900',
        currency: 'CNY',
      },
    });
    expect(failedRefund.statusCode).toBe(500);
    const failedOrderStatus = await server.inject({
      method: 'GET',
      url: '/api/v1/creator/paid-orders',
      headers: creatorHeaders,
    });
    expect(failedOrderStatus.json()).toMatchObject({
      orders: [{ state: 'refunded' }, { state: 'paid' }],
    });

    await server.close();
  });

  it('reverses released settlement through compensating Ledger entries for a post-settlement refund', async () => {
    const server = await createApiServer();
    const { orderId, actionId } = await createConfirmedOrder(server);

    await configureSimulation(server, {
      payment: 'success',
      settlement: 'immediate',
      refund: 'after_settlement',
    });
    await simulatePayment(server, orderId, actionId);
    await server.inject({
      method: 'POST',
      url: `/api/v1/creator/paid-orders/${orderId}/fulfillment`,
      headers: creatorHeaders,
      payload: { evidenceReference: 'post-settlement-refund-fulfillment' },
    });
    await server.inject({
      method: 'POST',
      url: `/api/v1/operations/simulation/paid-orders/${orderId}/settlement`,
      headers: operationsHeaders,
      payload: {
        amountMinor: '35670',
        currency: 'CNY',
        idempotencyKey: `post-settlement-${actionId}`,
        providerFeeMinor: '240',
        platformFeeMinor: '3990',
        deductionsMinor: '0',
        calculationVersion: 'simulation-cny-v1',
      },
    });
    const walletBeforeRefund = await server.inject({
      method: 'GET',
      url: '/api/v1/creator/wallet',
      headers: creatorHeaders,
    });
    expect(walletBeforeRefund.json()).toMatchObject({ availableMinor: '35670' });

    const refund = await server.inject({
      method: 'POST',
      url: `/api/v1/operations/simulation/paid-orders/${orderId}/refund`,
      headers: operationsHeaders,
      payload: {
        providerReference: `local_commerce_simulator:payment:post-settlement-refund-${actionId}`,
        amountMinor: '39900',
        currency: 'CNY',
      },
    });
    expect(refund.statusCode).toBe(200);
    expect(refund.json()).toMatchObject({
      processed: [{ receiptStatus: 'accepted', transitioned: true }],
    });
    const walletAfterRefund = await server.inject({
      method: 'GET',
      url: '/api/v1/creator/wallet',
      headers: creatorHeaders,
    });
    expect(walletAfterRefund.json()).toMatchObject({ availableMinor: '0' });

    await server.close();
  });

  it('holds delayed settlement pending and rejects duplicate, stale, and conflicting simulation facts', async () => {
    const server = await createApiServer();
    const { orderId, actionId } = await createConfirmedOrder(server);

    await configureSimulation(server, {
      payment: 'duplicate_event',
      settlement: 'delayed',
    });
    const payment = await server.inject({
      method: 'POST',
      url: `/api/v1/operations/simulation/paid-orders/${orderId}/payment`,
      headers: operationsHeaders,
      payload: {
        amountMinor: '39900',
        currency: 'CNY',
        idempotencyKey: `duplicate-payment-${actionId}`,
      },
    });
    expect(payment.statusCode).toBe(200);
    expect(payment.json()).toMatchObject({
      processed: [
        { receiptStatus: 'accepted', transitioned: true },
        { receiptStatus: 'idempotent', transitioned: false },
      ],
    });

    await server.inject({
      method: 'POST',
      url: `/api/v1/creator/paid-orders/${orderId}/fulfillment`,
      headers: creatorHeaders,
      payload: { evidenceReference: 'delayed-settlement-fulfillment' },
    });
    const settlement = await server.inject({
      method: 'POST',
      url: `/api/v1/operations/simulation/paid-orders/${orderId}/settlement`,
      headers: operationsHeaders,
      payload: {
        amountMinor: '35670',
        currency: 'CNY',
        idempotencyKey: `delayed-settlement-${actionId}`,
        providerFeeMinor: '240',
        platformFeeMinor: '3990',
        deductionsMinor: '0',
        calculationVersion: 'simulation-cny-v1',
      },
    });
    expect(settlement.statusCode).toBe(200);
    expect(settlement.json()).toMatchObject({ eventCount: 0, processed: [] });
    const pendingOperation = settlement.json<{ operationProviderReference: string }>();

    const walletBefore = await server.inject({
      method: 'GET',
      url: '/api/v1/creator/wallet',
      headers: creatorHeaders,
    });
    expect(walletBefore.json()).toMatchObject({ availableMinor: '0' });

    const advance = await server.inject({
      method: 'POST',
      url: '/api/v1/operations/simulation/advance',
      headers: operationsHeaders,
      payload: { providerReference: pendingOperation.operationProviderReference },
    });
    expect(advance.statusCode).toBe(200);
    expect(advance.json()).toMatchObject({
      processed: [{ receiptStatus: 'accepted', transitioned: true }],
    });

    await server.close();
  });

  it('keeps failed Settlement in Pending Resolution and credits the Ledger only once after retry', async () => {
    const server = await createApiServer();
    const { orderId, actionId } = await createConfirmedOrder(server, 'settlement-retry');

    await configureSimulation(server, { payment: 'success', settlement: 'failed' });
    await simulatePayment(server, orderId, actionId);
    await server.inject({
      method: 'POST',
      url: `/api/v1/creator/paid-orders/${orderId}/fulfillment`,
      headers: creatorHeaders,
      payload: { evidenceReference: 'settlement-retry-fulfillment' },
    });

    const failed = await simulateSettlement(server, {
      orderId,
      idempotencyKey: `failed-settlement-${actionId}`,
    });
    expect(failed.statusCode).toBe(200);
    expect(failed.json()).toMatchObject({
      processed: [],
    });

    const failedOrders = await server.inject({
      method: 'GET',
      url: '/api/v1/creator/paid-orders',
      headers: creatorHeaders,
    });
    expect(failedOrders.json()).toMatchObject({
      orders: [{ id: orderId, state: 'pending_resolution' }],
    });
    const failedWallet = await server.inject({
      method: 'GET',
      url: '/api/v1/creator/wallet',
      headers: creatorHeaders,
    });
    expect(failedWallet.json()).toMatchObject({
      pendingMinor: '35670',
      availableMinor: '0',
      recoveryOutstandingMinor: '0',
    });

    await configureSimulation(server, { settlement: 'immediate' });
    const retried = await simulateSettlement(server, {
      orderId,
      idempotencyKey: `retry-settlement-${actionId}`,
    });
    expect(retried.statusCode).toBe(200);
    expect(retried.json()).toMatchObject({
      processed: [{ receiptStatus: 'accepted', transitioned: true }],
    });

    const duplicateRetry = await simulateSettlement(server, {
      orderId,
      idempotencyKey: `retry-settlement-${actionId}`,
    });
    expect(duplicateRetry.statusCode).toBe(200);
    expect(duplicateRetry.json()).toMatchObject({ eventCount: 0, processed: [] });

    const conflictRetry = await simulateSettlement(server, {
      orderId,
      idempotencyKey: `conflict-settlement-${actionId}`,
      platformFeeMinor: '4000',
      amountMinor: '35660',
    });
    expect(conflictRetry.statusCode).toBe(409);

    const resolvedWallet = await server.inject({
      method: 'GET',
      url: '/api/v1/creator/wallet',
      headers: creatorHeaders,
    });
    expect(resolvedWallet.json()).toMatchObject({
      pendingMinor: '0',
      availableMinor: '35670',
      recoveryOutstandingMinor: '0',
    });

    await server.close();
  });

  it('projects post-Settlement Refunds into Available and Recovery Obligation without rewriting Withdrawal', async () => {
    const server = await createApiServer();
    const first = await createConfirmedOrder(server, 'recovery-one');
    const second = await createConfirmedOrder(server, 'recovery-two');

    await configureSimulation(server, {
      payment: 'success',
      settlement: 'immediate',
      withdrawal: 'success',
      refund: 'after_settlement',
    });
    await settleSimulatedOrder(server, first.orderId, first.actionId);
    await settleSimulatedOrder(server, second.orderId, second.actionId);

    const sufficientRefund = await simulateRefund(server, first.orderId, first.actionId);
    expect(sufficientRefund.statusCode).toBe(200);
    const sufficientWallet = await server.inject({
      method: 'GET',
      url: '/api/v1/creator/wallet',
      headers: creatorHeaders,
    });
    expect(sufficientWallet.json()).toMatchObject({
      availableMinor: '31440',
      recoveryOutstandingMinor: '0',
    });

    const withdrawalRequest = await server.inject({
      method: 'POST',
      url: '/api/v1/creator/wallet/withdrawals',
      headers: creatorHeaders,
      payload: {
        amountMinor: '31440',
        destinationReference: 'recovery-withdrawal-destination',
        idempotencyKey: 'recovery-withdrawal',
      },
    });
    const withdrawalId = withdrawalRequest.json<{ id: string }>().id;
    await server.inject({
      method: 'POST',
      url: `/api/v1/operations/simulation/withdrawals/${withdrawalId}`,
      headers: operationsHeaders,
      payload: {
        amountMinor: '31440',
        currency: 'CNY',
        idempotencyKey: 'recovery-provider-withdrawal',
      },
    });

    const insufficientRefund = await simulateRefund(server, second.orderId, second.actionId);
    expect(insufficientRefund.statusCode).toBe(200);
    const replayedRefund = await simulateRefund(server, second.orderId, second.actionId);
    expect(replayedRefund.statusCode).toBe(200);
    expect(replayedRefund.json()).toMatchObject({
      processed: [{ receiptStatus: 'idempotent', transitioned: false }],
    });

    const recoveryWallet = await server.inject({
      method: 'GET',
      url: '/api/v1/creator/wallet',
      headers: creatorHeaders,
    });
    expect(recoveryWallet.json()).toMatchObject({
      availableMinor: '0',
      withdrawnMinor: '31440',
      recoveryOutstandingMinor: '39900',
    });

    const third = await createConfirmedOrder(server, 'recovery-three');
    await settleSimulatedOrder(server, third.orderId, third.actionId);
    const recoveringWallet = await server.inject({
      method: 'GET',
      url: '/api/v1/creator/wallet',
      headers: creatorHeaders,
    });
    expect(recoveringWallet.json()).toMatchObject({
      availableMinor: '0',
      withdrawnMinor: '31440',
      recoveryOutstandingMinor: '4230',
    });

    await server.close();
  });

  it('runs a controlled confirmed-request to creator-earnings cycle', async () => {
    const server = await createApiServer();

    await server.inject({
      method: 'POST',
      url: '/api/v1/creator/identity',
      headers: creatorHeaders,
      payload: {
        profile: {
          displayName: 'Dancer One',
          bio: 'Private dance lessons',
          socialLinks: [],
        },
      },
    });
    const capability = await server.inject({
      method: 'POST',
      url: '/api/v1/creator/identity/capabilities',
      headers: creatorHeaders,
      payload: { name: 'Private Dance Lesson', description: 'One-on-one instruction.' },
    });
    const capabilityId = capability.json<{ capabilityIds: readonly string[] }>().capabilityIds[0];
    const offering = await server.inject({
      method: 'POST',
      url: '/api/v1/creator/offerings',
      headers: creatorHeaders,
      payload: {
        capabilityIds: [capabilityId],
        title: 'Private Dance Lesson',
        description: 'One hour of dance instruction.',
        availabilityDescription: 'Weekends by request.',
        requestInstructions: 'Share your preferred time.',
      },
    });
    const offeringId = offering.json<{ id: string }>().id;
    await server.inject({
      method: 'POST',
      url: `/api/v1/creator/offerings/${offeringId}/publish`,
      headers: creatorHeaders,
    });
    const submitted = await server.inject({
      method: 'POST',
      url: `/api/v1/public/offerings/${offeringId}/requests`,
      payload: {
        contactName: 'Customer One',
        contactMethod: 'customer@example.test',
        requestMessage: 'I would like a beginner lesson.',
      },
    });
    const actionId = submitted.json<{ actionId: string }>().actionId;
    await server.inject({
      method: 'POST',
      url: `/api/v1/creator/requests/${actionId}/confirm`,
      headers: creatorHeaders,
    });

    const orderResponse = await server.inject({
      method: 'POST',
      url: '/api/v1/creator/paid-orders',
      headers: creatorHeaders,
      payload: {
        commerceActionId: actionId,
        grossPriceMinor: '39900',
        serviceTerms: 'One 60-minute in-person dance lesson in Shanghai.',
      },
    });
    expect(orderResponse.statusCode).toBe(201);
    expect(orderResponse.json()).toMatchObject({ state: 'payment_pending' });
    const orderId = orderResponse.json<{ id: string }>().id;
    const resultAccessToken = submitted.json<{ resultAccessToken: string }>().resultAccessToken;

    const pendingStatus = await server.inject({
      method: 'GET',
      url: `/api/v1/public/requests/${resultAccessToken}/paid-service-status`,
    });
    expect(pendingStatus.json()).toEqual({
      orderState: 'payment_pending',
      paymentState: 'pending',
    });

    const payment = await server.inject({
      method: 'POST',
      url: `/api/v1/operations/paid-orders/${orderId}/payment-confirmed`,
      headers: operationsHeaders,
      payload: { controlledEvidenceReference: 'controlled-payment-1' },
    });
    expect(payment.statusCode).toBe(200);
    expect(payment.json()).toMatchObject({ state: 'paid' });

    const confirmedStatus = await server.inject({
      method: 'GET',
      url: `/api/v1/public/requests/${resultAccessToken}/paid-service-status`,
    });
    expect(confirmedStatus.json()).toEqual({
      orderState: 'paid',
      paymentState: 'confirmed',
    });

    const fulfillment = await server.inject({
      method: 'POST',
      url: `/api/v1/creator/paid-orders/${orderId}/fulfillment`,
      headers: creatorHeaders,
      payload: { evidenceReference: 'lesson-completed-1' },
    });
    expect(fulfillment.statusCode).toBe(200);
    expect(fulfillment.json()).toMatchObject({ state: 'fulfilled' });

    const settlement = await server.inject({
      method: 'POST',
      url: `/api/v1/operations/paid-orders/${orderId}/settlement-released`,
      headers: operationsHeaders,
      payload: {
        providerFeeMinor: '240',
        platformFeeMinor: '3990',
        calculationVersion: 'vs02-cny-v1',
        controlledEvidenceReference: 'controlled-settlement-1',
      },
    });
    expect(settlement.statusCode).toBe(200);
    expect(settlement.json()).toMatchObject({ state: 'completed' });

    const wallet = await server.inject({
      method: 'GET',
      url: '/api/v1/creator/wallet',
      headers: creatorHeaders,
    });
    expect(wallet.statusCode).toBe(200);
    expect(wallet.json()).toMatchObject({
      currency: 'CNY',
      availableMinor: '35670',
      withdrawalInProgressMinor: '0',
    });

    const withdrawal = await server.inject({
      method: 'POST',
      url: '/api/v1/creator/wallet/withdrawals',
      headers: creatorHeaders,
      payload: {
        amountMinor: '35670',
        destinationReference: 'destination-redacted-1',
        idempotencyKey: 'withdrawal-1',
      },
    });
    expect(withdrawal.statusCode).toBe(201);
    const withdrawalId = withdrawal.json<{ id: string }>().id;

    const completed = await server.inject({
      method: 'POST',
      url: `/api/v1/operations/withdrawals/${withdrawalId}/completed`,
      headers: operationsHeaders,
      payload: { controlledEvidenceReference: 'controlled-withdrawal-1' },
    });
    expect(completed.statusCode).toBe(200);
    expect(completed.json()).toMatchObject({ state: 'completed' });

    const finalWallet = await server.inject({
      method: 'GET',
      url: '/api/v1/creator/wallet',
      headers: creatorHeaders,
    });
    expect(finalWallet.json()).toMatchObject({
      availableMinor: '0',
      withdrawnMinor: '35670',
    });
    await server.close();
  });

  it('shows a controlled payment failure without changing the confirmed Request', async () => {
    const server = await createApiServer();

    await server.inject({
      method: 'POST',
      url: '/api/v1/creator/identity',
      headers: creatorHeaders,
      payload: {
        profile: { displayName: 'Failure Creator', bio: 'Dance lessons', socialLinks: [] },
      },
    });
    const capability = await server.inject({
      method: 'POST',
      url: '/api/v1/creator/identity/capabilities',
      headers: creatorHeaders,
      payload: { name: 'Dance Lesson', description: 'One-to-one lesson.' },
    });
    const offering = await server.inject({
      method: 'POST',
      url: '/api/v1/creator/offerings',
      headers: creatorHeaders,
      payload: {
        capabilityIds: [capability.json<{ capabilityIds: string[] }>().capabilityIds.at(-1)],
        title: 'Failure path lesson',
        description: 'Controlled failure path.',
        availabilityDescription: 'By request.',
        requestInstructions: 'Share your availability.',
      },
    });
    const offeringId = offering.json<{ id: string }>().id;
    await server.inject({
      method: 'POST',
      url: `/api/v1/creator/offerings/${offeringId}/publish`,
      headers: creatorHeaders,
    });
    const submitted = await server.inject({
      method: 'POST',
      url: `/api/v1/public/offerings/${offeringId}/requests`,
      payload: {
        contactName: 'Failure Customer',
        contactMethod: 'failure@example.test',
        requestMessage: 'Please arrange a lesson.',
      },
    });
    const { actionId, resultAccessToken } = submitted.json<{
      actionId: string;
      resultAccessToken: string;
    }>();
    await server.inject({
      method: 'POST',
      url: `/api/v1/creator/requests/${actionId}/confirm`,
      headers: creatorHeaders,
    });
    const order = await server.inject({
      method: 'POST',
      url: '/api/v1/creator/paid-orders',
      headers: creatorHeaders,
      payload: {
        commerceActionId: actionId,
        grossPriceMinor: '39900',
        serviceTerms: 'One controlled lesson.',
      },
    });
    const orderId = order.json<{ id: string }>().id;

    const failed = await server.inject({
      method: 'POST',
      url: `/api/v1/operations/paid-orders/${orderId}/payment-failed`,
      headers: operationsHeaders,
      payload: { controlledEvidenceReference: 'controlled-payment-failed-1' },
    });
    expect(failed.statusCode).toBe(200);
    expect(failed.json()).toMatchObject({ state: 'payment_pending' });

    const status = await server.inject({
      method: 'GET',
      url: `/api/v1/public/requests/${resultAccessToken}/paid-service-status`,
    });
    expect(status.json()).toEqual({
      orderState: 'payment_pending',
      paymentState: 'failed',
    });
    await server.close();
  });

  it('lets the Customer retry a failed local Payment on the same Order', async () => {
    const server = await createApiServer();
    const { orderId, resultAccessToken } = await createConfirmedOrder(server, 'product-retry');

    const checkout = await server.inject({
      method: 'GET',
      url: `/api/v1/local-commerce/requests/${resultAccessToken}/checkout`,
    });
    expect(checkout.statusCode).toBe(200);
    expect(checkout.json()).toMatchObject({
      origin: 'simulation',
      providerId: 'local_commerce_simulator',
      order: { id: orderId, state: 'payment_pending' },
      payment: { state: 'pending' },
    });

    const failed = await server.inject({
      method: 'POST',
      url: `/api/v1/local-commerce/requests/${resultAccessToken}/payment`,
      payload: { scenario: 'failed' },
    });
    expect(failed.statusCode).toBe(200);
    expect(failed.json()).toMatchObject({
      origin: 'simulation',
      processed: [{ receiptStatus: 'accepted', transitioned: true }],
    });

    const failedCheckout = await server.inject({
      method: 'GET',
      url: `/api/v1/local-commerce/requests/${resultAccessToken}/checkout`,
    });
    expect(failedCheckout.json()).toMatchObject({
      order: { id: orderId, state: 'payment_pending' },
      payment: { state: 'failed' },
    });

    const retried = await server.inject({
      method: 'POST',
      url: `/api/v1/local-commerce/requests/${resultAccessToken}/payment`,
      payload: { scenario: 'success' },
    });
    expect(retried.statusCode).toBe(200);
    expect(retried.json()).toMatchObject({
      origin: 'simulation',
      processed: [{ receiptStatus: 'accepted', transitioned: true }],
    });

    const confirmedCheckout = await server.inject({
      method: 'GET',
      url: `/api/v1/local-commerce/requests/${resultAccessToken}/checkout`,
    });
    expect(confirmedCheckout.json()).toMatchObject({
      order: { id: orderId, state: 'paid' },
      payment: { state: 'confirmed' },
    });

    const workspace = await server.inject({
      method: 'GET',
      url: '/api/v1/creator/local-commerce/workspace',
      headers: creatorHeaders,
    });
    expect(workspace.statusCode).toBe(200);
    expect(workspace.json()).toMatchObject({
      origin: 'simulation',
      orders: [
        {
          order: { id: orderId },
          payment: { state: 'confirmed' },
          earningsState: 'not_started',
        },
      ],
    });

    await server.close();
  });

  it('keeps local productization routes absent from an external production composition', async () => {
    const composition = (
      await import('../../adapters/in-memory/creator-identity-composition.js')
    ).createInMemoryCreatorIdentityComposition();
    const server = await createApiServer({
      authContextProvider: composition.authContextProvider,
      creatorIdentityService: composition.service,
      serviceOfferingService: composition.offeringService,
      customerRequestService: composition.customerRequestService,
      operationsAuthContextProvider: composition.operationsAuthContextProvider,
      recordExternalObservation: composition.recordExternalObservation,
      paidCommerceService: composition.paidCommerceService,
      providerWebhookRuntime: composition.providerWebhookRuntime,
    });

    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/local-commerce/requests/not-present/checkout',
    });
    expect(response.statusCode).toBe(404);
    const openapi = await server.inject({ method: 'GET', url: '/openapi.json' });
    expect(openapi.body).not.toContain('/api/v1/local-commerce/requests/');
    expect(openapi.body).not.toContain('/api/v1/creator/local-commerce/workspace');

    await server.close();
  });

  it('retries a failed local product Withdrawal through a new Provider Fact', async () => {
    const server = await createApiServer();
    const { orderId, actionId } = await createConfirmedOrder(server, 'product-withdrawal-retry');
    await configureSimulation(server, { payment: 'success', settlement: 'immediate' });
    await simulatePayment(server, orderId, actionId);
    await server.inject({
      method: 'POST',
      url: `/api/v1/creator/paid-orders/${orderId}/fulfillment`,
      headers: creatorHeaders,
      payload: { evidenceReference: 'product-withdrawal-retry-fulfillment' },
    });
    await simulateSettlement(server, {
      orderId,
      idempotencyKey: 'product-withdrawal-retry-settlement',
    });
    const requested = await server.inject({
      method: 'POST',
      url: '/api/v1/creator/wallet/withdrawals',
      headers: creatorHeaders,
      payload: {
        amountMinor: '35670',
        destinationReference: 'product-withdrawal-retry-destination',
        idempotencyKey: 'product-withdrawal-retry-intent',
      },
    });
    const withdrawalId = requested.json<{ readonly id: string }>().id;

    const failed = await server.inject({
      method: 'POST',
      url: `/api/v1/creator/local-commerce/withdrawals/${withdrawalId}/simulate`,
      headers: creatorHeaders,
      payload: { scenario: 'failed' },
    });
    expect(failed.json()).toMatchObject({
      processed: [{ receiptStatus: 'accepted', transitioned: true }],
    });

    const retried = await server.inject({
      method: 'POST',
      url: `/api/v1/creator/local-commerce/withdrawals/${withdrawalId}/simulate`,
      headers: creatorHeaders,
      payload: { scenario: 'success' },
    });
    expect(retried.json()).toMatchObject({
      processed: [{ receiptStatus: 'accepted', transitioned: true }],
    });
    const workspace = await server.inject({
      method: 'GET',
      url: '/api/v1/creator/local-commerce/workspace',
      headers: creatorHeaders,
    });
    expect(workspace.json()).toMatchObject({
      withdrawals: [{ id: withdrawalId, state: 'completed' }],
    });

    await server.close();
  });

  it('protects the Commercial Pilot Operations Workspace with pilot_operations authorization', async () => {
    const server = await createApiServer();

    const unauthenticated = await server.inject({
      method: 'GET',
      url: '/api/v1/operations/commercial-pilot/workspace',
    });
    expect(unauthenticated.statusCode).toBe(401);

    const creator = await server.inject({
      method: 'GET',
      url: '/api/v1/operations/commercial-pilot/workspace',
      headers: creatorHeaders,
    });
    expect(creator.statusCode).toBe(401);

    const operations = await server.inject({
      method: 'GET',
      url: '/api/v1/operations/commercial-pilot/workspace',
      headers: operationsHeaders,
    });
    expect(operations.statusCode).toBe(200);

    await server.close();
  });

  it('records Manual Resolution without changing the underlying commercial facts', async () => {
    const server = await createApiServer();
    const { orderId } = await createConfirmedOrder(server, 'operations-manual-resolution');

    const before = await server.inject({
      method: 'GET',
      url: `/api/v1/operations/commercial-pilot/orders/${orderId}/evidence`,
      headers: operationsHeaders,
    });
    expect(before.json()).toMatchObject({ payment: { state: 'pending' } });

    const resolution = await server.inject({
      method: 'POST',
      url: '/api/v1/operations/commercial-pilot/resolutions',
      headers: operationsHeaders,
      payload: {
        action: 'manual_resolution',
        targetType: 'order',
        targetId: orderId,
        reason: 'Operator recorded review; no Provider Fact exists.',
      },
    });
    expect(resolution.statusCode).toBe(200);

    const after = await server.inject({
      method: 'GET',
      url: `/api/v1/operations/commercial-pilot/orders/${orderId}/evidence`,
      headers: operationsHeaders,
    });
    expect(after.json()).toMatchObject({
      payment: { state: 'pending' },
      realCommerceEvidence: false,
    });

    const workspace = await server.inject({
      method: 'GET',
      url: '/api/v1/operations/commercial-pilot/workspace',
      headers: operationsHeaders,
    });
    expect(workspace.json()).toMatchObject({
      audit: [
        {
          action: 'manual_resolution',
          targetType: 'order',
          targetId: orderId,
          reason: 'Operator recorded review; no Provider Fact exists.',
        },
      ],
    });

    await server.close();
  });

  it('exports non-sensitive Operations Evidence without withdrawal destination data', async () => {
    const server = await createApiServer();
    const { orderId, actionId } = await createConfirmedOrder(server, 'operations-evidence');
    await configureSimulation(server, { payment: 'success', settlement: 'immediate' });
    await settleSimulatedOrder(server, orderId, actionId);
    const withdrawal = await server.inject({
      method: 'POST',
      url: '/api/v1/creator/wallet/withdrawals',
      headers: creatorHeaders,
      payload: {
        amountMinor: '35670',
        destinationReference: 'sensitive-simulation-destination',
        idempotencyKey: 'operations-evidence-withdrawal',
      },
    });
    expect(withdrawal.statusCode).toBe(201);

    const evidence = await server.inject({
      method: 'GET',
      url: `/api/v1/operations/commercial-pilot/orders/${orderId}/evidence`,
      headers: operationsHeaders,
    });
    expect(evidence.statusCode).toBe(200);
    expect(evidence.body).not.toContain('sensitive-simulation-destination');
    expect(evidence.body).not.toContain('destinationReference');
    expect(evidence.body).not.toContain('idempotencyKey');
    expect(evidence.json()).toMatchObject({
      origin: 'simulation',
      realCommerceEvidence: false,
    });

    await server.close();
  });
});

async function createConfirmedOrder(
  server: Awaited<ReturnType<typeof createApiServer>>,
  suffix = 'one',
) {
  await server.inject({
    method: 'POST',
    url: '/api/v1/creator/identity',
    headers: creatorHeaders,
    payload: {
      profile: {
        displayName: `Dancer ${suffix}`,
        bio: 'Private dance lessons',
        socialLinks: [],
      },
    },
  });
  const capability = await server.inject({
    method: 'POST',
    url: '/api/v1/creator/identity/capabilities',
    headers: creatorHeaders,
    payload: { name: `Private Dance Lesson ${suffix}`, description: 'One-on-one instruction.' },
  });
  const capabilityId = capability.json<{ capabilityIds: readonly string[] }>().capabilityIds[0];
  const offering = await server.inject({
    method: 'POST',
    url: '/api/v1/creator/offerings',
    headers: creatorHeaders,
    payload: {
      capabilityIds: [capabilityId],
      title: `Private Dance Lesson ${suffix}`,
      description: 'One hour of dance instruction.',
      availabilityDescription: 'Weekends by request.',
      requestInstructions: 'Share your preferred time.',
    },
  });
  const offeringId = offering.json<{ id: string }>().id;
  await server.inject({
    method: 'POST',
    url: `/api/v1/creator/offerings/${offeringId}/publish`,
    headers: creatorHeaders,
  });
  const submitted = await server.inject({
    method: 'POST',
    url: `/api/v1/public/offerings/${offeringId}/requests`,
    payload: {
      contactName: `Customer ${suffix}`,
      contactMethod: 'customer@example.test',
      requestMessage: 'I would like a beginner lesson.',
    },
  });
  const { actionId, resultAccessToken } = submitted.json<{
    readonly actionId: string;
    readonly resultAccessToken: string;
  }>();
  await server.inject({
    method: 'POST',
    url: `/api/v1/creator/requests/${actionId}/confirm`,
    headers: creatorHeaders,
  });
  const order = await server.inject({
    method: 'POST',
    url: '/api/v1/creator/paid-orders',
    headers: creatorHeaders,
    payload: {
      commerceActionId: actionId,
      grossPriceMinor: '39900',
      serviceTerms: 'One 60-minute in-person dance lesson in Shanghai.',
    },
  });
  return { actionId, resultAccessToken, orderId: order.json<{ id: string }>().id };
}

async function configureSimulation(
  server: Awaited<ReturnType<typeof createApiServer>>,
  scenario: Record<string, string>,
): Promise<void> {
  const response = await server.inject({
    method: 'POST',
    url: '/api/v1/operations/simulation/scenario',
    headers: operationsHeaders,
    payload: scenario,
  });
  expect(response.statusCode).toBe(200);
}

async function simulatePayment(
  server: Awaited<ReturnType<typeof createApiServer>>,
  orderId: string,
  idempotencyKey: string,
): Promise<void> {
  const response = await server.inject({
    method: 'POST',
    url: `/api/v1/operations/simulation/paid-orders/${orderId}/payment`,
    headers: operationsHeaders,
    payload: {
      amountMinor: '39900',
      currency: 'CNY',
      idempotencyKey: `simulation-payment-${idempotencyKey}`,
    },
  });
  expect(response.statusCode).toBe(200);
}

async function simulateSettlement(
  server: Awaited<ReturnType<typeof createApiServer>>,
  input: {
    readonly orderId: string;
    readonly idempotencyKey: string;
    readonly amountMinor?: string;
    readonly platformFeeMinor?: string;
  },
) {
  return server.inject({
    method: 'POST',
    url: `/api/v1/operations/simulation/paid-orders/${input.orderId}/settlement`,
    headers: operationsHeaders,
    payload: {
      amountMinor: input.amountMinor ?? '35670',
      currency: 'CNY',
      idempotencyKey: input.idempotencyKey,
      providerFeeMinor: '240',
      platformFeeMinor: input.platformFeeMinor ?? '3990',
      deductionsMinor: '0',
      calculationVersion: 'simulation-cny-v1',
    },
  });
}

async function settleSimulatedOrder(
  server: Awaited<ReturnType<typeof createApiServer>>,
  orderId: string,
  actionId: string,
): Promise<void> {
  await simulatePayment(server, orderId, actionId);
  await server.inject({
    method: 'POST',
    url: `/api/v1/creator/paid-orders/${orderId}/fulfillment`,
    headers: creatorHeaders,
    payload: { evidenceReference: `recovery-fulfillment-${actionId}` },
  });
  const settlement = await simulateSettlement(server, {
    orderId,
    idempotencyKey: `recovery-settlement-${actionId}`,
  });
  expect(settlement.statusCode).toBe(200);
}

async function simulateRefund(
  server: Awaited<ReturnType<typeof createApiServer>>,
  orderId: string,
  actionId: string,
) {
  return server.inject({
    method: 'POST',
    url: `/api/v1/operations/simulation/paid-orders/${orderId}/refund`,
    headers: operationsHeaders,
    payload: {
      providerReference: `local_commerce_simulator:payment:refund-${actionId}`,
      amountMinor: '39900',
      currency: 'CNY',
    },
  });
}
