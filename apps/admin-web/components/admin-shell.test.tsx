import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdminShell } from './admin-shell';
import Overview from '../app/page';
import SectionPage from '../app/[section]/page';
import ErrorBoundary from '../app/error';
import Loading from '../app/loading';
import { sections } from '../lib/sections';

vi.mock('next/navigation', () => ({
  usePathname: () => '/templates',
  notFound: () => {
    throw new Error('not found');
  },
}));

describe('Operations shell', () => {
  it('has seven navigation destinations, an active area and no management controls', () => {
    render(
      <AdminShell>
        <Overview />
      </AdminShell>,
    );
    const navigation = screen.getByRole('navigation', { name: '运营管理导航' });
    expect(navigation.querySelectorAll('a')).toHaveLength(7);
    expect(screen.getByRole('link', { name: '服务模板', current: 'page' })).toHaveAttribute(
      'href',
      '/templates',
    );
    expect(screen.getByRole('link', { name: '跳到主要内容' })).toHaveAttribute(
      'href',
      '#main-content',
    );
    expect(screen.getByText('身份验证尚未接入')).toBeVisible();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it.each(sections.filter((section) => section.slug))(
    'keeps $english unavailable without fabricated data or management actions',
    async (section) => {
      render(await SectionPage({ params: Promise.resolve({ section: section.slug }) }));
      expect(screen.getByRole('heading', { level: 1, name: section.label })).toBeVisible();
      expect(screen.getByText('待实施 · 暂不可用')).toBeVisible();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    },
  );

  it('exposes a safe retry without rendering exception details', () => {
    const reset = vi.fn();
    render(<ErrorBoundary error={new Error('private diagnostic')} reset={reset} />);
    expect(screen.getByRole('alert')).toBeVisible();
    expect(screen.queryByText('private diagnostic')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '重新加载' }));
    expect(reset).toHaveBeenCalledOnce();
  });

  it('announces loading separately from an unavailable area', () => {
    render(<Loading />);
    expect(screen.getByRole('status')).toHaveTextContent('正在加载工作区域');
  });
});
