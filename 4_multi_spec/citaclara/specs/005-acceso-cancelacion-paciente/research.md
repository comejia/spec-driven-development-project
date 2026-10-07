# Fase 0 — Investigación: Acceso y cancelación del paciente (005)

Consolida las decisiones técnicas y de negocio. Las **NEEDS CLARIFICATION** funcionales ya se
resolvieron en `spec.md` (sección *Clarifications*, sesión 2026-09-22): umbral de 24 h, token por
paciente, regeneración y ausencia de 2º factor. Aquí se recogen esas decisiones más las
elecciones técnicas derivadas del stack de la 001.

## D1 — Modelo de acceso: token opaco por paciente (no por cita)

- **Decisión**: relación **1:1 `paciente ↔ token`** en una tabla nueva `acceso_paciente`. Un único
  enlace `/p/[token]` da acceso a **todas** las citas del paciente.
- **Rationale**: la spec (FR-001, FR-005, Clarifications) lo fija como fuente de verdad y sustituye
  cualquier token por cita de 002. Un token por paciente unifica la identidad que hoy estaría
  duplicada entre 002 y 003, y simplifica los enlaces de recordatorio (Principio 4).
- **Alternativas consideradas**: *token por cita* (rechazado: multiplica enlaces, complica la
  regeneración y contradice FR-001/FR-005); *cuenta + contraseña* (rechazado explícitamente por la
  spec: sin cuentas ni contraseñas, FR-006).

## D2 — Generación del token opaco

- **Decisión**: token aleatorio de **≥ 128 bits** de `node:crypto` (`randomBytes(32)`), codificado
  **URL-safe** (base64url o hex) y almacenado tal cual en columna `text` con **índice único**. Sin
  dependencias nuevas.
- **Rationale**: "opaco e imposible de adivinar" (FR-001). 256 bits de `randomBytes(32)` hacen
  inviable la enumeración; base64url es seguro en rutas `/p/[token]`. Reutiliza el runtime de Node.
- **Alternativas consideradas**: *UUID v4* (122 bits; suficiente pero menos margen y semántica de
  "identificador" no de "secreto"); *JWT firmado* (rechazado: introduce gestión de claves y
  expiración no pedida, viola Principio 4); *hash del token en BD* (innecesario para v1: es un
  enlace de conveniencia, no una credencial de alto valor; se documenta como posible refuerzo).

## D3 — Regeneración del token (compromiso)

- **Decisión**: la regeneración **sustituye** el token del paciente en su fila 1:1 (un solo token
  vigente por paciente en todo momento). El enlace anterior deja de resolver **de inmediato**, sin
  periodo de solapamiento.
- **Rationale**: FR-004 y edge case "token comprometido y regenerado". Al haber un único registro
  por paciente, escribir el nuevo token invalida el anterior atómicamente.
- **Alternativas consideradas**: *historial de tokens con expiración* (rechazado: permitiría un
  solapamiento temporal que la spec prohíbe y añade complejidad).
- **Nota de alcance**: la spec exige que "recepción pueda regenerar". La UI de recepción para
  disparar la regeneración es propiedad de la superficie de 001/003; esta spec expone la
  **operación** (servicio) y garantiza su semántica. La exposición concreta en pantalla de
  recepción se coordina con el propietario correspondiente y no añade alcance fantasma aquí.

## D4 — Denegación neutra

- **Decisión**: token inexistente **o** manipulado → misma respuesta neutra (misma página/estado
  "enlace no válido"), sin distinguir causas ni revelar existencia de pacientes.
- **Rationale**: FR-002, SC-002 y edge cases. Evita filtrar qué enlaces son válidos.
- **Alternativas consideradas**: *404 vs 403 diferenciados* (rechazado: filtra información).

## D5 — Política de cancelación: umbral único de 24 h como función pura

- **Decisión**: una **función de dominio pura** `politica-cancelacion.ts` decide, dado el `inicio`
  de la cita, su `estado` y el instante "ahora", si (a) se **ofrece** cancelar y (b) se **permite**
  cancelar. Cancelable ⇔ `estado === 'reservada'` **y** faltan **≥ 24 h** para el inicio. El límite
  de **24 h exactas SÍ** es cancelable; 23 h 59 min no.
- **Rationale**: FR-007/008/009 y edge case del límite exacto. Aislar la regla en dominio la hace
  testeable sin DB/UI (Principio 6) y garantiza que oferta (UI) y permiso (servidor) usen la
  **misma** función → coherencia (FR-012). Decisión de negocio de Sara: "regla única y explicable
  por teléfono".
- **Cálculo**: se compara `inicio - ahora >= 24 h` sobre instantes absolutos (UTC), evitando
  ambigüedad de DST; la presentación usa `Europe/Madrid` (reutiliza `src/domain/tiempo.ts`).
- **Alternativas consideradas**: *umbral de 2 h + lista de espera* (registrado como posible **v2**,
  fuera de alcance por decisión de Sara); *duplicar la regla en cliente y servidor* (rechazado:
  riesgo de divergencia, viola FR-012).

## D6 — Ejecución de la cancelación: delegar en 001

- **Decisión**: la cancelación **invoca** `cambiarEstado(clinicaId, citaId, 'cancelada')` de la 001.
  Esta spec **no** reimplementa la transición ni la liberación del hueco.
- **Rationale**: FR-010, Principio 3/4 y matriz de propiedad de `specs/MAPA.md` (el ciclo de vida
  es propiedad de 001). `cambiarEstado` ya aplica la transición condicionada al estado de origen
  (`estado = 'reservada'`), lo que aporta **idempotencia/atomicidad** ante concurrencia (FR-011):
  la segunda solicitud recibe `TRANSICION_INVALIDA` y no hay doble efecto.
- **Alternativas consideradas**: *UPDATE directo del estado en 005* (rechazado: duplica la lógica
  capital de 001 y rompe la propiedad única del concepto).

## D7 — Autorización sin sesión de clínica

- **Decisión**: los endpoints del paciente (`/p/[token]` y su cancelación) **no** usan la sesión de
  clínica de 001; la autorización es la **posesión del token**. El servidor resuelve token →
  `pacienteId` + `clinicaId` y restringe todas las lecturas/acciones a ese paciente.
- **Rationale**: FR-002/FR-003/FR-006. El paciente no tiene clave de clínica; el token es su única
  credencial. La `clinicaId` derivada del paciente se usa para invocar `cambiarEstado` con el
  ámbito correcto y para mostrar el teléfono de la clínica adecuado.
- **Alternativas consideradas**: *exigir clave de clínica* (rechazado: el paciente no la tiene);
  *2º factor* (fuera de alcance, FR-006).

## D8 — Teléfono de la clínica dentro de la ventana

- **Decisión**: dentro de la ventana (< 24 h, o cita ya iniciada/pasada, o estado no "reservada"),
  la vista **no ofrece** cancelar y **muestra el teléfono de la clínica del paciente**.
- **Rationale**: FR-008. Requiere un campo de teléfono de contacto de la clínica.
- **Hallazgo**: el esquema actual de `clinica` (001) **no** tiene teléfono. Se resuelve con la
  **mínima extensión**: añadir `clinica.telefono` (dato de contacto), poblado por la semilla. Es un
  atributo de la entidad Clínica (propiedad de 001); esta spec lo **consume** para FR-008. Se
  documenta en `data-model.md` como extensión coordinada, sin duplicar la entidad.
- **Alternativas consideradas**: *hardcodear un teléfono* (rechazado: no reproducible ni por
  clínica); *variable de entorno global* (rechazado: cada paciente pertenece a una clínica y el
  teléfono debe ser el de su clínica, Assumptions de la spec).

## D9 — Semilla determinista

- **Decisión**: extender `src/seed/seed.ts` para asignar un **token estable** a cada paciente y un
  **teléfono** a cada clínica, con valores derivados de la semilla fija (misma semilla → mismos
  tokens y teléfonos).
- **Rationale**: Principio 5 y SC-001..SC-005: los ejemplos y tests citan tokens y horas
  reproducibles (p. ej., una cita a 25 h cancelable y otra a 23 h bloqueada).
- **Alternativas consideradas**: *tokens aleatorios no reproducibles* (rechazado: rompe la
  reproducibilidad exigida).

## Resumen de NEEDS CLARIFICATION

Ninguna pendiente. Las cuatro preguntas abiertas se cerraron en `spec.md` (Clarifications) y las
decisiones técnicas derivadas quedan fijadas arriba (D1–D9).
