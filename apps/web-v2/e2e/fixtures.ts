import { randomUUID } from 'node:crypto';
import { test as base, expect, type APIRequestContext, type Page } from '@playwright/test';

export const apiBase = process.env.E2E_API_BASE_URL || 'http://127.0.0.1:8081';
type Seed = {
  email: string;
  password: string;
  token: string;
  offeringId: string;
  reference: string;
  title: string;
};

export async function api(
  request: APIRequestContext,
  method: string,
  path: string,
  token?: string,
  data?: unknown,
) {
  const send = () =>
    request.fetch(`${apiBase}${path}`, {
      method,
      headers: token ? { authorization: `Bearer ${token}` } : {},
      ...(data === undefined ? {} : { data }),
    });
  let response = await send();
  // Test accounts are created in quick succession; honor the API's signup limit during fixture setup.
  if (method === 'POST' && path === '/api/v1/auth/signup') {
    for (let attempt = 0; attempt < 2 && response.status() === 429; attempt++) {
      const retryAfterSeconds = Number(response.headers()['retry-after']);
      if (!Number.isFinite(retryAfterSeconds) || retryAfterSeconds < 0 || retryAfterSeconds > 60)
        break;
      await new Promise((resolve) => setTimeout(resolve, (retryAfterSeconds + 1) * 1000));
      response = await send();
    }
  }
  expect(response.ok(), `${method} ${path}: ${response.status()} ${await response.text()}`).toBe(
    true,
  );
  return response.json();
}

export const test = base.extend<{ seed: Seed }>({
  seed: async ({ request }, provideSeed) => {
    if (process.env.E2E_ISOLATED_API !== '1')
      throw new Error(
        'Set E2E_ISOLATED_API=1 with a disposable local API/database to create acceptance data.',
      );
    const email = `plan116-${randomUUID()}@example.test`;
    const password = 'Plan116-Acceptance9!';
    const account = await api(request, 'POST', '/api/v1/auth/signup', undefined, {
      email,
      password,
      name: '验收创作者',
    });
    const token = account.accessToken as string;
    await api(request, 'POST', '/api/v1/private/onboarding/initialize', token);
    await api(request, 'PATCH', '/api/v1/creator/identity', token, {
      profile: { displayName: '验收创作者', bio: '隔离环境的前端验收资料', socialLinks: [] },
    });
    const identity = await api(request, 'POST', '/api/v1/creator/identity/capabilities', token, {
      name: '咨询能力',
      description: '隔离环境的专业咨询能力',
    });
    const title = `咨询服务 ${randomUUID().slice(0, 8)}`;
    const offering = await api(request, 'POST', '/api/v1/creator/offerings', token, {
      capabilityIds: [identity.capabilityIds.at(-1)],
      title,
      description: '隔离环境的服务说明',
      availabilityDescription: '请联系确认时间',
      requestInstructions: '请描述您的需求',
    });
    await api(request, 'POST', `/api/v1/creator/offerings/${offering.id}/publish`, token);
    const profile = await api(request, 'POST', '/api/v1/private/profiles', token, {
      displayName: '验收公开主页',
    });
    const homepage = await api(request, 'POST', '/api/v1/private/homepages', token, {
      profileId: profile.commerceProfileId,
    });
    await api(request, 'POST', `/api/v1/private/homepages/${homepage.homepageId}/publish`, token);
    const ref = await api(request, 'GET', '/api/v1/private/identity/reference', token);
    await provideSeed({
      email,
      password,
      token,
      offeringId: offering.id,
      title,
      reference: ref.displayValue.replaceAll('-', ''),
    });
  },
});

export async function login(page: Page, seed: Seed, destination = '/requests') {
  await page.goto(destination);
  await expect(page).toHaveURL(/\/auth\/login/);
  await page.getByLabel('邮箱').fill(seed.email);
  await page.getByLabel('密码', { exact: true }).fill(seed.password);
  await page.getByRole('button', { name: '登陆', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${destination.replace(/[?]/g, '\\?')}$`));
}

export async function submitRequest(request: APIRequestContext, seed: Seed, contactName: string) {
  return api(request, 'POST', `/api/v1/public/offerings/${seed.offeringId}/requests`, undefined, {
    contactName,
    contactMethod: `visitor-${randomUUID()}@example.test`,
    requestMessage: '端到端测试需求',
  });
}

export { expect };
