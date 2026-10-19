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

## Backup and the encryption key

`Integration.secretEncrypted` is encrypted with `SECRETS_ENCRYPTION_KEY`. A database backup without that variable cannot recover the stored secrets; they must be re-entered from the provider dashboard. `SECRETS_ENCRYPTION_KEY` is bootstrap-only and must be preserved alongside backups.
