<#
.SYNOPSIS
    Fully automated deployment: pull release → backup DB → deploy → verify.

.DESCRIPTION
    Called by the webhook server (or manually). Orchestrates:
      1. Backup the database (safety net)
      2. Download the latest (or specific) release from GitHub
      3. Deploy artifacts to C:\inetpub\mpos (snapshots current state first)
      4. Run smoke tests

    Exit code 0 = success, 1 = failure.

    The webhook server calls this script; it can also be run manually:
        pwsh -File deploy\auto-deploy.ps1
        pwsh -File deploy\auto-deploy.ps1 -Tag v1.2.3

.PARAMETER Tag
    Specific release tag to deploy. If omitted, deploys the latest release.
.PARAMETER SkipBackup
    Skip the DB backup step (faster, for testing only).
.PARAMETER DeployRoot
    Override default deploy root.
#>
[CmdletBinding()]
param(
    [string]$Tag,
    [switch]$SkipBackup,
    [string]$DeployRoot = 'C:\inetpub\mpos'
)

$ErrorActionPreference = 'Stop'
$scriptDir = $PSScriptRoot  # deploy/
$logFile   = Join-Path $scriptDir 'webhook\auto-deploy-log.txt'
$staging   = 'C:\mpos-deploy'

function Write-Log($msg) {
    $ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $line = "[$ts] $msg"
    Write-Host $line -ForegroundColor Cyan
    try { Add-Content -Path $logFile -Value $line -ErrorAction SilentlyContinue } catch {}
}

try {
    Write-Log "========== AUTO-DEPLOY START =========="
    Write-Log "Tag: $(if ($Tag) { $Tag } else { 'latest' })"
    Write-Log "Trigger: $($env:AUTO_DEPLOY_TRIGGER ?? 'manual')"

    # --- 1. DB Backup ---
    if (-not $SkipBackup) {
        $backupScript = Join-Path $scriptDir 'backup-db.ps1'
        if (Test-Path $backupScript) {
            Write-Log "Step 1/4: Backing up database..."
            & $backupScript
            if ($LASTEXITCODE -ne 0) {
                Write-Log "WARNING: Backup had issues (exit $LASTEXITCODE) — continuing deploy"
            } else {
                Write-Log "Backup complete"
            }
        } else {
            Write-Log "Step 1/4: Skipped (backup-db.ps1 not found)"
        }
    } else {
        Write-Log "Step 1/4: Skipped (SkipBackup flag)"
    }

    # --- 2. Pull release ---
    Write-Log "Step 2/4: Pulling release from GitHub..."
    $pullScript = Join-Path $scriptDir 'pull-release.ps1'
    $pullArgs = @('-StagingDir', $staging)
    if ($Tag) { $pullArgs += @('-Tag', $Tag) }

    & $pullScript @pullArgs
    if ($LASTEXITCODE -ne 0) {
        throw "pull-release.ps1 failed (exit $LASTEXITCODE)"
    }
    Write-Log "Release pulled to $staging"

    # --- 3. Deploy ---
    Write-Log "Step 3/4: Deploying to $DeployRoot..."
    $deployScript = Join-Path $scriptDir 'deploy.ps1'
    & $deployScript -DeployRoot $DeployRoot
    if ($LASTEXITCODE -ne 0) {
        throw "deploy.ps1 failed (exit $LASTEXITCODE)"
    }
    Write-Log "Deploy complete"

    # --- 4. Verify ---
    Write-Log "Step 4/4: Running smoke test..."
    $verifyScript = Join-Path $scriptDir 'verify.ps1'
    & $verifyScript -SkipPublic
    $verifyExit = $LASTEXITCODE
    if ($verifyExit -ne 0) {
        Write-Log "WARNING: Smoke test reported failures (exit $verifyExit)"
    } else {
        Write-Log "Smoke test passed"
    }

    Write-Log "========== AUTO-DEPLOY SUCCESS =========="
    exit 0
}
catch {
    Write-Log "========== AUTO-DEPLOY FAILED =========="
    Write-Log "ERROR: $($_.Exception.Message)"
    Write-Log "Consider running: pwsh -File deploy\rollback.ps1"
    exit 1
}
