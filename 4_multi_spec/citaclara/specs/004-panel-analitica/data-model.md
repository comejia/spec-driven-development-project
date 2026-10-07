# Data Model — Panel de Analítica (004)

**Fase 1 de `/speckit.plan`.** La 004 **no crea ni modifica entidades**: consume y agrega las
de la 001 (solo lectura). Este documento describe (1) las entidades leídas y (2) las
estructuras calculadas (view models) que el servicio de analítica devuelve.

## Entidades consumidas (propiedad de la 001, solo lectura)

| Entidad | Campos usados | Uso en la 004 |
|---------|---------------|---------------|
| `clinica` | `id` | Ámbito y aislamiento de todos los cálculos (FR-012); la clave autoriza (FR-001). |
| `profesional` | `id`, `nombre`, `especialidad` | Dimensión de agrupación de ocupación y tasa. |
| `servicio` | `id`, `nombre`, `precioCentimos` | Importe (céntimos) e ingresos por servicio (FR-004). |
| `cita` | `id`, `profesionalId`, `servicioId`, `estado`, `inicio`, `fin` | Fuente de todos los indicadores: estado (ingresos/tasa/ocupación), franja `[inicio, fin)` (minutos de ocupación), servicio (ingresos). |

Estados de `cita` (enum de la 001): `reservada`, `completada`, `cancelada`, `no_asistida`.
Significado de `no_asistida`: **propiedad de la 001 (FR-009)**; la 004 lo cita, no lo redefine
(FR-006b).

**Reglas de consumo (referencias, no redefiniciones):**

- **Estados que ocupan hueco** = `reservada` + `completada`, por referencia a la regla
  anti-solape de la 001 (FR-010, RN1). La 004 no publica una constante con nombre propia (S5).
  Nota de dependencia: si la 001 cambia qué estado ocupa, revisar FR-007 (FR-007b).
- **Precio**: se usa el precio vigente del servicio; la 001 no guarda histórico de precios
  (Assumption de la spec).

## Estructuras calculadas (view models de la 004)

Todas se calculan por clínica autenticada, en `Europe/Madrid`, y aplican la regla "sin datos"
(FR-010) cuando el denominador o la base es cero.

### 1. `IngresosPorServicio`

```
IngresosPorServicio {
  servicios: Array<{
    servicioId: string
    nombre: string
    citasCompletadas: number      // conteo de citas 'completada' del servicio
    ingresosCentimos: number      // citasCompletadas * precioCentimos (entero)
    ingresos: string              // formateado es-ES, p. ej. "10.250,00 €"
  }>                              // ordenado por ingresosCentimos desc
  totalCentimos: number           // sumarCentimos(...) exacto
  total: string                   // "31.425,00 €"
  sinDatos: boolean               // true si no hay ninguna cita completada
}
```

- Regla: solo `estado = 'completada'` aporta importe (FR-004). Reservada/cancelada/no_asistida
  aportan 0 (Acceptance US2.3).
- Invariante: `totalCentimos == Σ ingresosCentimos` (SC-001, 0 céntimos de descuadre).

### 2. `TasaNoAsistenciaPorProfesional`

```
TasaNoAsistencia {
  profesionales: Array<{
    profesionalId: string
    nombre: string
    especialidad: string
    noAsistidas: number
    citasPasadasConDesenlace: number  // completada + cancelada + no_asistida
    tasaPorcentaje: number | null     // null => "sin datos" (denominador 0)
    tasaTexto: string                 // "11,3 %" o "sin datos"
    lecturaLiteral: string            // "de cada 100 citas pasadas, ~11 terminaron en no asistida"
  }>
  notaEfectoCancelacion: string       // FR-006c, mostrada siempre (SC-010)
}
```

- Fórmula (Definición A, FR-006): `noAsistidas ÷ (completada + cancelada + no_asistida)`.
- "Pasadas con desenlace" = estado ≠ `reservada` (FR-006a).
- Denominador 0 → `tasaPorcentaje = null`, texto "sin datos" (US3.3, FR-010).

### 3. `OcupacionSemanalPorProfesional`

```
OcupacionSemanal {
  semanas: Array<{ isoAnio: number; isoSemana: number; etiqueta: string }>  // hasta semana en curso
  series: Array<{
    profesionalId: string
    nombre: string
    puntos: Array<{
      isoSemana: number
      ocupacionPorcentaje: number | null   // null => "sin datos" (jornada 0)
      minutosOcupados: number               // minutos de citas reservada|completada
      minutosJornada: number                // días laborables de la semana * 600
    }>
    ocupacionMedia: number | null           // media aproximada (≈46 %, ≈47 %, ≈41 %)
  }>
}
```

- Numerador: minutos de citas en estado `reservada` o `completada` (referencia 001 FR-010/RN1)
  cuyo `[inicio, fin)` cae en la semana.
- Denominador: 600 min × días laborables de la semana (jornada 09:00–19:00). Semana sin jornada
  → `null` = "sin datos"; nunca > 100 % (US4.3, FR-010).
- Alcance temporal: solo hasta la semana en curso; no se pintan semanas futuras (FR-007a, US4.4).
- Profesional sin citas en una semana con jornada → 0 % (no "sin datos"): la jornada existió
  (Edge Case de la spec).

### 4. `EvolucionOchoSemanas`

```
Evolucion {
  semanas: Array<{
    isoAnio: number
    isoSemana: number
    etiqueta: string                  // "Semana 33 · 11–17 ago" (inequívoca, FR-009)
    citasCompletadas: number
    ingresosCentimos: number
    ingresos: string                  // es-ES
  }>                                  // <= 8, orden cronológico ascendente
  sinDatos: boolean                   // true si no hay ninguna semana con historia
}
```

- Máximo 8 semanas hacia atrás desde la semana en curso (FR-008, SC-006).
- Con menos de 8 semanas de historia se muestran solo las disponibles; no se inventan semanas
  vacías (US5.3).

## Transiciones de estado

No aplica: la 004 es solo lectura y no cambia estados de ninguna entidad.

## Validación

- Entrada del servicio: identificador de clínica de la sesión (obligatorio) y "día de
  referencia" opcional (por defecto hoy en `Europe/Madrid`); validado con Zod. En producción el
  día de referencia es hoy; en pruebas se fija a 16/09/2026 para reproducir los números (FR-014).
