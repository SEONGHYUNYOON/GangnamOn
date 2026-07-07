@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

REM Use ASCII-only text to avoid CMD encoding errors on Korean Windows.
echo ============================================
echo  GangnamOn - Appwrite DB setup (API key)
echo ============================================
echo.
echo Create an API key in Appwrite Console (all scopes) and paste it below.
echo The key is NOT saved to this file.
echo.

set /p APIKEY=Paste API Key Secret: 
if "%APIKEY%"=="" (
  echo No key entered. Aborting.
  goto :fail
)

echo.
echo [1/3] Configure Appwrite CLI client with API key...
call npx appwrite client --endpoint "https://fra.cloud.appwrite.io/v1" --project-id "6a4be56a00369cf49a31" --key "%APIKEY%"
if errorlevel 1 goto :fail

echo.
echo [2/3] Push schema from appwrite.json (DB + collections + buckets)...
call npx appwrite push all
if errorlevel 1 goto :fail

echo.
echo [3/3] Verify (optional test script)...
if exist "scripts\test-appwrite.mjs" (
  call node scripts\test-appwrite.mjs
)

echo.
echo ============================================
echo  DONE - Appwrite schema push finished.
echo  Next: set Vercel env vars and redeploy gangnam-on.
echo ============================================
pause
exit /b 0

:fail
echo.
echo ============================================
echo  FAILED - see errors above.
echo  Common fixes:
echo    1) Re-create API key with ALL scopes
echo    2) Check project id / endpoint
echo    3) Check internet / Appwrite console access
echo ============================================
pause
exit /b 1
