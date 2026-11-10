import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api/client';
import OnboardingPage from './page';

const state = vi.hoisted(() => ({ push: vi.fn(), query: {} as Record<string, unknown> }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: state.push }) }));
vi.mock('@/features/creator-onboarding/api/use-creator-identity', () => ({
  useCreatorIdentity: () => state.query,
}));

beforeEach(() => {
  state.push.mockClear();
  state.query = { isLoading: false, refetch: vi.fn() };
});

describe('onboarding entry', () => {
  it('routes a missing identity to the existing welcome page', () => {
    state.query.error = new ApiError('not found', 'not_found', 404);
    render(<OnboardingPage />);
    expect(state.push).toHaveBeenCalledWith('/onboarding/welcome');
  });

  it('does not confuse a failed request with a missing identity', () => {
    state.query.error = new ApiError('unavailable', 'unavailable', 503);
    render(<OnboardingPage />);
    expect(screen.getByRole('alert')).toHaveTextContent('无法加载商业身份');
    expect(state.push).not.toHaveBeenCalled();
  });
});
