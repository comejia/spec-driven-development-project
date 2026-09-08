## Context

Ver proposal.md (Why) para la motivación. Este cambio cubre la carta pública de solo lectura y la administración del catálogo; el pedido desde la mesa queda fuera.

Restricciones fijadas por `openspec/config.yaml`:
- Backend Node.js 22 + Express + better-sqlite3 (SQLite en un único fichero).
- Frontend React 19 + Vite, compilado a estáticos y servido por el propio Express. CSS propio.
- Autenticación: sesión simple con contraseña de establecimiento; sin multiusuario.
- Idioma español de España, precios en euros con IVA incluido.
- Simplicidad y accesibilidad reales; privacidad por diseño (la carta pública no toca datos del cliente).

Estado actual: no hay specs vivas ni código previo; es el primer cambio funcional del proyecto, por lo que también establece la base de datos, el esqueleto del servidor Express y el arranque del frontend.

## Goals / Non-Goals

**Goals:**
- Un modelo de datos mínimo en SQLite para categorías y platos, ambos con orden manual y archivado (soft-delete).
- Una API de lectura pública de la carta y una API de administración protegida por sesión.
- Servir la carta pública con una única respuesta ligera para cumplir el objetivo de <2s en 4G.
- Alérgenos como dato de primera clase con estado "sin alérgenos" explícito, nunca ausencia.

**Non-Goals:**
- Real-time/SSE: no aplica a este cambio (la carta no cambia mientras el cliente la mira); se reserva para el flujo de pedido.
- Gestión de usuarios/roles más allá de la única sesión de establecimiento.
- Redimensionado/optimización avanzada de imágenes más allá de validar el límite de tamaño.

## Decisions

**Modelo de datos (SQLite, better-sqlite3):**
- `categorias(id, nombre, orden, archivada_en NULL)`.
- `platos(id, categoria_id, nombre, descripcion, precio_centimos, foto_ruta NULL, sin_alergenos, orden, archivado_en NULL)`.
- `platos_alergenos(plato_id, alergeno)` con `alergeno` restringido a los 14 códigos de la normativa UE.
- Precio en céntimos de euro (entero) para evitar errores de coma flotante; se formatea a euros con IVA en presentación. Alternativa descartada: `REAL`, propenso a errores de redondeo.
- Archivado = columna `archivado_en`/`archivada_en` (timestamp nullable) en vez de borrado físico, cumpliendo la conservación para pedidos históricos. Alternativa descartada: borrar filas, incompatible con referencias históricas futuras.
- Orden manual = columna entera `orden`; reordenar reescribe los valores. Suficiente para el volumen de una cafetería; alternativa (listas enlazadas/fracciones) descartada por complejidad innecesaria (principio 2).

**Alérgenos:** un plato es válido solo si tiene `sin_alergenos = 1` sin filas en `platos_alergenos`, o `sin_alergenos = 0` con una o más filas. Se valida en la capa de administración y se refleja siempre en la respuesta pública. Esto hace imposible el estado "sin información". Solo se declara presencia ("contiene"); no se modelan trazas en este cambio.

**Validaciones de administración:** el precio (`precio_centimos`) debe ser un entero > 0; la descripción es opcional y, si existe, de máximo 200 caracteres; los nombres son únicos entre elementos no archivados (categorías entre sí; platos dentro de su categoría), comparando normalizado (sin distinguir mayúsculas ni espacios sobrantes). Las fotos se aceptan solo en JPG/PNG/WebP y hasta 5 MB, validando tipo y tamaño en la subida multipart.

**Archivado en cascada de categoría:** archivar es soft-delete por timestamp. La carta pública se construye filtrando categorías con `archivada_en IS NULL` y, dentro de ellas, platos con `archivado_en IS NULL`; así, al archivar una categoría sus platos dejan de mostrarse sin tocar su propio `archivado_en`, y reactivar la categoría los vuelve a mostrar.

**API pública:** un único endpoint `GET /api/carta` devuelve categorías activas ordenadas, cada una con sus platos activos ordenados y sus alérgenos ya resueltos, en una sola respuesta JSON. Minimiza viajes de red para el objetivo <2s. Las fotos se sirven como estáticos con cabeceras de caché.

**API de administración:** endpoints bajo `/api/admin/*` protegidos por middleware de sesión (contraseña de establecimiento). Cubren crear/editar/reordenar/archivar categorías y platos y subir fotos (multipart con validación de tamaño). Reutiliza la sesión de establecimiento existente en el stack; no introduce usuarios. Además, un endpoint de solo lectura `GET /api/admin/catalogo` (bajo la misma sesión) devuelve el catálogo completo de administración: todas las categorías no archivadas, incluidas las que no tienen platos, con sus platos no archivados. Se distingue de `GET /api/carta` en que no oculta las categorías vacías, para que el dueño pueda añadirles platos.

**Frontend:** dos vistas React servidas como estáticos por Express: la carta pública (solo lectura, sin sesión) y la administración (tras la sesión). CSS propio con tokens de contraste alto, tipografía grande y objetivos táctiles amplios, aplicando accesibilidad a ambas vistas. En la vista de administración, el formulario de edición de un plato incluye un control de subida de foto (`<input type="file">` con formatos JPG/PNG/WebP) que envía la imagen como multipart a `POST /api/admin/platos/:id/foto`. La foto no se sube al crear el plato (que aún no tiene id) sino al editarlo.

**Trazabilidad de tests:** cada escenario de las specs tendrá un test cuyo nombre referencie el escenario, según la regla del config.

## Risks / Trade-offs

- [Rendimiento con muchas fotos grandes puede romper el objetivo <2s] → Validar límite de tamaño en subida, servir fotos con caché y cargar la carta en una sola respuesta JSON sin imágenes embebidas.
- [`orden` entero puede colisionar o dejar huecos al reordenar] → Reescribir el bloque de `orden` de la categoría afectada dentro de una transacción; el volumen es pequeño.
- [Sesión única de establecimiento no distingue dispositivos] → Aceptable por diseño (principio 2, no hay multiusuario); la carta pública no requiere sesión.
- [Almacenar fotos en disco junto al fichero SQLite] → Simplicidad frente a un object store; documentar la ruta de fotos y su inclusión en copias de seguridad.

## Migration Plan

Primer cambio funcional: se crea el esquema SQLite mediante migración/inicialización idempotente al arrancar (crear tablas si no existen). No hay datos previos que migrar. Rollback: al no haber estado previo, revertir consiste en no desplegar; el fichero SQLite puede descartarse en desarrollo.
