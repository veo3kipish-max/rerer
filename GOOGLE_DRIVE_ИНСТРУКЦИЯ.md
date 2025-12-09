# 🚀 Настройка Google Drive - Краткая инструкция

## ⚠️ Важно

Google OAuth credentials уже настроены для проекта. Ключи находятся в безопасном хранилище.

## ✅ Шаг 1: Добавить в Vercel

1. Откройте: https://vercel.com/nickkipish-code/1123/settings/environment-variables
2. Нажмите "Add New"
3. Добавьте переменную:
   - **Name**: `VITE_GOOGLE_CLIENT_ID`
   - **Value**: (скопируйте Client ID из безопасного хранилища)
   - **Environments**: Production, Preview, Development
4. Сохраните

## ✅ Шаг 2: Добавить в Supabase

1. Откройте: https://supabase.com/dashboard/project/ndrdksmdkhljymuvxjly/settings/vault/secrets
2. Добавьте 2 секрета:

**Secret 1:**
- Name: `GOOGLE_CLIENT_ID`
- Value: (Client ID)

**Secret 2:**
- Name: `GOOGLE_CLIENT_SECRET`
- Value: (Client Secret)

## ✅ Шаг 3: Локальная настройка

Создайте `.env.local`:
```env
VITE_GOOGLE_CLIENT_ID=(ваш Client ID)
```

## ✅ Шаг 4: Проверка

1. Откройте https://kipish.fun
2. Профиль → Настройки
3. Должна быть кнопка "Connect Google Drive"

---

**Примечание:** OAuth credentials хранятся отдельно в безопасном месте.
