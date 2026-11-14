import type { Sql } from 'postgres';
import { ApplicationError } from '../../../applications/core/application-error.js';
import type {
  OperationsQueryRepository,
  ReadModule,
  SearchInput,
  SearchItem,
  QueryPage,
  WorkspaceOverview,
  ModuleSummary,
} from '../../../applications/operations-admin/operations-query-repository.js';
import type {
  OperationsOfferingRead,
  OperationsRequestRead,
  OperationsOfferingState,
  OperationsRequestState,
} from '../../../applications/operations-admin/operations-flow-read-service.js';
import type {
  CatalogReadKind,
  CatalogReadFilters,
  AuditReadFilters,
  CatalogReadResult,
  AuditReadResult,
} from '../../../applications/service-policy/service-policy-read-service.js';
import {
  sanitizeAuditRecord,
  classifyAuditActor,
} from '../../../applications/service-policy/service-policy-read-service.js';
import type { ServicePolicyAuditRecord } from '../../../applications/service-policy/service-policy-repositories.js';
import type {
  CapabilityCatalogItem,
  ServiceOfferingTemplate,
} from '../../../modules/service-policy/catalog.js';

type Reader = Pick<Sql, 'unsafe'>;
type FlowFilters<State> = {
  readonly page: number;
  readonly pageSize: number;
  readonly query?: string;
  readonly state?: State;
};
const release = `(SELECT policy_version FROM service_policy_releases WHERE status='published' ORDER BY published_at DESC NULLS FIRST, policy_version DESC LIMIT 1)`;
const currentRelease = `coalesce(${release}, 'v1')`;
const offeringProjection = `jsonb_strip_nulls(jsonb_build_object(
 'id',o.id,'creator',jsonb_build_object('id',o.creator_id,'displayName',i.display_name),
 'capabilityIds',o.capability_ids,'capabilities',coalesce(c.items,'[]'::jsonb),
 'templateId',o.template_id,'title',o.title,'description',o.description,
 'availabilityDescription',o.availability_description,'requestInstructions',o.request_instructions,
 'state',o.state,'createdAt',o.created_at,'updatedAt',o.updated_at,
 'policyStatus',o.policy_status,'policyReason',o.policy_reason,'policyVersion',o.policy_version))
 || jsonb_build_object('distribution',CASE WHEN d.offering_id IS NULL THEN NULL
 ELSE jsonb_build_object('publicUrl',d.public_url,'state',d.state) END)`;
const offeringJoins = `LEFT JOIN commerce_identities i ON i.creator_id=o.creator_id
 LEFT JOIN distribution_assets d ON d.offering_id=o.id
 LEFT JOIN LATERAL (SELECT jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
 'id',x.id,'name',p.name,'catalogItemId',p.catalog_item_id)) ORDER BY x.ordinality) items
 FROM jsonb_array_elements_text(o.capability_ids) WITH ORDINALITY x(id,ordinality)
 LEFT JOIN creator_capabilities p ON p.id=x.id AND p.creator_id=o.creator_id) c ON true`;
const requestProjection = `jsonb_build_object('id',a.id,'offeringId',a.offering_id,
 'offering',CASE WHEN o.id IS NULL THEN NULL ELSE jsonb_build_object('id',o.id,'title',o.title,'state',o.state) END,
 'creator',jsonb_strip_nulls(jsonb_build_object('id',a.creator_id,'displayName',i.display_name)),
 'customer',jsonb_build_object('id',a.customer_id),'state',a.state,
 'createdAt',a.created_at,'updatedAt',a.updated_at,
 'creatorDecision',CASE WHEN a.state IN ('confirmed','declined') THEN a.state ELSE 'not_recorded' END,
 'requestContentVisibility','withheld')`;
const requestJoins = `LEFT JOIN service_offerings o ON o.id=a.offering_id AND o.creator_id=a.creator_id
 LEFT JOIN commerce_identities i ON i.creator_id=a.creator_id`;
const auditProjection = `jsonb_build_object('id',t.id,'actorId',t.actor_id,'entityType',t.entity_type,
 'entityId',t.entity_id,'action',t.action,'before',t.before_state,'after',t.after_state,
 'reason',t.reason,'policyVersion',t.policy_version,'occurredAt',t.occurred_at,'correlationId',t.correlation_id)`;
const catalogProjection = (kind: CatalogReadKind) => `jsonb_build_object(
 'id',t.id,'slug',t.slug,'name',t.name,'description',t.description,'riskTier',t.risk_tier,
 'releaseScope',t.release_scope,'version',t.version,'status',t.status,
 'creatorSelectable',t.creator_selectable,'publishEnabled',t.publish_enabled,
 ${kind === 'capabilities' ? "'vertical',t.vertical,'aliases',t.aliases" : "'capabilityCatalogItemId',t.capability_catalog_item_id,'requiredFields',t.required_fields"})`;

/** Parameterized, bounded read projections. No changes to legacy repositories or tables. */
export class PostgresOperationsQueryRepository implements OperationsQueryRepository {
  constructor(private readonly client: Sql) {}

  private snapshot<T>(read: (tx: Reader) => Promise<T>): Promise<T> {
    return this.client.begin('isolation level repeatable read read only', (tx) =>
      read(tx),
    ) as Promise<T>;
  }

  async listCatalog(kind: CatalogReadKind, input: CatalogReadFilters): Promise<CatalogReadResult> {
    return this.snapshot(async (tx) => {
      const table =
        kind === 'capabilities' ? 'service_policy_capabilities' : 'service_policy_templates';
      const version = await tx.unsafe<{ version: string }[]>(`SELECT ${currentRelease} AS version`);
      const where = `t.policy_version=$1 AND ($2::text IS NULL OR t.status=$2)
        AND ($3::text IS NULL OR t.risk_tier=$3) AND ($4='' OR position(lower($4) in lower(concat_ws(' ',t.id,t.slug,t.name,t.description,${kind === 'capabilities' ? 't.vertical' : 't.capability_catalog_item_id'})))>0)`;
      const result = await readPage<CapabilityCatalogItem | ServiceOfferingTemplate>(
        tx,
        table + ' t',
        catalogProjection(kind),
        '',
        where,
        [
          version[0]!.version,
          input.status ?? null,
          input.riskTier ?? null,
          input.query?.trim() ?? '',
        ],
        't.id ASC',
        input,
      );
      return { ...result, kind, policyVersion: version[0]!.version };
    });
  }

  async getCatalog(
    kind: CatalogReadKind,
    id: string,
  ): Promise<CapabilityCatalogItem | ServiceOfferingTemplate> {
    const table =
      kind === 'capabilities' ? 'service_policy_capabilities' : 'service_policy_templates';
    const rows = await this.client.unsafe<
      { data: CapabilityCatalogItem | ServiceOfferingTemplate }[]
    >(
      `SELECT ${catalogProjection(kind)} data FROM ${table} t WHERE t.id=$1 AND t.policy_version=${currentRelease}`,
      [id],
    );
    return found(rows[0]?.data);
  }

  async listAudit(input: AuditReadFilters): Promise<AuditReadResult> {
    const result = await this.snapshot((tx) =>
      readPage<ServicePolicyAuditRecord>(
        tx,
        'service_policy_audits t',
        auditProjection,
        '',
        `($1::text IS NULL OR t.entity_type=$1) AND ($2::text IS NULL OR t.action=$2)
       AND ($3='' OR position(lower($3) in lower(concat_ws(' ',t.id,t.actor_id,t.entity_id,t.correlation_id)))>0)`,
        [input.entityType ?? null, input.action ?? null, input.query?.trim() ?? ''],
        't.occurred_at DESC,t.id DESC',
        input,
      ),
    );
    return { ...result, items: result.items.map(sanitizeAuditRecord) };
  }

  async getAudit(id: string) {
    const rows = await this.client.unsafe<{ data: ServicePolicyAuditRecord }[]>(
      `SELECT ${auditProjection} data FROM service_policy_audits t WHERE t.id=$1`,
      [id],
    );
    return sanitizeAuditRecord(normalizeTimes(found(rows[0]?.data)));
  }

  listOfferings(
    input: FlowFilters<OperationsOfferingState>,
  ): Promise<QueryPage<OperationsOfferingRead>> {
    return this.snapshot((tx) =>
      readPage(
        tx,
        'service_offerings o',
        offeringProjection,
        offeringJoins,
        `($1::text IS NULL OR o.state=$1) AND ($2='' OR position(lower($2) in lower(concat_ws(' ',o.id,o.title,o.creator_id,o.description)))>0)`,
        [input.state ?? null, input.query?.trim() ?? ''],
        'o.id ASC',
        input,
      ),
    );
  }

  async getOffering(id: string): Promise<OperationsOfferingRead> {
    const rows = await this.client.unsafe<{ data: OperationsOfferingRead }[]>(
      `SELECT ${offeringProjection} data FROM service_offerings o ${offeringJoins} WHERE o.id=$1`,
      [id],
    );
    return normalizeTimes(found(rows[0]?.data));
  }

  listRequests(
    input: FlowFilters<OperationsRequestState>,
  ): Promise<QueryPage<OperationsRequestRead>> {
    return this.snapshot((tx) =>
      readPage(
        tx,
        'commerce_actions a',
        requestProjection,
        requestJoins,
        `($1::text IS NULL OR a.state=$1) AND ($2='' OR position(lower($2) in lower(concat_ws(' ',a.id,a.offering_id,a.creator_id,a.customer_id)))>0)`,
        [input.state ?? null, input.query?.trim() ?? ''],
        'a.id ASC',
        input,
      ),
    );
  }

  async getRequest(id: string): Promise<OperationsRequestRead> {
    const rows = await this.client.unsafe<{ data: OperationsRequestRead }[]>(
      `SELECT ${requestProjection} data FROM commerce_actions a ${requestJoins} WHERE a.id=$1`,
      [id],
    );
    return normalizeTimes(found(rows[0]?.data));
  }

  overview(modules: readonly ReadModule[]): Promise<WorkspaceOverview> {
    return this.snapshot(async (tx) => {
      const time = await tx.unsafe<{ time: string }[]>(
        'SELECT transaction_timestamp()::text AS time',
      );
      const result: Partial<Record<ReadModule, ModuleSummary>> = {};
      let recentActivity: SearchItem[] | undefined;
      for (const module of modules) {
        const relation =
          module === 'offering'
            ? 'service_offerings'
            : module === 'request'
              ? 'commerce_actions'
              : 'service_policy_audits';
        let source = relation,
          scope = 'all persisted records',
          grouping = module === 'audit' ? 'action' : 'state';
        let from = relation;
        let policyVersion: string | undefined;
        if (module === 'catalog') {
          const version = await tx.unsafe<{ version: string }[]>(
            `SELECT ${currentRelease} version`,
          );
          policyVersion = version[0]!.version;
          from = `(SELECT 'capability:'||status AS state FROM service_policy_capabilities WHERE policy_version=${currentRelease}
            UNION ALL SELECT 'template:'||status FROM service_policy_templates WHERE policy_version=${currentRelease}) catalog`;
          source = 'service_policy_capabilities + service_policy_templates';
          scope = 'current published policy release (fallback v1); types are disjoint';
          grouping = 'state';
        }
        const counts = await tx.unsafe<{ state: string; count: number }[]>(
          `SELECT ${grouping} state,count(*)::int count FROM ${from} GROUP BY ${grouping}`,
        );
        result[module] = {
          total: counts.reduce((n, row) => n + row.count, 0),
          states: Object.fromEntries(counts.map((row) => [row.state, row.count])),
          source,
          scope,
          exact: true,
          ...(policyVersion ? { policyVersion } : {}),
        };
        if (module === 'audit')
          recentActivity = await searchRows(tx, ['audit'], {
            query: '',
            page: 1,
            pageSize: 5,
          }).then((p) => [...p.items]);
      }
      return {
        queriedAt: new Date(time[0]!.time).toISOString(),
        consistency: 'repeatable_read_snapshot',
        modules: result,
        ...(recentActivity ? { recentActivity } : {}),
      };
    });
  }

  search(modules: readonly ReadModule[], input: SearchInput) {
    return this.snapshot((tx) => searchRows(tx, modules, input));
  }
}

async function readPage<T>(
  tx: Reader,
  from: string,
  projection: string,
  joins: string,
  where: string,
  parameters: (string | number | null)[],
  order: string,
  input: { readonly page: number; readonly pageSize: number },
): Promise<QueryPage<T>> {
  validatePage(input);
  const count = await tx.unsafe<{ total: number }[]>(
    `SELECT count(*)::int total FROM ${from} WHERE ${where}`,
    parameters,
  );
  // Page selection happens before relation projection, so associations only load for this page.
  const alias = from.split(' ').at(-1)!;
  const base = from.split(' ')[0]!;
  const selected = `(SELECT * FROM ${base} ${alias} WHERE ${where} ORDER BY ${order} LIMIT $${parameters.length + 1} OFFSET $${parameters.length + 2}) ${alias}`;
  const rows = await tx.unsafe<{ data: T }[]>(
    `SELECT ${projection} data FROM ${selected} ${joins} ORDER BY ${order}`,
    [...parameters, input.pageSize, (input.page - 1) * input.pageSize],
  );
  return {
    items: rows.map((row) => normalizeTimes(row.data)),
    total: count[0]!.total,
    page: input.page,
    pageSize: input.pageSize,
  };
}

async function searchRows(
  tx: Reader,
  modules: readonly ReadModule[],
  input: SearchInput,
): Promise<QueryPage<SearchItem>> {
  validatePage(input);
  if (!modules.length) return { items: [], total: 0, page: input.page, pageSize: input.pageSize };
  const branches: string[] = [];
  const match = (fields: string) =>
    `($1='' OR position(lower($1) in lower(concat_ws(' ',${fields})))>0)`;
  if (modules.includes('catalog'))
    for (const kind of ['capabilities', 'templates'] as const)
      branches.push(
        `SELECT '${kind}'::text kind,id,name,status state,${kind === 'templates' ? 'capability_catalog_item_id' : 'NULL::text'} "relatedId",updated_at "updatedAt",NULL::text "actorId",updated_at sort_time FROM service_policy_${kind}
     WHERE policy_version=${currentRelease} AND ${match('id,slug,name,status')}`,
      );
  if (modules.includes('offering'))
    branches.push(
      `SELECT 'offering'::text kind,id,title name,state,creator_id "relatedId",updated_at "updatedAt",NULL::text "actorId",updated_at sort_time FROM service_offerings WHERE ${match('id,title,state,creator_id')}`,
    );
  if (modules.includes('request'))
    branches.push(
      `SELECT 'request'::text kind,id,id name,state,offering_id "relatedId",updated_at "updatedAt",NULL::text "actorId",updated_at sort_time FROM commerce_actions WHERE ${match('id,offering_id,creator_id,state')}`,
    );
  // No arbitrary audit text, before/after JSON, contacts, request text, or credentials searched.
  if (modules.includes('audit'))
    branches.push(
      `SELECT 'audit'::text kind,id,action name,entity_type state,entity_id "relatedId",occurred_at "updatedAt",actor_id "actorId",occurred_at sort_time FROM service_policy_audits WHERE ${match('id,actor_id,entity_id,entity_type,action,correlation_id')}`,
    );
  const union = branches.join(' UNION ALL ');
  const query = input.query.trim();
  const count = await tx.unsafe<{ total: number }[]>(
    `SELECT count(*)::int total FROM (${union}) s`,
    [query],
  );
  const rows = await tx.unsafe<(SearchItem & { sort_time?: unknown })[]>(
    `SELECT kind,id,name,state,"relatedId","updatedAt","actorId" FROM (${union}) s
    ORDER BY sort_time DESC,kind ASC,id ASC LIMIT $2 OFFSET $3`,
    [query, input.pageSize, (input.page - 1) * input.pageSize],
  );
  return {
    items: rows.map((row) =>
      normalizeTimes({
        ...row,
        ...(row.kind === 'audit' ? { occurredAt: row.updatedAt, updatedAt: undefined } : {}),
        ...(row.relatedId === null ? { relatedId: undefined } : {}),
        ...(row.actorId
          ? { actorCategory: classifyAuditActor(row.actorId) }
          : { actorId: undefined }),
      }),
    ),
    total: count[0]!.total,
    page: input.page,
    pageSize: input.pageSize,
  };
}

function normalizeTimes<T>(value: T): T {
  const copy = { ...value } as Record<string, unknown>;
  for (const key of ['createdAt', 'updatedAt', 'occurredAt'])
    if (typeof copy[key] === 'string') copy[key] = new Date(copy[key]).toISOString();
  return copy as T;
}
function found<T>(value: T | undefined): T {
  if (value === undefined)
    throw new ApplicationError({
      category: 'not_found',
      code: 'operations_record_not_found',
      message: 'Record was not found.',
    });
  return value;
}
function validatePage(input: { readonly page: number; readonly pageSize: number }) {
  if (
    !Number.isInteger(input.page) ||
    input.page < 1 ||
    input.page > 10000 ||
    !Number.isInteger(input.pageSize) ||
    input.pageSize < 1 ||
    input.pageSize > 100
  )
    throw new ApplicationError({
      category: 'validation',
      code: 'invalid_pagination',
      message: 'Pagination is invalid.',
    });
}
