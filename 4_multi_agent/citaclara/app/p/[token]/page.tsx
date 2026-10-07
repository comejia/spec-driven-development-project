import { accesoPortal } from '@/src/portal/acceso-desarrollo';
import { consultarCitasPaciente } from '@/src/portal/consultar-citas-paciente';
import { ListaCitas } from '@/components/portal/lista-citas';
import { CancelarCita } from '@/components/portal/cancelar-cita';
import { AccesoDenegado } from './acceso-denegado';

/**
 * T013 [US3] + T020 [US1] — Vista del portal del paciente (Server Component).
 *
 * Resuelve la identidad vía el puerto de acceso de 005 (RD-4). Si se deniega, muestra el
 * estado neutro de acceso denegado y NO construye la vista. Si es válida, lista las citas
 * en formato ES, prioridad móvil, en español de España (FR-005, FR-006, FR-018, FR-019).
 * La acción de cancelar (US2) se inyecta por cita mediante `CancelarCita`.
 */

export const dynamic = 'force-dynamic';

export default async function PaginaPortal({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const acceso = await accesoPortal.resolverPaciente(token ?? '');
  if (!acceso.ok) {
    return <AccesoDenegado />;
  }

  const vista = await consultarCitasPaciente(acceso.clinicaId, acceso.pacienteId);

  return (
    <main id="contenido" className="mx-auto max-w-2xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Hola, {vista.paciente.nombre}</h1>
        <p className="text-[color:var(--color-texto-suave)]">
          Aquí tienes tus próximas citas y tu historial.
        </p>
      </header>

      <ListaCitas
        proximas={vista.proximas}
        historial={vista.historial}
        renderAccion={(cita) =>
          cita.cancelable ? <CancelarCita token={token} citaId={cita.id} /> : null
        }
      />
    </main>
  );
}
