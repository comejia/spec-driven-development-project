import { describe, expect, it } from 'vitest';
import { BYTES_TOKEN, generarToken, pareceToken } from '@/src/domain/token';

/**
 * Token opaco de acceso del paciente (005 FR-001, research D2).
 */

describe('generarToken', () => {
  it('genera tokens con la forma esperada (base64url, sin =, + ni /)', () => {
    const token = generarToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(token).not.toContain('=');
    expect(token).not.toContain('+');
    expect(token).not.toContain('/');
  });

  it('codifica al menos 128 bits de entropía (32 bytes → 43 caracteres base64url)', () => {
    expect(BYTES_TOKEN).toBeGreaterThanOrEqual(16);
    // 32 bytes en base64url sin relleno son 43 caracteres.
    expect(generarToken().length).toBe(43);
  });

  it('produce tokens distintos en llamadas sucesivas (no adivinable)', () => {
    const muestras = new Set(Array.from({ length: 1000 }, () => generarToken()));
    expect(muestras.size).toBe(1000);
  });

  it('los tokens generados pasan la comprobación de forma pareceToken', () => {
    for (let i = 0; i < 50; i += 1) {
      expect(pareceToken(generarToken())).toBe(true);
    }
  });
});

describe('pareceToken', () => {
  it('rechaza cadenas obviamente inválidas', () => {
    expect(pareceToken('')).toBe(false);
    expect(pareceToken('corto')).toBe(false);
    expect(pareceToken('tiene espacios en medio dentro')).toBe(false);
    expect(pareceToken('con/barra/no/permitida/aaaaaaaaaaaaaaaaaaaaaaaaa')).toBe(false);
    expect(pareceToken('x'.repeat(100))).toBe(false);
  });

  it('acepta cadenas con la forma de un token', () => {
    expect(pareceToken('A'.repeat(43))).toBe(true);
    expect(pareceToken('a-b_C9'.repeat(8))).toBe(true);
  });
});
