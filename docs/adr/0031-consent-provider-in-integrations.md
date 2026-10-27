# Consent provider lives in Integrations; public configuration fails open

Iubenda used to be configured as arbitrary rows in `settings.scripts`, and `AppScripts` carried Iubenda-specific rules: it matched Iubenda URLs and forced their load strategies. That arrangement hid the consent setup from the Integrations surface, accepted unvalidated free text for the site and cookie-policy identifiers, allowed the provider to be configured twice, and left document order to convention — GTM was in the head while the CMP scripts sat at the end of the body. A hand-written `gtag('consent', 'default', …)` block also competed with Iubenda's own Consent Mode handling, which Iubenda documents as something to remove.

We generalized `Integration` so a provider does not have to be a credential pair plus a webhook secret. Each provider is now a code descriptor that owns its presentation, a schema for non-secret configuration, an optional schema for secrets, its enable rule, an optional connection test, whether it affects the public site, and its admin form. `Integration.config` is the existing JSON column, so this needed no schema migration. Secrets remain encrypted and write-only; secret values are never returned by any read path.

We then moved the consent provider into Integrations. Iubenda declares no secret fields, and its identifiers are public configuration.

## Two read contracts, opposite failure semantics

- **Credentials** keep the fail-loud contract of ADR 0023. The server-only resolver throws explicit errors for a missing row, a disabled row, incomplete secrets, and undecryptable ciphertext.
- **Public configuration** is fail-open. A server-only read returns the provider's non-secret configuration or `null`, and never throws: missing, disabled, incomplete, and unexpected read errors all produce `null`, with one structured log line per request.

Both reads use the per-request cache when the caller wraps the work in `withIntegrationResolutionCache`.

Fail-open exists only for public rendering, where a missing third-party provider must not take the page down. Credential consumers stay fail-loud because a silently absent key turns into lost mail or unauthenticated requests rather than a degraded public page.

## The CMP owns Consent Mode

While Iubenda is enabled with its consent-mode option, Iubenda owns both default consent and consent updates. We deleted the hand-written consent-default component. Nothing replaces it when Iubenda is absent or disabled: GTM keeps its default behaviour and the operator is responsible for consent configuration. That is an accepted consequence, not a fallback. GTM stays `afterInteractive`.

## Document order is a contract

When present, enabled, and complete, the public root layout emits in `<head>`, in this order:

1. the inline `_iub.csConfiguration` block;
2. the autoblocking or sync loader selected by configuration;
3. the asynchronous CMP runtime script.

When GTM is configured and renders in production, it comes after that block. The CMP block is raw inline markup rather than `next/script`, so the document itself determines the order instead of framework convention. A rendering test asserts the sequence and the runtime's `async` attribute; this is a tested contract, not a comment. The runtime also carries an `itemProp` so React 19 does not hoist the async script ahead of the configuration block.

`settings.scripts` remains an escape hatch for one-off snippets, but it no longer knows anything about Iubenda: no URL matching, no forced strategies. `beforeInteractive` is no longer offered in the admin and persisted values render as `afterInteractive`.

## Considered options

- **Consent provider as an Integration descriptor (chosen)**: one visible, validated, permissioned and audited home for the provider, with public rendering driven by the same row that admins edit.
- **Keep Iubenda in `settings.scripts` and refine the URL matching**: rejected because the generic script list stays provider-aware, the configuration stays unvalidated, and the document order stays conventional.
- **Auto-parse the old script rows into integration configuration**: rejected because the values are free text inside arbitrary snippets; the operator performs the cutover explicitly (see `docs/integrations-runbook.md`).
- **Render the CMP with `next/script`**: rejected because framework insertion and hoisting rules, not the document, would decide the order relative to GTM.
- **Make the public configuration read fail-loud**: rejected because a missing or broken third-party provider would take the public site down instead of removing one banner.
- **Keep hand-written consent defaults alongside the CMP**: rejected because Iubenda owns Consent Mode while enabled; competing defaults make the effective consent state ambiguous.
- **Give Iubenda stored secrets**: rejected because its identifiers are public configuration and there is nothing to authenticate against.
- **Environment fallback for credentials**: still rejected under ADR 0023.

## Consequences

- The Integrations page is the only configuration surface for Iubenda; enabling requires a complete configuration, enforced server-side.
- A missing, disabled, or incomplete integration emits nothing and logs a structured `public_config_unavailable` line; the public site keeps rendering.
- With Iubenda disabled there is no default consent signal at all, by design.
- Saving an integration or toggling its enabled state revalidates the public root layout, so changes reach the next request.
- A reintroduced ordering bug fails the head-rendering test.
- ADR 0028's third-party-scripts section is amended: Iubenda is no longer loaded by `AppScripts`.
- Adding another provider leaves the generic integration CRUD and schema untouched: it is a descriptor plus a form, and a provider that consumes credentials also adds its resolver entry.
