'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StableSharingTools } from '@/components/commerce/stable-sharing-tools';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/context';
import { homepageUrl } from '@/lib/public-homepage';
import { copyText } from '@/lib/copy-text';

type ApiErrorResponse = { error?: { message?: string } };
type ApiResponse<T> = { data: T | null; error: ApiErrorResponse | null };
type IdentityResponse = {
  profile: { displayName: string; bio: string };
};
type ReferenceResponse = {
  assignmentStatus: 'ASSIGNED' | 'PENDING';
  displayValue: string;
};
type HomepageState = 'UNPUBLISHED' | 'PUBLISHED' | 'PAUSED';
type HomepageSummary = {
  configuration: {
    state: HomepageState;
    commerceProfile: { id: string; displayName: string; lifecycle: string } | null;
  };
  activeHomepageId: string | null;
  defaultHomepageId: string | null;
  nextSwitchAt: string | null;
};

function homepageStateLabel(state: HomepageState): string {
  return { UNPUBLISHED: '未发布', PUBLISHED: '已发布', PAUSED: '已暂停' }[state];
}

async function loadWorkspace(): Promise<{ name: string; complete: boolean }> {
  const initialized = (await apiClient.POST(
    '/api/v1/auth/workspace/initialize',
  )) as ApiResponse<unknown>;
  if (initialized.error) throw new Error(initialized.error.error?.message || '身份初始化失败');
  const { data, error } = (await apiClient.GET(
    '/api/v1/creator/identity',
  )) as ApiResponse<IdentityResponse>;
  if (error || !data) throw new Error(error?.error?.message || '无法加载商业身份');
  return {
    name: data.profile.displayName,
    complete: Boolean(data.profile.displayName.trim() && data.profile.bio.trim()),
  };
}

async function loadReference(): Promise<string> {
  const result = (await apiClient.GET(
    '/api/v1/private/identity/reference',
  )) as ApiResponse<ReferenceResponse>;
  if (result.error || !result.data)
    throw new Error(result.error?.error?.message || '无法加载 C 号');
  if (result.data.assignmentStatus !== 'ASSIGNED') throw new Error('C 号尚未分配，请重试初始化');
  return result.data.displayValue;
}

async function loadHomepageSummary(): Promise<HomepageSummary> {
  const result = (await apiClient.GET('/api/v1/private/homepages')) as ApiResponse<HomepageSummary>;
  if (result.error || !result.data) {
    throw new Error(result.error?.error?.message || '无法加载对外主页状态');
  }
  return result.data;
}

function HomepageSummaryCard({ reference }: { reference?: string }) {
  const query = useQuery({
    queryKey: ['homepage-summary', reference],
    queryFn: loadHomepageSummary,
    retry: false,
  });
  const [message, setMessage] = useState('');
  const url = homepageUrl(reference ?? '');
  const state = query.data?.configuration.state;
  const profile = query.data?.configuration.commerceProfile;

  return (
    <section className="dashboard-panel" aria-labelledby="homepage-summary-heading">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">当前对外状态</p>
          <h2 id="homepage-summary-heading" className="mt-1 text-xl font-semibold">
            对外主页
          </h2>
        </div>
        {state && (
          <span className="rounded-md border px-2 py-1 text-sm">{homepageStateLabel(state)}</span>
        )}
      </div>
      {query.isPending ? (
        <p className="mt-4 text-sm text-muted-foreground">正在加载主页状态...</p>
      ) : query.isError || !query.data ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p role="alert" className="text-sm text-destructive">
            对外主页状态加载失败，资料、能力和服务仍可继续管理。
          </p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            <RotateCw className="mr-2 h-4 w-4" />
            重试
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground">当前公开资料</p>
              <p className="mt-1 font-medium">{profile?.displayName || '尚未选择公开资料'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">下一次切换</p>
              <p className="mt-1 font-medium">
                {query.data.nextSwitchAt
                  ? new Intl.DateTimeFormat('zh-CN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(query.data.nextSwitchAt))
                  : '暂无计划切换'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">稳定公开地址</p>
              <p className="mt-1 break-all font-mono text-xs">{url || '地址尚未配置'}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/profile?tab=public">
                主页设置 <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {url && (
              <Button asChild variant="outline">
                <Link href={url} target="_blank" rel="noreferrer">
                  打开主页 <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
            {url && (
              <Button
                variant="outline"
                onClick={() =>
                  void copyText(url).then((copied) =>
                    setMessage(copied ? '链接已复制' : '复制失败，请手动复制链接'),
                  )
                }
              >
                复制链接
              </Button>
            )}
          </div>
          {message && (
            <p className="mt-3 text-sm" role="status">
              {message}
            </p>
          )}
        </>
      )}
    </section>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const workspace = useQuery({
    queryKey: ['workspace', user?.email],
    queryFn: loadWorkspace,
    retry: false,
  });
  const reference = useQuery({
    queryKey: ['identity-reference', user?.email],
    queryFn: loadReference,
    enabled: workspace.isSuccess,
    retry: false,
  });

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Creator Studio</p>
        <h1 className="mt-2 text-3xl font-semibold">工作台</h1>
        <p className="mt-2 text-sm text-muted-foreground">已登录：{user?.email}</p>
        {reference.data && (
          <p className="mt-2 text-sm">
            C 号：<span className="font-mono">{reference.data}</span>
          </p>
        )}
        {reference.isError && (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p role="alert" className="text-sm text-destructive">
              C 号加载失败
            </p>
            <Button variant="outline" onClick={() => void reference.refetch()}>
              <RotateCw className="mr-2 h-4 w-4" />
              重试
            </Button>
          </div>
        )}
      </div>
      <HomepageSummaryCard reference={reference.data} />
      <StableSharingTools reference={reference.data} />
      <section className="dashboard-panel" aria-labelledby="start-heading">
        <h2 id="start-heading" className="text-xl font-semibold">
          开始使用
        </h2>
        <div className="mt-4 divide-y border-y">
          <div className="flex flex-wrap items-center justify-between gap-4 py-5">
            <div>
              <h3 className="font-medium">01 完善商业资料</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {workspace.isPending
                  ? '正在加载商业身份'
                  : workspace.isError
                    ? `加载失败：${workspace.error.message}`
                    : workspace.data.complete
                      ? `商业身份：${workspace.data.name}`
                      : '商业身份已创建，请补充名称和简介'}
              </p>
            </div>
            {workspace.isError ? (
              <Button
                variant="outline"
                onClick={() => {
                  void workspace.refetch();
                }}
              >
                <RotateCw className="mr-2 h-4 w-4" />
                重试
              </Button>
            ) : workspace.data ? (
              <Button asChild variant="outline">
                <Link href={workspace.data.complete ? '/profile' : '/profile/edit'}>
                  {workspace.data.complete ? '管理资料' : '完善资料'}{' '}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 py-5">
            <div>
              <h3 className="font-medium">02 补充能力</h3>
              <p className="mt-1 text-sm text-muted-foreground">添加您提供的专业能力</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/capabilities">
                管理能力 <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 py-5">
            <div>
              <h3 className="font-medium">03 创建并发布服务</h3>
              <p className="mt-1 text-sm text-muted-foreground">创建服务并管理发布状态</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/services">
                管理服务 <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
      <section className="dashboard-panel" aria-labelledby="requests-heading">
        <h2 id="requests-heading" className="text-xl font-semibold">
          请求审核
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">查看待处理和已确认的请求</p>
        <Button asChild className="mt-4">
          <Link href="/requests">
            查看请求 <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>
    </div>
  );
}
