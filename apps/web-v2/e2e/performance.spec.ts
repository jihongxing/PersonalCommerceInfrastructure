import { test, expect, apiBase } from './fixtures';

test('published homepage has no horizontal overflow at the required widths', async ({
  page,
  seed,
}, testInfo) => {
  for (const width of [320, 375, 768, 1280, 1600]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/r/${seed.reference}`);
    await expect(page.getByRole('heading', { name: '验收公开主页' })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  await testInfo.attach('local-navigation-timing.json', {
    body: JSON.stringify(
      await page.evaluate(() => performance.getEntriesByType('navigation').map((e) => e.toJSON())),
    ),
    contentType: 'application/json',
  });
});

test('controlled API failure shows retry and then recovers real data', async ({ page, seed }) => {
  const route = `${apiBase}/api/v1/public/homepages/**`;
  await page.route(route, (r) => r.fulfill({ status: 503, body: '{}' }));
  await page.goto(`/r/${seed.reference}`);
  await expect(page.getByRole('heading', { name: '加载失败' })).toBeVisible();
  await page.unroute(route);
  await page.getByRole('button', { name: '重试' }).click();
  await expect(page.getByRole('heading', { name: '验收公开主页' })).toBeVisible();
});
