'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Cierra la sesión de clínica y vuelve a la pantalla de acceso (FR-018). */
export function SalirBoton() {
  const router = useRouter();

  async function salir() {
    await fetch('/api/acceso/salir', { method: 'POST' });
    router.replace('/acceso');
    router.refresh();
  }

  return (
    <Button type="button" variante="secundario" onClick={salir}>
      <LogOut aria-hidden="true" />
      Salir
    </Button>
  );
}
