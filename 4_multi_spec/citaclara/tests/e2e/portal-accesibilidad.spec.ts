import { expect, test } from '@playwright/test';
import { prepararDatosPortal, type DatosPortal } from './portal-apoyo';

/**
 * T030 [Pulido] — E2E accesibilidad y responsive (quickstart V4; FR-018, SC-005, SC-007).
 *
 * Verifica landmarks/encabezados accesibles y que la vista es usable en el viewport de cada
 * proyecto (móvil y escritorio, definidos en playwright.config.ts). Comprueba también el
 * acceso denegado neutro sin fuga de datos.
 */

let datos: DatosPortal;

test.beforeAll(async () => {
  datos = await prepararDatosPortal();
});

test.describe('portal — accesibilidad y responsive (T030)', () => {
  test('la vista tiene un encabezado principal y regiones con título', async ({ page }) => {
    await page.goto(`/p/${datos.tokenCancelable}`);

    // Un solo h1 con el saludo.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Regiones "Próximas citas" e "Historial" como encabezados de sección (h2).
    await expect(page.getByRole('heading', { level: 2, name: /Próximas citas/ })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: /Historial/ })).toBeVisible();

    // El contenido principal cabe en el ancho del viewport (sin scroll horizontal).
    const anchoScroll = await page.evaluate(() => document.documentElement.scrollWidth);
    const anchoVisible = await page.evaluate(() => window.innerWidth);
    expect(anchoScroll).toBeLessThanOrEqual(anchoVisible + 1);
  });

  test('acceso denegado neutro: no muestra citas ni datos personales', async ({ page }) => {
    const tokenFalso = 'dev-00000000-0000-4000-8000-000000000000';
    await page.goto(`/p/${tokenFalso}`);

    await expect(
      page.getByRole('heading', { name: /No hemos podido abrir este enlace/ }),
    ).toBeVisible();

    // SC-005: no se muestra ninguna cita ni las secciones de la vista del paciente.
    await expect(page.getByRole('heading', { level: 2, name: /Próximas citas/ })).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 2, name: /Historial/ })).toHaveCount(0);
    await expect(page.getByText(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/)).toHaveCount(0);
  });
});
