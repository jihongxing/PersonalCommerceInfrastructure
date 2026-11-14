import { cookies } from 'next/headers';
import { proxyOperationsReadRequest } from '../../../../lib/operations-read-proxy';
import { getAdminServerConfiguration } from '../../../../lib/server-configuration';

const COOKIE_NAME = 'pci_operations_session';

export async function GET(request: Request) {
  const credential = (await cookies()).get(COOKIE_NAME)?.value;
  const url = new URL(request.url);
  return proxyOperationsReadRequest(
    request,
    `/api/v1/operations/admin/audit${url.search}`,
    getAdminServerConfiguration(),
    credential,
  );
}
