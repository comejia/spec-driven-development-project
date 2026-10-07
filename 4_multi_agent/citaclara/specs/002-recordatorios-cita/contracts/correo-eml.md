# Contrato: Fichero `.eml` de salida simulada

**Requisitos**: FR-005, FR-006, FR-007, FR-008, FR-009, FR-013.

Cuando no hay SMTP configurado, cada recordatorio generado produce un fichero `.eml` en
`datos/salida-correo/` (FR-013). El `.eml` es un mensaje MIME RFC 5322 compuesto sin dependencias
nuevas (D3).

## Nombre de fichero

Determinista y legible, para validación reproducible:

```
datos/salida-correo/<yyyyMMdd-HHmm>-<cita_id>.eml
```

- `<yyyyMMdd-HHmm>`: fecha y hora de inicio de la cita en `Europe/Madrid`.
- `<cita_id>`: uuid de la cita (garantiza unicidad de nombre y correspondencia 1:1 con el recordatorio).

## Cabeceras (mínimas)

| Cabecera | Contenido |
|----------|-----------|
| `From` | Remitente de la clínica (nombre + dirección de la clínica configurada). |
| `To` | Email del paciente (`paciente.email`). |
| `Subject` | Asunto claro en es-ES, p. ej. `Recordatorio de tu cita en <clínica> el <dd/MM/yyyy> a las <HH:mm>`. |
| `Date` | Instante de generación en formato RFC 5322. |
| `MIME-Version` | `1.0` |
| `Content-Type` | `text/plain; charset=UTF-8` (v1; HTML opcional futuro). |

## Cuerpo (contenido mínimo, es-ES)

Debe incluir (FR-005/FR-006/FR-007):

- Nombre del paciente.
- Profesional, servicio y **fecha y hora de inicio** en formato inequívoco `dd/MM/yyyy HH:mm`
  (`Europe/Madrid`, vía `src/domain/tiempo.ts`).
- Nombre de la clínica.
- **Enlace de acceso `/p/[token]` del paciente** (de 005), presentado como la vía para ver la cita
  y cancelarla si procede.
- **Texto de política de cancelación derivado de 005** (FR-008/FR-009, FR-012 de 005): comunica el
  plazo de **24 h**; e indica que, dentro de la ventana (menos de 24 h), debe llamar al **teléfono
  de la clínica** (no ofrece cancelar). 002 **no** afirma otro plazo.

### Ejemplo de cuerpo (orientativo)

```
Hola <nombre del paciente>:

Te recordamos tu cita en <clínica>:

  • Profesional: <profesional>
  • Servicio: <servicio>
  • Fecha y hora: <dd/MM/yyyy HH:mm>

Para ver tu cita o cancelarla, entra en tu acceso personal:
  <URL base>/p/<token>

Puedes cancelar hasta 24 horas antes del inicio. Si faltan menos de 24 horas,
llámanos al <teléfono de la clínica> y lo gestionamos por teléfono.

Un saludo,
<clínica>
```

## Reglas de contenido (verificables)

- **Coherencia de política** (FR-012 de 005, SC-007 de 002): 0 textos que afirmen un plazo distinto
  de 24 h.
- **Enlace correcto** (SC-003): el `/p/[token]` corresponde al paciente propietario de la cita.
- **Idioma y formato** (FR-006, constitución p.2/p.8): todo en es-ES; fecha/hora inequívocas.
- **Correspondencia 1:1**: existe exactamente un `.eml` por recordatorio con `resultado ∈
  {simulado, enviado}`; ninguno para `resultado = omitido`.
