import { CustomerReservationWorkspace } from '@/components/customer-reservation-workspace';

export default async function ReservationResultPage({
  params,
}: {
  readonly params: Promise<{ readonly resultAccessToken: string }>;
}) {
  const { resultAccessToken } = await params;
  return <CustomerReservationWorkspace resultAccessToken={resultAccessToken} />;
}
