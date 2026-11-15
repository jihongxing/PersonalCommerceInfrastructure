import { randomUUID } from 'node:crypto';

import {
  findCapabilityCatalogItem,
  type CatalogItemStatus,
  type PolicyRiskTier,
  type ServicePolicyCatalogSnapshot,
  type ServicePolicyDraft,
  diffServicePolicyCatalog,
  validateServicePolicyCatalog,
} from '../../modules/service-policy/catalog.js';
import type {
  ServicePolicyAuditRecord,
  ServicePolicyCatalogRepository,
} from '../../applications/service-policy/service-policy-repositories.js';
import { ApplicationError } from '../../applications/core/application-error.js';

export class InMemoryServicePolicyCatalogRepository implements ServicePolicyCatalogRepository {
  private snapshot: ServicePolicyCatalogSnapshot;
  private readonly audits: ServicePolicyAuditRecord[] = [];
  private readonly drafts = new Map<string, ServicePolicyDraft>();

  public constructor(initial: ServicePolicyCatalogSnapshot) {
    this.snapshot = structuredClone(initial);
  }

  public getSnapshot(): Promise<ServicePolicyCatalogSnapshot> {
    return Promise.resolve(structuredClone(this.snapshot));
  }

  public findCapabilityById(id: string) {
    return Promise.resolve(this.snapshot.capabilities.find((item) => item.id === id));
  }

  public findCapabilityByName(name: string) {
    return Promise.resolve(findCapabilityCatalogItem({ name }, this.snapshot));
  }

  public findTemplateById(id: string) {
    return Promise.resolve(this.snapshot.templates.find((template) => template.id === id));
  }

  public async updateCapability(
    id: string,
    input: {
      readonly status?: CatalogItemStatus;
      readonly creatorSelectable?: boolean;
      readonly publishEnabled?: boolean;
      readonly riskTier?: PolicyRiskTier;
      readonly reason: string;
    },
    context: { readonly actorId: string; readonly correlationId: string },
  ) {
    await Promise.resolve();
    const current = this.snapshot.capabilities.find((item) => item.id === id);
    if (current === undefined) {
      throw new ApplicationError({
        category: 'not_found',
        code: 'service_policy_capability_not_found',
        message: 'Service policy capability was not found.',
      });
    }
    const updated = {
      ...current,
      ...(input.status === undefined ? {} : { status: input.status }),
      ...(input.creatorSelectable === undefined
        ? {}
        : { creatorSelectable: input.creatorSelectable }),
      ...(input.publishEnabled === undefined ? {} : { publishEnabled: input.publishEnabled }),
      ...(input.riskTier === undefined ? {} : { riskTier: input.riskTier }),
    };
    this.snapshot = {
      ...this.snapshot,
      capabilities: this.snapshot.capabilities.map((item) => (item.id === id ? updated : item)),
    };
    this.recordAudit(
      'capability',
      id,
      current as unknown as Readonly<Record<string, unknown>>,
      updated,
      input.reason,
      context,
    );
    return structuredClone(updated);
  }

  public async updateTemplate(
    id: string,
    input: {
      readonly status?: CatalogItemStatus;
      readonly creatorSelectable?: boolean;
      readonly publishEnabled?: boolean;
      readonly riskTier?: PolicyRiskTier;
      readonly reason: string;
    },
    context: { readonly actorId: string; readonly correlationId: string },
  ) {
    await Promise.resolve();
    const current = this.snapshot.templates.find((template) => template.id === id);
    if (current === undefined) {
      throw new ApplicationError({
        category: 'not_found',
        code: 'service_policy_template_not_found',
        message: 'Service policy template was not found.',
      });
    }
    const updated = {
      ...current,
      ...(input.status === undefined ? {} : { status: input.status }),
      ...(input.creatorSelectable === undefined
        ? {}
        : { creatorSelectable: input.creatorSelectable }),
      ...(input.publishEnabled === undefined ? {} : { publishEnabled: input.publishEnabled }),
      ...(input.riskTier === undefined ? {} : { riskTier: input.riskTier }),
    };
    this.snapshot = {
      ...this.snapshot,
      templates: this.snapshot.templates.map((template) =>
        template.id === id ? updated : template,
      ),
    };
    this.recordAudit(
      'template',
      id,
      current as unknown as Readonly<Record<string, unknown>>,
      updated,
      input.reason,
      context,
    );
    return structuredClone(updated);
  }

  public async publishVersion(
    version: string,
    reason: string,
    context: { readonly actorId: string; readonly correlationId: string },
  ): Promise<void> {
    await Promise.resolve();
    if (version !== this.snapshot.policyVersion) {
      throw new ApplicationError({
        category: 'validation',
        code: 'service_policy_version_not_loaded',
        message: 'The service policy version must be imported before publication.',
      });
    }
    const before = { policyVersion: this.snapshot.policyVersion };
    this.snapshot = { ...this.snapshot, policyVersion: version };
    this.recordAudit(
      'release',
      version,
      before,
      { policyVersion: version },
      reason,
      context,
      'published',
    );
  }

  public listAudit(): Promise<readonly ServicePolicyAuditRecord[]> {
    return Promise.resolve(structuredClone(this.audits));
  }

  public async createDraft(
    reason: string,
    context: { readonly actorId: string; readonly correlationId: string },
  ): Promise<ServicePolicyDraft> {
    await Promise.resolve();
    const version = `draft-${this.drafts.size + 1}`;
    const draft: ServicePolicyDraft = {
      ...structuredClone(this.snapshot),
      policyVersion: version,
      status: 'draft',
      revision: '1',
      createdAt: new Date().toISOString(),
    };
    this.drafts.set(version, draft);
    this.recordAudit('release', version, {}, { status: 'draft' }, reason, context, 'draft_created');
    return structuredClone(draft);
  }

  public async getDraft(version: string): Promise<ServicePolicyDraft> {
    await Promise.resolve();
    const draft = this.drafts.get(version);
    if (draft === undefined) throw draftNotFound();
    return structuredClone(draft);
  }

  public async listDrafts(): Promise<readonly ServicePolicyDraft[]> {
    await Promise.resolve();
    return structuredClone([...this.drafts.values()]);
  }

  public async updateDraftItem(
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
  ): Promise<ServicePolicyDraft> {
    try {
      const draft = await this.getDraft(version);
      if (draft.revision !== input.expectedRevision) throw staleRevision();
      const source = kind === 'capability' ? draft.capabilities : draft.templates;
      const current = source.find((item) => item.id === id);
      if (current === undefined) throw itemNotFound(kind);
      const updated = {
        ...current,
        ...(input.status === undefined ? {} : { status: input.status }),
        ...(input.creatorSelectable === undefined
          ? {}
          : { creatorSelectable: input.creatorSelectable }),
        ...(input.publishEnabled === undefined ? {} : { publishEnabled: input.publishEnabled }),
        ...(input.riskTier === undefined ? {} : { riskTier: input.riskTier }),
      };
      const next: ServicePolicyDraft = {
        ...draft,
        revision: String(Number(draft.revision) + 1),
        ...(kind === 'capability'
          ? { capabilities: draft.capabilities.map((item) => (item.id === id ? updated : item)) }
          : { templates: draft.templates.map((item) => (item.id === id ? updated : item)) }),
      } as ServicePolicyDraft;
      this.drafts.set(version, next);
      this.recordAudit(
        kind,
        id,
        { ...current },
        { ...updated },
        input.reason,
        context,
        'draft_updated',
        version,
      );
      return structuredClone(next);
    } catch (error) {
      this.recordAudit(
        kind,
        id,
        {},
        { error: error instanceof Error ? error.message : 'draft_update_failed' },
        input.reason,
        context,
        'draft_update_failed',
        version,
      );
      throw error;
    }
  }

  public async previewDraft(
    version: string,
    context: { readonly actorId: string; readonly correlationId: string },
  ) {
    const draft = await this.getDraft(version);
    const result = validateServicePolicyCatalog(draft);
    const preview = { ...result, changes: diffServicePolicyCatalog(this.snapshot, draft) };
    this.recordAudit(
      'release',
      version,
      {},
      preview,
      'Preview draft',
      context,
      'previewed',
      version,
    );
    return preview;
  }

  public async validateDraft(
    version: string,
    context: { readonly actorId: string; readonly correlationId: string },
  ) {
    const draft = await this.getDraft(version);
    const result = validateServicePolicyCatalog(draft);
    this.recordAudit(
      'release',
      version,
      {},
      result as unknown as Readonly<Record<string, unknown>>,
      'Validate draft',
      context,
      'validated',
      version,
    );
    return result;
  }

  public async activateDraft(
    version: string,
    input: { readonly expectedRevision: string; readonly reason: string },
    context: { readonly actorId: string; readonly correlationId: string },
  ): Promise<void> {
    try {
      const draft = await this.getDraft(version);
      if (draft.revision !== input.expectedRevision) throw staleRevision();
      const result = validateServicePolicyCatalog(draft);
      if (result.status !== 'VALID')
        throw new ApplicationError({
          category: 'validation',
          code: 'service_policy_draft_invalid',
          message: result.errors.join(' '),
        });
      this.snapshot = {
        policyVersion: version,
        capabilities: draft.capabilities,
        templates: draft.templates,
      };
      this.drafts.delete(version);
      this.recordAudit(
        'release',
        version,
        { status: 'draft' },
        { status: 'published' },
        input.reason,
        context,
        'activated',
        version,
      );
    } catch (error) {
      this.recordAudit(
        'release',
        version,
        {},
        { error: error instanceof Error ? error.message : 'activation_failed' },
        input.reason,
        context,
        'activation_failed',
        version,
      );
      throw error;
    }
  }

  private recordAudit(
    entityType: ServicePolicyAuditRecord['entityType'],
    entityId: string,
    before: Readonly<Record<string, unknown>>,
    after: Readonly<Record<string, unknown>>,
    reason: string,
    context: { readonly actorId: string; readonly correlationId: string },
    action: ServicePolicyAuditRecord['action'] = 'updated',
    policyVersion = this.snapshot.policyVersion,
  ): void {
    this.audits.push({
      id: randomUUID(),
      actorId: context.actorId,
      entityType,
      entityId,
      action,
      before,
      after,
      reason,
      policyVersion,
      occurredAt: new Date().toISOString(),
      correlationId: context.correlationId,
    });
  }
}

function draftNotFound(): ApplicationError {
  return new ApplicationError({
    category: 'not_found',
    code: 'service_policy_draft_not_found',
    message: 'Service policy draft was not found.',
  });
}
function staleRevision(): ApplicationError {
  return new ApplicationError({
    category: 'conflict',
    code: 'service_policy_draft_stale_revision',
    message: 'The service policy draft has changed. Reload before retrying.',
  });
}
function itemNotFound(kind: 'capability' | 'template'): ApplicationError {
  return new ApplicationError({
    category: 'not_found',
    code: `service_policy_${kind}_not_found`,
    message: 'Service policy item was not found.',
  });
}
