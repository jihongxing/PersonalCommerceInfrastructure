'use client';

import { useEffect } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useCapability, useUpdateCapability } from '../api/use-capability';
import { CapabilityFormSchema, CapabilityFormData } from '../lib/validation';

interface EditCapabilityFormProps {
  capabilityId: string;
}

export function EditCapabilityForm({ capabilityId }: EditCapabilityFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: capability, isLoading: capabilityLoading } = useCapability(capabilityId);
  const updateMutation = useUpdateCapability(capabilityId);

  const form = useForm<CapabilityFormData>({
    resolver: zodResolver(CapabilityFormSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // 当能力数据加载完成时填充表单
  useEffect(() => {
    if (capability) {
      form.reset({
        name: capability.name,
        description: capability.description,
      });
    }
  }, [capability, form]);

  async function onSubmit(data: CapabilityFormData) {
    try {
      await updateMutation.mutateAsync(data);
      toast({
        title: '成功',
        description: '能力已更新',
      });

      // 返回到能力列表
      router.push('/capabilities');
    } catch (error) {
      toast({
        title: '错误',
        description:
          error instanceof Error ? error.message : '操作失败，请重试',
        variant: 'destructive',
      });
    }
  }

  const isLoading = capabilityLoading || updateMutation.isPending;

  if (capabilityLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!capability) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">能力未找到</p>
            <Button
              variant="outline"
              onClick={() => router.push('/capabilities')}
              className="mt-4"
            >
              返回能力列表
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>编辑能力</CardTitle>
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
                  {isLoading ? '保存中...' : '保存更改'}
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
