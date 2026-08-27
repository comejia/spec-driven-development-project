# Research: PresupuestosPro v0

## Decisiones técnicas

### 1. Generación de PDF en el cliente

**Decisión**: jsPDF + jsPDF-AutoTable

**Razón**: Es la librería más madura para generar PDFs directamente en el navegador. jsPDF-AutoTable añade soporte para tablas con formato, que es exactamente lo que necesitamos para la tabla de líneas del presupuesto.

**Alternativas consideradas**:
- **pdf-lib**: Más bajo nivel, requiere posicionar cada elemento manualmente. Mayor esfuerzo para tablas.
- **pdfmake**: Declarativo y potente, pero el bundle es significativamente mayor (~2 MB vs ~400 KB de jsPDF).
- **html2pdf.js** (wrapper de html2canvas + jsPDF): Renderiza HTML a imagen y luego a PDF. Resultado visual bueno pero el texto no es seleccionable y el archivo es más pesado.

**Conclusión**: jsPDF + AutoTable ofrece el mejor equilibrio entre simplicidad, tamaño de bundle, y calidad del resultado (texto seleccionable, tablas nativas).

### 2. Framework de UI

**Decisión**: React 18 con TypeScript

**Razón**: La app tiene múltiples vistas con formularios interactivos y estado compartido (perfil, catálogo, clientes, presupuestos). React gestiona bien esta complejidad sin sobre-ingeniería. TypeScript previene errores en la lógica de cálculos.

**Alternativas consideradas**:
- **Vanilla JS**: Viable pero gestionar el estado reactivo de formularios y recálculos en tiempo real requeriría reinventar lo que React ya resuelve.
- **Vue 3**: Igual de válido. React se elige por ecosistema más amplio y mayor familiaridad generalizada.
- **Svelte**: Bundle más pequeño, pero ecosistema más reducido para librerías de componentes.

### 3. Empaquetador

**Decisión**: Vite

**Razón**: Desarrollo instantáneo (HMR rápido), configuración mínima para React + TypeScript, y build optimizado para producción. Es el estándar actual para proyectos React nuevos.

**Alternativas consideradas**:
- **Create React App**: Deprecado, ya no se recomienda.
- **Next.js**: Demasiado pesado para una app sin servidor. Añade SSR, routing de servidor, y API routes que no necesitamos.

### 4. Almacenamiento en localStorage

**Decisión**: localStorage con una capa de abstracción simple (módulo `storage/`)

**Razón**: La spec exige persistencia en el navegador sin nube. localStorage es síncrono, simple, y soportado universalmente. Una capa de abstracción permite cambiar a IndexedDB en el futuro sin tocar la lógica de negocio.

**Estructura de claves**:
- `presupuestospro_perfil` — datos del freelancer (JSON)
- `presupuestospro_catalogo` — array de servicios (JSON)
- `presupuestospro_clientes` — array de clientes (JSON)
- `presupuestospro_presupuestos` — array de presupuestos con sus líneas (JSON)
- `presupuestospro_contador` — objeto con año actual y último número asignado (JSON)

**Nota sobre el logo**: El logo se almacena como Data URL (base64) dentro del perfil. Un logo de 2 MB en base64 ocupa ~2,7 MB, lo cual cabe holgadamente en los ~5 MB de localStorage.

### 5. Diseño responsive

**Decisión**: CSS con enfoque mobile-first, sin framework CSS pesado

**Razón**: La app tiene pocas pantallas con formularios y tablas. Un sistema de CSS sencillo (variables CSS + flexbox/grid) es suficiente. No se justifica añadir Tailwind o Bootstrap para esta escala.

**Alternativas consideradas**:
- **Tailwind CSS**: Potente pero añade un paso de build y una curva de aprendizaje que no se justifica en v0.
- **Bootstrap**: Demasiado pesado para lo que necesitamos. Trae JS propio que entra en conflicto con React.
- **CSS Modules**: Se usarán para evitar colisiones de nombres, sin coste adicional (Vite los soporta nativamente).

### 6. Testing

**Decisión**: Vitest + React Testing Library

**Razón**: Vitest es compatible nativamente con Vite (mismo entorno, configuración compartida). React Testing Library es el estándar para testear componentes React desde la perspectiva del usuario.

**Foco de los tests**:
- **Unitarios (prioridad alta)**: Lógica de cálculos (base, IVA, retención, total, redondeo). Lógica de numeración (formato, reinicio anual).
- **Componentes (prioridad media)**: Formularios de perfil, catálogo, clientes. Flujo de creación de presupuesto.
- **Integración (prioridad baja en v0)**: Flujo completo crear presupuesto → generar PDF.

### 7. Gestión de estado

**Decisión**: React Context + useReducer (sin librería externa)

**Razón**: El estado de la app es moderado (perfil, catálogo, clientes, presupuestos). No justifica Redux ni Zustand. Context + useReducer es nativo de React, sin dependencias extra, y suficiente para esta escala.

**Si el estado crece en futuras versiones**: migrar a Zustand (mínimo, sin boilerplate) sería un cambio puntual.
