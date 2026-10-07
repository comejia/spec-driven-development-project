'use client';

import * as React from 'react';
import { cn } from '@/src/lib/utils';

/**
 * Selector nativo: accesible por defecto (teclado, lector de pantalla y móvil)
 * y más simple que un menú personalizado (Principio 4).
 */
export const Select = React.forwardRef<HTMLSelectElement, React.ComponentProps<'select'>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          'min-h-11 w-full appearance-none rounded-[var(--radius-caja)] border border-[color:var(--color-borde)] bg-[color:var(--color-superficie)] bg-[position:right_0.75rem_center] bg-no-repeat px-3 py-2 pr-10 text-base text-[color:var(--color-texto)] disabled:opacity-55',
          className,
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%234a5568' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        }}
        {...props}
      >
        {children}
      </select>
    );
  },
);
