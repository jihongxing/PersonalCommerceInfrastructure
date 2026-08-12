import { CustomerRequestResultWorkspace } from '@/components/customer-request-result-workspace';

export default async function CustomerRequestResultPage({
  params,
}: {
  readonly params: Promise<{ readonly resultAccessToken: string }>;
}) {
  const { resultAccessToken } = await params;
  return <CustomerRequestResultWorkspace resultAccessToken={resultAccessToken} />;
}
