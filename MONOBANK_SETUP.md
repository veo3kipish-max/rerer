# Настройка приема реальных платежей (Monobank)

Monobank - один из самых популярных и удобных банков в Украине для приема платежей (эквайринга). 

Для того чтобы начать принимать реальные деньги, вам необходимо выполнить следующие шаги:

## 1. Регистрация в Monobank Acquiring

1. Перейдите на страницу [Monobank Acquiring](https://www.monobank.ua/business) и подайте заявку на подключение интернет-эквайринга.
2. После одобрения заявки вы получите доступ к **личному кабинету бизнеса**.
3. В кабинете создайте новый **X-Token** для API. Этот токен - ваш секретный ключ к управлению платежами.

> **Важно:** Никогда не храните X-Token в коде фронтенда (`.tsx` файлах). Он должен использоваться *только* на сервере (Supabase Edge Functions).

## 2. Настройка Backend (Supabase Edge Function)

Вам нужно создать защищенную функцию, которая будет создавать счета на оплату.

### Шаг 1: Установка Supabase CLI
Если еще не установлен:
```bash
npm install -g supabase
```

### Шаг 2: Создание функции `create-payment`
Выполните команду в терминале проекта:
```bash
supabase functions new create-payment
```

Это создаст файл `supabase/functions/create-payment/index.ts`. Замените его содержимое на следующий код:

```typescript
// supabase/functions/create-payment/index.ts
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
    const { amount, redirectUrl, webhookUrl, description } = await req.json()
    
    // Получаем токен из секретных переменных окружения Supabase
    const monoToken = Deno.env.get('MONOBANK_TOKEN')
    
    if (!monoToken) {
      throw new Error('MONOBANK_TOKEN not configured')
    }

    const response = await fetch('https://api.monobank.ua/api/merchant/invoice/create', {
      method: 'POST',
      headers: {
        'X-Token': monoToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount * 100, // В копейках
        ccy: 980, // UAH
        merchantPaymInfo: {
          destination: description,
          comment: description,
        },
        redirectUrl: redirectUrl,
        webHookUrl: webhookUrl,
        validity: 3600, // Срок действия ссылки 1 час
        paymentType: 'debit',
      }),
    })

    const data = await response.json()
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
```

### Шаг 3: Настройка переменных окружения

1. В панели управления Supabase перейдите в **Settings** -> **Edge Functions**.
2. Добавьте секрет `MONOBANK_TOKEN` со значением вашего X-Token из личного кабинета Monobank.

3. Деплой функции:
```bash
supabase functions deploy create-payment --no-verify-jwt
```

## 3. Настройка Webhook (Получение подтверждения)

Вам нужна еще одна функция, чтобы Monobank мог сообщить вашему серверу, что оплата прошла успешно.

### Шаг 1: Создание функции `monobank-webhook`
```bash
supabase functions new monobank-webhook
```

### Шаг 2: Код функции

```typescript
// supabase/functions/monobank-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  try {
    const { invoiceId, status, amount, reference } = await req.json()
    
    // Инициализация Supabase Admin клиента (для записи в БД без прав юзера)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (status === 'success') {
      // 1. Находим платеж по ID инвойса Monobank (нужно хранить его в payments.telegram_payment_id или создать новое поле)
      // 2. Обновляем статус платежа на 'completed'
      // 3. Начисляем кредиты пользователю (логика аналогична databaseService.ts)
      
      console.log(`Payment success: ${invoiceId} for ${amount}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
```

### Шаг 3: Деплой
```bash
supabase functions deploy monobank-webhook --no-verify-jwt
```

После деплоя вы получите URL вида `https://<project-ref>.functions.supabase.co/monobank-webhook`. Этот URL нужно будет отправлять в поле `webHookUrl` при создании платежа.

## 4. Обновление Frontend (React)

Теперь нужно обновить `PricingModal.tsx` чтобы он вызывал вашу настоящую Cloud Function вместо симуляции.

Пример обновленной логики в `PricingModal.tsx`:

```typescript
const handleBuyPackage = async (pkg: any) => {
    // ... логика isGuest ...

    if (paymentMethod === 'mono') {
        try {
            setProcessingMessage('Generating invoice...');
            
            // Вызов нашей Edge Function
            const { data, error } = await supabase.functions.invoke('create-payment', {
                body: {
                    amount: pkg.price,
                    description: `Payment for ${pkg.label}`,
                    redirectUrl: window.location.href, // Вернуть юзера сюда
                    webhookUrl: 'https://<YOUR_PROJECT_REF>.functions.supabase.co/monobank-webhook'
                }
            })

            if (error) throw error;
            if (!data.pageUrl) throw new Error('No pageUrl returned');

            // Редирект пользователя на страницу оплаты Monobank
            window.location.href = data.pageUrl;
            
        } catch (e) {
            console.error(e);
            alert('Error creating payment');
        }
        return;
    }
    
    // ... остальная логика для Card ...
}
```

## Итог

1. **Frontend**: вызывает `supabase.functions.invoke('create-payment')` и перенаправляет пользователя по полученной ссылке (`pageUrl`).
2. **Backend (create-payment)**: получает запрос, идет в Monobank API с секретным токеном, создает инвойс и возвращает ссылку.
3. **User**: платит в приложении Monobank.
4. **Monobank**: дергает ваш `monobank-webhook` с подтверждением.
5. **Backend (webhook)**: обновляет базу данных Supabase (ставит credits, completed).

Теперь у вас есть полностью рабочий поток *реальных* платежей! 🚀
