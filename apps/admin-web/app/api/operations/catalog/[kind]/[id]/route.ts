import { cookies } from 'next/headers';
import { proxyOperationsReadRequest } from '../../../../../../lib/operations-read-proxy';
import { getAdminServerConfiguration } from '../../../../../../lib/server-configuration';

const COOKIE_NAME = 'pci_operations_session';
const KINDS = new Set(['capabilities', 'templates']);

export async function GET(
  request: Request,
  context: { params: Promise<{ kind: string; id: string }> },
) {
  const { kind, id } = await context.params;
  if (!KINDS.has(kind) || id.length === 0)
    return Response.json({ error: 'Not found.' }, { status: 404 });
  const credential = (await cookies()).get(COOKIE_NAME)?.value;
  return proxyOperationsReadRequest(
    request,
    `/api/v1/operations/admin/catalog/${kind}/${encodeURIComponent(id)}`,
    getAdminServerConfiguration(),
    credential,
  );
}
