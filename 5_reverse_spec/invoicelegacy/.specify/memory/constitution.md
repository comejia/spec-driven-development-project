<!--
Sync Impact Report
==================
Versión: (plantilla sin rellenar) → 1.0.0
Motivo del salto: Primera ratificación con contenido real. Se sustituyen todos los
placeholders de la plantilla por los principios de gobernanza de la fase de
documentación y protección del sistema heredado GesFact.

Principios definidos (nuevos):
- I. El comportamiento actual es sagrado (NO NEGOCIABLE)
- II. Evidencia obligatoria (NO NEGOCIABLE)
- III. Los hallazgos no se corrigen, se registran
- IV. Cero dependencias nuevas y cero refactors (NO NEGOCIABLE)
- V. Todo en español de España

Secciones añadidas:
- Restricciones del Entorno Heredado (antes [SECTION_2_NAME])
- Flujo de Trabajo de Documentación y Protección (antes [SECTION_3_NAME])
- Governance

Secciones eliminadas: ninguna (se reemplazaron placeholders de la plantilla base).

TODO pendientes:
- TODO(RATIFICATION_DATE): fecha de adopción fijada al día de creación de esta
  constitución (2026-10-09) por ausencia de una fecha previa documentada. Confirmar
  con el negocio si debe reflejar otra fecha de acuerdo formal.
-->

# GesFact Constitution

Constitución del sistema de facturación GesFact (Suministros Hidalgo S.L.), un sistema
HEREDADO en producción. El objetivo de esta fase es **documentarlo y protegerlo**, no
mejorarlo. GesFact factura dinero real y la gestoría (terceros) depende de sus resultados
exactos, céntimo a céntimo.

## Core Principles

### I. El comportamiento actual es sagrado (NO NEGOCIABLE)

El comportamiento observable actual del sistema es la referencia absoluta y se considera
correcto por definición durante esta fase. Ningún cambio de comportamiento observable
—resultados de cálculo, numeración, importes, textos, formatos, orden de operaciones o
efectos secundarios— se introduce sin una decisión explícita y por escrito del negocio,
AUNQUE el comportamiento parezca un error.

Reglas:

- Se MANTIENE el redondeo línea a línea tal cual (ver `services/calculo.js:1-9` y
  `lib/util.js:5-7`): cambiarlo ya provocó en mayo de 2019 que la gestoría devolviera un
  trimestre completo. No se toca.
- Se MANTIENE la numeración correlativa sin huecos por serie y año; las facturas NO SE
  BORRAN NUNCA (ver `lib/numeracion.js:3-9`), por requisito legal desde la inspección de
  2020.
- Se MANTIENE el prorrateo "a lo comercial" de 30 días (`services/calculo.js:
  calcularProrrateo`) y el descuento por volumen aplicado línea a línea
  (`services/calculo.js: calcularFactura`), por acuerdo con el negocio y la gestoría.

Justificación: el sistema mueve dinero real y terceros cuadran los resultados céntimo a
céntimo. La estabilidad del comportamiento vale más que su corrección aparente.

### II. Evidencia obligatoria (NO NEGOCIABLE)

Toda afirmación sobre lo que el sistema hace DEBE ir acompañada de su evidencia. No se
documenta nada "de memoria" ni "por lógica".

Tipos de evidencia admitidos:

- **Código**: fichero y líneas concretas (p. ej. `services/calculo.js:34-41`).
- **Dato real**: consulta o registro de la base de datos de producción
  (`datos/gesfact.db`) que demuestre el comportamiento.
- **Testimonio del negocio**: declaración de una persona identificada, con **nombre y
  fecha** (p. ej. "Puri, gestoría, 2018").

Reglas:

- Toda suposición se marca explícitamente como **SUPOSICIÓN** y se convierte en una
  pregunta dirigida al negocio; nunca se presenta como hecho.
- Si no hay evidencia, no hay afirmación: se registra como pregunta abierta.

Justificación: documentar un sistema que factura dinero exige trazabilidad total; una
afirmación sin evidencia puede propagar un error a la gestoría.

### III. Los hallazgos no se corrigen, se registran

Bugs, riesgos, rarezas y comportamientos sospechosos NO se corrigen en esta fase: se
anotan en el **registro de anomalías** con su clasificación. Corregir es una decisión del
módulo siguiente, no de este.

Reglas:

- Cada hallazgo se registra con: descripción, evidencia (según Principio II), y
  clasificación (p. ej. bug / riesgo / rareza / deuda / legal).
- Ejemplos ya conocidos que se REGISTRAN y NO se tocan: el posible desfase de vencimiento
  por cambio de hora (`lib/util.js: sumarDias`, TODO de marzo 2019), la validación de
  NIF solo por longitud (`lib/util.js: validarNIF`), y la condición de carrera histórica
  en numeración (`lib/numeracion.js`, enero 2021).
- Está PROHIBIDO "arreglar de paso" cualquier hallazgo durante la documentación.

Justificación: separar el descubrimiento de la corrección evita cambios de comportamiento
no autorizados (Principio I) y da al negocio el control sobre qué y cuándo se corrige.

### IV. Cero dependencias nuevas y cero refactors (NO NEGOCIABLE)

En esta fase NO se añade ningún paquete ni se reorganiza código. El árbol de dependencias
y la estructura de ficheros se congelan.

Reglas:

- NO se añaden, eliminan ni actualizan entradas en `package.json` / `package-lock.json`.
- NO se renombra, mueve, fusiona ni divide código, ni se "limpia" estilo.
- Los **tests de caracterización** usan EXCLUSIVAMENTE el runner nativo de Node
  (`node:test`) y `node:assert`. No se introduce ningún framework de test ni utilidad
  externa.
- Los tests describen el comportamiento REAL observado, no el deseado; si el sistema hace
  algo "raro", el test lo fija tal cual.

Justificación: cualquier dependencia o refactor nuevo introduce riesgo de cambio de
comportamiento y amplía la superficie a auditar en un sistema que ya está en producción.

### V. Todo en español de España

Toda la documentación, especificaciones, registros, nombres de pruebas, comentarios y
comunicación de esta fase se redactan en español de España, coherente con el resto del
proyecto y con sus usuarios (oficina de Suministros Hidalgo y gestoría).

Reglas:

- Terminología de dominio en el español ya usado por el negocio (factura, serie,
  recargo de equivalencia, prorrateo, remesa, etc.).
- No se traduce ni se "normaliza" la terminología existente a otros idiomas.

Justificación: los lectores de esta documentación son el negocio y la gestoría; el idioma
común reduce malentendidos sobre un sistema sensible.

## Restricciones del Entorno Heredado

- **Plataforma**: Node.js (el entorno histórico documentado es Node 8 / LTS, ver
  `LEEME.txt`). No se exige ni se fuerza una versión moderna en esta fase.
- **Base de datos**: SQLite en `datos/gesfact.db`. La migración a MySQL del
  `datos/migracion_mysql_2018.sql` queda FUERA de alcance (está marcada "SIN PRISA" en
  `LEEME.txt`).
- **Dependencias congeladas**: `express`, `body-parser`, `ejs`, `sqlite3` según
  `package.json`. No se modifican (Principio IV).
- **Datos sensibles**: la base de datos contiene datos reales de facturación. No se
  modifica, no se regenera y no se exfiltra; cualquier análisis se hace en lectura.
- **Zonas conocidas de fragilidad** (se documentan, no se tocan): cálculo y redondeo
  (`services/calculo.js`), numeración (`lib/numeracion.js`), utilidades heredadas del
  GesFact 1.x en Access (`lib/util.js`), y el envío de email roto desde 2022
  (`services/email.js`, ver `LEEME.txt`).

## Flujo de Trabajo de Documentación y Protección

1. **Observar antes de afirmar**: se lee el código y/o los datos y se cita la evidencia
   (Principio II) antes de documentar cualquier comportamiento.
2. **Caracterizar**: se escriben tests con `node:test` que fijan el comportamiento REAL
   observado (Principio IV). Un test que falla indica que se ha malinterpretado el sistema,
   no que el sistema deba cambiar.
3. **Registrar hallazgos**: todo bug/riesgo/rareza va al registro de anomalías con su
   clasificación y evidencia (Principio III). Nunca se corrige en esta fase.
4. **Marcar suposiciones**: lo no verificable se marca como SUPOSICIÓN y se convierte en
   pregunta al negocio.
5. **Puerta de calidad (Quality Gate)**: antes de dar por buena cualquier entrega de
   documentación se verifica que (a) no hay cambios de comportamiento observable, (b) no
   hay dependencias nuevas ni refactors, (c) toda afirmación tiene evidencia, y (d) todo
   está en español de España.

## Governance

Esta constitución PREVALECE sobre cualquier otra práctica o costumbre durante la fase de
documentación y protección de GesFact. Ante conflicto entre rapidez y cumplimiento de
estos principios, mandan los principios.

- **Autoridad sobre el comportamiento**: solo el negocio (Suministros Hidalgo S.L.) puede
  autorizar un cambio de comportamiento observable, y únicamente por escrito. Ninguna
  decisión técnica puede sustituir esa autorización (Principio I).
- **Enmiendas**: cualquier modificación de esta constitución requiere (a) una propuesta
  escrita que justifique el cambio, (b) aprobación del negocio, y (c) actualización de la
  versión y de las fechas según las reglas de versionado de abajo.
- **Versionado (SemVer)**:
  - MAJOR: eliminación o redefinición incompatible de un principio o regla de gobernanza.
  - MINOR: adición de un principio/sección nuevo o ampliación material de guía.
  - PATCH: aclaraciones, correcciones de redacción o ajustes no semánticos.
- **Cumplimiento**: toda entrega de esta fase (documentación, tests de caracterización,
  registros) DEBE verificar su conformidad con los cinco principios en la puerta de
  calidad antes de aceptarse. Las desviaciones se tratan como hallazgos y se registran
  (Principio III); no se "resuelven" silenciosamente.
- **Alcance temporal**: estos principios rigen la fase de documentación y protección. El
  módulo siguiente (correcciones/mejoras) se regirá por su propia revisión de esta
  constitución, que deberá acordarse explícitamente con el negocio.

**Version**: 1.0.0 | **Ratified**: 2026-10-09 | **Last Amended**: 2026-10-09
