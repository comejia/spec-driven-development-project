import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CitaDelPortal } from '@/src/portal/consultar-citas-paciente';

/**
 * T018 [US1] — Tarjeta de una cita del portal (FR-006, FR-018).
 *
 * Presenta fecha/hora en formato ES, profesional, servicio y estado, sin jerga técnica.
 * La acción de cancelar (US2) se inyecta como `children` para no acoplar la tarjeta al
 * flujo de cancelación.
 */
export function TarjetaCita({
  cita,
  children,
}: {
  cita: CitaDelPortal;
  children?: React.ReactNode;
}) {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <CardTitle className="text-base font-semibold">{cita.fechaHoraTexto}</CardTitle>
        <Badge>{cita.estado}</Badge>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-sm">
          <span className="text-[color:var(--color-texto-suave)]">Profesional:</span>{' '}
          {cita.profesional}
        </p>
        <p className="text-sm">
          <span className="text-[color:var(--color-texto-suave)]">Servicio:</span> {cita.servicio}
        </p>
        {children}
        {!cita.cancelable && cita.telefonoClinica ? (
          <p className="pt-2 text-sm text-[color:var(--color-texto-suave)]">
            Para cambios en esta cita, llama a la clínica: {cita.telefonoClinica}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
