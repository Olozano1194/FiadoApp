#!/usr/bin/env pwsh
# Build script for FiadoApp Tauri desktop app
# This script: builds frontend, copies sidecar binary, builds MSI installer

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$FrontendDir = Join-Path $ProjectRoot "frontend"
$SrcTauriDir = Join-Path $FrontendDir "src-tauri"
$BinariesDir = Join-Path $SrcTauriDir "binaries"
$DistBackend = Join-Path $ProjectRoot "dist" "fiadoapp-backend"

Write-Host "=== FiadoApp Tauri Build ===" -ForegroundColor Cyan
Write-Host "Project root: $ProjectRoot"

# Step 1: Build PyInstaller backend (windowed mode)
Write-Host "[1/5] Building backend (PyInstaller)..." -ForegroundColor Yellow
Push-Location $ProjectRoot
try {
    & pyinstaller fiadoapp-windowed.spec --noconfirm
    if ($LASTEXITCODE -ne 0) { throw "PyInstaller build failed" }
} finally {
    Pop-Location
}

# Step 2: Build frontend
Write-Host "[2/5] Building frontend (Vite)..." -ForegroundColor Yellow
Push-Location $FrontendDir
try {
    & npm run build
    if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }
} finally {
    Pop-Location
}

# Step 3: Copy sidecar binary with target-triple suffix
Write-Host "[3/5] Copying sidecar binary..." -ForegroundColor Yellow
if (-not (Test-Path $BinariesDir)) {
    New-Item -ItemType Directory -Path $BinariesDir -Force | Out-Null
}

$targetTriple = "x86_64-pc-windows-msvc"
$sidecarName = "fiadoapp-backend-$targetTriple.exe"
$sidecarSource = Join-Path $DistBackend "fiadoapp-backend.exe"
$sidecarDest = Join-Path $BinariesDir $sidecarName

if (-not (Test-Path $sidecarSource)) {
    Write-Error "Sidecar binary not found at: $sidecarSource"
    Write-Error "Build the backend first with: pyinstaller fiadoapp-windowed.spec"
    exit 1
}

Copy-Item -Path $sidecarSource -Destination $sidecarDest -Force
Write-Host "  Copied: $sidecarDest"

# Also copy _internal folder (Python runtime dependencies)
$internalSrc = Join-Path $DistBackend "_internal"
$internalDest = Join-Path $BinariesDir "_internal"

if (-not (Test-Path $internalSrc)) {
    Write-Error "ERROR: _internal folder not found at: $internalSrc"
    Write-Error "El directorio _internal es REQUERIDO para que el sidecar funcione."
    exit 1
}

# Eliminar _internal anterior para evitar archivos desactualizados
if (Test-Path $internalDest) {
    Write-Host "  Limpiando _internal anterior..." -ForegroundColor Gray
    Remove-Item -Path $internalDest -Recurse -Force
}

Copy-Item -Path $internalSrc -Destination $BinariesDir -Recurse -Force
$internalCount = (Get-ChildItem -Path $internalDest -Recurse -File).Count
Write-Host "  Copied: _internal/ ($internalCount archivos)"

# Step 4: Limpiar cache de Tauri para evitar binarios desactualizados
Write-Host "[4/5] Limpiando cache de Tauri..." -ForegroundColor Yellow
$tauriReleaseDir = Join-Path $SrcTauriDir "target" "release"
if (Test-Path $tauriReleaseDir) {
    # Solo limpiar el bundle, no toda la compilacion Rust (eso tarda mucho)
    $bundleDir = Join-Path $tauriReleaseDir "bundle"
    if (Test-Path $bundleDir) {
        Remove-Item -Path $bundleDir -Recurse -Force
        Write-Host "  Cache de bundle limpiada."
    }
} else {
    Write-Host "  No hay cache previo."
}

# Step 5: Build Tauri MSI
Write-Host "[5/5] Building Tauri MSI installer..." -ForegroundColor Yellow
Push-Location $FrontendDir
try {
    & cargo tauri build
    if ($LASTEXITCODE -ne 0) { throw "Tauri build failed" }
} finally {
    Pop-Location
}

$msiPath = Join-Path $SrcTauriDir "target" "release" "bundle" "msi"
if (Test-Path $msiPath) {
    $msiFiles = Get-ChildItem -Path $msiPath -Filter "*.msi"
    Write-Host "" -ForegroundColor Cyan
    Write-Host "=== Build Complete ===" -ForegroundColor Green
    foreach ($msi in $msiFiles) {
        Write-Host "MSI: $($msi.FullName)" -ForegroundColor Green
    }
}