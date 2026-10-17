# Global email provider with multiple conversation accounts

We keep a single global email provider/API key (configured in `EmailSetting`) and model many `EmailAccount` records on top of it. Each account is just an address, display name, signature, and receiving domain; the provider connection is shared.

We chose this because the limiting resource is the provider’s API key and quota (e.g. Resend’s 100 transactional emails/day on the free plan), not the individual address. Splitting provider configuration per account would add complexity without freeing any real constraint. If a future plan needs separate API keys, we can promote the API key to `EmailAccount` later.

**Consequences**
- `EmailAccount` does not own its provider or API key.
- `maxEmailsPerDay` is enforced globally across all accounts.
- Inbound routing is based on the `to` address matching an active `EmailAccount`.
