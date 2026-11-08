'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/context';

async function loadWorkspace(): Promise<{ name: string; complete: boolean }> {
  const initialized = await apiClient.POST('/api/v1/auth/workspace/initialize');
  if (initialized.error) throw new Error(initialized.error.error?.message || '身份初始化失败');
  const { data, error } = await apiClient.GET('/api/v1/creator/identity');
  if (error || !data) throw new Error(error?.error?.message || '无法加载商业身份');
  return { name: data.profile.displayName, complete: Boolean(data.profile.displayName.trim() && data.profile.bio.trim()) };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const workspace = useQuery({ queryKey: ['workspace', user?.email], queryFn: loadWorkspace, retry: false });

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10 space-y-10">
      <div>
        <p className="text-sm text-muted-foreground">Creator Studio</p>
        <h1 className="mt-2 text-3xl font-semibold">工作台</h1>
        <p className="mt-2 text-sm text-muted-foreground">已登录：{user?.email}</p>
      </div>
      <section className="border-t pt-6" aria-labelledby="start-heading">
        <h2 id="start-heading" className="text-xl font-semibold">开始使用</h2>
        <div className="mt-4 divide-y border-y">
          <div className="flex flex-wrap items-center justify-between gap-4 py-5">
            <div>
              <h3 className="font-medium">01 完善商业资料</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {workspace.isPending ? '正在加载商业身份' : workspace.isError ? `加载失败：${workspace.error.message}` : workspace.data.complete ? `商业身份：${workspace.data.name}` : '商业身份已创建，请补充名称和简介'}
              </p>
            </div>
            {workspace.isError ? <Button variant="outline" onClick={() => workspace.refetch()}><RotateCw className="mr-2 h-4 w-4" />重试</Button> : workspace.data ? <Button asChild variant="outline"><Link href={workspace.data.complete ? '/profile' : '/profile/edit'}>{workspace.data.complete ? '管理资料' : '完善资料'} <ArrowRight className="ml-2 h-4 w-4" /></Link></Button> : null}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 py-5">
            <div><h3 className="font-medium">02 补充能力</h3><p className="mt-1 text-sm text-muted-foreground">添加您提供的专业能力</p></div>
            <Button asChild variant="outline"><Link href="/capabilities">管理能力 <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 py-5">
            <div><h3 className="font-medium">03 创建并发布服务</h3><p className="mt-1 text-sm text-muted-foreground">创建服务并管理发布状态</p></div>
            <Button asChild variant="outline"><Link href="/services">管理服务 <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </div>
      </section>
      <section className="border-t pt-6" aria-labelledby="requests-heading">
        <h2 id="requests-heading" className="text-xl font-semibold">预约审核</h2>
        <p className="mt-2 text-sm text-muted-foreground">查看待处理和已确认的预约</p>
        <Button asChild className="mt-4"><Link href="/requests">查看预约 <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
      </section>
    </div>
  );
}
