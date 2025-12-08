import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
    try {
        const update = await req.json()

        console.log('Telegram webhook:', JSON.stringify(update))

        // Обработка Pre-checkout query (обязательно для подтверждения готовности принять оплату)
        if (update.pre_checkout_query) {
            const queryId = update.pre_checkout_query.id;
            const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');

            await fetch(`https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pre_checkout_query_id: queryId,
                    ok: true
                })
            });

            return new Response('ok', { status: 200 });
        }

        // Обработка успешного платежа
        if (update.message?.successful_payment) {
            const payment = update.message.successful_payment
            const userId = update.message.from.id

            // Парсим payload
            let payload;
            try {
                payload = JSON.parse(payment.invoice_payload);
            } catch (e) {
                console.error('Failed to parse payload', e);
                return new Response('ok', { status: 200 });
            }

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
            const { error: paymentError } = await supabase.from('payments').insert({
                user_id: payload.userId,
                type: 'credits',
                amount: payment.total_amount / 100,
                currency: payment.currency,
                telegram_payment_id: payment.telegram_payment_charge_id,
                status: 'completed',
                completed_at: new Date().toISOString()
            })

            if (paymentError) console.error('Error saving payment', paymentError);

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
