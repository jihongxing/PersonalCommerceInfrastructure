import { expect, test, type Page } from '@playwright/test';

const apiBaseUrl = 'http://127.0.0.1:45100';
const creatorHeaders = { authorization: 'Bearer test-creator-token' };
const otherCreatorHeaders = { authorization: 'Bearer test-other-creator-token' };
const operationsHeaders = { authorization: 'Bearer test-operations-token' };

test('OPS-01 views a complete Order to Payment to Settlement to Earnings chain', async ({
  page,
}) => {
  const order = await createSettledOrder(page, 'ops-complete-chain');
  await openOperations(page);

  const card = page.getByTestId(`operations-order-${order.orderId}`);
  await expect(card).toContainText('Fact Source: simulation');
  await expect(card.getByTestId('operations-payment-state')).toContainText('confirmed');
  await expect(card.getByTestId('operations-settlement-state')).toContainText('released');
  await expect(card.getByTestId('operations-settlement-fees')).toContainText('Creator Net 35670');
  await expect(card.getByTestId('operations-ledger-entries')).toContainText('settlement_released');
  await expect(card.getByTestId('operations-canonical-events')).toContainText('payment_confirmed');
});

test('OPS-02 shows Settlement Failed as Pending Resolution', async ({ page }) => {
  const order = await createPaidFulfilledOrder(page, 'ops-settlement-failed');
  await simulateSettlement(page, order.orderId, 'failed');
  await openOperations(page);

  const card = page.getByTestId(`operations-order-${order.orderId}`);
  await expect(card.getByTestId('operations-settlement-state')).toContainText('failed');
  await expect(card).toContainText('pending_resolution');
  await expect(card).toContainText('available 0');
});

test('OPS-03 retries failed Settlement once and keeps Ledger credit idempotent', async ({
  page,
}) => {
  const order = await createPaidFulfilledOrder(page, 'ops-settlement-retry');
  await simulateSettlement(page, order.orderId, 'failed');
  await openOperations(page);
  await page.getByLabel('操作原因').fill('Retry after simulated settlement failure');
  const card = page.getByTestId(`operations-order-${order.orderId}`);
  await card.getByRole('button', { name: '受控重试 Settlement' }).click();
  await expect(card.getByTestId('operations-settlement-state')).toContainText('resolved');
  await expect(card.getByTestId('operations-ledger-entries')).toContainText('settlement_released');

  const firstEvidence = await exportEvidence(order.orderId);
  expect(
    firstEvidence.ledgerEntries.filter((entry) => entry.type === 'settlement_released'),
  ).toHaveLength(1);
  const duplicateRetry = await page.request.post(
    `${apiBaseUrl}/api/v1/operations/commercial-pilot/orders/${order.orderId}/retry-settlement`,
    { headers: operationsHeaders, data: { reason: 'Duplicate retry must not credit again' } },
  );
  expect(duplicateRetry.ok()).toBe(false);
  const secondEvidence = await exportEvidence(order.orderId);
  expect(
    secondEvidence.ledgerEntries.filter((entry) => entry.type === 'settlement_released'),
  ).toHaveLength(1);
});

test('OPS-04 shows Recovery Outstanding after a post-Settlement Refund', async ({ page }) => {
  const order = await createSettledOrder(page, 'ops-recovery', otherCreatorHeaders);
  await withdrawAllAvailable(page, 'ops-recovery-withdraw', otherCreatorHeaders);
  await simulateRefund(page, order.orderId, otherCreatorHeaders);
  await openOperations(page);

  const card = page.getByTestId(`operations-order-${order.orderId}`);
  await expect(card).toContainText('recovery_outstanding');
  await expect(card).toContainText('recovery 39900');
});

test('OPS-05 views failed Withdrawal and safely retries through existing use cases', async ({
  page,
}) => {
  const order = await createSettledOrder(page, 'ops-withdrawal-retry');
  const availableMinor = await readAvailableWallet(page);
  expect(BigInt(availableMinor)).toBeGreaterThan(0n);
  const withdrawalId = await requestWithdrawal(page, availableMinor, 'ops-withdrawal-retry');
  await simulateWithdrawal(page, withdrawalId, 'failed');
  await openOperations(page);
  await page.getByLabel('操作原因').fill('Retry failed simulated withdrawal');

  const withdrawal = page.getByTestId(`operations-withdrawal-${withdrawalId}`);
  await expect(withdrawal).toContainText('failed');
  const retryResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith(`/commercial-pilot/withdrawals/${withdrawalId}/retry`) &&
      response.request().method() === 'POST',
  );
  await withdrawal.getByRole('button', { name: '受控重试 Withdrawal' }).click();
  const retryResponse = await retryResponsePromise;
  expect(retryResponse.ok(), JSON.stringify(await retryResponse.json())).toBe(true);
  await expect(page.getByTestId(`operations-order-${order.orderId}`)).toContainText('completed');
});

test('OPS-06 identifies duplicate Provider Events without creating new money facts', async ({
  page,
}) => {
  const order = await createConfirmedOrder(page, 'ops-duplicate-fact');
  await simulatePayment(page, order.resultAccessToken, 'duplicate_event');
  await openOperations(page);

  const card = page.getByTestId(`operations-order-${order.orderId}`);
  await expect(card).toContainText('duplicate_fact');
  const evidence = await exportEvidence(order.orderId);
  expect(
    evidence.canonicalEvents.filter((event) => event.name === 'payment_confirmed'),
  ).toHaveLength(1);
});

test('OPS-07 unknown source cannot be manually marked as Payment Success', async ({ page }) => {
  const order = await createConfirmedOrder(page, 'ops-unknown-source');
  await openOperations(page);
  await page.getByLabel('操作原因').fill('Operator reviewed missing Provider source');
  const card = page.getByTestId(`operations-order-${order.orderId}`);
  await expect(card).toContainText('Fact Source: unknown');
  await card.getByRole('button', { name: '记录 Operations Resolution' }).click();
  await expect(card.getByTestId('operations-payment-state')).toContainText('pending');
  await expect(page.getByText('manual_resolution', { exact: false })).toBeVisible();
});

test('OPS-08 Simulation Evidence is labeled and excluded from real commerce evidence', async ({
  page,
}) => {
  const order = await createSettledOrder(page, 'ops-simulation-evidence');
  const evidence = await exportEvidence(order.orderId);

  expect(evidence.origin).toBe('simulation');
  expect(evidence.providerId).toBe('local_commerce_simulator');
  expect(evidence.realCommerceEvidence).toBe(false);
  expect(JSON.stringify(evidence)).not.toContain('apiCredential');
  expect(JSON.stringify(evidence)).not.toContain('webhookSecret');
});

async function openOperations(page: Page): Promise<void> {
  await page.goto('/operations');
  await page.getByLabel('Pilot Operations 访问令牌').fill('test-operations-token');
  await page.getByRole('button', { name: '加载 Operations Workspace' }).click();
  await expect(page.getByText('Operations Workspace 已加载。')).toBeVisible();
}

async function createSettledOrder(
  page: Page,
  suffix: string,
  headers: Readonly<Record<string, string>> = creatorHeaders,
) {
  const order = await createPaidFulfilledOrder(page, suffix, headers);
  await simulateSettlement(page, order.orderId, 'immediate', headers);
  return order;
}

async function createPaidFulfilledOrder(
  page: Page,
  suffix: string,
  headers: Readonly<Record<string, string>> = creatorHeaders,
) {
  const order = await createConfirmedOrder(page, suffix, headers);
  await simulatePayment(page, order.resultAccessToken, 'success');
  const response = await page.request.post(
    `${apiBaseUrl}/api/v1/creator/paid-orders/${order.orderId}/fulfillment`,
    {
      headers,
      data: { evidenceReference: `${suffix}-fulfillment-evidence` },
    },
  );
  expect(response.ok()).toBe(true);
  return order;
}

async function simulatePayment(
  page: Page,
  resultAccessToken: string,
  scenario: 'success' | 'duplicate_event',
): Promise<void> {
  const response = await page.request.post(
    `${apiBaseUrl}/api/v1/local-commerce/requests/${resultAccessToken}/payment`,
    { data: { scenario } },
  );
  expect(response.ok()).toBe(true);
}

async function simulateSettlement(
  page: Page,
  orderId: string,
  scenario: 'immediate' | 'failed',
  headers: Readonly<Record<string, string>> = creatorHeaders,
): Promise<void> {
  const response = await page.request.post(
    `${apiBaseUrl}/api/v1/creator/local-commerce/orders/${orderId}/settlement`,
    { headers, data: { scenario } },
  );
  expect(response.ok()).toBe(true);
}

async function simulateRefund(
  page: Page,
  orderId: string,
  headers: Readonly<Record<string, string>> = creatorHeaders,
): Promise<void> {
  const response = await page.request.post(
    `${apiBaseUrl}/api/v1/creator/local-commerce/orders/${orderId}/refund`,
    { headers, data: { scenario: 'after_settlement' } },
  );
  expect(response.ok()).toBe(true);
}

async function requestWithdrawal(
  page: Page,
  amountMinor: string,
  suffix: string,
  headers: Readonly<Record<string, string>> = creatorHeaders,
): Promise<string> {
  const response = await page.request.post(`${apiBaseUrl}/api/v1/creator/wallet/withdrawals`, {
    headers,
    data: {
      amountMinor,
      destinationReference: `simulation-destination-${suffix}`,
      idempotencyKey: `simulation-withdrawal-${suffix}-${Date.now()}`,
    },
  });
  expect(response.ok()).toBe(true);
  return ((await response.json()) as { readonly id: string }).id;
}

async function simulateWithdrawal(
  page: Page,
  withdrawalId: string,
  scenario: 'success' | 'failed',
  headers: Readonly<Record<string, string>> = creatorHeaders,
): Promise<void> {
  const response = await page.request.post(
    `${apiBaseUrl}/api/v1/creator/local-commerce/withdrawals/${withdrawalId}/simulate`,
    { headers, data: { scenario } },
  );
  expect(response.ok()).toBe(true);
}

async function withdrawAllAvailable(
  page: Page,
  suffix: string,
  headers: Readonly<Record<string, string>> = creatorHeaders,
): Promise<void> {
  const withdrawalId = await requestWithdrawal(
    page,
    await readAvailableWallet(page, headers),
    suffix,
    headers,
  );
  await simulateWithdrawal(page, withdrawalId, 'success', headers);
}

async function readAvailableWallet(
  page: Page,
  headers: Readonly<Record<string, string>> = creatorHeaders,
): Promise<string> {
  const walletResponse = await page.request.get(`${apiBaseUrl}/api/v1/creator/wallet`, {
    headers,
  });
  expect(walletResponse.ok()).toBe(true);
  return ((await walletResponse.json()) as { readonly availableMinor: string }).availableMinor;
}

async function exportEvidence(orderId: string) {
  const response = await fetch(
    `${apiBaseUrl}/api/v1/operations/commercial-pilot/orders/${orderId}/evidence`,
    { headers: operationsHeaders },
  );
  expect(response.ok).toBe(true);
  return (await response.json()) as {
    readonly origin: string;
    readonly providerId?: string;
    readonly realCommerceEvidence: boolean;
    readonly ledgerEntries: readonly { readonly type: string }[];
    readonly canonicalEvents: readonly { readonly name: string }[];
  };
}

async function createConfirmedOrder(
  page: Page,
  suffix: string,
  headers: Readonly<Record<string, string>> = creatorHeaders,
) {
  const unique = `${suffix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const identityResponse = await page.request.post(`${apiBaseUrl}/api/v1/creator/identity`, {
    headers,
    data: {
      profile: {
        displayName: `VS-02H Creator ${unique}`,
        bio: 'Commercial Pilot Operations acceptance identity',
        socialLinks: [],
      },
    },
  });
  expect([201, 409]).toContain(identityResponse.status());
  const capabilityResponse = await page.request.post(
    `${apiBaseUrl}/api/v1/creator/identity/capabilities`,
    {
      headers,
      data: {
        name: `VS-02H Capability ${unique}`,
        description: 'Commercial Pilot Operations capability',
      },
    },
  );
  const capability = (await capabilityResponse.json()) as {
    readonly capabilityIds: readonly string[];
  };
  const offeringResponse = await page.request.post(`${apiBaseUrl}/api/v1/creator/offerings`, {
    headers,
    data: {
      capabilityIds: [capability.capabilityIds.at(-1) as string],
      title: `VS-02H Offering ${unique}`,
      description: 'Commercial Pilot Operations acceptance offering',
      availabilityDescription: 'Available in controlled simulation',
      requestInstructions: 'Submit a commercial pilot request',
    },
  });
  const offering = (await offeringResponse.json()) as { readonly id: string };
  expect(
    (
      await page.request.post(`${apiBaseUrl}/api/v1/creator/offerings/${offering.id}/publish`, {
        headers,
      })
    ).ok(),
  ).toBe(true);
  const requestResponse = await page.request.post(
    `${apiBaseUrl}/api/v1/public/offerings/${offering.id}/requests`,
    {
      data: {
        contactName: `VS-02H Customer ${unique}`,
        contactMethod: `${unique}@example.test`,
        requestMessage: 'Create a commercial pilot operations scenario.',
      },
    },
  );
  const request = (await requestResponse.json()) as {
    readonly actionId: string;
    readonly resultAccessToken: string;
  };
  expect(
    (
      await page.request.post(`${apiBaseUrl}/api/v1/creator/requests/${request.actionId}/confirm`, {
        headers,
      })
    ).ok(),
  ).toBe(true);
  const orderResponse = await page.request.post(`${apiBaseUrl}/api/v1/creator/paid-orders`, {
    headers,
    data: {
      commerceActionId: request.actionId,
      grossPriceMinor: '39900',
      serviceTerms: 'One 60-minute controlled commercial pilot service.',
    },
  });
  const order = (await orderResponse.json()) as { readonly id: string };
  return { orderId: order.id, resultAccessToken: request.resultAccessToken };
}
