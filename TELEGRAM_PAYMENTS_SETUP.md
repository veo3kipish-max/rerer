# Настройка оплаты через Telegram Payments

Telegram Payments - встроенная система оплаты в Telegram, которая позволяет принимать платежи прямо в боте без необходимости ФОП.

## ✅ Преимущества Telegram Payments

- 🚫 **НЕ нужен ФОП!** - работает для физических лиц
- 💳 Поддержка всех украинских карт
- 🔒 Безопасность - платежи обрабатывает Telegram
- 🚀 Быстрая интеграция
- 💰 Низкие комиссии (зависит от провайдера)
- 📱 Удобно для пользователей - оплата в один клик

## Шаг 1: Создание Telegram бота

### 1.1 Создайте бота через BotFather

1. Откройте Telegram и найдите **@BotFather**
2. Отправьте команду `/newbot`
3. Введите название бота: `AI Photo Studio Bot`
4. Введите username: `aiphotostudio_bot` (должен быть уникальным)
5. Сохраните **Bot Token** (выглядит как `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 1.2 Получите Bot Token

```
Пример токена:
6789012345:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw
```

⚠️ **Важно:** Сохраните этот токен - он понадобится для интеграции!

## Шаг 2: Подключение платежного провайдера

Telegram поддерживает несколько провайдеров. Для Украины лучше всего подходит **ЮKassa** (YooMoney).

### 2.1 Регистрация в ЮKassa

1. Перейдите на https://yookassa.ru/
2. Нажмите **"Подключить ЮKassa"**
3. Выберите **"Для самозанятых и физических лиц"**
4. Заполните форму:
   - ФИО
   - Email
   - Телефон
   - Паспортные данные
5. Дождитесь подтверждения (обычно 1-2 часа)

### 2.2 Получение Provider Token

1. Войдите в личный кабинет ЮKassa
2. Перейдите в **Настройки** → **Telegram**
3. Нажмите **"Получить токен для Telegram"**
4. Скопируйте **Provider Token**

```
Пример:
381764678:TEST:12345
```

### 2.3 Подключение провайдера к боту

1. Откройте @BotFather в Telegram
2. Отправьте команду `/mybots`
3. Выберите вашего бота
4. Нажмите **"Payments"**
5. Выберите **"YooMoney"** (или другой провайдер)
6. Вставьте **Provider Token** из ЮKassa

✅ Готово! Теперь ваш бот может принимать платежи.

## Шаг 3: Создание Telegram Mini App

Ваше приложение уже работает как веб-приложение. Теперь нужно интегрировать его с Telegram ботом.

### 3.1 Настройка Web App в боте

1. Откройте @BotFather
2. Отправьте `/mybots`
3. Выберите вашего бота
4. Нажмите **"Bot Settings"** → **"Menu Button"**
5. Выберите **"Configure menu button"**
6. Введите URL вашего приложения:
   ```
   https://1123-pmq4nlx43-nicks-projects-00786ef7.vercel.app
   ```
7. Введите текст кнопки: `🎨 Open AI Photo Studio`

## Шаг 4: Создание серверной части для платежей

### 4.1 Создайте Telegram Bot Handler

Создайте файл `telegram-bot/bot.js`:

```javascript
const TelegramBot = require('node-telegram-bot-api');
const { createClient } = require('@supabase/supabase-js');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const PROVIDER_TOKEN = process.env.TELEGRAM_PROVIDER_TOKEN;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Обработка команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId, 
    '🎨 Welcome to AI Photo Studio!\n\n' +
    'Create amazing AI-generated photos in any style.\n\n' +
    'Click the button below to start! 👇',
    {
      reply_markup: {
        inline_keyboard: [[
          { text: '🚀 Open App', web_app: { url: 'https://your-app-url.vercel.app' } }
        ]]
      }
    }
  );
});

// Обработка платежей
bot.on('pre_checkout_query', async (query) => {
  // Всегда подтверждаем платеж
  bot.answerPreCheckoutQuery(query.id, true);
});

bot.on('successful_payment', async (msg) => {
  const payment = msg.successful_payment;
  const userId = msg.from.id;
  const amount = payment.total_amount / 100; // Конвертируем из копеек
  
  console.log('Payment received:', {
    userId,
    amount,
    currency: payment.currency,
    payload: payment.invoice_payload
  });
  
  // Парсим payload чтобы понять что купил пользователь
  const payload = JSON.parse(payment.invoice_payload);
  
  // Сохраняем платеж в Supabase
  const { data: paymentRecord } = await supabase
    .from('payments')
    .insert({
      user_id: payload.userId,
      type: payload.type,
      amount: amount,
      currency: payment.currency,
      telegram_payment_id: payment.telegram_payment_charge_id,
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .select()
    .single();
  
  // Начисляем кредиты
  if (payload.type === 'credits') {
    const { data: user } = await supabase
      .from('users')
      .select('credits')
      .eq('id', payload.userId)
      .single();
    
    if (user) {
      await supabase
        .from('users')
        .update({ credits: user.credits + payload.credits })
        .eq('id', payload.userId);
      
      bot.sendMessage(msg.chat.id, 
        `✅ Payment successful!\n\n` +
        `${payload.credits} credits added to your account.\n` +
        `Total credits: ${user.credits + payload.credits}`
      );
    }
  }
});

console.log('Bot is running...');
```

### 4.2 Создайте Supabase Edge Function для создания инвойса

```bash
supabase functions new create-telegram-invoice
```

Откройте `supabase/functions/create-telegram-invoice/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { chatId, title, description, amount, credits, userId, packageId } = await req.json()
    
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    const providerToken = Deno.env.get('TELEGRAM_PROVIDER_TOKEN')
    
    if (!botToken || !providerToken) {
      throw new Error('Telegram credentials not configured')
    }

    // Создаем payload с информацией о покупке
    const payload = JSON.stringify({
      userId,
      packageId,
      type: 'credits',
      credits
    })

    // Создаем инвойс через Telegram Bot API
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/createInvoiceLink`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title,
          description: description,
          payload: payload,
          provider_token: providerToken,
          currency: 'UAH',
          prices: [{ label: title, amount: amount * 100 }], // В копейках
        })
      }
    )

    const data = await response.json()
    
    if (!data.ok) {
      throw new Error(data.description || 'Failed to create invoice')
    }

    return new Response(JSON.stringify({
      invoice_url: data.result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
```

### 4.3 Настройка переменных окружения

В Supabase Dashboard добавьте:

```
TELEGRAM_BOT_TOKEN=6789012345:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw
TELEGRAM_PROVIDER_TOKEN=381764678:TEST:12345
```

### 4.4 Деплой функции

```bash
supabase functions deploy create-telegram-invoice --no-verify-jwt
```

## Шаг 5: Обновление Frontend

Обновите `components/PricingModal.tsx` для работы с Telegram:

```typescript
import { supabase } from '../services/supabaseClient';

const handleBuyPackage = async (pkg: any) => {
    if (isGuest) {
        alert('Please log in to purchase credits');
        return;
    }

    try {
        // Проверяем, запущено ли приложение в Telegram
        const tg = (window as any).Telegram?.WebApp;
        
        if (!tg) {
            alert('This payment method works only in Telegram. Please open the app via Telegram bot.');
            return;
        }

        // Создаем инвойс через Edge Function
        const { data, error } = await supabase.functions.invoke('create-telegram-invoice', {
            body: {
                chatId: tg.initDataUnsafe?.user?.id,
                title: pkg.label || pkg.title,
                description: `AI Photo Studio - ${pkg.label || pkg.title}`,
                amount: pkg.price,
                credits: pkg.credits,
                userId: currentUser!.dbUserId,
                packageId: pkg.id
            }
        });

        if (error) throw error;

        // Открываем страницу оплаты в Telegram
        tg.openInvoice(data.invoice_url, (status) => {
            if (status === 'paid') {
                alert('✅ Payment successful! Credits will be added shortly.');
                onClose();
                if (onPaymentSuccess) {
                    onPaymentSuccess(pkg.credits);
                }
            } else if (status === 'cancelled') {
                alert('Payment cancelled');
            } else if (status === 'failed') {
                alert('Payment failed. Please try again.');
            }
        });

    } catch (error: any) {
        console.error('Payment error:', error);
        alert(error.message || 'Failed to create payment. Please try again.');
    }
};
```

## Шаг 6: Добавление Telegram WebApp SDK

Добавьте в `index.html`:

```html
<script src="https://telegram.org/js/telegram-web-app.js"></script>
```

## Шаг 7: Запуск бота

### 7.1 Установите зависимости

```bash
npm install node-telegram-bot-api @supabase/supabase-js dotenv
```

### 7.2 Создайте .env файл

```
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_PROVIDER_TOKEN=your_provider_token
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 7.3 Запустите бота

```bash
node telegram-bot/bot.js
```

Или деплойте на Heroku/Railway/Render для 24/7 работы.

## Комиссии

- **ЮKassa:** ~2.8% + 10 руб за транзакцию
- **Telegram:** 0% (не берет комиссию)
- **Итого:** ~2.8-3%

## Тестирование

1. Откройте вашего бота в Telegram
2. Нажмите `/start`
3. Откройте Web App
4. Попробуйте купить пакет
5. Используйте тестовую карту ЮKassa:
   - **Номер:** `5555 5555 5555 4444`
   - **Срок:** любая будущая дата
   - **CVV:** `123`
   - **3D Secure код:** `12345`

## Готово! 🎉

Теперь пользователи могут оплачивать прямо в Telegram без необходимости ФОП!

## Альтернативные провайдеры для Telegram

Если ЮKassa не подходит:

1. **Stripe** - работает через Telegram
2. **Tranzzo** - украинский провайдер
3. **Fondy** - поддержка UAH

Выберите провайдера в @BotFather → Payments
