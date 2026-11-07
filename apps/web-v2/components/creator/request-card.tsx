import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { CreatorRequest, CreatorConfirmedRequest } from '@/features/creator-dashboard/api/use-creator-requests';

interface RequestCardProps {
  request: CreatorRequest | CreatorConfirmedRequest;
  onConfirm?: (actionId: string) => void;
  onDecline?: (actionId: string) => void;
  onConfirmFulfillment?: (actionId: string) => void;
  isLoading?: boolean;
}

export function RequestCard({
  request,
  onConfirm,
  onDecline,
  onConfirmFulfillment,
  isLoading = false,
}: RequestCardProps) {
  const isSubmitted = request.action.state === 'submitted';
  const isConfirmed = 'state' in request.action && request.action.state === 'confirmed';
  const hasCode = isConfirmed && 'fulfillmentCode' in request;
  const fulfillmentCode = hasCode ? (request as CreatorConfirmedRequest).fulfillmentCode : undefined;
  const codeIsPending = fulfillmentCode?.status === 'pending';

  return (
    <Card data-testid="request-card">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{request.offering.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              来自 {request.customer.contactName}
            </p>
          </div>
          <Badge variant={isSubmitted ? 'secondary' : 'default'}>
            {isSubmitted ? '待处理' : '已确认'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 预约说明 */}
        <div>
          <p className="text-sm font-medium mb-1">预约说明</p>
          <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
            {request.action.requestMessage}
          </p>
        </div>

        {/* 联系方式 */}
        <div>
          <p className="text-sm font-medium mb-1">联系方式</p>
          <p className="text-sm font-mono">{request.customer.contactMethod}</p>
        </div>

        {/* 履约码（如果已确认） */}
        {fulfillmentCode && (
          <>
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">履约码</p>
                <Badge
                  data-testid="fulfillment-code-status"
                  variant={
                    fulfillmentCode.status === 'pending'
                      ? 'default'
                      : fulfillmentCode.status === 'fulfilled'
                      ? 'secondary'
                      : 'destructive'
                  }
                >
                  {fulfillmentCode.status === 'pending'
                    ? '待使用'
                    : fulfillmentCode.status === 'fulfilled'
                    ? '已使用'
                    : '已过期'}
                </Badge>
              </div>
              <p data-testid="fulfillment-code" className="text-2xl font-mono font-bold text-center p-3 bg-muted rounded">
                {fulfillmentCode.code}
              </p>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {fulfillmentCode.status === 'pending' && `过期时间：${new Date(fulfillmentCode.expiresAt).toLocaleString()}`}
                {fulfillmentCode.status === 'fulfilled' && `使用时间：${fulfillmentCode.confirmedAt ? new Date(fulfillmentCode.confirmedAt).toLocaleString() : 'N/A'}`}
              </p>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="gap-2">
        {isSubmitted && (
          <>
            <Button
              onClick={() => onConfirm?.(request.action.id)}
              disabled={isLoading}
              className="flex-1"
            >
              确认预约
            </Button>
            <Button
              onClick={() => onDecline?.(request.action.id)}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              拒绝预约
            </Button>
          </>
        )}
        {isConfirmed && codeIsPending && (
          <Button
            onClick={() => onConfirmFulfillment?.(request.action.id)}
            disabled={isLoading}
            className="w-full"
          >
            确认履约
          </Button>
        )}
        {isConfirmed && !codeIsPending && (
          <Button disabled className="w-full">
            {fulfillmentCode?.status === 'fulfilled' ? '已使用' : '已过期'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
