# Авторизация - Документация

## Обзор

Приложение поддерживает два метода авторизации:
- **Google OAuth 2.0** - через Google аккаунт
- **Telegram Login Widget** - через Telegram аккаунт

## Режимы работы

### Демо-режим (по умолчанию)

Если переменные окружения не настроены, приложение работает в демо-режиме:
- Авторизация происходит мгновенно
- Создается временный пользователь
- Данные сохраняются в localStorage

### Продакшн-режим

При настройке `VITE_GOOGLE_CLIENT_ID` и/или `VITE_TELEGRAM_BOT_USERNAME`:
- Используется настоящая OAuth авторизация
- Получаются реальные данные пользователя (имя, аватар)
- Безопасная аутентификация

## Архитектура

### Компоненты

```
AuthScreen.tsx
├── Google OAuth Integration
│   ├── Google Identity Services SDK
│   ├── JWT Token Decoding
│   └── User Profile Extraction
│
└── Telegram Login Widget
    ├── Telegram Widget SDK
    ├── Callback Handler
    └── User Data Processing
```

### Поток авторизации

```
1. Пользователь открывает приложение
   ↓
2. AuthScreen проверяет localStorage
   ↓
3. Если нет сохраненного пользователя → показывает экран авторизации
   ↓
4. Пользователь выбирает метод (Google или Telegram)
   ↓
5. Происходит OAuth авторизация
   ↓
6. Получены данные пользователя
   ↓
7. Данные сохраняются в localStorage
   ↓
8. Пользователь перенаправляется в приложение
```

## Типы данных

### UserProfile

```typescript
interface UserProfile {
  id: string;              // Уникальный ID (g_xxx для Google, tg_xxx для Telegram)
  name: string;            // Имя пользователя
  provider: 'google' | 'telegram';  // Провайдер авторизации
  avatarUrl?: string;      // URL аватара (опционально)
}
```

## Безопасность

### Google OAuth

- Использует официальный Google Identity Services
- JWT токены декодируются на клиенте
- Проверка подлинности через Google серверы
- CORS защита через Authorized JavaScript origins

### Telegram Login Widget

- Официальный Telegram Widget
- Проверка подлинности через Telegram серверы
- Защита от CSRF атак
- Домен должен быть зарегистрирован в @BotFather

### Хранение данных

- Данные пользователя хранятся в `localStorage`
- Ключ: `ai_studio_user`
- Формат: JSON строка
- Очищается при выходе

## API Reference

### handleGoogleLogin()

Инициирует процесс авторизации через Google.

```typescript
const handleGoogleLogin = () => void
```

**Поведение:**
- Демо-режим: создает временного пользователя
- Продакшн: открывает Google OAuth popup

### handleTelegramLogin()

Инициирует процесс авторизации через Telegram.

```typescript
const handleTelegramLogin = () => void
```

**Поведение:**
- Демо-режим: создает временного пользователя
- Продакшн: использует Telegram Widget callback

### handleGoogleCallback(response)

Обрабатывает ответ от Google OAuth.

```typescript
const handleGoogleCallback = (response: any) => void
```

**Параметры:**
- `response.credential` - JWT токен от Google

**Возвращает:**
- Вызывает `onLogin()` с данными пользователя

### onLogin(user)

Callback функция для успешной авторизации.

```typescript
const onLogin = (user: UserProfile) => void
```

**Параметры:**
- `user` - объект UserProfile

**Действия:**
- Сохраняет пользователя в state
- Записывает в localStorage
- Перенаправляет в приложение

### handleLogout()

Выход из аккаунта.

```typescript
const handleLogout = () => void
```

**Действия:**
- Очищает state
- Удаляет данные из localStorage
- Сбрасывает приложение

## Настройка для разработки

### Локальная разработка

1. Создайте `.env.local`:

```env
VITE_GOOGLE_CLIENT_ID=your_client_id
VITE_TELEGRAM_BOT_USERNAME=your_bot
```

2. Для Google OAuth добавьте `http://localhost:5173` в Authorized origins

3. Для Telegram установите домен `localhost` через @BotFather

### Production

1. Добавьте переменные в Vercel Dashboard

2. Обновите Google OAuth origins на production URL

3. Обновите Telegram bot domain на production URL

## Troubleshooting

### Google OAuth не работает

**Проблема:** Popup не открывается или закрывается сразу

**Решение:**
- Проверьте Client ID в `.env.local`
- Убедитесь, что домен добавлен в Authorized origins
- Проверьте консоль браузера на ошибки CORS

### Telegram Widget не появляется

**Проблема:** Кнопка Telegram не работает

**Решение:**
- Проверьте Bot Username в `.env.local`
- Убедитесь, что домен настроен через `/setdomain`
- Проверьте, что бот активен

### Данные не сохраняются

**Проблема:** После перезагрузки страницы пользователь не авторизован

**Решение:**
- Проверьте localStorage в DevTools
- Убедитесь, что нет ошибок при парсинге JSON
- Очистите localStorage и попробуйте снова

## Примеры использования

### Проверка авторизации

```typescript
const isAuthenticated = !!currentUser;
```

### Получение имени пользователя

```typescript
const userName = currentUser?.name || 'Guest';
```

### Проверка провайдера

```typescript
const isGoogleUser = currentUser?.provider === 'google';
const isTelegramUser = currentUser?.provider === 'telegram';
```

### Отображение аватара

```typescript
{currentUser?.avatarUrl ? (
  <img src={currentUser.avatarUrl} alt="Avatar" />
) : (
  <div>{currentUser?.name.charAt(0)}</div>
)}
```

## Будущие улучшения

- [ ] Добавить поддержку GitHub OAuth
- [ ] Реализовать refresh tokens
- [ ] Добавить двухфакторную аутентификацию
- [ ] Синхронизация с backend API
- [ ] Профиль пользователя с настройками
- [ ] История генераций пользователя
