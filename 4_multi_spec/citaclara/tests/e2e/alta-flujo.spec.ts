import { expect, test, type Locator, type Page } from '@playwright/test';
import { abrirAgenda, acceder, diaDePruebas, primerTramoLibre } from './apoyo';

/**
 * SC-005 — El alta de una cita válida se completa en 5 interacciones o menos, sin pasos
 * técnicos (US1, FR-020, Principio 7).
 *
 * Se cuenta cada interacción real de la recepción (elegir en un desplegable, escribir la
 * hora, pulsar un botón). Leer la pantalla no cuenta.
 */

/** Contador explícito de interacciones para dejar la cuenta a la vista. */
class ContadorInteracciones {
  private total = 0;

  constructor(private readonly page: Page) {}

  async elegir(selector: string, valor: Parameters<Locator['selectOption']>[0]): Promise<void> {
    await this.page.locator(selector).selectOption(valor);
    this.total += 1;
  }

  async escribir(campo: Locator, valor: string): Promise<void> {
    await campo.fill(valor);
    this.total += 1;
  }

  async pulsar(boton: Locator): Promise<void> {
    await boton.click();
    this.total += 1;
  }

  get cuenta(): number {
    return this.total;
  }
}

test.describe('alta de cita en pocos pasos (US1, SC-005)', () => {
  test('SC-005: crear una cita válida requiere 5 interacciones o menos', async ({ page }, info) => {
    await acceder(page);

    const fecha = diaDePruebas(info, 4);
    await abrirAgenda(page, { fecha });

    // El formulario llega listo: profesional y día ya son los de la agenda abierta.
    const hora = await primerTramoLibre(page);
    const interacciones = new ContadorInteracciones(page);

    await interacciones.elegir('#servicio_id', {
      label: 'Sesión de fisioterapia — 45 min — 40,00 €',
    });
    await interacciones.elegir('#paciente_id', { index: 1 });
    await interacciones.escribir(page.getByLabel('Hora de inicio'), hora);

    const respuestaAlta = page.waitForResponse(
      (respuesta) => respuesta.url().endsWith('/api/citas') && respuesta.request().method() === 'POST',
    );
    await interacciones.pulsar(page.getByRole('button', { name: 'Reservar cita' }));
    const creada = await (await respuestaAlta).json();

    await expect(page.locator('#aviso-exito-cita')).toBeVisible();
    expect(interacciones.cuenta).toBeLessThanOrEqual(5);

    // La cita creada queda visible en la agenda del día, con su hora de fin calculada.
    const filaCreada = page.locator(`li[data-cita="${creada.id}"]`);
    await expect(filaCreada).toBeVisible();
    await expect(filaCreada).toContainText(hora);
    await expect(filaCreada).toContainText('Reservada');
    await expect(filaCreada).toContainText('40,00 €');
  });

  test('FR-020: el formulario no muestra jerga técnica ni pasos de sistema', async ({ page }, info) => {
    await acceder(page);
    await abrirAgenda(page, { fecha: diaDePruebas(info, 6) });

    const formulario = page.locator('form[aria-label="Alta de cita"]');
    const textoFormulario = (await formulario.innerText()).toLowerCase();
    // Palabras completas: "fisioterapia" contiene "api" y no es jerga.
    for (const jerga of ['uuid', 'json', 'api', 'endpoint', 'sql', 'timestamp', 'null', 'token']) {
      expect(textoFormulario).not.toMatch(new RegExp(`\\b${jerga}\\b`));
    }

    // Etiquetas en español de España y sin abreviaturas técnicas.
    await expect(formulario.getByLabel('Profesional')).toBeVisible();
    await expect(formulario.getByLabel('Servicio')).toBeVisible();
    await expect(formulario.getByLabel('Paciente')).toBeVisible();
    await expect(formulario.getByLabel('Hora de inicio')).toBeVisible();
  });

  test('RN1: al intentar un hueco ocupado se avisa en lenguaje claro y la agenda no cambia', async ({
    page,
  }, info) => {
    await acceder(page);
    const fecha = diaDePruebas(info, 8);
    await abrirAgenda(page, { fecha });

    const hora = await primerTramoLibre(page);

    // Primera cita: se acepta.
    await page.locator('#servicio_id').selectOption({ index: 1 });
    await page.locator('#paciente_id').selectOption({ index: 1 });
    await page.getByLabel('Hora de inicio').fill(hora);

    const respuestaAlta = page.waitForResponse(
      (respuesta) => respuesta.url().endsWith('/api/citas') && respuesta.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Reservar cita' }).click();
    const creada = await (await respuestaAlta).json();

    await expect(page.locator('#aviso-exito-cita')).toBeVisible();
    await expect(page.locator(`li[data-cita="${creada.id}"]`)).toBeVisible();
    const citasAntes = await page.locator('li[data-cita]').count();

    // Segunda cita en el mismo hueco con otro paciente: se rechaza por solape.
    await page.locator('#servicio_id').selectOption({ index: 1 });
    await page.locator('#paciente_id').selectOption({ index: 2 });
    await page.getByLabel('Hora de inicio').fill(hora);
    await page.getByRole('button', { name: 'Reservar cita' }).click();

    const aviso = page.locator('#aviso-error-cita');
    await expect(aviso).toBeVisible();
    await expect(aviso).toHaveText(/ya tiene otra cita a esa hora/i);
    await expect(aviso).not.toHaveText(/constraint|gist|sql|exclusion/i);

    // La agenda no cambia: el rechazo no deja rastro.
    await expect(page.locator('li[data-cita]')).toHaveCount(citasAntes);
  });

  test('FR-005a: una hora fuera de los tramos de 5 minutos se rechaza con un mensaje claro', async ({
    page,
  }, info) => {
    await acceder(page);
    await abrirAgenda(page, { fecha: diaDePruebas(info, 10) });

    await page.locator('#servicio_id').selectOption({ index: 1 });
    await page.locator('#paciente_id').selectOption({ index: 1 });
    await page.getByLabel('Hora de inicio').fill('10:07');
    await page.getByRole('button', { name: 'Reservar cita' }).click();

    await expect(page.locator('#aviso-error-cita')).toHaveText(/tramos de 5 minutos/i);
  });
});
