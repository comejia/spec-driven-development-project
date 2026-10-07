import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * T011 [US3] — Estado de acceso denegado (FR-003, D3).
 *
 * Mensaje neutro: no distingue "no existe" de "no autorizado" (005 FR-002) y no muestra
 * ningún dato personal ni el token. Se renderiza cuando el puerto de acceso de 005 deniega.
 */
export function AccesoDenegado() {
  return (
    <main
      id="contenido"
      className="mx-auto flex min-h-dvh max-w-md items-center px-4 py-10"
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle>No hemos podido abrir este enlace</CardTitle>
          <CardDescription>
            El enlace no es válido o ha dejado de funcionar. Solicita uno nuevo a tu clínica.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-[color:var(--color-texto-suave)]">
            Por tu seguridad, no mostramos ninguna información sin un enlace válido.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
