import { and, desc, eq, sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

import {
  servicePolicyAudits,
  servicePolicyCapabilities,
  servicePolicyReleases,
  servicePolicyTemplates,
} from '../../../database/schema/service-policy.js';
import {
  findCapabilityCatalogItem,
  type CapabilityCatalogItem,
  type CatalogItemStatus,
  type PolicyRiskTier,
  type ServicePolicyCatalogSnapshot,
  type ServicePolicyDraft,
  validateServicePolicyCatalog,
  diffServicePolicyCatalog,
  type ServiceOfferingTemplate,
} from '../../../modules/service-policy/catalog.js';
import type {
  ServicePolicyAuditRecord,
  ServicePolicyCatalogRepository,
} from '../../../applications/service-policy/service-policy-repositories.js';
import type { ProductDatabase } from './postgres-database.js';
import { ApplicationError } from '../../../applications/core/application-error.js';

export class PostgresServicePolicyCatalogRepository implements ServicePolicyCatalogRepository {
  public constructor(private readonly database: ProductDatabase) {}

  public async getSnapshot(): Promise<ServicePolicyCatalogSnapshot> {
    return this.database.transaction((database) => this.readSnapshot(database), {
      isolationLevel: 'repeatable read',
      accessMode: 'read only',
    });
  }

  public async createDraft(
    reason: string,
    context: { readonly actorId: string; readonly correlationId: string },
  ): Promise<ServicePolicyDraft> {
    return this.database.transaction(async (database) => {
      await this.lock(database);
      const snapshot = await this.readSnapshot(database);
      const version = `draft-${randomUUID().replaceAll('-', '').slice(0, 25)}`;
      const createdAt = new Date().toISOString();
      await database.insert(servicePolicyReleases).values({
        policyVersion: version,
        status: 'draft',
        reason,
        createdAt,
      });
      if (snapshot.capabilities.length > 0) {
        await database.insert(servicePolicyCapabilities).values(
          snapshot.capabilities.map((item) => ({
            id: item.id,
            slug: item.slug,
            vertical: item.vertical,
            name: item.name,
            description: item.description,
            riskTier: item.riskTier,
            releaseScope: item.releaseScope,
            aliases: [...item.aliases],
            version: item.version,
            policyVersion: version,
            status: item.status,
            creatorSelectable: item.creatorSelectable ?? true,
            publishEnabled: item.publishEnabled ?? true,
          })),
        );
      }
      if (snapshot.templates.length > 0) {
        await database.insert(servicePolicyTemplates).values(
          snapshot.templates.map((item) => ({
            id: item.id,
            slug: item.slug,
            capabilityCatalogItemId: item.capabilityCatalogItemId,
            name: item.name,
            description: item.description,
            riskTier: item.riskTier,
            releaseScope: item.releaseScope,
            requiredFields: [...item.requiredFields],
            version: item.version,
            policyVersion: version,
            status: item.status,
            creatorSelectable: item.creatorSelectable ?? true,
            publishEnabled: item.publishEnabled ?? true,
          })),
        );
      }
      await this.appendAudit(
        database,
        version,
        'release',
        version,
        {},
        { status: 'draft' },
        reason,
        context,
        'draft_created',
      );
      return this.readDraft(database, version, createdAt);
    });
  }

  public async getDraft(version: string): Promise<ServicePolicyDraft> {
    return this.database.transaction((database) => this.readDraft(database, version), {
      isolationLevel: 'repeatable read',
      accessMode: 'read only',
    });
  }

  public async listDrafts(): Promise<readonly ServicePolicyDraft[]> {
    return this.database.transaction(
      async (database) => {
        const releases = await database
          .select({
            policyVersion: servicePolicyReleases.policyVersion,
            createdAt: servicePolicyReleases.createdAt,
          })
          .from(servicePolicyReleases)
          .where(eq(servicePolicyReleases.status, 'draft'));
        return Promise.all(
          releases.map((release) =>
            this.readDraft(database, release.policyVersion, release.createdAt),
          ),
        );
      },
      { isolationLevel: 'repeatable read', accessMode: 'read only' },
    );
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
      return await this.database.transaction(async (database) => {
        await this.lock(database);
        const draft = await this.readDraft(database, version);
        if (draft.revision !== input.expectedRevision) throw staleRevision();
        const table = kind === 'capability' ? servicePolicyCapabilities : servicePolicyTemplates;
        const currentRows = await database
          .select()
          .from(table)
          .where(and(eq(table.id, id), eq(table.policyVersion, version)));
        const current = currentRows[0];
        if (current === undefined) throw itemNotFound(kind);
        const now = new Date(Math.max(Date.now(), Date.parse(draft.revision) + 1)).toISOString();
        const changes = {
          ...(input.status === undefined ? {} : { status: input.status }),
          ...(input.creatorSelectable === undefined
            ? {}
            : { creatorSelectable: input.creatorSelectable }),
          ...(input.publishEnabled === undefined ? {} : { publishEnabled: input.publishEnabled }),
          ...(input.riskTier === undefined ? {} : { riskTier: input.riskTier }),
          updatedAt: now,
        };
        await database
          .update(table)
          .set(changes)
          .where(
            and(
              eq(table.id, id),
              eq(table.policyVersion, version),
              eq(table.updatedAt, current.updatedAt),
            ),
          );
        const updated = { ...current, ...changes };
        await this.appendAudit(
          database,
          version,
          kind,
          id,
          current,
          updated,
          input.reason,
          context,
          'draft_updated',
        );
        return this.readDraft(database, version);
      });
    } catch (error) {
      await this.recordDraftFailure(
        version,
        input.reason,
        context,
        error,
        'draft_update_failed',
        kind,
        id,
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
    const current = await this.getSnapshot();
    const preview = { ...result, changes: diffServicePolicyCatalog(current, draft) };
    await this.recordDraftCheck(version, preview, context, 'previewed');
    return preview;
  }

  public async validateDraft(
    version: string,
    context: { readonly actorId: string; readonly correlationId: string },
  ) {
    const draft = await this.getDraft(version);
    const result = validateServicePolicyCatalog(draft);
    await this.recordDraftCheck(version, result, context, 'validated');
    return result;
  }

  public async activateDraft(
    version: string,
    input: { readonly expectedRevision: string; readonly reason: string },
    context: { readonly actorId: string; readonly correlationId: string },
  ): Promise<void> {
    try {
      await this.database.transaction(async (database) => {
        await this.lock(database);
        const draft = await this.readDraft(database, version);
        if (draft.revision !== input.expectedRevision) throw staleRevision();
        const result = validateServicePolicyCatalog(draft);
        if (result.status !== 'VALID') {
          throw new ApplicationError({
            category: 'validation',
            code: 'service_policy_draft_invalid',
            message: result.errors.join(' '),
          });
        }
        await database
          .update(servicePolicyReleases)
          .set({ status: 'archived' })
          .where(eq(servicePolicyReleases.status, 'published'));
        await database
          .update(servicePolicyReleases)
          .set({
            status: 'published',
            reason: input.reason,
            publishedBy: context.actorId,
            publishedAt: new Date().toISOString(),
          })
          .where(eq(servicePolicyReleases.policyVersion, version));
        await this.appendAudit(
          database,
          version,
          'release',
          version,
          { status: 'draft' },
          { status: 'published', publishedBy: context.actorId },
          input.reason,
          context,
          'activated',
        );
      });
    } catch (error) {
      await this.recordDraftFailure(version, input.reason, context, error);
      throw error;
    }
  }

  private async readSnapshot(
    database: Pick<ProductDatabase, 'select'>,
  ): Promise<ServicePolicyCatalogSnapshot> {
    const releases = await database
      .select()
      .from(servicePolicyReleases)
      .where(eq(servicePolicyReleases.status, 'published'))
      .orderBy(desc(servicePolicyReleases.publishedAt), desc(servicePolicyReleases.policyVersion))
      .limit(1);
    const policyVersion = releases[0]?.policyVersion ?? 'v1';
    const [capabilities, templates] = await Promise.all([
      database
        .select()
        .from(servicePolicyCapabilities)
        .where(eq(servicePolicyCapabilities.policyVersion, policyVersion)),
      database
        .select()
        .from(servicePolicyTemplates)
        .where(eq(servicePolicyTemplates.policyVersion, policyVersion)),
    ]);
    return {
      policyVersion,
      capabilities: capabilities.map(mapCapability),
      templates: templates.map(mapTemplate),
    };
  }

  public async findCapabilityById(id: string): Promise<CapabilityCatalogItem | undefined> {
    const snapshot = await this.getSnapshot();
    return snapshot.capabilities.find((item) => item.id === id);
  }

  public async findCapabilityByName(name: string): Promise<CapabilityCatalogItem | undefined> {
    const snapshot = await this.getSnapshot();
    return findCapabilityCatalogItem({ name }, snapshot);
  }

  public async findTemplateById(id: string): Promise<ServiceOfferingTemplate | undefined> {
    const snapshot = await this.getSnapshot();
    return snapshot.templates.find((template) => template.id === id);
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
  ): Promise<CapabilityCatalogItem> {
    return this.database.transaction(async (database) => {
      await database.execute(
        sql`select pg_advisory_xact_lock(hashtext('pci.service-policy.catalog'))`,
      );

      const snapshot = await this.readSnapshot(database);
      const current = snapshot.capabilities.find((item) => item.id === id);
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
      await database
        .update(servicePolicyCapabilities)
        .set({
          status: updated.status,
          creatorSelectable: updated.creatorSelectable ?? true,
          publishEnabled: updated.publishEnabled ?? true,
          riskTier: updated.riskTier,
          updatedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(servicePolicyCapabilities.id, id),
            eq(servicePolicyCapabilities.policyVersion, snapshot.policyVersion),
          ),
        );
      await this.appendAudit(
        database,
        snapshot.policyVersion,
        'capability',
        id,
        current as unknown as Readonly<Record<string, unknown>>,
        updated,
        input.reason,
        context,
        'updated',
      );
      return updated;
    });
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
  ): Promise<ServiceOfferingTemplate> {
    return this.database.transaction(async (database) => {
      await database.execute(
        sql`select pg_advisory_xact_lock(hashtext('pci.service-policy.catalog'))`,
      );

      const snapshot = await this.readSnapshot(database);
      const current = snapshot.templates.find((template) => template.id === id);
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
      await database
        .update(servicePolicyTemplates)
        .set({
          status: updated.status,
          creatorSelectable: updated.creatorSelectable ?? true,
          publishEnabled: updated.publishEnabled ?? true,
          riskTier: updated.riskTier,
          updatedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(servicePolicyTemplates.id, id),
            eq(servicePolicyTemplates.policyVersion, snapshot.policyVersion),
          ),
        );
      await this.appendAudit(
        database,
        snapshot.policyVersion,
        'template',
        id,
        current as unknown as Readonly<Record<string, unknown>>,
        updated,
        input.reason,
        context,
        'updated',
      );
      return updated;
    });
  }

  public async publishVersion(
    version: string,
    reason: string,
    context: { readonly actorId: string; readonly correlationId: string },
  ): Promise<void> {
    return this.database.transaction(async (database) => {
      await database.execute(
        sql`select pg_advisory_xact_lock(hashtext('pci.service-policy.catalog'))`,
      );

      const [capabilityRows, templateRows] = await Promise.all([
        database
          .select({ id: servicePolicyCapabilities.id })
          .from(servicePolicyCapabilities)
          .where(eq(servicePolicyCapabilities.policyVersion, version)),
        database
          .select({ id: servicePolicyTemplates.id })
          .from(servicePolicyTemplates)
          .where(eq(servicePolicyTemplates.policyVersion, version)),
      ]);
      if (capabilityRows.length === 0 || templateRows.length === 0) {
        throw new ApplicationError({
          category: 'validation',
          code: 'service_policy_version_not_loaded',
          message: 'The service policy version must be imported before publication.',
        });
      }
      const before = await database
        .select()
        .from(servicePolicyReleases)
        .where(eq(servicePolicyReleases.policyVersion, version));
      const now = new Date().toISOString();
      // Keep exactly one published release so runtime snapshots are deterministic.
      await database
        .update(servicePolicyReleases)
        .set({ status: 'archived' })
        .where(eq(servicePolicyReleases.status, 'published'));
      await database
        .insert(servicePolicyReleases)
        .values({
          policyVersion: version,
          status: 'published',
          reason,
          publishedBy: context.actorId,
          publishedAt: now,
        })
        .onConflictDoUpdate({
          target: servicePolicyReleases.policyVersion,
          set: { status: 'published', reason, publishedBy: context.actorId, publishedAt: now },
        });
      await this.appendAudit(
        database,
        version,
        'release',
        version,
        before[0] ?? {},
        { policyVersion: version, status: 'published', publishedBy: context.actorId },
        reason,
        context,
        'published',
      );
    });
  }

  public async listAudit(): Promise<readonly ServicePolicyAuditRecord[]> {
    const rows = await this.database
      .select()
      .from(servicePolicyAudits)
      .orderBy(desc(servicePolicyAudits.occurredAt), desc(servicePolicyAudits.recordedAt));
    return rows.map((row) => ({
      id: row.id,
      actorId: row.actorId,
      entityType: row.entityType as ServicePolicyAuditRecord['entityType'],
      entityId: row.entityId,
      action: row.action as ServicePolicyAuditRecord['action'],
      before: row.beforeState,
      after: row.afterState,
      reason: row.reason,
      policyVersion: row.policyVersion,
      occurredAt: row.occurredAt,
      correlationId: row.correlationId,
    }));
  }

  private async appendAudit(
    database: Pick<ProductDatabase, 'insert'>,
    policyVersion: string,
    entityType: ServicePolicyAuditRecord['entityType'],
    entityId: string,
    before: Readonly<Record<string, unknown>>,
    after: Readonly<Record<string, unknown>>,
    reason: string,
    context: { readonly actorId: string; readonly correlationId: string },
    action: ServicePolicyAuditRecord['action'],
  ): Promise<void> {
    await database.insert(servicePolicyAudits).values({
      id: randomUUID(),
      actorId: context.actorId,
      entityType,
      entityId,
      action,
      beforeState: before,
      afterState: after,
      reason,
      policyVersion,
      occurredAt: new Date().toISOString(),
      correlationId: context.correlationId,
    });
  }

  private async lock(database: Pick<ProductDatabase, 'execute'>): Promise<void> {
    await database.execute(
      sql`select pg_advisory_xact_lock(hashtext('pci.service-policy.catalog'))`,
    );
  }

  private async readDraft(
    database: Pick<ProductDatabase, 'select'>,
    version: string,
    createdAt?: string,
  ): Promise<ServicePolicyDraft> {
    const releases = await database
      .select()
      .from(servicePolicyReleases)
      .where(
        and(
          eq(servicePolicyReleases.policyVersion, version),
          eq(servicePolicyReleases.status, 'draft'),
        ),
      )
      .limit(1);
    const release = releases[0];
    if (release === undefined) throw draftNotFound();
    const snapshot = await this.readVersionSnapshot(database, version);
    const revision = await this.readDraftRevision(database, version);
    return {
      ...snapshot,
      status: 'draft',
      revision,
      createdAt: createdAt ?? release.createdAt,
    };
  }

  private async readVersionSnapshot(
    database: Pick<ProductDatabase, 'select'>,
    policyVersion: string,
  ): Promise<ServicePolicyCatalogSnapshot> {
    const [capabilities, templates] = await Promise.all([
      database
        .select()
        .from(servicePolicyCapabilities)
        .where(eq(servicePolicyCapabilities.policyVersion, policyVersion)),
      database
        .select()
        .from(servicePolicyTemplates)
        .where(eq(servicePolicyTemplates.policyVersion, policyVersion)),
    ]);
    return {
      policyVersion,
      capabilities: capabilities.map(mapCapability),
      templates: templates.map(mapTemplate),
    };
  }

  private async readDraftRevision(
    database: Pick<ProductDatabase, 'select'>,
    version: string,
  ): Promise<string> {
    const rows = await database
      .select({ updatedAt: servicePolicyCapabilities.updatedAt })
      .from(servicePolicyCapabilities)
      .where(eq(servicePolicyCapabilities.policyVersion, version));
    const templateRows = await database
      .select({ updatedAt: servicePolicyTemplates.updatedAt })
      .from(servicePolicyTemplates)
      .where(eq(servicePolicyTemplates.policyVersion, version));
    return (
      [...rows, ...templateRows]
        .map((row) => row.updatedAt)
        .sort()
        .at(-1) ?? ''
    );
  }

  private async recordDraftCheck(
    version: string,
    result: { readonly status: string; readonly errors: readonly string[] },
    context: { readonly actorId: string; readonly correlationId: string },
    action: 'previewed' | 'validated',
  ): Promise<void> {
    await this.database.transaction(async (database) => {
      await this.appendAudit(
        database,
        version,
        'release',
        version,
        {},
        result,
        `${action} draft`,
        context,
        action,
      );
    });
  }

  private async recordDraftFailure(
    version: string,
    reason: string,
    context: { readonly actorId: string; readonly correlationId: string },
    error: unknown,
    action: 'activation_failed' | 'draft_update_failed' = 'activation_failed',
    entityType: 'release' | 'capability' | 'template' = 'release',
    entityId = version,
  ): Promise<void> {
    await this.database.transaction(async (database) => {
      await this.appendAudit(
        database,
        version,
        entityType,
        entityId,
        {},
        { error: error instanceof Error ? error.message : 'activation_failed' },
        reason,
        context,
        action,
      );
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

function mapCapability(row: typeof servicePolicyCapabilities.$inferSelect): CapabilityCatalogItem {
  return {
    id: row.id,
    slug: row.slug,
    vertical: row.vertical,
    name: row.name,
    description: row.description,
    riskTier: row.riskTier as CapabilityCatalogItem['riskTier'],
    releaseScope: row.releaseScope as CapabilityCatalogItem['releaseScope'],
    aliases: row.aliases,
    version: row.version,
    status: row.status as CapabilityCatalogItem['status'],
    creatorSelectable: row.creatorSelectable,
    publishEnabled: row.publishEnabled,
  };
}

function mapTemplate(row: typeof servicePolicyTemplates.$inferSelect): ServiceOfferingTemplate {
  return {
    id: row.id,
    slug: row.slug,
    capabilityCatalogItemId: row.capabilityCatalogItemId,
    name: row.name,
    description: row.description,
    riskTier: row.riskTier as ServiceOfferingTemplate['riskTier'],
    releaseScope: row.releaseScope as ServiceOfferingTemplate['releaseScope'],
    requiredFields: row.requiredFields,
    version: row.version,
    status: row.status as ServiceOfferingTemplate['status'],
    creatorSelectable: row.creatorSelectable,
    publishEnabled: row.publishEnabled,
  };
}
