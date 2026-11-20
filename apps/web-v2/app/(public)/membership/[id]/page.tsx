import { Suspense } from 'react';
import { MembershipJoin } from '@/features/membership/membership-client';

export default function MembershipPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p role="status">正在加载会员供给…</p>}>
      <MembershipDetail params={params} />
    </Suspense>
  );
}

async function MembershipDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MembershipJoin offeringId={id} />;
}
