import { MembershipJoin } from '@/features/membership/membership-client';

export default async function MembershipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MembershipJoin offeringId={id} />;
}
