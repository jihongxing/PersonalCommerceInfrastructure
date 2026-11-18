import { cookies } from 'next/headers';
import { proxyOperationsCatalogRequest } from '../../../../lib/operations-catalog-proxy';
import { getAdminServerConfiguration } from '../../../../lib/server-configuration';

async function forward(request: Request) {
  const configuration = getAdminServerConfiguration();
  if (request.method === 'PATCH' && request.headers.get('origin') !== configuration.webOrigin) {
    return Response.json({ error: 'Invalid Origin.' }, { status: 403 });
  }
  return proxyOperationsCatalogRequest(
    request,
    '/api/v1/operations/admin/scenarios',
    configuration,
    (await cookies()).get('pci_operations_session')?.value,
  );
}

export const GET = forward;
export const PATCH = forward;
