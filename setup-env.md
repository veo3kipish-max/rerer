# 🔐 Настройка переменных окружения

## Шаг 1: Получите учетные данные

### Google OAuth Client ID
1. Откройте: https://console.cloud.google.com/apis/credentials
2. Создайте OAuth Client ID (Web application)
3. Добавьте Authorized JavaScript origins:
   - `http://localhost:5173`
   - `http://kipish.fun`
4. Скопируйте Client ID

### Telegram Bot Username
1. Откройте Telegram → @BotFather
2. Отправьте `/newbot` и следуйте инструкциям
3. Скопируйте username бота (без @)
4. Настройте домен через `/setdomain`:
   - localhost (для разработки)
   - kipish.fun (для production)

### Gemini API Key
1. Откройте: https://aistudio.google.com/apikey
2. Создайте новый API ключ
3. Скопируйте ключ

---

## Шаг 2: Добавьте переменные в Vercel

### Вариант A: Через веб-интерфейс

1. Откройте: https://vercel.com/nicks-projects-00786ef7/1123/settings/environment-variables

2. Добавьте следующие переменные:

   **GEMINI_API_KEY** (обязательно)
   - Value: ваш ключ от Google AI Studio
   - Environments: Production, Preview, Development

   **VITE_GOOGLE_CLIENT_ID** (для Google OAuth)
   - Value: ваш Google OAuth Client ID
   - Environments: Production, Preview, Development

   **VITE_TELEGRAM_BOT_USERNAME** (для Telegram)
   - Value: username вашего бота (без @)
   - Environments: Production, Preview, Development

3. После добавления переменных:
   - Перейдите в Deployments
   - Нажмите Redeploy

### Вариант B: Через CLI

```bash
# Добавить GEMINI_API_KEY
vercel env add GEMINI_API_KEY

# Добавить VITE_GOOGLE_CLIENT_ID
vercel env add VITE_GOOGLE_CLIENT_ID

# Добавить VITE_TELEGRAM_BOT_USERNAME
vercel env add VITE_TELEGRAM_BOT_USERNAME

# Redeploy
vercel --prod
```

---

## Шаг 3: Локальная разработка

Создайте файл `.env.local`:

```env
GEMINI_API_KEY=ваш_ключ_здесь
VITE_GOOGLE_CLIENT_ID=ваш_client_id_здесь
VITE_TELEGRAM_BOT_USERNAME=ваш_бот_здесь
```

Запустите приложение:

```bash
npm run dev
```

---

## ✅ Проверка

После настройки:

1. **Локально**: Откройте http://localhost:5173
2. **Production**: Откройте http://kipish.fun

Вы должны увидеть:
- ✅ Кнопка "Войти через Google" работает
- ✅ Кнопка "Войти через Telegram" работает
- ✅ После входа отображается ваше имя и аватар

---

## 🆘 Troubleshooting

### Google OAuth не работает
- Проверьте, что Client ID правильный
- Убедитесь, что домен добавлен в Authorized origins
- Проверьте консоль браузера на ошибки

### Telegram не работает
- Проверьте, что username бота правильный (без @)
- Убедитесь, что домен настроен через /setdomain
- Проверьте, что бот активен

### Переменные не применяются
- После добавления переменных в Vercel нужно сделать Redeploy
- Для локальной разработки перезапустите `npm run dev`
