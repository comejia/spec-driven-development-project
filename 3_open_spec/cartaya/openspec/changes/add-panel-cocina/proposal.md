## Why

Los clientes ya confirman pedidos desde la mesa (capability `pedidos-mesa`), pero
cocina y barra no tienen dónde verlos: un pedido nace en estado `recibido` y ahí
se queda, sin forma de gestionarlo. Falta la pantalla que cierra el circuito —una
tablet apoyada en la barra donde los pedidos "aparecen solos" y el personal los
va sacando adelante— para que el flujo de pedido sea usable en el día a día.

## What Changes

- Nueva pantalla **Panel de cocina**, protegida por la misma sesión de
  establecimiento que la administración de la carta.
- El panel muestra los **pedidos del día** en la vista activa, ordenados por
  antigüedad (el más viejo primero), con mesa, platos, cantidades, notas del
  cliente y el **tiempo transcurrido** desde que se confirmaron.
- Ciclo de vida del pedido con **transiciones estrictas**:
  `recibido → en_preparacion → servido`, sin saltos ni retrocesos.
- **Cancelación** solo permitida mientras el pedido está en `recibido`; registra
  el momento de la cancelación y **no borra** el pedido.
- Los pedidos **servidos** salen de la vista activa pero quedan consultables en
  un **histórico del día**.
- **Tiempo real por SSE**: el panel se actualiza solo (nuevos pedidos y cambios
  de estado) sin recargar la página, con un aviso simple al llegar un pedido
  nuevo. Se introduce el primer endpoint SSE del sistema.

Decisiones de negocio (2026-09-14):
- Las transiciones válidas son exactamente `recibido → en_preparacion → servido`;
  cualquier salto o retroceso se rechaza.
- Un pedido solo se cancela desde la app estando en `recibido`; una vez en
  `en_preparacion` o `servido`, la cancelación se resuelve hablando, no en la app.
- La cancelación registra el instante y conserva el pedido (no es un borrado).
- "Pedidos del día" y "histórico del día" se acotan al día natural de La Estación.

Fuera de alcance (2026-09-14): métricas y estadísticas, impresión de tickets,
gestión de turnos o empleados, y notificaciones sonoras configurables (basta un
aviso simple).

## Capabilities

### New Capabilities
- `panel-cocina`: pantalla autenticada para que cocina y barra gestionen los
  pedidos del día en tiempo real —ver los entrantes, avanzar su estado con
  transiciones estrictas, cancelar mientras estén en `recibido` y consultar el
  histórico del día— con actualización en vivo mediante SSE.

### Modified Capabilities
<!-- Ninguna. `pedidos-mesa` ya define el estado inicial `recibido` y la consulta
     de estado por el cliente; este cambio no altera sus requisitos, solo consume
     el pedido ya confirmado desde una nueva capability. -->

## Impact

- **Backend (`src/`)**: nuevo módulo de dominio (p. ej. `src/cocina.js`) con la
  máquina de estados (transiciones y cancelación) y las consultas de pedidos del
  día / histórico; nuevas rutas bajo `/api/admin/*` (protegidas por
  `requiereSesion` ya existente en `src/app.js`) y un endpoint SSE
  (`text/event-stream`) para el stream de cambios.
- **Base de datos (`src/db.js`)**: columnas nuevas en `pedidos` para marcas de
  tiempo de transición y de cancelación (migración idempotente, sin borrar
  datos). La tabla `pedidos` ya tiene `estado` y `creado_en`.
- **Frontend (`frontend/`)**: nueva vista de panel de cocina (React) que consume
  la API y se suscribe al SSE con `EventSource`; se integra en la zona
  autenticada existente. CSS accesible propio (contraste, botones grandes).
- **Dependencias**: ninguna nueva (SSE con Express nativo; `EventSource` nativo
  del navegador).
- **Tests**: un test trazable por escenario de la nueva spec.
