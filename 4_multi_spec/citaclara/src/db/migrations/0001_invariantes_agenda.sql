-- Invariante capital de CitaClara (Principio 3, RN1, FR-010/011/012a).
--
-- Un profesional no puede tener dos citas activas solapadas, ni siquiera si dos reservas
-- del mismo hueco llegan en el mismo instante: la restricción de exclusión la evalúa el
-- motor de forma atómica dentro de la transacción, de modo que exactamente una confirma.
-- La misma garantía se aplica al paciente entre profesionales distintos (FR-012a).
--
-- La franja es `[inicio, fin)`, por lo que las citas adyacentes NO solapan (FR-012).
-- Solo bloquean hueco los estados activos: `cancelada` y `no_asistida` lo liberan (FR-010).

CREATE EXTENSION IF NOT EXISTS btree_gist;
--> statement-breakpoint
ALTER TABLE "cita" ADD CONSTRAINT "cita_sin_solape_profesional"
  EXCLUDE USING gist ("profesional_id" WITH =, "franja" WITH &&)
  WHERE ("estado" IN ('reservada', 'completada'));
--> statement-breakpoint
ALTER TABLE "cita" ADD CONSTRAINT "cita_sin_solape_paciente"
  EXCLUDE USING gist ("paciente_id" WITH =, "franja" WITH &&)
  WHERE ("estado" IN ('reservada', 'completada'));
