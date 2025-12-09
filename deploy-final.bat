@echo off
echo ===================================================
echo   FIXING GOOGLE CLIENT ID (HARDCODED)
echo ===================================================

echo.
echo 1. Adding changed file...
git add components/GoogleDriveSettings.tsx

echo.
echo 2. Committing changes...
git commit -m "fix: hardcode google client id to ensure connection"

echo.
echo 3. Pushing to GitHub...
git push origin main

echo.
echo 4. Deploying to Production...
call vercel --prod

echo.
echo ===================================================
echo   DONE! IT SHOULD WORK NOW.
echo ===================================================
pause
