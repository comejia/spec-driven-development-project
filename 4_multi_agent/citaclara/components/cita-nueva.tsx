'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarPlus } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { formatearEuros } from '@/src/domain/dinero';
import { FRANJA_VISIBLE, formatearFecha, instanteEnMadrid } from '@/src/domain/tiempo';

/**
 * US1 — Alta de cita desde la agenda (FR-005, FR-020).
 *
 * El formulario pide solo lo imprescindible: profesional, servicio, paciente y hora de
 * inicio. La hora de fin no se pide: la calcula el sistema con la duración del servicio
 * (FR-006). Los mensajes de error llegan del servidor en español y sin jerga técnica.
 */

export interface OpcionProfesional {
  id: string;
  nombre: string;
  especialidad: string;
}

export interface OpcionServicio {
  id: string;
  nombre: string;
  duracionMin: number;
  precioCentimos: number;
}

export interface OpcionPaciente {
  id: string;
  nombre: string;
  telefono: string;
}

interface Props {
  fecha: string;
  profesionales: OpcionProfesional[];
  servicios: OpcionServicio[];
  pacientes: OpcionPaciente[];
  profesionalSeleccionado: string;
}

export function CitaNueva({
  fecha,
  profesionales,
  servicios,
  pacientes,
  profesionalSeleccionado,
}: Props) {
  const router = useRouter();
  const [enviando, iniciarEnvio] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  async function alEnviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setExito(null);

    const formulario = new FormData(evento.currentTarget);
    const hora = String(formulario.get('hora') ?? '');
    if (!hora) {
      setError('Indica la hora de inicio de la cita.');
      return;
    }

    const cuerpo = {
      profesional_id: String(formulario.get('profesional_id') ?? ''),
      servicio_id: String(formulario.get('servicio_id') ?? ''),
      paciente_id: String(formulario.get('paciente_id') ?? ''),
      inicio: instanteEnMadrid(fecha, hora.slice(0, 5)).toISOString(),
    };

    const respuesta = await fetch('/api/citas', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(cuerpo),
    });

    if (!respuesta.ok) {
      const datos = await respuesta.json().catch(() => null);
      setError(datos?.error?.mensaje ?? 'No hemos podido crear la cita. Vuelve a intentarlo.');
      return;
    }

    setExito(`Cita creada para el ${formatearFecha(instanteEnMadrid(fecha, hora.slice(0, 5)))} a las ${hora.slice(0, 5)}.`);
    iniciarEnvio(() => router.refresh());
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nueva cita</CardTitle>
        <CardDescription>
          Elige profesional, servicio, paciente y hora de inicio. La hora de fin se calcula con la
          duración del servicio.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={alEnviar} className="grid gap-4" aria-label="Alta de cita">
          <div className="grid gap-1.5">
            <Label htmlFor="profesional_id">Profesional</Label>
            <Select id="profesional_id" name="profesional_id" defaultValue={profesionalSeleccionado} required>
              {profesionales.map((unProfesional) => (
                <option key={unProfesional.id} value={unProfesional.id}>
                  {unProfesional.nombre} — {unProfesional.especialidad}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="servicio_id">Servicio</Label>
            <Select id="servicio_id" name="servicio_id" defaultValue="" required>
              <option value="" disabled>
                Elige un servicio
              </option>
              {servicios.map((unServicio) => (
                <option key={unServicio.id} value={unServicio.id}>
                  {unServicio.nombre} — {unServicio.duracionMin} min —{' '}
                  {formatearEuros(unServicio.precioCentimos)}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="paciente_id">Paciente</Label>
            <Select id="paciente_id" name="paciente_id" defaultValue="" required>
              <option value="" disabled>
                Elige un paciente
              </option>
              {pacientes.map((unPaciente) => (
                <option key={unPaciente.id} value={unPaciente.id}>
                  {unPaciente.nombre} — {unPaciente.telefono}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="hora">Hora de inicio</Label>
            <Input
              id="hora"
              name="hora"
              type="time"
              min={FRANJA_VISIBLE.desde}
              max={FRANJA_VISIBLE.hasta}
              required
              aria-describedby="ayuda-hora"
            />
            <p id="ayuda-hora" className="text-sm text-[color:var(--color-texto-suave)]">
              En tramos de 5 minutos, entre las {FRANJA_VISIBLE.desde} y las {FRANJA_VISIBLE.hasta}.
            </p>
          </div>

          {error ? (
            <Alert tono="error" role="alert" id="aviso-error-cita">
              {error}
            </Alert>
          ) : null}

          {exito ? (
            <Alert tono="exito" role="status" id="aviso-exito-cita">
              {exito}
            </Alert>
          ) : null}

          <Button type="submit" disabled={enviando} tamano="grande">
            <CalendarPlus aria-hidden="true" />
            {enviando ? 'Guardando…' : 'Reservar cita'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
