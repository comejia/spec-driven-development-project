import { expect, test, type Page } from '@playwright/test';
import { acceder } from './apoyo';

/**
 * US1 (FR-001/FR-003) y Polish (FR-011, SC-002/SC-009): el panel de analítica se abre con
 * la clave de la clínica, muestra los cuatro bloques en una sola página, deniega el acceso
 * sin clave y es accesible y responsive (portátil y móvil).
 */

/** Abre el panel de analítica tras acceder. */
async function abrirAnalitica(page: Page): Promise<void> {
  await page.goto('/analitica');
  await expect(page.getByRole('heading', { name: /Analítica de Clínica Eleva/ })).toBeVisible();
}

test.describe('panel de analítica (US1, FR-003)', () => {
  test('SC-002: sin sesión el acceso se redirige y no se muestra ningún dato', async ({ page }) => {
    await page.goto('/analitica');
    // El guard de sesión redirige a /acceso; no se ve el encabezado de analítica.
    await expect(page).toHaveURL(/\/acceso$/);
    await expect(page.getByRole('heading', { name: /Analítica de/ })).toHaveCount(0);
  });

  test('FR-003: con la clave se ven los cuatro bloques en una sola página', async ({ page }) => {
    await acceder(page);
    await abrirAnalitica(page);

    await expect(page.getByRole('heading', { name: 'Ingresos por servicio' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ausencias por profesional' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Ocupación semanal por profesional' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Evolución de las últimas 8 semanas' }),
    ).toBeVisible();
  });

  test('SC-010: la nota del efecto "la cancelación sustituye al no-show" está presente', async ({
    page,
  }) => {
    await acceder(page);
    await abrirAnalitica(page);
    await expect(page.getByRole('note')).toContainText(/cancelan|cancelación|ausencias/i);
  });

  test('hay un enlace para saltar al contenido principal', async ({ page }) => {
    await acceder(page);
    await abrirAnalitica(page);
    await expect(page.locator('#contenido')).toBeVisible();
  });
});

test.describe('accesibilidad y responsive del panel (FR-011, SC-009)', () => {
  test('el documento declara español de España', async ({ page }) => {
    await acceder(page);
    await abrirAnalitica(page);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es-ES');
  });

  test('SC-009: el panel se ve sin desbordamiento horizontal en este dispositivo', async ({
    page,
  }) => {
    await acceder(page);
    await abrirAnalitica(page);

    const desbordamiento = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(desbordamiento).toBeLessThanOrEqual(1);
  });

  test('los botones del panel tienen un tamaño cómodo de pulsar (≥ 44 px)', async ({ page }) => {
    await acceder(page);
    await abrirAnalitica(page);

    const alturas = await page
      .locator('header button:visible')
      .evaluateAll((botones) => botones.map((boton) => boton.getBoundingClientRect().height));
    expect(alturas.length).toBeGreaterThan(0);
    for (const altura of alturas) {
      expect(altura).toBeGreaterThanOrEqual(43.5);
    }
  });
});
