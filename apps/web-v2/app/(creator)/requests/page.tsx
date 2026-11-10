'use client';

import { Suspense, useState } from 'react';
import { getBearerToken } from '@/lib/auth/session';
import {
  useCreatorRequests,
  useCreatorConfirmedRequests,
} from '@/features/creator-dashboard/api/use-creator-requests';
import {
  useConfirmRequest,
  useDeclineRequest,
  useConfirmFulfillment,
} from '@/features/creator-dashboard/api/use-creator-actions';
import { RequestCard } from '@/components/creator/request-card';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function CreatorDashboardContent() {
  const accessToken = getBearerToken();
  const [activeTab, setActiveTab] = useState('submitted');
  const [actionMessage, setActionMessage] = useState('');

  // 获取两个列表
  const submitted = useCreatorRequests(accessToken || undefined);
  const confirmed = useCreatorConfirmedRequests(accessToken || undefined);

  // 获取 action hooks
  const confirmRequest = useConfirmRequest(accessToken || undefined);
  const declineRequest = useDeclineRequest(accessToken || undefined);
  const confirmFulfillment = useConfirmFulfillment(accessToken || undefined);

  async function runAction(action: () => Promise<unknown>, success: string) {
    setActionMessage('');
    try {
      await action();
      setActionMessage(success);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : '操作失败，请重试');
    }
  }

  // 未认证状态
  if (!accessToken) {
    return (
      <div className="creator-list-page">
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-lg font-semibold">需要认证</p>
            <p className="text-muted-foreground">请使用 Creator 身份认证访问此页面</p>
            <p className="text-sm text-muted-foreground">请重新登录后再试</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 加载状态
  if (submitted.isLoading || confirmed.isLoading) {
    return (
      <div className="creator-list-page space-y-8">
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
      <div className="creator-list-page">
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
    <div className="creator-list-page">
      {/* 标题 */}
      <header className="creator-page-heading">
        <div>
          <h1>访客请求</h1>
          <p>管理预约请求和履约码</p>
        </div>
      </header>
      {actionMessage && (
        <p role="status" className="mb-4 text-sm">
          {actionMessage}
        </p>
      )}

      {/* 标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid h-auto w-full max-w-md grid-cols-2">
          <TabsTrigger className="min-h-11" value="submitted">
            待处理 ({submittedRequests.length})
          </TabsTrigger>
          <TabsTrigger className="min-h-11" value="confirmed">
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
                onConfirm={(actionId) =>
                  void runAction(() => confirmRequest.mutateAsync(actionId), '已确认预约')
                }
                onDecline={(actionId) =>
                  void runAction(() => declineRequest.mutateAsync(actionId), '已拒绝预约')
                }
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
                onConfirmFulfillment={(actionId, fulfillmentCode) =>
                  void runAction(
                    () => confirmFulfillment.mutateAsync({ actionId, fulfillmentCode }),
                    '已确认履约',
                  )
                }
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
    <Suspense
      fallback={
        <div className="creator-list-page space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-10 w-48" />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      }
    >
      <CreatorDashboardContent />
    </Suspense>
  );
}
