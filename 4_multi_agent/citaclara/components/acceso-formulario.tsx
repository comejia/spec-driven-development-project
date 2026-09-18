'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

/** US4 — Acceso con la clave de la clínica (FR-018, FR-020). */

interface Props {
  clinicas: { id: string; nombre: string }[];
}

export function AccesoFormulario({ clinicas }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function alEnviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);

    const formulario = new FormData(evento.currentTarget);
    const respuesta = await fetch('/api/acceso', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        clinica_id: String(formulario.get('clinica_id') ?? ''),
        clave: String(formulario.get('clave') ?? ''),
      }),
    });

    if (!respuesta.ok) {
      const datos = await respuesta.json().catch(() => null);
      setError(datos?.error?.mensaje ?? 'No hemos podido comprobar la clave.');
      setEnviando(false);
      return;
    }

    router.replace('/agenda');
    router.refresh();
  }

  return (
    <form onSubmit={alEnviar} className="grid gap-4" aria-label="Acceso a la clínica">
      {clinicas.length > 1 ? (
        <div className="grid gap-1.5">
          <Label htmlFor="clinica_id">Clínica</Label>
          <Select id="clinica_id" name="clinica_id" defaultValue={clinicas[0]?.id} required>
            {clinicas.map((unaClinica) => (
              <option key={unaClinica.id} value={unaClinica.id}>
                {unaClinica.nombre}
              </option>
            ))}
          </Select>
        </div>
      ) : (
        <input type="hidden" name="clinica_id" value={clinicas[0]?.id ?? ''} />
      )}

      <div className="grid gap-1.5">
        <Label htmlFor="clave">Clave de la clínica</Label>
        <Input
          id="clave"
          name="clave"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'error-acceso' : undefined}
        />
      </div>

      {error ? (
        <Alert tono="error" role="alert" id="error-acceso">
          {error}
        </Alert>
      ) : null}

      <Button type="submit" tamano="grande" disabled={enviando}>
        <KeyRound aria-hidden="true" />
        {enviando ? 'Comprobando…' : 'Entrar'}
      </Button>
    </form>
  );
}
