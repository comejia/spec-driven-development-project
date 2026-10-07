import { expect, test } from '@playwright/test';
import { prepararDatosPortal, type DatosPortal } from './portal-apoyo';

/**
 * T028 [Pulido] — E2E ver citas (quickstart V1; FR-005..FR-008, SC-001).
 *
 * Abre `/p/<token>` de un paciente de la semilla y comprueba los dos grupos, el formato ES
 * y que no se muestran datos de otro paciente.
 */

let datos: DatosPortal;

test.beforeAll(async () => {
  datos = await prepararDatosPortal();
});

test.describe('portal — ver citas (T028, US1)', () => {
  test('muestra "Próximas citas" e "Historial" con formato ES', async ({ page }) => {
    await page.goto(`/p/${datos.tokenCancelable}`);

    await expect(page.getByRole('heading', { name: /Próximas citas/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Historial/ })).toBeVisible();

    // Al menos una fecha en formato ES "dd/MM/yyyy HH:mm".
    await expect(page.getByText(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/).first()).toBeVisible();
  });

  test('un token inválido no muestra ninguna cita (acceso denegado)', async ({ page }) => {
    await page.goto('/p/token-invalido-e2e');
    await expect(page.getByRole('heading', { name: /No hemos podido abrir este enlace/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Próximas citas/ })).toHaveCount(0);
  });
});
