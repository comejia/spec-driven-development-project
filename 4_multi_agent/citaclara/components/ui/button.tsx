'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/src/lib/utils';

const variantesBoton = cva(
  'inline-flex items-center justify-center gap-2 rounded-[var(--radius-caja)] font-medium transition-colors disabled:pointer-events-none disabled:opacity-55 [&_svg]:size-5 [&_svg]:shrink-0',
  {
    variants: {
      variante: {
        primario:
          'bg-[color:var(--color-primario)] text-[color:var(--color-primario-texto)] hover:bg-[color:var(--color-primario-fuerte)]',
        secundario:
          'border border-[color:var(--color-borde)] bg-[color:var(--color-superficie)] text-[color:var(--color-texto)] hover:bg-[color:var(--color-primario-suave)]',
        suave:
          'bg-[color:var(--color-primario-suave)] text-[color:var(--color-primario-fuerte)] hover:brightness-97',
        peligro:
          'bg-[color:var(--color-error)] text-white hover:brightness-92 focus-visible:outline-[color:var(--color-error)]',
        enlace:
          'text-[color:var(--color-primario-fuerte)] underline underline-offset-4 hover:no-underline',
      },
      tamano: {
        // Alturas ≥ 44 px: objetivos táctiles cómodos (Principio 7).
        normal: 'min-h-11 px-4 py-2 text-base',
        grande: 'min-h-13 px-6 py-3 text-lg',
        compacto: 'min-h-11 px-3 py-2 text-sm',
      },
    },
    defaultVariants: { variante: 'primario', tamano: 'normal' },
  },
);

export interface BotonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof variantesBoton> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, BotonProps>(function Button(
  { className, variante, tamano, asChild = false, ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp className={cn(variantesBoton({ variante, tamano }), className)} ref={ref} {...props} />
  );
});

export { variantesBoton };
