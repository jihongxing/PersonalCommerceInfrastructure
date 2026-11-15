import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CreatorRequest, CreatorConfirmedRequest } from '@/features/creator-dashboard/api/use-creator-requests';

interface RequestCardProps {
  request: CreatorRequest | CreatorConfirmedRequest;
  onConfirm?: (actionId: string) => void;
  onDecline?: (actionId: string) => void;
  isLoading?: boolean;
}

export function RequestCard({ request, onConfirm, onDecline, isLoading = false }: RequestCardProps) {
  const isSubmitted = request.action.state === 'submitted';
  return <Card data-testid="request-card">
    <CardHeader><div className="flex items-start justify-between"><div className="min-w-0 flex-1 break-words"><CardTitle className="text-lg">{request.offering.title}</CardTitle><p className="text-sm text-muted-foreground mt-1">来自 {request.customer.contactName}</p></div><Badge variant={isSubmitted ? 'secondary' : 'default'}>{isSubmitted ? '待处理' : '已确认'}</Badge></div></CardHeader>
    <CardContent className="space-y-4"><div><p className="text-sm font-medium mb-1">请求说明</p><p className="text-sm text-muted-foreground bg-muted p-2 rounded">{request.action.requestMessage}</p></div><div><p className="text-sm font-medium mb-1">联系方式</p><p className="break-all text-sm font-mono">{request.customer.contactMethod}</p></div></CardContent>
    {isSubmitted && <CardFooter className="flex-wrap gap-2"><Button onClick={() => onConfirm?.(request.action.id)} disabled={isLoading} className="flex-1">确认请求</Button><Button onClick={() => onDecline?.(request.action.id)} disabled={isLoading} variant="outline" className="flex-1">拒绝请求</Button></CardFooter>}
  </Card>;
}