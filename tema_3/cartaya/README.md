# CartaYa — La Estación

Carta digital para la cafetería de barrio **La Estación**. El cliente escanea el
QR de su mesa y consulta la carta desde el móvil, sin registrarse ni instalar
nada. El dueño (Andrés) gestiona el catálogo —categorías, platos, precios,
alérgenos y fotos— desde una pantalla de administración protegida por contraseña.

Este repositorio cubre la **consulta pública de la carta** y la **administración
del catálogo**. El flujo de pedido desde la mesa queda fuera de alcance.

## Características

- **Carta pública** accesible sin identificación, organizada en categorías con
  orden manual; cada plato muestra nombre, precio (€, IVA incluido), descripción,
  foto opcional y **alérgenos siempre visibles** (los 14 de la normativa UE).
- **Administración del catálogo** protegida por sesión de establecimiento:
  crear, editar, reordenar y archivar categorías y platos, y subir foto al editar
  un plato.
- **Archivado** en lugar de borrado (soft-delete): lo archivado desaparece de la
  carta pública pero se conserva.
- **Accesibilidad**: contraste alto, tipografía legible y objetivos táctiles
  grandes, pensado para personas mayores usando el móvil a contraluz.
- Objetivo de rendimiento: la carta pública carga en **menos de 2 segundos** en
  un móvil de gama media con 4G.

## Stack técnico

| Capa      | Tecnología |
|-----------|------------|
| Backend   | Node.js 22, Express, better-sqlite3 (SQLite en un único fichero) |
| Frontend  | React 19 + Vite, compilado a estáticos y servido por el propio Express |
| Tests     | Runner nativo de Node (`node --test`) |
| Auth      | Sesión simple con contraseña de establecimiento (sin multiusuario) |

Precios en euros con IVA incluido. Idioma: español de España.

## Estructura del proyecto

La raíz del proyecto es el **backend**; el frontend vive en su propia carpeta.

```
cartaya/
├── src/                  # Backend (Node.js + Express)
│   ├── server.js         # Punto de entrada: abre la BD y arranca Express
│   ├── app.js            # Fábrica de la app Express (rutas, sesión, estáticos)
│   ├── db.js             # Inicialización idempotente del esquema SQLite
│   ├── carta.js          # Construcción de la carta pública y del catálogo admin
│   ├── catalogo.js       # Lógica de dominio: CRUD y validaciones de categorías/platos
│   └── alergenos.js      # Catálogo cerrado de los 14 alérgenos UE y su validación
├── frontend/             # Cliente React (Vite)
│   ├── index.html
│   └── src/
│       ├── main.jsx      # Punto de entrada y enrutado (/admin vs. carta pública)
│       ├── Carta.jsx     # Vista pública de la carta
│       ├── Admin.jsx     # Vista de administración (tras la sesión)
│       └── estilos.css   # Estilos accesibles (contraste, tipografía, toque)
├── test/                 # Tests (backend y frontend); un test por escenario de spec
├── openspec/             # Especificaciones y cambios (OpenSpec)
├── vite.config.js        # Configuración de build y proxy de desarrollo
└── package.json
```

## Requisitos previos

- **Node.js 22** (fijado en `.nvmrc`). Con [nvm](https://github.com/nvm-sh/nvm):
  ```bash
  nvm use          # usa la versión de .nvmrc (Node 22)
  ```
- npm (incluido con Node).

## Instalación

```bash
npm install
```

Instala las dependencias del backend y del frontend. `better-sqlite3` compila un
binario nativo; en Node 22 se resuelve con un prebuild sin necesidad de toolchain.

## Puesta en marcha

El backend Express sirve **tanto la API como el frontend compilado** en un único
puerto (por defecto, el 3000).

```bash
npm run build:frontend   # compila el frontend a frontend/dist (solo si cambió el front)
npm start                # arranca el servidor en http://localhost:3000
```

Luego abre:

- **Carta pública:** <http://localhost:3000/>
- **Administración:** <http://localhost:3000/admin> (contraseña por defecto: `la-estacion`)

> La carta arranca vacía. Entra en `/admin`, inicia sesión y crea una categoría
> con al menos un plato: la carta pública solo muestra categorías con platos
> activos.

### Desarrollo del frontend (recarga automática)

Para iterar sobre el frontend sin recompilar en cada cambio, usa dos terminales:

```bash
npm start            # terminal 1: backend en :3000
npm run dev:frontend # terminal 2: Vite en :5173 con recarga en vivo
```

Vite (`:5173`) recompila al guardar y refresca el navegador; su proxy reenvía
`/api` y `/fotos` al backend en `:3000`. Para **usar** la app (no desarrollarla),
basta con `npm start`.

## Scripts

| Script                    | Descripción |
|---------------------------|-------------|
| `npm start`               | Arranca el servidor Express (API + frontend + fotos) |
| `npm test`                | Ejecuta toda la suite de tests (`node --test`) |
| `npm run build:frontend`  | Compila el frontend React a `frontend/dist` |
| `npm run dev:frontend`    | Servidor de desarrollo de Vite con recarga automática |

## Configuración

Se ajusta mediante variables de entorno al arrancar:

| Variable            | Por defecto           | Descripción |
|---------------------|-----------------------|-------------|
| `PORT`              | `3000`                | Puerto del servidor |
| `CARTAYA_PASSWORD`  | `la-estacion`         | Contraseña de la administración |
| `CARTAYA_DB`        | `data/cartaya.db`     | Ruta al fichero SQLite (`:memory:` para BD volátil) |
| `SESSION_SECRET`    | `cartaya-dev-secret`  | Secreto de sesión (define uno propio en producción) |

Ejemplo:

```bash
PORT=4000 CARTAYA_PASSWORD=miclave npm start
```

## API

### Pública (sin sesión)

| Método | Ruta          | Descripción |
|--------|---------------|-------------|
| `GET`  | `/api/carta`  | Carta completa: categorías activas ordenadas con sus platos activos y alérgenos resueltos |
| `GET`  | `/fotos/:archivo` | Fotos de los platos servidas como estáticos con caché |

### Sesión

| Método | Ruta          | Descripción |
|--------|---------------|-------------|
| `POST` | `/api/login`  | Inicia sesión con `{ "password": "..." }` |
| `POST` | `/api/logout` | Cierra la sesión |

### Administración (requiere sesión)

| Método | Ruta                                   | Descripción |
|--------|----------------------------------------|-------------|
| `GET`  | `/api/admin/catalogo`                  | Todas las categorías no archivadas (incluidas las vacías) con sus platos |
| `POST` | `/api/admin/categorias`                | Crea una categoría |
| `PUT`  | `/api/admin/categorias/:id`            | Edita el nombre de una categoría |
| `POST` | `/api/admin/categorias/reordenar`      | Reordena categorías (`{ ids: [...] }`) |
| `POST` | `/api/admin/categorias/:id/archivar`   | Archiva una categoría |
| `POST` | `/api/admin/platos`                    | Crea un plato |
| `PUT`  | `/api/admin/platos/:id`                | Edita un plato |
| `POST` | `/api/admin/platos/reordenar`          | Reordena platos (`{ categoriaId, ids: [...] }`) |
| `POST` | `/api/admin/platos/:id/archivar`       | Archiva un plato |
| `POST` | `/api/admin/platos/:id/foto`           | Sube/cambia la foto (multipart, campo `foto`; JPG/PNG/WebP, máx. 5 MB) |

## Reglas de negocio destacadas

- **Alérgenos obligatorios**: cada plato declara la lista de alérgenos presentes
  (de los 14 UE) o explícitamente "sin alérgenos". El estado "sin información" no
  es válido. Solo se declara presencia ("contiene"), no trazas.
- **Precio** obligatorio y mayor que 0, almacenado en céntimos (entero) para
  evitar errores de coma flotante.
- **Descripción** opcional, máximo 200 caracteres.
- **Nombres únicos**: no se permiten dos categorías con el mismo nombre, ni dos
  platos con el mismo nombre en una categoría (ignorando mayúsculas y espacios).
- **Archivar una categoría** oculta también sus platos de la carta pública,
  conservando el estado individual de cada plato.
- **Privacidad por diseño**: la carta pública no crea sesión ni pide datos del
  cliente.

## Tests

```bash
npm test
```

La suite usa el runner nativo de Node. Cada escenario de las especificaciones
(`openspec/`) tiene un test trazable por el nombre del escenario.

## Especificaciones (OpenSpec)

El comportamiento observable del sistema es la fuente de verdad y vive en
`openspec/`. Un comportamiento que las specs no describan se considera un defecto,
aunque el código funcione. Los cambios se gestionan como propuestas de OpenSpec
(propuesta + deltas de spec).
