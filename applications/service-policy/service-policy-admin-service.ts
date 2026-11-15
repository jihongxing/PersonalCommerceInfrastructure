import type { ActorContext } from '../core/actor-context.js';
import { ApplicationError } from '../core/application-error.js';
import type {
  CatalogItemStatus,
  PolicyRiskTier,
  ServicePolicyDraft,
  ServicePolicyValidationResult,
  ServicePolicyPreviewResult,
} from '../../modules/service-policy/catalog.js';
import type { ServicePolicyCatalogRepository } from './service-policy-repositories.js';
import { requireOperationsHumanPermission } from '../operations-identity/operations-human-authentication.js';

export interface ServicePolicyAdminService {
  getWorkspace(
    context: ActorContext,
  ): ReturnType<ServicePolicyCatalogRepository['getSnapshot']> extends Promise<infer Snapshot>
    ? Promise<Snapshot & { readonly audit: readonly unknown[] }>
    : never;
  updateCapability(
    id: string,
    input: ServicePolicyAdminUpdateInput,
    context: ActorContext,
  ): ReturnType<ServicePolicyCatalogRepository['updateCapability']>;
  updateTemplate(
    id: string,
    input: ServicePolicyAdminUpdateInput,
    context: ActorContext,
  ): ReturnType<ServicePolicyCatalogRepository['updateTemplate']>;
  publishVersion(version: string, reason: string, context: ActorContext): Promise<void>;
  createDraft(reason: string, context: ActorContext): Promise<ServicePolicyDraft>;
  getDraft(version: string, context: ActorContext): Promise<ServicePolicyDraft>;
  listDrafts(context: ActorContext): Promise<readonly ServicePolicyDraft[]>;
  updateDraftItem(
    version: string,
    kind: 'capability' | 'template',
    id: string,
    input: ServicePolicyDraftUpdateInput,
    context: ActorContext,
  ): Promise<ServicePolicyDraft>;
  previewDraft(version: string, context: ActorContext): Promise<ServicePolicyPreviewResult>;
  validateDraft(version: string, context: ActorContext): Promise<ServicePolicyValidationResult>;
  activateDraft(
    version: string,
    input: {
      readonly expectedRevision: string;
      readonly reason: string;
      readonly confirm: boolean;
    },
    context: ActorContext,
  ): Promise<void>;
}

export interface ServicePolicyAdminUpdateInput {
  readonly status?: CatalogItemStatus;
  readonly creatorSelectable?: boolean;
  readonly publishEnabled?: boolean;
  readonly riskTier?: PolicyRiskTier;
  readonly reason: string;
}

export interface ServicePolicyDraftUpdateInput extends ServicePolicyAdminUpdateInput {
  readonly expectedRevision: string;
}

export function createServicePolicyAdminService(dependencies: {
  readonly repository: ServicePolicyCatalogRepository;
}): ServicePolicyAdminService {
  function requireOperations(context: ActorContext): { actorId: string; correlationId: string } {
    if (context.actor.kind !== 'pilot_operations') {
      throw new ApplicationError({
        category: 'authorization',
        code: 'service_policy_operations_required',
        message: 'Service policy administration requires operations authorization.',
      });
    }
    return { actorId: context.actor.operatorId, correlationId: context.correlationId };
  }

  function requireHuman(
    context: ActorContext,
    permission:
      'catalog:read' | 'catalog:draft:create' | 'catalog:draft:update' | 'catalog:policy:activate',
  ): { actorId: string; correlationId: string } {
    if (context.actor.kind !== 'operations_human') {
      throw new ApplicationError({
        category: 'authorization',
        code: 'operations_human_required',
        message: 'Human Operations authentication is required for catalog policy changes.',
      });
    }
    requireOperationsHumanPermission(context, permission);
    return { actorId: context.actor.principalId, correlationId: context.correlationId };
  }

  function requireReason(reason: string): string {
    const normalized = reason.trim();
    if (normalized.length === 0) {
      throw new ApplicationError({
        category: 'validation',
        code: 'service_policy_reason_required',
        message: 'Service policy changes require an audit reason.',
      });
    }
    return normalized;
  }

  return {
    async getWorkspace(context) {
      requireOperations(context);
      return {
        ...(await dependencies.repository.getSnapshot()),
        audit: await dependencies.repository.listAudit(),
      };
    },
    async updateCapability(id, input, context) {
      const operation = requireOperations(context);
      return dependencies.repository.updateCapability(
        id,
        { ...input, reason: requireReason(input.reason) },
        operation,
      );
    },
    async updateTemplate(id, input, context) {
      const operation = requireOperations(context);
      return dependencies.repository.updateTemplate(
        id,
        { ...input, reason: requireReason(input.reason) },
        operation,
      );
    },
    async publishVersion(version, reason, context) {
      const operation = requireOperations(context);
      const normalizedVersion = version.trim();
      if (normalizedVersion.length === 0) {
        throw new ApplicationError({
          category: 'validation',
          code: 'service_policy_version_required',
          message: 'A policy version is required.',
        });
      }
      await dependencies.repository.publishVersion(
        normalizedVersion,
        requireReason(reason),
        operation,
      );
    },
    async createDraft(reason, context) {
      const operation = requireHuman(context, 'catalog:draft:create');
      return dependencies.repository.createDraft(requireReason(reason), operation);
    },
    async getDraft(version, context) {
      requireHuman(context, 'catalog:read');
      return dependencies.repository.getDraft(version);
    },
    async listDrafts(context) {
      requireHuman(context, 'catalog:read');
      return dependencies.repository.listDrafts();
    },
    async updateDraftItem(version, kind, id, input, context) {
      const operation = requireHuman(context, 'catalog:draft:update');
      return dependencies.repository.updateDraftItem(
        version,
        kind,
        id,
        { ...input, reason: requireReason(input.reason) },
        operation,
      );
    },
    async previewDraft(version, context) {
      const operation = requireHuman(context, 'catalog:read');
      return dependencies.repository.previewDraft(version, operation);
    },
    async validateDraft(version, context) {
      const operation = requireHuman(context, 'catalog:read');
      return dependencies.repository.validateDraft(version, operation);
    },
    async activateDraft(version, input, context) {
      const operation = requireHuman(context, 'catalog:policy:activate');
      if (!input.confirm) {
        throw new ApplicationError({
          category: 'validation',
          code: 'service_policy_activation_confirmation_required',
          message: 'Explicit activation confirmation is required.',
        });
      }
      await dependencies.repository.activateDraft(
        version,
        { expectedRevision: input.expectedRevision, reason: requireReason(input.reason) },
        operation,
      );
    },
  };
}
