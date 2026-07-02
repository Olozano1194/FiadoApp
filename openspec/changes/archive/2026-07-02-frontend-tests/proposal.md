# Proposal: Frontend Testing Infrastructure

## Intent

Add regression coverage and refactoring confidence by building a testing pyramid for FiadoApp's frontend. Currently 9 Zustand stores and 13 API modules have zero tests, making refactoring risky.

## Scope

### In Scope

- Test infrastructure: `package.json` scripts, vitest config, `test-utils.tsx`, Tauri plugin-store global mock
- Expand existing util tests (`format`, `toastStyles`)
- All 9 stores — test loading/success/error for every async action
- All 13 API modules — test URL formatting, FormData, error passthrough

### Out of Scope

- Component/page/integration tests (deferred)
- MSW or snapshot testing
- Coverage thresholds (start at 0%)

## Capabilities

### New Capabilities

None — testing infrastructure only, no user-facing behavior changes.

### Modified Capabilities

None — no spec-level behavior changes.

## Approach

Three phases: (1) Foundation — test scripts, vitest config, `test-utils.tsx`, Tauri mock; (2) Stores — test each via `getState()/setState()`, mock API modules with `vi.mock`; (3) API modules — mock the shared Axios instance, verify URLs and payloads.

Mocking: `vi.mock` for Axios at module level. Global `vi.mock` for `@tauri-apps/plugin-store`. `react-hot-toast` mocked per file where stores call toast.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/package.json` | Modified | Add 4 test scripts |
| `frontend/vitest.config.ts` | Modified | Add `include`, `coverage` |
| `frontend/src/test/test-utils.tsx` | New | Custom render + MemoryRouter |
| `frontend/src/test/mocks/tauri-plugin-store.ts` | New | Global `@tauri-apps/plugin-store` mock |
| `frontend/src/utils/__tests__/format.test.ts` | Modified | Expand cases |
| `frontend/src/utils/__tests__/toastStyles.test.ts` | Modified | Expand cases |
| `frontend/src/stores/__tests__/*.test.ts` (9 files) | New | Store tests |
| `frontend/src/api/__tests__/*.test.ts` (13 files) | New | API tests |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Zustand v5 API mismatch | Low | Verify one store manually first |
| Tauri dynamic import mock timing | Medium | Global mock + localStorage fallback |
| TailwindCSS classes in jsdom | Low | Test behavior, not CSS classes |

## Rollback Plan

Remove test scripts from `package.json`, revert `vitest.config.ts`, delete `test-utils.tsx` and `mocks/`, delete all `__tests__/` directories. Purely additive — no production code changes.

## Dependencies

All already installed: Vitest 4, `@testing-library/react` 16, `@testing-library/user-event` 14, jsdom 29.

## Success Criteria

- [ ] `npm test` passes for all test files
- [ ] Every store has tests for loading/success/error on each async action
- [ ] Every API module has tests for request URLs and error passthrough
- [ ] Tauri plugin-store mock works without Tauri installed
- [ ] `npm run test:coverage` produces output without errors
