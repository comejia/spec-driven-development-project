import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

const CARPETA_MIGRACIONES = join(dirname(fileURLToPath(import.meta.url)), 'migrations');

/** Aplica todas las migraciones pendientes a la base indicada. */
export async function aplicarMigraciones(url: string): Promise<void> {
  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    await migrate(drizzle(pool), { migrationsFolder: CARPETA_MIGRACIONES });
  } finally {
    await pool.end();
  }
}

const ejecutadoDirectamente = process.argv[1] === fileURLToPath(import.meta.url);

if (ejecutadoDirectamente) {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('Falta DATABASE_URL.');
    process.exit(1);
  }
  aplicarMigraciones(url)
    .then(() => {
      console.log('Migraciones aplicadas correctamente.');
    })
    .catch((error: unknown) => {
      console.error('Error al aplicar las migraciones:', error);
      process.exit(1);
    });
}
