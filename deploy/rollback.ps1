<#
.SYNOPSIS
    Roll back the last (or a specific) MPOS deployment.

.DESCRIPTION
    Restores C:\inetpub\mpos from a snapshot taken by deploy\deploy.ps1.
    Snapshots are stored under C:\inetpub\mpos-snapshots\<yyyyMMdd-HHmmss>\.

    List available snapshots:
        pwsh -File deploy\rollback.ps1 -List

    Roll back to the most recent snapshot:
        pwsh -File deploy\rollback.ps1

    Roll back to a specific snapshot:
        pwsh -File deploy\rollback.ps1 -Snapshot 20260415-143022

.PARAMETER DeployRoot
    MPOS root. Defaults to C:\inetpub\mpos.
.PARAMETER SnapshotRoot
    Snapshot storage. Defaults to C:\inetpub\mpos-snapshots.
.PARAMETER Snapshot
    Specific snapshot folder name. Defaults to the most recent.
.PARAMETER List
    Print available snapshots and exit.
.PARAMETER BackendAppPool / BackendSite / StorefrontService / FrontendSite
    IIS/service names (match deploy.ps1 defaults).
#>
[CmdletBinding()]
param(
    [string]$DeployRoot        = 'C:\inetpub\mpos',
    [string]$SnapshotRoot      = 'C:\inetpub\mpos-snapshots',
    [string]$Snapshot,
    [switch]$List,
    [string]$BackendAppPool    = 'mpos-api',
    [string]$BackendSite       = 'mpos-api',
    [string]$StorefrontService = 'mpos-storefront',
    [string]$FrontendSite      = 'mpos'
)

$ErrorActionPreference = 'Stop'

function Write-Step($msg) {
    Write-Host ""
    Write-Host "==> $msg" -ForegroundColor Cyan
}

$isAdmin = ([Security.Principal.WindowsPrincipal] `
    [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) { throw "Run as Administrator." }

if (-not (Test-Path $SnapshotRoot)) {
    throw "No snapshots directory found at $SnapshotRoot. Nothing to roll back to."
}

$snapshots = Get-ChildItem -Path $SnapshotRoot -Directory |
             Sort-Object Name -Descending

if ($List) {
    Write-Host ""
    Write-Host "Available snapshots (newest first):" -ForegroundColor Cyan
    if (-not $snapshots) {
        Write-Host "  (none)" -ForegroundColor DarkGray
    } else {
        $snapshots | ForEach-Object {
            $sizeMb = [math]::Round((Get-ChildItem $_.FullName -Recurse -File |
                                     Measure-Object Length -Sum).Sum / 1MB, 1)
            Write-Host ("  {0}  ({1:yyyy-MM-dd HH:mm})  {2} MB" -f `
                        $_.Name, $_.LastWriteTime, $sizeMb) -ForegroundColor Green
        }
    }
    Write-Host ""
    Write-Host "Roll back with: pwsh -File deploy\rollback.ps1 -Snapshot <name>" -ForegroundColor Yellow
    return
}

# Resolve snapshot
if (-not $snapshots) { throw "No snapshots found in $SnapshotRoot." }
$target = if ($Snapshot) {
    $match = $snapshots | Where-Object Name -eq $Snapshot | Select-Object -First 1
    if (-not $match) { throw "Snapshot '$Snapshot' not found. Use -List to see options." }
    $match
} else {
    $snapshots | Select-Object -First 1
}

Write-Host ""
Write-Host "Rolling back:" -ForegroundColor Yellow
Write-Host "  from: $DeployRoot" -ForegroundColor Yellow
Write-Host "  to:   $($target.FullName) ($($target.LastWriteTime))" -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "Continue? (y/N)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "Cancelled." -ForegroundColor DarkGray
    return
}

Import-Module WebAdministration -ErrorAction SilentlyContinue

# --- Stop services/sites ---
Write-Step "Stopping services"
if (Get-Service -Name $StorefrontService -ErrorAction SilentlyContinue) {
    Stop-Service -Name $StorefrontService -Force -ErrorAction SilentlyContinue
}
if (Test-Path "IIS:\Sites\$BackendSite")  { try { Stop-Website -Name $BackendSite  } catch {} }
if (Test-Path "IIS:\Sites\$FrontendSite") { try { Stop-Website -Name $FrontendSite } catch {} }
if (Test-Path "IIS:\AppPools\$BackendAppPool") {
    $state = (Get-WebAppPoolState -Name $BackendAppPool).Value
    if ($state -eq 'Started') { Stop-WebAppPool -Name $BackendAppPool }
}
Start-Sleep -Seconds 2

# --- Restore via robocopy /MIR (exact mirror of snapshot) ---
# Preserve Production config on current deploy — operator secrets.
$preserveList = @(
    'backend\appsettings.Production.json',
    'storefront\.env.production',
    'storefront\.env'
)
$tempPreserve = Join-Path $env:TEMP "mpos-rollback-preserve-$(Get-Random)"
New-Item -ItemType Directory -Path $tempPreserve -Force | Out-Null

foreach ($rel in $preserveList) {
    $src = Join-Path $DeployRoot $rel
    if (Test-Path $src) {
        $dst = Join-Path $tempPreserve $rel
        New-Item -ItemType Directory -Path (Split-Path $dst -Parent) -Force | Out-Null
        Copy-Item $src $dst -Force
        Write-Host "  preserved: $rel" -ForegroundColor DarkGray
    }
}

Write-Step "Restoring snapshot"
robocopy $target.FullName $DeployRoot /MIR /NFL /NDL /NJH /NJS /NP /R:2 /W:2 | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy failed (exit $LASTEXITCODE)" }

# Restore preserved files back on top
foreach ($rel in $preserveList) {
    $src = Join-Path $tempPreserve $rel
    if (Test-Path $src) {
        $dst = Join-Path $DeployRoot $rel
        New-Item -ItemType Directory -Path (Split-Path $dst -Parent) -Force | Out-Null
        Copy-Item $src $dst -Force
    }
}
Remove-Item $tempPreserve -Recurse -Force -ErrorAction SilentlyContinue

# --- Restart services ---
Write-Step "Starting services"
if (Test-Path "IIS:\AppPools\$BackendAppPool") { Start-WebAppPool -Name $BackendAppPool }
if (Test-Path "IIS:\Sites\$BackendSite")       { Start-Website -Name $BackendSite }
if (Test-Path "IIS:\Sites\$FrontendSite")      { Start-Website -Name $FrontendSite }
if (Get-Service -Name $StorefrontService -ErrorAction SilentlyContinue) {
    Start-Service -Name $StorefrontService
}

Start-Sleep -Seconds 5
$verifyScript = Join-Path $PSScriptRoot 'verify.ps1'
if (Test-Path $verifyScript) {
    Write-Step "Running smoke test after rollback"
    & $verifyScript -SkipPublic
}

Write-Host ""
Write-Host "Rollback complete. Restored from $($target.Name)" -ForegroundColor Green
