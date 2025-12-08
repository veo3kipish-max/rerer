# ⚡ Подключение Ammer Pay (Webhook)

Вы успешно добавили выбор между WayForPay и Ammer Pay (Telegram / Crypto).
Чтобы платежи Ammer Pay подтверждались автоматически, **необходимо установить Webhook для вашего бота**.

### 1. Установите Webhook

Выполните эту команду в терминале (замените `<YOUR_BOT_TOKEN>` на токен вашего бота):

```bash
curl -F "url=https://ndrdksmdkhljymuvxjly.supabase.co/functions/v1/telegram-webhook" https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook
```

### 2. Проверьте настройки в Supabase

1. Перейдите в **Project Settings** -> **Secrets**.
2. Убедитесь, что добавлен `TELEGRAM_PROVIDER_TOKEN` со значением LIVE токена Ammer Pay:
   `5775769170:LIVE:TG_W86WACpRtP4FJUebpZTbzm8A`
3. Убедитесь, что `TELEGRAM_BOT_TOKEN` также установлен.

### 3. Отключите проверку JWT (Важно!)

Для функции `telegram-webhook` (так же как для `wayforpay-webhook`) нужно отключить проверку JWT, так как Telegram отправляет запросы без заголовка Authorization.

1. Перейдите в **Edge Functions** -> **telegram-webhook**.
2. Нажмите **Settings**.
3. **Выключите** "Enforce JWT Verification".
4. Нажмите **Save**.

### Готово!

Теперь при выборе "Telegram / Crypto" пользователи смогут оплачивать через Ammer Pay, и кредиты будут начисляться автоматически.
