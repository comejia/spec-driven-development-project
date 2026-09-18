import { expect, test } from '@playwright/test';
import { acceder, CLAVE_CLINICA } from './apoyo';

/**
 * US4 — Acceso con la clave de la clínica (FR-018).
 * Sin clave correcta no se ve ninguna agenda.
 */

test.describe('acceso al panel (US4, FR-018)', () => {
  test('con la clave correcta se concede el acceso a la agenda', async ({ page }) => {
    await acceder(page);
    await expect(page).toHaveURL(/\/agenda/);
    await expect(page.getByRole('button', { name: 'Salir' })).toBeVisible();
  });

  test('con la clave incorrecta se deniega el acceso y no se ve ninguna agenda', async ({
    page,
  }) => {
    await page.goto('/acceso');
    await page.getByLabel('Clave de la clínica').fill('clave-que-no-es');
    await page.getByRole('button', { name: 'Entrar' }).click();

    const aviso = page.locator('#error-acceso');
    await expect(aviso).toBeVisible();
    await expect(aviso).toHaveText(/clave no es correcta/i);
    await expect(page).toHaveURL(/\/acceso/);
    await expect(page.getByRole('heading', { name: /Citas de / })).toHaveCount(0);
  });

  test('la clave es obligatoria: el formulario no se envía vacío', async ({ page }) => {
    await page.goto('/acceso');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/acceso/);
    await expect(page.getByRole('heading', { name: /Citas de / })).toHaveCount(0);
  });

  test('sin sesión, entrar en la agenda redirige a la pantalla de acceso', async ({ page }) => {
    await page.goto('/agenda');
    await expect(page).toHaveURL(/\/acceso/);
    await expect(page.getByLabel('Clave de la clínica')).toBeVisible();
  });

  test('la raíz lleva a la agenda o al acceso según la sesión', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/acceso/);

    await acceder(page);
    await page.goto('/');
    await expect(page).toHaveURL(/\/agenda/);
  });

  test('al salir se cierra la sesión y la agenda deja de ser accesible', async ({ page }) => {
    await acceder(page);
    await page.getByRole('button', { name: 'Salir' }).click();
    await expect(page).toHaveURL(/\/acceso/);

    await page.goto('/agenda');
    await expect(page).toHaveURL(/\/acceso/);
  });

  test('la clave no queda visible en la página ni en el almacenamiento del navegador', async ({
    page,
  }) => {
    await acceder(page);

    const contenido = await page.content();
    expect(contenido).not.toContain(CLAVE_CLINICA);

    const almacenado = await page.evaluate(() => ({
      local: JSON.stringify(window.localStorage),
      sesion: JSON.stringify(window.sessionStorage),
      cookies: document.cookie,
    }));
    expect(almacenado.local).not.toContain(CLAVE_CLINICA);
    expect(almacenado.sesion).not.toContain(CLAVE_CLINICA);
    // La cookie de sesión es HTTP-only: no es legible desde JavaScript.
    expect(almacenado.cookies).not.toContain('citaclara_sesion');
  });
});
