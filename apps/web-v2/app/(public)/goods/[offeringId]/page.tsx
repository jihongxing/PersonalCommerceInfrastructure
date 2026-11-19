'use client';

import Link from 'next/link';
import { Suspense, use, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/context';
import { apiClient } from '@/lib/api/client';

type GoodsPublicOffering = {
  id: string;
  sellerId: string;
  revision: number;
  state: 'published';
  terms: {
    title: string;
    description: string;
    priceMinor: string;
    currency: string;
    fulfillmentDescription: string;
    preparationDescription: string;
    imageUrl?: string;
  };
};

type GoodsOrderView = {
  order: {
    id: string;
    state: 'pending' | 'accepted' | 'rejected';
  };
};

export default function GoodsOfferingPage({ params }: { params: Promise<{ offeringId: string }> }) {
  return (
    <Suspense fallback={<p role="status">正在加载商品...</p>}>
      <GoodsOffering params={params} />
    </Suspense>
  );
}

function GoodsOffering({ params }: { params: Promise<{ offeringId: string }> }) {
  const { offeringId } = use(params);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [offering, setOffering] = useState<GoodsPublicOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderMessage, setOrderMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void apiClient
      .GET<GoodsPublicOffering>('/api/v1/public/goods/offerings/{id}', {
        params: { path: { id: offeringId } },
      })
      .then((result) => {
        if (cancelled) return;
        if (result.data) setOffering(result.data);
        else setError(result.error?.error?.message ?? '商品暂时不可用。');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [offeringId]);

  async function submitOrder() {
    if (!isAuthenticated || submitting) return;
    setSubmitting(true);
    setOrderMessage(null);
    const result = await apiClient.POST<GoodsOrderView>(
      '/api/v1/private/goods/offerings/{offeringId}/orders',
      {
        params: { path: { offeringId } },
        body: { idempotencyKey: crypto.randomUUID() },
      },
    );
    setSubmitting(false);
    if (result.data) {
      setOrderMessage(`订单已提交，当前状态：${result.data.order.state}。等待卖家确认。`);
    } else {
      setOrderMessage(result.error?.error?.message ?? '订单未提交，请稍后重试。');
    }
  }

  if (loading || authLoading) {
    return (
      <main className="mx-auto max-w-3xl space-y-4 p-6">
        <p role="status">正在加载商品...</p>
      </main>
    );
  }

  if (error || !offering) {
    return (
      <main className="mx-auto max-w-3xl space-y-4 p-6">
        <h1 className="text-2xl font-semibold">商品暂不可用</h1>
        <p className="text-muted-foreground">{error ?? '商品不存在或已暂停接单。'}</p>
        <Link className="underline underline-offset-4" href="/">
          返回查询
        </Link>
      </main>
    );
  }

  const loginHref = `/auth/login?returnTo=${encodeURIComponent(`/goods/${offering.id}`)}`;

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-6">
      <header className="space-y-3">
        <p className="text-sm text-muted-foreground">Goods Offering</p>
        <h1 className="text-3xl font-semibold">{offering.terms.title}</h1>
        <p className="whitespace-pre-wrap text-muted-foreground">{offering.terms.description}</p>
      </header>

      {offering.terms.imageUrl ? (
        <img
          className="max-h-96 w-full rounded-lg object-cover"
          src={offering.terms.imageUrl}
          alt={offering.terms.title}
        />
      ) : null}

      <section className="space-y-3 rounded-lg border p-5" aria-labelledby="goods-details">
        <h2 id="goods-details" className="text-xl font-semibold">
          商品信息
        </h2>
        <p className="text-lg font-medium">
          {offering.terms.priceMinor} {offering.terms.currency}
        </p>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="font-medium">供货/交付方式</dt>
            <dd className="mt-1 whitespace-pre-wrap text-muted-foreground">
              {offering.terms.fulfillmentDescription}
            </dd>
          </div>
          <div>
            <dt className="font-medium">备货说明</dt>
            <dd className="mt-1 whitespace-pre-wrap text-muted-foreground">
              {offering.terms.preparationDescription}
            </dd>
          </div>
        </dl>
      </section>

      <section className="space-y-3 rounded-lg border p-5" aria-labelledby="goods-order">
        <h2 id="goods-order" className="text-xl font-semibold">
          提交订单
        </h2>
        <p className="text-sm text-muted-foreground">
          每次订单只提交一个商品单位；订单提交不代表卖家已经接受，也不代表 PCI 已完成付款。
        </p>
        {isAuthenticated ? (
          <Button type="button" disabled={submitting} onClick={() => void submitOrder()}>
            {submitting ? '提交中...' : '提交一件订单'}
          </Button>
        ) : (
          <Link className="underline underline-offset-4" href={loginHref}>
            登录后提交订单
          </Link>
        )}
        {orderMessage ? (
          <p role="status" className="text-sm text-muted-foreground">
            {orderMessage}
          </p>
        ) : null}
      </section>

      <Link className="inline-flex underline underline-offset-4" href="/">
        返回查询
      </Link>
    </main>
  );
}
