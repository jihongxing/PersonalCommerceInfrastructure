'use client';

import { useServiceOffering } from '@/features/service-booking/api/use-service-offering';
import { ServiceDetailCard } from '@/components/commerce/service-detail-card';
import { BookingForm } from '@/components/commerce/booking-form';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function ServiceOfferingPage({
  params,
}: {
  params: { offeringId: string };
}) {
  const { data, isLoading, error } = useServiceOffering(params.offeringId);

  // 加载状态
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-8 max-w-4xl">
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center gap-4 mb-6">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-64" />
          </CardContent>
        </Card>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // 错误状态
  if (error || !data) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg font-semibold text-destructive mb-2">
              加载失败
            </p>
            <p className="text-muted-foreground">
              {error?.message || '无法加载服务信息'}
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              请检查服务 ID 是否正确，或稍后重试
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { creator, offering } = data;

  // 生成 Creator 头像占位符
  const initials = creator.displayName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-4xl">
      {/* Creator 信息 */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{creator.displayName}</h2>
              <div className="flex flex-wrap gap-2 mt-1">
                {creator.capabilityNames.map((capability) => (
                  <Badge key={capability} variant="secondary" className="text-xs">
                    {capability}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          {creator.bio && (
            <p className="text-sm text-muted-foreground mt-3">{creator.bio}</p>
          )}
        </CardContent>
      </Card>

      {/* 服务详情 */}
      <ServiceDetailCard offering={offering} />

      {/* 预约表单 */}
      <BookingForm 
        offeringId={offering.id} 
        requestInstructions={offering.requestInstructions}
      />
    </div>
  );
}
