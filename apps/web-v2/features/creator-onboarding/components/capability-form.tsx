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
import { useServiceCatalog } from '../api/use-service-catalog';
import { CapabilityFormSchema, CapabilityFormData } from '../lib/validation';

export function CapabilityForm() {
  const router = useRouter();
  const { toast } = useToast();
  const createMutation = useCreateCapability();
  const catalog = useServiceCatalog();

  const form = useForm<CapabilityFormData>({
    resolver: zodResolver(CapabilityFormSchema),
    defaultValues: {
      name: '',
      description: '',
      catalogItemId: '',
    },
  });

  async function onSubmit(data: CapabilityFormData) {
    if (!data.catalogItemId) {
      toast({
        title: '请选择能力类型',
        description: '能力必须来自平台能力目录。',
        variant: 'destructive',
      });
      return;
    }
    try {
      const selected = catalog.data?.capabilities.find((item) => item.id === data.catalogItemId);
      await createMutation.mutateAsync({
        ...data,
        name: selected?.name ?? data.name,
        catalogItemId: data.catalogItemId || undefined,
      });
      toast({
        title: '成功',
        description: '能力已添加',
      });

      // 返回到能力列表页
      router.push('/capabilities');
    } catch (error) {
      toast({
        title: '错误',
        description: error instanceof Error ? error.message : '操作失败，请重试',
        variant: 'destructive',
      });
    }
  }

  const isLoading = createMutation.isPending || catalog.isLoading;

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>添加新能力</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="catalogItemId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      能力类型 <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        disabled={isLoading}
                        className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">请选择平台能力类型</option>
                        {catalog.data?.capabilities
                          .filter((item) => item.status === 'active')
                          .map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} · {item.vertical}
                            </option>
                          ))}
                      </select>
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1">
                      能力类型由平台目录管理；找不到匹配类型时请联系平台申请新增。
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        placeholder="选择类型后自动填充，可补充显示名称"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground mt-1">最多 100 字符</p>
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
                <Button type="submit" disabled={isLoading} className="min-h-11 flex-1">
                  {isLoading ? '添加中...' : '添加能力'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
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
