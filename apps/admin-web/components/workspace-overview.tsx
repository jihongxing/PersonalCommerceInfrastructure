'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { WorkspaceSearch, SearchResultLink, type WorkspaceResult } from './workspace-search';

type Summary = {
  total: number;
  states: Record<string, number>;
  scope: string;
  policyVersion?: string;
};
type Overview = {
  queriedAt: string;
  modules: Partial<Record<'catalog' | 'offering' | 'request' | 'audit', Summary>>;
  recentActivity?: WorkspaceResult[];
};
const labels = {
  catalog: 'Catalog / Capability',
  offering: 'Offering',
  request: 'Customer Request',
  audit: '运营审计',
};
const destinations = {
  catalog: '/capabilities',
  offering: '/offerings',
  request: '/requests',
  audit: '/audit',
};
const states: Record<string, string> = {
  submitted: 'submitted · 等待 Creator 决策',
  confirmed: 'confirmed · 已确认',
  declined: 'declined · 已拒绝',
  published: 'published · 已发布',
  unpublished: 'unpublished · 已撤下',
  archived: 'archived · 已归档',
  draft: 'draft · 草稿',
};

export function WorkspaceOverview() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/operations/overview', {
      cache: 'no-store',
      credentials: 'same-origin',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(
            response.status === 401
              ? 'Session 已失效，请重新登录。'
              : response.status === 403
                ? '当前账户没有可读取的模块。'
                : '概览查询失败，请重试。',
          );
        const value = (await response.json()) as Overview;
        if (!value.modules || !value.queriedAt) throw new Error('概览数据暂不可用。');
        if (!controller.signal.aborted) {
          setData(value);
          setError(null);
        }
      })
      .catch((failure: unknown) => {
        if (!controller.signal.aborted)
          setError(failure instanceof Error ? failure.message : '概览查询失败。');
      });
    return () => controller.abort();
  }, [attempt]);
  return (
    <>
      <section aria-label="Operations Overview" aria-busy={!data && !error}>
        {!data && !error && <p role="status">正在查询运营概览…</p>}
        {error && (
          <div role="alert">
            <p>{error}</p>
            <button
              onClick={() => {
                setData(null);
                setError(null);
                setAttempt((value) => value + 1);
              }}
            >
              重试概览
            </button>
          </div>
        )}
        {!error && data && (
          <>
            <p className="data-summary">
              统计时间 {new Date(data.queriedAt).toISOString()} · UTC ·
              同一查询快照的精确计数，仅含有权限模块。
            </p>
            <div className="section-grid">
              {(Object.entries(data.modules) as [keyof typeof labels, Summary][]).map(
                ([module, summary]) => (
                  <article className="section-card" key={module}>
                    <h2>
                      <Link href={destinations[module]}>{labels[module]}</Link>
                    </h2>
                    <p className="metric-number">
                      {summary.total}
                      <small> 条记录</small>
                    </p>
                    <p>
                      {module === 'catalog'
                        ? '当前发布政策 ' + (summary.policyVersion ?? '') + '，能力与模板合计'
                        : '全部已持久化记录，按当前状态分组'}
                    </p>
                    <dl className="metric-states">
                      {Object.entries(summary.states).map(([state, count]) => (
                        <div key={state}>
                          <dt>{states[state] ?? state}</dt>
                          <dd>{count}</dd>
                        </div>
                      ))}
                    </dl>
                  </article>
                ),
              )}
            </div>
            {data.recentActivity && (
              <section className="data-panel" aria-label="近期运营事件">
                <h2>近期运营事件</h2>
                <p>按事件发生时间排序，仅显示现有 Catalog 运营审计范围。</p>
                {data.recentActivity.length === 0 ? (
                  <p>暂无审计记录。</p>
                ) : (
                  <ul className="search-results">
                    {data.recentActivity.map((item) => (
                      <li key={item.id}>
                        <SearchResultLink item={item} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </>
        )}
      </section>
      <WorkspaceSearch />
    </>
  );
}
