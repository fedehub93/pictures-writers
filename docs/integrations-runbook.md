# Integrations runbook

## Migrating an install that only used environment variables

Resend credentials used to be readable from `NEXT_RESEND_KEY` / `NEXT_RESEND_WEBHOOK_SECRET`. They no longer are: the `Integration` row is the only source (see ADR 0023).

1. Sign in to the backoffice and open **Integrations** (`/admin/integrations`).
2. On the **Resend** card, open **Edit credentials** and paste the API key (the value that used to live in `NEXT_RESEND_KEY`).
3. If inbound email is used, paste the webhook signing secret (the value that used to live in `NEXT_RESEND_WEBHOOK_SECRET`) in the same form.
4. Enable the integration and run **Test connection**; confirm the status turns to success.
5. Remove `NEXT_RESEND_KEY` and `NEXT_RESEND_WEBHOOK_SECRET` from the deployment environment.
6. Send a test email and, if applicable, forward one inbound message to confirm the webhook works.

Until the credentials are saved and the integration is enabled the provider reports "not configured" and outbound email fails loudly — there is no silent fallback. Running the connection test (step 4) only records the result; it is never required for resolution.

## Cutting Iubenda over from custom scripts

Iubenda used to be configured as rows in **Settings → Scripts**. It is now an Integration provider rendered from the public root layout ahead of GTM (ADR 0031). There is no automatic migration, so the cutover is manual and ordered:

1. **Remove the old entries first.** In the production database, delete every Iubenda row from **Settings → Scripts** (the `_iub.csConfiguration` block, the autoblocking or sync loader, and `iubenda_cs.js`). Leaving them in place would load the provider twice once the integration is enabled. This briefly leaves the current production site without the CMP, so do it immediately before deploying.
2. **Deploy with the Iubenda integration disabled.** This is the rollback point: from here, disabling the integration removes the CMP without a redeploy.
3. **Configure Iubenda** in **Integrations** with the site id, cookie-policy id, language, autoblocking mode, and whether it owns Google Consent Mode. The integration requires no secrets; the card reports **Configured** or **Not configured**.
4. **Enable in preview** and verify the banner appears, the choice persists across navigation, and no analytics or advertising tag fires before a choice.
5. **Enable in production** and repeat the same smoke check.

If the banner misbehaves after enabling, disable the integration — the public site keeps rendering without it.

## Backup and the encryption key

`Integration.secretEncrypted` is encrypted with `SECRETS_ENCRYPTION_KEY`. A database backup without that variable cannot recover the stored secrets; they must be re-entered from the provider dashboard. `SECRETS_ENCRYPTION_KEY` is bootstrap-only and must be preserved alongside backups.
