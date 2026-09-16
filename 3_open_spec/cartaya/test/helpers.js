import Database from 'better-sqlite3';
import { inicializarEsquema } from '../src/db.js';
import { crearApp } from '../src/app.js';

/** Crea una BD en memoria con el esquema inicializado. */
export function nuevaBD() {
  const db = new Database(':memory:');
  inicializarEsquema(db);
  return db;
}

/**
 * Levanta la app en un puerto efímero y devuelve utilidades de cliente HTTP.
 * Recuerda llamar a `cerrar()` al final del test.
 */
export async function levantarApp(opciones = {}) {
  const db = opciones.db ?? nuevaBD();
  const app = crearApp({ db, password: 'clave-test', ...opciones });
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  // Cliente que mantiene la cookie de sesión entre peticiones.
  let cookie = null;
  async function pedir(metodo, ruta, { body, headers = {}, raw = false } = {}) {
    const opts = { method: metodo, headers: { ...headers } };
    // Evita keep-alive: sin esto el socket queda abierto y server.close() cuelga.
    opts.headers.connection = 'close';
    if (body !== undefined && !raw) {
      opts.headers['content-type'] = 'application/json';
      opts.body = JSON.stringify(body);
    } else if (raw && body !== undefined) {
      opts.body = body;
    }
    if (cookie) opts.headers.cookie = cookie;
    const res = await fetch(`${base}${ruta}`, opts);
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    return res;
  }

  return {
    db,
    base,
    pedir,
    async login(pass = 'clave-test') {
      return pedir('POST', '/api/login', { body: { password: pass } });
    },
    cerrar() {
      return new Promise((resolve) => {
        // Fuerza el cierre de conexiones keep-alive vivas antes de cerrar.
        server.closeAllConnections?.();
        server.close(() => {
          try {
            db.close();
          } catch {
            // la BD puede estar ya cerrada
          }
          resolve();
        });
      });
    },
  };
}
