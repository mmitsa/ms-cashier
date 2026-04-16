@echo off
setlocal enabledelayedexpansion

echo ============================================
echo MPOS Auto-Deploy - %date% %time%
echo ============================================

set REPO_DIR=D:\Mohamed\mpos\ms-cashier
set IIS_FRONTEND=C:\inetpub\mpos\frontend
set IIS_BACKEND=C:\inetpub\mpos\backend
set IIS_STOREFRONT=C:\inetpub\mpos\storefront

:: 1. Pull latest code
echo [1/6] Pulling latest from GitHub...
cd /d %REPO_DIR%
git pull origin main
if errorlevel 1 (
    echo ERROR: git pull failed
    exit /b 1
)

:: 2. Build backend
echo [2/6] Building backend...
cd /d %REPO_DIR%\backend
dotnet publish MsCashier.API\MsCashier.API.csproj -c Release -o %REPO_DIR%\publish\backend --nologo -v quiet
if errorlevel 1 (
    echo ERROR: Backend build failed
    exit /b 1
)

:: 3. Build frontend
echo [3/6] Building frontend...
cd /d %REPO_DIR%\frontend
call npm run build
if errorlevel 1 (
    echo ERROR: Frontend build failed
    exit /b 1
)

:: 4. Build storefront
echo [4/6] Building storefront...
cd /d %REPO_DIR%\storefront
call npm run build
if errorlevel 1 (
    echo ERROR: Storefront build failed
    exit /b 1
)

:: 5. Deploy to IIS
echo [5/6] Deploying to IIS...

:: Deploy backend (preserve appsettings.Production.json and web.config)
copy /Y %IIS_BACKEND%\appsettings.Production.json %REPO_DIR%\publish\backend\appsettings.Production.json
copy /Y %IIS_BACKEND%\web.config %REPO_DIR%\publish\backend\web.config
robocopy %REPO_DIR%\publish\backend %IIS_BACKEND% /MIR /NFL /NDL /NJH /NJS /nc /ns /np
if not exist %IIS_BACKEND%\logs mkdir %IIS_BACKEND%\logs

:: Deploy frontend (preserve web.config)
copy /Y %IIS_FRONTEND%\web.config %REPO_DIR%\frontend\dist\web.config.bak 2>nul
robocopy %REPO_DIR%\frontend\dist %IIS_FRONTEND% /MIR /NFL /NDL /NJH /NJS /nc /ns /np
:: Restore web.config with proxy rules
call :write_frontend_webconfig

:: Deploy storefront
set STANDALONE_DIR=%REPO_DIR%\storefront\.next\standalone
if exist %STANDALONE_DIR% (
    robocopy %STANDALONE_DIR% %IIS_STOREFRONT% /MIR /NFL /NDL /NJH /NJS /nc /ns /np
    robocopy %REPO_DIR%\storefront\.next\static %IIS_STOREFRONT%\.next\static /MIR /NFL /NDL /NJH /NJS /nc /ns /np
    if exist %REPO_DIR%\storefront\public (
        robocopy %REPO_DIR%\storefront\public %IIS_STOREFRONT%\public /MIR /NFL /NDL /NJH /NJS /nc /ns /np
    )
)

:: 6. Restart services
echo [6/6] Restarting services...
%SystemRoot%\System32\inetsrv\appcmd recycle apppool /apppool.name:"mpos-api"
%SystemRoot%\System32\inetsrv\appcmd recycle apppool /apppool.name:"mpos-frontend"
nssm restart mpos-storefront 2>nul

echo ============================================
echo DEPLOY COMPLETE - %date% %time%
echo ============================================
exit /b 0

:write_frontend_webconfig
(
echo ^<?xml version="1.0" encoding="utf-8"?^>
echo ^<configuration^>
echo   ^<system.webServer^>
echo     ^<rewrite^>
echo       ^<rules^>
echo         ^<rule name="API Proxy" stopProcessing="true"^>
echo           ^<match url="^^api/(.*)" /^>
echo           ^<action type="Rewrite" url="http://127.0.0.1:5020/api/{R:1}" /^>
echo         ^</rule^>
echo         ^<rule name="Storefront Proxy" stopProcessing="true"^>
echo           ^<match url="^^store(.*)" /^>
echo           ^<action type="Rewrite" url="http://127.0.0.1:5022/store{R:1}" /^>
echo         ^</rule^>
echo         ^<rule name="Health Proxy" stopProcessing="true"^>
echo           ^<match url="^^health$" /^>
echo           ^<action type="Rewrite" url="http://127.0.0.1:5020/health" /^>
echo         ^</rule^>
echo         ^<rule name="Swagger Proxy" stopProcessing="true"^>
echo           ^<match url="^^swagger(.*)" /^>
echo           ^<action type="Rewrite" url="http://127.0.0.1:5020/swagger{R:1}" /^>
echo         ^</rule^>
echo         ^<rule name="SPA Routes" stopProcessing="true"^>
echo           ^<match url=".*" /^>
echo           ^<conditions logicalGrouping="MatchAll"^>
echo             ^<add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" /^>
echo             ^<add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" /^>
echo           ^</conditions^>
echo           ^<action type="Rewrite" url="/index.html" /^>
echo         ^</rule^>
echo       ^</rules^>
echo     ^</rewrite^>
echo     ^<staticContent^>
echo       ^<remove fileExtension=".webmanifest" /^>
echo       ^<mimeMap fileExtension=".webmanifest" mimeType="application/manifest+json" /^>
echo     ^</staticContent^>
echo   ^</system.webServer^>
echo ^</configuration^>
) > %IIS_FRONTEND%\web.config
exit /b 0
