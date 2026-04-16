@echo off
setlocal enabledelayedexpansion

:: ============================================
:: MPOS Zero-Downtime Auto-Deploy
:: Builds in staging, validates, hot-swaps
:: ============================================

set REPO_DIR=D:\Mohamed\mpos\ms-cashier
set STAGING=D:\Mohamed\mpos\ms-cashier\publish\staging
set IIS_FRONTEND=C:\inetpub\mpos\frontend
set IIS_BACKEND=C:\inetpub\mpos\backend
set IIS_STOREFRONT=C:\inetpub\mpos\storefront
set BACKUP_DIR=D:\Mohamed\mpos\ms-cashier\publish\rollback
set LOG_FILE=D:\Mohamed\mpos\ms-cashier\deploy\webhook\deploy.log
set API_URL=http://127.0.0.1:5020
set APPCMD=%SystemRoot%\System32\inetsrv\appcmd.exe

call :log "============================================"
call :log "ZERO-DOWNTIME DEPLOY STARTED"
call :log "============================================"

:: ── Phase 1: Pull code ──────────────────────
call :log "[1/8] Pulling latest code..."
cd /d %REPO_DIR%
git config --global --add safe.directory %REPO_DIR% 2>nul
git config --global --add safe.directory D:/Mohamed/mpos/ms-cashier 2>nul
git stash 2>>%LOG_FILE%
git pull origin main 2>>%LOG_FILE%
if errorlevel 1 (
    call :log "ERROR: git pull failed. ABORTING."
    exit /b 1
)
call :log "Code pulled successfully."

:: ── Phase 2: Build in staging (site stays live) ──
call :log "[2/8] Building backend in staging..."
if exist %STAGING% rmdir /s /q %STAGING%
mkdir %STAGING%\backend %STAGING%\frontend %STAGING%\storefront

cd /d %REPO_DIR%\backend
dotnet publish MsCashier.API\MsCashier.API.csproj -c Release -o %STAGING%\backend --nologo -v quiet 2>>%LOG_FILE%
if errorlevel 1 (
    call :log "ERROR: Backend build failed. Site unchanged. ABORTING."
    exit /b 1
)
call :log "Backend built OK."

call :log "[3/8] Building frontend in staging..."
cd /d %REPO_DIR%\frontend
call npm run build 2>>%LOG_FILE%
if errorlevel 1 (
    call :log "ERROR: Frontend build failed. Site unchanged. ABORTING."
    exit /b 1
)
:: Copy dist to staging
robocopy %REPO_DIR%\frontend\dist %STAGING%\frontend /MIR /NFL /NDL /NJH /NJS /nc /ns /np >nul
call :log "Frontend built OK."

call :log "[4/8] Building storefront in staging..."
cd /d %REPO_DIR%\storefront
call npm run build 2>>%LOG_FILE%
if errorlevel 1 (
    call :log "ERROR: Storefront build failed. Site unchanged. ABORTING."
    exit /b 1
)
:: Copy standalone to staging
set STANDALONE=%REPO_DIR%\storefront\.next\standalone
if exist %STANDALONE% (
    robocopy %STANDALONE% %STAGING%\storefront /MIR /NFL /NDL /NJH /NJS /nc /ns /np >nul
    robocopy %REPO_DIR%\storefront\.next\static %STAGING%\storefront\.next\static /MIR /NFL /NDL /NJH /NJS /nc /ns /np >nul
    if exist %REPO_DIR%\storefront\public (
        robocopy %REPO_DIR%\storefront\public %STAGING%\storefront\public /MIR /NFL /NDL /NJH /NJS /nc /ns /np >nul
    )
)
call :log "Storefront built OK."

:: ── Phase 3: Pre-deploy health check ──
call :log "[5/8] Pre-deploy health check..."
curl -s -o nul -w "%%{http_code}" %API_URL%/health > %STAGING%\pre_health.txt 2>nul
set /p PRE_HEALTH=<%STAGING%\pre_health.txt
call :log "Current site health: %PRE_HEALTH%"

:: ── Phase 4: Backup current deployment ──
call :log "[6/8] Backing up current deployment..."
if exist %BACKUP_DIR% rmdir /s /q %BACKUP_DIR%
mkdir %BACKUP_DIR%\backend %BACKUP_DIR%\frontend %BACKUP_DIR%\storefront
robocopy %IIS_BACKEND% %BACKUP_DIR%\backend /MIR /NFL /NDL /NJH /NJS /nc /ns /np >nul
robocopy %IIS_FRONTEND% %BACKUP_DIR%\frontend /MIR /NFL /NDL /NJH /NJS /nc /ns /np >nul
robocopy %IIS_STOREFRONT% %BACKUP_DIR%\storefront /MIR /NFL /NDL /NJH /NJS /nc /ns /np >nul
call :log "Backup complete."

:: ── Phase 5: Hot-swap deploy ──
call :log "[7/8] Hot-swapping deployment..."

:: 5a. Deploy frontend FIRST (static files, no restart needed, instant)
copy /Y %IIS_FRONTEND%\web.config %STAGING%\frontend\web.config >nul
robocopy %STAGING%\frontend %IIS_FRONTEND% /MIR /NFL /NDL /NJH /NJS /nc /ns /np >nul
call :log "Frontend deployed (zero downtime - static files)."

:: 5b. Deploy backend (app_offline -> copy -> remove app_offline)
:: app_offline.htm tells IIS to gracefully unload the app, release DLL locks
copy /Y %IIS_BACKEND%\appsettings.Production.json %STAGING%\backend\appsettings.Production.json >nul
copy /Y %IIS_BACKEND%\web.config %STAGING%\backend\web.config >nul
if not exist %STAGING%\backend\logs mkdir %STAGING%\backend\logs

:: Drop app_offline.htm to gracefully stop the app (IIS releases DLLs)
echo ^<html^>^<body^>^<h1^>Updating... Please wait^</h1^>^</body^>^</html^> > %IIS_BACKEND%\app_offline.htm
call :log "Backend: app_offline.htm placed, waiting for graceful shutdown..."
timeout /t 5 /nobreak >nul

:: Now copy files (DLLs are unlocked)
robocopy %STAGING%\backend %IIS_BACKEND% /MIR /XF app_offline.htm /NFL /NDL /NJH /NJS /nc /ns /np >nul

:: Remove app_offline.htm to bring the app back online
del /q %IIS_BACKEND%\app_offline.htm 2>nul
call :log "Backend deployed (app_offline swap - near zero downtime)."

:: 5c. Deploy storefront (restart service)
robocopy %STAGING%\storefront %IIS_STOREFRONT% /MIR /NFL /NDL /NJH /NJS /nc /ns /np >nul

:: Find nssm
set NSSM=C:\Users\enmoh\AppData\Local\Microsoft\WinGet\Packages\NSSM.NSSM_Microsoft.Winget.Source_8wekyb3d8bbwe\nssm-2.24-101-g897c7ad\win64\nssm.exe
if exist "%NSSM%" (
    "%NSSM%" restart mpos-storefront >nul 2>&1
    call :log "Storefront service restarted."
) else (
    call :log "WARNING: NSSM not found, storefront not restarted."
)

:: ── Phase 6: Post-deploy validation ──
call :log "[8/8] Post-deploy validation..."

:: Wait for API to come back up (max 30 seconds)
set HEALTHY=0
for /L %%i in (1,1,10) do (
    if !HEALTHY! equ 0 (
        timeout /t 3 /nobreak >nul
        curl -s -o nul -w "%%{http_code}" %API_URL%/health > %STAGING%\post_health.txt 2>nul
        set /p POST_STATUS=<%STAGING%\post_health.txt
        if "!POST_STATUS!"=="200" (
            set HEALTHY=1
            call :log "Health check PASSED (attempt %%i)."
        ) else (
            call :log "Health check attempt %%i: !POST_STATUS! (waiting...)"
        )
    )
)

if !HEALTHY! equ 0 (
    call :log "CRITICAL: Health check FAILED after 30s! Rolling back..."
    goto :rollback
)

:: Verify frontend is serving
curl -s -o nul -w "%%{http_code}" http://localhost/ -H "Host: mops.mmit.sa" > %STAGING%\fe_health.txt 2>nul
set /p FE_STATUS=<%STAGING%\fe_health.txt
if not "%FE_STATUS%"=="200" (
    call :log "WARNING: Frontend returned %FE_STATUS% (expected 200)"
)

call :log "============================================"
call :log "DEPLOY SUCCESS - Zero downtime achieved"
call :log "============================================"

:: Cleanup staging
rmdir /s /q %STAGING% 2>nul
exit /b 0

:: ── Rollback procedure ──
:rollback
call :log "ROLLING BACK to previous version..."

:: Restore backend
robocopy %BACKUP_DIR%\backend %IIS_BACKEND% /MIR /NFL /NDL /NJH /NJS /nc /ns /np >nul
%APPCMD% recycle apppool /apppool.name:"mpos-api" >nul 2>&1

:: Restore frontend
robocopy %BACKUP_DIR%\frontend %IIS_FRONTEND% /MIR /NFL /NDL /NJH /NJS /nc /ns /np >nul

:: Restore storefront
robocopy %BACKUP_DIR%\storefront %IIS_STOREFRONT% /MIR /NFL /NDL /NJH /NJS /nc /ns /np >nul
if exist "%NSSM%" "%NSSM%" restart mpos-storefront >nul 2>&1

:: Verify rollback
timeout /t 10 /nobreak >nul
curl -s -o nul -w "%%{http_code}" %API_URL%/health > %STAGING%\rb_health.txt 2>nul
set /p RB_STATUS=<%STAGING%\rb_health.txt
call :log "Rollback health: %RB_STATUS%"

if "%RB_STATUS%"=="200" (
    call :log "ROLLBACK SUCCESS - Site restored to previous version."
) else (
    call :log "CRITICAL: Rollback health check also failed! Manual intervention required."
)
exit /b 1

:: ── Logging helper ──
:log
echo [%date% %time%] %~1
echo [%date% %time%] %~1 >> %LOG_FILE%
exit /b 0
