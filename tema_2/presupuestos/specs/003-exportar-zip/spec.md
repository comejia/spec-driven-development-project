# Especificación de funcionalidad: Exportar todos los presupuestos en un .zip

**Rama de funcionalidad**: `003-exportar-zip`

**Creada**: 2026-08-27

**Estado**: Borrador

**Entrada**: Descripción del usuario: "Exportar todos mis presupuestos en un .zip — un botón que descargue un único archivo comprimido con un PDF por cada presupuesto y un archivo de datos único, como copia de seguridad para el freelancer."

## Clarifications

### Session 2026-08-27

- Q: Si al preparar la copia falla la generación de un PDF concreto (por un dato inesperado), ¿qué debe hacer la exportación? → A: Abortar toda la exportación y mostrar un aviso claro; no se descarga ningún `.zip`.
- Q: ¿Qué debe pasar durante la barra de progreso — porcentaje o solo indicador de "trabajando"? → A: Barra con porcentaje/contador real basado en PDF generados (p. ej. "12 de 50").
- Q: ¿`datos.json` debe cuadrar con la estructura interna actual o basta cualquier formato legible? → A: Debe reflejar exactamente la estructura interna actual para restaurar tal cual.

## Escenarios de usuario y pruebas *(obligatorio)*

### Historia de usuario 1 - Descargar una copia completa en un solo clic (Prioridad: P1)

El freelancer entra en la lista de presupuestos, ve un botón "Exportar todo (.zip)" en la cabecera y lo pulsa. La aplicación reúne todos sus presupuestos numerados y le entrega un único archivo `.zip` que puede guardar donde quiera como copia de seguridad. Al descomprimirlo con doble clic encuentra un PDF por cada presupuesto y un único archivo de datos.

**Por qué esta prioridad**: Es el corazón de la funcionalidad y su razón de ser. Hoy los datos del freelancer viven solo en su navegador y no tiene forma de llevárselos. Este botón es su seguro de vida. Sin esto, la funcionalidad no existe.

**Prueba independiente**: Con 3 presupuestos numerados creados, pulsar el botón y comprobar que se descarga un único `.zip`; al descomprimirlo aparecen exactamente 3 PDF y un único archivo de datos.

**Escenarios de aceptación**:

1. **Dado** que el freelancer tiene 3 presupuestos numerados, **cuando** pulsa "Exportar todo (.zip)", **entonces** el navegador descarga un único archivo `.zip`.
2. **Dado** el `.zip` descargado, **cuando** el freelancer lo descomprime, **entonces** contiene 3 archivos PDF (uno por presupuesto) y un único archivo de datos.
3. **Dado** cualquiera de los PDF del `.zip`, **cuando** el freelancer lo abre, **entonces** es idéntico al PDF que la aplicación descarga individualmente para ese mismo presupuesto (mismo contenido y mismo total; ejemplo de control: 3.604,00 €).
4. **Dado** que acaba de exportar, **cuando** vuelve a la lista de presupuestos, **entonces** la aplicación sigue exactamente igual que antes (no se ha creado, modificado ni borrado ningún presupuesto, servicio ni dato del perfil).

---

### Historia de usuario 2 - Nombres reconocibles y a prueba de errores (Prioridad: P2)

Cuando el freelancer abre el `.zip`, entiende de un vistazo qué contiene: el propio archivo comprimido lleva la fecha del día de la exportación, y cada PDF lleva el número de presupuesto y el nombre del cliente. Aunque un cliente tenga un nombre con caracteres conflictivos, el `.zip` se abre sin romperse.

**Por qué esta prioridad**: Una copia de seguridad que no se puede identificar ni abrir no sirve de nada. Los nombres claros y limpios convierten el archivo en algo útil y archivable. Depende de que P1 ya genere el `.zip`.

**Prueba independiente**: Crear un presupuesto para un cliente llamado "Diseño/Web S.L.", exportar y comprobar que el `.zip` se descomprime sin errores y el PDF de ese cliente tiene un nombre de archivo válido y legible.

**Escenarios de aceptación**:

1. **Dado** que hoy es 15/03/2026, **cuando** el freelancer exporta, **entonces** el archivo descargado se llama `presupuestospro-copia-2026-03-15.zip`.
2. **Dado** un presupuesto número "2026-001" del cliente "Estudio García", **cuando** el freelancer abre el `.zip`, **entonces** su PDF se llama `2026-001 - Estudio García.pdf`.
3. **Dado** un cliente cuyo nombre contiene caracteres no válidos para nombres de archivo (por ejemplo "Diseño/Web S.L."), **cuando** el freelancer descomprime el `.zip`, **entonces** el archivo se abre sin errores y el nombre del PDF se ha limpiado para ser un nombre de archivo válido.
4. **Dado** el `.zip` descomprimido, **cuando** el freelancer localiza el archivo de datos, **entonces** existe un único archivo llamado `datos.json` con toda la información necesaria para una futura restauración (presupuestos, catálogo de servicios y perfil del freelancer con su logo).

---

### Historia de usuario 3 - Confianza en exportaciones grandes y aviso si no hay nada (Prioridad: P3)

Si el freelancer tiene muchos presupuestos (50 o más), la exportación puede tardar unos segundos; durante ese tiempo ve claramente que la aplicación está trabajando mediante una barra de progreso, de modo que no piensa que se ha quedado colgada. Si no tiene ningún presupuesto numerado, al pulsar el botón recibe un aviso claro y no se descarga ningún archivo vacío.

**Por qué esta prioridad**: Mejora la confianza y evita confusión en los extremos (muchos datos o ningún dato), pero la funcionalidad básica ya aporta valor sin esto. Es un refinamiento sobre P1.

**Prueba independiente**: Con 50 o más presupuestos numerados, pulsar el botón y comprobar que aparece una barra de progreso mientras se prepara la copia; con 0 presupuestos numerados, pulsar el botón y comprobar que aparece un aviso y no se descarga nada.

**Escenarios de aceptación**:

1. **Dado** que el freelancer tiene 50 o más presupuestos numerados, **cuando** pulsa "Exportar todo (.zip)", **entonces** ve una barra de progreso con porcentaje o contador real (p. ej. "12 de 50") que avanza a medida que se generan los PDF, hasta que la descarga comienza.
2. **Dado** que el freelancer no tiene ningún presupuesto numerado, **cuando** pulsa "Exportar todo (.zip)", **entonces** aparece un aviso (tooltip) indicando que no hay nada que exportar y no se descarga ningún archivo.

---

### Casos límite

- **Sin presupuestos numerados**: al pulsar el botón se muestra un aviso (tooltip) claro y no se descarga ningún `.zip` vacío.
- **Cliente con caracteres conflictivos en el nombre** (por ejemplo "Diseño/Web S.L."): el nombre del PDF dentro del `.zip` se limpia de caracteres no válidos para que el archivo comprimido no se corrompa y se pueda descomprimir con normalidad.
- **Muchos presupuestos (50 o más)**: la preparación puede tardar; el freelancer ve una barra de progreso con porcentaje o contador real (p. ej. "12 de 50") que confirma el avance de la exportación.
- **Solo borradores, ningún numerado**: se trata igual que "sin presupuestos numerados" — aviso y sin descarga (los borradores no se incluyen en la exportación).
- **Fallo al generar un PDF durante la exportación**: si cualquier PDF no se puede generar, se aborta toda la exportación y se muestra un aviso claro; no se descarga ningún `.zip` (nunca una copia parcial).

## Requisitos *(obligatorio)*

### Requisitos funcionales

- **RF-001**: La lista de presupuestos DEBE mostrar un botón "Exportar todo (.zip)" en un lugar visible de su cabecera.
- **RF-002**: Al pulsar el botón, el sistema DEBE generar y descargar un único archivo `.zip` que contenga todos los presupuestos numerados existentes.
- **RF-003**: El sistema DEBE incluir en el `.zip` un archivo PDF por cada presupuesto numerado, siendo cada PDF idéntico al que la aplicación genera para ese presupuesto de forma individual (mismo contenido y mismo total; ejemplo de control: 3.604,00 €).
- **RF-004**: El sistema DEBE incluir en el `.zip` un único archivo de datos llamado `datos.json` que contenga toda la información necesaria para una futura restauración: los presupuestos, el catálogo de servicios y el perfil del freelancer (incluido su logo). Su contenido DEBE reflejar exactamente la estructura interna que la aplicación almacena hoy, de forma que una futura restauración pueda reconstruir la aplicación tal cual, sin transformaciones ni pérdida de datos.
- **RF-005**: El sistema DEBE excluir del `.zip` los presupuestos en estado borrador; solo se incluyen los presupuestos numerados.
- **RF-006**: El sistema DEBE nombrar el archivo comprimido como `presupuestospro-copia-AAAA-MM-DD.zip`, usando la fecha local del equipo del freelancer en el momento de la exportación.
- **RF-007**: El sistema DEBE nombrar cada PDF dentro del `.zip` con el formato "número - cliente" (por ejemplo, `2026-001 - Estudio García.pdf`).
- **RF-008**: El sistema DEBE limpiar de los nombres de archivo cualquier carácter no válido para nombres de fichero, de forma que el `.zip` resultante pueda descomprimirse sin errores.
- **RF-009**: El sistema DEBE realizar la exportación como una operación de solo lectura: tras exportar, ningún presupuesto, servicio ni dato del perfil ha sido creado, modificado ni eliminado.
- **RF-010**: El sistema DEBE funcionar con cualquier número de presupuestos numerados existentes (desde 1 hasta 200 o más).
- **RF-011**: Cuando no exista ningún presupuesto numerado, el sistema DEBE mostrar un aviso (tooltip) al pulsar el botón y NO DEBE descargar ningún archivo.
- **RF-012**: Durante la preparación de la copia, el sistema DEBE mostrar una barra de progreso con porcentaje o contador real basado en los PDF ya generados (por ejemplo, "12 de 50"), que indique el avance de la exportación hasta que comienza la descarga.
- **RF-013**: Toda la interfaz, mensajes y avisos de esta funcionalidad DEBEN estar en español de España.
- **RF-014**: Si durante la preparación de la copia falla la generación de algún PDF, el sistema DEBE abortar toda la exportación, mostrar un aviso claro y NO descargar ningún archivo `.zip` (nunca se entrega una copia parcial).

### Entidades clave *(incluir si la funcionalidad implica datos)*

- **Copia de seguridad (archivo .zip)**: el paquete descargable que agrupa toda la información exportable. Contiene un conjunto de PDF (uno por presupuesto numerado) y un único archivo de datos. Se identifica por la fecha de exportación en su nombre.
- **Documento PDF del presupuesto**: representación imprimible de un presupuesto numerado, idéntica a la que ya genera la aplicación. Se identifica por número de presupuesto y nombre de cliente.
- **Archivo de datos (`datos.json`)**: contenedor único de la información restaurable: presupuestos, catálogo de servicios y perfil del freelancer (con logo). Su contenido refleja exactamente la estructura interna que la aplicación almacena hoy, para permitir una restauración tal cual. No incluye la lista de clientes guardados.

## Criterios de éxito *(obligatorio)*

### Resultados medibles

- **CE-001**: Con 3 presupuestos numerados, el freelancer pulsa el botón y obtiene un único archivo `.zip` descargado.
- **CE-002**: Al descomprimir ese `.zip`, el freelancer encuentra exactamente 3 PDF nombrados "número - cliente" y un archivo de datos `datos.json`.
- **CE-003**: Al abrir cualquier PDF del `.zip`, su contenido y total son idénticos al PDF que la aplicación descarga individualmente para ese presupuesto (verificable con el ejemplo de control de 3.604,00 €).
- **CE-004**: Con 0 presupuestos numerados, al pulsar el botón el freelancer ve un aviso y no se descarga ningún archivo.
- **CE-005**: Con un cliente cuyo nombre contiene caracteres conflictivos, el `.zip` se descomprime sin errores en el explorador de archivos del sistema.
- **CE-006**: Con 50 o más presupuestos numerados, el freelancer percibe una barra de progreso con porcentaje o contador real (p. ej. "12 de 50") que avanza durante la preparación de la copia.
- **CE-007**: Tras cualquier exportación, la lista de presupuestos y todos los datos permanecen exactamente igual que antes de exportar.

## Supuestos

- Solo se exportan los presupuestos en estado **numerado**; los borradores quedan fuera (confirmado con el usuario). Los borradores no tienen número, y la regla de nombre "número - cliente" solo aplica a numerados.
- Todo presupuesto numerado tiene los datos necesarios (perfil y cliente) para generar su PDF; por definición, sin esos datos no se genera PDF, por lo que este caso no ocurre en la práctica (confirmado con el usuario).
- El número de presupuesto es único, por lo que los nombres de archivo "número - cliente" no colisionan entre sí dentro del `.zip` (confirmado con el usuario).
- El archivo de datos único es un `datos.json` y **no** incluye la lista de clientes guardados, solo presupuestos, catálogo de servicios y perfil con logo (confirmado con el usuario).
- El aviso cuando no hay nada que exportar se muestra como un **tooltip** al pulsar el botón (confirmado con el usuario).
- La fecha del nombre del `.zip` usa la **fecha local del equipo** del freelancer, en formato `AAAA-MM-DD` (confirmado con el usuario).
- La funcionalidad **reutiliza** el PDF que ya genera la aplicación; los PDF del `.zip` deben cuadrar al céntimo con los individuales.
- El botón se ubica en la **cabecera** de la lista de presupuestos, junto a las acciones existentes (confirmado con el usuario).

## Fuera de alcance

- **Importar / restaurar** la copia (leer el `datos.json` para reconstruir la aplicación): será otra especificación.
- Exportar a Excel/CSV con formato contable.
- Copias automáticas o programadas: la exportación es solo bajo demanda, mediante el botón.
- Enviar el `.zip` por email o subirlo a cualquier nube.
- Incluir la lista de clientes guardados en el archivo de datos.
