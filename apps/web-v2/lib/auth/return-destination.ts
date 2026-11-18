const CREATOR_ROOTS = [
  '/dashboard',
  '/profile',
  '/capabilities',
  '/services',
  '/requests',
  '/onboarding',
  '/memberships',
  '/membership',
];

export function safeReturnDestination(value: string | null): string {
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    /[\\\u0000-\u001f\u007f]/.test(value)
  ) {
    return '/dashboard';
  }

  try {
    const base = 'https://return.invalid';
    const destination = new URL(value, base);
    if (
      destination.origin !== base ||
      !CREATOR_ROOTS.some(
        (root) => destination.pathname === root || destination.pathname.startsWith(`${root}/`),
      )
    ) {
      return '/dashboard';
    }
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return '/dashboard';
  }
}

export function currentReturnDestination(): string {
  return safeReturnDestination(new URLSearchParams(window.location.search).get('returnTo'));
}
