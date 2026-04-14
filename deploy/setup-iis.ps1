<#
.SYNOPSIS
    One-time IIS setup for MPOS on a fresh Windows Server.

.DESCRIPTION
    Installs required IIS features + modules (ASP.NET Core Hosting Bundle,
    URL Rewrite, Application Request Routing), creates the IIS site, app pool,
    and binding for https://mops.mmit.sa, then issues a Let's Encrypt
    certificate via win-acme.

    Run once as Administrator on the target server.

.PARAMETER DeployRoot
    Root directory on the server where MPOS is installed.
.PARAMETER SiteName
    IIS site name for the React frontend (root site).
.PARAMETER AppPoolName
    Application pool name for the .NET backend.
.PARAMETER Hostname
    Public hostname (must resolve to this server via DNS).
.PARAMETER ContactEmail
    Email used for Let's Encrypt account registration.
#>
[CmdletBinding()]
param(
    [string]$DeployRoot    = 'C:\inetpub\mpos',
    [string]$SiteName      = 'mpos',
    [string]$AppPoolName   = 'mpos-api',
    [string]$Hostname      = 'mops.mmit.sa',
    [string]$ContactEmail  = 'admin@mmit.sa'
)

$ErrorActionPreference = 'Stop'

function Write-Step($msg) {
    Write-Host ""
    Write-Host "==> $msg" -ForegroundColor Cyan
}

# --- Ensure Administrator ---
$isAdmin = ([Security.Principal.WindowsPrincipal] `
    [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) { throw "Run as Administrator." }

# --- 1. Install IIS role + features ---
Write-Step "Installing IIS role + features"
$features = @(
    'Web-Server', 'Web-WebServer', 'Web-Common-Http', 'Web-Default-Doc',
    'Web-Static-Content', 'Web-Http-Errors', 'Web-Http-Redirect',
    'Web-Health', 'Web-Http-Logging', 'Web-Request-Monitor',
    'Web-Performance', 'Web-Stat-Compression', 'Web-Dyn-Compression',
    'Web-Security', 'Web-Filtering', 'Web-App-Dev', 'Web-Net-Ext45',
    'Web-AppInit', 'Web-ISAPI-Ext', 'Web-ISAPI-Filter',
    'Web-Mgmt-Console', 'Web-Scripting-Tools', 'Web-Mgmt-Service',
    'Web-Windows-Auth'
)
Install-WindowsFeature -Name $features -IncludeManagementTools | Out-Null

Import-Module WebAdministration

# --- 2. Ensure required modules are installed ---
Write-Step "Checking required IIS modules"

function Test-Module($name) {
    $mods = & "$env:SystemRoot\System32\inetsrv\appcmd.exe" list modules 2>$null
    return ($mods -match [regex]::Escape($name))
}

# chocolatey bootstrap for easy module install
if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Step "Installing Chocolatey (used to install IIS modules)"
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol =
        [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString(
        'https://community.chocolatey.org/install.ps1'))
    $env:Path += ";$env:ProgramData\chocolatey\bin"
}

Write-Step "Installing ASP.NET Core 8 Hosting Bundle"
choco install -y dotnet-8.0-windowshosting --no-progress | Out-Null

Write-Step "Installing URL Rewrite"
choco install -y urlrewrite --no-progress | Out-Null

Write-Step "Installing Application Request Routing (ARR)"
choco install -y iis-arr --no-progress | Out-Null

Write-Step "Installing NSSM (Next.js service manager)"
choco install -y nssm --no-progress | Out-Null

Write-Step "Installing win-acme (Let's Encrypt client)"
choco install -y win-acme --no-progress | Out-Null

Write-Step "Installing Node.js LTS (for Next.js storefront runtime)"
choco install -y nodejs-lts --no-progress | Out-Null

# --- 3. Enable ARR proxy ---
Write-Step "Enabling ARR reverse-proxy"
& "$env:SystemRoot\System32\inetsrv\appcmd.exe" set config `
    -section:system.webServer/proxy /enabled:"True" /commit:apphost | Out-Null

# --- 4. Create directories ---
Write-Step "Preparing directories under $DeployRoot"
foreach ($d in @($DeployRoot, "$DeployRoot\backend", "$DeployRoot\frontend", "$DeployRoot\storefront", "$DeployRoot\backend\logs")) {
    if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
}

# --- 5. App pool for backend (no managed runtime = pure .NET Core) ---
Write-Step "Creating app pool $AppPoolName"
if (-not (Test-Path "IIS:\AppPools\$AppPoolName")) {
    New-WebAppPool -Name $AppPoolName | Out-Null
}
Set-ItemProperty "IIS:\AppPools\$AppPoolName" -Name managedRuntimeVersion -Value ''
Set-ItemProperty "IIS:\AppPools\$AppPoolName" -Name startMode -Value 'AlwaysRunning'
Set-ItemProperty "IIS:\AppPools\$AppPoolName" -Name processModel.idleTimeout -Value ([TimeSpan]::Zero)

# App pool for the static frontend site
$frontAppPool = "$SiteName-web"
if (-not (Test-Path "IIS:\AppPools\$frontAppPool")) {
    New-WebAppPool -Name $frontAppPool | Out-Null
}
Set-ItemProperty "IIS:\AppPools\$frontAppPool" -Name managedRuntimeVersion -Value ''

# --- 6. Create IIS site (frontend at root) ---
Write-Step "Creating IIS site $SiteName on $Hostname"
if (Get-Website -Name $SiteName -ErrorAction SilentlyContinue) {
    Remove-Website -Name $SiteName
}
New-Website -Name $SiteName `
            -PhysicalPath "$DeployRoot\frontend" `
            -ApplicationPool $frontAppPool `
            -HostHeader $Hostname `
            -Port 80 `
            -Force | Out-Null

# --- 7. Backend as its own IIS site on localhost:5000 ---
# We don't use a nested application because MPOS controllers already use
# [Route("api/v1/...")]. A nested app at /api would make IIS strip /api
# before ASP.NET Core sees the URL, breaking routing. A separate site
# reverse-proxied via URL Rewrite preserves the original paths.
Write-Step "Creating backend site mpos-api on 127.0.0.1:5000"
$backendSite = 'mpos-api'
if (Get-Website -Name $backendSite -ErrorAction SilentlyContinue) {
    Remove-Website -Name $backendSite
}
New-Website -Name $backendSite `
            -PhysicalPath "$DeployRoot\backend" `
            -ApplicationPool $AppPoolName `
            -IPAddress '127.0.0.1' `
            -Port 5000 `
            -Force | Out-Null

# --- 8. Grant filesystem permissions ---
Write-Step "Granting AppPool identities filesystem permissions"
$acl = Get-Acl "$DeployRoot\backend"
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
    "IIS AppPool\$AppPoolName", 'ReadAndExecute,Write', 'ContainerInherit,ObjectInherit',
    'None', 'Allow')
$acl.SetAccessRule($rule)
Set-Acl -Path "$DeployRoot\backend" -AclObject $acl

$acl = Get-Acl "$DeployRoot\frontend"
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
    "IIS AppPool\$frontAppPool", 'ReadAndExecute', 'ContainerInherit,ObjectInherit',
    'None', 'Allow')
$acl.SetAccessRule($rule)
Set-Acl -Path "$DeployRoot\frontend" -AclObject $acl

# --- 9. Firewall rules ---
Write-Step "Opening firewall ports 80/443"
New-NetFirewallRule -DisplayName 'HTTP'  -Direction Inbound -Protocol TCP -LocalPort 80  -Action Allow -ErrorAction SilentlyContinue | Out-Null
New-NetFirewallRule -DisplayName 'HTTPS' -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow -ErrorAction SilentlyContinue | Out-Null

# --- 10. Issue Let's Encrypt certificate via win-acme ---
Write-Step "Issuing Let's Encrypt certificate for $Hostname"
Write-Host "  -> DNS $Hostname must already point to this server" -ForegroundColor Yellow
Write-Host "  -> Port 80 must be reachable from the public internet" -ForegroundColor Yellow

$wacs = "$env:ProgramData\chocolatey\lib\win-acme\tools\wacs.exe"
if (Test-Path $wacs) {
    & $wacs `
        --target iis `
        --siteid ((Get-Website -Name $SiteName).id) `
        --host $Hostname `
        --accepttos `
        --emailaddress $ContactEmail `
        --installation iis `
        --store certificatestore
} else {
    Write-Warning "win-acme not found at $wacs. Install manually or run: choco install win-acme"
}

Write-Step "IIS setup complete"
Write-Host "Next: run deploy\setup-storefront-service.ps1 to register the Next.js service" -ForegroundColor Yellow
