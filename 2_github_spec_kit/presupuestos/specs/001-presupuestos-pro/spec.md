# Especificación: PresupuestosPro v0

**Feature Branch**: `001-presupuestos-pro`

**Fecha**: 2026-08-20

**Estado**: Borrador

---

## 1. Objetivo y contexto de negocio

PresupuestosPro es una herramienta web para que un freelancer español cree presupuestos profesionales con su marca y los descargue en PDF para enviárselos a sus clientes.

**Problema que resuelve:** el freelancer pierde tiempo copiando hojas de cálculo antiguas, calculando impuestos a mano y obteniendo un resultado poco profesional.

**Éxito de negocio:** poder emitir un presupuesto correcto y con buena imagen en menos de 5 minutos.

---

## Clarifications

### Session 2026-08-21

- Q: ¿El número se asigna al generar el PDF (siguiente disponible) o se reserva al crear el borrador? → A: Se asigna al generar el PDF, sin reservar números para borradores.
- Q: ¿La comparación de nombres de servicio es insensible a mayúsculas/minúsculas? → A: Sí, insensible ("Diseño web" = "diseño web").
- Q: ¿El PDF histórico muestra los datos del cliente congelados al generarse o los actualizados? → A: Foto fija (datos congelados al momento de generar el PDF).
- Q: ¿Se redondea cada línea a 2 decimales antes de sumar o solo el total final? → A: Redondeo por línea (cada importe se redondea a 2 decimales antes de sumar).
- Q: ¿El contador de numeración reinicia automáticamente al cambiar de año? → A: Sí, reinicio automático sin intervención del usuario.

---

## 2. Usuarios

| Usuario | Descripción |
|---|---|
| **Freelancer** (usa la app) | Autónomo en España (diseñador, programador, fotógrafo, consultor…). Trabaja solo, no es técnico. Hace varios presupuestos al mes. |
| **Cliente** (no usa la app) | Recibe el PDF por email. Puede ser **empresa/autónomo** o **particular**. La distinción determina si se aplica retención de IRPF. |

---

## 3. Escenarios de usuario

### HU1 — Perfil del freelancer (Prioridad: P1)

Como freelancer, quiero configurar mi nombre, NIF, dirección, teléfono, email y logo, para que mis presupuestos salgan con mi marca sin tener que ponerla cada vez.

**Por qué esta prioridad**: sin perfil completo no se puede generar ningún PDF; es prerrequisito de todo lo demás.

**Test independiente**: rellenar todos los campos del perfil, guardar, recargar la app y comprobar que persisten.

**Escenarios de aceptación**:

1. **Dado** que abro la app por primera vez, **cuando** accedo al perfil, **entonces** todos los campos están vacíos y se me indica que debo completarlos.
2. **Dado** que relleno todos los campos y subo un logo PNG/JPG de menos de 2 MB, **cuando** guardo, **entonces** los datos persisten tras cerrar y abrir la app.
3. **Dado** que intento guardar el perfil con algún campo obligatorio vacío, **cuando** pulso guardar, **entonces** se muestra un aviso indicando qué falta.

---

### HU2 — Catálogo de servicios (Prioridad: P2)

Como freelancer, quiero mantener un catálogo de mis servicios con un precio por defecto cada uno, para no reescribir lo mismo en cada presupuesto.

**Por qué esta prioridad**: agiliza la creación de presupuestos, pero se puede crear un presupuesto sin catálogo (líneas a mano).

**Test independiente**: crear un servicio, editarlo, borrarlo, y comprobar que no admite nombres duplicados.

**Escenarios de aceptación**:

1. **Dado** que creo un servicio "Diseño web" con precio 1.500,00 €, **cuando** lo guardo, **entonces** aparece en mi catálogo.
2. **Dado** que ya existe un servicio "Diseño web", **cuando** intento crear otro con el mismo nombre, **entonces** se muestra un aviso y no se crea.
3. **Dado** que edito el precio de un servicio existente, **cuando** guardo, **entonces** el catálogo refleja el nuevo precio.
4. **Dado** que elimino un servicio, **cuando** vuelvo al catálogo, **entonces** ya no aparece.

---

### HU3 — Lista de clientes (Prioridad: P2)

Como freelancer, quiero gestionar una lista de clientes reutilizable, para no escribir sus datos cada vez.

**Por qué esta prioridad**: ahorra tiempo en la creación de presupuestos, pero se puede seleccionar un cliente al crear el presupuesto.

**Test independiente**: crear un cliente, editarlo, e intentar seleccionarlo en un presupuesto nuevo.

**Escenarios de aceptación**:

1. **Dado** que creo un cliente con nombre, dirección, email, teléfono y tipo "empresa/autónomo", **cuando** guardo, **entonces** aparece en mi lista de clientes.
2. **Dado** que edito los datos de un cliente, **cuando** guardo, **entonces** la lista muestra los datos actualizados.
3. **Dado** que un cliente tiene presupuestos asociados, **cuando** intento eliminarlo, **entonces** no se permite (solo se puede editar).

---

### HU4 — Crear presupuesto (Prioridad: P1)

Como freelancer, quiero crear un presupuesto eligiendo un cliente y añadiendo líneas (de mi catálogo o escritas a mano), para adaptarlo a cada encargo.

**Por qué esta prioridad**: es la funcionalidad central de la aplicación.

**Test independiente**: crear un presupuesto con al menos una línea, verificar cálculos, y dejarlo en borrador.

**Escenarios de aceptación**:

1. **Dado** que selecciono un cliente de mi lista, **cuando** creo un presupuesto nuevo, **entonces** el presupuesto queda asociado a ese cliente y en estado borrador.
2. **Dado** que añado una línea del catálogo, **cuando** la selecciono, **entonces** se carga la descripción y el precio por defecto (editables).
3. **Dado** que escribo una línea a mano con descripción, cantidad y precio, **cuando** la añado, **entonces** aparece en la tabla del presupuesto.
4. **Dado** que edito o elimino una línea, **cuando** confirmo, **entonces** la tabla se actualiza y los totales se recalculan.

---

### HU5 — Cálculos automáticos (Prioridad: P1)

Como freelancer, quiero que la base imponible, el IVA, la retención de IRPF (cuando toque) y el total se calculen solos, para no equivocarme con los impuestos.

**Por qué esta prioridad**: un cálculo incorrecto invalida el presupuesto; es el corazón de la lógica de negocio.

**Test independiente**: introducir las líneas del ejemplo de referencia y verificar que los totales coinciden al céntimo.

**Escenarios de aceptación**:

1. **Dado** un presupuesto con las líneas del ejemplo (1.500 € + 500 €), cliente empresa/autónomo, retención 15 %, **cuando** veo el desglose, **entonces** el total es exactamente 2.120,00 €.
2. **Dado** el mismo presupuesto, **cuando** cambio la retención a 7 %, **entonces** el total se recalcula a 2.280,00 €.
3. **Dado** el mismo presupuesto, **cuando** cambio el cliente a "particular", **entonces** la retención no se aplica y el total es 2.420,00 €.
4. **Dado** que activo retención en un presupuesto de cliente particular, **cuando** veo el desglose, **entonces** la retención no aparece (manda el tipo de cliente).

---

### HU6 — Generar y descargar PDF (Prioridad: P1)

Como freelancer, quiero descargar el presupuesto como PDF con mi logo, número y validez, para enviárselo al cliente con buena imagen.

**Por qué esta prioridad**: sin PDF no hay entrega al cliente; es el objetivo final del flujo.

**Test independiente**: generar el PDF y verificar visualmente que contiene todos los elementos requeridos.

**Escenarios de aceptación**:

1. **Dado** un presupuesto con al menos una línea y perfil completo, **cuando** genero el PDF, **entonces** se descarga un archivo PDF con logo, datos del freelancer, datos del cliente, número (AAAA-NNN), fecha de emisión, validez (30 días), tabla de líneas y desglose.
2. **Dado** un presupuesto sin líneas, **cuando** intento generar el PDF, **entonces** se muestra un aviso y no se genera.
3. **Dado** un perfil incompleto o sin logo, **cuando** intento generar el PDF, **entonces** se muestra un aviso y no se genera.
4. **Dado** que genero un segundo presupuesto en el mismo año, **cuando** se asigna el número, **entonces** es el consecutivo del anterior (2026-002 si el anterior fue 2026-001).
5. **Dado** un presupuesto ya numerado, **cuando** solicito descargarlo de nuevo, **entonces** se genera el mismo PDF con los mismos datos.

---

### HU7 — Editar presupuesto numerado (Prioridad: P3)

Como freelancer, quiero poder editar un presupuesto ya numerado, generando una copia con número nuevo y conservando el original como histórico.

**Por qué esta prioridad**: es un caso menos frecuente; la mayoría de los presupuestos no se editan tras enviarse.

**Test independiente**: editar un presupuesto numerado, verificar que el original permanece intacto y la copia recibe número nuevo.

**Escenarios de aceptación**:

1. **Dado** un presupuesto con número 2026-001, **cuando** lo edito, **entonces** el original queda como histórico sin cambios y se crea una copia en estado borrador.
2. **Dado** la copia en borrador, **cuando** genero su PDF, **entonces** recibe el número siguiente (2026-002).

---

### Casos límite

| Código | Caso | Comportamiento esperado |
|---|---|---|
| CL1 | Presupuesto sin ninguna línea | No se genera el PDF; se muestra aviso. |
| CL2 | Línea escrita a mano, fuera del catálogo | Permitida sin restricción. |
| CL3 | Cliente particular con retención activada | La retención no se aplica (manda el tipo de cliente). |
| CL4 | Perfil sin logo | Se bloquea la generación de nuevos PDFs; los anteriores se pueden descargar. |
| CL5 | Dos servicios con el mismo nombre | No se permite; se muestra aviso. |
| CL6 | Editar presupuesto ya numerado | Se crea copia borrador; el original queda como histórico. |

---

## 4. Requisitos funcionales

### Perfil del freelancer

- **RF-001.** El sistema debe permitir guardar y editar el perfil del freelancer con los siguientes campos obligatorios: nombre completo o razón social, NIF, dirección postal, teléfono, email y logo (PNG o JPG, máximo 2 MB).
- **RF-002.** El perfil debe estar completo (incluido el logo) para poder generar cualquier PDF.
- **RF-003.** Si el freelancer elimina el logo, se bloquea la generación de nuevos PDFs. Los presupuestos ya numerados siguen siendo descargables con el logo que tenían al generarse.

### Catálogo de servicios

- **RF-004.** El sistema debe permitir crear, editar y eliminar servicios del catálogo. Cada servicio tiene: nombre (único) y precio por defecto (base imponible, en euros).
- **RF-005.** No puede haber dos servicios con el mismo nombre. La comparación es insensible a mayúsculas/minúsculas ("Diseño web" y "diseño web" se consideran el mismo nombre).

### Lista de clientes

- **RF-006.** El sistema debe permitir crear y editar clientes. Campos: nombre o razón social (obligatorio), NIF/CIF (opcional), dirección (obligatorio), email (obligatorio), teléfono (obligatorio), tipo: empresa/autónomo o particular (obligatorio).
- **RF-007.** Un cliente no se puede eliminar, solo editar.
- **RF-008.** Los cambios en un cliente no afectan a los presupuestos ya generados. El PDF es una foto fija: conserva los datos del cliente tal como estaban en el momento de generar el PDF por primera vez.

### Presupuesto

- **RF-009.** El sistema debe permitir crear un presupuesto seleccionando un cliente de la lista.
- **RF-010.** Cada línea del presupuesto tiene: descripción, cantidad (número mayor que cero) y precio unitario (base imponible, en euros).
- **RF-011.** Se pueden añadir líneas del catálogo (cargan nombre y precio por defecto, editables) o líneas escritas a mano.
- **RF-012.** Se puede editar o eliminar cualquier línea antes de generar el PDF.
- **RF-013.** La retención de IRPF se configura presupuesto a presupuesto: sin retención, 15 %, o 7 %.
- **RF-014.** Si el cliente es "particular", la retención de IRPF no se aplica aunque esté activada.
- **RF-015.** Un presupuesto puede existir en estado borrador (sin número) indefinidamente.

### Cálculos

- **RF-016.** El sistema debe calcular automáticamente:
  - Importe por línea = cantidad × precio unitario, redondeado a 2 decimales.
  - Base imponible = suma de los importes por línea (ya redondeados).
  - IVA = base imponible × 21 %, redondeado a 2 decimales.
  - Retención de IRPF = base imponible × porcentaje elegido (si aplica), redondeado a 2 decimales.
  - Total = base imponible + IVA − retención de IRPF.
- **RF-017.** Los totales se recalculan en tiempo real al añadir, editar o eliminar líneas, o al cambiar la retención.

### Numeración y fechas

- **RF-018.** El presupuesto recibe su número al generar el PDF (no antes). No se reservan números para borradores; se toma el siguiente disponible en el momento exacto de la generación.
- **RF-019.** Formato de numeración: AAAA-NNN (ejemplo: 2026-001). El contador reinicia automáticamente cada año natural, sin intervención del usuario.
- **RF-020.** La fecha de emisión es la fecha en que se genera el PDF.
- **RF-021.** La validez es de 30 días desde la fecha de emisión.

### Generación de PDF

- **RF-022.** El PDF debe contener: logo del freelancer, datos del freelancer (nombre, NIF, dirección, teléfono, email), datos del cliente (nombre/razón social, NIF/CIF si lo tiene, dirección, email, teléfono), número de presupuesto, fecha de emisión, fecha de validez, tabla de líneas (descripción, cantidad, precio unitario, importe por línea), desglose (base imponible, IVA 21 %, retención de IRPF si aplica con porcentaje, total).
- **RF-023.** No se puede generar un PDF si el presupuesto no tiene al menos una línea.
- **RF-024.** No se puede generar un PDF si el perfil del freelancer está incompleto o sin logo.
- **RF-025.** Se puede regenerar/descargar el PDF de un presupuesto ya numerado en cualquier momento.

### Edición de presupuesto numerado

- **RF-026.** Al editar un presupuesto ya numerado, el original queda como histórico y se crea una copia borrador. Al generar el PDF de la copia, recibe un número nuevo.

### Persistencia

- **RF-027.** Todos los datos (perfil, catálogo, clientes y presupuestos) se almacenan en el navegador del freelancer (localStorage).
- **RF-028.** Al volver a abrir la aplicación, todos los datos persisten.

---

## 5. Reglas de negocio

| Regla | Detalle |
|---|---|
| IVA | 21 % (tipo general de servicios profesionales en España) |
| Retención de IRPF | 15 % (general) o 7 % (nuevos autónomos). Opcional. Solo aplica a clientes empresa/autónomo, nunca a particulares. |
| Fórmula del total | Total = base imponible + IVA − retención de IRPF |
| Redondeo | Cada importe de línea se redondea a 2 decimales antes de sumar. IVA y retención también se redondean a 2 decimales. |
| Numeración | Formato AAAA-NNN. Se asigna al generar el PDF (sin reserva). Reinicio automático cada año natural. |
| Validez | 30 días desde la fecha de emisión |
| Logo | PNG o JPG, máximo 2 MB |
| Nombre de servicio | Único en el catálogo (comparación insensible a mayúsculas/minúsculas) |
| Cliente | No se puede eliminar, solo editar |
| PDF histórico | Foto fija: conserva los datos del cliente y freelancer del momento de generación |

---

## 6. Ejemplo de referencia

Presupuesto con dos líneas:

| Concepto | Cantidad | Precio unitario | Importe |
|---|---|---|---|
| Diseño de página web | 1 | 1.500,00 € | 1.500,00 € |
| Sesión de fotos de producto | 1 | 500,00 € | 500,00 € |

### Caso A: cliente empresa/autónomo, retención 15 %

| Concepto | Importe |
|---|---|
| Base imponible | 2.000,00 € |
| IVA (21 %) | 420,00 € |
| Retención de IRPF (−15 %) | −300,00 € |
| **Total a pagar** | **2.120,00 €** |

### Caso B: cliente empresa/autónomo, retención 7 %

| Concepto | Importe |
|---|---|
| Base imponible | 2.000,00 € |
| IVA (21 %) | 420,00 € |
| Retención de IRPF (−7 %) | −140,00 € |
| **Total a pagar** | **2.280,00 €** |

### Caso C: cliente particular (sin retención)

| Concepto | Importe |
|---|---|
| Base imponible | 2.000,00 € |
| IVA (21 %) | 420,00 € |
| **Total a pagar** | **2.420,00 €** |

---

## 7. Criterios de éxito

- **CA-001.** Con el ejemplo de la sección 6, caso A (retención 15 %), el total mostrado es exactamente 2.120,00 €.
- **CA-002.** Al activar o desactivar la retención, o al cambiar entre 15 % y 7 %, el total se recalcula automáticamente.
- **CA-003.** Al marcar el cliente como "particular", la retención no se aplica y el total sube a 2.420,00 € con el ejemplo de referencia.
- **CA-004.** El segundo presupuesto generado en el año recibe automáticamente el número siguiente (2026-002).
- **CA-005.** El PDF descargado muestra logo, datos del freelancer y cliente, número, fecha de emisión, validez y desglose completo.
- **CA-006.** Se puede editar o borrar cualquier línea antes de generar el PDF y los totales se actualizan al instante.
- **CA-007.** Al cerrar y reabrir la app, el perfil, catálogo, clientes y presupuestos siguen ahí.
- **CA-008.** Un presupuesto sin líneas no permite generar el PDF y muestra un aviso.
- **CA-009.** Un presupuesto con perfil incompleto o sin logo no permite generar el PDF y muestra un aviso.
- **CA-010.** Al editar un presupuesto ya numerado, el original se conserva intacto y la copia recibe número nuevo.
- **CA-011.** Un presupuesto puede quedarse en borrador sin número el tiempo que haga falta.

---

## 8. Entidades clave

- **Perfil**: datos fiscales y de contacto del freelancer + logo.
- **Servicio**: entrada del catálogo con nombre único y precio base.
- **Cliente**: persona o empresa a la que se dirige el presupuesto, con tipo que determina si aplica retención.
- **Presupuesto**: documento con estado (borrador o numerado), asociado a un cliente, con líneas y configuración de retención.
- **Línea**: concepto individual dentro de un presupuesto (descripción, cantidad, precio unitario).

---

## 9. Supuestos

- El freelancer usa un navegador moderno con soporte de localStorage.
- Los datos viven exclusivamente en el navegador (sin servidor ni nube).
- El freelancer trabaja solo; no hay colaboración ni usuarios múltiples.
- El tipo de IVA es siempre 21 % (no se contemplan tipos reducidos en v0).

---

## 10. Fuera de alcance (v0)

- No es una factura: nada de facturación electrónica ni VeriFactu.
- Sin cuentas de usuario ni autenticación.
- Sin almacenamiento en la nube.
- Sin multidivisa: solo euros.
- Sin enviar el PDF por email desde la aplicación.
- Sin descuentos por línea ni globales.
- Sin exportar/importar datos entre dispositivos.
- Sin eliminar clientes.
