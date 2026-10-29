param()
$ErrorActionPreference = "Stop"
$repoRoot = git rev-parse --show-toplevel
$approvalFile = Join-Path $repoRoot ".git\approval-commit"

$staged = git diff --cached
if ([string]::IsNullOrWhiteSpace($staged)) {
    Write-Host "No hay cambios staged. Agrega archivos con 'git add' primero." -ForegroundColor Yellow
    exit 1
}

$hash = ($staged | Out-String | Get-FileHash -Algorithm SHA256).Hash.ToLower()
Set-Content -Path $approvalFile -Value $hash -NoNewline
Write-Host "Visto bueno de commit registrado." -ForegroundColor Green
Write-Host "Hash: $hash"
Write-Host "Ahora puedes hacer: git commit -m `"tipo(scope): descripcion en espanol`""
