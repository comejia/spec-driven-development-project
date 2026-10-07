import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PanelAnalitica } from '@/components/analitica/panel-analitica';
import { SalirBoton } from '@/components/salir-boton';
import { obtenerClinica } from '@/src/services/acceso';
import { obtenerAnalitica } from '@/src/services/analitica';
import { clinicaDeSesionEnServidor } from '@/src/services/session-servidor';

/**
 * Panel de analítica (004, FR-001/FR-003). Página de SOLO LECTURA protegida por la sesión
 * de clínica (misma clave que la agenda): sin sesión válida se redirige a /acceso y no se
 * consulta ningún dato (FR-001, SC-002).
 */

export const dynamic = 'force-dynamic';

export default async function PaginaAnalitica() {
  const clinicaId = await clinicaDeSesionEnServidor();
  if (!clinicaId) redirect('/acceso');

  const [clinica, analitica] = await Promise.all([
    obtenerClinica(clinicaId),
    obtenerAnalitica(clinicaId),
  ]);

  return (
    <div className="min-h-dvh">
      <header className="border-b border-[color:var(--color-borde)] bg-[color:var(--color-superficie)]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-sm text-[color:var(--color-texto-suave)]">CitaClara</p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Analítica de {clinica?.nombre ?? 'la clínica'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/agenda"
              className="text-sm font-medium text-[color:var(--color-primario)] underline-offset-4 hover:underline"
            >
              Volver a la agenda
            </Link>
            <SalirBoton />
          </div>
        </div>
      </header>

      <main id="contenido" className="mx-auto max-w-5xl px-4 py-6">
        <PanelAnalitica analitica={analitica} />
      </main>
    </div>
  );
}
