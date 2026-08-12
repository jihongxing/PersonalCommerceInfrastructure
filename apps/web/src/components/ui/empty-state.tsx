import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  readonly children: ReactNode;
}

export function EmptyState({ children, className, ...props }: EmptyStateProps) {
  return (
    <div className={cn('ds-empty-state', className)} {...props}>
      {children}
    </div>
  );
}
