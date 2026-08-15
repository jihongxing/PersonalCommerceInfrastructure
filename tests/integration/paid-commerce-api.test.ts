import { describe, expect, it } from 'vitest';

import { createApiServer } from '../../apps/api/src/create-api-server.js';

const creatorHeaders = { authorization: 'Bearer test-creator-token' };
const operationsHeaders = { authorization: 'Bearer test-operations-token' };

describe('Paid Commerce API', () => {
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
});
