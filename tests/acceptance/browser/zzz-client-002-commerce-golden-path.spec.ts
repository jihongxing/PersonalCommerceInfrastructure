import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const apiBaseUrl = 'http://127.0.0.1:41000';
const creatorHeaders = { authorization: 'Bearer test-creator-token' };
const operationsHeaders = { authorization: 'Bearer test-operations-token' };

test.setTimeout(90_000);

test('CLIENT-002 Golden Path A — Request reaches completion and a single Wallet projection', async ({
  page,
}) => {
  const fixture = await createRequestFixture(page.request, 'golden-request');
  const orderId = await completePaidOrder(page, fixture.actionId, fixture.offeringTitle, 'request');
  await expectCreatorOrderAvailable(page, orderId, fixture.offeringTitle);

  const duplicate = await page.request.post(
    `${apiBaseUrl}/api/v1/creator/paid-orders/${orderId}/fulfillment`,
    { headers: creatorHeaders, data: { evidenceReference: 'duplicate-request-completion' } },
  );
  expect(duplicate.status()).toBe(409);
  await expectCreatorOrderAvailable(page, orderId, fixture.offeringTitle);
});

test('CLIENT-002 Golden Path B — Reservation reaches Session Completed and Wallet projection', async ({
  page,
}) => {
  const fixture = await createReservationFixture(page.request);
  await page.goto(fixture.publicUrl);
  const reservationWorkspace = page.getByTestId('reservation-commerce');
  await reservationWorkspace.getByLabel('你的称呼').fill('Golden Reservation Client');
  await reservationWorkspace.getByLabel('联系方式').fill(`${fixture.suffix}@example.test`);
  await reservationWorkspace.getByRole('button', { name: '创建 15 分钟保留' }).click();
  await expect(page).toHaveURL(/\/public\/reservations\//);

  const resultAccessToken = page.url().split('/').at(-1) as string;
  await page.goto('/creator');
  const held = page
    .locator('[data-testid^="creator-reservation-"]')
    .filter({
      has: page.getByRole('button', { name: 'Confirm Reservation' }),
    })
    .last();
  await held.getByLabel('Gross minor').fill('39900');
  await held.getByLabel('Service terms').fill('Golden reservation session.');
  await held.getByRole('button', { name: 'Confirm Reservation' }).click();

  const reservation = await getReservation(page.request, resultAccessToken);
  expect(reservation.orderId).toBeDefined();
  await simulatePayment(page.request, resultAccessToken);
  await page.goto('/creator');
  const confirmed = page.locator(`[data-testid="creator-reservation-${reservation.id}"]`);
  await confirmed.getByRole('button', { name: 'Session Completed' }).click();
  await expect(page.getByText('Session Completed 已通过现有 Fulfillment 用例记录。')).toBeVisible();
  await releaseSettlement(page.request, reservation.orderId as string, fixture.suffix);
  await expectCreatorOrderAvailable(page, reservation.orderId as string, fixture.title);
});

test('CLIENT-002 Golden Path C — Contract reaches Contracted completion and Wallet projection', async ({
  page,
}) => {
  const fixture = await createContractFixture(page.request);
  await page.goto('/creator');
  const workspace = page.locator('.ds-page__surface').filter({
    has: page.getByRole('heading', { name: '商业演出 Quote / Scope' }),
  });
  await workspace.getByLabel('Buyer Request').selectOption(fixture.actionId);
  await workspace.getByLabel('表演类型：').fill('Golden performance');
  await workspace.getByLabel('日期：').fill('2026-09-10T12:00');
  await workspace.getByLabel('地点：').fill('Golden venue');
  await workspace.getByLabel('价格：').fill('39900');
  await workspace.getByRole('button', { name: '发送 Quote / Scope' }).click();

  await page.goto(`/public/requests/${fixture.resultAccessToken}`);
  await page.getByRole('button', { name: '接受 Quote' }).click();
  await expect(page.getByText(/状态：contracted/)).toBeVisible();
  const checkout = await page.request.get(
    `${apiBaseUrl}/api/v1/local-commerce/requests/${fixture.resultAccessToken}/checkout`,
  );
  expect(checkout.ok()).toBe(true);
  const checkoutBody = (await checkout.json()) as { readonly order: { readonly id: string } };
  const orderId = checkoutBody.order.id;
  await simulatePayment(page.request, fixture.resultAccessToken);
  await recordFulfillmentFromCreatorDesk(page, orderId, `performance-completed:${fixture.suffix}`);
  await releaseSettlement(page.request, orderId, fixture.suffix);
  await expectCreatorOrderAvailable(page, orderId, 'Golden performance');
});

async function completePaidOrder(
  page: Page,
  actionId: string,
  offeringTitle: string,
  suffix: string,
): Promise<string> {
  await page.goto('/creator');
  const request = page
    .locator('.ds-list-item')
    .filter({ hasText: offeringTitle })
    .filter({
      has: page.getByRole('button', { name: '确认请求' }),
    })
    .last();
  await request.getByRole('button', { name: '确认请求' }).click();
  const order = await page.request.post(`${apiBaseUrl}/api/v1/creator/paid-orders`, {
    headers: creatorHeaders,
    data: {
      commerceActionId: actionId,
      grossPriceMinor: '39900',
      serviceTerms: 'Golden path service.',
    },
  });
  expect(order.ok()).toBe(true);
  const orderId = ((await order.json()) as { readonly id: string }).id;
  const payment = await page.request.post(
    `${apiBaseUrl}/api/v1/operations/simulation/paid-orders/${orderId}/payment`,
    {
      headers: operationsHeaders,
      data: {
        amountMinor: '39900',
        currency: 'CNY',
        idempotencyKey: `${suffix}-payment`,
      },
    },
  );
  expect(payment.ok()).toBe(true);
  await recordFulfillmentFromCreatorDesk(page, orderId, `${suffix}-completed`);
  await releaseSettlement(page.request, orderId, suffix);
  return orderId;
}

async function expectCreatorOrderAvailable(page: Page, orderId: string, offeringTitle: string) {
  await page.goto('/creator');
  await page.getByRole('button', { name: '刷新订单与收益' }).click();
  await expect(page.getByTestId(`creator-order-${orderId}`)).toContainText(offeringTitle);
  await expect(page.getByTestId(`earnings-state-${orderId}`)).toContainText('available');
  await expect(page.getByTestId('creator-wallet-notice')).toBeVisible();
}

async function recordFulfillmentFromCreatorDesk(
  page: Page,
  orderId: string,
  evidenceReference: string,
) {
  await page.goto('/creator');
  await page.getByRole('button', { name: '刷新订单与收益' }).click();
  await page.getByLabel('履约证据引用').fill(evidenceReference);
  const order = page.getByTestId(`creator-order-${orderId}`);
  await order.getByRole('button', { name: '记录服务已履约' }).click();
  await expect(page.getByText('已记录服务履约，等待受控结算。')).toBeVisible();
}

async function releaseSettlement(request: APIRequestContext, orderId: string, suffix: string) {
  const settlement = await request.post(
    `${apiBaseUrl}/api/v1/operations/simulation/paid-orders/${orderId}/settlement`,
    {
      headers: operationsHeaders,
      data: {
        amountMinor: '35670',
        currency: 'CNY',
        idempotencyKey: `${suffix}-settlement`,
        providerFeeMinor: '240',
        platformFeeMinor: '3990',
        deductionsMinor: '0',
        calculationVersion: 'client-002-v1',
      },
    },
  );
  expect(settlement.ok()).toBe(true);
}

async function simulatePayment(request: APIRequestContext, resultAccessToken: string) {
  const payment = await request.post(
    `${apiBaseUrl}/api/v1/local-commerce/requests/${resultAccessToken}/payment`,
    { data: { scenario: 'success' } },
  );
  expect(payment.ok()).toBe(true);
}

async function createRequestFixture(
  request: APIRequestContext,
  suffix: string,
): Promise<{ actionId: string; offeringTitle: string }> {
  const identity = await request.post(`${apiBaseUrl}/api/v1/creator/identity`, {
    headers: creatorHeaders,
    data: {
      profile: {
        displayName: `Golden Creator ${suffix}`,
        bio: 'Golden path creator.',
        socialLinks: [],
      },
    },
  });
  expect([201, 409]).toContain(identity.status());
  const capability = await request.post(`${apiBaseUrl}/api/v1/creator/identity/capabilities`, {
    headers: creatorHeaders,
    data: { name: `Golden capability ${suffix}`, description: 'Golden path capability.' },
  });
  expect(capability.ok()).toBe(true);
  const capabilityId = ((await capability.json()) as { capabilityIds: string[] }).capabilityIds[0];
  const offeringTitle = `Golden Request ${suffix}`;
  const offering = await request.post(`${apiBaseUrl}/api/v1/creator/offerings`, {
    headers: creatorHeaders,
    data: {
      capabilityIds: [capabilityId],
      title: offeringTitle,
      description: 'Golden request offering.',
      availabilityDescription: 'By request.',
      requestInstructions: 'Describe the request.',
    },
  });
  expect(offering.ok()).toBe(true);
  const offeringId = ((await offering.json()) as { id: string }).id;
  const published = await request.post(
    `${apiBaseUrl}/api/v1/creator/offerings/${offeringId}/publish`,
    {
      headers: creatorHeaders,
    },
  );
  expect(published.ok()).toBe(true);
  const submitted = await request.post(
    `${apiBaseUrl}/api/v1/public/offerings/${offeringId}/requests`,
    {
      data: {
        contactName: 'Golden Customer',
        contactMethod: `${suffix}@example.test`,
        requestMessage: 'Please process this Golden Path request.',
      },
    },
  );
  expect(submitted.ok()).toBe(true);
  const body = (await submitted.json()) as { actionId: string };
  return { actionId: body.actionId, offeringTitle };
}

async function createReservationFixture(request: APIRequestContext) {
  const suffix = `golden-reservation-${Date.now()}`;
  const identity = await request.post(`${apiBaseUrl}/api/v1/creator/identity`, {
    headers: creatorHeaders,
    data: {
      profile: {
        displayName: `Golden Photographer ${suffix}`,
        bio: 'Golden reservation creator.',
        socialLinks: [],
      },
    },
  });
  expect([201, 409]).toContain(identity.status());
  const capability = await request.post(`${apiBaseUrl}/api/v1/creator/identity/capabilities`, {
    headers: creatorHeaders,
    data: { name: `Golden portrait ${suffix}`, description: 'Portrait session.' },
  });
  expect(capability.ok()).toBe(true);
  const capabilityId = ((await capability.json()) as { capabilityIds: string[] }).capabilityIds[0];
  const offering = await request.post(`${apiBaseUrl}/api/v1/creator/offerings`, {
    headers: creatorHeaders,
    data: {
      capabilityIds: [capabilityId],
      title: `Golden Reservation ${suffix}`,
      description: 'Golden portrait session.',
      availabilityDescription: 'Available by slot.',
      requestInstructions: 'Choose a time slot.',
    },
  });
  expect(offering.ok()).toBe(true);
  const offeringId = ((await offering.json()) as { id: string }).id;
  await request.post(`${apiBaseUrl}/api/v1/creator/offerings/${offeringId}/publish`, {
    headers: creatorHeaders,
  });
  const slot = await request.post(
    `${apiBaseUrl}/api/v1/creator/offerings/${offeringId}/availability-slots`,
    {
      headers: creatorHeaders,
      data: { startsAt: '2027-06-01T10:00:00.000Z', endsAt: '2027-06-01T11:00:00.000Z' },
    },
  );
  expect(slot.ok()).toBe(true);
  const offeringPublic = await request.get(`${apiBaseUrl}/api/v1/public/offerings/${offeringId}`);
  expect(offeringPublic.ok()).toBe(true);
  return {
    suffix,
    offeringId,
    publicUrl: `/public/${offeringId}`,
    title: `Golden Reservation ${suffix}`,
  };
}

async function getReservation(request: APIRequestContext, resultAccessToken: string) {
  const response = await request.get(
    `${apiBaseUrl}/api/v1/public/reservations/${resultAccessToken}`,
  );
  expect(response.ok()).toBe(true);
  return (await response.json()) as { id: string; orderId?: string };
}

async function createContractFixture(request: APIRequestContext) {
  const suffix = `golden-contract-${Date.now()}`;
  const identity = await request.post(`${apiBaseUrl}/api/v1/creator/identity`, {
    headers: creatorHeaders,
    data: {
      profile: {
        displayName: `Golden Troupe ${suffix}`,
        bio: 'Golden contract creator.',
        socialLinks: [],
      },
    },
  });
  expect([201, 409]).toContain(identity.status());
  const capability = await request.post(`${apiBaseUrl}/api/v1/creator/identity/capabilities`, {
    headers: creatorHeaders,
    data: { name: `Golden performance ${suffix}`, description: 'Commercial performance.' },
  });
  expect(capability.ok()).toBe(true);
  const capabilityId = ((await capability.json()) as { capabilityIds: string[] }).capabilityIds[0];
  const offering = await request.post(`${apiBaseUrl}/api/v1/creator/offerings`, {
    headers: creatorHeaders,
    data: {
      capabilityIds: [capabilityId],
      title: `Golden Contract ${suffix}`,
      description: 'Golden contract appearance.',
      availabilityDescription: 'Subject to accepted scope.',
      requestInstructions: 'Describe the engagement.',
    },
  });
  expect(offering.ok()).toBe(true);
  const offeringId = ((await offering.json()) as { id: string }).id;
  await request.post(`${apiBaseUrl}/api/v1/creator/offerings/${offeringId}/publish`, {
    headers: creatorHeaders,
  });
  const submitted = await request.post(
    `${apiBaseUrl}/api/v1/public/offerings/${offeringId}/requests`,
    {
      data: {
        contactName: 'Golden Buyer',
        contactMethod: `${suffix}@example.test`,
        requestMessage: 'Please quote this commercial engagement.',
      },
    },
  );
  expect(submitted.ok()).toBe(true);
  const body = (await submitted.json()) as { actionId: string; resultAccessToken: string };
  return { ...body, title: `Golden Contract ${suffix}`, suffix };
}
