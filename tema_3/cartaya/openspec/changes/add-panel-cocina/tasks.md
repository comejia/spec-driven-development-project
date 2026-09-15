## 1. Migración del esquema

- [x] 1.1 Añadir en `src/db.js` (dentro de `inicializarEsquema`) la migración idempotente que agrega a `pedidos` las columnas `preparado_en`, `servido_en` y `cancelado_en` (TEXT, `NULL` por defecto) solo si no existen. Verificar con un test de esquema (`test/esquema.test.js` o nuevo) que, tras `inicializarEsquema`, `PRAGMA table_info(pedidos)` incluye las tres columnas y que reejecutarla no falla ni duplica.

## 2. Dominio: máquina de estados y consultas del día

- [x] 2.1 Crear `src/cocina.js` con la tabla de transiciones válidas y `avanzarEstado(db, numeroPedido, nuevoEstado)`, que valida contra el estado actual dentro de una transacción y sella la marca de tiempo correspondiente (`preparado_en`/`servido_en`); rechaza saltos y retrocesos lanzando `ErrorPedido`. Verificar con tests unitarios trazables por escenario: "De recibido a en preparación", "De en preparación a servido", "No se permite saltar estados", "No se permite retroceder de estado".
- [x] 2.2 Añadir en `src/cocina.js` `cancelarPedido(db, numeroPedido)`, que solo cancela si el pedido está en `recibido`, registra `cancelado_en`, no borra el pedido, y rechaza en otro caso con `ErrorPedido`. Verificar con tests trazables por escenario: "Cancelar un pedido recién recibido", "No se cancela un pedido en preparación", "No se cancela un pedido servido".
- [x] 2.3 Añadir en `src/cocina.js` `listarActivosDelDia(db)` y `listarHistoricoDelDia(db)`: la vista activa devuelve `recibido`+`en_preparacion` del día natural ordenados por antigüedad, con mesa, líneas (plato+cantidad+nota), estado y `creado_en` para calcular el tiempo transcurrido; el histórico devuelve `servido`+`cancelado` del día con mesa, líneas y estado final. Verificar con tests trazables por escenario: "Pedidos del día ordenados del más antiguo al más reciente", "Detalle de cada pedido en la vista activa", "Solo pedidos del día", "Consultar el histórico del día", "Un pedido servido pasa al histórico", "Un pedido cancelado pasa al histórico".

## 3. Tiempo real: emisor SSE

- [x] 3.1 Crear el emisor SSE en memoria (p. ej. `src/sse.js` o dentro de `src/cocina.js`): registro/baja de suscriptores, difusión de eventos con nombre (`pedido-nuevo`, `pedido-actualizado`) y heartbeat. Verificar con un test unitario que, al suscribir un escritor falso y publicar, este recibe el evento con el formato `event:`/`data:`, y que al darse de baja deja de recibir.
- [x] 3.2 Enganchar la publicación de eventos: `confirmarPedido` (en `src/pedidos.js`) emite `pedido-nuevo`; `avanzarEstado` y `cancelarPedido` emiten `pedido-actualizado`. Verificar con un test que cada operación de dominio publica el evento esperado a los suscriptores registrados.

## 4. API bajo sesión (`/api/admin/cocina/*`)

- [x] 4.1 Añadir en `src/app.js`, tras `requiereSesion`, `GET /api/admin/cocina/pedidos` (vista activa del día) y `GET /api/admin/cocina/historico` (histórico del día). Verificar con tests de API que devuelven los pedidos esperados con sesión y responden 401 sin sesión, cubriendo el escenario "El panel requiere sesión" y "Acceso con sesión válida".
- [x] 4.2 Añadir `POST /api/admin/cocina/pedidos/:numeroPedido/avanzar` y `POST /api/admin/cocina/pedidos/:numeroPedido/cancelar`, mapeando `ErrorPedido` a 422. Verificar con tests de API que una transición válida responde 200 con el nuevo estado, y que un salto/retroceso o una cancelación no permitida responden 422 sin cambiar el estado.
- [x] 4.3 Añadir `GET /api/admin/cocina/stream` (SSE) tras `requiereSesion`, con cabeceras `text/event-stream`, alta del suscriptor y limpieza al cerrar la conexión; sin sesión responde 401. Verificar con un test de integración que un cliente autenticado recibe un evento `pedido-nuevo` al confirmarse un pedido y un `pedido-actualizado` al cambiar de estado (cubre "Un pedido nuevo aparece solo" y "Un cambio de estado se refleja en vivo" a nivel de backend).

## 5. Frontend: panel de cocina

- [x] 5.1 Añadir la rama de enrutado `/cocina` en `frontend/src/main.jsx` (análoga a `/admin`) que renderiza un nuevo componente `Cocina`, exigiendo sesión de establecimiento antes de mostrar datos. Verificar con test de frontend que sin sesión se muestra el acceso y con sesión se muestra el panel.
- [x] 5.2 Implementar el componente `Cocina`: vista activa con pedidos del día ordenados por antigüedad (mesa, platos, cantidades, notas, estado, tiempo transcurrido), botones de avance de estado y de cancelación (cancelación visible solo en `recibido`), y sección de histórico del día. Verificar con tests de frontend trazables por escenario: "Detalle de cada pedido en la vista activa", "Cancelar un pedido recién recibido" (el botón solo aparece en `recibido`), "Consultar el histórico del día".
- [x] 5.3 Suscribir el panel al SSE con `EventSource`: al recibir `pedido-nuevo` insertar el pedido en la vista activa y mostrar un aviso visual simple; al recibir `pedido-actualizado` reflejar el cambio (mover a histórico si procede) sin recargar. Verificar con test de frontend trazable por escenario: "Un pedido nuevo aparece solo" y "Un cambio de estado se refleja en vivo".
- [x] 5.4 Aplicar estilos accesibles del panel (contraste alto, botones grandes, tipografía legible) en `frontend/src/estilos.css`. Verificar visualmente en la tablet y con el smoke test del frontend que el panel monta sin errores.

## 6. Documentación y alcance

- [x] 6.1 Documentar en `README.md` el panel de cocina (ruta `/cocina`, autenticación, nuevos endpoints `/api/admin/cocina/*` y el stream SSE). Verificar que el README lista las rutas nuevas y describe el flujo de estados.
- [x] 6.2 Añadir un test trazable por el escenario "El panel no incluye funciones fuera de alcance" que confirme que el panel no expone métricas, tickets, turnos ni sonido configurable.

## 7. Verificación final

- [x] 7.1 Ejecutar `npm test` y comprobar que toda la suite pasa y que existe un test por cada escenario de `openspec/specs/panel-cocina/spec.md` (trazable por el nombre del escenario).
- [x] 7.2 Ejecutar `openspec validate add-panel-cocina --strict` y comprobar que el cambio es válido.
