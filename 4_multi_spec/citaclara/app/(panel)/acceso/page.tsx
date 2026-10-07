import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AccesoFormulario } from '@/components/acceso-formulario';
import { listarClinicas } from '@/src/services/acceso';
import { clinicaDeSesionEnServidor } from '@/src/services/session-servidor';

/** US4 — Pantalla de acceso (FR-018). Sin clave correcta no se ve ninguna agenda. */

export const dynamic = 'force-dynamic';

export default async function PaginaAcceso() {
  if (await clinicaDeSesionEnServidor()) redirect('/agenda');

  const clinicas = await listarClinicas();

  return (
    <main id="contenido" className="mx-auto flex min-h-dvh max-w-md items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>CitaClara</CardTitle>
          <CardDescription>
            Introduce la clave de la clínica para abrir la agenda del mostrador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clinicas.length === 0 ? (
            <p className="text-[color:var(--color-texto-suave)]">
              Todavía no hay ninguna clínica configurada. Ejecuta los datos de demostración para
              empezar.
            </p>
          ) : (
            <AccesoFormulario clinicas={clinicas} />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
