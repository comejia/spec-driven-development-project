'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, CircleSlash, UserX } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ETIQUETAS_ACCION, ETIQUETAS_ESTADO } from '@/src/domain/cita';
import { horaAMinutos, horaEnMadrid, tramosDeLaFranja } from '@/src/domain/tiempo';
import type { EstadoCita } from '@/src/db/schema';
import type { EstadoDestino } from '@/src/validation';
import type { AgendaDelDia } from '@/src/services/consultar-agenda';

/**
 * US2 — Agenda del día por profesional (FR-015, FR-016, FR-016a) y
 * US3 — acciones de estado desde la agenda (FR-017).
 *
 * La franja visible es fija de 08:00 a 21:00 y los tramos libres se distinguen de los
 * ocupados con texto y color (no solo con color), para no depender de la percepción
 * cromática (Principio 7). Las citas canceladas o no asistidas siguen listadas con su
 * estado, pero su tramo vuelve a contar como libre.
 */

const TONO_ESTADO: Record<EstadoCita, 'neutro' | 'exito' | 'aviso' | 'error'> = {
  reservada: 'neutro',
  completada: 'exito',
  cancelada: 'error',
  no_asistida: 'aviso',
};

const ICONO_ACCION: Record<EstadoDestino, typeof Check> = {
  completada: Check,
  cancelada: CircleSlash,
  no_asistida: UserX,
};

const PASO_TRAMOS = 15;

interface Props {
  agenda: AgendaDelDia;
}

export function AgendaDia({ agenda }: Props) {
  const router = useRouter();
  const [pendiente, iniciarTransicion] = useTransition();
  const [confirmando, setConfirmando] = useState<{ citaId: string; destino: EstadoDestino } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const citasQueOcupan = agenda.citas.filter((unaCita) => unaCita.ocupa_hueco);

  function tramoOcupado(tramo: string): boolean {
    const desdeTramo = horaAMinutos(tramo);
    const hastaTramo = desdeTramo + PASO_TRAMOS;
    return citasQueOcupan.some((unaCita) => {
      const desde = horaAMinutos(horaEnMadrid(new Date(unaCita.inicio)));
      const hasta = horaAMinutos(horaEnMadrid(new Date(unaCita.fin)));
      // Intersección de intervalos [inicio, fin): el tramo que empieza justo al terminar
      // la cita queda libre (FR-012).
      return desdeTramo < hasta && desde < hastaTramo;
    });
  }

  async function aplicarEstado(citaId: string, destino: EstadoDestino) {
    setError(null);
    setConfirmando(null);

    const respuesta = await fetch(`/api/citas/${citaId}/estado`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ estado: destino }),
    });

    if (!respuesta.ok) {
      const datos = await respuesta.json().catch(() => null);
      setError(datos?.error?.mensaje ?? 'No hemos podido cambiar el estado de la cita.');
      return;
    }

    iniciarTransicion(() => router.refresh());
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Citas de {agenda.profesional.nombre}</CardTitle>
          <CardDescription>
            {agenda.citas.length === 0
              ? 'Este día no tiene ninguna cita.'
              : `${agenda.citas.length} ${agenda.citas.length === 1 ? 'cita' : 'citas'} en orden de hora.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {error ? (
            <Alert tono="error" role="alert" id="aviso-error-estado">
              {error}
            </Alert>
          ) : null}

          {agenda.citas.length === 0 ? (
            <p className="text-[color:var(--color-texto-suave)]">
              Toda la jornada está libre. Usa «Nueva cita» para reservar un hueco.
            </p>
          ) : (
            <ul className="grid gap-3" aria-label={`Citas de ${agenda.profesional.nombre}`}>
              {agenda.citas.map((unaCita) => {
                const inicio = horaEnMadrid(new Date(unaCita.inicio));
                const fin = horaEnMadrid(new Date(unaCita.fin));
                const enConfirmacion = confirmando?.citaId === unaCita.id;

                return (
                  <li
                    key={unaCita.id}
                    data-cita={unaCita.id}
                    data-estado={unaCita.estado}
                    className="rounded-[var(--radius-caja)] border border-[color:var(--color-borde)] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold">
                          <time dateTime={unaCita.inicio}>{inicio}</time>
                          {' – '}
                          <time dateTime={unaCita.fin}>{fin}</time>
                        </p>
                        <p className="text-base">{unaCita.paciente.nombre}</p>
                        <p className="text-base text-[color:var(--color-texto-suave)]">
                          {unaCita.servicio.nombre} · {unaCita.servicio.duracion_min} min ·{' '}
                          {unaCita.servicio.precio}
                        </p>
                      </div>
                      <Badge tono={TONO_ESTADO[unaCita.estado]}>
                        {ETIQUETAS_ESTADO[unaCita.estado]}
                      </Badge>
                    </div>

                    {unaCita.estado === 'reservada' ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {enConfirmacion ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span role="status" className="text-base">
                              ¿Confirmas «{ETIQUETAS_ACCION[confirmando.destino]}» para{' '}
                              {unaCita.paciente.nombre} a las {inicio}?
                            </span>
                            <Button
                              type="button"
                              tamano="compacto"
                              disabled={pendiente}
                              onClick={() => aplicarEstado(unaCita.id, confirmando.destino)}
                            >
                              Sí, confirmar
                            </Button>
                            <Button
                              type="button"
                              variante="secundario"
                              tamano="compacto"
                              onClick={() => setConfirmando(null)}
                            >
                              No, volver
                            </Button>
                          </div>
                        ) : (
                          (['completada', 'cancelada', 'no_asistida'] as EstadoDestino[]).map(
                            (destino) => {
                              const Icono = ICONO_ACCION[destino];
                              return (
                                <Button
                                  key={destino}
                                  type="button"
                                  variante={destino === 'cancelada' ? 'secundario' : 'suave'}
                                  tamano="compacto"
                                  onClick={() => setConfirmando({ citaId: unaCita.id, destino })}
                                  aria-label={`${ETIQUETAS_ACCION[destino]} de ${unaCita.paciente.nombre} a las ${inicio}`}
                                >
                                  <Icono aria-hidden="true" />
                                  {ETIQUETAS_ACCION[destino]}
                                </Button>
                              );
                            },
                          )
                        )}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Franja de {agenda.franja_visible.desde} a {agenda.franja_visible.hasta}
          </CardTitle>
          <CardDescription>
            Cada tramo indica si está libre u ocupado para {agenda.profesional.nombre}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul
            className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4"
            aria-label="Tramos de la jornada"
          >
            {tramosDeLaFranja(PASO_TRAMOS).map((tramo) => {
              const ocupado = tramoOcupado(tramo);
              return (
                <li
                  key={tramo}
                  data-tramo={tramo}
                  data-ocupado={ocupado ? 'si' : 'no'}
                  className={
                    ocupado
                      ? 'flex items-center justify-between gap-2 rounded-[var(--radius-caja)] border border-[color:var(--color-aviso)] bg-[color:var(--color-aviso-suave)] px-3 py-2 text-[color:var(--color-aviso)]'
                      : 'flex items-center justify-between gap-2 rounded-[var(--radius-caja)] border border-[color:var(--color-exito)] bg-[color:var(--color-exito-suave)] px-3 py-2 text-[color:var(--color-exito)]'
                  }
                >
                  <span className="font-medium">{tramo}</span>
                  <span className="text-sm">{ocupado ? 'Ocupado' : 'Libre'}</span>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
