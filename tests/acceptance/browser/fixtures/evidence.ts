import type { TestInfo } from '@playwright/test';

export async function attachAcceptanceEvidence(
  testInfo: TestInfo,
  name: string,
  evidence: unknown,
): Promise<void> {
  await testInfo.attach(name, {
    body: Buffer.from(`${JSON.stringify(evidence, undefined, 2)}\n`),
    contentType: 'application/json',
  });
}
