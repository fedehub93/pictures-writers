# Re-confirmation restores consent

**Status**: accepted

A cancelled Subscriber who subscribes again stays suppressed forever: `new-subscription` records the confirmation but never clears `isSubscriber`, and ADR-0007's first-confirmation gate means `subscription.confirmed` does not fire a second time. Now that the address *is* the Contact identity (ADR-0034) that silence becomes visible and wrong-looking: a returning visitor is told the confirmation email was sent, follows the link, and receives nothing. We treat following a confirmation link as a fresh act of consent: confirmation sets `isSubscriber` to true, and `subscription.confirmed` fires whenever an address moves from not-subscribed to subscribed, not only on its first verification.

## Considered options

- **Keep consent revoked until an explicit opt-in in a preference centre**: rejected for now. There is no preference centre, and the link we just sent to that address is the strongest consent artefact available.
- **Restore consent silently without firing the trigger**: rejected. Win-back flows would never run, which is the opposite of what a returning subscriber wants.
- **Require a separate "resubscribe" step before the link is sent**: rejected. It adds a step to a rare path to avoid a consent decision we can defend.

## Consequences

- `emailVerified` keeps its meaning — proof of ownership of the address — and stops gating the trigger on its own. Capture still marks contacts as subscribers (ADR-0007's residual incoherence), so an unverified address is not yet a consented subscriber: the gate is the transition into "subscribed and verified", which covers both first confirmation and reactivation and leaves an already-subscribed contact's re-confirmation silent.
- A person who unsubscribes and never re-subscribes is untouched.
- ADR-0007's "first confirmation only" rule no longer holds for the trigger. Its note that a returning ex-subscriber is a win-back still stands, and is now expressible as a flow rather than a dead end.
- A cancelled contact is deleted provider-side on unsubscribe, so re-consent relies on the provider sync that already runs after confirmation to recreate it.
