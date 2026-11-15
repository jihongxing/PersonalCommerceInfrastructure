import { cookies } from 'next/headers';
import { proxyOperationsCatalogRequest } from '../../../../../../../../lib/operations-catalog-proxy';
import { getAdminServerConfiguration } from '../../../../../../../../lib/server-configuration';

const COOKIE_NAME = 'pci_operations_session';
export async function PATCH(
  request: Request,
  context: { params: Promise<{ version: string; kind: string; id: string }> },
) {
  const { version, kind, id } = await context.params;
  if (!['capabilities', 'templates'].includes(kind))
    return Response.json({ error: 'Not found.' }, { status: 404 });
  return proxyOperationsCatalogRequest(
    request,
    `/api/v1/operations/admin/catalog/drafts/${encodeURIComponent(version)}/${kind}/${encodeURIComponent(id)}`,
    getAdminServerConfiguration(),
    (await cookies()).get(COOKIE_NAME)?.value,
  );
}
