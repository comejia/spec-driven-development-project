# Guía de Validación: Mejora de presentación

## Requisitos previos

- Proyecto ya instalado (`npm install` ejecutado previamente)
- Datos de prueba en la app (al menos un presupuesto borrador y uno numerado, un par de clientes y servicios)

## Arranque

```bash
npm run dev
```

## Validación previa: tests existentes

```bash
npm run test
```

**Resultado esperado**: los 32 tests existentes pasan sin modificación. Si alguno falla, se tocó lógica por error.

## Escenarios de validación visual

### Escenario 1: Página de inicio (CA-001)

1. Abrir `http://localhost:5173/` (URL raíz).
2. **Resultado esperado**: se muestra la página de inicio (NO redirige a otra sección).
3. Verificar que aparecen:
   - Accesos directos a Presupuestos, Clientes, Catálogo y Perfil.
   - Resumen: X borradores, X numerados, X clientes, X servicios.
4. Si el perfil está incompleto: aparece un aviso invitando a completarlo.

### Escenario 2: Navegación común (CA-002, CA-003)

1. Desde la página de inicio, pulsar "Presupuestos" en la navegación.
2. Verificar que se carga la sección de presupuestos.
3. **Resultado esperado**: la navegación sigue visible (sticky top) y "Presupuestos" está resaltado.
4. Pulsar "Clientes" → se carga Clientes; "Clientes" resaltado.
5. Pulsar la marca "PresupuestosPro" → vuelve al inicio.
6. En móvil (o emulador): la navegación no se desborda y es usable.

### Escenario 3: Consistencia visual (CA-004)

1. Navegar por todas las secciones (Inicio, Perfil, Catálogo, Clientes, Presupuestos).
2. **Resultado esperado**: misma tipografía, mismos colores, mismo espaciado en todas.
3. Verificar jerarquía visual: títulos más grandes y oscuros, datos secundarios más sutiles, tablas con cabeceras diferenciadas.

### Escenario 4: Estados visuales de presupuestos (CA-005)

1. Ir a la lista de presupuestos.
2. **Resultado esperado**: los presupuestos en estado "Borrador" tienen un badge/etiqueta visual distinto a los "Numerados".
3. Los estados se distinguen por color y/o texto sin necesidad de leer el detalle.

### Escenario 5: PDF profesional (CA-006)

1. Generar un PDF de un presupuesto con retención.
2. Abrir el PDF descargado.
3. **Resultado esperado**:
   - Logo nítido y bien posicionado.
   - Tipografía sobria y legible.
   - Número y fechas en lugar prominente.
   - Tabla de líneas con cabeceras diferenciadas y columnas alineadas.
   - Desglose con total destacado visualmente respecto a los subtotales.

### Escenario 6: Mobile-first (CA-007)

1. Abrir la app en un móvil (o emulador con pantalla de 375px de ancho).
2. **Resultado esperado**: formularios usables, tablas legibles (scroll horizontal si necesario), navegación accesible, nada roto.

### Escenario 7: Datos existentes intactos (CA-008)

1. Tener datos previos en localStorage (presupuestos, clientes, servicios, perfil).
2. Recargar la app tras el rediseño.
3. **Resultado esperado**: todos los datos siguen ahí, sin migración ni errores.

### Escenario 8: Página de inicio vacía (CL1)

1. Abrir la app en un navegador con localStorage limpio.
2. **Resultado esperado**: se muestra mensaje de bienvenida con orientación para empezar (no contadores vacíos feos).
