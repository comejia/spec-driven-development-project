# Flujos y procesos clave — GesFact

> Procesos de negocio tal como los ejecuta el código, con evidencia. No se propone
> cambiarlos.

## 1. Alta de factura manual (POST /facturas/nueva)

```mermaid
sequenceDiagram
    participant U as Usuario (oficina)
    participant R as routes/facturas.js
    participant DB as db.js (SQLite)
    participant C as services/calculo.js
    participant N as lib/numeracion.js
    participant E as services/email.js

    U->>R: POST /facturas/nueva (cliente_id, fecha, desc[], cant[], precio[], iva[])
    R->>DB: SELECT cliente WHERE id = ?
    DB-->>R: cliente (o error 400 si no existe)
    R->>R: monta líneas (coma→punto, descarta filas vacías)
    alt sin líneas
        R-->>U: 400 "La factura no tiene lineas"
    end
    R->>C: calcularFactura(lineas, cliente)
    C-->>R: {lineas, base, iva, recargo, total, descuentoPct}
    R->>R: vencimiento = sumarDias(fecha, cliente.dias_pago || 30)
    R->>N: siguienteNumero('FA', cb)
    N->>DB: lee/crea contador, UPDATE ultimo+1
    N-->>R: 'FA-AAAA-NNNNNN'
    R->>DB: INSERT facturas (...)
    R->>DB: INSERT lineas (en paralelo, contador pendientes)
    R->>E: enviarFactura(...)  (no-op desde 2022)
    E-->>R: cb(null)
    R-->>U: redirect /facturas/:id
```

Puntos sensibles (con evidencia):

- Si el descuento por volumen aplica, se anota en observaciones automáticamente
  (`facturas.js:71-73`).
- Las líneas se insertan **sin transacción**, en paralelo; si una falla con la
  cabecera ya grabada, queda una factura incompleta (`facturas.js:76-95`).
- El email es un no-op; el alta no depende de él (`facturas.js:88`,
  `email.js:16-29`).

## 2. Cálculo de una factura (services/calculo.js)

```mermaid
flowchart TD
    A["Entrada: líneas crudas + cliente"] --> B["¿cliente.recargo_equivalencia == 1?"]
    B --> C["Para cada línea: calcularLinea → base redondeada por línea"]
    C --> D["baseBruta = suma de bases (redondeada paso a paso)"]
    D --> E["porcentajeDescuento(baseBruta): >5000→5%, >1000→2%, resto 0"]
    E --> F["Para cada línea: aplicar descuento al PRECIO, recalcular línea"]
    F --> G["Acumular base, iva, recargo (redondeo por línea)"]
    G --> H["total = base + iva + recargo (redondeado)"]
    H --> I["Salida: factura calculada"]
```

Reglas con evidencia:

- Redondeo a 2 decimales **en cada componente de cada línea** (`calculo.js:26-35`);
  nunca sobre el total global. **No cambiar** (incidente gestoría mayo 2019,
  `calculo.js:3-8`).
- Descuento con comparación estricta `>` (1000,00 € exactos no descuenta;
  `calculo.js:40-44`, caso `FA-2026-000103`).
- Recargo de equivalencia según el tipo de IVA vía `recargoPara` (`calculo.js:12-22`).

## 3. Rectificación de factura (POST /facturas/:id/rectificar)

```mermaid
flowchart TD
    A["POST /facturas/:id/rectificar"] --> B{"¿estado == rectificada?"}
    B -- sí --> X1["400 Ya está rectificada"]
    B -- no --> C{"¿serie == RE?"}
    C -- sí --> X2["400 No se rectifica una rectificativa"]
    C -- no --> D["numeracion.siguienteNumero('RE')"]
    D --> E["INSERT factura RE con base/iva/recargo/total EN NEGATIVO, rectifica_a = numero original"]
    E --> F["Copiar cada línea invirtiendo signos (cantidad, base, cuota_iva, cuota_recargo)"]
    F --> G["UPDATE factura original → estado 'rectificada'"]
    G --> H["redirect al detalle de la RE"]
```

- **No recalcula**: es un espejo exacto en negativo (Puri; `facturas.js:124-129`).
- La RE se crea con `fecha = hoy()` y `vencimiento = null` (`facturas.js:149`).

## 4. Remesa mensual de contratos (batch) — scripts/remesa_mensual.js

```mermaid
sequenceDiagram
    participant OP as Operador (Marga, día 1)
    participant S as remesa_mensual.js
    participant DB as db.js (SQLite)
    participant C as services/calculo.js
    participant N as lib/numeracion.js

    OP->>S: node scripts/remesa_mensual.js 2026-06
    S->>DB: db.inicializar()
    S->>DB: SELECT contratos activos en el mes (alta<=ultimoDia y baja NULL o >=primerDia)
    DB-->>S: lista de contratos
    loop por cada contrato (procesarSiguiente)
        S->>S: desde/hasta recortados al mes
        S->>S: importe = redondear2(cuota / diasDelMes * diasServicio)
        S->>C: calcularFactura([{concepto, 1, importe, tipoIva}], {recargo_equivalencia})
        C-->>S: cálculo
        S->>N: siguienteNumero('FA')
        N-->>S: numero
        S->>DB: INSERT factura + 1 línea
    end
    S-->>OP: "Remesa 2026-06 terminada: N facturas."
```

Selección de contratos y prorrateo (`remesa_mensual.js:30-54`):

- Activo en el mes = `fecha_alta <= ultimoDia AND (fecha_baja IS NULL OR
  fecha_baja >= primerDia)`.
- Si alta/baja caen dentro del mes, se prorratea; el sufijo de la línea indica
  "(N dias)" o "(mes año)".

> **ANOMALÍA CLAVE — dos prorrateos distintos** (ver `review_notes.md`):
>
> ```mermaid
> graph TB
>     subgraph "Prorrateo 'oficial' (30 días fijos)"
>         P1["services/calculo.js: calcularProrrateo"]
>         P1 --> U1["POST /contratos/:id/baja → ?prorrateo="]
>     end
>     subgraph "Prorrateo de la remesa (días reales del mes)"
>         P2["scripts/remesa_mensual.js (inline, util.diasDelMes)"]
>     end
> ```
>
> La función `calcularProrrateo` usa `cuota/30*dias` (`calculo.js:97-104`) y la usa
> la baja de contrato (`contratos.js:38`). Pero la remesa mensual **no la llama**:
> recalcula con `cuota / diasDelMes(mes) * diasServicio` (`remesa_mensual.js:50-54`).
> Para meses de 28/29/31 días los importes de ambos caminos **pueden diferir**. Es un
> hallazgo a registrar, no a corregir en esta fase.

## 5. Numeración correlativa (lib/numeracion.js)

```mermaid
sequenceDiagram
    participant R as llamador (ruta o batch)
    participant N as numeracion.js
    participant DB as contadores (SQLite)
    R->>N: siguienteNumero(serie, cb)
    N->>DB: SELECT ultimo WHERE serie=? AND anyo=? (año del sistema)
    alt no existe contador del año
        N->>DB: INSERT (serie, anyo, 0)
    end
    N->>DB: UPDATE ultimo = ultimo + 1
    N-->>R: 'SERIE-AAAA-NNNNNN'
```

- El año es el del **sistema** (`new Date().getFullYear()`), no el de la factura
  (`numeracion.js:17`).
- Sin bloqueo/transacción: riesgo de colisión bajo concurrencia, reconocido en
  comentario histórico (`numeracion.js:11-13`).

## 6. Cierre trimestral de IVA y envío a gestoría

```mermaid
flowchart LR
    A["GET /informes/iva?anyo&trimestre"] --> B["SUM(base,cuota_iva,cuota_recargo) FROM lineas por tipo_iva en el rango"]
    B --> C["Vista informe_iva (base del modelo 303, lo termina la gestoría)"]
    D["GET /informes/export-gestoria?anyo"] --> E["SELECT facturas del año + cliente"]
    E --> F["CSV: CLAVE;clave / cabeceras / filas con importes formato ES"]
    F --> G["Descarga facturas_AAAA.csv → gestoría"]
```

- Rango del trimestre con `desde = AAAA-TT-01` y `hasta = AAAA-TT-31`
  (`informes.js:17-18`). El día `-31` se usa para **todos** los meses de cierre
  (incluido junio/septiembre con 30, y la comparación es sobre texto `YYYY-MM-DD`);
  registrado como rareza en `review_notes.md`.
- El CSV lleva la clave de la gestoría en la primera línea e importes en formato
  español (`informes.js:38-44`).
