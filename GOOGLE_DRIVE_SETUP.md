# 🎉 Google Drive Integration - Setup Guide

## ✅ Что реализовано

### 1. База данных ✅
- Добавлены поля для Google Drive токенов в таблицу `users`
- Добавлено поле `google_drive_folder_url` в таблицу `generations`
- Миграция `add_google_drive_fields` применена

### 2. Компоненты ✅
- **GoogleDriveSettings.tsx** - компонент настроек подключения
- **GoogleDriveCallback.tsx** - OAuth callback страница
- **ProfileModal.tsx** - добавлена вкладка "Настройки"

### 3. Edge Functions ✅
- **google-drive-connect** (v1) - обмен OAuth кода на токены
- **upload-to-drive** (v1) - загрузка фото в Drive

## 📋 Что нужно настроить

### 1. Google Cloud Console

#### Создайте OAuth 2.0 приложение:

1. Откройте https://console.cloud.google.com/
2. Создайте новый проект или выберите существующий
3. Перейдите в **APIs & Services** → **Credentials**
4. Нажмите **Create Credentials** → **OAuth client ID**
5. Выберите **Web application**
6. Настройте:
   - **Name**: AI Photo Studio
   - **Authorized JavaScript origins**:
     - `http://localhost:5173` (для разработки)
     - `https://kipish.fun` (продакшн)
   - **Authorized redirect URIs**:
     - `http://localhost:5173/google-drive-callback`
     - `https://kipish.fun/google-drive-callback`

7. Сохраните **Client ID** и **Client Secret**

#### Включите Drive API:

1. Перейдите в **APIs & Services** → **Library**
2. Найдите "Google Drive API"
3. Нажмите **Enable**

### 2. Переменные окружения

#### Локально (`.env.local`):
```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

#### Supabase Edge Functions Secrets:
```bash
# Установите секреты через Dashboard или CLI
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

#### Vercel (Environment Variables):
```
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### 3. Добавить route в App.tsx

Нужно добавить маршрут для callback страницы:

```tsx
import { GoogleDriveCallback } from './components/GoogleDriveCallback';

// В App.tsx добавить route:
{window.location.pathname === '/google-drive-callback' && (
    <GoogleDriveCallback />
)}
```

## 🚀 Как использовать

### Для пользователя:

1. Открыть **Профиль** → вкладка **"Настройки"**
2. Нажать **"Connect Google Drive"**
3. Авторизоваться в Google
4. После подключения все генерации будут автоматически сохраняться в Drive!

### Автоматическое сохранение:

После каждой успешной генерации фотографий нужно вызвать:

```typescript
// В коде генерации после получения результатов:
if (currentUser.dbUserId) {
    const response = await fetch(
        'https://ndrdksmdkhljymuvxjly.supabase.co/functions/v1/upload-to-drive',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${anonKey}`
            },
            body: JSON.stringify({
                userId: currentUser.dbUserId,
                generationId: generationId,
                images: resultUrls // массив URL сгенерированных фото
            })
        }
    );

    if (response.ok) {
        const data = await response.json();
        console.log('Uploaded to Drive:', data.folderUrl);
    }
}
```

## 📊 Структура в Google Drive

```
Google Drive
└── AI Photo Studio/              (корневая папка)
    ├── Photo Session - 2025-12-09/
    │   ├── photo_1.jpg
    │   ├── photo_2.jpg
    │   └── photo_3.jpg
    ├── Photo Session - 2025-12-10/
    │   └── ...
    └── ...
```

## 🔍 Проверка

### Проверить подключение:
```sql
SELECT 
    name, 
    google_drive_token IS NOT NULL as drive_connected,
    google_drive_connected_at
FROM users 
WHERE id = 'user-id';
```

### Проверить загрузки:
```sql
SELECT 
    id,
    mode,
    google_drive_folder_url,
    created_at
FROM generations 
WHERE google_drive_folder_url IS NOT NULL
ORDER BY created_at DESC;
```

## ⚠️ Важно

1. **Токены хранятся в БД** - убедитесь что RLS политики настроены правильно
2. **Refresh tokens** - автоматически обновляются при загрузке
3. **OAuth Consent Screen** - установите его в "Production" после тестирования
4. **Scopes** - используется только `https://www.googleapis.com/auth/drive.file`
   - Доступ только к файлам, созданным приложением
   - НЕ полный доступ ко всему Drive

## 🎯 Следующие шаги

1. ✅ Настроить Google OAuth credentials
2. ✅ Добавить переменные окружения
3. ⏳ Добавить route в App.tsx
4. ⏳ Интегрировать вызов upload-to-drive после генерации
5. ⏳ Протестировать полный flow

---

**Версия:** 1.0  
**Дата:** 2025-12-09  
**Статус:** ✅ Компоненты и функции готовы, требуется настройка OAuth
