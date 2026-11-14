'use client';

import { useEffect, useState } from 'react';

type CatalogKind = 'capabilities' | 'templates';
type CatalogItem = {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly riskTier: string;
  readonly releaseScope: string;
  readonly status: string;
  readonly version: string;
  readonly [key: string]: unknown;
};
type CatalogList = {
  readonly policyVersion: string;
  readonly kind: CatalogKind;
  readonly items: readonly CatalogItem[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
};

export function CatalogReadPanel({ kind }: { kind: CatalogKind }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [riskTier, setRiskTier] = useState('');
  const [result, setResult] = useState<CatalogList | null>(null);
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'unauthorized' | 'not-found' | 'failed' | null>(null);

  const load = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (query.trim()) params.set('q', query.trim());
      if (status) params.set('status', status);
      if (riskTier) params.set('riskTier', riskTier);
      const response = await fetch(`/api/operations/catalog/${kind}?${params}`, {
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
      setResult((await response.json()) as CatalogList);
      setSelected(null);
    } catch {
      setError('failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Defer the first request to the microtask queue so the effect only starts
    // the external fetch; state updates remain in its async completion path.
    void Promise.resolve().then(() => load());
    // The shell revalidates the Session on navigation; this panel loads its data once per area.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  const detail = async (id: string) => {
    setSelected(null);
    try {
      const response = await fetch(`/api/operations/catalog/${kind}/${encodeURIComponent(id)}`, {
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
      setSelected((await response.json()) as CatalogItem);
    } catch {
      setError('failed');
    }
  };

  return (
    <section className="data-panel" aria-label="Catalog 数据">
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
            placeholder="名称、标识或描述"
          />
        </label>
        <label>
          状态
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">全部</option>
            <option value="active">active</option>
            <option value="draft">draft</option>
            <option value="paused">paused</option>
            <option value="retired">retired</option>
          </select>
        </label>
        <label>
          风险
          <select value={riskTier} onChange={(event) => setRiskTier(event.target.value)}>
            <option value="">全部</option>
            <option value="low">low</option>
            <option value="review">review</option>
            <option value="prohibited">prohibited</option>
          </select>
        </label>
        <button type="submit">查询</button>
      </form>
      {loading && <p role="status">正在加载真实 Catalog 数据…</p>}
      {!loading && error === 'unauthorized' && (
        <p role="alert">当前 Session 没有 Catalog 读取权限。</p>
      )}
      {!loading && error === 'not-found' && <p role="alert">记录不存在或已不可用。</p>}
      {!loading && error === 'failed' && <p role="alert">Catalog 请求失败，请重试。</p>}
      {!loading && error === null && result?.items.length === 0 && (
        <p role="status">没有匹配的 Catalog 记录。</p>
      )}
      {!loading && error === null && result !== null && result.items.length > 0 && (
        <>
          <div className="data-summary">
            <span>政策版本 {result.policyVersion}</span>
            <span>{result.total} 条记录</span>
          </div>
          <div
            className="data-table-wrap"
            role="region"
            tabIndex={0}
            aria-label={`${kind === 'capabilities' ? '能力目录' : '服务模板'}列表`}
          >
            <table>
              <caption className="sr-only">
                {kind === 'capabilities' ? '能力目录列表' : '服务模板列表'}
              </caption>
              <thead>
                <tr>
                  <th scope="col">名称</th>
                  <th scope="col">状态</th>
                  <th scope="col">风险</th>
                  <th scope="col">版本</th>
                  <th scope="col">操作</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                      <small>{item.id}</small>
                    </td>
                    <td>{item.status}</td>
                    <td>{item.riskTier}</td>
                    <td>{item.version}</td>
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
          <div className="pagination" aria-label="Catalog 分页">
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
        <aside className="detail-card" aria-label="Catalog 详情">
          <div className="section-heading">
            <h2>{selected.name}</h2>
            <button type="button" className="text-button" onClick={() => setSelected(null)}>
              关闭
            </button>
          </div>
          <dl className="detail-grid">
            <dt>ID</dt>
            <dd>{selected.id}</dd>
            <dt>Slug</dt>
            <dd>{selected.slug}</dd>
            <dt>状态</dt>
            <dd>{selected.status}</dd>
            <dt>风险</dt>
            <dd>{selected.riskTier}</dd>
            <dt>发布范围</dt>
            <dd>{selected.releaseScope}</dd>
            <dt>版本</dt>
            <dd>{selected.version}</dd>
            {'vertical' in selected && (
              <>
                <dt>业务域</dt>
                <dd>{String(selected.vertical)}</dd>
              </>
            )}
            {'capabilityCatalogItemId' in selected && (
              <>
                <dt>关联能力</dt>
                <dd>{String(selected.capabilityCatalogItemId)}</dd>
              </>
            )}
            {'requiredFields' in selected && (
              <>
                <dt>必填字段</dt>
                <dd>
                  {Array.isArray(selected.requiredFields) ? selected.requiredFields.join(', ') : ''}
                </dd>
              </>
            )}
            {'aliases' in selected && (
              <>
                <dt>别名</dt>
                <dd>{Array.isArray(selected.aliases) ? selected.aliases.join(', ') : ''}</dd>
              </>
            )}
            <dt>可被创作者选择</dt>
            <dd>{selected.creatorSelectable === true ? '是' : '否'}</dd>
            <dt>允许发布</dt>
            <dd>{selected.publishEnabled === true ? '是' : '否'}</dd>
            <dt>描述</dt>
            <dd>{selected.description}</dd>
          </dl>
        </aside>
      )}
    </section>
  );
}
