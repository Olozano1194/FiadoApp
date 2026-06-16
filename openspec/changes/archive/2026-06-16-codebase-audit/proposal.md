# Proposal: Codebase Audit — Clean Up Technical Debt

## Intent

The codebase accumulated ~41 code quality issues: dead imports, missing pagination, duplicated functions, silenced errors, `any` types, and hardcoded values. These don't break the app today but will cause problems as data grows and the team iterates. This change removes the debt before it compounds.

## Scope

### In Scope — HIGH Priority
- Add pagination to `ClientViewSet`, `ProductViewSet`, `ExpenseViewSet`, `FiadoPaymentViewSet`
- Frontend adapters to handle paginated API responses (wrapper object)

### In Scope — MEDIUM Priority
- Remove all dead/unused imports (backend + frontend)
- Consolidate duplicated `formatCurrency` (15+ inline copies → single util)
- Fix `any` types in `ProductsPage.tsx`
- Replace hardcoded `HEALTH_CHECK_URL` with shared `API_BASE_URL`
- Add visible error handling to Zustand stores (instead of silent catches)
- Replace `print()` with `logging` in `backup_utils.py`
- Fix `read_only_fields` fragility in `CashClosureSerializer`

### In Scope — LOW Priority (grouped)
- Commented-out code blocks, missing type hints, `"use no memo"` directive, CSV→XLSX labels, duplicate toast styles, `.env.example`

### Out of Scope
- Fase 3 Backup a Supabase (separate change)
- Performance optimization of aggregation queries (N+1 items are low-severity)
- New features or UI changes

## Capabilities

### New Capabilities
None — pure refactor, no new behavior.

### Modified Capabilities
None — no spec-level behavior changes. Pagination changes the API response shape (adds `count`, `next`, `previous`, `results` wrapper) but existing fields are preserved; frontend already has pagination handling from the `SaleViewSet.history` pattern.

## Approach

Group fixes by type, one commit per group:
1. **Pagination**: Add `pagination_class` to all list viewsets, create shared `StandardPagination` class
2. **Dead imports**: Scan and remove all unused imports
3. **formatCurrency**: Create `frontend/src/utils/format.ts`, update 15+ imports
4. **HEALTH_CHECK_URL**: Import from axios config
5. **Store error handling**: Add error state + toast to all stores
6. **Remaining medium/low**: group into a cleanup commit

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `coreApp/views.py` | Modified | Pagination classes + dead imports |
| `coreApp/serializers.py` | Modified | read_only_fields fix |
| `coreApp/backup_utils.py` | Modified | print → logging |
| `coreApp/urls.py` | Modified | Dead import removal |
| `config/settings.py` | Modified | Dead import removal |
| `backend_server.py` | Modified | HOST/PORT env vars |
| `frontend/src/App.tsx` | Modified | HEALTH_CHECK_URL |
| `frontend/src/pages/ProductsPage.tsx` | Modified | any types |
| `frontend/src/utils/format.ts` | New | formatCurrency util |
| `frontend/src/**/*.tsx` | Modified | formatCurrency imports |
| `frontend/src/stores/*.ts` | Modified | Error handling |
| Various components | Modified | Dead imports, commented code |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Pagination breaks frontend list views | Medium | Copy existing pagination pattern from SaleViewSet.history; test each affected page |
| Store error changes break UX | Low | One store at a time, verify with manual test |
| formatCurrency refactor misses a usage | Low | grep for all `formatCurrency(` definitions before/after |

## Rollback Plan

Each group is a separate conventional commit. Revert individual commits if something breaks:
```
git revert <pagination-commit>
git revert <formatCurrency-commit>
```

## Dependencies

- None — pure code changes, no new packages.

## Success Criteria

- [ ] All list endpoints return paginated responses with `count`/`next`/`previous`/`results`
- [ ] Frontend renders paginated lists correctly (Clients, Products, Expenses)
- [ ] Zero dead imports in `coreApp/views.py`, `urls.py`, `settings.py`, `backup_utils.py`
- [ ] `formatCurrency` exists in exactly one file; all components import from it
- [ ] `HEALTH_CHECK_URL` references `API_BASE_URL` instead of hardcoded string
- [ ] All Zustand stores surface errors visibly (toast or error state)
- [ ] `ProductsPage.tsx` has zero `as any` casts
- [ ] Working tree clean after all commits
