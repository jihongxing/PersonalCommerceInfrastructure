import { z } from 'zod';

export const appearanceTypeLabels = {
  convention: '展会活动',
  guest: '嘉宾出席',
  brand: '品牌合作',
  photo: '拍照活动',
  signing: '签售活动',
} as const;

export const appearanceBuyerLabels = {
  organizer: '主办方',
  brand: '品牌方',
  fan_group: '粉丝团',
  approved_external_requester: '外部请求方',
} as const;

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export const AppearanceFormSchema = z
  .object({
    appearanceType: z.enum(['convention', 'guest', 'brand', 'photo', 'signing']),
    startsOn: z.string().refine(validDate, '请输入有效的活动日期'),
    endsOn: z
      .string()
      .refine((value) => value === '' || validDate(value), '请输入有效的结束日期')
      .optional(),
    locationDescription: z.string().trim().min(1, '请输入活动地点').max(500, '地点最多 500 字符'),
    buyerType: z.enum(['organizer', 'brand', 'fan_group', 'approved_external_requester']),
    pricingRule: z.string().trim().max(500, '定价说明最多 500 字符').optional(),
    requestCallToAction: z
      .string()
      .trim()
      .min(1, '请输入请求入口文案')
      .max(240, '入口文案最多 240 字符'),
    upcomingTitle: z.string().trim().max(240, '活动标题最多 240 字符').optional(),
    externalUrl: z
      .string()
      .trim()
      .url('请输入完整的外部信息 URL')
      .max(2048, '链接最多 2048 字符')
      .or(z.literal(''))
      .optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.endsOn &&
      validDate(value.endsOn) &&
      validDate(value.startsOn) &&
      value.endsOn < value.startsOn
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endsOn'],
        message: '结束日期不能早于活动日期',
      });
    }
  });

export type ServiceOfferingAppearance = z.infer<typeof AppearanceFormSchema>;

// Founder-confirmed mapping; appearanceType never grants template eligibility.
export function supportsAppearance(
  templateId: string | undefined,
  templates:
    | readonly {
        id: string;
        capabilityCatalogItemId: string;
      }[]
    | undefined,
): boolean {
  return (
    templateId === 'template-commercial-appearance' &&
    templates?.some(
      (template) =>
        template.id === templateId &&
        template.capabilityCatalogItemId === 'capability-commercial-appearance',
    ) === true
  );
}

export function appearanceRequest(value: ServiceOfferingAppearance): ServiceOfferingAppearance {
  return {
    appearanceType: value.appearanceType,
    startsOn: value.startsOn,
    locationDescription: value.locationDescription,
    buyerType: value.buyerType,
    requestCallToAction: value.requestCallToAction,
    ...(value.endsOn ? { endsOn: value.endsOn } : {}),
    ...(value.pricingRule ? { pricingRule: value.pricingRule } : {}),
    ...(value.upcomingTitle ? { upcomingTitle: value.upcomingTitle } : {}),
    ...(value.externalUrl ? { externalUrl: value.externalUrl } : {}),
  };
}

export function safeAppearanceUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : undefined;
  } catch {
    return undefined;
  }
}
