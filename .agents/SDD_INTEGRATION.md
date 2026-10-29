# SDD + Skills Integration — FiadoApp

## Regla

Toda fase SDD (`/sdd-explore`, `/sdd-new`, `/sdd-propose`, `/sdd-spec`, `/sdd-design`,
`/sdd-tasks`, `/sdd-apply`, `/sdd-verify`, `/sdd-archive`) DEBE:

1. Resolver skills del registry (`.atl/skill-registry.md`) una vez por sesión.
2. Pasar las rutas `SKILL.md` relevantes a cada sub-agente bajo `## Skills to load before work`.
3. Cargar siempre `fiadoapp-governance` (`.agents/skills/fiadoapp-governance/SKILL.md`).
4. Cargar skills por stack:
   - Backend Django/DRF → `django-expert`, `django-patterns`, `django-security`.
   - Frontend React/TS → `react-patterns`, `frontend-design`, `typescript-advanced-types`.
   - Tests → `python-testing-patterns` o el equivalente del stack.
   - Accesibilidad/UI → `accessibility`.
   - Docs → `cognitive-doc-design`.
5. Verificar al final de la fase que las skills relevantes se aplicaron (reportar `skill_resolution`).
6. Respetar las reglas de `AGENTS.md` (commits en español, visto bueno, 250 líneas, junior-friendly).

## Orquestador

El orquestador (gentle-orchestrator) es el único que lanza sub-agentes. Los sub-agentes
reciben contexto fresco y NO buscan engram por su cuenta; el orquestador pasa las referencias.
