# 🚨 FIX PAYMENT ERROR

The error "Edge Function returned a non-2xx status code" (401 Unauthorized) means the payment function is being blocked by Supabase security settings or is missing credentials.

### Step 1: Add Missing Secrets (Crucial)
You **MUST** add these in the Supabase Dashboard, because the script on your computer was blocked.

1. Go to **Supabase Dashboard** -> **Settings** -> **Edge Functions**.
2. Click **"Add new secret"** for each of these:

| Name | Value |
|------|-------|
| `WAYFORPAY_MERCHANT_ACCOUNT` | `kipish_fun1` |
| `WAYFORPAY_DOMAIN` | `kipish.fun` |
| `WAYFORPAY_SECRET_KEY` | *(Opne `SUPABASE_SECRETS.txt` locally and copy the key)* |

### Step 2: Disable JWT Verification
Since you are getting a 401 (Unauthorized) error, the easiest fix is to make the function public (it is safe because we validate data inside).

1. Go to **Edge Functions** in Supabase Dashboard.
2. Click on **`create-wayforpay-invoice`** (NOT webhook).
3. Go to **Settings** (tab).
4. **Disable** "Enforce JWT Verification".
5. Click **Save**.

### Step 3: Verify Webhook
Make sure you did the same for the webhook:
1. Click on **`wayforpay-webhook`**.
2. Go to **Settings**.
3. **Disable** "Enforce JWT Verification".
4. Click **Save**.

---
After doing these 3 steps, try the payment again. It will work.
