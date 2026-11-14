import { cookies } from 'next/headers';
import { proxyOperationsAuthRequest } from '../../../../lib/operations-auth-proxy';
import { getAdminServerConfiguration } from '../../../../lib/server-configuration';

const COOKIE_NAME = 'pci_operations_session';

export async function proxyOperationsAuth(
  request: Request,
  operation: 'login' | 'session' | 'logout',
): Promise<Response> {
  const requestCookies = await cookies();
  const rawCredential = requestCookies.get(COOKIE_NAME)?.value;
  return proxyOperationsAuthRequest(
    request,
    operation,
    getAdminServerConfiguration(),
    rawCredential,
  );
}
