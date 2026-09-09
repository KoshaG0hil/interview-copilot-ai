@echo off
title Interview Copilot AI - Launcher
echo ========================================================
echo   Launching Interview Copilot AI (Stealth HUD & Hub)
echo ========================================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [INFO] Installing dependencies...
    call npm install
)

REM Build typescript if dist-electron doesn't exist
if not exist "dist-electron\main.js" (
    echo [INFO] Compiling desktop app...
    call npm run build
)

echo [INFO] Starting application in dev mode...
call npm run electron:dev
pause
