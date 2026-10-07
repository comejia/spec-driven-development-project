'use client';

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Evolucion } from '@/src/services/analitica';

/**
 * Evolución de las últimas 8 semanas (US5, FR-008). Serie única cronológica de citas
 * completadas e ingresos por semana; semanas etiquetadas de forma inequívoca (FR-009).
 * Máximo 8 semanas; con menos historia solo las disponibles (US5.3). "Sin datos" si no hay
 * historia (FR-010).
 */

interface Props {
  datos: Evolucion;
}

export function GraficoEvolucion({ datos }: Props) {
  const filas = datos.semanas.map((semana) => ({
    semana: `S${semana.iso_semana}`,
    etiqueta: semana.etiqueta,
    completadas: semana.citas_completadas,
    ingresosEuros: Math.round(semana.ingresos_centimos / 100),
    ingresosTexto: semana.ingresos,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolución de las últimas 8 semanas</CardTitle>
        <CardDescription>Citas completadas e ingresos por semana.</CardDescription>
      </CardHeader>
      <CardContent>
        {datos.sin_datos ? (
          <p className="text-[color:var(--color-texto-suave)]">Sin datos todavía.</p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={filas} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 250)" />
                <XAxis dataKey="semana" tick={{ fontSize: 13 }} />
                <YAxis
                  yAxisId="izquierda"
                  tick={{ fontSize: 13 }}
                  label={{ value: 'Citas', angle: -90, position: 'insideLeft', fontSize: 12 }}
                />
                <YAxis
                  yAxisId="derecha"
                  orientation="right"
                  tickFormatter={(valor: number) => `${valor} €`}
                  tick={{ fontSize: 13 }}
                />
                <Tooltip
                  formatter={(valor, nombre, carga) => {
                    if (nombre === 'Ingresos') {
                      return [
                        (carga?.payload as { ingresosTexto?: string })?.ingresosTexto ??
                          `${valor} €`,
                        nombre,
                      ];
                    }
                    return [valor, nombre];
                  }}
                  labelFormatter={(_, carga) =>
                    (carga?.[0]?.payload as { etiqueta?: string })?.etiqueta ?? ''
                  }
                />
                <Legend />
                <Bar
                  yAxisId="izquierda"
                  dataKey="completadas"
                  name="Citas completadas"
                  fill="oklch(0.5 0.13 235)"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="derecha"
                  type="monotone"
                  dataKey="ingresosEuros"
                  name="Ingresos"
                  stroke="oklch(0.48 0.12 155)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
