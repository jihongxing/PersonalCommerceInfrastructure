import { expect, test, type Page } from '@playwright/test';

function offeringCard(page: Page, title: string) {
  return page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: '我的服务草稿' }) })
    .locator('.ds-list-item')
    .filter({ hasText: title });
}

async function createPublishedOffering(page: Page, title: string): Promise<string> {
  await page.goto('/creator');
  await expect(page.getByRole('status')).not.toHaveText('正在准备工作台…');

  await page.getByRole('textbox', { name: '名称', exact: true }).fill('M5 Browser Dancer');
  await page.getByLabel('个人介绍').fill('Private dance lessons');
  await page.getByRole('button', { name: /创建主页|保存修改/ }).click();
  await expect(page.getByRole('status')).toHaveText(/主页已创建。|主页已保存。/);

  await page.getByLabel('服务名称').fill('M5 Private Dance Lesson');
  await page.getByLabel('服务说明').fill('One-on-one dance instruction');
  await page.getByRole('button', { name: '添加服务能力' }).click();
  await expect(page.getByRole('status')).toHaveText('服务能力已添加。');

  await page.getByLabel('服务标题').fill(title);
  await page.getByLabel('关联服务').selectOption({ label: 'M5 Private Dance Lesson' });
  await page.getByLabel('服务介绍').fill('适合希望系统练习的舞者。');
  await page.getByLabel('可请求条件').fill('周末可约，具体时间需沟通确认');
  await page.getByLabel('客户需要提供的信息').fill('请说明期望时间和舞蹈基础');
  await page.getByRole('button', { name: '保存服务草稿' }).click();
  await expect(page.getByRole('status')).toHaveText('服务草稿已保存。');

  const card = offeringCard(page, title);
  await card.getByRole('button', { name: '公开服务' }).click();
  await expect(page.getByRole('status')).toHaveText('服务已公开，并生成了分享入口。');
  return (await card.getByRole('link').getAttribute('href')) as string;
}

test('AT-005 Buyer opens public Storefront and views a Published Offering', async ({ page }) => {
  const title = `M5 公开服务 ${String(Date.now())}`;
  const publicUrl = await createPublishedOffering(page, title);

  await page.goto(publicUrl);
  await expect(page.getByRole('heading', { name: 'M5 Browser Dancer' })).toBeVisible();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await expect(page.getByText('可请求条件：周末可约，具体时间需沟通确认')).toBeVisible();
  await expect(page.getByText('提交说明：请说明期望时间和舞蹈基础')).toBeVisible();
});

test('AT-006 Buyer submits a valid Request', async ({ page }) => {
  const title = `M5 请求服务 ${String(Date.now())}`;
  const publicUrl = await createPublishedOffering(page, title);

  await page.goto(publicUrl);
  await page.getByLabel('你的称呼').fill('Browser Buyer');
  await page.getByLabel('联系方式').fill(`buyer-${String(Date.now())}@example.test`);
  await page.getByLabel('你的请求说明').fill('希望周末安排一次基础练习。');
  await page.getByRole('button', { name: '提交请求' }).click();
  await expect(page.getByRole('status')).toHaveText('请求已提交，正在等待创作者处理。');
});

test('AT-007 and AT-011 block new Requests after Unpublish while preserving the request record', async ({
  page,
}) => {
  const title = `M5 下线服务 ${String(Date.now())}`;
  const publicUrl = await createPublishedOffering(page, title);

  await page.goto(publicUrl);
  await page.getByLabel('你的称呼').fill('Browser Buyer');
  await page.getByLabel('联系方式').fill(`buyer-${String(Date.now())}@example.test`);
  await page.getByLabel('你的请求说明').fill('希望周末安排一次基础练习。');
  await page.getByRole('button', { name: '提交请求' }).click();
  await expect(page.getByRole('status')).toHaveText('请求已提交，正在等待创作者处理。');

  await page.goto('/creator');
  const card = offeringCard(page, title);
  await card.getByRole('button', { name: '下线服务' }).click();
  await expect(page.getByRole('status')).toHaveText('服务已下线，既有请求不会被删除。');

  await page.goto(publicUrl);
  await expect(page.getByRole('status')).toHaveText('这项服务当前不可请求。');
  await expect(page.getByRole('button', { name: '提交请求' })).toHaveCount(0);
});
