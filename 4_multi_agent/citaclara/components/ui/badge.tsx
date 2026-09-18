import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/src/lib/utils';

const variantesEtiqueta = cva(
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium',
  {
    variants: {
      tono: {
        neutro: 'bg-[color:var(--color-primario-suave)] text-[color:var(--color-primario-fuerte)]',
        exito: 'bg-[color:var(--color-exito-suave)] text-[color:var(--color-exito)]',
        aviso: 'bg-[color:var(--color-aviso-suave)] text-[color:var(--color-aviso)]',
        error: 'bg-[color:var(--color-error-suave)] text-[color:var(--color-error)]',
      },
    },
    defaultVariants: { tono: 'neutro' },
  },
);

export function Badge({
  className,
  tono,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof variantesEtiqueta>) {
  return <span className={cn(variantesEtiqueta({ tono }), className)} {...props} />;
}
