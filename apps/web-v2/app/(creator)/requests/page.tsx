'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import {
  useCreatorRequests,
  useCreatorConfirmedRequests,
  type CreatorRequest,
} from '@/features/creator-dashboard/api/use-creator-requests';
import {
  useConfirmRequest,
  useDeclineRequest,
  useConfirmFulfillment,
} from '@/features/creator-dashboard/api/use-creator-actions';
import { RequestCard } from '@/components/creator/request-card';
import {
  RequestDecisionDialog,
  type RequestDecision,
} from '@/components/creator/request-decision-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function CreatorDashboardContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('submitted');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    focus?: boolean;
  } | null>(null);
  const [decision, setDecision] = useState<{
    request: CreatorRequest;
    kind: RequestDecision;
  } | null>(null);
  const feedbackElement = useRef<HTMLParagraphElement>(null);
  const submitted = useCreatorRequests();
  const confirmed = useCreatorConfirmedRequests();
  const confirmRequest = useConfirmRequest();
  const declineRequest = useDeclineRequest();
  const confirmFulfillment = useConfirmFulfillment();

  useEffect(() => {
    // The request's original button disappears after a successful terminal decision.
    if (feedback?.focus) feedbackElement.current?.focus();
  }, [feedback]);

  async function runAction(action: () => Promise<unknown>, success: string) {
    setFeedback(null);
    try {
      await action();
      setFeedback({ type: 'success', message: success });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : '操作失败，请重试',
      });
    }
  }

  if (authLoading)
    return (
      <div className="creator-list-page">
        <Skeleton className="h-10 w-48" />
      </div>
    );
  if (!isAuthenticated)
    return (
      <div className="creator-list-page">
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-lg font-semibold">需要认证</p>
            <p className="text-muted-foreground">请使用 Creator 身份认证访问此页面</p>
          </CardContent>
        </Card>
      </div>
    );
  if (submitted.isLoading || confirmed.isLoading)
    return (
      <div className="creator-list-page space-y-8">
        <Skeleton className="h-10 w-48" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  if ((submitted.error && !submitted.data) || (confirmed.error && !confirmed.data))
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
                void submitted.refetch();
                void confirmed.refetch();
              }}
              variant="outline"
            >
              重试
            </Button>
          </CardContent>
        </Card>
      </div>
    );

  const submittedRequests = submitted.data || [];
  const confirmedRequests = confirmed.data || [];
  return (
    <div className="creator-list-page">
      <header className="creator-page-heading">
        <div>
          <h1>访客请求</h1>
          <p>查看请求、记录 Creator 决定并确认履约</p>
        </div>
      </header>
      {(submitted.error || confirmed.error) && (
        <div role="alert" className="mb-4 space-y-2">
          <p>最新请求状态加载失败，请刷新后再操作。</p>
          <Button
            variant="outline"
            onClick={() => {
              void submitted.refetch();
              void confirmed.refetch();
            }}
          >
            刷新请求
          </Button>
        </div>
      )}
      {feedback && (
        <p
          ref={feedbackElement}
          tabIndex={-1}
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className="mb-4 text-sm"
        >
          {feedback.message}
        </p>
      )}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid h-auto w-full max-w-md grid-cols-2">
          <TabsTrigger className="min-h-11" value="submitted">
            待处理 ({submittedRequests.length})
          </TabsTrigger>
          <TabsTrigger className="min-h-11" value="confirmed">
            已确认 ({confirmedRequests.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="submitted" className="space-y-4">
          {submittedRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">暂无待处理的请求</p>
              </CardContent>
            </Card>
          ) : (
            submittedRequests.map((request) => (
              <RequestCard
                key={request.action.id}
                request={request}
                onConfirm={() => {
                  setFeedback(null);
                  setDecision({ request, kind: 'confirm' });
                }}
                onDecline={() => {
                  setFeedback(null);
                  setDecision({ request, kind: 'decline' });
                }}
                isLoading={
                  confirmRequest.isPending || declineRequest.isPending || !!submitted.error
                }
              />
            ))
          )}
        </TabsContent>
        <TabsContent value="confirmed" className="space-y-4">
          {confirmedRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">暂无已确认的请求</p>
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
      {decision && (
        <RequestDecisionDialog
          request={decision.request}
          decision={decision.kind}
          available={
            !submitted.error &&
            submittedRequests.some((request) => request.action.id === decision.request.action.id)
          }
          onDismiss={() => setDecision(null)}
          onCommit={() =>
            (decision.kind === 'confirm' ? confirmRequest : declineRequest).mutateAsync(
              decision.request.action.id,
            )
          }
          onSuccess={() => {
            setFeedback({
              type: 'success',
              message: decision.kind === 'confirm' ? '已确认请求' : '已拒绝请求',
              focus: true,
            });
            setDecision(null);
          }}
        />
      )}
    </div>
  );
}

export default function CreatorDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="creator-list-page">
          <Skeleton className="h-10 w-48" />
        </div>
      }
    >
      <CreatorDashboardContent />
    </Suspense>
  );
}
