'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

/**
 * T026 [US2] — Acción de cancelar con confirmación explícita (FR-013, FR-018).
 *
 * Un primer toque revela la confirmación; solo al confirmar se invoca
 * `POST /api/portal/[token]/cancelar`. Traduce el resultado a mensajes es-ES:
 * éxito, "ya no puede cancelarse" (idempotencia/transición inválida) o fuera de plazo.
 * No implementa concurrencia: la garantiza 001 (FR-014/FR-015).
 */
export function CancelarCita({ token, citaId }: { token: string; citaId: string }) {
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function cancelar() {
    setEnviando(true);
    setMensaje(null);
    try {
      const respuesta = await fetch(
        `/api/portal/${encodeURIComponent(token)}/cancelar`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ citaId }),
        },
      );

      if (respuesta.ok) {
        setMensaje('Tu cita se ha cancelado.');
        return;
      }

      const cuerpo = await respuesta.json().catch(() => null);
      const codigo = cuerpo?.error?.codigo;
      if (codigo === 'TRANSICION_INVALIDA') {
        setMensaje('Esta cita ya no puede cancelarse.');
      } else if (codigo === 'FUERA_DE_PLAZO') {
        setMensaje(cuerpo?.error?.mensaje ?? 'Esta cita ya no se puede cancelar por Internet.');
      } else {
        setMensaje(cuerpo?.error?.mensaje ?? 'No hemos podido cancelar la cita. Inténtalo de nuevo.');
      }
    } catch {
      setMensaje('No hemos podido conectar. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setEnviando(false);
      setConfirmando(false);
    }
  }

  if (mensaje) {
    return <p className="pt-2 text-sm">{mensaje}</p>;
  }

  if (!confirmando) {
    return (
      <div className="pt-2">
        <Button variante="secundario" onClick={() => setConfirmando(true)}>
          Cancelar cita
        </Button>
      </div>
    );
  }

  return (
    <div className="pt-2 space-y-2" role="group" aria-label="Confirmar cancelación">
      <p className="text-sm">¿Seguro que quieres cancelar esta cita?</p>
      <div className="flex gap-2">
        <Button onClick={cancelar} disabled={enviando}>
          {enviando ? 'Cancelando…' : 'Sí, cancelar'}
        </Button>
        <Button variante="secundario" onClick={() => setConfirmando(false)} disabled={enviando}>
          No
        </Button>
      </div>
    </div>
  );
}
