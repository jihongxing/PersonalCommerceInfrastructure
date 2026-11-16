import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useConfirmFulfillment, useConfirmRequest, useDeclineRequest } from './use-creator-actions';
import { useCreatorRequests, useCreatorConfirmedRequests } from './use-creator-requests';

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('@/lib/api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api/client')>()),
  apiClient: { GET: api.get, POST: api.post },
}));

const clients: QueryClient[] = [];
beforeEach(() => vi.resetAllMocks());
afterEach(() => clients.splice(0).forEach((client) => client.clear()));

function setup(kind: 'confirm' | 'decline') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  client.setQueryData(['creator-requests'], [{ action: { id: 'action-1', state: 'submitted' } }]);
  client.setQueryData(['creator-confirmed-requests'], []);
  const invalidations = vi.spyOn(client, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const hook = renderHook(
    () => {
      const confirm = useConfirmRequest();
      const decline = useDeclineRequest();
      const pending = useCreatorRequests();
      const confirmed = useCreatorConfirmedRequests();
      return { mutation: kind === 'confirm' ? confirm : decline, pending, confirmed };
    },
    { wrapper },
  );
  return { ...hook, client, invalidations };
}

describe('Creator decision cache reconciliation', () => {
  it('retains fulfillment confirmation through the same-origin BFF', async () => {
    api.post.mockResolvedValueOnce({
      data: { actionId: 'action-1', status: 'fulfilled', confirmedAt: '2026-11-16T00:00:00.000Z' },
    });
    const client = new QueryClient();
    clients.push(client);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useConfirmFulfillment(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ actionId: 'action-1', fulfillmentCode: 'FC-ABCD1234' });
    });
    expect(api.post).toHaveBeenCalledWith(
      '/api/v1/creator/requests/{actionId}/confirm-fulfillment',
      {
        params: { path: { actionId: 'action-1' } },
        body: { fulfillmentCode: 'FC-ABCD1234' },
      },
    );
  });

  it.each(['confirm', 'decline'] as const)(
    'reconciles both lists after successful %s and awaits refetch',
    async (kind) => {
      const terminal = kind === 'confirm' ? 'confirmed' : 'declined';
      api.post.mockResolvedValue({
        data: { actionId: 'action-1', state: terminal, resultAccessToken: 'test-result' },
        error: null,
        status: 200,
      });
      let release!: () => void;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      api.get.mockImplementation(async (path: string) => {
        await gate;
        return {
          data: {
            requests:
              path.endsWith('/confirmed-requests') && kind === 'confirm'
                ? [{ action: { id: 'action-1', state: terminal } }]
                : [],
          },
          error: null,
          status: 200,
        };
      });
      const { result, invalidations } = setup(kind);
      let operation!: Promise<unknown>;
      act(() => {
        operation = result.current.mutation.mutateAsync('action-1');
      });
      await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
      expect(result.current.mutation.isPending).toBe(true);
      await act(async () => {
        release();
        await operation;
      });
      await waitFor(() => expect(result.current.pending.data).toEqual([]));
      expect(result.current.confirmed.data?.length).toBe(kind === 'confirm' ? 1 : 0);
      expect(api.post).toHaveBeenCalledWith(`/api/v1/creator/requests/{actionId}/${kind}`, {
        params: { path: { actionId: 'action-1' } },
      });
      expect(invalidations).toHaveBeenCalledWith({ queryKey: ['creator-requests'] });
      expect(invalidations).toHaveBeenCalledWith({ queryKey: ['creator-confirmed-requests'] });
    },
  );

  it.each([409, 503])(
    'preserves error status %s and reconciles authoritative data rather than claiming success',
    async (status) => {
      api.post.mockResolvedValue({
        data: null,
        error: { error: { code: 'decision_failed', message: '请求状态已变更' } },
        status,
      });
      api.get.mockImplementation(async (path: string) => ({
        data: {
          requests: path.endsWith('/confirmed-requests')
            ? [{ action: { id: 'action-1', state: 'confirmed' } }]
            : [],
        },
        error: null,
        status: 200,
      }));
      const { result } = setup('decline');
      await act(async () => {
        await expect(result.current.mutation.mutateAsync('action-1')).rejects.toMatchObject({
          status,
          code: 'decision_failed',
        });
      });
      await waitFor(() => expect(result.current.pending.data).toEqual([]));
      expect(result.current.confirmed.data?.[0].action.state).toBe('confirmed');
      expect(result.current.mutation.isSuccess).toBe(false);
      expect(api.get).toHaveBeenCalledTimes(2);
    },
  );
});
