import React, { useCallback, useEffect, useRef, useState } from 'react';

// Panel de cocina de La Estación (ver openspec/specs/panel-cocina/spec.md).
//  - Requiere sesión de establecimiento (la misma de la administración).
//  - Vista activa: pedidos del día (recibido / en_preparacion) por antigüedad,
//    con mesa, platos, cantidades, notas, estado y tiempo transcurrido.
//  - Avance estricto recibido → en_preparacion → servido; cancelación solo en
//    recibido.
//  - Histórico del día (servido / cancelado).
//  - Se actualiza en vivo por SSE (EventSource): los pedidos "aparecen solos".

const ETIQUETA_ESTADO = {
  recibido: 'Recibido',
  en_preparacion: 'En preparación',
  servido: 'Servido',
  cancelado: 'Cancelado',
};

// Estado siguiente al que avanza un pedido y la etiqueta del botón de avance.
const AVANCE = {
  recibido: { estado: 'en_preparacion', etiqueta: 'Empezar a preparar' },
  en_preparacion: { estado: 'servido', etiqueta: 'Marcar como servido' },
};

async function api(metodo, ruta, cuerpo) {
  const opts = { method: metodo, headers: {} };
  if (cuerpo !== undefined) {
    opts.headers['content-type'] = 'application/json';
    opts.body = JSON.stringify(cuerpo);
  }
  const res = await fetch(ruta, opts);
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(datos.error ?? 'Error en la operación.');
  return datos;
}

function Login({ onEntrar }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  async function enviar(e) {
    e.preventDefault();
    try {
      await api('POST', '/api/login', { password });
      onEntrar();
    } catch {
      setError('Contraseña incorrecta.');
    }
  }
  return (
    <main className="cocina">
      <h1 className="cocina__titulo">Panel de cocina</h1>
      <form onSubmit={enviar}>
        <label htmlFor="pass">Contraseña de establecimiento</label>
        <input
          id="pass"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        {error && <p role="alert">{error}</p>}
        <p><button type="submit">Entrar</button></p>
      </form>
    </main>
  );
}

// Minutos transcurridos desde `creadoEn` hasta `ahora`.
function tiempoTranscurrido(creadoEn, ahora) {
  const ms = ahora - new Date(creadoEn).getTime();
  const min = Math.max(0, Math.floor(ms / 60000));
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return `${h} h ${min % 60} min`;
}

function Lineas({ lineas }) {
  return (
    <ul className="cocina-pedido__lineas">
      {lineas.map((l, i) => (
        <li key={i}>
          <span className="cocina-pedido__cantidad">{l.cantidad}×</span> {l.nombre}
          {l.nota && <span className="cocina-pedido__nota"> — {l.nota}</span>}
        </li>
      ))}
    </ul>
  );
}

function PedidoActivo({ pedido, ahora, onAvanzar, onCancelar }) {
  const avance = AVANCE[pedido.estado];
  return (
    <li className={`cocina-pedido cocina-pedido--${pedido.estado}`}>
      <header className="cocina-pedido__cabecera">
        <span className="cocina-pedido__mesa">Mesa {pedido.mesa}</span>
        <span className="cocina-pedido__pedido">#{pedido.numeroPedido}</span>
        <span className="cocina-pedido__estado">{ETIQUETA_ESTADO[pedido.estado]}</span>
        <span className="cocina-pedido__tiempo">{tiempoTranscurrido(pedido.creadoEn, ahora)}</span>
      </header>
      <Lineas lineas={pedido.lineas} />
      <div className="cocina-pedido__acciones">
        {avance && (
          <button type="button" onClick={() => onAvanzar(pedido, avance.estado)}>
            {avance.etiqueta}
          </button>
        )}
        {pedido.estado === 'recibido' && (
          <button type="button" className="secundario" onClick={() => onCancelar(pedido)}>
            Cancelar
          </button>
        )}
      </div>
    </li>
  );
}

function Panel() {
  const [activos, setActivos] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [error, setError] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [ahora, setAhora] = useState(Date.now());
  const avisoTimer = useRef(null);

  const cargar = useCallback(async () => {
    try {
      const [a, h] = await Promise.all([
        api('GET', '/api/admin/cocina/pedidos'),
        api('GET', '/api/admin/cocina/historico'),
      ]);
      setActivos(a.pedidos ?? []);
      setHistorico(h.pedidos ?? []);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Reloj para refrescar el tiempo transcurrido cada 30 s.
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  // Suscripción SSE: los pedidos aparecen y cambian de estado sin recargar.
  useEffect(() => {
    const es = new EventSource('/api/admin/cocina/stream');
    const recargar = () => cargar();
    es.addEventListener('pedido-nuevo', (ev) => {
      let mesa = null;
      try {
        mesa = JSON.parse(ev.data)?.mesa ?? null;
      } catch {
        // dato no parseable: se ignora el detalle, pero se recarga igual
      }
      setAviso(mesa ? `¡Nuevo pedido de la mesa ${mesa}!` : '¡Ha llegado un pedido nuevo!');
      clearTimeout(avisoTimer.current);
      avisoTimer.current = setTimeout(() => setAviso(null), 6000);
      recargar();
    });
    es.addEventListener('pedido-actualizado', recargar);
    return () => {
      es.close();
      clearTimeout(avisoTimer.current);
    };
  }, [cargar]);

  async function avanzar(pedido, estado) {
    try {
      await api('POST', `/api/admin/cocina/pedidos/${pedido.numeroPedido}/avanzar`, { estado });
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  async function cancelar(pedido) {
    try {
      await api('POST', `/api/admin/cocina/pedidos/${pedido.numeroPedido}/cancelar`);
      await cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <main className="cocina">
      <header className="cocina__cabecera">
        <h1 className="cocina__titulo">Panel de cocina</h1>
      </header>

      {aviso && (
        <p className="cocina__aviso" role="status" aria-live="polite">{aviso}</p>
      )}
      {error && <p role="alert">{error}</p>}

      <section aria-labelledby="cocina-activos">
        <h2 id="cocina-activos" className="cocina__subtitulo">Pedidos del día</h2>
        {activos.length === 0 ? (
          <p>No hay pedidos pendientes.</p>
        ) : (
          <ul className="cocina-lista">
            {activos.map((p) => (
              <PedidoActivo
                key={p.numeroPedido}
                pedido={p}
                ahora={ahora}
                onAvanzar={avanzar}
                onCancelar={cancelar}
              />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="cocina-historico">
        <h2 id="cocina-historico" className="cocina__subtitulo">Histórico del día</h2>
        {historico.length === 0 ? (
          <p>Todavía no hay pedidos servidos ni cancelados hoy.</p>
        ) : (
          <ul className="cocina-lista cocina-lista--historico">
            {historico.map((p) => (
              <li key={p.numeroPedido} className={`cocina-pedido cocina-pedido--${p.estado}`}>
                <header className="cocina-pedido__cabecera">
                  <span className="cocina-pedido__mesa">Mesa {p.mesa}</span>
                  <span className="cocina-pedido__pedido">#{p.numeroPedido}</span>
                  <span className="cocina-pedido__estado">{ETIQUETA_ESTADO[p.estado]}</span>
                </header>
                <Lineas lineas={p.lineas} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default function Cocina() {
  // Se considera con sesión cuando la primera carga de datos responde 200.
  const [autenticado, setAutenticado] = useState(false);
  const [comprobando, setComprobando] = useState(true);

  useEffect(() => {
    let vivo = true;
    fetch('/api/admin/cocina/pedidos')
      .then((r) => {
        if (vivo) setAutenticado(r.ok);
      })
      .catch(() => {})
      .finally(() => vivo && setComprobando(false));
    return () => {
      vivo = false;
    };
  }, []);

  if (comprobando) return <main className="cocina"><p>Cargando…</p></main>;
  if (!autenticado) return <Login onEntrar={() => setAutenticado(true)} />;
  return <Panel />;
}
