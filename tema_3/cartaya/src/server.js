import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { abrirBaseDeDatos } from './db.js';
import { crearApp } from './app.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PUERTO = process.env.PORT ?? 3000;
const RUTA_BD = process.env.CARTAYA_DB ?? path.join(__dirname, '..', 'data', 'cartaya.db');
const DIR_ESTATICOS = path.join(__dirname, '..', 'frontend', 'dist');
const DIR_FOTOS = path.join(__dirname, '..', 'data', 'fotos');

const db = abrirBaseDeDatos(RUTA_BD);
const app = crearApp({
  db,
  password: process.env.CARTAYA_PASSWORD ?? 'la-estacion',
  fotosDir: DIR_FOTOS,
  staticsDir: DIR_ESTATICOS,
});

app.listen(PUERTO, () => {
  console.log(`CartaYa escuchando en http://localhost:${PUERTO}`);
});
