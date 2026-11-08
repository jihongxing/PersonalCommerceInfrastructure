import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

const navigation = vi.hoisted(() => ({ replace: vi.fn() }));
const routeState = vi.hoisted(() => ({ searchParams: new URLSearchParams() }));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation,
  usePathname: () => '/profile',
  useSearchParams: () => routeState.searchParams,
}));

vi.mock('@/features/creator-onboarding/api/use-creator-identity', () => ({
  useCreatorIdentity: () => ({
    data: {
      profile: { displayName: '测试创作者', bio: '测试简介' },
      state: 'draft',
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock('./homepage-management', () => ({
  HomepageManagement: () => <div>对外主页设置</div>,
}));

import ProfileClient from './profile-client';

afterEach(() => {
  routeState.searchParams = new URLSearchParams();
  vi.clearAllMocks();
});

describe('creator profile surface', () => {
  it('opens the public homepage tab from a deep link', () => {
    routeState.searchParams = new URLSearchParams('tab=public');

    render(<ProfileClient />);

    expect(screen.getByText('对外主页设置')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '对外主页' })).toHaveAttribute('data-state', 'active');
  });

  it('keeps the selected tab in the profile URL', async () => {
    render(<ProfileClient />);

    await userEvent.click(screen.getByRole('tab', { name: '对外主页' }));

    expect(navigation.replace).toHaveBeenCalledWith('/profile?tab=public', { scroll: false });
  });
});
