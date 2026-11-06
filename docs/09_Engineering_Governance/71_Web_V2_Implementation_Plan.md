# Web V2 全量重写实施计划

**项目**: Personal Commerce Infrastructure  
**文档日期**: 2026-11-06  
**状态**: 已确认，等待实施  
**执行周期**: 14-18 天（稳健路线）  

---

## 一、项目决策（已确认）

### 1.1 关键决策

| 决策项 | 选择方案 | 理由 |
|--------|---------|------|
| **路由方案** | 提案 A：`/r/`, `/s/`, `/o/` | 短 URL，易分享，符合 C号 定位 |
| **状态管理** | React Query + useState | 服务端状态与 UI 状态分离，简单高效 |
| **实施策略** | 全量重写（新建 `apps/web-v2`） | 降低风险，可并行对比 |
| **组件基础** | shadcn/ui | 高质量组件库，无障碍支持，社区标准 |
| **迁移策略** | 完全不参考旧代码（从零开始） | 避免历史包袱，思路清晰 |
| **时间线** | 稳健路线（14-18 天） | 充分打磨质量，降低返工风险 |

### 1.2 优先级

- **P0**: C号 访问路径（Creator Profile → 服务详情 → 订单结果）
- **P1**: Creator 后台核心功能（Identity + Offerings + Orders）
- **P2**: Operations 后台（暂不实施，保留旧版本）

---

## 二、新项目架构

### 2.1 项目结构

```
apps/
├── web/                           # 旧版本（保留不动，作为参考）
│   └── src/...
│
└── web-v2/                        # 新版本（全量重写）
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx                    # Root Layout
    │   │   ├── providers.tsx                 # React Query Provider
    │   │   │
    │   │   ├── (marketing)/                  # 营销页面组（可选）
    │   │   │   └── page.tsx                  # 首页
    │   │   │
    │   │   ├── (public)/                     # 公开页面组（P0）
    │   │   │   ├── layout.tsx                # 公开页面布局
    │   │   │   ├── r/
    │   │   │   │   └── [commerceRef]/
    │   │   │   │       └── page.tsx          # Creator Profile
    │   │   │   ├── s/
    │   │   │   │   └── [offeringId]/
    │   │   │   │       └── page.tsx          # 服务详情 + 预约
    │   │   │   └── o/
    │   │   │       └── [token]/
    │   │   │           └── page.tsx          # 订单结果 + 履约码
    │   │   │
    │   │   ├── (creator)/                    # Creator 后台组（P1）
    │   │   │   ├── layout.tsx                # Creator 后台布局
    │   │   │   └── creator/
    │   │   │       ├── page.tsx              # Dashboard
    │   │   │       ├── identity/
    │   │   │       │   └── page.tsx          # Identity 管理
    │   │   │       ├── offerings/
    │   │   │       │   └── page.tsx          # Offerings 管理
    │   │   │       └── orders/
    │   │   │           └── page.tsx          # Orders 管理
    │   │   │
    │   │   └── api/                          # API 路由（如需要）
    │   │       └── auth/[...path]/
    │   │
    │   ├── components/
    │   │   ├── ui/                           # shadcn/ui 基础组件
    │   │   │   ├── button.tsx
    │   │   │   ├── card.tsx
    │   │   │   ├── input.tsx
    │   │   │   ├── dialog.tsx
    │   │   │   ├── form.tsx
    │   │   │   ├── toast.tsx
    │   │   │   └── ...
    │   │   │
    │   │   ├── commerce/                     # 业务组件层
    │   │   │   ├── creator-profile-card.tsx
    │   │   │   ├── service-card.tsx
    │   │   │   ├── service-list.tsx
    │   │   │   ├── booking-form.tsx
    │   │   │   ├── order-status-badge.tsx
    │   │   │   ├── order-card.tsx
    │   │   │   ├── fulfillment-code-display.tsx
    │   │   │   ├── fulfillment-code-scanner.tsx
    │   │   │   ├── wallet-card.tsx
    │   │   │   └── ...
    │   │   │
    │   │   └── layout/                       # 布局组件层
    │   │       ├── header.tsx
    │   │       ├── footer.tsx
    │   │       ├── sidebar.tsx
    │   │       ├── container.tsx
    │   │       └── ...
    │   │
    │   ├── features/                         # 功能模块（Feature-Sliced Design）
    │   │   ├── creator-profile/              # P0 功能
    │   │   │   ├── api/
    │   │   │   │   └── use-creator-profile.ts
    │   │   │   ├── components/
    │   │   │   │   └── profile-view.tsx
    │   │   │   └── types.ts
    │   │   │
    │   │   ├── service-booking/              # P0 功能
    │   │   │   ├── api/
    │   │   │   │   ├── use-service.ts
    │   │   │   │   └── use-booking.ts
    │   │   │   ├── components/
    │   │   │   │   ├── service-view.tsx
    │   │   │   │   └── booking-flow.tsx
    │   │   │   └── types.ts
    │   │   │
    │   │   ├── order-fulfillment/            # P0 功能
    │   │   │   ├── api/
    │   │   │   │   ├── use-order.ts
    │   │   │   │   └── use-fulfillment.ts
    │   │   │   ├── components/
    │   │   │   │   └── order-view.tsx
    │   │   │   └── types.ts
    │   │   │
    │   │   └── creator-dashboard/            # P1 功能
    │   │       ├── api/
    │   │       │   ├── use-creator-identity.ts
    │   │       │   ├── use-offerings.ts
    │   │       │   └── use-orders.ts
    │   │       ├── components/
    │   │       │   ├── identity-editor.tsx
    │   │       │   ├── offering-manager.tsx
    │   │       │   └── order-manager.tsx
    │   │       └── types.ts
    │   │
    │   ├── lib/
    │   │   ├── api/
    │   │   │   ├── client.ts                 # OpenAPI Fetch Client
    │   │   │   ├── types.ts                  # 从旧项目复制类型
    │   │   │   └── query-client.ts           # React Query 配置
    │   │   │
    │   │   ├── auth/
    │   │   │   └── provider.ts               # 认证逻辑（从旧项目复制）
    │   │   │
    │   │   └── utils/
    │   │       ├── cn.ts                     # Tailwind merge（shadcn 自带）
    │   │       ├── format.ts                 # 格式化工具
    │   │       └── validation.ts             # Zod schemas
    │   │
    │   └── styles/
    │       └── globals.css                   # Tailwind + Design Tokens
    │
    ├── public/
    │   └── ...
    │
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── next.config.js
    └── components.json                       # shadcn/ui 配置
```

### 2.2 技术栈

```json
{
  "name": "web-v2",
  "dependencies": {
    "next": "16.1.4",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    
    "@tanstack/react-query": "^5.62.0",
    "@tanstack/react-query-devtools": "^5.62.0",
    
    "openapi-fetch": "0.15.0",
    "openapi-typescript-helpers": "^0.0.13",
    
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.2",
    "@radix-ui/react-label": "^2.1.1",
    "@radix-ui/react-select": "^2.1.2",
    "@radix-ui/react-slot": "^1.1.1",
    "@radix-ui/react-toast": "^1.2.2",
    
    "qrcode": "^1.5.4",
    "qr-scanner": "^1.4.2",
    
    "zod": "^3.24.1",
    "react-hook-form": "^7.54.0",
    "@hookform/resolvers": "^3.9.1",
    
    "tailwind-merge": "^2.5.5",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    
    "date-fns": "^4.1.0",
    "lucide-react": "^0.462.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.1",
    "@types/react": "^19.0.1",
    "@types/react-dom": "^19.0.2",
    "typescript": "^5.7.2",
    "tailwindcss": "^4.1.18",
    "@playwright/test": "^1.49.0",
    "eslint": "^9.16.0",
    "eslint-config-next": "16.1.4"
  }
}
```

### 2.3 设计系统（Tailwind Config）

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
```

---

## 三、实施计划（14-18 天）

### Phase 0：项目初始化（Day 1）

#### 0.1 创建新项目

```bash
# 在项目根目录
cd apps

# 创建 Next.js 项目
pnpm create next-app@latest web-v2 \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*"

# 进入新项目
cd web-v2

# 初始化 shadcn/ui
pnpm dlx shadcn@latest init
# 选择：
# - Style: New York
# - Base color: Slate
# - CSS variables: Yes
```

#### 0.2 安装依赖

```bash
# React Query
pnpm add @tanstack/react-query @tanstack/react-query-devtools

# API Client
pnpm add openapi-fetch openapi-typescript-helpers

# QR 码
pnpm add qrcode qr-scanner
pnpm add -D @types/qrcode

# 表单管理
pnpm add react-hook-form @hookform/resolvers zod

# 工具库
pnpm add date-fns lucide-react

# 测试
pnpm add -D @playwright/test
```

#### 0.3 配置 React Query

```typescript
// src/lib/api/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 分钟
      gcTime: 1000 * 60 * 30, // 30 分钟
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

```typescript
// src/app/providers.tsx
'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/api/query-client';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

#### 0.4 配置 API Client

```typescript
// src/lib/api/client.ts
import createClient from 'openapi-fetch';
import type { paths } from './generated'; // 从旧项目复制

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export const apiClient = createClient<paths>({ baseUrl: API_BASE_URL });

export type ApiClient = typeof apiClient;
```

#### 0.5 安装 shadcn 基础组件

```bash
# 安装核心组件
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add input
pnpm dlx shadcn@latest add label
pnpm dlx shadcn@latest add form
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add toast
pnpm dlx shadcn@latest add badge
pnpm dlx shadcn@latest add separator
pnpm dlx shadcn@latest add skeleton
```

**交付物**：
- ✅ `apps/web-v2` 项目已创建
- ✅ shadcn/ui 已初始化
- ✅ React Query 已配置
- ✅ API Client 已配置
- ✅ 基础 UI 组件已安装

---

### Phase 1：P0 核心流程 - Creator Profile（Day 2-3）

#### 目标
实现 `/r/[commerceRef]` 路由，展示 Creator Profile + 服务列表

#### 1.1 后端 API（如需要）

```typescript
// 检查是否已有 API
GET /api/v1/public/commerce-profile/:commerceRef

// 如果没有，需要实现：
// 返回：
{
  commerceReference: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  offerings: Array<{
    id: string;
    title: string;
    description: string;
    priceMinor: number;
    currency: string;
  }>;
}
```

#### 1.2 React Query Hook

```typescript
// src/features/creator-profile/api/use-creator-profile.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export function useCreatorProfile(commerceRef: string) {
  return useQuery({
    queryKey: ['creator-profile', commerceRef],
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        '/api/v1/public/commerce-profile/{commerceRef}',
        {
          params: { path: { commerceRef } },
        }
      );
      if (error) throw new Error('Failed to load creator profile');
      return data;
    },
  });
}
```

#### 1.3 组件：Creator Profile Card

```typescript
// src/components/commerce/creator-profile-card.tsx
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface CreatorProfileCardProps {
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  commerceReference: string;
}

export function CreatorProfileCard({
  displayName,
  bio,
  avatarUrl,
  commerceReference,
}: CreatorProfileCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback>{displayName[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{displayName}</h1>
            <p className="text-sm text-muted-foreground">{commerceReference}</p>
          </div>
        </div>
      </CardHeader>
      {bio && (
        <CardContent>
          <p className="text-muted-foreground">{bio}</p>
        </CardContent>
      )}
    </Card>
  );
}
```

#### 1.4 组件：Service Card

```typescript
// src/components/commerce/service-card.tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/format';

interface ServiceCardProps {
  id: string;
  title: string;
  description: string;
  priceMinor: number;
  currency: string;
  onBook: (id: string) => void;
}

export function ServiceCard({
  id,
  title,
  description,
  priceMinor,
  currency,
  onBook,
}: ServiceCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">
          {formatCurrency(priceMinor, currency)}
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={() => onBook(id)} className="w-full">
          立即预约
        </Button>
      </CardFooter>
    </Card>
  );
}
```

#### 1.5 页面：Creator Profile

```typescript
// src/app/(public)/r/[commerceRef]/page.tsx
import { notFound } from 'next/navigation';
import { useCreatorProfile } from '@/features/creator-profile/api/use-creator-profile';
import { CreatorProfileCard } from '@/components/commerce/creator-profile-card';
import { ServiceCard } from '@/components/commerce/service-card';

export default function CreatorProfilePage({
  params,
}: {
  params: { commerceRef: string };
}) {
  const { data: profile, isLoading, error } = useCreatorProfile(params.commerceRef);

  if (isLoading) return <div>加载中...</div>;
  if (error || !profile) return notFound();

  const handleBook = (offeringId: string) => {
    // 跳转到 /s/[offeringId]
    window.location.href = `/s/${offeringId}`;
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <CreatorProfileCard
        displayName={profile.displayName}
        bio={profile.bio}
        avatarUrl={profile.avatarUrl}
        commerceReference={params.commerceRef}
      />
      
      <div>
        <h2 className="text-xl font-semibold mb-4">服务列表</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profile.offerings.map((offering) => (
            <ServiceCard
              key={offering.id}
              id={offering.id}
              title={offering.title}
              description={offering.description}
              priceMinor={offering.priceMinor}
              currency={offering.currency}
              onBook={handleBook}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

**交付物**：
- ✅ Creator Profile 页面（`/r/[commerceRef]`）
- ✅ `creator-profile-card.tsx` 组件
- ✅ `service-card.tsx` 组件
- ✅ `use-creator-profile.ts` hook

---

### Phase 2：P0 核心流程 - 服务预约（Day 4-5）

#### 目标
实现 `/s/[offeringId]` 路由，展示服务详情 + 预约表单

#### 2.1 React Query Hooks

```typescript
// src/features/service-booking/api/use-service.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export function useService(offeringId: string) {
  return useQuery({
    queryKey: ['service', offeringId],
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        '/api/v1/public/offerings/{offeringId}',
        {
          params: { path: { offeringId } },
        }
      );
      if (error) throw new Error('Failed to load service');
      return data;
    },
  });
}

// src/features/service-booking/api/use-booking.ts
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export function useCreateBooking() {
  return useMutation({
    mutationFn: async (data: {
      offeringId: string;
      customerName: string;
      customerContact: string;
      message: string;
    }) => {
      const { data: result, error } = await apiClient.POST(
        '/api/v1/public/requests',
        { body: data }
      );
      if (error) throw new Error('Failed to create booking');
      return result;
    },
  });
}
```

#### 2.2 组件：Booking Form

```typescript
// src/components/commerce/booking-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
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

const bookingSchema = z.object({
  customerName: z.string().min(1, '请输入姓名'),
  customerContact: z.string().min(1, '请输入联系方式'),
  message: z.string().min(1, '请输入需求说明'),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingFormProps {
  offeringId: string;
  onSubmit: (data: BookingFormData & { offeringId: string }) => void;
  isSubmitting?: boolean;
}

export function BookingForm({ offeringId, onSubmit, isSubmitting }: BookingFormProps) {
  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customerName: '',
      customerContact: '',
      message: '',
    },
  });

  const handleSubmit = (data: BookingFormData) => {
    onSubmit({ ...data, offeringId });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="customerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>姓名</FormLabel>
              <FormControl>
                <Input placeholder="请输入您的姓名" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customerContact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>联系方式</FormLabel>
              <FormControl>
                <Input placeholder="手机号或微信号" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>需求说明</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="请描述您的需求"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? '提交中...' : '提交预约'}
        </Button>
      </form>
    </Form>
  );
}
```

#### 2.3 页面：Service Booking

```typescript
// src/app/(public)/s/[offeringId]/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { useService } from '@/features/service-booking/api/use-service';
import { useCreateBooking } from '@/features/service-booking/api/use-booking';
import { BookingForm } from '@/components/commerce/booking-form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/format';

export default function ServiceBookingPage({
  params,
}: {
  params: { offeringId: string };
}) {
  const router = useRouter();
  const { data: service, isLoading } = useService(params.offeringId);
  const createBooking = useCreateBooking();

  if (isLoading) return <div>加载中...</div>;
  if (!service) return notFound();

  const handleSubmit = async (data: any) => {
    try {
      const result = await createBooking.mutateAsync(data);
      // 跳转到订单结果页
      router.push(`/o/${result.resultAccessToken}`);
    } catch (error) {
      alert('预约失败，请稍后重试');
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{service.title}</CardTitle>
          <CardDescription>{service.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {formatCurrency(service.priceMinor, service.currency)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>预约信息</CardTitle>
        </CardHeader>
        <CardContent>
          <BookingForm
            offeringId={params.offeringId}
            onSubmit={handleSubmit}
            isSubmitting={createBooking.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
```

**交付物**：
- ✅ 服务预约页面（`/s/[offeringId]`）
- ✅ `booking-form.tsx` 组件
- ✅ `use-service.ts` 和 `use-booking.ts` hooks

---

### Phase 3：P0 核心流程 - 订单结果（Day 6-8）

#### 目标
实现 `/o/[token]` 路由，展示订单状态 + 履约码

#### 3.1 React Query Hook

```typescript
// src/features/order-fulfillment/api/use-order.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export function useOrder(token: string) {
  return useQuery({
    queryKey: ['order', token],
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        '/api/v1/public/requests/{token}',
        {
          params: { path: { token } },
        }
      );
      if (error) throw new Error('Failed to load order');
      return data;
    },
    refetchInterval: (query) => {
      // 如果是 pending 状态，每 10 秒轮询一次
      return query.state.data?.state === 'submitted' ? 10000 : false;
    },
  });
}
```

#### 3.2 组件：Order Status Badge

```typescript
// src/components/commerce/order-status-badge.tsx
import { Badge } from '@/components/ui/badge';

const STATUS_MAP = {
  draft: { label: '草稿', variant: 'secondary' },
  submitted: { label: '待确认', variant: 'default' },
  confirmed: { label: '已确认', variant: 'success' },
  declined: { label: '已拒绝', variant: 'destructive' },
} as const;

interface OrderStatusBadgeProps {
  status: keyof typeof STATUS_MAP;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = STATUS_MAP[status] || STATUS_MAP.draft;
  return <Badge variant={config.variant as any}>{config.label}</Badge>;
}
```

#### 3.3 组件：Fulfillment Code Display

```typescript
// src/components/commerce/fulfillment-code-display.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import QRCode from 'qrcode';

interface FulfillmentCodeDisplayProps {
  code: string;
  status: 'pending' | 'fulfilled' | 'expired';
  expiresAt: string;
  confirmedAt?: string;
}

export function FulfillmentCodeDisplay({
  code,
  status,
  expiresAt,
  confirmedAt,
}: FulfillmentCodeDisplayProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL(code, { width: 300 }).then(setQrCodeUrl);
  }, [code]);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const expires = new Date(expiresAt);
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('已过期');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours}小时${minutes}分钟${seconds}秒`);
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  const statusConfig = {
    pending: { label: '待核销', variant: 'default' },
    fulfilled: { label: '已核销', variant: 'success' },
    expired: { label: '已过期', variant: 'destructive' },
  } as const;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>履约码</CardTitle>
          <Badge variant={statusConfig[status].variant as any}>
            {statusConfig[status].label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-3xl font-mono font-bold mb-4">{code}</p>
          {qrCodeUrl && (
            <img
              src={qrCodeUrl}
              alt="履约码二维码"
              className="mx-auto border-4 border-gray-200 rounded"
            />
          )}
        </div>

        {status === 'pending' && (
          <div className="text-center text-muted-foreground">
            <p>剩余时间：{timeRemaining}</p>
            <p className="text-sm mt-2">请在约定时间向 Creator 出示此履约码</p>
          </div>
        )}

        {status === 'fulfilled' && confirmedAt && (
          <div className="text-center text-muted-foreground">
            <p>核销时间：{new Date(confirmedAt).toLocaleString()}</p>
          </div>
        )}

        {status === 'expired' && (
          <div className="text-center text-muted-foreground">
            <p>履约码已过期，请联系 Creator</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

#### 3.4 页面：Order Result

```typescript
// src/app/(public)/o/[token]/page.tsx
'use client';

import { notFound } from 'next/navigation';
import { useOrder } from '@/features/order-fulfillment/api/use-order';
import { OrderStatusBadge } from '@/components/commerce/order-status-badge';
import { FulfillmentCodeDisplay } from '@/components/commerce/fulfillment-code-display';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function OrderResultPage({
  params,
}: {
  params: { token: string };
}) {
  const { data: order, isLoading } = useOrder(params.token);

  if (isLoading) return <div>加载中...</div>;
  if (!order) return notFound();

  return (
    <div className="container mx-auto py-8 max-w-2xl space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>订单详情</CardTitle>
            <OrderStatusBadge status={order.state} />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{order.message}</p>
        </CardContent>
      </Card>

      {order.state === 'confirmed' && order.fulfillmentCode && (
        <FulfillmentCodeDisplay
          code={order.fulfillmentCode.code}
          status={order.fulfillmentCode.status}
          expiresAt={order.fulfillmentCode.expiresAt}
          confirmedAt={order.fulfillmentCode.confirmedAt}
        />
      )}

      {order.state === 'submitted' && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>等待 Creator 确认</p>
            <p className="text-sm mt-2">预计 24 小时内回复</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

**交付物**：
- ✅ 订单结果页面（`/o/[token]`）
- ✅ `order-status-badge.tsx` 组件
- ✅ `fulfillment-code-display.tsx` 组件
- ✅ `use-order.ts` hook

---

### Phase 4：P1 功能 - Creator 后台（Day 9-13）

#### 目标
重构 Creator 后台，拆分大组件，使用 React Query

#### 4.1 Creator Identity 管理（Day 9-10）

**组件**：
- `identity-editor.tsx` - Profile 编辑表单
- `capability-list.tsx` - Capability 列表
- `commerce-reference-display.tsx` - C号 展示

**Hooks**：
- `use-creator-identity.ts` - 获取 Identity
- `use-update-identity.ts` - 更新 Identity

**页面**：
- `app/(creator)/creator/identity/page.tsx`

#### 4.2 Offerings 管理（Day 11）

**组件**：
- `offering-list.tsx` - Offering 列表
- `offering-form.tsx` - Offering 表单

**Hooks**：
- `use-offerings.ts` - 获取 Offerings
- `use-create-offering.ts` - 创建 Offering
- `use-update-offering.ts` - 更新 Offering

**页面**：
- `app/(creator)/creator/offerings/page.tsx`

#### 4.3 Orders 管理 + 履约码扫描（Day 12-13）

**组件**：
- `order-list.tsx` - 订单列表
- `order-card.tsx` - 订单卡片
- `fulfillment-code-scanner.tsx` - 履约码扫描器
- `wallet-card.tsx` - 钱包余额

**Hooks**：
- `use-orders.ts` - 获取订单列表
- `use-confirm-order.ts` - 确认订单
- `use-confirm-fulfillment.ts` - 核销履约码

**页面**：
- `app/(creator)/creator/orders/page.tsx`

**交付物**：
- ✅ Creator Identity 管理页面
- ✅ Offerings 管理页面
- ✅ Orders 管理页面
- ✅ 履约码扫描功能
- ✅ 所有相关组件和 hooks

---

### Phase 5：测试与优化（Day 14-18）

#### 5.1 E2E 测试（Day 14-16）

```bash
# 安装 Playwright
pnpm create playwright

# 配置
# playwright.config.ts
```

**测试用例**：
1. **C号 访问流程**
   - 访问 `/r/[commerceRef]`
   - 查看 Creator Profile
   - 查看服务列表

2. **预约流程**
   - 点击"立即预约"
   - 填写预约表单
   - 提交成功，跳转到订单结果页

3. **履约码展示**
   - 订单确认后显示履约码
   - 显示 QR 码
   - 倒计时正常工作

4. **履约码扫描**
   - Creator 登录后台
   - 进入订单管理
   - 扫描履约码
   - 核销成功

#### 5.2 性能优化（Day 17）

- [ ] 图片优化（`next/image`）
- [ ] 代码分割（动态导入大组件）
- [ ] 路由预取（`<Link prefetch>`）
- [ ] API 响应缓存（React Query 配置优化）
- [ ] Lighthouse 性能测试（目标 ≥ 90）

#### 5.3 移动端优化（Day 18）

- [ ] 响应式布局测试（320px - 1920px）
- [ ] 触摸交互优化
- [ ] 移动端摄像头权限测试
- [ ] 移动端 QR 码扫描测试

#### 5.4 生产环境切换

```bash
# 配置环境变量
# apps/web-v2/.env.production
NEXT_PUBLIC_API_BASE_URL=https://api.production.com

# 构建
cd apps/web-v2
pnpm build

# 部署前验证
pnpm start

# 切换：删除旧项目，重命名新项目
cd apps
rm -rf web
mv web-v2 web
```

**交付物**：
- ✅ E2E 测试覆盖核心流程
- ✅ Lighthouse 性能 ≥ 90
- ✅ 移动端完全适配
- ✅ 生产环境就绪

---

## 四、质量标准

### 4.1 代码质量

| 指标 | 目标 | 验收标准 |
|------|------|---------|
| 组件平均行数 | < 200 行 | 除页面组件外，其他组件不超过 200 行 |
| 单组件 useState 数量 | ≤ 5 个 | 复杂状态用 useReducer 或状态机 |
| TypeScript 覆盖 | 100% | 无 `any` 类型（除第三方库类型缺失） |
| ESLint 错误 | 0 个 | `pnpm lint` 无错误 |

### 4.2 性能标准

| 指标 | 目标 | 验收标准 |
|------|------|---------|
| Lighthouse Performance | ≥ 90 | 桌面端和移动端 |
| First Contentful Paint | < 1.5s | 4G 网络 |
| Largest Contentful Paint | < 2.5s | 4G 网络 |
| Time to Interactive | < 3.5s | 4G 网络 |

### 4.3 测试覆盖

| 类型 | 目标 | 验收标准 |
|------|------|---------|
| E2E 测试 | 核心流程 100% | C号 → 预约 → 履约码 → 扫码 |
| 组件测试 | P0 组件 70% | 业务组件单元测试 |
| API 调用测试 | Mock 测试 | 所有 React Query hooks |

### 4.4 可访问性

| 指标 | 目标 | 验收标准 |
|------|------|---------|
| ARIA 标签 | 100% | 所有交互元素有 ARIA |
| 键盘导航 | 100% | 所有功能可键盘操作 |
| 屏幕阅读器 | 支持 | 主流程可用屏幕阅读器完成 |
| WCAG 2.1 | AA 级 | axe DevTools 检测通过 |

---

## 五、风险管理

### 5.1 技术风险

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|----------|
| React Query 学习曲线 | 中 | 中 | Day 1 快速学习官方文档 |
| shadcn/ui 定制需求 | 低 | 低 | 组件代码在项目内，可自由修改 |
| 后端 API 不完整 | 高 | 中 | 提前检查 API，必要时先补全后端 |
| 组件拆分过细 | 低 | 低 | 遵循"100-200 行"原则 |
| 移动端兼容性 | 中 | 低 | 使用 Radix UI（已解决大部分兼容性） |

### 5.2 时间风险

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|----------|
| 需求变更 | 高 | 低 | 锁定需求，P0 功能优先 |
| 技术难点卡住 | 中 | 中 | 每日进度回顾，及时调整方案 |
| 测试时间超预期 | 中 | 中 | E2E 测试可简化，覆盖核心流程即可 |
| Bug 修复时间 | 中 | 中 | 预留 2-3 天 Buffer |

---

## 六、成功标准

### 6.1 功能完整性

- ✅ C号 访问路径完整实现（`/r/`, `/s/`, `/o/`）
- ✅ Customer 可通过 C号 访问 Creator Profile
- ✅ Customer 可预约服务并获得履约码
- ✅ Creator 可扫码核销履约码
- ✅ Creator 可管理 Identity、Offerings、Orders

### 6.2 架构质量

- ✅ 组件层级清晰（UI → 业务 → 页面）
- ✅ 状态管理规范（React Query + useState）
- ✅ 代码可测试、可维护、可扩展
- ✅ 无历史包袱，架构简洁

### 6.3 用户体验

- ✅ 移动端完全适配
- ✅ 加载状态友好
- ✅ 错误提示清晰
- ✅ 无障碍支持完整

---

## 七、后续优化（Phase 6+）

### 7.1 国际化（i18n）
- 多语言支持（英文、日文）
- 货币多币种支持

### 7.2 SEO 优化
- 服务端渲染（SSR）
- 结构化数据（Schema.org）
- sitemap.xml 生成

### 7.3 PWA 支持
- Service Worker
- 离线访问
- 添加到主屏幕

### 7.4 Analytics
- 埋点（Google Analytics / Plausible）
- 转化率跟踪
- 用户行为分析

---

## 八、检查清单

### Day 1（项目初始化）
- [ ] 创建 `apps/web-v2` 项目
- [ ] shadcn/ui 初始化完成
- [ ] React Query 配置完成
- [ ] API Client 配置完成
- [ ] 基础 UI 组件安装完成

### Day 2-3（Creator Profile）
- [ ] 后端 API 检查/实现
- [ ] `creator-profile-card.tsx` 完成
- [ ] `service-card.tsx` 完成
- [ ] `use-creator-profile.ts` 完成
- [ ] `/r/[commerceRef]` 页面完成

### Day 4-5（Service Booking）
- [ ] `booking-form.tsx` 完成
- [ ] `use-service.ts` 完成
- [ ] `use-booking.ts` 完成
- [ ] `/s/[offeringId]` 页面完成

### Day 6-8（Order Result）
- [ ] `order-status-badge.tsx` 完成
- [ ] `fulfillment-code-display.tsx` 完成
- [ ] `use-order.ts` 完成
- [ ] `/o/[token]` 页面完成

### Day 9-13（Creator Dashboard）
- [ ] Identity 管理页面完成
- [ ] Offerings 管理页面完成
- [ ] Orders 管理页面完成
- [ ] 履约码扫描功能完成

### Day 14-18（Testing & Optimization）
- [ ] E2E 测试通过
- [ ] Lighthouse 性能 ≥ 90
- [ ] 移动端测试通过
- [ ] 生产环境部署就绪

---

**总结**：这是一份完整的、可执行的实施计划。每个 Phase 都有清晰的目标、交付物和验收标准。严格按照这个计划执行，14-18 天内可完成高质量的全量重写。

**下一步**：你确认这个计划吗？如果确认，我将立即开始 Phase 0（Day 1）的实施。
