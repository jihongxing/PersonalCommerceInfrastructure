import { randomUUID } from 'node:crypto';
import { test, expect, apiBase } from './fixtures';

test('new Creator creates and publishes a service and confirms a visitor request', async ({
  page,
  request,
}) => {
  if (process.env.E2E_ISOLATED_API !== '1')
    throw new Error('This test requires a disposable local API and database.');

  const email = `plan116-journey-${randomUUID()}@example.test`;
  const password = 'Plan116-Acceptance9!';
  const serviceName = `完整路径服务 ${randomUUID().slice(0, 8)}`;
  await page.goto('/auth/signup');
  await page.waitForLoadState('networkidle');
  await page.getByLabel('名称', { exact: true }).fill('完整路径创作者');
  await page.getByLabel('密码', { exact: true }).fill(password);
  await page.getByLabel('确认密码').fill(password);
  await page.getByLabel('邮箱地址').fill(email);
  await expect(page.getByLabel('邮箱地址')).toHaveValue(email);
  await expect(page.getByLabel('名称', { exact: true })).toHaveValue('完整路径创作者');
  await expect(page.getByLabel('密码', { exact: true })).toHaveValue(password);
  await expect(page.getByLabel('确认密码')).toHaveValue(password);
  const signup = page.waitForResponse(
    (response) =>
      response.url().includes('/api/v1/auth/signup') && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: '创建账户' }).click();
  const signupResponse = await signup;
  expect(signupResponse.status()).toBe(201);
  const signupBody = await signupResponse.json();
  expect(signupBody).not.toHaveProperty('accessToken');
  await expect(page).toHaveURL(/\/(dashboard|onboarding(?:\/welcome)?)$/);

  await page.goto('/profile/edit');
  await page.getByLabel('您的名字').fill('完整路径创作者');
  await page.getByLabel('简介').fill('为访客提供一对一咨询服务。');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);

  await page.goto('/capabilities/new');
  await page.getByLabel('能力名称').fill('完整路径咨询');
  await page.getByLabel('描述', { exact: false }).fill('提供一对一咨询和建议。');
  await page.getByRole('button', { name: '添加能力' }).click();
  await expect(page).toHaveURL(/\/capabilities$/);
  await expect(page.getByRole('heading', { name: '完整路径咨询' })).toBeVisible();

  await page.goto('/services/new');
  await page.getByRole('button', { name: '完整路径咨询' }).click();
  await page.getByLabel('服务名称').fill(serviceName);
  await page.getByLabel('详细描述').fill('围绕访客的需求提供一对一咨询。');
  await page.getByLabel('可用性描述').fill('工作日联系确认时间。');
  await page.getByLabel('请求说明').fill('请说明需求和希望联系的时间。');
  const creation = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/v1/creator/offerings') &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: '创建服务', exact: true }).click();
  const createdResponse = await creation;
  expect(createdResponse.ok()).toBe(true);
  const created = await createdResponse.json();
  expect(created.state).toBe('draft');
  await expect(page).toHaveURL(/\/services$/);
  const draftPublic = await request.get(`${apiBase}/api/v1/public/offerings/${created.id}`);
  expect(draftPublic.ok()).toBe(false);
  await page.getByRole('link', { name: `查看${serviceName}` }).click();
  await expect(page.getByText('此服务还未发布。消费者无法看到。', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: '发布服务' })).toBeEnabled();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: '发布服务' }).click();
  await expect(page.getByText('分享资产已生成，尚未记录实际对外分发')).toBeVisible();
  await page.reload();
  await expect(page.getByText('分享资产已生成，尚未记录实际对外分发')).toBeVisible();

  await page.goto(`/s/${created.id}`);
  await expect(page.getByRole('heading', { name: serviceName, level: 2 })).toBeVisible();
  await page.getByLabel('您的姓名').fill('完整路径访客');
  await page.getByLabel('联系方式', { exact: true }).fill(`visitor-${randomUUID()}@example.test`);
  await page.getByLabel('请求说明', { exact: true }).fill('希望咨询我的具体需求。');
  await page.getByRole('button', { name: '提交请求', exact: true }).click();
  await expect(page).toHaveURL(/\/o\/[a-f0-9-]+$/);
  const resultUrl = page.url();
  await expect(page.getByTestId('status-badge')).toHaveText('等待 Creator 回复');

  await page.goto('/requests');
  const card = page.getByTestId('request-card').filter({ hasText: '完整路径访客' });
  await card.getByRole('button', { name: '确认请求', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('已确认请求');
  await page.goto(resultUrl);
  await expect(page.getByTestId('status-badge')).toHaveText('已确认');
});
