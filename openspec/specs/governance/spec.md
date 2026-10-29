# Governance Spec — FiadoApp

## Purpose

Reglas inquebrantables para cualquier cambio en el repositorio. Aplican a humanos y agentes.

## Requirements

### Commits en español con Conventional Commits

- Los commits se escriben en español.
- Formato: `tipo(scope): descripción en español`.
- Tipos permitidos: feat, fix, chore, docs, style, refactor, test, perf, ci, build, revert.
- Un commit = un propósito.

### Visto bueno obligatorio antes de commit

- Nunca se hace commit sin visto bueno explícito del mantenedor.
- Hook pre-commit bloquea sin aprobación vigente.
- Aprobación: scripts/approve-commit.sh (o .ps1).

### Visto bueno obligatorio antes de push

- Nunca se hace push sin visto bueno explícito del mantenedor.
- Hook pre-push bloquea sin aprobación.

### No push directo a master/main

- Nunca push directo a master/main.
- Todo entra por rama + Pull Request con revisión.
- Hook pre-push bloquea push a master/main.

### Límite de 250 líneas por archivo de código

- Ningún archivo de código fuente (incluye tests) supera 250 líneas.
- Documentación de referencia (skills, docs, markdown) exenta.
- Hook pre-commit valida archivos staged de código.

### Código junior-friendly

- Funciones pequeñas y con un solo propósito.
- Nombres descriptivos.
- Sin abstracciones prematuras ni magia.
- Comentarios del "por qué".
- Sin anidamiento profundo (máx 3 niveles).
- Sin funciones de más de ~40 líneas.

### SDD + Skills

- Fases SDD cargan skills de .agents/skills y del registry.
- El orquestador resuelve skills una vez por sesión y pasa rutas SKILL.md.
- Las reglas de este spec se inyectan como contexto a cada fase SDD.
