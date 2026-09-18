import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/src/lib/utils';

const variantesAviso = cva(
  'flex items-start gap-3 rounded-[var(--radius-caja)] border px-4 py-3 text-base',
  {
    variants: {
      tono: {
        error:
          'border-[color:var(--color-error)] bg-[color:var(--color-error-suave)] text-[color:var(--color-error)]',
        exito:
          'border-[color:var(--color-exito)] bg-[color:var(--color-exito-suave)] text-[color:var(--color-exito)]',
        info: 'border-[color:var(--color-borde)] bg-[color:var(--color-primario-suave)] text-[color:var(--color-primario-fuerte)]',
      },
    },
    defaultVariants: { tono: 'info' },
  },
);

export function Alert({
  className,
  tono,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof variantesAviso>) {
  return <div className={cn(variantesAviso({ tono }), className)} {...props} />;
}
