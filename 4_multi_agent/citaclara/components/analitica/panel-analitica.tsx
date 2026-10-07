import { IngresosServicio } from '@/components/analitica/ingresos-servicio';
import { TasaNoAsistenciaBloque } from '@/components/analitica/tasa-no-asistencia';
import { GraficoOcupacion } from '@/components/analitica/grafico-ocupacion';
import { GraficoEvolucion } from '@/components/analitica/grafico-evolucion';
import type { Analitica } from '@/src/services/analitica';

/**
 * Panel de analítica (US1, FR-003): los cuatro bloques en una sola página. Composición
 * responsive: en pantallas anchas, dos columnas; en móvil, una sola (Principio 7).
 */

interface Props {
  analitica: Analitica;
}

export function PanelAnalitica({ analitica }: Props) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <IngresosServicio datos={analitica.ingresos_por_servicio} />
        <TasaNoAsistenciaBloque datos={analitica.tasa_no_asistencia} />
      </div>
      <GraficoOcupacion datos={analitica.ocupacion_semanal} />
      <GraficoEvolucion datos={analitica.evolucion} />
    </div>
  );
}
