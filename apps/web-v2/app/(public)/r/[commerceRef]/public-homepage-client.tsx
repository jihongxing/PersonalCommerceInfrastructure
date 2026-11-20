'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PublicHomepage } from '@/lib/public-homepage';
import { finishRequestSpan, injectRequestTrace, startRequestSpan } from '@/lib/api/tracing';

type Result =
  | { kind: 'loading' }
  | { kind: 'unavailable' }
  | { kind: 'error' }
  | { kind: 'success'; data: PublicHomepage };

function newViewId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function PublicHomepageClient({ reference }: { reference: string | null }) {
  const view = useRef<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result>({ kind: 'loading' });
  useEffect(() => {
    if (!reference) return;
    const controller = new AbortController();
    view.current ??= newViewId();
    const origin = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
    const url = `${origin}/api/v1/public/homepages/${encodeURIComponent(reference)}?viewId=${view.current}`;
    const span = startRequestSpan('GET', '/api/v1/public/homepages/{reference}');
    const headers = new Headers();
    injectRequestTrace(span, headers, url);
    fetch(url, { signal: controller.signal, cache: 'no-store', credentials: 'omit', headers })
      .then(async (response) => {
        finishRequestSpan(span, response.status);
        if (response.status === 404) return { kind: 'unavailable' } as const;
        if (!response.ok) return { kind: 'error' } as const;
        return { kind: 'success', data: (await response.json()) as PublicHomepage } as const;
      })
      .then(setResult)
      .catch(() => {
        finishRequestSpan(span, 0);
        if (!controller.signal.aborted) setResult({ kind: 'error' });
      });
    return () => controller.abort();
  }, [reference, attempt]);

  return (
    <div className="public-homepage">
      {!reference ? (
        <>
          <h2 className="text-xl font-semibold">C 号格式错误</h2>
          <p className="mt-2 text-sm text-muted-foreground">请检查号码后重新查询。</p>
        </>
      ) : result.kind === 'loading' ? (
        <p role="status">正在加载主页...</p>
      ) : result.kind === 'unavailable' ? (
        <>
          <h2 className="text-xl font-semibold">主页暂不可访问</h2>
          <p className="mt-2 text-sm text-muted-foreground">请检查号码或稍后再试。</p>
        </>
      ) : result.kind === 'error' ? (
        <>
          <h2 className="text-xl font-semibold">加载失败</h2>
          <p className="mt-2 text-sm text-muted-foreground">服务暂时不可用，请稍后重试。</p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => {
              setResult({ kind: 'loading' });
              setAttempt((n) => n + 1);
            }}
          >
            重试
          </Button>
        </>
      ) : (
        <>
          <header className="public-homepage-intro">
            <p className="text-sm text-muted-foreground">创作者主页</p>
            <h1>{result.data.displayName}</h1>
            <p className="mt-3 break-all font-mono text-sm text-muted-foreground">
              C 号 {result.data.commerceReference}
            </p>
          </header>
          <section className="public-homepage-services">
            <h2 className="text-xl font-semibold">可提交请求的服务</h2>
            <p className="mt-2 text-sm text-muted-foreground">查看服务详情并提交您的需求</p>
            {result.data.offerings.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">尚无服务</p>
            ) : (
              <div className="mt-4 divide-y border-y">
                {result.data.offerings.map((offering) => (
                  <article key={offering.id} className="public-homepage-service">
                    <div className="min-w-0">
                      <h3 className="font-medium break-words">{offering.title}</h3>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                        {offering.description}
                      </p>
                    </div>
                    <Link
                      className="public-service-link"
                      href={`/s/${encodeURIComponent(offering.id)}`}
                      aria-label={`查看服务：${offering.title}`}
                    >
                      查看服务 <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </section>
          {!!result.data.membershipOfferings?.length && (
            <section
              className="public-homepage-services mt-10"
              aria-labelledby="membership-heading"
            >
              <h2 id="membership-heading" className="text-xl font-semibold">
                可申请的会员
              </h2>
              <div className="mt-4 divide-y border-y">
                {result.data.membershipOfferings.map((offering) => (
                  <article key={offering.id} className="public-homepage-service">
                    <div className="min-w-0">
                      <h3 className="font-medium break-words">{offering.title}</h3>
                      <p className="mt-2 break-words text-sm text-muted-foreground">
                        {offering.location}
                      </p>
                    </div>
                    <Link
                      className="public-service-link"
                      href={`/membership/${encodeURIComponent(offering.id)}`}
                      aria-label={`查看会员：${offering.title}`}
                    >
                      查看会员 <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          )}
          {!!result.data.programRuns?.length && (
            <section className="public-homepage-services mt-10" aria-labelledby="program-heading">
              <h2 id="program-heading" className="text-xl font-semibold">
                可报名的计划
              </h2>
              <div className="mt-4 divide-y border-y">
                {result.data.programRuns.map((run) => (
                  <article key={run.id} className="public-homepage-service">
                    <div className="min-w-0">
                      <h3 className="font-medium break-words">{run.title}</h3>
                      <p className="mt-2 break-words text-sm text-muted-foreground">
                        {run.location} ·{' '}
                        <time dateTime={run.startsAt}>
                          {new Date(run.startsAt).toLocaleString('zh-CN')}
                        </time>
                      </p>
                    </div>
                    <Link
                      className="public-service-link"
                      href={`/programs/${encodeURIComponent(run.id)}`}
                      aria-label={`查看计划：${run.title}`}
                    >
                      查看计划 <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          )}
          <section className="public-homepage-services mt-10" aria-labelledby="goods-heading">
            <h2 id="goods-heading" className="text-xl font-semibold">
              可购买的商品
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              商品由卖家按需准备；提交订单后等待卖家确认。
            </p>
            {!result.data.goodsOfferings || result.data.goodsOfferings.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">尚无商品</p>
            ) : (
              <div className="mt-4 divide-y border-y">
                {result.data.goodsOfferings.map((offering) => (
                  <article key={offering.id} className="public-homepage-service">
                    <div className="min-w-0">
                      <h3 className="font-medium break-words">{offering.title}</h3>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                        {offering.description}
                      </p>
                      <p className="mt-2 text-sm font-medium">
                        {offering.priceMinor} {offering.currency}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {offering.fulfillmentDescription}
                      </p>
                    </div>
                    <Link
                      className="public-service-link"
                      href={`/goods/${encodeURIComponent(offering.id)}`}
                      aria-label={`查看商品：${offering.title}`}
                    >
                      查看商品 <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </section>
          <p className="mt-6 text-sm text-muted-foreground">
            C 号是公开定位标识，不作为身份凭证、资质认证或平台担保。
          </p>
        </>
      )}
      <Link
        href="/"
        className="mt-8 inline-flex min-h-11 items-center text-sm underline underline-offset-4"
      >
        返回查询
      </Link>
    </div>
  );
}
