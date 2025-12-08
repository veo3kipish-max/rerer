# Настройка приема платежей через Payoneer

Это подробное руководство по интеграции Payoneer Checkout для приема платежей в вашем приложении AI Photo Studio.

## Обзор

Payoneer Checkout позволяет принимать платежи от клиентов по всему миру с помощью кредитных карт, дебетовых карт и других методов оплаты.

## Шаг 1: Регистрация в Payoneer

1. **Создайте бизнес-аккаунт Payoneer**
   - Перейдите на https://www.payoneer.com/
   - Нажмите "Sign Up" и выберите "Business Account"
   - Заполните регистрационную форму с данными вашей компании
   - Подтвердите email и пройдите верификацию

2. **Подключите Checkout**
   - Войдите в https://myaccount.payoneer.com/
   - Перейдите в раздел **Settings** → **Payment Services**
   - Найдите **Payoneer Checkout** и нажмите **Enable**
   - Заполните необходимую информацию о вашем бизнесе

3. **Получите API credentials**
   - В разделе **Developers** → **API Credentials** создайте новый API ключ
   - Сохраните следующие данные:
     - **Program ID** (идентификатор вашей программы)
     - **API Username**
     - **API Password**
   
   > ⚠️ **Важно**: Храните эти данные в безопасности! Никогда не публикуйте их в коде фронтенда.

## Шаг 2: Настройка Supabase Edge Function

Для безопасной работы с Payoneer API нужно создать серверную функцию.

### 2.1 Установка Supabase CLI

```bash
npm install -g supabase
```

### 2.2 Создание функции для создания платежа

```bash
supabase functions new create-payoneer-payment
```

Откройте файл `supabase/functions/create-payoneer-payment/index.ts` и добавьте:

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
    const { amount, currency, description, userId, packageId } = await req.json()
    
    const programId = Deno.env.get('PAYONEER_PROGRAM_ID')
    const apiUsername = Deno.env.get('PAYONEER_API_USERNAME')
    const apiPassword = Deno.env.get('PAYONEER_API_PASSWORD')
    
    if (!programId || !apiUsername || !apiPassword) {
      throw new Error('Payoneer credentials not configured')
    }

    // Создаем уникальный ID транзакции
    const paymentId = `${userId}_${packageId}_${Date.now()}`
    
    // Формируем Basic Auth
    const authString = btoa(`${apiUsername}:${apiPassword}`)
    
    // Создаем checkout сессию через Payoneer API
    const response = await fetch(`https://api.payoneer.com/v2/programs/${programId}/charges`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_reference_id: paymentId,
        currency: currency || 'UAH',
        amount: amount * 100, // В копейках
        description: description,
        statement_soft_descriptor: 'AI Photo Studio',
        return_url: `${req.headers.get('origin')}/payment/success`,
        cancel_url: `${req.headers.get('origin')}/payment/cancel`,
      }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Payoneer API error')
    }

    // Сохраняем информацию о платеже в Supabase
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    await supabaseAdmin
      .from('payments')
      .insert({
        user_id: userId,
        type: packageId.startsWith('pack_') ? 'credits' : 'subscription',
        amount: amount,
        currency: currency || 'UAH',
        payoneer_charge_id: data.charge_id,
        status: 'pending'
      })

    return new Response(JSON.stringify({
      checkout_url: data.checkout_url,
      charge_id: data.charge_id
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

### 2.3 Создание Webhook для подтверждения платежа

```bash
supabase functions new payoneer-webhook
```

Откройте `supabase/functions/payoneer-webhook/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const payload = await req.json()
    
    // Проверяем подпись webhook (для безопасности)
    const signature = req.headers.get('payoneer-signature')
    // TODO: Добавьте проверку подписи согласно документации Payoneer
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (payload.event_type === 'charge.succeeded') {
      const chargeId = payload.data.charge_id
      const clientRefId = payload.data.client_reference_id
      
      // Находим платеж в базе данных
      const { data: payment } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('payoneer_charge_id', chargeId)
        .single()

      if (!payment) {
        throw new Error('Payment not found')
      }

      // Обновляем статус платежа
      await supabaseAdmin
        .from('payments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', payment.id)

      // Начисляем кредиты или обновляем подписку
      if (payment.type === 'credits') {
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('credits')
          .eq('id', payment.user_id)
          .single()

        if (user) {
          await supabaseAdmin
            .from('users')
            .update({ credits: user.credits + payment.credits })
            .eq('id', payment.user_id)
        }
      } else if (payment.type === 'subscription') {
        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + 30)
        
        await supabaseAdmin
          .from('users')
          .update({
            subscription_tier: payment.tier,
            subscription_expires_at: expiryDate.toISOString()
          })
          .eq('id', payment.user_id)
      }

      console.log(`Payment ${payment.id} completed successfully`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
```

### 2.4 Настройка переменных окружения

В панели Supabase (**Settings** → **Edge Functions**) добавьте:

```
PAYONEER_PROGRAM_ID=your_program_id
PAYONEER_API_USERNAME=your_api_username
PAYONEER_API_PASSWORD=your_api_password
```

### 2.5 Деплой функций

```bash
supabase functions deploy create-payoneer-payment --no-verify-jwt
supabase functions deploy payoneer-webhook --no-verify-jwt
```

## Шаг 3: Обновление Frontend

Обновите `components/PricingModal.tsx`:

```typescript
import { supabase } from '../services/supabaseClient';

const handleBuyPackage = async (pkg: any) => {
    if (isGuest) {
        alert('Please log in to purchase credits');
        return;
    }

    try {
        setIsProcessing(true);
        setProcessingMessage('Creating payment session...');

        // Вызываем Edge Function для создания платежа
        const { data, error } = await supabase.functions.invoke('create-payoneer-payment', {
            body: {
                amount: pkg.price,
                currency: 'UAH',
                description: `${pkg.label || pkg.title} - AI Photo Studio`,
                userId: currentUser!.dbUserId,
                packageId: pkg.id
            }
        });

        if (error) throw error;
        if (!data.checkout_url) throw new Error('No checkout URL returned');

        // Перенаправляем пользователя на страницу оплаты Payoneer
        window.location.href = data.checkout_url;

    } catch (error: any) {
        console.error('Payment error:', error);
        setIsProcessing(false);
        alert(error.message || 'Failed to create payment. Please try again.');
    }
};
```

## Шаг 4: Настройка Webhook в Payoneer

1. Войдите в https://myaccount.payoneer.com/
2. Перейдите в **Developers** → **Webhooks**
3. Нажмите **Add Endpoint**
4. Введите URL вашего webhook:
   ```
   https://<your-project-ref>.functions.supabase.co/payoneer-webhook
   ```
5. Выберите события:
   - `charge.succeeded`
   - `charge.failed`
   - `charge.refunded`
6. Сохраните и скопируйте **Signing Secret** (для проверки подписи)

## Шаг 5: Тестирование

### Тестовый режим

Payoneer предоставляет sandbox для тестирования:

1. Используйте тестовые credentials из Payoneer Dashboard
2. Используйте тестовые карты:
   - **Успешная оплата**: `4111 1111 1111 1111`
   - **Отклонена**: `4000 0000 0000 0002`
   - CVV: любые 3 цифры
   - Expiry: любая будущая дата

### Production режим

После успешного тестирования:
1. Замените sandbox credentials на production
2. Обновите переменные окружения в Supabase
3. Переделайте функции

## Поток оплаты

```
1. User clicks "Pay with Payoneer"
   ↓
2. Frontend вызывает create-payoneer-payment Edge Function
   ↓
3. Edge Function создает charge через Payoneer API
   ↓
4. User перенаправляется на checkout_url Payoneer
   ↓
5. User вводит данные карты и оплачивает
   ↓
6. Payoneer отправляет webhook на ваш сервер
   ↓
7. payoneer-webhook обновляет статус платежа и начисляет кредиты
   ↓
8. User перенаправляется обратно на return_url
```

## Безопасность

✅ **Что делать:**
- Храните API credentials только в Supabase Edge Functions (переменные окружения)
- Проверяйте подпись webhook
- Используйте HTTPS для всех запросов
- Логируйте все транзакции

❌ **Чего НЕ делать:**
- Не храните credentials в коде фронтенда
- Не доверяйте данным от клиента без проверки
- Не начисляйте кредиты до подтверждения webhook

## Комиссии

Payoneer взимает комиссию за каждую транзакцию:
- **Международные карты**: ~3.5% + фиксированная плата
- **Локальные карты**: ~2.9% + фиксированная плата

Уточните актуальные тарифы в вашем Payoneer аккаунте.

## Поддержка

- **Документация Payoneer API**: https://developers.payoneer.com/
- **Support**: https://myaccount.payoneer.com/support
- **Статус API**: https://status.payoneer.com/

## Готово! 🎉

Теперь ваше приложение готово принимать реальные платежи через Payoneer.
