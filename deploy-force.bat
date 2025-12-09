@echo off
echo ===================================================
echo   FORCE DEPLOYMENT (NON-INTERACTIVE)
echo ===================================================

echo.
echo 1. Adding all changes...
git add .

echo.
echo 2. Committing...
git commit -m "deploy: full UI integration with auth and generation logic"

echo.
echo 3. Pushing to GitHub...
git push origin main

echo.
echo 4. Deploying to Vercel (Production)...
call vercel --prod

echo.
echo ===================================================
echo   DEPLOYMENT COMPLETE
echo ===================================================
