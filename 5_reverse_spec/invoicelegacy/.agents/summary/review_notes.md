# Notas de revisión — GesFact

> Revisión de **consistencia** y **completitud** de la documentación de
> `.agents/summary/`, más el registro de **hallazgos del sistema** detectados al
> documentar. Conforme a la constitución, los hallazgos se **registran, no se
> corrigen** (`.specify/memory/constitution.md`, Principio III).

## 1. Comprobación de consistencia (entre documentos)

| Aspecto | Resultado | Observación |
|---------|-----------|-------------|
| Stack (Express/EJS/SQLite/body-parser) | Consistente | Igual en `codebase_info.md`, `architecture.md`, `dependencies.md` |
| Endpoints HTTP | Consistente | `interfaces.md` y `workflows.md` describen las mismas rutas |
| Esquema de datos (6 tablas) | Consistente | `data_models.md` concuerda con `db.js` y con los campos usados en rutas |
| Estados de factura (`emitida`/`cobrada`/`rectificada`) | Consistente | `data_models.md` ↔ `interfaces.md` ↔ `workflows.md` |
| Doble prorrateo | Consistente y señalado | Mencionado en `codebase_info.md`, `components.md`, `workflows.md` y aquí |
| Email inactivo | Consistente | `components.md`, `interfaces.md`, `dependencies.md` coinciden |
| Idioma (español de España) | Consistente | Todos los documentos |

No se han detectado contradicciones entre documentos.

## 2. Comprobación de completitud (cobertura del código)

| Área | Cobertura | Nota |
|------|-----------|------|
| `server.js`, `db.js`, `config.js` | Completa | Leídos y documentados |
| `routes/*.js` (5) | Completa | Todos los endpoints catalogados |
| `services/calculo.js`, `lib/numeracion.js`, `lib/util.js` | Completa | API y reglas documentadas con líneas |
| `services/email.js`, `scripts/remesa_mensual.js` | Completa | Documentados |
| `public/js/factura.js` | Completa | Único JS de cliente |
| **`views/*.ejs`** | **Parcial** | Mencionadas como capa de presentación; no diseccionadas plantilla a plantilla |
| **`public/css/estilos.css`** | **No cubierta** | Presentación; irrelevante para el comportamiento de facturación |
| **`datos/gesfact.db` (contenido real)** | **No inspeccionada** | Solo se documentan los datos **semilla** de `db.js`, no el estado real de producción. Verificar contra la BD real al caracterizar |
| **`datos/migracion_mysql_2018.sql`** | **No analizada** | Fuera de alcance (migración pendiente) |

## 3. Registro de anomalías y rarezas (hallazgos del sistema)

> Clasificación: 🔴 riesgo monetario/legal · 🟠 corrección de datos/robustez ·
> 🟡 rareza/deuda. Ninguno se corrige en esta fase.

| # | Hallazgo | Clasif. | Evidencia |
|---|----------|---------|-----------|
| H1 | **Doble lógica de prorrateo**: `calculo.calcularProrrateo` usa 30 días fijos; `scripts/remesa_mensual.js` recalcula con días reales del mes. La baja de contrato usa la de 30. Importes pueden diferir en meses de 28/29/31 días | 🔴 | `calculo.js:97-104`, `remesa_mensual.js:50-54`, `contratos.js:38` |
| H2 | **Inserción de líneas sin transacción** y en paralelo: si una línea falla con la cabecera ya grabada, queda una factura incompleta | 🟠 | `facturas.js:76-95` |
| H3 | **Numeración sin bloqueo/transacción**: colisión posible bajo concurrencia; incidente histórico reconocido | 🔴 | `numeracion.js:11-13,32-38` |
| H4 | **Numeración por año del sistema**, no por fecha de la factura: una factura con fecha de diciembre grabada en enero tomaría el contador del año nuevo | 🟠 | `numeracion.js:17` |
| H5 | **Validación de NIF solo por longitud** (9 caracteres), sin comprobar la letra | 🟡 | `util.js:43-47` |
| H6 | **Filtro de trimestre de IVA con día `-31`** para todos los meses de cierre; comparación textual `YYYY-MM-DD`. Para cierres en meses de 30 días el límite textual `-31` incluye todo el mes, pero es frágil si cambia el criterio | 🟡 | `informes.js:17-18` |
| H7 | **`sumarDias` posible desfase de 1 día** por cambio de hora (TODO sin reproducir); afecta a vencimientos | 🟠 | `util.js:19-26` |
| H8 | **Rectificación permitida sobre factura `cobrada`**: solo se bloquea si ya está `rectificada` o es serie `RE`; no se exige que esté sin cobrar | 🟡 | `facturas.js:131-133` |
| H9 | **Secretos en claro en `config.js`** (credenciales SMTP, clave de gestoría) versionados en el repo | 🔴 | `config.js:SMTP, CLAVE_EXPORT_GESTORIA` |
| H10 | **Envío de email fuera de servicio** desde 2022; `enviarFactura` es un no-op pero se sigue invocando | 🟡 | `email.js:16-29`, `facturas.js:88` |
| H11 | **Sin autenticación/autorización** en ninguna ruta | 🟠 | `routes/*.js` (ausencia) |
| H12 | **Sin tests**: no hay suite ni runner declarado; riesgo alto al cambiar algo | 🟠 | `package.json` (ausencia) |

> Estos hallazgos son candidatos a tests de caracterización (que fijan el
> comportamiento ACTUAL, incluso si es "raro") y a decisión del negocio en el
> módulo siguiente. No se actúa sobre ellos aquí.

## 4. Huecos por límites de análisis

- No se ha ejecutado la aplicación ni consultado la base de datos **real** de
  producción; los importes citados provienen del código y de los **datos semilla**
  de `db.js`. Antes de caracterizar, conviene contrastar con `datos/gesfact.db`.
- Las plantillas `views/*.ejs` no se han diseccionado; si alguna contiene lógica de
  cálculo o formato relevante, faltaría documentarla (SUPOSICIÓN: solo presentan
  datos ya calculados — pendiente de verificar).
- No hay evidencia de CI, linter o hooks propios de la app GesFact (los hooks
  existentes son de Spec Kit, fuera de alcance).

## 5. Recomendaciones para mejorar la documentación (sin cambiar código)

1. **Caracterizar primero el núcleo monetario** (`calculo.js`, `util.js`,
   `numeracion.formatear`) con `node:test`, usando los datos semilla como casos
   esperados; así la documentación queda respaldada por pruebas.
2. **Contrastar con la BD real**: verificar que los importes de facturas históricas
   coinciden con lo que recalcula `calculo.js` (puede revelar más anomalías).
3. **Convertir las SUPOSICIONES en preguntas al negocio**: p.ej. ¿cuál es el
   prorrateo "correcto" según la gestoría, el de 30 días o el de días reales?
   (necesario para decidir en H1, pero la decisión no es de esta fase).
4. **Documentar las vistas EJS** si se confirma que alguna influye en importes.
5. **Mantener la norma de evidencia** (`fichero:líneas`) en toda ampliación futura.
