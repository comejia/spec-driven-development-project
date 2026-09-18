import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { GlobalSetupContext } from 'vitest/node';
import { aplicarMigraciones } from '@/src/db/migrate';

/**
 * PostgreSQL real y efímero para la suite de integración (D7).
 *
 * El invariante anti-solape (Principio 3) solo puede probarse contra el motor real: las
 * restricciones de exclusión y su comportamiento bajo concurrencia no existen en un mock.
 */

let contenedor: StartedPostgreSqlContainer | undefined;

export default async function setup({ provide }: GlobalSetupContext) {
  contenedor = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('citaclara_test')
    .withUsername('citaclara')
    .withPassword('citaclara')
    .start();

  const url = contenedor.getConnectionUri();
  await aplicarMigraciones(url);
  provide('databaseUrl', url);

  return async () => {
    await contenedor?.stop();
  };
}

declare module 'vitest' {
  interface ProvidedContext {
    databaseUrl: string;
  }
}
