import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AppearanceInfo } from './appearance-info';
import type { ServiceOfferingDetail } from '@/features/service-booking/api/use-service-offering';

interface ServiceDetailCardProps {
  offering: ServiceOfferingDetail;
}

export function ServiceDetailCard({ offering }: ServiceDetailCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle role="heading" aria-level={2}>
          {offering.title}
        </CardTitle>
        <CardDescription className="whitespace-pre-wrap break-words">
          {offering.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 可用性说明 */}
        <div>
          <p className="text-sm font-medium mb-2">可用时间</p>
          <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
            {offering.availabilityDescription}
          </p>
        </div>

        {/* 活动详情（如果是 Appearance 类型） */}
        {offering.appearance && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-3">活动详情</p>
              <AppearanceInfo appearance={offering.appearance} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
