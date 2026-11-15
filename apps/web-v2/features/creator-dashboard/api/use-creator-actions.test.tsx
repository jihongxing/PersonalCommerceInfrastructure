import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { useConfirmRequest } from './use-creator-actions';

const post = vi.hoisted(() => vi.fn());
vi.mock('@/lib/api/client', () => ({ apiClient: { POST: post } }));

describe('creator request decisions', () => {
  it('submits a confirm decision through the BFF without a bearer header', async () => {
    post.mockResolvedValueOnce({
      data: { actionId: 'action-1', state: 'confirmed', resultAccessToken: 'result' },
    });
    const client = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useConfirmRequest(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync('action-1');
    });
    expect(post).toHaveBeenCalledWith('/api/v1/creator/requests/{actionId}/confirm', {
      params: { path: { actionId: 'action-1' } },
    });
  });
});
