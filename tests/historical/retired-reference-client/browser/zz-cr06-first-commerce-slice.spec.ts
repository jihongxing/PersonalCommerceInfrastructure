import { expect, test } from '@playwright/test';

const apiBaseUrl = 'http://127.0.0.1:41000';
const creatorHeaders = { authorization: 'Bearer test-creator-token' };

test('CR-06 records approved external facts without changing the confirmed Request boundary', async ({
  page,
}, testInfo) => {
  const suffix = String(Date.now());
  const identityResponse = await page.request.post(`${apiBaseUrl}/api/v1/creator/identity`, {
    headers: creatorHeaders,
    data: {
      profile: {
        displayName: `CR-06 Creator ${suffix}`,
        bio: 'Controlled browser acceptance identity',
        socialLinks: [],
      },
    },
  });
  expect([201, 409]).toContain(identityResponse.status());

  const capabilityResponse = await page.request.post(
    `${apiBaseUrl}/api/v1/creator/identity/capabilities`,
    {
      headers: creatorHeaders,
      data: {
        name: `CR-06 capability ${suffix}`,
        description: 'Controlled browser acceptance capability',
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
      title: `CR-06 offering ${suffix}`,
      description: 'Observation-only first commerce slice acceptance',
      availabilityDescription: 'By confirmed request only',
      requestInstructions: 'Provide a controlled acceptance request',
    },
  });
  expect(offeringResponse.ok()).toBe(true);
  const offering = (await offeringResponse.json()) as { readonly id: string };

  const publishResponse = await page.request.post(
    `${apiBaseUrl}/api/v1/creator/offerings/${offering.id}/publish`,
    { headers: creatorHeaders },
  );
  expect(publishResponse.ok()).toBe(true);

  const requestResponse = await page.request.post(
    `${apiBaseUrl}/api/v1/public/offerings/${offering.id}/requests`,
    {
      data: {
        contactName: 'CR-06 Buyer',
        contactMethod: `cr06-${suffix}@example.test`,
        requestMessage: 'Controlled external fact acceptance request',
      },
    },
  );
  expect(requestResponse.ok()).toBe(true);
  const submittedRequest = (await requestResponse.json()) as {
    readonly actionId: string;
    readonly resultAccessToken: string;
  };

  const confirmResponse = await page.request.post(
    `${apiBaseUrl}/api/v1/creator/requests/${submittedRequest.actionId}/confirm`,
    { headers: creatorHeaders },
  );
  expect(confirmResponse.ok()).toBe(true);

  await page.goto('/operations');
  await expect(page.getByRole('heading', { name: '外部商业事实记录台' })).toBeVisible();
  await expect(
    page.getByText('本工具不处理付款、不接收支付凭据，也不执行履约、结算或退款。'),
  ).toBeVisible();
  await expect(
    page.getByText('这些观察事实不会把 Request 状态改为已付款或已履约；Request 保持已确认。'),
  ).toBeVisible();

  await page.getByLabel('Operations 访问令牌', { exact: true }).fill('wrong-operations-token');
  await page.getByLabel('Request Action ID').fill(submittedRequest.actionId);
  await page.getByLabel('证据引用').fill('local://cr06/fulfillment-before-payment');
  await page.getByRole('button', { name: '记录履约已观察' }).click();
  await expect(page.getByTestId('operations-action-status')).toHaveText(
    'Operations 访问令牌无效或缺失。',
  );

  await page.getByLabel('Operations 访问令牌', { exact: true }).fill('test-operations-token');
  await page.getByRole('button', { name: '记录履约已观察' }).click();
  await expect(page.getByTestId('operations-action-status')).toHaveText(
    '记录履约观察前，必须先记录外部付款核验事实。',
  );

  const paymentEvidence = `local://cr06/payment/${suffix}`;
  await page.getByLabel('证据引用').fill(paymentEvidence);
  await page.getByRole('button', { name: '记录外部付款已核验' }).click();
  await expect(page.getByTestId('operations-action-status')).toHaveText(
    '已记录外部付款核验事实。重复提交会返回原记录。',
  );
  await expect(page.getByText(`证据引用： ${paymentEvidence}`)).toBeVisible();

  await page.getByLabel('证据引用').fill(`local://cr06/repeated-payment/${suffix}`);
  await page.getByRole('button', { name: '记录外部付款已核验' }).click();
  await expect(page.getByText(`证据引用： ${paymentEvidence}`)).toBeVisible();

  const fulfillmentEvidence = `local://cr06/fulfillment/${suffix}`;
  await page.getByLabel('证据引用').fill(fulfillmentEvidence);
  await page.getByRole('button', { name: '记录履约已观察' }).click();
  await expect(page.getByTestId('operations-action-status')).toHaveText('已记录履约观察事实。');
  await expect(page.getByText('事实类型： fulfillment_observed')).toBeVisible();
  await expect(page.getByText(`证据引用： ${fulfillmentEvidence}`)).toBeVisible();

  await page.goto(`/public/requests/${submittedRequest.resultAccessToken}`);
  await expect(page.getByRole('heading', { name: '创作者已确认' })).toBeVisible();
  await expect(page.getByTestId('customer-result-boundary-status')).toHaveText(
    '此状态不代表付款、预约完成或服务履行结果。',
  );

  await testInfo.attach('cr06-local-browser-acceptance.json', {
    body: Buffer.from(
      `${JSON.stringify(
        {
          evidenceType: 'local-browser-acceptance',
          actionId: submittedRequest.actionId,
          paymentEvidence,
          fulfillmentEvidence,
          finalCustomerState: 'confirmed',
        },
        undefined,
        2,
      )}\n`,
    ),
    contentType: 'application/json',
  });
});
