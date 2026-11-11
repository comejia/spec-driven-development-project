# Contradicción 05 — «El año» de una factura: reloj, fecha de factura y fecha de informe

Documento de solo lectura (Constitución, Principios I, III y IV). **No se decide cuál es
la correcta.** Evidencia: código, **BD** (`sqlite3 -readonly`) y deducciones marcadas.
**No se ha ejecutado la numeración ni la remesa** (escriben en la BD): los escenarios de
cambio de año son **deducción del código**.

**Estado: divergencia LATENTE (se manifiesta al cambiar de año); hoy coinciden las 9
facturas de la BD.**

## 1. Implementaciones y qué camino usa cada una

| Definición de «año» | Dónde | Qué decide | Caminos |
|---|---|---|---|
| **A-1 Año del reloj al grabar** | `lib/numeracion.js:15` (`new Date().getFullYear()`) | Año del **número** y qué contador se incrementa (`contadores.anyo`) | Alta manual, remesa, rectificativa (los tres llaman a `siguienteNumero`) |
| **A-2 Año de la `fecha` de la factura (por texto)** | `routes/informes.js:38` (`f.fecha LIKE 'AAAA-%'`) | Qué facturas entran en el CSV de la gestoría | Exportación CSV |
| **A-3 Rango de fechas del trimestre** | `routes/informes.js:17-19,25` | Qué facturas entran en el IVA trimestral | Informe de IVA |
| **A-4 Año actual por defecto** | `routes/informes.js:10,15,35` | Año preseleccionado en informes | Informes |
| **A-5 `fecha` de la propia factura** | Alta manual: libre o `hoy()` (`facturas.js:44`); remesa: **último día del mes facturado** (`remesa_mensual.js:59`); rectificativa: `hoy()` (`facturas.js:142`) | La fecha que se imprime y con la que se agrupa | Los tres caminos |

## 2. ¿Misma convención? Paso a paso

Para una factura concreta, «su año» puede ser tres cosas distintas a la vez:

| Pregunta | Respuesta del sistema | Fuente |
|---|---|---|
| ¿En qué serie y año se numera? | El del reloj en el momento de grabar | A-1 |
| ¿A qué año pertenece en el CSV? | El de su campo `fecha` | A-2 |
| ¿A qué trimestre pertenece en el IVA? | El de su campo `fecha` | A-3 |
| ¿Qué fecha lleva impresa? | La del formulario / último día del mes / hoy | A-5 |

Coinciden **solo** si la fecha de la factura cae en el año en que se graba.

## 3. Ejemplos con resultados distintos para la misma entrada

**3.1 Real (coinciden)**. **BD**: las 9 facturas llevan año de número = año de fecha =
2026 (`GROUP BY substr(numero,4,4), substr(fecha,1,4)` → un único grupo `2026|2026|9`).

**3.2 Remesa de diciembre lanzada en enero (deducción)**. El comentario de la remesa dice
que se lanza «el día 1» con el mes recién terminado (`remesa_mensual.js:5-7`; recordatorio
en `views/index.ejs:9-10`). Para `node scripts/remesa_mensual.js 2026-12` lanzado el
1-ene-2027:

| Campo | Valor |
|---|---|
| `fecha` (A-5) | `2026-12-31` (`remesa_mensual.js:59`) |
| Número (A-1) | `FA-2027-000001`… (el reloj ya marca 2027; contador `FA/2027` se abre a 0 en `numeracion.js:18-23`) |
| Trimestre en el IVA (A-3) | T4 de **2026** |
| Fichero CSV (A-2) | el de **2026** (con número que empieza por 2027) |

**Cuantificación (BD)**: en diciembre de 2026 estarían vigentes los contratos 1, 2 y 4
(el contrato 3 terminó el 15-sep-2025), es decir, **3 facturas** afectadas por cada
remesa de diciembre; la remesa se ejecuta 12 veces al año, así que afecta a **1 de cada
12** (≈ 8,3 %) de las remesas.

**3.3 Alta manual con fecha de otro año (deducción)**. Una factura con fecha 2026-12-30
grabada el 2-ene-2027 recibe número de 2027 y fecha de 2026 (el formulario permite
fecha libre sin validar).

**3.4 Rectificativa**. Fecha `hoy()` y número del año del reloj; si la original es de
diciembre y se rectifica en enero, la original está en el T4 de 2026 y la RE (negativa)
en el T1 de 2027: el informe de IVA no las compensa (ver RN-47).

**3.5 Efecto en pantallas**: tras el 1 de enero, `/informes` preselecciona el año nuevo
(A-4), de modo que las facturas de diciembre solo aparecen eligiendo manualmente 2026.

## 4. Cuándo se manifiesta y cuándo coinciden

- **Coinciden**: toda factura creada y fechada dentro del mismo año natural, que es la
  inmensa mayoría; y las remesas de enero a noviembre lanzadas el día 1 del mes
  siguiente.
- **Divergen**: solo en el cambio de año (diciembre/enero) o con fechas manuales de otro
  año.
- **Por qué no se ha visto**: el desfase afecta una vez al año a unas pocas facturas y
  su efecto (un número de 2027 en una factura de 2026) no rompe ninguna pantalla.
  La BD actual no incluye ningún diciembre.
- **Dato anómalo relacionado (BD)**: el contador `FA/2026` vale **108** pero la BD solo
  contiene 8 facturas FA, numeradas **101 a 108** (no hay `FA-2026-000001` a
  `-000100`). No sé si la BD es una copia parcial o si la numeración arrancó en 100;
  ver QC-14. (`db.js:91-92` dice que son «los datos que había cuando se hizo la
  copia».)

## 5. Historia probable (SUPOSICIÓN)

1. `siguienteNumero` toma el año del reloj porque, en el alta manual, la factura se
   emite «hoy» y reloj y fecha coinciden (salvo fecha manual). La Constitución y el
   comentario legal hablan de «serie y año» sin precisar de qué fecha
   (`numeracion.js:3-6`).
2. El 2-ene-2021 hubo el duplicado (`numeracion.js:8-10`): la corrección tocó la
   lectura del último número, no la definición del año.
3. **Verano de 2021**: la remesa añade un camino donde fecha y momento de grabar se
   separan por diseño (factura del mes pasado emitida hoy). Primer cambio de año con
   remesa: la de diciembre de 2021, lanzada en enero de 2022. Si pasó, no hay rastro
   (la BD solo contiene 2026). QC-12.
4. El informe (2019, v2.3) agrupa por fecha porque así lo pide la gestoría (modelo 303
   trimestral); ninguna de las dos definiciones se escribió pensando en la otra.

## 6. Para el registro de anomalías y para la entrevista

**Entrada propuesta (clasificación: legal / datos)**: «El año del número de factura
sale del reloj (`numeracion.js:15`) y los informes agrupan por la fecha de la factura. La
remesa de diciembre lanzada en enero generaría facturas fechadas en 2026 numeradas en
2027 (3 con los contratos actuales)».

**Preguntas al negocio**:
- QC-12. ¿Se ha lanzado alguna vez la remesa de diciembre en enero? ¿Qué número y fecha
  llevaron esas facturas? ¿La gestoría lo ha reclamado?
- QC-13. ¿La numeración legal «por serie y año» se refiere al año de emisión de la
  factura o al de la fecha impresa? ¿Quién lo ha validado (inspección de 2020)?
- QC-14. ¿Por qué el contador `FA/2026` está en 108 y la BD solo contiene los números 101
  a 108?
