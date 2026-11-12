# Spec pack de GesFact · Documento de entrada

Fecha de ensamblaje: 2026-11-12. Sistema: GesFact 2.4.0, facturación de Suministros Hidalgo, S.L.
Fase: **documentar y proteger**. No se ha cambiado ni una línea de código de producción, ni datos, ni dependencias
(`.specify/memory/constitution.md`, Principios I, III y IV).

Este documento resume el paquete y lleva a los demás. Las cifras y las citas se han tomado de los documentos de
`specs/000-reconocimiento/`; en cada uno está la evidencia completa (fichero y líneas, dato de la BD o testimonio).

**Cómo leerlo.** El gerente solo necesita el apartado 1. El equipo técnico y la gestoría, los apartados 2 a 4.

---

## 1. Resumen ejecutivo para la gerencia

### Qué se ha hecho

Se ha leído GesFact entero y se ha dejado por escrito qué hace de verdad, sin tocarlo: cómo recorre una factura el
sistema, qué reglas de cobro y de cálculo aplica (55 reglas), qué rarezas tiene (73 anomalías) y qué riesgos
conlleva (36). Se ha recuperado también la historia del sistema que hoy solo está en comentarios y en la memoria de
Paco, Marga, Puri, Julián y Roberto. Además se ha instalado una protección de pruebas (más abajo) y se ha redactado
la primera especificación formal, la del cálculo de importes e IVA. Hay una propuesta de otras nueve.

### Qué se ha descubierto

Los cuatro hallazgos con más dinero en juego. Los importes salen de calcular sobre los datos que contiene el sistema, no de facturas reales de la oficina (véase la advertencia que sigue).

1. **El IVA que ve la gestoría puede no coincidir con el que se cobró al cliente.** En 6 de las 9 facturas del sistema, el total
   de la cabecera no es la suma de sus líneas. El informe de IVA suma las líneas; el fichero para la gestoría exporta
   las cabeceras. En el primer trimestre de 2026 darían 603,66 € frente a 736,97 €: **133,31 € de diferencia**. Según
   las respuestas de la entrevista simulada, la gestoría habría declarado los 736,97 € y el cliente de la factura
   `FA-2026-000101` habría pagado 157,47 € y no 161,17 €. Si se confirma, hay una declaración ya presentada que
   regularizar.
2. **Se puede cobrar dos veces la misma cuota.** La remesa mensual no comprueba si un contrato ya se ha facturado. Una segunda
   ejecución duplicaría **393,25 €** con los contratos actuales. Y el mes en que se da de baja un contrato puede salir
   dos veces: por ejemplo, 87,73 € a mano más 84,89 € por remesa para un contrato de 145 € dado de baja el 15 de marzo.
3. **El prorrateo se calcula de dos maneras.** La remesa reparte por los días reales del mes y la pantalla de baja
   siempre por 30. Para una cuota de 90 € desde el 16 de julio salen **46,45 € o 48,00 €** según el camino.
4. **Un importe con punto de millares se lee mil veces menor.** Si alguien escribe `1.210,00`, el sistema cobra
   **1,21 €**. En los datos no hay ningún caso, pero nada lo impide.

> **Advertencia.** El fichero de datos analizado contiene solo los datos de ejemplo del programa (9 facturas de
> enero a mayo de 2026), no el histórico de la oficina (A-18). Los importes anteriores son ilustrativos. Hay que
> repetir el análisis con una copia de la base real.
>
> **Tampoco hay todavía una entrevista real con el negocio.** La que existe es simulada: ninguna respuesta lleva el
> nombre de una persona, y por eso ninguna cuenta como confirmación (Principio II de la constitución).

### Qué protección se ha instalado

Es una **alarma que salta si la facturación cambia un céntimo**. Son 273 pruebas automáticas, más un conjunto de 12
facturas de referencia calculadas con el programa tal como está hoy. Si alguien modifica el cálculo, la
numeración, la remesa o las pantallas de forma que cambie un resultado, la prueba falla e indica la factura y el
campo exactos. Hoy pasan todas. Las pruebas no tocan la base de datos real.

### Decisiones que tiene pendientes el negocio

Hay **30 anomalías sin clasificar** a la espera de una persona identificada que las firme. Estas son las que más importan, por orden:

| # | Decisión | Quién | Recomendación |
|---|---|---|---|
| 1 | Facilitar una copia de solo lectura de la base real (A-18). | Gerencia y Administración | **Hacerlo primero.** Sin ella, todas las cifras de este paquete son provisionales. |
| 2 | Qué IVA se declaró en el 303 del T1 y T2 de 2026 y si se presenta una complementaria (A-01, A-61). | Gestoría y Gerencia | Que la gestoría confirme por escrito la cifra presentada, y que decida con ella si regulariza. El equipo técnico no toca declaraciones. |
| 3 | Cómo se factura el mes de baja de un contrato (A-04). | Administración y Gerencia | Una sola vía, la remesa, y sin factura manual. |
| 4 | Qué fórmula de prorrateo es la buena (A-23). | Gestoría y Gerencia | Unificar con una fórmula, solo hacia delante y con confirmación escrita de la gestoría. |
| 5 | Qué año lleva el número de una factura de diciembre emitida en enero (A-10). | Gestoría | El año de la fecha de la factura, solo hacia delante, si la gestoría lo valida. |
| 6 | Nombrar a las personas que responden por Gestoría, Administración y Gerencia (PD-08). | Gerencia | Sin nombre y fecha no se puede aprobar ninguna spec. |

Las recomendaciones de las filas 3 a 5 vienen de la entrevista simulada. Son propuestas del consultor, no decisiones del negocio.

---

## 2. Inventario de riesgos priorizado

Fuente: `registro-riesgos.md` (R1 a R36, prioridad = impacto × probabilidad, estimada por el equipo, no por el negocio) y
`registro-de-anomalias.md` (A-01 a A-73). Todas las recomendaciones son para la **fase de modernización** y se
aplican **solo hacia delante**: el comportamiento actual es sagrado hasta que el negocio decida por escrito (Principio I).

**Prioridad.** Crítica = toca el IVA declarado o la legalidad de la numeración. Alta = cobros o datos que se pueden perder.
Media = errores de uso o desfases. Baja = presentación, deuda o entorno.

| Prio. | Riesgo (ref.) | Impacto | Recomendación para la modernización |
|---|---|---|---|
| Crítica | **Cabecera ≠ suma de líneas; informe de IVA y CSV leen fuentes distintas** (R1, R36; A-01, A-61) | La gestoría puede declarar un IVA distinto del repercutido (133,31 € en el T1 de 2026). | Una única fuente de importes y que la cabecera sea siempre la suma de las líneas. Las 6 facturas afectadas, solo con rectificativa si lo deciden gestoría y gerencia. |
| Crítica | **El año del número sale del reloj, no de la fecha de la factura** (R2; A-10) | Una factura de diciembre emitida en enero queda en la serie del año siguiente y los trimestres no cuadran. | Derivar el año de la fecha de la factura, nunca con efecto retroactivo y con el visto bueno de la gestoría. |
| Crítica | **La base analizada es la de ejemplo y no el histórico real** (A-18; R4, S4) | Todos los veredictos sobre datos de este paquete se apoyan en 9 facturas. | Repetir el análisis de datos sobre una copia de solo lectura de la base real antes de aprobar ninguna spec. |
| Alta | **La remesa puede facturar dos veces y no se puede reanudar** (R7; A-03) | Cobros duplicados (393,25 € con los contratos actuales) y pares factura + rectificativa que ensucian la numeración. | Impedir una segunda factura por contrato y mes, dejar registro de lo emitido y definir cómo se reanuda una remesa interrumpida. |
| Alta | **Mes de baja facturado por dos vías** (R5; A-04) | Último mes cobrado dos veces. | Elegir una vía única (decisión 3 del resumen). |
| Alta | **Numeración no atómica y sin unicidad** (R3; A-11) | Dos facturas con el mismo número legal, que no se pueden borrar. Ya ocurrió el 2 de enero de 2021. | Reserva atómica del número y restricción de unicidad en la base de datos. |
| Alta | **Operaciones de varios pasos sin transacción**: alta, rectificación y reserva de número (R9, R10, R19; A-12, A-13, A-14) | Facturas con líneas a medias, rectificativas duplicadas o a medias y huecos en una numeración que debe ser correlativa. | Envolver cada operación en una transacción. Mantener el espejo exacto de la rectificativa (regla protegida). |
| Alta | **Sin autenticación y abierto a toda la red** (R6; A-46) | Cualquier equipo de la red puede emitir, cobrar, rectificar y descargar el CSV con la clave. | Control de acceso y protección CSRF. Antes, averiguar si hay acceso desde fuera de la oficina (S8). |
| Alta | **Contraseña de correo y clave de la gestoría en claro y versionadas** (R16; A-47) | Credenciales expuestas a quien lea el repositorio. | Sacarlas del repositorio. Comprobar si la cuenta sigue activa (S6) y rotar claves con la gestoría. |
| Alta | **La base se recrea sola con los datos de ejemplo si falta o se arranca desde otra carpeta** (R4; A-17) | Facturas reales emitidas en una base equivocada, con clientes y números que no son los reales. | Ruta absoluta y configurable, y negarse a arrancar si falta la base en lugar de sembrarla. |
| Alta | **Dos fórmulas de prorrateo** (R5; A-23, protegida) | Cuotas distintas según el camino (46,45 € o 48,00 €). | Una sola fórmula, solo hacia delante, con confirmación escrita de la gestoría. |
| Media | **Una factura emitida se reimprime con los datos actuales del cliente y de la empresa** (R8; A-15) | Una factura ya enviada se puede reimprimir con otro NIF o dirección. | Guardar una copia de los datos fiscales en la factura al emitirla. No es retroactivo con fidelidad. |
| Media | **Validación casi inexistente** en alta de factura, contratos, clientes y artículos (R11, R31; A-09, A-44, A-45, A-53) | Facturas con total negativo, importes vacíos o fechas libres, que luego obligan a rectificar y consumen números. | Validar entradas en el servidor. Decidir con la gestoría cómo se hacen los abonos parciales (A-09). |
| Media | **Importe con punto de millares leído mil veces menor** (A-06) | `1.210,00` se cobra como 1,21 €. | Corregir sin romper `28.9` (que escribe el autorrelleno) ni `12,5`. |
| Media | **Se factura a clientes dados de baja** (R12; A-05) | Cuotas a quien ya no es cliente. | Decidir la política de bajas (Gerencia) y filtrar por `activo`. |
| Media | **Rectificar una cobrada y cobrar una rectificativa** (R25; A-08) | El servidor permite más que la pantalla y el panel cuenta como pendiente algo que nunca se cobra (R23; A-33). | Alinear servidor y pantalla con el procedimiento de devolución que fije la gestoría. |
| Media | **Fronteras del descuento por volumen**: 1.000,00 € y 5.000,00 € exactos no descuentan igual (R24; A-07, A-24, A-69) | En 5.000,00 € exactos, 150,00 € de base. La factura de referencia del 1.000 no es reproducible (A-69). | Mantener la regla y pedir a Gerencia que confirme la frontera de 5.000 €. Documentar el caso de referencia. |
| Media | **`sumarDias` depende de la zona horaria** (R14; A-35) | El vencimiento puede salir un día antes según el equipo que emita. | Calcular fechas en hora de Madrid. Corregir igualando al resultado actual en Madrid. |
| Media | **Copias de seguridad manuales y semanales en un pendrive** (R20; A-51) | Una restauración dejaría los contadores por detrás de facturas ya enviadas. | Copia automática de la base y del contador, y ensayo de restauración. |
| Media | **Dependencias con avisos de seguridad** (R26; A-55) | 4 vulnerabilidades según `npm audit` (1 crítica, 2 altas, 1 moderada). | Actualizar dependencias en modernización y mantener la suite como red. Fijar versiones (R34; A-58). |
| Media | **Remesa y servidor escriben a la vez en el mismo fichero SQLite** (R27; A-50) | Posible bloqueo o fallo de escritura. | Configurar el bloqueo de espera o elegir otro motor. No se ha reproducido. |
| Baja | **Redondeo línea a línea en coma flotante** (R13; A-02, protegida) | Diferencias de un céntimo respecto al cálculo que cuadra la gestoría. | No tocar sin autorización escrita. Cualquier reimplementación debe reproducirlo bit a bit (FR-009 de la spec 001). |
| Baja | **CSV sin escapar** y periodos sin validar (R29, R30; A-41, A-42, A-43) | Columnas rotas si un nombre lleva `;`. Un trimestre 5 provoca un error. | Escapar campos y validar periodos. El formato del CSV, tal cual (acordado con la gestoría). |
| Baja | **Correo roto desde 2022** (R17; A-48) | El envío depende de un proceso manual sin control. | Decidir si se reactiva. Hoy el código solo imprime un aviso. |
| Baja | **Teléfono «925 511 XXX» en cada factura** (R22; A-49) | Factura con un teléfono incompleto de cara al cliente. | Pedir el valor real a Administración. |
| Baja | **NIF validado solo por longitud** (R15; A-22) | NIF erróneos o vacíos sin aviso. | Validar el dígito de control en las altas nuevas. Revisar a mano los existentes. |
| Baja | **Sin integridad referencial ni restricciones** (R21; A-52) | Datos huérfanos o estados inválidos. | Añadir claves ajenas y comprobaciones tras revisar el histórico. |
| Baja | **Deuda y entorno**: código muerto, `LEEME.txt` desfasado, Node 8 documentado frente a Node 22 en el análisis (R28, R33; A-57, A-60) | Operación basada en documentación obsoleta. | Actualizar el `LEEME.txt` y declarar `engines` en `package.json`. |

Un riesgo del registro está ya mitigado: R18 / A-59, «sin tests», por la suite descrita en el apartado 4.

---

## 3. Índice comentado del paquete

Todo cuelga de `5_reverse_spec/invoicelegacy/`. Las rutas son relativas a esa carpeta.

### 3.1 Normas y guías

| Documento | Para qué sirve |
|---|---|
| `.specify/memory/constitution.md` | Los cinco principios: comportamiento actual sagrado, evidencia obligatoria, hallazgos registrados y no corregidos, cero dependencias y refactors, todo en español. **Léela primero.** |
| `AGENTS.md` y `.agents/summary/index.md` | Guía de navegación para asistentes de IA y base de conocimiento por temas (arquitectura, componentes, interfaces, datos, flujos, dependencias). |

### 3.2 Reconocimiento (`specs/000-reconocimiento/`)

| Documento | Qué contiene | Úsalo cuando… |
|---|---|---|
| `mapa-sistema.md` | Cada módulo con su responsabilidad de negocio, dependencias, criticidad, tecnologías reales y «zonas oscuras» (código muerto, ficheros huérfanos). | Necesitas ubicar algo o saber qué es crítico. |
| `flujo-factura.md` | El ciclo de vida de una factura por los tres caminos: alta manual, remesa mensual y rectificación. | Necesitas entender un proceso de principio a fin. |
| `reglas-de-negocio.md` | Las 55 reglas (RN-01 a RN-55) en lenguaje de negocio, con evidencia. | Preguntas qué se cobra, qué se permite o cómo se calcula. |
| `registro-de-anomalias.md` | 73 anomalías (A-01 a A-73) con impacto, evidencia, clasificación, tratamiento y decisión pendiente, además de la matriz de trazabilidad y la agenda de preguntas. | Decides qué se corrige, qué se protege y a quién se pregunta. |
| `registro-riesgos.md` | 36 riesgos (R1 a R36) con puntuación y las suposiciones S1 a S8. | Priorizas la modernización. |
| `contradicciones-indice.md` y `contradiccion-01…10-*.md` | Diez conceptos implementados más de una vez con resultados distintos (prorrateo, redondeo, año de la factura…). | Una cifra sale distinta según el camino. |
| `memoria-historica.md` | Cronología H-01 a H-24: incidentes, decisiones atribuidas a personas, advertencias «no tocar» y trabajos abandonados. | Vas a tocar algo marcado «no tocar» o preguntas por qué es así. |
| `entrevista-negocio-simulada.md` | Acta de la entrevista **simulada** (P1 a P21) y sus pendientes PD-01 a PD-08. Sin valor de testigo. | Preparas la entrevista real. |
| `entrevista-ronda-2-formulario.md` | Formulario de preguntas para la segunda ronda con el negocio. | Planificas la siguiente conversación. |
| `propuesta-particion-specs.md` | Partición en 10 specs por dominio, tabla de trazabilidad (reglas, anomalías, dueño, tests), descripciones listas para `/speckit-specify` y respuestas simuladas a las 30 pendientes (Anexo A). | Lanzas una spec nueva. |

El **glosario** no existe como fichero aparte. Va en el apartado 3.5 de este documento.

### 3.3 Specs formales (`specs/NNN-*/`)

Hay **una spec escrita de diez propuestas**. Todas quedan en borrador hasta que firme una persona identificada.

| Spec | Estado | Trazabilidad |
|---|---|---|
| `001-calculo-importes-iva/spec.md` | Borrador (ingeniería inversa; no aprobable hasta la firma, PD-08). Checklist de calidad en `checklists/requirements.md`. | 13 requisitos funcionales (FR-001 a FR-013). Reglas: RN-01 a RN-06, 12, 13, 51, 52. Anomalías: A-02, A-29, A-34, A-39, A-45, A-62, A-63, A-73. Cada requisito cita su evidencia y el test que lo verifica. Dueño: gestoría. |

Pendientes de generar (la tabla completa con reglas, anomalías, dueño y tests está en `propuesta-particion-specs.md`, §6),
en el orden de lanzamiento recomendado:

| Spec | Dominio | Dueño |
|---|---|---|
| 002 | Descuento por volumen | Gerencia (+ gestoría) |
| 003 | Numeración legal de facturas | Gestoría |
| 004 | Emisión de una factura manual | Administración |
| 007 | Remesa mensual de contratos | Administración |
| 006 | Prorrateo comercial y baja de contratos | Gestoría + Gerencia |
| 005 | Vida de la factura emitida: cobro, rectificación y consulta | Gestoría + Administración |
| 008 | Informes fiscales y exportación a la gestoría | Gestoría |
| 009 | Maestros de clientes: identidad fiscal y bajas | Administración + Gerencia |
| 010 | Operación y continuidad del servicio | Gerencia |

Las specs 005 y 008 dependen de A-01 y deben lanzarse al final. Nueve anomalías puramente técnicas quedan fuera de las specs de negocio
(A-47, A-50, A-52, A-54, A-55, A-57, A-58, A-59, A-60) y pasan al plan de modernización técnica.

### 3.4 Suite de pruebas (`test/`)

| Elemento | Qué es |
|---|---|
| `calculo.test.js`, `util.test.js`, `numeracion.test.js`, `remesa.test.js`, `rutas.test.js`, `semilla.test.js` | Pruebas de caracterización por módulo. Las marcadas «CONGELA comportamiento actual» fijan una anomalía. |
| `golden-master.test.js` y `golden/` | Salida completa de 12 casos de emisión de facturas (`master.json`). `golden/LEEME.md` explica cuándo y cómo regenerarlo. |
| `ayudas/` | Utilidades de prueba: BD temporal, reloj y zona horaria fijos, servidor HTTP de pruebas. No son código de producción. |

**Cómo ejecutarla.** Hace falta Node.js con el ejecutor `node:test` (se ha ejecutado con Node 22; `LEEME.txt` documenta Node 8, que no sirve para las pruebas).

```bash
cd 5_reverse_spec/invoicelegacy
npm install
npm test        # equivale a: node --test test/*.test.js
```

Resultado esperado: 273 pruebas en 44 suites, todas correctas. Se comprobó el 2026-11-12. Cada prueba crea sus propias bases de datos temporales y borra
lo que crea, con la zona horaria `Europe/Madrid` y el reloj del sistema fijados. No abre `datos/gesfact.db`.

Si una prueba falla, **no se arregla la prueba ni se regenera el master**: es un cambio de comportamiento que hay que explicar o revertir (`test/golden/LEEME.md`).

### 3.5 Glosario

| Término | Significado en GesFact |
|---|---|
| **Remesa** | Proceso mensual (`node scripts/remesa_mensual.js AAAA-MM`) que emite una factura por cada contrato vigente. Se lanza a mano, normalmente el día 1 del mes siguiente. |
| **Contrato** | Cuota periódica de un cliente con fecha de alta y, si procede, de baja. Alimenta la remesa. |
| **Prorrateo** | Parte proporcional de una cuota cuando el contrato empieza o termina a mitad de mes. Hay dos fórmulas: días reales del mes (remesa) y 30 días (pantalla de baja). |
| **FA / RE** | Series de numeración. FA = factura; RE = rectificativa. Formato `FA-2026-000101`. |
| **Rectificativa (RE)** | Factura espejo exacta de la original, que la anula. Las facturas no se borran nunca. |
| **Cabecera / líneas** | La cabecera guarda los totales de la factura; las líneas, cada concepto. Deberían coincidir y hoy no siempre lo hacen. |
| **Recargo de equivalencia** | Recargo adicional sobre el IVA para ciertos clientes, según una tabla fija (21 → 5,2 %, 10 → 1,4 %, 4 → 0,5 %). |
| **Descuento por volumen** | 2 % si la base supera 1.000 € y 5 % si supera 5.000 €. Se reparte en el precio unitario de las líneas. |
| **Modelo 303** | Declaración trimestral de IVA que presenta la gestoría. |
| **CSV de la gestoría** | Fichero que se exporta para la contabilidad de la gestoría. Su formato y su clave son «no tocar». |
| **Golden master** | Conjunto fijo de casos con el resultado exacto que da hoy el programa. Sirve para detectar cualquier cambio. |
| **Caracterización** | Prueba que fija lo que el sistema hace hoy, sea correcto o no. |
| **Spec de ingeniería inversa** | Especificación de lo que el sistema ya hace, para usarla como contrato en la modernización. |
| **PENDIENTE** | Anomalía que solo el negocio puede clasificar. Hay 30. |
| **Testigo NEGOCIO** | Persona identificada, con nombre y fecha, que confirma un hecho o una decisión. Es el único testimonio válido. |

---

## 4. Estado de la red de seguridad

### 4.1 Qué está congelado

Resultado de `npm test` el 2026-11-12: **273 de 273 correctas**.

| Zona | Cobertura | Dónde |
|---|---|---|
| Cálculo de importes, IVA, recargo, descuento y prorrateo | Funciones puras con casos límite, incluidas las anomalías | `calculo.test.js` |
| Utilidades: redondeo, formato de importes, fechas, NIF | Incluye los casos que dan `-0`, `NaN` o «Infinity» | `util.test.js` |
| Numeración y formato del número | Sobre BD temporal con reloj fijo | `numeracion.test.js` |
| **Remesa mensual de extremo a extremo** | El script real, ejecutado como proceso, con 42 pruebas: fronteras de alta y baja, meses de 28, 29, 30 y 31 días, descuento, anomalías y argumentos incorrectos | `remesa.test.js` |
| **Rutas HTTP** | Los routers reales de facturas, informes, contratos, clientes y artículos por HTTP sobre BD temporal, y el panel de inicio de `server.js` real: alta, cobro, rectificación, detalle, informe de IVA, CSV, bajas y altas | `rutas.test.js` |
| Esquema y datos de ejemplo de la BD, `config.js`, correo inactivo | Propiedades que el reconocimiento marca como sensibles | `semilla.test.js` |
| Flujo de emisión (alta manual y remesa) con 12 casos | Salida completa comparada campo a campo | `golden-master.test.js` |

El conjunto incluye 95 pruebas «CONGELA comportamiento actual» que cubren 65 anomalías del registro y las contradicciones 01 a 09.

### 4.2 Qué no está congelado

1. **El golden master solo cubre la emisión.** Faltan cobro, rectificación, informes y CSV: las specs 005, 006, 008, 009 y 010 se apoyan
   solo en las pruebas unitarias y de rutas (`propuesta-particion-specs.md`, §6). Ahí no hay un resultado completo de referencia como en la emisión.
2. **La base de datos real nunca se abre.** Las pruebas usan datos de ejemplo. Cualquier dato histórico (NIF reales, facturas editadas a mano, contadores de años anteriores) queda sin proteger (A-18, A-32).
3. **Carreras y fallos a medias.** Se prueba que el número no es único y que las operaciones no usan transacción, pero no se ha reproducido una carrera real entre dos grabaciones simultáneas ni una caída a mitad de operación (A-11, A-13, A-14, A-50; `registro-riesgos.md` §5).
4. **Lo que no es lógica de negocio.** El JavaScript del navegador (`public/js/factura.js`, el autorrelleno), el aspecto de las vistas y el envío real de correo.
5. **Anomalías sin prueba alguna:** A-18, A-50, A-51, A-55, A-56, A-59, A-60 y A-61 (`propuesta-particion-specs.md`, §6).
6. **El entorno de producción.** La suite se ejecuta con Node 22 y zona horaria de Madrid fijadas. La versión de Node de la oficina no consta (A-57).

### 4.3 Primera tarea de la siguiente fase

Antes de modernizar ningún módulo, cerrar los huecos de protección:

1. **Obtener una copia de solo lectura de la base real** y repetir el análisis de datos (decisión 1 del apartado 1).
2. **Ampliar el golden master** con cobro, rectificación, informe de IVA y CSV, que son los caminos que respaldan las specs 005 y 008.
3. **Ejercitar la remesa y las rutas HTTP contra una copia de la base real**, en un entorno aislado, con casos de contratos y clientes reales. Las 42 pruebas de remesa y las 65 de rutas actuales usan los datos de ejemplo.
4. **Probar con concurrencia real** la numeración y las operaciones sin transacción antes de corregirlas.
5. **Mantener la regla de oro:** el master y las pruebas solo se tocan con una decisión de negocio escrita, con nombre y fecha.
