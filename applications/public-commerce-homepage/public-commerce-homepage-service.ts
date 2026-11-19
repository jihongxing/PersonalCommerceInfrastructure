import type { AccountContext } from '../core/account-context.js';
import type { CurrentUserIdentityService } from '../account-identity-membership/current-user-identity-service.js';
import { ApplicationError } from '../core/application-error.js';
import { normalizePublicCommerceReference } from '../../modules/public-commerce-homepage/homepage.js';
import type {
  HomepageAction,
  HomepageState,
} from '../../modules/public-commerce-homepage/homepage.js';
import type {
  HomepageActivationWindowRef,
  HomepageVersionState,
} from '../../modules/public-commerce-homepage/scheduling.js';
import { normalizeHomepageInstant } from '../../modules/public-commerce-homepage/scheduling.js';

export interface HomepageConfiguration {
  readonly state: HomepageState;
  readonly commerceProfileId: string | null;
  readonly commerceProfile: {
    readonly id: string;
    readonly displayName: string;
    readonly lifecycle: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  } | null;
}

export interface PublicHomepage {
  readonly commerceReference: string;
  readonly displayName: string;
  readonly offerings: readonly {
    readonly id: string;
    readonly title: string;
    readonly description: string;
  }[];
  readonly goodsOfferings?: readonly {
    readonly id: string;
    readonly sellerId: string;
    readonly title: string;
    readonly description: string;
    readonly priceMinor: string;
    readonly currency: string;
    readonly fulfillmentDescription: string;
    readonly preparationDescription: string;
    readonly imageUrl?: string;
  }[];
}

/** Operations which change or disclose a homepage must enforce ownership and lifecycle atomically. */
export interface PublicHomepageRepository {
  configuration(identityId: string): Promise<HomepageConfiguration>;
  selectProfile(
    identityId: string,
    profileId: string,
    actorId: string,
  ): Promise<HomepageConfiguration>;
  transition(
    identityId: string,
    action: HomepageAction,
    actorId: string,
  ): Promise<HomepageConfiguration>;
  preview(identityId: string): Promise<PublicHomepage | undefined>;
  resolve(reference: string, viewId: string): Promise<PublicHomepage | undefined>;
}

export interface HomepageVersionSummary {
  readonly homepageId: string;
  readonly identityId: string;
  readonly commerceProfileId: string | null;
  readonly state: HomepageVersionState;
  readonly isDefault: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly commerceProfile: HomepageConfiguration['commerceProfile'];
}

export interface HomepageActivationWindow extends HomepageActivationWindowRef {
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ScheduledHomepageManagement {
  readonly configuration: HomepageConfiguration;
  readonly versions: readonly HomepageVersionSummary[];
  readonly windows: readonly HomepageActivationWindow[];
  readonly activeHomepageId: string | null;
  readonly defaultHomepageId: string | null;
  readonly nextSwitchAt: string | null;
}

export interface ScheduledHomepageRepository {
  management(identityId: string, instant?: string): Promise<ScheduledHomepageManagement>;
  createVersion(
    identityId: string,
    profileId: string,
    actorId: string,
  ): Promise<HomepageVersionSummary>;
  updateVersion(
    identityId: string,
    homepageId: string,
    profileId: string,
    actorId: string,
  ): Promise<HomepageVersionSummary>;
  transitionVersion(
    identityId: string,
    homepageId: string,
    action: HomepageAction,
    actorId: string,
  ): Promise<HomepageVersionSummary>;
  archiveVersion(
    identityId: string,
    homepageId: string,
    actorId: string,
  ): Promise<HomepageVersionSummary>;
  setDefaultVersion(
    identityId: string,
    homepageId: string,
    actorId: string,
  ): Promise<HomepageVersionSummary>;
  previewVersion(
    identityId: string,
    homepageId: string,
    instant?: string,
  ): Promise<PublicHomepage | undefined>;
  resolvePreview(identityId: string, instant: string): Promise<PublicHomepage | undefined>;
  listWindows(identityId: string, homepageId: string): Promise<readonly HomepageActivationWindow[]>;
  createWindow(
    identityId: string,
    homepageId: string,
    input: Pick<HomepageActivationWindow, 'startsAt' | 'endsAt' | 'timeZone'>,
    actorId: string,
  ): Promise<HomepageActivationWindow>;
  updateWindow(
    identityId: string,
    windowId: string,
    input: Pick<HomepageActivationWindow, 'startsAt' | 'endsAt' | 'timeZone' | 'state'>,
    actorId: string,
  ): Promise<HomepageActivationWindow>;
  disableWindow(identityId: string, windowId: string, actorId: string): Promise<void>;
}

export function createPublicHomepageService(dependencies: {
  readonly currentUserIdentityService: CurrentUserIdentityService;
  readonly repository: PublicHomepageRepository & Partial<ScheduledHomepageRepository>;
}) {
  const scheduledRepository = (): ScheduledHomepageRepository => {
    const candidate = dependencies.repository as Partial<ScheduledHomepageRepository>;
    if (
      candidate.management === undefined ||
      candidate.createVersion === undefined ||
      candidate.updateVersion === undefined ||
      candidate.transitionVersion === undefined ||
      candidate.setDefaultVersion === undefined ||
      candidate.previewVersion === undefined ||
      candidate.resolvePreview === undefined ||
      candidate.listWindows === undefined ||
      candidate.createWindow === undefined ||
      candidate.updateWindow === undefined ||
      candidate.disableWindow === undefined
    )
      throw new ApplicationError({
        category: 'internal',
        code: 'homepage_scheduling_unavailable',
        message: 'Homepage scheduling is unavailable.',
      });
    return candidate as ScheduledHomepageRepository;
  };
  async function currentIdentity(context: AccountContext): Promise<string> {
    const identity = await dependencies.currentUserIdentityService.getCurrentIdentity(context);
    if (identity.status !== 'ACTIVE') {
      throw new ApplicationError({
        category: 'authorization',
        code: 'identity_inactive',
        message: 'Identity is not active.',
      });
    }
    return identity.identityId;
  }
  return {
    async configuration(context: AccountContext) {
      return dependencies.repository.configuration(await currentIdentity(context));
    },
    async selectProfile(context: AccountContext, profileId: string) {
      if (!profileId.trim())
        throw new ApplicationError({
          category: 'validation',
          code: 'invalid_profile',
          message: 'A profile is required.',
        });
      return dependencies.repository.selectProfile(
        await currentIdentity(context),
        profileId,
        context.accountId,
      );
    },
    async transition(context: AccountContext, action: HomepageAction) {
      return dependencies.repository.transition(
        await currentIdentity(context),
        action,
        context.accountId,
      );
    },
    async preview(context: AccountContext) {
      const result = await dependencies.repository.preview(await currentIdentity(context));
      if (!result) throw unavailable();
      return result;
    },
    async resolve(input: string, viewId: string) {
      let reference: string;
      try {
        reference = normalizePublicCommerceReference(input);
      } catch {
        throw new ApplicationError({
          category: 'validation',
          code: 'invalid_commerce_reference',
          message: 'Invalid C number format.',
        });
      }
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(viewId)) {
        throw new ApplicationError({
          category: 'validation',
          code: 'invalid_view_id',
          message: 'A valid view identifier is required.',
        });
      }
      const result = await dependencies.repository.resolve(reference, viewId);
      if (!result) throw unavailable();
      return result;
    },
    async management(context: AccountContext) {
      return scheduledRepository().management(await currentIdentity(context));
    },
    async createVersion(context: AccountContext, profileId: string) {
      if (!profileId.trim()) throw invalidProfile();
      return scheduledRepository().createVersion(
        await currentIdentity(context),
        profileId,
        context.accountId,
      );
    },
    async updateVersion(context: AccountContext, homepageId: string, profileId: string) {
      if (!homepageId.trim() || !profileId.trim()) throw invalidProfile();
      return scheduledRepository().updateVersion(
        await currentIdentity(context),
        homepageId,
        profileId,
        context.accountId,
      );
    },
    async transitionVersion(context: AccountContext, homepageId: string, action: HomepageAction) {
      if (!homepageId.trim()) throw invalidHomepageId();
      return scheduledRepository().transitionVersion(
        await currentIdentity(context),
        homepageId,
        action,
        context.accountId,
      );
    },
    async archiveVersion(context: AccountContext, homepageId: string) {
      if (!homepageId.trim()) throw invalidHomepageId();
      const candidate = dependencies.repository as Partial<ScheduledHomepageRepository>;
      if (candidate.archiveVersion === undefined)
        throw new ApplicationError({
          category: 'internal',
          code: 'homepage_archive_unavailable',
          message: 'Homepage archiving is unavailable.',
        });
      return candidate.archiveVersion(
        await currentIdentity(context),
        homepageId,
        context.accountId,
      );
    },
    async setDefaultVersion(context: AccountContext, homepageId: string) {
      if (!homepageId.trim()) throw invalidHomepageId();
      return scheduledRepository().setDefaultVersion(
        await currentIdentity(context),
        homepageId,
        context.accountId,
      );
    },
    async previewVersion(context: AccountContext, homepageId: string, instant?: string) {
      if (!homepageId.trim()) throw invalidHomepageId();
      const result = await scheduledRepository().previewVersion(
        await currentIdentity(context),
        homepageId,
        validateInstant(instant),
      );
      if (!result) throw unavailable();
      return result;
    },
    async resolvePreview(context: AccountContext, instant: string) {
      const result = await scheduledRepository().resolvePreview(
        await currentIdentity(context),
        validateRequiredInstant(instant),
      );
      if (!result) throw unavailable();
      return result;
    },
    async listWindows(context: AccountContext, homepageId: string) {
      if (!homepageId.trim()) throw invalidHomepageId();
      return scheduledRepository().listWindows(await currentIdentity(context), homepageId);
    },
    async createWindow(
      context: AccountContext,
      homepageId: string,
      input: Pick<HomepageActivationWindow, 'startsAt' | 'endsAt' | 'timeZone'>,
    ) {
      const normalized = validateWindow(input);
      return scheduledRepository().createWindow(
        await currentIdentity(context),
        homepageId,
        normalized,
        context.accountId,
      );
    },
    async updateWindow(
      context: AccountContext,
      windowId: string,
      input: Pick<HomepageActivationWindow, 'startsAt' | 'endsAt' | 'timeZone' | 'state'>,
    ) {
      if (!windowId.trim()) throw invalidWindowId();
      const normalized = validateWindow(input);
      return scheduledRepository().updateWindow(
        await currentIdentity(context),
        windowId,
        { ...normalized, state: input.state },
        context.accountId,
      );
    },
    async disableWindow(context: AccountContext, windowId: string) {
      if (!windowId.trim()) throw invalidWindowId();
      await scheduledRepository().disableWindow(
        await currentIdentity(context),
        windowId,
        context.accountId,
      );
    },
  };
}

function invalidProfile(): ApplicationError {
  return new ApplicationError({
    category: 'validation',
    code: 'invalid_profile',
    message: 'A profile is required.',
  });
}

function invalidHomepageId(): ApplicationError {
  return new ApplicationError({
    category: 'validation',
    code: 'invalid_homepage_id',
    message: 'A homepage identifier is required.',
  });
}

function invalidWindowId(): ApplicationError {
  return new ApplicationError({
    category: 'validation',
    code: 'invalid_window_id',
    message: 'A window identifier is required.',
  });
}

function validateInstant(instant?: string): string | undefined {
  if (instant === undefined) return undefined;
  try {
    // Preview timestamps without an offset are wall-clock UTC by contract;
    // do not let the API process timezone change their meaning.
    return normalizeHomepageInstant(instant, 'UTC');
  } catch {
    throw new ApplicationError({
      category: 'validation',
      code: 'invalid_preview_instant',
      message: 'A valid preview instant is required.',
    });
  }
}

function validateRequiredInstant(instant: string): string {
  const validated = validateInstant(instant);
  if (validated === undefined) throw invalidPreviewInstant();
  return validated;
}

function invalidPreviewInstant(): ApplicationError {
  return new ApplicationError({
    category: 'validation',
    code: 'invalid_preview_instant',
    message: 'A valid preview instant is required.',
  });
}

function validateWindow(input: {
  startsAt: string;
  endsAt: string;
  timeZone: string;
  state?: 'ENABLED' | 'DISABLED';
}): { startsAt: string; endsAt: string; timeZone: string; state?: 'ENABLED' | 'DISABLED' } {
  try {
    const timeZone = input.timeZone.trim();
    const startsAt = normalizeHomepageInstant(input.startsAt, timeZone);
    const endsAt = normalizeHomepageInstant(input.endsAt, timeZone);
    if (Date.parse(startsAt) >= Date.parse(endsAt)) throw new RangeError('The window is invalid.');
    if (input.state !== undefined && input.state !== 'ENABLED' && input.state !== 'DISABLED')
      throw new RangeError('The window state is invalid.');
    return { ...input, startsAt, endsAt, timeZone };
  } catch {
    throw new ApplicationError({
      category: 'validation',
      code: 'invalid_time_window',
      message: 'A valid time window and time zone are required.',
    });
  }
}

function unavailable(): ApplicationError {
  return new ApplicationError({
    category: 'not_found',
    code: 'homepage_unavailable',
    message: 'Homepage is unavailable.',
  });
}

export type PublicHomepageService = ReturnType<typeof createPublicHomepageService>;
