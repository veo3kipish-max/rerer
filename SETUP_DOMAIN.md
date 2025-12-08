# Настройка основного домена kipish.fun

## Текущий статус

✅ **Frontend задеплоен на Production:**
- URL: https://1123-9luqd4izp-nicks-projects-00786ef7.vercel.app
- Последний коммит включает все исправления профиля и подписок

## Следующие шаги для подключения kipish.fun

### 1. Добавить домен в Vercel

Выполните в терминале:
```bash
vercel domains add kipish.fun --project 1123
```

### 2. Настроить DNS записи у вашего провайдера домена

Вам нужно добавить следующие записи в DNS настройках kipish.fun:

**Вариант A (Рекомендуется - с поддержкой SSL):**
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

**Вариант B (альтернатива):**
```
Type: A
Name: @
Value: 76.76.21.21
```

### 3. Подождать распространения DNS (5-30 минут)

### 4. Обновить ссылки в Telegram боте

После того как домен заработает, обновите ссылку в @BotFather:
- Команда: `/mybots` → выберите бота → Bot Settings → Menu Button
- Новый URL: `https://kipish.fun`

### 5. Обновить WAYFORPAY_DOMAIN в Supabase

Зайдите в Supabase Dashboard → Settings → Secrets:
- Найдите `WAYFORPAY_DOMAIN`
- Измените значение с `kipish.fun` на `kipish.fun` (или убедитесь что оно правильное)

## Текущий URL для тестирования

Пока домен не настроен, используйте:
https://1123-9luqd4izp-nicks-projects-00786ef7.vercel.app

