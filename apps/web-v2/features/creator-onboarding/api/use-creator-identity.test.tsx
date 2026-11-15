import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { useCreateIdentity, useCreatorIdentity, useUpdateIdentity } from './use-creator-identity';

const api = vi.hoisted(() => ({ GET: vi.fn(), POST: vi.fn(), PATCH: vi.fn() }));
vi.mock('@/lib/api/client', () => ({
  apiClient: api,
  ApiError: class ApiError extends Error {},
}));

const identityResponse = {
  creatorId: 'creator-1',
  profile: {
    displayName: '创作者',
    bio: '简介',
    socialLinks: ['https://example.test/profile'],
  },
  capabilityIds: [],
  capabilities: [],
  state: 'draft' as const,
};

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      {children}
    </QueryClientProvider>
  );
}

beforeEach(() => {
  api.GET.mockReset();
  api.POST.mockReset();
  api.PATCH.mockReset();
});

it('keeps API social links as URL strings when reading identity', async () => {
  api.GET.mockResolvedValue({ data: identityResponse, error: null, status: 200 });

  const { result } = renderHook(() => useCreatorIdentity(), { wrapper });

  await waitFor(() =>
    expect(result.current.data?.profile.socialLinks).toEqual(identityResponse.profile.socialLinks),
  );
});

it('round-trips URL strings for identity create and update requests', async () => {
  api.POST.mockResolvedValue({ data: identityResponse, error: null });
  api.PATCH.mockResolvedValue({ data: identityResponse, error: null });
  const request = {
    displayName: '创作者',
    bio: '简介',
    socialLinks: ['https://example.test/profile'],
  };

  const create = renderHook(() => useCreateIdentity(), { wrapper });
  await act(async () => {
    await create.result.current.mutateAsync(request);
  });
  const update = renderHook(() => useUpdateIdentity(), { wrapper });
  await act(async () => {
    await update.result.current.mutateAsync(request);
  });

  expect(api.POST).toHaveBeenCalledWith('/api/v1/creator/identity', {
    body: { profile: { ...request, avatarUrl: undefined, location: undefined } },
  });
  expect(api.PATCH).toHaveBeenCalledWith('/api/v1/creator/identity', {
    body: { profile: { ...request, avatarUrl: undefined, location: undefined } },
  });
  expect(create.result.current.data?.profile.socialLinks).toEqual(request.socialLinks);
  expect(update.result.current.data?.profile.socialLinks).toEqual(request.socialLinks);
});
