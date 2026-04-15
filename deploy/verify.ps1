<#
.SYNOPSIS
    Post-deployment smoke test for MPOS.

.DESCRIPTION
    Verifies that all three components are running and reachable:
      - Backend   (http://127.0.0.1:5000/health, internal)
      - Storefront (http://127.0.0.1:3000/store, internal)
      - Frontend  (https://mops.mmit.sa/, public)
      - Public API reachability (https://mops.mmit.sa/api/v1/tenants, public)

    Exit code 0 = all checks passed, 1 = at least one failure.

    Run on the server after deploy\deploy.ps1:
        pwsh -File deploy\verify.ps1

.PARAMETER PublicUrl
    Public base URL. Defaults to https://mops.mmit.sa.
.PARAMETER BackendPort
    Local backend port. Defaults to 5000.
.PARAMETER StorefrontPort
    Local storefront port. Defaults to 3000.
.PARAMETER SkipPublic
    Skip public-URL checks (useful before DNS / SSL are ready).
#>
[CmdletBinding()]
param(
    [string]$PublicUrl      = 'https://mops.mmit.sa',
    [int]   $BackendPort    = 5000,
    [int]   $StorefrontPort = 3000,
    [switch]$SkipPublic
)

$ErrorActionPreference = 'Continue'  # we want all checks to run even if one fails

$results = [System.Collections.Generic.List[object]]::new()

function Test-Url {
    param(
        [string]$Name,
        [string]$Url,
        [int[]] $ExpectedStatus = @(200),
        [int]   $TimeoutSec     = 15
    )

    Write-Host "  → $Name" -NoNewline
    Write-Host " ($Url)" -ForegroundColor DarkGray
    try {
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        $resp = Invoke-WebRequest -Uri $Url `
                                  -UseBasicParsing `
                                  -TimeoutSec $TimeoutSec `
                                  -SkipHttpErrorCheck `
                                  -MaximumRedirection 0 `
                                  -ErrorAction Stop
        $sw.Stop()
        $status = [int]$resp.StatusCode
        $ok = $ExpectedStatus -contains $status
        $results.Add([pscustomobject]@{
            Name       = $Name
            Url        = $Url
            Status     = $status
            TimeMs     = [int]$sw.ElapsedMilliseconds
            OK         = $ok
            Error      = $null
        })
        $color = if ($ok) { 'Green' } else { 'Red' }
        Write-Host ("    {0} ({1} ms)" -f $status, $sw.ElapsedMilliseconds) -ForegroundColor $color
    }
    catch {
        $results.Add([pscustomobject]@{
            Name   = $Name
            Url    = $Url
            Status = $null
            TimeMs = $null
            OK     = $false
            Error  = $_.Exception.Message
        })
        Write-Host "    FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "MPOS smoke test" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan

# --- Services state (quick-fail before HTTP checks) ---
Write-Host ""
Write-Host "Services:" -ForegroundColor Cyan
$svc = Get-Service -Name 'mpos-storefront' -ErrorAction SilentlyContinue
if ($svc) {
    $ok = $svc.Status -eq 'Running'
    Write-Host ("  mpos-storefront: {0}" -f $svc.Status) -ForegroundColor ($(if ($ok) {'Green'} else {'Red'}))
    if (-not $ok) { $results.Add([pscustomobject]@{Name='Storefront service'; OK=$false; Error="Service state: $($svc.Status)"}) }
} else {
    Write-Host "  mpos-storefront: not installed" -ForegroundColor Yellow
}

Import-Module WebAdministration -ErrorAction SilentlyContinue
foreach ($site in @('mpos', 'mpos-api')) {
    $s = Get-Website -Name $site -ErrorAction SilentlyContinue
    if ($s) {
        $ok = $s.State -eq 'Started'
        Write-Host ("  IIS site '{0}': {1}" -f $site, $s.State) -ForegroundColor ($(if ($ok) {'Green'} else {'Red'}))
        if (-not $ok) { $results.Add([pscustomobject]@{Name="IIS $site"; OK=$false; Error="Site state: $($s.State)"}) }
    } else {
        Write-Host ("  IIS site '{0}': NOT FOUND" -f $site) -ForegroundColor Red
        $results.Add([pscustomobject]@{Name="IIS $site"; OK=$false; Error='Site missing'})
    }
}

# --- Internal HTTP checks (bypass proxy, verify each process directly) ---
Write-Host ""
Write-Host "Internal endpoints:" -ForegroundColor Cyan
Test-Url -Name 'Backend health' -Url "http://127.0.0.1:$BackendPort/health"
Test-Url -Name 'Storefront root' -Url "http://127.0.0.1:$StorefrontPort/store" -ExpectedStatus @(200, 307, 308)

# --- Public HTTPS checks (end-to-end through IIS reverse proxy + SSL) ---
if (-not $SkipPublic) {
    Write-Host ""
    Write-Host "Public endpoints:" -ForegroundColor Cyan
    Test-Url -Name 'Frontend SPA'     -Url "$PublicUrl/"
    Test-Url -Name 'API via proxy'    -Url "$PublicUrl/api/v1/health" -ExpectedStatus @(200, 401, 404)
    Test-Url -Name 'Storefront proxy' -Url "$PublicUrl/store"          -ExpectedStatus @(200, 307, 308)
}

# --- Summary ---
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
$failed = $results | Where-Object { -not $_.OK }
$passed = $results | Where-Object { $_.OK }
Write-Host ("  Passed: {0}" -f $passed.Count) -ForegroundColor Green
Write-Host ("  Failed: {0}" -f $failed.Count) -ForegroundColor ($(if ($failed) {'Red'} else {'Green'}))

if ($failed) {
    Write-Host ""
    Write-Host "Failures:" -ForegroundColor Red
    $failed | ForEach-Object {
        Write-Host ("  • {0}: {1}" -f $_.Name, ($_.Error ?? "status $($_.Status)")) -ForegroundColor Red
    }
    exit 1
}

Write-Host ""
Write-Host "All checks passed." -ForegroundColor Green
exit 0
