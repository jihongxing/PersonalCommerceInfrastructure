import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatDateTime, formatRelativeTime } from '@/lib/utils/format';
import {
  useFulfillmentQrCode,
  type OrderResult,
} from '@/features/order-fulfillment/api/use-order-result';

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
        {result.fulfillmentCode && <FulfillmentCodeDisplay code={result.fulfillmentCode} />}
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

function FulfillmentCodeDisplay({
  code: fulfillment,
}: {
  code: NonNullable<OrderResult['fulfillmentCode']>;
}) {
  const qr = useFulfillmentQrCode(fulfillment.code);
  return (
    <div className="space-y-4">
      <Separator />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">履约码</h3>
        <Badge
          variant={
            fulfillment.status === 'pending'
              ? 'default'
              : fulfillment.status === 'fulfilled'
                ? 'secondary'
                : 'destructive'
          }
        >
          {fulfillment.status === 'pending'
            ? '待 Creator 确认'
            : fulfillment.status === 'fulfilled'
              ? '已确认履约'
              : '已过期'}
        </Badge>
      </div>
      <div className="p-6 bg-muted rounded-lg text-center">
        <p className="text-xs text-muted-foreground mb-2">请将此码提供给 Creator</p>
        <p className="break-all text-2xl font-mono font-bold sm:text-3xl">{fulfillment.code}</p>
      </div>
      {fulfillment.status === 'pending' && (
        <p className="text-sm text-muted-foreground">
          过期时间：
          <time dateTime={fulfillment.expiresAt}>{formatDateTime(fulfillment.expiresAt)}</time>
        </p>
      )}
      {fulfillment.confirmedAt && (
        <p className="text-sm text-muted-foreground">
          确认时间：{formatRelativeTime(fulfillment.confirmedAt)}
        </p>
      )}
      {qr.isLoading && <p className="text-sm text-muted-foreground">正在生成履约二维码...</p>}
      {qr.data && (
        <div className="text-center">
          <img src={qr.data} alt="履约码二维码" width={180} height={180} className="mx-auto" />
          <p className="text-xs text-muted-foreground mt-2">Creator 可扫描后使用此履约码</p>
        </div>
      )}
      {qr.error && (
        <p role="alert" className="text-sm text-destructive">
          履约二维码加载失败，请直接提供履约码。
        </p>
      )}
    </div>
  );
}
