# Registro de anomalías de GesFact (consolidación del reconocimiento)

Consolidación de todos los hallazgos de la fase «documentar y proteger». Documento de
**solo lectura** (Constitución, Principios I, III y IV): no se ha modificado código,
datos ni dependencias. Ninguna clasificación de este registro autoriza a cambiar nada;
solo el negocio puede autorizar un cambio de comportamiento, y por escrito
(Constitución, «Governance»).

Fecha de consolidación: 2026-11-11.

## 0. Fuentes, testigos y reglas de clasificación

### 0.1 Fuentes consolidadas

| Prefijo | Fuente | Qué se ha tomado |
|---|---|---|
| `RN-xx`, `RN·D-xx`, `RN·H-xx`, `Q-xx` | `reglas-de-negocio.md` | Reglas DUDOSAS y ACCIDENTALES; INTENCIONALES con incidente o «no tocar»; discrepancias D-01..D-15; hallazgos de datos H-01..H-06; preguntas Q-01..Q-20 |
| `C-01`..`C-10`, `QC-xx` | `contradiccion-*.md`, `contradicciones-indice.md` | Las 10 contradicciones y las preguntas QC-01..QC-26 |
| `R-xx`, `R·Dx`, `R·Sx` | `registro-riesgos.md` | Riesgos R1..R35, discrepancias D1..D11 y suposiciones S1..S8 |
| `MH-xx` | `memoria-historica.md` | Entradas H-01..H-30 (incidentes, decisiones, «no tocar», abandonos, discrepancias) |
| `AD-xx` | Este documento, §0.4 | Arqueología de datos: consultas de solo lectura ejecutadas para este registro |
| `ENT-Px` | `entrevista-negocio-simulada.md` (añadida el 2026-11-11, §6) | Respuestas P1, P1-bis y P1-ter del cliente simulado (sin persona identificada) y propuestas del consultor P2-P21 (no son testimonio) |

La matriz de trazabilidad (§3) comprueba que **ninguna** entrada de esas fuentes queda
sin asignar.

### 0.2 Fuentes que faltan

- **`entrevista-negocio.md` no existe** en el repositorio (búsqueda por nombre y por
  contenido en todo el árbol). No hay ninguna entrevista con el negocio registrada.
  - *Añadido el 2026-11-11, tras la consolidación*: existe ya
    `entrevista-negocio-simulada.md`, una entrevista **simulada**. Aporta 3 respuestas sin
    persona identificada y 20 propuestas del consultor. Ninguna vale como testigo NEGOCIO;
    su propagación está en §6. `entrevista-negocio.md` (la real) sigue sin existir.
- **No existe un documento de arqueología de datos.** Las consultas a la BD estaban
  dispersas en los demás documentos; para este registro se han repetido, ampliado y
  numerado (§0.4).
- **Único testimonio de negocio disponible**: «`datos/gesfact.db` es la BD de
  producción» (usuario, 2026-11-11, recogido en `registro-riesgos.md` S4). Le falta el
  nombre de la persona, que exige el Principio II.

### 0.3 Testigos y criterio de clasificación

**Testigos** (los tres que admite la Constitución, Principio II):

- **CÓDIGO**: fichero y líneas del estado actual del repositorio. Los comentarios que
  atribuyen una decisión a alguien («Puri dixit», «acordado con Paco en 2018») se
  cuentan aquí, **no** como NEGOCIO. Motivo: son testimonio de oídas escrito por el
  programador, no se puede repreguntar a quien lo dijo, y las fechas de los comentarios
  no son fiables (`LEEME.txt` fechado en 2019 cuenta hechos de 2022, MH-30).
- **DATOS**: consulta de solo lectura sobre `datos/gesfact.db` (§0.4). Cuenta **a favor**
  de una regla solo si hay un documento emitido que ejercita el caso frontera de la regla
  (el caso en que otra regla daría otro resultado) y que fue aceptado (cobrado, no
  rectificado por ese motivo). Si la BD no contiene ese caso, el veredicto de los datos
  es «no discrimina».
- **NEGOCIO**: declaración de una persona identificada, con nombre y fecha.

**Clasificaciones**:

| Clasificación | Cuándo se cierra |
|---|---|
| INTENCIONAL | Al menos **dos** de los tres testigos a favor de que el comportamiento es deliberado. Sin NEGOCIO, esto exige CÓDIGO **y** DATOS con caso frontera. |
| ACCIDENTAL | Nadie lo decidió (CÓDIGO) y no produce un resultado económico o legal incorrecto en ningún dato (DATOS). |
| BUG HISTÓRICO CON DEPENDIENTES | Resultado incorrecto que ya está en documentos emitidos o del que depende una persona o un proceso. |
| BUG A SECAS | Resultado incorrecto por un criterio que no depende de preferencias del negocio (caída, dato corrupto, error ignorado, número duplicado, carrera) y sin dependientes identificados. |
| PENDIENTE | La clasificación depende de un testigo que falta (casi siempre NEGOCIO, a veces DATOS de un caso que la BD no contiene). Lleva la pregunta exacta que la desbloquea. |

Este criterio es una interpretación de la regla del encargo: las clasificaciones no
intencionales se cierran sin NEGOCIO solo cuando el defecto es objetivo. Si se quiere
aplicar la regla al pie de la letra («sin NEGOCIO, todo PENDIENTE»), pasan a PENDIENTE las
entradas BUG A SECAS y ACCIDENTAL, y la agenda de §5 crece en consecuencia.

**Tratamiento provisional de lo PENDIENTE**: mientras no se cierre, todo comportamiento
se mantiene tal cual (Principio I). Si la Constitución lo protege de forma expresa
(redondeo línea a línea, numeración, no borrar, prorrateo de 30 días, descuento línea a
línea), el tratamiento provisional es «especificar tal cual» por mandato, aunque la
clasificación siga abierta.

**Retroactividad**: las facturas emitidas no se borran ni se modifican (A-20). «Corrección
retroactiva» significa aquí emitir rectificativas sobre documentos ya emitidos; solo es
posible con decisión expresa del negocio y de la gestoría.

**Responsables** (roles; los nombres son los que aparecen en comentarios y están sin
confirmar):

| Rol | Persona según los comentarios | Decide sobre |
|---|---|---|
| Gerencia de Suministros Hidalgo, S.L. | Por identificar | Política comercial, alcance, riesgos aceptados |
| Administración | Marga (MH-05, MH-15, MH-18, MH-25) | Operativa: remesa, bajas, envío de facturas, NIF, copias |
| Gestoría | Puri en 2018-2019 (MH-08, MH-11, MH-12, MH-21); contacto actual por confirmar | Criterios fiscales, modelo 303, CSV, rectificativas |
| Responsable del correo | Manoli, rol por confirmar (MH-18) | Envío de facturas por correo |
| Equipo de modernización | — | Solo decisiones técnicas sin efecto observable |

### 0.4 Arqueología de datos (consultas ejecutadas para este registro)

Todas con `sqlite3 -readonly datos/gesfact.db` o con funciones puras de `services/calculo.js`
y `lib/util.js` en memoria sobre una exportación JSON de solo lectura (borrada después).
No se ha escrito en la BD.

| ID | Consulta | Resultado |
|---|---|---|
| AD-01 | `SELECT f.numero, f.base, SUM(l.base), f.iva, SUM(l.cuota_iva), f.recargo, SUM(l.cuota_recargo), f.total, COUNT(l.id) FROM facturas f LEFT JOIN lineas l … GROUP BY f.id` | 6 de 9 cabeceras no suman sus líneas: `FA-2026-000101` IVA 27,97 / 24,27; `-105` base 2.287,75 / 2.335,50 e IVA 468,63 / 339,02; `-106`, `RE-2026-000001`, `-107` IVA ±20,62 / ±20,06; `-108` IVA 26,19 / 24,26. Cuadran `-102`, `-103`, `-104` |
| AD-02 | Sumas por periodo: líneas por tipo de IVA y cabeceras, T1 2026 (`fecha BETWEEN '2026-01-01' AND '2026-03-31'`) y año 2026 (`fecha LIKE '2026-%'`) | T1 líneas: base 3.736,60, IVA 603,66, recargo 6,77. T1 cabeceras: base 3.688,85, IVA 736,97, recargo 6,77. Año: cabeceras IVA 783,78; líneas 647,98 (**+135,80 €**) |
| AD-03 | Recalcular las 28 líneas con `calculo.calcularLinea(cantidad, precio, tipo_iva, recargo del cliente)` | 7 de 28 no se reproducen: «Portes» de `-102` (1,90 / 1,92), `-103` (5,50 / 5,52), `-105` (17,20 / 17,22); «Café 0,97 × 11,95» de `-106`, `-107` y la RE (11,61 / 11,59); «Vaso caña 0,66 × 21,60» de `-108` (14,15 / 14,26) |
| AD-04 | Para cada factura, IVA sumando líneas redondeadas frente a IVA redondeando la base total por tipo; ídem recargo; y `redondear2` frente a redondeo decimal exacto «medio hacia arriba» en las 28 líneas | **0 de 9** facturas dan resultado distinto; 0 de 2 en recargo; 0 de 28 líneas con medio céntimo. **Ningún dato discrimina** entre redondear por línea o por total |
| AD-05 | `SELECT numero, COUNT(*) … GROUP BY numero HAVING COUNT(*) > 1`; `SELECT * FROM contadores`; mínimo y máximo por serie | 0 números duplicados. Contadores `FA/2026 = 108`, `RE/2026 = 1`. FA: 8 facturas, 101 a 108 (sin huecos entre ellas; no existen la 1 a la 100). RE: 1 |
| AD-06 | `SELECT substr(numero,4,4), substr(fecha,1,4), COUNT(*) FROM facturas GROUP BY 1,2` | Un único grupo `2026 | 2026 | 9`. Ninguna factura de diciembre |
| AD-07 | `SELECT id, length(nif sin espacios ni guiones), recargo_equivalencia, dias_pago, activo FROM clientes`; nombres con `;` o salto de línea | 6 clientes, todos `activo = 1`; recargo en clientes 2 y 4; `dias_pago` NULL en 4 y 60 en 2 (ninguno 0); 6 NIF de 9 caracteres (uno en minúscula); 0 nombres con `;` |
| AD-08 | Comprobación del carácter de control de los 6 NIF (algoritmo de DNI y de CIF; no se imprimen los valores) | **5 de 6 no superan el control** (clientes 2 a 6) |
| AD-09 | `SELECT * FROM contratos`; `MAX(cuota)` | 4 contratos; cuota máxima 145,00 €; ninguno > 1.000 €. Contrato 3 de baja el 2025-09-15; contrato 4 de alta el 2026-02-15 |
| AD-10 | `SELECT estado, serie, COUNT(*), SUM(total) … GROUP BY estado, serie` | cobrada FA 4 (1.676,21); emitida FA 3 (3.032,85); emitida RE 1 (−122,23); rectificada FA 1 (122,23) |
| AD-11 | `SELECT tipo_iva, COUNT(*) FROM lineas GROUP BY tipo_iva` | 21 % ×18, 10 % ×7, 4 % ×3. Ningún otro tipo |
| AD-12 | Integridad: líneas huérfanas, líneas FA negativas, facturas sin líneas, fechas fuera de `AAAA-MM-DD`, artículos de baja, `PRAGMA foreign_keys` | 0, 0, 0, 0, 0; `foreign_keys = 0` |
| AD-13 | Vencimientos recalculados con `util.sumarDias(fecha, dias_pago \|\| 30)` | 8 de 8 coinciden con `TZ=Europe/Madrid`; **0 de 8** con `TZ=America/Argentina/Buenos_Aires` (UTC−3) |
| AD-14 | Líneas y observaciones de las facturas «Remesa…» y de la RE, comparadas con el texto que genera el código actual | La BD dice «Remesa mayo», «(mayo)»; el código genera «Remesa mayo 2026», «(mayo 2026)» (`scripts/remesa_mensual.js:53,62,80-84`). La BD dice «Descuento volumen 2% aplicado»; el código antepone un espacio (`routes/facturas.js:76`). La BD dice «Rectifica FA-2026-000106 (cuota abril duplicada)»; el código genera «Rectifica FA-2026-000106. …» (`routes/facturas.js:143`). **Ningún texto de la BD coincide con el formato del código actual.** Las facturas de remesa tienen 2-5 líneas; la remesa graba 1 |
| AD-15 | Facturas por cliente frente a contratos vigentes | Cliente 1 (contrato 1, vigente desde 2024): solo enero y mayo de 2026, faltan febrero a abril. Cliente 6 (contrato 4, alta 15-feb-2026): no hay febrero ni marzo. `FA-2026-000107` tiene las mismas líneas e importes que `FA-2026-000106` (comparación de líneas: idénticas) |
| AD-16 | `stat datos/gesfact.db`; `git log -- db.js` | El fichero nace el **2026-10-09 15:40:50** y se modifica por última vez 0,11 s después; `db.js` entra en el repositorio en el commit `84a4eda` del 2026-10-09 15:28:21. `mapa-sistema.md` P1: el contenido coincide exactamente con la semilla de `db.js:93-181` |

**Consecuencia para todo el registro**: AD-05, AD-15 y AD-16 indican que la BD analizada es
la semilla de `db.js` cargada en este equipo, con 9 facturas de enero a mayo de 2026, y no
un histórico de producción desde 2018. El negocio afirmó lo contrario (S4). Este registro
**cuenta los DATOS como testigo** porque así lo confirmó el negocio, pero el conflicto queda
abierto en A-18. Si A-18 se resuelve en contra, las cinco entradas INTENCIONAL (A-19, A-20,
A-21, A-24, A-37) vuelven a PENDIENTE, porque se cerraron con CÓDIGO + DATOS.

### 0.5 Orden por impacto económico

Las entradas están ordenadas por nivel y, dentro de cada nivel, primero lo que ya se ve en
los datos. Las cifras son estimaciones propias sobre los datos y el código, no del negocio.

| Nivel | Criterio | Entradas |
|---|---|---|
| 1. Alto | Afecta al IVA declarado, a cobros de ≥ 100 € por caso o a todas las facturas | A-01 a A-09 |
| 2. Fiscal y legal | Numeración, integridad de documentos emitidos, NIF (riesgo de sanción o requerimiento) | A-10 a A-22 |
| 3. Medio | Entre 1 y 100 € por caso | A-23 a A-31 |
| 4. Bajo | Menos de 1 € por caso, o solo presentación | A-32 a A-45 |
| 5. Sin impacto económico directo | Seguridad, operación, deuda | A-46 a A-60 |

---

## 1. Registro

### Nivel 1 · Impacto económico alto

#### A-01 · Los importes de cabecera y de líneas no coinciden, y cada salida lee una fuente distinta
- **Descripción**: en 6 de 9 facturas la cabecera no es la suma de sus líneas, y el informe
  de IVA (líneas), el CSV de la gestoría (cabeceras) y el panel (cabeceras) dan cifras
  distintas para el mismo periodo.
- **Impacto económico**: IVA de 2026 de 783,78 € en el CSV frente a 647,98 € en el informe
  (**135,80 €**); T1: 133,31 €. `FA-2026-000105`: 81,86 € de total. Panel: 84,35 € más que
  la suma de líneas.
- **Evidencia**:
  - CÓDIGO: `routes/informes.js:21-25` (líneas) frente a `:36-45` (cabeceras);
    `server.js:24` (`SUM(total)`); `views/factura_detalle.ejs:24-40` (imprime líneas y pie
    de cabecera). Por construcción, el código genera cabecera = suma de líneas
    (`services/calculo.js:71-86`); `db.js:122` llama a esas facturas «resumen, tal cual
    quedaron grabadas».
  - DATOS: AD-01, AD-02. En `FA-2026-000101` la cabecera (27,97) coincide con aplicar 21 %
    a toda la base, aunque tiene líneas al 10 % (C-06 §3.1).
  - NEGOCIO: ninguno válido. Testimonio **provisional, sin persona identificada** (no cuenta
    como testigo, Principio II):
    - `entrevista-negocio-simulada.md`, P1, «Gestoría», persona sin identificar, 2026-11-11:
      en el 303 del T1 de 2026 se declaró **736,97 €** (CSV, cabeceras).
    - Ídem, P1-bis, «Administración», persona sin identificar, 2026-11-11: el cliente de
      `FA-2026-000101` pagó **157,47 €** (suma de líneas).
    - Ídem, P1-ter, «Gerencia», persona sin identificar, 2026-11-11: **rectificar las 6
      facturas** descuadradas.
- **Historial de clasificación**:
  - 2026-11-11 (consolidación): PENDIENTE.
  - 2026-11-11 (propagación del acta simulada): **sigue PENDIENTE**, sin cambio. Si se
    identifica a quien respondió P1, P1-bis y P1-ter (acta, PD-08), la clasificación
    propuesta es **BUG HISTÓRICO CON DEPENDIENTES**. Motivo: en `FA-2026-000101` lo cobrado
    (líneas) y lo declarado (cabecera) no coinciden, así que la cabecera no es una corrección
    deliberada de lo cobrado; el error está en documentos emitidos y en un 303 presentado, y
    gerencia lo trata como error. Testigos que lo sostendrían: CÓDIGO + DATOS + NEGOCIO.
    Las otras 5 facturas siguen sin dato de cobro (PD-02).
- **Clasificación: PENDIENTE.** Puede ser un bug histórico con dependientes (las 6 facturas
  están emitidas y `FA-2026-000101` está cobrada) o una corrección manual deliberada de las
  cabeceras;
  solo el negocio y la gestoría pueden decirlo.
  - Pregunta que lo desbloquea: «Para el T1 de 2026, ¿qué IVA presentó la gestoría en el
    modelo 303: 603,66 € (suma de líneas, pantalla de IVA) o 736,97 € (cabeceras, CSV)? En
    `FA-2026-000101`, ¿el cliente pagó 161,17 € (cabecera) o 157,47 € (líneas)? ¿Quién
    modificó esas cabeceras o líneas y por qué?»
- **Dependientes**: gestoría (modelo 303 y contabilidad Contaplus); clientes de las 6
  facturas (documentos impresos con pie ≠ suma de líneas); administración (panel).
- **Tratamiento**: especificar tal cual las dos fuentes (informe por líneas y CSV por
  cabeceras: RN-46 y RN-49); documentar sin especificar los 6 documentos discrepantes.
  Corrección en modernización solo para facturas nuevas (impedir que cabecera y líneas
  diverjan), **no retroactiva**: las 6 facturas solo se podrían corregir con rectificativa
  si lo deciden gestoría y gerencia.
- **Decisión pendiente**: cuál es la fuente de verdad del IVA declarado y si se
  rectifican las 6 facturas. Responsables: **Gestoría** y **Gerencia**.
  - Tras el acta (provisional): fuente declarada = CSV (P1); decisión de rectificar las 6
    (P1-ter), pendiente de firma (PD-01), de importe de cada sustituta (PD-02), del
    tratamiento de `RE-2026-000001` y `FA-2026-000106` (PD-03) y de la valoración de una
    complementaria (PD-04). Consecuencia fiscal en A-61.
- **Fuentes**: R-1, R·D7, R·S4, C-06, RN-46, RN-50, RN·D-10, RN·H-01, RN·H-04, MH-27, Q-17,
  Q-18, QC-15, QC-16, QC-17, ENT-P1, ENT-P1-bis, ENT-P1-ter.

#### A-02 · Redondeo línea a línea con `Math.round(x*100)/100` (regla protegida)
- **Descripción**: base, IVA y recargo se redondean en cada línea con `redondear2` en coma
  flotante y la factura suma esos valores ya redondeados; nunca se redondea sobre el total.
- **Impacto económico**: afecta a todas las facturas (diferencias de 1 céntimo por factura;
  ejemplo de RN-02: 0,09 € frente a 0,08 €). Precedente: en mayo de 2019 un cambio de esta
  regla hizo que la gestoría devolviera un trimestre entero.
- **Evidencia**:
  - CÓDIGO: `services/calculo.js:1-7` (aviso de Julián, mayo 2019), `:25-34`, `:81-86`;
    `lib/util.js:2-7` («de toda la vida», «cuidado al tocar»). Efecto de coma flotante:
    `redondear2(1.005) = 1`, `0,01 × 14,50 → 0,14` (R-13, RN-51).
  - DATOS: AD-04. **No discrimina**: en ninguna de las 9 facturas da distinto redondear por
    línea o por total, ni hay ningún medio céntimo.
  - NEGOCIO: ninguno (el testimonio de Puri y de Julián es un comentario, cuenta como CÓDIGO).
- **Clasificación: PENDIENTE** (1 testigo de 3). La Constitución la protege (Principio I),
  pero la protección no sustituye a los testigos.
  - Pregunta que lo desbloquea: «Gestoría: ¿confirmáis que el Contaplus exige el IVA y el
    recargo redondeados línea a línea, incluido el efecto de coma flotante en los medios
    céntimos (1,005 → 1,00)? ¿Conserváis la lista de diferencias del trimestre devuelto en
    2019?» Alternativa por DATOS: encontrar en la BD completa (A-18) una factura cobrada en
    la que los dos métodos den resultado distinto.
- **Dependientes**: gestoría (Contaplus); todas las facturas emitidas.
- **Tratamiento**: **especificar tal cual**, incluido el comportamiento en coma flotante
  (mandato del Principio I). No se corrige. Cualquier reimplementación debe reproducir
  `redondear2` bit a bit; tests de caracterización con los ejemplos de RN-51.
- **Decisión pendiente**: ninguna sobre el cambio; solo la confirmación. Responsable:
  **Gestoría**.
- **Fuentes**: RN-01, RN-02, RN-05, RN-51, R-13, MH-03, MH-12.

#### A-03 · La remesa mensual no impide facturar dos veces ni se puede reanudar
- **Descripción**: la remesa no comprueba si un contrato ya se facturó ese mes y, si falla a
  mitad, termina con `process.exit(1)` sin deshacer ni registrar lo ya emitido.
- **Impacto económico**: una segunda ejecución de una remesa con los contratos vigentes 1,
  2 y 4 duplicaría **393,25 €** (108,90 + 175,45 + 108,90). Caso declarado en los datos:
  122,23 € (`FA-2026-000106`).
- **Evidencia**:
  - CÓDIGO: `scripts/remesa_mensual.js:26-29` (solo lee `contratos`), `:58`, `:64`, `:70`
    (`exit(1)`); no hay ningún control por contrato y mes.
  - DATOS: AD-01, AD-15. `FA-2026-000106` («Remesa abril. ERROR cuota duplicada») →
    `RE-2026-000001` → `FA-2026-000107`. Pero `FA-2026-000107` es idéntica a la 106 en
    líneas e importes y no hay en la BD otra factura de abril del cliente 6: **los datos no
    muestran la duplicación** que dice la observación.
  - NEGOCIO: ninguno.
- **Clasificación: BUG A SECAS.** Cobrar dos veces la misma cuota es incorrecto con
  cualquier criterio de negocio. La causa real de `FA-2026-000106` sigue sin aclarar y no
  cambia la clasificación.
- **Dependientes**: administración (Marga lanza la remesa el día 1, MH-15); clientes con
  contrato. Nadie depende de poder duplicar.
- **Tratamiento**: corregir en modernización: impedir una segunda factura del mismo
  contrato y mes, y dejar constancia de qué contratos se facturaron. Precauciones: definir
  antes cómo se reanuda una remesa interrumpida y cómo se convive con la factura manual de
  la baja (A-04). **No retroactiva**: la 106/RE/107 ya está corregida con rectificativa.
- **Decisión pendiente**: «¿Qué pasó exactamente con `FA-2026-000106`, si `FA-2026-000107`
  repite las mismas líneas? ¿Se ha lanzado alguna vez la remesa dos veces o ha fallado a
  mitad?» Responsable: **Administración**.
- **Fuentes**: R-7, R·S1, RN-24, RN·H-05, C-10 (camino B), MH-15, MH-28, Q-08, QC-24.

#### A-04 · El mes de la baja de un contrato puede facturarse dos veces
- **Descripción**: la pantalla de baja calcula un prorrateo que administración factura a
  mano, y el mismo contrato sigue entrando en la remesa de ese mes.
- **Impacto económico**: el importe del último mes completo dos veces; p. ej. contrato 2
  (145 €) con baja el 15 de marzo: 87,73 € a mano + 84,89 € por remesa (con IVA).
- **Evidencia**:
  - CÓDIGO: `routes/contratos.js:28-30` (comentario «administración emite después a mano la
    factura del prorrateo»), `:37-40` (el importe solo viaja en la URL);
    `scripts/remesa_mensual.js:28` (`fecha_baja >= primerDia` sigue entrando).
  - DATOS: AD-09, AD-15. El único contrato de baja (contrato 3, sept. 2025) no tiene
    facturas en la BD. **No discrimina.**
  - NEGOCIO: ninguno.
- **Clasificación: PENDIENTE.**
  - Pregunta que lo desbloquea: «Cuando se da de baja un contrato a mitad de mes, ¿quién
    factura ese mes: la remesa, la factura manual o las dos? ¿Con qué importe? ¿Se ha
    cobrado alguna vez dos veces?»
- **Dependientes**: administración (proceso manual de la baja); clientes con baja.
- **Tratamiento provisional**: especificar tal cual. Si se confirma la doble facturación,
  corregir en modernización eligiendo una única vía; no retroactiva salvo que el negocio
  decida rectificar casos concretos.
- **Decisión pendiente**: vía única para facturar el mes de la baja. Responsables:
  **Administración** y **Gerencia**.
- **Fuentes**: R-5 (parte), R·S2, R·D11, RN-18, RN-26 (parte), C-01 §4, MH-24, Q-09, QC-02.

#### A-05 · Se puede facturar a clientes dados de baja
- **Descripción**: la baja de cliente (`activo = 0`) solo lo oculta del desplegable; el alta
  manual y la remesa le siguen facturando, y sus contratos siguen vigentes.
- **Impacto económico**: cliente 1 dado de baja con su contrato vigente: **108,90 € al mes**
  por remesa, sin aviso.
- **Evidencia**:
  - CÓDIGO: `routes/facturas.js:31,33` (filtra en pantalla) frente a `:46-47` (no mira
    `activo`); `scripts/remesa_mensual.js:26-29`; `routes/clientes.js:32-37` (la baja no
    cierra contratos).
  - DATOS: AD-07. 0 clientes de baja: **no discrimina**.
  - NEGOCIO: ninguno.
- **Clasificación: PENDIENTE.** Puede ser deseado (cobrar un resto, máquina aún instalada).
  - Pregunta que lo desbloquea: «Cuando un cliente se da de baja, ¿sus contratos deben dejar
    de facturarse? ¿Se le debe poder emitir una factura manual después (p. ej. para cobrar
    un resto)?»
- **Dependientes**: nadie identificado (no hay bajas en los datos).
- **Tratamiento provisional**: especificar tal cual. Si el negocio lo pide, corregir en
  modernización solo hacia delante.
- **Decisión pendiente**: Responsable: **Gerencia**.
- **Fuentes**: R-12, C-08, RN-27 (parte), Q-10, QC-20, QC-21.

#### A-06 · Un importe tecleado con separador de miles se lee 1.000 veces menor
- **Descripción**: la lectura de cantidades, precios y cuotas solo cambia la primera coma
  por un punto, de modo que `1.210,00` (el formato que muestra el propio sistema) se lee como
  1,21.
- **Impacto económico**: el importe de la línea cae a una milésima (p. ej. 1.210,00 € →
  1,21 €).
- **Evidencia**:
  - CÓDIGO: `routes/facturas.js:59-60`; `routes/contratos.js:19`; `routes/articulos.js:19`
    (`parseFloat(('' + x).replace(',', '.'))`); formato de salida en `lib/util.js:51-58`.
  - DATOS: AD-09; precio máximo de línea 145,00 €: ningún importe ≥ 1.000 tecleado, **sin
    documentos afectados**.
  - NEGOCIO: ninguno.
- **Clasificación: BUG A SECAS.**
- **Dependientes**: el autorrelleno escribe el precio con punto decimal (`28.9`,
  `public/js/factura.js:9`, `views/factura_nueva.ejs:23`): depende de que el punto se lea
  como decimal.
- **Tratamiento**: corregir en modernización. Precaución: seguir aceptando `28.9` (punto
  decimal del autorrelleno) y `12,5`; decidir qué hacer con valores ambiguos como `1.234`.
  No retroactiva (no hay casos).
- **Decisión pendiente**: «¿Se teclean alguna vez importes con punto de millares?» (solo
  afecta a la prioridad). Responsable: **Administración**.
- **Fuentes**: RN-29, C-03 §1.3, Q-11, QC-08.

#### A-07 · Una base de 5.000,00 € exactos lleva el 2 % y no el 5 %
- **Descripción**: el tramo del 5 % exige base estrictamente mayor que 5.000 €, mientras el
  comentario dice «a partir de 5.000».
- **Impacto económico**: 150,00 € de base (181,50 € con IVA al 21 %) en una factura de
  5.000,00 € exactos.
- **Evidencia**:
  - CÓDIGO: `services/calculo.js:37` («a partir de») frente a `:40` (`>`).
  - DATOS: AD-01; ninguna factura ≥ 5.000 €: **no discrimina**.
  - NEGOCIO: ninguno. El caso de 1.000 € (A-24) no dice nada del de 5.000 €.
- **Clasificación: PENDIENTE.**
  - Pregunta que lo desbloquea: «Una factura con base de 5.000,00 € exactos, ¿lleva el 2 % o
    el 5 %?»
- **Dependientes**: nadie identificado.
- **Tratamiento provisional**: especificar tal cual (el descuento lo protege el
  Principio I). Si se decide cambiar, solo hacia delante.
- **Decisión pendiente**: Responsable: **Gerencia** (política comercial), con
  conocimiento de la **Gestoría**.
- **Fuentes**: RN-07 (parte), RN·D-01 (parte), Q-02.

#### A-08 · Por petición directa se puede rectificar una factura cobrada y cobrar una rectificativa
- **Descripción**: la pantalla solo ofrece cobrar y rectificar facturas FA emitidas, pero los
  endpoints aceptan rectificar una cobrada y marcar como cobrada una RE; el cobro no registra
  fecha ni importe y redirige con éxito aunque no cambie nada.
- **Impacto económico**: el importe íntegro de la factura en un estado incoherente (p. ej.
  `FA-2026-000101`, cobrada, 161,17 € → RE de −161,17 € sin rastro de la devolución).
  Rectificables: 3 por pantalla frente a 7 por endpoint.
- **Evidencia**:
  - CÓDIGO: `views/factura_detalle.ejs:47`; `routes/facturas.js:117-122` (cobro),
    `:132-133` y `:154` (rectificación sin condición sobre `cobrada`).
  - DATOS: AD-10. La única factura rectificada (`FA-2026-000106`) no permite saber si estaba
    cobrada (no se guarda el historial de estados). **No discrimina.**
  - NEGOCIO: ninguno.
- **Clasificación: PENDIENTE.** Rectificar una cobrada puede ser necesario (devolución).
  - Pregunta que lo desbloquea: «¿Se puede rectificar una factura ya cobrada? Si sí, ¿cómo
    se devuelve el dinero y dónde queda constancia? ¿Una rectificativa se cobra o se paga
    alguna vez, y en qué estado debe quedar?»
- **Dependientes**: nadie identificado (la oficina usa la pantalla).
- **Tratamiento provisional**: especificar tal cual las dos reglas (pantalla y endpoint).
  Corrección en modernización según la respuesta, sin efecto sobre facturas emitidas.
- **Decisión pendiente**: Responsables: **Gestoría** (procedimiento fiscal) y
  **Administración**.
- **Fuentes**: R-25, C-09, RN-42, RN-44, Q-16, QC-22, QC-23.

#### A-09 · Se aceptan cantidades y precios negativos, y facturas FA con total negativo
- **Descripción**: el alta manual no valida el signo, así que se puede emitir en serie FA una
  factura negativa que, además, nunca alcanza el descuento.
- **Impacto económico**: el total entero con signo cambiado (1 × −2.000 € al 21 % → −2.420,00
  €), que resta IVA en el informe y en el CSV.
- **Evidencia**:
  - CÓDIGO: `routes/facturas.js:55-63`; `services/calculo.js:26-34`, `:50-88`.
  - DATOS: AD-12. 0 líneas negativas en serie FA: **no discrimina**.
  - NEGOCIO: ninguno.
- **Clasificación: PENDIENTE.** Las líneas negativas podrían ser la forma en que la oficina
  hace abonos parciales, que el sistema no ofrece (MH-21).
  - Pregunta que lo desbloquea: «Cuando un cliente devuelve parte de la mercancía, ¿cómo se
    documenta? ¿Se ha emitido alguna factura FA con líneas o total negativos?»
- **Dependientes**: posiblemente administración (abonos parciales); sin confirmar.
- **Tratamiento provisional**: especificar tal cual. Corrección en modernización solo tras
  definir cómo se hacen los abonos parciales. No retroactiva.
- **Decisión pendiente**: Responsables: **Gestoría** y **Administración**.
- **Fuentes**: R-11 (parte), RN-12 (parte), MH-21 (abono parcial).

### Nivel 2 · Fiscal y legal

#### A-10 · El año del número de factura sale del reloj, no de la fecha de la factura
- **Descripción**: el contador y el año del número se toman del reloj al grabar, mientras la
  fecha de la factura, el informe de IVA y el CSV usan la fecha de la factura.
- **Impacto económico**: sin efecto en importes; riesgo legal. Cada remesa de diciembre
  lanzada en enero generaría 3 facturas fechadas en 2026 y numeradas en 2027; también
  cualquier alta manual con fecha de otro año.
- **Evidencia**:
  - CÓDIGO: `lib/numeracion.js:15`; `scripts/remesa_mensual.js:5-7`, `:59`;
    `routes/facturas.js:44`; `routes/informes.js:17-19`, `:38`.
  - DATOS: AD-06. 9 de 9 coinciden; ninguna de diciembre: **no discrimina**.
  - NEGOCIO: ninguno.
- **Clasificación: PENDIENTE.**
  - Pregunta que lo desbloquea: «La numeración "por serie y año" exigida tras la inspección
    de 2020, ¿se refiere al año de expedición o al de la fecha impresa? ¿Se ha lanzado alguna
    remesa de diciembre en enero, y qué número y fecha llevaron esas facturas?»
- **Dependientes**: gestoría (libros de facturas emitidas por año); facturas de diciembre
  de 2021-2025, si existen.
- **Tratamiento provisional**: especificar tal cual. Si se corrige, solo hacia delante;
  **nunca retroactiva** (renumerar facturas emitidas es imposible).
- **Decisión pendiente**: Responsable: **Gestoría**.
- **Fuentes**: R-2, R·S3, C-05, RN-37, RN-30 (consecuencia), RN·D-13, Q-14, QC-12, QC-13.

#### A-11 · El contador de numeración no es atómico y el número no es único en la BD
- **Descripción**: leer el último número y escribir el siguiente son dos sentencias
  separadas, y `facturas.numero` no tiene restricción de unicidad.
- **Impacto económico**: sin efecto en importes; dos facturas con el mismo número legal, que
  no se pueden borrar.
- **Evidencia**:
  - CÓDIGO: `lib/numeracion.js:8-10` (incidente del 2-ene-2021 y «no ha vuelto a pasar
    (creo)»), `:16`, `:32`; `db.js:52`.
  - DATOS: AD-05. 0 duplicados en la muestra.
  - NEGOCIO: ninguno.
- **Clasificación: BUG A SECAS.** Un número duplicado es incorrecto con cualquier criterio.
- **Dependientes**: las facturas duplicadas de 2021 (fuera de la BD analizada), que ya no se
  pueden cambiar.
- **Tratamiento**: corregir en modernización (reserva atómica y unicidad). Precaución: antes,
  comprobar duplicados en la BD completa (A-18); si los hay, la unicidad no se puede imponer
  sobre el histórico. **No retroactiva.**
- **Decisión pendiente**: «¿Qué dos facturas salieron con el mismo número en enero de 2021 y
  cómo se resolvió?» (no bloquea). Responsable: **Administración**.
- **Fuentes**: R-3, R·D2, RN-39, RN·D-06, MH-14, Q-15.

#### A-12 · El número se reserva antes de grabar: un fallo deja huecos
- **Descripción**: el contador se incrementa antes del `INSERT` de la factura en los tres
  caminos, así que un fallo posterior consume el número.
- **Impacto económico**: sin efecto en importes; huecos en una numeración que debe ser
  correlativa.
- **Evidencia**:
  - CÓDIGO: `lib/numeracion.js:3-6` («correlativa y sin huecos») frente a `:30-36`;
    `routes/facturas.js:71-74`, `:138-141`; `scripts/remesa_mensual.js:57-61`.
  - DATOS: AD-05. Sin huecos entre 101 y 108. Faltan la 1 a la 100, que se explica por ser
    una muestra (A-18), no por huecos.
  - NEGOCIO: ninguno.
- **Clasificación: BUG A SECAS.**
- **Dependientes**: nadie identificado.
- **Tratamiento**: corregir en modernización (número y grabación en la misma transacción).
  **No retroactiva**: un hueco antiguo solo se puede justificar documentalmente.
- **Decisión pendiente**: ninguna.
- **Fuentes**: R-10, R·D1, RN-38, RN·D-05.

#### A-13 · El alta manual graba cabecera y líneas sin transacción
- **Descripción**: la cabecera se graba primero y las líneas después, en paralelo; si falla
  una línea la factura queda numerada con líneas incompletas.
- **Impacto económico**: una factura incompleta deja la cabecera y las líneas distintas, que
  es justo lo que separa el informe de IVA del CSV (A-01).
- **Evidencia**:
  - CÓDIGO: `routes/facturas.js:74-98`; comentario `:81-82` («si falla una a mitad ya se
    apañó en su día a mano en la bd, no ha vuelto a pasar»).
  - DATOS: AD-12. 0 facturas sin líneas; una factura con líneas a medias no se distingue en
    los datos.
  - NEGOCIO: ninguno.
- **Clasificación: BUG A SECAS.**
- **Dependientes**: nadie identificado; el arreglo manual del pasado (MH-20) no consta.
- **Tratamiento**: corregir en modernización (transacción única). No retroactiva.
- **Decisión pendiente**: «¿Qué factura se arregló a mano en la BD, quién lo hizo y qué se
  tocó?» (no bloquea; puede explicar A-01 y A-32). Responsable: **Administración**.
- **Fuentes**: R-19, R·D5, RN-34, C-10 (camino A), MH-20.

#### A-14 · La rectificación no usa transacción e ignora los errores
- **Descripción**: la RE y sus líneas se graban sin transacción, los errores de las líneas y
  de la marca de la original se ignoran, una factura sin líneas deja la petición sin
  respuesta, y un doble clic puede crear dos RE.
- **Impacto económico**: dos rectificativas de la misma factura duplican el abono (p. ej.
  −122,23 € dos veces).
- **Evidencia**:
  - CÓDIGO: `routes/facturas.js:132` (control leído al principio), `:141-160`, `:151` y
    `:154` (callbacks sin `err`), `:147-159` (`forEach` vacío); `views/factura_detalle.ejs:49-51`.
  - DATOS: AD-01, AD-10. La única RE tiene sus 2 líneas y la original está marcada.
  - NEGOCIO: ninguno.
- **Clasificación: BUG A SECAS.**
- **Dependientes**: nadie identificado.
- **Tratamiento**: corregir en modernización. Precaución: mantener el espejo exacto (A-21).
  No retroactiva.
- **Decisión pendiente**: ninguna.
- **Fuentes**: R-9, RN-45 (parte: sin líneas), RN·D-15, C-10 (camino C).

#### A-15 · Una factura emitida se reimprime con los datos actuales del cliente y de la empresa
- **Descripción**: el detalle une con `clientes` y con `config.EMPRESA` en el momento de
  imprimir; la factura no guarda copia de esos datos.
- **Impacto económico**: sin efecto en importes; una copia de una factura antigua puede salir
  con nombre, NIF o dirección distintos de los de su emisión.
- **Evidencia**:
  - CÓDIGO: `routes/facturas.js:106`, `:111`; `views/factura_detalle.ejs:5-7`;
    `config.js:2-3`.
  - DATOS: el esquema de `facturas` no tiene columnas de datos del cliente (§0.4, esquema);
    no hay historial para saber si algún cliente cambió.
  - NEGOCIO: ninguno.
- **Clasificación: BUG A SECAS.**
- **Dependientes**: administración (reimprime a PDF para enviar por Outlook, MH-18).
- **Tratamiento**: corregir en modernización guardando los datos de emisión. **No puede ser
  retroactiva** con fidelidad: para las facturas antiguas solo se pueden congelar los datos
  actuales, con esa advertencia.
- **Decisión pendiente**: ninguna.
- **Fuentes**: R-8.

#### A-16 · La rectificativa se fecha hoy, sin vencimiento, y puede caer en otro trimestre
- **Descripción**: la RE lleva la fecha del día en que se emite, de modo que original y RE
  solo se compensan en el informe de IVA si caen en el mismo trimestre.
- **Impacto económico**: el IVA de la original en un trimestre y su negativo en el
  siguiente.
- **Evidencia**:
  - CÓDIGO: `routes/facturas.js:141-143` (`util.hoy()`, vencimiento `null`);
    `routes/informes.js:17-25`; comentario `:21-22` («cuadran solas»).
  - DATOS: AD-01, AD-10. `FA-2026-000106` (30-abr) y su RE (6-may) caen en el T2: **no
    discrimina**.
  - NEGOCIO: ninguno.
- **Clasificación: PENDIENTE.**
  - Pregunta que lo desbloquea: «Gestoría: ¿la rectificativa debe llevar su propia fecha de
    expedición y declararse en su trimestre, o se espera que compense en el trimestre de la
    original?»
- **Dependientes**: gestoría (modelo 303).
- **Tratamiento provisional**: especificar tal cual.
- **Decisión pendiente**: Responsable: **Gestoría**.
- **Fuentes**: RN-45 (fecha), RN-47 (compensación), RN·D-12.

#### A-17 · La BD se recrea sola con la semilla si falta o se arranca desde otra carpeta
- **Descripción**: la ruta de la BD es relativa y, si `clientes` está vacía, `db.js` carga
  clientes, facturas y contadores semilla (`FA` 108, `RE` 1).
- **Impacto económico**: se podrían emitir facturas reales `FA-2026-000109` y siguientes en
  una BD paralela, con números que ya existen en la real.
- **Evidencia**:
  - CÓDIGO: `config.js:20`; `db.js:11-15`, `:83-87`, `:176-177`; `.gitignore:4-5` («se
    recrea sola al arrancar»).
  - DATOS: AD-16 (la BD de este equipo es justo eso).
  - NEGOCIO: ninguno.
- **Clasificación: BUG A SECAS.**
- **Dependientes**: administración usa los datos semilla «de referencia» (`db.js:91-92`,
  MH-29).
- **Tratamiento**: corregir en modernización (no crear ni sembrar una BD de producción en
  silencio). Precaución: conservar los datos semilla como documento de referencia. No
  aplica retroactividad.
- **Decisión pendiente**: «¿Para qué usa administración los datos semilla?» (no bloquea).
  Responsable: **Administración**.
- **Fuentes**: R-4, R·D6, MH-29.

#### A-18 · La BD analizada es la semilla de `db.js`, no un histórico de producción
- **Descripción**: el negocio confirmó que `datos/gesfact.db` es producción, pero el fichero
  nació en este equipo 12 minutos después de entrar `db.js` en el repositorio, nunca se ha
  modificado y contiene solo la semilla.
- **Impacto económico**: indirecto y transversal: todo veredicto de DATOS de este registro se
  apoya en 9 facturas de enero a mayo de 2026.
- **Evidencia**:
  - CÓDIGO: `db.js:91-92` («datos que había en el sistema cuando se hizo la copia»),
    `:93-181`.
  - DATOS: AD-16 (fechas del fichero); AD-05 (contadores solo de 2026, cuando
    `lib/numeracion.js:18-23` crea uno por año y nunca los borra); AD-15 (faltan facturas
    de remesa de meses con contratos vigentes); AD-14 (ningún texto coincide con el código
    actual); AD-08 (5 de 6 NIF no superan el control, compatible con datos anonimizados).
  - NEGOCIO: «es producción» (usuario, 2026-11-11, sin nombre; R·S4).
- **Clasificación: PENDIENTE.** El testimonio y la evidencia física se contradicen.
  - Pregunta que lo desbloquea: «¿Quién confirmó el 2026-11-11 que esta BD es producción?
    ¿Dónde está el fichero real que usa la oficina, con las facturas desde 2018? ¿Se nos puede
    dar una copia de solo lectura para repetir la arqueología de datos sobre todo el
    histórico?»
- **Dependientes**: este registro y las specs que se escriban sobre él.
- **Tratamiento**: documentar sin especificar. Repetir AD-01 a AD-15 sobre la BD completa
  antes de escribir las specs.
- **Decisión pendiente**: Responsables: **Gerencia** (autoriza el acceso) y
  **Administración** (localiza el fichero).
- **Fuentes**: R·S4, R·S7, `mapa-sistema.md` P1 y H3, QC-14.

#### A-19 · Formato del número y series con contador propio (regla protegida)
- **Descripción**: el número es `SERIE-AAAA-NNNNNN`, con serie FA para facturas y RE para
  rectificativas, cada una con su contador.
- **Impacto económico**: legal; cambiarlo rompería la correlatividad de la serie.
- **Evidencia**:
  - CÓDIGO: `lib/numeracion.js:3-6` (inspección de 2020), `:38-42`; `db.js:76-81`;
    `routes/facturas.js:71`, `:138`; `scripts/remesa_mensual.js:57`.
  - DATOS: AD-05. Caso frontera: la RE lleva su propia secuencia (`RE-2026-000001`) mientras
    FA va por la 108; las 9 siguen el formato.
  - NEGOCIO: ninguno.
- **Clasificación: INTENCIONAL** (CÓDIGO + DATOS). No cubre el año del número (A-10) ni la
  correlatividad sin huecos (A-12), que no tienen caso frontera en los datos.
- **Dependientes**: Hacienda (inspección de 2020); gestoría; todas las facturas emitidas.
- **Tratamiento**: especificar tal cual.
- **Decisión pendiente**: ninguna. Conviene pedir el acta de la inspección de 2020 (MH-13),
  pero no bloquea.
- **Fuentes**: RN-35, RN-36, RN-40, MH-13.

#### A-20 · Las facturas no se borran nunca: se corrigen con rectificativa y factura nueva (regla protegida)
- **Descripción**: no existe borrado de facturas ni de líneas; un error se corrige con una RE
  y, si procede, una factura nueva.
- **Impacto económico**: legal.
- **Evidencia**:
  - CÓDIGO: no hay ningún `DELETE` en el producto (`registro-riesgos.md` §3);
    `lib/numeracion.js:3-6`.
  - DATOS: AD-01, AD-10. Caso frontera: `FA-2026-000106`, errónea, se conserva como
    `rectificada` con su RE y su sustituta, en vez de borrarse.
  - NEGOCIO: ninguno.
- **Clasificación: INTENCIONAL** (CÓDIGO + DATOS).
- **Dependientes**: Hacienda; gestoría.
- **Tratamiento**: especificar tal cual.
- **Decisión pendiente**: ninguna.
- **Fuentes**: RN-41, MH-13.

#### A-21 · La rectificativa es el espejo exacto de lo grabado, sin recalcular (regla protegida)
- **Descripción**: la RE copia cabecera y líneas cambiadas de signo, incluidas las
  discrepancias de la original.
- **Impacto económico**: legal y de cuadre; propaga a la RE cualquier diferencia de A-01.
- **Evidencia**:
  - CÓDIGO: `routes/facturas.js:124-128` («Puri dixit»), `:142`, `:150`.
  - DATOS: AD-01, AD-03. Caso frontera: la RE copia 11,61 € (recalculado serían 11,59 €) y
    un IVA de cabecera de −20,62 € que no es la suma de sus líneas (−20,06 €).
  - NEGOCIO: ninguno.
- **Clasificación: INTENCIONAL** (CÓDIGO + DATOS).
- **Dependientes**: gestoría.
- **Tratamiento**: especificar tal cual, incluida la propagación de discrepancias.
- **Decisión pendiente**: ninguna sobre esta regla; el abono parcial se trata en A-09.
- **Fuentes**: RN-43, MH-21, C-06 §2.

#### A-22 · El NIF solo se valida por longitud y solo al dar de alta el cliente
- **Descripción**: se acepta cualquier texto de 9 caracteres (quitando espacios y guiones), el
  NIF puede quedar vacío y no se comprueba al facturar ni al exportar.
- **Impacto económico**: fiscal (modelos 303 y 347, facturas con NIF erróneo).
- **Evidencia**:
  - CÓDIGO: `lib/util.js:41-48` (TODO de Julián, nov 2017: «los da de alta Marga y los mira
    ella»); `routes/clientes.js:16-20`.
  - DATOS: AD-07, AD-08. Los 6 NIF tienen 9 caracteres, pero **5 de 6 no superan el carácter
    de control**: la validación manual no se refleja en los datos (o los datos están
    anonimizados, A-18).
  - NEGOCIO: ninguno.
- **Clasificación: PENDIENTE.** CÓDIGO a favor de una decisión transitoria; DATOS en contra
  o inválidos.
  - Pregunta que lo desbloquea: «¿Los NIF de los clientes 2 a 6 son los reales? ¿Marga sigue
    revisando cada NIF? ¿Han rechazado alguna vez la gestoría o Hacienda un NIF de GesFact?»
- **Dependientes**: administración (revisión manual); gestoría.
- **Tratamiento provisional**: especificar tal cual. Si se corrige, solo para altas nuevas;
  los NIF existentes se revisan aparte, sin tocar facturas emitidas.
- **Decisión pendiente**: Responsables: **Administración** y **Gestoría**.
- **Fuentes**: R-15, R·D10, RN-55, RN·D-14, MH-05.

### Nivel 3 · Impacto económico medio

#### A-23 · Dos fórmulas de prorrateo: 30 días fijos en la pantalla de baja y días reales en la remesa (regla protegida)
- **Descripción**: `calcularProrrateo` divide la cuota entre 30 (con tope de 30 días) y la
  remesa la divide entre los días reales del mes, así que el mismo periodo cuesta distinto
  según la vía.
- **Impacto económico**: hasta 6,67 € por cada 100 € de cuota en febrero y 3,23 € en meses de
  31 días; 0 en meses de 30. Contrato 4 (alta 15-feb-2026): 54,45 € por remesa frente a
  50,82 € con 30 días (+3,63 € con IVA).
- **Evidencia**:
  - CÓDIGO: `services/calculo.js:90-102` («así lo hacía Paco a mano en el Access y así lo
    espera la gestoría»; tope en `:99`); `scripts/remesa_mensual.js:43-51` (días reales, sin
    tope; Roberto, verano de 2021, `:5-6`).
  - DATOS: AD-09, AD-15. No hay ninguna factura prorrateada en la BD (ni febrero/marzo del
    contrato 4 ni 2025 del contrato 3): **no discrimina**.
  - NEGOCIO: ninguno.
- **Clasificación: PENDIENTE** (las dos fórmulas). La Constitución protege la de 30 días; la
  remesa es el comportamiento actual de la facturación real.
  - Pregunta que lo desbloquea: «¿Qué importe se facturó por el alta del contrato 4 en febrero
    de 2026 (54,45 € o 50,82 €) y por el del contrato 2 en enero de 2023? Gestoría: ¿el
    prorrateo debe ser sobre 30 días o sobre los días reales? Un servicio de todo febrero,
    ¿cobra la cuota entera o 28/30? ¿Quién decidió en 2021 que la remesa usara días reales?»
- **Dependientes**: gestoría («así lo espera»); administración (factura a mano el prorrateo
  de la baja); clientes con alta o baja a mitad de mes.
- **Tratamiento provisional**: especificar tal cual **las dos** fórmulas, cada una en su vía.
  Unificar solo con decisión escrita; **no retroactiva**.
- **Decisión pendiente**: qué fórmula rige y en qué vía. Responsables: **Gestoría** y
  **Gerencia**.
- **Fuentes**: R-5, C-01, RN-14, RN-15, RN-17, RN-20, RN-26, RN·D-03, RN·D-04 (parte),
  RN·D-09, R·D4, MH-01, MH-15, Q-05, Q-07, Q-19, QC-01, QC-03, QC-04.

#### A-24 · Una base de 1.000,00 € exactos no lleva descuento (regla protegida)
- **Descripción**: el 2 % exige base estrictamente mayor que 1.000 €, aunque el comentario dice
  «a partir de 1.000».
- **Impacto económico**: 20,00 € de base (24,20 € con IVA) en una factura de 1.000,00 €
  exactos.
- **Evidencia**:
  - CÓDIGO: `services/calculo.js:36-41` (`>`); `db.js:138` («OJO caso comentado con la
    gestoría: base 1000 justa NO lleva descuento»).
  - DATOS: AD-01, AD-10. Caso frontera: `FA-2026-000103`, base 1.000,00 €, sin descuento,
    total 1.210,00 €, **cobrada**.
  - NEGOCIO: ninguno directo (el caso con la gestoría está en un comentario).
- **Clasificación: INTENCIONAL** (CÓDIGO + DATOS).
- **Dependientes**: gestoría; cliente 5.
- **Tratamiento**: especificar tal cual. No «corregir» el comentario «a partir de»
  cambiando el código (R-24).
- **Decisión pendiente**: ninguna.
- **Fuentes**: RN-07 (parte), RN·D-01 (parte), R-24, R·D3, MH-07, MH-22.

#### A-25 · El tramo de descuento se decide con la base antes de descontar
- **Descripción**: el porcentaje se elige con la suma de bases sin descuento, aunque la base
  resultante quede por debajo del umbral.
- **Impacto económico**: hasta unos 20 € por factura en la frontera (1.020,41 € → 1.000,00 €
  con `descuentoPct = 2`).
- **Evidencia**:
  - CÓDIGO: `services/calculo.js:53-61`, `:65-71`.
  - DATOS: AD-01. La única factura con descuento (`FA-2026-000105`, bruta 2.335,50 €) está
    lejos del umbral: **no discrimina**.
  - NEGOCIO: ninguno.
- **Clasificación: PENDIENTE.**
  - Pregunta que lo desbloquea: «¿El tramo se decide con el importe del pedido antes del
    descuento o después?»
- **Dependientes**: nadie identificado.
- **Tratamiento provisional**: especificar tal cual.
- **Decisión pendiente**: Responsable: **Gerencia**.
- **Fuentes**: RN-08, Q-03.

#### A-26 · El descuento por volumen se aplica a cualquier cliente, no solo a hostelería
- **Descripción**: el comentario limita la intención a «fidelizar hostelería», pero el código
  no mira el sector (no existe ese dato).
- **Impacto económico**: 2 % o 5 % de cada factura de más de 1.000 € de clientes que no son de
  hostelería.
- **Evidencia**:
  - CÓDIGO: `services/calculo.js:38`, `:48-61`; `db.js:19-32` (sin sector).
  - DATOS: AD-01, AD-07. Hay clientes que por el nombre no son de hostelería (ferretería y
    panadería; SUPOSICIÓN por el nombre), pero ninguno supera 1.000 €: **no discrimina**.
  - NEGOCIO: ninguno.
- **Clasificación: PENDIENTE.**
  - Pregunta que lo desbloquea: «¿El descuento por volumen es para todos los clientes o solo
    para hostelería? ¿Algún cliente tiene un acuerdo distinto? ¿Está escrito el acuerdo de
    2018 con Paco, y quién es Paco?»
- **Dependientes**: nadie identificado.
- **Tratamiento provisional**: especificar tal cual.
- **Decisión pendiente**: Responsable: **Gerencia**.
- **Fuentes**: RN-10, RN·D-02, MH-07, Q-04, Q-19.

#### A-27 · La remesa aplica el descuento por volumen sin dejar constancia en la factura
- **Descripción**: una cuota mensual de más de 1.000 € recibiría el 2 % o el 5 % en la remesa,
  sin el texto «Descuento volumen N% aplicado» que pone el alta manual.
- **Impacto económico**: 2 % o 5 % de cuotas de más de 1.000 € (p. ej. 1.500 € → 1.470 €).
- **Evidencia**:
  - CÓDIGO: `scripts/remesa_mensual.js:55`, `:62`; `routes/facturas.js:76`.
  - DATOS: AD-09. Cuota máxima 145 €: **no discrimina**.
  - NEGOCIO: ninguno.
- **Clasificación: PENDIENTE.**
  - Pregunta que lo desbloquea: «¿Los alquileres y mantenimientos deben llevar descuento por
    volumen? Si lo llevan, ¿debe constar en la factura?»
- **Dependientes**: nadie identificado.
- **Tratamiento provisional**: especificar tal cual.
- **Decisión pendiente**: Responsable: **Gerencia**.
- **Fuentes**: RN-25, RN-11, C-10 §3.1, RN·H-06, QC-26.

#### A-28 · El descuento se reparte en el precio unitario de cada línea, y la única factura con descuento no lo refleja (regla protegida)
- **Descripción**: el código rebaja el precio de cada línea y recalcula, pero en
  `FA-2026-000105` las líneas llevan el precio sin descuento y la cabecera no coincide con
  ningún cálculo.
- **Impacto económico**: céntimos por factura por el orden de redondeo (981,24 € frente a
  981,23 € en el ejemplo de RN-09); en `FA-2026-000105`, base de cabecera 2.287,75 € frente a
  2.288,68 € (recálculo con la regla) y 2.335,50 € (líneas).
- **Evidencia**:
  - CÓDIGO: `services/calculo.js:63-71` («para que la gestoría lo vea desglosado igual,
    petición de Puri, 2018»).
  - DATOS: AD-01, AD-03. El único caso (`FA-2026-000105`) **contradice** la regla.
  - NEGOCIO: ninguno.
- **Clasificación: PENDIENTE.** La Constitución la protege, pero los datos van en contra.
  - Pregunta que lo desbloquea: «¿Cómo se imprimió y envió `FA-2026-000105`: con las líneas
    sin descuento y total 2.756,38 €? Gestoría: ¿el descuento debe verse rebajado en el precio
    de cada línea?»
- **Dependientes**: gestoría; cliente 3.
- **Tratamiento provisional**: especificar tal cual la regla del código (mandato del
  Principio I); documentar `FA-2026-000105` como dato discrepante, dentro de A-01.
- **Decisión pendiente**: Responsable: **Gestoría**.
- **Fuentes**: RN-09, RN·H-04, MH-08, QC-17.

#### A-29 · Se acepta cualquier tipo de IVA y, si no está en la tabla, el recargo es 0 %
- **Descripción**: el servidor aplica el porcentaje de IVA que llegue y la tabla de recargo
  devuelve 0 para cualquier tipo no previsto, sin aviso; la marca de recargo se evalúa con
  `== 1`.
- **Impacto económico**: recargo no cobrado a clientes con la marca si se usa un tipo fuera de
  tabla. SUPOSICIÓN (conocimiento general, no del proyecto): en 2023-2024 hubo en España un
  IVA del 5 % con recargo distinto de 0.
- **Evidencia**:
  - CÓDIGO: `services/calculo.js:12-23` (`return 0` en `:22`), `:28`, `:49`;
    `routes/facturas.js:61`; `db.js:36` («21 / 10 / 4»).
  - DATOS: AD-11. Solo 21, 10 y 4 %: **no discrimina**.
  - NEGOCIO: ninguno.
- **Clasificación: PENDIENTE.** Recargo 0 es correcto para IVA 0 % y probablemente incorrecto
  para otros tipos.
  - Pregunta que lo desbloquea: «¿Se ha facturado alguna vez con un IVA distinto de 21, 10 o
    4 % (p. ej. 0 % o 5 %)? En ese caso, ¿qué recargo se aplicó?»
- **Dependientes**: nadie identificado.
- **Tratamiento provisional**: especificar tal cual.
- **Decisión pendiente**: Responsable: **Gestoría**.
- **Fuentes**: RN-13, RN-04 (parte: resto → 0), RN-03 (marca `== 1`), RN·D-11, R-11 (parte).

#### A-30 · El prorrateo de la baja y la remesa no validan las fechas
- **Descripción**: la pantalla de baja empieza siempre el día 1 (aunque el alta sea del mismo
  mes) y solo mira el día del mes; la remesa genera una línea negativa si la baja es anterior
  al alta.
- **Impacto económico**: alta 15 y baja 20 de febrero: 60,00 € en pantalla frente a 19,29 € en
  remesa (−40,71 €); baja anterior al alta: línea de −28,93 € (−35,01 € con IVA).
- **Evidencia**:
  - CÓDIGO: `routes/contratos.js:32-39`; `services/calculo.js:94-100` (comentario «dentro del
    MISMO mes» sin comprobación); `scripts/remesa_mensual.js:45-51`.
  - DATOS: AD-09. Ningún contrato con alta y baja en el mismo mes ni baja anterior al alta.
  - NEGOCIO: ninguno.
- **Clasificación: BUG A SECAS.** Una cuota negativa de alquiler o un prorrateo que ignora el
  alta son incorrectos con cualquier criterio.
- **Dependientes**: nadie identificado.
- **Tratamiento**: corregir en modernización (validar fechas de baja). Precaución: no cambiar
  la fórmula de ninguna vía (A-23). No retroactiva.
- **Decisión pendiente**: ninguna.
- **Fuentes**: RN-16, RN·D-04 (parte), R·D4 (parte), R-30 (parte), C-01 §3 (dos últimas
  filas).

#### A-31 · Fronteras de la remesa: un día de alta o de baja factura un día
- **Descripción**: con fronteras inclusivas, un contrato dado de baja el día 1 o con alta el
  último día del mes factura 1/N de la cuota.
- **Impacto económico**: 1/N de la cuota (90 € en febrero: 3,21 €; 145 € en un mes de 31
  días: 4,68 €).
- **Evidencia**:
  - CÓDIGO: `scripts/remesa_mensual.js:20-21`, `:26-29`, `:45-46`.
  - DATOS: AD-09. Ningún contrato con esas fechas: **no discrimina**.
  - NEGOCIO: ninguno.
- **Clasificación: PENDIENTE.**
  - Pregunta que lo desbloquea: «Un contrato dado de baja el día 1, ¿debe facturar ese día? ¿Y
    uno dado de alta el último día del mes?»
- **Dependientes**: nadie identificado.
- **Tratamiento provisional**: especificar tal cual.
- **Decisión pendiente**: Responsable: **Gerencia**.
- **Fuentes**: RN-19, RN-21, Q-06.

### Nivel 4 · Impacto económico bajo

#### A-32 · La BD contiene datos que el código actual no genera
- **Descripción**: 7 de 28 líneas no salen del cálculo actual, las facturas de remesa tienen
  líneas que la remesa no graba, `FA-2026-000107` repite `FA-2026-000106` y ningún texto de
  observaciones tiene el formato del código actual.
- **Impacto económico**: 0,02 a 0,11 € por línea en las 7 líneas; el impacto real depende del
  origen (ediciones manuales en la BD o una versión anterior del código).
- **Evidencia**:
  - CÓDIGO: `services/calculo.js:26-34`; `scripts/remesa_mensual.js:53-54`, `:62`, `:66`,
    `:80-84`; `routes/facturas.js:76`, `:81-82` («se apañó a mano en la bd»), `:143`.
  - DATOS: AD-03, AD-14, AD-15.
  - NEGOCIO: ninguno.
- **Clasificación: PENDIENTE.** Si fueron ediciones manuales, es un bug histórico con
  dependientes; si es otra versión del código, es historia del sistema.
  - Pregunta que lo desbloquea: «¿Quién añadió a mano las líneas de café, azúcar y vasos a
    las facturas de remesa `FA-2026-000101`, `-106` y `-108`, y quién tecleó los importes de
    "Portes"? ¿Se edita la BD directamente? ¿Con qué versión de GesFact se emitieron estas
    facturas?»
- **Dependientes**: clientes de esas facturas (documentos emitidos); gestoría.
- **Tratamiento**: documentar sin especificar. Los tests de caracterización se basan en el
  código y en los casos de la BD que sí se reproducen (21 de 28 líneas).
- **Decisión pendiente**: si se permiten ediciones manuales de la BD y quién las autoriza.
  Responsables: **Administración** y **Gerencia**.
- **Fuentes**: RN·H-02, RN·H-03, RN·D-10 (parte), MH-20, Q-18, QC-25.

#### A-33 · El panel cuenta como pendiente de cobro una rectificativa, pero no suma su importe
- **Descripción**: «Facturas pendientes de cobro» cuenta todas las emitidas, incluidas las RE;
  «Importe pendiente» suma solo las FA; y «emitidas» significa 9 en el panel y 4 en el
  listado.
- **Impacto económico**: ninguno en importes facturados; el panel dice «4 pendientes» por
  3.032,85 €, cuando las 4 suman 2.910,62 € y las FA pendientes son 3.
- **Evidencia**:
  - CÓDIGO: `server.js:22-24`; `views/index.ejs:4-6`; `routes/facturas.js:18-19`;
    `views/factura_detalle.ejs:47`.
  - DATOS: AD-10.
  - NEGOCIO: ninguno.
- **Clasificación: PENDIENTE.**
  - Pregunta que lo desbloquea: «¿Una rectificativa debe contar como pendiente de cobro y
    restar del importe pendiente? "Facturas emitidas (total histórico)", ¿debe incluir
    rectificativas y rectificadas?»
- **Dependientes**: administración (lectura del panel).
- **Tratamiento provisional**: especificar tal cual.
- **Decisión pendiente**: Responsable: **Administración**.
- **Fuentes**: R-23, C-07, QC-18, QC-19.

#### A-34 · Redondeo y formato al mostrar no coinciden con el redondeo al calcular
- **Descripción**: se calcula con `redondear2` y se muestra con `toFixed(2)`, que difieren en
  ≈ 4,2 % de los valores de 3 decimales; hay dos formatos de salida (`1.234,50` y `1234.50`);
  las sumas del informe y del panel no se redondean.
- **Impacto económico**: ninguno en lo grabado; solo en lo mostrado (p. ej. `811.0999…`
  mostrado como `811,10`).
- **Evidencia**:
  - CÓDIGO: `lib/util.js:5-7`, `:51-58`; `views/index.ejs:6`; `views/contratos.ejs:8`;
    `views/articulos.ejs:8`; `server.js:24`; `routes/informes.js:23`;
    `views/informe_iva.ejs:5`.
  - DATOS: AD-01, AD-02. 0 diferencias entre `redondear2` y `toFixed` en los valores
    grabados (C-03 §4); la suma de bases al 4 % del T1 vale `811.09999999999991`.
  - NEGOCIO: ninguno.
- **Clasificación: ACCIDENTAL.**
- **Dependientes**: gestoría (el CSV usa `formatearImporte`: su formato no se toca).
- **Tratamiento**: documentar sin especificar el formato del panel y de los listados;
  especificar tal cual `formatearImporte` en el CSV. Unificar formatos de pantalla en
  modernización, sin tocar el CSV.
- **Decisión pendiente**: «¿Qué formato espera la oficina en el panel?» Responsable:
  **Administración**.
- **Fuentes**: C-03 (§1.1, §1.2), RN-52, R-32, QC-07, QC-09.

#### A-35 · El vencimiento sale un día antes si el equipo está en una zona horaria con desfase negativo
- **Descripción**: `sumarDias` interpreta la fecha como UTC y la lee en hora local; en
  `Europe/Madrid` da el resultado esperado y en zonas como UTC−3 sale un día antes.
- **Impacto económico**: un día de adelanto en todos los vencimientos (posibles reclamaciones
  de cobro anticipadas).
- **Evidencia**:
  - CÓDIGO: `lib/util.js:17-26` (TODO de marzo de 2019); usos en `routes/facturas.js:69`,
    `scripts/remesa_mensual.js:60`; `lib/util.js:10-15` (`hoy()` en hora local).
  - DATOS: AD-13. 8 de 8 vencimientos coinciden en Madrid, 0 de 8 en UTC−3. La hipótesis del
    cambio de hora no se reproduce (C-04 §3.3).
  - NEGOCIO: ninguno.
- **Clasificación: BUG A SECAS** (latente: en Madrid no se manifiesta).
- **Dependientes**: nadie identificado. Los tests de caracterización deben fijar
  `TZ=Europe/Madrid` (esta máquina está en UTC−3).
- **Tratamiento**: corregir en modernización de forma que el resultado sea **idéntico** al de
  `Europe/Madrid` para todas las fechas. No retroactiva.
- **Decisión pendiente**: «¿En qué equipo y zona horaria corren el servidor y la remesa? ¿Qué
  factura de marzo de 2019 salió con un día menos?» (no bloquea). Responsable:
  **Administración**.
- **Fuentes**: R-14, C-04 (C-1, C-2), RN-32 (parte), RN-53 (parte), RN·D-07, MH-03, MH-10,
  Q-13, QC-10, QC-11.

#### A-36 · Un cliente con plazo de pago 0 días recibe 30 días
- **Descripción**: el plazo se toma con `dias_pago || 30`, así que 0 («al contado») se trata
  como «sin plazo».
- **Impacto económico**: 30 días de retraso en el cobro de un cliente al contado.
- **Evidencia**:
  - CÓDIGO: `routes/facturas.js:68`; `scripts/remesa_mensual.js:60`; `config.js:39-40`.
  - DATOS: AD-07. Ningún cliente con 0: **no discrimina**.
  - NEGOCIO: ninguno.
- **Clasificación: PENDIENTE.**
  - Pregunta que lo desbloquea: «Un plazo de 0 días, ¿significa "al contado" o "el plazo por
    defecto"?»
- **Dependientes**: nadie identificado.
- **Tratamiento provisional**: especificar tal cual.
- **Decisión pendiente**: Responsable: **Administración**.
- **Fuentes**: RN-31 (parte), Q-12.

#### A-37 · El vencimiento se cuenta en días naturales, con 30 días si el cliente no tiene plazo
- **Descripción**: vencimiento = fecha + N días naturales, sin ajustar a fin de mes ni a día
  hábil; N es el plazo del cliente o 30.
- **Impacto económico**: ninguno directo.
- **Evidencia**:
  - CÓDIGO: `routes/facturas.js:68-69`; `scripts/remesa_mensual.js:60`; `lib/util.js:20-26`.
  - DATOS: AD-13. Caso frontera: `FA-2026-000101` (cliente sin plazo), 2026-01-31 + 30 =
    **2026-03-02** (no 28-feb ni fin de mes), **cobrada**; `FA-2026-000103` con 60 días.
  - NEGOCIO: ninguno.
- **Clasificación: INTENCIONAL** (CÓDIGO + DATOS).
- **Dependientes**: clientes; administración (cobros).
- **Tratamiento**: especificar tal cual (con el resultado de `Europe/Madrid`, ver A-35).
- **Decisión pendiente**: ninguna.
- **Fuentes**: RN-32 (parte), RN-31 (parte), RN-23.

#### A-38 · Los valores por defecto están escritos varias veces
- **Descripción**: el plazo de 30 días está en `config.VENCIMIENTO_DIAS` y como literal en la
  remesa; el IVA de 21 % está en `config.IVA_DEFECTO`, como literal en contratos y como
  `DEFAULT 21` en la tabla; el comentario de `config.js` habla de «forma de pago» y el campo
  es `dias_pago`.
- **Impacto económico**: ninguno hoy (todas las copias valen lo mismo); si se cambia una sola,
  15 días de diferencia entre vías con 45 días.
- **Evidencia**:
  - CÓDIGO: `config.js:24-25`, `:39-40`; `scripts/remesa_mensual.js:60`;
    `routes/contratos.js:20`; `routes/articulos.js:16`; `db.js:46`.
  - DATOS: AD-13. Todos los vencimientos encajan con 30 o 60 días.
  - NEGOCIO: ninguno.
- **Clasificación: ACCIDENTAL.**
- **Dependientes**: nadie identificado.
- **Tratamiento**: corregir en modernización con una sola fuente para cada valor, **sin
  cambiar el valor**. No aplica retroactividad.
- **Decisión pendiente**: «¿El plazo por defecto es fijo o un parámetro? ¿Hay más de una copia
  de `config.js` con valores distintos?» (no bloquea). Responsable: **Administración**.
- **Fuentes**: C-02, RN-23 (literal), RN·D-08, R·D8, QC-05, QC-06.

#### A-39 · Se conservan los porcentajes de recargo de tipos de IVA antiguos («no borrar»)
- **Descripción**: la tabla conserva recargo del 4 % para IVA 16/18 % y del 1 % para IVA 7/8 %
  «por si hay que reabrir ejercicios viejos del Access».
- **Impacto económico**: ninguno hoy; solo si se reabre un ejercicio antiguo.
- **Evidencia**:
  - CÓDIGO: `services/calculo.js:16-21`.
  - DATOS: AD-11. Ninguna línea con esos tipos: **no discrimina**.
  - NEGOCIO: ninguno.
- **Clasificación: PENDIENTE.**
  - Pregunta que lo desbloquea: «¿Se ha reabierto alguna vez un ejercicio del Access? ¿Hasta qué
    año podría hacer falta? ¿Se conserva el programa Access y su base de datos?»
- **Dependientes**: nadie identificado.
- **Tratamiento provisional**: especificar tal cual (no borrar).
- **Decisión pendiente**: Responsable: **Gestoría**.
- **Fuentes**: RN-04 (tipos antiguos), MH-02, MH-04, Q-01.

#### A-40 · Formato y clave del CSV de la gestoría («no cambiar»)
- **Descripción**: el CSV lleva `CLAVE;<clave>` en la primera línea, separador `;`, coma
  decimal, punto de millares, fecha `DD/MM/AAAA`, CRLF, importes de cabecera, y se ordena por
  número como texto (todas las FA antes que las RE).
- **Impacto económico**: ninguno directo; un cambio podría hacer que el Contaplus rechace el
  fichero.
- **Evidencia**:
  - CÓDIGO: `routes/informes.js:32-51` («acordado con Puri en 2019»); `config.js:36-37`
    («no cambiar»).
  - DATOS: el CSV no se guarda en la BD: **no hay veredicto de datos**.
  - NEGOCIO: ninguno.
- **Clasificación: PENDIENTE.**
  - Pregunta que lo desbloquea: «Gestoría: ¿seguís importando este CSV en el Contaplus con este
    formato? ¿Para qué sirve la clave de la primera línea? ¿Os importa el orden de las filas?»
  - Alternativa por DATOS: un CSV ya enviado a la gestoría, comparado con lo que genera hoy el
    sistema.
- **Dependientes**: gestoría (importación en Contaplus).
- **Tratamiento provisional**: especificar tal cual, byte a byte.
- **Decisión pendiente**: Responsable: **Gestoría**.
- **Fuentes**: RN-49, MH-11.

#### A-41 · El CSV de la gestoría no escapa `;` ni saltos de línea
- **Descripción**: un `;` o un salto de línea en el nombre del cliente desplaza las columnas
  del CSV.
- **Impacto económico**: fichero de gestoría mal importado.
- **Evidencia**:
  - CÓDIGO: `routes/informes.js:43-45`; alta de cliente sin validar el nombre
    (`routes/clientes.js`).
  - DATOS: AD-07. 0 nombres con `;` o salto de línea.
  - NEGOCIO: ninguno.
- **Clasificación: BUG A SECAS.**
- **Dependientes**: gestoría.
- **Tratamiento**: corregir en modernización. Precaución: escapar cambia el formato del
  fichero (A-40); acordarlo antes con la gestoría o, en su lugar, impedir esos caracteres en
  el alta de cliente. No retroactiva.
- **Decisión pendiente**: cómo corregirlo sin romper la importación. Responsable:
  **Gestoría**.
- **Fuentes**: R-29.

#### A-42 · Los periodos de informe y de remesa no se validan
- **Descripción**: `trimestre=5` provoca un error de ejecución, `trimestre=0` se convierte en 1
  sin aviso, y la remesa acepta los meses 13 y 00 (`diasDelMes` devuelve 31).
- **Impacto económico**: un informe caído; una remesa con meses inexistentes generaría
  facturas con fecha `2026-13-31`.
- **Evidencia**:
  - CÓDIGO: `routes/informes.js:15-19`; `scripts/remesa_mensual.js:14-18`, `:21`;
    `lib/util.js:36-39`.
  - DATOS: AD-12. 0 fechas no válidas en la BD.
  - NEGOCIO: ninguno.
- **Clasificación: BUG A SECAS.**
- **Dependientes**: nadie identificado.
- **Tratamiento**: corregir en modernización (rechazar periodos no válidos). No retroactiva.
- **Decisión pendiente**: ninguna.
- **Fuentes**: RN-48, RN-54 (parte), R-30 (parte).

#### A-43 · El trimestre del informe termina en «-31» y se compara como texto
- **Descripción**: el último día del trimestre se fija como día 31 en todos los meses y
  funciona porque las fechas se comparan como texto.
- **Impacto económico**: ninguno con fechas válidas.
- **Evidencia**:
  - CÓDIGO: `routes/informes.js:17-19`, `:23-25`.
  - DATOS: AD-02, AD-12. Las sumas del T1 incluyen todas las facturas del trimestre; 0 fechas
    no válidas.
  - NEGOCIO: ninguno.
- **Clasificación: ACCIDENTAL.**
- **Dependientes**: gestoría (el resultado del informe).
- **Tratamiento**: especificar tal cual el resultado (facturas de día 1 a fin de trimestre,
  todos los estados); la implementación puede cambiar en modernización si el resultado es el
  mismo.
- **Decisión pendiente**: ninguna.
- **Fuentes**: RN-47 (fronteras), C-04 §3.4.

#### A-44 · La fecha de una factura manual no se valida
- **Descripción**: se acepta cualquier texto como fecha; uno no válido produce un vencimiento
  `NaN-NaN-NaN`.
- **Impacto económico**: una factura con fecha ilegible, ya numerada y no borrable.
- **Evidencia**:
  - CÓDIGO: `routes/facturas.js:44`, `:69`; `lib/util.js:20-26`. El formulario usa
    `type="date"` (`views/factura_nueva.ejs:9`), pero el servidor no lo comprueba.
  - DATOS: AD-12. 0 fechas no válidas.
  - NEGOCIO: ninguno.
- **Clasificación: BUG A SECAS** (el formato). Las fechas válidas de otro año se tratan en
  A-10.
- **Dependientes**: nadie identificado.
- **Tratamiento**: corregir en modernización (rechazar formatos no válidos). No retroactiva.
- **Decisión pendiente**: ninguna.
- **Fuentes**: RN-30, R-30 (parte), R-11 (parte).

#### A-45 · Una cantidad o un precio vacío o no numérico da importes `null`
- **Descripción**: la línea queda con base e IVA `NaN`/`null`; el `INSERT` choca con `NOT NULL`
  después de haber reservado el número.
- **Impacto económico**: ninguno en importes; un número consumido (A-12) y una factura a medias
  (A-13).
- **Evidencia**:
  - CÓDIGO: `routes/facturas.js:59-60`; `services/calculo.js:26-34`; `db.js:57`, `:72-75`.
    El fallo concreto de SQLite no se ha ejecutado.
  - DATOS: AD-12. Ningún importe nulo.
  - NEGOCIO: ninguno.
- **Clasificación: BUG A SECAS.**
- **Dependientes**: nadie identificado.
- **Tratamiento**: corregir en modernización (rechazar la línea antes de numerar). No
  retroactiva.
- **Decisión pendiente**: ninguna.
- **Fuentes**: RN-12 (parte), R-11 (parte), R-10 (detonante).

### Nivel 5 · Sin impacto económico directo

#### A-46 · Sin autenticación ni protección CSRF, escuchando en todas las interfaces
- **Descripción**: cualquier equipo que alcance el puerto puede emitir, cobrar, rectificar y
  descargar el CSV con la clave de la gestoría.
- **Impacto económico**: indirecto (alteración de la facturación o fuga de datos de clientes).
- **Evidencia**:
  - CÓDIGO: `server.js:16-42` (sin control de acceso), `:49` (`listen` sin host);
    `routes/informes.js:40`.
  - DATOS: no aplica.
  - NEGOCIO: ninguno («red interna» solo consta en `AGENTS.md`, que es documentación de esta
    fase).
- **Clasificación: PENDIENTE.** Puede ser una decisión consciente para una red cerrada.
  - Pregunta que lo desbloquea: «¿Se accede a GesFact desde fuera de la oficina (VPN,
    redirección de puertos, wifi de invitados)? ¿Quién debe poder emitir, cobrar y rectificar?»
- **Dependientes**: todos los usuarios de la oficina (acceso sin credenciales).
- **Tratamiento provisional**: documentar sin especificar. Corrección en modernización tras la
  respuesta.
- **Decisión pendiente**: Responsable: **Gerencia**.
- **Fuentes**: R-6, R·S8.

#### A-47 · Contraseña SMTP y clave de la gestoría en claro y versionadas
- **Descripción**: `config.js`, incluido en git, contiene la contraseña del correo y la clave
  del CSV.
- **Impacto económico**: indirecto.
- **Evidencia**:
  - CÓDIGO: `config.js:30-34`, `:37`; `.gitignore:17-19` (protege `.env`, no `config.js`);
    `git ls-files` incluye `config.js`.
  - DATOS: no aplica.
  - NEGOCIO: ninguno.
- **Clasificación: BUG A SECAS.**
- **Dependientes**: la gestoría depende del **valor** de la clave (A-40); `config.js` se copia a
  mano al servidor (A-56).
- **Tratamiento**: corregir en modernización sacando los secretos del repositorio **sin cambiar
  el valor de la clave**. Cambiar la contraseña SMTP solo de acuerdo con el responsable del
  correo (A-48). No aplica retroactividad (el historial de git conserva los valores).
- **Decisión pendiente**: «¿Sigue activa la cuenta de correo de `config.js` y se reutiliza esa
  contraseña en otros servicios?» Responsable: **Responsable del correo** (Manoli).
- **Fuentes**: R-16, R·S6.

#### A-48 · El envío de facturas por correo es un no-op desde 2022
- **Descripción**: el alta manual llama a un envío que solo escribe un aviso en consola; las
  facturas se envían a mano desde el Outlook de Marga y la remesa ni siquiera llama al envío.
- **Impacto económico**: facturas emitidas que no llegan al cliente si nadie las envía (cobro
  retrasado).
- **Evidencia**:
  - CÓDIGO: `services/email.js:1-8`, `:12-28` («hablar con Manoli antes de tocar nada de
    esto»); `routes/facturas.js:93`; `scripts/remesa_mensual.js:9-12`; `config.js:27-34`;
    `LEEME.txt:14`.
  - DATOS: no hay registro de envíos en la BD.
  - NEGOCIO: ninguno.
- **Clasificación: PENDIENTE.**
  - Pregunta que lo desbloquea: «Manoli: ¿por qué hay que hablar contigo antes de reactivar el
    correo? ¿Se decidió no reactivarlo? Administración: ¿se lleva control de qué facturas se han
    enviado?»
- **Dependientes**: administración (envío manual); clientes.
- **Tratamiento provisional**: especificar tal cual (no envía).
- **Decisión pendiente**: Responsables: **Responsable del correo** y **Administración**.
- **Fuentes**: R-17, R·S5, MH-18, MH-19.

#### A-49 · El teléfono de la empresa en las facturas es «925 511 XXX»
- **Descripción**: el teléfono que se imprime en cada factura tiene un marcador en lugar de las
  últimas cifras.
- **Impacto económico**: ninguno directo.
- **Evidencia**:
  - CÓDIGO: `config.js:14`; `views/factura_detalle.ejs:7`.
  - DATOS: no se guarda en la BD (se lee de `config.js` al imprimir, A-15).
  - NEGOCIO: ninguno.
- **Clasificación: PENDIENTE.** Puede ser una anonimización de esta copia del repositorio.
  - Pregunta que lo desbloquea: «¿Las facturas que reciben los clientes llevan "925 511 XXX" o
    el teléfono completo? ¿Se anonimizó `config.js` en esta copia?»
- **Dependientes**: facturas emitidas; como se reimprimen con `config.js` actual, corregir el
  valor cambia también las reimpresiones de facturas antiguas.
- **Tratamiento provisional**: especificar tal cual.
- **Decisión pendiente**: Responsable: **Administración**.
- **Fuentes**: R-22.

#### A-50 · Servidor y remesa escriben a la vez en el mismo fichero SQLite sin configurar bloqueos
- **Descripción**: no hay espera configurada ante `SQLITE_BUSY` y el diario es `delete`; si la
  BD está en una carpeta de red, el bloqueo de SQLite es poco fiable.
- **Impacto económico**: una remesa abortada a medias (A-03) o una BD dañada.
- **Evidencia**:
  - CÓDIGO: `db.js:15` (sin `busy_timeout` ni `PRAGMA`); `LEEME.txt:6` (carpeta
    `\\SERVIDOR\compartido`); precedente de 2018 con ficheros JSON corrompidos por escrituras
    simultáneas (`db.js:2-4`).
  - DATOS: `journal_mode = delete` (`registro-riesgos.md` R27).
  - NEGOCIO: ninguno.
- **Clasificación: BUG A SECAS** (latente).
- **Dependientes**: nadie identificado.
- **Tratamiento**: corregir en modernización. La gravedad depende de dónde esté la BD (A-18).
- **Decisión pendiente**: «¿Dónde está el fichero de la BD y quién arranca el servidor?»
  Responsable: **Administración**.
- **Fuentes**: R-27, R·S7, MH-06.

#### A-51 · Copias de seguridad manuales, semanales, en un pendrive
- **Descripción**: Marga copia la BD a un pendrive los viernes; no hay otra copia ni prueba de
  restauración, y una restauración dejaría los contadores por detrás de facturas ya enviadas.
- **Impacto económico**: hasta una semana de facturación perdida y números repetidos tras
  restaurar.
- **Evidencia**:
  - CÓDIGO: `LEEME.txt:18`; `.gitignore:4-9`.
  - DATOS: no aplica.
  - NEGOCIO: ninguno.
- **Clasificación: PENDIENTE.** Es una práctica decidida por alguien; falta saber si se acepta
  el riesgo.
  - Pregunta que lo desbloquea: «¿Se sigue haciendo la copia de los viernes? ¿Se ha probado
    alguna restauración? ¿Quién la hace si Marga no está?»
- **Dependientes**: administración.
- **Tratamiento provisional**: documentar sin especificar.
- **Decisión pendiente**: Responsable: **Gerencia**.
- **Fuentes**: R-20, MH-25.

#### A-52 · La BD no tiene integridad referencial ni restricciones
- **Descripción**: no hay claves foráneas, ni `CHECK` en estado y serie, ni índices salvo el de
  `contadores`.
- **Impacto económico**: ninguno observado.
- **Evidencia**:
  - CÓDIGO: `db.js:19-81`; comentario de estados sin `CHECK` (`db.js:61`).
  - DATOS: AD-12. `foreign_keys = 0`; 0 líneas huérfanas; solo los estados `cobrada`,
    `emitida` y `rectificada`.
  - NEGOCIO: ninguno.
- **Clasificación: ACCIDENTAL.**
- **Dependientes**: nadie identificado.
- **Tratamiento**: corregir en modernización, comprobando antes el histórico completo (A-18);
  las restricciones no pueden invalidar datos ya emitidos.
- **Decisión pendiente**: ninguna.
- **Fuentes**: R-21.

#### A-53 · Las altas de contratos, artículos y clientes casi no validan
- **Descripción**: se aceptan cuotas y precios no numéricos, cualquier tipo de IVA, contratos de
  clientes inexistentes y plazos de pago no numéricos.
- **Impacto económico**: datos maestros erróneos que alimentan facturas y remesas.
- **Evidencia**:
  - CÓDIGO: `routes/contratos.js:17-21`; `routes/articulos.js:16-19`; `routes/clientes.js`.
  - DATOS: AD-07, AD-09. Los maestros actuales son coherentes.
  - NEGOCIO: ninguno.
- **Clasificación: BUG A SECAS.**
- **Dependientes**: nadie identificado.
- **Tratamiento**: corregir en modernización. No retroactiva.
- **Decisión pendiente**: ninguna.
- **Fuentes**: R-31.

#### A-54 · Los errores de BD y las trazas se muestran al usuario
- **Descripción**: las rutas devuelven `err.message` y Express muestra la traza por defecto.
- **Impacto económico**: ninguno.
- **Evidencia**:
  - CÓDIGO: `routes/facturas.js:24`, `:72`, `:78`; `routes/informes.js:27`; `server.js` (sin
    manejador de errores).
  - DATOS: no aplica.
  - NEGOCIO: ninguno.
- **Clasificación: BUG A SECAS.**
- **Dependientes**: nadie identificado.
- **Tratamiento**: corregir en modernización.
- **Decisión pendiente**: ninguna.
- **Fuentes**: R-35.

#### A-55 · Dependencias con avisos de seguridad
- **Descripción**: `npm audit` informa de 4 vulnerabilidades (1 crítica, 2 altas, 1
  moderada), entre ellas `body-parser@1.20.5`.
- **Impacto económico**: indirecto (caída del servidor de facturación).
- **Evidencia**:
  - CÓDIGO: `package.json:12-15`; `registro-riesgos.md` R26 (salida de `npm audit`).
  - DATOS: no aplica.
  - NEGOCIO: ninguno.
- **Clasificación: BUG A SECAS.**
- **Dependientes**: nadie identificado.
- **Tratamiento**: corregir en modernización (prohibido en esta fase, Principio IV), con tests
  de caracterización en verde antes y después.
- **Decisión pendiente**: ninguna.
- **Fuentes**: R-26.

#### A-56 · `config.js` se copia a mano al servidor, «NO RENOMBRAR», y hay dos rutas de copia
- **Descripción**: el comentario de `config.js` dice que se copia a `\\SERVIDOR\gesfact`, y
  `LEEME.txt` sitúa el programa en `\\SERVIDOR\compartido\gesfact`.
- **Impacto económico**: indirecto (dos copias de la configuración con valores distintos,
  ver A-38).
- **Evidencia**:
  - CÓDIGO: `config.js:2-3`; `LEEME.txt:6`.
  - DATOS: no aplica.
  - NEGOCIO: ninguno.
- **Clasificación: PENDIENTE.**
  - Pregunta que lo desbloquea: «¿Por qué no se puede renombrar `config.js` (¿lo lee otro
    programa o un acceso directo?)? ¿Cuál de las dos carpetas es la real, o hay dos copias del
    programa?»
- **Dependientes**: desconocido (es lo que se pregunta).
- **Tratamiento provisional**: especificar tal cual (no renombrar).
- **Decisión pendiente**: Responsable: **Administración**.
- **Fuentes**: MH-26, QC-06.

#### A-57 · El runtime documentado (Node 8) no coincide con el de análisis y no se declara
- **Descripción**: `LEEME.txt` pide Node 8, `package.json` no declara `engines` y este análisis
  se ha hecho con Node 22.
- **Impacto económico**: ninguno directo.
- **Evidencia**:
  - CÓDIGO: `LEEME.txt:5`; `package.json`.
  - DATOS: no aplica.
  - NEGOCIO: ninguno.
- **Clasificación: ACCIDENTAL.**
- **Dependientes**: el equipo de la oficina (versión real sin confirmar).
- **Tratamiento**: documentar sin especificar; confirmar la versión real antes de ejecutar los
  tests de caracterización allí.
- **Decisión pendiente**: ninguna.
- **Fuentes**: R-28.

#### A-58 · Versiones con `^` en `package.json`
- **Descripción**: `npm install` sin `ci` puede instalar versiones distintas de las del
  lockfile.
- **Impacto económico**: ninguno directo.
- **Evidencia**: CÓDIGO: `package.json:12-15`; `package-lock.json` versionado. DATOS: no aplica.
  NEGOCIO: ninguno.
- **Clasificación: ACCIDENTAL.**
- **Dependientes**: nadie identificado.
- **Tratamiento**: corregir en modernización (instalación reproducible). No se toca en esta
  fase (Principio IV).
- **Decisión pendiente**: ninguna.
- **Fuentes**: R-34.

#### A-59 · Sin tests ni linter, y conocimiento concentrado en personas
- **Descripción**: las reglas de negocio solo están en comentarios y en la memoria de Julián,
  Roberto, Marga y Puri.
- **Impacto económico**: indirecto (cualquier cambio puede romper un cálculo sin que nadie lo
  detecte).
- **Evidencia**: CÓDIGO: `package.json` (sin scripts de test); `services/calculo.js:3-7`;
  `lib/numeracion.js:8`; `LEEME.txt:15-16`. DATOS: no aplica. NEGOCIO: ninguno.
- **Clasificación: ACCIDENTAL.**
- **Dependientes**: nadie identificado.
- **Tratamiento**: tests de caracterización con `node:test` en esta fase (Principio IV); el
  resto, en modernización.
- **Decisión pendiente**: «¿Siguen localizables Julián y Roberto?» (no bloquea). Responsable:
  **Gerencia**.
- **Fuentes**: R-18.

#### A-60 · Código y documentación muertos o desfasados
- **Descripción**: el volcado MySQL de 2018 nunca se ejecutó, el módulo de albaranes de Roberto
  está fuera del repositorio, `LEEME.txt` dice estar actualizado en 2019 pero cuenta hechos de
  2021-2022, y la partición de `routes/facturas.js` quedó en «algún día».
- **Impacto económico**: ninguno directo.
- **Evidencia**: CÓDIGO: `datos/migracion_mysql_2018.sql:1-3`; `LEEME.txt:11-16`, `:20`;
  `routes/facturas.js:2-3`. DATOS: no aplica. NEGOCIO: ninguno.
- **Clasificación: ACCIDENTAL.**
- **Dependientes**: nadie identificado.
- **Tratamiento**: documentar sin especificar. La migración a MySQL está fuera de alcance por la
  Constitución.
- **Decisión pendiente**: «¿Se da por cancelada la migración a MySQL? ¿Se puede recuperar el
  módulo de albaranes y qué problema resolvía?» (no bloquea). Responsable: **Gerencia**.
- **Fuentes**: R-33, R·D9, MH-09, MH-16, MH-23, MH-30.

### Entradas añadidas tras la entrevista simulada (2026-11-11)

Se numeran a continuación para no renumerar las existentes. El nivel de impacto va en el
título.

#### A-61 · (Nivel 1) El IVA del 303 se declaró con las cabeceras y al cliente se le cobró la suma de líneas
- **Descripción**: según el acta, la gestoría declaró en el 303 del T1 de 2026 el IVA del CSV
  (cabeceras), y el cliente de `FA-2026-000101` pagó la suma de líneas. Una declaración ya
  presentada puede no coincidir con el IVA repercutido y cobrado. Ningún documento anterior
  lo recogía: A-01 dejaba abierta la fuente declarada.
- **Impacto económico**: en el T1 de 2026, hasta **133,31 €** de IVA declarado por encima
  de la suma de líneas (736,97 − 603,66). En el T2, hasta 2,49 € (135,80 − 133,31). Son
  estimaciones propias sobre AD-02. Comprobado solo en `FA-2026-000101`: **3,70 €**
  (27,97 − 24,27).
- **Evidencia**:
  - CÓDIGO: `routes/informes.js:36-45` (el CSV exporta cabeceras); `routes/informes.js:13`
    («para el modelo 303 lo termina la gestoria»), que no dice qué fuente usa.
  - DATOS: AD-01, AD-02.
  - NEGOCIO: ninguno válido. Provisional, sin persona identificada: ENT-P1 (Gestoría) y
    ENT-P1-bis (Administración), 2026-11-11.
- **Clasificación: PENDIENTE.** Si se confirma con testimonio identificado, es un **BUG
  HISTÓRICO CON DEPENDIENTES** con un dependiente externo (Hacienda).
  - Pregunta que lo desbloquea: «Gestoría (persona identificada): ¿confirmáis que el 303 del
    T1 de 2026 se presentó con 736,97 € de IVA? ¿Y el del T2, con qué cifra? Administración:
    ¿qué pagaron los clientes de `-105`, `-106`, `-107` y `-108`?»
- **Dependientes**: gestoría (303 del T1 y T2 de 2026); Hacienda; gerencia.
- **Tratamiento**: documentar sin especificar. El equipo técnico no decide ni ejecuta nada
  sobre declaraciones presentadas. Si procede una complementaria, la deciden gestoría y
  gerencia (acta, PD-04).
- **Decisión pendiente**: si se regulariza el IVA de 2026 y cómo. Responsables:
  **Gestoría** y **Gerencia**.
- **Fuentes**: ENT-P1, ENT-P1-bis, A-01, R36, MH-31.

---

## 2. Tabla resumen

| ID | Anomalía | Clasificación | Tratamiento | Decisión pendiente (responsable) |
|---|---|---|---|---|
| A-01 | Cabecera ≠ líneas; IVA de informe ≠ CSV | PENDIENTE | Especificar las dos fuentes tal cual; documentar los 6 documentos; corregir hacia delante | Fuente de verdad del IVA y si se rectifica (Gestoría, Gerencia) |
| A-02 | Redondeo línea a línea (protegido) | PENDIENTE | Especificar tal cual | Confirmación (Gestoría) |
| A-03 | Remesa no idempotente | BUG A SECAS | Corregir; no retroactiva | Causa de `FA-2026-000106` (Administración) |
| A-04 | Mes de baja facturado dos veces | PENDIENTE | Especificar tal cual | Vía única para el mes de baja (Administración, Gerencia) |
| A-05 | Facturar a clientes de baja | PENDIENTE | Especificar tal cual | Política de bajas (Gerencia) |
| A-06 | Importes con miles leídos ×1/1000 | BUG A SECAS | Corregir manteniendo el punto decimal | — |
| A-07 | Frontera de 5.000 € | PENDIENTE | Especificar tal cual | Tramo de 5.000 € exactos (Gerencia) |
| A-08 | Rectificar cobrada / cobrar RE | PENDIENTE | Especificar tal cual | Procedimiento de devolución (Gestoría, Administración) |
| A-09 | Negativos y FA con total negativo | PENDIENTE | Especificar tal cual | Abonos parciales (Gestoría, Administración) |
| A-10 | Año del número = reloj | PENDIENTE | Especificar tal cual; nunca retroactiva | Año legal de la serie (Gestoría) |
| A-11 | Numeración no atómica | BUG A SECAS | Corregir; no retroactiva | — |
| A-12 | Huecos por reserva previa | BUG A SECAS | Corregir; no retroactiva | — |
| A-13 | Alta sin transacción | BUG A SECAS | Corregir; no retroactiva | — |
| A-14 | Rectificación sin transacción | BUG A SECAS | Corregir manteniendo el espejo | — |
| A-15 | Reimpresión con datos vivos | BUG A SECAS | Corregir; no retroactiva con fidelidad | — |
| A-16 | RE fechada hoy, otro trimestre | PENDIENTE | Especificar tal cual | Trimestre de la RE (Gestoría) |
| A-17 | BD se recrea con la semilla | BUG A SECAS | Corregir conservando la semilla | — |
| A-18 | BD analizada = semilla | PENDIENTE | Documentar; repetir la arqueología | Acceso a la BD real (Gerencia, Administración) |
| A-19 | Formato de número y series | INTENCIONAL | Especificar tal cual | — |
| A-20 | Las facturas no se borran | INTENCIONAL | Especificar tal cual | — |
| A-21 | Rectificativa espejo exacto | INTENCIONAL | Especificar tal cual | — |
| A-22 | NIF solo por longitud | PENDIENTE | Especificar tal cual | NIF reales y revisión manual (Administración, Gestoría) |
| A-23 | Dos fórmulas de prorrateo (protegido) | PENDIENTE | Especificar las dos tal cual | Fórmula y vía (Gestoría, Gerencia) |
| A-24 | 1.000,00 € no descuentan | INTENCIONAL | Especificar tal cual | — |
| A-25 | Tramo con base bruta | PENDIENTE | Especificar tal cual | Base de referencia (Gerencia) |
| A-26 | Descuento sin distinguir sector | PENDIENTE | Especificar tal cual | Alcance del descuento (Gerencia) |
| A-27 | Descuento en remesa sin constancia | PENDIENTE | Especificar tal cual | Descuento en cuotas (Gerencia) |
| A-28 | Descuento en precio unitario; FA-105 (protegido) | PENDIENTE | Especificar la regla; documentar FA-105 | Confirmación (Gestoría) |
| A-29 | IVA libre y recargo 0 fuera de tabla | PENDIENTE | Especificar tal cual | Tipos usados (Gestoría) |
| A-30 | Fechas de baja sin validar | BUG A SECAS | Corregir sin tocar fórmulas | — |
| A-31 | Fronteras de la remesa | PENDIENTE | Especificar tal cual | Día de alta/baja (Gerencia) |
| A-32 | Datos que el código no genera | PENDIENTE | Documentar sin especificar | Ediciones manuales de la BD (Administración, Gerencia) |
| A-33 | Panel de pendientes | PENDIENTE | Especificar tal cual | Definición de «pendiente» (Administración) |
| A-34 | Formato y redondeo al mostrar | ACCIDENTAL | Documentar; CSV tal cual | Formato del panel (Administración) |
| A-35 | Vencimiento según zona horaria | BUG A SECAS | Corregir igualando a Madrid | — |
| A-36 | Plazo 0 → 30 días | PENDIENTE | Especificar tal cual | Significado de 0 días (Administración) |
| A-37 | Días naturales, 30 por defecto | INTENCIONAL | Especificar tal cual | — |
| A-38 | Valores por defecto duplicados | ACCIDENTAL | Corregir sin cambiar valores | — |
| A-39 | Recargos de tipos antiguos | PENDIENTE | Especificar tal cual | Ejercicios reabribles (Gestoría) |
| A-40 | Formato y clave del CSV | PENDIENTE | Especificar byte a byte | Confirmación (Gestoría) |
| A-41 | CSV sin escapar | BUG A SECAS | Corregir de acuerdo con la gestoría | Forma de corregirlo (Gestoría) |
| A-42 | Periodos sin validar | BUG A SECAS | Corregir | — |
| A-43 | Trimestre «-31» como texto | ACCIDENTAL | Especificar el resultado | — |
| A-44 | Fecha manual sin validar | BUG A SECAS | Corregir | — |
| A-45 | Importes vacíos o no numéricos | BUG A SECAS | Corregir | — |
| A-46 | Sin autenticación | PENDIENTE | Documentar | Acceso externo y permisos (Gerencia) |
| A-47 | Secretos en claro | BUG A SECAS | Corregir sin cambiar la clave | Estado de la cuenta SMTP (Responsable del correo) |
| A-48 | Correo no-op | PENDIENTE | Especificar tal cual | Reactivar o no (Responsable del correo, Administración) |
| A-49 | Teléfono «XXX» | PENDIENTE | Especificar tal cual | Valor real (Administración) |
| A-50 | Escrituras concurrentes en SQLite | BUG A SECAS | Corregir | — |
| A-51 | Copias manuales | PENDIENTE | Documentar | Riesgo aceptado (Gerencia) |
| A-52 | Sin integridad referencial | ACCIDENTAL | Corregir tras revisar el histórico | — |
| A-53 | Maestros sin validación | BUG A SECAS | Corregir | — |
| A-54 | Errores al usuario | BUG A SECAS | Corregir | — |
| A-55 | Dependencias con avisos | BUG A SECAS | Corregir en modernización | — |
| A-56 | `config.js` no renombrar, dos rutas | PENDIENTE | Especificar tal cual | Motivo y ruta real (Administración) |
| A-57 | Runtime Node | ACCIDENTAL | Documentar | — |
| A-58 | Versiones con `^` | ACCIDENTAL | Corregir en modernización | — |
| A-59 | Sin tests | ACCIDENTAL | Caracterizar ahora | — |
| A-60 | Código y documentación muertos | ACCIDENTAL | Documentar | — |
| A-61 | IVA declarado por cabeceras, cobrado por líneas (añadida tras el acta) | PENDIENTE | Documentar sin especificar | Regularización del IVA de 2026 (Gestoría, Gerencia) |

Recuento: 5 INTENCIONAL, 0 BUG HISTÓRICO CON DEPENDIENTES, 19 BUG A SECAS, 8 ACCIDENTAL y
**28 PENDIENTE** (60 entradas). Ninguna entrada se ha podido clasificar como bug histórico con dependientes
sin el testimonio del negocio: las candidatas (A-01, A-32, A-49) están en PENDIENTE.

Recuento tras propagar el acta simulada (2026-11-11): 5 INTENCIONAL, 0 BUG HISTÓRICO CON
DEPENDIENTES, 19 BUG A SECAS, 8 ACCIDENTAL y **29 PENDIENTE** (61 entradas). El acta no
cierra ninguna PENDIENTE (§6) y añade A-61.

---

## 3. Matriz de trazabilidad (ninguna entrada huérfana)

Cada identificador de las fuentes aparece al menos una vez. «Excluida» indica una entrada
que no cumple los criterios de entrada del encargo, con el motivo.

### 3.1 `reglas-de-negocio.md`

| Regla | Clasif. de origen | Entrada | | Regla | Clasif. de origen | Entrada |
|---|---|---|---|---|---|---|
| RN-01 | INTENC. (incidente 2019) | A-02 | | RN-29 | ACCID. | A-06 |
| RN-02 | INTENC. (incidente 2019) | A-02 | | RN-30 | ACCID. | A-44, A-10 |
| RN-03 | INTENC. (`==` laxo sin señal) | A-29 | | RN-31 | INTENC. / ACCID. | A-37, A-36 |
| RN-04 | INTENC. / ACCID. | A-39, A-29 | | RN-32 | DUDOSA | A-35, A-37 |
| RN-05 | INTENC. (incidente 2019) | A-02 | | RN-33 | INTENC. sin incidente | Excluida |
| RN-06 | INTENC. sin incidente | Excluida | | RN-34 | ACCID. | A-13 |
| RN-07 | INTENC. / DUDOSA | A-24, A-07 | | RN-35 | INTENC. (inspección 2020) | A-19 |
| RN-08 | DUDOSA | A-25 | | RN-36 | INTENC. (inspección 2020) | A-19 |
| RN-09 | INTENC. («no tocar», Constitución) | A-28 | | RN-37 | ACCID. | A-10 |
| RN-10 | DUDOSA | A-26 | | RN-38 | ACCID. | A-12 |
| RN-11 | ACCID. | A-27 | | RN-39 | ACCID. | A-11 |
| RN-12 | ACCID. | A-09, A-45 | | RN-40 | INTENC. (inspección 2020) | A-19 |
| RN-13 | ACCID. | A-29 | | RN-41 | INTENC. (inspección 2020) | A-20 |
| RN-14 | INTENC. («no tocar», Constitución) | A-23 | | RN-42 | INTENC. / ACCID. | A-08 |
| RN-15 | INTENC. («no tocar») | A-23 | | RN-43 | INTENC. («no tocar») | A-21 |
| RN-16 | ACCID. | A-30 | | RN-44 | INTENC. / DUDOSA | A-08 |
| RN-17 | DUDOSA | A-23 | | RN-45 | ACCID. | A-16, A-14 |
| RN-18 | INTENC. (doble vía) | A-04 | | RN-46 | INTENC. sin incidente | A-01 (contexto) |
| RN-19 | DUDOSA | A-31 | | RN-47 | ACCID. | A-43, A-16 |
| RN-20 | DUDOSA | A-23 | | RN-48 | ACCID. | A-42 |
| RN-21 | ACCID. | A-31 | | RN-49 | INTENC. («no cambiar») | A-40 |
| RN-22 | INTENC. sin incidente | Excluida (el texto de la línea que no casa con los datos va en A-32) | | RN-50 | DUDOSA | A-01 |
| RN-23 | INTENC. / ACCID. | A-37, A-38 | | RN-51 | INTENC. (incidente 2019) | A-02 |
| RN-24 | ACCID. | A-03 | | RN-52 | ACCID. | A-34 |
| RN-25 | ACCID. | A-27 | | RN-53 | INTENC. / ACCID. | A-35 |
| RN-26 | DUDOSA | A-23, A-04 | | RN-54 | INTENC. / ACCID. | A-42 |
| RN-27 | INTENC. / ACCID. | A-05 | | RN-55 | INTENC. provisional | A-22 |
| RN-28 | INTENC. sin incidente | Excluida | | | | |

Discrepancias: RN·D-01 → A-24, A-07 · D-02 → A-26 · D-03 → A-23 · D-04 → A-23, A-30 ·
D-05 → A-12 · D-06 → A-11 · D-07 → A-35 · D-08 → A-38 · D-09 → A-23 · D-10 → A-01, A-32 ·
D-11 → A-29 · D-12 → A-16 · D-13 → A-10 · D-14 → A-22 · D-15 → A-14.

Hallazgos de datos: RN·H-01 → A-01 · H-02 → A-32 · H-03 → A-32 · H-04 → A-28, A-01 ·
H-05 → A-03 · H-06 → A-27.

Preguntas: Q-01 → A-39 · Q-02 → A-07 · Q-03 → A-25 · Q-04 → A-26 · Q-05 → A-23 · Q-06 → A-31
· Q-07 → A-23 · Q-08 → A-03 · Q-09 → A-04 · Q-10 → A-05 · Q-11 → A-06 · Q-12 → A-36 · Q-13 →
A-35 · Q-14 → A-10 · Q-15 → A-11 · Q-16 → A-08 · Q-17 → A-01 · Q-18 → A-01, A-32 · Q-19 →
A-23, A-26 · Q-20 → excluida (alcance del análisis, no es una anomalía).

### 3.2 Contradicciones

C-01 → A-23, A-04, A-30 · C-02 → A-38 · C-03 → A-06 (lectura), A-34 (redondeo y formato) ·
C-04 → A-35, A-43 · C-05 → A-10 · C-06 → A-01, A-21 · C-07 → A-33 · C-08 → A-05 · C-09 → A-08
· C-10 → A-03 (remesa), A-13 (alta), A-14 (rectificativa), A-27 (constancia del descuento).

QC-01 → A-23 · QC-02 → A-04 · QC-03 → A-23 · QC-04 → A-23 · QC-05 → A-38 · QC-06 → A-38,
A-56 · QC-07 → A-34 · QC-08 → A-06 · QC-09 → A-34 · QC-10 → A-35 · QC-11 → A-35 · QC-12 →
A-10 · QC-13 → A-10 · QC-14 → A-18 · QC-15 → A-01 · QC-16 → A-01 · QC-17 → A-01, A-28 · QC-18
→ A-33 · QC-19 → A-33 · QC-20 → A-05 · QC-21 → A-05 · QC-22 → A-08 · QC-23 → A-08 · QC-24 →
A-03 · QC-25 → A-32 · QC-26 → A-27.

### 3.3 `registro-riesgos.md`

| Riesgo | Entrada | Riesgo | Entrada | Riesgo | Entrada |
|---|---|---|---|---|---|
| R-1 | A-01 | R-13 | A-02 | R-25 | A-08 |
| R-2 | A-10 | R-14 | A-35 | R-26 | A-55 |
| R-3 | A-11 | R-15 | A-22 | R-27 | A-50 |
| R-4 | A-17 | R-16 | A-47 | R-28 | A-57 |
| R-5 | A-23, A-04 | R-17 | A-48 | R-29 | A-41 |
| R-6 | A-46 | R-18 | A-59 | R-30 | A-30, A-42, A-44 |
| R-7 | A-03 | R-19 | A-13 | R-31 | A-53 |
| R-8 | A-15 | R-20 | A-51 | R-32 | A-34 |
| R-9 | A-14 | R-21 | A-52 | R-33 | A-60 |
| R-10 | A-12, A-45 | R-22 | A-49 | R-34 | A-58 |
| R-11 | A-09, A-29, A-44, A-45 | R-23 | A-33 | R-35 | A-54 |
| R-12 | A-05 | R-24 | A-24 | | |

Discrepancias: R·D1 → A-12 · D2 → A-11 · D3 → A-24 · D4 → A-23, A-30 · D5 → A-13 · D6 → A-17
· D7 → A-01 · D8 → A-38 · D9 → A-60 · D10 → A-22 · D11 → A-04.

Suposiciones: R·S1 → A-03 · S2 → A-04 · S3 → A-10 · S4 → A-18 · S5 → A-48 · S6 → A-47 · S7 →
A-18, A-50 · S8 → A-46.

### 3.4 `memoria-historica.md`

| Entrada | Tipo | Registro | Entrada | Tipo | Registro |
|---|---|---|---|---|---|
| MH-01 | Decisión / práctica | A-23 | MH-16 | Abandonado | A-60 |
| MH-02 | No tocar | A-39 | MH-17 | Decisión menor | Excluida (ni discrepancia ni «no tocar») |
| MH-03 | No tocar | A-02, A-35 | MH-18 | Incidente + no tocar | A-48 |
| MH-04 | Decisión | A-39 | MH-19 | Decisión | A-48 |
| MH-05 | Abandonado | A-22 | MH-20 | Incidente | A-13, A-32 |
| MH-06 | Incidente + decisión | A-50 | MH-21 | Decisión + no tocar | A-21, A-09 |
| MH-07 | Decisión | A-24, A-26 | MH-22 | No tocar | A-24 |
| MH-08 | Decisión | A-28 | MH-23 | Abandonado | A-60 |
| MH-09 | Abandonado | A-60 | MH-24 | Práctica | A-04 |
| MH-10 | Incidente | A-35 | MH-25 | Práctica | A-51 |
| MH-11 | Decisión + no cambiar | A-40 | MH-26 | No tocar + discrepancia | A-56 |
| MH-12 | Incidente + no tocar | A-02 | MH-27 | Práctica | A-01 |
| MH-13 | Incidente legal + no tocar | A-19, A-20 | MH-28 | Incidente | A-03 |
| MH-14 | Incidente | A-11 | MH-29 | No tocar | A-17 |
| MH-15 | Decisión / práctica | A-23, A-03 | MH-30 | Discrepancia | A-60 |

---

## 4. Qué no se ha podido verificar

- **Ningún testimonio de negocio** salvo el de S4, sin nombre (§0.2).
- **Ningún camino de escritura se ha ejecutado** (alta, remesa, rectificación, numeración): los
  fallos de A-11 a A-14, A-17, A-42, A-44, A-45 y A-50 son deducciones del código.
- **Los veredictos de DATOS se basan en 9 facturas** de enero a mayo de 2026 (A-18). «0 casos»
  significa «0 casos en la muestra», no en el histórico.
- **No se ha consultado el historial de git del producto original** (el repositorio solo
  contiene esta fase documental).

---

## 5. Clasificaciones PENDIENTES: agenda de la próxima conversación con el negocio

La lista **no está vacía**: **28 entradas PENDIENTE**. No se deben escribir las specs formales
hasta cerrarlas.

> *Actualización del 2026-11-11, tras propagar la entrevista simulada (§6)*: la lista sigue
> sin estar vacía y pasa a **29 entradas PENDIENTE** (se añade A-61). Cambia la pregunta 2
> (A-01) y se añade la 32 (A-61). El resto de preguntas siguen igual; el acta incluye para
> cada una una respuesta propuesta que el negocio debe aceptar, corregir o rechazar
> (`entrevista-negocio-simulada.md` §2 y §5).

Están agrupadas por interlocutor y, dentro de cada grupo, por impacto
económico. La primera pregunta condiciona la validez de los DATOS de todo el registro.

### 5.0 Condición previa (Gerencia y Administración)

| # | Entrada | Pregunta exacta |
|---|---|---|
| 1 | A-18 | ¿Quién confirmó el 2026-11-11 que `datos/gesfact.db` es producción? ¿Dónde está el fichero que usa la oficina, con las facturas desde 2018? ¿Se puede obtener una copia de solo lectura para repetir la arqueología de datos (AD-01 a AD-15) sobre todo el histórico? |

### 5.1 Gestoría (contacto actual; Puri en 2018-2019)

| # | Entrada | Pregunta exacta |
|---|---|---|
| 2 | A-01 | *Pregunta original (2026-11-11, consolidación)*: Para el T1 de 2026, ¿qué IVA presentasteis en el modelo 303: 603,66 € (suma de líneas, pantalla de IVA) o 736,97 € (cabeceras, CSV)? ¿Qué cifra tomáis como buena en `FA-2026-000101`, `-105`, `-106`, `-107` y `-108`? · *Pregunta vigente (tras el acta)*: el acta recoge «736,97 €, el CSV» sin persona identificada. Nombre y cargo de quien lo confirma, y fecha. ¿Qué cifra tomáis como buena en `-105`, `-106`, `-107` y `-108`? |
| 3 | A-02 | ¿Confirmáis que el Contaplus exige IVA y recargo redondeados línea a línea, incluido el efecto en medios céntimos (1,005 → 1,00)? ¿Conserváis la lista de diferencias del trimestre devuelto en 2019? |
| 4 | A-23 | ¿El prorrateo de una cuota debe hacerse sobre 30 días o sobre los días reales del mes? Un servicio de todo febrero, ¿cobra la cuota entera o 28/30? (Junto con las preguntas 15, a Gerencia, y 23, a Administración.) |
| 5 | A-08 | ¿Se puede rectificar una factura ya cobrada? Si sí, ¿cómo se documenta la devolución? ¿Una rectificativa se cobra o se paga alguna vez y en qué estado debe quedar? |
| 6 | A-09 | Cuando un cliente devuelve parte de la mercancía, ¿qué documento se emite y en qué serie? ¿Son aceptables líneas negativas en una factura FA? |
| 7 | A-10 | La numeración «por serie y año», ¿va por el año de expedición o por el de la fecha impresa? ¿Qué se acordó tras la inspección de 2020? |
| 8 | A-16 | ¿La rectificativa debe llevar su propia fecha y declararse en su trimestre, o debe compensar en el trimestre de la original? |
| 9 | A-28 | ¿El descuento por volumen debe verse rebajado en el precio de cada línea? ¿Cómo os llegó `FA-2026-000105` (líneas sin descuento, total 2.756,38 €)? |
| 10 | A-29 | ¿Se ha facturado con un IVA distinto de 21, 10 o 4 % (0 %, 5 %)? ¿Qué recargo corresponde en esos casos? |
| 11 | A-39 | ¿Puede hacer falta reabrir un ejercicio con IVA 16/18/7/8 %? ¿Hasta qué año? |
| 12 | A-40 | ¿Seguís importando el CSV en el Contaplus con este formato? ¿Para qué sirve la clave de la primera línea? ¿Os importa el orden de las filas? (Si es posible, enviadnos un CSV ya recibido.) |
| 13 | A-22 | ¿Habéis tenido rechazos de NIF de clientes de Suministros Hidalgo? (Junto con la pregunta 26 a Administración.) |

### 5.2 Gerencia de Suministros Hidalgo

| # | Entrada | Pregunta exacta |
|---|---|---|
| 14 | A-07 | Una factura con base de 5.000,00 € exactos, ¿lleva el 2 % o el 5 %? |
| 15 | A-23 | ¿Quién decidió en 2021 que la remesa prorrateara por días reales? ¿Quién es Paco y está escrito su criterio de 30 días? |
| 16 | A-05 | Cuando un cliente se da de baja, ¿sus contratos deben dejar de facturarse? ¿Se le debe poder emitir una factura manual después? |
| 17 | A-25 | El tramo del descuento, ¿se decide con el importe antes del descuento o después? |
| 18 | A-26 | ¿El descuento por volumen es para todos los clientes o solo para hostelería? ¿Algún cliente tiene un acuerdo distinto? ¿Está escrito el acuerdo de 2018? |
| 19 | A-27 | ¿Los alquileres y mantenimientos deben llevar descuento por volumen? Si lo llevan, ¿debe constar en la factura? |
| 20 | A-31 | Un contrato dado de baja el día 1, ¿factura ese día? ¿Y uno dado de alta el último día del mes? |
| 21 | A-46 | ¿Se accede a GesFact desde fuera de la oficina? ¿Quién debe poder emitir, cobrar y rectificar? |
| 22 | A-51 | ¿Se acepta el riesgo de las copias semanales en pendrive? ¿Se ha probado alguna restauración? ¿Quién la hace si Marga no está? |

### 5.3 Administración (Marga)

| # | Entrada | Pregunta exacta |
|---|---|---|
| 23 | A-23 | ¿Qué importe se facturó por el alta del contrato 4 en febrero de 2026 (54,45 € o 50,82 € con IVA) y por el del contrato 2 en enero de 2023? |
| 24 | A-04 | Cuando se da de baja un contrato a mitad de mes, ¿quién factura ese mes: la remesa, la factura manual o las dos? ¿Se ha cobrado alguna vez dos veces? |
| 25 | A-32 | ¿Quién añadió a mano las líneas de café, azúcar y vasos a las facturas de remesa `-101`, `-106` y `-108`, y quién tecleó los importes de «Portes»? ¿Se edita la BD directamente? ¿Con qué versión de GesFact se emitieron? |
| 26 | A-22 | ¿Los NIF de los clientes 2 a 6 son los reales? ¿Sigues revisando cada NIF a mano? |
| 27 | A-33 | ¿Una rectificativa debe contar como pendiente de cobro y restar del importe pendiente? «Facturas emitidas (total histórico)», ¿debe incluir rectificativas y rectificadas? |
| 28 | A-36 | Un cliente con plazo de pago 0 días, ¿es «al contado» o «plazo por defecto»? |
| 29 | A-49 | Las facturas que reciben los clientes, ¿llevan el teléfono «925 511 XXX» o el completo? |
| 30 | A-56 | ¿Por qué no se puede renombrar `config.js`? ¿Cuál es la carpeta real del programa: `\\SERVIDOR\gesfact` o `\\SERVIDOR\compartido\gesfact`? |

### 5.4 Responsable del correo (Manoli) y Administración

| # | Entrada | Pregunta exacta |
|---|---|---|
| 31 | A-48 | ¿Por qué hay que consultar contigo antes de reactivar el correo? ¿Se decidió no reactivarlo? ¿Se lleva control de qué facturas se han enviado y a quién? |

Las entradas A-01, A-22 y A-23 tienen preguntas en más de un grupo: solo se cierran cuando se
han respondido todas.

### 5.4-bis Añadida tras la entrevista simulada (Gestoría, Gerencia y Administración)

| # | Entrada | Pregunta exacta |
|---|---|---|
| 32 | A-61 | Gestoría (persona identificada): ¿el 303 del T1 de 2026 se presentó con 736,97 € de IVA? ¿Y el del T2, con qué cifra? Administración: ¿qué pagaron los clientes de `FA-2026-000105`, `-106`, `-107` y `-108`? Gestoría y Gerencia: ¿se regulariza el IVA de 2026, y quién lo decide por escrito? |

### 5.5 Preguntas que no bloquean ninguna clasificación

Sirven para completar la historia y fijar precauciones; no impiden escribir las specs:
causa de `FA-2026-000106` (A-03); facturas duplicadas de enero de 2021 (A-11); factura arreglada
a mano en la BD (A-13); uso de los datos semilla por administración (A-17); acta de la
inspección de 2020 (A-19); zona horaria del servidor y factura de marzo de 2019 (A-35); si el
plazo por defecto es un parámetro y si hay dos `config.js` (A-38); cómo escapar el CSV sin
romper la importación (A-41); estado de la cuenta SMTP (A-47); ubicación de la BD y quién
arranca el servidor (A-50); si Julián y Roberto siguen localizables (A-59); migración a MySQL y
módulo de albaranes (A-60); importes tecleados con punto de millares (A-06); formato del panel
(A-34).

---

## 6. Propagación de la entrevista simulada (2026-11-11)

Fuente: `entrevista-negocio-simulada.md`. Regla aplicada: una PENDIENTE solo se cierra con
un testigo NEGOCIO válido, es decir, una persona identificada con nombre y fecha
(Principio II; §0.3). El acta no contiene ninguno:

- **P1, P1-bis y P1-ter** son respuestas del cliente simulado sin persona identificada. Se
  anotan como evidencia provisional, pero no cuentan como testigo.
- **P2 a P21** son propuestas del consultor. Son recomendaciones o suposiciones, no
  testimonio, y no se anotan como evidencia NEGOCIO.

Resultado: **0 PENDIENTES cerradas, 0 clasificaciones cambiadas, 1 entrada nueva (A-61).**

### 6.1 Registro de cambios de clasificación

| Entrada | Pregunta del acta | Origen de la respuesta | Antes | Después | Motivo |
|---|---|---|---|---|---|
| A-01 | P1, P1-bis, P1-ter | Cliente simulado, sin identificar | PENDIENTE | PENDIENTE | Falta persona identificada (PD-08). Clasificación propuesta al identificarla: BUG HISTÓRICO CON DEPENDIENTES (ver la entrada) |
| A-04 | P2 | Consultor; el hecho queda sin respuesta concluyente | PENDIENTE | PENDIENTE | No es testimonio |
| A-08 | P3 | Consultor | PENDIENTE | PENDIENTE | No es testimonio |
| A-09 | P4 | Consultor; el hecho queda sin respuesta concluyente | PENDIENTE | PENDIENTE | No es testimonio |
| A-05 | P5 | Consultor | PENDIENTE | PENDIENTE | No es testimonio |
| A-27 | P6 | Consultor | PENDIENTE | PENDIENTE | No es testimonio |
| A-07 | P7 | Consultor | PENDIENTE | PENDIENTE | No es testimonio |
| A-26 | P8 | Consultor; el hecho queda sin respuesta concluyente | PENDIENTE | PENDIENTE | No es testimonio |
| A-25 | P9 | Consultor | PENDIENTE | PENDIENTE | No es testimonio |
| A-23 | P10 | Consultor; el hecho queda sin respuesta concluyente | PENDIENTE | PENDIENTE | No es testimonio |
| A-28 | P11 | Sin respuesta concluyente | PENDIENTE | PENDIENTE | No es testimonio |
| A-02 | P12 | Sin respuesta concluyente | PENDIENTE | PENDIENTE | No es testimonio |
| A-31 | P13 | Consultor | PENDIENTE | PENDIENTE | No es testimonio |
| A-36 | P14 | Consultor | PENDIENTE | PENDIENTE | No es testimonio |
| A-10 | P15 | Consultor | PENDIENTE | PENDIENTE | No es testimonio |
| A-16 | P16 | Consultor | PENDIENTE | PENDIENTE | No es testimonio |
| A-22 | P17 | Consultor; el hecho queda sin respuesta concluyente | PENDIENTE | PENDIENTE | No es testimonio |
| A-29 | P18 | Consultor; el hecho queda sin respuesta concluyente | PENDIENTE | PENDIENTE | No es testimonio |
| A-32 | P19 | Consultor; el hecho queda sin respuesta concluyente | PENDIENTE | PENDIENTE | No es testimonio |
| A-18 | P20 | Sin respuesta concluyente | PENDIENTE | PENDIENTE | No es testimonio; sigue siendo la condición previa |
| A-33, A-39, A-40, A-46, A-48, A-49, A-51, A-56 | P21 | Consultor o sin respuesta concluyente | PENDIENTE | PENDIENTE | No es testimonio |
| A-61 | P1 + P1-bis (información nueva) | Cliente simulado, sin identificar | — | PENDIENTE (nueva) | Hecho fiscal no documentado antes |

Las entradas que no se preguntaron no cambian: las INTENCIONAL, las ACCIDENTAL y las BUG A
SECAS.

### 6.2 Entradas nuevas en otros documentos

| Documento | Entrada | Origen |
|---|---|---|
| `registro-riesgos.md` | R36 (IVA declarado distinto del cobrado) y nota en S4 | ENT-P1, ENT-P1-bis |
| `memoria-historica.md` | H-31 (práctica: la gestoría declara con el CSV) y H-32 (decisión: rectificar las 6 facturas) | ENT-P1, ENT-P1-bis, ENT-P1-ter |

### 6.3 Estado de la lista PENDIENTE

**No está vacía: 29 entradas** (A-01, A-02, A-04, A-05, A-07, A-08, A-09, A-10, A-16, A-18,
A-22, A-23, A-25, A-26, A-27, A-28, A-29, A-31, A-32, A-33, A-36, A-39, A-40, A-46, A-48,
A-49, A-51, A-56, A-61). Esa lista, con las preguntas de §5 y la sección «Pendiente para
próxima ronda» del acta, es la agenda de la siguiente conversación con el negocio. **El
reconocimiento no está listo para pasar a specs formales.**
