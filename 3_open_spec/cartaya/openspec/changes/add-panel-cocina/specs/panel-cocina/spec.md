## Purpose

Define el panel de cocina de La Estación: la pantalla autenticada, en una tablet
de la barra, donde cocina y barra ven los pedidos del día conforme entran, los
hacen avanzar por su ciclo de vida con transiciones estrictas, los cancelan
mientras aún no se han empezado, y consultan el histórico del día, todo en tiempo
real y sin recargar la página.

## ADDED Requirements

### Requirement: Acceso al panel solo con sesión de establecimiento

El sistema MUST requerir una sesión de establecimiento válida (la misma sesión
simple con contraseña que protege la administración de la carta) para acceder al
panel de cocina y a todas sus operaciones. El sistema MUST NOT exponer los
pedidos, sus transiciones de estado, la cancelación ni el flujo de actualización
en tiempo real sin una sesión válida.

#### Scenario: El panel requiere sesión

- **WHEN** alguien intenta abrir el panel de cocina o consumir sus datos sin una sesión de establecimiento válida
- **THEN** el sistema deniega el acceso y no muestra ningún pedido

#### Scenario: Acceso con sesión válida

- **WHEN** el personal accede al panel de cocina con una sesión de establecimiento válida
- **THEN** el sistema muestra el panel con los pedidos del día

### Requirement: Vista activa de los pedidos del día ordenados por antigüedad

El sistema MUST mostrar en la vista activa del panel los pedidos del día que aún
no están servidos ni cancelados, ordenados por antigüedad con el más antiguo
primero. Para cada pedido el sistema MUST mostrar la mesa, sus platos con las
cantidades, las notas del cliente cuando existan, el estado actual y el tiempo
transcurrido desde que se confirmó el pedido.

#### Scenario: Pedidos del día ordenados del más antiguo al más reciente

- **WHEN** el personal abre el panel y hay varios pedidos del día sin servir
- **THEN** el sistema los muestra ordenados por antigüedad, apareciendo primero el confirmado hace más tiempo

#### Scenario: Detalle de cada pedido en la vista activa

- **WHEN** se muestra un pedido en la vista activa
- **THEN** el sistema muestra su mesa, cada plato con su cantidad, las notas del cliente cuando existan, su estado actual y el tiempo transcurrido desde que se confirmó

#### Scenario: Solo pedidos del día

- **WHEN** existen pedidos de días anteriores además de los de hoy
- **THEN** la vista activa del panel muestra únicamente los pedidos del día en curso

### Requirement: Avance del estado con transiciones estrictas

El sistema MUST permitir avanzar el estado de un pedido siguiendo exactamente la
secuencia `recibido → en_preparacion → servido`. El sistema MUST permitir pasar
de `recibido` a `en_preparacion` cuando cocina empieza a prepararlo, y de
`en_preparacion` a `servido` cuando sale a la mesa. El sistema MUST rechazar
cualquier transición que salte un estado (por ejemplo de `recibido` a `servido`)
o que retroceda (por ejemplo de `en_preparacion` a `recibido`).

#### Scenario: De recibido a en preparación

- **WHEN** el personal marca que empieza a preparar un pedido que está en `recibido`
- **THEN** el sistema deja el pedido en estado `en_preparacion`

#### Scenario: De en preparación a servido

- **WHEN** el personal marca como servido un pedido que está en `en_preparacion`
- **THEN** el sistema deja el pedido en estado `servido`

#### Scenario: No se permite saltar estados

- **WHEN** el personal intenta pasar un pedido de `recibido` directamente a `servido`
- **THEN** el sistema rechaza la transición y el pedido conserva su estado `recibido`

#### Scenario: No se permite retroceder de estado

- **WHEN** el personal intenta devolver un pedido de `en_preparacion` a `recibido`
- **THEN** el sistema rechaza la transición y el pedido conserva su estado `en_preparacion`

### Requirement: Cancelación solo mientras el pedido está en recibido

El sistema MUST permitir cancelar un pedido únicamente mientras está en estado
`recibido`. El sistema MUST NOT permitir cancelar un pedido que ya está en
`en_preparacion` o en `servido`. La cancelación MUST registrar el momento en que
se produjo y MUST NOT borrar el pedido: el pedido cancelado se conserva y sale de
la vista activa.

#### Scenario: Cancelar un pedido recién recibido

- **WHEN** el personal cancela un pedido que está en estado `recibido`
- **THEN** el sistema marca el pedido como cancelado, registra el momento de la cancelación, conserva el pedido y lo retira de la vista activa

#### Scenario: No se cancela un pedido en preparación

- **WHEN** el personal intenta cancelar un pedido que ya está en `en_preparacion`
- **THEN** el sistema rechaza la cancelación y el pedido sigue en `en_preparacion`

#### Scenario: No se cancela un pedido servido

- **WHEN** el personal intenta cancelar un pedido que ya está en `servido`
- **THEN** el sistema rechaza la cancelación y el pedido sigue en `servido`

### Requirement: Histórico del día de pedidos servidos y cancelados

El sistema MUST retirar de la vista activa los pedidos que pasan a `servido` y los
que se cancelan, y MUST conservarlos consultables en un histórico del día. El
histórico MUST mostrar, para cada pedido, su mesa, sus platos con cantidades y su
estado final (servido o cancelado).

#### Scenario: Un pedido servido pasa al histórico

- **WHEN** un pedido pasa a estado `servido`
- **THEN** el sistema lo retira de la vista activa y lo muestra en el histórico del día

#### Scenario: Un pedido cancelado pasa al histórico

- **WHEN** un pedido se cancela desde el estado `recibido`
- **THEN** el sistema lo retira de la vista activa y lo muestra en el histórico del día como cancelado

#### Scenario: Consultar el histórico del día

- **WHEN** el personal consulta el histórico del día
- **THEN** el sistema muestra los pedidos servidos y cancelados del día con su mesa, sus platos con cantidades y su estado final

### Requirement: Actualización en tiempo real sin recargar

El sistema MUST actualizar el panel en tiempo real mediante Server-Sent Events,
sin que el personal recargue la página. Cuando se confirma un pedido nuevo, el
sistema MUST hacerlo aparecer en la vista activa por sí solo y MUST emitir un
aviso simple de llegada. Cuando cambia el estado de un pedido (avance de estado o
cancelación), el sistema MUST reflejar el cambio en el panel de todos los clientes
conectados sin recargar.

#### Scenario: Un pedido nuevo aparece solo

- **WHEN** un cliente confirma un pedido desde la mesa mientras el panel está abierto
- **THEN** el sistema hace aparecer el pedido en la vista activa sin recargar la página y emite un aviso simple de que ha llegado un pedido

#### Scenario: Un cambio de estado se refleja en vivo

- **WHEN** el estado de un pedido cambia (avanza o se cancela) mientras el panel está abierto
- **THEN** el sistema actualiza la vista del panel en vivo, sin recargar la página

### Requirement: Alcance del panel de cocina

El sistema MUST limitar el panel de cocina a ver los pedidos del día, avanzar su
estado, cancelarlos mientras están en `recibido` y consultar el histórico del día.
El sistema MUST NOT ofrecer en este panel métricas ni estadísticas, impresión de
tickets, gestión de turnos o empleados, ni notificaciones sonoras configurables;
para el aviso de llegada basta un aviso simple.

#### Scenario: El panel no incluye funciones fuera de alcance

- **WHEN** el personal usa el panel de cocina
- **THEN** el sistema no ofrece métricas ni estadísticas, ni impresión de tickets, ni gestión de turnos o empleados, ni notificaciones sonoras configurables
