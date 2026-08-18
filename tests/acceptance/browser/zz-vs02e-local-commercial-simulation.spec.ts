import { expect, test, type Page } from '@playwright/test';

const apiBaseUrl = 'http://127.0.0.1:45100';
const creatorHeaders = { authorization: 'Bearer test-creator-token' };

test('VS-02E uses the browser simulation control through HTTP without real-money evidence', async ({
  page,
}) => {
  const suffix = String(Date.now());
  const walletBefore = await page.request.get(`${apiBaseUrl}/api/v1/creator/wallet`, {
    headers: creatorHeaders,
  });
  const initialWallet = (await walletBefore.json()) as {
    readonly availableMinor: string;
    readonly withdrawnMinor: string;
  };
  const { orderId } = await createConfirmedOrder(page, suffix);

  await page.goto('/operations');
  await expect(page.getByTestId('local-commerce-simulation-control')).toBeVisible();
  await expect(page.getByTestId('local-commerce-simulation-notice')).toContainText(
    '不会产生真实付款',
  );
  await page.getByLabel('Operations 访问令牌', { exact: true }).fill('test-operations-token');
  await page.getByLabel('Paid Order ID').fill(orderId);

  const paymentResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith(`/operations/simulation/paid-orders/${orderId}/payment`) &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: '模拟付款' }).click();
  expect((await paymentResponse).ok()).toBe(true);
  await expect(page.getByTestId('local-commerce-simulation-status')).toHaveText(
    '模拟操作已通过 Provider-neutral HTTP 路径处理。',
  );

  await page.goto('/creator');
  await page.getByRole('button', { name: '刷新订单与收益' }).click();
  await page.getByLabel('履约证据引用').fill(`simulation-fulfillment-${suffix}`);
  await page.getByRole('button', { name: '记录服务已履约' }).click();
  await expect(page.getByTestId('creator-earnings-action-status')).toHaveText(
    '已记录服务履约，等待受控结算。',
  );

  await page.goto('/operations');
  await page.getByLabel('Operations 访问令牌', { exact: true }).fill('test-operations-token');
  await page.getByLabel('Paid Order ID').fill(orderId);
  const settlementResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith(`/operations/simulation/paid-orders/${orderId}/settlement`) &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: '模拟结算' }).click();
  expect((await settlementResponse).ok()).toBe(true);
  await expect(page.getByTestId('local-commerce-simulation-status')).toHaveText(
    '模拟操作已通过 Provider-neutral HTTP 路径处理。',
  );

  await page.goto('/creator');
  await page.getByRole('button', { name: '刷新订单与收益' }).click();
  await expect(page.locator('.ds-status-card').filter({ hasText: '可发起提现' })).toContainText(
    '35670',
  );

  await page.getByLabel('提现金额（分）').fill('35670');
  await page.getByLabel('脱敏结算目标引用').fill(`simulation-destination-${suffix}`);
  await page.getByLabel('提现幂等键').fill(`simulation-withdrawal-${suffix}`);
  const withdrawalIntentResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/v1/creator/wallet/withdrawals') &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: '提交提现意图' }).click();
  const withdrawalId = (await (await withdrawalIntentResponse).json()) as { readonly id: string };

  await page.goto('/operations');
  await page.getByLabel('Operations 访问令牌', { exact: true }).fill('test-operations-token');
  await page.getByLabel('Withdrawal ID').fill(withdrawalId.id);
  const withdrawalResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith(`/operations/simulation/withdrawals/${withdrawalId.id}`) &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: '模拟提现' }).click();
  expect((await withdrawalResponse).ok()).toBe(true);
  await expect(page.getByTestId('local-commerce-simulation-status')).toHaveText(
    '模拟操作已通过 Provider-neutral HTTP 路径处理。',
  );

  const wallet = await page.request.get(`${apiBaseUrl}/api/v1/creator/wallet`, {
    headers: creatorHeaders,
  });
  expect(wallet.ok()).toBe(true);
  const finalWallet = (await wallet.json()) as {
    readonly availableMinor: string;
    readonly withdrawnMinor: string;
  };
  expect(finalWallet.availableMinor).toBe(initialWallet.availableMinor);
  expect(BigInt(finalWallet.withdrawnMinor)).toBe(BigInt(initialWallet.withdrawnMinor) + 35670n);
});

async function createConfirmedOrder(page: Page, suffix: string) {
  const identityResponse = await page.request.post(`${apiBaseUrl}/api/v1/creator/identity`, {
    headers: creatorHeaders,
    data: {
      profile: {
        displayName: `VS-02E Creator ${suffix}`,
        bio: 'Local commercial simulation browser acceptance identity',
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
        name: `VS-02E Capability ${suffix}`,
        description: 'Local commercial simulation browser acceptance capability',
      },
    },
  );
  const capability = (await capabilityResponse.json()) as {
    readonly capabilityIds: readonly string[];
  };
  const offeringResponse = await page.request.post(`${apiBaseUrl}/api/v1/creator/offerings`, {
    headers: creatorHeaders,
    data: {
      capabilityIds: [capability.capabilityIds.at(-1) as string],
      title: `VS-02E Offering ${suffix}`,
      description: 'Browser to HTTP local simulation acceptance',
      availabilityDescription: 'By confirmed request only',
      requestInstructions: 'Provide a simulation acceptance request',
    },
  });
  const offering = (await offeringResponse.json()) as { readonly id: string };
  await page.request.post(`${apiBaseUrl}/api/v1/creator/offerings/${offering.id}/publish`, {
    headers: creatorHeaders,
  });
  const submitted = await page.request.post(
    `${apiBaseUrl}/api/v1/public/offerings/${offering.id}/requests`,
    {
      data: {
        contactName: `VS-02E Customer ${suffix}`,
        contactMethod: `vs02e-${suffix}@example.test`,
        requestMessage: 'Please create a local simulation order.',
      },
    },
  );
  const { actionId } = (await submitted.json()) as { readonly actionId: string };
  await page.request.post(`${apiBaseUrl}/api/v1/creator/requests/${actionId}/confirm`, {
    headers: creatorHeaders,
  });
  const orderResponse = await page.request.post(`${apiBaseUrl}/api/v1/creator/paid-orders`, {
    headers: creatorHeaders,
    data: {
      commerceActionId: actionId,
      grossPriceMinor: '39900',
      serviceTerms: 'One 60-minute local simulation dance lesson.',
    },
  });
  const { id } = (await orderResponse.json()) as { readonly id: string };
  return { orderId: id };
}
