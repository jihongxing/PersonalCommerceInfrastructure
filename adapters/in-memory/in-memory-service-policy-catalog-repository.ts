import { randomUUID } from 'node:crypto';

import {
  findCapabilityCatalogItem,
  type CatalogItemStatus,
  type PolicyRiskTier,
  type ServicePolicyCatalogSnapshot,
} from '../../modules/service-policy/catalog.js';
import type {
  ServicePolicyAuditRecord,
  ServicePolicyCatalogRepository,
} from '../../applications/service-policy/service-policy-repositories.js';
import { ApplicationError } from '../../applications/core/application-error.js';

export class InMemoryServicePolicyCatalogRepository implements ServicePolicyCatalogRepository {
  private snapshot: ServicePolicyCatalogSnapshot;
  private readonly audits: ServicePolicyAuditRecord[] = [];

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
      updated as unknown as Readonly<Record<string, unknown>>,
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
      updated as unknown as Readonly<Record<string, unknown>>,
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

  private recordAudit(
    entityType: ServicePolicyAuditRecord['entityType'],
    entityId: string,
    before: Readonly<Record<string, unknown>>,
    after: Readonly<Record<string, unknown>>,
    reason: string,
    context: { readonly actorId: string; readonly correlationId: string },
    action: ServicePolicyAuditRecord['action'] = 'updated',
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
      policyVersion: this.snapshot.policyVersion,
      occurredAt: new Date().toISOString(),
      correlationId: context.correlationId,
    });
  }
}
