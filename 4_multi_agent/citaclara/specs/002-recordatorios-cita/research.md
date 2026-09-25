# Research: Recordatorios de Cita (002)

**Fecha**: 2026-09-25 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

Este documento consolida las decisiones de diseño (Fase 0). No quedan marcadores
`NEEDS CLARIFICATION`: la spec 002 está clarificada y el stack lo fija la 001.

---

## D1 — Ventana de envío 24-48 h y disparo diario

- **Decisión**: El proceso diario selecciona las citas en estado `reservada` cuyo `inicio` esté en
  el intervalo `[ahora + 24h, ahora + 48h)` respecto al momento de ejecución (FR-012). Una única
  ejecución diaria cubre la ventana completa sin dejar huecos. El disparo lo realiza un programador
  externo (cron/systemd-timer) o la ejecución manual del script; la orquestación del disparo NO es
  comportamiento de esta spec, solo su idempotencia y su resultado.
- **Rationale**: Con una ventana de 24 h de amplitud y ejecución diaria, cada cita cae en la ventana
  en exactamente una ejecución antes de su inicio, lo que encaja con "un recordatorio por cita"
  (D2). El límite inferior de 24 h evita avisar demasiado tarde; el superior de 48 h evita avisar
  demasiado pronto.
- **Alternativas consideradas**:
  - *Enviar exactamente a 24 h*: exige ejecución muy fiable y frecuente; frágil ante retrasos del
    programador. Rechazada (decisión de Sara: cualquier cita entre 24 y 48 h).
  - *Endpoint HTTP disparado por cron externo*: añade superficie pública y auth; innecesario. El
    script `tsx` (como `db:seed`) es más simple (Principio 4).

## D2 — Idempotencia por cita (no duplicar envíos)

- **Decisión**: Garantizar **como máximo un recordatorio por cita en toda su vida** (FR-003)
  mediante una tabla `recordatorio` con **índice único sobre `cita_id`** e **inserción condicional**
  (`INSERT ... ON CONFLICT (cita_id) DO NOTHING`). El proceso solo genera y escribe el `.eml`
  cuando la inserción crea una fila nueva; si ya existía, se omite sin reenviar.
- **Rationale**: Anclar la unicidad en el motor de datos (como 001 hace con el anti-solape) hace la
  no duplicación robusta ante reejecuciones del mismo día, ejecuciones en días consecutivos e
  incluso ejecuciones concurrentes. Evita una comprobación "leer-luego-escribir" susceptible a
  carreras.
- **Cita movida (FR-011)**: mover una cita en 001 = cancelar la original + crear una nueva
  (FR-017a de 001). La cita nueva tiene otro `cita_id`, por lo que es elegible por sí misma y
  recibe su propio y único recordatorio; la original cancelada deja de ser elegible (FR-002).
- **Alternativas consideradas**:
  - *Marcar un booleano en la propia cita*: acoplaría 002 al esquema de 001 (propiedad ajena) y
    mezclaría responsabilidades. Rechazada.
  - *Idempotencia por (cita, día)*: permitiría 2 avisos (a 48 h y a 24 h). Rechazada por decisión
    de negocio (un solo recordatorio por cita).

## D3 — Correo en modo simulado: fichero `.eml`

- **Decisión**: En ausencia de SMTP configurado, escribir un fichero `.eml` por recordatorio en
  `datos/salida-correo/` (FR-013). El `.eml` es un mensaje MIME RFC 5322 compuesto con utilidades
  propias mínimas (cabeceras `From`, `To`, `Subject`, `Date`, `MIME-Version`, `Content-Type`), sin
  añadir dependencias. El nombre de fichero es determinista y legible (p. ej.
  `<fecha-inicio>-<cita_id>.eml`) para facilitar la validación reproducible.
- **Rationale**: Cumple el requisito de "modo simulado" verificable en disco sin infraestructura de
  correo. Componer el MIME a mano evita una dependencia nueva (Principio 4) y mantiene el contenido
  bajo control total (es-ES, formato de fecha, enlace de 005). Un adaptador tras la interfaz
  `EmisorCorreo` permite sustituirlo por SMTP en el futuro sin tocar el proceso.
- **Contenido mínimo del cuerpo** (FR-005/FR-006/FR-007): nombre del paciente, profesional,
  servicio, fecha y hora de inicio (formato `dd/MM/yyyy HH:mm`, `Europe/Madrid`), nombre de la
  clínica y el **enlace `/p/[token]` de 005**. Los textos de política de cancelación se **derivan de
  005** (24 h; dentro de la ventana, teléfono de la clínica) — FR-008/FR-009 de 002, FR-012 de 005.
- **Alternativas consideradas**:
  - *nodemailer con transporte `stream`/`sendmail`*: dependencia nueva para algo que se resuelve con
    plantilla MIME simple. Rechazada por Principio 4.
  - *Guardar JSON en vez de `.eml`*: no cumple el requisito literal (fichero `.eml`) y es menos
    inspeccionable en un cliente de correo. Rechazada.

## D4 — Integración con el acceso `/p/[token]` de 005

- **Decisión**: El enlace del recordatorio apunta al **acceso personal `/p/[token]` del paciente**,
  propiedad de 005 (FR-001/FR-005 de 005). 002 **no emite ni valida** tokens; obtiene el enlace del
  paciente a través del mecanismo de 005 y lo incrusta en el `.eml`. La cancelación, su ventana
  (24 h) y la validación del token son responsabilidad de 005 + 001.
- **Rationale**: Evita duplicar la identidad del paciente (S3 de la revisión cruzada) y mantiene una
  única postura de seguridad. 002 queda como consumidor puro.
- **Dependencia de integración**: 005 debe exponer, para un `paciente_id`, su enlace `/p/[token]`
  (o el token). Mientras 005 no esté integrada en el worktree, el contrato de esta dependencia se
  documenta en `contracts/` y se cubre en tests con un doble/stub del proveedor de enlaces, sin
  crear un emisor de tokens propio. **Bloqueante de implementación** (no de plan): la construcción
  del enlace real requiere 005 integrada.
- **Alternativas consideradas**:
  - *Token de cancelación por cita propio de 002* (diseño anterior): descartado por S3; crea una
    segunda identidad y una segunda postura de seguridad. Eliminado de la spec.

## D5 — Pacientes sin email y robustez del proceso

- **Decisión**: Las citas elegibles de pacientes sin email válido se **omiten sin interrumpir** el
  proceso (FR-014), dejando constancia (registro/resultado `omitido`). El proceso continúa con el
  resto. La validación de email reutiliza el criterio de 001 (`EMAIL_INVALIDO`).
- **Rationale**: Un dato faltante de un paciente no debe impedir avisar al resto; la robustez del
  proceso batch es un requisito explícito.
- **Alternativas consideradas**: *Abortar el proceso ante el primer email inválido*: frágil y
  contrario a FR-014. Rechazada.

## D6 — Reproducibilidad sobre la semilla determinista

- **Decisión**: El proceso acepta una **fecha de ejecución** (por defecto "ahora") como parámetro,
  de modo que sobre la misma semilla y la misma fecha produzca el **mismo conjunto** de
  recordatorios (FR-015). Los tests de integración fijan una fecha de ejecución conocida contra la
  semilla de 001 y comparan el conjunto de `.eml`/filas `recordatorio` generados.
- **Rationale**: La reproducibilidad (constitución p.5) exige poder inyectar el "ahora" para que la
  ventana 24-48 h sea determinista en test y demostración.
- **Alternativas consideradas**: *Usar siempre el reloj del sistema*: no reproducible en test.
  Rechazada; se permite inyectar el instante de referencia.

## D7 — Concurrencia y transición (propiedad de 001)

- **Decisión**: 002 no implementa la transición `reservada → cancelada` ni la liberación del hueco:
  las **invoca** en el servicio de citas de 001 (FR-010). Ante cancelaciones concurrentes
  (recordatorio/portal/recepción), la garantía de **una sola cancelación efectiva** la aporta 001
  (FR-010a); 002 solo muestra el mensaje adecuado si la cita ya no está `reservada`.
- **Rationale**: Un único propietario del ciclo de vida (S2/S7). El servicio `cambiar-estado` de
  001 ya aplica la actualización condicionada al estado de origen, que resuelve la carrera.
- **Alternativas consideradas**: *Reimplementar la cancelación en 002*: descartado por S2/S7 y
  Principio 1 (propiedad única).

---

## Resumen de remisiones de propiedad

| Concepto | Propietario | 002 hace |
|----------|-------------|----------|
| Acceso `/p/[token]` y política de cancelación (24 h) | **005** | Incrusta el enlace; deriva textos |
| Transición `reservada→cancelada`, liberación de hueco, concurrencia | **001** | Invoca; muestra mensaje |
| Semántica "mover = cancelar + crear" (FR-017a) | **001** | Depende de ella (FR-011) |
| Tasa oficial de no asistencia | **004** | Remite; define su propia eficacia (SC-008) |
| Entidad `recordatorio` e idempotencia por cita | **002** | Propietario |
| Proceso diario y emisor `.eml` | **002** | Propietario |
