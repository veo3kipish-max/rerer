# ⚠️ Нужно обновить секреты в Supabase Dashboard!

Я обновил код функции, но **секреты в облаке нужно обновить вручную**, так как консоль у вас заблокирована.

Пожалуйста, выполните эти шаги прямо сейчас:

1.  Откройте **Supabase Dashboard**: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2.  Перейдите в настройки проекта -> **Settings** (шестеренка внизу слева для глобальных настроек или Edge Functions -> Secrets).
3.  Раздел **Configuration** -> **Edge Function Secrets** (или просто Secrets).
4.  Найдите ключ `TELEGRAM_PROVIDER_TOKEN`.
5.  Нажмите иконку **Edit** (карандаш) и вставьте НОВЫЙ токен:
    `5775769170:LIVE:TG_iVJWhl2ykp_HJsrIQBXtcpAA`
6.  Нажмите **Save**.

После этого подождите 30 секунд и попробуйте оплату снова. Ошибка 400 должна уйти.
