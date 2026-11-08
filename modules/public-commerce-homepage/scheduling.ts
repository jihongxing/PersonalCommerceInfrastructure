import type { HomepageState } from './homepage.js';

export type HomepageVersionState = HomepageState | 'ARCHIVED';
export type HomepageWindowState = 'ENABLED' | 'DISABLED';

export interface HomepageVersionRef {
  readonly homepageId: string;
  readonly identityId: string;
  readonly commerceProfileId: string | null;
  readonly commerceProfileLifecycle?: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  readonly state: HomepageVersionState;
  readonly isDefault: boolean;
}

export interface HomepageActivationWindowRef {
  readonly windowId: string;
  readonly identityId: string;
  readonly homepageId: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly timeZone: string;
  readonly state: HomepageWindowState;
}

export function selectActiveHomepage(
  versions: readonly HomepageVersionRef[],
  windows: readonly HomepageActivationWindowRef[],
  instant: string,
): HomepageVersionRef | undefined {
  const timestamp = Date.parse(instant);
  if (!Number.isFinite(timestamp)) throw new RangeError('A valid instant is required.');
  const published = new Map(
    versions
      .filter(
        (version) =>
          version.state === 'PUBLISHED' &&
          version.commerceProfileId !== null &&
          (version.commerceProfileLifecycle === undefined ||
            version.commerceProfileLifecycle === 'ACTIVE'),
      )
      .map((version) => [version.homepageId, version]),
  );
  const matching = windows
    .filter((window) => window.state === 'ENABLED')
    .filter((window) => {
      const startsAt = Date.parse(window.startsAt);
      const endsAt = Date.parse(window.endsAt);
      return startsAt <= timestamp && timestamp < endsAt;
    })
    .map((window) => published.get(window.homepageId))
    .filter((version): version is HomepageVersionRef => version !== undefined);
  if (matching.length > 1) throw new Error('Multiple active homepage windows matched.');
  return (
    matching[0] ??
    versions.find((version) => version.isDefault && published.has(version.homepageId))
  );
}

const localDateTimePattern =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?$/u;
const explicitInstantPattern = /(?:Z|[+-]\d{2}:?\d{2})$/u;

/** Converts an ISO instant or an unzoned wall-clock value into an unambiguous UTC instant. */
export function normalizeHomepageInstant(value: string, timeZone: string): string {
  const zone = timeZone.trim();
  if (!zone) throw new RangeError('A time zone is required.');
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone }).format();
  } catch {
    throw new RangeError('The time zone is invalid.');
  }

  const trimmed = value.trim();
  if (explicitInstantPattern.test(trimmed)) {
    const timestamp = Date.parse(trimmed);
    if (!Number.isFinite(timestamp)) throw new RangeError('The instant is invalid.');
    return new Date(timestamp).toISOString();
  }

  const match = localDateTimePattern.exec(trimmed);
  if (!match) throw new RangeError('A time zone offset is required for an instant.');
  const [, year, month, day, hour, minute, second = '0', fraction = ''] = match;
  const localTimestamp = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );
  const calendar = new Date(localTimestamp);
  if (
    !Number.isFinite(localTimestamp) ||
    calendar.getUTCFullYear() !== Number(year) ||
    calendar.getUTCMonth() !== Number(month) - 1 ||
    calendar.getUTCDate() !== Number(day) ||
    calendar.getUTCHours() !== Number(hour) ||
    calendar.getUTCMinutes() !== Number(minute) ||
    calendar.getUTCSeconds() !== Number(second)
  )
    throw new RangeError('The local date and time is invalid.');

  const offsets = new Set<number>();
  for (let hours = -72; hours <= 72; hours += 6)
    offsets.add(timeZoneOffset(localTimestamp + hours * 60 * 60 * 1000, zone));
  const candidates = [...offsets]
    .map((offset) => localTimestamp - offset)
    .filter((candidate) => formatLocal(candidate, zone) === trimmed.slice(0, 16));
  if (candidates.length !== 1)
    throw new RangeError(
      candidates.length === 0
        ? 'The local date and time does not exist in this time zone.'
        : 'The local date and time is ambiguous in this time zone.',
    );
  const milliseconds = fraction ? Number(`0.${fraction}`) * 1000 : 0;
  const candidate = candidates[0];
  if (candidate === undefined) throw new RangeError('The local date and time is invalid.');
  return new Date(candidate + milliseconds).toISOString();
}

function formatLocal(timestamp: number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date(timestamp));
  const values = Object.fromEntries(
    parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

function timeZoneOffset(timestamp: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(timestamp));
  const values = Object.fromEntries(
    parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]),
  );
  return (
    Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
      Number(values.second),
    ) - timestamp
  );
}
