# Быстрая настройка Telegram Payments с Ammer Pay

У вас уже подключен Ammer Pay к боту @ai_stud_ai_bot! Осталось только настроить интеграцию.

## ✅ Что уже готово:

- ✅ Telegram бот: @ai_stud_ai_bot
- ✅ Test Provider Token: `6073714100:TEST:TG_0Hu7mBvcM_aynsU1VNlN9r8A`
- ✅ Live Provider Token: `5775769170:LIVE:TG_W86WACpRtP4FJUebpZTbzm8A`
- ✅ Edge Function создана: `supabase/functions/create-telegram-invoice/index.ts`

## 🚀 Шаги для запуска:

### Шаг 1: Получите Bot Token

1. Откройте @BotFather в Telegram
2. Отправьте команду: `/mybots`
3. Выберите: **АИ фотосессия!**
4. Нажмите: **API Token**
5. Скопируйте токен (формат: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### Шаг 2: Настройте переменные окружения в Supabase

1. Откройте Supabase Dashboard: https://supabase.com/dashboard
2. Выберите ваш проект
3. Перейдите в **Settings** → **Edge Functions**
4. Найдите раздел **Secrets**
5. Добавьте следующие переменные:

```bash
# Bot Token (получили в Шаге 1)
TELEGRAM_BOT_TOKEN=ваш_bot_token_здесь

# Test Provider Token (для тестирования)
TELEGRAM_PROVIDER_TOKEN_TEST=6073714100:TEST:TG_0Hu7mBvcM_aynsU1VNlN9r8A

# Live Provider Token (для production)
TELEGRAM_PROVIDER_TOKEN_LIVE=5775769170:LIVE:TG_W86WACpRtP4FJUebpZTbzm8A
```

### Шаг 3: Установите Supabase CLI (если еще не установлен)

```bash
npm install -g supabase
```

### Шаг 4: Залогиньтесь в Supabase

```bash
supabase login
```

Откроется браузер для авторизации.

### Шаг 5: Свяжите проект

```bash
cd d:\Projects\1123
supabase link --project-ref your-project-ref
```

**Где найти project-ref:**
- В Supabase Dashboard → Settings → General → Reference ID

### Шаг 6: Деплой Edge Function

```bash
supabase functions deploy create-telegram-invoice --no-verify-jwt
```

После успешного деплоя вы увидите URL функции:
```
https://your-project-ref.functions.supabase.co/create-telegram-invoice
```

### Шаг 7: Настройте WebApp в боте

1. Откройте @BotFather
2. Отправьте: `/mybots`
3. Выберите: **АИ фотосессия!**
4. Нажмите: **Bot Settings** → **Menu Button**
5. Выберите: **Configure menu button**
6. Введите URL: `https://1123-gez152gi8-nicks-projects-00786ef7.vercel.app`
7. Введите текст кнопки: `🎨 Открыть студию`

### Шаг 8: Настройте Webhook для бота (опционально)

Для автоматического начисления кредитов после оплаты создайте webhook:

```bash
supabase functions new telegram-webhook
```

Создайте файл `supabase/functions/telegram-webhook/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const update = await req.json()
    
    console.log('Telegram webhook:', update)
    
    // Обработка успешного платежа
    if (update.message?.successful_payment) {
      const payment = update.message.successful_payment
      const userId = update.message.from.id
      
      // Парсим payload
      const payload = JSON.parse(payment.invoice_payload)
      
      console.log('Payment received:', {
        userId,
        amount: payment.total_amount / 100,
        payload
      })
      
      // Подключаемся к Supabase
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      
      // Сохраняем платеж
      await supabase.from('payments').insert({
        user_id: payload.userId,
        type: 'credits',
        amount: payment.total_amount / 100,
        currency: payment.currency,
        telegram_payment_id: payment.telegram_payment_charge_id,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      
      // Начисляем кредиты
      const { data: user } = await supabase
        .from('users')
        .select('credits')
        .eq('id', payload.userId)
        .single()
      
      if (user) {
        await supabase
          .from('users')
          .update({ credits: user.credits + payload.credits })
          .eq('id', payload.userId)
        
        console.log(`Added ${payload.credits} credits to user ${payload.userId}`)
      }
    }
    
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
    
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ ok: false }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
```

Деплой webhook:

```bash
supabase functions deploy telegram-webhook --no-verify-jwt
```

Установите webhook в Telegram:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-project-ref.functions.supabase.co/telegram-webhook"}'
```

## 🧪 Тестирование

### Для тестирования используйте TEST токен:

1. В Supabase Secrets используйте `TELEGRAM_PROVIDER_TOKEN_TEST`
2. Тестовые карты Ammer Pay:
   - **Успешная оплата:** `4242 4242 4242 4242`
   - **Отклонена:** `4000 0000 0000 0002`
   - CVV: любые 3 цифры
   - Срок: любая будущая дата

### Для production используйте LIVE токен:

1. Переключите на `TELEGRAM_PROVIDER_TOKEN_LIVE`
2. Используйте реальные карты

## 💰 Комиссии Ammer Pay

- **Украинские карты:** ~2.5-3%
- **Международные карты:** ~3.5-4%
- **Вывод средств:** зависит от условий договора

## ✅ Готово!

После выполнения всех шагов:

1. Откройте бота @ai_stud_ai_bot в Telegram
2. Нажмите кнопку меню (внизу)
3. Откроется ваше приложение
4. Попробуйте купить пакет кредитов
5. Оплата пройдет через Ammer Pay

## 🆘 Поддержка

Если возникли проблемы:
- Проверьте логи в Supabase Dashboard → Edge Functions → Logs
- Проверьте, что все переменные окружения установлены
- Убедитесь, что приложение открыто через Telegram бота

Удачи! 🚀
