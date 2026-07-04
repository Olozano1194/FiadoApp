# Layout Component Tests Specification

## Purpose

Behavioral test coverage for layout components (SideBar). Specs define observable behavior: navigation links, active state highlighting, store config integration.

## Requirements

### Requirement: SideBar Navigation Links

SideBar SHALL render all 7 navigation links with correct labels and paths.

#### Scenario: All links present

- GIVEN SideBar renders
- WHEN DOM is inspected
- THEN 7 navigation links exist: Inicio, Inventario, Clientes/Fiados, Venta Rápida, Reportes, Cerrar Turno, Ajustes

#### Scenario: Link paths are correct

- GIVEN SideBar renders
- WHEN link "Inicio" is inspected
- THEN href is "/"

#### Scenario: Inventario path

- GIVEN SideBar renders
- WHEN link "Inventario" is inspected
- THEN href is "/inventario"

#### Scenario: Clientes path

- GIVEN SideBar renders
- WHEN link "Clientes/Fiados" is inspected
- THEN href is "/clientes"

#### Scenario: Venta Rápida path

- GIVEN SideBar renders
- WHEN link "Venta Rápida" is inspected
- THEN href is "/ventas"

#### Scenario: Reportes path

- GIVEN SideBar renders
- WHEN link "Reportes" is inspected
- THEN href is "/reportes"

#### Scenario: Cerrar Turno path

- GIVEN SideBar renders
- WHEN link "Cerrar Turno" is inspected
- THEN href is "/cierre"

#### Scenario: Ajustes path

- GIVEN SideBar renders
- WHEN link "Ajustes" is inspected
- THEN href is "/ajustes"

### Requirement: SideBar Active Highlight

SideBar SHALL apply active styling to the current route's link.

#### Scenario: Active link styled

- GIVEN current route is "/inventario"
- WHEN SideBar renders
- THEN "Inventario" link has class "bg-surface-container-high"
- AND other links do not have that class

#### Scenario: Non-active link unstyled

- GIVEN current route is "/"
- WHEN SideBar renders
- THEN "Inicio" link has active class
- AND "Inventario" link does not have active class

### Requirement: SideBar Store Config

SideBar SHALL display store name from config, falling back to "La Tiendita".

#### Scenario: Store name from config

- GIVEN storeConfig has name "Mi Tienda"
- WHEN SideBar renders
- THEN "Mi Tienda" is visible

#### Scenario: Fallback store name

- GIVEN storeConfig has no name
- WHEN SideBar renders
- THEN "La Tiendita" is visible

#### Scenario: Subtitle displayed

- GIVEN SideBar renders
- WHEN DOM is inspected
- THEN "Gestión de Negocio" subtitle is visible

### Requirement: SideBar Config Fetch

SideBar SHALL call fetchConfig on mount.

#### Scenario: Config loaded on mount

- GIVEN SideBar mounts
- WHEN component lifecycle completes
- THEN fetchConfig is called once
