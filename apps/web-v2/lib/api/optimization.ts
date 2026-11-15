/** Request deduplication for user actions. Creator credentials remain in the BFF. */
export class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<unknown>>();
  private readonly REQUEST_TIMEOUT = 30 * 1000;

  private generateKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET';
    const body = typeof options?.body === 'string' ? options.body : '';
    return `${method}:${url}:${body}`;
  }

  async execute<T>(url: string, executor: () => Promise<T>, options?: RequestInit): Promise<T> {
    const key = this.generateKey(url, options);
    const existing = this.pendingRequests.get(key);
    if (existing) return existing as Promise<T>;
    const promise = executor().finally(() => this.pendingRequests.delete(key));
    const timeoutPromise = new Promise<T>((_, reject) =>
      setTimeout(() => {
        this.pendingRequests.delete(key);
        reject(new Error('Request timeout'));
      }, this.REQUEST_TIMEOUT),
    );
    const pending = Promise.race([promise, timeoutPromise]);
    this.pendingRequests.set(key, pending);
    return pending;
  }

  clear(): void {
    this.pendingRequests.clear();
  }

  getStats() {
    return { pendingRequests: this.pendingRequests.size };
  }
}

// Compatibility exports for retired token-cache callers. They intentionally
// never retain or refresh credentials in browser memory.
export class TokenCacheManager {
  get(_key: string): null { return null; }
  set(_key: string, _token: string): void { void _key; void _token; }
  clear(): void { /* retired */ }
  getStats() { return { size: 0, maxSize: 0, utilization: '0.00%' }; }
}

export class TokenPreRefreshManager {
  startMonitoring(_onRefresh: () => Promise<void>): void { void _onRefresh; }
  stopMonitoring(): void { /* BFF refreshes server-side */ }
}

export const tokenCacheManager = new TokenCacheManager();
export const requestDeduplicator = new RequestDeduplicator();
export const tokenPreRefreshManager = new TokenPreRefreshManager();
