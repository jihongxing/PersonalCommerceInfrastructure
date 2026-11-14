'use client';

import Link from 'next/link';
import { formatFlowTime, useOperationsFlowRead } from '../lib/use-operations-flow-read';

type RequestRecord = {
  readonly id: string;
  readonly offeringId: string;
  readonly offering: { readonly id: string; readonly title: string; readonly state: string } | null;
  readonly creator: { readonly id: string; readonly displayName?: string };
  readonly customer: { readonly id: string };
  readonly state: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly creatorDecision: string;
};

export function RequestReadPanel() {
  const read = useOperationsFlowRead<RequestRecord>('requests');
  const { result, selected } = read;
  return (
    <section
      className="data-panel"
      aria-label="Customer Request 数据"
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
            placeholder="Request、Offering、Creator 或 Customer…"
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
            {['draft', 'submitted', 'confirmed', 'declined'].map((state) => (
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
      {read.loading && <p role="status">正在加载 Customer Request 数据…</p>}
      {read.detailLoading && <p role="status">正在加载 Request 详情…</p>}
      {read.error && (
        <p role="alert">
          {read.error === 'unauthenticated' ? (
            <>
              Session 已失效，请<Link href="/login">重新登录</Link>。
            </>
          ) : read.error === 'forbidden' ? (
            '当前账户没有 Request 读取权限。'
          ) : read.error === 'not-found' ? (
            'Request 记录不存在。请重新查询。'
          ) : (
            'Request 请求失败，请重新查询。'
          )}
        </p>
      )}
      {!read.loading && !read.error && result?.items.length === 0 && (
        <p role="status">没有匹配的 Request 记录。</p>
      )}
      {!read.loading && !read.error && result !== null && result.items.length > 0 && (
        <>
          <div className="data-summary">
            <span>{result.total} 条 Request</span>
            <span>时间以 UTC 显示 · Creator 决策只读</span>
          </div>
          <div
            className="data-table-wrap"
            role="region"
            tabIndex={0}
            aria-label="Customer Request 列表"
          >
            <table>
              <caption className="sr-only">Customer Request 列表</caption>
              <thead>
                <tr>
                  <th scope="col">Request / Customer</th>
                  <th scope="col">Offering</th>
                  <th scope="col">Creator</th>
                  <th scope="col">状态</th>
                  <th scope="col">Creator 决策</th>
                  <th scope="col">详情</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.id}</strong>
                      <small>Customer {item.customer.id}</small>
                    </td>
                    <td>{item.offering?.title ?? `${item.offeringId}（关联不可用）`}</td>
                    <td>{item.creator.displayName ?? item.creator.id}</td>
                    <td>{item.state}</td>
                    <td>{item.creatorDecision}</td>
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
          <div className="pagination" aria-label="Request 分页">
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
        <aside className="detail-card" aria-label="Customer Request 详情" aria-live="polite">
          <div className="section-heading">
            <h2>{selected.id}</h2>
            <button type="button" className="text-button" onClick={read.close}>
              关闭
            </button>
          </div>
          <dl className="detail-grid">
            <dt>Request</dt>
            <dd>{selected.id}</dd>
            <dt>Offering</dt>
            <dd>
              {selected.offering === null ? (
                `${selected.offeringId}（关联不可用）`
              ) : (
                <Link href={`/offerings?id=${encodeURIComponent(selected.offering.id)}`}>
                  {selected.offering.title} ({selected.offering.id})
                </Link>
              )}
            </dd>
            <dt>Creator Identity</dt>
            <dd>
              {selected.creator.displayName} ({selected.creator.id})
            </dd>
            <dt>Customer</dt>
            <dd>{selected.customer.id}</dd>
            <dt>当前状态</dt>
            <dd>{selected.state}</dd>
            <dt>Creator 决策</dt>
            <dd>{selected.creatorDecision}</dd>
            <dt>创建时间</dt>
            <dd>{formatFlowTime(selected.createdAt)}</dd>
            <dt>最后更新时间</dt>
            <dd>{formatFlowTime(selected.updatedAt)}</dd>
            <dt>决策时间</dt>
            <dd>暂无独立时间记录</dd>
            <dt>Request 内容</dt>
            <dd>自由文本可能包含私密联系方式，当前只读范围不返回原文。</dd>
          </dl>
        </aside>
      )}
    </section>
  );
}
