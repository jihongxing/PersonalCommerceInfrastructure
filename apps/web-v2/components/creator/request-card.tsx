import { useId, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import type {
  CreatorRequest,
  CreatorConfirmedRequest,
} from '@/features/creator-dashboard/api/use-creator-requests';

interface RequestCardProps {
  request: CreatorRequest | CreatorConfirmedRequest;
  onConfirm?: (actionId: string) => void;
  onDecline?: (actionId: string) => void;
  onConfirmFulfillment?: (actionId: string, fulfillmentCode: string) => void;
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
  const isConfirmed = request.action.state === 'confirmed';
  const codeId = useId();
  const [code, setCode] = useState('');
  const normalizedCode = code.trim().toUpperCase();
  const codeIsValid = /^FC-[A-Z0-9]{8}$/.test(normalizedCode);
  const fulfillmentCode = 'fulfillmentCode' in request ? request.fulfillmentCode : undefined;
  return (
    <Card data-testid="request-card">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1 break-words">
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
        <div>
          <p className="text-sm font-medium mb-1">请求说明</p>
          <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
            {request.action.requestMessage}
          </p>
        </div>
        {isConfirmed && fulfillmentCode && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">履约信息</p>
                <Badge
                  variant={
                    fulfillmentCode.status === 'pending'
                      ? 'default'
                      : fulfillmentCode.status === 'fulfilled'
                        ? 'secondary'
                        : 'destructive'
                  }
                >
                  {fulfillmentCode.status === 'pending'
                    ? '待确认履约'
                    : fulfillmentCode.status === 'fulfilled'
                      ? '已确认履约'
                      : '履约码已过期'}
                </Badge>
              </div>
              <p className="font-mono text-sm break-all">{fulfillmentCode.code}</p>
              {fulfillmentCode.status === 'pending' && (
                <p className="text-xs text-muted-foreground">
                  过期时间：{new Date(fulfillmentCode.expiresAt).toLocaleString()}
                </p>
              )}
            </div>
          </>
        )}
        {isConfirmed && fulfillmentCode?.status === 'pending' && (
          <div className="space-y-2">
            <label htmlFor={codeId} className="text-sm font-medium">
              输入客户提供的履约码
            </label>
            <Input
              id={codeId}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="FC-XXXXXXXX"
              autoComplete="off"
              maxLength={11}
              disabled={isLoading}
            />
          </div>
        )}
        <div>
          <p className="text-sm font-medium mb-1">联系方式</p>
          <p className="break-all text-sm font-mono">{request.customer.contactMethod}</p>
        </div>
      </CardContent>
      {(isSubmitted || (isConfirmed && fulfillmentCode?.status === 'pending')) && (
        <CardFooter className="flex-wrap gap-2">
          {isSubmitted ? (
            <>
              <Button
                onClick={() => onConfirm?.(request.action.id)}
                disabled={isLoading}
                className="flex-1"
              >
                确认请求
              </Button>
              <Button
                onClick={() => onDecline?.(request.action.id)}
                disabled={isLoading}
                variant="outline"
                className="flex-1"
              >
                拒绝请求
              </Button>
            </>
          ) : (
            <Button
              onClick={() => onConfirmFulfillment?.(request.action.id, normalizedCode)}
              disabled={isLoading || !codeIsValid}
              className="w-full"
            >
              确认履约
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
