# Настройка приема платежей через Portmone (Портмоне)

Portmone - украинский платежный сервис, который позволяет принимать платежи онлайн. Подходит как для физических лиц, так и для ФОП/ООО.

## ✅ Преимущества Portmone

- 🇺🇦 Украинский сервис
- 💳 Поддержка всех украинских карт
- 💰 Поддержка UAH (гривна)
- 🚀 Быстрая интеграция
- 📱 Мобильное приложение
- ✅ Работает с физическими лицами (для небольших объемов)

## 📋 Требования

### Для физических лиц:
- Паспорт гражданина Украины
- ИНН (идентификационный номер)
- Карта украинского банка для вывода средств
- ⚠️ Лимит: до 150,000 грн/месяц

### Для ФОП/ООО:
- Свидетельство о регистрации ФОП/ООО
- Банковский счет
- ✅ Без лимитов

## Шаг 1: Регистрация в Portmone

1. **Перейдите на сайт:**
   - https://www.portmone.com.ua/

2. **Нажмите "Підключити прийом платежів"**
   - Или перейдите сразу: https://www.portmone.com.ua/r3/uk/business/

3. **Заполните форму регистрации:**
   ```
   - ФИО
   - Телефон
   - Email
   - ИНН
   - Название магазина/сервиса
   - Описание деятельности
   - Предполагаемый оборот
   ```

4. **Дождитесь звонка менеджера**
   - Обычно звонят в течение 1-2 рабочих дней
   - Уточнят детали и помогут с настройкой

5. **Подпишите договор**
   - Можно онлайн через электронную подпись
   - Или скачать, подписать и отправить скан

## Шаг 2: Получение API ключей

После подписания договора вам предоставят доступ к **Личному кабинету**.

### 2.1 Вход в личный кабинет

1. Перейдите: https://www.portmone.com.ua/r3/uk/login/
2. Введите логин и пароль (придут на email)

### 2.2 Получение Payee ID и Login

1. В личном кабинете перейдите в раздел **"Налаштування"** (Настройки)
2. Найдите раздел **"API"** или **"Інтеграція"**
3. Скопируйте следующие данные:

```
PAYEE_ID = 123456          # ID вашего магазина
LOGIN = your_login         # Логин для API
PASSWORD = your_password   # Пароль для API (или ключ)
```

⚠️ **Важно:** Сохраните эти данные в безопасном месте!

## Шаг 3: Настройка Supabase Edge Function

### 3.1 Создание функции для создания платежа

```bash
supabase functions new create-portmone-payment
```

Откройте `supabase/functions/create-portmone-payment/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, description, userId, packageId } = await req.json()
    
    const payeeId = Deno.env.get('PORTMONE_PAYEE_ID')
    const login = Deno.env.get('PORTMONE_LOGIN')
    const password = Deno.env.get('PORTMONE_PASSWORD')
    
    if (!payeeId || !login || !password) {
      throw new Error('Portmone credentials not configured')
    }

    // Создаем уникальный ID заказа
    const shopOrderNumber = `${userId}_${packageId}_${Date.now()}`
    
    // Формируем данные для Portmone API
    const formData = new URLSearchParams({
      payee_id: payeeId,
      shop_order_number: shopOrderNumber,
      bill_amount: amount.toString(),
      description: description,
      success_url: `${req.headers.get('origin')}/payment/success`,
      failure_url: `${req.headers.get('origin')}/payment/cancel`,
      lang: 'uk',
      encoding: 'UTF-8'
    })

    // Создаем платеж через Portmone API
    const response = await fetch('https://www.portmone.com.ua/gateway/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    })

    const html = await response.text()
    
    // Portmone возвращает HTML форму, которую нужно отправить клиенту
    // Или можно извлечь URL для редиректа
    
    // Сохраняем информацию о платеже в Supabase
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
        currency: 'UAH',
        portmone_order_number: shopOrderNumber,
        status: 'pending'
      })

    return new Response(JSON.stringify({
      payment_form: html,
      order_number: shopOrderNumber
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

### 3.2 Создание Webhook для подтверждения

```bash
supabase functions new portmone-webhook
```

Откройте `supabase/functions/portmone-webhook/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const formData = await req.formData()
    
    const shopOrderNumber = formData.get('SHOPORDERNUMBER')
    const status = formData.get('RESULT')
    const billAmount = formData.get('BILL_AMOUNT')
    
    console.log('Portmone webhook:', { shopOrderNumber, status, billAmount })
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (status === '0') { // 0 = успешная оплата
      // Находим платеж в базе данных
      const { data: payment } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('portmone_order_number', shopOrderNumber)
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

    // Portmone требует ответ "ok"
    return new Response('ok', {
      headers: { 'Content-Type': 'text/plain' },
      status: 200,
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('error', {
      headers: { 'Content-Type': 'text/plain' },
      status: 200, // Все равно возвращаем 200, чтобы Portmone не повторял запрос
    })
  }
})
```

### 3.3 Настройка переменных окружения

В Supabase Dashboard (**Settings** → **Edge Functions**) добавьте:

```
PORTMONE_PAYEE_ID=123456
PORTMONE_LOGIN=your_login
PORTMONE_PASSWORD=your_password
```

### 3.4 Деплой функций

```bash
supabase functions deploy create-portmone-payment --no-verify-jwt
supabase functions deploy portmone-webhook --no-verify-jwt
```

## Шаг 4: Обновление Frontend

Обновите `components/PricingModal.tsx`:

```typescript
import { supabase } from '../services/supabaseClient';

const handleBuyPackage = async (pkg: any) => {
    if (isGuest) {
        alert('Please log in to purchase credits');
        return;
    }

    try {
        // Вызываем Edge Function для создания платежа
        const { data, error } = await supabase.functions.invoke('create-portmone-payment', {
            body: {
                amount: pkg.price,
                description: `${pkg.label || pkg.title} - AI Photo Studio`,
                userId: currentUser!.dbUserId,
                packageId: pkg.id
            }
        });

        if (error) throw error;

        // Portmone возвращает HTML форму
        // Создаем временный div и вставляем форму
        const div = document.createElement('div');
        div.innerHTML = data.payment_form;
        document.body.appendChild(div);
        
        // Автоматически отправляем форму
        const form = div.querySelector('form');
        if (form) {
            form.submit();
        }

    } catch (error: any) {
        console.error('Payment error:', error);
        alert(error.message || 'Failed to create payment. Please try again.');
    }
};
```

## Шаг 5: Настройка Callback URL в Portmone

1. Войдите в личный кабинет Portmone
2. Перейдите в **Налаштування** → **Callback URL**
3. Укажите URL вашего webhook:
   ```
   https://<your-project-ref>.functions.supabase.co/portmone-webhook
   ```
4. Сохраните настройки

## Шаг 6: Тестирование

### Тестовый режим

Portmone предоставляет тестовую среду:

1. Используйте тестовые credentials (запросите у менеджера)
2. Тестовая карта:
   - **Номер:** `4242 4242 4242 4242`
   - **CVV:** `123`
   - **Срок:** любая будущая дата

### Production режим

После успешного тестирования:
1. Замените тестовые credentials на production
2. Обновите переменные окружения в Supabase
3. Переделайте функции

## Комиссии Portmone

- **Для физ. лиц:** ~3.5-4% + 2 грн за транзакцию
- **Для ФОП/ООО:** ~2.5-3% (зависит от оборота)
- **Вывод средств:** бесплатно на карту ПриватБанка, 1% на другие банки

## Лимиты

### Для физических лиц:
- Максимум 150,000 грн/месяц
- Максимум 50 транзакций/день

### Для ФОП/ООО:
- Без лимитов

## Поддержка

- **Сайт:** https://www.portmone.com.ua/
- **Телефон:** 0 800 33 11 00 (бесплатно по Украине)
- **Email:** support@portmone.com.ua
- **Telegram:** @portmone_support

## Готово! 🎉

Теперь ваше приложение готово принимать платежи через Portmone.

## Важные замечания

⚠️ **Для физических лиц:**
- Portmone может запросить подтверждение легальности деятельности
- При превышении лимитов нужно будет открыть ФОП
- Рекомендуется вести учет всех транзакций

✅ **Рекомендации:**
- Начните с физ. лица для тестирования
- При росте оборота откройте ФОП
- Используйте Portmone как основной метод + добавьте альтернативы
