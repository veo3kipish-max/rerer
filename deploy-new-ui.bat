@echo off
echo ===================================================
echo   DEPLOYING: NEW INTERFACE (LUCIDE + APP NEW)
echo ===================================================

echo.
echo 1. Adding changed files...
git add package.json package-lock.json AppNew.tsx index.tsx

echo.
echo 2. Committing changes...
git commit -m "feat: switch to new UI interface with Lucide icons"

echo.
echo 3. Pushing to GitHub...
git push origin main

echo.
echo 4. Deploying to Production...
call vercel --prod

echo.
echo ===================================================
echo   DONE! NEW UI IS LIVE.
echo ===================================================
pause
