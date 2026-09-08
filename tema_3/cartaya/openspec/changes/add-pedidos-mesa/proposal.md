## Why

Hoy el cliente de La Estación consulta la carta desde el móvil (capacidad `carta-publica`) pero, para pedir, tiene que esperar a que Andrés pase por la mesa. En horas punta eso genera esperas, pedidos olvidados y errores al apuntar "sin cebolla" o "poco hecho". Dejar que el propio cliente componga y confirme el pedido desde la carta que ya tiene abierta descarga a Andrés y reduce errores, sin pedirle al cliente registro ni datos personales: el pedido pertenece a la mesa, no a la persona (principio 3).

## What Changes

- Se introduce el **pedido desde la mesa**: cada mesa tiene un **código QR único e impreso** que abre la carta con la mesa ya identificada. El pedido se asocia siempre a una mesa, nunca a una persona.
- El cliente **añade platos activos de la carta** a un pedido, indica **cantidades** y puede escribir una **nota libre por plato** (máx. 140 caracteres, p. ej. "sin cebolla").
- Antes de enviar, el cliente ve un **resumen con el total en euros (IVA incluido)** y **confirma** el pedido. La confirmación **no** exige registro, email, teléfono ni dato personal alguno.
- Un pedido confirmado pasa a estado inicial para cocina (la capacidad `panel-cocina` es futura) y el cliente ve en su móvil una **confirmación con número de pedido y estado**.
- Una mesa puede tener **varios pedidos abiertos** durante el servicio; cada confirmación es un **pedido independiente** con su propio número.
- Si un plato **deja de estar activo** entre que el cliente lo añade y confirma, el sistema **se lo indica y lo retira del pedido** antes de enviar; el cliente confirma el pedido ya ajustado.

Decisiones de negocio registradas (2026-09-08):
- **Identidad por mesa vía QR**: el QR impreso de la mesa es la única forma de abrir un pedido; no hay pedido "sin mesa" ni identificación de la persona.
- **Nota por plato limitada a 140 caracteres**; es texto libre y opcional. Se elige un límite corto para que quepa en cocina y evitar abusos, coherente con la simplicidad (principio 2).
- **La cantidad de cada línea debe ser un entero mayor que 0**; retirar un plato del pedido se hace quitando la línea, no poniendo cantidad 0.
- **La carta manda sobre el pedido**: solo se pueden pedir platos activos en el momento de confirmar; si un plato se archiva mientras el cliente decide, se retira y se avisa (no se envía un plato que ya no existe en la carta).
- **Cada confirmación es un pedido nuevo**: pedir dos veces (comida y luego postre) crea dos pedidos distintos para la misma mesa; no se fusionan.
- **Sin pago online**: se paga en caja como siempre; el pedido confirmado no gestiona cobro.

## Capabilities

### New Capabilities
- `pedidos-mesa`: el flujo por el que un cliente, con la mesa identificada por su QR, compone un pedido con platos activos de la carta (cantidades y nota por plato), revisa el resumen con total en euros, confirma sin aportar datos personales y recibe un número de pedido y su estado; contempla varios pedidos abiertos por mesa y la retirada de platos que dejan de estar activos antes de confirmar.

### Modified Capabilities
<!-- No cambian los requisitos de carta-publica ni de catalogo-admin; el pedido consume la carta existente sin alterar su comportamiento observable. -->

## Impact

- **Specs nuevas**: `openspec/specs/pedidos-mesa/spec.md`.
- **Backend** (Node.js 22 + Express + better-sqlite3): nuevas tablas de `mesas`, `pedidos` y `lineas_pedido`; endpoints públicos para resolver una mesa por su token de QR, componer/validar un pedido y confirmarlo, y consultar el estado de un pedido por su número. Reutiliza `src/carta.js`/`src/catalogo.js` para saber qué platos están activos y sus precios en céntimos.
- **Frontend** (React 19 + Vite): la vista de la carta pública gana un modo "pedido" cuando se entra por el QR de una mesa (añadir a pedido, cantidades, nota, resumen, confirmación y pantalla de estado con el número de pedido). Accesible y usable en móvil (principio 5).
- **Privacidad**: el pedido no crea cuenta ni recoge datos del cliente; solo referencia la mesa (principio 3).
- **Dependencias con capacidades futuras**: el estado del pedido se deja preparado para que `panel-cocina` lo consuma; el tiempo real (SSE, según config) se aplicará cuando exista ese panel y queda **fuera de alcance** aquí.
- **Fuera de alcance**: pago online, propinas, dividir la cuenta, llamar al camarero y pedidos para llevar.
