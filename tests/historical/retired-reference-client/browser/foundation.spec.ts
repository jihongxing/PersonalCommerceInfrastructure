import { expect, test } from '@playwright/test';

import { attachAcceptanceEvidence } from './fixtures/evidence.js';
import { ReferenceClientDriver } from './drivers/reference-client-driver.js';

test('Acceptance Harness starts the governed API and Web Reference Client', async ({
  page,
  request,
}, testInfo) => {
  const apiResponse = await request.get('http://127.0.0.1:41000/api/v1/health');
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

test('Reference Client exposes no unapproved product expansion surfaces', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByText(/Marketplace|Customer CRM|Subscription|Multi-currency/iu),
  ).toHaveCount(0);
});

test('OpenAPI preserves the VS-01 contract while allowing governed VS-02 operations', async ({
  request,
}) => {
  const response = await request.get('http://127.0.0.1:41000/openapi.json');
  expect(response.ok()).toBe(true);
  const openApi = (await response.json()) as {
    readonly paths: Readonly<
      Record<string, Readonly<Record<string, { readonly operationId?: string }>>>
    >;
  };
  const operations = new Map(
    Object.entries(openApi.paths).flatMap(([path, pathItem]) =>
      Object.entries(pathItem).map(([method, operation]) => [
        `${method.toUpperCase()} ${path}`,
        operation.operationId,
      ]),
    ),
  );
  const vs01Operations = {
    'GET /api/v1/creator/confirmed-requests': 'listCreatorConfirmedRequests',
    'GET /api/v1/creator/identity': 'getCreatorIdentity',
    'GET /api/v1/creator/offerings': 'listCreatorServiceOfferings',
    'GET /api/v1/creator/requests': 'listCreatorSubmittedRequests',
    'GET /api/v1/public/offerings/{offeringId}': 'getPublicServiceOffering',
    'GET /api/v1/public/requests/{resultAccessToken}': 'getCustomerRequestResult',
    'PATCH /api/v1/creator/identity': 'updateCreatorIdentity',
    'PATCH /api/v1/creator/offerings/{offeringId}': 'updateCreatorServiceOffering',
    'POST /api/v1/creator/identity': 'createCreatorIdentity',
    'POST /api/v1/creator/identity/capabilities': 'addCreatorCapability',
    'POST /api/v1/creator/offerings': 'createCreatorServiceOffering',
    'POST /api/v1/creator/offerings/{offeringId}/distribution': 'recordCreatorExternalDistribution',
    'POST /api/v1/creator/offerings/{offeringId}/publish': 'publishCreatorServiceOffering',
    'POST /api/v1/creator/offerings/{offeringId}/unpublish': 'unpublishCreatorServiceOffering',
    'POST /api/v1/creator/requests/{actionId}/confirm': 'confirmCreatorRequest',
    'POST /api/v1/creator/requests/{actionId}/decline': 'declineCreatorRequest',
    'POST /api/v1/public/offerings/{offeringId}/requests': 'submitCustomerRequest',
  } as const;

  for (const [route, operationId] of Object.entries(vs01Operations)) {
    expect(operations.get(route), route).toBe(operationId);
  }

  expect(operations.get('GET /api/v1/creator/wallet')).toBe('getCreatorEarningsWallet');
  expect(operations.get('POST /api/v1/creator/paid-orders')).toBe('createPaidServiceOrder');
});
