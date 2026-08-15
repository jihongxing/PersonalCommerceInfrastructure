import { expect, test } from '@playwright/test';

const apiBaseUrl = 'http://127.0.0.1:45100';
const creatorHeaders = { authorization: 'Bearer test-creator-token' };

test.use({ viewport: { width: 390, height: 844 } });

test('CR-04 local deployment acceptance covers mobile public access, refresh, metadata, and Request entry', async ({
  page,
}, testInfo) => {
  const suffix = String(Date.now());
  const title = `CR-04 本地分发 ${suffix}`;
  const description = '本地部署验收的公开服务说明';

  const identityResponse = await page.request.post(`${apiBaseUrl}/api/v1/creator/identity`, {
    headers: creatorHeaders,
    data: {
      profile: {
        displayName: `CR-04 Creator ${suffix}`,
        bio: 'Local deployment distribution acceptance identity',
        socialLinks: [],
      },
    },
  });
  expect([201, 409]).toContain(identityResponse.status());
  const identityDetailsResponse = await page.request.get(`${apiBaseUrl}/api/v1/creator/identity`, {
    headers: creatorHeaders,
  });
  expect(identityDetailsResponse.ok()).toBe(true);
  const identityDetails = (await identityDetailsResponse.json()) as {
    readonly profile: { readonly displayName: string };
  };

  const capabilityResponse = await page.request.post(
    `${apiBaseUrl}/api/v1/creator/identity/capabilities`,
    {
      headers: creatorHeaders,
      data: {
        name: `CR-04 capability ${suffix}`,
        description: 'Local distribution acceptance capability',
      },
    },
  );
  expect(capabilityResponse.ok()).toBe(true);
  const capability = (await capabilityResponse.json()) as {
    readonly capabilityIds: readonly string[];
  };

  const offeringResponse = await page.request.post(`${apiBaseUrl}/api/v1/creator/offerings`, {
    headers: creatorHeaders,
    data: {
      capabilityIds: [capability.capabilityIds.at(-1) as string],
      title,
      description,
      availabilityDescription: '本地移动端可请求',
      requestInstructions: '填写受控本地验收请求',
    },
  });
  expect(offeringResponse.ok()).toBe(true);
  const offering = (await offeringResponse.json()) as { readonly id: string };

  const publishResponse = await page.request.post(
    `${apiBaseUrl}/api/v1/creator/offerings/${offering.id}/publish`,
    { headers: creatorHeaders },
  );
  expect(publishResponse.ok()).toBe(true);

  const publicUrl = `/public/${offering.id}`;
  await page.goto(publicUrl);
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await expect(page.getByRole('button', { name: '提交请求' })).toBeVisible();
  await expect(page).toHaveTitle(`${title} | ${identityDetails.profile.displayName}`);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', description);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    `${title} | ${identityDetails.profile.displayName}`,
  );

  const content = await page.locator('body').innerText();
  expect(content).not.toContain('test-creator-token');
  expect(content).not.toContain('resultAccessToken');
  expect(content).not.toContain('capabilityIds');

  await page.reload();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();

  await page.getByLabel('你的称呼').fill('CR-04 Mobile Buyer');
  await page.getByLabel('联系方式').fill(`cr04-${suffix}@example.test`);
  await page.getByLabel('你的请求说明').fill('来自本地移动视口的受控请求。');
  await page.getByRole('button', { name: '提交请求' }).click();
  await expect(page.getByRole('status')).toHaveText('请求已提交，正在等待创作者处理。');
  const resultUrl = await page.getByRole('link', { name: '查看请求处理结果' }).getAttribute('href');
  expect(resultUrl).toBeTruthy();

  const unpublishResponse = await page.request.post(
    `${apiBaseUrl}/api/v1/creator/offerings/${offering.id}/unpublish`,
    { headers: creatorHeaders },
  );
  expect(unpublishResponse.ok()).toBe(true);

  await page.goto(publicUrl);
  await expect(page.getByRole('status')).toHaveText('这项服务当前不可请求。');
  await expect(page.getByRole('button', { name: '提交请求' })).toHaveCount(0);
  await expect(page).toHaveTitle('公开服务 | Personal Commerce');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/u);

  await page.goto(resultUrl as string);
  await expect(page.getByRole('heading', { name: '等待创作者处理' })).toBeVisible();

  await testInfo.attach('cr04-local-distribution-acceptance.json', {
    body: Buffer.from(
      `${JSON.stringify(
        {
          evidenceType: 'local-deployment-browser-acceptance',
          viewport: { width: 390, height: 844 },
          publicUrl,
          refreshVerified: true,
          metadataVerified: true,
          requestEntryVerified: true,
          unpublishedBoundaryVerified: true,
          existingRequestPreserved: true,
        },
        undefined,
        2,
      )}\n`,
    ),
    contentType: 'application/json',
  });
});
