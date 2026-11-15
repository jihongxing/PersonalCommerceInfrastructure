'use client';

import { useEffect, useState } from 'react';

type AuditRecord = {
  readonly id: string;
  readonly actorId: string;
  readonly actorCategory?: 'human_operations' | 'provider_service' | 'platform_system' | 'unknown';
  readonly entityType: string;
  readonly entityId: string;
  readonly action: string;
  readonly before: Record<string, unknown>;
  readonly after: Record<string, unknown>;
  readonly reason: string;
  readonly policyVersion: string;
  readonly occurredAt: string;
  readonly correlationId: string;
};
type AuditList = {
  readonly items: readonly AuditRecord[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
};

export function AuditReadPanel() {
  const [query, setQuery] = useState('');
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [result, setResult] = useState<AuditList | null>(null);
  const [selected, setSelected] = useState<AuditRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'unauthorized' | 'not-found' | 'failed' | null>(null);

  const load = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (query.trim()) params.set('q', query.trim());
      if (entityType) params.set('entityType', entityType);
      if (action) params.set('action', action);
      const response = await fetch(`/api/operations/audit?${params}`, {
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
      setResult((await response.json()) as AuditList);
      setSelected(null);
    } catch {
      setError('failed');
    } finally {
      setLoading(false);
    }
  };
  const detail = async (id: string) => {
    try {
      const response = await fetch(`/api/operations/audit/${encodeURIComponent(id)}`, {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (response.status === 404) {
        setError('not-found');
        return;
      }
      if (!response.ok) {
        setError(response.status === 401 || response.status === 403 ? 'unauthorized' : 'failed');
        return;
      }
      setSelected((await response.json()) as AuditRecord);
    } catch {
      setError('failed');
    }
  };
  useEffect(() => {
    // Defer the first request to the microtask queue so the effect only starts
    // the external fetch; state updates remain in its async completion path.
    void Promise.resolve().then(async () => {
      await load();
      const id = new URL(window.location.href).searchParams.get('id');
      if (id) await detail(id);
    });
    // The filter values are intentionally captured by submit handlers, not by
    // the one-time initial load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="data-panel" aria-label="Audit 数据">
      <form
        className="filter-bar"
        onSubmit={(event) => {
          event.preventDefault();
          void load();
        }}
      >
        <label>
          搜索
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="主体、对象或原因"
          />
        </label>
        <label>
          对象类型
          <select value={entityType} onChange={(event) => setEntityType(event.target.value)}>
            <option value="">全部</option>
            <option value="capability">capability</option>
            <option value="template">template</option>
            <option value="release">release</option>
          </select>
        </label>
        <label>
          操作
          <select value={action} onChange={(event) => setAction(event.target.value)}>
            <option value="">全部</option>
            <option value="updated">updated</option>
            <option value="published">published</option>
            <option value="draft_created">draft_created</option>
            <option value="draft_updated">draft_updated</option>
            <option value="previewed">previewed</option>
            <option value="validated">validated</option>
            <option value="activated">activated</option>
            <option value="activation_failed">activation_failed</option>
            <option value="draft_update_failed">draft_update_failed</option>
          </select>
        </label>
        <button type="submit">查询</button>
      </form>
      {loading && <p role="status">正在加载真实 Audit 数据…</p>}
      {!loading && error === 'unauthorized' && (
        <p role="alert">当前 Session 没有 Audit 读取权限。</p>
      )}
      {!loading && error === 'not-found' && <p role="alert">审计记录不存在。</p>}
      {!loading && error === 'failed' && <p role="alert">Audit 请求失败，请重试。</p>}
      {!loading && error === null && result?.items.length === 0 && (
        <p role="status">没有匹配的审计记录。</p>
      )}
      {!loading && error === null && result !== null && result.items.length > 0 && (
        <>
          <div className="data-summary">
            <span>{result.total} 条记录</span>
            <span>只读</span>
          </div>
          <div className="data-table-wrap" role="region" tabIndex={0} aria-label="Audit 列表">
            <table>
              <caption className="sr-only">Audit 列表</caption>
              <thead>
                <tr>
                  <th scope="col">时间</th>
                  <th scope="col">操作</th>
                  <th scope="col">对象</th>
                  <th scope="col">执行归因</th>
                  <th scope="col">操作</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.occurredAt)}</td>
                    <td>{item.action}</td>
                    <td>
                      {item.entityType} / {item.entityId}
                    </td>
                    <td>
                      {actorCategoryLabel(item.actorCategory)}
                      <small>{item.actorId}</small>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => void detail(item.id)}
                      >
                        查看详情
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination" aria-label="Audit 分页">
            <button
              type="button"
              disabled={result.page <= 1}
              onClick={() => void load(result.page - 1)}
            >
              上一页
            </button>
            <span>第 {result.page} 页</span>
            <button
              type="button"
              disabled={result.page * result.pageSize >= result.total}
              onClick={() => void load(result.page + 1)}
            >
              下一页
            </button>
          </div>
        </>
      )}
      {selected !== null && (
        <aside className="detail-card" aria-label="Audit 详情">
          <div className="section-heading">
            <h2>审计详情</h2>
            <button type="button" className="text-button" onClick={() => setSelected(null)}>
              关闭
            </button>
          </div>
          <dl className="detail-grid">
            <dt>时间</dt>
            <dd>{formatDate(selected.occurredAt)}</dd>
            <dt>执行归因</dt>
            <dd>
              {actorCategoryLabel(selected.actorCategory)}
              <small>{selected.actorId}</small>
            </dd>
            <dt>关联对象</dt>
            <dd>
              {selected.entityType} / {selected.entityId}
            </dd>
            <dt>原因</dt>
            <dd>{selected.reason}</dd>
            <dt>Before</dt>
            <dd>
              <code>{JSON.stringify(selected.before, null, 2)}</code>
            </dd>
            <dt>After</dt>
            <dd>
              <code>{JSON.stringify(selected.after, null, 2)}</code>
            </dd>
          </dl>
        </aside>
      )}
    </section>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('zh-CN', { dateStyle: 'medium', timeStyle: 'short' });
}

function actorCategoryLabel(category: AuditRecord['actorCategory']): string {
  switch (category) {
    case 'human_operations':
      return 'Human Operations';
    case 'provider_service':
      return 'Provider Service';
    case 'platform_system':
      return 'Platform System';
    default:
      return '未分类执行主体';
  }
}
