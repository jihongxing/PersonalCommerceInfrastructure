import type { ActorContext } from '../core/actor-context.js';
import { ApplicationError } from '../core/application-error.js';
import type { CatalogItemStatus, PolicyRiskTier } from '../../modules/service-policy/catalog.js';
import type { ServicePolicyCatalogRepository } from './service-policy-repositories.js';

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
}

export interface ServicePolicyAdminUpdateInput {
  readonly status?: CatalogItemStatus;
  readonly creatorSelectable?: boolean;
  readonly publishEnabled?: boolean;
  readonly riskTier?: PolicyRiskTier;
  readonly reason: string;
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
  };
}
