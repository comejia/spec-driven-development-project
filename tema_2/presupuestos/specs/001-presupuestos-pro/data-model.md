# Modelo de Datos: PresupuestosPro v0

## Entidades

### Perfil

Datos del freelancer. Solo existe una instancia (singleton).

| Campo | Tipo | Obligatorio | Validación |
|---|---|---|---|
| nombre | string | sí | No vacío |
| nif | string | sí | No vacío |
| direccion | string | sí | No vacío |
| telefono | string | sí | No vacío |
| email | string | sí | Formato email válido |
| logo | string (Data URL base64) | sí | PNG o JPG, máximo 2 MB antes de codificar |

**Reglas**:
- Todos los campos deben estar completos para que el perfil se considere válido.
- Sin perfil válido no se puede generar ningún PDF.

---

### Servicio

Entrada del catálogo del freelancer.

| Campo | Tipo | Obligatorio | Validación |
|---|---|---|---|
| id | string (UUID) | sí | Generado automáticamente |
| nombre | string | sí | No vacío. Único (comparación insensible a mayúsculas/minúsculas) |
| precio | number | sí | Mayor que 0. Representa base imponible en euros. |

**Reglas**:
- No pueden existir dos servicios cuyo nombre sea igual ignorando mayúsculas/minúsculas.
- Se puede crear, editar y eliminar libremente.

---

### Cliente

Persona o empresa destinataria del presupuesto.

| Campo | Tipo | Obligatorio | Validación |
|---|---|---|---|
| id | string (UUID) | sí | Generado automáticamente |
| nombre | string | sí | No vacío |
| nifCif | string | no | Libre (puede quedar vacío) |
| direccion | string | sí | No vacío |
| email | string | sí | Formato email válido |
| telefono | string | sí | No vacío |
| tipo | enum: "empresa" \| "particular" | sí | Solo estos dos valores |

**Reglas**:
- Un cliente NO se puede eliminar, solo editar.
- El tipo determina si la retención de IRPF se puede aplicar en un presupuesto.

---

### Presupuesto

Documento central de la aplicación.

| Campo | Tipo | Obligatorio | Validación |
|---|---|---|---|
| id | string (UUID) | sí | Generado automáticamente |
| clienteId | string | sí | Debe existir en la lista de clientes |
| clienteSnapshot | object (Cliente) | no | Se rellena al generar el PDF (foto fija) |
| perfilSnapshot | object (Perfil) | no | Se rellena al generar el PDF (foto fija) |
| lineas | array de Línea | sí | Al menos 1 para generar PDF |
| retencion | enum: "ninguna" \| "15" \| "7" | sí | Default: "ninguna" |
| estado | enum: "borrador" \| "numerado" | sí | Default: "borrador" |
| numero | string \| null | no | Formato AAAA-NNN. Solo se asigna al generar PDF. |
| fechaEmision | string (ISO date) \| null | no | Se asigna al generar PDF |
| fechaValidez | string (ISO date) \| null | no | fechaEmision + 30 días |

**Reglas**:
- Un presupuesto nace en estado "borrador" sin número.
- Al generar el PDF pasa a estado "numerado" y se le asigna número, fecha de emisión y validez.
- Al editar un presupuesto "numerado", el original permanece intacto (histórico) y se crea una copia en estado "borrador".
- `clienteSnapshot` y `perfilSnapshot` se guardan al generar el PDF para que el documento sea una foto fija independiente de cambios futuros.

---

### Línea

Concepto individual dentro de un presupuesto.

| Campo | Tipo | Obligatorio | Validación |
|---|---|---|---|
| id | string (UUID) | sí | Generado automáticamente |
| descripcion | string | sí | No vacío |
| cantidad | number | sí | Mayor que 0 |
| precioUnitario | number | sí | Mayor o igual a 0. Base imponible en euros. |

**Reglas**:
- Puede venir del catálogo (precargando nombre y precio, editables) o ser escrita a mano.
- Importe de línea = cantidad × precioUnitario, redondeado a 2 decimales.

---

### Contador

Controla la numeración secuencial de presupuestos.

| Campo | Tipo | Obligatorio | Validación |
|---|---|---|---|
| anio | number | sí | Año en curso (ej: 2026) |
| ultimoNumero | number | sí | Último número asignado en ese año (ej: 3 → siguiente será 004) |

**Reglas**:
- Al generar un PDF, si el año actual es mayor que `anio`, se reinicia: `anio = año actual`, `ultimoNumero = 0`.
- El siguiente número es siempre `ultimoNumero + 1`, formateado como 3 dígitos (001, 002…).
- El número se asigna en el momento exacto de generar el PDF, sin reservas previas.

---

## Relaciones

```text
Perfil (1) ────── se incluye en ──────> Presupuesto.perfilSnapshot (al generar PDF)

Servicio (0..*) ── puede usarse en ──> Línea (pero no hay FK directa; es una copia)

Cliente (1) <──── se asocia a ────── Presupuesto.clienteId
Cliente (1) ────── se congela en ──────> Presupuesto.clienteSnapshot (al generar PDF)

Presupuesto (1) ── contiene ──> Línea (1..*)

Contador (1) ────── asigna número a ──> Presupuesto.numero
```

## Transiciones de estado

```text
┌─────────────┐     Generar PDF      ┌─────────────┐
│  BORRADOR   │ ───────────────────> │  NUMERADO   │
│ (sin número)│                       │ (con número)│
└─────────────┘                       └──────┬──────┘
                                             │
                                        Editar │
                                             │
                                             ▼
                                      ┌─────────────┐
                                      │  COPIA      │
                                      │ (borrador)  │
                                      └─────────────┘
                                      (original intacto)
```

## Fórmulas de cálculo

```text
importeLinea = redondear2(cantidad × precioUnitario)
baseImponible = suma(importeLinea de cada línea)
iva = redondear2(baseImponible × 0.21)
retencionIRPF = si (cliente.tipo == "empresa" Y retencion != "ninguna")
                entonces redondear2(baseImponible × porcentaje)
                sino 0
total = baseImponible + iva - retencionIRPF
```

Donde `porcentaje` es 0.15 o 0.07 según la configuración del presupuesto.
