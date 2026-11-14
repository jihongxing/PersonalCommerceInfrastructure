'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export type WorkspaceResult = {
  kind: 'capabilities' | 'templates' | 'offering' | 'request' | 'audit';
  id: string;
  name: string;
  state: string;
  relatedId?: string;
  updatedAt?: string;
  occurredAt?: string;
  actorId?: string;
  actorCategory?: string;
};
type Results = { items: WorkspaceResult[]; total: number; page: number; pageSize: number };
const destination = {
  capabilities: 'capabilities',
  templates: 'templates',
  offering: 'offerings',
  request: 'requests',
  audit: 'audit',
};
export function SearchResultLink({ item }: { item: WorkspaceResult }) {
  return (
    <>
      <Link href={'/' + destination[item.kind] + '?id=' + encodeURIComponent(item.id)}>
        {item.name} · {item.id}
      </Link>
      <p>
        {item.kind} · {item.state}
        {item.relatedId ? ' · 关联 ' + item.relatedId : ''}
      </p>
      {item.actorId && (
        <p>
          执行主体 {item.actorId} · {item.actorCategory ?? 'unknown'}（沿用现有审计归因）
        </p>
      )}
      {item.updatedAt && (
        <time dateTime={item.updatedAt}>
          更新时间 {new Date(item.updatedAt).toISOString()} · UTC
        </time>
      )}
      {item.occurredAt && (
        <time dateTime={item.occurredAt}>
          事件时间 {new Date(item.occurredAt).toISOString()} · UTC
        </time>
      )}
    </>
  );
}
export function WorkspaceSearch() {
  const [query, setQuery] = useState('');
  const [module, setModule] = useState('all');
  const [result, setResult] = useState<Results | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);
  async function search(page = 1) {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const params = new URLSearchParams({
        q: query.trim(),
        module,
        page: String(page),
        pageSize: '20',
      });
      const response = await fetch('/api/operations/search?' + params, {
        cache: 'no-store',
        credentials: 'same-origin',
        signal: controller.signal,
      });
      if (!response.ok)
        throw new Error(
          response.status === 401
            ? 'Session 已失效，请重新登录。'
            : response.status === 403
              ? '没有所选模块的读取权限。'
              : '检索失败，请重试。',
        );
      const value = (await response.json()) as Results;
      if (!controller.signal.aborted) setResult(value);
    } catch (failure) {
      if (!controller.signal.aborted)
        setError(failure instanceof Error ? failure.message : '检索失败。');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }
  return (
    <section className="data-panel" aria-label="跨模块检索" aria-busy={loading}>
      <h2>全局业务检索</h2>
      <p>
        按业务标识、公开名称或真实状态检索，仅返回有权查看的模块。请求原文、联系方式与凭证不参与检索。
      </p>
      <form
        className="filter-bar"
        onSubmit={(event) => {
          event.preventDefault();
          void search();
        }}
      >
        <label>
          业务检索
          <input
            required
            maxLength={160}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="业务 ID、名称或状态"
          />
        </label>
        <label>
          检索范围
          <select value={module} onChange={(event) => setModule(event.target.value)}>
            <option value="all">所有有权模块</option>
            <option value="catalog">Catalog</option>
            <option value="offering">Offering</option>
            <option value="request">Request</option>
            <option value="audit">Audit</option>
          </select>
        </label>
        <button disabled={loading || !query.trim()} type="submit">
          {loading ? '正在检索…' : '检索'}
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
      {result && (
        <>
          <p role="status">
            共 {result.total} 条匹配记录 · 第 {result.page} 页
          </p>
          {result.items.length === 0 ? (
            <p>没有匹配记录。</p>
          ) : (
            <ul className="search-results">
              {result.items.map((item) => (
                <li key={item.kind + ':' + item.id}>
                  <SearchResultLink item={item} />
                </li>
              ))}
            </ul>
          )}
          <div className="pagination">
            <button
              disabled={loading || result.page === 1}
              onClick={() => void search(result.page - 1)}
            >
              上一页
            </button>
            <button
              disabled={loading || result.page * result.pageSize >= result.total}
              onClick={() => void search(result.page + 1)}
            >
              下一页
            </button>
          </div>
        </>
      )}
    </section>
  );
}
