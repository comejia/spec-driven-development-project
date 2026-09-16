## Purpose

Define la administración del catálogo de la carta (categorías y platos) que el dueño de La Estación realiza desde una pantalla protegida por la sesión de establecimiento, pensada para usarse desde el móvil: crear, editar, reordenar, archivar y subir fotos con límite de tamaño.

## Requirements

### Requirement: Acceso a la administración protegido por sesión

El sistema MUST exigir la sesión de establecimiento (contraseña de establecimiento) para acceder a la administración del catálogo y para ejecutar cualquier operación de gestión de categorías o platos. Las operaciones de administración MUST rechazarse cuando no haya sesión válida.

#### Scenario: Acceso sin sesión

- **WHEN** alguien intenta abrir la administración del catálogo sin sesión de establecimiento válida
- **THEN** el sistema deniega el acceso y no muestra ni permite modificar el catálogo

#### Scenario: Acceso con sesión válida

- **WHEN** el dueño accede a la administración con la sesión de establecimiento válida
- **THEN** el sistema le permite gestionar categorías y platos

### Requirement: Vista del catálogo completo para administración

El sistema MUST permitir al dueño, con sesión válida, consultar el catálogo completo de administración: todas las categorías no archivadas —tengan platos o no— con sus platos no archivados. Esta vista MUST incluir las categorías sin platos activos, a diferencia de la carta pública, para que el dueño pueda añadirles platos y gestionarlas. La consulta del catálogo de administración MUST rechazarse cuando no haya sesión válida.

#### Scenario: El catálogo de administración muestra categorías sin platos

- **WHEN** el dueño, con sesión válida, ha creado una categoría que todavía no tiene ningún plato
- **THEN** el catálogo de administración muestra esa categoría, aunque la carta pública no la muestre, para que pueda añadirle platos

#### Scenario: El catálogo de administración requiere sesión

- **WHEN** alguien intenta consultar el catálogo de administración sin sesión de establecimiento válida
- **THEN** el sistema deniega el acceso

### Requirement: Gestión de categorías

El sistema MUST permitir al dueño crear una categoría, editar su nombre y establecer el orden manual de las categorías. El orden y los nombres definidos aquí MUST ser los que use la carta pública. El sistema MUST rechazar el nombre de una categoría que ya exista entre las categorías no archivadas, comparando sin distinguir mayúsculas ni espacios sobrantes.

#### Scenario: Crear una categoría

- **WHEN** el dueño crea una categoría con nombre "Postres"
- **THEN** el sistema registra la categoría "Postres" y queda disponible para asignarle platos

#### Scenario: Reordenar categorías

- **WHEN** el dueño cambia el orden de las categorías
- **THEN** el sistema guarda el nuevo orden y la carta pública lo refleja

#### Scenario: Nombre de categoría duplicado

- **WHEN** el dueño intenta crear o renombrar una categoría con un nombre que ya usa otra categoría no archivada, ignorando mayúsculas y espacios sobrantes
- **THEN** el sistema rechaza la operación e informa de que el nombre ya existe

### Requirement: Gestión de platos

El sistema MUST permitir al dueño crear un plato dentro de una categoría, editar su nombre, precio (euros con IVA incluido), descripción corta y alérgenos, y establecer el orden manual de los platos dentro de su categoría. Cada plato MUST tener declarada su información de alérgenos: la lista de alérgenos presentes de entre los 14 obligatorios, o la indicación explícita de que no tiene alérgenos. Los alérgenos se declaran únicamente por presencia ("contiene"); en este cambio el sistema no gestiona trazas ("puede contener"). El precio MUST ser obligatorio y mayor que 0. La descripción corta MUST ser opcional y, cuando exista, MUST tener como máximo 200 caracteres. El sistema MUST rechazar el nombre de un plato que ya exista entre los platos no archivados de la misma categoría, comparando sin distinguir mayúsculas ni espacios sobrantes.

#### Scenario: Crear un plato

- **WHEN** el dueño crea un plato "Tostada con tomate" en la categoría "Desayunos" con precio y descripción
- **THEN** el sistema registra el plato como activo en esa categoría y aparece en la carta pública

#### Scenario: Editar el precio de un plato

- **WHEN** el dueño cambia el precio de un plato
- **THEN** el sistema guarda el nuevo precio y la carta pública muestra el precio actualizado

#### Scenario: Precio obligatorio y mayor que 0

- **WHEN** el dueño intenta guardar un plato sin precio o con precio 0 o negativo
- **THEN** el sistema rechaza el guardado y exige un precio mayor que 0

#### Scenario: Descripción opcional con longitud máxima

- **WHEN** el dueño guarda un plato sin descripción, o con una descripción de más de 200 caracteres
- **THEN** el sistema acepta el plato sin descripción, pero rechaza el guardado cuando la descripción supera los 200 caracteres

#### Scenario: Nombre de plato duplicado en la categoría

- **WHEN** el dueño intenta crear o renombrar un plato con un nombre que ya usa otro plato no archivado de la misma categoría, ignorando mayúsculas y espacios sobrantes
- **THEN** el sistema rechaza la operación e informa de que el nombre ya existe en esa categoría

#### Scenario: Declarar plato sin alérgenos

- **WHEN** el dueño marca un plato como "sin alérgenos"
- **THEN** el sistema guarda esa declaración y la carta pública la muestra de forma visible

#### Scenario: Un plato debe declarar alérgenos

- **WHEN** el dueño intenta guardar un plato sin indicar ni alérgenos presentes ni la declaración "sin alérgenos"
- **THEN** el sistema rechaza el guardado y exige declarar la información de alérgenos

### Requirement: Archivado en lugar de borrado

El sistema MUST archivar categorías y platos en vez de eliminarlos físicamente. Un elemento archivado MUST desaparecer de la carta pública pero MUST conservarse en el sistema para que futuros pedidos históricos puedan referenciarlo. El sistema MUST permitir al dueño archivar un plato o una categoría. Al archivar una categoría, sus platos MUST dejar de mostrarse en la carta pública mientras la categoría esté archivada, conservando cada plato su propio estado de archivado.

#### Scenario: Archivar un plato

- **WHEN** el dueño archiva un plato
- **THEN** el sistema conserva el plato archivado y deja de mostrarlo en la carta pública

#### Scenario: Archivar una categoría oculta sus platos

- **WHEN** el dueño archiva una categoría que contiene platos activos
- **THEN** el sistema conserva la categoría y sus platos, y la carta pública deja de mostrar la categoría y esos platos mientras la categoría esté archivada

#### Scenario: El elemento archivado se conserva

- **WHEN** un plato ha sido archivado
- **THEN** el plato sigue existiendo en el sistema y puede ser referenciado, aunque no aparezca en la carta pública

### Requirement: Subida de fotos con límite de tamaño

El sistema MUST permitir al dueño subir una foto opcional para un plato en formato JPG, PNG o WebP, y MUST rechazar las fotos que superen los 5 MB o que estén en un formato distinto de esos tres.

#### Scenario: Subir una foto válida

- **WHEN** el dueño sube una foto en JPG, PNG o WebP de 5 MB o menos para un plato
- **THEN** el sistema guarda la foto y la carta pública la muestra en ese plato

#### Scenario: Rechazar una foto demasiado grande

- **WHEN** el dueño intenta subir una foto que supera los 5 MB
- **THEN** el sistema rechaza la subida e informa de que la foto excede el tamaño permitido

#### Scenario: Rechazar un formato de foto no admitido

- **WHEN** el dueño intenta subir una foto en un formato distinto de JPG, PNG o WebP
- **THEN** el sistema rechaza la subida e informa de que el formato no está permitido

### Requirement: Administración usable desde el móvil

El sistema MUST presentar la pantalla de administración de forma usable en un móvil, con elementos táctiles grandes y controles adecuados para gestionar el catálogo desde el teléfono. Al editar un plato, la vista de administración MUST ofrecer un control para subir o cambiar su foto que use la subida de fotos con límite de tamaño y formato.

#### Scenario: Administrar desde el móvil

- **WHEN** el dueño accede a la administración desde su móvil
- **THEN** puede crear, editar, reordenar y archivar categorías y platos, y subir la foto de un plato al editarlo, con controles cómodos para pantalla táctil

#### Scenario: Subir la foto de un plato desde la administración

- **WHEN** el dueño, al editar un plato desde la vista de administración, elige una foto para ese plato
- **THEN** la vista envía la foto a la subida de administración y, si es válida, la foto queda asociada al plato y se muestra en la carta pública
