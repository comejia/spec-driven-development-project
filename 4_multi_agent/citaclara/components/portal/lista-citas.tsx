import { TarjetaCita } from './tarjeta-cita';
import type { CitaDelPortal } from '@/src/portal/consultar-citas-paciente';

/**
 * T019 [US1] — Lista de citas del portal: dos grupos ("Próximas citas" e "Historial") con
 * estados vacíos claros (FR-005, FR-008). Acepta un `renderAccion` opcional para inyectar
 * la acción de cancelar (US2) por cita sin acoplar la lista al flujo de cancelación.
 */
export function ListaCitas({
  proximas,
  historial,
  renderAccion,
}: {
  proximas: CitaDelPortal[];
  historial: CitaDelPortal[];
  renderAccion?: (cita: CitaDelPortal) => React.ReactNode;
}) {
  return (
    <div className="space-y-8">
      <section aria-labelledby="titulo-proximas" className="space-y-3">
        <h2 id="titulo-proximas" className="text-lg font-semibold">
          Próximas citas
        </h2>
        {proximas.length === 0 ? (
          <p className="text-[color:var(--color-texto-suave)]">
            No tienes ninguna cita próxima.
          </p>
        ) : (
          <ul className="space-y-3">
            {proximas.map((cita) => (
              <li key={cita.id}>
                <TarjetaCita cita={cita}>{renderAccion?.(cita)}</TarjetaCita>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="titulo-historial" className="space-y-3">
        <h2 id="titulo-historial" className="text-lg font-semibold">
          Historial
        </h2>
        {historial.length === 0 ? (
          <p className="text-[color:var(--color-texto-suave)]">
            Todavía no tienes citas en tu historial.
          </p>
        ) : (
          <ul className="space-y-3">
            {historial.map((cita) => (
              <li key={cita.id}>
                <TarjetaCita cita={cita} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
