<#
.SYNOPSIS
    Build & publish MPOS (backend + frontend + storefront) ready for IIS deployment.

.DESCRIPTION
    Produces artifacts under `deploy/artifacts/`:
      - backend/    -> published .NET 8 app (self-contained folder)
      - frontend/   -> built React static files (Vite dist)
      - storefront/ -> Next.js standalone output

    Run from repo root:
        pwsh -File deploy\build.ps1

.PARAMETER Configuration
    Build configuration for the .NET project. Defaults to Release.

.PARAMETER SkipInstall
    Skip `npm ci` steps (useful on repeated builds).
#>
[CmdletBinding()]
param(
    [string]$Configuration = 'Release',
    [switch]$SkipInstall
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$artifactsDir = Join-Path $PSScriptRoot 'artifacts'

function Write-Step($msg) {
    Write-Host ""
    Write-Host "==> $msg" -ForegroundColor Cyan
}

Write-Step "Cleaning artifacts directory"
if (Test-Path $artifactsDir) { Remove-Item $artifactsDir -Recurse -Force }
New-Item -ItemType Directory -Path $artifactsDir | Out-Null

# -------- Backend (.NET 8) --------
Write-Step "Publishing backend (.NET 8) -> artifacts\backend"
$backendOut = Join-Path $artifactsDir 'backend'
Push-Location (Join-Path $repoRoot 'backend\MsCashier.API')
try {
    dotnet publish -c $Configuration -o $backendOut --nologo
    if ($LASTEXITCODE -ne 0) { throw "dotnet publish failed" }

    # Ensure logs folder exists so ASP.NET Core Module can write stdout
    New-Item -ItemType Directory -Path (Join-Path $backendOut 'logs') -Force | Out-Null

    # Copy the Production config template so the server operator knows what
    # to fill in. The real appsettings.Production.json is gitignored and
    # must be created on the server (see deploy\README.md).
    $templateSrc = 'appsettings.Production.json.template'
    if (Test-Path $templateSrc) {
        Copy-Item $templateSrc (Join-Path $backendOut $templateSrc) -Force
    }
}
finally { Pop-Location }

# -------- Frontend (React + Vite) --------
Write-Step "Building frontend (React + Vite) -> artifacts\frontend"
$frontendOut = Join-Path $artifactsDir 'frontend'
Push-Location (Join-Path $repoRoot 'frontend')
try {
    if (-not $SkipInstall) { npm ci }
    if ($LASTEXITCODE -ne 0) { throw "npm ci failed (frontend)" }

    npm run build
    if ($LASTEXITCODE -ne 0) { throw "npm run build failed (frontend)" }

    Copy-Item -Path 'dist\*' -Destination $frontendOut -Recurse -Force -Container
}
finally { Pop-Location }

# -------- Storefront (Next.js standalone) --------
Write-Step "Building storefront (Next.js standalone) -> artifacts\storefront"
$storefrontOut = Join-Path $artifactsDir 'storefront'
New-Item -ItemType Directory -Path $storefrontOut -Force | Out-Null

Push-Location (Join-Path $repoRoot 'storefront')
try {
    if (-not $SkipInstall) { npm ci }
    if ($LASTEXITCODE -ne 0) { throw "npm ci failed (storefront)" }

    npm run build
    if ($LASTEXITCODE -ne 0) { throw "npm run build failed (storefront)" }

    # Standalone layout: copy server + static + public into one runnable folder
    Copy-Item -Path '.next\standalone\*' -Destination $storefrontOut -Recurse -Force -Container
    New-Item -ItemType Directory -Path (Join-Path $storefrontOut '.next') -Force | Out-Null
    Copy-Item -Path '.next\static' -Destination (Join-Path $storefrontOut '.next\static') -Recurse -Force
    if (Test-Path 'public') {
        Copy-Item -Path 'public' -Destination (Join-Path $storefrontOut 'public') -Recurse -Force
    }
}
finally { Pop-Location }

Write-Step "Build complete"
Write-Host "Artifacts: $artifactsDir" -ForegroundColor Green
Write-Host "Next step: run deploy\deploy.ps1 on the Windows server" -ForegroundColor Yellow
