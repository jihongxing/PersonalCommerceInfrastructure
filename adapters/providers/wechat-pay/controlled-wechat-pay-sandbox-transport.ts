import type {
  WeChatPaySandboxCommand,
  WeChatPaySandboxEvent,
  WeChatPaySandboxEventVerificationRequest,
  WeChatPaySandboxEventVerificationResult,
  WeChatPaySandboxOperationResponse,
  WeChatPaySandboxOperationStatus,
  WeChatPaySandboxTransport,
} from './wechat-pay-sandbox-transport.js';

export class ControlledWeChatPaySandboxTransport implements WeChatPaySandboxTransport {
  private readonly operations = new Map<string, WeChatPaySandboxOperationResponse>();
  private readonly events = new Map<string, WeChatPaySandboxEvent>();

  public submit(command: WeChatPaySandboxCommand): Promise<WeChatPaySandboxOperationResponse> {
    assertCommand(command);
    const providerReference = `wechat-pay-sandbox:${command.operationType}:${command.idempotencyKey}`;
    const existing = this.operations.get(providerReference);
    if (existing !== undefined) {
      return Promise.resolve(existing);
    }
    const response = Object.freeze({
      providerRequestId: `request:${command.idempotencyKey}`,
      providerReference,
      internalReference: command.internalReference,
      status: 'pending' as const,
    });
    this.operations.set(providerReference, response);
    return Promise.resolve(response);
  }

  public getStatus(providerReference: string): Promise<WeChatPaySandboxOperationStatus> {
    return Promise.resolve(this.operations.get(providerReference)?.status ?? 'failed');
  }

  public verifyEvent(
    request: WeChatPaySandboxEventVerificationRequest,
  ): Promise<WeChatPaySandboxEventVerificationResult> {
    const event = this.events.get(request.eventId);
    if (event === undefined) {
      return Promise.resolve({
        verification: 'rejected',
        eventId: request.eventId,
        reason: 'unknown_event',
      });
    }
    return Promise.resolve({
      verification: 'verified',
      event: Object.freeze({ ...event }),
    });
  }

  public recordVerifiedEvent(event: WeChatPaySandboxEvent): void {
    this.events.set(
      event.eventId,
      Object.freeze({
        eventId: event.eventId,
        providerReference: event.providerReference,
        eventType: event.eventType,
        operationType: event.operationType,
        internalReference: event.internalReference,
        amountMinor: event.amountMinor,
        currency: event.currency,
        sequence: event.sequence,
        occurredAt: event.occurredAt,
      }),
    );
    const operation = this.operations.get(event.providerReference);
    if (operation !== undefined) {
      this.operations.set(
        event.providerReference,
        Object.freeze({
          ...operation,
          status: event.eventType.endsWith('succeeded') ? 'succeeded' : 'failed',
        }),
      );
    }
  }
}

function assertCommand(command: WeChatPaySandboxCommand): void {
  if (
    command.internalReference.trim().length === 0 ||
    command.idempotencyKey.trim().length === 0 ||
    command.amountMinor <= 0n
  ) {
    throw new Error('WeChat Pay Sandbox command is invalid.');
  }
}
