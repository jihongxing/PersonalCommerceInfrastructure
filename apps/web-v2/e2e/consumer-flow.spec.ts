import { test, expect, api, apiBase, login, submitRequest } from './fixtures';

test('anonymous visitor resolves a real homepage, submits and refreshes a request', async ({
  page,
  seed,
}) => {
  await page.goto(`/r/${seed.reference.toLowerCase()}`);
  await expect(page.getByRole('heading', { name: '验收公开主页' })).toBeVisible();
  await page.getByRole('link', { name: `查看服务：${seed.title}` }).click();
  await expect(page).toHaveURL(new RegExp(`/s/${seed.offeringId}$`));
  await page.getByRole('button', { name: '提交预约', exact: true }).click();
  await expect(page.getByText('请输入您的姓名', { exact: true })).toBeVisible();
  await page.getByLabel('您的姓名').fill('端到端访客');
  await page.getByLabel('联系方式', { exact: true }).fill('visitor@example.test');
  await page.getByLabel('预约说明', { exact: true }).fill('真实隔离 API 的预约说明');
  await page.getByRole('button', { name: '提交预约', exact: true }).click();
  await expect(page).toHaveURL(/\/o\/[a-f0-9-]+$/);
  await expect(page.getByTestId('status-badge')).toHaveText('等待 Creator 回复');
  const token = (await page.getByTestId('query-code').innerText()).trim();
  expect(token).toBeTruthy();
  const refresh = page.waitForResponse(
    (r) => r.url().includes(`/public/requests/${token}`) && r.status() === 200,
  );
  await page.getByRole('button', { name: '手动刷新状态' }).click();
  await refresh;
});

test('invalid result and legacy service URLs have explicit outcomes', async ({ page, seed }) => {
  await page.goto('/o/invalid-token-xyz');
  await expect(page.getByText('查询失败', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '重试' })).toBeVisible();
  await page.goto(`/public/${seed.offeringId}`);
  await expect(page).toHaveURL(new RegExp(`/s/${seed.offeringId}$`));
  await expect(page.getByRole('button', { name: '提交预约', exact: true })).toBeVisible();
});

test('existing result survives service unpublication and new submission is unavailable', async ({
  page,
  request,
  seed,
}) => {
  const result = await submitRequest(request, seed, '下架前访客');
  await api(request, 'POST', `/api/v1/creator/offerings/${seed.offeringId}/unpublish`, seed.token);
  await page.goto(`/o/${result.resultAccessToken}`);
  await expect(page.getByTestId('status-badge')).toHaveText('等待 Creator 回复');
  await page.goto(`/s/${seed.offeringId}`);
  await expect(page.getByRole('button', { name: '提交预约', exact: true })).toHaveCount(0);

  const rejected = await request.post(
    `${apiBase}/api/v1/public/offerings/${seed.offeringId}/requests`,
    {
      data: {
        contactName: '下架后访客',
        contactMethod: 'after-unpublish@example.test',
        requestMessage: '不应创建的请求',
      },
    },
  );
  expect(rejected.status()).toBe(422);
  expect(await rejected.json()).toMatchObject({ error: { code: 'service_offering_unavailable' } });

  await login(page, seed);
  const existing = page.getByTestId('request-card').filter({ hasText: '下架前访客' });
  await existing.getByRole('button', { name: '确认预约', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('已确认预约');
  await page.goto(`/o/${result.resultAccessToken}`);
  await expect(page.getByTestId('status-badge')).toHaveText('已确认');
});
