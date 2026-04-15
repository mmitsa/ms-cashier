<#
.SYNOPSIS
    Backup MsCashier SQL Server database with rotation + optional scheduled task.

.DESCRIPTION
    Takes a compressed `.bak` (native SQL Server backup) of the MsCashier
    database to `C:\inetpub\mpos\backups\` and keeps the latest N files
    (default 14 days). Uses Windows Authentication — no credentials in
    config or in the scheduled task.

    Run manually:
        pwsh -File deploy\backup-db.ps1

    Install as a daily scheduled task (runs 02:30 every day):
        pwsh -File deploy\backup-db.ps1 -InstallScheduledTask

    Remove the scheduled task:
        pwsh -File deploy\backup-db.ps1 -RemoveScheduledTask

.PARAMETER SqlInstance
    SQL Server instance. Defaults to localhost.
.PARAMETER Database
    Database name. Defaults to MsCashier.
.PARAMETER BackupDir
    Destination directory. Defaults to C:\inetpub\mpos\backups.
.PARAMETER RetentionDays
    Delete .bak files older than this many days. Defaults to 14.
.PARAMETER InstallScheduledTask
    Register a Windows scheduled task that runs this script daily.
.PARAMETER RemoveScheduledTask
    Unregister the scheduled task.
.PARAMETER ScheduledTime
    Time of day for the scheduled task (24h, HH:mm). Defaults to 02:30.
#>
[CmdletBinding()]
param(
    [string]$SqlInstance           = 'localhost',
    [string]$Database              = 'MsCashier',
    [string]$BackupDir             = 'C:\inetpub\mpos\backups',
    [int]   $RetentionDays         = 14,
    [switch]$InstallScheduledTask,
    [switch]$RemoveScheduledTask,
    [string]$ScheduledTime         = '02:30'
)

$ErrorActionPreference = 'Stop'
$taskName = 'MPOS-Daily-DB-Backup'

# --- Scheduled-task control path ---
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
    if (-not $isAdmin) { throw "Run as Administrator to install the scheduled task." }

    $scriptPath = $PSCommandPath
    # Build argument list that re-runs this script without the install flag
    $argList = "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`" " +
               "-SqlInstance `"$SqlInstance`" -Database `"$Database`" " +
               "-BackupDir `"$BackupDir`" -RetentionDays $RetentionDays"

    $action   = New-ScheduledTaskAction -Execute 'pwsh.exe' -Argument $argList
    $trigger  = New-ScheduledTaskTrigger -Daily -At $ScheduledTime
    $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable `
                                             -RunOnlyIfNetworkAvailable:$false `
                                             -ExecutionTimeLimit (New-TimeSpan -Hours 2) `
                                             -AllowStartIfOnBatteries

    # SYSTEM account is a sysadmin on local SQL by default — no password needed
    $principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest

    if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    }

    Register-ScheduledTask -TaskName $taskName `
                           -Action $action `
                           -Trigger $trigger `
                           -Settings $settings `
                           -Principal $principal `
                           -Description "Daily SQL Server backup of [$Database] to $BackupDir" | Out-Null

    Write-Host "Installed scheduled task '$taskName' (runs daily at $ScheduledTime as SYSTEM)" -ForegroundColor Green
    Write-Host "View with: Get-ScheduledTask -TaskName $taskName | Get-ScheduledTaskInfo" -ForegroundColor Yellow
    return
}

# --- Actual backup path ---
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$sqlcmd = (Get-Command sqlcmd.exe -ErrorAction SilentlyContinue)?.Source
if (-not $sqlcmd) { throw "sqlcmd not found. Run deploy\setup-sqlserver.ps1 first." }

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$fileName  = "$Database-$timestamp.bak"
$fullPath  = Join-Path $BackupDir $fileName

Write-Host "Backing up [$Database] -> $fullPath" -ForegroundColor Cyan

# NOTE: BACKUP DATABASE path is interpreted by SQL Server, so it must be
# a path accessible to the SQL Server service account.
$sql = @"
BACKUP DATABASE [$Database]
TO DISK = N'$fullPath'
WITH
    COMPRESSION,
    CHECKSUM,
    INIT,
    FORMAT,
    NAME = N'$Database-Full-$timestamp',
    STATS = 10;
"@

$tmp = [System.IO.Path]::GetTempFileName()
try {
    Set-Content -Path $tmp -Value $sql -Encoding UTF8
    & $sqlcmd -S $SqlInstance -E -b -i $tmp
    if ($LASTEXITCODE -ne 0) { throw "Backup failed (sqlcmd exit $LASTEXITCODE)" }
}
finally { Remove-Item $tmp -Force -ErrorAction SilentlyContinue }

if (-not (Test-Path $fullPath)) {
    throw "Backup completed but file not found at $fullPath. Check SQL Server service account permissions on $BackupDir."
}

$sizeMb = [math]::Round((Get-Item $fullPath).Length / 1MB, 1)
Write-Host ("Backup complete: {0} ({1} MB)" -f $fileName, $sizeMb) -ForegroundColor Green

# --- Retention: delete old .bak files ---
Write-Host "Applying retention (keep last $RetentionDays days)" -ForegroundColor Cyan
$cutoff = (Get-Date).AddDays(-$RetentionDays)
$old = Get-ChildItem -Path $BackupDir -Filter "$Database-*.bak" -File |
       Where-Object { $_.LastWriteTime -lt $cutoff }

if ($old) {
    foreach ($f in $old) {
        Remove-Item $f.FullName -Force
        Write-Host "  Deleted: $($f.Name)" -ForegroundColor DarkGray
    }
    Write-Host ("  Removed {0} old backup(s)" -f $old.Count) -ForegroundColor Yellow
} else {
    Write-Host "  No old backups to remove" -ForegroundColor DarkGray
}

# Summary
$all = Get-ChildItem -Path $BackupDir -Filter "$Database-*.bak" -File
$totalMb = [math]::Round(($all | Measure-Object Length -Sum).Sum / 1MB, 1)
Write-Host ""
Write-Host ("Current backups: {0} files, {1} MB total" -f $all.Count, $totalMb) -ForegroundColor Cyan
