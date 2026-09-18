import { formatearEuros } from '@/src/domain/dinero';
import { sembrarEnUrl } from './seed';

/** Ejecuta la semilla determinista contra DATABASE_URL (`npm run db:seed`). */

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Falta DATABASE_URL.');
  process.exit(1);
}

sembrarEnUrl(url)
  .then((resumen) => {
    console.log(`Semilla aplicada: ${resumen.clinica}`);
    console.log(`  Profesionales: ${resumen.profesionales}`);
    console.log(`  Servicios: ${resumen.servicios}`);
    console.log(`  Pacientes: ${resumen.pacientes}`);
    console.log(`  Citas: ${resumen.citas} (${resumen.primeraFecha} → ${resumen.ultimaFecha})`);
    console.log(`    reservadas: ${resumen.citasPorEstado.reservada}`);
    console.log(`    completadas: ${resumen.citasPorEstado.completada}`);
    console.log(`    canceladas: ${resumen.citasPorEstado.cancelada}`);
    console.log(`    no asistidas: ${resumen.citasPorEstado.no_asistida}`);
    console.log(
      `  Ingresos de citas completadas: ${formatearEuros(resumen.ingresosCompletadasCentimos)}`,
    );
  })
  .catch((error: unknown) => {
    console.error('Error al aplicar la semilla:', error);
    process.exit(1);
  });
