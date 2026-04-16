<#
.SYNOPSIS
    Register the webhook auto-deploy listener as a Windows service + IIS proxy.

.DESCRIPTION
    1. Installs the Node.js webhook server as a Windows service via NSSM.
    2. Adds an IIS URL Rewrite rule so GitHub can reach it via:
       https://mops.mmit.sa/deploy-webhook → 127.0.0.1:9850
       (No extra port opened in the firewall — piggybacks on port 443.)
    3. Generates a random WEBHOOK_SECRET if not provided.

    After running this script, configure the GitHub repo webhook:
      URL:    https://mops.mmit.sa/deploy-webhook/webhook
      Secret: <the secret shown at the end>
      Events: Releases (and optionally Pushes)

    Run once as Administrator:
        pwsh -File deploy\setup-webhook.ps1

.PARAMETER WebhookSecret
    Shared HMAC secret. If omitted, a random 64-char hex string is generated.
.PARAMETER ServiceName
    Windows service name. Defaults to mpos-webhook.
.PARAMETER Port
    Local port for the webhook listener. Defaults to 9850.
.PARAMETER SiteName
    IIS site name to add the rewrite rule to. Defaults to mpos.
.PARAMETER GitHubToken
    Optional GitHub PAT for private repo release downloads.
#>
[CmdletBinding()]
param(
    [string]$WebhookSecret,
    [string]$ServiceName = 'mpos-webhook',
    [int]   $Port        = 9850,
    [string]$SiteName    = 'mpos',
    [string]$GitHubToken = ''
)

$ErrorActionPreference = 'Stop'

$isAdmin = ([Security.Principal.WindowsPrincipal] `
    [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) { throw "Run as Administrator." }

function Write-Step($msg) {
    Write-Host ""
    Write-Host "==> $msg" -ForegroundColor Cyan
}

# --- Generate secret if needed ---
if (-not $WebhookSecret) {
    $bytes = [byte[]]::new(32)
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
    $WebhookSecret = [BitConverter]::ToString($bytes).Replace('-', '').ToLower()
    Write-Host "Generated WEBHOOK_SECRET (save this!): $WebhookSecret" -ForegroundColor Yellow
}

# --- Locate dependencies ---
$node = (Get-Command node.exe -ErrorAction SilentlyContinue)?.Source
if (-not $node) { $node = 'C:\Program Files\nodejs\node.exe' }
if (-not (Test-Path $node)) { throw "node.exe not found. Run deploy\setup-iis.ps1 first." }

$nssm = (Get-Command nssm.exe -ErrorAction SilentlyContinue)?.Source
if (-not $nssm) { $nssm = 'C:\ProgramData\chocolatey\bin\nssm.exe' }
if (-not (Test-Path $nssm)) { throw "nssm.exe not found. Run: choco install nssm" }

$webhookDir = Join-Path $PSScriptRoot 'webhook'
$serverJs   = Join-Path $webhookDir 'webhook-server.js'
if (-not (Test-Path $serverJs)) { throw "webhook-server.js not found at $serverJs" }

# --- 1. Register Windows service ---
Write-Step "Registering service $ServiceName"
if (Get-Service -Name $ServiceName -ErrorAction SilentlyContinue) {
    Write-Host "  Stopping + removing existing service" -ForegroundColor Yellow
    Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
    & $nssm remove $ServiceName confirm | Out-Null
    Start-Sleep -Seconds 2
}

$logDir = Join-Path $webhookDir 'logs'
New-Item -ItemType Directory -Path $logDir -Force | Out-Null

& $nssm install     $ServiceName $node 'webhook-server.js'
& $nssm set         $ServiceName AppDirectory       $webhookDir
& $nssm set         $ServiceName AppEnvironmentExtra `
    "WEBHOOK_SECRET=$WebhookSecret" `
    "WEBHOOK_PORT=$Port" `
    $(if ($GitHubToken) { "GITHUB_TOKEN=$GitHubToken" } else { "NO_TOKEN=1" })
& $nssm set         $ServiceName Start              SERVICE_AUTO_START
& $nssm set         $ServiceName AppStdout          (Join-Path $logDir 'stdout.log')
& $nssm set         $ServiceName AppStderr          (Join-Path $logDir 'stderr.log')
& $nssm set         $ServiceName AppRotateFiles     1
& $nssm set         $ServiceName AppRotateBytes     10485760
& $nssm set         $ServiceName AppRestartDelay    5000
& $nssm set         $ServiceName DisplayName        'MPOS Webhook (Auto-Deploy)'
& $nssm set         $ServiceName Description        "GitHub webhook listener for auto-deploy to mops.mmit.sa"

Start-Service -Name $ServiceName
Start-Sleep -Seconds 3
$svc = Get-Service -Name $ServiceName
Write-Host "  Service: $($svc.Status)" -ForegroundColor $(if ($svc.Status -eq 'Running') { 'Green' } else { 'Red' })

# --- 2. Add IIS URL Rewrite rule for /deploy-webhook → localhost:PORT ---
Write-Step "Adding IIS rewrite rule for /deploy-webhook"
Import-Module WebAdministration -ErrorAction SilentlyContinue

# Check if the rewrite rule already exists by looking at the frontend web.config
$frontendDir = 'C:\inetpub\mpos\frontend'
$webConfig   = Join-Path $frontendDir 'web.config'

if (Test-Path $webConfig) {
    $xml = [xml](Get-Content $webConfig -Raw)
    $rules = $xml.SelectNodes("//rewrite/rules/rule[@name='WebhookProxy']")
    if ($rules.Count -eq 0) {
        # Insert the rule before the SPA fallback rule
        $rulesNode = $xml.SelectSingleNode("//rewrite/rules")
        if ($rulesNode) {
            $newRule = $xml.CreateElement('rule')
            $newRule.SetAttribute('name', 'WebhookProxy')
            $newRule.SetAttribute('stopProcessing', 'true')
            $newRule.InnerXml = @"
<match url="^deploy-webhook/(.*)" />
<action type="Rewrite" url="http://127.0.0.1:$Port/{R:1}" />
<serverVariables>
  <set name="HTTP_X_FORWARDED_HOST" value="{HTTP_HOST}" />
  <set name="HTTP_X_FORWARDED_PROTO" value="https" />
</serverVariables>
"@
            # Insert before ReactSpaFallback
            $spaRule = $xml.SelectSingleNode("//rewrite/rules/rule[@name='ReactSpaFallback']")
            if ($spaRule) {
                $rulesNode.InsertBefore($newRule, $spaRule) | Out-Null
            } else {
                $rulesNode.AppendChild($newRule) | Out-Null
            }
            $xml.Save($webConfig)
            Write-Host "  Added WebhookProxy rewrite rule to web.config" -ForegroundColor Green
        }
    } else {
        Write-Host "  WebhookProxy rule already exists" -ForegroundColor DarkGray
    }
} else {
    Write-Warning "web.config not found at $webConfig — add the rewrite rule manually after first deploy."
}

# --- 3. Verify ---
Write-Step "Verifying webhook health"
Start-Sleep -Seconds 2
try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/health" -TimeoutSec 5
    Write-Host "  Health: $($health.status)" -ForegroundColor Green
} catch {
    Write-Warning "Health check failed: $($_.Exception.Message)"
}

# --- Summary ---
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Webhook auto-deploy is ready!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Internal:  http://127.0.0.1:$Port/health" -ForegroundColor White
Write-Host "  Public:    https://mops.mmit.sa/deploy-webhook/health" -ForegroundColor White
Write-Host ""
Write-Host "  Configure GitHub webhook:" -ForegroundColor Yellow
Write-Host "    Repo → Settings → Webhooks → Add webhook" -ForegroundColor Yellow
Write-Host "    Payload URL:  https://mops.mmit.sa/deploy-webhook/webhook" -ForegroundColor Yellow
Write-Host "    Content type: application/json" -ForegroundColor Yellow
Write-Host "    Secret:       $WebhookSecret" -ForegroundColor Yellow
Write-Host "    Events:       'Releases' (recommended) or 'Just the push event'" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Also add to GitHub repo secrets (for Actions fallback):" -ForegroundColor Yellow
Write-Host "    WEBHOOK_SECRET = $WebhookSecret" -ForegroundColor Yellow
Write-Host "    WEBHOOK_URL    = https://mops.mmit.sa/deploy-webhook/deploy" -ForegroundColor Yellow
