'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { useSubmitBooking } from '@/features/service-booking/api/use-submit-booking';

const bookingFormSchema = z.object({
  contactName: z.string().min(1, '请输入您的姓名').max(160, '姓名最多 160 字符'),
  contactMethod: z.string().min(1, '请输入联系方式').max(320, '联系方式最多 320 字符'),
  requestMessage: z.string().min(1, '请输入预约说明').max(2000, '预约说明最多 2000 字符'),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
  offeringId: string;
  requestInstructions?: string;
}

export function BookingForm({ offeringId, requestInstructions }: BookingFormProps) {
  const router = useRouter();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const submitBooking = useSubmitBooking(offeringId);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      contactName: '',
      contactMethod: '',
      requestMessage: '',
    },
  });

  const onSubmit = async (values: BookingFormValues) => {
    try {
      const result = await submitBooking.mutateAsync(values);
      setIsSubmitted(true);
      
      // 跳转到结果页面（Phase 3 实现）
      // router.push(`/o/${result.resultAccessToken}`);
      console.log('Booking submitted:', result);
    } catch (error) {
      console.error('Failed to submit booking:', error);
      // 错误已经通过 submitBooking.error 暴露给 UI
    }
  };

  // 提交成功后的状态
  if (isSubmitted && submitBooking.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>预约请求已提交</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {submitBooking.data.message}
          </p>
          <div className="p-4 bg-muted rounded-md">
            <p className="text-sm font-medium mb-1">查询码（请保存）：</p>
            <p className="font-mono text-sm">{submitBooking.data.resultAccessToken}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            您可以使用此查询码查看 Creator 的回复
          </p>
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => {
              // TODO: 跳转到订单结果页
              // router.push(`/o/${submitBooking.data.resultAccessToken}`);
              console.log('Navigate to result page');
            }}
            className="w-full"
          >
            查看预约状态
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>提交预约请求</CardTitle>
      </CardHeader>
      <CardContent>
        {requestInstructions && (
          <div className="mb-6 p-4 bg-muted rounded-md">
            <p className="text-sm">{requestInstructions}</p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>您的姓名</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入您的姓名" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>联系方式</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="微信号、手机号或其他联系方式" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Creator 将通过此方式与您联系
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requestMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>预约说明</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="请描述您的需求、时间、地点等信息"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    最多 2000 字符
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full"
              disabled={submitBooking.isPending}
            >
              {submitBooking.isPending ? '提交中...' : '提交预约'}
            </Button>

            {submitBooking.error && (
              <div className="text-sm text-destructive mt-2">
                提交失败：{submitBooking.error.message}
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
