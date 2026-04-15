<#
.SYNOPSIS
    Prune old log files from MPOS deploy directories.

.DESCRIPTION
    Removes log files older than N days from:
      - C:\inetpub\mpos\backend\logs\          (stdout_*.log from ASP.NET Core Module)
      - C:\inetpub\mpos\storefront\logs\       (NSSM stdout/stderr rotated files)
      - C:\inetpub\logs\LogFiles\W3SVC*\       (IIS request logs)

    Install as weekly scheduled task (Sundays 03:00 as SYSTEM):
        pwsh -File deploy\log-rotate.ps1 -InstallScheduledTask

    Remove task:
        pwsh -File deploy\log-rotate.ps1 -RemoveScheduledTask

.PARAMETER DeployRoot
    MPOS root folder. Defaults to C:\inetpub\mpos.
.PARAMETER RetentionDays
    Delete files older than this many days. Defaults to 30.
.PARAMETER InstallScheduledTask
    Register as weekly Windows scheduled task.
.PARAMETER RemoveScheduledTask
    Unregister the scheduled task.
#>
[CmdletBinding()]
param(
    [string]$DeployRoot           = 'C:\inetpub\mpos',
    [int]   $RetentionDays        = 30,
    [switch]$InstallScheduledTask,
    [switch]$RemoveScheduledTask
)

$ErrorActionPreference = 'Stop'
$taskName = 'MPOS-Weekly-Log-Rotate'

# --- Scheduled task control ---
if ($RemoveScheduledTask) {
    if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
        Write-Host "Removed scheduled task '$taskName'" -ForegroundColor Green
    } else {
        Write-Host "Scheduled task '$taskName' not found" -ForegroundColor Yellow
    }
    return
}

if ($InstallScheduledTask) {
    $isAdmin = ([Security.Principal.WindowsPrincipal] `
        [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
            [Security.Principal.WindowsBuiltInRole]::Administrator)
    if (-not $isAdmin) { throw "Run as Administrator." }

    $argList = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" " +
               "-DeployRoot `"$DeployRoot`" -RetentionDays $RetentionDays"
    $action    = New-ScheduledTaskAction -Execute 'pwsh.exe' -Argument $argList
    $trigger   = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At '03:00'
    $settings  = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries `
                                              -ExecutionTimeLimit (New-TimeSpan -Hours 1)
    $principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest

    if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    }
    Register-ScheduledTask -TaskName $taskName `
                           -Action $action -Trigger $trigger -Settings $settings `
                           -Principal $principal `
                           -Description "Weekly cleanup of MPOS stdout and IIS logs" | Out-Null

    Write-Host "Installed scheduled task '$taskName' (Sundays 03:00, retention: $RetentionDays days)" -ForegroundColor Green
    return
}

# --- Actual rotation ---
$cutoff = (Get-Date).AddDays(-$RetentionDays)
$deleted = 0
$reclaimed = [int64]0

$paths = @(
    (Join-Path $DeployRoot 'backend\logs'),
    (Join-Path $DeployRoot 'storefront\logs'),
    'C:\inetpub\logs\LogFiles'
)

foreach ($path in $paths) {
    if (-not (Test-Path $path)) {
        Write-Host "  (skip $path — not found)" -ForegroundColor DarkGray
        continue
    }
    Write-Host "Scanning $path" -ForegroundColor Cyan
    $old = Get-ChildItem -Path $path -File -Recurse -Include '*.log', '*.txt' -ErrorAction SilentlyContinue |
           Where-Object { $_.LastWriteTime -lt $cutoff }

    foreach ($f in $old) {
        $reclaimed += $f.Length
        $deleted++
        try {
            Remove-Item $f.FullName -Force -ErrorAction Stop
            Write-Host "  removed: $($f.FullName)" -ForegroundColor DarkGray
        }
        catch {
            Write-Warning "  could not remove $($f.FullName): $($_.Exception.Message)"
        }
    }
}

$mb = [math]::Round($reclaimed / 1MB, 1)
Write-Host ""
Write-Host ("Removed {0} log files, reclaimed {1} MB" -f $deleted, $mb) -ForegroundColor Green
