@echo off
title Interview Copilot AI - Launcher
echo ========================================================
echo   Interview Copilot AI - Building Latest Version...
echo ========================================================
echo.

REM Check if node_modules exists, install if missing
if not exist "node_modules\" (
    echo [INFO] Installing dependencies for the first time...
    call npm install
    echo.
)

REM Always rebuild to pick up latest code changes
echo [INFO] Building latest version (takes ~10 seconds)...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Build failed. Please check the error above.
    pause
    exit /b 1
)

echo.
echo [INFO] Launching Interview Copilot AI...
echo.
call electron .
pause
