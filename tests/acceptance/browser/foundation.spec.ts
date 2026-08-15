import { expect, test } from '@playwright/test';

import { attachAcceptanceEvidence } from './fixtures/evidence.js';
import { ReferenceClientDriver } from './drivers/reference-client-driver.js';

test('Acceptance Harness starts the governed API and Web Reference Client', async ({
  page,
  request,
}, testInfo) => {
  const apiResponse = await request.get('http://127.0.0.1:45100/api/v1/health');
  expect(apiResponse.ok()).toBe(true);
  const apiHealth: unknown = await apiResponse.json();
  expect(apiHealth).toEqual({
    service: 'vs-01-api',
    status: 'ok',
    version: 'v1',
  });

  const driver = new ReferenceClientDriver(page);
  await driver.openHome();

  await attachAcceptanceEvidence(testInfo, 'foundation-health.json', {
    apiHealth,
    webUrl: page.url(),
  });
});

test('Reference Client route skeletons are reachable without product behaviour', async ({
  page,
}) => {
  const driver = new ReferenceClientDriver(page);

  await driver.openRoute('/creator', '我的商业主页');
  await driver.openRoute('/public', '公开主页');
  await driver.openRoute('/customer', '寻找服务');
});

test('Reference Client exposes no deferred commerce surfaces', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText(/Payment|Checkout|Settlement|Refund|Marketplace|CRM/iu)).toHaveCount(
    0,
  );
});

test('OpenAPI exposes no deferred commerce operations or states', async ({ request }) => {
  const response = await request.get('http://127.0.0.1:45100/openapi.json');
  expect(response.ok()).toBe(true);
  const openApiText = JSON.stringify(await response.json());

  expect(openApiText).not.toMatch(
    /checkout|settlement|refund|marketplace|customer.?crm|gmv|take.?rate|payment.?pending|paid.?pending|fulfilled.?state/iu,
  );
});
