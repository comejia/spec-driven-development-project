# Research (Fase 0): Portal del Paciente

**Feature**: 003-portal-paciente | **Fecha**: 2026-09-25

La spec 003 no tiene marcadores `[NEEDS CLARIFICATION]` (se resolvieron en `/speckit.clarify` y
en la resolución de revisión cruzada). Esta investigación consolida las decisiones de diseño que
habilitan el plan, con foco en el rol de **consumidor** de 005 y 001.

## D1 — Ruta pública del paciente separada del panel de recepción

- **Decisión**: el portal se sirve en `app/p/[token]/`, fuera del grupo `(panel)` de recepción.
- **Rationale**: recepción usa una cookie de sesión HMAC por clínica (`src/services/session.ts`);
  el paciente accede por token de 005. Mezclarlos en el mismo grupo arriesga fugas de sesión y
  complica el middleware. Una ruta pública propia mantiene ambos mundos separados y simples
  (Principio 4).
- **Alternativas**: (a) reutilizar `(panel)` con lógica condicional — rechazada por acoplar dos
  modelos de acceso; (b) subdominio distinto — innecesario para el alcance y añade despliegue.

## D2 — Puertos hacia 005 (acceso y política) con adaptador de desarrollo

- **Decisión**: definir en `src/portal/puertos.ts` dos interfaces —`PortalAccessGateway`
  (`resolverPaciente(token) → { pacienteId, clinicaId } | Denegado`) y `PoliticaCancelacion`
  (`evaluar(cita, ahora) → { cancelable: boolean; motivo?; telefonoClinica? }`)— que **005**
  implementará. Mientras 005 no exista, 003 usa adaptadores **provisionales** (`acceso-desarrollo.ts`,
  `politica-desarrollo.ts`) sobre la semilla, marcados como sustituibles.
- **Rationale**: permite desarrollar y probar 003 de forma aislada sin bloquear en 005, sin
  duplicar reglas (los adaptadores materializan lo ya especificado por 005, no una regla nueva) y
  respetando "un propietario por spec". Cuando 005 aterrice, se cambia el adaptador por su
  implementación real sin tocar UI ni servicios de lectura de 003.
- **Alternativas**: (a) esperar a 005 — rechazada, bloquea la entrega; (b) que 003 defina su propio
  token/umbral — **prohibido** por la resolución de revisión cruzada (postura paralela).

## D3 — Token opaco en la URL: manejo y no filtrado

- **Decisión**: el token es opaco y se trata como secreto de portador. La resolución
  (válido/denegado) la decide el puerto de 005; ante denegación, 003 muestra un **mensaje neutro**
  sin distinguir "no existe" de "no autorizado" (005 FR-002).
- **Rationale**: evita enumeración de tokens y fuga de existencia de pacientes. 003 no registra el
  token en claro en logs ni en analítica.
- **Alternativas**: incluir el `pacienteId` en la URL — rechazada (adivinable, fuga de identidad).

## D4 — Lectura de citas del paciente (servicio de solo lectura de 003)

- **Decisión**: `consultar-citas-paciente.ts` lee `cita ⋈ servicio ⋈ profesional` filtrando por
  `pacienteId` (resuelto por el puerto de acceso) y separa **futuras** (inicio ≥ ahora) e
  **historial** (inicio < ahora) en `Europe/Madrid`, ordenando futuras ascendente e historial
  descendente. Reutiliza los patrones de `src/services/consultar-agenda.ts` y `src/domain/tiempo.ts`.
- **Rationale**: es lectura propia del portal (propiedad de 003), sin tocar reglas de 001/005.
  Reutilizar `tiempo.ts` garantiza formato ES inequívoco (Principio 2).
- **Alternativas**: calcular futuro/pasado en el cliente — rechazada (zona horaria y coherencia).

## D5 — Cancelación: política de 005 + transición de 001

- **Decisión**: `cancelar-desde-portal.ts` (1) verifica acceso por token; (2) evalúa
  `PoliticaCancelacion` (005: 24 h); (3) si es cancelable, **invoca** `cambiarEstado(clinicaId,
  citaId, 'cancelada')` de la 001. No implementa la transición ni la concurrencia.
- **Rationale**: `src/services/cambiar-estado.ts` ya realiza la transición condicionada al estado
  de origen (`estado = 'reservada'`), lo que da **atomicidad e idempotencia** ante concurrencia
  (una sola cancelación efectiva) — exactamente lo que exigen FR-014/FR-015 y S7. 003 se limita a
  invocarla y traducir el resultado a un mensaje claro.
- **Alternativas**: que 003 haga su propio `UPDATE` — rechazada (duplica el control de estado de
  001 y arriesga carreras).

## D6 — Confirmación explícita antes de cancelar (UX)

- **Decisión**: la cancelación exige confirmación explícita en la UI (diálogo) antes de llamar al
  endpoint (FR-013). El endpoint es idempotente por la 001.
- **Rationale**: evita cancelaciones accidentales con un solo toque en móvil; el segundo paso es
  barato y aumenta la confianza.
- **Alternativas**: cancelar con un solo toque — rechazada por riesgo de error del paciente.

## D7 — Sin segundo factor propio en 003

- **Decisión**: 003 **no** añade el "4 últimos dígitos del teléfono" ni ningún segundo factor. El
  acceso es por posesión del token (005 FR-006). Si se desea reforzar, se especifica como
  ampliación de 005.
- **Rationale**: la resolución de revisión cruzada prohíbe una postura de seguridad paralela en
  003. Un puerto de acceso limpio deja espacio a que 005 añada el refuerzo sin cambiar 003.
- **Alternativas**: mantener el 2º factor en 003 — rechazada (postura paralela, incoherente con 005).

## D8 — Pruebas de concurrencia apoyadas en 001

- **Decisión**: las pruebas de concurrencia (portal↔portal, portal↔email(002), portal↔recepción)
  verifican **el resultado observable** (una sola cancelación efectiva, sin estado imposible)
  invocando el servicio de 001, contra PostgreSQL real con Testcontainers.
- **Rationale**: la garantía la aporta 001; 003 prueba que su orquestación la respeta y muestra el
  mensaje adecuado cuando la cita ya no está "reservada" (FR-015).
- **Alternativas**: probar un control de concurrencia propio de 003 — no aplica (no existe).

## Resumen de dependencias

- **005 (sin implementar aún)**: acceso `/p/[token]` y política de cancelación (24 h). 003 consume
  vía puertos + adaptador provisional.
- **001 (implementado)**: `cambiarEstado`/transición atómica e idempotente; dominio `tiempo.ts`,
  `dinero.ts`; esquema Drizzle. 003 reutiliza sin modificar.
- **002 (recordatorios)**: no es dependencia directa de 003; comparte el mismo acceso de 005 y la
  misma garantía de concurrencia de 001 (contemplado en pruebas).
