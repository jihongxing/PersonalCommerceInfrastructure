import { expect, test } from '@playwright/test';

const apiBaseUrl = 'http://127.0.0.1:45100';
const creatorHeaders = { authorization: 'Bearer test-creator-token' };
const operationsHeaders = { authorization: 'Bearer test-operations-token' };

test('VS-02A connects a confirmed Request to controlled Creator Earnings without real payment', async ({
  page,
}, testInfo) => {
  const suffix = String(Date.now());

  const identityResponse = await page.request.post(`${apiBaseUrl}/api/v1/creator/identity`, {
    headers: creatorHeaders,
    data: {
      profile: {
        displayName: `VS-02A Creator ${suffix}`,
        bio: 'Controlled paid-service browser acceptance identity',
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
        name: `VS-02A capability ${suffix}`,
        description: 'Controlled paid-service browser acceptance capability',
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
      title: `VS-02A offering ${suffix}`,
      description: 'Confirmed Request to controlled Earnings acceptance',
      availabilityDescription: 'By confirmed request only',
      requestInstructions: 'Provide a controlled acceptance request',
    },
  });
  expect(offeringResponse.ok()).toBe(true);
  const offering = (await offeringResponse.json()) as { readonly id: string };

  const publishResponse = await page.request.post(
    `${apiBaseUrl}/api/v1/creator/offerings/${offering.id}/publish`,
    { headers: creatorHeaders },
  );
  expect(publishResponse.ok()).toBe(true);

  const requestResponse = await page.request.post(
    `${apiBaseUrl}/api/v1/public/offerings/${offering.id}/requests`,
    {
      data: {
        contactName: 'VS-02A Customer',
        contactMethod: `vs02a-${suffix}@example.test`,
        requestMessage: 'Controlled paid-service browser acceptance request',
      },
    },
  );
  expect(requestResponse.ok()).toBe(true);
  const submittedRequest = (await requestResponse.json()) as {
    readonly actionId: string;
    readonly resultAccessToken: string;
  };

  const confirmResponse = await page.request.post(
    `${apiBaseUrl}/api/v1/creator/requests/${submittedRequest.actionId}/confirm`,
    { headers: creatorHeaders },
  );
  expect(confirmResponse.ok()).toBe(true);

  await page.goto('/creator');
  await expect(page.getByRole('heading', { name: '服务订单与收益' })).toBeVisible();
  await expect(
    page.getByText(
      '这是 VS-02A 的受控商业链。支付、结算和提现完成事实仍由 Pilot Operations 记录。',
    ),
  ).toBeVisible();
  await expect(page.getByText(`VS-02A offering ${suffix}`).last()).toBeVisible();

  await page.getByLabel('订单金额（分）').fill('39900');
  await page.getByLabel('服务履约条件').fill('一次 60 分钟线下舞蹈私教服务。');
  await page.getByRole('button', { name: '创建待支付订单' }).click();
  await expect(page.getByRole('status').last()).toHaveText('订单已创建，正在等待受控支付事实。');

  const pendingCustomerPage = await page.context().newPage();
  await pendingCustomerPage.goto(`/public/requests/${submittedRequest.resultAccessToken}`);
  await expect(
    pendingCustomerPage.getByText('服务订单已创建，正在等待受控支付事实。'),
  ).toBeVisible();

  const ordersResponse = await page.request.get(`${apiBaseUrl}/api/v1/creator/paid-orders`, {
    headers: creatorHeaders,
  });
  const orders = (await ordersResponse.json()) as {
    readonly orders: readonly { readonly id: string }[];
  };
  const orderId = orders.orders.at(-1)?.id;
  expect(orderId).toBeDefined();
  if (orderId === undefined) {
    throw new Error('Creator Order was not created.');
  }

  const paymentResponse = await page.request.post(
    `${apiBaseUrl}/api/v1/operations/paid-orders/${orderId}/payment-confirmed`,
    {
      headers: operationsHeaders,
      data: { controlledEvidenceReference: `local://vs02a/payment/${suffix}` },
    },
  );
  expect(paymentResponse.ok()).toBe(true);
  await pendingCustomerPage.reload();
  await expect(pendingCustomerPage.getByText('付款事实已受控确认，等待服务履约。')).toBeVisible();

  await page.getByRole('button', { name: '刷新订单与收益' }).click();
  await page.getByLabel('履约证据引用').fill(`local://vs02a/fulfillment/${suffix}`);
  await page.getByRole('button', { name: '记录服务已履约' }).click();
  await expect(page.getByRole('status').last()).toHaveText('已记录服务履约，等待受控结算。');

  const settlementResponse = await page.request.post(
    `${apiBaseUrl}/api/v1/operations/paid-orders/${orderId}/settlement-released`,
    {
      headers: operationsHeaders,
      data: {
        providerFeeMinor: '240',
        platformFeeMinor: '3990',
        calculationVersion: 'vs02-browser-v1',
        controlledEvidenceReference: `local://vs02a/settlement/${suffix}`,
      },
    },
  );
  expect(settlementResponse.ok()).toBe(true);

  await page.getByRole('button', { name: '刷新订单与收益' }).click();
  await expect(page.locator('.ds-status-card').filter({ hasText: '可发起提现' })).toContainText(
    '35670',
  );

  await page.getByLabel('提现金额（分）').fill('35670');
  await page.getByLabel('脱敏结算目标引用').fill(`destination-redacted-${suffix}`);
  await page.getByLabel('提现幂等键').fill(`withdrawal-${suffix}`);
  const withdrawalResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/v1/creator/wallet/withdrawals') &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: '提交提现意图' }).click();
  const withdrawalPayload = (await (await withdrawalResponse).json()) as { readonly id: string };
  await expect(page.getByRole('status').last()).toHaveText('提现意图已创建，等待受控完成事实。');

  const completedResponse = await page.request.post(
    `${apiBaseUrl}/api/v1/operations/withdrawals/${withdrawalPayload.id}/completed`,
    {
      headers: operationsHeaders,
      data: { controlledEvidenceReference: `local://vs02a/withdrawal/${suffix}` },
    },
  );
  expect(completedResponse.ok()).toBe(true);

  await page.getByRole('button', { name: '刷新订单与收益' }).click();
  await expect(page.locator('.ds-status-card').filter({ hasText: '已完成提现' })).toContainText(
    '35670',
  );
  await expect(
    page.getByText('余额来自不可覆盖的 Earnings Ledger 投影，不是平台资金账户或可写余额。'),
  ).toBeVisible();

  await pendingCustomerPage.close();
  await testInfo.attach('vs02a-controlled-browser-acceptance.json', {
    body: Buffer.from(
      `${JSON.stringify(
        {
          evidenceType: 'controlled-browser-acceptance',
          actionId: submittedRequest.actionId,
          orderId,
          withdrawalId: withdrawalPayload.id,
          providerIntegrated: false,
          realMoney: false,
        },
        undefined,
        2,
      )}\n`,
    ),
    contentType: 'application/json',
  });
});
