'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

/**
 * US2 — Acción de cancelar una cita desde el enlace del paciente (005, FR-010/011).
 *
 * Solo se renderiza cuando la política ofrece cancelar (la vista lo decide). Llama al
 * endpoint `POST /api/p/[token]/cancelar`, que delega la transición en la 001. Si la cita
 * ya no está reservada (p. ej. cancelación concurrente), muestra "ya no procede".
 */
export function CancelarCitaPaciente({ citaId }: { citaId: string }) {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const [enviando, setEnviando] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmando, setConfirmando] = React.useState(false);

  async function cancelar() {
    setEnviando(true);
    setError(null);
    try {
      const respuesta = await fetch(`/api/p/${params.token}/cancelar`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ citaId }),
      });

      if (respuesta.ok) {
        router.refresh();
        return;
      }

      const cuerpo = (await respuesta.json()) as { error?: { mensaje?: string } };
      setError(cuerpo.error?.mensaje ?? 'No hemos podido cancelar la cita. Inténtalo de nuevo.');
    } catch {
      setError('No hemos podido conectar. Comprueba tu conexión e inténtalo de nuevo.');
    } finally {
      setEnviando(false);
      setConfirmando(false);
    }
  }

  return (
    <div className="grid gap-3">
      {error ? <Alert tono="error">{error}</Alert> : null}
      {confirmando ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <Button type="button" variante="peligro" onClick={cancelar} disabled={enviando}>
            {enviando ? 'Cancelando…' : 'Sí, cancelar la cita'}
          </Button>
          <Button
            type="button"
            variante="secundario"
            onClick={() => setConfirmando(false)}
            disabled={enviando}
          >
            No, mantener la cita
          </Button>
        </div>
      ) : (
        <Button type="button" variante="secundario" onClick={() => setConfirmando(true)}>
          Cancelar esta cita
        </Button>
      )}
    </div>
  );
}
