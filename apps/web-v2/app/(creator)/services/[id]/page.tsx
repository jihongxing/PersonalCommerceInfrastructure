'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  useServiceOffering,
  usePublishService,
  useUnpublishService,
} from '@/features/creator-onboarding/api/use-creator-services';
import { FileText, Edit2, AlertCircle } from 'lucide-react';
import { PublishChecklist } from '@/features/creator-onboarding/components/publish-checklist';

export default function ServiceDetailPage() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const { data: service, isLoading, isError, refetch } = useServiceOffering(params.id);
  const publishMutation = usePublishService(params.id);
  const unpublishMutation = useUnpublishService(params.id);

  // 检查发布前的条件
  const canPublish =
    !!service?.title &&
    !!service?.description &&
    service?.capabilityIds &&
    service.capabilityIds.length > 0 &&
    !!service?.availabilityDescription &&
    !!service?.requestInstructions;

  async function handlePublish() {
    if (!canPublish) {
      toast({
        title: '错误',
        description: '请完成所有必填项后再发布',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm('确定要发布此服务吗？发布后消费者将可以搜索和预约。')) {
      return;
    }

    try {
      await publishMutation.mutateAsync();
      toast({
        title: '成功',
        description: '服务已发布',
      });
    } catch (error) {
      toast({
        title: '错误',
        description:
          error instanceof Error ? error.message : '发布失败，请重试',
        variant: 'destructive',
      });
    }
  }

  async function handleUnpublish() {
    if (!confirm('确定要下架此服务吗？下架后消费者将无法看到此服务。')) {
      return;
    }

    try {
      await unpublishMutation.mutateAsync();
      toast({
        title: '成功',
        description: '服务已下架',
      });
    } catch (error) {
      toast({
        title: '错误',
        description:
          error instanceof Error ? error.message : '下架失败，请重试',
        variant: 'destructive',
      });
    }
  }

  if (isLoading) {
    return (
      <div className="py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (isError) {
    return <div role="alert" className="py-8 space-y-3"><p>服务加载失败，请重试。</p><Button variant="outline" onClick={() => refetch()}>重试</Button></div>;
  }

  if (!service) {
    return (
      <div className="py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">服务未找到</p>
            <Link href="/services" className="mt-4 block">
              <Button variant="outline">返回服务列表</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{service.title}</h1>
          <Badge className="mt-2" variant={service.state === 'published' ? 'default' : service.state === 'draft' ? 'secondary' : 'outline'}>
            {service.state === 'published'
              ? '已发布'
              : service.state === 'draft'
                ? '草稿'
                : '已下架'}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Link href={`/services/${service.id}/edit`}>
            <Button variant="outline">
              <Edit2 className="w-4 h-4 mr-2" />
              编辑
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">服务描述</p>
              <p className="whitespace-pre-wrap mt-1">{service.description}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">可用性</p>
              <p className="whitespace-pre-wrap mt-1">
                {service.availabilityDescription}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">预约要求</p>
              <p className="whitespace-pre-wrap mt-1">
                {service.requestInstructions}
              </p>
            </div>

            {service.appearance?.priceRangeMin !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground">价格范围</p>
                <p className="mt-1">
                  {service.appearance.currency || 'CNY'} {service.appearance.priceRangeMin} -{' '}
                  {service.appearance.priceRangeMax}
                </p>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground">关联能力</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {service.capabilityIds?.map((id: string) => (
                  <Badge key={id} variant="outline">
                    {id.substring(0, 8)}...
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 发布前检查清单 */}
        {(service.state === 'draft' || service.state === 'unpublished') && <PublishChecklist service={service} />}

        {/* 发布状态和操作 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">发布状态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(service.state === 'draft' || service.state === 'unpublished') && (
                <>
                  <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-700">
                      此服务还未发布。消费者无法看到。发布后，消费者将能够发现和预约此服务。
                    </p>
                  </div>

                  <Button
                    onClick={handlePublish}
                    disabled={!canPublish || publishMutation.isPending}
                    className="w-full"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {publishMutation.isPending ? '发布中...' : '发布服务'}
                  </Button>

                  {!canPublish && (
                    <p className="text-xs text-muted-foreground text-center">
                      请完成上面的检查清单后再发布
                    </p>
                  )}
                </>
              )}

              {service.state === 'published' && (
                <>
                  <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded">
                    <div className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5">✓</div>
                    <p className="text-sm text-green-700">
                      此服务已发布。消费者可以搜索并预约此服务。
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleUnpublish}
                    disabled={unpublishMutation.isPending}
                    className="w-full text-destructive"
                  >
                    {unpublishMutation.isPending ? '下架中...' : '下架服务'}
                  </Button>
                </>
              )}

              {service.state === 'archived' && (
                <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded">
                  <AlertCircle className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">
                    此服务已下架。消费者无法看到。已有的预约仍会保留。
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 返回按钮 */}
        <div>
          <Link href="/services">
            <Button variant="outline">返回服务列表</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
