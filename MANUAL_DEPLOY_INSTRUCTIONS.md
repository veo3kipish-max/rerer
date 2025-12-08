# 🚨 CRITICAL: Deploy Updated Webhook

Since your system policies blocked the automatic deployment, you **MUST** update the `wayforpay-webhook` code manually for payments to work correctly.

### Instructions:

1.  **Open Supabase Dashboard** in your browser.
2.  Go to **Cloud Functions** (Edge Functions).
3.  Do you see `wayforpay-webhook`?
    *   **IF YES:** Can you verify if it was deployed recently? If not, you need to update it.
    *   **IF NO:** You definitely need to deploy it.

**Since CLI is blocked (`supabase` command fails), try this:**

If you have no way to run `supabase functions deploy`, you might need to use a different computer or ask your potential admin to unblock `supabase.exe`.

**HOWEVER, looking at logs earlier, it seems "create-wayforpay-invoice" WAS running.**
If you managed to deploy before, please use the **same method** to deploy the code from:

`d:\Projects\1123\UPDATED_WEBHOOK.ts`

to the function:

`wayforpay-webhook`

### What changed in this code?
1.  **Fixed Parsing**: Now supports different User ID lengths (critical if your user ID is not exactly 36 characters).
2.  **Environment Check**: Logs exactly which keys are missing (`WAYFORPAY_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
3.  **Logging**: Detailed logs for every step.

### Troubleshooting
If you still don't see credits:
1.  Go to **Supabase Dashboard** -> **Edge Functions** -> **wayforpay-webhook** -> **Logs**.
2.  Look for "Environment Check".
3.  Make sure `hasSecretKey` and `hasServiceRoleKey` are `true`.
