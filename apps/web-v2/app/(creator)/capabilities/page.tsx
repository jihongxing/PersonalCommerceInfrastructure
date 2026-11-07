'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  useCreatorCapabilities,
  useDeleteCapability,
} from '@/features/creator-onboarding/api/use-creator-capabilities';
import { Plus, Trash2 } from 'lucide-react';

export default function CapabilitiesPage() {
  const { toast } = useToast();
  const { data: capabilities, isLoading } = useCreatorCapabilities();
  const deleteMutation = useDeleteCapability();

  async function handleDelete(capabilityId: string) {
    if (!confirm('确定要删除这个能力吗？此操作不可撤销。')) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(capabilityId);
      toast({
        title: '成功',
        description: '能力已删除',
      });
      // setDeleteId(null);
    } catch (error) {
      toast({
        title: '错误',
        description:
          error instanceof Error ? error.message : '删除失败，请重试',
        variant: 'destructive',
      });
    }
  }

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
        <Link href="/creator/capabilities/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            添加能力
          </Button>
        </Link>
      </div>

      {isEmpty ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">
              还没有添加任何能力。添加能力来帮助消费者了解您的专长。
            </p>
            <Link href="/creator/capabilities/new">
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
                    <p className="text-xs text-muted-foreground mt-3">
                      添加于:{' '}
                      {new Date(capability.createdAt).toLocaleDateString(
                        'zh-CN'
                      )}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(capability.id)}
                    disabled={deleteMutation.isPending}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
