## 1. Base del proyecto y persistencia

- [ ] 1.1 Inicializar el proyecto Node.js 22 con Express y añadir dependencias fijadas (express, better-sqlite3) con versiones pinneadas; verificar que `npm install` finaliza sin errores y el servidor arranca en un puerto local
- [ ] 1.2 Configurar el runner de tests y un script `npm test`; verificar que ejecuta y descubre un test de humo que pasa
- [ ] 1.3 Crear la inicialización idempotente del esquema SQLite (tablas `categorias`, `platos`, `platos_alergenos` con `orden`, archivado por timestamp y precio en céntimos); verificar con un test que, sobre una BD vacía, se crean las tablas y volver a ejecutarla no falla
- [ ] 1.4 Definir el catálogo cerrado de los 14 alérgenos UE y la validación de alérgenos por plato (o `sin_alergenos` sin filas, o >=1 alérgeno); verificar con un test unitario que ambos estados válidos pasan y el estado "sin información" se rechaza

## 2. API pública de la carta (capability carta-publica)

- [ ] 2.1 Implementar `GET /api/carta` que devuelva categorías activas ordenadas, cada una con sus platos activos ordenados y sus alérgenos resueltos, en una sola respuesta; verificar con el test del escenario "Consulta anónima de la carta" (acceso sin sesión) y "Se muestran todos los platos activos"
- [ ] 2.2 Excluir de la respuesta los platos y categorías archivados, las categorías sin platos activos, y los platos de una categoría archivada; verificar con los tests de los escenarios "Un plato archivado no aparece", "Categoría sin platos activos no se muestra" y "Categoría archivada oculta sus platos"
- [ ] 2.3 Garantizar el orden manual de categorías y de platos en la respuesta; verificar con los tests de los escenarios "Categorías en el orden definido por el dueño" y "Orden manual de los platos"
- [ ] 2.4 Incluir por plato nombre, precio en euros con IVA incluido, descripción, foto opcional y alérgenos siempre presentes ("sin alérgenos" cuando corresponda); verificar con los tests de los escenarios "Plato con todos sus datos y foto", "Plato sin foto", "Plato con alérgenos", "Plato sin alérgenos" y "Nunca se omite la información de alérgenos"
- [ ] 2.5 Servir las fotos como estáticos con cabeceras de caché; verificar que una foto existente se sirve y que la respuesta de la carta no embebe binarios de imagen

## 3. API de administración del catálogo (capability catalogo-admin)

- [ ] 3.1 Implementar el middleware de sesión de establecimiento y protegerlo sobre `/api/admin/*`; verificar con los tests de los escenarios "Acceso sin sesión" (rechazo) y "Acceso con sesión válida"
- [ ] 3.2 Implementar crear/editar categoría y reordenar categorías en una transacción, con nombre único entre categorías no archivadas (normalizado); verificar con los tests de los escenarios "Crear una categoría", "Reordenar categorías" y "Nombre de categoría duplicado"
- [ ] 3.3 Implementar crear/editar plato (nombre, precio en céntimos, descripción, alérgenos solo por presencia) y reordenar platos dentro de la categoría, aplicando las validaciones de precio > 0, descripción opcional ≤200 caracteres, declaración de alérgenos obligatoria y nombre único en la categoría; verificar con los tests de los escenarios "Crear un plato", "Editar el precio de un plato", "Precio obligatorio y mayor que 0", "Descripción opcional con longitud máxima", "Nombre de plato duplicado en la categoría", "Declarar plato sin alérgenos" y "Un plato debe declarar alérgenos"
- [ ] 3.4 Implementar el archivado de platos y categorías (soft-delete por timestamp) conservando el registro, ocultando en cascada los platos de una categoría archivada sin tocar su estado individual; verificar con los tests de los escenarios "Archivar un plato", "Archivar una categoría oculta sus platos" y "El elemento archivado se conserva"
- [ ] 3.5 Implementar la subida de foto opcional con validación de tamaño (≤5 MB) y formato (JPG/PNG/WebP); verificar con los tests de los escenarios "Subir una foto válida", "Rechazar una foto demasiado grande" y "Rechazar un formato de foto no admitido"

## 4. Frontend: carta pública y administración

- [ ] 4.1 Configurar React 19 + Vite con build a estáticos servidos por Express; verificar que el build genera los estáticos y Express los sirve en la ruta pública
- [ ] 4.2 Implementar la vista pública de la carta consumiendo `GET /api/carta`, con categorías, platos, precio con IVA, foto opcional y alérgenos siempre visibles; verificar que refleja los datos de la API incluyendo el caso sin foto y la indicación "sin alérgenos"
- [ ] 4.3 Aplicar estilos accesibles (contraste alto, tipografía legible, objetivos táctiles grandes) a la carta; verificar con el escenario "Carta legible a contraluz" (revisión de contraste/tamaños)
- [ ] 4.4 Implementar la vista de administración tras la sesión, con gestión y reordenación de categorías y platos, declaración de alérgenos y subida de foto, usable en móvil; verificar con el escenario "Administrar desde el móvil" y que las operaciones invocan la API de administración

## 5. Verificación de extremo a extremo

- [ ] 5.1 Comprobar que cada escenario de `carta-publica` y `catalogo-admin` tiene un test trazable por el nombre del escenario y que toda la suite pasa con `npm test`
- [ ] 5.2 Medir el tiempo de carga de la carta pública en un móvil de gama media con 4G (o perfil equivalente) y verificar el escenario "Tiempo de carga aceptable" (<2s)
