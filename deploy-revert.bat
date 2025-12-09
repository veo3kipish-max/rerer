@echo off
echo ===================================================
echo   REVERTING TO OLD INTERFACE
echo ===================================================

echo.
echo 1. Adding changed files...
git add index.tsx

echo.
echo 2. Committing changes...
git commit -m "revert: switch back to original App UI"

echo.
echo 3. Pushing to GitHub...
git push origin main

echo.
echo 4. Deploying to Production...
call vercel --prod

echo.
echo ===================================================
echo   DONE! ORIGINAL UI RESTORED.
echo ===================================================
pause
