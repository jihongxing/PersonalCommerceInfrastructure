'use client';

import { useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ExternalLink, RotateCw, Trash2 } from 'lucide-react';
import { StableSharingTools } from '@/components/commerce/stable-sharing-tools';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api/client';
import { homepageUrl, type PublicHomepage } from '@/lib/public-homepage';
import type { CreatorReferenceResponse } from '@/lib/creator-reference';

type Lifecycle = 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
type Profile = { commerceProfileId: string; displayName: string; lifecycle: Lifecycle };
type Configuration = {
  state: 'UNPUBLISHED' | 'PUBLISHED' | 'PAUSED';
  commerceProfileId: string | null;
  commerceProfile: { id: string; displayName: string; lifecycle: Lifecycle } | null;
};
type Version = {
  homepageId: string;
  identityId: string;
  commerceProfileId: string | null;
  state: 'UNPUBLISHED' | 'PUBLISHED' | 'PAUSED' | 'ARCHIVED';
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  commerceProfile: { id: string; displayName: string; lifecycle: Lifecycle } | null;
};
type Window = {
  windowId: string;
  identityId: string;
  homepageId: string;
  startsAt: string;
  endsAt: string;
  timeZone: string;
  state: 'ENABLED' | 'DISABLED';
  createdAt: string;
  updatedAt: string;
};
type Management = {
  configuration: Configuration;
  versions: Version[];
  windows: Window[];
  activeHomepageId: string | null;
  defaultHomepageId: string | null;
  nextSwitchAt: string | null;
};
type ApiResponse<T> = {
  data: T | null;
  error: { error?: { message?: string; code?: string }; message?: string } | null;
};

async function loadManagement(): Promise<{
  management: Management;
  profiles: Profile[];
  reference?: string;
}> {
  const [management, profiles, reference] = await Promise.all([
    apiClient.GET('/api/v1/private/homepages') as Promise<ApiResponse<Management>>,
    apiClient.GET('/api/v1/private/profiles') as Promise<ApiResponse<{ profiles: Profile[] }>>,
    apiClient.GET('/api/v1/private/identity/reference') as Promise<
      ApiResponse<CreatorReferenceResponse>
    >,
  ]);
  if (
    management.error ||
    profiles.error ||
    reference.error ||
    !management.data ||
    !profiles.data ||
    !reference.data ||
    (reference.data?.assignmentStatus !== 'ASSIGNED' &&
      reference.data?.assignmentStatus !== 'NOT_ASSIGNED')
  )
    throw new Error(
      management.error?.error?.message ||
        profiles.error?.error?.message ||
        reference.error?.error?.message ||
        '无法加载主页设置',
    );
  return {
    management: management.data,
    profiles: profiles.data.profiles,
    reference:
      reference.data.assignmentStatus === 'ASSIGNED' ? reference.data.displayValue : undefined,
  };
}

function formatInstant(value: string | null): string {
  if (!value) return '暂无计划切换';
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
}

function instantToZonedLocal(value: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(
    parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

function statusLabel(state: Version['state']): string {
  return { UNPUBLISHED: '草稿', PUBLISHED: '已发布', PAUSED: '已暂停', ARCHIVED: '已归档' }[state];
}

export function HomepageManagement({ reference }: { reference?: string }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['homepage-management', reference],
    queryFn: loadManagement,
    retry: false,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState('');
  const [name, setName] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [timeZone, setTimeZone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  );
  const [windowState, setWindowState] = useState<'ENABLED' | 'DISABLED'>('ENABLED');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<PublicHomepage | null>(null);
  const [previewAt, setPreviewAt] = useState('');
  const [editingWindowId, setEditingWindowId] = useState<string | null>(null);
  const data = query.data;
  const url = homepageUrl(data?.reference ?? reference ?? '');
  const selected = useMemo(
    () =>
      data?.management.versions.find((version) => version.homepageId === selectedId) ??
      data?.management.versions[0],
    [data, selectedId],
  );
  const activeVersion = useMemo(
    () =>
      data?.management.versions.find(
        (version) => version.homepageId === data.management.activeHomepageId,
      ),
    [data],
  );
  const selectedWindows =
    data?.management.windows.filter((window) => window.homepageId === selected?.homepageId) ?? [];

  function selectVersion(homepageId: string) {
    setSelectedId(homepageId);
    setPreview(null);
    setMessage('');
    setEditingWindowId(null);
    setStart('');
    setEnd('');
    setWindowState('ENABLED');
  }

  async function action<T>(
    path: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    body?: object,
  ): Promise<T | null> {
    setBusy(true);
    setMessage('');
    try {
      const result = await (apiClient[method](path, body ? { body } : undefined) as Promise<
        ApiResponse<T>
      >);
      if (result.error || (method !== 'DELETE' && !result.data))
        throw new Error(
          result.error?.error?.message || result.error?.message || '操作失败，请重试',
        );
      if (method !== 'GET')
        await queryClient.invalidateQueries({ queryKey: ['homepage-management'] });
      return result.data;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '操作失败，请重试');
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function createVersion(event: FormEvent) {
    event.preventDefault();
    if (!profileId) return;
    const created = await action<Version>('/api/v1/private/homepages', 'POST', { profileId });
    if (created) {
      setSelectedId(created.homepageId);
      setProfileId('');
    }
  }

  async function createWindow(event: FormEvent) {
    event.preventDefault();
    if (!selected || !start || !end) return;
    const path = editingWindowId
      ? `/api/v1/private/homepage-windows/${encodeURIComponent(editingWindowId)}`
      : `/api/v1/private/homepages/${encodeURIComponent(selected.homepageId)}/windows`;
    const method = editingWindowId ? 'PATCH' : 'POST';
    const result = await action<Window>(path, method, {
      startsAt: start,
      endsAt: end,
      timeZone,
      ...(editingWindowId ? { state: windowState } : {}),
    });
    if (result) {
      setStart('');
      setEnd('');
      setWindowState('ENABLED');
      setEditingWindowId(null);
    }
  }

  async function createProfile(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    const result = await action<Profile>('/api/v1/private/profiles', 'POST', {
      displayName: name.trim(),
    });
    if (result) setName('');
  }

  async function previewHomepage(at?: string) {
    if (!selected) return;
    setPreview(null);
    const query = at ? `?at=${encodeURIComponent(at)}` : '';
    const value = await action<PublicHomepage>(
      `/api/v1/private/homepages/${selected.homepageId}/preview${query}`,
      'GET',
    );
    if (value) setPreview(value);
  }

  async function previewScheduledHomepage(event: FormEvent) {
    event.preventDefault();
    if (!previewAt) return;
    setPreview(null);
    const value = await action<PublicHomepage>(
      `/api/v1/private/homepages/resolve-preview?at=${encodeURIComponent(previewAt)}`,
      'GET',
    );
    if (value) setPreview(value);
  }

  const profileName = activeVersion?.commerceProfile?.displayName || '暂无激活主页';
  return (
    <section aria-labelledby="homepage-heading">
      <div>
        <h2 id="homepage-heading" className="text-xl font-semibold">
          对外主页
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          管理访客通过稳定 C 号地址看到的资料、服务和自动切换安排。
        </p>
      </div>
      {query.isPending ? (
        <p className="mt-3 text-sm">正在加载主页设置...</p>
      ) : query.isError || !data ? (
        <div className="mt-3">
          <p role="alert" className="text-sm text-destructive">
            主页设置加载失败
          </p>
          <Button className="mt-3" variant="outline" onClick={() => void query.refetch()}>
            <RotateCw className="mr-2 h-4 w-4" />
            重试
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-5">
          <article className="rounded-lg border p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">当前激活主页</p>
                <h3 className="mt-1 text-lg font-semibold">{profileName}</h3>
              </div>
              <span className="rounded-md border px-2 py-1 text-sm">
                {activeVersion ? statusLabel(activeVersion.state) : '未激活'}
              </span>
            </div>
            <div className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-muted-foreground">默认主页</p>
                <p className="mt-1 font-medium">
                  {data.management.defaultHomepageId
                    ? data.management.versions.find(
                        (v) => v.homepageId === data.management.defaultHomepageId,
                      )?.commerceProfile?.displayName || '已设置'
                    : '未设置'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">下一次切换</p>
                <p className="mt-1 font-medium">{formatInstant(data.management.nextSwitchAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">稳定公开地址</p>
                {url ? (
                  <Link className="mt-1 block break-all font-mono text-xs underline" href={url}>
                    {url}
                  </Link>
                ) : (
                  <p role="alert" className="mt-1 text-destructive">
                    地址尚未配置
                  </p>
                )}
              </div>
            </div>
            {selected && (
              <p className="mt-5 text-sm font-medium">
                管理的方案：{selected.commerceProfile?.displayName || '未选择资料'}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              {selected && (
                <>
                  <Button
                    variant="outline"
                    disabled={busy || selected.state !== 'PUBLISHED'}
                    onClick={() => void previewHomepage()}
                  >
                    预览
                  </Button>
                  <Button
                    variant="outline"
                    disabled={busy || selected.state === 'ARCHIVED'}
                    onClick={() =>
                      void action<Version>(
                        `/api/v1/private/homepages/${selected.homepageId}/${selected.state === 'PUBLISHED' ? 'pause' : 'publish'}`,
                        'POST',
                      )
                    }
                  >
                    {selected.state === 'PUBLISHED' ? '暂停主页' : '发布主页'}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={busy || selected.state !== 'PUBLISHED' || selected.isDefault}
                    onClick={() =>
                      void action<Version>(
                        `/api/v1/private/homepages/${selected.homepageId}/default`,
                        'POST',
                      )
                    }
                  >
                    {selected.isDefault ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        默认主页
                      </>
                    ) : (
                      '设为默认'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={busy || selected.state === 'ARCHIVED'}
                    onClick={() =>
                      void action<Version>(
                        `/api/v1/private/homepages/${selected.homepageId}/archive`,
                        'POST',
                      )
                    }
                  >
                    归档版本
                  </Button>
                </>
              )}
              {url && (
                <Button asChild variant="outline">
                  <Link href={url} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    打开主页
                  </Link>
                </Button>
              )}
            </div>
            {data.management.versions.some((version) => version.state === 'PUBLISHED') && (
              <form
                className="mt-3 flex max-w-xl flex-wrap items-end gap-2"
                onSubmit={(event) => {
                  void previewScheduledHomepage(event);
                }}
              >
                <div className="min-w-56 flex-1">
                  <label className="text-sm font-medium" htmlFor="homepage-preview-at">
                    指定预览时间（UTC）
                  </label>
                  <Input
                    id="homepage-preview-at"
                    className="mt-1"
                    type="datetime-local"
                    value={previewAt}
                    onChange={(event) => setPreviewAt(event.target.value)}
                    required
                  />
                </div>
                <Button variant="outline" disabled={busy || !previewAt}>
                  按时间预览
                </Button>
              </form>
            )}
          </article>

          <section aria-labelledby="homepage-versions-heading">
            <div>
              <h3 id="homepage-versions-heading" className="text-base font-semibold">
                公开方案
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                同一时间最多公开一个已发布版本；没有命中窗口时使用默认主页。
              </p>
            </div>
            <div className="mt-3 divide-y rounded-md border">
              {data.management.versions.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">尚未创建主页版本</p>
              ) : (
                data.management.versions.map((version) => (
                  <button
                    type="button"
                    key={version.homepageId}
                    disabled={busy}
                    aria-pressed={selected?.homepageId === version.homepageId}
                    className={`flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left ${selected?.homepageId === version.homepageId ? 'bg-muted/50' : ''}`}
                    onClick={() => selectVersion(version.homepageId)}
                  >
                    <span>
                      <span className="block font-medium">
                        {version.commerceProfile?.displayName || '未选择资料'}
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {statusLabel(version.state)}
                        {version.isDefault ? ' · 默认' : ''}
                        {version.homepageId === data.management.activeHomepageId
                          ? ' · 当前激活'
                          : ''}
                      </span>
                    </span>
                    <span className="text-sm text-muted-foreground">选择管理</span>
                  </button>
                ))
              )}
            </div>
          </section>

          <form
            className="flex max-w-xl flex-wrap gap-2"
            onSubmit={(event) => {
              void createVersion(event);
            }}
          >
            <label className="sr-only" htmlFor="homepage-profile">
              选择资料创建主页版本
            </label>
            <select
              id="homepage-profile"
              className="h-11 min-w-48 rounded-md border bg-background px-3 text-sm"
              value={profileId}
              onChange={(event) => setProfileId(event.target.value)}
            >
              <option value="">选择公开资料</option>
              {data.profiles
                .filter((profile) => profile.lifecycle === 'ACTIVE')
                .map((profile) => (
                  <option key={profile.commerceProfileId} value={profile.commerceProfileId}>
                    {profile.displayName}
                  </option>
                ))}
            </select>
            <Button variant="outline" disabled={busy || !profileId}>
              创建主页版本
            </Button>
          </form>

          {selected && (
            <section className="space-y-3" aria-labelledby="window-heading">
              <div>
                <h3 id="window-heading" className="text-base font-semibold">
                  自动切换
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  使用指定时区创建未来窗口，时间保存为 UTC。窗口不能重叠。
                </p>
              </div>
              <div className="divide-y rounded-md border">
                {selectedWindows.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">此版本没有时间窗口</p>
                ) : (
                  selectedWindows.map((window) => (
                    <div
                      key={window.windowId}
                      className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm"
                    >
                      <span>
                        <span className="block font-medium">
                          {formatInstant(window.startsAt)} 至 {formatInstant(window.endsAt)}
                        </span>
                        <span className="text-muted-foreground">
                          {window.timeZone} · {window.state === 'ENABLED' ? '已启用' : '已禁用'}
                        </span>
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={() => {
                            setEditingWindowId(window.windowId);
                            setStart(instantToZonedLocal(window.startsAt, window.timeZone));
                            setEnd(instantToZonedLocal(window.endsAt, window.timeZone));
                            setTimeZone(window.timeZone);
                            setWindowState(window.state);
                          }}
                        >
                          编辑
                        </Button>
                        {window.state === 'ENABLED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={busy}
                            onClick={() =>
                              void action<void>(
                                `/api/v1/private/homepage-windows/${window.windowId}`,
                                'DELETE',
                              )
                            }
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            禁用
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <form
                className="grid gap-2 sm:grid-cols-5"
                onSubmit={(event) => {
                  void createWindow(event);
                }}
              >
                <Input
                  aria-label="开始时间"
                  type="datetime-local"
                  value={start}
                  onChange={(event) => setStart(event.target.value)}
                  required
                />
                <Input
                  aria-label="结束时间"
                  type="datetime-local"
                  value={end}
                  onChange={(event) => setEnd(event.target.value)}
                  required
                />
                <Input
                  aria-label="IANA 时区"
                  value={timeZone}
                  onChange={(event) => setTimeZone(event.target.value)}
                  placeholder="Asia/Shanghai"
                  required
                />
                <select
                  aria-label="窗口状态"
                  className="h-11 rounded-md border bg-background px-3 text-sm"
                  value={windowState}
                  onChange={(event) => setWindowState(event.target.value as 'ENABLED' | 'DISABLED')}
                  disabled={!editingWindowId}
                >
                  <option value="ENABLED">已启用</option>
                  <option value="DISABLED">已禁用</option>
                </select>
                <div className="flex gap-2">
                  <Button disabled={busy || selected.state !== 'PUBLISHED'}>
                    {editingWindowId ? '保存窗口' : '添加窗口'}
                  </Button>
                  {editingWindowId && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busy}
                      onClick={() => {
                        setEditingWindowId(null);
                        setStart('');
                        setEnd('');
                        setWindowState('ENABLED');
                      }}
                    >
                      取消
                    </Button>
                  )}
                </div>
              </form>
            </section>
          )}

          <div>
            <h3 className="text-base font-semibold">公开资料</h3>
            <div className="mt-3 divide-y rounded-md border">
              {data.profiles.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">尚未创建资料</p>
              ) : (
                data.profiles.map((profile) => (
                  <div
                    key={profile.commerceProfileId}
                    className="flex flex-wrap items-center justify-between gap-3 p-4"
                  >
                    <span>
                      <span className="block font-medium">{profile.displayName}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {profile.lifecycle === 'ACTIVE'
                          ? '有效'
                          : profile.lifecycle === 'SUSPENDED'
                            ? '已停用'
                            : '已归档'}
                      </span>
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
          <form
            className="flex max-w-md flex-wrap gap-2"
            onSubmit={(event) => {
              void createProfile(event);
            }}
          >
            <label className="sr-only" htmlFor="new-public-profile">
              公开资料名称
            </label>
            <Input
              id="new-public-profile"
              className="min-w-0 flex-1"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="新的公开资料名称"
              maxLength={120}
              required
            />
            <Button variant="outline" disabled={busy}>
              创建资料
            </Button>
          </form>
          {preview && (
            <div className="rounded-md border-l-2 pl-4" aria-live="polite">
              <p className="text-sm text-muted-foreground">这是“{preview.displayName}”的主页预览</p>
              <p className="mt-2 text-sm">
                {preview.offerings.length
                  ? preview.offerings.map((item) => item.title).join('、')
                  : '尚无服务'}
              </p>
            </div>
          )}
          <StableSharingTools reference={data.reference} />
          {message && (
            <p role="status" className="text-sm">
              {message}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
