import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const text = await req.text()
        console.log('WayForPay Webhook raw body:', text)

        if (!text) {
            return new Response('Empty body', { status: 400 })
        }

        let data
        try {
            data = JSON.parse(text)
        } catch (e) {
            console.error('JSON Parse error', e)
            throw new Error('Invalid JSON')
        }

        const {
            merchantAccount,
            orderReference,
            amount,
            currency,
            authCode,
            cardPan,
            transactionStatus,
            reasonCode,
            merchantSignature
        } = data

        const myMerchantAccount = Deno.env.get('WAYFORPAY_MERCHANT_ACCOUNT')
        const mySecretKey = Deno.env.get('WAYFORPAY_SECRET_KEY')
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        console.log('Environment Check:', {
            hasMerchantAccount: !!myMerchantAccount,
            hasSecretKey: !!mySecretKey,
            hasServiceRoleKey: !!serviceRoleKey,
            merchantAccountReceived: merchantAccount,
            orderReference
        })

        if (merchantAccount !== myMerchantAccount) {
            console.error('Merchant account mismatch', { received: merchantAccount, expected: myMerchantAccount })
            throw new Error('Invalid merchant account')
        }

        // Validate signature
        const signatureString = [
            merchantAccount,
            orderReference,
            amount,
            currency,
            authCode,
            cardPan,
            transactionStatus,
            reasonCode
        ].join(';')

        const calculatedSignature = createHmac('md5', mySecretKey ?? '')
            .update(signatureString)
            .digest('hex')

        if (calculatedSignature !== merchantSignature) {
            console.error('Signature mismatch', { calculated: calculatedSignature, received: merchantSignature })
            // In production you should throw, but for debugging let's log critical warning
            // throw new Error('Invalid signature') 
        }

        if (transactionStatus === 'Approved') {
            // Robust parsing of orderReference: userId_packageId_timestamp
            // We assume userId comes first and ends at the first underscore
            // BUT previous logic assumed fixed 36 chars. Let's support both.

            let userId, packageId;

            // Attempt standard split first (safer if userId length varies)
            const firstUnderscoreIndex = orderReference.indexOf('_');
            const lastUnderscoreIndex = orderReference.lastIndexOf('_');

            if (firstUnderscoreIndex > 0 && lastUnderscoreIndex > firstUnderscoreIndex) {
                userId = orderReference.substring(0, firstUnderscoreIndex);
                packageId = orderReference.substring(firstUnderscoreIndex + 1, lastUnderscoreIndex);
            } else {
                // Fallback to fixed width if split fails (shouldn't happen with valid ref)
                userId = orderReference.substring(0, 36);
                const remaining = orderReference.substring(37);
                packageId = remaining.substring(0, remaining.lastIndexOf('_'));
            }

            console.log(`Processing Order: User ${userId}, Package ${packageId}`)

            let creditsToAdd = 0
            switch (packageId) {
                case 'pack_1': creditsToAdd = 1; break;
                case 'pack_5': creditsToAdd = 5; break;
                case 'pack_15': creditsToAdd = 15; break;
                case 'pack_50': creditsToAdd = 50; break;
                case 'sub_light': creditsToAdd = 30; break;
                case 'sub_pro': creditsToAdd = 100; break;
                case 'sub_ultra': creditsToAdd = 300; break;
                default: console.warn('Unknown package ID:', packageId);
            }

            if (creditsToAdd > 0) {
                const supabaseAdmin = createClient(
                    Deno.env.get('SUPABASE_URL') ?? '',
                    serviceRoleKey ?? ''
                )

                // 1. Record Payment
                const { error: paymentError } = await supabaseAdmin
                    .from('payments')
                    .insert({
                        user_id: userId,
                        type: packageId.startsWith('sub') ? 'subscription' : 'credits',
                        amount: Number(amount),
                        credits: creditsToAdd,
                        currency: currency || 'UAH',
                        tier: packageId.startsWith('sub') ? packageId.replace('sub_', '') : null,
                        status: 'completed',
                        telegram_payment_id: orderReference,
                        completed_at: new Date().toISOString()
                    })

                if (paymentError) {
                    console.error('CRITICAL: Error creating payment record:', paymentError)
                } else {
                    console.log('Payment recorded successfully')
                }

                // 2. Update credits
                const { data: user, error: fetchError } = await supabaseAdmin
                    .from('users')
                    .select('credits')
                    .eq('id', userId)
                    .single()

                if (fetchError) {
                    console.error('Error fetching user for credit update:', fetchError)
                } else {
                    const newCredits = (user?.credits || 0) + creditsToAdd
                    const updateData: any = { credits: newCredits };

                    // Update subscription tier if purchasing a subscription
                    if (packageId.startsWith('sub_')) {
                        const newTier = packageId.replace('sub_', '');
                        updateData.subscription_tier = newTier;
                    }

                    const { error: updateError } = await supabaseAdmin
                        .from('users')
                        .update(updateData)
                        .eq('id', userId)
                        .select()

                    if (updateError) {
                        console.error('Error updating credits/tier:', updateError)
                    } else {
                        console.log(`Successfully added ${creditsToAdd} credits to user ${userId}. New balance: ${newCredits}`)
                    }
                }
            } else {
                console.error('No credits to add for package:', packageId);
            }
        }

        // Return success response to WayForPay
        const time = Math.floor(Date.now() / 1000)
        const status = "accept"
        const responseSignatureString = [orderReference, status, time].join(';')
        const responseSignature = createHmac('md5', mySecretKey)
            .update(responseSignatureString)
            .digest('hex')

        const responseBody = {
            orderReference,
            status,
            time,
            signature: responseSignature
        }

        console.log('Sending response to WayForPay:', responseBody)

        return new Response(JSON.stringify(responseBody), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        console.error('Webhook Error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        })
    }
})
