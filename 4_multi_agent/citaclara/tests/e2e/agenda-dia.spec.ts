import { expect, test } from '@playwright/test';
import {
  abrirAgenda,
  acceder,
  citasVisibles,
  diaDePruebas,
  idPorNombre,
  primerTramoLibre,
  profesionalesDelSelector,
  proximoDiaLaborable,
} from './apoyo';

/**
 * US2 — Agenda del día por profesional (FR-015, FR-016, FR-016a, SC-006).
 * Se apoya en la semilla determinista, que genera citas de lunes a viernes.
 */

test.describe('agenda del día (US2, FR-015/016/016a)', () => {
  test.beforeEach(async ({ page }) => {
    await acceder(page);
  });

  test('FR-015: muestra las citas del día con hora, servicio, paciente y estado', async ({
    page,
  }) => {
    await abrirAgenda(page, { fecha: proximoDiaLaborable() });

    const primeraCita = page.locator('li[data-cita]').first();
    await expect(primeraCita).toBeVisible();
    // Horas en formato 24 h (FR-019) y precio al céntimo en es-ES.
    await expect(primeraCita).toHaveText(/\d{2}:\d{2} – \d{2}:\d{2}/);
    await expect(primeraCita).toHaveText(/\d{1,3}(\.\d{3})*,\d{2} €/);
    await expect(primeraCita).toHaveText(/(Reservada|Completada|Cancelada|No asistida)/);
  });

  test('FR-015: las citas aparecen en orden cronológico ascendente', async ({ page }) => {
    await abrirAgenda(page, { fecha: proximoDiaLaborable() });

    const horas = await page
      .locator('li[data-cita] time')
      .evaluateAll((nodos) =>
        nodos
          .filter((_, indice) => indice % 2 === 0)
          .map((nodo) => nodo.textContent?.trim() ?? ''),
      );

    expect(horas.length).toBeGreaterThan(1);
    expect([...horas]).toEqual([...horas].sort((a, b) => a.localeCompare(b)));
  });

  test('FR-016/016a: la franja fija 08:00–21:00 distingue tramos libres y ocupados', async ({
    page,
  }) => {
    await abrirAgenda(page, { fecha: proximoDiaLaborable() });

    await expect(page.getByRole('heading', { name: 'Franja de 08:00 a 21:00' })).toBeVisible();
    await expect(page.locator('li[data-tramo="08:00"]')).toBeVisible();
    await expect(page.locator('li[data-tramo="20:45"]')).toBeVisible();
    await expect(page.locator('li[data-tramo="21:00"]')).toHaveCount(0);

    // Hay tramos de los dos tipos y su estado se indica con texto, no solo con color.
    await expect(page.locator('li[data-ocupado="si"]').first()).toHaveText(/Ocupado/);
    await expect(page.locator('li[data-ocupado="no"]').first()).toHaveText(/Libre/);
  });

  test('FR-016: un tramo ocupado se corresponde con una cita activa', async ({ page }) => {
    await abrirAgenda(page, { fecha: proximoDiaLaborable() });

    const ocupado = page.locator('li[data-ocupado="si"]').first();
    const tramo = await ocupado.getAttribute('data-tramo');
    expect(tramo).toMatch(/^\d{2}:\d{2}$/);

    // Alguna cita activa cubre ese tramo.
    const cubre = await page.locator('li[data-cita]:not([data-estado="cancelada"])').evaluateAll(
      (elementos, tramoBuscado: string) => {
        const aMinutos = (texto: string) => {
          const [h, m] = texto.split(':').map(Number);
          return h * 60 + m;
        };
        const objetivo = aMinutos(tramoBuscado);
        return elementos.some((elemento) => {
          if (elemento.getAttribute('data-estado') === 'no_asistida') return false;
          const horas = [...elemento.querySelectorAll('time')].map(
            (nodo) => nodo.textContent?.trim() ?? '',
          );
          if (horas.length < 2) return false;
          return aMinutos(horas[0]) <= objetivo && objetivo < aMinutos(horas[1]);
        });
      },
      tramo!,
    );
    expect(cubre).toBe(true);
  });

  test('FR-016: no aparecen las citas de otros profesionales', async ({ page }) => {
    const fecha = proximoDiaLaborable();
    const profesionales = await profesionalesDelSelector(page);
    expect(profesionales.length).toBeGreaterThanOrEqual(2);

    await abrirAgenda(page, { fecha, profesionalId: idPorNombre(profesionales, 'María') });
    await expect(page.getByRole('heading', { name: /Citas de María/ })).toBeVisible();
    const citasPrimero = await citasVisibles(page);

    await abrirAgenda(page, { fecha, profesionalId: idPorNombre(profesionales, 'Jorge') });
    await expect(page.getByRole('heading', { name: /Citas de Jorge/ })).toBeVisible();
    const citasSegundo = await citasVisibles(page);

    expect(citasPrimero.length).toBeGreaterThan(0);
    expect(citasSegundo.length).toBeGreaterThan(0);
    // Conjuntos disjuntos: ninguna cita se muestra en las dos agendas.
    expect(citasPrimero.filter((id) => citasSegundo.includes(id))).toEqual([]);
  });

  test('el selector permite cambiar de profesional y de día', async ({ page }, info) => {
    const profesionales = await profesionalesDelSelector(page);
    await abrirAgenda(page, { fecha: proximoDiaLaborable() });

    await page.locator('#profesional').selectOption(idPorNombre(profesionales, 'Lucía'));
    await page.locator('#fecha').fill(diaDePruebas(info));
    await page.getByRole('button', { name: 'Ver agenda' }).click();

    await expect(page.getByRole('heading', { name: /Citas de Lucía/ })).toBeVisible();
    // Un día futuro fuera de la semilla no tiene citas: toda la jornada está libre.
    await expect(page.getByText('Este día no tiene ninguna cita.')).toBeVisible();
    expect(await primerTramoLibre(page)).toBe('08:00');
  });

  test('SC-006: la agenda se lee sin desbordamiento horizontal', async ({ page }) => {
    await abrirAgenda(page, { fecha: proximoDiaLaborable() });

    const desbordamiento = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(desbordamiento).toBeLessThanOrEqual(1);
  });
});
