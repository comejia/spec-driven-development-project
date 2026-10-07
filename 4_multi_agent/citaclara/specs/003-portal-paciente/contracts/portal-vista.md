# Contrato: Vista del portal (citas del paciente)

**Expuesto por 003** | **Método**: `GET /api/portal/[token]` (consumido por `app/p/[token]/page.tsx`)

Devuelve las citas del paciente identificado por el token, separadas en próximas e historial.
La identidad la resuelve el puerto de acceso de **005**; 003 no interpreta el token.

## Entrada

- **Ruta**: `token` (string opaco, propiedad de 005). No se valida su forma en 003 más allá de no
  vacío; la validez la decide el puerto de acceso.

## Salida `200 OK`

```json
{
  "paciente": { "nombre": "Lucía García" },
  "proximas": [
    {
      "id": "…uuid…",
      "inicioIso": "2026-09-28T07:30:00.000Z",
      "fechaHoraTexto": "28/09/2026 09:30",
      "profesional": "María Ferrer",
      "servicio": "Sesión de fisioterapia",
      "estado": "Reservada",
      "cancelable": true
    }
  ],
  "historial": [
    {
      "id": "…uuid…",
      "inicioIso": "2026-09-10T08:00:00.000Z",
      "fechaHoraTexto": "10/09/2026 10:00",
      "profesional": "María Ferrer",
      "servicio": "Sesión de fisioterapia",
      "estado": "Completada",
      "cancelable": false
    }
  ]
}
```

- `proximas`: orden ascendente por `inicioIso`. `historial`: orden descendente.
- Cuando una cita futura no es cancelable por ventana (política 005), se incluye
  `"cancelable": false` y `"telefonoClinica": "…"` para el mensaje de "llame a la clínica".
- Estados vacíos: `proximas: []` y/o `historial: []` (la UI muestra mensajes claros, FR-008).

## Errores

| Situación | Código HTTP | Cuerpo |
|-----------|-------------|--------|
| Token inexistente/manipulado/regenerado (denegado por 005) | `404` (neutro) | `{ "error": { "codigo": "ACCESO_DENEGADO", "mensaje": "No hemos podido abrir este enlace. Solicita uno nuevo a tu clínica." } }` |
| Token vacío | `404` (neutro) | igual que arriba (no se distingue el motivo, D3) |

> Nota de seguridad: no se distingue "no existe" de "no autorizado" (005 FR-002). El token no
> aparece en el cuerpo ni en logs.

## Trazabilidad
- FR-001, FR-002, FR-003 (acceso remitido a 005), FR-005, FR-006, FR-007, FR-008, FR-011/FR-012
  (marca `cancelable` según política 005). SC-001, SC-005.
