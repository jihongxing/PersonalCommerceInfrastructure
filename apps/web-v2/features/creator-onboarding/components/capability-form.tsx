'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useCreateCapability } from '../api/use-creator-capabilities';
import { CapabilityFormSchema, CapabilityFormData } from '../lib/validation';

export function CapabilityForm() {
  const router = useRouter();
  const { toast } = useToast();
  const createMutation = useCreateCapability();

  const form = useForm<CapabilityFormData>({
    resolver: zodResolver(CapabilityFormSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  async function onSubmit(data: CapabilityFormData) {
    try {
      await createMutation.mutateAsync(data);
      toast({
        title: '成功',
        description: '能力已添加',
      });

      // 返回到能力列表页
      router.push('/creator/capabilities');
    } catch (error) {
      toast({
        title: '错误',
        description:
          error instanceof Error ? error.message : '操作失败，请重试',
        variant: 'destructive',
      });
    }
  }

  const isLoading = createMutation.isPending;

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>添加新能力</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* 能力名称 */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      能力名称 <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="例如: 英语口语教学"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground mt-1">
                      最多 100 字符
                    </p>
                  </FormItem>
                )}
              />

              {/* 能力描述 */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      描述 <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="例如: 我专注于帮助学生提高英语口语流利度，包括发音、表达和交流技巧"
                        className="min-h-[100px]"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground mt-1">
                      {field.value.length} / 500 字符
                    </p>
                  </FormItem>
                )}
              />

              {/* 提交按钮 */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? '添加中...' : '添加能力'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                >
                  取消
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
