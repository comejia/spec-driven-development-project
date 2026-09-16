import express from 'express';
import session from 'express-session';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

import { construirCarta, construirCatalogoAdmin } from './carta.js';
import {
  resolverMesaPorToken,
  prepararPedido,
  confirmarPedido,
  obtenerPedidoPorNumero,
  listarMesas,
  ErrorPedido,
} from './pedidos.js';
import {
  avanzarEstado,
  cancelarPedido,
  listarActivosDelDia,
  listarHistoricoDelDia,
} from './cocina.js';
import { emisorCocina } from './sse.js';
import {
  crearCategoria,
  editarCategoria,
  reordenarCategorias,
  archivarCategoria,
  crearPlato,
  editarPlato,
  reordenarPlatos,
  archivarPlato,
  ErrorValidacion,
} from './catalogo.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const TAMANO_MAX_FOTO = 5 * 1024 * 1024; // 5 MB
export const FORMATOS_FOTO = Object.freeze({
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
});

/**
 * Crea la app Express.
 * @param {object} opts
 * @param {import('better-sqlite3').Database} opts.db
 * @param {string} [opts.password] Contraseña de establecimiento.
 * @param {string} [opts.fotosDir] Directorio donde se guardan las fotos.
 * @param {string} [opts.staticsDir] Directorio de estáticos del frontend (build de Vite).
 */
export function crearApp({ db, password = 'la-estacion', fotosDir, staticsDir, emisor = emisorCocina } = {}) {
  const app = express();
  const dirFotos = fotosDir ?? path.join(__dirname, '..', 'data', 'fotos');
  fs.mkdirSync(dirFotos, { recursive: true });

  app.use(express.json());
  app.use(
    session({
      secret: process.env.SESSION_SECRET ?? 'cartaya-dev-secret',
      resave: false,
      saveUninitialized: false,
    })
  );

  // ---- Fotos como estáticos con cabeceras de caché (sin embeber binarios) ----
  app.use(
    '/fotos',
    express.static(dirFotos, {
      maxAge: '7d',
      immutable: true,
    })
  );

  // ---- API pública: la carta en una sola respuesta ----
  app.get('/api/carta', (req, res) => {
    res.json(construirCarta(db));
  });

  // ---- API pública: pedido desde la mesa (sin sesión ni datos personales) ----
  // Resuelve una mesa por el token de su QR impreso.
  app.get('/api/mesa/:token', (req, res) => {
    const mesa = resolverMesaPorToken(db, req.params.token);
    if (!mesa) return res.status(404).json({ error: 'La mesa no es válida.' });
    res.json({ numero: mesa.numero });
  });

  // Previsualiza el pedido (resumen con total y líneas retiradas) sin persistir.
  app.post('/api/pedidos/preparar', (req, res) => {
    manejarPedido(res, () => prepararPedido(db, { lineas: req.body?.lineas ?? [] }));
  });

  // Confirma el pedido: revalida platos activos, retira inactivos y crea el pedido.
  app.post('/api/pedidos', (req, res) => {
    manejarPedido(res, () =>
      confirmarPedido(db, { token: req.body?.token, lineas: req.body?.lineas ?? [] }, { emisor })
    , 201);
  });

  // Consulta el estado de un pedido por su número.
  app.get('/api/pedidos/:numeroPedido', (req, res) => {
    const pedido = obtenerPedidoPorNumero(db, req.params.numeroPedido);
    if (!pedido) return res.status(404).json({ error: 'El pedido no existe.' });
    res.json(pedido);
  });

  // ---- Autenticación de establecimiento ----
  app.post('/api/login', (req, res) => {
    const { password: pass } = req.body ?? {};
    if (pass === password) {
      req.session.autenticado = true;
      return res.json({ ok: true });
    }
    return res.status(401).json({ error: 'Contraseña incorrecta.' });
  });

  app.post('/api/logout', (req, res) => {
    req.session.destroy(() => res.json({ ok: true }));
  });

  // ---- Middleware de sesión que protege /api/admin/* ----
  function requiereSesion(req, res, next) {
    if (req.session?.autenticado) return next();
    return res.status(401).json({ error: 'Se requiere sesión de establecimiento.' });
  }
  app.use('/api/admin', requiereSesion);

  // ---- Catálogo completo de administración (incluye categorías sin platos) ----
  app.get('/api/admin/catalogo', (req, res) => {
    res.json(construirCatalogoAdmin(db));
  });

  // ---- Mesas con su token, para generar/imprimir el QR (solo bajo sesión) ----
  app.get('/api/admin/mesas', (req, res) => {
    res.json({ mesas: listarMesas(db) });
  });

  // ---- Panel de cocina (solo bajo sesión) ----
  // Vista activa del día: pedidos recibidos y en preparación, por antigüedad.
  app.get('/api/admin/cocina/pedidos', (req, res) => {
    res.json({ pedidos: listarActivosDelDia(db) });
  });

  // Histórico del día: pedidos servidos y cancelados.
  app.get('/api/admin/cocina/historico', (req, res) => {
    res.json({ pedidos: listarHistoricoDelDia(db) });
  });

  // Avanza el estado siguiendo la secuencia estricta (recibido→en_preparacion→servido).
  app.post('/api/admin/cocina/pedidos/:numeroPedido/avanzar', (req, res) => {
    manejarPedido(res, () =>
      avanzarEstado(db, req.params.numeroPedido, req.body?.estado, { emisor })
    );
  });

  // Cancela un pedido (solo si está en 'recibido'); registra el momento, no borra.
  app.post('/api/admin/cocina/pedidos/:numeroPedido/cancelar', (req, res) => {
    manejarPedido(res, () => cancelarPedido(db, req.params.numeroPedido, { emisor }));
  });

  // Stream SSE de eventos del panel: alta del suscriptor y limpieza al cerrar.
  app.get('/api/admin/cocina/stream', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    });
    res.flushHeaders?.();
    const baja = emisor.suscribir(res);
    req.on('close', () => baja());
  });

  // ---- Subida de fotos (multer en memoria para validar tamaño y formato) ----
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: TAMANO_MAX_FOTO },
  });

  // ---- Rutas de administración: categorías ----
  app.post('/api/admin/categorias', (req, res) => {
    manejar(res, () => crearCategoria(db, { nombre: req.body?.nombre }), 201);
  });

  app.put('/api/admin/categorias/:id', (req, res) => {
    manejar(res, () => editarCategoria(db, Number(req.params.id), { nombre: req.body?.nombre }));
  });

  app.post('/api/admin/categorias/reordenar', (req, res) => {
    manejar(res, () => {
      reordenarCategorias(db, req.body?.ids ?? []);
      return { ok: true };
    });
  });

  app.post('/api/admin/categorias/:id/archivar', (req, res) => {
    manejar(res, () => archivarCategoria(db, Number(req.params.id)));
  });

  // ---- Rutas de administración: platos ----
  app.post('/api/admin/platos', (req, res) => {
    manejar(res, () => crearPlato(db, mapearPlato(req.body)), 201);
  });

  app.put('/api/admin/platos/:id', (req, res) => {
    manejar(res, () => editarPlato(db, Number(req.params.id), mapearPlato(req.body, true)));
  });

  app.post('/api/admin/platos/reordenar', (req, res) => {
    manejar(res, () => {
      reordenarPlatos(db, Number(req.body?.categoriaId), req.body?.ids ?? []);
      return { ok: true };
    });
  });

  app.post('/api/admin/platos/:id/archivar', (req, res) => {
    manejar(res, () => archivarPlato(db, Number(req.params.id)));
  });

  // ---- Subida de foto para un plato ----
  app.post(
    '/api/admin/platos/:id/foto',
    (req, res, next) => {
      upload.single('foto')(req, res, (err) => {
        if (err) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ error: 'La foto excede el tamaño permitido (máx. 5 MB).' });
          }
          return res.status(400).json({ error: 'No se pudo procesar la foto.' });
        }
        next();
      });
    },
    (req, res) => {
      if (!req.file) return res.status(400).json({ error: 'No se recibió ninguna foto.' });
      const ext = FORMATOS_FOTO[req.file.mimetype];
      if (!ext) {
        return res
          .status(415)
          .json({ error: 'Formato no permitido. Use JPG, PNG o WebP.' });
      }
      const nombreFichero = `${crypto.randomUUID()}${ext}`;
      fs.writeFileSync(path.join(dirFotos, nombreFichero), req.file.buffer);
      manejar(res, () => editarPlato(db, Number(req.params.id), { fotoRuta: nombreFichero }));
    }
  );

  // ---- Estáticos del frontend (build de Vite) ----
  if (staticsDir && fs.existsSync(staticsDir)) {
    app.use(express.static(staticsDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/fotos')) return next();
      res.sendFile(path.join(staticsDir, 'index.html'));
    });
  }

  return app;
}

function mapearPlato(body = {}, esEdicion = false) {
  const salida = {};
  if (body.categoriaId !== undefined) salida.categoriaId = Number(body.categoriaId);
  if (body.nombre !== undefined) salida.nombre = body.nombre;
  if (body.precioCentimos !== undefined) salida.precioCentimos = Number(body.precioCentimos);
  if (body.descripcion !== undefined) salida.descripcion = body.descripcion;
  if (body.sinAlergenos !== undefined) salida.sinAlergenos = Boolean(body.sinAlergenos);
  if (body.alergenos !== undefined) salida.alergenos = body.alergenos;
  if (body.fotoRuta !== undefined) salida.fotoRuta = body.fotoRuta;
  // En creación aportamos valores por defecto explícitos.
  if (!esEdicion) {
    salida.categoriaId ??= undefined;
    salida.sinAlergenos ??= false;
    salida.alergenos ??= [];
  }
  return salida;
}

function manejar(res, fn, exito = 200) {
  try {
    const resultado = fn();
    res.status(exito).json(resultado);
  } catch (err) {
    if (err instanceof ErrorValidacion) {
      return res.status(422).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

// Ejecuta lógica de pedido, mapeando ErrorPedido (mesa inválida, pedido vacío,
// cantidad/nota inválidas) a 422 y el resto a 500.
function manejarPedido(res, fn, exito = 200) {
  try {
    const resultado = fn();
    res.status(exito).json(resultado);
  } catch (err) {
    if (err instanceof ErrorPedido) {
      return res.status(422).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}
