import { randomUUID } from 'node:crypto';
import { test, expect, api, apiBase, login, submitRequest } from './fixtures';

test('Creator confirms a real request and verifies the visitor fulfillment code', async ({
  page,
  request,
  seed,
}) => {
  const result = await submitRequest(request, seed, '确认测试访客');
  await login(page, seed);
  const card = page.getByTestId('request-card').filter({ hasText: '确认测试访客' });
  await card.getByRole('button', { name: '确认预约', exact: true }).click();
  await expect(card).toHaveCount(0);
  await page.getByRole('tab', { name: /已确认/ }).click();
  const confirmed = page.getByTestId('request-card').filter({ hasText: '确认测试访客' });
  const submitted = await api(
    request,
    'GET',
    `/api/v1/public/requests/${result.resultAccessToken}`,
  );
  const invalidCode =
    submitted.fulfillmentCode.code === 'FC-00000000' ? 'FC-11111111' : 'FC-00000000';
  await confirmed.getByLabel('访客提供的履约码').fill(invalidCode);
  const failedFulfillment = page.waitForResponse(
    (response) =>
      response.url().includes('/confirm-fulfillment') && response.request().method() === 'POST',
  );
  await confirmed.getByRole('button', { name: '确认履约', exact: true }).click();
  expect((await failedFulfillment).ok()).toBe(false);
  await expect(page.getByRole('status')).not.toHaveText('已确认履约');
  const afterFailure = await api(
    request,
    'GET',
    `/api/v1/public/requests/${result.resultAccessToken}`,
  );
  expect(afterFailure.fulfillmentCode.status).toBe('pending');
  await confirmed.getByLabel('访客提供的履约码').fill(submitted.fulfillmentCode.code);
  await confirmed.getByRole('button', { name: '确认履约', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('已确认履约');
  const outcome = await api(request, 'GET', `/api/v1/public/requests/${result.resultAccessToken}`);
  expect(outcome.state).toBe('confirmed');
  expect(outcome.fulfillmentCode.status).toBe('fulfilled');
  await page.goto(`/o/${result.resultAccessToken}`);
  await expect(page.getByText('已使用', { exact: true })).toBeVisible();
});

test('Creator rejects a real request and logout protects the deep link', async ({
  page,
  request,
  seed,
}) => {
  const result = await submitRequest(request, seed, '拒绝测试访客');
  await login(page, seed);
  await page
    .getByTestId('request-card')
    .filter({ hasText: '拒绝测试访客' })
    .getByRole('button', { name: '拒绝预约' })
    .click();
  await expect(page.getByTestId('request-card')).toHaveCount(0);
  expect(
    (await api(request, 'GET', `/api/v1/public/requests/${result.resultAccessToken}`)).state,
  ).toBe('declined');
  await page.goto(`/o/${result.resultAccessToken}`);
  await expect(page.getByTestId('status-badge')).toHaveText('已拒绝');
  await expect(
    page.getByText('很抱歉，Creator 无法接受此预约。您可以尝试调整需求后重新提交。'),
  ).toBeVisible();
  await page.goto('/requests');
  await page.getByRole('button', { name: '退出登录' }).click();
  await page.goto('/requests');
  await expect(page).toHaveURL(/\/auth\/login/);
});

test('another Creator and a repeated decision cannot change the request', async ({
  page,
  request,
  seed,
}) => {
  const result = await submitRequest(request, seed, '权限测试访客');
  const submitted = await api(
    request,
    'GET',
    `/api/v1/public/requests/${result.resultAccessToken}`,
  );
  const other = await api(request, 'POST', '/api/v1/auth/signup', undefined, {
    email: `plan116-other-${randomUUID()}@example.test`,
    password: 'Plan116-Acceptance9!',
    name: '另一个创作者',
  });
  const path = `${apiBase}/api/v1/creator/requests/${submitted.actionId}`;
  const unauthorized = await request.post(`${path}/confirm`, {
    headers: { authorization: `Bearer ${other.accessToken}` },
  });
  expect(unauthorized.status()).toBe(403);
  expect(
    (await api(request, 'GET', `/api/v1/public/requests/${result.resultAccessToken}`)).state,
  ).toBe('submitted');

  await login(page, seed);
  await page
    .getByTestId('request-card')
    .filter({ hasText: '权限测试访客' })
    .getByRole('button', { name: '确认预约' })
    .click();
  await expect(page.getByRole('status')).toHaveText('已确认预约');
  const repeated = await request.post(`${path}/decline`, {
    headers: { authorization: `Bearer ${seed.token}` },
  });
  expect(repeated.status()).toBe(409);
  await page.goto(`/o/${result.resultAccessToken}`);
  await expect(page.getByTestId('status-badge')).toHaveText('已确认');
});

test('expired session without a refresh token returns to login with its destination', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem(
      'pci.auth.session',
      JSON.stringify({ accessToken: 'expired', userEmail: 'expired@example.test', expiresAt: 1 }),
    );
  });
  await page.goto('/profile?tab=public');
  await expect(page).toHaveURL(/\/auth\/login\?/);
  await expect(page.getByLabel('邮箱地址')).toBeVisible();
  expect(new URL(page.url()).searchParams.get('returnTo')).toBe('/profile?tab=public');
  expect(await page.evaluate(() => localStorage.getItem('pci.auth.session'))).toBeNull();
});

test('dashboard and homepage management expose the same stable sharing URL', async ({
  page,
  seed,
}) => {
  await login(page, seed, '/dashboard');
  const sharing = page.getByRole('region', { name: '对外稳定分享工具' });
  await expect(sharing.getByRole('img', { name: '对外主页地址二维码' })).toBeVisible();
  const url = await sharing.locator('.stable-sharing-url').innerText();
  expect(new URL(url).pathname).toBe(`/r/${seed.reference}`);
  const image = sharing.getByRole('img', { name: '对外主页地址二维码' });
  const qr = await image.getAttribute('src');
  await page.goto('/profile?tab=public');
  await expect(sharing.locator('.stable-sharing-url')).toHaveText(url);
  await expect(image).toHaveAttribute('src', qr!);
  await expect(sharing.getByRole('link', { name: '下载二维码' })).toHaveAttribute(
    'download',
    'commerce-homepage.png',
  );
});
