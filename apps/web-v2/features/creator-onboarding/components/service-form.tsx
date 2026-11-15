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
import { useToast } from '@/hooks/use-toast';
import { useCreatorCapabilities } from '../api/use-creator-capabilities';
import {
  useCreateService,
  useUpdateService,
  useServiceOffering,
} from '../api/use-creator-services';
import { useServiceCatalog } from '../api/use-service-catalog';
import { ServiceFormSchema, ServiceFormData } from '../lib/validation';

interface ServiceFormProps {
  serviceId?: string; // 如果存在则为编辑模式
}

export function ServiceForm({ serviceId }: ServiceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = !!serviceId;

  const {
    data: capabilities,
    isLoading: capabilitiesLoading,
    isError: capabilitiesError,
    refetch: refetchCapabilities,
  } = useCreatorCapabilities();
  const {
    data: existingService,
    isLoading: serviceLoading,
    isError: serviceError,
    refetch: refetchService,
  } = useServiceOffering(serviceId || '');
  const createMutation = useCreateService();
  const updateMutation = useUpdateService(serviceId || '');
  const catalog = useServiceCatalog();

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(ServiceFormSchema),
    defaultValues: {
      capabilityIds: [],
      templateId: '',
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
        templateId: existingService.templateId ?? '',
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
        await updateMutation.mutateAsync({ ...data, appearance: undefined });
        toast({
          title: '成功',
          description: '服务已更新',
        });
      } else {
        await createMutation.mutateAsync({ ...data, appearance: undefined });
        toast({
          title: '成功',
          description: '服务已创建',
        });
      }

      // 返回到服务列表页
      router.push('/services');
    } catch (error) {
      toast({
        title: '错误',
        description: error instanceof Error ? error.message : '操作失败，请重试',
        variant: 'destructive',
      });
    }
  }

  const isLoading =
    capabilitiesLoading ||
    serviceLoading ||
    catalog.isLoading ||
    createMutation.isPending ||
    updateMutation.isPending;

  if (capabilitiesError || (isEdit && serviceError)) {
    return (
      <div className="max-w-2xl mx-auto space-y-3">
        <p>加载服务信息失败，请重试。</p>
        <Button
          variant="outline"
          onClick={() => {
            if (capabilitiesError) refetchCapabilities();
            if (serviceError) refetchService();
          }}
        >
          重试
        </Button>
      </div>
    );
  }

  if (isEdit && !serviceLoading && !existingService) {
    return <div className="max-w-2xl mx-auto">未找到此服务。</div>;
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? '编辑服务' : '创建新服务'}</CardTitle>
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
                        <p className="text-sm text-muted-foreground">选择相关能力，可多选</p>
                        <div className="flex flex-wrap gap-2">
                          {capabilities.map((cap) => (
                            <Button
                              key={cap.id}
                              type="button"
                              aria-pressed={field.value.includes(cap.id)}
                              variant={field.value.includes(cap.id) ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => {
                                if (field.value.includes(cap.id)) {
                                  field.onChange(field.value.filter((id) => id !== cap.id));
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
                        <a
                          href="/capabilities"
                          className="inline-flex min-h-11 items-center px-1 underline underline-offset-4"
                        >
                          添加能力
                        </a>
                        ，然后再创建服务
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="templateId"
                render={({ field }) => {
                  const selectedCapabilityId = form.watch('capabilityIds')[0];
                  const selectedCapability = capabilities?.find(
                    (capability) => capability.id === selectedCapabilityId,
                  );
                  const catalogItemId = selectedCapability?.catalogItemId;
                  const templates =
                    catalog.data?.templates.filter(
                      (template) =>
                        template.capabilityCatalogItemId === catalogItemId &&
                        template.status === 'active',
                    ) ?? [];
                  return (
                    <FormItem>
                      <FormLabel>
                        服务模板 <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          disabled={isLoading || !catalogItemId}
                          className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">请选择匹配的服务模板</option>
                          {templates.map((template) => (
                            <option key={template.id} value={template.id}>
                              {template.name} ·{' '}
                              {template.riskTier === 'low' ? '自动检查' : '需审核'}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">
                        服务必须使用与能力匹配的模板；审核中的模板不会直接公开。
                      </p>
                      <FormMessage />
                    </FormItem>
                  );
                }}
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
                        placeholder="例如: 周一到周五 19:00-21:00，周末全天。请说明希望联系的时间。"
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
                        placeholder="消费者提交请求时需要提供哪些信息？例如: 学生的英语水平、学习目标、可用时间段等"
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
                <Button type="submit" disabled={isLoading} className="min-h-11 flex-1">
                  {isLoading ? '保存中...' : isEdit ? '更新服务' : '创建服务'}
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
