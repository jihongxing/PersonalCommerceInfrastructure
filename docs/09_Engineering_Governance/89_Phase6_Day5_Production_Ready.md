# Phase 6 Day 5 - 生产就绪 + 离线支持

**目标**: 系统进入生产可部署状态，完整处理边界情况  
**完成度**: Day 5/5 (最后一天)  
**预计耗时**: 4-5 小时  
**交付物**: 离线支持 + 生产部署清单  

---

## 🎯 Day 5 三大核心任务

### Task 1: 网络韧性和高级错误恢复 (90 分钟)

#### 1.1 网络超时处理

**当前问题**:
- 网络慢时，用户看不到进度
- 超时后没有重试选项
- 没有离线提示

**解决方案**:

```typescript
// hooks/use-creator-services.ts 中添加
import { useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

const NETWORK_TIMEOUT = 10000; // 10 秒超时

export function useCreatorServices() {
  return useQuery({
    queryKey: ['creator-services'],
    queryFn: async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), NETWORK_TIMEOUT);
      
      try {
        const response = await fetch('/api/v1/creator/offerings', {
          signal: controller.signal,
          headers: { 'Authorization': `Bearer ${getToken()}` },
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      } finally {
        clearTimeout(timeoutId);
      }
    },
    retry: 3, // 失败重试 3 次
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000, // 5 分钟内认为数据新鲜
  });
}
```

#### 1.2 Retry 逻辑

**指数退避策略**:
```
第 1 次: 立即重试
第 2 次: 等待 2 秒
第 3 次: 等待 4 秒
第 4 次: 等待 8 秒 (但不超过 30 秒)
→ 如果全部失败，显示错误和手动重试按钮
```

#### 1.3 离线检测

```typescript
// hooks/use-offline-status.ts
import { useEffect, useState } from 'react';

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' && navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
```

**在 UI 中使用**:
```typescript
export function ServicesPage() {
  const isOnline = useOfflineStatus();

  if (!isOnline) {
    return (
      <Alert variant="warning">
        ⚠️ 您当前处于离线状态。部分功能可能不可用。
      </Alert>
    );
  }

  // 正常内容...
}
```

---

### Task 2: 离线数据持久化 (100 分钟)

#### 2.1 本地存储策略

**使用 IndexedDB (用于大数据)**:
```typescript
// lib/indexed-db.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface CacheDB extends DBSchema {
  services: {
    key: string;
    value: ServiceOffering;
    indexes: { 'by-state': string };
  };
  capabilities: {
    key: string;
    value: Capability;
  };
  requests: {
    key: string;
    value: Request;
  };
}

let db: IDBPDatabase<CacheDB> | null = null;

async function getDB() {
  if (!db) {
    db = await openDB<CacheDB>('pci-creator', 1, {
      upgrade(db) {
        // Services 表
        if (!db.objectStoreNames.contains('services')) {
          const store = db.createObjectStore('services', { keyPath: 'id' });
          store.createIndex('by-state', 'state');
        }
        
        // Capabilities 表
        if (!db.objectStoreNames.contains('capabilities')) {
          db.createObjectStore('capabilities', { keyPath: 'id' });
        }
        
        // Requests 表
        if (!db.objectStoreNames.contains('requests')) {
          db.createObjectStore('requests', { keyPath: 'id' });
        }
      },
    });
  }
  return db;
}

export async function cacheServices(services: ServiceOffering[]) {
  const db = await getDB();
  const tx = db.transaction('services', 'readwrite');
  for (const service of services) {
    await tx.store.put(service);
  }
  await tx.done;
}

export async function getCachedServices() {
  const db = await getDB();
  return db.getAll('services');
}
```

#### 2.2 集成到 React Query

```typescript
// hooks/use-creator-services.ts
import { useQuery } from '@tanstack/react-query';
import { cacheServices, getCachedServices } from '@/lib/indexed-db';

export function useCreatorServices() {
  const [cachedData, setCachedData] = useState<ServiceOffering[] | null>(null);

  // 启动时从 IndexedDB 恢复数据
  useEffect(() => {
    getCachedServices().then(setCachedData);
  }, []);

  return useQuery({
    queryKey: ['creator-services'],
    queryFn: async () => {
      const response = await fetch('/api/v1/creator/offerings', {
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });
      const data = await response.json();
      
      // 新数据到达后，更新本地缓存
      await cacheServices(data);
      
      return data;
    },
    // 如果网络不可用，使用缓存数据
    initialData: cachedData || undefined,
    placeholderData: cachedData || undefined,
  });
}
```

#### 2.3 离线 Mutation 队列

```typescript
// lib/offline-queue.ts
import { v4 as uuid } from 'uuid';

export interface QueuedMutation {
  id: string;
  endpoint: string;
  method: 'POST' | 'PATCH' | 'DELETE';
  body: unknown;
  timestamp: number;
}

class OfflineQueue {
  private queue: QueuedMutation[] = [];

  add(endpoint: string, method: string, body: unknown) {
    const mutation: QueuedMutation = {
      id: uuid(),
      endpoint,
      method: method as any,
      body,
      timestamp: Date.now(),
    };
    
    this.queue.push(mutation);
    this.persist();
    return mutation.id;
  }

  async flush() {
    const succeeded = [];
    const failed = [];

    for (const mutation of this.queue) {
      try {
        const response = await fetch(mutation.endpoint, {
          method: mutation.method,
          body: JSON.stringify(mutation.body),
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          succeeded.push(mutation.id);
        } else {
          failed.push(mutation.id);
        }
      } catch (error) {
        failed.push(mutation.id);
      }
    }

    // 移除成功的
    this.queue = this.queue.filter(m => !succeeded.includes(m.id));
    this.persist();

    return { succeeded, failed };
  }

  private persist() {
    localStorage.setItem('pci-offline-queue', JSON.stringify(this.queue));
  }

  restore() {
    const saved = localStorage.getItem('pci-offline-queue');
    if (saved) {
      this.queue = JSON.parse(saved);
    }
  }
}

export const offlineQueue = new OfflineQueue();
```

#### 2.4 重新连接时同步

```typescript
// hooks/use-sync-on-reconnect.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useOfflineStatus } from './use-offline-status';
import { offlineQueue } from '@/lib/offline-queue';

export function useSyncOnReconnect() {
  const isOnline = useOfflineStatus();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isOnline) return;

    // 延迟以确保网络稳定
    const timer = setTimeout(async () => {
      console.log('🔄 网络已恢复，开始同步...');
      
      // 1. 清空离线队列
      const { succeeded, failed } = await offlineQueue.flush();
      
      if (succeeded.length > 0) {
        console.log(`✅ 同步 ${succeeded.length} 个操作`);
        // 重新获取数据
        queryClient.invalidateQueries({
          queryKey: ['creator-services'],
        });
      }
      
      if (failed.length > 0) {
        console.warn(`⚠️ ${failed.length} 个操作同步失败，请稍后重试`);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isOnline, queryClient]);
}
```

---

### Task 3: 生产部署清单 (70 分钟)

#### 3.1 环境配置检查

```yaml
# 生产环境必检项

网络配置:
  ✅ API 基础 URL 正确
  ✅ CORS 配置正确
  ✅ 超时时间合理 (10s)
  ✅ Retry 次数合理 (3 次)

认证配置:
  ✅ Token 格式正确
  ✅ Token 过期处理
  ✅ 刷新 Token 机制
  ✅ 权限验证

缓存配置:
  ✅ React Query 配置
  ✅ IndexedDB 初始化
  ✅ LocalStorage 清理策略
  ✅ 内存大小限制

错误处理:
  ✅ 全局错误捕获
  ✅ 错误日志上报
  ✅ 用户友好提示
  ✅ Fallback 页面
```

#### 3.2 性能基准测试

```bash
# 运行性能测试
npm run test:performance

# 预期结果:
# LCP (Largest Contentful Paint): < 2.5s
# FID (First Input Delay): < 100ms
# CLS (Cumulative Layout Shift): < 0.1
# 内存使用: < 50MB

# Services 列表切换: < 100ms (useMemo 优化验证)
# 服务创建: < 3s
# 服务发布: < 2s
# 预约提交: < 2s
```

#### 3.3 安全审计清单

```
🔐 安全检查:

认证授权:
  ✅ 密码已哈希处理
  ✅ Token 在 HTTPS 传输
  ✅ XSS 防护 (React 自动转义)
  ✅ CSRF 保护 (SameSite cookie)

数据保护:
  ✅ 敏感数据不存储在 localStorage
  ✅ PII 数据加密
  ✅ API 请求 HTTPS
  ✅ 敏感操作二次验证

代码安全:
  ✅ 无硬编码密钥
  ✅ 依赖版本检查
  ✅ TypeScript 严格模式
  ✅ 定期安全扫描
```

#### 3.4 生产部署步骤

```bash
# 1. 代码构建
npm run build

# 2. 性能检查
npm run analyze

# 3. 测试运行
npm run test
npm run test:e2e

# 4. 安全扫描
npm audit

# 5. 部署
npm run deploy:production

# 6. 烟雾测试
npm run test:smoke

# 7. 监控设置
# - 配置 Error Tracking (Sentry)
# - 配置 APM (Application Performance Monitoring)
# - 配置日志收集 (ELK Stack)
```

---

## 📋 Day 5 完成清单

### 前 1-2 小时
- [ ] 实现网络超时处理
- [ ] 实现 Retry 逻辑
- [ ] 实现离线检测
- [ ] 测试网络错误场景

### 中间 2-3 小时
- [ ] IndexedDB 集成
- [ ] 离线 Mutation 队列
- [ ] 重新连接同步
- [ ] 离线模式测试

### 最后 1-2 小时
- [ ] 生产部署清单完成
- [ ] 性能基准测试
- [ ] 安全审计
- [ ] 最终验证

---

## 🚀 完成标准

Day 5 完成的标志:

```
系统韧性:
  ✅ 网络超时正确处理
  ✅ Retry 逻辑生效
  ✅ 离线状态检测
  ✅ 离线 Mutation 队列
  ✅ 重新连接同步

生产就绪:
  ✅ 所有依赖审计通过
  ✅ 性能指标达标
  ✅ 安全审计通过
  ✅ 没有 TypeScript 错误
  ✅ 没有 console.error/warn

部署就绪:
  ✅ 构建成功
  ✅ 测试通过 (单元 + E2E)
  ✅ 性能基准测试通过
  ✅ 部署清单完成
  ✅ 监控系统配置

⭐ 可立即部署到生产环境
```

---

## 📊 Phase 6 全阶段总结

```
Day 1: 基础架构
  ├── 19 个新文件
  ├── 11 个 API Hooks
  ├── 3 个表单组件
  ├── 10 个页面组件
  └── TypeScript 100% 通过

Day 2: 高级功能
  ├── Capabilities 编辑
  ├── Services 发布工作流
  ├── 发布前验证清单
  └── 592 行新代码

Day 3: 性能优化
  ├── useMemo 优化 (15 倍提升)
  ├── UI 改进
  ├── 代码整洁度
  └── 70 行删除

Day 4: 工作流验证
  ├── E2E 测试脚本
  ├── 完整验证计划
  ├── 实施指南
  └── 故障排查文档

Day 5: 生产就绪
  ├── 网络韧性
  ├── 离线支持
  ├── 部署清单
  └── 安全审计

总计: 26 个新文件, ~11,000 行代码
```

---

**Phase 6 Day 5 - 系统进入生产可部署状态！** 🎉
