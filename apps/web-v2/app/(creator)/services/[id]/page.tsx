'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCreatorIdentity } from '@/features/creator-onboarding/api/use-creator-identity';
import {
  useServiceOffering,
  usePublishService,
  useUnpublishService,
  useDistributionAsset,
  useRecordDistribution,
} from '@/features/creator-onboarding/api/use-creator-services';
import { FileText, Edit2, AlertCircle } from 'lucide-react';
import { PublishChecklist } from '@/features/creator-onboarding/components/publish-checklist';

export default function ServiceDetailPage() {
  const params = useParams<{ id: string }>();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );
  const { data: service, isLoading, isError, refetch } = useServiceOffering(params.id);
  const identity = useCreatorIdentity();
  const publishMutation = usePublishService(params.id);
  const unpublishMutation = useUnpublishService(params.id);
  const asset = useDistributionAsset(params.id, service?.state === 'published');
  const distributionMutation = useRecordDistribution(params.id);

  async function handleDistribution() {
    if (!confirm('请确认您已经在外部渠道实际分发了此服务。确定记录吗？')) return;
    setFeedback(null);
    try {
      await distributionMutation.mutateAsync();
      setFeedback({ type: 'success', message: '已记录实际对外分发' });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : '记录失败，请重试',
      });
    }
  }

  // 检查发布前的条件
  const identityReady = Boolean(
    identity.data?.profile.displayName.trim() && identity.data?.profile.bio.trim(),
  );
  const canPublish =
    !identity.isPending &&
    !identity.isError &&
    identityReady &&
    !!service?.title &&
    !!service?.description &&
    service?.capabilityIds &&
    service.capabilityIds.length > 0 &&
    !!service?.availabilityDescription &&
    !!service?.requestInstructions &&
    !!service?.templateId &&
    (service.policyStatus === 'auto_approved' || service.policyStatus === 'approved');

  async function handlePublish() {
    if (!canPublish) {
      setFeedback({ type: 'error', message: '请完成所有必填项后再发布' });
      return;
    }

    if (!confirm('确定要发布此服务吗？发布后消费者将可以搜索并提交请求。')) {
      return;
    }

    setFeedback(null);
    try {
      await publishMutation.mutateAsync();
      setFeedback({ type: 'success', message: '服务已发布' });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : '发布失败，请重试',
      });
    }
  }

  async function handleUnpublish() {
    if (!confirm('确定要下架此服务吗？下架后消费者将无法看到此服务。')) {
      return;
    }

    setFeedback(null);
    try {
      await unpublishMutation.mutateAsync();
      setFeedback({ type: 'success', message: '服务已下架' });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : '下架失败，请重试',
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
    return (
      <div role="alert" className="py-8 space-y-3">
        <p>服务加载失败，请重试。</p>
        <Button variant="outline" onClick={() => refetch()}>
          重试
        </Button>
      </div>
    );
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
    <div className="creator-list-page">
      <div className="creator-page-heading">
        <div className="min-w-0">
          <h1 className="break-words">{service.title}</h1>
          <Badge
            className="mt-2"
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
          <Button asChild variant="outline" className="min-h-11">
            <Link href={`/services/${service.id}/edit`}>
              <Edit2 className="w-4 h-4 mr-2" />
              编辑
            </Link>
          </Button>
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
              <p className="whitespace-pre-wrap break-words mt-1">{service.description}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">可用性</p>
              <p className="whitespace-pre-wrap break-words mt-1">
                {service.availabilityDescription}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">请求要求</p>
              <p className="whitespace-pre-wrap break-words mt-1">{service.requestInstructions}</p>
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
            <div>
              <p className="text-sm text-muted-foreground">政策检查</p>
              <p className="mt-1">
                {service.policyStatus === 'approved' || service.policyStatus === 'auto_approved'
                  ? '已通过'
                  : service.policyStatus === 'review_required'
                    ? `等待平台审核${service.policyReason ? `：${service.policyReason}` : ''}`
                    : service.policyStatus === 'rejected'
                      ? `未通过${service.policyReason ? `：${service.policyReason}` : ''}`
                      : '待检查'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 发布前检查清单 */}
        {(service.state === 'draft' || service.state === 'unpublished') &&
          (identity.isPending ? (
            <p role="status">正在检查商业身份...</p>
          ) : identity.isError ? (
            <div role="alert" className="space-y-2">
              <p>无法检查商业身份，请重试。</p>
              <Button variant="outline" onClick={() => identity.refetch()}>
                重试
              </Button>
            </div>
          ) : (
            <PublishChecklist service={service} identityReady={identityReady} />
          ))}

        {/* 发布状态和操作 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">发布状态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {feedback && (
                <p role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.message}</p>
              )}
              {(service.state === 'draft' || service.state === 'unpublished') && (
                <>
                  <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-700">
                      此服务还未发布。消费者无法看到。发布后，消费者将能够发现并提交请求。
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
                  <section aria-label="服务分发" className="space-y-3">
                    <h2 className="font-medium">服务分发</h2>
                    {asset.isPending ? (
                      <p role="status">正在加载分发状态...</p>
                    ) : asset.isError ? (
                      <div role="alert">
                        <p>无法加载分发状态。</p>
                        <Button variant="outline" onClick={() => asset.refetch()}>
                          重试
                        </Button>
                      </div>
                    ) : asset.data ? (
                      <>
                        <a
                          className="break-all underline"
                          href={asset.data.publicUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {asset.data.publicUrl}
                        </a>
                        <p>
                          {asset.data.state === 'distributed'
                            ? '已记录实际对外分发'
                            : '分享资产已生成，尚未记录实际对外分发'}
                        </p>
                        {asset.data.state === 'generated' && (
                          <Button
                            variant="outline"
                            onClick={handleDistribution}
                            disabled={distributionMutation.isPending}
                          >
                            {distributionMutation.isPending ? '记录中...' : '确认已实际对外分发'}
                          </Button>
                        )}
                      </>
                    ) : (
                      <p>未找到此服务的分发资产，请联系支持。</p>
                    )}
                  </section>
                  <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded">
                    <div className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5">✓</div>
                    <p className="text-sm text-green-700">
                      此服务已发布。消费者可以搜索并提交请求。
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleUnpublish}
                    disabled={unpublishMutation.isPending}
                    className="w-full text-red-800"
                  >
                    {unpublishMutation.isPending ? '下架中...' : '下架服务'}
                  </Button>
                </>
              )}

              {service.state === 'archived' && (
                <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded">
                  <AlertCircle className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">
                    此服务已下架。消费者无法看到。已有的请求仍会保留。
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 返回按钮 */}
        <div>
          <Button asChild variant="outline" className="min-h-11">
            <Link href="/services">返回服务列表</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
