import { describe, expect, it } from 'vitest';
import { normalizeHomepageInstant, selectActiveHomepage } from './scheduling.js';

const version = (id: string, state: 'UNPUBLISHED' | 'PUBLISHED' | 'PAUSED', isDefault = false) => ({
  homepageId: id,
  identityId: 'identity-a',
  commerceProfileId: `profile-${id}`,
  state,
  isDefault,
});

describe('public homepage scheduling', () => {
  it('selects the published homepage whose window contains the instant', () => {
    const instant = '2026-11-08T10:00:00.000Z';
    expect(
      selectActiveHomepage(
        [version('default', 'PUBLISHED', true), version('sale', 'PUBLISHED')],
        [
          {
            windowId: 'window-sale',
            identityId: 'identity-a',
            homepageId: 'sale',
            startsAt: '2026-11-08T09:00:00.000Z',
            endsAt: '2026-11-08T11:00:00.000Z',
            timeZone: 'UTC',
            state: 'ENABLED',
          },
        ],
        instant,
      )?.homepageId,
    ).toBe('sale');
  });

  it('uses the default at the end boundary and ignores paused targets', () => {
    const versions = [version('default', 'PUBLISHED', true), version('paused', 'PAUSED')];
    const windows = [
      {
        windowId: 'window-paused',
        identityId: 'identity-a',
        homepageId: 'paused',
        startsAt: '2026-11-08T09:00:00.000Z',
        endsAt: '2026-11-08T10:00:00.000Z',
        timeZone: 'UTC',
        state: 'ENABLED' as const,
      },
    ];
    expect(selectActiveHomepage(versions, windows, '2026-11-08T10:00:00.000Z')?.homepageId).toBe(
      'default',
    );
  });

  it('returns no homepage when there is neither a matching window nor a published default', () => {
    expect(
      selectActiveHomepage([version('draft', 'UNPUBLISHED')], [], '2026-11-08T10:00:00.000Z'),
    ).toBeUndefined();
  });

  it('rejects nonexistent and ambiguous local times while normalizing a valid wall clock value', () => {
    expect(normalizeHomepageInstant('2026-11-08T10:00', 'America/New_York')).toBe(
      '2026-11-08T15:00:00.000Z',
    );
    expect(() => normalizeHomepageInstant('2026-03-08T02:30', 'America/New_York')).toThrow(
      'does not exist',
    );
    expect(() => normalizeHomepageInstant('2026-11-01T01:30', 'America/New_York')).toThrow(
      'ambiguous',
    );
  });

  it('falls back when a matching version has an unavailable profile', () => {
    expect(
      selectActiveHomepage(
        [
          { ...version('default', 'PUBLISHED', true), commerceProfileLifecycle: 'ACTIVE' },
          { ...version('archived', 'PUBLISHED'), commerceProfileLifecycle: 'ARCHIVED' },
        ],
        [
          {
            windowId: 'window-archived',
            identityId: 'identity-a',
            homepageId: 'archived',
            startsAt: '2026-11-08T09:00:00.000Z',
            endsAt: '2026-11-08T11:00:00.000Z',
            timeZone: 'UTC',
            state: 'ENABLED',
          },
        ],
        '2026-11-08T10:00:00.000Z',
      )?.homepageId,
    ).toBe('default');
  });
});
