# Subscription Fix - Исправление проблемы с подписками

## Проблема

После покупки подписки кредиты начислялись, но статус `subscription_tier` не изменялся с `free` на выбранный тариф (например, `light`).

## Причина

В таблице `payments` был неправильный constraint `check_payment_type`, который не позволял записывать `credits` для платежей типа `subscription`:

```sql
-- СТАРЫЙ (неправильный) constraint:
CHECK (
  (type = 'subscription' AND tier IS NOT NULL AND credits IS NULL) -- ❌ credits должен быть NULL
  OR 
  (type = 'credits' AND credits IS NOT NULL AND tier IS NULL)
)
```

Это приводило к тому, что подписки не могли быть сохранены в базу данных, и webhook'и падали с ошибкой.

## Решение

**1. Исправлен constraint в базе данных:**

```sql
ALTER TABLE payments DROP CONSTRAINT IF EXISTS check_payment_type;

ALTER TABLE payments ADD CONSTRAINT check_payment_type CHECK (
  (type = 'subscription' AND tier IS NOT NULL) -- ✅ credits может быть любым
  OR 
  (type = 'credits' AND tier IS NULL AND credits IS NOT NULL)
);
```

**2. Обновлена локальная схема** (`supabase/schema.sql`) для будущих деплоев.

## Как работает сейчас

### Покупка кредитов (One-time Photos)
- Тип платежа: `credits`
- Добавляет кредиты пользователю
- **НЕ меняет** `subscription_tier`
- Пример: купили `pack_5` → +5 кредитов, tier остается `free`

### Покупка подписки (Subscription)
- Тип платежа: `subscription`
- Добавляет кредиты пользователю
- **МЕНЯЕТ** `subscription_tier` на выбранный (light/pro/ultra)
- Устанавливает `subscription_expires_at` на +30 дней
- Пример: купили `sub_light` → +30 кредитов, tier = `light`, expires через 30 дней

## Webhook Logic

### Telegram Webhook
```typescript
// Обновление пользователя
const updateData: any = {
    credits: (user.credits || 0) + payload.credits
};

if (payload.tier) {
    updateData.subscription_tier = payload.tier;
}

await supabase.from('users').update(updateData).eq('id', payload.userId)
```

### WayForPay Webhook
```typescript
// Обновление пользователя
const updateData: any = { credits: newCredits };

if (packageId.startsWith('sub_')) {
    const newTier = packageId.replace('sub_', ''); // sub_light -> light
    updateData.subscription_tier = newTier;
}

await supabase.from('users').update(updateData).eq('id', userId)
```

## Тестирование

Чтобы купить подписку:

1. Откройте модальное окно покупки (иконка профиля → "Купить подписку")
2. Переключитесь на вкладку **"Subscription (Best Value)"**
3. Выберите нужный тариф (Light, Pro, Ultra)
4. Оплатите

После успешной оплаты:
- ✅ Кредиты будут начислены
- ✅ `subscription_tier` изменится на выбранный
- ✅ `subscription_expires_at` установится на +30 дней

## Миграция

Миграция уже применена к продакшн базе данных:
- **Migration**: `fix_payment_constraint`
- **Дата**: 2025-12-08
- **Статус**: ✅ Успешно применена

## Проверка

Проверить текущую подписку пользователя:
```sql
SELECT id, name, credits, subscription_tier, subscription_expires_at 
FROM users 
WHERE id = 'your-user-id';
```

Проверить платежи подписок:
```sql
SELECT * FROM payments 
WHERE type = 'subscription' 
ORDER BY created_at DESC;
```
