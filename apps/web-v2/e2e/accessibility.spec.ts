import AxeBuilder from '@axe-core/playwright';
import { test, expect, login, api, submitRequest } from './fixtures';

test('lookup and dashboard pass automated WCAG A/AA checks', async ({ page, seed }) => {
  test.setTimeout(120_000);
  async function checkPage() {
    const results = await new AxeBuilder({ page })
      .exclude('nextjs-portal')
      .exclude('[aria-label="Open Tanstack query devtools"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(
      results.violations.map(({ id, impact, nodes }) => ({
        id,
        impact,
        targets: nodes.map(({ target }) => target),
      })),
    ).toEqual([]);
  }
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '查找创作者' })).toBeVisible();
  await checkPage();
  await login(page, seed, '/dashboard');
  await expect(page.getByRole('region', { name: '对外稳定分享工具' })).toBeVisible();
  await checkPage();
});

test('populated creator and public routes pass automated WCAG A/AA checks', async ({
  page,
  request,
  seed,
}) => {
  test.setTimeout(240_000);
  const failures: Array<{
    path: string;
    id: string;
    impact: string | null | undefined;
    targets: Array<{ selector: string[]; html: string; summary: string | undefined }>;
  }> = [];
  async function scan(path: string) {
    const results = await new AxeBuilder({ page })
      .exclude('nextjs-portal')
      .exclude('[aria-label="Open Tanstack query devtools"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    failures.push(
      ...results.violations.map(({ id, impact, nodes }) => ({
        path,
        id,
        impact,
        targets: nodes.map(({ target, html, failureSummary }) => ({
          selector: target,
          html: html.slice(0, 180),
          summary: failureSummary?.slice(0, 220),
        })),
      })),
    );
  }

  const publicAuthRoutes = [
    { path: '/auth/login', ready: () => page.getByRole('heading', { name: '欢迎回来' }) },
    { path: '/auth/signup', ready: () => page.getByRole('heading', { name: '开始使用' }) },
    { path: '/auth/forgot-password', ready: () => page.getByRole('heading', { name: '重置密码' }) },
    { path: '/auth/reset-password', ready: () => page.getByText('无效的链接') },
  ];
  for (const route of publicAuthRoutes) {
    await page.goto(route.path);
    await expect(route.ready()).toBeVisible();
    await scan(route.path);
  }

  const identity = await api(request, 'GET', '/api/v1/creator/identity', seed.token);
  const capabilityId = identity.capabilityIds[0];
  expect(capabilityId).toBeTruthy();
  const visitorResult = await submitRequest(request, seed, '无障碍验收访客');
  await login(page, seed, '/dashboard');

  const routes = [
    { path: '/profile', ready: () => page.getByRole('heading', { name: '个人资料' }) },
    { path: '/profile?tab=public', ready: () => page.getByText('管理的方案：验收公开主页') },
    { path: '/profile/edit', ready: () => page.getByLabel('您的名字') },
    { path: '/capabilities', ready: () => page.getByRole('heading', { name: '咨询能力' }) },
    { path: '/capabilities/new', ready: () => page.getByLabel('能力名称') },
    { path: '/capabilities/' + capabilityId + '/edit', ready: () => page.getByLabel('能力名称') },
    { path: '/services', ready: () => page.getByRole('heading', { name: seed.title }) },
    { path: '/services/new', ready: () => page.getByRole('button', { name: '咨询能力' }) },
    {
      path: '/services/' + seed.offeringId,
      ready: () => page.getByRole('heading', { name: seed.title }),
    },
    { path: '/services/' + seed.offeringId + '/edit', ready: () => page.getByLabel('服务名称') },
    {
      path: '/requests',
      ready: () => page.getByTestId('request-card').filter({ hasText: '无障碍验收访客' }),
    },
    {
      path: '/onboarding/welcome',
      ready: () => page.getByRole('heading', { name: '开始创建您的主页' }),
    },
    {
      path: '/r/' + seed.reference,
      ready: () => page.getByRole('heading', { name: '验收公开主页' }),
    },
    { path: '/s/' + seed.offeringId, ready: () => page.getByRole('heading', { name: seed.title }) },
    {
      path: '/o/' + visitorResult.resultAccessToken,
      ready: () => page.getByTestId('status-badge'),
    },
  ];
  for (const route of routes) {
    await page.goto(route.path);
    if (route.path === '/services') await page.getByRole('tab', { name: /已发布/ }).click();
    await expect(route.ready()).toBeVisible();
    await scan(route.path);
  }
  expect(failures).toEqual([]);
});
