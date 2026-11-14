import { cookies } from 'next/headers';
import { proxyOperationsReadRequest } from '../../../../lib/operations-read-proxy';
import { getAdminServerConfiguration } from '../../../../lib/server-configuration';

export async function GET(request: Request) {
  const credential = (await cookies()).get('pci_operations_session')?.value;
  return proxyOperationsReadRequest(
    request,
    '/api/v1/operations/admin/overview' + new URL(request.url).search,
    getAdminServerConfiguration(),
    credential,
  );
}
