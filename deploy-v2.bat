@echo off
echo ===========================================
echo   DEPLOYING V2 INTERFACE
echo ===========================================

echo 1. Adding files...
git add .

echo 2. Committing...
git commit -m "feat: launch v2 obsidian interface"

echo 3. Pushing...
git push origin main

echo 4. Deploying to Vercel...
call vercel --prod

echo DONE.
