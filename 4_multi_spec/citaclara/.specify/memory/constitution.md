<!--
Sync Impact Report
==================
Version change: (plantilla inicial sin versión) → 1.0.0
Motivo del salto: Ratificación inicial de la constitución de CitaClara (greenfield).

Principios definidos (8):
  1. Spec Primero (Spec First)
  2. Los Números No Admiten Creatividad
  3. El Solape Es el Fallo Capital (INNEGOCIABLE)
  4. Simplicidad y Cero Alcance Fantasma
  5. Demostrable con Datos Reproducibles
  6. Los Tests Acompañan a la Spec
  7. Interfaz Clara y Moderna
  8. Español de España en Todo

Secciones añadidas:
  - Restricciones de Producto y Calidad (Sección 2)
  - Flujo de Trabajo Multiagente (Sección 3)
  - Governance

Secciones eliminadas: ninguna (documento inicial).

Plantillas dependientes revisadas (sólo lectura, no modificadas por este comando):
  - .specify/templates/plan-template.md ✅ compatible (lee la constitución en runtime)
  - .specify/templates/spec-template.md ✅ compatible
  - .specify/templates/tasks-template.md ✅ compatible
  - .specify/templates/checklist-template.md ✅ compatible

TODOs diferidos: ninguno.
-->

# Constitución de CitaClara

CitaClara es un gestor de citas para clínicas y consultas pequeñas (fisioterapia,
nutrición, podología). Es un producto greenfield que nace con Desarrollo Guiado por
Especificaciones (SDD) y aspira a operar con varias features y varios agentes en
paralelo desde el primer mes. Esta constitución fija principios de negocio y de
calidad. No decide tecnología: el stack, los formatos y las estructuras se deciden en
el plan de cada feature.

## Principios Fundamentales

### 1. Spec Primero

Todo comportamiento observable del producto NACE de una spec aprobada en `specs/`.
Todo cambio de comportamiento EMPIEZA corrigiendo o creando su spec; el código nunca
se adelanta a la spec. La propiedad de cada spec vive en `specs/MAPA.md`, con un único
propietario por spec.

Rationale: con varios agentes trabajando en paralelo, la spec es la única fuente de
verdad compartida. Un propietario por spec elimina la ambigüedad sobre quién decide y
evita cambios contradictorios sobre el mismo comportamiento.

### 2. Los Números No Admiten Creatividad

Todos los importes DEBEN cuadrar al céntimo, siempre: ninguna operación puede introducir
descuadres por redondeo, truncamiento o acumulación de errores. Toda fecha u hora DEBE
mostrarse sin ambigüedad posible para una clínica española.

Rationale: en un gestor de citas y cobros, un céntimo perdido o una hora ambigua
destruyen la confianza de la recepción y del paciente. La exactitud numérica y temporal
no es una preferencia estética: es una obligación verificable.

### 3. El Solape Es el Fallo Capital (INNEGOCIABLE)

Un profesional NO PUEDE tener dos citas a la vez, jamás, ni siquiera si dos reservas del
mismo hueco llegan en el mismo instante. Toda feature que escriba en la agenda DEBE
incluir pruebas que intenten provocar activamente un solape, incluidas reservas
concurrentes sobre el mismo hueco.

Rationale: el solape es el error que rompe la promesa central del producto. Prevenirlo
sólo en el camino feliz no basta; hay que demostrar con pruebas hostiles que el sistema
resiste condiciones de carrera y peticiones simultáneas.

### 4. Simplicidad y Cero Alcance Fantasma

Ante dos soluciones, se elige la MÁS SIMPLE. Nada se construye ni se añade —ni
funcionalidad ni dependencia— sin estar justificado en una spec. No hay alcance fantasma:
lo que no está en una spec aprobada no se implementa.

Rationale: la simplicidad mantiene el producto mantenible por un equipo pequeño y
comprensible por varios agentes. Toda dependencia o función extra es superficie de fallo
y coste futuro que debe ganarse su sitio en una spec.

### 5. Demostrable con Datos Reproducibles

El producto MANTIENE datos de demostración deterministas: misma semilla, misma historia.
Specs, ejemplos y analítica DEBEN citar números que cualquiera pueda reproducir a partir
de esos datos.

Rationale: los datos deterministas convierten afirmaciones ("la clínica facturó X") en
hechos comprobables por cualquier persona o agente. Sin reproducibilidad, las specs y la
analítica se vuelven opiniones no verificables.

### 6. Los Tests Acompañan a la Spec

Cada regla de negocio y cada criterio de aceptación relevante TIENE un test que la
referencia explícitamente. La suite en verde es CONDICIÓN DE MERGE: no se integra código
con tests en rojo o con reglas sin cobertura.

Rationale: la trazabilidad spec→test hace que la conformidad sea automática y auditable.
Exigir la suite verde como puerta de merge protege el producto cuando varios agentes
integran en paralelo.

### 7. Interfaz Clara y Moderna

La recepción DEBE poder usar la interfaz sin formación y sin manual. NO se muestra jerga
técnica en pantalla. El contraste y los tamaños DEBEN ser accesibles. La interfaz DEBE
funcionar tanto en el portátil de recepción como en el móvil de un paciente. Esto es un
requisito de calidad, no de stack: la tecnología de la interfaz se decide en el plan.

Rationale: el valor del producto se realiza en el mostrador. Una interfaz que exige
formación, excluye a personas con baja visión o falla en móvil no cumple su propósito,
independientemente de lo correcta que sea por dentro.

### 8. Español de España en Todo

Todo el producto —interfaz, mensajes, documentación de cara al usuario, ejemplos y datos
de demostración— DEBE estar en español de España.

Rationale: el público objetivo son clínicas y pacientes en España. Una única variante
lingüística coherente evita mezclas confusas y refuerza la claridad exigida en el
Principio 7.

## Restricciones de Producto y Calidad

Estas restricciones son de negocio y calidad; ninguna decide tecnología.

- **Fuente de verdad**: `specs/` es la fuente de verdad del comportamiento; `specs/MAPA.md`
  es la fuente de verdad de la propiedad (un propietario por spec).
- **Exactitud**: importes al céntimo y fechas/horas inequívocas para el contexto español
  son requisitos de aceptación, no detalles de implementación.
- **Integridad de la agenda**: la ausencia de solapes es un invariante del producto que
  toda feature de escritura en agenda debe preservar y probar.
- **Reproducibilidad**: existe un conjunto de datos de demostración deterministas
  (semilla fija, historia fija) que specs, ejemplos y analítica citan.
- **Accesibilidad e idioma**: contraste y tamaños accesibles, uso en portátil y móvil, y
  español de España son criterios de calidad evaluables en cada feature con interfaz.

## Flujo de Trabajo Multiagente

CitaClara opera con varias features y varios agentes en paralelo desde el primer mes. Para
que ese paralelismo sea seguro:

- **Un propietario por spec**: cada spec en `specs/` tiene un único propietario registrado
  en `specs/MAPA.md`. Los cambios de comportamiento de una spec los coordina su propietario.
- **Cambios dirigidos por spec**: cualquier agente que cambie comportamiento primero crea o
  corrige la spec correspondiente antes de tocar código.
- **Puertas de calidad**: ninguna integración procede sin (a) spec aprobada, (b) tests que
  referencian las reglas y criterios afectados, (c) pruebas anti-solape cuando se escribe en
  la agenda, y (d) suite completa en verde.
- **Sin alcance fantasma en paralelo**: un agente no añade funcionalidad ni dependencias
  fuera de su spec, aunque parezcan convenientes para otra feature.

## Governance

Esta constitución PREVALECE sobre cualquier otra práctica o preferencia individual. En caso
de conflicto entre una decisión técnica y un principio de esta constitución, el principio
gana y la decisión técnica se replantea en el plan.

- **Enmiendas**: toda enmienda se documenta en este archivo, se justifica y se aprueba antes
  de aplicarse. Los cambios de comportamiento derivados de una enmienda siguen el Principio 1
  (Spec Primero).
- **Versionado semántico de la constitución**:
  - MAJOR: eliminación o redefinición incompatible de principios o de reglas de governance.
  - MINOR: nuevo principio o sección, o ampliación material de una guía existente.
  - PATCH: aclaraciones, redacción y correcciones sin cambio semántico.
- **Cumplimiento**: toda revisión de cambios (PR o equivalente) DEBE verificar la conformidad
  con estos principios. Toda complejidad añadida DEBE justificarse frente al Principio 4. Las
  puertas de calidad del Flujo de Trabajo Multiagente son condición de integración.
- **Revisión de conformidad**: la conformidad se comprueba de forma continua a través de la
  trazabilidad spec→test (Principio 6) y de los datos de demostración reproducibles
  (Principio 5).

**Version**: 1.0.0 | **Ratified**: 2026-09-16 | **Last Amended**: 2026-09-16
