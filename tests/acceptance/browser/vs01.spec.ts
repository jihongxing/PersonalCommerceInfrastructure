import { expect, test, type Page } from '@playwright/test';

import { attachAcceptanceEvidence } from './fixtures/evidence.js';

function offeringCard(page: Page, title: string) {
  return page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: '我的服务草稿' }) })
    .locator('.ds-list-item')
    .filter({ hasText: title });
}

function requestCard(page: Page, title: string) {
  return page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: '待处理请求' }) })
    .locator('.ds-list-item')
    .filter({ hasText: title });
}

test('AT-001 complete VS-01 path from Identity to confirmed Customer result', async ({
  page,
}, testInfo) => {
  const suffix = String(Date.now());
  const capabilityName = `完整路径服务 ${suffix}`;
  const offeringTitle = `完整路径供给 ${suffix}`;

  await page.goto('/creator');
  await expect(page.getByRole('status')).not.toHaveText('正在准备工作台…');

  await page.getByRole('textbox', { name: '名称', exact: true }).fill('VS-01 Creator');
  await page.getByLabel('个人介绍').fill('提供一对一创作指导。');
  await page.getByRole('button', { name: /创建主页|保存修改/ }).click();
  await expect(page.getByRole('status')).toHaveText(/主页已创建。|主页已保存。/);

  await page.getByLabel('服务名称').fill(capabilityName);
  await page.getByLabel('服务说明').fill('一对一创作指导');
  await page.getByRole('button', { name: '添加服务能力' }).click();
  await expect(page.getByRole('status')).toHaveText('服务能力已添加。');

  await page.getByLabel('服务标题').fill(offeringTitle);
  await page.getByLabel('关联服务').selectOption({ label: capabilityName });
  await page.getByLabel('服务介绍').fill('围绕具体创作目标提供一对一指导。');
  await page.getByLabel('可请求条件').fill('周末可沟通，具体时间由双方确认');
  await page.getByLabel('客户需要提供的信息').fill('请说明目标、经验和期望时间');
  await page.getByRole('button', { name: '保存服务草稿' }).click();
  await expect(page.getByRole('status')).toHaveText('服务草稿已保存。');

  const offering = offeringCard(page, offeringTitle);
  await expect(offering.getByText('当前服务状态：草稿，尚未公开')).toBeVisible();
  await offering.getByRole('button', { name: '公开服务' }).click();
  await expect(page.getByRole('status')).toHaveText('服务已公开，并生成了分享入口。');
  await expect(offering.getByText('已生成分享入口，尚未确认外部分发')).toBeVisible();

  await offering.getByRole('button', { name: '确认已对外分享' }).click();
  await expect(page.getByRole('status')).toHaveText('已记录你将分享入口发布到外部渠道。');
  await expect(offering.getByText('已记录外部分发')).toBeVisible();
  const publicUrl = (await offering.getByRole('link').getAttribute('href')) as string;

  await page.goto(publicUrl);
  await expect(page.getByRole('heading', { name: 'VS-01 Creator' })).toBeVisible();
  await expect(page.getByRole('heading', { name: offeringTitle })).toBeVisible();
  await page.getByLabel('你的称呼').fill('VS-01 Customer');
  await page.getByLabel('联系方式').fill(`vs01-${suffix}@example.test`);
  await page.getByLabel('你的请求说明').fill('希望周末沟通一次具体创作目标。');
  await page.getByRole('button', { name: '提交请求' }).click();
  await expect(page.getByRole('status')).toHaveText('请求已提交，正在等待创作者处理。');
  const resultUrl = (await page
    .getByRole('link', { name: '查看请求处理结果' })
    .getAttribute('href')) as string;

  await page.goto('/creator');
  const request = requestCard(page, offeringTitle);
  await expect(request.getByText('VS-01 Customer')).toBeVisible();
  await expect(request.getByText(`vs01-${suffix}@example.test`)).toBeVisible();
  await expect(request.getByText('希望周末沟通一次具体创作目标。')).toBeVisible();
  await request.getByRole('button', { name: '确认请求' }).click();
  await expect(page.getByRole('status')).toHaveText(
    '请求已确认。客户可以通过原结果入口查看处理状态。',
  );
  await expect(request).toHaveCount(0);

  await page.goto(resultUrl);
  await expect(page.getByRole('heading', { name: '创作者已确认' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('此状态不代表付款、预约完成或服务履行结果。');

  await attachAcceptanceEvidence(testInfo, 'vs01-complete-flow.json', {
    acceptanceTest: 'AT-001',
    finalResult: 'confirmed',
    offeringStateProgression: ['draft', 'published'],
    distributionState: 'distributed',
    requestStateProgression: ['submitted', 'confirmed'],
  });
  await testInfo.attach('vs01-confirmed-result.png', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
});
