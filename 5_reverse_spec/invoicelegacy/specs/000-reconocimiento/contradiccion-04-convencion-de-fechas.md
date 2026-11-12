# Contradicción 04 — Tres convenciones para tratar una fecha `AAAA-MM-DD`

Documento de solo lectura (Constitución, Principios I, III y IV). **No se decide cuál es
la correcta.** Evidencia: código, **BD** (`sqlite3 -readonly`) y **Entorno** (funciones
puras con distintas `TZ`, sin tocar la BD).

**Estado: divergencia ACTIVA según la zona horaria del equipo; hoy invisible si el
servidor está en una zona con desfase ≥ 0.**

## 1. Implementaciones y qué camino usa cada una

| Convención | Dónde | Qué hace | Caminos que la usan |
|---|---|---|---|
| **C-1 Hora local** | `lib/util.js:10-15` (`hoy`); `:36-39` (`diasDelMes`, `new Date(y, m, 0)`); `lib/numeracion.js:15` y `routes/informes.js:10,15,35` (`new Date().getFullYear()`) | Lee año, mes y día con los métodos *locales* del equipo | Fecha por defecto de factura/rectificativa/contrato (`facturas.js:44,142`; `contratos.js:21,32`); día final de mes de la remesa (`remesa_mensual.js:21`); año del número |
| **C-2 UTC al interpretar, local al leer** | `lib/util.js:20-26` (`sumarDias`) | `new Date('AAAA-MM-DD')` se interpreta como **medianoche UTC**; se suman milisegundos; se leen año/mes/día en **hora local** | Vencimiento en el alta manual (`facturas.js:69`) y en la remesa (`remesa_mensual.js:60`) |
| **C-3 Texto puro** | `lib/util.js:29-33` (`fechaBonita`); `services/calculo.js:96-97`; `scripts/remesa_mensual.js:20-21,45-49,83`; `routes/contratos.js:38`; `routes/informes.js:17-19,38` | `split('-')`, `slice`, concatenar `'-01'`/`'-31'`, comparar cadenas, `LIKE 'AAAA-%'` | Prorrateo, remesa, informes, pantallas |

Duplicación literal adicional: el bloque que formatea «año-mes-día» con ceros
(`util.js:14` y `:25`) está escrito dos veces idéntico.

## 2. ¿Misma convención? Paso a paso

| Operación | C-1 | C-2 | C-3 |
|---|---|---|---|
| Entrada | Reloj del equipo | Texto `AAAA-MM-DD` | Texto |
| Interpretación de la fecha | Local | UTC (por cómo `Date` interpreta el formato ISO sin hora) | No hay objeto `Date`: solo texto |
| Salida | Local | **Local** (mezcla UTC en entrada y local en salida) | Texto |
| Dependiente de la zona horaria | Sí (pero coherente: entra y sale local) | **Sí, de forma incoherente** | No |
| Fin de mes | `new Date(y, m, 0).getDate()` (real, bisiestos incluidos) | — | Informe de IVA: `'-31'` en todos los meses (`informes.js:19`) |
| Inicio de mes | — | — | `mes + '-01'`, `slice(0,8)+'01'` |

El «fin de mes» tiene **tres definiciones**: días reales (`diasDelMes`, remesa),
«31» fijo (informe de IVA) y «30» comercial (prorrateo, ver contradicción 01).

## 3. Ejemplos con resultados distintos para la misma entrada

**3.1 `sumarDias` frente a `hoy` con la misma fecha (C-1 vs C-2)** — **Entorno**,
`sumarDias(hoy(), 0)` debería devolver el mismo día:

| `TZ` | `hoy()` | `sumarDias(hoy(), 0)` |
|---|---|---|
| `Europe/Madrid` | 2026-11-11 | 2026-11-11 |
| `America/Argentina/Buenos_Aires` (UTC−3) | 2026-11-11 | **2026-11-10** |

**Cuantificación**: aplicando `sumarDias(f, 0)` a las 730 fechas de 2025-2026: en
`Europe/Madrid` y `Asia/Tokyo`, **0** difieren; en `America/Argentina/Buenos_Aires` y
`America/New_York`, **730 de 730** (todas, un día antes).

**3.2 Vencimiento real** (**BD** `FA-2026-000101`, fecha 2026-01-31, +30 días):

| `TZ` | Resultado de `sumarDias` |
|---|---|
| `Europe/Madrid` | **2026-03-02** (coincide con la BD) |
| UTC−3 (esta máquina) | **2026-03-01** |

**3.3 Cambio de hora (hipótesis del TODO de marzo de 2019, `util.js:18-19`)**: sobre 2.016
combinaciones (fecha, +0/+30/+60 días) en 2025-2026 no hay **ningún** desfase en
`Europe/Madrid` ni `Atlantic/Canary`, incluidos los cambios de hora de marzo y octubre.
El desfase reproducible depende del signo del desfase horario respecto a UTC, no del
horario de verano.

**3.4 Informe de IVA: «31» fijo frente a días reales**: con fechas válidas el resultado
es el mismo (`'2026-06-30' <= '2026-06-31'` es cierto al comparar texto). Divergiría solo
con una fecha no válida (p. ej. `2026-06-31`) que una factura pudiera tener grabada; el
campo del formulario es `type="date"` (`factura_nueva.ejs:9`), pero el endpoint no
valida el formato (`facturas.js:44`).

## 4. Cuándo se manifiesta y cuándo coinciden

- **Coinciden**: si el equipo que ejecuta el servidor y la remesa está en una zona con
  desfase UTC **mayor o igual a 0** (España, Canarias, Tokio…). Así lo confirman los
  **8 vencimientos** de la BD, todos consistentes con «fecha + 30 o 60 días»
  (`FA-2026-000101` a `-000108`). Esto sugiere que el equipo que los emitió no estaba
  en una zona de desfase negativo, **suponiendo que se emitieron con GesFact** (la BD
  coincide con la semilla de `db.js`; `mapa-sistema.md` P1).
- **Divergen**: en cualquier equipo con desfase negativo (América): **todos** los
  vencimientos saldrían un día antes. Tampoco se descarta que el equipo de 2019 tuviera
  otra configuración; QC-10.
- **Por qué no se ha visto**: el síntoma se confunde con un error de cálculo puntual (así
  lo describe el TODO) y el equipo habitual está en una zona donde no ocurre.
- **C-3** frente a C-1/C-2 no diverge mientras las fechas sean válidas.

## 5. Historia probable (SUPOSICIÓN)

- `hoy()` lleva el comentario «la bd guarda así desde 2018» (`util.js:9`): formato
  fijado al pasar de JSON a SQLite (v2.2, 2018).
- `sumarDias` y `hoy` repiten el mismo bloque de formato; parece que la segunda se
  escribió copiando la primera. La asimetría UTC/local se introduce en `sumarDias` al
  usar `new Date(texto)` en vez de `new Date(y, m-1, d)`.
- En marzo de 2019 se observó «un día menos» (`util.js:18-19`); Julián lo atribuyó al
  cambio de hora sin lograr reproducirlo. Coincide con el mes de la versión 2.3
  (informes, 2019).
- Roberto (remesa, 2021) y quien añadió `contratos.js` usaron texto puro (C-3), el modo
  más directo con fechas `AAAA-MM-DD` y sin pensar en zonas horarias.

## 6. Para el registro de anomalías y para la entrevista

**Entrada propuesta (clasificación: riesgo / rareza)**: «`sumarDias` mezcla UTC y hora
local; con un equipo en zona horaria de desfase negativo, todos los vencimientos
saldrían un día antes. El «fin de mes» tiene tres definiciones (días reales, 31 fijo y
30 comercial)».

**Preguntas al negocio**:
- QC-10. ¿En qué zona horaria y con qué sistema funcionan el servidor y el ordenador
  desde el que se lanza la remesa? ¿Se emitió alguna vez desde otro equipo (portátil,
  teletrabajo, copia en otra región)?
- QC-11. ¿Qué factura de marzo de 2019 salió con el vencimiento un día antes y en qué
  equipo?
