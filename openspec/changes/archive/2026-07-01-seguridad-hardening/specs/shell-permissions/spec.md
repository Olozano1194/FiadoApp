# Shell Permissions Specification

## Purpose

Restrict Tauri shell permissions so the webview CANNOT execute arbitrary commands. The sidecar launches from Rust, not JS.

## Requirements

### Requirement: Frontend Shell Permissions Scoped

The system SHALL NOT grant `shell:allow-execute`, `shell:allow-spawn`, `shell:allow-stdin-write`, or `shell:allow-kill` to the webview. The file `frontend/src-tauri/capabilities/default.json` SHALL only include `core:default` and `shell:allow-open` (for tauri-plugin-opener).

#### Scenario: Arbitrary command blocked

- GIVEN the webview loads FiadoApp
- WHEN `window.__TAURI__.shell.execute('calc.exe')` is called from browser console
- THEN the call fails with a permission denied error
- AND no external process is spawned

#### Scenario: Sidecar still launches

- GIVEN Tauri starts the application
- WHEN the Rust setup handler runs `shell.sidecar("fiadoapp-backend")`
- THEN the Django backend process starts successfully
- AND the webview can communicate with the backend via HTTP

#### Scenario: Open URLs still works

- GIVEN the user clicks a link that triggers `shell:allow-open`
- WHEN the open action is invoked
- THEN the URL opens in the system default browser
