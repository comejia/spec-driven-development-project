## Context

Ver `proposal.md` (Why) para la motivación y `specs/pedidos-mesa/spec.md` para los requisitos. Este cambio añade el flujo de pedido sobre la carta que ya existe; consume `carta-publica`/`catalogo-admin` sin alterar su comportamiento observable.

Estado actual relevante (verificado en el código):
- `src/db.js` inicializa el esquema SQLite de forma idempotente (`CREATE TABLE IF NOT EXISTS`), con `journal_mode = WAL` y `foreign_keys = ON`. Existen `categorias`, `platos` (con `precio_centimos` entero y soft-delete `archivado_en`) y `platos_alergenos`.
- `src/carta.js` construye la carta pública filtrando `archivada_en IS NULL` / `archivado_en IS NULL`; el precio se guarda en céntimos con IVA incluido y se formatea con `Intl.NumberFormat('es-ES', EUR)`.
- La API pública vive bajo `/api/*` en `src/app.js`; la administración bajo `/api/admin/*` protegida por sesión de establecimiento.

Restricciones fijadas por `openspec/config.yaml`: Node 22 + Express + better-sqlite3; React 19 + Vite servido por Express; SSE (no polling) para tiempo real; español de España; euros con IVA; simplicidad, accesibilidad y privacidad por diseño.

## Goals / Non-Goals

**Goals:**
- Modelo de datos mínimo para mesas y pedidos con líneas, reutilizando la convención existente (enteros, céntimos, timestamps).
- Un pedido siempre ligado a una mesa (por token de QR) y jamás a una persona; ningún campo de datos personales en el modelo ni en la API.
- Validar en el servidor, en el momento de confirmar, que las líneas corresponden a platos activos, retirando las que no y recalculando el total.
- Que el precio de cada línea sea el vigente en el momento de confirmar y se conserve en el pedido para no depender de futuros cambios de carta.

**Non-Goals (a nivel de diseño):**
- SSE / actualización en tiempo real del estado: el estado se consulta bajo demanda por número de pedido; el empuje en tiempo real llegará con `panel-cocina`.
- Panel de cocina, transiciones de estado más allá del estado inicial "recibido".
- Pago, propinas, división de cuenta, llamar al camarero y para llevar (fuera de alcance por proposal).
- Alta/edición/archivado de mesas desde la administración: se asume un conjunto de mesas sembrado; su CRUD, si hace falta, será un cambio posterior. Sí entra en alcance **visualizar** las mesas sembradas con su QR en `/admin` (solo lectura).

## Decisions

**Modelo de datos (SQLite, better-sqlite3), añadido idempotente en `src/db.js`:**
- `mesas(id, numero, token, archivada_en NULL)`: `token` es una cadena opaca única (la que codifica el QR impreso); `numero` es la etiqueta visible de la mesa. Se resuelve la mesa por `token`, no por `numero`, para que el QR no sea adivinable por número correlativo.
- `pedidos(id, mesa_id, numero_pedido, estado, total_centimos, creado_en)`: `numero_pedido` es el identificador que ve el cliente; `estado` arranca en `recibido` (estado inicial disponible para cocina). `total_centimos` se congela al confirmar.
- `lineas_pedido(id, pedido_id, plato_id, nombre_plato, precio_centimos, cantidad, nota NULL)`: se guarda `nombre_plato` y `precio_centimos` **copiados** del plato en el momento de confirmar (snapshot), de modo que archivar o cambiar el precio del plato después no altere pedidos ya confirmados. `cantidad` entero > 0; `nota` texto opcional de máx. 140 caracteres.
- Alternativa descartada: referenciar el precio del plato en vivo (join) al mostrar el pedido — rompe el histórico cuando la carta cambia; el snapshot es más simple y correcto (principio 2).

**Número de pedido:** entero secuencial por establecimiento (no por mesa), sencillo de cantar en barra y único globalmente. Alternativa descartada: número por mesa (colisiona entre mesas y complica la búsqueda por número).

**Identidad de mesa por token:** el QR abre una URL con el token de la mesa; el frontend lo envía al backend, que resuelve la mesa. Sin token válido no se inicia pedido. No se guarda ninguna cookie ni dato del cliente (principio 3). Alternativa descartada: identificar por número de mesa en la URL — adivinable y frágil.

**Estado del carrito antes de confirmar:** el pedido "en composición" vive en el **cliente** (estado React), no en el servidor; el servidor solo materializa el pedido al confirmar. Esto evita pedidos huérfanos en la BD y sesiones de cliente (principio 3, principio 2). El servidor ofrece un endpoint para **validar/previsualizar** el pedido (resolver precios y detectar platos inactivos) y otro para **confirmar**.

**Validación de platos activos al confirmar:** la confirmación reevalúa cada `plato_id` contra la carta (activo = `archivado_en IS NULL` y su categoría `archivada_en IS NULL`, misma regla que `construirCarta`). Las líneas de platos inactivos se retiran, se informan en la respuesta y el total se recalcula. Si no queda ninguna línea, la confirmación se rechaza como pedido vacío. Se hace dentro de una transacción para leer estado y crear el pedido de forma coherente.

**API (bajo `/api/*`, sin sesión — es flujo de cliente):**
- `GET /api/mesa/:token` → resuelve la mesa (numero) o 404 si el token no existe.
- `POST /api/pedidos/preparar` con `{ token, lineas: [{ platoId, cantidad, nota }] }` → devuelve resumen con líneas resueltas (nombre, precio, subtotal), total en euros/céntimos y la lista de líneas retiradas por plato inactivo. No persiste nada.
- `POST /api/pedidos` con el mismo cuerpo → confirma: revalida, retira inactivos, y si queda al menos una línea crea el pedido y devuelve `{ numeroPedido, estado, total, lineasRetiradas }`. Rechaza 4xx si queda vacío o el token no es válido.
- `GET /api/pedidos/:numeroPedido` → estado actual del pedido (para la pantalla de confirmación/seguimiento).
- Validaciones de entrada: `cantidad` entero > 0; `nota` string de longitud ≤ 140; se rechaza con 4xx en caso contrario.

**Frontend (React 19 + Vite):** la vista pública detecta el token de mesa en la URL (p. ej. `/?mesa=<token>` o ruta dedicada) y activa el "modo pedido": botón de añadir por plato, control de cantidad, campo de nota (con contador y tope 140), pantalla de resumen con total y botón de confirmar, y pantalla final con el número de pedido y su estado. Reutiliza el render de la carta ya existente y los tokens de accesibilidad (contraste, tipografía, toque) del CSS actual (principio 5). Sin token, la carta se comporta como hoy (solo consulta).

**Sin dependencias nuevas:** todo se cubre con Express + better-sqlite3 ya presentes (regla de design). La generación física de los QR impresos es una tarea operativa fuera del software; el sistema solo necesita almacenar y resolver el token.

**Visualización de mesas con QR en `/admin`:** para que Andrés pueda imprimir los QR, la administración muestra las mesas sembradas con su enlace de pedido. Un endpoint de solo lectura `GET /api/admin/mesas` (bajo el middleware de sesión ya existente en `/api/admin/*`) devuelve las mesas no archivadas con `numero` y `token`; los tokens nunca se sirven sin sesión. El **QR se genera con la librería `qrcode`** a partir de la URL absoluta `/?mesa=<token>` construida con `window.location.origin`. Es solo lectura (no hay alta/baja de mesas) y no incluye botón de "abrir pedido": el objetivo es imprimir.

Justificación de la dependencia `qrcode` (regla de design: ninguna dependencia nueva sin justificación escrita): generar un código QR conforme a ISO/IEC 18004 (Reed-Solomon, información de formato con BCH, enmascarado, versiones) **no es trivial**; un encoder propio no se pudo garantizar correcto y no lo leían lectores reales de móvil. La correcta lectura del QR es un requisito duro (sin ella el flujo de pedido es inutilizable). Se usa `qrcode`, librería madura y ampliamente usada, en lugar de mantener código criptográfico/matemático propio (el principio 2 —simplicidad— favorece aquí reutilizar código probado, no reinventarlo). Se añade además `jsqr` como **devDependency** para un test que decodifica el QR generado y prueba objetivamente que se lee.

**Organización de `/admin` en pestañas:** la administración se parte en dos pestañas, "Carta" (categorías y platos, lo ya existente) y "Mesas" (mesas con su QR), mostrando solo la activa para no apilar todo en una pantalla. Se implementa con estado local en `Admin.jsx` (una variable de pestaña activa, "Carta" por defecto), sin librería de routing ni dependencias nuevas (principio 2, coherente con el enrutado mínimo de `main.jsx`).

**Trazabilidad de tests:** cada escenario de `specs/pedidos-mesa/spec.md` tendrá un test cuyo nombre lo referencie, con `node --test` (config).

## Risks / Trade-offs

- **Carrito en cliente ⇒ se pierde al recargar** → Aceptable: un pedido no confirmado es efímero; evita persistencia y sesiones de cliente (principio 3). Documentarlo en la UI ("tu pedido se envía al confirmar").
- **Carrera: un plato se archiva justo entre `preparar` y confirmar** → La revalidación autoritativa ocurre en `POST /api/pedidos` dentro de una transacción; `preparar` es solo orientativo. El cliente siempre ve el ajuste final antes del alta.
- **Token de QR adivinable si es corto o secuencial** → Usar un token opaco y suficientemente aleatorio; resolver siempre por token, nunca por número de mesa.
- **Número de pedido secuencial global filtra volumen del negocio** → Impacto irrelevante para una cafetería de barrio (principio 2); se prioriza que sea fácil de cantar en barra.
- **Snapshot de precio/nombre en la línea duplica dato de `platos`** → Es intencionado: preserva el histórico frente a cambios de carta; el coste de almacenamiento es despreciable.

## Migration Plan

Añadir las tablas `mesas`, `pedidos` y `lineas_pedido` en la inicialización idempotente de `src/db.js` (`CREATE TABLE IF NOT EXISTS`), sin tocar las tablas existentes; no hay datos que migrar. Sembrar un conjunto inicial de mesas con sus tokens (script o inserción idempotente) para poder generar los QR impresos. Rollback: como las tablas nuevas no afectan a la carta ni a la administración, revertir consiste en dejar de exponer los endpoints de pedido; en desarrollo, el fichero SQLite puede descartarse.
