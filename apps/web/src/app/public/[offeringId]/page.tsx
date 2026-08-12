import { PublicOfferingWorkspace } from '@/components/public-offering-workspace';

export default async function PublicOfferingPage({
  params,
}: {
  readonly params: Promise<{ readonly offeringId: string }>;
}) {
  const { offeringId } = await params;
  return <PublicOfferingWorkspace offeringId={offeringId} />;
}
