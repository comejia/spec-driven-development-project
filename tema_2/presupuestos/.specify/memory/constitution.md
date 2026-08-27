<!-- Sync Impact Report
  Version change: none → 1.0.0
  Added principles:
    - I. Simplicidad ante todo
    - II. Idioma y mercado
    - III. Cero alcance fantasma
    - IV. Verificable por una persona no técnica
    - V. Datos del usuario con respeto
  Added sections:
    - Core Principles (5 principios)
    - Restricciones de alcance
    - Gobernanza
  Removed sections: none
  Deferred TODOs: none
-->

# PresupuestosPro Constitution

## Core Principles

### I. Simplicidad ante todo

Ante dos soluciones posibles, se DEBE elegir siempre la más simple. Esto es una versión 1:
no se anticipa complejidad futura ni se diseña para casos que aún no existen. Si una
funcionalidad se puede resolver de forma directa, no se añaden abstracciones ni capas
adicionales.

### II. Idioma y mercado

Todo el producto DEBE estar en español de España: interfaz, mensajes, documentación y
contenido generado. La moneda es el euro (€). No se contempla internacionalización ni
soporte multiidioma en esta versión.

### III. Cero alcance fantasma

NO se DEBE implementar ninguna funcionalidad que no esté escrita en la spec. Si surge una
idea nueva durante el desarrollo, se documenta como propuesta para una versión futura; nunca
se construye directamente. Toda funcionalidad requiere especificación previa aprobada.

### IV. Verificable por una persona no técnica

Cada criterio de éxito DEBE poder comprobarse usando la aplicación, sin necesidad de leer
código, ejecutar comandos de terminal ni inspeccionar almacenamiento interno. Si un criterio
no se puede verificar así, debe reformularse.

### V. Datos del usuario con respeto

Se DEBE pedir solo la información imprescindible para el funcionamiento de la aplicación. No
se almacenan datos innecesarios. No se introducen claves, secretos ni credenciales en el
código fuente. Los datos del usuario permanecen bajo su control.

## Restricciones de alcance

- Versión 0: producto mínimo funcional para un freelancer individual.
- Sin autenticación, sin nube, sin multidivisa.
- Cualquier extensión de alcance requiere una nueva especificación aprobada antes de
  implementarse (ver principio III).

## Gobernanza

- Esta constitución prevalece sobre cualquier otra decisión de diseño o implementación.
- Cualquier cambio a estos principios requiere documentación explícita y aprobación antes de
  aplicarse.
- Toda revisión de código DEBE verificar el cumplimiento de estos principios.
- Versionado semántico: MAJOR para cambios incompatibles en principios, MINOR para
  principios nuevos, PATCH para clarificaciones.

**Version**: 1.0.0 | **Ratified**: 2026-08-20 | **Last Amended**: 2026-08-20
