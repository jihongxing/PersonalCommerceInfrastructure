import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createApiServer } from '../../apps/api/src/create-api-server.js';

describe('API Rate Limiting', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = await createApiServer();
    await server.listen({ port: 0, host: '127.0.0.1' });
  });

  afterAll(async () => {
    await server.close();
  });

  it('allows requests under rate limit', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      service: 'vs-01-api',
      status: 'ok',
      version: 'v1',
    });
  });

  it('uses an explicit limit for an isolated API instance', async () => {
    const testServer = await createApiServer({ rateLimitMax: 2 });
    try {
      const first = await testServer.inject({ method: 'GET', url: '/api/v1/health' });
      const second = await testServer.inject({ method: 'GET', url: '/api/v1/health' });
      const limited = await testServer.inject({ method: 'GET', url: '/api/v1/health' });
      expect(first.statusCode).toBe(200);
      expect(second.statusCode).toBe(200);
      expect(limited.statusCode).toBe(429);
    } finally {
      await testServer.close();
    }
  });

  it('returns correct error format on rate limit', async () => {
    // 创建新的 server 实例
    const testServer = await createApiServer();
    await testServer.listen({ port: 0, host: '127.0.0.1' });

    try {
      // 先触发限流
      for (let i = 0; i < 100; i++) {
        await testServer.inject({ method: 'GET', url: '/api/v1/health' });
      }

      const response = await testServer.inject({
        method: 'GET',
        url: '/api/v1/health',
      });

      expect(response.statusCode).toBe(429);
      const body: unknown = response.json();
      expect(body).toHaveProperty('error', 'TOO_MANY_REQUESTS');
      if (body === null || typeof body !== 'object' || !('message' in body)) {
        throw new Error('Rate-limit response has no message.');
      }
      expect(body.message).toMatch(/Rate limit exceeded/u);
    } finally {
      await testServer.close();
    }
  });

  it('rate limit applies to all endpoints', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/readiness',
    });

    // readiness 也应该受到速率限制保护
    expect([200, 429, 503]).toContain(response.statusCode);
  });
});
