import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CitaClara — Agenda de la clínica',
  description:
    'Gestión de citas para clínicas y consultas pequeñas: agenda del día, alta de citas sin solapes y estados de la cita.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-ES">
      <body className="min-h-dvh">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-[color:var(--color-primario-fuerte)] focus:shadow"
        >
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
