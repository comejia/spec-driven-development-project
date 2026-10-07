import { expect, test } from '@playwright/test';
import { abrirAgenda, acceder, diaDePruebas, primerTramoLibre } from './apoyo';

/**
 * US3 — Marcar el estado de la cita desde la agenda (FR-008, FR-009, FR-017).
 * Cada acción pide una confirmación clara antes de aplicarse (Principio 7).
 */

/** Crea una cita en un hueco libre del día indicado y devuelve su identificador. */
async function crearCitaEnAgenda(page: import('@playwright/test').Page): Promise<string> {
  const hora = await primerTramoLibre(page);
  await page.locator('#servicio_id').selectOption({ index: 1 });
  await page.locator('#paciente_id').selectOption({ index: 1 });
  await page.getByLabel('Hora de inicio').fill(hora);

  const respuesta = page.waitForResponse(
    (r) => r.url().endsWith('/api/citas') && r.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Reservar cita' }).click();
  const creada = await (await respuesta).json();

  await expect(page.locator(`li[data-cita="${creada.id}"]`)).toBeVisible();
  return creada.id as string;
}

test.describe('estados de la cita desde la agenda (US3, FR-017)', () => {
  test('FR-017: marcar una cita como completada pide confirmación y actualiza el estado', async ({
    page,
  }, info) => {
    await acceder(page);
    await abrirAgenda(page, { fecha: diaDePruebas(info, 12) });

    const citaId = await crearCitaEnAgenda(page);
    const fila = page.locator(`li[data-cita="${citaId}"]`);

    await fila.getByRole('button', { name: /Marcar completada/ }).click();
    await expect(page.getByText(/¿Confirmas «Marcar completada»/)).toBeVisible();

    await page.getByRole('button', { name: 'Sí, confirmar' }).click();
    await expect(fila).toHaveAttribute('data-estado', 'completada');
    await expect(fila).toContainText('Completada');
  });

  test('la confirmación se puede descartar sin cambiar nada', async ({ page }, info) => {
    await acceder(page);
    await abrirAgenda(page, { fecha: diaDePruebas(info, 14) });

    const citaId = await crearCitaEnAgenda(page);
    const fila = page.locator(`li[data-cita="${citaId}"]`);

    await fila.getByRole('button', { name: /Cancelar cita/ }).click();
    await page.getByRole('button', { name: 'No, volver' }).click();

    await expect(fila).toHaveAttribute('data-estado', 'reservada');
    await expect(fila.getByRole('button', { name: /Cancelar cita/ })).toBeVisible();
  });

  test('FR-009: se puede marcar que el paciente no ha asistido', async ({ page }, info) => {
    await acceder(page);
    await abrirAgenda(page, { fecha: diaDePruebas(info, 16) });

    const citaId = await crearCitaEnAgenda(page);
    const fila = page.locator(`li[data-cita="${citaId}"]`);

    await fila.getByRole('button', { name: /No ha asistido/ }).click();
    await page.getByRole('button', { name: 'Sí, confirmar' }).click();

    await expect(fila).toHaveAttribute('data-estado', 'no_asistida');
    await expect(fila).toContainText('No asistida');
  });

  test('FR-008: una cita en estado final ya no ofrece acciones de estado', async ({ page }, info) => {
    await acceder(page);
    await abrirAgenda(page, { fecha: diaDePruebas(info, 18) });

    const citaId = await crearCitaEnAgenda(page);
    const fila = page.locator(`li[data-cita="${citaId}"]`);

    await fila.getByRole('button', { name: /Cancelar cita/ }).click();
    await page.getByRole('button', { name: 'Sí, confirmar' }).click();
    await expect(fila).toHaveAttribute('data-estado', 'cancelada');

    await expect(fila.getByRole('button')).toHaveCount(0);
  });

  test('FR-010: al cancelar, su tramo vuelve a estar libre y admite otra cita', async ({
    page,
  }, info) => {
    await acceder(page);
    await abrirAgenda(page, { fecha: diaDePruebas(info, 20) });

    const hora = await primerTramoLibre(page);
    const citaId = await crearCitaEnAgenda(page);
    const fila = page.locator(`li[data-cita="${citaId}"]`);

    // Con la cita reservada, su tramo está ocupado.
    await expect(page.locator(`li[data-tramo="${hora}"]`)).toHaveAttribute('data-ocupado', 'si');

    await fila.getByRole('button', { name: /Cancelar cita/ }).click();
    await page.getByRole('button', { name: 'Sí, confirmar' }).click();
    await expect(fila).toHaveAttribute('data-estado', 'cancelada');

    // Al liberarse, el tramo vuelve a mostrarse libre y se puede volver a reservar.
    await expect(page.locator(`li[data-tramo="${hora}"]`)).toHaveAttribute('data-ocupado', 'no');

    await page.locator('#servicio_id').selectOption({ index: 1 });
    await page.locator('#paciente_id').selectOption({ index: 2 });
    await page.getByLabel('Hora de inicio').fill(hora);
    await page.getByRole('button', { name: 'Reservar cita' }).click();

    await expect(page.locator('#aviso-exito-cita')).toBeVisible();
  });
});
