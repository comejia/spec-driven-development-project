import { expect, test } from '@playwright/test';
import { crearPacienteConToken } from './apoyo';

/**
 * US1/US2/US3 — Portal del paciente por enlace personal `/p/[token]` (005).
 *
 * Cubre: listado de citas, cancelación dentro de plazo, bloqueo dentro de la ventana con
 * teléfono de la clínica, y denegación neutra de un token inválido. Los datos se crean de
 * forma autónoma en la BD (apoyo.crearPacienteConToken), sin depender de la semilla.
 */

const HORA_MS = 60 * 60 * 1000;

test.describe('portal del paciente (/p/[token])', () => {
  test('un token válido lista las citas del paciente (US1, FR-001/003)', async ({ page }) => {
    const { token } = await crearPacienteConToken([
      { margenMs: 25 * HORA_MS },
      { margenMs: 72 * HORA_MS },
    ]);

    await page.goto(`/p/${token}`);
    await expect(page.getByRole('heading', { name: 'Tus citas' })).toBeVisible();
    await expect(page.getByText(/Reservada/).first()).toBeVisible();
  });

  test('cancela una cita con ≥ 24 h desde el enlace (US2, FR-010)', async ({ page }) => {
    const { token } = await crearPacienteConToken([{ margenMs: 25 * HORA_MS }]);

    await page.goto(`/p/${token}`);
    await page.getByRole('button', { name: 'Cancelar esta cita' }).click();
    await page.getByRole('button', { name: 'Sí, cancelar la cita' }).click();

    // Tras cancelar, la cita aparece como Cancelada y ya no ofrece cancelar.
    await expect(page.getByText('Cancelada').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancelar esta cita' })).toHaveCount(0);
  });

  test('dentro de la ventana (< 24 h) no ofrece cancelar y muestra el teléfono (US3, FR-008)', async ({
    page,
  }) => {
    const { token } = await crearPacienteConToken([{ margenMs: 23 * HORA_MS }]);

    await page.goto(`/p/${token}`);
    await expect(page.getByRole('button', { name: 'Cancelar esta cita' })).toHaveCount(0);
    await expect(page.getByText(/menos de 24 horas/i)).toBeVisible();
    await expect(page.getByText(/Tel\./i).first()).toBeVisible();
  });

  test('un token inválido muestra una vista neutra sin filtrar datos (FR-002)', async ({
    page,
  }) => {
    await page.goto('/p/token-que-no-existe-pero-con-forma-valida-aaaa');
    await expect(page.getByRole('heading', { name: 'Enlace no válido' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tus citas' })).toHaveCount(0);
  });
});
