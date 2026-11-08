import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { normalizeReference } from '@/lib/public-homepage';
import { PublicHomepageClient } from './public-homepage-client';

export const instant = false;

export default function Page({ params }: { params: Promise<{ commerceRef: string }> }) {
  return (
    <Suspense fallback={<p role="status">正在加载主页...</p>}>
      <Homepage params={params} />
    </Suspense>
  );
}

async function Homepage({ params }: { params: Promise<{ commerceRef: string }> }) {
  const { commerceRef } = await params;
  const reference = normalizeReference(commerceRef);
  if (reference && reference !== commerceRef) redirect(`/r/${reference}`);
  return <PublicHomepageClient key={commerceRef} reference={reference} />;
}
