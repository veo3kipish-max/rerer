import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { amount, productName, productCount, productPrice, userId, packageId } = await req.json()

        const merchantAccount = Deno.env.get('WAYFORPAY_MERCHANT_ACCOUNT')
        const merchantSecretKey = Deno.env.get('WAYFORPAY_SECRET_KEY')
        const merchantDomainName = Deno.env.get('WAYFORPAY_DOMAIN')
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') // Usually not needed for signature, but maybe for webhook construction

        if (!merchantAccount || !merchantSecretKey || !merchantDomainName) {
            throw new Error('WayForPay credentials missing')
        }

        const orderReference = `${userId}_${packageId}_${Date.now()}`
        const orderDate = Math.floor(Date.now() / 1000)
        const currency = "UAH"

        // Normalize inputs
        const productNames = Array.isArray(productName) ? productName : [productName]
        const productCounts = Array.isArray(productCount) ? productCount : [productCount]
        const productPrices = Array.isArray(productPrice) ? productPrice : [productPrice]

        // Signature construction
        // merchantAccount;merchantDomainName;orderReference;orderDate;amount;currency;productName;productCount;productPrice
        const signatureString = [
            merchantAccount,
            merchantDomainName,
            orderReference,
            orderDate,
            amount,
            currency,
            productNames.join(';'),
            productCounts.join(';'),
            productPrices.join(';')
        ].join(';')

        const merchantSignature = createHmac('md5', merchantSecretKey)
            .update(signatureString)
            .digest('hex')

        return new Response(JSON.stringify({
            url: "https://secure.wayforpay.com/pay",
            params: {
                merchantAccount,
                merchantDomainName,
                orderReference,
                orderDate,
                amount,
                currency,
                productName: productNames,
                productCount: productCounts,
                productPrice: productPrices,
                merchantSignature,
                returnUrl: `https://${merchantDomainName}/`, // Redirect back to site
                serviceUrl: `${supabaseUrl}/functions/v1/wayforpay-webhook` // Webhook for confirmation
            }
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
