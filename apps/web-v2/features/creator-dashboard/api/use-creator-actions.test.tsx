import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { useConfirmFulfillment } from './use-creator-actions';

const post = vi.hoisted(() => vi.fn());
vi.mock('@/lib/api/client', () => ({ apiClient: { POST: post } }));

describe('fulfillment confirmation', () => {
  it('submits the supplied code to the authenticated API', async () => {
    post.mockResolvedValueOnce({
      data: { actionId: 'action-1', status: 'fulfilled', confirmedAt: '2026-11-09T00:00:00Z' },
    });
    const client = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useConfirmFulfillment('access-token'), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ actionId: 'action-1', fulfillmentCode: 'FC-A1B2C3D4' });
    });
    expect(post).toHaveBeenCalledWith('/api/v1/creator/requests/{actionId}/confirm-fulfillment', {
      params: { path: { actionId: 'action-1' } },
      body: { fulfillmentCode: 'FC-A1B2C3D4' },
      headers: { Authorization: 'Bearer access-token' },
    });
  });
});
