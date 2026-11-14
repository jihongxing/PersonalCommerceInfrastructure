import { proxyOperationsAuth } from '../_proxy';

export async function POST(request: Request): Promise<Response> {
  return proxyOperationsAuth(request, 'login');
}
