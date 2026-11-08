'use client';

import { Suspense, useState } from 'react';
import { getBearerToken } from '@/lib/auth/session';
import { useCreatorRequests, useCreatorConfirmedRequests } from '@/features/creator-dashboard/api/use-creator-requests';
import { useConfirmRequest, useDeclineRequest, useConfirmFulfillment } from '@/features/creator-dashboard/api/use-creator-actions';
import { RequestCard } from '@/components/creator/request-card';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function CreatorDashboardContent() {
  const accessToken = getBearerToken();
  const [activeTab, setActiveTab] = useState('submitted');

  // 获取两个列表
  const submitted = useCreatorRequests(accessToken || undefined);
  const confirmed = useCreatorConfirmedRequests(accessToken || undefined);

  // 获取 action hooks
  const confirmRequest = useConfirmRequest(accessToken || undefined);
  const declineRequest = useDeclineRequest(accessToken || undefined);
  const confirmFulfillment = useConfirmFulfillment(accessToken || undefined);

  // 未认证状态
  if (!accessToken) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-lg font-semibold">需要认证</p>
            <p className="text-muted-foreground">
              请使用 Creator 身份认证访问此页面
            </p>
            <p className="text-sm text-muted-foreground">
              请重新登录后再试
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 加载状态
  if (submitted.isLoading || confirmed.isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-8 max-w-4xl">
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  // 错误状态
  if (submitted.error || confirmed.error) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-lg font-semibold text-destructive">加载失败</p>
            <p className="text-muted-foreground">
              {submitted.error?.message || confirmed.error?.message || '无法加载数据'}
            </p>
            <Button
              onClick={() => {
                submitted.refetch();
                confirmed.refetch();
              }}
              variant="outline"
            >
              重试
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const submittedRequests = submitted.data || [];
  const confirmedRequests = confirmed.data || [];

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-4xl">
      {/* 标题 */}
      <div>
        <h1 className="text-3xl font-bold">预约审核</h1>
        <p className="text-muted-foreground mt-2">
          管理预约请求和履约码
        </p>
      </div>

      {/* 标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="submitted">
            待处理 ({submittedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="confirmed">
            已确认 ({confirmedRequests.length})
          </TabsTrigger>
        </TabsList>

        {/* 待处理标签页 */}
        <TabsContent value="submitted" className="space-y-4">
          {submittedRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">暂无待处理的预约请求</p>
              </CardContent>
            </Card>
          ) : (
            submittedRequests.map((request) => (
              <RequestCard
                key={request.action.id}
                request={request}
                onConfirm={(actionId) => confirmRequest.mutate(actionId)}
                onDecline={(actionId) => declineRequest.mutate(actionId)}
                isLoading={confirmRequest.isPending || declineRequest.isPending}
              />
            ))
          )}
        </TabsContent>

        {/* 已确认标签页 */}
        <TabsContent value="confirmed" className="space-y-4">
          {confirmedRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">暂无已确认的预约</p>
              </CardContent>
            </Card>
          ) : (
            confirmedRequests.map((request) => (
              <RequestCard
                key={request.action.id}
                request={request}
                onConfirmFulfillment={(actionId) => confirmFulfillment.mutate(actionId)}
                isLoading={confirmFulfillment.isPending}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

    </div>
  );
}

export default function CreatorDashboardPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8 space-y-8 max-w-4xl">
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    }>
      <CreatorDashboardContent />
    </Suspense>
  );
}
