## Purpose

Define la carta digital pública que el cliente de La Estación consulta desde su móvil al escanear el QR de la mesa: qué platos ve, cómo se organizan y qué información obligatoria (precio con IVA y alérgenos) acompaña a cada plato, sin necesidad de identificarse.

## ADDED Requirements

### Requirement: Acceso público sin identificación

El sistema MUST permitir consultar la carta completa sin ninguna forma de identificación, registro ni aporte de datos personales por parte del cliente.

#### Scenario: Consulta anónima de la carta

- **WHEN** un cliente abre la carta sin haber iniciado ninguna sesión
- **THEN** el sistema muestra la carta completa sin solicitar registro, contraseña ni dato personal alguno

#### Scenario: La carta no registra al cliente

- **WHEN** un cliente consulta la carta
- **THEN** el sistema no crea ni solicita ninguna cuenta, identificador personal o dato de contacto del cliente

### Requirement: Organización en categorías ordenadas

El sistema MUST presentar los platos agrupados en categorías definidas por el dueño, mostrando las categorías en el orden manual que el dueño haya establecido.

#### Scenario: Categorías en el orden definido por el dueño

- **WHEN** el dueño ha ordenado las categorías como Desayunos, Bocadillos, Raciones, Bebidas, Postres
- **THEN** la carta pública muestra las categorías exactamente en ese orden

#### Scenario: Categoría sin platos activos no se muestra

- **WHEN** una categoría no tiene ningún plato activo
- **THEN** la carta pública no muestra esa categoría

#### Scenario: Categoría archivada oculta sus platos

- **WHEN** el dueño archiva una categoría que contiene platos activos
- **THEN** la carta pública deja de mostrar esa categoría y todos sus platos, aunque los platos no estén archivados individualmente

### Requirement: Platos activos con orden manual dentro de la categoría

El sistema MUST mostrar dentro de cada categoría todos los platos activos, y solo los activos, en el orden manual que el dueño haya establecido para esa categoría. Un plato activo es aquel que no está archivado.

#### Scenario: Se muestran todos los platos activos

- **WHEN** una categoría tiene tres platos activos
- **THEN** la carta pública muestra los tres platos dentro de esa categoría

#### Scenario: Un plato archivado no aparece

- **WHEN** el dueño archiva un plato que antes estaba activo
- **THEN** la carta pública deja de mostrar ese plato

#### Scenario: Orden manual de los platos

- **WHEN** el dueño ordena los platos de una categoría en una secuencia concreta
- **THEN** la carta pública muestra los platos de esa categoría en esa misma secuencia

### Requirement: Información obligatoria por plato

El sistema MUST mostrar para cada plato su nombre, su precio en euros con IVA incluido y una descripción corta. El sistema MUST mostrar la foto del plato cuando exista y presentar el plato correctamente cuando la foto no exista, dado que la foto es opcional.

#### Scenario: Plato con todos sus datos y foto

- **WHEN** un plato activo tiene nombre, precio, descripción y foto
- **THEN** la carta muestra el nombre, el precio en euros con IVA incluido, la descripción y la foto

#### Scenario: Plato sin foto

- **WHEN** un plato activo no tiene foto
- **THEN** la carta muestra el plato con su nombre, precio y descripción, sin hueco roto ni error visual

### Requirement: Alérgenos siempre visibles

El sistema MUST mostrar los alérgenos de cada plato de forma visible en todos los platos, usando el catálogo de los 14 alérgenos de declaración obligatoria de la normativa europea. Un plato sin alérgenos MUST declarar explícitamente "sin alérgenos"; la ausencia de información de alérgenos no es un estado válido.

#### Scenario: Plato con alérgenos

- **WHEN** un plato contiene gluten y lácteos
- **THEN** la carta muestra de forma visible que ese plato contiene gluten y lácteos

#### Scenario: Plato sin alérgenos

- **WHEN** un plato no contiene ninguno de los 14 alérgenos de declaración obligatoria
- **THEN** la carta muestra de forma visible la indicación "sin alérgenos" en ese plato

#### Scenario: Nunca se omite la información de alérgenos

- **WHEN** se muestra cualquier plato de la carta
- **THEN** el plato incluye siempre información visible de alérgenos, ya sea la lista de alérgenos presentes o la indicación "sin alérgenos"

### Requirement: Carga rápida en móvil

El sistema MUST servir la carta pública de forma que se muestre completa en menos de 2 segundos en un móvil de gama media conectado por 4G.

#### Scenario: Tiempo de carga aceptable

- **WHEN** un cliente abre la carta en un móvil de gama media con conexión 4G
- **THEN** la carta se muestra completa en menos de 2 segundos

### Requirement: Accesibilidad de la carta

El sistema MUST presentar la carta con tipografía legible, contraste alto y elementos táctiles grandes, apta para personas mayores usando un móvil a contraluz.

#### Scenario: Carta legible a contraluz

- **WHEN** una persona mayor abre la carta en un móvil a plena luz
- **THEN** el texto es legible con contraste alto y los elementos interactivos son suficientemente grandes para pulsarse con facilidad
