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
        const { title, description, amount, credits, userId, packageId, tier } = await req.json()

        const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
        const providerTokenTest = Deno.env.get('TELEGRAM_PROVIDER_TOKEN_TEST')
        const providerTokenLive = Deno.env.get('TELEGRAM_PROVIDER_TOKEN_LIVE')

        // Временно используем TEST токен для отладки, если LIVE не сработает
        const providerToken = providerTokenTest || providerTokenLive

        console.log('Environment check:', {
            hasBotToken: !!botToken,
            hasTestToken: !!providerTokenTest,
            hasLiveToken: !!providerTokenLive,
            usingToken: providerToken ? 'FOUND' : 'MISSING',
            amount: amount,
            title: title
        })

        if (!botToken || !providerToken) {
            throw new Error(`Credentials missing. Bot: ${!!botToken}, Provider: ${!!providerToken}`)
        }

        // Telegram требует минимальную сумму. Для UAH это обычно около 1 грн, но лучше проверить.
        // amount приходит в гривнах, переводим в копейки
        const priceAmount = Math.round(amount * 100)

        const payload = JSON.stringify({
            userId,
            packageId,
            type: tier ? 'subscription' : 'credits', // Set type based on tier
            credits,
            tier // Add tier to payload
        })

        const body = {
            title: title || 'Credits Package',
            description: description || 'Credits for AI Photo Studio',
            payload: payload,
            provider_token: providerToken,
            currency: 'UAH',
            prices: [{ label: title || 'Credits', amount: priceAmount }],
            max_tip_amount: 0,
            suggested_tip_amounts: []
        }

        console.log('Sending request to Telegram:', JSON.stringify(body, null, 2))

        const response = await fetch(
            `https://api.telegram.org/bot${botToken}/createInvoiceLink`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            }
        )

        const data = await response.json()
        console.log('Telegram API response:', data)

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
        console.error('Error in edge function:', error)
        return new Response(JSON.stringify({
            error: error.message,
            details: error.toString()
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
