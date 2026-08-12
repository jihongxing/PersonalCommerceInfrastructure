import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface FormFieldProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly helperText?: string;
  readonly htmlFor: string;
  readonly label: string;
}

export function FormField({ children, className, helperText, htmlFor, label }: FormFieldProps) {
  return (
    <div className={cn('ds-form-field', className)}>
      <label className="ds-form-field__label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {helperText === undefined ? null : (
        <p className="ds-form-field__helper" id={`${htmlFor}-hint`}>
          {helperText}
        </p>
      )}
    </div>
  );
}
