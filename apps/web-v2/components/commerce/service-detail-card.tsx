import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { ServiceOfferingDetail, ServiceOfferingAppearance } from '@/features/service-booking/api/use-service-offering';

interface ServiceDetailCardProps {
  offering: ServiceOfferingDetail;
}

function AppearanceInfo({ appearance }: { appearance: ServiceOfferingAppearance }) {
  const typeLabels: Record<ServiceOfferingAppearance['appearanceType'], string> = {
    convention: '展会活动',
    guest: '嘉宾出席',
    brand: '品牌合作',
    photo: '拍照签名',
    signing: '签售活动',
  };

  const buyerTypeLabels: Record<ServiceOfferingAppearance['buyerType'], string> = {
    organizer: '主办方',
    brand: '品牌方',
    fan_group: '粉丝团',
    approved_external_requester: '经认证的第三方',
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium mb-1">活动类型</p>
        <Badge variant="secondary">{typeLabels[appearance.appearanceType]}</Badge>
      </div>

      <div>
        <p className="text-sm font-medium mb-1">时间</p>
        <p className="text-sm text-muted-foreground">
          {appearance.startsOn}
          {appearance.endsOn && ` 至 ${appearance.endsOn}`}
        </p>
      </div>

      <div>
        <p className="text-sm font-medium mb-1">地点</p>
        <p className="text-sm text-muted-foreground">{appearance.locationDescription}</p>
      </div>

      <div>
        <p className="text-sm font-medium mb-1">适合预约方</p>
        <Badge variant="outline">{buyerTypeLabels[appearance.buyerType]}</Badge>
      </div>

      {appearance.pricingRule && (
        <div>
          <p className="text-sm font-medium mb-1">定价说明</p>
          <p className="text-sm text-muted-foreground">{appearance.pricingRule}</p>
        </div>
      )}

      {appearance.externalUrl && (
        <div>
          <p className="text-sm font-medium mb-1">相关链接</p>
          <a 
            href={appearance.externalUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            查看详情 →
          </a>
        </div>
      )}
    </div>
  );
}

export function ServiceDetailCard({ offering }: ServiceDetailCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{offering.title}</CardTitle>
        <CardDescription>{offering.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 可用性说明 */}
        <div>
          <p className="text-sm font-medium mb-2">可用时间</p>
          <p className="text-sm text-muted-foreground">{offering.availabilityDescription}</p>
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
