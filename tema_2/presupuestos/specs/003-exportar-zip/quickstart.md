# Guía de validación (Quickstart): Exportar todos los presupuestos en un .zip

**Rama**: `003-exportar-zip` | **Fecha**: 2026-08-27

Escenarios ejecutables que demuestran que la funcionalidad cumple los criterios de éxito. Ver
detalles de interfaces en [contracts/exportacion.md](./contracts/exportacion.md) y de datos en
[data-model.md](./data-model.md).

## Prerrequisitos

```bash
npm install          # incluye la nueva dependencia JSZip
npm run dev          # http://localhost:5173
```

## Comprobaciones automáticas (lógica de negocio)

```bash
npm run test         # deben pasar los tests de exportacion.test.ts y nombreArchivo.test.ts
npm run build        # tsc -b + vite build sin errores
```

Cobertura esperada de los tests (en `tests/services/`):
- Selección: solo se incluyen presupuestos `numerado` (los borradores quedan fuera).
- `datos.json`: contiene `presupuestos`, `catalogo`, `perfil`, `contador`; **no** contiene `clientes`.
- Saneado: "Diseño/Web S.L." produce un nombre de archivo válido.
- Vacío: 0 numerados devuelve `{ ok: false, motivo: 'sin-numerados' }` y no construye zip.
- Atomicidad: si un PDF falla, se aborta y no se produce blob de descarga.
- Solo lectura: `localStorage` no cambia tras exportar.

## Escenarios manuales (verificables por persona no técnica)

### Escenario 1 — Copia completa en un clic (P1 · CE-001, CE-002, CE-003)
1. Crea o ten 3 presupuestos numerados (uno con total de control 3.604,00 €).
2. En "Presupuestos", pulsa **"Exportar todo (.zip)"** en la cabecera.
3. **Esperado**: se descarga un único `.zip`. Al descomprimirlo hay exactamente **3 PDF** y un
   **`datos.json`**. El PDF del presupuesto de control es **idéntico** (mismo contenido y total
   3.604,00 €) al que descarga el botón "Descargar PDF" individual.

### Escenario 2 — Nombres reconocibles y a prueba de errores (P2 · CE-005)
1. Ten un presupuesto `2026-001` del cliente "Estudio García" y otro de "Diseño/Web S.L.".
2. Exporta (supón hoy = 15/03/2026).
3. **Esperado**:
   - El archivo se llama `presupuestospro-copia-2026-03-15.zip`.
   - Dentro hay `2026-001 - Estudio García.pdf`.
   - El PDF de "Diseño/Web S.L." tiene un nombre válido y el `.zip` se descomprime **sin errores**
     en el explorador del sistema.
   - Existe un único `datos.json` con presupuestos, catálogo y perfil (con logo).

### Escenario 3 — Exportaciones grandes y aviso si no hay nada (P3 · CE-004, CE-006)
1. Con **50 o más** presupuestos numerados, pulsa el botón.
   - **Esperado**: aparece una **barra de progreso con contador real** ("X de N") que avanza hasta
     que empieza la descarga.
2. Con **0** presupuestos numerados, pulsa el botón.
   - **Esperado**: aparece un **tooltip** "No hay nada que exportar" y **no** se descarga nada.

### Escenario 4 — Solo lectura (CE-007)
1. Anota el estado de la lista (número de borradores y numerados).
2. Exporta.
3. **Esperado**: al volver a la lista, todo está **exactamente igual**; no se creó, modificó ni
   borró ningún presupuesto, servicio ni dato de perfil.

### Escenario 5 — Fallo controlado (RF-014)
1. (Caso teórico) Si un presupuesto no pudiera generar su PDF, la exportación se **aborta**.
2. **Esperado**: se muestra un aviso claro en español y **no** se descarga ningún `.zip` (nunca una
   copia parcial).

## Criterios de aceptación cubiertos

| Criterio | Escenario |
|----------|-----------|
| CE-001, CE-002, CE-003 | 1 |
| CE-005 | 2 |
| CE-004, CE-006 | 3 |
| CE-007 | 4 |
| RF-014 (fallo) | 5 |
