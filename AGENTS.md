# AGENTS.md — Gobernanza del proyecto FiadoApp

Este archivo define las reglas inquebrantables para cualquier cambio en el repositorio.
Todo agente (humano o IA) que modifique código DEBE cumplirlas. Las reglas marcadas como
INQUEBRANTABLES no admiten excepciones sin aprobación explícita del mantenedor.

## 1. Idioma y formato de commits (INQUEBRANTABLE)

- Los commits se escriben en **español**.
- Se usa **Conventional Commits**: `tipo(scope): descripción en español`.
- Tipos permitidos: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`, `perf`, `ci`, `build`, `revert`.
- El scope es opcional pero recomendado (ej. `frontend`, `backend`, `api`).
- La descripción va en minúsculas y sin punto final, en español claro.
- Ejemplo: `feat(frontend): agregar filtro de clientes por estado de cuenta`.
- Un commit = un propósito. No mezclar refactors con features.

## 2. Visto bueno obligatorio antes de commit (INQUEBRANTABLE)

- **Nunca** se hace commit sin el visto bueno explícito del mantenedor.
- Flujo: implementar → mostrar diff/resumen → esperar aprobación → commit.
- El hook `pre-commit` bloquea cualquier commit que no tenga aprobación vigente.
- Para aprobar: `scripts/approve-commit.sh` (o `.ps1` en Windows) genera el token de aprobación
  vinculado al diff staged. La aprobación expira si el staged cambia.

## 3. Visto bueno obligatorio antes de push (INQUEBRANTABLE)

- **Nunca** se hace push sin el visto bueno explícito del mantenedor.
- El hook `pre-push` bloquea el push hasta que se apruebe explícitamente.
- Para aprobar: `scripts/approve-push.sh` (o `.ps1`).

## 4. Límite de tamaño por archivo (INQUEBRANTABLE)

- Ningún archivo de **código fuente** nuevo o modificado puede superar **250 líneas**, incluyendo tests.
- La documentación de referencia (skills, docs, markdown) queda exenta por ser material de consulta.
- Si una funcionalidad requiere más, se divide en varios archivos/módulos.
- El hook `pre-commit` valida el conteo de líneas de los archivos staged de código.

## 5. Código comprensible para un junior (INQUEBRANTABLE)

- El código debe poder ser entendido, explicado y modificado por un desarrollador junior
  sin ayuda extensa.
- Reglas:
  - Preferir funciones pequeñas y con un solo propósito.
  - Nombres descriptivos en el idioma del proyecto (español para dominio, inglés para código infra).
  - Evitar abstracciones prematuras, patrones avanzados no necesarios y "magia".
  - Comentarios que expliquen el **por qué**, no el **qué**.
  - Sin anidamiento profundo (máx. 3 niveles).
  - Sin funciones de más de ~40 líneas.
  - Tests claros que documenten el comportamiento esperado.
  - Evitar one-liners crípticos; preferir claridad sobre brevedad.

## 6. SDD + Skills (INQUEBRANTABLE)

- Cuando se ejecuten fases SDD (`/sdd-*`), se DEBEN cargar y seguir las skills de `.agents/skills`
  que correspondan al contexto (django, react, testing, etc.) y las del registry de usuario.
- El orquestador resuelve skills del registry una vez por sesión y pasa las rutas `SKILL.md`
  a cada sub-agente antes de trabajar.
- Ninguna fase SDD se considera completa si no se verificó que las skills relevantes se aplicaron.
- Las reglas de este archivo se inyectan como contexto a cada fase SDD.

## 7. Reglas adicionales del arquitecto senior

- **Un propósito por PR/commit.** No mezclar features, fixes y refactors.
- **Tests acompañan al código.** Toda lógica nueva lleva test; no se mergea sin cobertura del camino feliz y un caso de error.
- **Sin secretos en el repo.** `.env`, claves, tokens nunca se commitean (ver `.gitignore`).
- **Migraciones de DB revisadas.** Toda migración se inspecciona antes de aplicar en producción.
- **No merge sin revisión.** Al menos un par de ojos (humano o revisor IA) antes de mergear.
- **Consistencia de estilo.** Respetar el estilo existente del archivo tocado; no reformatar archivos ajenos.
- **Cambios mínimos.** No "arreglar" código no relacionado en el mismo cambio.
- **Documentar decisiones.** Decisiones de arquitectura se guardan en engram/memoria con `mem_save`.
- **Rollback claro.** Cada cambio debe poder revertirse con un solo commit revert.
- **No tocar lo que no se entiende.** Si no se entiende un módulo, primero explorar, luego modificar.

## 8. Flujo de trabajo recomendado

1. Explorar el código relevante (delegar si son 4+ archivos).
2. Implementar con cambios mínimos y código junior-friendly.
3. Ejecutar tests y verificación.
4. Mostrar resumen + diff al mantenedor.
5. Obtener visto bueno → `scripts/approve-commit.sh`.
6. Commit en español con conventional commits.
7. Obtener visto bueno para push → `scripts/approve-push.sh`.
8. Push.

## 9. Activación de hooks

```bash
git config core.hooksPath .githooks
```

Los hooks viven en `.githooks/` y son parte del repo. No se usan hooks globales.
