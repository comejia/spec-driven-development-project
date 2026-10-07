'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { OcupacionSemanal } from '@/src/services/analitica';

/**
 * Ocupación semanal por profesional (US4, FR-007). Una serie por profesional; semanas
 * etiquetadas de forma inequívoca (FR-009). Solo hasta la semana en curso (FR-007a): las
 * semanas futuras no llegan desde el servicio. Colores con etiqueta de texto para no
 * depender del color (Principio 7).
 */

const COLORES = ['oklch(0.5 0.13 235)', 'oklch(0.48 0.12 155)', 'oklch(0.55 0.13 70)'];

interface Props {
  datos: OcupacionSemanal;
}

export function GraficoOcupacion({ datos }: Props) {
  const haySemanas = datos.semanas.length > 0 && datos.series.length > 0;

  // Formato ancho para Recharts: una fila por semana, una columna por profesional.
  const filas = datos.semanas.map((semana, indice) => {
    const fila: Record<string, string | number | null> = {
      semana: `S${semana.iso_semana}`,
      etiqueta: semana.etiqueta,
    };
    for (const serie of datos.series) {
      fila[serie.nombre] = serie.puntos[indice]?.ocupacion_porcentaje ?? null;
    }
    return fila;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ocupación semanal por profesional</CardTitle>
        <CardDescription>
          Porcentaje de la jornada (09:00–19:00, de lunes a viernes) ocupado por citas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!haySemanas ? (
          <p className="text-[color:var(--color-texto-suave)]">Sin datos todavía.</p>
        ) : (
          <>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filas} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 250)" />
                  <XAxis dataKey="semana" tick={{ fontSize: 13 }} />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(valor: number) => `${valor} %`}
                    tick={{ fontSize: 13 }}
                  />
                  <Tooltip
                    formatter={(valor) => [
                      valor === null || valor === undefined ? 'sin datos' : `${valor} %`,
                      'Ocupación',
                    ]}
                    labelFormatter={(_, carga) =>
                      (carga?.[0]?.payload as { etiqueta?: string })?.etiqueta ?? ''
                    }
                  />
                  <Legend />
                  {datos.series.map((serie, indice) => (
                    <Line
                      key={serie.profesional_id}
                      type="monotone"
                      dataKey={serie.nombre}
                      stroke={COLORES[indice % COLORES.length]}
                      strokeWidth={2}
                      connectNulls
                      dot={{ r: 3 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-3 grid gap-1 text-sm text-[color:var(--color-texto-suave)]">
              {datos.series.map((serie) => (
                <li key={serie.profesional_id}>
                  {serie.nombre}: ocupación media{' '}
                  <span className="font-medium text-[color:var(--color-texto)]">
                    {serie.ocupacion_media === null ? 'sin datos' : `${serie.ocupacion_media} %`}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
