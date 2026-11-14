'use client';

import Link from 'next/link';
import { formatFlowTime, useOperationsFlowRead } from '../lib/use-operations-flow-read';

type Offering = {
  readonly id: string;
  readonly creator: { readonly id: string; readonly displayName?: string };
  readonly capabilities: readonly {
    readonly id: string;
    readonly name?: string;
    readonly catalogItemId?: string;
  }[];
  readonly templateId?: string;
  readonly title: string;
  readonly description: string;
  readonly availabilityDescription?: string;
  readonly requestInstructions: string;
  readonly state: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly policyStatus: string;
  readonly policyReason?: string;
  readonly policyVersion?: string;
  readonly distribution: { readonly publicUrl: string; readonly state: string } | null;
};

export function OfferingReadPanel() {
  const read = useOperationsFlowRead<Offering>('offerings');
  const { result, selected } = read;
  return (
    <section
      className="data-panel"
      aria-label="Offering 数据"
      aria-busy={read.loading || read.detailLoading}
    >
      <form
        className="filter-bar"
        onSubmit={(event) => {
          event.preventDefault();
          void read.load();
        }}
      >
        <label>
          搜索
          <input
            name="q"
            autoComplete="off"
            value={read.query}
            onChange={(event) => read.setQuery(event.target.value)}
            placeholder="标题、标识或 Creator…"
          />
        </label>
        <label>
          状态
          <select
            name="state"
            value={read.state}
            onChange={(event) => read.setState(event.target.value)}
          >
            <option value="">全部</option>
            {['draft', 'published', 'unpublished', 'archived'].map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={read.loading}>
          查询
        </button>
      </form>
      {read.loading && <p role="status">正在加载 Offering 数据…</p>}
      {read.detailLoading && <p role="status">正在加载 Offering 详情…</p>}
      {read.error && (
        <p role="alert">
          {read.error === 'unauthenticated' ? (
            <>
              Session 已失效，请<Link href="/login">重新登录</Link>。
            </>
          ) : read.error === 'forbidden' ? (
            '当前账户没有 Offering 读取权限。'
          ) : read.error === 'not-found' ? (
            'Offering 记录不存在。请重新查询。'
          ) : (
            'Offering 请求失败，请重新查询。'
          )}
        </p>
      )}
      {!read.loading && !read.error && result?.items.length === 0 && (
        <p role="status">没有匹配的 Offering 记录。</p>
      )}
      {!read.loading && !read.error && result !== null && result.items.length > 0 && (
        <>
          <div className="data-summary">
            <span>{result.total} 条 Offering</span>
            <span>时间以 UTC 显示 · 只读观察</span>
          </div>
          <div className="data-table-wrap" role="region" tabIndex={0} aria-label="Offering 列表">
            <table>
              <caption className="sr-only">Offering 列表</caption>
              <thead>
                <tr>
                  <th scope="col">标题</th>
                  <th scope="col">Creator</th>
                  <th scope="col">状态</th>
                  <th scope="col">分发</th>
                  <th scope="col">创建时间</th>
                  <th scope="col">详情</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.title}</strong>
                      <small>{item.id}</small>
                    </td>
                    <td>{item.creator.displayName ?? item.creator.id}</td>
                    <td>{item.state}</td>
                    <td>{item.distribution?.state ?? '暂无独立分发记录'}</td>
                    <td>{formatFlowTime(item.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="text-button"
                        disabled={read.detailLoading}
                        onClick={() => void read.detail(item.id)}
                      >
                        查看详情
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination" aria-label="Offering 分页">
            <button
              type="button"
              disabled={read.loading || result.page <= 1}
              onClick={() => void read.load(result.page - 1)}
            >
              上一页
            </button>
            <span>第 {result.page} 页</span>
            <button
              type="button"
              disabled={read.loading || result.page * result.pageSize >= result.total}
              onClick={() => void read.load(result.page + 1)}
            >
              下一页
            </button>
          </div>
        </>
      )}
      {selected !== null && (
        <aside className="detail-card" aria-label="Offering 详情" aria-live="polite">
          <div className="section-heading">
            <h2>{selected.title}</h2>
            <button type="button" className="text-button" onClick={read.close}>
              关闭
            </button>
          </div>
          <dl className="detail-grid">
            <dt>ID</dt>
            <dd>{selected.id}</dd>
            <dt>Creator</dt>
            <dd>
              {selected.creator.displayName} ({selected.creator.id})
            </dd>
            <dt>状态</dt>
            <dd>{selected.state}</dd>
            <dt>Capability / Catalog</dt>
            <dd>
              {selected.capabilities.length === 0 ? (
                '暂无记录'
              ) : (
                <ul>
                  {selected.capabilities.map((capability) => (
                    <li key={capability.id}>
                      {capability.name ?? '关联未解析'} ({capability.id}){' '}
                      {capability.catalogItemId && (
                        <Link href="/capabilities">Catalog: {capability.catalogItemId}</Link>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </dd>
            <dt>Template</dt>
            <dd>
              {selected.templateId ? (
                <Link href="/templates">{selected.templateId}</Link>
              ) : (
                '暂无记录'
              )}
            </dd>
            <dt>政策状态</dt>
            <dd>
              {selected.policyStatus} {selected.policyVersion} {selected.policyReason}
            </dd>
            <dt>发布/分发记录</dt>
            <dd>
              {selected.distribution === null
                ? '暂无独立分发记录'
                : `${selected.distribution.state}: ${selected.distribution.publicUrl}`}
            </dd>
            <dt>创建时间</dt>
            <dd>{formatFlowTime(selected.createdAt)}</dd>
            <dt>最后更新时间</dt>
            <dd>{formatFlowTime(selected.updatedAt)}</dd>
            <dt>发布时间</dt>
            <dd>暂无独立时间记录</dd>
            <dt>描述</dt>
            <dd>{selected.description}</dd>
            <dt>可请求条件</dt>
            <dd>{selected.availabilityDescription ?? '暂无记录'}</dd>
            <dt>请求说明</dt>
            <dd>{selected.requestInstructions}</dd>
          </dl>
        </aside>
      )}
    </section>
  );
}
