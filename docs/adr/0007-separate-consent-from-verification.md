# Separate marketing consent from address verification

**Status**: accepted

**Partially superseded by**: ADR 0035 (re-confirmation restores consent) replaces the first-confirmation gate on `subscription.confirmed` with the consent transition; the rest of this decision stands.

`createContactByEmail` marks every captured contact as both a subscriber and a verified address, so neither flag means what its name says: a newsletter confirmation cannot be distinguished from a contact-form submission, and a nurturing automation fired on addresses that were never confirmed. We keep the two concepts distinct. `emailVerified` records only that the address owner followed a link we sent — it is set at confirmation and never at capture — while consent (`isSubscriber`) is a separate axis that can be revoked on unsubscribe. Subscription is treated as an event, `subscription.confirmed`, emitted by the mails module, rather than derived from a stored flag; the engine stays domain-agnostic (ADR-0005) and the mails module owns the payload, the consent-transition gate and the idempotency key.

## Considered options

- **Keep `emailVerified` set at capture and filter on it in automations**: rejected. The flag would still prove nothing, and a nurture flow would either fire on unconfirmed addresses or trust a marker that is always set.
- **Defer Contact creation to confirmation** (no Contact row until the link is clicked): rejected for now. A Contact is a captured address; confirmation only upgrades it. Keeping capture-time creation leaves the existing flows and their stats stable.

## Consequences

- `emailVerified` becomes meaningful and the admin "Verified on…" column is accurate going forward; legacy rows keep their old value.
- An already-subscribed contact who re-confirms does not restart a flow: `subscription.confirmed` fires on the transition from not-subscribed to subscribed (first confirmation or reactivation), not on every verification (ADR-0035). A returning ex-subscriber is now a win-back expressible as a flow.
- The consent policy (`isSubscriber`, `true` by default and never set at creation) remains incoherent here; it is resolved by ADR-0035, which makes confirmation restore consent.
