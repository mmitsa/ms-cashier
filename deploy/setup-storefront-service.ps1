<#
.SYNOPSIS
    Register the Next.js storefront as a Windows service via NSSM.

.DESCRIPTION
    Creates a Windows service `mpos-storefront` that runs
    `node server.js` inside the storefront standalone output on port 3000.
    IIS (ARR) reverse-proxies https://mops.mmit.sa/store -> localhost:3000.

    Run once as Administrator on the target server.

.PARAMETER DeployRoot
    Root directory where MPOS is installed.
.PARAMETER ServiceName
    Windows service name.
.PARAMETER Port
    TCP port the Next.js server listens on (localhost only).
#>
[CmdletBinding()]
param(
    [string]$DeployRoot  = 'C:\inetpub\mpos',
    [string]$ServiceName = 'mpos-storefront',
    [int]   $Port        = 3000
)

$ErrorActionPreference = 'Stop'

$isAdmin = ([Security.Principal.WindowsPrincipal] `
    [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) { throw "Run as Administrator." }

$storefrontDir = Join-Path $DeployRoot 'storefront'
$serverJs      = Join-Path $storefrontDir 'server.js'

if (-not (Test-Path $serverJs)) {
    throw "server.js not found at $serverJs. Run deploy\build.ps1 then deploy\deploy.ps1 first."
}

# Locate node.exe + nssm.exe
$node = (Get-Command node.exe -ErrorAction SilentlyContinue)?.Source
if (-not $node) { $node = 'C:\Program Files\nodejs\node.exe' }
if (-not (Test-Path $node)) { throw "node.exe not found. Install Node.js LTS." }

$nssm = (Get-Command nssm.exe -ErrorAction SilentlyContinue)?.Source
if (-not $nssm) { $nssm = 'C:\ProgramData\chocolatey\bin\nssm.exe' }
if (-not (Test-Path $nssm)) { throw "nssm.exe not found. Install via: choco install nssm" }

$logDir = Join-Path $storefrontDir 'logs'
New-Item -ItemType Directory -Path $logDir -Force | Out-Null

# If service exists already -> remove + recreate (idempotent)
if (Get-Service -Name $ServiceName -ErrorAction SilentlyContinue) {
    Write-Host "Stopping + removing existing service $ServiceName" -ForegroundColor Yellow
    Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
    & $nssm remove $ServiceName confirm | Out-Null
    Start-Sleep -Seconds 2
}

Write-Host "Installing service $ServiceName" -ForegroundColor Cyan
& $nssm install     $ServiceName $node 'server.js'
& $nssm set         $ServiceName AppDirectory       $storefrontDir
& $nssm set         $ServiceName AppEnvironmentExtra `
    "NODE_ENV=production" `
    "HOSTNAME=127.0.0.1" `
    "PORT=$Port"
& $nssm set         $ServiceName Start              SERVICE_AUTO_START
& $nssm set         $ServiceName AppStdout          (Join-Path $logDir 'stdout.log')
& $nssm set         $ServiceName AppStderr          (Join-Path $logDir 'stderr.log')
& $nssm set         $ServiceName AppRotateFiles     1
& $nssm set         $ServiceName AppRotateBytes     10485760
& $nssm set         $ServiceName AppRestartDelay    5000
& $nssm set         $ServiceName DisplayName        'MPOS Storefront (Next.js)'
& $nssm set         $ServiceName Description        'Next.js storefront for mops.mmit.sa/store'

# Firewall: port 3000 is local-only (no public rule needed)
# Start the service
Start-Service -Name $ServiceName
Start-Sleep -Seconds 3
Get-Service -Name $ServiceName | Format-Table -AutoSize

Write-Host ""
Write-Host "Storefront service is running on http://127.0.0.1:$Port" -ForegroundColor Green
Write-Host "Public URL:  https://mops.mmit.sa/store" -ForegroundColor Green
