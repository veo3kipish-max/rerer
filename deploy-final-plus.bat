@echo off
echo ===================================================
echo   DEPLOYING: AUTO-DRIVE UPLOAD & UI CLEANUP
echo ===================================================

echo.
echo 1. Adding changed files...
git add components/PricingModal.tsx components/ProfileModal.tsx App.tsx

echo.
echo 2. Committing changes...
git commit -m "feat: auto-upload images to google drive, add drive button to history, remove telegram wallet"

echo.
echo 3. Pushing to GitHub...
git push origin main

echo.
echo 4. Deploying to Production...
call vercel --prod

echo.
echo ===================================================
echo   DONE! AUTO-SAVE IS LIVE.
echo ===================================================
pause
