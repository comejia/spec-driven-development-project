import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { IngresosPorServicio } from '@/src/services/analitica';

/**
 * Ingresos por servicio (US1/US2, FR-004/FR-005). Solo citas completadas; importes al
 * céntimo en euros (Principio 2). Sin jerga técnica (Principio 7).
 */

interface Props {
  datos: IngresosPorServicio;
}

export function IngresosServicio({ datos }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingresos por servicio</CardTitle>
        <CardDescription>
          Solo se cuentan las citas completadas. Los importes están en euros, al céntimo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {datos.sin_datos ? (
          <p className="text-[color:var(--color-texto-suave)]">Sin datos todavía.</p>
        ) : (
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">
              Ingresos por servicio de las citas completadas, ordenados de mayor a menor.
            </caption>
            <thead>
              <tr className="border-b border-[color:var(--color-borde)] text-sm text-[color:var(--color-texto-suave)]">
                <th scope="col" className="py-2 pr-4 font-medium">
                  Servicio
                </th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">
                  Citas completadas
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  Ingresos
                </th>
              </tr>
            </thead>
            <tbody>
              {datos.servicios.map((servicio) => (
                <tr
                  key={servicio.servicio_id}
                  className="border-b border-[color:var(--color-borde)] last:border-0"
                >
                  <td className="py-2 pr-4">{servicio.nombre}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{servicio.citas_completadas}</td>
                  <td className="py-2 text-right font-medium tabular-nums">{servicio.ingresos}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[color:var(--color-borde)] font-semibold">
                <th scope="row" className="py-2 pr-4 text-left">
                  Total
                </th>
                <td className="py-2 pr-4 text-right tabular-nums">
                  {datos.servicios.reduce((total, s) => total + s.citas_completadas, 0)}
                </td>
                <td className="py-2 text-right tabular-nums">{datos.total}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
