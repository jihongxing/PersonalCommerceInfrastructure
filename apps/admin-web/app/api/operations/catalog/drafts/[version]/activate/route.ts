import { cookies } from 'next/headers';
import { proxyOperationsCatalogRequest } from '../../../../../../../lib/operations-catalog-proxy';
import { getAdminServerConfiguration } from '../../../../../../../lib/server-configuration';

const COOKIE_NAME = 'pci_operations_session';
export async function POST(request: Request, context: { params: Promise<{ version: string }> }) {
  const { version } = await context.params;
  return proxyOperationsCatalogRequest(
    request,
    `/api/v1/operations/admin/catalog/drafts/${encodeURIComponent(version)}/activate`,
    getAdminServerConfiguration(),
    (await cookies()).get(COOKIE_NAME)?.value,
  );
}
