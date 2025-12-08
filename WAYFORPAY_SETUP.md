# 💳 WayForPay Setup Guide

Integration for WayForPay payments is now set up in the codebase.

## 1. Credentials
The following credentials have been configured (saved in `SUPABASE_SECRETS.txt`):
- **Merchant Account**: `kipish_fun1`
- **Domain**: `kipish.fun`
- **Secret Key**: *(Configured)*

## 2. Supabase Configuration (CRITICAL STEP)
You must manually add the secrets to your Supabase project as the CLI was blocked on your machine.

1. Go to [Supabase Dashboard](https://supabase.com/dashboard).
2. Open your project -> **Settings** -> **Edge Functions**.
3. Add the following **Secrets** (Environment Variables):
   - `WAYFORPAY_MERCHANT_ACCOUNT`: `kipish_fun1`
   - `WAYFORPAY_DOMAIN`: `kipish.fun`
   - `WAYFORPAY_SECRET_KEY`: `dafb...` (Copy from `SUPABASE_SECRETS.txt`)

## 3. Webhook Settings (CRITICAL STEP)
The `wayforpay-webhook` function handles payment confirmations from WayForPay. Since WayForPay does not use Supabase Auth, you must **disable JWT verification**.

1. Go to **Edge Functions** in Supabase Dashboard.
2. Click on `wayforpay-webhook`.
3. Go to **Settings** (or similar menu).
4. **Disable "Enforce JWT Verification"**.
5. Save.

## 4. How it works
- **Frontend**: `PricingModal.tsx` detects if the user is NOT in Telegram. If so, it uses WayForPay.
- **Backend**:
  - `create-wayforpay-invoice`: Generates the secure signature and form parameters.
  - `wayforpay-webhook`: Receives the confirm callback from WayForPay, validates the signature, records the transaction in `payments` table, and updates user `credits`.

## 5. Testing
1. Open the app in a browser (not Telegram).
2. Click "Buy Credits".
3. Select a package.
4. You should be redirected to the secure WayForPay checkout page.
5. After payment, you will be redirected back to `https://kipish.fun`.
6. Credits should be added automatically (check `payments` table for logs).
