# Quickstart — Validación del Panel de Analítica (004)

Guía para **validar de extremo a extremo** que el panel de analítica cumple su spec sobre los
datos deterministas de la 001. No contiene código de implementación: solo prerequisitos,
comandos y resultados esperados. Detalles en [contracts/analitica.md](./contracts/analitica.md)
y [data-model.md](./data-model.md).

## Prerequisitos

- Node.js 22 LTS y dependencias instaladas (`npm install`), incluida la dependencia nueva de
  gráficos (Recharts) y `date-fns` para semanas ISO.
- PostgreSQL 16 accesible (contenedor de `docker-compose.yml`).
- Variables de entorno de la 001 (`DATABASE_URL`, `SESSION_SECRET` ≥ 16 caracteres). Ver
  `.env.example`.
- **Día de referencia fijo** `2026-09-16` para reproducir los números (FR-014); la semilla usa
  `citaclara-eleva-2026`.

## Puesta en marcha

1. Levantar la base de datos y aplicar migraciones de la 001 (la 004 **no añade migraciones**).
2. Sembrar la historia determinista de "Clínica Eleva" (script de semilla de la 001).
3. Arrancar la aplicación en desarrollo.

## Escenarios de validación

### V1 — Acceso protegido (FR-001, SC-002)
- Abrir `/analitica` **sin** sesión → redirige a `/acceso`; no se muestra ningún número.
- Acceder con la clave correcta de la clínica → se ve la página con los cuatro bloques (US1.1).
- **Esperado**: 100 % de los accesos sin clave válida no muestran datos (SC-002).

### V2 — Ingresos por servicio, al céntimo (US1/US2, FR-004/005, SC-001)
- Consultar el bloque de ingresos (o `GET /api/analitica?dia_referencia=2026-09-16`).
- **Esperado** (suma exacta al céntimo):
  - Primera visita de fisioterapia — 205 — **10.250,00 €**
  - Sesión de fisioterapia — 247 — **9.880,00 €**
  - Primera visita de nutrición — 139 — **6.255,00 €**
  - Consulta de nutrición — 144 — **5.040,00 €**
  - **Total — 735 — 31.425,00 €** (0 céntimos de descuadre).
- Verificar que una cita reservada/cancelada/no_asistida **no** aporta importe (US2.3).

### V3 — Tasa de no asistencia por profesional (US3, FR-006/006a, SC-004)
- Consultar el bloque de tasa (Definición A).
- **Esperado**: María Ferrer **11,3 %** (32/284), Jorge Nieto **7,9 %** (22/279), Lucía Prados
  **11,0 %** (39/353).
- Profesional sin citas pasadas → "sin datos" (no 0 %, no error) (US3.3, FR-010).
- La **nota FR-006c** (efecto "la cancelación sustituye al no-show") aparece junto a la tasa en
  el 100 % de los casos (SC-010).

### V4 — Ocupación semanal por profesional (US4, FR-007/007a, SC-005)
- Consultar el bloque de ocupación.
- **Esperado**: ocupación media ≈ **46 %** (María), ≈ **47 %** (Jorge), ≈ **41 %** (Lucía).
- Ninguna semana futura pintada (solo hasta la semana en curso) (US4.4).
- Ningún porcentaje > 100 % ni división por cero; semana sin jornada → "sin datos" (US4.3).

### V5 — Evolución de las últimas 8 semanas (US5, FR-008/009, SC-006)
- Consultar el bloque de evolución.
- **Esperado** (semanas completas, orden cronológico): 87 / 3.675,00 € (ISO 31), 91 / 3.890,00 €
  (32), 97 / 4.120,00 € (33), 95 / 4.065,00 € (34), 90 / 3.860,00 € (35), 83 / 3.590,00 € (36),
  84 / 3.565,00 € (37).
- Cada semana etiquetada de forma inequívoca (ISO) (FR-009).
- Como máximo 8 semanas; con menos historia, solo las disponibles (US5.3, SC-006).

### V6 — Solo lectura (FR-002, SC-003)
- Capturar el estado de la clínica (conteos por estado + hash de la tabla `cita`).
- Abrir el panel e interactuar con todos sus controles (recargar, cambiar de vista).
- Volver a capturar el estado.
- **Esperado**: estado idéntico antes/después; **cero escrituras**.

### V7 — Calidad de interfaz (FR-011, SC-009)
- Revisar en portátil y en móvil: gráficos claros, sin jerga técnica, contraste y tamaños
  accesibles, textos en español de España.
- **Esperado**: usable sin manual; ejes de accesibilidad de Playwright en verde.

## Comandos de verificación (suite)

- Unitarios de dominio (semana ISO, ocupación, tasa, "sin datos"): `npm run test:unit`
  (o el runner Vitest del proyecto).
- Integración con Postgres (números exactos + solo lectura + aislamiento): `npm run test:integration`.
- E2E de UI (acceso, render, accesibilidad, responsive): `npm run test:e2e`.
- **Puerta de merge (Principio 6)**: toda la suite en verde y cada FR/SC con test que lo
  referencia (ver `trazabilidad.md` cuando se genere en tasks).

## Reproducibilidad (Principio 5, FR-014, SC-007)

Regenerar la semilla con `citaclara-eleva-2026` y volver a ejecutar V2–V5 debe dar **exactamente**
los mismos números en el 100 % de las ejecuciones.
