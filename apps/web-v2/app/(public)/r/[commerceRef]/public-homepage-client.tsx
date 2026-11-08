'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { PublicHomepage } from '@/lib/public-homepage';
import { finishRequestSpan, injectRequestTrace, startRequestSpan } from '@/lib/api/tracing';

type Result =
  | { kind: 'loading' }
  | { kind: 'unavailable' }
  | { kind: 'error' }
  | { kind: 'success'; data: PublicHomepage };

export function PublicHomepageClient({ reference }: { reference: string | null }) {
  const view = useRef<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result>({ kind: 'loading' });
  useEffect(() => {
    if (!reference) return;
    const controller = new AbortController();
    view.current ??= crypto.randomUUID();
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
    <div className="mx-auto max-w-5xl px-4 py-12">
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
          <p className="text-sm text-muted-foreground">商业主页</p>
          <h2 className="mt-2 text-3xl font-semibold">{result.data.displayName}</h2>
          <p className="mt-3 font-mono text-sm text-muted-foreground">
            C 号：{result.data.commerceReference}
          </p>
          <section className="mt-10 border-t pt-6">
            <h3 className="text-xl font-semibold">服务</h3>
            {result.data.offerings.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">尚无服务</p>
            ) : (
              <div className="mt-4 divide-y border-y">
                {result.data.offerings.map((offering) => (
                  <article key={offering.id} className="py-5">
                    <Link
                      className="font-medium underline-offset-4 hover:underline"
                      href={`/s/${encodeURIComponent(offering.id)}`}
                    >
                      {offering.title}
                    </Link>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                      {offering.description}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
      <Link href="/" className="mt-8 inline-block text-sm underline underline-offset-4">
        返回查询
      </Link>
    </div>
  );
}
