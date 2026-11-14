import type {
  OperationsOfferingRead,
  OperationsRequestRead,
  OperationsOfferingState,
  OperationsRequestState,
} from './operations-flow-read-service.js';
import type {
  CatalogReadKind,
  CatalogReadFilters,
  CatalogReadResult,
  AuditReadFilters,
  AuditReadResult,
  SafeAuditRecord,
} from '../service-policy/service-policy-read-service.js';
import type {
  CapabilityCatalogItem,
  ServiceOfferingTemplate,
} from '../../modules/service-policy/catalog.js';

// PCI-ENG-018-F: read projections of FR-005-FR-042 and FR-043-FR-053.
// This port owns no business transitions and exposes no mutation methods.
export type ReadModule = 'catalog' | 'offering' | 'request' | 'audit';
export type SearchKind = 'capabilities' | 'templates' | 'offering' | 'request' | 'audit';
export interface SearchItem {
  readonly kind: SearchKind;
  readonly id: string;
  readonly name: string;
  readonly state: string;
  readonly relatedId?: string;
  readonly updatedAt?: string;
  readonly occurredAt?: string;
  readonly actorId?: string;
  readonly actorCategory?: string;
}
export interface QueryPage<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}
export interface SearchInput {
  readonly query: string;
  readonly page: number;
  readonly pageSize: number;
}
export interface ModuleSummary {
  readonly total: number;
  readonly states: Readonly<Record<string, number>>;
  readonly source: string;
  readonly scope: string;
  readonly exact: true;
  readonly policyVersion?: string;
}
export interface WorkspaceOverview {
  readonly queriedAt: string;
  readonly consistency: 'repeatable_read_snapshot';
  readonly modules: Partial<Record<ReadModule, ModuleSummary>>;
  readonly recentActivity?: readonly SearchItem[];
}
export interface CatalogQueryRepository {
  listCatalog(kind: CatalogReadKind, input: CatalogReadFilters): Promise<CatalogReadResult>;
  getCatalog(
    kind: CatalogReadKind,
    id: string,
  ): Promise<CapabilityCatalogItem | ServiceOfferingTemplate>;
  listAudit(input: AuditReadFilters): Promise<AuditReadResult>;
  getAudit(id: string): Promise<SafeAuditRecord>;
}
export interface FlowQueryRepository {
  listOfferings(input: {
    readonly page: number;
    readonly pageSize: number;
    readonly query?: string;
    readonly state?: OperationsOfferingState;
  }): Promise<QueryPage<OperationsOfferingRead>>;
  getOffering(id: string): Promise<OperationsOfferingRead>;
  listRequests(input: {
    readonly page: number;
    readonly pageSize: number;
    readonly query?: string;
    readonly state?: OperationsRequestState;
  }): Promise<QueryPage<OperationsRequestRead>>;
  getRequest(id: string): Promise<OperationsRequestRead>;
}
export interface OperationsQueryRepository extends CatalogQueryRepository, FlowQueryRepository {
  overview(modules: readonly ReadModule[]): Promise<WorkspaceOverview>;
  search(modules: readonly ReadModule[], input: SearchInput): Promise<QueryPage<SearchItem>>;
}
