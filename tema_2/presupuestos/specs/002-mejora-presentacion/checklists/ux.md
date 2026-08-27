# Checklist de calidad de requisitos UX/UI: Mejora de presentación

**Propósito**: Validar que los requisitos de UX/UI están completos, claros y son medibles antes de implementar
**Creado**: 2026-08-24
**Feature**: specs/002-mejora-presentacion/spec.md

**Nota**: Este checklist es un artefacto de revisión de calidad de requisitos. Marcar un item `[x]` significa que el criterio de calidad del requisito está satisfecho, NO que la implementación esté completa.

## Completitud de requisitos — Página de inicio

- [x] CHK001 - ¿Están definidos los elementos de contenido de las tarjetas/accesos directos de la página de inicio? [Completitud, Spec §RF-002]
  > RF-002 dice "enlaces o tarjetas" a las 4 secciones. RF-003 define el contenido del resumen. Suficiente para implementar.
- [x] CHK002 - ¿Está completamente especificado el contenido del estado vacío (mensaje exacto, destino de la acción)? [Completitud, Spec §RF-004]
  > RF-004 dice "mensaje de bienvenida con orientación para empezar". CL1 lo refuerza. Texto exacto queda a criterio del implementador.
- [x] CHK003 - ¿Está definido el formato del aviso de perfil incompleto (posición, nivel de severidad, descartabilidad)? [Completitud, Spec §RF-004b]
  > RF-004b dice "aviso destacado". T008 detalla texto y enlace a /perfil. El formato visual es decisión de diseño coherente con la jerarquía.
- [x] CHK004 - ¿Está definido qué se muestra cuando un contador del resumen es cero (mostrar "0" u ocultar)? [Caso límite]
  > RF-004 cubre el caso sin datos. Cuando hay algunos datos pero un contador es 0, mostrar "0" es el comportamiento estándar implícito.

## Completitud de requisitos — Navegación

- [x] CHK005 - ¿Está especificado el orden de los elementos de navegación (marca + secuencia de enlaces)? [Completitud, Spec §RF-005]
  > RF-005 especifica: marca "PresupuestosPro" clickeable + enlaces a Inicio, Presupuestos, Clientes, Catálogo y Perfil. El orden está implícito en la enumeración.
- [x] CHK006 - ¿Están cuantificados los requisitos del estilo del enlace activo (color, peso, tipo de indicador)? [Claridad, Spec §RF-006]
  > RF-006 dice "resaltada visualmente". La spec no prescribe el método concreto — eso es decisión de diseño coherente con la paleta (RF-008).
- [x] CHK007 - ¿Está definido el comportamiento de la navegación cuando se desborda en móvil (scroll, colapso, o wrap)? [Claridad, Spec §RF-007]
  > RF-007 dice "sin desbordamiento, sin pérdida de accesibilidad". CL2 añade "scroll horizontal o menú compacto". Suficiente restricción.
- [x] CHK008 - ¿Está definida la altura/padding de la navegación sticky para evitar que el contenido quede oculto debajo? [Hueco]
  > El requisito es "sticky top, siempre visible" (RF-005). Que el contenido no quede oculto es una consecuencia técnica implícita, no un requisito de negocio.

## Claridad de requisitos — Rediseño visual

- [x] CHK009 - ¿Está cuantificado "profesional y sobrio" con tokens de diseño específicos (familia tipográfica, escala de tamaños, valores de color)? [Claridad, Spec §RF-009]
  > La spec es de negocio, no técnica (principio IV de la constitución). RF-008/009/010 piden paleta centralizada, tipografía consistente y espaciado uniforme. Los valores concretos son decisión de implementación.
- [x] CHK010 - ¿Están especificados los valores exactos de la paleta de colores o solo descritos cualitativamente? [Medibilidad, Spec §RF-008]
  > Descrito cualitativamente ("paleta limitada en un único lugar"). Correcto para una spec de negocio. Verificable: ¿se usa la misma paleta en toda la app? Sí/No.
- [x] CHK011 - ¿Está definido el sistema de espaciado con valores específicos (escala 4px, 8px, 16px, etc.)? [Claridad, Spec §RF-010]
  > RF-010 pide "uniforme y basado en un sistema de espaciado definido". La spec no debe incluir píxeles — es un detalle técnico.
- [x] CHK012 - ¿Está cuantificada la "jerarquía visual" entre títulos, cuerpo, etiquetas y datos secundarios con tamaños/pesos de fuente? [Medibilidad, Spec §RF-009]
  > RF-009 pide "tamaños proporcionados para títulos, cuerpo, etiquetas y datos secundarios". Verificable visualmente sin prescribir px.
- [x] CHK013 - ¿Están definidos los requisitos de jerarquía de botones con propiedades visuales específicas por nivel? [Claridad, Spec §RF-014]
  > RF-014 define 3 niveles: principal (destacada), secundaria (sutil), peligrosa (diferenciada). Suficiente para implementar.
- [x] CHK014 - ¿Están especificados los colores de alternancia de filas de tabla o quedan a criterio de implementación? [Claridad, Spec §RF-012]
  > RF-012 pide "alternancia de color de fondo". El color exacto es decisión de diseño coherente con la paleta. El requisito está claro.

## Claridad de requisitos — Estados visuales

- [x] CHK015 - ¿Están definidas las propiedades visuales de los badges "Borrador" y "Numerado" (color, texto, forma)? [Claridad, Spec §RF-011]
  > RF-011 pide "estados visuales distinguibles". CA-005 dice "indicador visual diferenciado (color, etiqueta, o badge)". Suficiente.
- [x] CHK016 - ¿Está especificada la posición del badge dentro de la fila de la lista (izquierda, derecha, junto al título)? [Hueco]
  > No es necesario especificar posición exacta. El requisito es "distinguibles" — el implementador posiciona donde tenga más sentido visual.

## Claridad de requisitos — PDF

- [x] CHK017 - ¿Está especificada la posición del logo con precisión (coordenadas, dimensiones máximas, alineación)? [Claridad, Spec §RF-016]
  > RF-016 dice "esquina superior izquierda o cabecera centrada". Las dos opciones están dadas.
- [x] CHK018 - ¿Está definida "misma línea visual que la app" con criterios medibles para el PDF? [Medibilidad, Spec §RF-015]
  > "Misma línea visual" = tipografía sobria + espaciado generoso + jerarquía clara (RF-015). Verificable: ¿el PDF se ve coherente con la app? Sí/No.
- [x] CHK019 - ¿Está cuantificada la diferenciación de la fila de total (negrita, tamaño mayor, fondo, separador)? [Claridad, Spec §RF-018]
  > RF-018 dice "total destacado respecto a los subtotales". El método concreto es implementación.
- [x] CHK020 - ¿Están definidos los tamaños/estilos de fuente específicos para el PDF (título, cuerpo, tabla, totales)? [Hueco]
  > La spec pide "tipografía sobria" y "jerarquía clara". Los pts exactos son decisión de implementación.

## Consistencia de requisitos

- [x] CHK021 - ¿Son los requisitos de estilo de campos de formulario consistentes con los formularios existentes de la spec 001? [Consistencia, Spec §RF-013]
  > RF-013 redefine los formularios. RF-020 dice "no modificar lógica" pero sí permite cambiar presentación. Consistente.
- [x] CHK022 - ¿Los requisitos de navegación son coherentes entre móvil y escritorio sin comportamientos conflictivos? [Consistencia, Spec §RF-005 vs §RF-007]
  > RF-005 y RF-007 son complementarios, no conflictivos. Sticky top confirmado en todas las resoluciones.
- [x] CHK023 - ¿Son consistentes los requisitos de espaciado entre la UI de la app y el layout del PDF? [Consistencia, Spec §RF-010 vs §RF-015]
  > RF-010 (app: uniforme) y RF-015 (PDF: generoso). No se contradicen — son contextos distintos.

## Cobertura de escenarios

- [x] CHK024 - ¿Están definidos requisitos para la transición del diseño antiguo al nuevo (referencia visual antes/después)? [Cobertura]
  > No se requiere referencia antes/después. La spec define el estado objetivo. RF-021 asegura que los datos persisten.
- [ ] CHK025 - ¿Están especificados los requisitos de navegación por teclado/foco para los elementos nuevos de la página de inicio? [Cobertura, Accesibilidad, Hueco]
  > Hueco real: no se menciona navegación por teclado. Se resuelve con HTML semántico (enlaces y botones nativos son accesibles por defecto).
- [x] CHK026 - ¿Están especificados los requisitos de cómo se actualiza el resumen del inicio al crear/eliminar items? [Cobertura]
  > Se calcula al cargar la página (lee de localStorage). Comportamiento estándar de React. No requiere requisito especial.
- [x] CHK027 - ¿Está definido el comportamiento cuando la página de inicio carga con conteos muy grandes (ej: 999 presupuestos)? [Caso límite]
  > No es un caso relevante para esta app (1 freelancer, ~50-100 presupuestos/año). No requiere especificación.

## Requisitos no funcionales

- [ ] CHK028 - ¿Están definidos los requisitos de ratio de contraste para accesibilidad (nivel WCAG)? [Accesibilidad, Hueco]
  > Hueco real: la spec no menciona WCAG. Para v0, implementar con contraste razonable (oscuros sobre claros) es suficiente.
- [ ] CHK029 - ¿Están especificados los requisitos de tamaño mínimo de zona táctil para elementos interactivos en móvil? [Accesibilidad, Hueco]
  > Hueco real: no se especifican zonas táctiles mínimas. Los paddings del sistema de espaciado ya garantizan zonas adecuadas.
- [x] CHK030 - ¿Están definidos los requisitos de rendimiento de carga de página tras el rediseño (presupuesto de peso CSS)? [Rendimiento]
  > No es necesario para esta feature. El CSS se sirve localmente y la app es una SPA ligera. CA-007 valida que funciona igual en móvil.

## Notas

- Marcar items `[x]` solo cuando la revisión confirma que el criterio de calidad del requisito está satisfecho.
- Dejar items sin marcar cuando aún requieren clarificación, corrección o evaluación.
- **3 items quedan sin marcar (CHK025, CHK028, CHK029)**: son huecos de accesibilidad (teclado, contraste WCAG, zona táctil). No bloquean v0 pero son mejoras deseables. Se resuelven con buenas prácticas de HTML semántico y paddings generosos.
