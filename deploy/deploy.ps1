<#
.SYNOPSIS
    Deploy pre-built MPOS artifacts onto the local Windows/IIS server.

.DESCRIPTION
    Stops the IIS app pool and storefront service, copies freshly built artifacts
    from `deploy\artifacts\` to C:\inetpub\mpos\, then restarts everything.

    Run as Administrator on the target server:
        pwsh -File deploy\deploy.ps1

.PARAMETER DeployRoot
    Root directory on the server where MPOS is installed.
    Defaults to C:\inetpub\mpos.

.PARAMETER BackendAppPool
    Name of the IIS application pool hosting the .NET API.
    Defaults to mpos-api.

.PARAMETER StorefrontService
    Name of the Windows service hosting the Next.js storefront.
    Defaults to mpos-storefront.

.PARAMETER FrontendSite
    Name of the IIS site serving the React SPA.
    Defaults to mpos.
#>
[CmdletBinding()]
param(
    [string]$DeployRoot         = 'C:\inetpub\mpos',
    [string]$BackendAppPool     = 'mpos-api',
    [string]$BackendSite        = 'mpos-api',
    [string]$StorefrontService  = 'mpos-storefront',
    [string]$FrontendSite       = 'mpos'
)

$ErrorActionPreference = 'Stop'
$artifactsDir = Join-Path $PSScriptRoot 'artifacts'

function Write-Step($msg) {
    Write-Host ""
    Write-Host "==> $msg" -ForegroundColor Cyan
}

if (-not (Test-Path $artifactsDir)) {
    throw "artifacts\ not found. Run deploy\build.ps1 first (on your dev machine, then copy to server)."
}

# --- Ensure running as Administrator ---
$isAdmin = ([Security.Principal.WindowsPrincipal] `
    [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) { throw "Run this script as Administrator." }

Import-Module WebAdministration -ErrorAction SilentlyContinue

# --- Stop services/app pools before copying ---
Write-Step "Stopping services"
if (Get-Service -Name $StorefrontService -ErrorAction SilentlyContinue) {
    Stop-Service -Name $StorefrontService -Force -ErrorAction SilentlyContinue
}
if (Test-Path "IIS:\Sites\$BackendSite") {
    try { Stop-Website -Name $BackendSite } catch { }
}
if (Test-Path "IIS:\AppPools\$BackendAppPool") {
    $state = (Get-WebAppPoolState -Name $BackendAppPool).Value
    if ($state -eq 'Started') { Stop-WebAppPool -Name $BackendAppPool }
}
if (Test-Path "IIS:\Sites\$FrontendSite") {
    try { Stop-Website -Name $FrontendSite } catch { }
}

Start-Sleep -Seconds 2

# --- Snapshot current deploy for rollback ---
$snapshotRoot = Join-Path (Split-Path -Parent $DeployRoot) 'mpos-snapshots'
if (-not (Test-Path $snapshotRoot)) { New-Item -ItemType Directory -Path $snapshotRoot -Force | Out-Null }

if (Test-Path $DeployRoot) {
    $ts = Get-Date -Format 'yyyyMMdd-HHmmss'
    $snapshotDir = Join-Path $snapshotRoot $ts
    Write-Step "Snapshotting current deploy -> $snapshotDir (for rollback)"
    robocopy $DeployRoot $snapshotDir /E /NFL /NDL /NJH /NJS /NP /R:2 /W:2 | Out-Null
    if ($LASTEXITCODE -ge 8) {
        Write-Warning "Snapshot failed (robocopy exit $LASTEXITCODE) — continuing without snapshot"
    }

    # Retention: keep last 3 snapshots only
    $snapshots = Get-ChildItem -Path $snapshotRoot -Directory | Sort-Object Name -Descending
    if ($snapshots.Count -gt 3) {
        $snapshots | Select-Object -Skip 3 | ForEach-Object {
            Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "  pruned old snapshot: $($_.Name)" -ForegroundColor DarkGray
        }
    }
}

# --- Prepare deploy directories ---
Write-Step "Preparing directories under $DeployRoot"
$backendDir    = Join-Path $DeployRoot 'backend'
$frontendDir   = Join-Path $DeployRoot 'frontend'
$storefrontDir = Join-Path $DeployRoot 'storefront'

foreach ($d in @($DeployRoot, $backendDir, $frontendDir, $storefrontDir)) {
    if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
}

function Sync-Directory($source, $destination, $excludes = @()) {
    if (-not (Test-Path $source)) { throw "Source missing: $source" }

    # Keep appsettings.Production.json on server (operator-managed secrets)
    $robocopyArgs = @($source, $destination, '/MIR', '/NFL', '/NDL', '/NJH', '/NJS', '/NP', '/R:2', '/W:2')
    foreach ($e in $excludes) { $robocopyArgs += @('/XF', $e) }

    robocopy @robocopyArgs | Out-Null
    # Robocopy exit codes < 8 are success
    if ($LASTEXITCODE -ge 8) { throw "robocopy failed ($LASTEXITCODE) copying $source -> $destination" }
}

Write-Step "Syncing backend (preserving appsettings.Production.json)"
Sync-Directory -source (Join-Path $artifactsDir 'backend') `
               -destination $backendDir `
               -excludes @('appsettings.Production.json')

Write-Step "Syncing frontend"
Sync-Directory -source (Join-Path $artifactsDir 'frontend') -destination $frontendDir

Write-Step "Syncing storefront (preserving .env.production)"
Sync-Directory -source (Join-Path $artifactsDir 'storefront') `
               -destination $storefrontDir `
               -excludes @('.env.production', '.env')

# --- Start everything back up ---
Write-Step "Starting services"
if (Test-Path "IIS:\AppPools\$BackendAppPool") { Start-WebAppPool -Name $BackendAppPool }
if (Test-Path "IIS:\Sites\$BackendSite")       { Start-Website -Name $BackendSite }
if (Test-Path "IIS:\Sites\$FrontendSite")      { Start-Website -Name $FrontendSite }
if (Get-Service -Name $StorefrontService -ErrorAction SilentlyContinue) {
    Start-Service -Name $StorefrontService
}

Write-Step "Waiting for services to warm up"
Start-Sleep -Seconds 5

# Run smoke test (skip public checks — may not have DNS yet on first deploy)
$verifyScript = Join-Path $PSScriptRoot 'verify.ps1'
if (Test-Path $verifyScript) {
    Write-Step "Running post-deploy smoke test"
    & $verifyScript -SkipPublic
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Smoke test reported failures. Re-run with: pwsh -File deploy\verify.ps1"
    }
}

Write-Step "Deployment complete"
Write-Host "Frontend:   https://mops.mmit.sa"         -ForegroundColor Green
Write-Host "Storefront: https://mops.mmit.sa/store"   -ForegroundColor Green
Write-Host "API:        http://127.0.0.1:5000 (via IIS reverse-proxy as /api/*)" -ForegroundColor Green
