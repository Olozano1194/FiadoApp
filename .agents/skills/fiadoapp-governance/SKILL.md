---
name: fiadoapp-governance
description: Reglas de gobernanza de FiadoApp. Trigger: cualquier cambio, commit, push, PR, SDD phase, o revisión de código en este repo.
---

# FiadoApp Governance Skill

Aplica SIEMPRE que se trabaje en este repositorio.

## Reglas inquebrantables

1. **Commits en español** con Conventional Commits: `tipo(scope): descripción`.
2. **Visto bueno obligatorio** antes de commit y antes de push (hooks bloquean).
3. **No push directo a master/main**: todo entra por rama + PR.
3. **Máximo 250 líneas** por archivo (incluye tests).
4. **Código junior-friendly**: funciones pequeñas, nombres descriptivos, sin magia, comentarios del "por qué".
5. **SDD + skills**: cargar skills de `.agents/skills` y del registry según contexto.

## SDD integration

- Al ejecutar cualquier fase `/sdd-*`, resolver skills del registry (`.atl/skill-registry.md`) y pasar rutas `SKILL.md` a sub-agentes.
- Cargar además esta skill y las relevantes por stack (django-expert, react-patterns, python-testing-patterns, etc.).
- Verificar al final de cada fase que las skills relevantes se aplicaron.

## Flujo

Explorar → implementar (código claro) → tests → mostrar resumen+diff → aprobar commit → commit → aprobar push → push.

## No hacer

- Commits sin aprobación.
- Push sin aprobación.
- Archivos >250 líneas.
- Código avanzado/crítico no justificado.
- Mezclar propósitos en un commit.
