<#
.SYNOPSIS
    Pull the latest MPOS release from GitHub and extract it locally.

.DESCRIPTION
    Downloads the latest `mpos-vX.Y.Z.zip` artifact published by the Release
    workflow, verifies its SHA-256, and extracts it into
    C:\mpos-deploy\artifacts. Afterwards run deploy\deploy.ps1 as normal.

    Use this on the Windows server to pull pre-built artifacts instead of
    building locally.

    Run as Administrator:
        pwsh -File deploy\pull-release.ps1

.PARAMETER Repo
    GitHub owner/repo. Defaults to mmitsa/ms-cashier.
.PARAMETER Tag
    Specific tag to pull (e.g. v1.2.0). Defaults to the latest release.
.PARAMETER StagingDir
    Where to extract. Defaults to C:\mpos-deploy.
.PARAMETER GitHubToken
    Personal access token for private repos. Defaults to $env:GITHUB_TOKEN.
#>
[CmdletBinding()]
param(
    [string]$Repo        = 'mmitsa/ms-cashier',
    [string]$Tag         = '',
    [string]$StagingDir  = 'C:\mpos-deploy',
    [string]$GitHubToken = $env:GITHUB_TOKEN
)

$ErrorActionPreference = 'Stop'

$headers = @{ 'User-Agent' = 'mpos-deploy' }
if ($GitHubToken) { $headers['Authorization'] = "Bearer $GitHubToken" }

# --- Resolve the release ---
if ($Tag) {
    $apiUrl = "https://api.github.com/repos/$Repo/releases/tags/$Tag"
} else {
    $apiUrl = "https://api.github.com/repos/$Repo/releases/latest"
}

Write-Host "==> Querying $apiUrl" -ForegroundColor Cyan
$release = Invoke-RestMethod -Uri $apiUrl -Headers $headers
Write-Host "    Release: $($release.name) ($($release.tag_name))" -ForegroundColor Green

$zipAsset = $release.assets | Where-Object { $_.name -like 'mpos-*.zip' } | Select-Object -First 1
$shaAsset = $release.assets | Where-Object { $_.name -like 'mpos-*.zip.sha256' } | Select-Object -First 1
if (-not $zipAsset) { throw "No mpos-*.zip asset found in release $($release.tag_name)" }

# --- Prepare staging dir ---
if (-not (Test-Path $StagingDir)) {
    New-Item -ItemType Directory -Path $StagingDir -Force | Out-Null
}

$downloadsDir = Join-Path $StagingDir 'downloads'
if (-not (Test-Path $downloadsDir)) {
    New-Item -ItemType Directory -Path $downloadsDir -Force | Out-Null
}

$zipPath = Join-Path $downloadsDir $zipAsset.name

# --- Download ---
Write-Host "==> Downloading $($zipAsset.name) ($([math]::Round($zipAsset.size/1MB, 1)) MB)" -ForegroundColor Cyan
$downloadHeaders = $headers.Clone()
$downloadHeaders['Accept'] = 'application/octet-stream'
Invoke-WebRequest -Uri $zipAsset.url -Headers $downloadHeaders -OutFile $zipPath -UseBasicParsing

# --- Verify SHA256 if available ---
if ($shaAsset) {
    $shaPath = Join-Path $downloadsDir $shaAsset.name
    Invoke-WebRequest -Uri $shaAsset.url -Headers $downloadHeaders -OutFile $shaPath -UseBasicParsing
    $expected = (Get-Content $shaPath -Raw).Split()[0].Trim().ToLower()
    $actual   = (Get-FileHash $zipPath -Algorithm SHA256).Hash.ToLower()
    if ($expected -ne $actual) {
        throw "SHA256 mismatch!`n  expected: $expected`n  actual:   $actual"
    }
    Write-Host "    SHA256 verified" -ForegroundColor Green
} else {
    Write-Warning "No SHA256 file found in release — skipping integrity check"
}

# --- Extract (replace artifacts + deploy) ---
$artifactsDir = Join-Path $StagingDir 'artifacts'
if (Test-Path $artifactsDir) {
    Remove-Item $artifactsDir -Recurse -Force
}
Write-Host "==> Extracting to $StagingDir" -ForegroundColor Cyan
Expand-Archive -Path $zipPath -DestinationPath $artifactsDir -Force

# If deploy scripts were bundled, move them up one level so deploy\deploy.ps1 works
$bundledDeploy = Join-Path $artifactsDir 'deploy'
$topDeploy     = Join-Path $StagingDir 'deploy'
if (Test-Path $bundledDeploy) {
    if (Test-Path $topDeploy) { Remove-Item $topDeploy -Recurse -Force }
    Move-Item $bundledDeploy $topDeploy
}

Write-Host ""
Write-Host "Pulled release $($release.tag_name) successfully." -ForegroundColor Green
Write-Host "Next step:" -ForegroundColor Yellow
Write-Host "  cd $StagingDir" -ForegroundColor Yellow
Write-Host "  pwsh -File deploy\deploy.ps1" -ForegroundColor Yellow
