'use client';

import type { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { appearanceTypeLabels, appearanceBuyerLabels } from '@/lib/service-offering-appearance';
import type { ServiceFormData } from '../lib/validation';

export function AppearanceFields({
  form,
  disabled,
}: {
  form: UseFormReturn<ServiceFormData>;
  disabled: boolean;
}) {
  return (
    <fieldset disabled={disabled} className="min-w-0 space-y-4 rounded-lg border p-4">
      <legend className="px-1 font-medium">活动信息</legend>
      <p className="text-sm text-muted-foreground">
        仅描述活动，不预留档期或自动排期。可用性和发布政策仍单独校验。
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="appearance.appearanceType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>活动类型</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="min-h-11 w-full rounded-md border bg-background px-3 text-sm"
                >
                  {Object.entries(appearanceTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="appearance.buyerType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>适合的请求方</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="min-h-11 w-full rounded-md border bg-background px-3 text-sm"
                >
                  {Object.entries(appearanceBuyerLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormDescription>仅为请求方类别，不代表身份认证或资格验证。</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {(['startsOn', 'endsOn'] as const).map((name) => (
          <FormField
            key={name}
            control={form.control}
            name={`appearance.${name}`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{name === 'startsOn' ? '活动日期' : '结束日期（可选）'}</FormLabel>
                <FormControl>
                  <Input type="date" className="min-h-11" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>
      {(
        [
          ['locationDescription', '活动地点', 500, '地点描述，不代表已预订场地。'],
          ['pricingRule', '定价说明（可选）', 500, '自由文本说明，不计算价格或发起支付。'],
          ['requestCallToAction', '请求入口文案', 240, '仅调整现有提交请求按钮的文案。'],
          ['upcomingTitle', '活动标题（可选）', 240, '用于展示，不生成日历。'],
          ['externalUrl', '外部信息链接（可选）', 2048, '仅链接到外部信息，不改变请求流程。'],
        ] as const
      ).map(([name, label, maxLength, description]) => (
        <FormField
          key={name}
          control={form.control}
          name={`appearance.${name}`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{label}</FormLabel>
              <FormControl>
                {name === 'locationDescription' || name === 'pricingRule' ? (
                  <Textarea {...field} value={field.value ?? ''} maxLength={maxLength} />
                ) : (
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    maxLength={maxLength}
                    type={name === 'externalUrl' ? 'url' : 'text'}
                  />
                )}
              </FormControl>
              <FormDescription>{description}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
    </fieldset>
  );
}
