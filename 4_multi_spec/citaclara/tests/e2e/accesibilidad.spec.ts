import { expect, test, type Page } from '@playwright/test';
import { abrirAgenda, acceder, proximoDiaLaborable } from './apoyo';

/**
 * Principio 7 y SC-005/006/008: la interfaz debe ser usable sin formación, con contraste
 * y tamaños accesibles, y funcionar tanto en el portátil de recepción como en el móvil.
 */

/** Convierte cualquier color CSS a sRGB usando el propio navegador. */
async function aRgb(page: Page, color: string): Promise<[number, number, number]> {
  return page.evaluate((valor) => {
    const lienzo = document.createElement('canvas');
    lienzo.width = 1;
    lienzo.height = 1;
    const contexto = lienzo.getContext('2d')!;
    contexto.fillStyle = valor;
    contexto.fillRect(0, 0, 1, 1);
    const [r, g, b] = contexto.getImageData(0, 0, 1, 1).data;
    return [r, g, b] as [number, number, number];
  }, color);
}

function luminancia([r, g, b]: [number, number, number]): number {
  const canal = (valor: number) => {
    const proporcion = valor / 255;
    return proporcion <= 0.03928 ? proporcion / 12.92 : ((proporcion + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

function contraste(a: [number, number, number], b: [number, number, number]): number {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (oscuro + 0.05);
}

test.describe('accesibilidad y diseño responsive (Principio 7, SC-005/006/008)', () => {
  test('el documento declara español de España', async ({ page }) => {
    await page.goto('/acceso');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es-ES');
  });

  test('SC-008: el texto principal y el botón primario cumplen el contraste AA', async ({
    page,
  }) => {
    await acceder(page);

    const paresDeColor = await page.evaluate(() => {
      const estilo = getComputedStyle(document.documentElement);
      const leer = (token: string) => estilo.getPropertyValue(token).trim();
      return {
        texto: leer('--color-texto'),
        fondo: leer('--color-fondo'),
        primario: leer('--color-primario'),
        primarioTexto: leer('--color-primario-texto'),
        textoSuave: leer('--color-texto-suave'),
        superficie: leer('--color-superficie'),
      };
    });

    const contrasteTexto = contraste(
      await aRgb(page, paresDeColor.texto),
      await aRgb(page, paresDeColor.fondo),
    );
    const contrasteBoton = contraste(
      await aRgb(page, paresDeColor.primarioTexto),
      await aRgb(page, paresDeColor.primario),
    );
    const contrasteSuave = contraste(
      await aRgb(page, paresDeColor.textoSuave),
      await aRgb(page, paresDeColor.superficie),
    );

    expect(contrasteTexto).toBeGreaterThanOrEqual(4.5);
    expect(contrasteBoton).toBeGreaterThanOrEqual(4.5);
    expect(contrasteSuave).toBeGreaterThanOrEqual(4.5);
  });

  test('los tramos libres y ocupados se distinguen también por texto, no solo por color', async ({
    page,
  }) => {
    await acceder(page);
    await abrirAgenda(page, { fecha: proximoDiaLaborable() });

    await expect(page.locator('li[data-ocupado="si"]').first()).toContainText('Ocupado');
    await expect(page.locator('li[data-ocupado="no"]').first()).toContainText('Libre');
  });

  test('todos los campos de formulario tienen etiqueta asociada', async ({ page }) => {
    await acceder(page);
    await abrirAgenda(page, { fecha: proximoDiaLaborable() });

    const sinEtiqueta = await page.evaluate(() => {
      const campos = [...document.querySelectorAll('input, select, textarea')];
      return campos
        .filter((campo) => {
          const elemento = campo as HTMLInputElement;
          if (elemento.type === 'hidden') return false;
          if (elemento.getAttribute('aria-label')) return false;
          if (elemento.getAttribute('aria-labelledby')) return false;
          return !elemento.id || !document.querySelector(`label[for="${elemento.id}"]`);
        })
        .map((campo) => (campo as HTMLElement).outerHTML.slice(0, 80));
    });

    expect(sinEtiqueta).toEqual([]);
  });

  test('SC-005: los botones tienen un tamaño cómodo de pulsar (≥ 44 px de alto)', async ({
    page,
  }) => {
    await acceder(page);
    await abrirAgenda(page, { fecha: proximoDiaLaborable() });

    // Solo la interfaz del producto: el indicador de desarrollo de Next.js no forma parte.
    const alturas = await page
      .locator('header button:visible, main button:visible')
      .evaluateAll((botones) => botones.map((boton) => boton.getBoundingClientRect().height));

    expect(alturas.length).toBeGreaterThan(0);
    for (const altura of alturas) {
      expect(altura).toBeGreaterThanOrEqual(43.5);
    }
  });

  test('la navegación por teclado alcanza el formulario de alta', async ({ page }) => {
    await acceder(page);
    await abrirAgenda(page, { fecha: proximoDiaLaborable() });

    await page.locator('#servicio_id').focus();
    await expect(page.locator('#servicio_id')).toBeFocused();

    // El foco es visible: hay contorno declarado para :focus-visible.
    const contorno = await page.locator('#servicio_id').evaluate((elemento) => {
      elemento.focus();
      return getComputedStyle(elemento).outlineStyle;
    });
    expect(contorno).not.toBe('none');
  });

  test('SC-006: la agenda se ve sin desbordamiento horizontal en este dispositivo', async ({
    page,
  }) => {
    await acceder(page);
    await abrirAgenda(page, { fecha: proximoDiaLaborable() });

    const desbordamiento = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(desbordamiento).toBeLessThanOrEqual(1);
  });

  test('la pantalla de acceso también se adapta al dispositivo', async ({ page }) => {
    await page.goto('/acceso');

    const desbordamiento = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(desbordamiento).toBeLessThanOrEqual(1);
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  });

  test('hay un enlace para saltar al contenido principal', async ({ page }) => {
    await acceder(page);
    await expect(page.getByRole('link', { name: 'Saltar al contenido' })).toHaveAttribute(
      'href',
      '#contenido',
    );
    await expect(page.locator('#contenido')).toBeVisible();
  });
});
