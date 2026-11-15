import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { OrderResult } from '@/features/order-fulfillment/api/use-order-result';

function StateBadge({ state }: { state: OrderResult['state'] }) {
  const variants: Record<
    OrderResult['state'],
    { variant: 'default' | 'secondary' | 'destructive'; label: string }
  > = {
    submitted: { variant: 'secondary', label: '等待 Creator 回复' },
    confirmed: { variant: 'default', label: '已确认' },
    declined: { variant: 'destructive', label: '已拒绝' },
  };
  const config = variants[state];
  return (
    <Badge data-testid="status-badge" variant={config.variant}>
      {config.label}
    </Badge>
  );
}

export function OrderResultCard({ result }: { result: OrderResult }) {
  return (
    <Card data-testid="order-result-card">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>请求状态</CardTitle>
          <StateBadge state={result.state} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-muted rounded-md">
          <p className="text-sm">{result.message}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">查询码（请保存）</p>
          <p data-testid="query-code" className="break-all font-mono text-sm">
            {result.resultAccessToken}
          </p>
        </div>
        {result.state === 'submitted' && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-md">
            <p className="text-sm text-yellow-900 dark:text-yellow-100">
              您的请求已提交，正在等待 Creator 确认。页面将自动刷新显示最新状态。
            </p>
          </div>
        )}
        {result.state === 'declined' && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 rounded-md">
            <p className="text-sm text-red-900 dark:text-red-100">
              很抱歉，Creator 无法接受此请求。
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
