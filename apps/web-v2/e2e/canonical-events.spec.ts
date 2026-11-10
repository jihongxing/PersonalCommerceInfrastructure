import postgres from 'postgres';
import { test, expect, api, apiBase, login } from './fixtures';

const databaseUrl = process.env.E2E_DATABASE_URL;
test.skip(!databaseUrl, 'Set E2E_DATABASE_URL to a dedicated integration database.');
if (databaseUrl && !new URL(databaseUrl).pathname.includes('integration')) {
  throw new Error('E2E_DATABASE_URL must identify a dedicated integration database.');
}

test('public request and Creator confirmation persist the matching canonical events', async ({
  page,
  request,
  seed,
}) => {
  test.setTimeout(120_000);
  if (process.env.E2E_ISOLATED_API !== '1') {
    throw new Error('This test requires a disposable local API and database.');
  }
  const sql = postgres(databaseUrl!, { max: 1, prepare: false });
  try {
    await page.goto(`/r/${seed.reference}`);
    await expect(page.getByRole('heading', { name: '验收公开主页' })).toBeVisible();
    await page.getByRole('link', { name: `查看服务：${seed.title}` }).click();
    await page.getByLabel('您的姓名').fill('事件链路访客');
    await page.getByLabel('联系方式', { exact: true }).fill('event-visitor@example.test');
    await page.getByLabel('预约说明', { exact: true }).fill('验证页面操作和规范事件关联');
    await page.getByRole('button', { name: '提交预约', exact: true }).click();
    await expect(page).toHaveURL(/\/o\/[a-f0-9-]+$/);
    const resultAccessToken = (await page.getByTestId('query-code').innerText()).trim();
    const result = await api(request, 'GET', `/api/v1/public/requests/${resultAccessToken}`);
    const actionId = result.actionId as string;
    expect(actionId).toBeTruthy();
    const submittedEvents = await sql<{ name: string }[]>`
      SELECT name FROM product_events
      WHERE object_id = ${actionId} AND name = 'commerce_action_submitted'
    `;
    expect(submittedEvents).toHaveLength(1);

    await login(page, seed, '/requests');
    const card = page.getByTestId('request-card').filter({ hasText: '事件链路访客' });
    await card.getByRole('button', { name: '确认预约', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText('已确认预约');
    const rejectedDecision = await request.post(
      `${apiBase}/api/v1/creator/requests/${actionId}/decline`,
      { headers: { authorization: `Bearer ${seed.token}` } },
    );
    expect(rejectedDecision.status()).toBe(409);
    const events = await sql<{ name: string }[]>`
      SELECT name FROM product_events
      WHERE object_id = ${actionId}
        AND name IN ('commerce_action_submitted', 'commerce_confirmed', 'commerce_declined')
      ORDER BY occurred_at
    `;
    expect(events.map(({ name }) => name).sort()).toEqual([
      'commerce_action_submitted',
      'commerce_confirmed',
    ]);
  } finally {
    await sql.end();
  }
});
