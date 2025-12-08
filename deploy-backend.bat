@echo off
chcp 65001 >nul
cls
echo ===================================================
echo 🚀 DEPLOYING BACKEND FIXES (Subscription Tier & Payments)
echo ===================================================
echo.
echo This script will update the server-side logic to correctly
echo apply the "Light" plan after purchase.
echo.
echo ⚠️  Ensure you are logged in to Supabase CLI.
echo    If not, run: npx supabase login
echo.
pause

echo.
echo 1. Deploying Invoice Creator (sends tier info)...
call npx supabase functions deploy create-telegram-invoice --project-ref ndrdksmdkhljymuvxjly --no-verify-jwt

echo.
echo 2. Deploying Telegram Webhook (updates database tier)...
call npx supabase functions deploy telegram-webhook --project-ref ndrdksmdkhljymuvxjly --no-verify-jwt

echo.
echo 3. Deploying WayForPay Webhook (updates database tier)...
call npx supabase functions deploy wayforpay-webhook --project-ref ndrdksmdkhljymuvxjly --no-verify-jwt

echo.
echo ===================================================
echo ✅ DEPLOYMENT COMPLETE
echo ===================================================
echo.
echo Please try the following:
echo 1. Refresh your Telegram Mini App.
echo 2. Check your profile. If it still says "Free", the previous payment
echo    was processed by the OLD code. New payments will work correctly.
echo.
echo 3. REGARDING THE "ERROR OPENING PAGE" (kipish.fun):
echo    If you see an error about "kipish.fun", it means your domain
echo    is not correctly connected to this app.
echo    Update SUPABASE_SECRETS.txt with the correct Vercel URL if needed.
echo.
pause
