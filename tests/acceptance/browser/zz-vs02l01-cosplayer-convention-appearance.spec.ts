import { expect, test, type Page } from '@playwright/test';

const apiBaseUrl = 'http://127.0.0.1:45100';
const creatorHeaders = { authorization: 'Bearer test-creator-token' };
const operationsHeaders = { authorization: 'Bearer test-operations-token' };

test('COS-01 through COS-06 reuse Offering, Upcoming, Request Commerce, Order, and Money', async ({
  page,
}) => {
  const appearance = await createPublishedAppearanceOffering(page, 'confirm');

  await page.goto(appearance.publicUrl);
  await expect(page.getByTestId('upcoming-projection')).toContainText(appearance.upcomingTitle);
  await expect(page.getByTestId('upcoming-projection')).toContainText('2026-08-20');
  await expect(page.getByTestId('upcoming-projection')).toContainText('上海新国际博览中心');
  await expect(page.getByRole('heading', { name: appearance.title })).toBeVisible();
  await expect(page.getByRole('button', { name: '提交出席合作请求' })).toBeVisible();

  const resultUrl = await submitAppearanceRequest(
    page,
    appearance.publicUrl,
    '提交出席合作请求',
    'confirm',
  );
  const actionId = await actionIdForResult(page, resultUrl);

  await page.goto('/creator');
  const request = requestCard(page, appearance.title);
  await expect(request).toContainText('希望邀请参加上海漫展。');
  await request.getByRole('button', { name: '确认请求' }).click();
  await expect(page.getByTestId('creator-workspace-status')).toHaveText(
    '请求已确认。客户可以通过原结果入口查看处理状态。',
  );

  const orderResponse = await page.request.post(`${apiBaseUrl}/api/v1/creator/paid-orders`, {
    headers: creatorHeaders,
    data: {
      commerceActionId: actionId,
      grossPriceMinor: '39900',
      serviceTerms: 'One confirmed convention guest appearance.',
    },
  });
  expect(orderResponse.ok()).toBe(true);
  const order = (await orderResponse.json()) as { readonly id: string };

  const payment = await page.request.post(
    `${apiBaseUrl}/api/v1/operations/simulation/paid-orders/${order.id}/payment`,
    {
      headers: operationsHeaders,
      data: {
        amountMinor: '39900',
        currency: 'CNY',
        idempotencyKey: `cos-payment-${appearance.suffix}`,
      },
    },
  );
  expect(payment.ok()).toBe(true);

  const fulfillment = await page.request.post(
    `${apiBaseUrl}/api/v1/creator/paid-orders/${order.id}/fulfillment`,
    {
      headers: creatorHeaders,
      data: { evidenceReference: `appearance-completed-${appearance.suffix}` },
    },
  );
  expect(fulfillment.ok()).toBe(true);

  const settlement = await page.request.post(
    `${apiBaseUrl}/api/v1/operations/simulation/paid-orders/${order.id}/settlement`,
    {
      headers: operationsHeaders,
      data: {
        amountMinor: '35670',
        currency: 'CNY',
        idempotencyKey: `cos-settlement-${appearance.suffix}`,
        providerFeeMinor: '240',
        platformFeeMinor: '3990',
        deductionsMinor: '0',
        calculationVersion: 'simulation-cny-v1',
      },
    },
  );
  expect(settlement.ok()).toBe(true);

  await page.goto('/creator');
  await page.getByRole('button', { name: '刷新订单与收益' }).click();
  await expect(page.getByTestId(`creator-order-${order.id}`)).toContainText(appearance.title);
  await expect(page.getByTestId(`earnings-state-${order.id}`)).toContainText('available');

  const operations = await page.request.get(
    `${apiBaseUrl}/api/v1/operations/commercial-pilot/workspace`,
    { headers: operationsHeaders },
  );
  expect(operations.ok()).toBe(true);
  expect(await operations.text()).toContain(order.id);
  expect(await operations.text()).not.toContain('CosplayerWallet');
});

test('COS-07 declines an Appearance Request through the existing Request state machine', async ({
  page,
}) => {
  const appearance = await createPublishedAppearanceOffering(page, 'decline');
  const resultUrl = await submitAppearanceRequest(
    page,
    appearance.publicUrl,
    '提交出席合作请求',
    'decline',
  );

  await page.goto('/creator');
  const request = requestCard(page, appearance.title);
  await request.getByRole('button', { name: '拒绝请求' }).click();
  await expect(page.getByTestId('creator-workspace-status')).toHaveText(
    '请求已拒绝。客户可以通过原结果入口查看处理状态。',
  );

  await page.goto(resultUrl);
  await expect(page.getByRole('heading', { name: '创作者已拒绝' })).toBeVisible();
});

test('COS-10 unpublishes an Appearance Offering without changing an existing Request meaning', async ({
  page,
}) => {
  const appearance = await createPublishedAppearanceOffering(page, 'unpublish');
  const resultUrl = await submitAppearanceRequest(
    page,
    appearance.publicUrl,
    '提交出席合作请求',
    'unpublish',
  );

  await page.goto('/creator');
  const card = offeringCard(page, appearance.title);
  await card.getByRole('button', { name: '下线服务' }).click();
  await expect(page.getByTestId('creator-workspace-status')).toHaveText(
    '服务已下线，既有请求不会被删除。',
  );

  await page.goto(appearance.publicUrl);
  await expect(page.getByTestId('public-offering-status')).toHaveText('这项服务当前不可请求。');

  await page.goto('/creator');
  const request = requestCard(page, appearance.title);
  await request.getByRole('button', { name: '确认请求' }).click();
  await page.goto(resultUrl);
  await expect(page.getByRole('heading', { name: '创作者已确认' })).toBeVisible();
});

async function createPublishedAppearanceOffering(page: Page, suffixPrefix: string) {
  const suffix = `${suffixPrefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const title = `COS Appearance ${suffix}`;
  const upcomingTitle = `上海漫展嘉宾出席 ${suffix}`;

  await page.goto('/creator');
  await page.getByLabel('名称', { exact: true }).fill(`COS Cosplayer ${suffix}`);
  await page.getByLabel('个人介绍').fill('Convention creator and appearance collaborator.');
  await page.getByRole('button', { name: /创建主页|保存修改/ }).click();

  await page.getByLabel('服务名称').fill(`Convention Appearance ${suffix}`);
  await page.getByLabel('服务说明').fill('Guest appearance and convention collaboration.');
  await page.getByRole('button', { name: '添加服务能力' }).click();

  await page.getByLabel('服务类型').selectOption('appearance');
  await expect(page.getByTestId('appearance-offering-fields')).toBeVisible();
  await page.getByLabel('服务标题').fill(title);
  await page.getByLabel('关联服务').selectOption({ label: `Convention Appearance ${suffix}` });
  await page.getByLabel('服务介绍').fill('Convention guest appearance for organizers and brands.');
  await page
    .getByLabel('可请求条件')
    .fill('Date and appearance scope require Creator confirmation.');
  await page
    .getByLabel('客户需要提供的信息')
    .fill('Please provide organizer, date, venue, and scope.');
  await page.getByLabel('出席类型').selectOption('convention');
  await page.getByLabel('适合的请求方').selectOption('organizer');
  await page.getByLabel('开始日期').fill('2026-08-20');
  await page.getByLabel('地点 / 场地说明').fill('上海新国际博览中心');
  await page.getByLabel('近期行程标题').fill(upcomingTitle);
  await page.getByLabel('价格 / 报价说明（可选）').fill('根据时长和合作内容报价');
  await page.getByLabel('请求按钮说明').fill('提交出席合作请求');
  await page.getByRole('button', { name: '保存服务草稿' }).click();
  await expect(page.getByTestId('creator-workspace-status')).toHaveText('服务草稿已保存。');

  const card = page.locator('.ds-list-item').filter({ hasText: title }).first();
  await expect(card.getByTestId(/^appearance-/)).toContainText(upcomingTitle);
  await card.getByRole('button', { name: '公开服务' }).click();
  await expect(page.getByTestId('creator-workspace-status')).toHaveText(
    '服务已公开，并生成了分享入口。',
  );

  const publicUrl = await card.locator('a').getAttribute('href');
  expect(publicUrl).not.toBeNull();
  return { suffix, title, upcomingTitle, publicUrl: publicUrl as string };
}

async function submitAppearanceRequest(
  page: Page,
  publicUrl: string,
  callToAction: string,
  suffix: string,
): Promise<string> {
  await page.goto(publicUrl);
  await page.getByLabel('你的称呼').fill(`Convention Organizer ${suffix}`);
  await page.getByLabel('联系方式').fill(`${suffix}@example.test`);
  await page.getByLabel('你的请求说明').fill('希望邀请参加上海漫展。');
  await page.getByRole('button', { name: callToAction }).click();
  await expect(page.getByTestId('public-offering-status')).toHaveText(
    '请求已提交，正在等待创作者处理。',
  );
  return (await page
    .getByRole('link', { name: '查看请求处理结果' })
    .getAttribute('href')) as string;
}

function requestCard(page: Page, title: string) {
  return page
    .locator('.ds-list-item')
    .filter({ hasText: title })
    .filter({ has: page.getByRole('button', { name: '确认请求' }) });
}

function offeringCard(page: Page, title: string) {
  return page
    .locator('.ds-list-item')
    .filter({ hasText: title })
    .filter({ has: page.getByRole('button', { name: '下线服务' }) });
}

async function actionIdForResult(page: Page, resultUrl: string): Promise<string> {
  const resultAccessToken = resultUrl.split('/').at(-1) as string;
  const response = await page.request.get(
    `${apiBaseUrl}/api/v1/public/requests/${resultAccessToken}`,
  );
  expect(response.ok()).toBe(true);
  return ((await response.json()) as { readonly actionId: string }).actionId;
}
