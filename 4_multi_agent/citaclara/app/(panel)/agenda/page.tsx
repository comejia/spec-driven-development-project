import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AgendaDia } from '@/components/agenda-dia';
import { CitaNueva } from '@/components/cita-nueva';
import { SalirBoton } from '@/components/salir-boton';
import { obtenerClinica } from '@/src/services/acceso';
import {
  consultarAgenda,
  listarProfesionales,
  listarServicios,
} from '@/src/services/consultar-agenda';
import { buscarPacientes } from '@/src/services/pacientes';
import { clinicaDeSesionEnServidor } from '@/src/services/session-servidor';
import { fechaEnMadrid, formatearFecha, instanteEnMadrid } from '@/src/domain/tiempo';

/**
 * US2 — Pantalla de agenda del día (FR-015, FR-016, FR-016a) con el alta de cita
 * integrada (US1, FR-017) y las acciones de estado (US3).
 *
 * La ruta está protegida por el guard de sesión (FR-018): sin sesión válida se redirige
 * a la pantalla de acceso y no se consulta ninguna agenda.
 */

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ profesional?: string; fecha?: string }>;
}

export default async function PaginaAgenda({ searchParams }: Props) {
  const clinicaId = await clinicaDeSesionEnServidor();
  if (!clinicaId) redirect('/acceso');

  const [clinica, profesionales, servicios, pacientes] = await Promise.all([
    obtenerClinica(clinicaId),
    listarProfesionales(clinicaId),
    listarServicios(clinicaId),
    buscarPacientes(clinicaId),
  ]);

  const parametros = await searchParams;
  const hoy = fechaEnMadrid(new Date());
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(parametros.fecha ?? '') ? parametros.fecha! : hoy;
  const profesionalSeleccionado =
    profesionales.find((unProfesional) => unProfesional.id === parametros.profesional)?.id ??
    profesionales[0]?.id;

  if (!profesionalSeleccionado) {
    return (
      <main id="contenido" className="mx-auto max-w-3xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Agenda de {clinica?.nombre ?? 'la clínica'}</CardTitle>
            <CardDescription>
              Todavía no hay profesionales dados de alta en esta clínica.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const agenda = await consultarAgenda(clinicaId, {
    profesional_id: profesionalSeleccionado,
    fecha,
  });

  return (
    <div className="min-h-dvh">
      <header className="border-b border-[color:var(--color-borde)] bg-[color:var(--color-superficie)]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-sm text-[color:var(--color-texto-suave)]">CitaClara</p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Agenda de {clinica?.nombre ?? 'la clínica'}
            </h1>
          </div>
          <SalirBoton />
        </div>
      </header>

      <main id="contenido" className="mx-auto grid max-w-5xl gap-6 px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Elige profesional y día</CardTitle>
            <CardDescription>
              Se muestran {formatearFecha(instanteEnMadrid(fecha, '12:00'))} y las citas de{' '}
              {agenda.profesional.nombre}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form method="get" className="grid gap-4 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
              <div className="grid gap-1.5">
                <Label htmlFor="profesional">Profesional</Label>
                <Select id="profesional" name="profesional" defaultValue={profesionalSeleccionado}>
                  {profesionales.map((unProfesional) => (
                    <option key={unProfesional.id} value={unProfesional.id}>
                      {unProfesional.nombre} — {unProfesional.especialidad}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="fecha">Día</Label>
                <Input id="fecha" name="fecha" type="date" defaultValue={fecha} />
              </div>
              <Button type="submit" variante="secundario">
                Ver agenda
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <AgendaDia agenda={agenda} />
          <CitaNueva
            fecha={fecha}
            profesionales={profesionales}
            servicios={servicios}
            pacientes={pacientes}
            profesionalSeleccionado={profesionalSeleccionado}
          />
        </div>
      </main>
    </div>
  );
}
