import { test, expect, api, login } from './fixtures';

function utcInput(date: Date): string {
  return date.toISOString().slice(0, 16);
}

test('Creator manages a second homepage and its scheduled window', async ({
  page,
  request,
  seed,
}) => {
  await login(page, seed, '/profile?tab=public');
  await expect(page.getByText('管理的方案：验收公开主页')).toBeVisible();

  const secondName = '验收定时主页';
  await page.getByLabel('公开资料名称').fill(secondName);
  await page.getByRole('button', { name: '创建资料' }).click();
  await expect(
    page.getByLabel('选择资料创建主页版本').getByRole('option', { name: secondName }),
  ).toBeAttached();
  await page.getByLabel('选择资料创建主页版本').selectOption({ label: secondName });
  await page.getByRole('button', { name: '创建主页版本' }).click();
  await expect(page.getByText(`管理的方案：${secondName}`)).toBeVisible();
  await page.getByRole('button', { name: '发布主页' }).click();
  await expect(page.getByRole('button', { name: '设为默认' })).toBeEnabled();
  await page.getByRole('button', { name: '设为默认' }).click();
  await expect(
    page.locator('article').first().locator('.grid > div').filter({ hasText: '默认主页' }),
  ).toContainText(secondName);

  const published = await api(request, 'GET', `/api/v1/private/homepages`, seed.token);
  const second = published.versions.find(
    (version: { commerceProfile?: { displayName: string } }) =>
      version.commerceProfile?.displayName === secondName,
  );
  expect(second?.isDefault).toBe(true);
  const first = published.versions.find(
    (version: { homepageId: string }) => version.homepageId !== second.homepageId,
  );
  await page.getByRole('button', { name: /验收公开主页.*选择管理/ }).click();
  await page.getByRole('button', { name: '设为默认' }).click();
  await expect(
    page.locator('article').first().locator('.grid > div').filter({ hasText: '默认主页' }),
  ).toContainText('验收公开主页');
  await page.getByRole('button', { name: /验收定时主页.*选择管理/ }).click();

  const start = new Date(Date.now() + 3 * 86_400_000);
  start.setUTCHours(10, 0, 0, 0);
  const end = new Date(start.getTime() + 2 * 3_600_000);
  const shanghaiInput = (date: Date) => utcInput(new Date(date.getTime() + 8 * 3_600_000));
  await page.getByLabel('开始时间').fill(shanghaiInput(start));
  await page.getByLabel('结束时间').fill(shanghaiInput(end));
  await page.getByLabel('IANA 时区').fill('Asia/Shanghai');
  await page.getByRole('button', { name: '添加窗口' }).click();
  await expect(page.getByText('Asia/Shanghai · 已启用')).toBeVisible();
  const scheduled = await api(request, 'GET', '/api/v1/private/homepages', seed.token);
  const window = scheduled.windows.find(
    (item: { homepageId: string }) => item.homepageId === second.homepageId,
  );
  expect(new Date(window.startsAt).toISOString()).toBe(start.toISOString());
  expect(new Date(window.endsAt).toISOString()).toBe(end.toISOString());

  await page
    .getByLabel('指定预览时间（UTC）')
    .fill(utcInput(new Date(start.getTime() + 3_600_000)));
  await page.getByRole('button', { name: '按时间预览' }).click();
  await expect(page.getByText(`这是“${secondName}”的主页预览`)).toBeVisible();

  await page.getByLabel('开始时间').fill(shanghaiInput(new Date(start.getTime() + 1_800_000)));
  await page.getByLabel('结束时间').fill(shanghaiInput(new Date(end.getTime() + 3_600_000)));
  await page.getByRole('button', { name: '添加窗口' }).click();
  await expect(page.getByRole('status')).toContainText('overlaps another enabled window');

  await page.getByRole('button', { name: '禁用' }).click();
  await expect(page.getByText('Asia/Shanghai · 已禁用')).toBeVisible();
  await page.getByRole('button', { name: '按时间预览' }).click();
  await expect(page.getByText('这是“验收公开主页”的主页预览')).toBeVisible();
  await page.getByRole('button', { name: '编辑' }).click();
  await expect(page.getByLabel('开始时间')).toHaveValue(shanghaiInput(start));
  await expect(page.getByLabel('结束时间')).toHaveValue(shanghaiInput(end));
  await page.getByLabel('窗口状态').selectOption('ENABLED');
  await page.getByRole('button', { name: '保存窗口' }).click();
  await expect(page.getByText('Asia/Shanghai · 已启用')).toBeVisible();

  const final = await api(request, 'GET', '/api/v1/private/homepages', seed.token);
  expect(final.defaultHomepageId).toBe(first.homepageId);
  expect(
    final.windows.filter(
      (window: { homepageId: string }) => window.homepageId === second.homepageId,
    ),
  ).toHaveLength(1);
  await page.getByRole('button', { name: '暂停主页' }).click();
  await expect(page.getByRole('button', { name: '发布主页' })).toBeVisible();
  await page.getByRole('button', { name: '归档版本' }).click();
  await expect(page.getByRole('button', { name: '发布主页' })).toBeDisabled();
});
