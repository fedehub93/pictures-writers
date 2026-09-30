# Separate marketing consent from address verification

**Status**: accepted

`createContactByEmail` marks every captured contact as both a subscriber and a verified address, so neither flag means what its name says: a newsletter confirmation cannot be distinguished from a contact-form submission, and a nurturing automation fired on addresses that were never confirmed. We keep the two concepts distinct. `emailVerified` records only that the address owner followed a link we sent — it is set at confirmation and never at capture — while consent (`isSubscriber`) is a separate axis that can be revoked on unsubscribe. Subscription is treated as an event, `subscription.confirmed`, emitted by the mails module, rather than derived from a stored flag; the engine stays domain-agnostic (ADR-0005) and the mails module owns the payload, the first-confirmation gate and the idempotency key.

## Considered options

- **Keep `emailVerified` set at capture and filter on it in automations**: rejected. The flag would still prove nothing, and a nurture flow would either fire on unconfirmed addresses or trust a marker that is always set.
- **Defer Contact creation to confirmation** (no Contact row until the link is clicked): rejected for now. A Contact is a captured address; confirmation only upgrades it. Keeping capture-time creation leaves the existing flows and their stats stable.

## Consequences

- `emailVerified` becomes meaningful and the admin "Verified on…" column is accurate going forward; legacy rows keep their old value.
- Re-confirmation does not restart a flow: `subscription.confirmed` fires only on a contact's first confirmation. A returning ex-subscriber is a win-back, handled separately.
- The consent policy (`isSubscriber`, currently `true` by default and never set at creation) remains incoherent and is tracked as a separate decision.
