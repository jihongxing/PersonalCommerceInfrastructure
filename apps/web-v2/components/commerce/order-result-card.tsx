import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatRelativeTime } from '@/lib/utils/format';
import type { OrderResult } from '@/features/order-fulfillment/api/use-order-result';

interface OrderResultCardProps {
  result: OrderResult;
}

function StateBadge({ state }: { state: OrderResult['state'] }) {
  const variants: Record<OrderResult['state'], { variant: 'default' | 'secondary' | 'destructive'; label: string }> = {
    submitted: { variant: 'secondary', label: '等待 Creator 回复' },
    confirmed: { variant: 'default', label: '已确认' },
    declined: { variant: 'destructive', label: '已拒绝' },
  };

  const config = variants[state];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function FulfillmentCodeDisplay({ code }: { code: OrderResult['fulfillmentCode'] }) {
  if (!code) return null;

  const statusLabels: Record<typeof code.status, string> = {
    pending: '待使用',
    fulfilled: '已使用',
    expired: '已过期',
  };

  const statusVariants: Record<typeof code.status, 'default' | 'secondary' | 'destructive'> = {
    pending: 'default',
    fulfilled: 'secondary',
    expired: 'destructive',
  };

  return (
    <div className="space-y-4">
      <Separator />
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">履约码</h3>
          <Badge variant={statusVariants[code.status]}>
            {statusLabels[code.status]}
          </Badge>
        </div>

        <div className="p-6 bg-muted rounded-lg text-center">
          <p className="text-xs text-muted-foreground mb-2">出示此码给 Creator 确认履约</p>
          <p className="text-3xl font-mono font-bold tracking-wider">
            {code.code}
          </p>
        </div>

        <div className="mt-4 text-sm text-muted-foreground space-y-1">
          {code.status === 'pending' && (
            <p>
              过期时间：{formatRelativeTime(code.expiresAt)}
            </p>
          )}
          {code.confirmedAt && (
            <p>
              确认时间：{formatRelativeTime(code.confirmedAt)}
            </p>
          )}
        </div>

        {code.status === 'pending' && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              💡 提示：请在与 Creator 见面时出示此履约码，由 Creator 扫描确认。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function OrderResultCard({ result }: OrderResultCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>预约状态</CardTitle>
          <StateBadge state={result.state} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 状态消息 */}
        <div className="p-4 bg-muted rounded-md">
          <p className="text-sm">{result.message}</p>
        </div>

        {/* 查询码 */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">查询码（请保存）</p>
          <p className="font-mono text-sm">{result.resultAccessToken}</p>
        </div>

        {/* 履约码（如果已确认） */}
        {result.fulfillmentCode && (
          <FulfillmentCodeDisplay code={result.fulfillmentCode} />
        )}

        {/* 等待状态提示 */}
        {result.state === 'submitted' && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-md">
            <p className="text-sm text-yellow-900 dark:text-yellow-100">
              ⏳ 您的预约请求已提交，正在等待 Creator 确认。页面将自动刷新显示最新状态。
            </p>
          </div>
        )}

        {/* 拒绝状态提示 */}
        {result.state === 'declined' && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 rounded-md">
            <p className="text-sm text-red-900 dark:text-red-100">
              ❌ 很抱歉，Creator 无法接受此预约。您可以尝试调整需求后重新提交。
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
