'use client';

/** HTTP interception hooks for Creator Web. Authentication is supplied by the
 * same-origin BFF cookie; this module deliberately never injects bearer tokens. */
export interface RequestInterceptorConfig {
  onRequest?: (config: RequestInit) => RequestInit | Promise<RequestInit>;
  onResponse?: (response: Response) => Response | Promise<Response>;
  onError?: (error: Error) => Error | Promise<Error>;
}

export function createInterceptedFetch(config: RequestInterceptorConfig = {}) {
  const originalFetch = globalThis.fetch;
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let requestInit = init || {};
    try {
      if (config.onRequest) requestInit = await config.onRequest(requestInit);
    } catch (error) {
      console.error('Request interceptor error:', error);
    }
    try {
      let response = await originalFetch(input, requestInit);
      if (config.onResponse) response = await config.onResponse(response);
      return response;
    } catch (error) {
      if (config.onError)
        throw await config.onError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  };
}

export function initializeFetchInterceptor() {
  // The BFF owns authentication and refresh. Keep this hook for existing app
  // bootstrap callers without replacing fetch or adding Authorization headers.
}
