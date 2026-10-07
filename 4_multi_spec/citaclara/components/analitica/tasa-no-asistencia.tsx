import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { TasaNoAsistencia } from '@/src/services/analitica';

/**
 * Tasa de no asistencia por profesional (US3, FR-006). Definición A (métrica propiedad de
 * la 004). Muestra la lectura literal, "sin datos" cuando no hay base (FR-010) y SIEMPRE la
 * nota del efecto "la cancelación sustituye al no-show" (FR-006c, SC-010).
 */

interface Props {
  datos: TasaNoAsistencia;
}

export function TasaNoAsistenciaBloque({ datos }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ausencias por profesional</CardTitle>
        <CardDescription>
          De cada 100 citas ya pasadas, cuántas terminaron en no asistida.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <ul className="grid gap-3">
          {datos.profesionales.map((profesional) => (
            <li
              key={profesional.profesional_id}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-[color:var(--color-borde)] pb-3 last:border-0 last:pb-0"
            >
              <div>
                <p className="font-medium">{profesional.nombre}</p>
                <p className="text-sm text-[color:var(--color-texto-suave)]">
                  {profesional.lectura_literal}
                </p>
              </div>
              <p className="text-2xl font-semibold tabular-nums" aria-label={`Tasa de ${profesional.nombre}`}>
                {profesional.tasa_texto}
              </p>
            </li>
          ))}
        </ul>
        <p
          role="note"
          className="rounded-[var(--radius-caja)] bg-[color:var(--color-aviso-suave)] p-3 text-sm text-[color:var(--color-texto)]"
        >
          {datos.nota_efecto_cancelacion}
        </p>
      </CardContent>
    </Card>
  );
}
