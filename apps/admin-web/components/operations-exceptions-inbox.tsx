'use client';

import { useCallback, useEffect, useState } from 'react';

type Classification = 'confirmed_fact' | 'needs_review';
type Source = 'offering' | 'request' | 'audit';
type Rule = {
  readonly id: string;
  readonly classification: Classification;
  readonly source: Source;
  readonly requiredModules: readonly string[];
  readonly title: string;
  readonly condition: string;
  readonly evidenceFields: string;
  readonly relationship: string;
  readonly exclusions: string;
};
type Signal = {
  readonly id: string;
  readonly ruleId: string;
  readonly classification: Classification;
  readonly source: Source;
  readonly title: string;
  readonly summary: string;
  readonly occurredAt?: string;
  readonly evidence: Record<string, string | number | boolean | null>;
  readonly related: readonly { readonly kind: string; readonly id: string }[];
};
type Result = {
  readonly items: readonly Signal[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly rules: readonly Rule[];
};

export function OperationsExceptionsInbox() {
  const [classification, setClassification] = useState('');
  const [source, setSource] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'unauthorized' | 'failed' | null>(null);

  const load = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: String(page), pageSize: '20' });
        if (classification) params.set('classification', classification);
        if (source) params.set('source', source);
        const response = await fetch(`/api/operations/exceptions?${params}`, {
          credentials: 'same-origin',
          cache: 'no-store',
        });
        if (response.status === 401 || response.status === 403) {
          setError('unauthorized');
          return;
        }
        if (!response.ok) {
          setError('failed');
          return;
        }
        setResult((await response.json()) as Result);
      } catch {
        setError('failed');
      } finally {
        setLoading(false);
      }
    },
    [classification, source],
  );

  useEffect(() => {
    // Defer the first request so the effect only starts the external fetch.
    void Promise.resolve().then(() => load());
    // Filter state is part of the callback contract, so changing a filter refreshes the page.
  }, [load]);

  return (
    <section className="data-panel" aria-label="运营异常发现" aria-busy={loading}>
      <div className="notice">
        <strong>证据边界</strong>
        <p>
          这里只展示现有业务记录和不可变 Audit 中能直接证明的信号。正常状态、记录年龄和
          证据不足的情况不会被自动标记为异常，也没有分配、关闭或处置操作。
        </p>
      </div>
      <form
        className="filter-bar"
        onSubmit={(event) => {
          event.preventDefault();
          void load();
        }}
      >
        <label>
          分类
          <select
            value={classification}
            onChange={(event) => setClassification(event.target.value)}
          >
            <option value="">全部</option>
            <option value="confirmed_fact">已确认事实</option>
            <option value="needs_review">需要人工复核</option>
          </select>
        </label>
        <label>
          来源
          <select value={source} onChange={(event) => setSource(event.target.value)}>
            <option value="">全部</option>
            <option value="audit">Audit</option>
            <option value="offering">Offering</option>
            <option value="request">Customer Request</option>
          </select>
        </label>
        <button type="submit" disabled={loading}>
          查询
        </button>
      </form>
      {loading && <p role="status">正在读取现有运营证据…</p>}
      {!loading && error === 'unauthorized' && (
        <p role="alert">当前 Session 没有可读取的异常来源权限。</p>
      )}
      {!loading && error === 'failed' && <p role="alert">异常证据查询失败，请重试。</p>}
      {!loading && error === null && result !== null && (
        <>
          <div className="data-summary">
            <span>{result.total} 条信号</span>
            <span>只读 · 服务端分页</span>
          </div>
          {result.items.length === 0 ? (
            <p role="status">当前授权来源没有符合规则的异常信号。</p>
          ) : (
            <div className="exception-list">
              {result.items.map((item) => (
                <article className="detail-card" key={item.id}>
                  <div className="section-heading">
                    <div>
                      <p className="eyebrow">{item.ruleId}</p>
                      <h2>{item.title}</h2>
                    </div>
                    <span className={`exception-badge ${item.classification}`}>
                      {classificationLabel(item.classification)}
                    </span>
                  </div>
                  <p>{item.summary}</p>
                  <dl className="detail-grid">
                    <dt>来源</dt>
                    <dd>{sourceLabel(item.source)}</dd>
                    <dt>发现时间</dt>
                    <dd>{formatDate(item.occurredAt)}</dd>
                    <dt>证据字段</dt>
                    <dd>
                      <code>{JSON.stringify(item.evidence, null, 2)}</code>
                    </dd>
                    <dt>关联记录</dt>
                    <dd>
                      {item.related.map((related) => `${related.kind}:${related.id}`).join(' · ')}
                    </dd>
                  </dl>
                </article>
              ))}
            </div>
          )}
          <div className="pagination" aria-label="异常信号分页">
            <button
              type="button"
              disabled={loading || result.page <= 1}
              onClick={() => void load(result.page - 1)}
            >
              上一页
            </button>
            <span>第 {result.page} 页</span>
            <button
              type="button"
              disabled={loading || result.page * result.pageSize >= result.total}
              onClick={() => void load(result.page + 1)}
            >
              下一页
            </button>
          </div>
          <section className="data-panel" aria-label="异常规则定义">
            <h2>规则与排除条件</h2>
            {result.rules.map((rule) => (
              <details key={rule.id}>
                <summary>
                  {rule.id} · {rule.title}
                </summary>
                <dl className="detail-grid">
                  <dt>判定条件</dt>
                  <dd>{rule.condition}</dd>
                  <dt>证据字段</dt>
                  <dd>{rule.evidenceFields}</dd>
                  <dt>业务关联</dt>
                  <dd>{rule.relationship}</dd>
                  <dt>误报排除</dt>
                  <dd>{rule.exclusions}</dd>
                </dl>
              </details>
            ))}
          </section>
        </>
      )}
    </section>
  );
}

function classificationLabel(value: Classification) {
  return value === 'confirmed_fact' ? '已确认事实' : '需要人工复核';
}

function sourceLabel(value: Source) {
  return value === 'audit'
    ? 'Operations Audit'
    : value === 'offering'
      ? 'Offering'
      : 'Customer Request';
}

function formatDate(value: string | undefined) {
  if (value === undefined) return '未提供时间证据';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('zh-CN', { dateStyle: 'medium', timeStyle: 'short' });
}
