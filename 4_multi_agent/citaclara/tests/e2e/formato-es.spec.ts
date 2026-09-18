import { expect, test } from '@playwright/test';
import { abrirAgenda, acceder, proximoDiaLaborable } from './apoyo';

/**
 * FR-019 y SC-004: los importes se muestran cuadrados al céntimo en formato español y
 * las fechas y horas de forma inequívoca para una clínica española (24 h, dd/MM/aaaa).
 */

/** "40,00 €" o "1.234,56 €": coma decimal, punto de millar y símbolo al final. */
const IMPORTE_ES = /^\d{1,3}(\.\d{3})*,\d{2} €$/;

test.describe('exactitud de presentación en es-ES (FR-019, SC-004)', () => {
  test.beforeEach(async ({ page }) => {
    await acceder(page);
    await abrirAgenda(page, { fecha: proximoDiaLaborable() });
  });

  test('FR-019: todos los importes visibles usan el formato español al céntimo', async ({
    page,
  }) => {
    const importes = await page
      .locator('li[data-cita]')
      .evaluateAll((filas) =>
        filas.flatMap((fila) => (fila.textContent ?? '').match(/[\d.]+,\d{2}\s?€/g) ?? []),
      );

    expect(importes.length).toBeGreaterThan(0);
    for (const importe of importes) {
      expect(importe.replace(/\u00a0/g, ' ')).toMatch(IMPORTE_ES);
    }
  });

  test('FR-019: el catálogo del formulario muestra los precios de la spec', async ({ page }) => {
    const opciones = await page
      .locator('#servicio_id option')
      .evaluateAll((nodos) => nodos.map((nodo) => (nodo.textContent ?? '').replace(/\u00a0/g, ' ')));

    expect(opciones).toContain('Sesión de fisioterapia — 45 min — 40,00 €');
    expect(opciones).toContain('Primera visita de fisioterapia — 60 min — 50,00 €');
    expect(opciones).toContain('Consulta de nutrición — 30 min — 35,00 €');
    expect(opciones).toContain('Primera visita de nutrición — 45 min — 45,00 €');
  });

  test('FR-019: no aparecen importes con punto decimal ni con el símbolo delante', async ({
    page,
  }) => {
    const texto = (await page.locator('main').innerText()).replace(/\u00a0/g, ' ');
    expect(texto).not.toMatch(/€\s?\d/);
    expect(texto).not.toMatch(/\d+\.\d{2}\s?€/);
  });

  test('FR-019: las horas se muestran en formato de 24 horas, sin am/pm', async ({ page }) => {
    const horas = await page
      .locator('li[data-cita] time')
      .evaluateAll((nodos) => nodos.map((nodo) => (nodo.textContent ?? '').trim()));

    expect(horas.length).toBeGreaterThan(0);
    for (const hora of horas) {
      expect(hora).toMatch(/^([01]\d|2[0-3]):[0-5]\d$/);
    }

    const texto = await page.locator('main').innerText();
    expect(texto.toLowerCase()).not.toMatch(/\b(a\.?m\.?|p\.?m\.?)\b/);
  });

  test('FR-019: la fecha del día se muestra como dd/mm/aaaa', async ({ page }) => {
    await expect(page.getByText(/Se muestran \d{2}\/\d{2}\/\d{4}/)).toBeVisible();
  });

  test('FR-019: cada cita expone su hora en un formato legible por máquinas', async ({ page }) => {
    const marcas = await page
      .locator('li[data-cita] time')
      .evaluateAll((nodos) => nodos.map((nodo) => nodo.getAttribute('datetime') ?? ''));

    expect(marcas.length).toBeGreaterThan(0);
    for (const marca of marcas) {
      expect(Number.isNaN(Date.parse(marca))).toBe(false);
    }
  });

  test('Principio 8: la interfaz está en español de España', async ({ page }) => {
    const texto = await page.locator('main').innerText();
    for (const palabra of ['Profesional', 'Servicio', 'Paciente', 'Hora de inicio', 'Libre']) {
      expect(texto).toContain(palabra);
    }
    // Sin restos en inglés en la interfaz de recepción.
    for (const ingles of ['Submit', 'Cancel', 'Save', 'Loading', 'Error:']) {
      expect(texto).not.toContain(ingles);
    }
  });
});
