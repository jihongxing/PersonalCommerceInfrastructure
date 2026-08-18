import type {
  WeChatPaySandboxEventVerificationResult,
  WeChatPaySandboxOperationResponse,
  WeChatPaySandboxOperationStatus,
  WeChatPaySandboxTransport,
} from './wechat-pay-sandbox-transport.js';

export const WECHAT_PAY_OFFICIAL_SANDBOX_EVIDENCE_REFERENCE =
  'VS-02G-SANDBOX-UNAVAILABLE-EXTERNAL-DEPENDENCY';

export interface WeChatPayOfficialSandboxConfiguration {
  readonly endpoint: string;
  readonly testAccountReference: string;
  readonly credentialReference: string;
  readonly webhookVerificationReference: string;
  readonly currency: 'CNY';
  readonly region: 'CN';
}

export interface WeChatPayOfficialSandboxCapability {
  readonly providerId: 'wechat_pay_platform_collection_and_disbursement';
  readonly environment: 'official_sandbox';
  readonly availability: 'unavailable_external_dependency';
  readonly payment: 'unavailable';
  readonly settlement: 'unavailable';
  readonly withdrawal: 'unavailable';
  readonly refund: 'unavailable';
  readonly webhook: 'unavailable';
  readonly evidenceReference: typeof WECHAT_PAY_OFFICIAL_SANDBOX_EVIDENCE_REFERENCE;
}

export class WeChatPayOfficialSandboxUnavailableError extends Error {
  public readonly code = 'wechat_pay_official_sandbox_unavailable';

  public constructor() {
    super('SANDBOX UNAVAILABLE — EXTERNAL DEPENDENCY');
    this.name = 'WeChatPayOfficialSandboxUnavailableError';
  }
}

export class UnavailableWeChatPayOfficialSandboxTransport implements WeChatPaySandboxTransport {
  public readonly environment = 'official_sandbox' as const;

  public submit(): Promise<WeChatPaySandboxOperationResponse> {
    return Promise.reject(new WeChatPayOfficialSandboxUnavailableError());
  }

  public getStatus(): Promise<WeChatPaySandboxOperationStatus> {
    return Promise.reject(new WeChatPayOfficialSandboxUnavailableError());
  }

  public verifyEvent(): Promise<WeChatPaySandboxEventVerificationResult> {
    return Promise.reject(new WeChatPayOfficialSandboxUnavailableError());
  }
}

export function getWeChatPayOfficialSandboxCapability(): WeChatPayOfficialSandboxCapability {
  return Object.freeze({
    providerId: 'wechat_pay_platform_collection_and_disbursement',
    environment: 'official_sandbox',
    availability: 'unavailable_external_dependency',
    payment: 'unavailable',
    settlement: 'unavailable',
    withdrawal: 'unavailable',
    refund: 'unavailable',
    webhook: 'unavailable',
    evidenceReference: WECHAT_PAY_OFFICIAL_SANDBOX_EVIDENCE_REFERENCE,
  });
}

export function assertWeChatPayOfficialSandboxConfigurationUnavailable(
  configuration: WeChatPayOfficialSandboxConfiguration | undefined,
): void {
  if (configuration !== undefined) {
    throw new Error(
      'WeChat Pay official Sandbox configuration is not accepted until official endpoint, credentials, signature and test-account evidence are obtained.',
    );
  }
}
