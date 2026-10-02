# Keep the provider-native unsubscribe on single-send broadcasts; the app owns consent for sequences

**Status**: accepted

Sequence emails (the Automations Send Email node) carry `List-Unsubscribe` /
`List-Unsubscribe-Post` pointing at the app's own endpoint
(`/api/newsletter/unsubscribe`), because the app is the single source of truth
for consent and the transactional channel lets us inject headers. Single-send
broadcasts instead run through **Resend Broadcasts**, which add their **own**
`List-Unsubscribe` header automatically; the Resend Node SDK exposes **no**
custom headers or disable switch on `broadcasts.create`/`update`, and the app
has **no inbound Resend webhook**, so a provider-native unsubscribe on a
broadcast is not reflected in `EmailContact.isSubscriber`. Worse, the next
app→provider contact sync pushes `unsubscribed: !isSubscriber`, which can
silently re-subscribe the address on Resend. We accept this divergence for
broadcasts as a known, deliberate exception: the app-authored link in the
broadcast body (`.../rimuovi-sottoscrizione/?id={{{contact.external_id}}}`)
remains the primary, app-owned opt-out path.

## Considered options

- **Add a Resend webhook now** (`email.unsubscribed` → `isSubscriber = false`):
  the only way to make broadcasts truly converge with the app's consent model.
  Deferred as out of scope; this is the documented remedy.
- **Disable the provider-native unsubscribe and rely on the app link**:
  rejected. The SDK exposes no such option; the header is added by the provider.
- **Send broadcasts as per-recipient transactional email** so we control the
  headers: rejected. It would forfeit Resend Broadcasts (segments, scheduling,
  analytics) for no immediate gain.

## Consequences

- Broadcasts may expose a provider-native unsubscribe that the app does not
  observe. This is a known compliance gap, not a bug; the app link in the body
  is the authoritative opt-out and the public page accepts the Contact id via
  `{{{contact.external_id}}}` (synced as the `external_id` contact property).
- The app→provider sync can fight a provider-native unsubscribe. Until the
  webhook exists, this is a live hazard when reasoning about consent.
- The "never use the provider's native unsubscribe" rule from the
  subscriber-unsubscribe spec holds for sequences, not for broadcasts.
