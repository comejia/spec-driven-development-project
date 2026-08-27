# Guía de Validación: PresupuestosPro v0

## Requisitos previos

- Node.js 18+ instalado
- Navegador moderno (Chrome, Firefox, Safari o Edge)

## Arranque

```bash
# Instalar dependencias
npm install

# Arrancar en modo desarrollo
npm run dev
```

La aplicación se abre en `http://localhost:5173` (puerto por defecto de Vite).

## Escenarios de validación

### Escenario 1: Perfil completo y persistencia (CA-007, CA-009)

1. Abrir la app → ir a "Perfil".
2. Rellenar: nombre, NIF, dirección, teléfono, email.
3. Subir un logo PNG o JPG (< 2 MB).
4. Guardar.
5. Cerrar la pestaña del navegador.
6. Volver a abrir la app.
7. **Resultado esperado**: todos los datos del perfil siguen ahí, incluido el logo.

### Escenario 2: Catálogo de servicios con nombre único (RF-004, RF-005)

1. Ir a "Catálogo" → crear servicio "Diseño web" con precio 1.500,00 €.
2. Guardar → aparece en la lista.
3. Intentar crear otro servicio "diseño web" (minúsculas).
4. **Resultado esperado**: se muestra aviso de nombre duplicado; no se crea.

### Escenario 3: Crear presupuesto con cálculos correctos (CA-001, CA-002, CA-003)

1. Crear un cliente "Empresa Ejemplo" de tipo "empresa/autónomo".
2. Crear un presupuesto nuevo para ese cliente.
3. Añadir línea: "Diseño de página web", cantidad 1, precio 1.500,00 €.
4. Añadir línea: "Sesión de fotos de producto", cantidad 1, precio 500,00 €.
5. Activar retención del 15 %.
6. **Resultado esperado**: base = 2.000,00 €, IVA = 420,00 €, retención = −300,00 €, **total = 2.120,00 €**.
7. Cambiar retención a 7 %.
8. **Resultado esperado**: total cambia a **2.280,00 €** sin recargar la página.
9. Cambiar retención a "sin retención".
10. **Resultado esperado**: total = **2.420,00 €**.

### Escenario 4: Cliente particular sin retención (CA-003, RF-014)

1. Crear un cliente "Juan Pérez" de tipo "particular".
2. Crear un presupuesto para ese cliente con las mismas líneas del escenario 3.
3. Intentar activar retención del 15 %.
4. **Resultado esperado**: la retención NO se aplica (manda el tipo de cliente). Total = **2.420,00 €**.

### Escenario 5: Generar PDF con numeración (CA-004, CA-005)

1. Con el presupuesto del escenario 3, pulsar "Generar PDF".
2. **Resultado esperado**: se descarga un PDF con:
   - Logo del freelancer.
   - Datos del freelancer y del cliente.
   - Número: 2026-001 (o el año actual + 001).
   - Fecha de emisión: hoy.
   - Validez: hoy + 30 días.
   - Tabla con las dos líneas.
   - Desglose: base, IVA, retención, total.
3. Crear otro presupuesto y generar su PDF.
4. **Resultado esperado**: número = 2026-002.

### Escenario 6: Presupuesto sin líneas no genera PDF (CA-008)

1. Crear un presupuesto nuevo (sin añadir líneas).
2. Intentar generar PDF.
3. **Resultado esperado**: se muestra aviso; no se descarga nada.

### Escenario 7: Editar presupuesto numerado (CA-010)

1. En el presupuesto 2026-001 ya generado, pulsar "Editar".
2. **Resultado esperado**: el original queda como histórico; se abre una copia borrador.
3. Modificar una línea en la copia.
4. Generar PDF de la copia.
5. **Resultado esperado**: la copia recibe número 2026-003 (el siguiente disponible). El presupuesto 2026-001 sigue intacto.

### Escenario 8: Editar/borrar líneas con recálculo (CA-006)

1. En un presupuesto borrador con dos líneas, editar el precio de la primera línea a 2.000 €.
2. **Resultado esperado**: base = 2.500,00 €, totales actualizados al instante.
3. Eliminar la segunda línea.
4. **Resultado esperado**: base = 2.000,00 €, totales actualizados al instante.

### Escenario 9: Perfil sin logo bloquea PDF (CA-009, CL4)

1. Ir a "Perfil" → eliminar el logo.
2. Intentar generar PDF de un presupuesto borrador.
3. **Resultado esperado**: se muestra aviso; no se genera.
4. Descargar un presupuesto ya numerado anteriormente.
5. **Resultado esperado**: se descarga correctamente (conserva el logo anterior).

## Comandos de test

```bash
# Ejecutar todos los tests
npm run test

# Tests en modo watch (durante desarrollo)
npm run test:watch

# Build de producción
npm run build

# Preview del build
npm run preview
```

## Despliegue

```bash
# Generar build estático
npm run build

# El contenido de dist/ se puede subir a cualquier hosting estático:
# - Netlify: arrastrar carpeta dist/
# - Vercel: conectar repo y configurar "npm run build" + output "dist"
# - GitHub Pages: subir dist/ al branch gh-pages
```

No se requiere servidor, base de datos, ni variables de entorno.
