@echo off
chcp 65001 >nul
cls
echo ========================================
echo AI Photo Studio - Обновление ключей
echo ========================================
echo.
echo ✅ Google Client ID уже настроен!
echo.
echo Осталось добавить:
echo.

REM Get Gemini API Key
echo 1️⃣ Gemini API Key
echo    Откройте: https://aistudio.google.com/apikey
echo    Нажмите "Create API key" и скопируйте ключ
echo.
set /p GEMINI_KEY="   Введите Gemini API Key (AIza...): "
echo.

REM Get Telegram Bot Username
echo 2️⃣ Telegram Bot Username (опционально)
echo    Telegram → @BotFather → /newbot
echo    Скопируйте username БЕЗ @
echo.
set /p TELEGRAM_BOT="   Введите Telegram Bot Username (или Enter для пропуска): "
echo.

REM If Telegram bot is empty, use placeholder
if "%TELEGRAM_BOT%"=="" set TELEGRAM_BOT=your_bot_username_here

REM Create .env.local
echo Создаю .env.local...
(
echo # Gemini API Key
echo GEMINI_API_KEY=%GEMINI_KEY%
echo.
echo # Google OAuth Client ID
echo VITE_GOOGLE_CLIENT_ID=993386293176-lk3fd3psp5emergb1f9mhla0ml0ba.apps.googleusercontent.com
echo.
echo # Telegram Bot Username
echo VITE_TELEGRAM_BOT_USERNAME=%TELEGRAM_BOT%
) > .env.local

echo.
echo ========================================
echo ✅ Файл .env.local обновлен!
echo ========================================
echo.
echo Содержимое:
echo.
type .env.local
echo.
echo ========================================
echo Следующие шаги:
echo ========================================
echo.
echo 1. Запустите: npm run dev
echo 2. Откройте: http://localhost:5173
echo 3. Попробуйте войти через Google
echo.
echo Для Vercel добавьте те же переменные:
echo https://vercel.com/nicks-projects-00786ef7/1123/settings/environment-variables
echo.
pause
