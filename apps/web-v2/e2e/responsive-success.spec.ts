import { test, expect, api, login, submitRequest } from './fixtures';

test('loaded creator and public pages fit the required viewport widths', async ({
  page,
  request,
  seed,
}) => {
  test.setTimeout(180_000);
  const identity = await api(request, 'GET', '/api/v1/creator/identity', seed.token);
  const capabilityId = identity.capabilityIds[0];
  expect(capabilityId).toBeTruthy();
  const result = await submitRequest(request, seed, '响应式测试访客');
  await login(page, seed);
  const failedApiResponses: string[] = [];
  page.on('response', (response) => {
    if (response.url().includes('/api/v1/') && response.status() >= 400) {
      failedApiResponses.push(
        `${response.status()} ${response.request().method()} ${response.url()}`,
      );
    }
  });

  const routes = [
    { path: '/', ready: () => page.getByRole('heading', { name: '查找创作者' }) },
    { path: '/dashboard', ready: () => page.getByText('商业身份：验收创作者') },
    { path: '/profile', ready: () => page.getByText('隔离环境的前端验收资料') },
    { path: '/profile?tab=public', ready: () => page.getByText('管理的方案：验收公开主页') },
    { path: '/profile/edit', ready: () => page.getByLabel('您的名字') },
    { path: '/capabilities', ready: () => page.getByRole('heading', { name: '咨询能力' }) },
    { path: '/capabilities/new', ready: () => page.getByLabel('能力名称') },
    { path: `/capabilities/${capabilityId}/edit`, ready: () => page.getByLabel('能力名称') },
    { path: '/services', ready: () => page.getByRole('heading', { name: seed.title }) },
    { path: '/services/new', ready: () => page.getByRole('button', { name: '咨询能力' }) },
    {
      path: `/services/${seed.offeringId}`,
      ready: () => page.getByRole('heading', { name: seed.title }),
    },
    { path: `/services/${seed.offeringId}/edit`, ready: () => page.getByLabel('服务名称') },
    {
      path: '/requests',
      ready: () => page.getByTestId('request-card').filter({ hasText: '响应式测试访客' }),
    },
    {
      path: `/r/${seed.reference}`,
      ready: () => page.getByRole('heading', { name: '验收公开主页' }),
    },
    { path: `/s/${seed.offeringId}`, ready: () => page.getByRole('heading', { name: seed.title }) },
    { path: `/o/${result.resultAccessToken}`, ready: () => page.getByTestId('status-badge') },
  ];

  for (const route of routes) {
    await page.goto(route.path);
    if (route.path === '/services') {
      await page.getByRole('tab', { name: /已发布/ }).click();
    }
    await expect(route.ready(), `${route.path}: ${failedApiResponses.join('; ')}`).toBeVisible();
    if (route.path === '/profile/edit') {
      await expect(page.getByLabel('您的名字')).toHaveValue('验收创作者');
    }
    if (route.path === `/capabilities/${capabilityId}/edit`) {
      await expect(page.getByLabel('能力名称')).toHaveValue('咨询能力');
    }
    if (route.path === `/services/${seed.offeringId}/edit`) {
      await expect(page.getByLabel('服务名称')).toHaveValue(seed.title);
    }
    if (route.path === `/o/${result.resultAccessToken}`) {
      await expect(page.getByTestId('status-badge')).toHaveText('等待 Creator 回复');
    }
    for (const width of [320, 375, 768, 1280, 1600]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        `${route.path} overflows at ${width}px`,
      ).toBe(true);
    }
  }
});
