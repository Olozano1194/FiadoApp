# Delta for critical-component-tests

## Overview

Adds behavioral test specifications for POS, auth, and layout components. All capabilities are NEW — full specs created (no deltas).

## Specs Written

| Domain | Type | Path |
|--------|------|------|
| component-test-pos | New | `openspec/specs/component-test-pos/spec.md` |
| component-test-auth | New | `openspec/specs/component-test-auth/spec.md` |
| component-test-layout | New | `openspec/specs/component-test-layout/spec.md` |

## Coverage Summary

| Component | Requirements | Scenarios |
|-----------|-------------|-----------|
| CartPanel | 5 | 12 |
| PaymentBar | 5 | 10 |
| ProductSearch | 2 | 2 |
| LoginPage | 8 | 14 |
| ProtectedRoute | 2 | 3 |
| SideBar | 4 | 13 |
| **Total** | **26** | **54** |

## Coverage Matrix

| Category | Status |
|----------|--------|
| Happy paths | Covered |
| Edge cases | Covered (stock limit, empty states, negative profit) |
| Error states | Covered (login failure, empty cart, insufficient cash, missing client) |
| Loading states | Covered (payment submit, login submit) |

## Next Step

Ready for design (sdd-design). If design already exists, ready for tasks (sdd-tasks).
