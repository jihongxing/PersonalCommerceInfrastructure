import { describe, expect, it, vi } from 'vitest';
import {
  createPublicHomepageService,
  type PublicHomepageRepository,
} from '../../applications/public-commerce-homepage/public-commerce-homepage-service.js';

const context = { accountId: 'local:a', correlationId: 'request' };
const homepage = { commerceReference: '3C7M4Q9RDFHJKNTWVY', displayName: 'Name', offerings: [] };
const emptyConfiguration = {
  state: 'UNPUBLISHED' as const,
  commerceProfileId: null,
  commerceProfile: null,
};
function setup(status: 'ACTIVE' | 'SUSPENDED' = 'ACTIVE') {
  const repository = {
    configuration: vi.fn().mockResolvedValue(emptyConfiguration),
    selectProfile: vi.fn().mockResolvedValue({
      state: 'UNPUBLISHED',
      commerceProfileId: 'p',
      commerceProfile: { id: 'p', displayName: 'Profile', lifecycle: 'ACTIVE' },
    }),
    transition: vi.fn().mockResolvedValue({
      state: 'PUBLISHED',
      commerceProfileId: 'p',
      commerceProfile: { id: 'p', displayName: 'Profile', lifecycle: 'ACTIVE' },
    }),
    preview: vi.fn().mockResolvedValue(homepage),
    resolve: vi.fn().mockResolvedValue(homepage),
  } satisfies PublicHomepageRepository;
  const service = createPublicHomepageService({
    repository,
    currentUserIdentityService: {
      getCurrentIdentity: vi
        .fn()
        .mockResolvedValue({ identityId: 'identity-a', status, createdAt: '' }),
    },
  });
  return { repository, service };
}

describe('public homepage service', () => {
  it('derives the owner from the authenticated account and rejects inactive identities', async () => {
    const { service, repository } = setup();
    await service.selectProfile(context, 'p');
    expect(repository.selectProfile).toHaveBeenCalledWith('identity-a', 'p', 'local:a');
    await expect(setup('SUSPENDED').service.configuration(context)).rejects.toMatchObject({
      code: 'identity_inactive',
    });
  });
  it('normalizes input, validates the view and preserves storage failures', async () => {
    const { service, repository } = setup();
    const view = '639f7d17-9391-4095-ab84-128daf2e0300';
    await service.resolve('3c7m4q-9rdfhj-kntwvy', view);
    expect(repository.resolve).toHaveBeenCalledWith(homepage.commerceReference, view);
    await expect(service.resolve('bad', view)).rejects.toMatchObject({
      code: 'invalid_commerce_reference',
    });
    await expect(service.resolve(homepage.commerceReference, 'bad')).rejects.toMatchObject({
      code: 'invalid_view_id',
    });
    vi.mocked(repository.resolve).mockRejectedValueOnce(new Error('database down'));
    await expect(service.resolve(homepage.commerceReference, view)).rejects.toThrow(
      'database down',
    );
    vi.mocked(repository.resolve).mockResolvedValueOnce(undefined);
    await expect(service.resolve(homepage.commerceReference, view)).rejects.toMatchObject({
      code: 'homepage_unavailable',
    });
  });
  it('keeps preview separate from public view tracking', async () => {
    const { service, repository } = setup();
    expect(await service.preview(context)).toEqual(homepage);
    expect(repository.preview).toHaveBeenCalledWith('identity-a');
    expect(repository.resolve).not.toHaveBeenCalled();
  });

  it('validates scheduled preview instants before calling the repository', async () => {
    const scheduled = {
      ...setup().repository,
      management: vi.fn(),
      createVersion: vi.fn(),
      updateVersion: vi.fn(),
      transitionVersion: vi.fn(),
      setDefaultVersion: vi.fn(),
      previewVersion: vi.fn(),
      resolvePreview: vi.fn().mockResolvedValue(homepage),
      listWindows: vi.fn(),
      createWindow: vi.fn(),
      updateWindow: vi.fn(),
      disableWindow: vi.fn(),
    };
    const service = createPublicHomepageService({
      repository: scheduled,
      currentUserIdentityService: {
        getCurrentIdentity: vi
          .fn()
          .mockResolvedValue({ identityId: 'identity-a', status: 'ACTIVE', createdAt: '' }),
      },
    });
    await expect(service.resolvePreview(context, 'bad')).rejects.toMatchObject({
      code: 'invalid_preview_instant',
    });
    expect(scheduled.resolvePreview).not.toHaveBeenCalled();
    await service.resolvePreview(context, '2026-11-08T12:00');
    expect(scheduled.resolvePreview).toHaveBeenCalledWith('identity-a', '2026-11-08T12:00:00.000Z');
  });

  it('rejects invalid time windows before persistence', async () => {
    const scheduled = {
      ...setup().repository,
      management: vi.fn(),
      createVersion: vi.fn(),
      updateVersion: vi.fn(),
      transitionVersion: vi.fn(),
      setDefaultVersion: vi.fn(),
      previewVersion: vi.fn(),
      resolvePreview: vi.fn(),
      listWindows: vi.fn(),
      createWindow: vi.fn(),
      updateWindow: vi.fn(),
      disableWindow: vi.fn(),
    };
    const service = createPublicHomepageService({
      repository: scheduled,
      currentUserIdentityService: {
        getCurrentIdentity: vi
          .fn()
          .mockResolvedValue({ identityId: 'identity-a', status: 'ACTIVE', createdAt: '' }),
      },
    });
    await expect(
      service.createWindow(context, 'homepage-a', {
        startsAt: '2026-11-08T12:00:00.000Z',
        endsAt: '2026-11-08T11:00:00.000Z',
        timeZone: 'UTC',
      }),
    ).rejects.toMatchObject({ code: 'invalid_time_window' });
    expect(scheduled.createWindow).not.toHaveBeenCalled();
  });
});
