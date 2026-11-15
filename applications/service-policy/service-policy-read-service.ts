import { ApplicationError } from '../core/application-error.js';
import type { CatalogQueryRepository } from '../operations-admin/operations-query-repository.js';
import type {
  CapabilityCatalogItem,
  CatalogItemStatus,
  PolicyRiskTier,
  ServiceOfferingTemplate,
} from '../../modules/service-policy/catalog.js';
import type {
  ServicePolicyAuditRecord,
  ServicePolicyCatalogRepository,
} from './service-policy-repositories.js';

export type CatalogReadKind = 'capabilities' | 'templates';

export interface CatalogReadPage {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
}

export interface CatalogReadResult extends CatalogReadPage {
  readonly policyVersion: string;
  readonly kind: CatalogReadKind;
  readonly items: readonly (CapabilityCatalogItem | ServiceOfferingTemplate)[];
}

export interface AuditReadResult extends CatalogReadPage {
  readonly items: readonly SafeAuditRecord[];
}

export type AuditActorCategory =
  'human_operations' | 'provider_service' | 'platform_system' | 'unknown';

export type SafeAuditRecord = ServicePolicyAuditRecord & {
  readonly actorCategory: AuditActorCategory;
};

export interface CatalogReadFilters {
  readonly page: number;
  readonly pageSize: number;
  readonly query?: string;
  readonly status?: CatalogItemStatus;
  readonly riskTier?: PolicyRiskTier;
}

export interface AuditReadFilters {
  readonly page: number;
  readonly pageSize: number;
  readonly query?: string;
  readonly entityType?: ServicePolicyAuditRecord['entityType'];
  readonly action?: ServicePolicyAuditRecord['action'];
}

export function createServicePolicyReadService(dependencies: {
  readonly repository: ServicePolicyCatalogRepository;
  readonly queries?: CatalogQueryRepository;
}) {
  return {
    async listCatalog(
      kind: CatalogReadKind,
      filters: CatalogReadFilters,
    ): Promise<CatalogReadResult> {
      if (dependencies.queries) return dependencies.queries.listCatalog(kind, filters);
      const snapshot = await dependencies.repository.getSnapshot();
      const source = kind === 'capabilities' ? snapshot.capabilities : snapshot.templates;
      const query = filters.query?.trim().toLocaleLowerCase('zh-CN');
      const filtered = source.filter((item) => {
        const searchable =
          kind === 'capabilities'
            ? [
                item.id,
                item.slug,
                item.name,
                (item as CapabilityCatalogItem).vertical,
                item.description,
              ]
            : [
                item.id,
                item.slug,
                item.name,
                item.description,
                (item as ServiceOfferingTemplate).capabilityCatalogItemId,
              ];
        return (
          (query === undefined ||
            query.length === 0 ||
            searchable.some((value) => value.toLocaleLowerCase('zh-CN').includes(query))) &&
          (filters.status === undefined || item.status === filters.status) &&
          (filters.riskTier === undefined || item.riskTier === filters.riskTier)
        );
      });
      return {
        policyVersion: snapshot.policyVersion,
        kind,
        ...page(filtered, filters.page, filters.pageSize),
      };
    },

    async getCatalog(kind: CatalogReadKind, id: string) {
      if (dependencies.queries) return dependencies.queries.getCatalog(kind, id);
      const snapshot = await dependencies.repository.getSnapshot();
      const item = (kind === 'capabilities' ? snapshot.capabilities : snapshot.templates).find(
        (candidate) => candidate.id === id,
      );
      if (item === undefined) {
        throw new ApplicationError({
          category: 'not_found',
          code:
            kind === 'capabilities'
              ? 'service_policy_capability_not_found'
              : 'service_policy_template_not_found',
          message: 'Catalog record was not found.',
        });
      }
      return item;
    },

    async listAudit(filters: AuditReadFilters): Promise<AuditReadResult> {
      if (dependencies.queries) return dependencies.queries.listAudit(filters);
      const records = await dependencies.repository.listAudit();
      const query = filters.query?.trim().toLocaleLowerCase('zh-CN');
      const filtered = records.filter(
        (record) =>
          (filters.entityType === undefined || record.entityType === filters.entityType) &&
          (filters.action === undefined || record.action === filters.action) &&
          (query === undefined ||
            query.length === 0 ||
            [record.id, record.actorId, record.entityId, record.reason, record.correlationId].some(
              (value) => value.toLocaleLowerCase('zh-CN').includes(query),
            )),
      );
      return page(filtered.map(sanitizeAuditRecord), filters.page, filters.pageSize);
    },

    async getAudit(id: string) {
      if (dependencies.queries) return dependencies.queries.getAudit(id);
      const record = (await dependencies.repository.listAudit()).find(
        (candidate) => candidate.id === id,
      );
      if (record === undefined) {
        throw new ApplicationError({
          category: 'not_found',
          code: 'service_policy_audit_not_found',
          message: 'Audit record was not found.',
        });
      }
      return sanitizeAuditRecord(record);
    },
  };
}

function page<T>(items: readonly T[], pageNumber: number, pageSize: number) {
  const start = (pageNumber - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: pageNumber,
    pageSize,
    total: items.length,
  };
}

export function sanitizeAuditRecord(record: ServicePolicyAuditRecord): SafeAuditRecord {
  return {
    ...record,
    actorCategory: classifyAuditActor(record.actorId),
    before: sanitizeValue(record.before) as Readonly<Record<string, unknown>>,
    after: sanitizeValue(record.after) as Readonly<Record<string, unknown>>,
    reason: sanitizeText(record.reason),
  };
}

export function classifyAuditActor(actorId: string): AuditActorCategory {
  const normalized = actorId.trim().toLocaleLowerCase('en-US');
  if (/^(provider|service)[-_]/u.test(normalized)) return 'provider_service';
  if (
    /^(platform|system|fixture-platform)[-_]/u.test(normalized) ||
    normalized.includes('platform')
  )
    return 'platform_system';
  if (/^(operations|operator|human|admin|principal|account)[-_]/u.test(normalized))
    return 'human_operations';
  return 'unknown';
}

function sanitizeText(value: string): string {
  return value.replace(
    /(password|verifier|session(?:_?digest)?|secret|token|private\s*key)\s*[:=]\s*[^\s,;]+/giu,
    '$1=[REDACTED]',
  );
}

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(
          ([key]) => !/(password|verifier|session|digest|secret|token|private.?key)/iu.test(key),
        )
        .map(([key, nested]) => [key, sanitizeValue(nested)]),
    );
  }
  return value;
}
