'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCreatorCapabilities } from '@/features/creator-onboarding/api/use-creator-capabilities';
import { Plus } from 'lucide-react';

export default function CapabilitiesPage() {
  const { data: capabilities, isLoading, isError, refetch } = useCreatorCapabilities();

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="mb-6">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  const isEmpty = !capabilities || capabilities.length === 0;

  return (
    <div className="py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">能力管理</h1>
          <p className="text-muted-foreground mt-2">
            管理您的专业能力和特长
          </p>
        </div>
        <Link href="/capabilities/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            添加能力
          </Button>
        </Link>
      </div>

      {isError ? (
        <div role="alert" className="space-y-3"><p>能力加载失败，请重试。</p><Button variant="outline" onClick={() => refetch()}>重试</Button></div>
      ) : isEmpty ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">
              还没有添加任何能力。添加能力来帮助消费者了解您的专长。
            </p>
            <Link href="/capabilities/new">
              <Button variant="outline">添加第一个能力</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="max-w-4xl mx-auto space-y-4">
          {capabilities.map((capability) => (
            <Card key={capability.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">
                      {capability.name}
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {capability.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
