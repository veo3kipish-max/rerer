@echo off
echo ========================================
echo Автоматическая настройка Supabase Secrets
echo ========================================
echo.

echo Открываю Supabase Dashboard...
start https://supabase.com/dashboard/project/ndrdksmdkhljymuvxjly/settings/functions

echo.
echo ========================================
echo ВАЖНО: Добавьте эти Secrets в Supabase:
echo ========================================
echo.
echo Name: TELEGRAM_BOT_TOKEN
echo Value: 8541442708:AAHupGGqO41UXXZfjMbDoErw1AgOP317gIE
echo.
echo Name: TELEGRAM_PROVIDER_TOKEN_TEST
echo Value: 6073714100:TEST:TG_0Hu7mBvcM_aynsU1VNlN9r8A
echo.
echo Name: TELEGRAM_PROVIDER_TOKEN_LIVE
echo Value: 5775769170:LIVE:TG_W86WACpRtP4FJUebpZTbzm8A
echo.
echo ========================================
echo После добавления secrets нажмите любую клавишу
echo для деплоя Edge Function...
echo ========================================
pause

echo.
echo Деплоим Edge Function на Supabase...
cd /d "%~dp0"
call supabase functions deploy create-telegram-invoice --no-verify-jwt

echo.
echo ========================================
echo ✅ Настройка завершена!
echo ========================================
echo.
echo Теперь:
echo 1. Откройте бота @ai_stud_ai_bot
echo 2. Нажмите кнопку меню внизу
echo 3. Попробуйте купить пакет
echo.
pause
