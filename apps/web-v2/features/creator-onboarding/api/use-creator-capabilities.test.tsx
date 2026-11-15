import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { useCreateCapability, useCreatorCapabilities } from './use-creator-capabilities';

const api = vi.hoisted(() => ({ GET: vi.fn(), POST: vi.fn() }));
vi.mock('@/lib/api/client', () => ({ apiClient: api }));

const identityResponse = {
  creatorId: 'creator-1',
  profile: { displayName: '创作者', bio: '简介', socialLinks: [] },
  capabilityIds: ['capability-1'],
  capabilities: [
    { id: 'capability-1', name: '英语辅导', description: '口语辅导', catalogItemId: 'catalog-1' },
  ],
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
});

it('extracts capabilities from the complete identity response', async () => {
  api.GET.mockResolvedValue({ data: identityResponse, error: null });

  const { result } = renderHook(() => useCreatorCapabilities(), { wrapper });

  await waitFor(() => expect(result.current.data).toEqual(identityResponse.capabilities));
  expect(api.GET).toHaveBeenCalledWith('/api/v1/creator/identity', { params: { header: {} } });
});

it('returns the complete identity response from capability creation', async () => {
  api.POST.mockResolvedValue({ data: identityResponse, error: null });

  const { result } = renderHook(() => useCreateCapability(), { wrapper });
  const request = { name: '英语辅导', description: '口语辅导', catalogItemId: 'catalog-1' };

  let created: unknown;
  await act(async () => {
    created = await result.current.mutateAsync(request);
  });

  expect(created).toEqual(identityResponse);
  expect(created).not.toHaveProperty('id');
  expect(api.POST).toHaveBeenCalledWith('/api/v1/creator/identity/capabilities', {
    body: request,
  });
});
