'use client';

import { useOrderResult } from '@/features/order-fulfillment/api/use-order-result';
import { OrderResultCard } from '@/components/commerce/order-result-card';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function OrderResultPage({
  params,
}: {
  params: { token: string };
}) {
  const { data, isLoading, error, refetch, isRefetching } = useOrderResult(params.token);

  // 加载状态
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-8 max-w-2xl">
        <Card>
          <CardContent className="py-12">
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 错误状态
  if (error || !data) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <p className="text-lg font-semibold text-destructive mb-2">
              查询失败
            </p>
            <p className="text-muted-foreground">
              {error?.message || '无法加载订单信息'}
            </p>
            <p className="text-sm text-muted-foreground">
              请检查查询码是否正确，或稍后重试
            </p>
            <Button onClick={() => refetch()} variant="outline" className="mt-4">
              重试
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-2xl">
      {/* 订单结果卡片 */}
      <OrderResultCard result={data} />

      {/* 手动刷新按钮 */}
      {data.state === 'submitted' && (
        <div className="text-center">
          <Button 
            onClick={() => refetch()} 
            variant="outline"
            disabled={isRefetching}
          >
            {isRefetching ? '刷新中...' : '手动刷新状态'}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            页面会自动每 10 秒刷新一次
          </p>
        </div>
      )}

      {/* 返回首页 */}
      <div className="text-center pt-4">
        <Button 
          onClick={() => window.location.href = '/'} 
          variant="ghost"
        >
          返回首页
        </Button>
      </div>
    </div>
  );
}
