// Emisor SSE (Server-Sent Events) en memoria para el panel de cocina.
//
// El contexto del proyecto fija SSE (no polling, no WebSockets) para el tiempo
// real. Para una cafetería basta un único proceso Express con un conjunto de
// suscriptores en memoria: cada suscriptor es un `res` (respuesta HTTP abierta)
// al que se le escriben eventos con nombre. Si un cliente se desconecta, se da
// de baja; al reconectar, recarga el estado por REST y vuelve a suscribirse.
//
// Formato de un evento SSE:
//   event: <nombre>\n
//   data: <json>\n
//   \n
//
// No se persisten eventos: el SSE solo empuja novedades mientras el cliente está
// conectado (ver design.md, decisión 4 y Non-Goals).

/** Nombres de evento que emite el panel de cocina. */
export const EVENTO_PEDIDO_NUEVO = 'pedido-nuevo';
export const EVENTO_PEDIDO_ACTUALIZADO = 'pedido-actualizado';

/**
 * Crea un emisor SSE con su propio conjunto de suscriptores.
 * @returns {{
 *   suscribir: (res: { write: Function, end?: Function }) => (() => void),
 *   publicar: (evento: string, datos: any) => void,
 *   numeroSuscriptores: () => number,
 *   cerrar: () => void,
 * }}
 */
export function crearEmisorSSE() {
  /** @type {Set<{ write: Function }>} */
  const suscriptores = new Set();
  let latido = null;

  function formatearEvento(evento, datos) {
    return `event: ${evento}\ndata: ${JSON.stringify(datos)}\n\n`;
  }

  /** Registra un suscriptor y devuelve la función para darlo de baja. */
  function suscribir(res) {
    suscriptores.add(res);
    // Comentario inicial: abre el stream y evita que algún proxy lo cierre.
    try {
      res.write(': conectado\n\n');
    } catch {
      suscriptores.delete(res);
    }
    // Arranca el latido perezosamente cuando hay al menos un suscriptor.
    arrancarLatido();
    return () => darDeBaja(res);
  }

  function darDeBaja(res) {
    suscriptores.delete(res);
    if (suscriptores.size === 0) detenerLatido();
  }

  /** Difunde un evento con nombre a todos los suscriptores vivos. */
  function publicar(evento, datos) {
    const trozo = formatearEvento(evento, datos);
    for (const res of [...suscriptores]) {
      try {
        res.write(trozo);
      } catch {
        // Suscriptor muerto: se retira para no volver a escribir en él.
        suscriptores.delete(res);
      }
    }
  }

  function arrancarLatido() {
    if (latido || typeof setInterval !== 'function') return;
    latido = setInterval(() => {
      for (const res of [...suscriptores]) {
        try {
          res.write(': latido\n\n');
        } catch {
          suscriptores.delete(res);
        }
      }
    }, 25000);
    // No mantener vivo el proceso solo por el latido.
    latido.unref?.();
  }

  function detenerLatido() {
    if (latido) {
      clearInterval(latido);
      latido = null;
    }
  }

  function cerrar() {
    detenerLatido();
    for (const res of [...suscriptores]) {
      try {
        res.end?.();
      } catch {
        // ignorar
      }
    }
    suscriptores.clear();
  }

  return {
    suscribir,
    publicar,
    numeroSuscriptores: () => suscriptores.size,
    cerrar,
  };
}

/**
 * Emisor por defecto compartido por el proceso. La app y el dominio publican en
 * él; los tests pueden crear emisores aislados con `crearEmisorSSE`.
 */
export const emisorCocina = crearEmisorSSE();
