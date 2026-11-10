'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useCreatorCapabilities,
  useDeleteCapability,
} from '@/features/creator-onboarding/api/use-creator-capabilities';

export default function CapabilitiesPage() {
  const { data: capabilities, isLoading, isError, refetch } = useCreatorCapabilities();
  const remove = useDeleteCapability();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function deleteCapability(id: string) {
    setDeleteError(null);
    try {
      await remove.mutateAsync(id);
      setConfirmId(null);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : '删除失败，请重试。');
    }
  }

  return (
    <div className="creator-list-page">
      <header className="creator-page-heading">
        <div>
          <h1>能力</h1>
          <p>管理您提供服务所依赖的能力</p>
        </div>
        <Button asChild className="min-h-11">
          <Link href="/capabilities/new">
            <Plus aria-hidden="true" />
            添加能力
          </Link>
        </Button>
      </header>

      <section className="creator-list-surface" aria-labelledby="capabilities-heading">
        <div className="creator-list-heading">
          <h2 id="capabilities-heading">我的能力</h2>
          {!isLoading && !isError && <span>{capabilities?.length ?? 0} 项</span>}
        </div>
        {isLoading ? (
          <div className="space-y-4 py-5" aria-label="正在加载能力">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : isError ? (
          <div role="alert" className="space-y-3 py-5">
            <p>能力加载失败，请重试。</p>
            <Button variant="outline" onClick={() => void refetch()}>
              重试
            </Button>
          </div>
        ) : !capabilities?.length ? (
          <div className="space-y-4 py-5">
            <p className="text-sm text-muted-foreground">还没有添加能力。</p>
            <Button asChild variant="outline">
              <Link href="/capabilities/new">添加第一个能力</Link>
            </Button>
          </div>
        ) : (
          <ul className="creator-list-rows">
            {capabilities.map((capability) => (
              <li key={capability.id}>
                <h3>{capability.name}</h3>
                <p className="whitespace-pre-wrap">{capability.description}</p>
                {confirmId === capability.id ? (
                  <div className="mt-3 space-y-3">
                    <p>确定删除这项能力吗？已关联服务的能力不能删除。</p>
                    {deleteError && (
                      <p role="alert" className="text-destructive">
                        {deleteError}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="destructive"
                        disabled={remove.isPending}
                        onClick={() => void deleteCapability(capability.id)}
                      >
                        确认删除
                      </Button>
                      <Button
                        variant="outline"
                        disabled={remove.isPending}
                        onClick={() => {
                          setConfirmId(null);
                          setDeleteError(null);
                        }}
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/capabilities/${encodeURIComponent(capability.id)}/edit`}>
                        <Pencil aria-hidden="true" />
                        编辑<span className="sr-only">{capability.name}</span>
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setConfirmId(capability.id);
                        setDeleteError(null);
                      }}
                    >
                      <Trash2 aria-hidden="true" />
                      删除<span className="sr-only">{capability.name}</span>
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
