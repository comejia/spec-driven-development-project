import { argumentosProcesoSchema } from '@/src/validation/recordatorios';
import { esErrorNegocio } from '@/src/domain/errores';
import { generarRecordatorios } from '@/src/services/generar-recordatorios';

/**
 * Entrada CLI del proceso diario (contracts/proceso-diario.md), patrón `tsx` como `db:seed`.
 *
 *   npm run recordatorios:generar -- [--fecha=<ISO 8601>] [--clinica=<uuid>]
 *
 * Códigos de salida: 0 = completado (aunque haya omitidos por falta de email);
 * ≠ 0 = error de configuración o infraestructura (fecha inválida, DB inaccesible, config).
 */

/** Extrae `--clave=valor` y `--clave valor` de los argumentos. */
function leerArgumentos(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const actual = argv[i];
    if (!actual.startsWith('--')) continue;
    const sinPrefijo = actual.slice(2);
    const igual = sinPrefijo.indexOf('=');
    if (igual >= 0) {
      args[sinPrefijo.slice(0, igual)] = sinPrefijo.slice(igual + 1);
    } else if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
      args[sinPrefijo] = argv[i + 1];
      i += 1;
    } else {
      args[sinPrefijo] = '';
    }
  }
  return args;
}

export async function ejecutarCli(argv: string[]): Promise<number> {
  const crudos = leerArgumentos(argv);

  const parseo = argumentosProcesoSchema.safeParse({
    fecha: crudos.fecha ? crudos.fecha : undefined,
    clinica: crudos.clinica ? crudos.clinica : undefined,
  });

  if (!parseo.success) {
    const mensaje = parseo.error.issues.map((i) => i.message).join(' ');
    console.error(`No se pudo iniciar el proceso: ${mensaje}`);
    return 1;
  }

  const { fecha, clinica } = parseo.data;

  try {
    const resumen = await generarRecordatorios({
      referencia: fecha ? new Date(fecha) : undefined,
      clinicaId: clinica,
    });

    console.log('Proceso de recordatorios completado.');
    console.log(`  Citas elegibles: ${resumen.elegibles}`);
    console.log(`  Recordatorios generados: ${resumen.generados}`);
    console.log(`  Omitidos (paciente sin email): ${resumen.omitidos}`);
    console.log(`  Ya recordados anteriormente: ${resumen.yaRecordados}`);
    return 0;
  } catch (error: unknown) {
    if (esErrorNegocio(error)) {
      console.error(`No se pudo completar el proceso: ${error.message}`);
    } else {
      console.error('Error al ejecutar el proceso de recordatorios:', error);
    }
    return 1;
  }
}

const ejecutadoDirectamente = process.argv[1]?.endsWith('generar-recordatorios.ts');

if (ejecutadoDirectamente) {
  ejecutarCli(process.argv.slice(2))
    .then((codigo) => {
      process.exitCode = codigo;
    })
    .catch((error: unknown) => {
      console.error('Error inesperado:', error);
      process.exitCode = 1;
    });
}
