import { cookies } from 'next/headers';
import { proxyOperationsReadRequest } from '../../../../../lib/operations-read-proxy';
import { getAdminServerConfiguration } from '../../../../../lib/server-configuration';

const COOKIE_NAME = 'pci_operations_session';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (id.length === 0) return Response.json({ error: 'Not found.' }, { status: 404 });
  const credential = (await cookies()).get(COOKIE_NAME)?.value;
  return proxyOperationsReadRequest(
    request,
    `/api/v1/operations/admin/audit/${encodeURIComponent(id)}`,
    getAdminServerConfiguration(),
    credential,
  );
}
