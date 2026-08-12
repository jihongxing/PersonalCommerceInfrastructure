import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface StatusMessageProps extends HTMLAttributes<HTMLParagraphElement> {
  readonly children: ReactNode;
  readonly tone?: 'info' | 'success' | 'error';
}

export function StatusMessage({
  children,
  className,
  tone = 'info',
  ...props
}: StatusMessageProps) {
  return (
    <p
      className={cn('ds-status-message', `ds-status-message--${tone}`, className)}
      role="status"
      {...props}
    >
      {children}
    </p>
  );
}
