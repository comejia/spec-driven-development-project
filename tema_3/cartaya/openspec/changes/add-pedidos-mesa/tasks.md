## 1. Modelo de datos y siembra de mesas

- [x] 1.1 Añadir en `src/db.js` (inicialización idempotente, `CREATE TABLE IF NOT EXISTS`) las tablas `mesas(id, numero, token único, archivada_en)`, `pedidos(id, mesa_id, numero_pedido, estado, total_centimos, creado_en)` y `lineas_pedido(id, pedido_id, plato_id, nombre_plato, precio_centimos, cantidad, nota)`, con las FKs correspondientes; verificar que arrancar dos veces sobre la misma BD no falla y que las tablas existen (test de esquema con BD `:memory:`).
- [x] 1.2 Añadir una siembra idempotente de mesas con token opaco y `numero` visible (script o inserción al iniciar); verificar que crea las mesas una sola vez y que cada mesa tiene un token único (test).

## 2. Dominio de pedidos (backend)

- [x] 2.1 Crear `src/pedidos.js` con `resolverMesaPorToken(db, token)` que devuelva la mesa o null; verificar con test que un token válido resuelve la mesa y uno desconocido devuelve null (cubre "Código de mesa desconocido").
- [x] 2.2 Implementar `platoActivo(db, platoId)` reutilizando la regla de `construirCarta` (plato `archivado_en IS NULL` y su categoría `archivada_en IS NULL`); verificar con test que un plato de categoría archivada cuenta como inactivo.
- [x] 2.3 Implementar `prepararPedido(db, { lineas })` que resuelva nombre y `precio_centimos` vigentes, calcule subtotales y total en céntimos, valide `cantidad` entero > 0 y `nota` ≤ 140, y devuelva las líneas retiradas por plato inactivo; verificar con tests: añadir con cantidad 2 (cubre "Añadir un plato al pedido"), cantidad inválida rechazada (cubre "Cantidad debe ser un entero mayor que 0"), nota > 140 rechazada (cubre "Nota demasiado larga"), nota vacía aceptada (cubre "Nota opcional").
- [x] 2.4 Implementar `confirmarPedido(db, { token, lineas })` en una transacción: revalidar platos activos, retirar inactivos, recalcular total, rechazar si queda vacío, y crear `pedido` (estado `recibido`, `numero_pedido` secuencial global, `total_centimos` congelado) con sus `lineas_pedido` (snapshot de nombre y precio y nota); verificar con tests: confirmación válida crea pedido con número y estado (cubre "Confirmación visible para el cliente"), plato archivado entre añadir y confirmar se retira y recalcula (cubre "Un plato se archiva mientras el cliente decide"), todas las líneas inactivas ⇒ no confirma por vacío (cubre "Todas las líneas retiradas por platos inactivos"), confirmar sin líneas ⇒ rechazo (cubre "No se confirma un pedido vacío").
- [x] 2.5 Implementar `obtenerPedidoPorNumero(db, numeroPedido)` que devuelva estado y líneas; verificar con test que devuelve el estado actual del pedido (cubre "Consultar el estado del pedido").
- [x] 2.6 Verificar con un test que dos confirmaciones de la misma mesa crean dos pedidos independientes con números distintos y sin fusionar (cubre "Segundo pedido de la misma mesa").
- [x] 2.7 Verificar con un test que ni el modelo ni las funciones de dominio aceptan ni almacenan datos personales del cliente (el pedido solo referencia `mesa_id`) (cubre "El pedido no recoge datos personales").

## 3. API HTTP (Express)

- [x] 3.1 Añadir en `src/app.js` `GET /api/mesa/:token` que devuelva `{ numero }` o 404; verificar con test de endpoint que token válido responde 200 con la mesa y token desconocido responde 404 (cubre "Abrir la carta con la mesa identificada" y "Código de mesa desconocido").
- [x] 3.2 Añadir `POST /api/pedidos/preparar` que devuelva resumen (líneas resueltas, total en euros/céntimos y líneas retiradas) sin persistir; verificar con test de endpoint que el resumen incluye total con IVA y refleja las líneas retiradas (cubre "Revisar el resumen antes de enviar").
- [x] 3.3 Añadir `POST /api/pedidos` que confirme (revalida, retira inactivos, crea pedido) y devuelva `{ numeroPedido, estado, total, lineasRetiradas }`, o 4xx si queda vacío o el token es inválido; verificar con test de endpoint la confirmación sin datos personales (cubre "Confirmar sin datos personales") y el rechazo de pedido vacío (cubre "No se confirma un pedido vacío").
- [x] 3.4 Añadir `GET /api/pedidos/:numeroPedido` que devuelva el estado del pedido; verificar con test de endpoint que responde el estado actual (cubre "Consultar el estado del pedido").
- [x] 3.5 Verificar con test que los endpoints de pedido son públicos (no exigen sesión de establecimiento) y que el alcance no expone pago/propina/split/camarero/para llevar (cubre "El pedido no gestiona el pago ni extras").

## 4. Frontend de pedido (React)

- [x] 4.1 Detectar el token de mesa en la URL y resolver la mesa vía `GET /api/mesa/:token`, activando el "modo pedido"; verificar (test de componente/manual documentado) que con token válido la carta se abre con la mesa identificada y sin token se comporta como consulta.
- [x] 4.2 Añadir a cada plato activo el control de "añadir al pedido" con cantidad (entero > 0) y campo de nota con contador y tope de 140 caracteres; verificar que la UI impide cantidad 0/negativa y notas > 140 (cubre en cliente "Cantidad debe ser un entero mayor que 0" y "Nota demasiado larga").
- [x] 4.3 Implementar la pantalla de resumen (líneas con plato, cantidad, nota y total en euros con IVA) usando `POST /api/pedidos/preparar`, mostrando el aviso de líneas retiradas; verificar que el resumen muestra el total y el aviso de retirada (cubre "Revisar el resumen antes de enviar" y el aviso de "Un plato se archiva mientras el cliente decide").
- [x] 4.4 Implementar la confirmación con `POST /api/pedidos` y la pantalla final con número de pedido y estado; verificar que tras confirmar se muestra número y estado sin pedir datos personales (cubre "Confirmación visible para el cliente" y "Confirmar sin datos personales").
- [x] 4.5 Aplicar los tokens de accesibilidad existentes (contraste alto, tipografía legible, objetivos táctiles grandes) a las vistas de pedido; verificar en móvil que los controles son cómodos y legibles (principio 5).

## 5. Verificación integral

- [x] 5.1 Ejecutar `npm test` y confirmar que existe un test trazable por nombre para cada escenario de `openspec/specs/pedidos-mesa/spec.md` y que toda la suite pasa.
- [x] 5.2 Ejecutar `openspec validate add-pedidos-mesa --strict` y confirmar que el cambio valida sin incidencias.
- [x] 5.3 Prueba de extremo a extremo manual: escanear/abrir con un token de mesa, componer un pedido con nota, confirmar, ver número y estado, y comprobar que un segundo pedido de la misma mesa es independiente (cubre "Segundo pedido de la misma mesa").

## 6. Visualización de mesas con QR en /admin

- [x] 6.1 Añadir en `src/app.js` `GET /api/admin/mesas` (bajo la sesión de establecimiento ya existente) que devuelva las mesas no archivadas con `numero` y `token`; verificar con test de endpoint que con sesión responde 200 con la lista y sin sesión responde 401 (cubre "Ver las mesas con su QR" y "La visualización de mesas requiere sesión").
- [x] 6.2 Añadir en el dominio (`src/pedidos.js`) `listarMesas(db)` que devuelva las mesas no archivadas con `numero` y `token`; verificar con test que lista las mesas sembradas.
- [x] 6.3 Añadir en `frontend/src/Admin.jsx` una sección de mesas que consuma `GET /api/admin/mesas` y muestre cada mesa con su número y un código QR generado en el cliente (sin dependencias nuevas) a partir de la URL absoluta `/?mesa=<token>`; verificar (test de fuente/estáticos) que la vista pide `/api/admin/mesas`, construye el enlace `/?mesa=` y genera el QR en cliente.
- [x] 6.4 Implementar la generación del QR en el cliente sin librerías externas (código propio en `frontend/src`, canvas o SVG) y usarla en la sección de mesas; verificar con test que el módulo de QR produce una salida no vacía para una URL dada.
- [x] 6.5 Aplicar estilos accesibles a la sección de mesas (QR de tamaño imprimible, texto legible) reutilizando los tokens existentes; verificar con test de estilos/fuente que la sección es legible y el QR tiene tamaño suficiente.
- [x] 6.6 Ejecutar `npm test` y `openspec validate add-pedidos-mesa --strict`, confirmando que todos los escenarios (incluidos los nuevos de visualización de mesas) tienen test trazable y que el cambio valida.
- [x] 6.7 Organizar `frontend/src/Admin.jsx` en dos pestañas, "Carta" y "Mesas", mostrando solo la activa y con "Carta" activa por defecto al entrar; verificar con test de fuente/estáticos que existen ambas pestañas, que el estado inicial es "Carta" y que se muestra una sola a la vez (cubre "Carta activa por defecto" y "Cambiar a la pestaña Mesas").
