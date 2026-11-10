import { useId, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  const codeId = useId();
  const [code, setCode] = useState('');
  const isSubmitted = request.action.state === 'submitted';
  const isConfirmed = 'state' in request.action && request.action.state === 'confirmed';
  const normalizedCode = code.trim().toUpperCase();
  const codeIsValid = /^FC-[A-Z0-9]{8}$/.test(normalizedCode);

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
          <p className="break-all text-sm font-mono">{request.customer.contactMethod}</p>
        </div>

        {isConfirmed && (
          <div className="space-y-2">
            <label htmlFor={codeId} className="text-sm font-medium">
              访客提供的履约码
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
      </CardContent>
      <CardFooter className="flex-wrap gap-2">
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
        {isConfirmed && (
          <Button
            onClick={() => onConfirmFulfillment?.(request.action.id, normalizedCode)}
            disabled={isLoading || !codeIsValid}
            className="w-full"
          >
            确认履约
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
