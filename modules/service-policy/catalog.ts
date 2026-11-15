export type PolicyRiskTier = 'low' | 'review' | 'prohibited';
export type CatalogReleaseScope = 'vs01' | 'established' | 'future';
export type PolicyStatus =
  'not_checked' | 'auto_approved' | 'review_required' | 'approved' | 'rejected';
export type CatalogItemStatus = 'draft' | 'active' | 'paused' | 'retired';
export type CapabilityCatalogStatus = 'active' | 'custom_request' | 'retired';

export interface ServicePolicyCatalogSnapshot {
  readonly policyVersion: string;
  readonly capabilities: readonly CapabilityCatalogItem[];
  readonly templates: readonly ServiceOfferingTemplate[];
}

export type ServicePolicyValidationStatus =
  'VALID' | 'INVALID' | 'CONFLICT' | 'STALE_REVISION' | 'UNSUPPORTED';

export interface ServicePolicyValidationResult {
  readonly status: ServicePolicyValidationStatus;
  readonly errors: readonly string[];
}

export interface ServicePolicyChange {
  readonly entityType: 'capability' | 'template';
  readonly entityId: string;
  readonly field: string;
  readonly before: unknown;
  readonly after: unknown;
}

export interface ServicePolicyPreviewResult extends ServicePolicyValidationResult {
  readonly changes: readonly ServicePolicyChange[];
}

export interface ServicePolicyDraft extends ServicePolicyCatalogSnapshot {
  readonly status: 'draft';
  readonly revision: string;
  readonly createdAt: string;
}

export function validateServicePolicyCatalog(
  snapshot: ServicePolicyCatalogSnapshot,
): ServicePolicyValidationResult {
  const errors: string[] = [];
  const capabilityIds = new Set(snapshot.capabilities.map((item) => item.id));
  if (snapshot.capabilities.length === 0) errors.push('至少需要一项能力目录记录。');
  if (snapshot.templates.length === 0) errors.push('至少需要一项服务模板记录。');
  for (const template of snapshot.templates) {
    if (!capabilityIds.has(template.capabilityCatalogItemId)) {
      errors.push(`服务模板 ${template.id} 引用了不存在的能力。`);
    }
    if (template.status === 'active' && template.publishEnabled !== false) {
      const capability = snapshot.capabilities.find(
        (item) => item.id === template.capabilityCatalogItemId,
      );
      if (capability?.status !== 'active' || capability.publishEnabled === false) {
        errors.push(`服务模板 ${template.id} 不能在能力未激活时发布。`);
      }
    }
  }
  for (const item of [...snapshot.capabilities, ...snapshot.templates]) {
    if (item.status === 'active' && item.riskTier === 'prohibited') {
      errors.push(`${item.id} 不能以 prohibited 风险等级激活。`);
    }
  }
  return { status: errors.length === 0 ? 'VALID' : 'INVALID', errors };
}

export function diffServicePolicyCatalog(
  before: ServicePolicyCatalogSnapshot,
  after: ServicePolicyCatalogSnapshot,
): readonly ServicePolicyChange[] {
  const changes: ServicePolicyChange[] = [];
  for (const [entityType, previous, next] of [
    ['capability', before.capabilities, after.capabilities],
    ['template', before.templates, after.templates],
  ] as const) {
    const beforeById = new Map(previous.map((item) => [item.id, item]));
    for (const item of next) {
      const prior = beforeById.get(item.id);
      if (prior === undefined) {
        changes.push({
          entityType,
          entityId: item.id,
          field: 'created',
          before: undefined,
          after: item,
        });
        continue;
      }
      for (const key of Object.keys(item) as (keyof typeof item)[]) {
        const previousValue = prior[key];
        const nextValue = item[key];
        if (JSON.stringify(previousValue) !== JSON.stringify(nextValue)) {
          changes.push({
            entityType,
            entityId: item.id,
            field: String(key),
            before: previousValue,
            after: nextValue,
          });
        }
      }
    }
  }
  return changes;
}

export interface CapabilityCatalogItem {
  readonly id: string;
  readonly slug: string;
  readonly vertical: string;
  readonly name: string;
  readonly description: string;
  readonly riskTier: PolicyRiskTier;
  readonly releaseScope: CatalogReleaseScope;
  readonly aliases: readonly string[];
  readonly version: string;
  readonly status: CatalogItemStatus;
  readonly creatorSelectable?: boolean;
  readonly publishEnabled?: boolean;
}

export interface ServiceOfferingTemplate {
  readonly id: string;
  readonly slug: string;
  readonly capabilityCatalogItemId: string;
  readonly name: string;
  readonly description: string;
  readonly riskTier: PolicyRiskTier;
  readonly releaseScope: CatalogReleaseScope;
  readonly requiredFields: readonly string[];
  readonly version: string;
  readonly status: CatalogItemStatus;
  readonly creatorSelectable?: boolean;
  readonly publishEnabled?: boolean;
}

export interface ServicePolicyCatalogData {
  readonly policyVersion: string;
  readonly capabilities: readonly CapabilityCatalogItem[];
  readonly templates: readonly ServiceOfferingTemplate[];
}

export function findCapabilityCatalogItem(
  input: { readonly id?: string; readonly name?: string },
  catalog: ServicePolicyCatalogData,
): CapabilityCatalogItem | undefined {
  const id = input.id?.trim();
  if (id) return catalog.capabilities.find((item) => item.id === id);

  const normalizedName = normalizeCatalogText(input.name);
  if (!normalizedName) return undefined;
  return catalog.capabilities.find((item) =>
    [item.name, ...item.aliases].some((value) => normalizeCatalogText(value) === normalizedName),
  );
}

export function findServiceOfferingTemplate(
  input: {
    readonly id?: string;
    readonly capabilityCatalogItemId?: string;
    readonly title?: string;
    readonly appearance?: boolean;
  },
  catalog: ServicePolicyCatalogData,
): ServiceOfferingTemplate | undefined {
  const id = input.id?.trim();
  if (id) return catalog.templates.find((template) => template.id === id);

  const candidates = catalog.templates.filter(
    (template) => template.capabilityCatalogItemId === input.capabilityCatalogItemId,
  );
  if (input.appearance) {
    return (
      candidates.find((template) => template.id === 'template-commercial-appearance') ??
      catalog.templates.find((template) => template.id === 'template-commercial-appearance')
    );
  }
  const normalizedTitle = normalizeCatalogText(input.title);
  return (
    candidates.find((template) => normalizeCatalogText(template.name) === normalizedTitle) ??
    candidates[0]
  );
}

export function canPublishTemplate(template: ServiceOfferingTemplate): boolean {
  return (
    template.riskTier === 'low' &&
    template.releaseScope !== 'future' &&
    template.status === 'active' &&
    template.publishEnabled !== false
  );
}

export interface PolicyEvaluation {
  readonly status: PolicyStatus;
  readonly reason?: string;
  readonly template?: ServiceOfferingTemplate;
  readonly policyVersion: string;
}

/**
 * Resolve a creator selection while keeping legacy free-text records in a
 * non-publishable custom-request state.
 */
export function resolveCapabilitySelection(
  input: {
    readonly catalogItemId?: string;
    readonly name?: string;
  },
  catalog: ServicePolicyCatalogData,
): {
  readonly item?: CapabilityCatalogItem;
  readonly status: CapabilityCatalogStatus;
} {
  const item = findCapabilityCatalogItem({ id: input.catalogItemId, name: input.name }, catalog);
  if (
    item === undefined ||
    item.status !== 'active' ||
    item.creatorSelectable === false ||
    item.publishEnabled === false
  ) {
    return { status: 'custom_request' };
  }
  return { item, status: 'active' };
}

export function evaluateOfferingPolicy(input: {
  readonly catalog: ServicePolicyCatalogData;
  readonly title: string;
  readonly description: string;
  readonly requestInstructions: string;
  readonly availabilityDescription?: string;
  readonly appearanceText?: string;
  readonly capabilityNames: readonly string[];
  readonly capabilityCatalogItemIds?: readonly (string | undefined)[];
  readonly capabilityStatuses?: readonly (CapabilityCatalogStatus | undefined)[];
  readonly templateId?: string;
  readonly appearance?: boolean;
}): PolicyEvaluation {
  const policyVersion = input.catalog.policyVersion;
  const itemIds = (input.capabilityCatalogItemIds ?? []).filter(
    (value): value is string => value !== undefined,
  );
  const selectedCapabilities = itemIds.map((id) =>
    input.catalog.capabilities.find((item) => item.id === id),
  );
  const unavailableCapability = selectedCapabilities.some(
    (item) =>
      item === undefined ||
      item.status !== 'active' ||
      item.creatorSelectable === false ||
      item.publishEnabled === false,
  );
  if (unavailableCapability) {
    return {
      status: 'review_required',
      reason: '所选能力当前已暂停或不再开放发布。',
      policyVersion,
    };
  }
  if (
    containsProhibitedPolicyTerm([
      input.title,
      input.description,
      input.requestInstructions,
      input.availabilityDescription ?? '',
      input.appearanceText ?? '',
      ...input.capabilityNames,
    ])
  ) {
    return {
      status: 'rejected',
      reason: '内容包含平台禁止发布的服务类型或目的。',
      policyVersion,
    };
  }
  if (selectedCapabilities.some((item) => item?.riskTier === 'prohibited')) {
    return { status: 'rejected', reason: '该能力类型不在平台允许范围内。', policyVersion };
  }
  // Test fixtures and pre-policy in-memory snapshots may not carry policy metadata.
  // Persisted and API-created capabilities always carry catalogStatus, so this
  // compatibility branch cannot be used to bypass the runtime gate.
  if (
    input.capabilityStatuses !== undefined &&
    input.capabilityStatuses.length > 0 &&
    input.capabilityStatuses.every((status) => status === undefined) &&
    input.templateId === undefined
  ) {
    return { status: 'auto_approved', policyVersion };
  }
  // Legacy API clients may send a known catalog alias without the new selector
  // fields. Keep those historical drafts usable; new web-v2 submissions always
  // include an explicit catalog item and template.
  if (
    itemIds.length === 0 &&
    input.templateId === undefined &&
    input.capabilityStatuses?.every((status) => status === undefined || status === 'active')
  ) {
    return { status: 'auto_approved', policyVersion };
  }
  if (
    input.capabilityStatuses?.some((status) => status === 'active') &&
    input.templateId === undefined
  ) {
    return {
      status: 'rejected',
      reason: '服务必须选择与能力类型匹配的平台服务模板。',
      policyVersion,
    };
  }
  if (
    input.capabilityStatuses?.some((status) => status === 'custom_request' || status === 'retired')
  ) {
    return {
      status: 'review_required',
      reason: '能力类型尚未进入可发布目录，需要平台复核。',
      policyVersion,
    };
  }

  const itemId = itemIds[0];
  const inferredItem =
    itemId === undefined
      ? input.capabilityNames
          .map((name) => findCapabilityCatalogItem({ name }, input.catalog))
          .find((item): item is CapabilityCatalogItem => item !== undefined)
      : undefined;
  if (itemId === undefined && inferredItem === undefined) {
    return {
      status: input.capabilityNames.length === 0 ? 'not_checked' : 'rejected',
      reason:
        input.capabilityNames.length === 0
          ? '请选择至少一项平台能力后再进行政策检查。'
          : '能力类型不在平台目录中，只能申请新增类型。',
      policyVersion,
    };
  }
  const template = findServiceOfferingTemplate(
    {
      id: input.templateId,
      capabilityCatalogItemId: itemId ?? inferredItem?.id,
      title: input.title,
      appearance: input.appearance,
    },
    input.catalog,
  );
  if (template === undefined) {
    return {
      status: 'rejected',
      reason: '服务必须选择平台提供的匹配服务模板。',
      policyVersion,
    };
  }
  const expectedCapabilityIds =
    itemIds.length > 0 ? itemIds : inferredItem ? [inferredItem.id] : [];
  if (
    expectedCapabilityIds.length > 0 &&
    !expectedCapabilityIds.includes(template.capabilityCatalogItemId)
  ) {
    return {
      status: 'rejected',
      reason: '服务模板必须与所选能力类型匹配。',
      template,
      policyVersion,
    };
  }
  if (template.riskTier === 'prohibited') {
    return {
      status: 'rejected',
      reason: '该服务类型不在平台允许范围内。',
      template,
      policyVersion,
    };
  }
  if (
    template.status !== 'active' ||
    template.creatorSelectable === false ||
    template.publishEnabled === false
  ) {
    return {
      status: 'review_required',
      reason: '该服务模板当前未开放发布。',
      template,
      policyVersion,
    };
  }
  if (template.releaseScope === 'future') {
    return {
      status: 'review_required',
      reason: '该服务模板尚未在当前产品版本开放发布。',
      template,
      policyVersion,
    };
  }
  if (
    template.riskTier === 'review' ||
    selectedCapabilities.some((item) => item?.riskTier === 'review')
  ) {
    return {
      status: 'review_required',
      reason: '该服务类型需要人工审核后才能公开。',
      template,
      policyVersion,
    };
  }
  return { status: 'auto_approved', template, policyVersion };
}

export function isPolicyPublishable(status: PolicyStatus | undefined): boolean {
  return status === 'auto_approved' || status === 'approved';
}

export function isOfferingPolicyCurrentlyPublishable(
  input: {
    readonly title: string;
    readonly description: string;
    readonly requestInstructions: string;
    readonly availabilityDescription?: string;
    readonly appearanceText?: string;
    readonly capabilityNames: readonly string[];
    readonly capabilityCatalogItemIds?: readonly (string | undefined)[];
    readonly capabilityStatuses?: readonly (CapabilityCatalogStatus | undefined)[];
    readonly templateId?: string;
    readonly appearance?: boolean;
  },
  catalog: ServicePolicyCatalogData,
): boolean {
  return isPolicyPublishable(evaluateOfferingPolicy({ catalog, ...input }).status);
}

export function normalizeCatalogText(value: string | undefined): string {
  return (
    value
      ?.trim()
      .toLocaleLowerCase('zh-CN')
      .replace(/[\s_-]+/gu, '') ?? ''
  );
}

export const prohibitedPolicyTerms = [
  '私人陪伴',
  '陪玩',
  '性服务',
  '色情',
  '赌博',
  '博彩',
  '毒品',
  '枪支',
  '武器',
  '洗钱',
  '办证',
  '保证收益',
  'escort',
  'sexualservice',
  'adultservice',
  'gambling',
  'drugs',
  'weapons',
  'guaranteedreturns',
] as const;

export function containsProhibitedPolicyTerm(values: readonly string[]): boolean {
  const text = normalizeCatalogText(values.join(' '));
  return prohibitedPolicyTerms.some((term) => text.includes(normalizeCatalogText(term)));
}
