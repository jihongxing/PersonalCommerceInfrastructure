'use client';

import { useMemo, useState } from 'react';
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 为待删除的服务创建 mutation
  const deleteMutation = useDeleteService(deletingId || '');

  // 使用 useMemo 优化分类计算
  const { draftServices, publishedServices, archivedServices } = useMemo(() => {
    return {
      draftServices: services?.filter((s) => s.state === 'draft') || [],
      publishedServices: services?.filter((s) => s.state === 'published') || [],
      archivedServices:
        services?.filter((s) => s.state === 'archived' || s.state === 'unpublished') || [],
    };
  }, [services]);

  async function handleDelete(serviceId: string) {
    if (!confirm('确定要删除这个服务吗？此操作不可撤销。')) {
      return;
    }
    try {
      setDeletingId(serviceId);
      await deleteMutation.mutateAsync();
      toast({
        title: '成功',
        description: '服务已删除',
      });
      setDeletingId(null);
    } catch (error) {
      toast({
        title: '错误',
        description:
          error instanceof Error ? error.message : '操作失败，请重试',
        variant: 'destructive',
      });
      setDeletingId(null);
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
            <span className="text-xs text-muted-foreground">
              编辑后可发布
            </span>
          )}
          {service.state === 'published' && (
            <span className="text-xs text-green-600">
              ✓ 已发布
            </span>
          )}
          {service.state === 'archived' && (
            <span className="text-xs text-gray-500">
              已下架
            </span>
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
              草稿 <Badge className="ml-2" variant="secondary">{draftServices.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="published">
              已发布 <Badge className="ml-2">{publishedServices.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="archived">
              已下架 <Badge className="ml-2" variant="outline">{archivedServices.length}</Badge>
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
