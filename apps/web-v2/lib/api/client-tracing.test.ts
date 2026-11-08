import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  spans: [] as Array<{ id: string; links: string[]; ended: number[]; failed: boolean[] }>,
  waits: [] as Array<{ links: string[]; ended: string[] }>,
  session: {
    accessToken: 'access-token',
    refreshToken: 'refresh-token' as string | undefined,
    userEmail: 'test@example.test',
    expiresAt: 1,
  },
}));
vi.mock('@/lib/auth/session', () => ({
  getBearerToken: () => 'access-token',
  getSession: () => state.session,
  setSession: vi.fn(),
  clearSession: vi.fn(),
}));
vi.mock('./tracing', () => ({
  startRequestSpan: (_method: string, _path: string, links: Array<{ spanId: string }> = []) => {
    const record = {
      id: String(state.spans.length + 1),
      links: links.map((link) => link.spanId),
      ended: [] as number[],
      failed: [] as boolean[],
    };
    state.spans.push(record);
    return {
      spanContext: () => ({ spanId: record.id }),
      addLink: ({ context }: { context: { spanId: string } }) => record.links.push(context.spanId),
      record,
    };
  },
  injectRequestTrace: vi.fn(),
  finishRequestSpan: (
    span: { record: { ended: number[]; failed: boolean[] } } | undefined,
    status: number,
    failed = false,
  ) => {
    span?.record.ended.push(status);
    span?.record.failed.push(failed);
  },
  startRefreshWaitSpan: (links: Array<{ spanId: string }>) => {
    const record = { links: links.map((link) => link.spanId), ended: [] as string[] };
    state.waits.push(record);
    return { record };
  },
  finishRefreshWaitSpan: (span: { record: { ended: string[] } } | undefined, outcome: string) =>
    span?.record.ended.push(outcome),
}));

import { clearSession, setSession } from '@/lib/auth/session';
import { apiClient, refreshSession } from './client';

describe('API refresh tracing', () => {
  beforeEach(() => {
    state.spans.length = 0;
    state.waits.length = 0;
    state.session.refreshToken = 'refresh-token';
    vi.clearAllMocks();
  });

  it('does not create an HTTP span when there is no refresh token', async () => {
    state.session.refreshToken = undefined;
    const fetchMock = vi.fn().mockResolvedValue({ status: 401, ok: false });
    vi.stubGlobal('fetch', fetchMock);
    try {
      await expect(refreshSession()).resolves.toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
      expect(state.spans).toHaveLength(0);

      state.session.refreshToken = 'refresh-token';
      await expect(refreshSession()).resolves.toBe(false);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(state.spans.map((span) => span.ended)).toEqual([[401]]);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('ends the shared refresh span and clears the session when refresh is rejected', async () => {
    let finishRefresh!: (value: Response) => void;
    const refresh = new Promise<Response>((resolve) => {
      finishRefresh = resolve;
    });
    const response = (status: number, data: object) =>
      ({ status, ok: status < 400, json: async () => data }) as Response;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(401, { error: { code: 'expired' } }))
      .mockResolvedValueOnce(response(401, { error: { code: 'expired' } }))
      .mockReturnValueOnce(refresh);
    vi.stubGlobal('fetch', fetchMock);
    try {
      const requests = [
        apiClient.GET('/api/v1/creator/identity'),
        apiClient.GET('/api/v1/creator/requests'),
      ];
      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
      finishRefresh(response(401, {}));
      expect((await Promise.all(requests)).map((result) => result.status)).toEqual([401, 401]);
      expect(clearSession).toHaveBeenCalled();
      expect(state.spans).toHaveLength(3);
      expect(state.spans[2].links).toEqual(['1', '2']);
      expect(state.spans.map((span) => span.ended)).toEqual([[401], [401], [401]]);
      expect(state.waits.map((wait) => wait.ended)).toEqual([['rejected'], ['rejected']]);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('ends a failed refresh span and permits a later refresh attempt', async () => {
    const response = { status: 401, ok: false } as Response;
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('network failure'))
      .mockResolvedValueOnce(response);
    vi.stubGlobal('fetch', fetchMock);
    try {
      await expect(refreshSession()).rejects.toThrow('network failure');
      await expect(refreshSession()).resolves.toBe(false);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(state.spans.map((span) => span.ended)).toEqual([[0], [401]]);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('retains a received HTTP failure status on the refresh span', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 503, ok: false }));
    try {
      await expect(refreshSession()).rejects.toThrow('无法刷新登录状态，请稍后重试');
      expect(state.spans[0].ended).toEqual([503]);
      expect(state.spans[0].failed).toEqual([true]);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('ends the wait span when the shared refresh fails in transport', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        status: 401,
        ok: false,
        json: async () => ({ error: { code: 'expired' } }),
      })
      .mockRejectedValueOnce(new Error('network failure'));
    vi.stubGlobal('fetch', fetchMock);
    const logging = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect((await apiClient.GET('/api/v1/creator/identity')).status).toBe(0);
      expect(state.waits).toEqual([{ links: ['1', '2'], ended: ['error'] }]);
      expect(state.spans.map((span) => span.ended)).toEqual([[401], [0]]);
    } finally {
      logging.mockRestore();
      vi.unstubAllGlobals();
    }
  });

  it('links concurrent waiters to one refresh and gives retries separate ended spans', async () => {
    let finishRefresh!: (value: Response) => void;
    const refresh = new Promise<Response>((resolve) => {
      finishRefresh = resolve;
    });
    const response = (status: number, data: object) =>
      ({ status, ok: status < 400, json: async () => data }) as Response;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(401, { error: { code: 'expired' } }))
      .mockResolvedValueOnce(response(401, { error: { code: 'expired' } }))
      .mockReturnValueOnce(refresh)
      .mockResolvedValue(response(200, { ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    try {
      const first = apiClient.GET('/api/v1/creator/identity');
      const second = apiClient.GET('/api/v1/creator/requests');
      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
      finishRefresh(
        response(200, { accessToken: 'new', refreshToken: 'new-refresh', expiresIn: 60 }),
      );
      const result = await Promise.all([first, second]);
      expect(result.map((item) => item.status)).toEqual([200, 200]);
      expect(fetchMock).toHaveBeenCalledTimes(5);
      expect(state.spans).toHaveLength(5);
      expect(state.spans[2].links).toEqual(['1', '2']);
      expect(state.spans[3].links).toEqual(['1', '3']);
      expect(state.spans[4].links).toEqual(['2', '3']);
      expect(state.spans.map((span) => span.ended)).toEqual([[401], [401], [200], [200], [200]]);
      expect(state.waits.map((wait) => wait.links)).toEqual([
        ['1', '3'],
        ['2', '3'],
      ]);
      expect(state.waits.map((wait) => wait.ended)).toEqual([['success'], ['success']]);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('cancels one waiter without cancelling the shared refresh or another waiter', async () => {
    let finishRefresh!: (value: Response) => void;
    const refresh = new Promise<Response>((resolve) => {
      finishRefresh = resolve;
    });
    const response = (status: number, data: object) =>
      ({ status, ok: status < 400, json: async () => data }) as Response;
    const fetchMock = vi.fn((url: string) =>
      url.endsWith('/api/v1/auth/refresh')
        ? refresh
        : Promise.resolve(
            response(
              fetchMock.mock.calls.filter(([target]) => target === url).length === 1 ? 401 : 200,
              { error: { code: 'expired' } },
            ),
          ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const logging = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const controller = new AbortController();
      const cancelled = apiClient.GET('/api/v1/creator/identity', { signal: controller.signal });
      const remaining = apiClient.GET('/api/v1/creator/requests');
      await vi.waitFor(() => expect(state.waits).toHaveLength(2));
      controller.abort();
      expect((await cancelled).status).toBe(0);
      expect(state.waits[0].ended).toEqual(['error']);
      expect(state.waits[1].ended).toEqual([]);
      finishRefresh(
        response(200, { accessToken: 'new', refreshToken: 'new-refresh', expiresIn: 60 }),
      );
      expect((await remaining).status).toBe(200);
      expect(state.waits.map((wait) => wait.ended)).toEqual([['error'], ['success']]);
      expect(state.spans.map((span) => span.ended)).toEqual([[401], [401], [200], [200]]);
      expect(clearSession).not.toHaveBeenCalled();
    } finally {
      logging.mockRestore();
      vi.unstubAllGlobals();
    }
  });

  it('times out a stalled refresh, ends its spans and permits another attempt', async () => {
    vi.useFakeTimers();
    let finishRefresh!: (value: Response) => void;
    const stalled = new Promise<Response>((resolve) => {
      finishRefresh = resolve;
    });
    const response = (status: number, data: object) =>
      ({ status, ok: status < 400, json: async () => data }) as Response;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(401, { error: { code: 'expired' } }))
      .mockReturnValueOnce(stalled)
      .mockResolvedValueOnce(response(401, {}));
    vi.stubGlobal('fetch', fetchMock);
    const logging = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const request = apiClient.GET('/api/v1/creator/identity');
      await vi.waitFor(() => expect(state.waits).toHaveLength(1));
      await vi.advanceTimersByTimeAsync(15_000);
      expect((await request).status).toBe(0);
      expect(state.spans.map((span) => span.ended)).toEqual([[401], [0]]);
      expect(state.waits[0].ended).toEqual(['error']);
      expect(clearSession).not.toHaveBeenCalled();
      await expect(refreshSession()).resolves.toBe(false);
      finishRefresh(response(200, { accessToken: 'late', refreshToken: 'late', expiresIn: 60 }));
      await Promise.resolve();
      await Promise.resolve();
      expect(state.spans.map((span) => span.ended)).toEqual([[401], [0], [401]]);
      expect(setSession).not.toHaveBeenCalled();
    } finally {
      logging.mockRestore();
      vi.useRealTimers();
      vi.unstubAllGlobals();
    }
  });

  it('bounds response body parsing and ignores a body that arrives after timeout', async () => {
    vi.useFakeTimers();
    let finishBody!: (value: object) => void;
    const body = new Promise<object>((resolve) => {
      finishBody = resolve;
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200, ok: true, json: () => body }));
    try {
      const refresh = refreshSession();
      const rejection = expect(refresh).rejects.toThrow('刷新登录状态超时，请重试');
      await vi.advanceTimersByTimeAsync(15_000);
      await rejection;
      finishBody({ accessToken: 'late', refreshToken: 'late', expiresIn: 60 });
      await Promise.resolve();
      expect(setSession).not.toHaveBeenCalled();
      expect(state.spans.map((span) => span.ended)).toEqual([[200]]);
      expect(state.spans[0].failed).toEqual([true]);
    } finally {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    }
  });

  it('links every waiter to a rejected shared refresh beyond the export link limit', async () => {
    let finishRefresh!: (value: Response) => void;
    const refresh = new Promise<Response>((resolve) => {
      finishRefresh = resolve;
    });
    const response = (status: number, data: object) =>
      ({ status, ok: status < 400, json: async () => data }) as Response;
    const fetchMock = vi.fn((url: string) =>
      url.endsWith('/api/v1/auth/refresh')
        ? refresh
        : Promise.resolve(response(401, { error: { code: 'expired' } })),
    );
    vi.stubGlobal('fetch', fetchMock);
    try {
      const requests = Array.from({ length: 24 }, () => apiClient.GET('/api/v1/creator/identity'));
      await vi.waitFor(() => expect(state.waits).toHaveLength(24));
      finishRefresh(response(401, {}));
      expect((await Promise.all(requests)).every((result) => result.status === 401)).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(25);
      const refreshId = state.spans[24].id;
      expect(state.waits.map((wait) => wait.links)).toEqual(
        state.spans.slice(0, 24).map((original) => [original.id, refreshId]),
      );
      expect(state.waits.every((wait) => wait.ended.join() === 'rejected')).toBe(true);
      expect(state.spans.every((span) => span.ended.join() === '401')).toBe(true);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('ends the span when a request is aborted', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('aborted', 'AbortError')));
    const logging = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const result = await apiClient.GET('/api/v1/creator/identity', {
        signal: AbortSignal.abort(),
      });
      expect(result.status).toBe(0);
      expect(state.spans[0].ended).toEqual([0]);
    } finally {
      logging.mockRestore();
      vi.unstubAllGlobals();
    }
  });
});
