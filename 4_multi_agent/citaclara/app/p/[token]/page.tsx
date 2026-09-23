import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CancelarCitaPaciente } from '@/components/cancelar-cita-paciente';
import { obtenerVistaPaciente, type CitaDePaciente } from '@/src/services/acceso-paciente';
import { esErrorNegocio } from '@/src/domain/errores';
import { ETIQUETAS_ESTADO } from '@/src/domain/cita';
import { decidirCancelacion, type MotivoBloqueo } from '@/src/domain/politica-cancelacion';
import { formatearFechaHora } from '@/src/domain/tiempo';
import type { EstadoCita } from '@/src/db/schema';

/**
 * US1/US3 — Vista pública del paciente por enlace personal `/p/[token]` (005).
 *
 * No requiere sesión de clínica: la autorización es la posesión del token (research D7).
 * Un token inválido muestra una vista neutra de "enlace no válido" sin revelar nada
 * (FR-002, D4). Por cada cita se aplica la política única de 24 h (FR-007/008/009): si no
 * se ofrece cancelar, se muestra el teléfono de la clínica (FR-008).
 */

export const dynamic = 'force-dynamic';

const TONO_ESTADO: Record<EstadoCita, 'neutro' | 'exito' | 'aviso' | 'error'> = {
  reservada: 'neutro',
  completada: 'exito',
  cancelada: 'error',
  no_asistida: 'aviso',
};

const MENSAJE_BLOQUEO: Record<MotivoBloqueo, string> = {
  fuera_de_plazo:
    'Faltan menos de 24 horas: para cancelar esta cita, llama a la clínica.',
  ya_iniciada: 'Esta cita ya ha pasado.',
  estado_no_cancelable: '',
};

function VistaNoValida() {
  return (
    <main id="contenido" className="mx-auto flex min-h-dvh max-w-md items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Enlace no válido</CardTitle>
          <CardDescription>
            Este enlace no es válido o ha caducado. Si necesitas ver o gestionar tus citas, ponte
            en contacto con tu clínica.
          </CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
}

export default async function PaginaPaciente({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let vista;
  try {
    vista = await obtenerVistaPaciente(token);
  } catch (error) {
    // Cualquier fallo de acceso (inexistente/manipulado) → vista neutra idéntica (FR-002).
    if (esErrorNegocio(error)) return <VistaNoValida />;
    throw error;
  }

  const ahora = new Date();

  return (
    <div className="min-h-dvh">
      <header className="border-b border-[color:var(--color-borde)] bg-[color:var(--color-superficie)]">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-sm text-[color:var(--color-texto-suave)]">CitaClara</p>
            <h1 className="text-2xl font-semibold tracking-tight">Tus citas</h1>
          </div>
          <p className="text-sm text-[color:var(--color-texto-suave)]">
            {vista.clinicaNombre}
            {vista.clinicaTelefono ? ` · Tel. ${vista.clinicaTelefono}` : ''}
          </p>
        </div>
      </header>

      <main id="contenido" className="mx-auto grid max-w-2xl gap-4 px-4 py-6">
        {vista.citas.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No tienes citas</CardTitle>
              <CardDescription>
                Ahora mismo no hay ninguna cita a tu nombre. Si crees que es un error, llama a tu
                clínica{vista.clinicaTelefono ? ` al ${vista.clinicaTelefono}` : ''}.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          vista.citas.map((unaCita) => (
            <TarjetaCita
              key={unaCita.id}
              cita={unaCita}
              ahora={ahora}
              clinicaTelefono={vista.clinicaTelefono}
            />
          ))
        )}
      </main>
    </div>
  );
}

function TarjetaCita({
  cita,
  ahora,
  clinicaTelefono,
}: {
  cita: CitaDePaciente;
  ahora: Date;
  clinicaTelefono: string;
}) {
  const decision = decidirCancelacion(cita.inicio, cita.estado, ahora);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-lg">{formatearFechaHora(cita.inicio)}</CardTitle>
          <Badge tono={TONO_ESTADO[cita.estado]}>{ETIQUETAS_ESTADO[cita.estado]}</Badge>
        </div>
        <CardDescription>
          {cita.servicio} · {cita.profesional}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {decision.ofrecerCancelar ? (
          <CancelarCitaPaciente citaId={cita.id} />
        ) : cita.estado === 'reservada' && decision.motivoBloqueo ? (
          <p className="text-sm text-[color:var(--color-texto-suave)]">
            {MENSAJE_BLOQUEO[decision.motivoBloqueo]}
            {decision.motivoBloqueo === 'fuera_de_plazo' && clinicaTelefono ? (
              <>
                {' '}
                Teléfono: <strong>{clinicaTelefono}</strong>.
              </>
            ) : null}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
