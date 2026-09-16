## Purpose

Define el pedido desde la mesa en La Estación: cómo un cliente, con la mesa identificada por su código QR y sin aportar dato personal alguno, compone un pedido con platos activos de la carta (cantidades y una nota por plato), revisa el resumen con el total en euros, lo confirma y recibe un número de pedido con su estado.

## Requirements

### Requirement: Identificación de la mesa por su QR

El sistema MUST abrir el flujo de pedido con la mesa ya identificada a partir del código QR único e impreso de esa mesa. Un pedido MUST pertenecer siempre a una mesa y nunca a una persona: el sistema MUST NOT solicitar ni almacenar registro, email, teléfono ni ningún dato personal del cliente para pedir. El sistema MUST rechazar el inicio de un pedido cuando el código de mesa no corresponda a una mesa conocida.

#### Scenario: Abrir la carta con la mesa identificada

- **WHEN** un cliente escanea el QR impreso de su mesa y abre la carta
- **THEN** el sistema abre la carta con esa mesa ya identificada y permite empezar un pedido sin pedir registro ni dato personal alguno

#### Scenario: Código de mesa desconocido

- **WHEN** se intenta iniciar un pedido con un código de mesa que no corresponde a ninguna mesa conocida
- **THEN** el sistema no inicia el pedido e informa de que la mesa no es válida

#### Scenario: El pedido no recoge datos personales

- **WHEN** un cliente compone y confirma un pedido desde la mesa
- **THEN** el sistema asocia el pedido únicamente a la mesa y no crea cuenta ni solicita email, teléfono, nombre ni otro dato personal del cliente

### Requirement: Composición del pedido con platos activos

El sistema MUST permitir al cliente añadir a su pedido platos que estén activos en la carta en ese momento, indicando para cada línea una cantidad. La cantidad de cada línea MUST ser un número entero mayor que 0. El sistema MUST permitir modificar la cantidad de una línea y retirar una línea del pedido. El sistema MUST calcular el total del pedido en euros con IVA incluido a partir de los precios vigentes de la carta.

#### Scenario: Añadir un plato al pedido

- **WHEN** el cliente añade un plato activo de la carta a su pedido con cantidad 2
- **THEN** el pedido incluye ese plato con cantidad 2 y el total refleja dos veces su precio con IVA incluido

#### Scenario: Cantidad debe ser un entero mayor que 0

- **WHEN** el cliente intenta fijar la cantidad de una línea en 0, en un número negativo o en un valor no entero
- **THEN** el sistema rechaza la cantidad y exige un número entero mayor que 0

#### Scenario: Retirar una línea del pedido

- **WHEN** el cliente retira un plato de su pedido
- **THEN** el pedido deja de incluir ese plato y el total se recalcula sin él

### Requirement: Nota libre por plato

El sistema MUST permitir al cliente añadir una nota libre y opcional a cada línea del pedido (por ejemplo "sin cebolla" o "poco hecho"). La nota MUST tener como máximo 140 caracteres. El sistema MUST rechazar una nota que supere los 140 caracteres.

#### Scenario: Añadir una nota a una línea

- **WHEN** el cliente escribe "sin cebolla" en la nota de un plato de su pedido
- **THEN** el sistema guarda esa nota asociada a esa línea y la conserva en el pedido confirmado

#### Scenario: Nota opcional

- **WHEN** el cliente añade un plato al pedido sin escribir ninguna nota
- **THEN** el sistema acepta la línea sin nota

#### Scenario: Nota demasiado larga

- **WHEN** el cliente intenta guardar en una línea una nota de más de 140 caracteres
- **THEN** el sistema rechaza la nota e informa de que supera el máximo de 140 caracteres

### Requirement: Resumen y confirmación del pedido

El sistema MUST mostrar, antes de enviar, un resumen del pedido con cada línea (plato, cantidad y nota si la hay) y el total en euros con IVA incluido, y MUST permitir al cliente confirmarlo. La confirmación MUST NOT requerir registro, email, teléfono ni ningún dato personal. El sistema MUST rechazar la confirmación de un pedido sin ninguna línea.

#### Scenario: Revisar el resumen antes de enviar

- **WHEN** el cliente termina de componer un pedido con varias líneas
- **THEN** el sistema muestra un resumen con cada plato, su cantidad, su nota cuando exista y el total en euros con IVA incluido

#### Scenario: Confirmar sin datos personales

- **WHEN** el cliente confirma el pedido desde el resumen
- **THEN** el sistema registra el pedido asociado a la mesa sin pedir registro ni dato personal alguno

#### Scenario: No se confirma un pedido vacío

- **WHEN** el cliente intenta confirmar un pedido que no tiene ninguna línea
- **THEN** el sistema rechaza la confirmación e informa de que el pedido está vacío

### Requirement: Retirada de platos que dejan de estar activos antes de confirmar

El sistema MUST comprobar, al confirmar, que todas las líneas del pedido corresponden a platos activos en la carta. Si un plato dejó de estar activo entre que el cliente lo añadió y la confirmación, el sistema MUST retirar esa línea del pedido, MUST informar al cliente de la retirada y MUST recalcular el total antes de dejar confirmar el pedido ya ajustado.

#### Scenario: Un plato se archiva mientras el cliente decide

- **WHEN** el cliente confirma un pedido que incluye un plato que ha dejado de estar activo en la carta desde que lo añadió
- **THEN** el sistema retira ese plato del pedido, avisa al cliente de la retirada y muestra el pedido y el total recalculados sin ese plato

#### Scenario: Todas las líneas retiradas por platos inactivos

- **WHEN** al confirmar, todos los platos del pedido han dejado de estar activos
- **THEN** el sistema retira todas las líneas, avisa al cliente y no confirma el pedido por quedar vacío

### Requirement: Confirmación con número de pedido y estado

El sistema MUST asignar a cada pedido confirmado un número de pedido y MUST mostrar al cliente en su móvil una confirmación con ese número y el estado del pedido. El pedido confirmado MUST quedar en un estado inicial disponible para cocina. El sistema MUST permitir al cliente consultar el estado de su pedido mediante su número de pedido.

#### Scenario: Confirmación visible para el cliente

- **WHEN** el cliente confirma un pedido válido
- **THEN** el sistema le muestra un número de pedido y el estado del pedido en su móvil

#### Scenario: Consultar el estado del pedido

- **WHEN** el cliente consulta su pedido por su número de pedido
- **THEN** el sistema muestra el estado actual de ese pedido

### Requirement: Varios pedidos abiertos por mesa

El sistema MUST permitir que una misma mesa tenga varios pedidos a lo largo del servicio. Cada confirmación MUST crear un pedido independiente con su propio número; el sistema MUST NOT fusionar pedidos distintos de la misma mesa.

#### Scenario: Segundo pedido de la misma mesa

- **WHEN** una mesa que ya confirmó un pedido confirma más tarde otro pedido (por ejemplo, el postre)
- **THEN** el sistema crea un segundo pedido independiente con su propio número, sin fusionarlo con el anterior

### Requirement: Alcance del pedido desde la mesa

El sistema MUST limitar el flujo de pedido a componer y confirmar el pedido asociado a la mesa. El sistema MUST NOT ofrecer pago online, propinas, división de la cuenta, llamada al camarero ni pedidos para llevar dentro de este flujo; el pago se realiza en caja.

#### Scenario: El pedido no gestiona el pago ni extras

- **WHEN** el cliente confirma un pedido desde la mesa
- **THEN** el sistema no solicita pago online, propina ni división de la cuenta, y no ofrece llamar al camarero ni pedir para llevar

### Requirement: Visualización de mesas con su QR en administración

El sistema MUST permitir al dueño, con sesión de establecimiento válida, ver la lista de las mesas del establecimiento, cada una con su número visible y un código QR que enlaza al pedido de esa mesa (la dirección `/?mesa=<token>` del propio sitio). Esta vista MUST ser de solo lectura: no crea, edita ni archiva mesas. El sistema MUST requerir sesión de establecimiento válida para esta vista y MUST NOT exponer los tokens de mesa sin sesión.

#### Scenario: Ver las mesas con su QR

- **WHEN** el dueño, con sesión de establecimiento válida, abre la vista de mesas en la administración
- **THEN** el sistema muestra cada mesa con su número y un código QR que enlaza al pedido de esa mesa

#### Scenario: El QR enlaza al pedido de la mesa

- **WHEN** se muestra el QR de una mesa concreta
- **THEN** el código QR codifica la dirección de pedido de esa mesa con su token (`/?mesa=<token>`), de modo que al escanearlo se abre la carta con esa mesa identificada

#### Scenario: La visualización de mesas requiere sesión

- **WHEN** alguien intenta obtener la lista de mesas con sus tokens sin sesión de establecimiento válida
- **THEN** el sistema deniega el acceso y no expone ningún token de mesa

### Requirement: Administración organizada en pestañas

El sistema MUST organizar la administración en dos pestañas, "Carta" y "Mesas", mostrando en cada momento solo el contenido de la pestaña activa. Al abrir la administración, la pestaña "Carta" MUST estar activa por defecto.

#### Scenario: Carta activa por defecto

- **WHEN** el dueño, con sesión válida, abre la administración
- **THEN** se muestra la pestaña "Carta" (categorías y platos) y no se muestra el contenido de la pestaña "Mesas"

#### Scenario: Cambiar a la pestaña Mesas

- **WHEN** el dueño pulsa la pestaña "Mesas"
- **THEN** se muestra el contenido de mesas (cada mesa con su QR) y deja de mostrarse el contenido de la pestaña "Carta"
