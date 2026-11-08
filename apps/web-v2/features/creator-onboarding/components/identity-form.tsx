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
  useCreatorIdentity,
  useCreateIdentity,
  useUpdateIdentity,
} from '../api/use-creator-identity';
import { IdentityFormSchema, IdentityFormData } from '../lib/validation';
import { ApiError } from '@/lib/api/client';

export function IdentityForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isNew, setIsNew] = useState(false);

  const { data: identity, isLoading: isLoadingIdentity, error: identityError, refetch } = useCreatorIdentity();
  const createMutation = useCreateIdentity();
  const updateMutation = useUpdateIdentity();

  const form = useForm<IdentityFormData>({
    resolver: zodResolver(IdentityFormSchema),
    defaultValues: {
      displayName: identity?.profile.displayName || '',
      bio: identity?.profile.bio || '',
      avatarUrl: identity?.profile.avatarUrl || '',
      location: identity?.profile.location || '',
      socialLinks: identity?.profile.socialLinks || [],
    },
  });

  // 当数据加载完成，如果没有身份则标记为新建
  useEffect(() => {
    if (identityError instanceof ApiError && identityError.code === 'commerce_identity_not_found') {
      setIsNew(true);
    } else if (identity) {
      setIsNew(false);
      form.reset({ ...identity.profile, socialLinks: (identity.profile.socialLinks || []).map((item) => typeof item === 'string' ? { platform: 'link', url: item } : item) });
    }
  }, [identityError, identity, form]);

  async function onSubmit(data: IdentityFormData) {
    try {
      if (isNew) {
        await createMutation.mutateAsync(data);
        toast({
          title: '成功',
          description: '您的商业身份已创建',
        });
      } else {
        await updateMutation.mutateAsync(data);
        toast({
          title: '成功',
          description: '您的资料已更新',
        });
      }

      // 返回到资料查看页
      router.push('/profile');
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
    isLoadingIdentity || createMutation.isPending || updateMutation.isPending;

  if (identityError && !(identityError instanceof ApiError && identityError.code === 'commerce_identity_not_found')) {
    return <div role="alert"><p>商业身份加载失败</p><Button variant="outline" onClick={() => refetch()}>重试</Button></div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>
            {isNew ? '创建商业身份' : '编辑商业身份'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* 名字 */}
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      您的名字 <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="例如: 李老师"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground mt-1">
                      最多 120 字符
                    </p>
                  </FormItem>
                )}
              />

              {/* 简介 */}
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      简介 <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="例如: 拥有 10 年教学经验的英语老师，专门帮助学生提高口语和写作能力"
                        className="min-h-[100px]"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground mt-1">
                      {field.value.length} / 2000 字符
                    </p>
                  </FormItem>
                )}
              />

              {/* 头像 URL */}
              <FormField
                control={form.control}
                name="avatarUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>头像 URL (可选)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/avatar.jpg"
                        type="url"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 地址 */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>所在地 (可选)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="例如: 北京市"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
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
                  {isLoading ? '保存中...' : '保存'}
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
