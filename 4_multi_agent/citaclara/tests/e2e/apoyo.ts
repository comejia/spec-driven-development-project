import { expect, type Page, type TestInfo } from '@playwright/test';
import { Pool } from 'pg';

/** Apoyo común de las pruebas e2e (US1–US4). */

export const CLAVE_CLINICA = process.env.SEED_CLAVE_CLINICA ?? 'eleva2026';

/** Cadena de conexión que usa también la aplicación bajo prueba. */
const URL_BD =
  process.env.DATABASE_URL ?? 'postgresql://citaclara:citaclara@localhost:5433/citaclara';

export interface CitaSemillaPaciente {
  /** Milisegundos desde "ahora" hasta el inicio de la cita (negativo = pasada). */
  margenMs: number;
  estado?: 'reservada' | 'completada' | 'cancelada' | 'no_asistida';
}

export interface PacienteConToken {
  token: string;
  citas: { id: string; inicio: string }[];
}

/**
 * Crea, con una conexión directa (la misma BD que sirve la app), un paciente nuevo con un
 * token opaco y las citas indicadas (relativas a "ahora"). Devuelve el token y las citas.
 * Es autónomo: no depende del contenido de la semilla, lo que hace el e2e determinista.
 */
export async function crearPacienteConToken(
  citas: CitaSemillaPaciente[],
  etiqueta = `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
): Promise<PacienteConToken> {
  const pool = new Pool({ connectionString: URL_BD, max: 1 });
  try {
    const { rows: clinicas } = await pool.query<{ id: string }>(
      'SELECT id FROM clinica ORDER BY nombre LIMIT 1',
    );
    const clinicaId = clinicas[0]?.id;
    if (!clinicaId) throw new Error('No hay clínica sembrada para el e2e.');

    // Profesional y servicio DEDICADOS para este paciente: así las citas de prueba nunca
    // solapan con la agenda de la semilla (invariante anti-solape de 001).
    const { rows: profs } = await pool.query<{ id: string }>(
      `INSERT INTO profesional (clinica_id, nombre, especialidad)
       VALUES ($1, $2, $3) RETURNING id`,
      [clinicaId, `Prof ${etiqueta}`, 'Fisioterapia'],
    );
    const { rows: servs } = await pool.query<{ id: string; duracion_min: number }>(
      `INSERT INTO servicio (clinica_id, nombre, duracion_min, precio_centimos)
       VALUES ($1, $2, $3, $4) RETURNING id, duracion_min`,
      [clinicaId, `Servicio ${etiqueta}`, 30, 4000],
    );
    const profesionalId = profs[0]!.id;
    const servicioId = servs[0]!.id;
    const duracion = servs[0]!.duracion_min;

    const { rows: pac } = await pool.query<{ id: string }>(
      `INSERT INTO paciente (clinica_id, nombre, telefono, email)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [clinicaId, `Paciente ${etiqueta}`, `+34${Math.floor(600000000 + Math.random() * 99999999)}`, null],
    );
    const pacienteId = pac[0]!.id;

    const base = `e2e${etiqueta}`.replace(/[^A-Za-z0-9]/g, '');
    const token = `${base}${'A'.repeat(48)}`.slice(0, 48);
    await pool.query('INSERT INTO acceso_paciente (paciente_id, token) VALUES ($1, $2)', [
      pacienteId,
      token,
    ]);

    const creadas: { id: string; inicio: string }[] = [];
    for (const c of citas) {
      // Instante alineado a 5 minutos (FR-005a).
      const bruto = Date.now() + c.margenMs;
      const inicio = new Date(Math.round(bruto / 300000) * 300000);
      const fin = new Date(inicio.getTime() + duracion * 60000);
      const { rows } = await pool.query<{ id: string }>(
        `INSERT INTO cita (clinica_id, profesional_id, servicio_id, paciente_id, inicio, fin, estado)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [clinicaId, profesionalId, servicioId, pacienteId, inicio, fin, c.estado ?? 'reservada'],
      );
      creadas.push({ id: rows[0]!.id, inicio: inicio.toISOString() });
    }

    return { token, citas: creadas };
  } finally {
    await pool.end();
  }
}

/** Accede al panel con la clave de la clínica (FR-018). */
export async function acceder(page: Page): Promise<void> {
  await page.goto('/acceso');
  await page.getByLabel('Clave de la clínica').fill(CLAVE_CLINICA);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: /Agenda de Clínica Eleva/ })).toBeVisible();
}

function aFechaIso(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

/**
 * Día futuro sin citas de la semilla (que solo cubre 8 semanas atrás y 2 adelante).
 * Cada proyecto de Playwright usa un día distinto para no competir por los huecos.
 */
export function diaDePruebas(info: TestInfo, desplazamiento = 0): string {
  const porProyecto = info.project.name === 'movil' ? 1 : 0;
  const fecha = new Date();
  fecha.setUTCDate(fecha.getUTCDate() + 120 + porProyecto * 2 + desplazamiento);
  return aFechaIso(fecha);
}

/** Próximo día laborable (la semilla genera citas de lunes a viernes). */
export function proximoDiaLaborable(desplazamientoDias = 1): string {
  const fecha = new Date();
  fecha.setUTCDate(fecha.getUTCDate() + desplazamientoDias);
  while (fecha.getUTCDay() === 0 || fecha.getUTCDay() === 6) {
    fecha.setUTCDate(fecha.getUTCDate() + 1);
  }
  return aFechaIso(fecha);
}

/** Abre la agenda de un profesional (por posición en el selector) y un día concreto. */
export async function abrirAgenda(
  page: Page,
  opciones: { fecha: string; profesionalId?: string },
): Promise<void> {
  const url = new URL('/agenda', 'http://localhost');
  url.searchParams.set('fecha', opciones.fecha);
  if (opciones.profesionalId) url.searchParams.set('profesional', opciones.profesionalId);
  await page.goto(`${url.pathname}${url.search}`);
  await expect(page.getByRole('heading', { name: /Citas de / })).toBeVisible();
}

/** Identificadores de los profesionales tal y como los ofrece el selector. */
export async function profesionalesDelSelector(
  page: Page,
): Promise<{ id: string; nombre: string }[]> {
  return page.locator('#profesional option').evaluateAll((opciones) =>
    opciones.map((opcion) => ({
      id: (opcion as HTMLOptionElement).value,
      nombre: (opcion as HTMLOptionElement).textContent?.trim() ?? '',
    })),
  );
}

/** Identificador del profesional cuyo nombre empieza por el texto indicado. */
export function idPorNombre(
  profesionales: { id: string; nombre: string }[],
  nombre: string,
): string {
  const encontrado = profesionales.find((unProfesional) => unProfesional.nombre.startsWith(nombre));
  if (!encontrado) throw new Error(`No hay ningún profesional llamado ${nombre} en el selector.`);
  return encontrado.id;
}

/** Primer tramo marcado como libre en la franja visible. */
export async function primerTramoLibre(page: Page): Promise<string> {
  const tramo = page.locator('li[data-ocupado="no"]').first();
  await expect(tramo).toBeVisible();
  return (await tramo.getAttribute('data-tramo')) ?? '08:00';
}

/** Identificadores de las citas que la agenda está mostrando. */
export async function citasVisibles(page: Page): Promise<string[]> {
  return page
    .locator('li[data-cita]')
    .evaluateAll((elementos) => elementos.map((el) => el.getAttribute('data-cita') ?? ''));
}
