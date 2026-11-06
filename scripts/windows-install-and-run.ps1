$ErrorActionPreference = 'Stop'

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

Write-Host "Rasvani project: $ProjectRoot" -ForegroundColor Cyan

$node = Get-Command node -ErrorAction SilentlyContinue
$npm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $node -or -not $npm) {
    throw "Node.js/npm not found. Install Node.js 20.19+ (LTS recommended), reopen PowerShell, then run this script again."
}

$nodeVersionText = (& node --version).Trim().TrimStart('v')
$nodeVersion = [version]$nodeVersionText
if ($nodeVersion -lt [version]'20.19.0') {
    throw "Node.js $nodeVersionText found. This project setup requires Node.js 20.19.0 or newer."
}

Write-Host "Node: $nodeVersionText"
Write-Host "npm: $(& npm --version)"

if (-not (Test-Path (Join-Path $ProjectRoot 'package.json'))) {
    throw "Root package.json not found. Run this script from the extracted Rasvani_Project/scripts folder."
}

if (-not (Test-Path (Join-Path $ProjectRoot 'apps/web/.env.local'))) {
    Write-Warning "apps/web/.env.local is absent. Public pages may load, but Supabase-backed records/auth will not be live. Copy apps/web/.env.example to apps/web/.env.local and add your own development Supabase URL/public key if available. Never use a service-role secret in browser variables."
}

Write-Host "Installing dependencies from the project root..." -ForegroundColor Yellow
& npm install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) {
    throw "npm install failed with exit code $LASTEXITCODE. Keep the full output and check internet/DNS/proxy access; do not delete project files to work around it."
}

Write-Host "Starting the existing Rasvani Next.js app..." -ForegroundColor Green
Write-Host "Open http://localhost:3000 after the server is ready. Press Ctrl+C to stop it."
& npm run dev
exit $LASTEXITCODE
