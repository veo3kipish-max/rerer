@echo off
echo ===================================================
echo   FIXING GOOGLE DRIVE DEPLOY (FORCE BROWSER LINK)
echo ===================================================

echo.
echo 1. Adding changed file...
git add components/GoogleDriveSettings.tsx

echo.
echo 2. Committing changes...
git commit -m "fix: use anchor tag click to force external browser for Google Auth"

echo.
echo 3. Pushing to GitHub...
git push origin main

echo.
echo 4. Deploying to Production...
call vercel --prod

echo.
echo ===================================================
echo   DONE! PLEASE CHECK KIPISH.FUN
echo ===================================================
pause
