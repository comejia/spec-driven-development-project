import { expect, type Page, type TestInfo } from '@playwright/test';

/** Apoyo común de las pruebas e2e (US1–US4). */

export const CLAVE_CLINICA = process.env.SEED_CLAVE_CLINICA ?? 'eleva2026';

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
