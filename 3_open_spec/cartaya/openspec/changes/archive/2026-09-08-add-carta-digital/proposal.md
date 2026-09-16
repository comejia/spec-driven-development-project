## Why

La Estación mantiene la carta en hojas plastificadas que casi nunca están al día: cuando cambia un precio o se agota un plato, la carta miente. Andrés necesita poder actualizar la carta él mismo, desde el móvil, y que el cliente la vea al instante al escanear el QR de su mesa, sin instalar nada ni registrarse. Además, mostrar los 14 alérgenos de declaración obligatoria es una exigencia legal que las cartas plastificadas cumplen mal.

Este cambio cubre solo la **consulta pública de la carta** y la **administración del catálogo**. El flujo de pedido desde la mesa es un cambio posterior.

## What Changes

- Se introduce una **carta digital pública** consultable sin identificación, organizada en categorías con orden manual definido por el dueño, mostrando dentro de cada categoría todos los platos activos en el orden que el dueño decida.
- Cada plato muestra nombre, precio (euros, IVA incluido), descripción corta, foto opcional y **alérgenos siempre visibles** (los 14 de la normativa europea); un plato sin alérgenos declara explícitamente "sin alérgenos".
- Se introduce una **pantalla de administración del catálogo** protegida por la sesión de establecimiento, pensada para móvil, donde Andrés crea, edita, reordena y archiva categorías y platos, y sube fotos (JPG, PNG o WebP, hasta 5 MB).
- Los platos y categorías no se borran físicamente: se **archivan**. Los archivados no aparecen jamás en la carta pública pero se conservan (los pedidos históricos de futuros cambios los referenciarán).
- Objetivo de rendimiento: la carta pública carga en **menos de 2 segundos** en un móvil de gama media con 4G.

Decisiones de negocio registradas (2026-09-07):
- La visibilidad de un plato en la carta depende únicamente de que no esté archivado (no hay estado "agotado" en este cambio).
- El precio se almacena y muestra con IVA incluido, en euros.
- La foto es opcional; su ausencia es válida y la carta debe verse bien sin ella.
- "Sin alérgenos" es un estado declarado explícitamente, no la ausencia de datos.

Decisiones de negocio adicionales, recomendadas y registradas (2026-09-07):
- **Archivar una categoría oculta también sus platos de la carta pública**: al archivar una categoría, esa categoría y todos sus platos dejan de aparecer en la carta pública; los platos conservan su propio estado y volverían a mostrarse si la categoría se reactivara. Se elige esta opción (frente a bloquear el archivado) por ser la más simple y predecible para Andrés (principio 2).
- **Límite de foto: 5 MB por imagen; formatos aceptados JPG, PNG y WebP**. Cubre fotos hechas con el móvil sin penalizar la carga; se rechaza cualquier otro formato o tamaño mayor.
- **El precio es obligatorio y debe ser mayor que 0**. No se permiten platos gratuitos ni sin precio en este cambio; evita cartas con precios en blanco o a 0 € por error.
- **La descripción corta es opcional, con un máximo de 200 caracteres**. Permite platos sin descripción y mantiene la carta legible en móvil.
- **Los alérgenos declaran solo presencia ("contiene"), sin trazas ("puede contener")** en este cambio. Cumple la obligación legal principal con la mínima complejidad; las trazas se podrán añadir en un cambio futuro si Andrés lo necesita.
- **Nombres únicos**: no se permiten dos categorías con el mismo nombre, ni dos platos con el mismo nombre dentro de la misma categoría (comparación sin distinguir mayúsculas ni espacios sobrantes). Evita duplicados confusos en la carta.

## Capabilities

### New Capabilities
- `carta-publica`: la carta digital que el cliente consulta desde el móvil al escanear el QR de la mesa: categorías ordenadas, platos activos con precio, descripción, foto opcional y alérgenos siempre visibles; acceso público y carga rápida.
- `catalogo-admin`: la administración del catálogo (categorías y platos) por parte del dueño desde una pantalla protegida por la sesión de establecimiento: crear, editar, reordenar, archivar y subir fotos con límite de tamaño.

### Modified Capabilities
<!-- No hay specs existentes; no se modifica ninguna capability. -->

## Impact

- **Specs nuevas**: `openspec/specs/carta-publica/spec.md`, `openspec/specs/catalogo-admin/spec.md`.
- **Backend**: Node.js 22 + Express, endpoints públicos de lectura de la carta y endpoints de administración protegidos por sesión; persistencia en SQLite (better-sqlite3) con tablas de categorías y platos, ambas con soporte de archivado y orden manual, y almacenamiento de fotos con límite de tamaño.
- **Frontend**: React 19 + Vite, servido como estáticos por Express; vista pública de la carta y vista de administración, ambas responsive y accesibles (contraste alto, tipografía legible, botones grandes).
- **Autenticación**: reutiliza la sesión simple con contraseña de establecimiento para la zona de administración; la carta pública no requiere sesión.
- **Fuera de alcance**: pedido desde la mesa, panel de cocina, precios por franjas horarias, múltiples idiomas y cualquier forma de cuenta o registro del cliente final.
