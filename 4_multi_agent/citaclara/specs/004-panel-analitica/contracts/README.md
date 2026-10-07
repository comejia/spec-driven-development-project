# Contratos — Panel de Analítica (004)

Contrato de la interfaz HTTP interna que la página de analítica consume (Route Handler de
Next.js). La 004 es **solo lectura**: no define ninguna operación de escritura. Formato
conceptual (método, ruta, entrada, salida, errores); la implementación se aborda en `tasks.md`.

Convenciones comunes (heredadas de la 001):
- La ruta bajo `/api/analitica` requiere **sesión de clínica válida** (misma clave que la
  agenda, FR-001/001-FR-018). Sin sesión → 401 y ningún dato (SC-002).
- Todos los cálculos se restringen a la clínica de la sesión (FR-012): nunca se mezclan datos
  de otras clínicas.
- Fechas/semanas: interpretadas en `Europe/Madrid`; semanas etiquetadas con ISO-8601 (FR-009).
- Importes en las salidas: enteros de céntimos + cadena formateada es-ES (Principio 2).
- Errores: `{ "error": { "codigo": string, "mensaje": string } }`, mensaje en es-ES sin jerga.
- **Idempotencia total**: `GET` sin efectos secundarios; llamar al endpoint no altera ningún
  dato (SC-003).

Contratos:
- [analitica.md](./analitica.md) — indicadores del panel (ingresos, tasa, ocupación, evolución)
