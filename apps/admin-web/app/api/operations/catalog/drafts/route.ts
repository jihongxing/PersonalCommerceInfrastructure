import { cookies } from 'next/headers';
import { proxyOperationsCatalogRequest } from '../../../../../lib/operations-catalog-proxy';
import { getAdminServerConfiguration } from '../../../../../lib/server-configuration';

const COOKIE_NAME = 'pci_operations_session';

export async function POST(request: Request) {
  const credential = (await cookies()).get(COOKIE_NAME)?.value;
  return proxyOperationsCatalogRequest(
    request,
    '/api/v1/operations/admin/catalog/drafts',
    getAdminServerConfiguration(),
    credential,
  );
}

export async function GET(request: Request) {
  const credential = (await cookies()).get(COOKIE_NAME)?.value;
  return proxyOperationsCatalogRequest(
    request,
    '/api/v1/operations/admin/catalog/drafts',
    getAdminServerConfiguration(),
    credential,
  );
}
