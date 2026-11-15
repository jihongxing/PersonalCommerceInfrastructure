import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';
import { usePublishService } from './use-creator-services';

const api = vi.hoisted(() => ({ POST: vi.fn() }));
vi.mock('@/lib/api/client', () => ({ apiClient: api }));

beforeEach(() => api.POST.mockReset());

it('preserves the publish response envelope and updates related query cache entries', async () => {
  const response = {
    offering: { id: 'offering-1', creatorId: 'creator-1', state: 'published' as const },
    distributionAsset: {
      offeringId: 'offering-1',
      publicUrl: 'https://example.test/o/offering-1',
      state: 'generated' as const,
    },
  };
  api.POST.mockResolvedValue({ data: response, error: null });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(['creator-service', 'offering-1'], {
    id: 'offering-1',
    state: 'draft',
    title: '服务',
    missingPublishConditions: [],
  });

  const { result } = renderHook(() => usePublishService('offering-1'), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });

  let published: unknown;
  await act(async () => {
    published = await result.current.mutateAsync();
  });

  expect(published).toEqual(response);
  expect(published).toHaveProperty('offering');
  expect(published).toHaveProperty('distributionAsset');
  expect(client.getQueryData<{ state: string }>(['creator-service', 'offering-1'])).toMatchObject({
    state: 'published',
  });
  expect(client.getQueryData(['distribution-asset', 'offering-1'])).toEqual(
    response.distributionAsset,
  );
  expect(api.POST).toHaveBeenCalledWith('/api/v1/creator/offerings/{offeringId}/publish', {
    params: { path: { offeringId: 'offering-1' } },
  });
});
