import { expect, test } from '@playwright/test';

const requiredEnvironmentVariables = [
  'DATABASE_URL',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_TEST_EMAIL',
  'SUPABASE_TEST_PASSWORD',
  'CREATOR_ACTOR_MAPPINGS',
] as const;

const missingEnvironmentVariables = requiredEnvironmentVariables.filter(
  (name) => process.env[name]?.trim().length === 0 || process.env[name] === undefined,
);

test.describe('CR-02 real Authenticated Creator Desk', () => {
  test.skip(
    process.env.RUN_REAL_CR02_BROWSER_TESTS !== '1',
    'Set RUN_REAL_CR02_BROWSER_TESTS=1 with controlled Supabase and database configuration.',
  );

  test.beforeAll(() => {
    if (missingEnvironmentVariables.length > 0) {
      throw new Error(
        `CR-02 browser verification requires: ${missingEnvironmentVariables.join(', ')}`,
      );
    }
  });

  test('logs in, restores the session, protects the Creator Desk, and signs out', async ({
    page,
  }) => {
    const failedRequests: string[] = [];
    page.on('requestfailed', (request) => {
      failedRequests.push(
        `${request.method()} ${request.url()} — ${request.failure()?.errorText ?? 'unknown'}`,
      );
    });
    page.on('pageerror', (error) => {
      failedRequests.push(`pageerror — ${error.message}`);
    });
    await page.goto('/creator');

    await expect(page.getByRole('heading', { name: '登录你的创作者工作台' })).toBeVisible();
    await page.getByLabel('邮箱').fill(process.env.SUPABASE_TEST_EMAIL ?? '');
    await page.getByLabel('密码').fill(process.env.SUPABASE_TEST_PASSWORD ?? '');
    await page.getByRole('button', { name: '登录' }).click();

    await expect(page.getByRole('heading', { name: '我的商业主页' })).toBeVisible({
      timeout: 20_000,
    });
    expect(failedRequests).toEqual([]);
    await expect(page.getByRole('button', { name: '退出登录' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: '我的商业主页' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: '名称', exact: true })).toBeVisible();

    await page.getByRole('button', { name: '退出登录' }).click();
    await expect(page.getByRole('heading', { name: '登录你的创作者工作台' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: '名称', exact: true })).toHaveCount(0);
  });

  test('rejects an unmapped or unauthenticated Creator management request', async ({
    page,
    request,
  }) => {
    await page.goto('/creator');
    await expect(page.getByRole('heading', { name: '登录你的创作者工作台' })).toBeVisible();

    const response = await request.get('http://127.0.0.1:45100/api/v1/creator/identity');
    expect(response.status()).toBe(401);
  });
});
