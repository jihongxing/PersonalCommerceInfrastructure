'use client';

import { useEffect, useState } from 'react';

type Item = {
  readonly id: string;
  readonly name: string;
  readonly status: string;
  readonly riskTier: string;
  readonly creatorSelectable?: boolean;
  readonly publishEnabled?: boolean;
};
type Draft = {
  readonly policyVersion: string;
  readonly revision: string;
  readonly capabilities: readonly Item[];
  readonly templates: readonly Item[];
};
type Result = {
  readonly status: string;
  readonly errors: readonly string[];
  readonly changes?: readonly {
    readonly entityId: string;
    readonly field: string;
    readonly before: unknown;
    readonly after: unknown;
  }[];
};

export function CatalogPolicyPanel() {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [drafts, setDrafts] = useState<readonly Draft[]>([]);
  const [reason, setReason] = useState('Catalog policy review');
  const [message, setMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  const create = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch('/api/operations/catalog/drafts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error('create');
      const createdDraft = (await response.json()) as Draft;
      setDraft(createdDraft);
      setDrafts((current) => [...current, createdDraft]);
      setPreview(null);
      setMessage('草稿已创建。活动版本保持不变。');
    } catch {
      setMessage('草稿创建失败，请确认当前 Session 具备 Catalog 草稿权限。');
    } finally {
      setLoading(false);
    }
  };

  const loadDrafts = async () => {
    try {
      const response = await fetch('/api/operations/catalog/drafts', { cache: 'no-store' });
      if (!response.ok) {
        setMessage(responseMessage(response.status, '草稿列表加载失败。'));
        return;
      }
      setDrafts((await response.json()) as readonly Draft[]);
    } catch {
      setMessage('草稿列表加载失败，请重试。');
    }
  };

  const openDraft = async (version: string) => {
    try {
      const response = await fetch(
        `/api/operations/catalog/drafts/${encodeURIComponent(version)}`,
        { cache: 'no-store' },
      );
      if (!response.ok) {
        setMessage(responseMessage(response.status, '草稿加载失败。'));
        return;
      }
      setDraft((await response.json()) as Draft);
      setPreview(null);
      setMessage(null);
    } catch {
      setMessage('草稿加载失败，请重试。');
    }
  };

  useEffect(() => {
    // Start the external request after the effect returns so state updates happen
    // in the asynchronous completion path.
    void Promise.resolve().then(() => loadDrafts());
  }, []);

  const refresh = async () => {
    if (!draft) return;
    try {
      const response = await fetch(
        `/api/operations/catalog/drafts/${encodeURIComponent(draft.policyVersion)}`,
        { cache: 'no-store' },
      );
      if (!response.ok) {
        setMessage(responseMessage(response.status, '草稿刷新失败。'));
        return;
      }
      setDraft((await response.json()) as Draft);
      setPreview(null);
      setMessage('草稿已重新加载。');
    } catch {
      setMessage('草稿刷新失败，请重试。');
    }
  };

  const check = async (action: 'preview' | 'validate') => {
    if (!draft) return;
    const response = await fetch(
      `/api/operations/catalog/drafts/${encodeURIComponent(draft.policyVersion)}/${action}`,
      { method: 'POST' },
    );
    if (!response.ok) {
      setPreview(null);
      setMessage(
        responseMessage(response.status, `${action === 'preview' ? '预览' : '校验'}失败。`),
      );
      return;
    }
    const result = (await response.json()) as Result;
    if (action === 'preview') setPreview(result);
    setMessage(
      result.errors.length
        ? `${result.status}: ${result.errors.join(' ')}`
        : `${action === 'preview' ? '预览' : '校验'}通过。`,
    );
  };

  const update = async (
    kind: 'capabilities' | 'templates',
    item: Item,
    change: {
      readonly status?: string;
      readonly riskTier?: string;
      readonly creatorSelectable?: boolean;
      readonly publishEnabled?: boolean;
    },
  ) => {
    if (!draft) return;
    const response = await fetch(
      `/api/operations/catalog/drafts/${encodeURIComponent(draft.policyVersion)}/${kind}/${encodeURIComponent(item.id)}`,
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...change, expectedRevision: draft.revision, reason }),
      },
    );
    if (!response.ok) {
      setMessage(responseMessage(response.status, '草稿更新失败，请重新加载。'));
      return;
    }
    const updatedDraft = (await response.json()) as Draft;
    setDraft(updatedDraft);
    setDrafts((current) =>
      current.map((candidate) =>
        candidate.policyVersion === updatedDraft.policyVersion ? updatedDraft : candidate,
      ),
    );
    setMessage('草稿变更已保存，尚未激活。');
  };

  const activate = async () => {
    if (!draft || !window.confirm('确认将此草稿激活为唯一有效 Catalog 政策版本？')) return;
    const response = await fetch(
      `/api/operations/catalog/drafts/${encodeURIComponent(draft.policyVersion)}/activate`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ expectedRevision: draft.revision, reason, confirm: true }),
      },
    );
    if (response.status === 204) {
      setDrafts((current) =>
        current.filter((candidate) => candidate.policyVersion !== draft.policyVersion),
      );
      setDraft(null);
      setMessage('Catalog 政策已激活，操作已写入审计。');
    } else setMessage(responseMessage(response.status, '激活未完成，请先通过校验并重新加载草稿。'));
  };

  return (
    <section className="data-panel" aria-label="Catalog 政策控制">
      <div className="filter-bar">
        <label>
          操作原因
          <input value={reason} onChange={(event) => setReason(event.target.value)} />
        </label>
        <button type="button" disabled={loading} onClick={() => void create()}>
          新建草稿
        </button>
        {draft && (
          <button type="button" onClick={() => void refresh()}>
            重新加载
          </button>
        )}
        {draft && (
          <button type="button" onClick={() => void check('preview')}>
            预览
          </button>
        )}
        {draft && (
          <button type="button" onClick={() => void check('validate')}>
            校验
          </button>
        )}
        {draft && (
          <button type="button" onClick={() => void activate()}>
            确认激活
          </button>
        )}
      </div>
      {drafts.length > 0 && (
        <p>
          已有草稿：{' '}
          {drafts.map((candidate) => (
            <button
              key={candidate.policyVersion}
              type="button"
              className="text-button"
              onClick={() => void openDraft(candidate.policyVersion)}
            >
              {candidate.policyVersion}
            </button>
          ))}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {!draft && <p>尚未打开 Catalog 草稿。创建草稿后编辑不会影响当前活动版本。</p>}
      {draft && (
        <>
          <p>
            草稿版本 <strong>{draft.policyVersion}</strong> · 修订 {draft.revision}
          </p>
          <DraftItems
            title="能力目录"
            kind="capabilities"
            items={draft.capabilities}
            onUpdate={(...args) => void update(...args)}
          />
          <DraftItems
            title="服务模板"
            kind="templates"
            items={draft.templates}
            onUpdate={(...args) => void update(...args)}
          />
          {preview?.changes && (
            <div className="detail-card" aria-label="草稿差异">
              <h2>相对当前有效版本的差异</h2>
              {preview.changes.length === 0 ? (
                <p>没有检测到字段差异。</p>
              ) : (
                <ul>
                  {preview.changes.map((change, index) => (
                    <li key={`${change.entityId}-${change.field}-${index}`}>
                      {change.entityId}.{change.field}: {String(change.before)} →{' '}
                      {String(change.after)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function responseMessage(status: number, fallback: string): string {
  if (status === 401) return 'Session 已失效，请重新登录。';
  if (status === 403) return '当前账户没有执行此操作的权限。';
  if (status === 404) return '草稿不存在或已失效。';
  if (status === 409) return '草稿已被其他操作更新，请重新加载。';
  return fallback;
}

function DraftItems({
  title,
  kind,
  items,
  onUpdate,
}: {
  title: string;
  kind: 'capabilities' | 'templates';
  items: readonly Item[];
  onUpdate: (
    kind: 'capabilities' | 'templates',
    item: Item,
    change: {
      readonly status?: string;
      readonly riskTier?: string;
      readonly creatorSelectable?: boolean;
      readonly publishEnabled?: boolean;
    },
  ) => void;
}) {
  return (
    <div className="data-table-wrap">
      <h2>{title}</h2>
      <table>
        <thead>
          <tr>
            <th>名称</th>
            <th>状态</th>
            <th>风险</th>
            <th>可选 / 可发布</th>
            <th>草稿操作</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                {item.name}
                <small>{item.id}</small>
              </td>
              <td>{item.status}</td>
              <td>{item.riskTier}</td>
              <td>
                <label>
                  <input
                    type="checkbox"
                    checked={item.creatorSelectable !== false}
                    onChange={(event) =>
                      void onUpdate(kind, item, { creatorSelectable: event.target.checked })
                    }
                  />
                  可选
                </label>{' '}
                <label>
                  <input
                    type="checkbox"
                    checked={item.publishEnabled !== false}
                    onChange={(event) =>
                      void onUpdate(kind, item, { publishEnabled: event.target.checked })
                    }
                  />
                  可发布
                </label>
              </td>
              <td>
                <select
                  value={item.status}
                  onChange={(event) => void onUpdate(kind, item, { status: event.target.value })}
                >
                  <option value="draft">draft</option>
                  <option value="active">active</option>
                  <option value="paused">paused</option>
                  <option value="retired">retired</option>
                </select>
                <select
                  value={item.riskTier}
                  onChange={(event) => void onUpdate(kind, item, { riskTier: event.target.value })}
                >
                  <option value="low">low</option>
                  <option value="review">review</option>
                  <option value="prohibited">prohibited</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
