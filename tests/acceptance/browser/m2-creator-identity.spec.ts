import { expect, test } from '@playwright/test';

test('M2 Creator can create and edit a commercial profile through the Reference Client', async ({
  page,
}) => {
  await page.goto('/creator');
  await expect(page.getByRole('status')).not.toHaveText('正在初始化 Creator 工作台…');

  await page.getByRole('textbox', { name: '名称', exact: true }).fill('Browser Dancer');
  await page.getByLabel('个人介绍').fill('Private dance lessons');
  await page.getByRole('button', { name: '创建主页' }).click();

  await expect(page.getByRole('status')).toHaveText('主页已创建。');
  await expect(page.getByText('当前主页状态：')).toBeVisible();

  await page.getByLabel('服务名称').fill('Private Dance Lesson');
  await page.getByLabel('服务说明').fill('One-on-one dance instruction');
  await page.getByRole('button', { name: '添加服务能力' }).click();

  await expect(page.getByRole('status')).toHaveText('服务能力已添加。');
  await expect(page.getByText('Private Dance Lesson', { exact: true }).first()).toBeVisible();
});

test('M3 Creator can save a Service Offering draft with requestable conditions', async ({
  page,
}) => {
  await page.goto('/creator');
  await expect(page.getByRole('status')).not.toHaveText('正在准备工作台…');

  await page.getByRole('textbox', { name: '名称', exact: true }).fill('M3 Browser Dancer');
  await page.getByLabel('个人介绍').fill('Private dance lessons');
  await page.getByRole('button', { name: /创建主页|保存修改/ }).click();

  await expect(page.getByRole('status')).toHaveText(/主页已创建。|主页已保存。/);
  const capabilityOptions = page.getByLabel('关联服务').locator('option');
  if ((await capabilityOptions.count()) <= 1) {
    await page.getByLabel('服务名称').fill('Private Dance Lesson');
    await page.getByLabel('服务说明').fill('One-on-one dance instruction');
    await page.getByRole('button', { name: '添加服务能力' }).click();
    await expect(page.getByRole('status')).toHaveText('服务能力已添加。');
  }

  await page.getByLabel('服务标题').fill('一对一舞蹈私教');
  await page.getByLabel('关联服务').selectOption({ label: 'Private Dance Lesson' });
  await page.getByLabel('服务介绍').fill('适合希望系统练习的舞者。');
  await page.getByLabel('可请求条件').fill('周末可约，具体时间需沟通确认');
  await page.getByLabel('客户需要提供的信息').fill('请说明期望时间和舞蹈基础');
  await page.getByRole('button', { name: '保存服务草稿' }).click();

  await expect(page.getByRole('status')).toHaveText('服务草稿已保存。');
  await expect(page.getByText('一对一舞蹈私教', { exact: true })).toBeVisible();
  await expect(page.getByText(/当前服务状态：草稿，尚未公开/)).toBeVisible();
  await expect(page.getByText('公开前还需要完善：', { exact: true })).not.toBeVisible();
});
