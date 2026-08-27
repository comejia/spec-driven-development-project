# Especificación: Mejora de presentación de PresupuestosPro

**Feature Branch**: `002-mejora-presentacion`

**Fecha**: 2026-08-24

**Estado**: Borrador

---

## 1. Objetivo y contexto de negocio

PresupuestosPro ya es funcional (spec 001 implementada), pero su presentación visual es básica. Esta mejora busca que la aplicación transmita profesionalidad y confianza desde el primer contacto, tanto en pantalla como en el PDF que recibe el cliente. No se altera ninguna funcionalidad ni dato existente.

**Problema que resuelve:** la app funciona pero no transmite la imagen profesional que un freelancer necesita para generar confianza en sus clientes. La navegación obliga a usar el botón atrás del navegador y no hay visión general del estado de los presupuestos.

**Éxito de negocio:** el freelancer siente que la herramienta refuerza su imagen profesional, puede moverse entre secciones sin fricciones, y ve de un vistazo el estado de su actividad.

---

## Clarifications

### Session 2026-08-24

- Q: ¿Qué información muestra el resumen de actividad en la página de inicio? → A: Conteo de presupuestos por estado + número de clientes + número de servicios en catálogo.
- Q: ¿Se definen estilos CSS para estados futuros (Enviado, Aceptado, etc.)? → A: No. Se añadirán cuando se especifique la lógica (principio III: cero alcance fantasma).
- Q: ¿Cómo se comporta la navegación en móvil? → A: Sticky top, siempre visible.
- Q: ¿El nombre "PresupuestosPro" aparece en la navegación? → A: Sí, como marca clickeable que lleva al inicio.
- Q: ¿Se avisa en la página de inicio si el perfil está incompleto? → A: Sí, se muestra un aviso destacado.

---

## 2. Usuarios

| Usuario | Descripción |
|---|---|
| **Freelancer** (usa la app) | Mismo perfil que en spec 001. Valora que sus herramientas de trabajo se vean profesionales. |
| **Cliente** (recibe el PDF) | Juzga la profesionalidad del freelancer en parte por la calidad visual del presupuesto recibido. |

---

## 3. Escenarios de usuario

### HU1 — Página de inicio con resumen de actividad (Prioridad: P1)

Como freelancer, quiero ver una página de inicio al abrir la aplicación que me muestre un resumen de mi actividad y accesos directos a las secciones, para tener una visión general sin tener que entrar en cada sección.

**Por qué esta prioridad**: es lo primero que ve el freelancer al abrir la app; establece la experiencia de uso.

**Test independiente**: abrir la app y verificar que se ve el resumen de actividad y los accesos a las 4 secciones.

**Escenarios de aceptación**:

1. **Dado** que abro la aplicación en la URL raíz, **cuando** se carga la página, **entonces** veo una página de inicio con accesos directos a Presupuestos, Clientes, Catálogo y Perfil.
2. **Dado** que tengo presupuestos en distintos estados, **cuando** veo la página de inicio, **entonces** aparece un resumen numérico de presupuestos por estado (borradores, numerados).
3. **Dado** que no tengo ningún presupuesto, **cuando** veo la página de inicio, **entonces** se muestra un mensaje de bienvenida invitando a crear el primer presupuesto.
4. **Dado** que estoy en cualquier página de la app, **cuando** quiero volver al inicio, **entonces** puedo hacerlo desde la navegación común sin usar el botón atrás del navegador.

---

### HU2 — Navegación común visible en todas las páginas (Prioridad: P1)

Como freelancer, quiero una barra de navegación visible en todas las páginas para moverme entre secciones sin depender del botón atrás del navegador.

**Por qué esta prioridad**: afecta a toda la experiencia de uso; sin ella la app se siente incompleta.

**Test independiente**: desde cualquier sección, puedo ir directamente a cualquier otra sección con un solo clic.

**Escenarios de aceptación**:

1. **Dado** que estoy en cualquier página, **cuando** miro la navegación, **entonces** veo enlaces a Inicio, Presupuestos, Clientes, Catálogo y Perfil.
2. **Dado** que pulso un enlace de la navegación, **cuando** la página carga, **entonces** estoy en la sección correcta sin haber usado el botón atrás.
3. **Dado** que estoy en móvil, **cuando** veo la navegación, **entonces** es accesible y usable sin dificultad (no se desborda ni se oculta).
4. **Dado** que estoy en la sección activa, **cuando** miro la navegación, **entonces** el enlace de la sección actual se ve resaltado visualmente.

---

### HU3 — Rediseño visual profesional de la aplicación (Prioridad: P1)

Como freelancer, quiero que la aplicación tenga un aspecto visual profesional y sobrio, para que transmita confianza y refuerce mi imagen.

**Por qué esta prioridad**: la presentación visual afecta la percepción de calidad de toda la herramienta.

**Test independiente**: abrir la app y verificar que tipografía, colores, espaciado y jerarquía visual son consistentes en todas las secciones.

**Escenarios de aceptación**:

1. **Dado** que abro cualquier página, **cuando** observo el diseño, **entonces** la tipografía es consistente (mismo tipo y tamaños proporcionales en toda la app).
2. **Dado** que observo la paleta de colores, **cuando** navego por todas las secciones, **entonces** se usa la misma paleta limitada en toda la aplicación.
3. **Dado** que veo tablas, formularios y totales, **cuando** comparo su presentación, **entonces** tienen un espaciado uniforme y una jerarquía visual clara (títulos destacados, datos secundarios más sutiles).
4. **Dado** que veo la lista de presupuestos, **cuando** hay presupuestos en distintos estados, **entonces** cada estado se distingue visualmente con claridad (por ejemplo, color o etiqueta diferenciada para Borrador y Numerado).

---

### HU4 — Rediseño del PDF profesional (Prioridad: P2)

Como freelancer, quiero que el PDF del presupuesto tenga un diseño profesional y sobrio, para que el documento que recibe mi cliente transmita seriedad.

**Por qué esta prioridad**: el PDF es lo que ve el cliente final; es la pieza de comunicación más importante.

**Test independiente**: generar un PDF y verificar visualmente que tiene diseño profesional con logo, tipografía y desglose bien maquetados.

**Escenarios de aceptación**:

1. **Dado** que genero un PDF, **cuando** lo abro, **entonces** el logo se ve nítido y bien posicionado.
2. **Dado** que veo el PDF, **cuando** observo la tipografía y el espaciado, **entonces** son consistentes con la imagen de la app (misma línea visual).
3. **Dado** que veo la tabla de líneas y el desglose, **cuando** los comparo, **entonces** tienen una jerarquía visual clara: conceptos, subtotales y total bien diferenciados.
4. **Dado** que el PDF tiene número y fechas, **cuando** los busco, **entonces** están en un lugar visible y destacado.
5. **Dado** que genero un PDF con retención de IRPF, **cuando** veo el desglose, **entonces** la retención se muestra de forma clara y diferenciada del IVA y la base.

---

### Casos límite

| Código | Caso | Comportamiento esperado |
|---|---|---|
| CL1 | Página de inicio sin datos (app recién instalada) | Se muestra mensaje de bienvenida con guía para empezar. |
| CL2 | Navegación en pantalla muy pequeña (móvil) | La navegación se adapta sin perder accesibilidad (por ejemplo, scroll horizontal o menú compacto). |
| CL3 | Presupuestos sin estados nuevos (solo borrador y numerado existen) | Solo se muestran estilos para Borrador y Numerado. Los estados futuros se añadirán en su propia spec. |

---

## 4. Requisitos funcionales

### Página de inicio

- **RF-001.** La URL raíz de la aplicación debe mostrar una página de inicio (no redirigir a otra sección).
- **RF-002.** La página de inicio debe mostrar accesos directos (enlaces o tarjetas) a las cuatro secciones: Presupuestos, Clientes, Catálogo y Perfil.
- **RF-003.** La página de inicio debe mostrar un resumen numérico que incluya: presupuestos agrupados por estado (borradores y numerados), número total de clientes, y número de servicios en el catálogo.
- **RF-004.** Si no hay presupuestos ni datos, la página de inicio debe mostrar un mensaje de bienvenida con orientación para empezar.
- **RF-004b.** Si el perfil del freelancer está incompleto, la página de inicio debe mostrar un aviso destacado invitando a completarlo.

### Navegación común

- **RF-005.** Todas las páginas de la aplicación deben compartir una barra de navegación sticky (fija arriba, siempre visible al hacer scroll) que incluya: marca "PresupuestosPro" clickeable hacia el inicio, y enlaces a Inicio, Presupuestos, Clientes, Catálogo y Perfil.
- **RF-006.** La sección activa debe estar resaltada visualmente en la navegación.
- **RF-007.** La navegación debe ser usable en móvil (sticky top, sin desbordamiento, sin pérdida de accesibilidad).

### Rediseño visual

- **RF-008.** La paleta de colores de toda la aplicación debe estar definida en un único lugar (variables CSS centralizadas).
- **RF-009.** La tipografía debe ser consistente: mismo tipo de letra en toda la app, con tamaños proporcionados para títulos, cuerpo, etiquetas y datos secundarios.
- **RF-010.** El espaciado entre elementos (márgenes, paddings) debe ser uniforme y basado en un sistema de espaciado definido.
- **RF-011.** Los presupuestos deben tener estados visuales distinguibles: Borrador y Numerado. No se definen estilos para estados futuros (se añadirán en la spec que implemente esa lógica).
- **RF-012.** Las tablas deben tener cabeceras diferenciadas, filas con separadores claros y alternancia de color de fondo para facilitar la lectura.
- **RF-013.** Los formularios deben tener etiquetas alineadas, campos con bordes visibles y estados de foco marcados.
- **RF-014.** Los botones deben seguir una jerarquía: acción principal destacada, acciones secundarias más sutiles, acciones peligrosas (eliminar) claramente diferenciadas.

### PDF profesional

- **RF-015.** El PDF debe seguir la misma línea visual que la aplicación: tipografía sobria, espaciado generoso, jerarquía clara.
- **RF-016.** El logo debe mostrarse nítido y bien posicionado (esquina superior izquierda o cabecera centrada).
- **RF-017.** La tabla de líneas del PDF debe tener cabeceras diferenciadas y columnas alineadas.
- **RF-018.** El desglose (base, IVA, retención, total) debe tener jerarquía visual clara, con el total destacado respecto a los subtotales.
- **RF-019.** El número de presupuesto y las fechas (emisión y validez) deben estar en un lugar visible y prominente.

### Restricciones

- **RF-020.** La lógica de negocio, los cálculos, los servicios y el esquema de datos no deben modificarse.
- **RF-021.** Los datos existentes en localStorage deben seguir funcionando sin migración.
- **RF-022.** El enfoque mobile-first debe mantenerse.
- **RF-023.** Todos los textos deben estar en español de España.

---

## 5. Criterios de éxito

- **CA-001.** Al abrir la app en la URL raíz, se muestra la página de inicio con resumen de actividad y accesos a las 4 secciones.
- **CA-002.** Desde cualquier página, se puede ir a cualquier otra sección con un solo clic en la navegación, sin usar el botón atrás.
- **CA-003.** La sección activa se ve resaltada en la navegación.
- **CA-004.** La tipografía, colores y espaciado son visualmente consistentes en todas las páginas de la aplicación.
- **CA-005.** Los presupuestos en la lista muestran su estado (Borrador, Numerado) con un indicador visual diferenciado (color, etiqueta, o badge).
- **CA-006.** El PDF generado tiene un aspecto profesional: logo nítido, tipografía sobria, tabla bien maquetada, total destacado.
- **CA-007.** La app funciona igual que antes en móvil (formularios usables, tablas legibles, navegación accesible).
- **CA-008.** Los datos existentes siguen funcionando tras el rediseño sin necesidad de migración.
- **CA-009.** Todos los tests existentes siguen pasando sin modificaciones.
- **CA-010.** Si el perfil está incompleto, la página de inicio muestra un aviso destacado invitando a completarlo.

---

## 6. Entidades clave

No se añaden ni modifican entidades de datos. Los cambios son exclusivamente de presentación visual.

---

## 7. Supuestos

- La paleta de colores y el sistema de espaciado ya parcialmente definidos en `src/styles/global.css` se ampliarán y mejorarán, manteniendo la misma ubicación.
- El rediseño no requiere dependencias nuevas de CSS (no se añade Tailwind, Bootstrap ni similar).
- La estructura de componentes existente (Layout, páginas) se reutiliza y mejora, no se reescribe desde cero.
- La navegación es sticky top en todas las resoluciones.
- La marca "PresupuestosPro" es clickeable y lleva siempre al inicio.

---

## 8. Fuera de alcance

- No se implementa lógica ni estilos para estados futuros (Enviado, Aceptado, Rechazado, Caducado).
- No se añade modo oscuro.
- No se cambia la arquitectura de componentes ni la gestión de estado.
- No se modifican los servicios, cálculos ni modelo de datos.
- No se añaden animaciones complejas ni transiciones elaboradas.
- No se añade soporte para temas configurables por el usuario.
