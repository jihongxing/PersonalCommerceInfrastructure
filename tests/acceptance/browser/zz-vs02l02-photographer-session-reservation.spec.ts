import { expect, test, type APIRequestContext } from '@playwright/test';

const apiBaseUrl = 'http://127.0.0.1:45100';
const creatorHeaders = { authorization: 'Bearer test-creator-token' };
const operationsHeaders = { authorization: 'Bearer test-operations-token' };

test.setTimeout(60_000);

test('RES-01 through RES-10 run Reservation Commerce on the existing Money Layer', async ({
  page,
}) => {
  const fixture = await createReservationFixture(page.request, 'main');
  const walletBefore = await page.request.get(`${apiBaseUrl}/api/v1/creator/wallet`, {
    headers: creatorHeaders,
  });
  expect(walletBefore.ok()).toBe(true);
  const availableBefore = BigInt(
    ((await walletBefore.json()) as { readonly availableMinor: string }).availableMinor,
  );

  await page.goto(fixture.publicUrl);
  const reservationWorkspace = page.getByTestId('reservation-commerce');
  await expect(reservationWorkspace).toBeVisible();
  await expect(page.getByLabel('可预约时间')).toContainText('2027');
  await reservationWorkspace.getByLabel('你的称呼').fill(`Portrait Client ${fixture.suffix}`);
  await reservationWorkspace.getByLabel('联系方式').fill(`${fixture.suffix}@example.test`);
  await reservationWorkspace.getByRole('button', { name: '创建 15 分钟保留' }).click();

  await expect(page).toHaveURL(/\/public\/reservations\//);
  const resultAccessToken = page.url().split('/').at(-1) as string;
  await expect(page.getByTestId('reservation-state')).toContainText('held');
  await expect(page.getByText('订单：尚未创建')).toBeVisible();
  await expect(page.getByText('保留到期：')).toBeVisible();

  await page.goto('/creator');
  const heldCard = page
    .locator('[data-testid^="creator-reservation-"]')
    .filter({ has: page.getByRole('button', { name: 'Confirm Reservation' }) })
    .last();
  await expect(heldCard).toBeVisible();
  await heldCard.getByLabel('Gross minor').fill('39900');
  await heldCard.getByLabel('Service terms').fill('One 60-minute portrait session.');
  await heldCard.getByRole('button', { name: 'Confirm Reservation' }).click();
  await expect(page.getByText('Reservation 已确认，Order 已创建一次。')).toBeVisible();

  const reservation = await getReservation(page.request, resultAccessToken);
  expect(reservation.state).toBe('confirmed');
  expect(reservation.orderId).toBeDefined();

  await page.goto(`/public/reservations/${resultAccessToken}`);
  await expect(page.getByText('订单：')).toContainText(reservation.orderId as string);
  await expect(page.getByText('付款：pending')).toBeVisible();
  await expect(page.getByRole('button', { name: '模拟付款成功' })).toBeVisible();
  const payment = await page.request.post(
    `${apiBaseUrl}/api/v1/local-commerce/requests/${resultAccessToken}/payment`,
    { data: { scenario: 'success' } },
  );
  expect(payment.ok()).toBe(true);
  await page.reload();
  await expect(page.getByText('付款：confirmed')).toBeVisible();

  await page.goto('/creator');
  const confirmedCard = page
    .locator(`[data-testid="creator-reservation-${reservation.id}"]`)
    .first();
  await expect(confirmedCard).toContainText('confirmed');
  await confirmedCard.getByRole('button', { name: 'Session Completed' }).click();
  await expect(page.getByText('Session Completed 已通过现有 Fulfillment 用例记录。')).toBeVisible();

  const settlement = await page.request.post(
    `${apiBaseUrl}/api/v1/operations/simulation/paid-orders/${reservation.orderId}/settlement`,
    {
      headers: operationsHeaders,
      data: {
        amountMinor: '35670',
        currency: 'CNY',
        idempotencyKey: `reservation-settlement-${fixture.suffix}`,
        providerFeeMinor: '240',
        platformFeeMinor: '3990',
        deductionsMinor: '0',
        calculationVersion: 'reservation-browser-v1',
      },
    },
  );
  expect(settlement.ok()).toBe(true);

  await page.getByRole('button', { name: '刷新订单与收益' }).click();
  await expect(page.getByTestId(`earnings-state-${reservation.orderId}`)).toContainText(
    'available',
  );
  await expect(page.locator('.ds-status-card').filter({ hasText: '可发起提现' })).toContainText(
    String(availableBefore + 35_670n),
  );
});

test('RES-03, RES-06, RES-11 through RES-15 preserve slot and fact invariants', async ({
  page,
}) => {
  const fixture = await createReservationFixture(page.request, 'edges');

  const firstHold = await createHold(page.request, fixture, 'First Client');
  const secondHold = await page.request.post(
    `${apiBaseUrl}/api/v1/public/offerings/${fixture.offeringId}/reservation-holds`,
    {
      data: {
        availabilitySlotId: fixture.slotId,
        contactName: 'Second Client',
        contactMethod: `second-${fixture.suffix}@example.test`,
      },
    },
  );
  expect(secondHold.status()).toBe(409);

  const cancelled = await page.request.post(
    `${apiBaseUrl}/api/v1/creator/reservations/${firstHold.id}/cancel`,
    { headers: creatorHeaders },
  );
  expect(cancelled.ok()).toBe(true);
  const releasedHold = await createHold(page.request, fixture, 'Replacement Client');
  expect(releasedHold.state).toBe('held');

  const confirmed = await confirmReservation(page.request, releasedHold.id);
  const replay = await confirmReservation(page.request, releasedHold.id);
  expect(replay.orderId).toBe(confirmed.orderId);
  const conflict = await page.request.post(
    `${apiBaseUrl}/api/v1/creator/reservations/${releasedHold.id}/confirm`,
    {
      headers: creatorHeaders,
      data: { grossPriceMinor: '40000', serviceTerms: 'Conflicting snapshot.' },
    },
  );
  expect(conflict.status()).toBe(409);

  const secondSlot = await createSlot(page.request, fixture, '2027-08-20T04:00:00.000Z');
  const reschedule = await page.request.post(
    `${apiBaseUrl}/api/v1/creator/reservations/${releasedHold.id}/reschedule`,
    {
      headers: creatorHeaders,
      data: { availabilitySlotId: secondSlot.id },
    },
  );
  expect(reschedule.ok()).toBe(true);
  const rescheduled = (await reschedule.json()) as { readonly orderId: string };
  expect(rescheduled.orderId).toBe(confirmed.orderId);

  const noShow = await page.request.post(
    `${apiBaseUrl}/api/v1/creator/reservations/${releasedHold.id}/no-show`,
    { headers: creatorHeaders },
  );
  expect(noShow.ok()).toBe(true);

  const customerCancel = await page.request.post(
    `${apiBaseUrl}/api/v1/public/reservations/${releasedHold.resultAccessToken}/cancel`,
  );
  expect(customerCancel.status()).toBe(200);
  expect(await customerCancel.text()).toContain('"state":"cancelled"');
});

async function createReservationFixture(
  request: APIRequestContext,
  prefix: string,
): Promise<{
  readonly suffix: string;
  readonly title: string;
  readonly offeringId: string;
  readonly slotId: string;
  readonly publicUrl: string;
  readonly resultAccessToken: string;
}> {
  const suffix = `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const existingIdentity = await request.get(`${apiBaseUrl}/api/v1/creator/identity`, {
    headers: creatorHeaders,
  });
  if (existingIdentity.status() === 404) {
    const identity = await request.post(`${apiBaseUrl}/api/v1/creator/identity`, {
      headers: creatorHeaders,
      data: {
        profile: {
          displayName: `Independent Photographer ${suffix}`,
          bio: 'Portrait photographer.',
          socialLinks: [],
        },
      },
    });
    expect(identity.ok()).toBe(true);
  } else {
    expect(existingIdentity.ok()).toBe(true);
  }

  const capability = await request.post(`${apiBaseUrl}/api/v1/creator/identity/capabilities`, {
    headers: creatorHeaders,
    data: { name: `Portrait photography ${suffix}`, description: 'Portrait sessions.' },
  });
  expect(capability.ok()).toBe(true);
  const capabilityId = ((await capability.json()) as { readonly capabilityIds: string[] })
    .capabilityIds[0];
  const title = `60-minute portrait session ${suffix}`;
  const offering = await request.post(`${apiBaseUrl}/api/v1/creator/offerings`, {
    headers: creatorHeaders,
    data: {
      capabilityIds: [capabilityId],
      title,
      description: 'A one-hour portrait session.',
      availabilityDescription: 'Choose one published time.',
      requestInstructions: 'Select an available slot.',
    },
  });
  expect(offering.ok()).toBe(true);
  const offeringId = ((await offering.json()) as { readonly id: string }).id;
  const publish = await request.post(
    `${apiBaseUrl}/api/v1/creator/offerings/${offeringId}/publish`,
    { headers: creatorHeaders },
  );
  expect(publish.ok()).toBe(true);
  const slot = await createSlot(request, { offeringId }, '2027-08-20T02:00:00.000Z');
  const publicOffering = await request.get(`${apiBaseUrl}/api/v1/public/offerings/${offeringId}`);
  expect(publicOffering.ok()).toBe(true);
  const publicUrl = `/public/${offeringId}`;
  return {
    suffix,
    title,
    offeringId,
    slotId: slot.id,
    publicUrl,
    resultAccessToken: '',
  };
}

async function createSlot(
  request: APIRequestContext,
  fixture: { readonly offeringId: string },
  startsAt: string,
): Promise<{ readonly id: string }> {
  const response = await request.post(
    `${apiBaseUrl}/api/v1/creator/offerings/${fixture.offeringId}/availability-slots`,
    {
      headers: creatorHeaders,
      data: {
        startsAt,
        endsAt: new Date(Date.parse(startsAt) + 60 * 60 * 1000).toISOString(),
      },
    },
  );
  expect(response.ok()).toBe(true);
  return (await response.json()) as { readonly id: string };
}

async function createHold(
  request: APIRequestContext,
  fixture: { readonly offeringId: string; readonly slotId: string; readonly suffix: string },
  clientName: string,
): Promise<{ readonly id: string; readonly resultAccessToken: string; readonly state: string }> {
  const response = await request.post(
    `${apiBaseUrl}/api/v1/public/offerings/${fixture.offeringId}/reservation-holds`,
    {
      data: {
        availabilitySlotId: fixture.slotId,
        contactName: clientName,
        contactMethod: `${clientName.toLowerCase().replaceAll(' ', '-')}-${fixture.suffix}@example.test`,
      },
    },
  );
  expect(response.ok()).toBe(true);
  return (await response.json()) as {
    readonly id: string;
    readonly resultAccessToken: string;
    readonly state: string;
  };
}

async function confirmReservation(
  request: APIRequestContext,
  reservationId: string,
): Promise<{ readonly orderId: string }> {
  const response = await request.post(
    `${apiBaseUrl}/api/v1/creator/reservations/${reservationId}/confirm`,
    {
      headers: creatorHeaders,
      data: { grossPriceMinor: '39900', serviceTerms: 'One 60-minute portrait session.' },
    },
  );
  expect(response.ok()).toBe(true);
  return (await response.json()) as { readonly orderId: string };
}

async function getReservation(
  request: APIRequestContext,
  resultAccessToken: string,
): Promise<{
  readonly id: string;
  readonly state: string;
  readonly orderId?: string;
}> {
  const response = await request.get(
    `${apiBaseUrl}/api/v1/public/reservations/${resultAccessToken}`,
  );
  expect(response.ok()).toBe(true);
  return (await response.json()) as {
    readonly id: string;
    readonly state: string;
    readonly orderId?: string;
  };
}
