# AGENTS.md

## Qué es

Aplicación web SPA para que un freelancer español cree presupuestos profesionales y los descargue en PDF, sin servidor ni backend.

## Stack

| Capa | Tecnología | Notas |
|------|-----------|-------|
| UI | React 19 + TypeScript 6 | Componentes por dominio en `src/components/` |
| Bundler | Vite 8 | Dev server + build estática |
| PDF | jsPDF + jsPDF-AutoTable | Generación 100% en cliente |
| Routing | react-router-dom 7 | SPA con rutas declarativas |
| Storage | localStorage | Cero backend, offline-capable |
| Tests | Vitest + React Testing Library + jsdom | Tests en `tests/` |
| CSS | Variables CSS nativas | Sin librerías de utilidad |

**Decisiones vigentes**: sin backend, sin auth, sin i18n, moneda EUR fija, diseño responsive con CSS puro, lógica de negocio aislada en `services/`.

## Arranque y pruebas

```bash
npm install          # instalar dependencias
npm run dev          # dev server en http://localhost:5173
npm run test         # correr tests una vez
npm run test:watch   # tests en modo watch
npm run build        # build de producción
```

## Convenciones

- Idioma: español de España en toda la UI, mensajes y docs.
- Estructura: componentes en `src/components/{Dominio}/`, lógica en `src/services/`, storage en `src/storage/`.
- Principio rector: simplicidad — la solución más simple que funcione.
- No implementar nada que no esté especificado (ver constitución).
- Tests obligatorios para lógica de negocio (`services/`).
- Commits atómicos; un commit por tarea lógica.

---

Las reglas de producto viven en `.specify/memory/constitution.md` y el estado del producto en `specs/README.md`.
