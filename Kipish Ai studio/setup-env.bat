@echo off
echo ========================================
echo AI Photo Studio - Environment Setup
echo ========================================
echo.

REM Check if .env.local exists
if not exist ".env.local" (
    echo [ERROR] .env.local file not found!
    echo Creating template...
    copy .env.example .env.local
    echo.
)

echo Please edit .env.local file and add your credentials:
echo.
echo 1. GEMINI_API_KEY
echo    Get it from: https://aistudio.google.com/apikey
echo.
echo 2. VITE_GOOGLE_CLIENT_ID
echo    Get it from: https://console.cloud.google.com/apis/credentials
echo    - Create OAuth 2.0 Client ID (Web application)
echo    - Add authorized origin: http://localhost:5173
echo.
echo 3. VITE_TELEGRAM_BOT_USERNAME
echo    Get it from: @BotFather in Telegram
echo    - Send /newbot to create a bot
echo    - Send /setdomain and set: localhost
echo.

echo Opening .env.local file for editing...
notepad .env.local

echo.
echo ========================================
echo Next Steps:
echo ========================================
echo.
echo 1. Save .env.local with your credentials
echo 2. Run: npm run dev
echo 3. Open: http://localhost:5173
echo.
echo For production (Vercel):
echo - Add same variables at: https://vercel.com/nicks-projects-00786ef7/1123/settings/environment-variables
echo - Don't forget to Redeploy after adding variables!
echo.
pause
