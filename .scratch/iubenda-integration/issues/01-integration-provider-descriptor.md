# 01: Integration provider descriptor

**What to build:** The Integrations module describes each provider with a code descriptor instead of assuming every provider is an API key plus a webhook secret. An admin can read a provider's non-secret configuration, the enable rule is enforced by the provider, and a provider that has no credentials or connection test is representable. Resend keeps behaving exactly as it does today; adding a second provider becomes a descriptor plus a form, not a change to the generic CRUD.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] A provider descriptor owns its key and presentation, its non-secret configuration schema, an optional secrets schema, its enable rule, an optional connection test, whether it affects the public site, and its admin form.
- [x] Integration reads return the provider's non-secret configuration plus a provider-agnostic summary of which secrets are present; no provider-specific credential fields remain in the shared read projection.
- [x] Secret values are never returned by any read path.
- [x] Enabling a provider whose rule is not satisfied is rejected server-side, not only hidden in the UI.
- [x] The connection test is available only for providers that declare one.
- [x] Resend's admin behaviour is unchanged; its router tests were updated only for the spec-mandated removal of `hasApiKey` / `hasWebhookSecret` from the read projection and for the new server-side enable rule.
- [x] No database migration is required.

## Notes

Descriptors live in `src/modules/integrations/lib/providers`. The shared descriptor owns presentation, schemas, the enable rule and the admin form; `src/modules/integrations/server/descriptors.ts` extends it with the optional server-only connection test so network code never enters client bundles. The admin projection is now `{ provider, isEnabled, config, secrets, canEnable, hasConnectionTest, lastTestedAt, lastTestStatus }`; `secrets` is a provider-agnostic presence list built from the descriptor's secret fields.

The ticket's "existing tests pass without modification" clause conflicts with the spec's explicit removal of `hasApiKey` / `hasWebhookSecret`. The spec won: those tests assert the old provider-specific shape, so the router tests now assert the generic shape and the server-side enable rule instead.
