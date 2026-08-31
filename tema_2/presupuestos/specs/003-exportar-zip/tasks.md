---
description: "Lista de tareas para: Exportar todos los presupuestos en un .zip"
---

# Tareas: Exportar todos los presupuestos en un .zip

**Entrada**: Documentos de diseño en `/specs/003-exportar-zip/`

**Prerrequisitos**: plan.md (requerido), spec.md (historias de usuario), research.md, data-model.md, contracts/exportacion.md, quickstart.md

**Tests**: Incluidos. El spec y quickstart.md exigen tests de lógica de negocio en `tests/services/` (obligatorio por convención del proyecto para `services/`).

**Organización**: Las tareas se agrupan por historia de usuario para permitir implementación y prueba independientes.

## Formato: `[ID] [P?] [Historia] Descripción`

- **[P]**: Puede ejecutarse en paralelo (distinto archivo, sin dependencias pendientes)
- **[Historia]**: A qué historia de usuario pertenece (US1, US2, US3)
- Se incluyen rutas de archivo exactas

## Convenciones de rutas

- Proyecto único (SPA): `src/`, `tests/` en la raíz del repositorio (Opción 1 del plan).

---

## Phase 1: Setup (Infraestructura compartida)

**Propósito**: Preparar la nueva dependencia y andamiaje mínimo para la exportación.

- [ ] T001 Instalar JSZip como dependencia de producción con versión fijada: `npm install jszip --save-exact` y verificar que aparece en `package.json` (research.md, Decisión 1)
- [ ] T002 [P] Instalar tipos de JSZip si son necesarios (`@types/jszip`) o confirmar que JSZip trae sus propios tipos; verificar que `import JSZip from 'jszip'` compila en un archivo `.ts` de prueba temporal (luego eliminar el archivo temporal)

**Checkpoint**: JSZip disponible e importable en TypeScript sin errores.

---

## Phase 2: Foundational (Prerrequisitos bloqueantes)

**Propósito**: Refactor del servicio de PDF y utilidades puras de las que dependen TODAS las historias. Sin esto, ninguna historia puede empezar.

**⚠️ CRÍTICO**: Ninguna historia de usuario puede empezar hasta completar esta fase.

- [ ] T003 [P] Añadir `fechaLocalISO(fecha?: Date): string` en `src/utils/dates.ts` que devuelva la fecha **local** del equipo en formato `AAAA-MM-DD` con relleno a 2 dígitos (usar `getFullYear`, `getMonth()+1`, `getDate()`); NO modificar `hoy()` existente (contracts/exportacion.md, research.md Decisión 4, RF-006)
- [ ] T004 [P] Crear `src/utils/nombreArchivo.ts` con `sanearNombreArchivo(nombre: string): string` que sustituya caracteres no válidos `\ / : * ? " < > |` y de control, colapse espacios, recorte extremos y nunca devuelva cadena vacía (fallback a `"sin-nombre"`) (contracts/exportacion.md, RF-008, CE-005)
- [ ] T005 Refactorizar `src/services/pdf.ts`: extraer `construirDocumentoPDF(presupuesto: Presupuesto): jsPDF` con TODA la lógica de maquetación actual, y dejar `generarDocumentoPDF(presupuesto)` como envoltorio que llama al builder y ejecuta `doc.save(...)`; el comportamiento externo de `generarDocumentoPDF` NO debe cambiar (contracts/exportacion.md, research.md Decisión 2, RF-003)

**Checkpoint**: Utilidades puras listas y `pdf.ts` refactorizado sin cambiar el PDF individual. Comienza el trabajo por historias.

---

## Phase 3: Historia de usuario 1 - Descargar una copia completa en un solo clic (Prioridad: P1) 🎯 MVP

**Objetivo**: Un botón "Exportar todo (.zip)" que genere y descargue un único `.zip` con un PDF por presupuesto numerado y un único `datos.json`, como operación de solo lectura y atómica.

**Prueba independiente**: Con 3 presupuestos numerados, pulsar el botón descarga un único `.zip`; al descomprimirlo hay exactamente 3 PDF y un `datos.json`, y cada PDF es idéntico al individual (control 3.604,00 €).

### Tests para Historia de usuario 1 (escribir primero, deben FALLAR) ⚠️

- [ ] T006 [P] [US1] Crear `tests/services/exportacion.test.ts` con casos: (a) selección incluye solo `estado === 'numerado'` (borradores fuera, RF-005); (b) `construirDatosJson()` contiene `presupuestos`, `catalogo`, `perfil`, `contador` y **no** contiene `clientes` (RF-004); (c) solo lectura: `localStorage` no cambia tras exportar (RF-009, CE-007). Deben fallar por no existir aún el servicio.

### Implementación para Historia de usuario 1

- [ ] T007 [US1] Crear `src/services/exportacion.ts` con las interfaces del contrato: `ResultadoExportacion`, `OnProgreso`, y firmas de `exportarTodoZip`, `construirZip`, `construirDatosJson` (contracts/exportacion.md, data-model.md)
- [ ] T008 [US1] Implementar `construirDatosJson(): object` en `src/services/exportacion.ts`: leer con `getItem` las claves `presupuestospro_presupuestos`, `presupuestospro_catalogo`, `presupuestospro_perfil`, `presupuestospro_contador`; envolver como `{ version: 1, exportadoEl: <ISO>, datos: { presupuestos, catalogo, perfil, contador } }`; NO incluir `clientes` (data-model.md, RF-004)
- [ ] T009 [US1] Implementar en `src/services/exportacion.ts` la selección de numerados (`filter(p => p.estado === 'numerado')`) y la generación secuencial de PDFs reutilizando `construirDocumentoPDF` + `doc.output('blob')` para producir `EntradaPDF[]` (data-model.md, RF-003)
- [ ] T010 [US1] Implementar `construirZip(onProgreso?)` en `src/services/exportacion.ts`: empaquetar con JSZip cada PDF (`zip.file`) y `datos.json` (`JSON.stringify(obj, null, 2)`), generar `Blob` con `zip.generateAsync({ type: 'blob' })`; devolver `{ blob, nombreZip }` usando `presupuestospro-copia-${fechaLocalISO()}.zip` (RF-002, RF-006)
- [ ] T011 [US1] Implementar `exportarTodoZip(onProgreso?)` en `src/services/exportacion.ts`: orquestar selección → `construirZip` → disparar descarga (crear `URL.createObjectURL`, `<a download>`, clic programático, `URL.revokeObjectURL`); devolver `{ ok: true, nombreZip }` en éxito (research.md Decisión 7, RF-002)
- [ ] T012 [US1] Añadir botón "Exportar todo (.zip)" en la cabecera de `src/components/Presupuestos/PresupuestosPage.tsx` (junto a "Nuevo presupuesto") que invoque `exportarTodoZip` y dispare la descarga (RF-001)
- [ ] T013 [US1] Ejecutar `npm run test` y verificar que los tests de T006 pasan tras la implementación; ajustar hasta verde

**Checkpoint**: US1 completa — el botón descarga un `.zip` correcto con PDFs idénticos y `datos.json`. MVP funcional y testeable de forma independiente.

---

## Phase 4: Historia de usuario 2 - Nombres reconocibles y a prueba de errores (Prioridad: P2)

**Objetivo**: El `.zip` lleva la fecha local del día; cada PDF se llama "número - cliente" y los nombres se sanean para que el `.zip` se descomprima sin errores aunque el cliente tenga caracteres conflictivos.

**Prueba independiente**: Crear un presupuesto para "Diseño/Web S.L.", exportar y comprobar que el `.zip` se descomprime sin errores y su PDF tiene un nombre válido; y que el `.zip` se llama `presupuestospro-copia-AAAA-MM-DD.zip`.

### Tests para Historia de usuario 2 (escribir primero, deben FALLAR) ⚠️

- [ ] T014 [P] [US2] Crear `tests/services/nombreArchivo.test.ts` con casos: "Diseño/Web S.L." produce nombre válido sin `/`; caracteres de control y `\ : * ? " < > |` eliminados/sustituidos; espacios colapsados; cadena vacía o solo inválidos → `"sin-nombre"` (RF-008, CE-005)
- [ ] T015 [P] [US2] Añadir a `tests/services/exportacion.test.ts` casos de nombrado: PDF nombrado `"<numero> - <cliente saneado>.pdf"` (ej. `2026-001 - Estudio García.pdf`) y nombre del `.zip` `presupuestospro-copia-AAAA-MM-DD.zip` con fecha local (RF-006, RF-007)

### Implementación para Historia de usuario 2

- [ ] T016 [US2] En `src/services/exportacion.ts`, aplicar `sanearNombreArchivo` al construir el `nombreArchivo` de cada `EntradaPDF` con el formato `"<numero> - <cliente> .pdf"` saneado (RF-007, RF-008)
- [ ] T017 [US2] Verificar/ajustar en `construirZip` que el nombre del `.zip` usa `fechaLocalISO()` (fecha local, no UTC) tal como exige RF-006 (research.md Decisión 4)
- [ ] T018 [US2] Ejecutar `npm run test` y verificar que T014 y T015 pasan; ajustar hasta verde

**Checkpoint**: US1 y US2 funcionan de forma independiente — nombres correctos y `.zip` robusto ante caracteres conflictivos.

---

## Phase 5: Historia de usuario 3 - Confianza en exportaciones grandes y aviso si no hay nada (Prioridad: P3)

**Objetivo**: Barra de progreso con contador real ("X de N") durante exportaciones grandes; tooltip "No hay nada que exportar" cuando no hay numerados; abortar sin descarga si falla algún PDF.

**Prueba independiente**: Con 50+ numerados aparece barra de progreso con contador real; con 0 numerados aparece tooltip y no se descarga nada.

### Tests para Historia de usuario 3 (escribir primero, deben FALLAR) ⚠️

- [ ] T019 [P] [US3] Añadir a `tests/services/exportacion.test.ts` casos: (a) 0 numerados → `{ ok: false, motivo: 'sin-numerados' }` y NO se construye/descarga zip (RF-011, CE-004); (b) atomicidad: si `construirDocumentoPDF` lanza para un presupuesto → `{ ok: false, motivo: 'fallo-pdf' }` y no se produce blob (RF-014); (c) `onProgreso(generados, total)` se invoca `total` veces con valores `1..total`, verificado también con un lote grande (p. ej. 200 numerados) para cubrir RF-010 y CE-006 (RF-012)

### Implementación para Historia de usuario 3

- [ ] T020 [US3] En `src/services/exportacion.ts`, implementar el caso vacío: si no hay numerados, devolver `{ ok: false, motivo: 'sin-numerados', mensaje: 'No hay nada que exportar' }` sin construir zip (RF-011)
- [ ] T021 [US3] En `src/services/exportacion.ts`, implementar atomicidad: envolver la generación de PDFs en try/catch; si alguno lanza, abortar y devolver `{ ok: false, motivo: 'fallo-pdf', mensaje: 'No se pudo generar la copia. No se ha descargado ningún archivo. Inténtalo de nuevo.' }` sin descargar (RF-014)
- [ ] T022 [US3] En `src/services/exportacion.ts`, invocar `onProgreso(generados, total)` tras generar cada PDF (contador real `1..total`) (RF-012)
- [ ] T023 [US3] En `src/components/Presupuestos/PresupuestosPage.tsx`, mostrar barra de progreso con texto "X de N" alimentada por `onProgreso`, deshabilitar el botón durante la exportación y ocultar la barra al terminar (contracts/exportacion.md — estados de UI)
- [ ] T024 [US3] En `src/components/Presupuestos/PresupuestosPage.tsx`, mostrar tooltip "No hay nada que exportar" cuando `motivo === 'sin-numerados'` y, cuando `motivo === 'fallo-pdf'`, mostrar el mensaje devuelto por el servicio ("No se pudo generar la copia. No se ha descargado ningún archivo. Inténtalo de nuevo.") (RF-011, RF-014, RF-013)
- [ ] T025 [US3] Ejecutar `npm run test` y verificar que T019 pasa; ajustar hasta verde

**Checkpoint**: Las tres historias funcionan de forma independiente.

---

## Phase 6: Pulido y aspectos transversales

**Propósito**: Estilos, verificación integral y actualización de contexto.

- [ ] T026 [P] Añadir estilos CSS para el botón "Exportar todo (.zip)" y la barra de progreso en `src/styles/global.css` (o el CSS del dominio), usando variables CSS nativas y diseño responsive (AGENTS.md — CSS puro)
- [ ] T027 Verificar solo lectura de extremo a extremo: revisar que `exportacion.ts` no llama a ningún `guardar*` ni `setItem` (RF-009, CE-007)
- [ ] T028 Ejecutar `npm run build` (`tsc -b` + `vite build`) y corregir cualquier error de tipos o build (quickstart.md)
- [ ] T029 Ejecutar la validación manual de `quickstart.md` (escenarios 1–5) y confirmar los criterios CE-001..CE-007 y RF-014; incluir una prueba de escala con 200 presupuestos numerados para verificar RF-010 (la exportación completa sin bloqueo perceptible y la barra de progreso avanza hasta la descarga)
- [ ] T030 [P] Actualizar `AGENTS.md` con la nueva dependencia JSZip y la convención de exportación (usar el skill `update-context` si procede)

---

## Dependencias y orden de ejecución

### Dependencias entre fases

- **Setup (Phase 1)**: sin dependencias — puede empezar de inmediato.
- **Foundational (Phase 2)**: depende de Setup — BLOQUEA todas las historias.
- **Historias (Phase 3+)**: dependen de Foundational.
  - US1 (P1) es el MVP y debe ir primero.
  - US2 (P2) y US3 (P3) construyen sobre `exportacion.ts` de US1 (mismo archivo), por lo que en la práctica van en orden P1 → P2 → P3.
- **Pulido (Phase 6)**: depende de las historias deseadas completas.

### Dependencias entre historias

- **US1 (P1)**: empieza tras Foundational. Sin dependencias de otras historias. Entrega el `.zip` básico.
- **US2 (P2)**: extiende el nombrado dentro de `exportacion.ts`; se apoya en US1 pero es verificable de forma independiente (nombres/saneado).
- **US3 (P3)**: añade progreso, vacío y atomicidad; se apoya en US1 pero es verificable de forma independiente (barra/tooltip/abortado).

### Dentro de cada historia

- Los tests (marcados) se escriben primero y deben fallar antes de implementar.
- En `exportacion.ts`: `construirDatosJson` → selección/generación → `construirZip` → `exportarTodoZip`.
- Servicio antes que UI.

### Oportunidades de paralelización

- Setup: T002 [P] junto a T001 (tras instalar).
- Foundational: T003 [P] y T004 [P] en paralelo (archivos distintos); T005 depende solo de sí mismo pero es secuencial por tocar `pdf.ts`.
- Tests marcados [P] de cada historia se escriben en paralelo si tocan archivos distintos (T014 vs T015).
- Pulido: T026 [P] y T030 [P] en paralelo.

**Nota importante**: US1, US2 y US3 modifican el MISMO archivo `src/services/exportacion.ts` y `PresupuestosPage.tsx`, por lo que sus tareas de implementación NO son paralelas entre historias; siga el orden P1 → P2 → P3.

---

## Ejemplo de paralelización: Foundational

```bash
# Utilidades puras en paralelo (archivos distintos):
Tarea: "Añadir fechaLocalISO() en src/utils/dates.ts"
Tarea: "Crear sanearNombreArchivo() en src/utils/nombreArchivo.ts"
```

---

## Estrategia de implementación

### MVP primero (solo US1)

1. Completar Phase 1 (Setup) y Phase 2 (Foundational).
2. Completar Phase 3 (US1).
3. **PARAR y VALIDAR**: probar US1 de forma independiente (descarga de `.zip` con 3 numerados).
4. Demo/entrega si procede.

### Entrega incremental

1. Setup + Foundational → base lista.
2. US1 → probar → MVP (descarga de copia completa).
3. US2 → probar → nombres robustos.
4. US3 → probar → progreso, vacío y atomicidad.

---

## Notas

- Tareas [P] = archivos distintos, sin dependencias.
- La etiqueta [Historia] mapea cada tarea a su historia para trazabilidad.
- Verificar que los tests fallan antes de implementar.
- Commit atómico tras cada tarea o grupo lógico (convención del proyecto).
- Evitar: tareas vagas, conflictos en el mismo archivo, dependencias entre historias que rompan la independencia.
