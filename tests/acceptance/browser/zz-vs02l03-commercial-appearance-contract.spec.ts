import { expect, test, type APIRequestContext } from '@playwright/test';

const apiBaseUrl = 'http://127.0.0.1:41000';
const creatorHeaders = { authorization: 'Bearer test-creator-token' };

test('CON-01 through CON-07 expose Quote then Accept Contract Commerce through the Reference Client', async ({
  page,
}) => {
  const fixture = await createCommercialAppearanceRequest(page.request);

  await page.goto('/creator');
  const workspace = page
    .locator('.ds-page__surface')
    .filter({ has: page.getByRole('heading', { name: '商业演出 Quote / Scope' }) });
  await expect(workspace).toBeVisible();
  await workspace.getByLabel('Buyer Request').selectOption(fixture.actionId);
  await workspace.getByLabel('表演类型：').fill('Brand appearance');
  await workspace.getByLabel('日期：').fill('2026-09-10T12:00');
  await workspace.getByLabel('地点：').fill('Shanghai venue');
  await workspace.getByLabel('时长：').fill('45');
  await workspace.getByLabel('Creator 人数：').fill('4');
  await workspace.getByLabel('价格：').fill('39900');
  await workspace.getByLabel('交付 / 演出内容：').fill('A 45-minute branded stage appearance.');
  await workspace.getByRole('button', { name: '发送 Quote / Scope' }).click();
  await expect(page.getByText('Quote 已发送，等待 Buyer 接受。')).toBeVisible();

  await page.goto(`/public/requests/${fixture.resultAccessToken}`);
  await expect(page.getByRole('heading', { name: 'Review Quote / Scope' })).toBeVisible();
  await expect(page.getByText('Brand appearance')).toBeVisible();
  await expect(page.getByText('Shanghai venue')).toBeVisible();
  await expect(page.getByText('A 45-minute branded stage appearance.')).toBeVisible();
  await expect(page.getByRole('button', { name: '接受 Quote' })).toBeVisible();
  await page.getByRole('button', { name: '接受 Quote' }).click();
  await expect(page.getByText(/状态：contracted/)).toBeVisible();
  const checkout = await page.request.get(
    `${apiBaseUrl}/api/v1/local-commerce/requests/${fixture.resultAccessToken}/checkout`,
  );
  expect(checkout.ok()).toBe(true);
  expect(await checkout.json()).toMatchObject({
    origin: 'simulation',
    order: { state: 'payment_pending' },
    payment: { state: 'pending' },
  });
});

async function createCommercialAppearanceRequest(
  request: APIRequestContext,
): Promise<{ readonly actionId: string; readonly resultAccessToken: string }> {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const identity = await request.post(`${apiBaseUrl}/api/v1/creator/identity`, {
    headers: creatorHeaders,
    data: {
      profile: {
        displayName: `Commercial appearance creator ${suffix}`,
        bio: 'Commercial appearances.',
        socialLinks: [],
      },
    },
  });
  expect([201, 409]).toContain(identity.status());

  const capability = await request.post(`${apiBaseUrl}/api/v1/creator/identity/capabilities`, {
    headers: creatorHeaders,
    data: {
      name: `Commercial performance ${suffix}`,
      description: 'Brand appearance.',
    },
  });
  expect(capability.ok()).toBe(true);
  const capabilityId = ((await capability.json()) as { readonly capabilityIds: string[] })
    .capabilityIds[0];

  const offering = await request.post(`${apiBaseUrl}/api/v1/creator/offerings`, {
    headers: creatorHeaders,
    data: {
      capabilityIds: [capabilityId],
      title: `Commercial appearance ${suffix}`,
      description: 'One commercial performance engagement.',
      availabilityDescription: 'Subject to a confirmed scope.',
      requestInstructions: 'Describe the commercial appearance request.',
    },
  });
  expect(offering.ok()).toBe(true);
  const offeringId = ((await offering.json()) as { readonly id: string }).id;

  const published = await request.post(
    `${apiBaseUrl}/api/v1/creator/offerings/${offeringId}/publish`,
    { headers: creatorHeaders },
  );
  expect(published.ok()).toBe(true);

  const submitted = await request.post(
    `${apiBaseUrl}/api/v1/public/offerings/${offeringId}/requests`,
    {
      data: {
        contactName: 'Commercial buyer',
        contactMethod: `commercial-buyer-${suffix}@example.test`,
        requestMessage: 'We need a branded stage appearance.',
      },
    },
  );
  expect(submitted.ok()).toBe(true);
  return (await submitted.json()) as {
    readonly actionId: string;
    readonly resultAccessToken: string;
  };
}
