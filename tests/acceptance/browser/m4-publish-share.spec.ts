import { expect, test, type Page } from '@playwright/test';

function offeringCard(page: Page, title: string) {
  return page.locator('.ds-list-item').filter({ hasText: title });
}

async function prepareEligibleOffering(page: Page, title: string): Promise<void> {
  await page.goto('/creator');
  await expect(page.getByRole('status')).not.toHaveText('正在准备工作台…');

  await page.getByRole('textbox', { name: '名称', exact: true }).fill('M4 Browser Dancer');
  await page.getByLabel('个人介绍').fill('Private dance lessons');
  await page.getByRole('button', { name: /创建主页|保存修改/ }).click();
  await expect(page.getByRole('status')).toHaveText(/主页已创建。|主页已保存。/);

  await page.getByLabel('服务名称').fill('Private Dance Lesson');
  await page.getByLabel('服务说明').fill('One-on-one dance instruction');
  await page.getByRole('button', { name: '添加服务能力' }).click();
  await expect(page.getByRole('status')).toHaveText('服务能力已添加。');

  await page.getByLabel('服务标题').fill(title);
  await page.getByLabel('关联服务').selectOption({ label: 'Private Dance Lesson' });
  await page.getByLabel('服务介绍').fill('适合希望系统练习的舞者。');
  await page.getByLabel('可请求条件').fill('周末可约，具体时间需沟通确认');
  await page.getByLabel('客户需要提供的信息').fill('请说明期望时间和舞蹈基础');
  await page.getByRole('button', { name: '保存服务草稿' }).click();
  await expect(page.getByRole('status')).toHaveText('服务草稿已保存。');
}

test('AT-002 incomplete Draft Offering cannot be published', async ({ page }) => {
  const title = `不完整服务 ${String(Date.now())}`;
  await page.goto('/creator');
  await expect(page.getByRole('status')).not.toHaveText('正在准备工作台…');

  await page.getByRole('textbox', { name: '名称', exact: true }).fill('M4 Incomplete Dancer');
  await page.getByLabel('个人介绍').fill('Private dance lessons');
  await page.getByRole('button', { name: /创建主页|保存修改/ }).click();
  await expect(page.getByRole('status')).toHaveText(/主页已创建。|主页已保存。/);

  await page.getByLabel('服务标题').fill(title);
  await page.getByRole('button', { name: '保存服务草稿' }).click();
  await expect(page.getByRole('status')).toHaveText('服务草稿已保存。');
  const card = offeringCard(page, title);
  await expect(card.getByText(/公开前还需要完善：/)).toBeVisible();
  await expect(card.getByRole('button', { name: '公开服务' })).toBeDisabled();
});

test('AT-003 eligible Offering publishes and generates an Asset', async ({ page }) => {
  const title = `一对一舞蹈私教 ${String(Date.now())}`;
  await prepareEligibleOffering(page, title);

  const card = offeringCard(page, title);
  await card.getByRole('button', { name: '公开服务' }).click();
  await expect(page.getByRole('status')).toHaveText('服务已公开，并生成了分享入口。');
  await expect(card.getByText('当前服务状态：已公开')).toBeVisible();
  await expect(card.getByText('分享入口', { exact: true })).toBeVisible();
  await expect(card.getByText('已生成分享入口，尚未确认外部分发')).toBeVisible();
});

test('AT-004 Creator records actual external distribution and can unpublish', async ({ page }) => {
  const title = `一对一舞蹈私教 ${String(Date.now())}`;
  await prepareEligibleOffering(page, title);
  const card = offeringCard(page, title);
  await card.getByRole('button', { name: '公开服务' }).click();
  await expect(page.getByRole('status')).toHaveText('服务已公开，并生成了分享入口。');

  await card.getByRole('button', { name: '确认已对外分享' }).click();
  await expect(page.getByRole('status')).toHaveText('已记录你将分享入口发布到外部渠道。');
  await expect(card.getByText('已记录外部分发')).toBeVisible();

  await card.getByRole('button', { name: '下线服务' }).click();
  await expect(page.getByRole('status')).toHaveText('服务已下线，既有请求不会被删除。');
  await expect(card.getByText('当前服务状态：已下线')).toBeVisible();
});
