import { randomUUID } from 'node:crypto';
import type { Sql, TransactionSql } from 'postgres';
import { ApplicationError } from '../../../applications/core/application-error.js';
import type {
  HomepageActivationWindow,
  HomepageConfiguration,
  HomepageVersionSummary,
  PublicHomepage,
  PublicHomepageRepository,
  ScheduledHomepageManagement,
  ScheduledHomepageRepository,
} from '../../../applications/public-commerce-homepage/public-commerce-homepage-service.js';
import type {
  HomepageAction,
  HomepageState,
} from '../../../modules/public-commerce-homepage/homepage.js';
import type { HomepageVersionState } from '../../../modules/public-commerce-homepage/scheduling.js';
import { normalizeHomepageInstant } from '../../../modules/public-commerce-homepage/scheduling.js';

type QuerySql = Sql | TransactionSql;

type ConfigRow = {
  state: HomepageState;
  commerce_profile_id: string | null;
  commerce_profile_display_name: string | null;
  commerce_profile_lifecycle: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED' | null;
};
type VersionRow = {
  homepage_id: string;
  identity_id: string;
  commerce_profile_id: string | null;
  state: HomepageVersionState;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  commerce_profile_display_name: string | null;
  commerce_profile_lifecycle: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED' | null;
};
type WindowRow = {
  window_id: string;
  identity_id: string;
  homepage_id: string;
  starts_at: string;
  ends_at: string;
  time_zone: string;
  state: 'ENABLED' | 'DISABLED';
  created_at: string;
  updated_at: string;
};
type HomepageRow = {
  commerce_reference: string;
  display_name: string;
  account_ids: string[];
};

function profileFromRow(row: {
  commerce_profile_id: string | null;
  commerce_profile_display_name: string | null;
  commerce_profile_lifecycle: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED' | null;
}): HomepageConfiguration['commerceProfile'] {
  if (
    row.commerce_profile_id === null ||
    row.commerce_profile_display_name === null ||
    row.commerce_profile_lifecycle === null
  )
    return null;
  return {
    id: row.commerce_profile_id,
    displayName: row.commerce_profile_display_name,
    lifecycle: row.commerce_profile_lifecycle,
  };
}

function configuration(row?: ConfigRow): HomepageConfiguration {
  return {
    state: row?.state ?? 'UNPUBLISHED',
    commerceProfileId: row?.commerce_profile_id ?? null,
    commerceProfile: row ? profileFromRow(row) : null,
  };
}

function conflict(code = 'homepage_not_ready', message = 'Homepage is not ready.') {
  return new ApplicationError({ category: 'conflict', code, message });
}

function notFound(code: string, message: string) {
  return new ApplicationError({ category: 'not_found', code, message });
}

function toVersion(row: VersionRow): HomepageVersionSummary {
  return {
    homepageId: row.homepage_id,
    identityId: row.identity_id,
    commerceProfileId: row.commerce_profile_id,
    state: row.state,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    commerceProfile: profileFromRow(row),
  };
}

function toWindow(row: WindowRow): HomepageActivationWindow {
  return {
    windowId: row.window_id,
    identityId: row.identity_id,
    homepageId: row.homepage_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    timeZone: row.time_zone,
    state: row.state,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PostgresPublicHomepageRepository
  implements PublicHomepageRepository, ScheduledHomepageRepository
{
  constructor(
    private readonly sql: Sql,
    private readonly creatorActorMappings: ReadonlyMap<string, string> = new Map(),
  ) {}

  async configuration(identityId: string): Promise<HomepageConfiguration> {
    return this.sql.begin(async (tx) => configuration(await this.configurationRow(tx, identityId)));
  }

  async selectProfile(
    identityId: string,
    profileId: string,
    actorId: string,
  ): Promise<HomepageConfiguration> {
    return this.sql.begin(async (tx) => {
      await this.authorize(tx, identityId, actorId);
      await this.requireProfile(tx, identityId, profileId);
      await tx`SELECT set_config('pci.homepage_actor', ${actorId}, true)`;
      const existing = await this.compatibilityVersion(tx, identityId);
      if (existing === undefined) {
        await tx`INSERT INTO public_commerce_homepage_versions
          (homepage_id, identity_id, commerce_profile_id)
          VALUES (${randomUUID()}, ${identityId}, ${profileId})`;
      } else {
        await tx`UPDATE public_commerce_homepage_versions
          SET commerce_profile_id = ${profileId}, updated_at = now()
          WHERE homepage_id = ${existing.homepage_id} AND identity_id = ${identityId}`;
      }
      return configuration(await this.configurationRow(tx, identityId));
    });
  }

  async transition(
    identityId: string,
    action: HomepageAction,
    actorId: string,
  ): Promise<HomepageConfiguration> {
    return configuration(await this.transitionCompatibility(identityId, action, actorId));
  }

  async preview(identityId: string): Promise<PublicHomepage | undefined> {
    return this.sql.begin(async (tx) => {
      const version = await this.compatibilityVersion(tx, identityId);
      if (version === undefined) return undefined;
      return (await this.readHomepage(tx, identityId, version.homepage_id, false))?.homepage;
    });
  }

  async resolve(reference: string, viewId: string): Promise<PublicHomepage | undefined> {
    return this.sql.begin(async (tx) => {
      const identity = await this.identityForReference(tx, reference);
      if (identity === undefined) return undefined;
      const selected = await this.selectVersion(tx, identity);
      if (selected === undefined) return undefined;
      const result = await this.readHomepage(tx, identity, selected.homepage_id, true);
      if (result === undefined) return undefined;
      await tx`INSERT INTO product_events
        (id, name, occurred_at, actor_id, object_id, correlation_id, source, payload)
        VALUES (${randomUUID()}, 'storefront_viewed', now(), ${viewId}, ${result.creatorId}, ${viewId}, 'customer', '{}'::jsonb)
        ON CONFLICT (correlation_id, name, object_id) DO NOTHING`;
      return result.homepage;
    });
  }

  async management(identityId: string, instant?: string): Promise<ScheduledHomepageManagement> {
    return this.sql.begin(async (tx) => {
      const at = instant ?? ((await tx`SELECT now() AS now`)[0] as { now: string }).now;
      const versions = await this.versionRows(tx, identityId);
      const windows = await this.windowRows(tx, identityId);
      const active = selectVersionFromRows(versions, windows, at);
      const defaultVersion = versions.find((row) => row.is_default);
      const selected = active ?? defaultVersion ?? versions[0];
      const config = selected
        ? configuration({
            state: selected.state === 'ARCHIVED' ? 'PAUSED' : selected.state,
            commerce_profile_id: selected.commerce_profile_id,
            commerce_profile_display_name: selected.commerce_profile_display_name,
            commerce_profile_lifecycle: selected.commerce_profile_lifecycle,
          })
        : configuration();
      const next = windows
        .filter(
          (window) =>
            window.state === 'ENABLED' &&
            Date.parse(window.starts_at) > Date.parse(at) &&
            versions.some(
              (version) =>
                version.homepage_id === window.homepage_id &&
                version.state === 'PUBLISHED' &&
                version.commerce_profile_id !== null &&
                version.commerce_profile_lifecycle === 'ACTIVE',
            ),
        )
        .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at))[0]?.starts_at;
      return {
        configuration: config,
        versions: versions.map(toVersion),
        windows: windows.map(toWindow),
        activeHomepageId: active?.homepage_id ?? null,
        defaultHomepageId: defaultVersion?.homepage_id ?? null,
        nextSwitchAt: next ?? null,
      };
    });
  }

  async createVersion(
    identityId: string,
    profileId: string,
    actorId: string,
  ): Promise<HomepageVersionSummary> {
    return this.sql.begin(async (tx) => {
      await this.authorize(tx, identityId, actorId);
      await this.requireProfile(tx, identityId, profileId);
      await tx`SELECT set_config('pci.homepage_actor', ${actorId}, true)`;
      const id = randomUUID();
      await tx`INSERT INTO public_commerce_homepage_versions
        (homepage_id, identity_id, commerce_profile_id) VALUES (${id}, ${identityId}, ${profileId})`;
      return toVersion(await this.requireVersion(tx, identityId, id));
    });
  }

  async updateVersion(
    identityId: string,
    homepageId: string,
    profileId: string,
    actorId: string,
  ): Promise<HomepageVersionSummary> {
    return this.sql.begin(async (tx) => {
      await this.authorize(tx, identityId, actorId);
      await this.requireProfile(tx, identityId, profileId);
      await tx`SELECT set_config('pci.homepage_actor', ${actorId}, true)`;
      const rows = await tx`UPDATE public_commerce_homepage_versions
        SET commerce_profile_id = ${profileId}, updated_at = now()
        WHERE identity_id = ${identityId} AND homepage_id = ${homepageId} AND state <> 'ARCHIVED'`;
      if (rows.count === 0) throw notFound('homepage_not_found', 'Homepage version was not found.');
      return toVersion(await this.requireVersion(tx, identityId, homepageId));
    });
  }

  async transitionVersion(
    identityId: string,
    homepageId: string,
    action: HomepageAction,
    actorId: string,
  ): Promise<HomepageVersionSummary> {
    return this.sql.begin(async (tx) => {
      await this.authorize(tx, identityId, actorId);
      const version = await this.requireVersion(tx, identityId, homepageId);
      await tx`SELECT set_config('pci.homepage_actor', ${actorId}, true)`;
      if (action === 'pause') {
        if (version.state === 'ARCHIVED')
          throw conflict('homepage_archived', 'An archived homepage cannot be changed.');
        if (version.state === 'UNPUBLISHED')
          throw conflict('homepage_not_published', 'An unpublished homepage cannot be paused.');
        await tx`UPDATE public_commerce_homepage_versions SET state = 'PAUSED', is_default = false, updated_at = now()
          WHERE identity_id = ${identityId} AND homepage_id = ${homepageId}`;
      } else {
        await this.requirePublishable(tx, identityId, homepageId);
        await tx`UPDATE public_commerce_homepage_versions SET state = 'PUBLISHED', updated_at = now()
          WHERE identity_id = ${identityId} AND homepage_id = ${homepageId}`;
        await tx`UPDATE public_commerce_homepage_versions AS candidate
          SET is_default = true, updated_at = now()
          WHERE candidate.identity_id = ${identityId} AND candidate.homepage_id = ${homepageId}
            AND NOT EXISTS (
              SELECT 1 FROM public_commerce_homepage_versions AS existing
              WHERE existing.identity_id = candidate.identity_id AND existing.is_default
            )`;
      }
      return toVersion(await this.requireVersion(tx, identityId, homepageId));
    });
  }

  async archiveVersion(
    identityId: string,
    homepageId: string,
    actorId: string,
  ): Promise<HomepageVersionSummary> {
    return this.sql.begin(async (tx) => {
      await this.authorize(tx, identityId, actorId);
      await this.requireVersion(tx, identityId, homepageId);
      await tx`SELECT set_config('pci.homepage_actor', ${actorId}, true)`;
      await tx`UPDATE public_commerce_homepage_versions
        SET state = 'ARCHIVED', is_default = false, updated_at = now()
        WHERE identity_id = ${identityId} AND homepage_id = ${homepageId}`;
      await tx`UPDATE public_commerce_homepage_windows
        SET state = 'DISABLED', updated_at = now()
        WHERE identity_id = ${identityId} AND homepage_id = ${homepageId} AND state = 'ENABLED'`;
      return toVersion(await this.requireVersion(tx, identityId, homepageId));
    });
  }

  async setDefaultVersion(
    identityId: string,
    homepageId: string,
    actorId: string,
  ): Promise<HomepageVersionSummary> {
    return this.sql.begin(async (tx) => {
      await this.authorize(tx, identityId, actorId);
      await this.requirePublishable(tx, identityId, homepageId, true);
      await tx`SELECT set_config('pci.homepage_actor', ${actorId}, true)`;
      await tx`UPDATE public_commerce_homepage_versions SET is_default = false, updated_at = now()
        WHERE identity_id = ${identityId} AND is_default`;
      await tx`UPDATE public_commerce_homepage_versions SET is_default = true, updated_at = now()
        WHERE identity_id = ${identityId} AND homepage_id = ${homepageId}`;
      return toVersion(await this.requireVersion(tx, identityId, homepageId));
    });
  }

  async previewVersion(
    identityId: string,
    homepageId: string,
    _instant?: string,
  ): Promise<PublicHomepage | undefined> {
    void _instant;
    return this.sql.begin(async (tx) => {
      await this.requireVersion(tx, identityId, homepageId);
      return (await this.readHomepage(tx, identityId, homepageId, false))?.homepage;
    });
  }

  async resolvePreview(identityId: string, instant: string): Promise<PublicHomepage | undefined> {
    return this.sql.begin(async (tx) => {
      const selected = await this.selectVersion(tx, identityId, instant);
      if (selected === undefined) return undefined;
      return (await this.readHomepage(tx, identityId, selected.homepage_id, true))?.homepage;
    });
  }

  async listWindows(
    identityId: string,
    homepageId: string,
  ): Promise<readonly HomepageActivationWindow[]> {
    await this.requireVersion(this.sql, identityId, homepageId);
    const rows = await this.sql<
      WindowRow[]
    >`SELECT window_id, identity_id, homepage_id, starts_at, ends_at,
      time_zone, state, created_at, updated_at FROM public_commerce_homepage_windows
      WHERE identity_id = ${identityId} AND homepage_id = ${homepageId} ORDER BY starts_at, window_id`;
    return rows.map(toWindow);
  }

  async createWindow(
    identityId: string,
    homepageId: string,
    input: { startsAt: string; endsAt: string; timeZone: string },
    actorId: string,
  ): Promise<HomepageActivationWindow> {
    const normalized = normalizeWindowInput(input);
    return this.sql.begin(async (tx) => {
      await this.authorize(tx, identityId, actorId);
      await this.requirePublishable(tx, identityId, homepageId, true);
      await tx`SELECT set_config('pci.homepage_actor', ${actorId}, true)`;
      try {
        const rows = await tx<WindowRow[]>`INSERT INTO public_commerce_homepage_windows
          (window_id, identity_id, homepage_id, starts_at, ends_at, time_zone)
          VALUES (${randomUUID()}, ${identityId}, ${homepageId}, ${normalized.startsAt}, ${normalized.endsAt}, ${normalized.timeZone})
          RETURNING window_id, identity_id, homepage_id, starts_at, ends_at, time_zone, state, created_at, updated_at`;
        const row = rows[0];
        if (!row)
          throw new ApplicationError({
            category: 'internal',
            code: 'homepage_window_insert_failed',
            message: 'Homepage window could not be created.',
          });
        return toWindow(row);
      } catch (error) {
        throw mapWindowError(error);
      }
    });
  }

  async updateWindow(
    identityId: string,
    windowId: string,
    input: { startsAt: string; endsAt: string; timeZone: string; state: 'ENABLED' | 'DISABLED' },
    actorId: string,
  ): Promise<HomepageActivationWindow> {
    const normalized = normalizeWindowInput(input);
    return this.sql.begin(async (tx) => {
      await this.authorize(tx, identityId, actorId);
      const existing = await tx<{ homepage_id: string }[]>`SELECT homepage_id
        FROM public_commerce_homepage_windows
        WHERE identity_id = ${identityId} AND window_id = ${windowId}
        FOR UPDATE`;
      const homepageId = existing[0]?.homepage_id;
      if (homepageId === undefined)
        throw notFound('homepage_window_not_found', 'Homepage window was not found.');
      if (input.state === 'ENABLED')
        await this.requirePublishable(tx, identityId, homepageId, true);
      await tx`SELECT set_config('pci.homepage_actor', ${actorId}, true)`;
      try {
        const rows = await tx<WindowRow[]>`UPDATE public_commerce_homepage_windows SET
          starts_at = ${normalized.startsAt}, ends_at = ${normalized.endsAt}, time_zone = ${normalized.timeZone},
          state = ${input.state}, updated_at = now()
          WHERE identity_id = ${identityId} AND window_id = ${windowId}
          RETURNING window_id, identity_id, homepage_id, starts_at, ends_at, time_zone, state, created_at, updated_at`;
        if (!rows[0]) throw notFound('homepage_window_not_found', 'Homepage window was not found.');
        return toWindow(rows[0]);
      } catch (error) {
        throw mapWindowError(error);
      }
    });
  }

  async disableWindow(identityId: string, windowId: string, actorId: string): Promise<void> {
    return this.sql.begin(async (tx) => {
      await this.authorize(tx, identityId, actorId);
      await tx`SELECT set_config('pci.homepage_actor', ${actorId}, true)`;
      const result =
        await tx`UPDATE public_commerce_homepage_windows SET state = 'DISABLED', updated_at = now()
        WHERE identity_id = ${identityId} AND window_id = ${windowId}`;
      if (result.count === 0)
        throw notFound('homepage_window_not_found', 'Homepage window was not found.');
    });
  }

  private async transitionCompatibility(
    identityId: string,
    action: HomepageAction,
    actorId: string,
  ): Promise<ConfigRow | undefined> {
    return this.sql.begin(async (tx) => {
      await this.authorize(tx, identityId, actorId);
      const version = await this.compatibilityVersion(tx, identityId);
      if (version === undefined) throw conflict();
      await tx`SELECT set_config('pci.homepage_actor', ${actorId}, true)`;
      if (action === 'pause') {
        if (version.state === 'UNPUBLISHED')
          throw conflict('homepage_not_published', 'An unpublished homepage cannot be paused.');
        await tx`UPDATE public_commerce_homepage_versions SET state = 'PAUSED', is_default = false, updated_at = now()
          WHERE identity_id = ${identityId} AND homepage_id = ${version.homepage_id}`;
      } else {
        await this.requirePublishable(tx, identityId, version.homepage_id);
        await tx`UPDATE public_commerce_homepage_versions SET state = 'PUBLISHED', updated_at = now()
          WHERE identity_id = ${identityId} AND homepage_id = ${version.homepage_id}`;
        await tx`UPDATE public_commerce_homepage_versions AS candidate
          SET is_default = true, updated_at = now()
          WHERE candidate.identity_id = ${identityId} AND candidate.homepage_id = ${version.homepage_id}
            AND NOT EXISTS (
              SELECT 1 FROM public_commerce_homepage_versions AS existing
              WHERE existing.identity_id = candidate.identity_id AND existing.is_default
            )`;
      }
      return this.configurationRow(tx, identityId);
    });
  }

  private async authorize(tx: QuerySql, identityId: string, actorId: string): Promise<void> {
    const memberships = await tx`SELECT a.membership_id FROM account_identity_memberships a
      JOIN identities i ON i.identity_id = a.identity_id
      WHERE a.identity_id = ${identityId} AND a.account_id = ${actorId}
        AND a.state = 'ACTIVE' AND a.authority = 'OWNER' AND i.lifecycle = 'ACTIVE'
      FOR SHARE OF a, i`;
    if (!memberships.length)
      throw new ApplicationError({
        category: 'authorization',
        code: 'active_identity_binding_not_found',
        message: 'Active Identity ownership is required.',
      });
  }

  private async requireProfile(tx: QuerySql, identityId: string, profileId: string): Promise<void> {
    const profiles = await tx`SELECT commerce_profile_id FROM commerce_profiles
      WHERE owning_identity_id = ${identityId} AND commerce_profile_id = ${profileId} AND lifecycle = 'ACTIVE' FOR SHARE`;
    if (!profiles.length) throw conflict();
  }

  private async requireVersion(
    tx: QuerySql,
    identityId: string,
    homepageId: string,
  ): Promise<VersionRow> {
    const row = await this.versionWithProfile(tx, identityId, homepageId);
    if (row === undefined) throw notFound('homepage_not_found', 'Homepage version was not found.');
    return row;
  }

  private async requirePublishable(
    tx: QuerySql,
    identityId: string,
    homepageId: string,
    requirePublished = false,
  ): Promise<VersionRow> {
    const version = await this.requireVersion(tx, identityId, homepageId);
    if (version.state === 'ARCHIVED')
      throw conflict('homepage_archived', 'An archived homepage cannot be changed.');
    if (requirePublished && version.state !== 'PUBLISHED')
      throw conflict('homepage_not_published', 'The homepage must be published first.');
    if (version.commerce_profile_id === null || version.commerce_profile_lifecycle !== 'ACTIVE')
      throw conflict();
    const refs =
      await tx`SELECT 1 FROM identities i JOIN commerce_references r ON r.identity_id = i.identity_id
      WHERE i.identity_id = ${identityId} AND i.lifecycle = 'ACTIVE' AND r.lifecycle = 'ASSIGNED'`;
    if (!refs.length) throw conflict();
    return version;
  }

  private async compatibilityVersion(
    tx: QuerySql,
    identityId: string,
  ): Promise<VersionRow | undefined> {
    const rows = await this.versionRows(tx, identityId);
    return rows.sort(
      (a, b) =>
        Number(b.is_default) - Number(a.is_default) ||
        Date.parse(a.created_at) - Date.parse(b.created_at),
    )[0];
  }

  private async configurationRow(tx: QuerySql, identityId: string): Promise<ConfigRow | undefined> {
    const version = await this.compatibilityVersion(tx, identityId);
    if (version === undefined) return undefined;
    return {
      state: version.state === 'ARCHIVED' ? 'PAUSED' : version.state,
      commerce_profile_id: version.commerce_profile_id,
      commerce_profile_display_name: version.commerce_profile_display_name,
      commerce_profile_lifecycle: version.commerce_profile_lifecycle,
    };
  }

  private async versionRows(tx: QuerySql, identityId: string): Promise<VersionRow[]> {
    return tx<
      VersionRow[]
    >`SELECT v.homepage_id, v.identity_id, v.commerce_profile_id, v.state, v.is_default,
      v.created_at, v.updated_at, p.display_name AS commerce_profile_display_name, p.lifecycle AS commerce_profile_lifecycle
      FROM public_commerce_homepage_versions v LEFT JOIN commerce_profiles p ON p.commerce_profile_id = v.commerce_profile_id
        AND p.owning_identity_id = v.identity_id WHERE v.identity_id = ${identityId}
      ORDER BY v.created_at, v.homepage_id`;
  }

  private async versionWithProfile(
    tx: QuerySql,
    identityId: string,
    homepageId: string,
  ): Promise<VersionRow | undefined> {
    const rows = await tx<
      VersionRow[]
    >`SELECT v.homepage_id, v.identity_id, v.commerce_profile_id, v.state, v.is_default,
      v.created_at, v.updated_at, p.display_name AS commerce_profile_display_name, p.lifecycle AS commerce_profile_lifecycle
      FROM public_commerce_homepage_versions v LEFT JOIN commerce_profiles p ON p.commerce_profile_id = v.commerce_profile_id
        AND p.owning_identity_id = v.identity_id WHERE v.identity_id = ${identityId} AND v.homepage_id = ${homepageId}`;
    return rows[0];
  }

  private async windowRows(tx: QuerySql, identityId: string): Promise<WindowRow[]> {
    return tx<
      WindowRow[]
    >`SELECT window_id, identity_id, homepage_id, starts_at, ends_at, time_zone, state, created_at, updated_at
      FROM public_commerce_homepage_windows WHERE identity_id = ${identityId} ORDER BY starts_at, window_id`;
  }

  private async identityForReference(tx: QuerySql, reference: string): Promise<string | undefined> {
    const rows = await tx<{ identity_id: string }[]>`SELECT identity_id FROM commerce_references
      WHERE commerce_reference = ${reference} AND lifecycle = 'ASSIGNED'`;
    return rows[0]?.identity_id;
  }

  private async selectVersion(
    tx: QuerySql,
    identityId: string,
    instant?: string,
  ): Promise<VersionRow | undefined> {
    const versions = await this.versionRows(tx, identityId);
    const windows = await this.windowRows(tx, identityId);
    const effectiveInstant =
      instant ?? ((await tx`SELECT now() AS now`)[0] as { now: string } | undefined)?.now;
    return selectVersionFromRows(versions, windows, effectiveInstant);
  }

  private async readHomepage(
    tx: QuerySql,
    identityId: string,
    homepageId: string,
    publishedOnly: boolean,
  ): Promise<{ homepage: PublicHomepage; creatorId: string } | undefined> {
    const rows = await tx<HomepageRow[]>`WITH owner AS (
        SELECT a.identity_id, array_agg(DISTINCT a.account_id ORDER BY a.account_id) AS account_ids
        FROM account_identity_memberships a
        WHERE a.state = 'ACTIVE' AND a.authority = 'OWNER' GROUP BY a.identity_id
      )
      SELECT r.commerce_reference, p.display_name, owner.account_ids
      FROM public_commerce_homepage_versions v JOIN identities i ON i.identity_id = v.identity_id AND i.lifecycle = 'ACTIVE'
      JOIN commerce_profiles p ON p.commerce_profile_id = v.commerce_profile_id AND p.owning_identity_id = i.identity_id AND p.lifecycle = 'ACTIVE'
      JOIN commerce_references r ON r.identity_id = i.identity_id AND r.lifecycle = 'ASSIGNED' JOIN owner ON owner.identity_id = i.identity_id
      WHERE v.identity_id = ${identityId} AND v.homepage_id = ${homepageId} AND (${publishedOnly} = false OR v.state = 'PUBLISHED')
      FOR SHARE OF v, p, i`;
    const row = rows[0];
    if (!row) return undefined;
    const creatorId = await this.resolveCreatorId(tx, row.account_ids);
    if (creatorId === undefined) return undefined;
    const identityRows = await tx<{ creator_id: string }[]>`
      SELECT creator_id FROM commerce_identities WHERE creator_id = ${creatorId} FOR SHARE`;
    if (!identityRows.length) return undefined;
    const offeringRows = await tx<{ offerings: PublicHomepage['offerings'] }[]>`
      SELECT COALESCE((SELECT jsonb_agg(jsonb_build_object('id', o.id, 'title', o.title, 'description', o.description)
        ORDER BY o.created_at, o.id) FROM service_offerings o
        JOIN commerce_identities ci ON ci.creator_id = o.creator_id
        WHERE o.creator_id = ${creatorId} AND o.state = 'published'
          AND o.policy_status = 'approved' AND ci.state = 'published'), '[]'::jsonb) AS offerings`;
    return {
      creatorId,
      homepage: {
        commerceReference: row.commerce_reference,
        displayName: row.display_name,
        offerings: offeringRows[0]?.offerings ?? [],
      },
    };
  }

  private async resolveCreatorId(
    tx: QuerySql,
    accountIds: readonly string[],
  ): Promise<string | undefined> {
    if (accountIds.length === 0) return undefined;
    const localAccountIds = accountIds
      .filter((accountId) => accountId.startsWith('local:'))
      .map((accountId) => accountId.slice('local:'.length));
    const localRows = await tx<{ account_id: string; creator_id: string }[]>`
      SELECT m.account_id, m.creator_id
      FROM local_creator_mappings m
      JOIN local_auth_accounts account ON account.id = m.account_id AND account.is_active
      WHERE m.account_id = ANY(${localAccountIds})`;
    const localMappings = new Map(
      localRows.map((row) => [`local:${row.account_id}`, row.creator_id]),
    );
    const creatorIds = new Set<string>();
    for (const accountId of accountIds) {
      const localCreatorId = localMappings.get(accountId);
      const configuredCreatorId = this.creatorActorMappings.get(accountId);
      if (
        localCreatorId !== undefined &&
        configuredCreatorId !== undefined &&
        localCreatorId !== configuredCreatorId
      )
        return undefined;
      const creatorId = localCreatorId ?? configuredCreatorId;
      if (creatorId === undefined) return undefined;
      creatorIds.add(creatorId);
    }
    return creatorIds.size === 1 ? [...creatorIds][0] : undefined;
  }
}

function selectVersionFromRows(
  versions: readonly VersionRow[],
  windows: readonly WindowRow[],
  instant?: string,
): VersionRow | undefined {
  const at = Date.parse(instant ?? new Date().toISOString());
  const published = versions.filter(
    (version) =>
      version.state === 'PUBLISHED' &&
      version.commerce_profile_id !== null &&
      version.commerce_profile_lifecycle === 'ACTIVE',
  );
  const matching = windows
    .filter((window) => window.state === 'ENABLED')
    .filter((window) => Date.parse(window.starts_at) <= at && at < Date.parse(window.ends_at))
    .map((window) => published.find((version) => version.homepage_id === window.homepage_id))
    .filter((version): version is VersionRow => version !== undefined);
  if (matching.length > 1)
    throw conflict(
      'homepage_schedule_conflict',
      'Multiple homepage windows matched the current time.',
    );
  return matching[0] ?? published.find((version) => version.is_default);
}

function normalizeWindowInput(input: {
  startsAt: string;
  endsAt: string;
  timeZone: string;
  state?: 'ENABLED' | 'DISABLED';
}): { startsAt: string; endsAt: string; timeZone: string; state?: 'ENABLED' | 'DISABLED' } {
  try {
    const timeZone = input.timeZone.trim();
    const startsAt = normalizeHomepageInstant(input.startsAt, timeZone);
    const endsAt = normalizeHomepageInstant(input.endsAt, timeZone);
    if (Date.parse(startsAt) >= Date.parse(endsAt))
      throw new RangeError('The time window is invalid.');
    return { ...input, startsAt, endsAt, timeZone };
  } catch (error) {
    if (error instanceof ApplicationError) throw error;
    throw new ApplicationError({
      category: 'validation',
      code: 'invalid_time_window',
      message: 'A valid, unambiguous time window and time zone are required.',
      cause: error,
    });
  }
}

function mapWindowError(error: unknown): ApplicationError {
  if (error instanceof ApplicationError) return error;
  const message = error instanceof Error ? error.message : '';
  if (message.includes('public_commerce_homepage_windows_no_overlap'))
    return conflict(
      'homepage_schedule_conflict',
      'The homepage window overlaps another enabled window.',
    );
  if (message.includes('range_check'))
    return new ApplicationError({
      category: 'validation',
      code: 'invalid_time_window',
      message: 'The window must end after it starts.',
    });
  return new ApplicationError({
    category: 'internal',
    code: 'homepage_schedule_storage_failed',
    message: 'Homepage schedule storage failed.',
    cause: error,
  });
}
