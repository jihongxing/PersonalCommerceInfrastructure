export interface WeChatPayCreatorAccountMapping {
  readonly creatorId: string;
  readonly subMerchantReference: string;
  readonly status: 'candidate' | 'qualified' | 'blocked';
  readonly evidenceReference: string;
}

export interface WeChatPayCreatorAccountMappingStore {
  save(mapping: WeChatPayCreatorAccountMapping): Promise<void>;
  findByCreatorId(creatorId: string): Promise<WeChatPayCreatorAccountMapping | undefined>;
}

export class InMemoryWeChatPayCreatorAccountMappingStore implements WeChatPayCreatorAccountMappingStore {
  private readonly mappings = new Map<string, WeChatPayCreatorAccountMapping>();

  public save(mapping: WeChatPayCreatorAccountMapping): Promise<void> {
    assertMapping(mapping);
    this.mappings.set(mapping.creatorId, Object.freeze({ ...mapping }));
    return Promise.resolve();
  }

  public findByCreatorId(creatorId: string): Promise<WeChatPayCreatorAccountMapping | undefined> {
    const mapping = this.mappings.get(creatorId);
    return Promise.resolve(mapping === undefined ? undefined : Object.freeze({ ...mapping }));
  }
}

function assertMapping(mapping: WeChatPayCreatorAccountMapping): void {
  if (
    mapping.creatorId.trim().length === 0 ||
    mapping.subMerchantReference.trim().length === 0 ||
    mapping.evidenceReference.trim().length === 0
  ) {
    throw new Error('WeChat Pay Creator Account Mapping is invalid.');
  }
}
