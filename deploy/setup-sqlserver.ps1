<#
.SYNOPSIS
    Provision SQL Server for MPOS without using the `sa` account.

.DESCRIPTION
    Creates the MsCashier database (if missing), applies 001-schema.sql,
    and grants the IIS AppPool identity `IIS AppPool\mpos-api` db_owner
    access via Windows Authentication. No passwords are stored anywhere.

    Default mode: -AuthMode Windows
      * Uses `sqlcmd -E` (trusted connection) to run as the current Windows
        user. You must run this script with an account that is already a
        sysadmin on the SQL instance (e.g. the local Administrator on a
        default install where BUILTIN\Administrators is sysadmin, or a
        domain account explicitly granted sysadmin).
      * The web app then connects via `Integrated Security=true` as the
        AppPool identity — no credentials in config files.

    Alternative: -AuthMode SqlLogin -SqlUser <user> -SqlPassword <pass>
      * Creates a dedicated SQL login instead of using Windows Auth.
      * Use only if the server has Mixed-Mode auth and you cannot use
        AppPool identity (e.g. remote SQL server in a workgroup).

    Run as Administrator on the target server (SAME machine as SQL Server
    for the default Windows-Auth flow).

.PARAMETER SqlInstance
    SQL Server instance. Defaults to localhost. For named instance use
    "localhost\SQLEXPRESS".
.PARAMETER Database
    Database name. Defaults to MsCashier.
.PARAMETER AppPoolName
    IIS AppPool name to grant access. Defaults to mpos-api.
.PARAMETER SchemaFile
    Optional path to schema SQL file. Defaults to the repo's 001-schema.sql.
.PARAMETER AuthMode
    Windows (recommended) or SqlLogin.
.PARAMETER SqlUser
    Used only when AuthMode=SqlLogin.
.PARAMETER SqlPassword
    Used only when AuthMode=SqlLogin. Must meet SQL password policy.
#>
[CmdletBinding()]
param(
    [string]$SqlInstance  = 'localhost',
    [string]$Database     = 'MsCashier',
    [string]$AppPoolName  = 'mpos-api',
    [string]$SchemaFile   = '',
    [ValidateSet('Windows', 'SqlLogin')]
    [string]$AuthMode     = 'Windows',
    [string]$SqlUser      = 'mscashier',
    [string]$SqlPassword
)

$ErrorActionPreference = 'Stop'

function Write-Step($msg) {
    Write-Host ""
    Write-Host "==> $msg" -ForegroundColor Cyan
}

# --- Admin check ---
$isAdmin = ([Security.Principal.WindowsPrincipal] `
    [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) { throw "Run as Administrator." }

# --- Locate sqlcmd ---
$sqlcmd = (Get-Command sqlcmd.exe -ErrorAction SilentlyContinue)?.Source
if (-not $sqlcmd) {
    Write-Host "sqlcmd not found. Installing via Chocolatey..." -ForegroundColor Yellow
    if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
        throw "Chocolatey not installed. Install SQL Server or run deploy\setup-iis.ps1 first."
    }
    choco install -y sqlcmd --no-progress | Out-Null
    $sqlcmd = (Get-Command sqlcmd.exe).Source
}

# --- Helper: run a T-SQL batch ---
function Invoke-Sql {
    param(
        [string]$Query,
        [string]$Db = 'master'
    )
    $tmp = [System.IO.Path]::GetTempFileName()
    try {
        Set-Content -Path $tmp -Value $Query -Encoding UTF8
        & $sqlcmd -S $SqlInstance -d $Db -E -b -i $tmp
        if ($LASTEXITCODE -ne 0) { throw "sqlcmd failed (exit $LASTEXITCODE) running query against $Db" }
    }
    finally { Remove-Item $tmp -Force -ErrorAction SilentlyContinue }
}

# --- 1. Verify we can connect ---
Write-Step "Verifying SQL Server connection to $SqlInstance (Windows Auth as $env:USERNAME)"
Invoke-Sql -Query "SELECT @@VERSION"

# --- 2. Create the database if missing ---
Write-Step "Ensuring database [$Database] exists"
$createDb = @"
IF DB_ID(N'$Database') IS NULL
BEGIN
    CREATE DATABASE [$Database];
    PRINT 'Created database [$Database]';
END
ELSE
BEGIN
    PRINT 'Database [$Database] already exists';
END
"@
Invoke-Sql -Query $createDb

# --- 3. Apply schema if provided ---
if (-not $SchemaFile) {
    $SchemaFile = Join-Path (Split-Path -Parent $PSScriptRoot) '001-schema.sql'
}
if (Test-Path $SchemaFile) {
    Write-Step "Applying schema: $SchemaFile"
    & $sqlcmd -S $SqlInstance -d $Database -E -b -i $SchemaFile
    if ($LASTEXITCODE -ne 0) { throw "Schema apply failed" }
} else {
    Write-Host "  (no schema file at $SchemaFile — skipping)" -ForegroundColor DarkGray
}

# --- 4. Grant access ---
switch ($AuthMode) {

    'Windows' {
        # The IIS AppPool identity runs as "IIS APPPOOL\<name>" — a virtual
        # account. SQL Server can create a login for it directly, using
        # the current machine as the domain.
        $appPoolLogin = "IIS APPPOOL\$AppPoolName"

        Write-Step "Granting Windows login [$appPoolLogin] access to [$Database]"
        $grantSql = @"
-- Server-level login for the AppPool identity
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'$appPoolLogin')
BEGIN
    CREATE LOGIN [$appPoolLogin] FROM WINDOWS WITH DEFAULT_DATABASE=[$Database];
    PRINT 'Created server login [$appPoolLogin]';
END
ELSE
BEGIN
    PRINT 'Server login [$appPoolLogin] already exists';
END
GO

USE [$Database];

-- Database user mapped to the login
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'$appPoolLogin')
BEGIN
    CREATE USER [$appPoolLogin] FOR LOGIN [$appPoolLogin];
    PRINT 'Created database user [$appPoolLogin]';
END

-- db_owner so EF Core migrations can run. Tighten later if needed:
-- ALTER ROLE db_datareader ADD MEMBER [$appPoolLogin];
-- ALTER ROLE db_datawriter ADD MEMBER [$appPoolLogin];
-- ALTER ROLE db_ddladmin  ADD MEMBER [$appPoolLogin];
ALTER ROLE db_owner ADD MEMBER [$appPoolLogin];
PRINT 'Granted db_owner on [$Database] to [$appPoolLogin]';
GO
"@
        Invoke-Sql -Query $grantSql

        Write-Step "Done (Windows Auth)"
        Write-Host "Connection string to use in appsettings.Production.json:" -ForegroundColor Green
        Write-Host "  Server=$SqlInstance;Database=$Database;Integrated Security=true;TrustServerCertificate=True;MultipleActiveResultSets=True;Encrypt=true" -ForegroundColor Green
    }

    'SqlLogin' {
        if (-not $SqlPassword) {
            throw "AuthMode SqlLogin requires -SqlPassword"
        }
        # Safety: verify the instance is in mixed mode
        Write-Step "Checking SQL Server auth mode"
        $mode = & $sqlcmd -S $SqlInstance -E -h -1 -W -Q `
            "SET NOCOUNT ON; SELECT CASE SERVERPROPERTY('IsIntegratedSecurityOnly') WHEN 1 THEN 'Windows' ELSE 'Mixed' END"
        if ($mode -notmatch 'Mixed') {
            throw "SQL Server is Windows-Auth-only. Enable Mixed-Mode auth first, or use -AuthMode Windows."
        }

        Write-Step "Creating SQL login [$SqlUser] and granting access to [$Database]"
        $escPwd = $SqlPassword.Replace("'", "''")
        $grantSql = @"
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'$SqlUser')
BEGIN
    CREATE LOGIN [$SqlUser]
        WITH PASSWORD = N'$escPwd',
             DEFAULT_DATABASE = [$Database],
             CHECK_POLICY = ON;
    PRINT 'Created SQL login [$SqlUser]';
END
ELSE
BEGIN
    ALTER LOGIN [$SqlUser] WITH PASSWORD = N'$escPwd';
    PRINT 'Updated password for SQL login [$SqlUser]';
END
GO

USE [$Database];

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'$SqlUser')
BEGIN
    CREATE USER [$SqlUser] FOR LOGIN [$SqlUser];
END

ALTER ROLE db_owner ADD MEMBER [$SqlUser];
PRINT 'Granted db_owner on [$Database] to [$SqlUser]';
GO
"@
        Invoke-Sql -Query $grantSql

        Write-Step "Done (SQL Auth)"
        Write-Host "Connection string to use in appsettings.Production.json:" -ForegroundColor Green
        Write-Host "  Server=$SqlInstance;Database=$Database;User Id=$SqlUser;Password=***;TrustServerCertificate=True;MultipleActiveResultSets=True;Encrypt=true" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Verify with:" -ForegroundColor Yellow
Write-Host "  sqlcmd -S $SqlInstance -d $Database -E -Q `"SELECT SUSER_NAME(), USER_NAME()`"" -ForegroundColor Yellow
