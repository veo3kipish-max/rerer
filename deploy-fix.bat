@echo off
echo ===================================================
echo   FIXING GOOGLE DRIVE DEPLOY (KIPISH.FUN)
echo ===================================================

echo.
echo 1. Adding configuration files...
git add vercel.json App.tsx components/GoogleDriveSettings.tsx

echo.
echo 2. Committing changes...
git commit -m "fix: use polling and _blank for google drive auth to support Telegram apps"

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
