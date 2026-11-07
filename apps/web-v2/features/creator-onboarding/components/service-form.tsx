'use client';

import { useEffect, useState } from 'react';
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
import {
  useCreatorCapabilities,
} from '../api/use-creator-capabilities';
import {
  useCreateService,
  useUpdateService,
  useServiceOffering,
} from '../api/use-creator-services';
import { ServiceFormSchema, ServiceFormData } from '../lib/validation';

interface ServiceFormProps {
  serviceId?: string; // 如果存在则为编辑模式
}

export function ServiceForm({ serviceId }: ServiceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = !!serviceId;

  const { data: capabilities, isLoading: capabilitiesLoading } =
    useCreatorCapabilities();
  const { data: existingService, isLoading: serviceLoading } = useServiceOffering(
    serviceId || ''
  );
  const createMutation = useCreateService();
  const updateMutation = useUpdateService(serviceId || '');

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(ServiceFormSchema),
    defaultValues: {
      capabilityIds: [],
      title: '',
      description: '',
      availabilityDescription: '',
      appearance: {},
      requestInstructions: '',
    },
  });

  // 当编辑服务数据加载完成时，填充表单
  useEffect(() => {
    if (isEdit && existingService) {
      form.reset({
        capabilityIds: existingService.capabilityIds,
        title: existingService.title,
        description: existingService.description,
        availabilityDescription: existingService.availabilityDescription,
        appearance: existingService.appearance,
        requestInstructions: existingService.requestInstructions,
      });
    }
  }, [isEdit, existingService, form]);

  async function onSubmit(data: ServiceFormData) {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync(data);
        toast({
          title: '成功',
          description: '服务已更新',
        });
      } else {
        await createMutation.mutateAsync(data);
        toast({
          title: '成功',
          description: '服务已创建',
        });
      }

      // 返回到服务列表页
      router.push('/creator/services');
    } catch (error) {
      toast({
        title: '错误',
        description:
          error instanceof Error ? error.message : '操作失败，请重试',
        variant: 'destructive',
      });
    }
  }

  const isLoading =
    capabilitiesLoading ||
    serviceLoading ||
    createMutation.isPending ||
    updateMutation.isPending;

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>
            {isEdit ? '编辑服务' : '创建新服务'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* 能力选择 - 简化为下拉菜单 */}
              <FormField
                control={form.control}
                name="capabilityIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      关联能力 <span className="text-red-500">*</span>
                    </FormLabel>
                    {capabilities && capabilities.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          选择相关的能力标签 (支持多选，输入能力 ID)
                        </p>
                        <FormControl>
                          <Input
                            placeholder="输入能力 ID，多个用逗号分隔"
                            value={field.value.join(', ')}
                            onChange={(e) => {
                              const ids = e.target.value
                                .split(',')
                                .map((id) => id.trim())
                                .filter((id) => id.length > 0);
                              field.onChange(ids);
                            }}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <div className="flex flex-wrap gap-2">
                          {capabilities.map((cap) => (
                            <Button
                              key={cap.id}
                              type="button"
                              variant={
                                field.value.includes(cap.id)
                                  ? 'default'
                                  : 'outline'
                              }
                              size="sm"
                              onClick={() => {
                                if (field.value.includes(cap.id)) {
                                  field.onChange(
                                    field.value.filter((id) => id !== cap.id)
                                  );
                                } else {
                                  field.onChange([...field.value, cap.id]);
                                }
                              }}
                              disabled={isLoading}
                            >
                              {cap.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        请先{' '}
                        <a href="/creator/capabilities" className="underline">
                          添加能力
                        </a>
                        ，然后再创建服务
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 服务名称 */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      服务名称 <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="例如: 一对一英语口语课程"
                        {...field}
                        disabled={isLoading}
                        maxLength={160}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground mt-1">
                      {field.value.length} / 160 字符
                    </p>
                  </FormItem>
                )}
              />

              {/* 服务描述 */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      详细描述 <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="详细说明您提供的服务内容、教学方法、预期成果等..."
                        className="min-h-[150px]"
                        {...field}
                        disabled={isLoading}
                        maxLength={2000}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground mt-1">
                      {field.value.length} / 2000 字符
                    </p>
                  </FormItem>
                )}
              />

              {/* 可用性描述 */}
              <FormField
                control={form.control}
                name="availabilityDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      可用性描述 <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="例如: 周一到周五 19:00-21:00，周末全天。需要提前 24 小时预约。"
                        className="min-h-[100px]"
                        {...field}
                        disabled={isLoading}
                        maxLength={1000}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground mt-1">
                      {field.value.length} / 1000 字符
                    </p>
                  </FormItem>
                )}
              />

              {/* 请求说明 */}
              <FormField
                control={form.control}
                name="requestInstructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      请求说明 <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="消费者预约时需要提供哪些信息？例如: 学生的英语水平、学习目标、可用时间段等"
                        className="min-h-[100px]"
                        {...field}
                        disabled={isLoading}
                        maxLength={1000}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground mt-1">
                      {field.value.length} / 1000 字符
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
                  {isLoading ? '保存中...' : isEdit ? '更新服务' : '创建服务'}
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
