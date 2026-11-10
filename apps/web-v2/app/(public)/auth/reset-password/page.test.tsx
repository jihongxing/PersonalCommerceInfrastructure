import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import ResetPasswordPage from './page';

const auth = vi.hoisted(() => ({ resetPassword: vi.fn(), clearError: vi.fn() }));
vi.mock('@/lib/auth/context', () => ({ useAuth: () => ({ ...auth, error: null }) }));

beforeEach(() => {
  vi.clearAllMocks();
  window.history.replaceState(null, '', '/auth/reset-password');
});

it('rejects a missing reset link', async () => {
  render(<ResetPasswordPage />);
  expect(await screen.findByText('无效的链接')).toBeInTheDocument();
});

it('removes the token from the URL and submits it only with the new password', async () => {
  window.history.replaceState(null, '', '/auth/reset-password#token=example-token');
  auth.resetPassword.mockResolvedValue(undefined);
  render(<ResetPasswordPage />);
  expect(await screen.findByRole('heading', { name: '重置密码' })).toBeInTheDocument();
  expect(window.location.hash).toBe('');
  await userEvent.type(screen.getByLabelText('新密码'), 'Password9!');
  await userEvent.type(screen.getByLabelText('确认密码'), 'Password9!');
  await userEvent.click(screen.getByRole('button', { name: '重置密码' }));
  expect(auth.resetPassword).toHaveBeenCalledWith('example-token', 'Password9!', 'Password9!');
  expect(await screen.findByText('密码已重置')).toBeInTheDocument();
});
