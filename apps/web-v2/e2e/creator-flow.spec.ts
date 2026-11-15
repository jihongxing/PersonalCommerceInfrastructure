import { randomUUID } from 'node:crypto';
import { test, expect, api, apiBase, login, submitRequest } from './fixtures';

test('Creator confirms a request and completes the fulfillment confirmation', async ({
  page,
  request,
  seed,
}) => {
  const result = await submitRequest(request, seed, '确认测试访客');
  await login(page, seed);
  const card = page.getByTestId('request-card').filter({ hasText: '确认测试访客' });
  await card.getByRole('button', { name: '确认请求', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('已确认请求');
  const outcome = await api(request, 'GET', `/api/v1/public/requests/${result.resultAccessToken}`);
  expect(outcome.state).toBe('confirmed');
  expect(outcome.fulfillmentCode.status).toBe('pending');
  expect(outcome.fulfillmentCode.code).toMatch(/^FC-[A-Z0-9]{8}$/);
  await page.getByRole('tab', { name: /已确认/ }).click();
  const confirmedCard = page.getByTestId('request-card').filter({ hasText: '确认测试访客' });
  await confirmedCard.getByLabel('输入客户提供的履约码').fill(outcome.fulfillmentCode.code);
  await confirmedCard.getByRole('button', { name: '确认履约' }).click();
  await expect(page.getByRole('status')).toHaveText('已确认履约');
  await page.goto(`/o/${result.resultAccessToken}`);
  await expect(page.getByTestId('status-badge')).toHaveText('已确认');
  await expect(page.getByText('履约码')).toBeVisible();
  await expect(page.getByText(outcome.fulfillmentCode.code)).toBeVisible();
});

test('Creator rejects a request and logout protects the deep link', async ({
  page,
  request,
  seed,
}) => {
  const result = await submitRequest(request, seed, '拒绝测试访客');
  await login(page, seed);
  await page
    .getByTestId('request-card')
    .filter({ hasText: '拒绝测试访客' })
    .getByRole('button', { name: '拒绝请求' })
    .click();
  await expect(page.getByRole('status')).toHaveText('已拒绝请求');
  expect(
    (await api(request, 'GET', `/api/v1/public/requests/${result.resultAccessToken}`)).state,
  ).toBe('declined');
  await page.goto(`/o/${result.resultAccessToken}`);
  await expect(page.getByTestId('status-badge')).toHaveText('已拒绝');
  await expect(page.getByText('很抱歉，Creator 无法接受此请求。')).toBeVisible();
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
    .getByRole('button', { name: '确认请求' })
    .click();
  await expect(page.getByRole('status')).toHaveText('已确认请求');
  const repeated = await request.post(`${path}/decline`, {
    headers: { authorization: `Bearer ${seed.token}` },
  });
  expect(repeated.status()).toBe(409);
  await page.goto(`/o/${result.resultAccessToken}`);
  await expect(page.getByTestId('status-badge')).toHaveText('已确认');
});

test('a protected Creator page without the BFF session returns to login', async ({ page }) => {
  await page.goto('/requests');
  await expect(page).toHaveURL(/\/auth\/login\?/);
  expect(new URL(page.url()).searchParams.get('returnTo')).toBe('/requests');
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
