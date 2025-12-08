@echo off
chcp 65001 >nul
echo ========================================
echo AI Photo Studio - Настройка переменных
echo ========================================
echo.

echo Пожалуйста, введите ваши учетные данные:
echo.

set /p GEMINI_KEY="1. Gemini API Key (AIza...): "
echo.

set /p GOOGLE_CLIENT="2. Google OAuth Client ID (123...apps.googleusercontent.com): "
echo.

set /p TELEGRAM_BOT="3. Telegram Bot Username (БЕЗ @): "
echo.

echo Создаю .env.local...
(
echo # Gemini API Key
echo GEMINI_API_KEY=%GEMINI_KEY%
echo.
echo # Google OAuth Client ID
echo VITE_GOOGLE_CLIENT_ID=%GOOGLE_CLIENT%
echo.
echo # Telegram Bot Username
echo VITE_TELEGRAM_BOT_USERNAME=%TELEGRAM_BOT%
) > .env.local

echo.
echo ✅ Файл .env.local создан!
echo.
echo Содержимое:
type .env.local
echo.
echo ========================================
echo Следующие шаги:
echo ========================================
echo.
echo 1. Запустите: npm run dev
echo 2. Откройте: http://localhost:5173
echo 3. Проверьте авторизацию через Google и Telegram
echo.
echo Для Vercel добавьте те же переменные:
echo https://vercel.com/nicks-projects-00786ef7/1123/settings/environment-variables
echo.
pause
