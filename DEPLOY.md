# Инструкция по деплою на Vercel

## Метод 1: Через Vercel CLI (Рекомендуется)

### Шаг 1: Установка Vercel CLI

```bash
npm install -g vercel
```

### Шаг 2: Авторизация

```bash
vercel login
```

Выберите метод авторизации (GitHub, GitLab, Bitbucket или Email).

### Шаг 3: Деплой

Из корневой директории проекта выполните:

```bash
vercel
```

При первом деплое Vercel задаст несколько вопросов:
- **Set up and deploy?** → Yes
- **Which scope?** → Выберите ваш аккаунт
- **Link to existing project?** → No
- **What's your project's name?** → ai-photo-studio (или любое другое имя)
- **In which directory is your code located?** → ./ (нажмите Enter)

Vercel автоматически определит настройки из `vercel.json`.

### Шаг 4: Настройка переменных окружения

После деплоя перейдите в Vercel Dashboard:

1. Откройте ваш проект
2. Перейдите в **Settings** → **Environment Variables**
3. Добавьте следующие переменные:

| Имя переменной | Значение | Обязательно |
|----------------|----------|-------------|
| `GEMINI_API_KEY` | Ваш Gemini API ключ | ✅ Да |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID | ⚠️ Опционально |
| `VITE_TELEGRAM_BOT_USERNAME` | Username Telegram бота | ⚠️ Опционально |

4. Выберите окружения: **Production**, **Preview**, **Development**
5. Нажмите **Save**

### Шаг 5: Повторный деплой

После добавления переменных окружения, выполните повторный деплой:

```bash
vercel --prod
```

## Метод 2: Через GitHub (Автоматический деплой)

### Шаг 1: Загрузите проект на GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/ваш-username/ваш-репозиторий.git
git push -u origin main
```

### Шаг 2: Подключите репозиторий к Vercel

1. Перейдите на [vercel.com](https://vercel.com)
2. Нажмите **Add New** → **Project**
3. Выберите ваш GitHub репозиторий
4. Vercel автоматически определит настройки
5. Добавьте переменные окружения (см. Шаг 4 из Метода 1)
6. Нажмите **Deploy**

### Шаг 3: Автоматические деплои

Теперь каждый push в ветку `main` будет автоматически деплоиться на Vercel!

## Важные настройки после деплоя

### Google OAuth

После получения production URL от Vercel:

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Откройте ваш OAuth Client
3. Добавьте production URL в **Authorized JavaScript origins**:
   - `https://ваш-проект.vercel.app`
4. Сохраните изменения

### Telegram Bot

После получения production URL от Vercel:

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте `/setdomain`
3. Выберите вашего бота
4. Укажите домен: `ваш-проект.vercel.app` (без https://)

## Проверка деплоя

После успешного деплоя:

1. Откройте ваш production URL
2. Проверьте авторизацию через Google и Telegram
3. Попробуйте сгенерировать фотосессию

## Полезные команды Vercel CLI

```bash
# Просмотр логов
vercel logs

# Список деплоев
vercel ls

# Удаление деплоя
vercel remove [deployment-url]

# Просмотр переменных окружения
vercel env ls

# Добавление переменной окружения
vercel env add
```

## Troubleshooting

### Ошибка: "Module not found"

Убедитесь, что все зависимости установлены:

```bash
npm install
vercel --prod
```

### Ошибка авторизации Google

- Проверьте, что `VITE_GOOGLE_CLIENT_ID` добавлен в переменные окружения
- Убедитесь, что production URL добавлен в Authorized JavaScript origins

### Ошибка авторизации Telegram

- Проверьте, что `VITE_TELEGRAM_BOT_USERNAME` добавлен в переменные окружения
- Убедитесь, что домен настроен через `/setdomain` в @BotFather

### Gemini API не работает

- Проверьте, что `GEMINI_API_KEY` добавлен в переменные окружения
- Убедитесь, что у вас есть активный биллинг в Google Cloud (для Pro модели)

## Дополнительные ресурсы

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Google OAuth Setup](https://developers.google.com/identity/gsi/web/guides/overview)
- [Telegram Login Widget](https://core.telegram.org/widgets/login)
