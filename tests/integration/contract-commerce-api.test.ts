import { describe, expect, it } from 'vitest';

import { createApiServer } from '../../apps/api/src/create-api-server.js';

const creatorHeaders = { authorization: 'Bearer test-creator-token' };
const operationsHeaders = { authorization: 'Bearer test-operations-token' };

describe('Contract Commerce API', () => {
  it('runs CON-01 through CON-10 on the existing Request and Money infrastructure', async () => {
    const server = await createApiServer();
    const fixture = await createContractFixture(server, 'contract-main');

    const proposal = await createProposal(server, fixture, {
      deliverables: 'A 45-minute branded stage appearance.',
    });
    expect(proposal.statusCode).toBe(201);
    const proposed = proposal.json<ContractDetails>();
    expect(proposed.contract.state).toBe('proposed');
    expect(proposed.scopeVersion.scope.priceMinor).toBe('39900');

    const publicScope = await server.inject({
      method: 'GET',
      url: `/api/v1/public/contracts/${fixture.resultAccessToken}/scope`,
    });
    expect(publicScope.statusCode).toBe(200);
    expect(publicScope.json<ContractDetails>().scopeVersion.scope).toMatchObject({
      performanceType: 'Brand appearance',
      location: 'Shanghai venue',
      priceMinor: '39900',
    });

    const accepted = await server.inject({
      method: 'POST',
      url: `/api/v1/public/contracts/${fixture.resultAccessToken}/accept`,
    });
    expect(accepted.statusCode).toBe(200);
    const contracted = accepted.json<ContractDetails>();
    expect(contracted.contract.state).toBe('contracted');
    expect(contracted.contract.orderId).toBeDefined();

    const relatedOrder = await server.inject({
      method: 'GET',
      url: `/api/v1/public/contracts/${fixture.resultAccessToken}/order`,
    });
    expect(relatedOrder.statusCode).toBe(200);
    expect(relatedOrder.json<{ readonly orderId: string }>().orderId).toBe(
      contracted.contract.orderId,
    );
    const checkout = await server.inject({
      method: 'GET',
      url: `/api/v1/local-commerce/requests/${fixture.resultAccessToken}/checkout`,
    });
    expect(checkout.statusCode).toBe(200);
    expect(checkout.json()).toMatchObject({
      order: { id: contracted.contract.orderId, state: 'payment_pending' },
      payment: { state: 'pending' },
      origin: 'simulation',
    });

    const repeatedAcceptance = await server.inject({
      method: 'POST',
      url: `/api/v1/public/contracts/${fixture.resultAccessToken}/accept`,
    });
    expect(repeatedAcceptance.statusCode).toBe(200);
    expect(repeatedAcceptance.json<ContractDetails>().contract.orderId).toBe(
      contracted.contract.orderId,
    );

    const orders = await server.inject({
      method: 'GET',
      url: '/api/v1/creator/paid-orders',
      headers: creatorHeaders,
    });
    expect(
      orders
        .json<{ readonly orders: readonly { readonly contractId?: string }[] }>()
        .orders.filter((order) => order.contractId === contracted.contract.id),
    ).toHaveLength(1);

    const payment = await server.inject({
      method: 'POST',
      url: `/api/v1/operations/simulation/paid-orders/${contracted.contract.orderId}/payment`,
      headers: operationsHeaders,
      payload: {
        amountMinor: '39900',
        currency: 'CNY',
        idempotencyKey: `contract-payment-${fixture.suffix}`,
      },
    });
    expect(payment.statusCode).toBe(200);
    expect(payment.json()).toMatchObject({ origin: 'simulation' });

    const fulfillment = await server.inject({
      method: 'POST',
      url: `/api/v1/creator/paid-orders/${contracted.contract.orderId}/fulfillment`,
      headers: creatorHeaders,
      payload: { evidenceReference: `performance-completed-${fixture.suffix}` },
    });
    expect(fulfillment.statusCode).toBe(200);

    const settlement = await server.inject({
      method: 'POST',
      url: `/api/v1/operations/simulation/paid-orders/${contracted.contract.orderId}/settlement`,
      headers: operationsHeaders,
      payload: {
        amountMinor: '35670',
        currency: 'CNY',
        idempotencyKey: `contract-settlement-${fixture.suffix}`,
        providerFeeMinor: '240',
        platformFeeMinor: '3990',
        deductionsMinor: '0',
        calculationVersion: 'contract-simulation-v1',
      },
    });
    expect(settlement.statusCode).toBe(200);
    expect(settlement.json()).toMatchObject({ origin: 'simulation' });

    const wallet = await server.inject({
      method: 'GET',
      url: '/api/v1/creator/wallet',
      headers: creatorHeaders,
    });
    expect(wallet.statusCode).toBe(200);
    expect(wallet.json()).toMatchObject({ availableMinor: '35670' });

    await server.close();
  });

  it('runs CON-11 through CON-19 without creating vertical-specific money facts', async () => {
    const server = await createApiServer();

    const rejectedFixture = await createContractFixture(server, 'contract-rejected');
    expect((await createProposal(server, rejectedFixture)).statusCode).toBe(201);
    const rejected = await server.inject({
      method: 'POST',
      url: `/api/v1/public/contracts/${rejectedFixture.resultAccessToken}/reject`,
    });
    expect(rejected.statusCode).toBe(200);
    expect(rejected.json<ContractDetails>().contract.state).toBe('rejected');

    const creatorCancelledFixture = await createContractFixture(server, 'contract-creator-cancel');
    const creatorProposal = (
      await createProposal(server, creatorCancelledFixture)
    ).json<ContractDetails>();
    const creatorCancelled = await server.inject({
      method: 'POST',
      url: `/api/v1/creator/contracts/${creatorProposal.contract.id}/cancel`,
      headers: creatorHeaders,
    });
    expect(creatorCancelled.statusCode).toBe(200);
    expect(creatorCancelled.json<ContractDetails>().contract).toMatchObject({
      state: 'cancelled',
      cancelledBy: 'creator',
    });

    const buyerCancelledFixture = await createContractFixture(server, 'contract-buyer-cancel');
    expect((await createProposal(server, buyerCancelledFixture)).statusCode).toBe(201);
    const buyerCancelled = await server.inject({
      method: 'POST',
      url: `/api/v1/public/contracts/${buyerCancelledFixture.resultAccessToken}/cancel`,
    });
    expect(buyerCancelled.statusCode).toBe(200);
    expect(buyerCancelled.json<ContractDetails>().contract).toMatchObject({
      state: 'cancelled',
      cancelledBy: 'buyer',
    });

    const immutableFixture = await createContractFixture(server, 'contract-immutable');
    const immutableProposal = await createProposal(server, immutableFixture, {
      deliverables: 'Original staged performance.',
    });
    const beforeOfferingEdit = immutableProposal.json<ContractDetails>();
    const updateOffering = await server.inject({
      method: 'PATCH',
      url: `/api/v1/creator/offerings/${immutableFixture.offeringId}`,
      headers: creatorHeaders,
      payload: {
        capabilityIds: [immutableFixture.capabilityId],
        title: 'Changed offering title',
        description: 'Changed offering description.',
        availabilityDescription: 'Changed availability.',
        requestInstructions: 'Changed request instructions.',
      },
    });
    expect(updateOffering.statusCode).toBe(200);
    const afterOfferingEdit = await server.inject({
      method: 'GET',
      url: `/api/v1/public/contracts/${immutableFixture.resultAccessToken}/scope`,
    });
    expect(afterOfferingEdit.json<ContractDetails>().scopeVersion).toEqual(
      beforeOfferingEdit.scopeVersion,
    );

    const contracted = await server.inject({
      method: 'POST',
      url: `/api/v1/public/contracts/${immutableFixture.resultAccessToken}/accept`,
    });
    expect(contracted.statusCode).toBe(200);
    const cancelledAfterContract = await server.inject({
      method: 'POST',
      url: `/api/v1/public/contracts/${immutableFixture.resultAccessToken}/cancel`,
    });
    expect(cancelledAfterContract.statusCode).toBe(200);
    expect(cancelledAfterContract.json<ContractDetails>().contract.state).toBe('cancelled');

    const createdOrders = await server.inject({
      method: 'GET',
      url: '/api/v1/creator/paid-orders',
      headers: creatorHeaders,
    });
    const contractOrders = createdOrders
      .json<{ readonly orders: readonly { readonly contractId?: string }[] }>()
      .orders.filter((order) => order.contractId !== undefined);
    expect(contractOrders).toHaveLength(1);

    await server.close();
  });
});

interface ContractDetails {
  readonly contract: {
    readonly id: string;
    readonly orderId?: string;
    readonly state: string;
    readonly cancelledBy?: 'creator' | 'buyer';
  };
  readonly scopeVersion: {
    readonly scope: {
      readonly deliverables: string;
      readonly location: string;
      readonly performanceType: string;
      readonly priceMinor: string;
    };
  };
}

async function createContractFixture(
  server: Awaited<ReturnType<typeof createApiServer>>,
  suffix: string,
): Promise<{
  readonly suffix: string;
  readonly actionId: string;
  readonly capabilityId: string;
  readonly offeringId: string;
  readonly resultAccessToken: string;
}> {
  const identity = await server.inject({
    method: 'POST',
    url: '/api/v1/creator/identity',
    headers: creatorHeaders,
    payload: {
      profile: {
        displayName: `Commercial creator ${suffix}`,
        bio: 'Commercial appearances.',
        socialLinks: [],
      },
    },
  });
  expect([201, 409]).toContain(identity.statusCode);

  const capability = await server.inject({
    method: 'POST',
    url: '/api/v1/creator/identity/capabilities',
    headers: creatorHeaders,
    payload: {
      name: `Commercial performance ${suffix}`,
      description: 'Brand appearance.',
    },
  });
  expect(capability.statusCode).toBe(201);
  const capabilityIds = capability.json<{
    readonly capabilityIds: readonly string[];
  }>().capabilityIds;
  const capabilityId = capabilityIds[0];
  if (capabilityId === undefined) {
    throw new Error('Commercial performance capability was not created.');
  }

  const offering = await server.inject({
    method: 'POST',
    url: '/api/v1/creator/offerings',
    headers: creatorHeaders,
    payload: {
      capabilityIds: [capabilityId],
      title: `Commercial appearance ${suffix}`,
      description: 'One commercial performance engagement.',
      availabilityDescription: 'Subject to a confirmed scope.',
      requestInstructions: 'Describe the commercial appearance request.',
    },
  });
  expect(offering.statusCode).toBe(201);
  const offeringId = offering.json<{ readonly id: string }>().id;

  const publish = await server.inject({
    method: 'POST',
    url: `/api/v1/creator/offerings/${offeringId}/publish`,
    headers: creatorHeaders,
  });
  expect(publish.statusCode).toBe(200);

  const request = await server.inject({
    method: 'POST',
    url: `/api/v1/public/offerings/${offeringId}/requests`,
    payload: {
      contactName: `Business buyer ${suffix}`,
      contactMethod: `${suffix}@buyer.example.test`,
      requestMessage: 'We need a branded stage appearance.',
    },
  });
  expect(request.statusCode).toBe(201);
  const result = request.json<{
    readonly actionId: string;
    readonly resultAccessToken: string;
  }>();

  return {
    suffix,
    capabilityId,
    offeringId,
    actionId: result.actionId,
    resultAccessToken: result.resultAccessToken,
  };
}

function createProposal(
  server: Awaited<ReturnType<typeof createApiServer>>,
  fixture: {
    readonly actionId: string;
    readonly suffix: string;
  },
  overrides: Partial<{ readonly deliverables: string }> = {},
) {
  return server.inject({
    method: 'POST',
    url: '/api/v1/creator/contracts/proposals',
    headers: creatorHeaders,
    payload: {
      commerceActionId: fixture.actionId,
      proposalExpiresAt: '2026-09-01T00:00:00.000Z',
      scope: {
        performanceType: 'Brand appearance',
        performanceDate: '2026-09-10T12:00:00.000Z',
        location: 'Shanghai venue',
        durationMinutes: 45,
        creatorHeadcount: 4,
        deliverables: overrides.deliverables ?? 'A branded stage appearance.',
        priceMinor: '39900',
        currency: 'CNY',
        cancellationTerms: 'Cancellation follows the agreed scope.',
        fulfillmentCriteria: 'Performance completed at the agreed date and location.',
      },
    },
  });
}
