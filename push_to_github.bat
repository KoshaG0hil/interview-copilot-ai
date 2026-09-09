@echo off
title Push Interview Copilot to GitHub (KoshaG0hil)
echo ========================================================
echo   Pushing Interview Copilot AI to GitHub:
echo   https://github.com/KoshaG0hil/interview-copilot-ai
echo ========================================================
echo.

git remote remove origin 2>nul
git remote add origin https://github.com/KoshaG0hil/interview-copilot-ai.git
git branch -M main

echo [INFO] Pushing main branch to GitHub...
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo [SUCCESS] Your repository is now live at:
    echo https://github.com/KoshaG0hil/interview-copilot-ai
    echo Anyone with the link can clone and run it!
    echo ========================================================
) else (
    echo.
    echo [NOTE] If the repository does not exist yet on GitHub:
    echo 1. Go to https://github.com/new?name=interview-copilot-ai
    echo 2. Click "Create repository"
    echo 3. Run this script again!
)
echo.
pause
