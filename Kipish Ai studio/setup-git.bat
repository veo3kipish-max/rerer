@echo off
echo ========================================
echo AI Photo Studio - Git Setup Script
echo ========================================
echo.

REM Check if Git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed!
    echo.
    echo Please install Git from: https://git-scm.com/download/win
    echo After installation, restart this script.
    pause
    exit /b 1
)

echo [OK] Git is installed
echo.

REM Navigate to project directory
cd /d "d:\Projects\1123"

echo Current directory: %CD%
echo.

REM Initialize Git repository
echo [1/5] Initializing Git repository...
git init
if %errorlevel% neq 0 (
    echo [ERROR] Failed to initialize Git repository
    pause
    exit /b 1
)
echo [OK] Git repository initialized
echo.

REM Add all files
echo [2/5] Adding all files to Git...
git add .
if %errorlevel% neq 0 (
    echo [ERROR] Failed to add files
    pause
    exit /b 1
)
echo [OK] Files added
echo.

REM Create initial commit
echo [3/5] Creating initial commit...
git commit -m "AI Photo Studio - initial commit with auth and deployment"
if %errorlevel% neq 0 (
    echo [ERROR] Failed to create commit
    pause
    exit /b 1
)
echo [OK] Commit created
echo.

REM Add remote origin
echo [4/5] Adding GitHub remote...
git remote add origin https://github.com/nickkipish-code/ai-photo-studio.git
if %errorlevel% neq 0 (
    echo [WARNING] Remote might already exist, trying to set URL...
    git remote set-url origin https://github.com/nickkipish-code/ai-photo-studio.git
)
echo [OK] Remote added
echo.

REM Rename branch to main
echo [5/5] Renaming branch to main...
git branch -M main
echo [OK] Branch renamed
echo.

echo ========================================
echo READY TO PUSH!
echo ========================================
echo.
echo Your code is ready to be pushed to GitHub.
echo.
echo GitHub will ask for authentication:
echo   Username: nickkipish-code
echo   Password: (your GitHub password or Personal Access Token)
echo.
echo Press any key to push to GitHub...
pause >nul

echo.
echo Pushing to GitHub...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo SUCCESS!
    echo ========================================
    echo.
    echo Your code has been pushed to GitHub!
    echo Repository: https://github.com/nickkipish-code/ai-photo-studio
    echo.
    echo NEXT STEPS:
    echo 1. Go to: https://vercel.com/new
    echo 2. Click "Continue with GitHub"
    echo 3. Select "ai-photo-studio" repository
    echo 4. Click "Deploy"
    echo 5. Add GEMINI_API_KEY in Settings -^> Environment Variables
    echo.
) else (
    echo.
    echo ========================================
    echo PUSH FAILED
    echo ========================================
    echo.
    echo This might be because:
    echo 1. Wrong GitHub credentials
    echo 2. Network issues
    echo 3. Repository already has content
    echo.
    echo You can try pushing manually:
    echo   git push -u origin main
    echo.
)

pause
