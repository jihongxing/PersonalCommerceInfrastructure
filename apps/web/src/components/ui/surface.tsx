import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  readonly tone?: 'default' | 'raised' | 'subtle';
}

export function Surface({ className, tone = 'default', ...props }: SurfaceProps) {
  return <div className={cn('ds-surface', `ds-surface--${tone}`, className)} {...props} />;
}
