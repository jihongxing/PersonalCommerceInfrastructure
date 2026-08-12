export interface AccessTokenProvider {
  getAccessToken(): Promise<string | undefined>;
}

export async function applyBearerAuthentication(
  request: Request,
  accessTokenProvider: AccessTokenProvider,
): Promise<Request> {
  const accessToken = await accessTokenProvider.getAccessToken();

  if (accessToken === undefined || accessToken.trim().length === 0) {
    return request;
  }

  const headers = new Headers(request.headers);
  headers.set('authorization', `Bearer ${accessToken}`);

  return new Request(request, {
    headers,
  });
}
