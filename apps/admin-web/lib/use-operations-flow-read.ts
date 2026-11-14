'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type ReadError = 'unauthenticated' | 'forbidden' | 'not-found' | 'failed';
type Page<T> = {
  readonly items: readonly T[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
};

export function useOperationsFlowRead<T>(resource: 'offerings' | 'requests') {
  const [query, setQuery] = useState('');
  const [state, setState] = useState('');
  const [result, setResult] = useState<Page<T> | null>(null);
  const [selected, setSelected] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<ReadError | null>(null);
  const active = useRef<AbortController | null>(null);

  const detail = useCallback(
    async (id: string) => {
      active.current?.abort();
      const controller = new AbortController();
      active.current = controller;
      setSelected(null);
      setError(null);
      setDetailLoading(true);
      const url = new URL(window.location.href);
      url.searchParams.set('id', id);
      window.history.replaceState(null, '', url);
      try {
        const response = await fetch(`/api/operations/${resource}/${encodeURIComponent(id)}`, {
          credentials: 'same-origin',
          cache: 'no-store',
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        if (!response.ok) {
          setError(readError(response.status));
          return;
        }
        const data = (await response.json()) as T;
        if (!controller.signal.aborted) setSelected(data);
      } catch {
        if (!controller.signal.aborted) setError('failed');
      } finally {
        if (!controller.signal.aborted) setDetailLoading(false);
      }
    },
    [resource],
  );

  const load = useCallback(
    async (page: number, search: string, filter: string, selectedId?: string) => {
      active.current?.abort();
      const controller = new AbortController();
      active.current = controller;
      setLoading(true);
      setDetailLoading(false);
      setError(null);
      setSelected(null);
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (search.trim()) params.set('q', search.trim());
      if (filter) params.set('state', filter);
      const url = new URL(window.location.href);
      url.search = params.toString();
      if (selectedId) url.searchParams.set('id', selectedId);
      window.history.replaceState(null, '', url);
      try {
        const response = await fetch(`/api/operations/${resource}?${params}`, {
          credentials: 'same-origin',
          cache: 'no-store',
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        if (!response.ok) {
          setError(readError(response.status));
          return;
        }
        const data = (await response.json()) as Page<T>;
        if (controller.signal.aborted) return;
        setResult(data);
        setLoading(false);
        if (selectedId) await detail(selectedId);
      } catch {
        if (!controller.signal.aborted) setError('failed');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [resource, detail],
  );

  useEffect(() => {
    let mounted = true;
    void Promise.resolve().then(() => {
      if (!mounted) return;
      const params = new URL(window.location.href).searchParams;
      const search = params.get('q') ?? '';
      const filter = params.get('state') ?? '';
      const page = Number(params.get('page') ?? 1);
      setQuery(search);
      setState(filter);
      void load(
        Number.isInteger(page) && page > 0 ? page : 1,
        search,
        filter,
        params.get('id') ?? undefined,
      );
    });
    return () => {
      mounted = false;
      active.current?.abort();
    };
  }, [load]);

  const close = () => {
    active.current?.abort();
    setSelected(null);
    setDetailLoading(false);
    setError(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('id');
    window.history.replaceState(null, '', url);
  };
  return {
    query,
    setQuery,
    state,
    setState,
    result,
    selected,
    loading,
    detailLoading,
    error,
    detail,
    close,
    load: (page = 1) => load(page, query, state),
  };
}

function readError(status: number): ReadError {
  return status === 401
    ? 'unauthenticated'
    : status === 403
      ? 'forbidden'
      : status === 404
        ? 'not-found'
        : 'failed';
}

export function formatFlowTime(value: string | undefined): string {
  return value === undefined
    ? '暂无记录'
    : new Intl.DateTimeFormat('zh-CN', {
        timeZone: 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      }).format(new Date(value)) + ' UTC';
}
