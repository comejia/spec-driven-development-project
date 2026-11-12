# Feature Specification: Operación y continuidad del servicio

**Feature Branch**: `010-operacion-continuidad-servicio`

**Created**: 2026-11-12

**Status**: Draft (ingeniería inversa; **no aprobable** hasta que firme una persona identificada y se resuelva A-18, ver «Actas y estado de aprobación»)

**Input**: User description: "Operación y continuidad del servicio. Alcance: decisiones de negocio sobre cómo se usa y se protege GesFact: quién accede, qué pasa si falta la BD, copias de seguridad, envío de facturas por correo, ubicación de la configuración, y la BD analizada como condición previa de todas las demás specs. RN: ninguna. Anomalías: A-18, A-46, A-48, A-51, A-56, A-17. Dueño natural: Gerencia; el correo, el responsable del correo (Manoli, rol por confirmar)."

> **Encuadre.** Spec de ingeniería inversa: documenta el comportamiento EXISTENTE de la operación de GesFact (acceso, arranque y base de datos, copias de seguridad, correo y configuración) en lo que implica decisiones de negocio. No es una feature nueva: es la especificación formal de lo que el sistema YA hace, para que sirva de contrato en la modernización.
>
> **Reglas de esta spec.**
> - Cada requisito describe el comportamiento ACTUAL y cita su evidencia (fichero y función, o dato real). Esa evidencia es obligatoria (Constitución, Principio II) y por eso aparecen nombres de fichero; no describen cómo construir nada nuevo.
> - Las anomalías NO se corrigen ni se omiten: se especifican tal cual funcionan hoy, con su ID del registro (`specs/000-reconocimiento/registro-de-anomalias.md`).
> - Cada criterio es verificable contra la suite de `test/` (se cita el test) cuando existe; varios **no tienen test** (A-18, A-51, A-56) y se marcan «sin test».
> - Toda decisión de negocio se cita por su acta (documento, pregunta, persona, fecha).
> - **No se reproducen** claves, usuarios ni contraseñas de `config.js` (A-47, fuera de las specs de negocio).
> - **Hueco de protección**: el golden master **no cubre** esta spec. Se apoya en `semilla.test.js` y `rutas.test.js`.
> - **No tiene reglas de negocio (RN)**: son decisiones operativas, no reglas de cálculo.

## Actas y estado de aprobación

No existe ninguna entrevista con una persona identificada (`entrevista-negocio.md` no existe). Las decisiones que esta spec cita provienen de:

| Cita | Documento | Persona | Fecha | Valor |
|---|---|---|---|---|
| P20 (A-18) | `entrevista-negocio-simulada.md` | Gerencia / Administración, **sin identificar**, [PROPUESTA DEL CONSULTOR] | 2026-11-11 | **Bloqueante**: obtener una copia real de la BD y repetir las comprobaciones AD-01 a AD-15 antes de aprobar las demás specs. Se mantiene la declaración S4 («es producción») como hipótesis de trabajo; hecho sin respuesta concluyente |
| P21 (A-46) | `entrevista-negocio-simulada.md` | [PROPUESTA DEL CONSULTOR] | 2026-11-11 | Usuario si hay cualquier acceso externo; el hecho (si hay acceso externo) queda sin respuesta concluyente |
| P21 (A-48) | `entrevista-negocio-simulada.md` | [PROPUESTA DEL CONSULTOR] | 2026-11-11 | Se mantiene desactivado y se registran los envíos |
| P21 (A-51) | `entrevista-negocio-simulada.md` | [PROPUESTA DEL CONSULTOR] | 2026-11-11 | Copia diaria automática fuera de la oficina y una prueba de restauración; mientras tanto, la del viernes |
| P21 (A-56) | `entrevista-negocio-simulada.md` | [PROPUESTA DEL CONSULTOR] | 2026-11-11 | Se mantiene sin renombrar; la ruta real, **sin respuesta concluyente** |
| MH-18 | `memoria-historica.md` | Manoli (rol por confirmar) | 2022 | El correo lo decidió Manoli. CÓDIGO / historia, **no es acta** |
| Anexo A | `propuesta-particion-specs.md` | [CLIENTE SIMULADO] | 2026-11-12 | Ratifica las anteriores |

Ninguna cuenta como testigo NEGOCIO (Principio II exige nombre y fecha). A-18, A-46, A-48, A-51 y A-56 siguen **PENDIENTE** en el registro; A-17 es BUG A SECAS. **Esta spec es la condición previa transversal**: A-18 (la BD analizada es la semilla) es **bloqueante** para aprobar las demás specs hasta que se repita la arqueología con una copia real.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - La BD analizada es una copia de la semilla (Priority: P1)

La BD de `datos/gesfact.db` que se ha analizado contiene 9 facturas de enero a mayo de 2026 y coincide con la semilla que `db.js` carga en una BD vacía (AD-16). El negocio la declaró de producción (S4). Mientras no se repita el análisis con una copia real, los datos de ejemplo de las demás specs (números de factura, importes, NIF) son hipótesis de trabajo.

**Why this priority**: es la condición previa de todas las specs (cada una incluye un aviso). Si la BD de producción difiere, cambian los casos de ejemplo, no las reglas del código.

**Independent Test**: comparar una BD nueva sembrada con la BD analizada (no automatizado). Test parcial: `semilla.test.js` «A-17 una BD nueva se rellena sola con la semilla (6/8/4/9/28)».

**Acceptance Scenarios**:

1. **Given** una carpeta sin BD, **When** arranca `db.js`, **Then** crea las 6 tablas y carga 6 clientes, 8 artículos, 4 contratos, 9 facturas y 28 líneas, con los contadores FA = 108 y RE = 1. Test: «A-17 una BD nueva se rellena sola».
2. **Given** la BD analizada, **When** se compara con la semilla, **Then** coincide (AD-16). *Sin test: es un hecho de los datos del equipo, no del código.*
3. **Given** una copia real de la BD, **When** se repite la arqueología (AD-01 a AD-15), **Then** se confirmarán o corregirán los ejemplos de las specs 001 a 009. *Pendiente (P20, bloqueante).*

---

### User Story 2 - Si falta la BD, se crea una nueva con datos de ejemplo (Priority: P1)

La ruta de la BD es relativa (`./datos/gesfact.db`). Si el fichero falta, o el servidor se arranca desde otra carpeta, `db.js` crea una BD vacía y, si no hay clientes, carga la semilla: clientes, facturas y los contadores FA = 108 y RE = 1. No avisa. Si ya hay clientes, no vuelve a sembrar. Sin la carpeta `views/` en el directorio de ejecución, el panel responde 500.

**Why this priority**: se podrían emitir facturas reales FA-2026-000109 y siguientes en una BD paralela, con números que ya existen en la real (A-17).

**Independent Test**: arrancar `db.js` en carpetas temporales. Tests: `semilla.test.js` «A-17», «db.js no vuelve a sembrar»; `rutas.test.js` «A-17 / O4 server.js usa rutas relativas».

**Acceptance Scenarios**:

1. **Given** una carpeta nueva, **When** se arranca, **Then** se crea y se siembra la BD (6/8/4/9/28). Test: «A-17 una BD nueva se rellena sola».
2. **Given** una BD que ya tiene clientes, **When** se vuelve a inicializar, **Then** no se vuelve a sembrar (mismo número de clientes). Test: «db.js no vuelve a sembrar una BD que ya tiene clientes».
3. **Given** un directorio de ejecución sin `views/`, **When** se pide el panel, **Then** responde 500 con «Failed to lookup view "index" in views directory». Test: «A-17 / O4 … sin views/».
4. **Given** las seis tablas del esquema, **When** se leen sus columnas, **Then** son `articulos`, `clientes`, `contadores`, `contratos`, `facturas` y `lineas`, con las columnas esperadas (por ejemplo, `facturas.serie` por defecto `'FA'` y `estado` por defecto `'emitida'`). Test: «las seis tablas del esquema».

---

### User Story 3 - Cualquiera de la red interna puede usar el sistema (Priority: P2)

El servidor escucha en el puerto 3000 en **todas las interfaces** (sin indicar dirección) y no pide usuario ni contraseña ni protege los formularios frente a peticiones falsas. Se asume que solo hay red interna de la oficina.

**Why this priority**: cualquier equipo que alcance el puerto puede emitir, cobrar o rectificar facturas (A-46). Si hay acceso externo, el riesgo cambia.

**Independent Test**: arrancar el servidor y mirar a qué dirección escucha. Test: `rutas.test.js` «A-46».

**Acceptance Scenarios**:

1. **Given** el servidor arrancado, **When** se mira la dirección de escucha, **Then** es `::` o `0.0.0.0` (todas las interfaces) y el puerto pedido es el de la configuración (3000). Test: «A-46 el servidor escucha en todas las interfaces».
2. **Given** cualquier ruta de escritura (alta de factura, cobro, rectificación, bajas), **When** se envía una petición sin credenciales, **Then** se atiende. *Evidencia: ninguna ruta pide autenticación (`server.js:17-42`); sin test específico más allá de A-46.*
3. **Given** que la hipótesis es «solo red interna», **When** hay algún acceso externo, **Then** habría que exigir usuario (P21, propuesta). *No es comportamiento actual.*

---

### User Story 4 - El correo de facturas está desactivado desde 2022 (Priority: P2)

Al emitir una factura manual el sistema llama al servicio de correo, pero éste **no envía nada**: escribe un aviso en la consola («envio desactivado … pendiente de enviar a mano a <correo>») y responde que ha ido bien. Las facturas se envían a mano desde el Outlook de Marga, imprimiendo la vista de factura a PDF con el navegador. Hay que hablar con Manoli antes de reactivarlo.

**Why this priority**: nada garantiza que el cliente reciba la factura; depende de una persona. No se registran los envíos.

**Independent Test**: llamar a `enviarFactura`. Test: `semilla.test.js` «A-48».

**Acceptance Scenarios**:

1. **Given** una factura y un cliente con correo, **When** se llama a `enviarFactura`, **Then** escribe «[email] AVISO: envio desactivado. Factura FA-2026-000109 pendiente de enviar a mano a a@b.es» y llama a la función de retorno con `null`. Test: «A-48».
2. **Given** un cliente sin correo, **When** se llama, **Then** el aviso dice «(sin email)». Test: «A-48».
3. **Given** el módulo, **When** se miran sus funciones exportadas, **Then** solo exporta `enviarFactura`. Test: «A-48».
4. **Given** la configuración de correo, **When** se lee, **Then** el servidor es `smtp.arsys.es` y el puerto 465. Test: `semilla.test.js` «SMTP: servidor y puerto». *Las credenciales no se reproducen.*

---

### User Story 5 - La copia de seguridad es manual y semanal (Priority: P2)

Marga copia `datos/gesfact.db` a un pendrive los viernes (`LEEME.txt`). No hay otra copia ni prueba de restauración. Una restauración dejaría los contadores por detrás de facturas ya enviadas (números repetidos, spec 003). Esta spec lo **documenta sin especificar**: es una práctica decidida por alguien, no una regla del código.

**Why this priority**: se podría perder hasta una semana de facturación y repetir números tras restaurar (A-51).

**Independent Test**: no tiene test (es un procedimiento humano, no código).

**Acceptance Scenarios**:

1. **Given** el procedimiento, **When** se consulta el `LEEME.txt`, **Then** dice que Marga copia la BD a un pendrive los viernes. *Sin test: documentación.*
2. **Given** que `datos/*.db` no se versiona, **When** se mira `.gitignore`, **Then** la BD queda fuera del repositorio. *Sin test.*
3. **Given** la propuesta P21, **When** se acepte, **Then** habría copia diaria automática fuera de la oficina y una prueba de restauración. *No es comportamiento actual.*

---

### User Story 6 - La configuración se copia a mano y no se puede renombrar (Priority: P3)

`config.js` se copia a mano al servidor de la oficina cuando cambia algo, y lleva la advertencia «NO RENOMBRAR». El comentario del fichero sitúa el servidor en `\\SERVIDOR\gesfact` y el `LEEME.txt` en `\\SERVIDOR\compartido\gesfact`: **hay dos rutas** y no se sabe cuál es la real, ni por qué no se puede renombrar. Esta spec lo especifica tal cual (A-56).

**Why this priority**: puede haber dos copias de la configuración con valores distintos (A-38).

**Independent Test**: leer los valores de la configuración. Test parcial: `semilla.test.js` «config.js (criticidad ALTA)».

**Acceptance Scenarios**:

1. **Given** `config.js`, **When** se lee, **Then** el puerto es 3000, la BD `./datos/gesfact.db`, el IVA por defecto 21 y el plazo por defecto 30. Test: «constantes funcionales».
2. **Given** los datos de empresa, **When** se leen, **Then** tienen las ocho claves `cp, direccion, email, nif, nombre, poblacion, registro, telefono`. Test: «datos de la empresa que se imprimen en la factura».
3. **Given** la advertencia «NO RENOMBRAR», **When** se pregunta por qué, **Then** no hay respuesta concluyente (¿lo lee otro programa o un acceso directo?). *Sin test.*
4. **Given** las dos rutas (`\\SERVIDOR\gesfact` y `\\SERVIDOR\compartido\gesfact`), **When** se pregunta cuál es la real, **Then** no hay respuesta concluyente. *Sin test.*

---

### Edge Cases

- **Arrancar desde otra carpeta**: crea una BD paralela con la semilla, sin avisar (A-17); cualquier factura emitida allí no está en la BD real.
- **Fallo al inicializar la BD**: `server.js` escribe el error y termina con código 1 (`server.js:44-48`). Sin test.
- **El correo falla en silencio**: el aviso en consola no llega a nadie; no se registra el envío (P21 propone registrarlo).
- **Restauración de una copia antigua**: los contadores quedan por detrás de facturas ya enviadas; los números se repetirían (spec 003).
- **Contenido de `datos/`**: además de `gesfact.db` hay un volcado de prueba de MySQL de 2018 (`datos/migracion_mysql_2018.sql`) que no se usa; la migración está «sin prisa».
- **Dependencias y entorno** (Node 8, `^`, avisos de seguridad): fuera de esta spec (plan técnico, A-55, A-57, A-58).

## Requirements *(mandatory)*

### Functional Requirements

Cada requisito indica la regla de origen (RN: ninguna), la anomalía asociada (A), la evidencia y el test que lo verifica.

- **FR-001** *(A-46)*: El servidor MUST escuchar en el puerto de `config.PUERTO` (3000) en todas las interfaces, sin indicar dirección. Evidencia: `server.js:49`; `config.js:22`. Test: `rutas.test.js` «A-46».
- **FR-002** *(A-46)*: El sistema MUST NOT exigir usuario, contraseña ni protección CSRF en ninguna ruta. Evidencia: `server.js:17-42` (solo `bodyParser` y las rutas). Test: «A-46» (solo la parte de red).
- **FR-003** *(A-17)*: `db.js` MUST abrir la BD en la ruta relativa `config.RUTA_BD`, crear la carpeta `datos/` si falta y crear las seis tablas si no existen. Evidencia: `db.js:11-17`; `config.js:20`. Test: «las seis tablas del esquema».
- **FR-004** *(A-17)*: Si la tabla de clientes está vacía, `db.js` MUST cargar la semilla (6 clientes, 8 artículos, 4 contratos, 9 facturas, 28 líneas, contadores FA = 108 y RE = 1) sin avisar; si ya hay clientes MUST NOT volver a sembrar. Evidencia: `db.js:83-87`, `:93`, `:176-177`. Test: «A-17 una BD nueva se rellena sola»; «db.js no vuelve a sembrar».
- **FR-005** *(A-17)*: El servidor MUST resolver `views/` y `public/` desde el directorio de ejecución; sin `views/` el panel MUST responder 500. Evidencia: `server.js:16-18`. Test: «A-17 / O4 … sin views/».
- **FR-006** *(A-48)*: `enviarFactura` MUST escribir en consola «[email] AVISO: envio desactivado. Factura <número> pendiente de enviar a mano a <correo o (sin email)>» y llamar a la función de retorno con `null`, sin enviar nada. Evidencia: `services/email.js:11-26`. Test: `semilla.test.js` «A-48».
- **FR-007** *(A-48)*: El alta manual de factura MUST llamar a `enviarFactura` y redirigir al detalle, aunque el envío no haga nada. Evidencia: `routes/facturas.js:93-96`. Test: indirecto (altas de `rutas.test.js`).
- **FR-008** *(A-56)*: El sistema MUST leer sus parámetros (empresa, BD, puerto, IVA, correo, plazo, clave de la gestoría) de `config.js` por `require`; el fichero MUST conservar su nombre (advertencia «NO RENOMBRAR»). Evidencia: `config.js:2-3`. Test: «constantes funcionales»; «datos de la empresa». *La razón del nombre y la ruta real: sin test.*
- **FR-009** *(A-51)*: La copia de seguridad MUST seguir siendo manual: copiar `datos/gesfact.db` a un pendrive los viernes. Evidencia: `LEEME.txt:18`; `.gitignore` (excluye `datos/*.db`). *Sin test.*
- **FR-010** *(A-18)*: Los datos de ejemplo de las specs 001 a 009 MUST tratarse como hipótesis hasta que se repita el análisis con una copia real de la BD (P20, bloqueante). Evidencia: AD-16 en el registro. *Sin test.*

### Anomalías: se especifican tal cual

| ID | Qué hace hoy | Clasif. (registro) | Tratamiento acordado | Requisito | Test |
|---|---|---|---|---|---|
| A-18 | La BD analizada es la semilla (transversal) | PENDIENTE | DSE; repetir la arqueología | FR-010 | Sin test |
| A-46 | Sin autenticación ni CSRF; escucha en todas las interfaces | PENDIENTE | DSE | FR-001, FR-002 | «A-46» |
| A-48 | Correo no-op desde 2022 | PENDIENTE | TC | FR-006, FR-007 | `semilla` «A-48» |
| A-51 | Copias manuales semanales en pendrive | PENDIENTE | DSE | FR-009 | Sin test |
| A-56 | `config.js` «NO RENOMBRAR», dos rutas | PENDIENTE | TC | FR-008 | Parcial |
| A-17 | La BD se recrea con la semilla | BUG A SECAS | Corregir conservando la semilla en instalaciones nuevas | FR-003 a FR-005 | `semilla` «A-17»; rutas «A-17 / O4» |

TC = especificar tal cual. DSE = documentar sin especificar. Las correcciones (A-17) corresponden a la modernización, solo hacia delante y por decisión escrita del negocio. Las propuestas de P21 (usuario, registro de envíos, copia diaria) son [PROPUESTA DEL CONSULTOR] y no forman parte del comportamiento actual.

### Key Entities *(include if feature involves data)*

- **Base de datos**: fichero SQLite `datos/gesfact.db` con seis tablas; instancia única compartida.
- **Semilla**: datos de ejemplo que se cargan en una BD vacía.
- **Configuración**: `config.js` (empresa, puerto, BD, IVA, plazo, correo y clave de la gestoría).
- **Servicio de correo**: módulo que hoy solo avisa por consola.
- **Copia de seguridad**: copia manual de la BD en un pendrive.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una BD nueva reproduce la semilla (6/8/4/9/28 y contadores 108 y 1) en el 100 % de los arranques de prueba.
- **SC-002**: Las 6 anomalías de esta spec tienen cada una un test o una nota expresa de «sin test»: A-17, A-46 y A-48 tienen test; A-18, A-51 y A-56 (en lo que no es la configuración) no.
- **SC-003**: Los 10 requisitos funcionales indican su evidencia; 8 de ellos tienen test (total, parcial o indirecto) y 2 (FR-009 y FR-010) están marcados «sin test»; FR-008 lo tiene solo en parte.
- **SC-004**: Ninguna credencial de `config.js` aparece en esta spec.
- **SC-005**: Un revisor de Gerencia puede leer y validar esta spec en unos 30 minutos (estimación del reconocimiento, sin cronometrar).

## Fuera de alcance

- Secretos en claro, concurrencia de SQLite, integridad referencial, errores de BD al usuario, dependencias, versión de Node, ausencia de linter y código muerto (A-47, A-50, A-52, A-54, A-55, A-57 a A-60): **plan de modernización técnica**, no spec de negocio (se reasignan aquí o a su dominio si el negocio ve efecto observable).
- Toda regla de facturación: **specs 001 a 009**.

## Assumptions

- **SUPOSICIÓN**: la declaración S4 («es producción») se mantiene como hipótesis de trabajo (P20) aunque la BD analizada coincida con la semilla.
- **SUPOSICIÓN**: solo hay red interna de la oficina; no se sabe si hay acceso externo (hecho sin respuesta concluyente).
- **SUPOSICIÓN**: el responsable del correo es Manoli (rol por confirmar); la información proviene del comentario de `services/email.js` y de `config.js` (CÓDIGO).
- Los ejemplos con número de factura de las demás specs proceden de la semilla; esta spec es la que lo advierte.
- Dependencia de otras specs: es la **condición previa de las specs 001 a 009**.
