@echo off
echo ===================================================
echo   DEPLOYING: MOBILE SAVE IMAGE FIX
echo ===================================================

echo.
echo 1. Adding changed file...
git add components/ResultGallery.tsx

echo.
echo 2. Committing changes...
git commit -m "fix: explicit save button for mobile browsers and hint text"

echo.
echo 3. Pushing to GitHub...
git push origin main

echo.
echo 4. Deploying to Production...
call vercel --prod

echo.
echo ===================================================
echo   DONE! MOBILE SAVE SHOULD WORK NOW.
echo ===================================================
pause
