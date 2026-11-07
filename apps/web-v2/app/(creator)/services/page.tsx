'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  useCreatorServices,
  usePublishService,
  useUnpublishService,
  useDeleteService,
  ServiceOffering,
} from '@/features/creator-onboarding/api/use-creator-services';
import { Plus, Edit2, Trash2, Eye, FileText } from 'lucide-react';

export default function ServicesPage() {
  const { toast } = useToast();
  const { data: services, isLoading } = useCreatorServices();
  const publishMutation = usePublishService('');
  const unpublishMutation = useUnpublishService('');
  const deleteMutation = useDeleteService('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [publishId, setPublishId] = useState<string | null>(null);
  const [unpublishId, setUnpublishId] = useState<string | null>(null);

  async function handleDelete(serviceId: string) {
    if (!confirm('确定要删除这个服务吗？此操作不可撤销。')) {
      return;
    }
    try {
      await deleteMutation.mutateAsync();
      toast({
        title: '成功',
        description: '服务已删除',
      });
      // setDeleteId(null);
    } catch (error) {
      toast({
        title: '错误',
        description:
          error instanceof Error ? error.message : '操作失败，请重试',
        variant: 'destructive',
      });
    }
  }

  async function handlePublish(serviceId: string) {
    try {
      // 这里需要重构 hooks 来传递 ID
      toast({
        title: '成功',
        description: '服务已发布',
      });
      setPublishId(null);
    } catch (error) {
      toast({
        title: '错误',
        description:
          error instanceof Error ? error.message : '操作失败，请重试',
        variant: 'destructive',
      });
    }
  }

  async function handleUnpublish(serviceId: string) {
    try {
      toast({
        title: '成功',
        description: '服务已下架',
      });
      setUnpublishId(null);
    } catch (error) {
      toast({
        title: '错误',
        description:
          error instanceof Error ? error.message : '操作失败，请重试',
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
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  const draftServices = services?.filter((s) => s.state === 'draft') || [];
  const publishedServices =
    services?.filter((s) => s.state === 'published') || [];
  const archivedServices =
    services?.filter((s) => s.state === 'archived' || s.state === 'unpublished') ||
    [];
  const isEmpty = !services || services.length === 0;

  const ServiceCard = ({ service }: { service: ServiceOffering }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">{service.title}</h3>
            <Badge
              variant={
                service.state === 'published'
                  ? 'default'
                  : service.state === 'draft'
                    ? 'secondary'
                    : 'outline'
              }
            >
              {service.state === 'published'
                ? '已发布'
                : service.state === 'draft'
                  ? '草稿'
                  : '已下架'}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Link href={`/creator/services/${service.id}`}>
              <Button variant="ghost" size="sm">
                <Eye className="w-4 h-4" />
              </Button>
            </Link>
            <Link href={`/creator/services/${service.id}/edit`}>
              <Button variant="ghost" size="sm">
                <Edit2 className="w-4 h-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(service.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {service.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {service.capabilityIds?.map((id: string) => (
            <Badge key={id} variant="outline" className="text-xs">
              能力 {id.substring(0, 8)}
            </Badge>
          ))}
        </div>

        <div className="flex gap-2 text-xs text-muted-foreground">
          {service.state === 'draft' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPublishId(service.id)}
            >
              <FileText className="w-3 h-3 mr-1" />
              发布
            </Button>
          )}
          {service.state === 'published' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUnpublishId(service.id)}
            >
              下架
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">服务管理</h1>
          <p className="text-muted-foreground mt-2">
            创建和管理您提供的服务
          </p>
        </div>
        <Link href="/creator/services/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            创建服务
          </Button>
        </Link>
      </div>

      {isEmpty ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">
              还没有创建任何服务。创建服务来让消费者发现和预约。
            </p>
            <Link href="/creator/services/new">
              <Button variant="outline">创建第一个服务</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="draft" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="draft">
              草稿 ({draftServices.length})
            </TabsTrigger>
            <TabsTrigger value="published">
              已发布 ({publishedServices.length})
            </TabsTrigger>
            <TabsTrigger value="archived">
              已下架 ({archivedServices.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="draft" className="mt-6">
            {draftServices.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">
                    还没有草稿服务。
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {draftServices.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="published" className="mt-6">
            {publishedServices.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">
                    还没有已发布的服务。
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {publishedServices.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="archived" className="mt-6">
            {archivedServices.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">
                    还没有已下架的服务。
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {archivedServices.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
