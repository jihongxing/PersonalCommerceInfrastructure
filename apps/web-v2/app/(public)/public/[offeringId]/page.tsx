import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export default function LegacyOffering({ params }: { params: Promise<{ offeringId: string }> }) {
  return (
    <Suspense fallback={<p role="status">正在加载...</p>}>
      <RedirectOffering params={params} />
    </Suspense>
  );
}

async function RedirectOffering({ params }: { params: Promise<{ offeringId: string }> }) {
  const { offeringId } = await params;
  return redirect(`/s/${encodeURIComponent(offeringId)}`);
}
