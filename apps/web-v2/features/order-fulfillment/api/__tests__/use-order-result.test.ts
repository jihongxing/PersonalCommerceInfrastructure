import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOrderResult } from '@/features/order-fulfillment/api/use-order-result';
import type { ReactNode } from 'react';

// Mock API client
vi.mock('@/lib/api/client', () => ({
  apiClient: {
    GET: vi.fn(),
  },
}));

import { apiClient } from '@/lib/api/client';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
};

describe('useOrderResult hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not fetch without token', () => {
    renderHook(() => useOrderResult(''), {
      wrapper: createWrapper(),
    });

    expect(apiClient.GET).not.toHaveBeenCalled();
  });

  it('should fetch order result with valid token', async () => {
    const mockData = {
      actionId: 'test-action-123',
      state: 'submitted',
      resultAccessToken: 'test-token',
    };

    vi.mocked(apiClient.GET).mockResolvedValueOnce({
      data: mockData,
      error: null,
      response: new Response(),
    });

    const { result } = renderHook(
      () => useOrderResult('test-token'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
  });

  it('should handle error state', async () => {
    const mockError = {
      error: {
        message: 'Order not found',
      },
    };

    vi.mocked(apiClient.GET).mockResolvedValueOnce({
      data: undefined,
      error: mockError.error,
      response: new Response(),
    });

    const { result } = renderHook(
      () => useOrderResult('invalid-token'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('should set up polling for submitted state', async () => {
    const mockData = {
      actionId: 'test-action-123',
      state: 'submitted',
      resultAccessToken: 'test-token',
    };

    vi.mocked(apiClient.GET).mockResolvedValueOnce({
      data: mockData,
      error: null,
      response: new Response(),
    });

    renderHook(() => useOrderResult('test-token'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(apiClient.GET).toHaveBeenCalled();
    });

    // Note: Full polling behavior would be tested in E2E tests
  });
});
