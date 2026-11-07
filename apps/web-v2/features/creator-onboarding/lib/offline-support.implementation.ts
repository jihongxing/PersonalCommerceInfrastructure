/**
 * Phase 6 Day 5 - 离线支持和网络韧性实现
 * 
 * 核心文件:
 * 1. hooks/use-offline-status.ts - 离线检测
 * 2. lib/offline-queue.ts - 离线 Mutation 队列
 * 3. hooks/use-sync-on-reconnect.ts - 重新连接同步
 * 4. hooks/use-creator-services-resilient.ts - 韧性增强的查询
 */

// ============================================
// 1. hooks/use-offline-status.ts
// ============================================

import { useEffect, useState } from 'react';

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => {
      console.log('✅ 网络已连接');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('⚠️ 网络已断开');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// ============================================
// 2. lib/offline-queue.ts
// ============================================

import { v4 as uuid } from 'uuid';

export interface QueuedMutation {
  id: string;
  endpoint: string;
  method: 'POST' | 'PATCH' | 'DELETE';
  body: unknown;
  headers?: Record<string, string>;
  timestamp: number;
  retries: number;
}

class OfflineQueue {
  private queue: QueuedMutation[] = [];
  private readonly STORAGE_KEY = 'pci-offline-queue';
  private readonly MAX_RETRIES = 3;

  constructor() {
    this.restore();
  }

  add(
    endpoint: string,
    method: 'POST' | 'PATCH' | 'DELETE',
    body: unknown,
    headers?: Record<string, string>
  ): string {
    const mutation: QueuedMutation = {
      id: uuid(),
      endpoint,
      method,
      body,
      headers,
      timestamp: Date.now(),
      retries: 0,
    };

    this.queue.push(mutation);
    this.persist();

    console.log(`📝 离线操作已队列化: ${endpoint} (${mutation.id})`);
    return mutation.id;
  }

  async flush(getToken: () => string): Promise<{
    succeeded: string[];
    failed: string[];
    errors: Array<{ id: string; error: string }>;
  }> {
    if (this.queue.length === 0) {
      console.log('✅ 离线队列为空，无需同步');
      return { succeeded: [], failed: [], errors: [] };
    }

    console.log(`🔄 开始同步 ${this.queue.length} 个离线操作...`);

    const succeeded: string[] = [];
    const failed: string[] = [];
    const errors: Array<{ id: string; error: string }> = [];

    for (const mutation of this.queue) {
      try {
        const response = await fetch(mutation.endpoint, {
          method: mutation.method,
          body: JSON.stringify(mutation.body),
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
            ...mutation.headers,
          },
        });

        if (response.ok) {
          succeeded.push(mutation.id);
          console.log(`✅ 同步成功: ${mutation.endpoint}`);
        } else {
          failed.push(mutation.id);
          errors.push({
            id: mutation.id,
            error: `HTTP ${response.status}: ${response.statusText}`,
          });
          console.warn(`❌ 同步失败: ${mutation.endpoint} - HTTP ${response.status}`);
        }
      } catch (error) {
        failed.push(mutation.id);
        errors.push({
          id: mutation.id,
          error: error instanceof Error ? error.message : '未知错误',
        });
        console.error(`❌ 同步出错: ${mutation.endpoint} - ${error}`);
      }
    }

    // 移除成功的操作
    this.queue = this.queue.filter((m) => !succeeded.includes(m.id));

    // 记录失败的操作重试次数
    for (const mutation of this.queue) {
      mutation.retries++;
    }

    this.persist();

    console.log(`📊 同步结果: ${succeeded.length} 成功, ${failed.length} 失败`);
    return { succeeded, failed, errors };
  }

  getQueuedCount(): number {
    return this.queue.length;
  }

  getPendingMutations(): QueuedMutation[] {
    return [...this.queue];
  }

  removeMutation(id: string): void {
    this.queue = this.queue.filter((m) => m.id !== id);
    this.persist();
  }

  clear(): void {
    this.queue = [];
    localStorage.removeItem(this.STORAGE_KEY);
  }

  private persist(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('❌ 无法保存离线队列到 localStorage:', error);
    }
  }

  private restore(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        this.queue = JSON.parse(saved);
        console.log(`📚 恢复 ${this.queue.length} 个离线操作`);
      }
    } catch (error) {
      console.error('❌ 无法从 localStorage 恢复离线队列:', error);
      this.queue = [];
    }
  }
}

export const offlineQueue = new OfflineQueue();

// ============================================
// 3. hooks/use-sync-on-reconnect.ts
// ============================================

import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';

export function useSyncOnReconnect(getToken: () => string) {
  const isOnline = useOfflineStatus();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const performSync = useCallback(async () => {
    if (!isOnline) return;

    console.log('🔄 网络已恢复，开始同步离线操作...');

    try {
      const { succeeded, failed, errors } = await offlineQueue.flush(getToken);

      if (succeeded.length > 0) {
        console.log(`✅ 同步成功 ${succeeded.length} 个操作`);

        // 重新获取相关数据
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ['creator-services'],
          }),
          queryClient.invalidateQueries({
            queryKey: ['creator-capabilities'],
          }),
          queryClient.invalidateQueries({
            queryKey: ['creator-requests'],
          }),
          queryClient.invalidateQueries({
            queryKey: ['creator-identity'],
          }),
        ]);

        toast({
          title: '同步完成',
          description: `已成功同步 ${succeeded.length} 个操作`,
          variant: 'default',
        });
      }

      if (failed.length > 0) {
        console.warn(`⚠️ ${failed.length} 个操作同步失败`);
        toast({
          title: '部分同步失败',
          description: `${failed.length} 个操作同步失败，请稍后重试`,
          variant: 'destructive',
        });

        // 输出详细错误
        errors.forEach((e) => {
          console.error(`  - ${e.id}: ${e.error}`);
        });
      }
    } catch (error) {
      console.error('❌ 同步过程出错:', error);
      toast({
        title: '同步错误',
        description: '同步过程中出现错误，请稍后重试',
        variant: 'destructive',
      });
    }
  }, [isOnline, queryClient, getToken, toast]);

  useEffect(() => {
    if (!isOnline) return;

    // 延迟以确保网络稳定
    const timer = setTimeout(performSync, 2000);

    return () => clearTimeout(timer);
  }, [isOnline, performSync]);

  return { performSync };
}

// ============================================
// 4. hooks/use-creator-services-resilient.ts
// ============================================

import { useQuery, useMutation } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useOfflineStatus } from './use-offline-status';

const NETWORK_TIMEOUT = 10000; // 10 秒
const RETRY_DELAY = (attemptIndex: number) =>
  Math.min(1000 * 2 ** attemptIndex, 30000);

export function useCreatorServicesResilient(getToken: () => string) {
  const isOnline = useOfflineStatus();
  const [cachedData, setCachedData] = useState<any[] | null>(null);

  // 启动时从 localStorage 恢复缓存数据
  useEffect(() => {
    const cached = localStorage.getItem('creator-services-cache');
    if (cached) {
      try {
        setCachedData(JSON.parse(cached));
      } catch (error) {
        console.error('❌ 无法恢复缓存数据:', error);
      }
    }
  }, []);

  return useQuery({
    queryKey: ['creator-services'],
    queryFn: async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        NETWORK_TIMEOUT
      );

      try {
        const response = await fetch('/api/v1/creator/offerings', {
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${getToken()}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // 缓存到 localStorage
        localStorage.setItem('creator-services-cache', JSON.stringify(data));

        return data;
      } finally {
        clearTimeout(timeoutId);
      }
    },
    retry: (failureCount, error: any) => {
      // 网络错误 5 次以上就放弃
      if (failureCount > 5) return false;

      // 如果离线，不重试（等待网络恢复）
      if (!isOnline) return false;

      return true;
    },
    retryDelay: RETRY_DELAY,
    staleTime: 5 * 60 * 1000, // 5 分钟
    gcTime: 10 * 60 * 1000, // 10 分钟垃圾回收
    
    // 使用缓存数据作为初始/占位数据
    initialData: cachedData || undefined,
    placeholderData: cachedData || undefined,
  });
}

// ============================================
// 5. 使用示例
// ============================================

/**
 * 在 Creator Dashboard 中使用
 */

import { useOfflineStatus } from '@/hooks/use-offline-status';
import { useSyncOnReconnect } from '@/hooks/use-sync-on-reconnect';
import { useCreatorServicesResilient } from '@/hooks/use-creator-services-resilient';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export function CreatorDashboard() {
  const isOnline = useOfflineStatus();
  const getToken = () => localStorage.getItem('creator-token') || '';

  // 使用韧性增强的查询
  const { data: services, isLoading, isError, error } = useCreatorServicesResilient(getToken);

  // 监听重新连接并同步
  useSyncOnReconnect(getToken);

  return (
    <div>
      {/* 离线状态提示 */}
      {!isOnline && (
        <Alert variant="warning" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            您当前处于离线状态。部分功能可能不可用，数据更改将在恢复连接后同步。
          </AlertDescription>
        </Alert>
      )}

      {/* 加载中 */}
      {isLoading && !services && (
        <div className="space-y-4">
          <div className="h-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-20 bg-gray-200 rounded animate-pulse" />
        </div>
      )}

      {/* 错误状态 */}
      {isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : '加载失败，请重试'}
          </AlertDescription>
        </Alert>
      )}

      {/* 内容 */}
      {services && (
        <div className="space-y-4">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// 6. 离线 Mutation 示例
// ============================================

export function usePublishServiceWithOfflineSupport() {
  const isOnline = useOfflineStatus();
  const queryClient = useQueryClient();
  const getToken = () => localStorage.getItem('creator-token') || '';

  return useMutation({
    mutationFn: async (serviceId: string) => {
      if (!isOnline) {
        // 离线时，将操作加入队列
        const id = offlineQueue.add(
          `/api/v1/creator/offerings/${serviceId}/publish`,
          'POST',
          {},
          { 'Authorization': `Bearer ${getToken()}` }
        );
        return { id, offline: true };
      }

      // 在线时正常执行
      const response = await fetch(
        `/api/v1/creator/offerings/${serviceId}/publish`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getToken()}`,
          },
        }
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    },
    onSuccess: () => {
      // 失效缓存
      queryClient.invalidateQueries({
        queryKey: ['creator-services'],
      });
    },
  });
}
