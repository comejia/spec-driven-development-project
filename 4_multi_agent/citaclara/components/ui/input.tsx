'use client';

import * as React from 'react';
import { cn } from '@/src/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  function Input({ className, type = 'text', ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'min-h-11 w-full rounded-[var(--radius-caja)] border border-[color:var(--color-borde)] bg-[color:var(--color-superficie)] px-3 py-2 text-base text-[color:var(--color-texto)] placeholder:text-[color:var(--color-texto-suave)] disabled:opacity-55',
          'aria-[invalid=true]:border-[color:var(--color-error)]',
          className,
        )}
        {...props}
      />
    );
  },
);
