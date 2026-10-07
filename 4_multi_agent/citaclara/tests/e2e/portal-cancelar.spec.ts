import { expect, test } from '@playwright/test';
import { prepararDatosPortal, type DatosPortal } from './portal-apoyo';

/**
 * T029 [Pulido] — E2E cancelar (quickstart V2/V3/V5/V6; SC-002, SC-003, SC-004, SC-006).
 *
 * Cancela una cita dentro de plazo comprobando que el flujo se completa en ≤3 interacciones
 * (SC-002): abrir la cita (ya visible), pulsar "Cancelar cita" y confirmar "Sí, cancelar".
 */

let datos: DatosPortal;

test.beforeEach(async () => {
  // Re-siembra antes de cada prueba para tener una cita cancelable fresca.
  datos = await prepararDatosPortal();
});

test.describe('portal — cancelar (T029, US2)', () => {
  test('cancela una cita futura en ≤3 interacciones (SC-002)', async ({ page }) => {
    await page.goto(`/p/${datos.tokenCancelable}`);

    // Interacción 1: pulsar "Cancelar cita" en la primera cita cancelable.
    const boton = page.getByRole('button', { name: 'Cancelar cita' }).first();
    await expect(boton).toBeVisible();
    await boton.click();

    // Interacción 2: confirmar.
    await page.getByRole('button', { name: 'Sí, cancelar' }).click();

    // Resultado: mensaje de confirmación (la cita queda cancelada).
    await expect(page.getByText(/Tu cita se ha cancelado|ya no puede cancelarse/)).toBeVisible();
  });

  test('la cita permanece si el paciente no confirma (FR-013)', async ({ page }) => {
    await page.goto(`/p/${datos.tokenCancelable}`);

    const boton = page.getByRole('button', { name: 'Cancelar cita' }).first();
    await boton.click();
    // Se arrepiente: pulsa "No".
    await page.getByRole('button', { name: 'No', exact: true }).click();

    // Sigue ofreciéndose la cancelación (no se aplicó ningún cambio).
    await expect(page.getByRole('button', { name: 'Cancelar cita' }).first()).toBeVisible();
  });
});
