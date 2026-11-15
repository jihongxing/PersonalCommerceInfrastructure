import type {
  CapabilityCatalogItem,
  CatalogItemStatus,
  PolicyRiskTier,
  ServicePolicyCatalogSnapshot,
  ServicePolicyDraft,
  ServicePolicyValidationResult,
  ServicePolicyPreviewResult,
  ServiceOfferingTemplate,
} from '../../modules/service-policy/catalog.js';

export interface ServicePolicyCatalogRepository {
  getSnapshot(): Promise<ServicePolicyCatalogSnapshot>;
  findCapabilityById(id: string): Promise<CapabilityCatalogItem | undefined>;
  findCapabilityByName(name: string): Promise<CapabilityCatalogItem | undefined>;
  findTemplateById(id: string): Promise<ServiceOfferingTemplate | undefined>;
  updateCapability(
    id: string,
    input: {
      readonly status?: CatalogItemStatus;
      readonly creatorSelectable?: boolean;
      readonly publishEnabled?: boolean;
      readonly riskTier?: PolicyRiskTier;
      readonly reason: string;
    },
    context: { readonly actorId: string; readonly correlationId: string },
  ): Promise<CapabilityCatalogItem>;
  updateTemplate(
    id: string,
    input: {
      readonly status?: CatalogItemStatus;
      readonly creatorSelectable?: boolean;
      readonly publishEnabled?: boolean;
      readonly riskTier?: PolicyRiskTier;
      readonly reason: string;
    },
    context: { readonly actorId: string; readonly correlationId: string },
  ): Promise<ServiceOfferingTemplate>;
  publishVersion(
    version: string,
    reason: string,
    context: { readonly actorId: string; readonly correlationId: string },
  ): Promise<void>;
  listAudit(): Promise<readonly ServicePolicyAuditRecord[]>;
  createDraft(
    reason: string,
    context: { readonly actorId: string; readonly correlationId: string },
  ): Promise<ServicePolicyDraft>;
  getDraft(version: string): Promise<ServicePolicyDraft>;
  listDrafts(): Promise<readonly ServicePolicyDraft[]>;
  updateDraftItem(
    version: string,
    kind: 'capability' | 'template',
    id: string,
    input: {
      readonly status?: CatalogItemStatus;
      readonly creatorSelectable?: boolean;
      readonly publishEnabled?: boolean;
      readonly riskTier?: PolicyRiskTier;
      readonly expectedRevision: string;
      readonly reason: string;
    },
    context: { readonly actorId: string; readonly correlationId: string },
  ): Promise<ServicePolicyDraft>;
  previewDraft(
    version: string,
    context: { readonly actorId: string; readonly correlationId: string },
  ): Promise<ServicePolicyPreviewResult>;
  validateDraft(
    version: string,
    context: { readonly actorId: string; readonly correlationId: string },
  ): Promise<ServicePolicyValidationResult>;
  activateDraft(
    version: string,
    input: { readonly expectedRevision: string; readonly reason: string },
    context: { readonly actorId: string; readonly correlationId: string },
  ): Promise<void>;
}

export interface ServicePolicyAuditRecord {
  readonly id: string;
  readonly actorId: string;
  readonly entityType: 'capability' | 'template' | 'release';
  readonly entityId: string;
  readonly action:
    | 'updated'
    | 'published'
    | 'draft_created'
    | 'draft_updated'
    | 'previewed'
    | 'validated'
    | 'activated'
    | 'activation_failed'
    | 'draft_update_failed';
  readonly before: Readonly<Record<string, unknown>>;
  readonly after: Readonly<Record<string, unknown>>;
  readonly reason: string;
  readonly policyVersion: string;
  readonly occurredAt: string;
  readonly correlationId: string;
}
