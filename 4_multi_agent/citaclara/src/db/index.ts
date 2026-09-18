import { Pool, type PoolClient } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { schema } from './schema';

export type BaseDatos = NodePgDatabase<typeof schema>;

let poolCompartido: Pool | undefined;
let dbCompartida: BaseDatos | undefined;

function cadenaConexion(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'Falta la variable de entorno DATABASE_URL con la cadena de conexión a PostgreSQL.',
    );
  }
  return url;
}

/** Pool de conexiones compartido del proceso. */
export function obtenerPool(): Pool {
  if (!poolCompartido) {
    poolCompartido = new Pool({ connectionString: cadenaConexion(), max: 10 });
  }
  return poolCompartido;
}

/** Cliente Drizzle tipado sobre el pool compartido. */
export function obtenerDb(): BaseDatos {
  if (!dbCompartida) {
    dbCompartida = drizzle(obtenerPool(), { schema });
  }
  return dbCompartida;
}

/** Crea un cliente aislado (útil en pruebas y scripts que abren su propia conexión). */
export function crearDb(url: string): { db: BaseDatos; pool: Pool } {
  const pool = new Pool({ connectionString: url, max: 5 });
  return { db: drizzle(pool, { schema }), pool };
}

export type { PoolClient };
export { schema };
