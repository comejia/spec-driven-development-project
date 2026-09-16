## Context

Ver `proposal.md` — Why. Los pedidos ya se confirman desde la mesa
(capability `pedidos-mesa`) y nacen en estado `recibido`, pero no hay pantalla que
los gestione. El diseño de `pedidos-mesa` (archivado) dejó explícitamente para
`panel-cocina` tanto el empuje en tiempo real por SSE como las transiciones de
estado más allá de `recibido`.

Estado actual relevante:
- `pedidos(id, mesa_id, numero_pedido, estado, total_centimos, creado_en)` y
  `lineas_pedido(pedido_id, plato_id, nombre_plato, precio_centimos, cantidad, nota)`
  ya existen (`src/db.js`). `estado` arranca en `recibido`; `creado_en` es ISO 8601.
- `src/pedidos.js` define `ESTADO_INICIAL = 'recibido'` y `confirmarPedido(...)`,
  que inserta el pedido y devuelve `{ numeroPedido, estado, ... }`.
- `src/app.js` ya expone `/api/admin/*` protegido por el middleware `requiereSesion`
  (sesión de establecimiento con `express-session`), sirve el frontend estático y
  enruta el catch-all a `index.html`. No hay ningún endpoint SSE todavía.
- El frontend (`frontend/src/main.jsx`) enruta por `pathname`/query sin librería
  de routing: `/admin` → `Admin`, `?mesa=<token>` → `Pedido`, resto → `Carta`.

Restricciones fijadas por `openspec/config.yaml`: Node 22 + Express +
better-sqlite3; React 19 + Vite servido por Express; SSE (no polling, no
WebSockets) para tiempo real; español de España; euros con IVA; simplicidad,
accesibilidad y privacidad por diseño.

## Goals / Non-Goals

**Goals:**
- Máquina de estados de pedido explícita y validada en el backend
  (`recibido → en_preparacion → servido` + `cancelado` solo desde `recibido`),
  fuente única de verdad para las transiciones.
- Un único canal SSE que emita, a los clientes autenticados, los eventos que el
  panel necesita para reflejar cambios en vivo (pedido nuevo, cambio de estado,
  cancelación) sin recargar.
- Consultas de "pedidos del día" (vista activa) e "histórico del día" acotadas al
  día natural, reutilizando el esquema existente con marcas de tiempo añadidas.
- Reutilizar la sesión de establecimiento y el middleware `requiereSesion` ya
  existentes; no introducir un segundo mecanismo de autenticación.

**Non-Goals (nivel diseño):**
- Escalado multi-instancia del bus SSE: un único proceso Express con un emisor en
  memoria basta para una cafetería (una tablet, pocos clientes conectados).
- Persistencia o reenvío de eventos perdidos: si un cliente se desconecta,
  recarga y vuelve a leer el estado actual por la API REST; el SSE solo empuja
  novedades mientras está conectado.
- El alcance funcional excluido ya está en la spec (`Alcance del panel de
  cocina`): métricas, tickets, turnos, sonido configurable.

## Decisions

### 1. Máquina de estados en un módulo de dominio nuevo (`src/cocina.js`)
Concentrar en un módulo la tabla de transiciones válidas y las funciones
`avanzarEstado(db, numeroPedido, nuevoEstado)` y `cancelarPedido(db, numeroPedido)`,
en lugar de esparcir `UPDATE`s por las rutas. La transición se valida contra el
estado actual leído en la misma transacción SQLite; una transición inválida lanza
un `ErrorPedido` (patrón ya usado en `src/pedidos.js`) mapeado a 422 en la API.
- **Por qué:** una sola fuente de verdad para la regla estricta
  `recibido → en_preparacion → servido` sin saltos ni retrocesos, testeable en
  aislamiento y trazable por escenario.
- **Alternativas:** validar en cada ruta (se duplica y se desincroniza);
  validar en el frontend (insuficiente: la regla es de negocio y debe imponerse
  en el servidor).

### 2. Marcas de tiempo de transición como columnas nuevas en `pedidos`
Añadir en migración idempotente (`ALTER TABLE ... ADD COLUMN`, patrón de `db.js`)
columnas para los instantes de transición y de cancelación, p. ej.
`preparado_en`, `servido_en`, `cancelado_en` (ISO 8601, `NULL` por defecto). El
`estado` textual sigue siendo la verdad del estado actual; las marcas registran
"cuándo" (la spec exige registrar el momento de la cancelación).
- **Por qué:** cumple el requisito de registrar el momento de la cancelación sin
  borrar el pedido, deja preparado el histórico y evita una tabla de eventos
  separada (más simple). `ADD COLUMN` con `NULL` no rompe datos existentes.
- **Alternativas:** tabla `pedido_eventos` con historial completo (más potente
  pero excesivo para una cafetería y para lo que piden las specs).

### 3. Día natural para "del día" mediante `creado_en`
"Pedidos del día" e "histórico del día" se filtran por `creado_en` dentro del día
natural local del establecimiento (00:00–24:00). La vista activa =
`estado IN ('recibido','en_preparacion')` del día; el histórico =
`estado IN ('servido','cancelado')` del día, ordenados por antigüedad.
- **Por qué:** coincide con la jornada de una cafetería y con "los pedidos del
  día"; no necesita concepto de turno (fuera de alcance).
- **Alternativas:** ventana de 24 h móvil o turnos configurables — más complejos
  y no pedidos.

### 4. SSE con Express nativo y un emisor en memoria (sin dependencias nuevas)
Un endpoint `GET /api/admin/cocina/stream` bajo `requiereSesion` responde con
`Content-Type: text/event-stream`, mantiene la conexión abierta y registra la
respuesta en un conjunto de suscriptores en memoria. Las mutaciones —confirmar un
pedido (`src/pedidos.js`), avanzar estado y cancelar (`src/cocina.js`)— publican
un evento (`pedido-nuevo`, `pedido-actualizado`) que se difunde a los suscriptores.
El frontend usa `EventSource` nativo. Un comentario/heartbeat periódico mantiene
viva la conexión.
- **Por qué:** `config.yaml` fija SSE (no polling, no WebSockets); SSE es
  unidireccional servidor→cliente, justo lo que necesita el panel, y Express lo
  sirve sin librerías. `EventSource` es nativo del navegador.
- **Alternativas:** WebSockets (bidireccional, excede la necesidad y lo veta el
  contexto); polling (lo veta el contexto y es menos inmediato). **Sin
  dependencias nuevas** (cumple la regla de diseño).

### 5. El aviso de pedido nuevo es responsabilidad del cliente y es "simple"
El backend solo emite el evento `pedido-nuevo`; el panel muestra un aviso visual
simple (banner/resaltado) al recibirlo. Nada de sonido configurable (fuera de
alcance).
- **Por qué:** mantiene el backend agnóstico de presentación y respeta el límite
  de "un aviso simple basta".

### 6. Exponer el panel en una ruta autenticada `/cocina` del propio frontend
Añadir en `main.jsx` una rama por `pathname` (`/cocina` → nuevo componente
`Cocina`), al igual que `/admin`. El componente exige sesión (reutiliza el mismo
login del establecimiento) antes de mostrar los pedidos.
- **Por qué:** encaja con el enrutado mínimo actual sin añadir router; separa el
  panel de cocina de la administración de carta, que son tareas distintas en la
  barra.
- **Alternativas:** una pestaña más dentro de `Admin` (mezcla gestión de catálogo
  con operación de servicio; menos claro para el uso en tablet).

## Risks / Trade-offs

- **Suscriptores SSE en memoria se pierden al reiniciar el proceso** → El estado
  vive en SQLite; al reconectar, el panel recarga la vista por REST y el SSE
  retoma el empuje. No se garantiza entrega de eventos durante la caída (aceptable
  para una cafetería).
- **Conexiones SSE colgadas o proxies que cortan la conexión** → heartbeat
  periódico y limpieza del suscriptor al cerrarse la respuesta; el navegador
  reconecta `EventSource` automáticamente.
- **Frontera del "día natural" (medianoche)** → un pedido confirmado antes de
  medianoche deja de verse en la vista activa del día siguiente; se asume el día
  natural local como convención; queda documentado para no sorprender.
- **Carrera entre dos operarios sobre el mismo pedido** → la transición se valida
  contra el estado actual dentro de una transacción SQLite; la segunda operación
  ve el estado ya cambiado y se rechaza con 422, sin corromper el pedido.
- **Migración de columnas** → `ADD COLUMN` con `NULL` por defecto es idempotente
  y no reescribe filas; los pedidos previos quedan con marcas `NULL`, coherente.

## Migration Plan

1. Migración idempotente en `src/db.js`: añadir las columnas de marca de tiempo a
   `pedidos` si no existen. Compatible hacia atrás (valores `NULL`).
2. Añadir `src/cocina.js` (transiciones, cancelación, consultas del día/histórico)
   y el emisor SSE; enganchar la publicación de eventos en `confirmarPedido`.
3. Añadir rutas bajo `/api/admin/cocina/*` (lista del día, histórico, avanzar,
   cancelar, `stream`) en `src/app.js`, todas tras `requiereSesion`.
4. Añadir el componente `Cocina` en el frontend y su rama de enrutado en
   `main.jsx`.
5. Sin datos que reescribir; rollback = revertir el código (las columnas nuevas
   quedan sin uso y no estorban).
