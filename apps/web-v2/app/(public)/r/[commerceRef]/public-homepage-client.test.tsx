import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PublicHomepageClient } from './public-homepage-client';

vi.mock('@/lib/api/tracing', () => ({
  startRequestSpan: vi.fn(),
  injectRequestTrace: vi.fn(),
  finishRequestSpan: vi.fn(),
}));

afterEach(() => vi.unstubAllGlobals());

describe('public homepage', () => {
  it('links each public supply from the same homepage to its own detail', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          displayName: '创作者',
          commerceReference: 'TEST',
          offerings: [{ id: 'service-1', title: '咨询', description: '说明' }],
          membershipOfferings: [{ id: 'member-1', title: '工作室会员', location: '工作室' }],
          programRuns: [
            { id: 'run-1', title: '工作坊', location: '工作室', startsAt: '2026-12-01T10:00:00Z' },
          ],
          goodsOfferings: [{ id: 'goods-1', title: '手账', priceMinor: '2500', currency: 'CNY' }],
        }),
      }),
    );
    render(<PublicHomepageClient reference="TEST" />);
    expect(await screen.findByRole('heading', { name: '创作者' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '查看服务：咨询' })).toHaveAttribute(
      'href',
      '/s/service-1',
    );
    expect(screen.getByRole('link', { name: '查看会员：工作室会员' })).toHaveAttribute(
      'href',
      '/membership/member-1',
    );
    expect(screen.getByRole('link', { name: '查看计划：工作坊' })).toHaveAttribute(
      'href',
      '/programs/run-1',
    );
    expect(screen.getByRole('link', { name: '查看商品：手账' })).toHaveAttribute(
      'href',
      '/goods/goods-1',
    );
  });

  it('does not advertise available transactions when the projection is empty', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ displayName: '创作者', commerceReference: 'TEST', offerings: [] }),
      }),
    );
    render(<PublicHomepageClient reference="TEST" />);
    expect(await screen.findByRole('heading', { name: '创作者' })).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /查看(服务|会员|计划|商品)/ }),
    ).not.toBeInTheDocument();
  });

  it('distinguishes an unavailable homepage from a failed request and retries failures', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: false, status: 404 });
    vi.stubGlobal('fetch', fetchMock);
    render(<PublicHomepageClient reference="TEST" />);
    expect(await screen.findByRole('heading', { name: '加载失败' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '重试' }));
    expect(await screen.findByRole('heading', { name: '主页暂不可访问' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('loads and keeps a valid view ID across retries without randomUUID', async () => {
    const getRandomValues = vi.fn((bytes: Uint8Array) => {
      bytes.fill(255);
      return bytes;
    });
    vi.stubGlobal('crypto', { getRandomValues });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: false, status: 404 });
    vi.stubGlobal('fetch', fetchMock);
    render(<PublicHomepageClient reference="TEST" />);
    expect(await screen.findByRole('heading', { name: '加载失败' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '重试' }));
    expect(await screen.findByRole('heading', { name: '主页暂不可访问' })).toBeInTheDocument();
    const firstUrl = new URL(fetchMock.mock.calls[0][0]);
    const secondUrl = new URL(fetchMock.mock.calls[1][0]);
    expect(firstUrl.searchParams.get('viewId')).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff');
    expect(secondUrl.searchParams.get('viewId')).toBe(firstUrl.searchParams.get('viewId'));
    expect(getRandomValues).toHaveBeenCalledTimes(1);
  });
});
