import {
  appearanceTypeLabels,
  appearanceBuyerLabels,
  safeAppearanceUrl,
  type ServiceOfferingAppearance,
} from '@/lib/service-offering-appearance';

export function AppearanceInfo({
  appearance,
  showRequestCopy = false,
}: {
  appearance: ServiceOfferingAppearance;
  showRequestCopy?: boolean;
}) {
  const externalUrl = safeAppearanceUrl(appearance.externalUrl);
  return (
    <dl className="grid min-w-0 gap-4 text-sm sm:grid-cols-2">
      {appearance.upcomingTitle && (
        <div className="min-w-0 sm:col-span-2">
          <dt className="font-medium">活动标题</dt>
          <dd className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">
            {appearance.upcomingTitle}
          </dd>
        </div>
      )}
      <div>
        <dt className="font-medium">活动类型</dt>
        <dd className="mt-1 text-muted-foreground">
          {appearanceTypeLabels[appearance.appearanceType]}
        </dd>
      </div>
      <div>
        <dt className="font-medium">活动日期</dt>
        <dd className="mt-1 text-muted-foreground">
          <time dateTime={appearance.startsOn}>{appearance.startsOn}</time>
          {appearance.endsOn && (
            <>
              {' '}
              至 <time dateTime={appearance.endsOn}>{appearance.endsOn}</time>
            </>
          )}
        </dd>
      </div>
      <div className="min-w-0">
        <dt className="font-medium">活动地点</dt>
        <dd className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">
          {appearance.locationDescription}
        </dd>
      </div>
      <div>
        <dt className="font-medium">适合的请求方</dt>
        <dd className="mt-1 text-muted-foreground">
          {appearanceBuyerLabels[appearance.buyerType]}
        </dd>
      </div>
      {appearance.pricingRule && (
        <div className="min-w-0 sm:col-span-2">
          <dt className="font-medium">定价说明</dt>
          <dd className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">
            {appearance.pricingRule}
          </dd>
        </div>
      )}
      {showRequestCopy && (
        <div className="min-w-0 sm:col-span-2">
          <dt className="font-medium">请求入口文案</dt>
          <dd className="mt-1 break-words text-muted-foreground">
            {appearance.requestCallToAction}
          </dd>
        </div>
      )}
      {appearance.externalUrl && (
        <div className="min-w-0 sm:col-span-2">
          <dt className="font-medium">外部信息链接</dt>
          <dd className="mt-1 break-all">
            {externalUrl ? (
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-4"
              >
                查看外部信息（新窗口）
              </a>
            ) : (
              <span className="text-muted-foreground">{appearance.externalUrl}</span>
            )}
          </dd>
        </div>
      )}
    </dl>
  );
}
