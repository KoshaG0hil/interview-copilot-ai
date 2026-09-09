@echo off
title Push Interview Copilot to GitHub
echo ========================================================
echo   Push Interview Copilot AI to your GitHub
echo ========================================================
echo.
echo Step 1: Go to https://github.com/new in your browser
echo Step 2: Name your repository (e.g., interview-copilot-ai)
echo Step 3: Choose Public or Private, and DO NOT initialize with README/license
echo Step 4: Click "Create repository"
echo.
echo ========================================================
set /p REPO_URL="Enter your GitHub Repository URL (e.g. https://github.com/username/interview-copilot-ai.git): "

if "%REPO_URL%"=="" (
    echo [ERROR] No URL entered. Exiting...
    pause
    exit /b
)

echo.
echo [INFO] Setting up git remote origin...
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git branch -M main

echo [INFO] Pushing code to GitHub...
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo [SUCCESS] Your repository is live on GitHub!
    echo Anyone with the link can clone and run it!
    echo ========================================================
) else (
    echo.
    echo [ERROR] Push failed. Make sure you are logged into Git/GitHub on your machine.
)
echo.
pause
