import { expect, test, type Page } from '@playwright/test';

const apiBaseUrl = 'http://127.0.0.1:41000';
const creatorHeaders = { authorization: 'Bearer test-creator-token' };

test('AT-VS02F-01 Customer completes Local Checkout with Payment Success', async ({ page }) => {
  const order = await createConfirmedOrder(page, 'checkout-success');

  await openCheckout(page, order.resultAccessToken);
  await page.getByTestId('simulation-payment-scenario').selectOption('success');
  await page.getByTestId('simulate-payment').click();

  await expect(page.getByTestId('checkout-order-state')).toContainText('paid');
  await expect(page.getByTestId('checkout-payment-state')).toContainText('confirmed');
  await expect(page.getByTestId('simulation-environment-notice')).toContainText(
    'Simulation / Test Environment',
  );
});

test('AT-VS02F-02 failed Payment retries to Success on the same Order', async ({ page }) => {
  const order = await createConfirmedOrder(page, 'payment-retry');

  await openCheckout(page, order.resultAccessToken);
  await page.getByTestId('simulation-payment-scenario').selectOption('failed');
  await page.getByTestId('simulate-payment').click();
  await expect(page.getByTestId('checkout-payment-state')).toContainText('failed');

  await page.getByTestId('simulation-payment-scenario').selectOption('success');
  await page.getByTestId('simulate-payment').click();
  await expect(page.getByTestId('checkout-payment-state')).toContainText('confirmed');
  await expect(page.getByTestId('checkout-order-state')).toContainText('paid');
});

test('AT-VS02F-03 delayed Settlement stays Pending then becomes Available', async ({ page }) => {
  const walletBefore = await readWallet(page);
  const order = await createConfirmedOrder(page, 'settlement-delayed');
  await paySuccess(page, order.resultAccessToken);
  await fulfillOrder(page, order.orderId, 'delayed settlement fulfillment');

  await page.getByLabel('Settlement Scenario').selectOption('delayed');
  await page
    .getByTestId(`creator-order-${order.orderId}`)
    .getByRole('button', { name: 'Run Simulated Settlement' })
    .click();
  await expect(page.getByTestId(`settlement-state-${order.orderId}`)).toContainText('pending');
  await expect(page.getByTestId(`earnings-state-${order.orderId}`)).toContainText('pending');
  await expect(page.getByTestId('wallet-available')).toContainText(walletBefore.availableMinor);

  await page
    .getByTestId(`creator-order-${order.orderId}`)
    .getByRole('button', { name: 'Deliver Delayed Settlement Fact' })
    .click();
  await expect(page.getByTestId(`settlement-state-${order.orderId}`)).toContainText('released');
  await expect(page.getByTestId(`earnings-state-${order.orderId}`)).toContainText('available');
  await expect(page.getByTestId('wallet-available')).toContainText(
    String(BigInt(walletBefore.availableMinor) + 35670n),
  );
});

test('AT-VS02F-04 Fulfillment and Settlement complete the Order', async ({ page }) => {
  const order = await createConfirmedOrder(page, 'fulfillment-completed');
  await paySuccess(page, order.resultAccessToken);
  await fulfillOrder(page, order.orderId, 'completed service evidence');
  await settleOrder(page, order.orderId, 'immediate');

  await expect(page.getByTestId(`fulfillment-state-${order.orderId}`)).toContainText('fulfilled');
  await expect(page.getByTestId(`order-state-${order.orderId}`)).toContainText('completed');
});

test('AT-VS02F-05 Creator sees fee trace and Ledger-projected Wallet', async ({ page }) => {
  const walletBefore = await readWallet(page);
  const order = await createSettledOrder(page, 'earnings-wallet');

  await expect(page.getByTestId(`fee-trace-${order.orderId}`)).toContainText('Fee Trace');
  await expect(page.getByTestId(`fee-trace-${order.orderId}`)).toContainText('CNY ¥399.00');
  await expect(page.getByTestId(`fee-trace-${order.orderId}`)).toContainText(
    'Creator Net CNY ¥356.70',
  );
  await expect(page.getByTestId('wallet-available')).toContainText(
    String(BigInt(walletBefore.availableMinor) + 35670n),
  );
  await expect(page.getByTestId('creator-wallet-notice')).toContainText('Earnings Ledger');
});

test('AT-VS02F-06 Creator completes a simulated Withdrawal', async ({ page }) => {
  await createSettledOrder(page, 'withdrawal-success');
  const walletBefore = await readWallet(page);
  const withdrawalId = await requestWithdrawal(page, '35670', 'withdrawal-success');

  await page.getByLabel('Withdrawal Scenario').selectOption('success');
  await page
    .getByTestId(`withdrawal-${withdrawalId}`)
    .getByRole('button', { name: 'Run Simulated Withdrawal' })
    .click();

  await expect(page.getByTestId(`withdrawal-state-${withdrawalId}`)).toContainText('completed');
  await expect(page.getByTestId('wallet-withdrawn')).toContainText(
    String(BigInt(walletBefore.withdrawnMinor) + 35670n),
  );
});

test('AT-VS02F-07 failed Withdrawal safely retries', async ({ page }) => {
  await createSettledOrder(page, 'withdrawal-retry');
  const walletBefore = await readWallet(page);
  const withdrawalId = await requestWithdrawal(page, '35670', 'withdrawal-retry');

  await page.getByLabel('Withdrawal Scenario').selectOption('failed');
  await page
    .getByTestId(`withdrawal-${withdrawalId}`)
    .getByRole('button', { name: 'Run Simulated Withdrawal' })
    .click();
  await expect(page.getByTestId(`withdrawal-state-${withdrawalId}`)).toContainText('failed');
  await expect(page.getByTestId('wallet-available')).toContainText(walletBefore.availableMinor);

  await page.getByLabel('Withdrawal Scenario').selectOption('success');
  const retryResponse = page.waitForResponse(
    (response) =>
      response
        .url()
        .endsWith(`/api/v1/creator/local-commerce/withdrawals/${withdrawalId}/simulate`) &&
      response.request().method() === 'POST',
  );
  await page
    .getByTestId(`withdrawal-${withdrawalId}`)
    .getByRole('button', { name: 'Retry Simulated Withdrawal' })
    .click();
  const retryResult = (await (await retryResponse).json()) as {
    readonly processed: readonly {
      readonly receiptStatus: string;
      readonly reason?: string;
      readonly transitioned: boolean;
    }[];
  };
  expect(retryResult.processed).toEqual([{ receiptStatus: 'accepted', transitioned: true }]);
  await expect(page.getByTestId(`withdrawal-state-${withdrawalId}`)).toContainText('completed');
});

test('AT-VS02F-08 Settlement Failure enters Pending Resolution with zero Available', async ({
  page,
}) => {
  const walletBefore = await readWallet(page);
  const order = await createConfirmedOrder(page, 'settlement-failure');
  await paySuccess(page, order.resultAccessToken);
  await fulfillOrder(page, order.orderId, 'failed settlement fulfillment');
  await settleOrder(page, order.orderId, 'failed');

  await expect(page.getByTestId(`order-state-${order.orderId}`)).toContainText(
    'pending_resolution',
  );
  await expect(page.getByTestId(`settlement-state-${order.orderId}`)).toContainText('failed');
  await expect(page.getByTestId(`earnings-state-${order.orderId}`)).toContainText(
    'pending_resolution',
  );
  await expect(page.getByTestId('wallet-available')).toContainText(walletBefore.availableMinor);
});

test('AT-VS02F-09 post-Settlement Refund creates Recovery Outstanding', async ({ page }) => {
  await withdrawAllAvailable(page, 'refund-recovery-baseline');
  const walletBefore = await readWallet(page);
  const order = await createSettledOrder(page, 'refund-recovery');

  await page.getByLabel('Refund Scenario').selectOption('after_settlement');
  const refundResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith(`/api/v1/creator/local-commerce/orders/${order.orderId}/refund`) &&
      response.request().method() === 'POST',
  );
  await page
    .getByTestId(`creator-order-${order.orderId}`)
    .getByRole('button', { name: 'Run Simulated Refund' })
    .click();
  expect((await refundResponse).ok()).toBe(true);

  await expect(page.getByTestId(`order-state-${order.orderId}`)).toContainText('refunded');
  await expect(page.getByTestId('wallet-available')).toContainText(walletBefore.availableMinor);
  await expect(page.getByTestId('wallet-recovery')).toContainText(
    String(BigInt(walletBefore.recoveryOutstandingMinor) + 4230n),
  );
});

test('AT-VS02F-10 later Earnings automatically reduce Recovery Outstanding', async ({ page }) => {
  await withdrawAllAvailable(page, 'recovery-offset-baseline');
  const walletBefore = await readWallet(page);
  const refunded = await createSettledOrder(page, 'recovery-source');
  await page.getByLabel('Refund Scenario').selectOption('after_settlement');
  const refundResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith(`/api/v1/creator/local-commerce/orders/${refunded.orderId}/refund`) &&
      response.request().method() === 'POST',
  );
  await page
    .getByTestId(`creator-order-${refunded.orderId}`)
    .getByRole('button', { name: 'Run Simulated Refund' })
    .click();
  expect((await refundResponse).ok()).toBe(true);
  await expect(page.getByTestId('wallet-recovery')).toContainText(
    String(BigInt(walletBefore.recoveryOutstandingMinor) + 4230n),
  );

  await createSettledOrder(page, 'recovery-offset');
  const recoveryAfterRefund = BigInt(walletBefore.recoveryOutstandingMinor) + 4230n;
  const recoveryAfterSubsequentEarnings =
    recoveryAfterRefund > 35670n ? recoveryAfterRefund - 35670n : 0n;
  const availableAfterSubsequentEarnings =
    35670n > recoveryAfterRefund ? 35670n - recoveryAfterRefund : 0n;
  await expect(page.getByTestId('wallet-recovery')).toContainText(
    String(recoveryAfterSubsequentEarnings),
  );
  await expect(page.getByTestId('wallet-available')).toContainText(
    String(BigInt(walletBefore.availableMinor) + availableAfterSubsequentEarnings),
  );
});

test('AT-VS02F-11 duplicate Simulation Event remains idempotent', async ({ page }) => {
  const order = await createConfirmedOrder(page, 'duplicate-event');

  await openCheckout(page, order.resultAccessToken);
  await page.getByTestId('simulation-payment-scenario').selectOption('duplicate_event');
  await page.getByTestId('simulate-payment').click();

  await expect(page.getByTestId('checkout-payment-state')).toContainText('confirmed');
  await expect(page.getByTestId('checkout-order-state')).toContainText('paid');
});

test('AT-VS02F-12 out-of-order Simulation Event converges safely', async ({ page }) => {
  const order = await createConfirmedOrder(page, 'out-of-order-event');

  await openCheckout(page, order.resultAccessToken);
  await page.getByTestId('simulation-payment-scenario').selectOption('out_of_order_event');
  await page.getByTestId('simulate-payment').click();

  await expect(page.getByTestId('checkout-payment-state')).toContainText('confirmed');
  await expect(page.getByTestId('checkout-order-state')).toContainText('paid');
});

async function createSettledOrder(page: Page, suffix: string) {
  const order = await createConfirmedOrder(page, suffix);
  await paySuccess(page, order.resultAccessToken);
  await fulfillOrder(page, order.orderId, `${suffix} fulfillment evidence`);
  await settleOrder(page, order.orderId, 'immediate');
  await expect(page.getByTestId(`settlement-state-${order.orderId}`)).toContainText('released');
  await expect(page.getByTestId(`earnings-state-${order.orderId}`)).toContainText('available');
  return order;
}

async function openCheckout(page: Page, resultAccessToken: string): Promise<void> {
  await page.goto(`/public/requests/${resultAccessToken}`);
  await expect(page.getByTestId('local-checkout')).toBeVisible();
}

async function paySuccess(page: Page, resultAccessToken: string): Promise<void> {
  await openCheckout(page, resultAccessToken);
  await page.getByTestId('simulation-payment-scenario').selectOption('success');
  await page.getByTestId('simulate-payment').click();
  await expect(page.getByTestId('checkout-payment-state')).toContainText('confirmed');
}

async function fulfillOrder(page: Page, orderId: string, evidence: string): Promise<void> {
  await page.goto('/creator');
  await page.getByLabel('履约证据引用').fill(evidence);
  await page
    .getByTestId(`creator-order-${orderId}`)
    .getByRole('button', { name: '记录服务已履约' })
    .click();
  await expect(page.getByTestId(`fulfillment-state-${orderId}`)).toContainText('fulfilled');
}

async function settleOrder(
  page: Page,
  orderId: string,
  scenario: 'immediate' | 'failed',
): Promise<void> {
  await page.getByLabel('Settlement Scenario').selectOption(scenario);
  await page
    .getByTestId(`creator-order-${orderId}`)
    .getByRole('button', { name: 'Run Simulated Settlement' })
    .click();
}

async function requestWithdrawal(page: Page, amountMinor: string, suffix: string): Promise<string> {
  await page.getByLabel('提现金额（分）').fill(amountMinor);
  await page.getByLabel('脱敏结算目标引用').fill(`simulation-destination-${suffix}`);
  await page.getByLabel('提现幂等键').fill(`simulation-withdrawal-${suffix}`);
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/v1/creator/wallet/withdrawals') &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: '提交提现意图' }).click();
  const response = await responsePromise;
  const withdrawal = (await response.json()) as { readonly id: string };
  await expect(page.getByTestId(`withdrawal-${withdrawal.id}`)).toBeVisible();
  return withdrawal.id;
}

async function readWallet(page: Page): Promise<{
  readonly availableMinor: string;
  readonly recoveryOutstandingMinor: string;
  readonly withdrawnMinor: string;
}> {
  const response = await page.request.get(`${apiBaseUrl}/api/v1/creator/wallet`, {
    headers: creatorHeaders,
  });
  expect(response.ok()).toBe(true);
  return (await response.json()) as {
    readonly availableMinor: string;
    readonly recoveryOutstandingMinor: string;
    readonly withdrawnMinor: string;
  };
}

async function withdrawAllAvailable(page: Page, suffix: string): Promise<void> {
  const wallet = await readWallet(page);
  if (wallet.availableMinor === '0') return;
  await page.goto('/creator');
  const withdrawalId = await requestWithdrawal(page, wallet.availableMinor, suffix);
  await page.getByLabel('Withdrawal Scenario').selectOption('success');
  await page
    .getByTestId(`withdrawal-${withdrawalId}`)
    .getByRole('button', { name: 'Run Simulated Withdrawal' })
    .click();
  await expect(page.getByTestId(`withdrawal-state-${withdrawalId}`)).toContainText('completed');
  await expect(page.getByTestId('wallet-available')).toContainText('0');
}

async function createConfirmedOrder(page: Page, suffix: string) {
  const unique = `${suffix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const identityResponse = await page.request.post(`${apiBaseUrl}/api/v1/creator/identity`, {
    headers: creatorHeaders,
    data: {
      profile: {
        displayName: `VS-02F Creator ${unique}`,
        bio: 'Local paid commerce productization acceptance identity',
        socialLinks: [],
      },
    },
  });
  expect([201, 409]).toContain(identityResponse.status());
  const capabilityResponse = await page.request.post(
    `${apiBaseUrl}/api/v1/creator/identity/capabilities`,
    {
      headers: creatorHeaders,
      data: {
        name: `VS-02F Capability ${unique}`,
        description: 'Local paid commerce productization capability',
      },
    },
  );
  expect(capabilityResponse.ok()).toBe(true);
  const capability = (await capabilityResponse.json()) as {
    readonly capabilityIds: readonly string[];
  };
  const offeringResponse = await page.request.post(`${apiBaseUrl}/api/v1/creator/offerings`, {
    headers: creatorHeaders,
    data: {
      capabilityIds: [capability.capabilityIds.at(-1) as string],
      title: `VS-02F Offering ${unique}`,
      description: 'Browser-operable Local Paid Commerce',
      availabilityDescription: 'Available in test environments',
      requestInstructions: 'Submit a local simulation request',
    },
  });
  expect(offeringResponse.ok()).toBe(true);
  const offering = (await offeringResponse.json()) as { readonly id: string };
  expect(
    (
      await page.request.post(`${apiBaseUrl}/api/v1/creator/offerings/${offering.id}/publish`, {
        headers: creatorHeaders,
      })
    ).ok(),
  ).toBe(true);
  const requestResponse = await page.request.post(
    `${apiBaseUrl}/api/v1/public/offerings/${offering.id}/requests`,
    {
      data: {
        contactName: `VS-02F Customer ${unique}`,
        contactMethod: `${unique}@example.test`,
        requestMessage: 'Run a complete local paid commerce flow.',
      },
    },
  );
  expect(requestResponse.ok()).toBe(true);
  const request = (await requestResponse.json()) as {
    readonly actionId: string;
    readonly resultAccessToken: string;
  };
  expect(
    (
      await page.request.post(`${apiBaseUrl}/api/v1/creator/requests/${request.actionId}/confirm`, {
        headers: creatorHeaders,
      })
    ).ok(),
  ).toBe(true);
  const orderResponse = await page.request.post(`${apiBaseUrl}/api/v1/creator/paid-orders`, {
    headers: creatorHeaders,
    data: {
      commerceActionId: request.actionId,
      grossPriceMinor: '39900',
      serviceTerms: 'One 60-minute local paid commerce service.',
    },
  });
  expect(orderResponse.ok()).toBe(true);
  const order = (await orderResponse.json()) as { readonly id: string };
  return { orderId: order.id, resultAccessToken: request.resultAccessToken };
}
