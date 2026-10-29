param()
$ErrorActionPreference = "Stop"
$repoRoot = git rev-parse --show-toplevel
$approvalFile = Join-Path $repoRoot ".git\approval-push"

$head = git rev-parse HEAD
Set-Content -Path $approvalFile -Value $head -NoNewline
Write-Host "Visto bueno de push registrado." -ForegroundColor Green
Write-Host "HEAD: $head"
Write-Host "Ahora puedes hacer: git push"
