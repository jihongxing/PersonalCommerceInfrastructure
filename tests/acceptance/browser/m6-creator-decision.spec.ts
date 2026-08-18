import { expect, test, type Page } from '@playwright/test';

const apiBaseUrl = 'http://127.0.0.1:45100';

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

async function createPublishedOffering(page: Page, title: string): Promise<string> {
  await page.goto('/creator');
  await expect(page.getByTestId('creator-workspace-status')).not.toHaveText('正在准备工作台…');

  await page.getByRole('textbox', { name: '名称', exact: true }).fill('M6 Browser Dancer');
  await page.getByLabel('个人介绍').fill('Private dance lessons');
  await page.getByRole('button', { name: /创建主页|保存修改/ }).click();
  await expect(page.getByTestId('creator-workspace-status')).toHaveText(
    /主页已创建。|主页已保存。/,
  );

  const capabilityName = `M6 Dance ${String(Date.now())}`;
  await page.getByLabel('服务名称').fill(capabilityName);
  await page.getByLabel('服务说明').fill('One-on-one dance instruction');
  await page.getByRole('button', { name: '添加服务能力' }).click();
  await expect(page.getByTestId('creator-workspace-status')).toHaveText('服务能力已添加。');

  await page.getByLabel('服务标题').fill(title);
  await page.getByLabel('关联服务').selectOption({ label: capabilityName });
  await page.getByLabel('服务介绍').fill('适合希望系统练习的舞者。');
  await page.getByLabel('可请求条件').fill('周末可约，具体时间需沟通确认');
  await page.getByLabel('客户需要提供的信息').fill('请说明期望时间和舞蹈基础');
  await page.getByRole('button', { name: '保存服务草稿' }).click();
  await expect(page.getByTestId('creator-workspace-status')).toHaveText('服务草稿已保存。');

  const card = offeringCard(page, title);
  await card.getByRole('button', { name: '公开服务' }).click();
  await expect(page.getByTestId('creator-workspace-status')).toHaveText(
    '服务已公开，并生成了分享入口。',
  );
  return (await card.getByRole('link').getAttribute('href')) as string;
}

async function submitRequest(
  page: Page,
  publicUrl: string,
  contactMethod: string,
): Promise<string> {
  await page.goto(publicUrl);
  await page.getByLabel('你的称呼').fill('Browser Buyer');
  await page.getByLabel('联系方式').fill(contactMethod);
  await page.getByLabel('你的请求说明').fill('希望安排一次基础练习。');
  await page.getByRole('button', { name: '提交请求' }).click();
  await expect(page.getByTestId('public-offering-status')).toHaveText(
    '请求已提交，正在等待创作者处理。',
  );
  return (await page
    .getByRole('link', { name: '查看请求处理结果' })
    .getAttribute('href')) as string;
}

test('AT-008 owning Creator confirms Submitted Action and Customer sees a non-payment result', async ({
  page,
}) => {
  const title = `M6 确认请求 ${String(Date.now())}`;
  const publicUrl = await createPublishedOffering(page, title);
  const resultUrl = await submitRequest(
    page,
    publicUrl,
    `confirm-${String(Date.now())}@example.test`,
  );

  await page.goto('/creator');
  await offeringCard(page, title).getByRole('button', { name: '下线服务' }).click();
  await expect(page.getByTestId('creator-workspace-status')).toHaveText(
    '服务已下线，既有请求不会被删除。',
  );
  const card = requestCard(page, title);
  await expect(card.getByText('希望安排一次基础练习。')).toBeVisible();
  await card.getByRole('button', { name: '确认请求' }).click();
  await expect(page.getByTestId('creator-workspace-status')).toHaveText(
    '请求已确认。客户可以通过原结果入口查看处理状态。',
  );
  await expect(card).toHaveCount(0);

  await page.goto(resultUrl);
  await expect(page.getByRole('heading', { name: '创作者已确认' })).toBeVisible();
  await expect(page.getByTestId('customer-result-boundary-status')).toHaveText(
    '此状态不代表付款、预约完成或服务履行结果。',
  );
});

test('AT-009 owning Creator declines Submitted Action and Customer sees a non-payment result', async ({
  page,
}) => {
  const title = `M6 拒绝请求 ${String(Date.now())}`;
  const publicUrl = await createPublishedOffering(page, title);
  const resultUrl = await submitRequest(
    page,
    publicUrl,
    `decline-${String(Date.now())}@example.test`,
  );

  await page.goto('/creator');
  const card = requestCard(page, title);
  await card.getByRole('button', { name: '拒绝请求' }).click();
  await expect(page.getByTestId('creator-workspace-status')).toHaveText(
    '请求已拒绝。客户可以通过原结果入口查看处理状态。',
  );
  await expect(card).toHaveCount(0);

  await page.goto(resultUrl);
  await expect(page.getByRole('heading', { name: '创作者已拒绝' })).toBeVisible();
  await expect(page.getByTestId('customer-result-boundary-status')).toHaveText(
    '此状态不代表付款、预约完成或服务履行结果。',
  );
});

test('AT-010 unauthorized and repeated terminal actions are rejected without changing the result', async ({
  page,
}) => {
  const title = `M6 终态保护 ${String(Date.now())}`;
  const publicUrl = await createPublishedOffering(page, title);
  const resultUrl = await submitRequest(
    page,
    publicUrl,
    `protected-${String(Date.now())}@example.test`,
  );
  const resultAccessToken = resultUrl.split('/').at(-1) as string;
  const submittedResult = await page.request.get(
    `${apiBaseUrl}/api/v1/public/requests/${resultAccessToken}`,
  );
  const { actionId } = (await submittedResult.json()) as { readonly actionId: string };

  const unauthorized = await page.request.post(
    `${apiBaseUrl}/api/v1/creator/requests/${actionId}/confirm`,
    {
      headers: { authorization: 'Bearer test-other-creator-token' },
    },
  );
  expect(unauthorized.status()).toBe(403);

  const confirmed = await page.request.post(
    `${apiBaseUrl}/api/v1/creator/requests/${actionId}/confirm`,
    {
      headers: { authorization: 'Bearer test-creator-token' },
    },
  );
  expect(confirmed.status()).toBe(200);

  const repeated = await page.request.post(
    `${apiBaseUrl}/api/v1/creator/requests/${actionId}/decline`,
    {
      headers: { authorization: 'Bearer test-creator-token' },
    },
  );
  expect(repeated.status()).toBe(409);

  await page.goto(resultUrl);
  await expect(page.getByRole('heading', { name: '创作者已确认' })).toBeVisible();
});
