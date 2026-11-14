import { proxyOperationsAuth } from '../_proxy';

export async function GET(request: Request): Promise<Response> {
  return proxyOperationsAuth(request, 'session');
}
