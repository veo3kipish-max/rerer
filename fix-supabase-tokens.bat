@echo off
chcp 65001 >nul
echo ========================================
echo 🔧 Обновление Supabase Secrets
echo ========================================
echo.

echo ✅ Бот: @fotosetStudio_bot
echo ✅ Provider: Ammer Pay Live (подключен)
echo.
echo Открываю Supabase Dashboard...
start https://supabase.com/dashboard/project/ndrdksmdkhljymuvxjly/settings/functions

echo.
echo ========================================
echo 📝 ОБНОВИТЕ эти Secrets в Supabase:
echo ========================================
echo.
echo 1️⃣ TELEGRAM_BOT_TOKEN
echo    8541442708:AAHupGGqO41UXXZfjMbDoErw1AgOP317gIE
echo.
echo 2️⃣ TELEGRAM_PROVIDER_TOKEN_TEST
echo    6073714100:TEST:TG_0Hu7mBvcM_aynsU1VNlN9r8A
echo.
echo 3️⃣ TELEGRAM_PROVIDER_TOKEN_LIVE ⚠️ ИСПРАВЛЕН!
echo    5775769170:LIVE:TG_iVJWhl2ykp_HJsrIQBXtcpAA
echo.
echo ========================================
echo ⚠️ ВАЖНО:
echo Токен LIVE был обновлен! Убедитесь, что в
echo Supabase используется НОВЫЙ токен (с "cpAA")
echo ========================================
echo.
echo Нажмите любую клавишу после обновления secrets...
pause >nul

echo.
echo 🚀 Деплоим Edge Function...
call supabase functions deploy create-telegram-invoice --no-verify-jwt

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo ✅ Успешно!
    echo ========================================
    echo.
    echo Теперь протестируйте:
    echo 1. Откройте @fotosetStudio_bot в Telegram
    echo 2. Запустите бота командой /start
    echo 3. Откройте приложение через кнопку меню
    echo 4. Попробуйте купить пакет
    echo.
) else (
    echo.
    echo ❌ Ошибка при деплое!
    echo Проверьте:
    echo - Установлен ли Supabase CLI
    echo - Подключен ли проект (supabase link)
    echo.
)

echo Нажмите любую клавишу для выхода...
pause >nul
