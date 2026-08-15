export class WeChatPayProviderAdapterError extends Error {
  public constructor(
    public readonly code:
      | 'wechat_pay_sandbox_operation_rejected'
      | 'wechat_pay_sandbox_event_rejected'
      | 'wechat_pay_sandbox_event_mapping_rejected',
    message: string,
  ) {
    super(message);
    this.name = 'WeChatPayProviderAdapterError';
  }
}
